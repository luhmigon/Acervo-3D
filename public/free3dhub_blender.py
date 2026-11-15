"""Free3D Hub Blender add-on.

Search the Free3D Hub catalog from Blender and import Poly Haven glTF models.
Sketchfab models open in the browser because direct downloads require OAuth.
"""

bl_info = {
    "name": "Free3D Hub",
    "author": "Free3D Hub",
    "version": (1, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar (N) > Free3D",
    "description": "Search Free3D Hub and import models into Blender",
    "category": "Import-Export",
}

import hashlib
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

import bpy
from bpy.props import (
    BoolProperty,
    CollectionProperty,
    EnumProperty,
    FloatProperty,
    IntProperty,
    StringProperty,
)
from bpy.types import Operator, Panel, PropertyGroup, UIList


DEFAULT_API = "http://localhost:3000"
MAX_MODEL_BYTES = 100 * 1024 * 1024
MAX_THUMB_BYTES = 5 * 1024 * 1024

try:
    CACHE_DIR = Path(bpy.utils.user_resource(
        "DATAFILES", path="free3dhub_cache", create=True
    ))
except Exception:
    CACHE_DIR = Path.home() / ".free3dhub_cache"

THUMBS_DIR = CACHE_DIR / "thumbs"
MODELS_DIR = CACHE_DIR / "models"
THUMBS_DIR.mkdir(parents=True, exist_ok=True)
MODELS_DIR.mkdir(parents=True, exist_ok=True)

SOURCE_ICONS = {
    "sketchfab": "WORLD",
    "polyhaven": "MATSPHERE",
    "humanoids": "ARMATURE_DATA",
    "creatures": "GHOST_ENABLED",
    "scenekits": "HOME",
}


def api_base(value):
    value = value.strip().rstrip("/")
    parsed = urllib.parse.urlsplit(value)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise RuntimeError("Informe uma URL HTTP ou HTTPS válida para o Free3D Hub.")
    return value


def http_get_json(url, timeout=15):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Free3DHub-Blender/1.0",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read(10 * 1024 * 1024 + 1)
            if len(raw) > 10 * 1024 * 1024:
                raise RuntimeError("A resposta do servidor excedeu 10 MB.")
            return json.loads(raw.decode("utf-8"))
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"HTTP {error.code}: {error.reason}")
    except urllib.error.URLError as error:
        raise RuntimeError(f"Erro de rede: {error.reason}")
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Resposta JSON inválida: {error}")


def http_download(url, destination, timeout=120, max_bytes=MAX_MODEL_BYTES):
    destination = Path(destination)
    partial_path = destination.with_name(destination.name + ".part")
    request = urllib.request.Request(
        url, headers={"User-Agent": "Free3DHub-Blender/1.0"}
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            declared_size = int(response.headers.get("Content-Length") or 0)
            if declared_size > max_bytes:
                raise RuntimeError("O arquivo excede o limite de tamanho.")
            downloaded = 0
            with partial_path.open("wb") as output:
                while True:
                    chunk = response.read(65536)
                    if not chunk:
                        break
                    downloaded += len(chunk)
                    if downloaded > max_bytes:
                        raise RuntimeError("O arquivo excede o limite de tamanho.")
                    output.write(chunk)
        os.replace(str(partial_path), str(destination))
        return destination
    except Exception as error:
        try:
            partial_path.unlink(missing_ok=True)
        except OSError:
            pass
        raise RuntimeError(f"Download falhou: {error}")


def thumbnail_path(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    suffix = Path(urllib.parse.urlsplit(url).path).suffix.lower()
    if suffix not in (".png", ".jpg", ".jpeg", ".webp"):
        suffix = ".png"
    return THUMBS_DIR / f"{digest}{suffix}"


def ensure_thumbnail(url):
    if not url:
        return 0
    path = thumbnail_path(url)
    if not path.exists():
        try:
            http_download(url, path, timeout=10, max_bytes=MAX_THUMB_BYTES)
        except Exception:
            return 0
    try:
        image = bpy.data.images.load(str(path), check_existing=True)
        image.preview_ensure()
        return image.preview.icon_id if image.preview else 0
    except Exception:
        return 0


def normalize_sketchfab(model, source="sketchfab"):
    images = model.get("thumbnails", {}).get("images", [])
    thumbnail = max(images, key=lambda image: image.get("width", 0)) if images else {}
    return {
        "uid": model.get("uid", ""),
        "title": model.get("name", "Sem título"),
        "thumb": thumbnail.get("url", ""),
        "url": model.get("viewerUrl", ""),
        "viewerUrl": model.get("viewerUrl", ""),
        "author": model.get("user", {}).get("displayName", ""),
        "license": model.get("license", {}).get("label", "Ver licença"),
        "faceCount": model.get("faceCount", 0),
        "source": source,
    }


def search_sketchfab(base, query, source="sketchfab"):
    params = {
        "type": "models",
        "downloadable": "true",
        "count": "48",
        "sort_by": "-likeCount",
    }
    if query:
        params["q"] = query
    data = http_get_json(
        f"{base}/api/sketchfab?{urllib.parse.urlencode(params)}"
    )
    return [normalize_sketchfab(model, source) for model in data.get("results", [])]


def download_polyhaven_gltf(base, slug):
    params = urllib.parse.urlencode({"slug": slug, "resolution": "1k"})
    model = http_get_json(f"{base}/api/polyhaven-gltf?{params}")
    cache_key = hashlib.sha256(f"{slug}:1k".encode("utf-8")).hexdigest()[:16]
    bundle_dir = MODELS_DIR / cache_key
    assets_dir = bundle_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)

    downloaded_bytes = 0
    cached_assets = {}
    for collection in ("buffers", "images"):
        for resource in model.get(collection, []):
            uri = resource.get("uri", "")
            if not uri or uri.lower().startswith("data:"):
                continue
            parsed = urllib.parse.urlsplit(uri)
            if parsed.scheme != "https" or not parsed.netloc:
                raise RuntimeError("O glTF contém um recurso remoto inválido.")

            if uri not in cached_assets:
                suffix = Path(parsed.path).suffix.lower() or ".bin"
                name = hashlib.sha256(uri.encode("utf-8")).hexdigest()[:24] + suffix
                target = assets_dir / name
                if not target.exists():
                    remaining = MAX_MODEL_BYTES - downloaded_bytes
                    if remaining <= 0:
                        raise RuntimeError("Os recursos do modelo excedem 100 MB.")
                    proxy_url = (
                        f"{base}/api/scenekits/glb-proxy?"
                        f"{urllib.parse.urlencode({'url': uri})}"
                    )
                    http_download(proxy_url, target, max_bytes=remaining)
                downloaded_bytes += target.stat().st_size
                if downloaded_bytes > MAX_MODEL_BYTES:
                    raise RuntimeError("Os recursos do modelo excedem 100 MB.")
                cached_assets[uri] = f"assets/{name}"
            resource["uri"] = cached_assets[uri]

    bundle_dir.mkdir(parents=True, exist_ok=True)
    model_path = bundle_dir / "model.gltf"
    with model_path.open("w", encoding="utf-8") as output:
        json.dump(model, output, separators=(",", ":"))
    return model_path


class F3D_AssetItem(PropertyGroup):
    name: StringProperty()
    uid: StringProperty()
    thumb_url: StringProperty()
    model_url: StringProperty()
    viewer_url: StringProperty()
    author: StringProperty()
    license: StringProperty()
    source: StringProperty()
    face_count: IntProperty()
    slug: StringProperty()


class F3D_Settings(PropertyGroup):
    api_url: StringProperty(
        name="API URL",
        description="Use o endereço mostrado pelo servidor do Free3D Hub",
        default=DEFAULT_API,
    )
    source: EnumProperty(
        name="Fonte",
        items=[
            ("SKETCHFAB", "Sketchfab", "Modelos baixáveis", "WORLD", 0),
            ("POLYHAVEN", "Poly Haven", "Modelos CC0", "MATSPHERE", 1),
            ("HUMANOIDS", "Humanoides", "Personagens riggados", "ARMATURE_DATA", 2),
            ("CREATURES", "Criaturas", "Animais e monstros", "GHOST_ENABLED", 3),
            ("SCENEKITS", "Cenários", "Modelos para cenários", "HOME", 4),
        ],
        default="SKETCHFAB",
    )
    query: StringProperty(name="Buscar", default="")
    results: CollectionProperty(type=F3D_AssetItem)
    active_index: IntProperty(default=0)
    status: StringProperty(default="Pronto para buscar")
    status_type: StringProperty(default="INFO")
    loading: BoolProperty(default=False)
    total_results: IntProperty(default=0)
    import_scale: FloatProperty(name="Escala", default=1.0, min=0.01, max=100.0)
    import_smooth: BoolProperty(name="Shade Smooth", default=True)
    import_center: BoolProperty(name="Centralizar no cursor", default=True)
    batch_count: IntProperty(name="Quantidade", default=3, min=1, max=20)


class F3D_OT_search(Operator):
    bl_idname = "f3d.search"
    bl_label = "Buscar"
    bl_description = "Buscar modelos no Free3D Hub"

    def execute(self, context):
        settings = context.scene.f3d_settings
        settings.results.clear()
        settings.loading = True
        settings.status = "Buscando..."
        settings.status_type = "INFO"
        try:
            base = api_base(settings.api_url)
            query = settings.query.strip()
            source = settings.source
            if source == "POLYHAVEN":
                data = http_get_json(f"{base}/api/polyhaven?t=models")
                items = []
                query_lower = query.lower()
                for slug, value in data.items():
                    title = value.get("name", slug)
                    if query_lower and query_lower not in f"{title} {slug}".lower():
                        continue
                    items.append({
                        "uid": slug,
                        "slug": slug,
                        "title": title,
                        "thumb": f"https://cdn.polyhaven.com/asset_img/thumbs/{urllib.parse.quote(slug)}.png?width=300",
                        "url": f"https://polyhaven.com/a/{urllib.parse.quote(slug)}",
                        "viewerUrl": f"https://polyhaven.com/a/{urllib.parse.quote(slug)}",
                        "author": "Poly Haven",
                        "license": "CC0",
                        "source": "polyhaven",
                        "faceCount": 0,
                    })
                    if len(items) >= 60:
                        break
            elif source == "HUMANOIDS":
                params = urllib.parse.urlencode({"q": query or "humanoid character", "count": 48})
                try:
                    data = http_get_json(f"{base}/api/humanoids/search?{params}")
                    items = [normalize_sketchfab(model, "humanoids") for model in data.get("results", [])]
                except RuntimeError:
                    items = search_sketchfab(base, f"{query} humanoid".strip(), "humanoids")
            elif source == "CREATURES":
                items = search_sketchfab(base, f"{query} creature animal".strip(), "creatures")
            elif source == "SCENEKITS":
                params = urllib.parse.urlencode({"q": query or "modular kit environment", "count": 48})
                data = http_get_json(f"{base}/api/scenekits/search?{params}")
                items = [normalize_sketchfab(model, "scenekits") for model in data.get("results", [])]
            else:
                items = search_sketchfab(base, query)

            for value in items[:60]:
                item = settings.results.add()
                item.name = str(value.get("title", "Sem título"))[:80]
                item.uid = str(value.get("uid", ""))
                item.slug = str(value.get("slug", ""))
                item.thumb_url = str(value.get("thumb", "") or "")
                item.model_url = str(value.get("url", "") or "")
                item.viewer_url = str(value.get("viewerUrl", "") or "")
                item.author = str(value.get("author", "") or "")
                item.license = str(value.get("license", "") or "")
                item.source = str(value.get("source", source.lower()))
                item.face_count = int(value.get("faceCount", 0) or 0)
            settings.total_results = len(items)
            settings.active_index = 0
            settings.status = f"{len(items)} resultados"
            settings.status_type = "CHECKMARK"
            self.report({"INFO"}, f"{len(items)} modelos encontrados")
        except Exception as error:
            settings.status = f"Erro: {str(error)[:80]}"
            settings.status_type = "ERROR"
            self.report({"ERROR"}, str(error))
        finally:
            settings.loading = False
        return {"FINISHED"}


class F3D_OT_quick_search(Operator):
    bl_idname = "f3d.quick_search"
    bl_label = "Busca rápida"
    query: StringProperty()
    source: StringProperty()

    def execute(self, context):
        settings = context.scene.f3d_settings
        settings.query = self.query
        if self.source:
            settings.source = self.source
        return bpy.ops.f3d.search()


class F3D_OT_import_model(Operator):
    bl_idname = "f3d.import_model"
    bl_label = "Importar modelo"
    bl_options = {"REGISTER", "UNDO"}

    @classmethod
    def poll(cls, context):
        settings = context.scene.f3d_settings
        return bool(settings.results) and 0 <= settings.active_index < len(settings.results)

    def execute(self, context):
        settings = context.scene.f3d_settings
        item = settings.results[settings.active_index]
        if item.source != "polyhaven":
            if item.viewer_url:
                bpy.ops.wm.url_open(url=item.viewer_url)
                self.report({"INFO"}, "Sketchfab exige login; o modelo foi aberto no navegador.")
                return {"FINISHED"}
            self.report({"ERROR"}, "URL do modelo indisponível.")
            return {"CANCELLED"}
        try:
            base = api_base(settings.api_url)
            settings.status = "Baixando modelo..."
            model_path = download_polyhaven_gltf(base, item.slug or item.uid)
            self._import_file(context, settings, model_path)
            settings.status = f"Importado: {item.name[:50]}"
            settings.status_type = "CHECKMARK"
            self.report({"INFO"}, f"Importado: {item.name}")
            return {"FINISHED"}
        except Exception as error:
            settings.status = f"Erro: {str(error)[:80]}"
            settings.status_type = "ERROR"
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}

    @staticmethod
    def _import_file(context, settings, model_path):
        existing = set(bpy.data.objects.keys())
        bpy.ops.import_scene.gltf(filepath=str(model_path))
        imported = [obj for obj in bpy.data.objects if obj.name not in existing]
        bpy.ops.object.select_all(action="DESELECT")
        for obj in imported:
            obj.select_set(True)
            if obj.type == "MESH" and settings.import_smooth:
                for polygon in obj.data.polygons:
                    polygon.use_smooth = True
            if obj.parent is None:
                if settings.import_scale != 1.0:
                    obj.scale = tuple(value * settings.import_scale for value in obj.scale)
                if settings.import_center:
                    obj.location = context.scene.cursor.location
        if imported:
            context.view_layer.objects.active = imported[0]


class F3D_OT_batch_import(Operator):
    bl_idname = "f3d.batch_import"
    bl_label = "Importar modelos Poly Haven em lote"

    @classmethod
    def poll(cls, context):
        return bool(context.scene.f3d_settings.results)

    def execute(self, context):
        settings = context.scene.f3d_settings
        direct = [
            index for index, item in enumerate(settings.results)
            if item.source == "polyhaven"
        ][:settings.batch_count]
        if not direct:
            self.report({"WARNING"}, "A importação direta em lote está disponível para modelos Poly Haven.")
            return {"CANCELLED"}
        imported = 0
        failed = 0
        for offset, index in enumerate(direct):
            settings.active_index = index
            result = bpy.ops.f3d.import_model()
            if "FINISHED" in result:
                imported += 1
                for obj in context.selected_objects:
                    if obj.type == "MESH" and obj.parent is None:
                        obj.location.x += offset * 2.5
            else:
                failed += 1
        settings.status = f"{imported} importados; {failed} falhas"
        settings.status_type = "CHECKMARK" if not failed else "ERROR"
        self.report({"INFO"}, settings.status)
        return {"FINISHED"}


class F3D_OT_open_browser(Operator):
    bl_idname = "f3d.open_browser"
    bl_label = "Abrir no navegador"

    @classmethod
    def poll(cls, context):
        settings = context.scene.f3d_settings
        return bool(settings.results) and 0 <= settings.active_index < len(settings.results)

    def execute(self, context):
        item = context.scene.f3d_settings.results[context.scene.f3d_settings.active_index]
        url = item.viewer_url or item.model_url
        if not url:
            self.report({"WARNING"}, "URL indisponível.")
            return {"CANCELLED"}
        bpy.ops.wm.url_open(url=url)
        return {"FINISHED"}


class F3D_OT_clear_cache(Operator):
    bl_idname = "f3d.clear_cache"
    bl_label = "Limpar cache"

    def invoke(self, context, event):
        return context.window_manager.invoke_confirm(self, event)

    def execute(self, context):
        try:
            shutil.rmtree(str(THUMBS_DIR), ignore_errors=True)
            shutil.rmtree(str(MODELS_DIR), ignore_errors=True)
            THUMBS_DIR.mkdir(parents=True, exist_ok=True)
            MODELS_DIR.mkdir(parents=True, exist_ok=True)
            self.report({"INFO"}, "Cache limpo.")
        except OSError as error:
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}
        return {"FINISHED"}


class F3D_OT_open_folder(Operator):
    bl_idname = "f3d.open_folder"
    bl_label = "Abrir pasta de cache"

    def execute(self, context):
        try:
            if sys.platform == "win32":
                os.startfile(str(CACHE_DIR))
            elif sys.platform == "darwin":
                subprocess.Popen(["open", str(CACHE_DIR)])
            else:
                subprocess.Popen(["xdg-open", str(CACHE_DIR)])
        except OSError as error:
            self.report({"ERROR"}, str(error))
            return {"CANCELLED"}
        return {"FINISHED"}


class F3D_UL_results(UIList):
    bl_idname = "F3D_UL_results"

    def draw_item(self, context, layout, data, item, icon, active_data, active_propname, index):
        row = layout.row(align=True)
        row.label(text="", icon=SOURCE_ICONS.get(item.source, "MESH_DATA"))
        row.label(text=item.name[:40])
        if item.face_count > 0:
            row.label(text=f"{item.face_count:,} faces")


class F3D_PT_main(Panel):
    bl_label = "Free3D Hub"
    bl_idname = "F3D_PT_main"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Free3D"

    def draw(self, context):
        layout = self.layout
        settings = context.scene.f3d_settings
        layout.prop(settings, "source", text="")
        row = layout.row(align=True)
        row.prop(settings, "query", text="", icon="VIEWZOOM")
        row.operator("f3d.search", text="Buscar", icon="PLAY")
        if settings.source == "CREATURES":
            row = layout.row(align=True)
            for label, query in (("Dragão", "dragon"), ("Lobo", "wolf"), ("Dinossauro", "dinosaur")):
                op = row.operator("f3d.quick_search", text=label)
                op.query, op.source = query, "CREATURES"
        elif settings.source == "HUMANOIDS":
            row = layout.row(align=True)
            for label, query in (("Guerreiro", "warrior knight"), ("Mago", "mage wizard"), ("Arqueiro", "archer ranger")):
                op = row.operator("f3d.quick_search", text=label)
                op.query, op.source = query, "HUMANOIDS"
        elif settings.source == "SCENEKITS":
            row = layout.row(align=True)
            for label, query in (("Castelo", "castle medieval"), ("Vila", "village house"), ("Floresta", "forest tree")):
                op = row.operator("f3d.quick_search", text=label)
                op.query, op.source = query, "SCENEKITS"

        if settings.status:
            layout.label(text=settings.status, icon=settings.status_type or "INFO")
        if settings.total_results:
            layout.label(text=f"{settings.total_results} resultados")
        if settings.results:
            item = settings.results[settings.active_index]
            icon_id = ensure_thumbnail(item.thumb_url)
            if icon_id:
                layout.template_icon(icon_value=icon_id, scale=6)
            layout.label(text=item.name[:45], icon="MESH_DATA")
            layout.label(text=f"Autor: {item.author[:35] or '—'}")
            layout.label(text=f"Licença: {item.license[:35] or 'ver fonte'}")
            layout.template_list(
                "F3D_UL_results", "", settings, "results",
                settings, "active_index", rows=5,
            )
            layout.operator("f3d.import_model", text="Importar / abrir modelo", icon="IMPORT")
            layout.operator("f3d.open_browser", text="Ver página original", icon="URL")


class F3D_PT_batch(Panel):
    bl_label = "Importação em lote"
    bl_idname = "F3D_PT_batch"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Free3D"
    bl_parent_id = "F3D_PT_main"
    bl_options = {"DEFAULT_CLOSED"}

    def draw(self, context):
        settings = context.scene.f3d_settings
        self.layout.prop(settings, "batch_count")
        self.layout.operator("f3d.batch_import", icon="OUTLINER_OB_GROUP_INSTANCE")


class F3D_PT_import_settings(Panel):
    bl_label = "Configurações de importação"
    bl_idname = "F3D_PT_import_settings"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Free3D"
    bl_parent_id = "F3D_PT_main"
    bl_options = {"DEFAULT_CLOSED"}

    def draw(self, context):
        settings = context.scene.f3d_settings
        self.layout.prop(settings, "import_scale")
        self.layout.prop(settings, "import_smooth")
        self.layout.prop(settings, "import_center")


class F3D_PT_config(Panel):
    bl_label = "Conexão e cache"
    bl_idname = "F3D_PT_config"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Free3D"
    bl_parent_id = "F3D_PT_main"
    bl_options = {"DEFAULT_CLOSED"}

    def draw(self, context):
        layout = self.layout
        settings = context.scene.f3d_settings
        layout.prop(settings, "api_url")
        layout.label(text="Use o endereço exibido pelo servidor local.")
        layout.operator("f3d.open_folder", icon="FILE_FOLDER")
        layout.operator("f3d.clear_cache", icon="TRASH")


CLASSES = (
    F3D_AssetItem,
    F3D_Settings,
    F3D_OT_search,
    F3D_OT_quick_search,
    F3D_OT_import_model,
    F3D_OT_batch_import,
    F3D_OT_open_browser,
    F3D_OT_clear_cache,
    F3D_OT_open_folder,
    F3D_UL_results,
    F3D_PT_main,
    F3D_PT_batch,
    F3D_PT_import_settings,
    F3D_PT_config,
)


def register():
    for cls in CLASSES:
        bpy.utils.register_class(cls)
    bpy.types.Scene.f3d_settings = bpy.props.PointerProperty(type=F3D_Settings)


def unregister():
    if hasattr(bpy.types.Scene, "f3d_settings"):
        del bpy.types.Scene.f3d_settings
    for cls in reversed(CLASSES):
        bpy.utils.unregister_class(cls)


if __name__ == "__main__":
    register()
