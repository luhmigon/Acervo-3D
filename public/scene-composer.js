import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const SCENE_KEY = 'f3d_scene_v1';
const PROXY = '/api/scenekits/glb-proxy?url=';

const state = {
  scene: null, camera: null, renderer: null, controls: null, transformControls: null,
  selected: null, objects: [], transformMode: 'translate', snapEnabled: true,
  gridVisible: true, polyhavenCache: null,
};

const history = {
  stack: [],
  pointer: -1,
  push(operation) {
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push(operation);
    this.pointer = this.stack.length - 1;
    updateToolbar();
  },
  undo() {
    if (this.pointer < 0) return;
    applyOperation(this.stack[this.pointer], true);
    this.pointer--;
    updateToolbar();
    refreshUI();
  },
  redo() {
    if (this.pointer >= this.stack.length - 1) return;
    this.pointer++;
    applyOperation(this.stack[this.pointer], false);
    updateToolbar();
    refreshUI();
  },
};

function applyOperation(operation, undo) {
  const { type, object } = operation;
  if (type === 'add' || type === 'delete') {
    const shouldAdd = type === 'add' ? !undo : undo;
    if (shouldAdd) {
      state.scene.add(object);
      if (!state.objects.includes(object)) state.objects.push(object);
    } else {
      state.scene.remove(object);
      state.objects = state.objects.filter(item => item !== object);
    }
  } else if (type === 'transform') {
    const values = undo ? operation.before : operation.after;
    object.position.fromArray(values.position);
    object.rotation.set(...values.rotation);
    object.scale.fromArray(values.scale);
  }
  if (state.selected && !state.objects.includes(state.selected)) deselect();
}

function addToScene(object, record = true) {
  state.scene.add(object);
  if (!state.objects.includes(object)) state.objects.push(object);
  if (record) history.push({ type: 'add', object });
  refreshUI();
}

function removeFromScene(object, record = true) {
  state.scene.remove(object);
  state.objects = state.objects.filter(item => item !== object);
  if (state.selected === object) deselect();
  if (record) history.push({ type: 'delete', object });
  refreshUI();
}

function refreshUI() {
  updateHierarchy();
  updateObjectCount();
  updateProperties();
}

function initThree() {
  const canvas = $('#mainCanvas');
  const wrap = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer = renderer;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0d14);
  state.scene = scene;

  const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / Math.max(wrap.clientHeight, 1), 0.1, 1000);
  camera.position.set(5, 5, 5);
  state.camera = camera;

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.5;
  controls.maxDistance = 100;
  controls.target.set(0, 0, 0);
  state.controls = controls;

  const grid = new THREE.GridHelper(50, 50, 0x242938, 0x1c2030);
  grid.name = '__grid__';
  scene.add(grid);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
  keyLight.position.set(5, 10, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x8b6dff, 0.4);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);

  const transformControls = new TransformControls(camera, renderer.domElement);
  transformControls.setMode('translate');
  transformControls.setTranslationSnap(0.5);
  transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
  transformControls.setScaleSnap(0.1);
  transformControls.addEventListener('dragging-changed', event => {
    controls.enabled = !event.value;
    if (!state.selected) return;
    if (event.value) {
      state.selected.userData._beforeTransform = transformSnapshot(state.selected);
    } else if (state.selected.userData._beforeTransform) {
      history.push({
        type: 'transform',
        object: state.selected,
        before: state.selected.userData._beforeTransform,
        after: transformSnapshot(state.selected),
      });
      delete state.selected.userData._beforeTransform;
    }
  });
  scene.add(transformControls.getHelper ? transformControls.getHelper() : transformControls);
  state.transformControls = transformControls;

  setupRaycasting(canvas);
  window.addEventListener('resize', onResize);
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();
  loadEnvironment('studio');
}

function transformSnapshot(object) {
  return {
    position: object.position.toArray(),
    rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
    scale: object.scale.toArray(),
  };
}

function onResize() {
  const wrap = $('#canvasWrap');
  if (!wrap || !state.renderer) return;
  state.camera.aspect = wrap.clientWidth / Math.max(wrap.clientHeight, 1);
  state.camera.updateProjectionMatrix();
  state.renderer.setSize(wrap.clientWidth, wrap.clientHeight);
}

function setupRaycasting(canvas) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let downPosition = null;
  canvas.addEventListener('pointerdown', event => {
    downPosition = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener('pointerup', event => {
    if (!downPosition) return;
    const dx = event.clientX - downPosition.x;
    const dy = event.clientY - downPosition.y;
    downPosition = null;
    if (dx * dx + dy * dy > 25) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, state.camera);
    const intersections = raycaster.intersectObjects(state.objects, true);
    if (!intersections.length) return deselect();
    let object = intersections[0].object;
    while (object && !object.userData.addedByUser) object = object.parent;
    if (object) selectObject(object);
    else deselect();
  });
}

const ENV_URLS = {
  studio: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
  sunset: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr',
  night: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr',
  forest: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr',
  warehouse: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
  city: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr',
};

async function loadEnvironment(name) {
  const url = ENV_URLS[name] || ENV_URLS.studio;
  try {
    const loader = new RGBELoader();
    const texture = await new Promise((resolve, reject) => {
      loader.load(`${PROXY}${encodeURIComponent(url)}`, resolve, undefined, reject);
    });
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const pmrem = new THREE.PMREMGenerator(state.renderer);
    const envMap = pmrem.fromEquirectangular(texture).texture;
    state.scene.environment = envMap;
    texture.dispose();
    pmrem.dispose();
  } catch (error) {
    console.warn('[env] HDR indisponível; mantendo iluminação padrão:', error.message);
  }
}

function selectObject(object) {
  if (state.selected === object) return;
  deselect();
  state.selected = object;
  state.transformControls.attach(object);
  updateHierarchy();
  updateProperties();
}

function deselect() {
  if (state.selected) state.transformControls.detach();
  state.selected = null;
  updateHierarchy();
  updateProperties();
}

function setTransformMode(mode) {
  state.transformMode = mode;
  state.transformControls.setMode(mode);
  $$('.tb-btn[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
}

function toggleSnap() {
  state.snapEnabled = !state.snapEnabled;
  const snap = state.snapEnabled;
  state.transformControls.setTranslationSnap(snap ? 0.5 : null);
  state.transformControls.setRotationSnap(snap ? THREE.MathUtils.degToRad(15) : null);
  state.transformControls.setScaleSnap(snap ? 0.1 : null);
  $('#btnSnap').classList.toggle('active', snap);
}

function toggleGrid() {
  state.gridVisible = !state.gridVisible;
  const grid = state.scene.getObjectByName('__grid__');
  if (grid) grid.visible = state.gridVisible;
  $('#btnGrid').classList.toggle('active', state.gridVisible);
}

function createPrimitive(type) {
  const geometries = {
    box: () => new THREE.BoxGeometry(1, 1, 1),
    sphere: () => new THREE.SphereGeometry(0.5, 32, 24),
    cylinder: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 32),
    cone: () => new THREE.ConeGeometry(0.5, 1, 32),
    torus: () => new THREE.TorusGeometry(0.4, 0.15, 16, 32),
    plane: () => new THREE.PlaneGeometry(2, 2),
    capsule: () => new THREE.CapsuleGeometry(0.35, 0.6, 16, 32),
    icosahedron: () => new THREE.IcosahedronGeometry(0.5),
    octahedron: () => new THREE.OctahedronGeometry(0.5),
    dodecahedron: () => new THREE.DodecahedronGeometry(0.5),
    torusknot: () => new THREE.TorusKnotGeometry(0.35, 0.12, 100, 16),
    ring: () => new THREE.RingGeometry(0.2, 0.5, 32),
  };
  if (!geometries[type]) return null;
  const mesh = new THREE.Mesh(
    geometries[type](),
    new THREE.MeshStandardMaterial({ color: 0x8b6dff, roughness: 0.5, metalness: 0.1 }),
  );
  if (type === 'plane' || type === 'ring') mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(0, 0.5, 0);
  mesh.userData.addedByUser = true;
  mesh.userData.type = 'primitive';
  mesh.userData.primitiveType = type;
  mesh.userData.id = createObjectId();
  mesh.name = type.charAt(0).toUpperCase() + type.slice(1);
  return mesh;
}

function createObjectId(prefix = 'obj') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function addPrimitive(type) {
  const mesh = createPrimitive(type);
  if (!mesh) return;
  addToScene(mesh);
  selectObject(mesh);
}

function addLight(type, record = true) {
  let light;
  if (type === 'point') {
    light = new THREE.PointLight(0xffffff, 10, 20);
    light.position.set(0, 2, 0);
  } else if (type === 'spot') {
    light = new THREE.SpotLight(0xffffff, 20, 30, Math.PI / 6);
    light.position.set(0, 4, 0);
  } else if (type === 'directional') {
    light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(5, 10, 5);
  } else return;

  const group = new THREE.Group();
  group.add(light);
  group.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffdd44 })));
  group.userData = { addedByUser: true, type: 'light', lightType: type, id: createObjectId('light') };
  group.name = `${type.charAt(0).toUpperCase() + type.slice(1)} Light`;
  group.position.copy(light.position);
  light.position.set(0, 0, 0);
  addToScene(group, record);
  if (record) selectObject(group);
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

function loadGLBFromUrl(url, sourceInfo) {
  return new Promise((resolve, reject) => {
    showLoader('Carregando modelo…');
    gltfLoader.load(url, gltf => {
      hideLoader();
      const root = gltf.scene;
      root.userData.addedByUser = true;
      root.userData.type = sourceInfo.type;
      root.userData.id = createObjectId();
      if (sourceInfo.slug) root.userData.slug = sourceInfo.slug;
      if (sourceInfo.localId) root.userData.localId = sourceInfo.localId;
      root.name = sourceInfo.name || 'Modelo';
      const bounds = new THREE.Box3().setFromObject(root);
      const center = bounds.getCenter(new THREE.Vector3());
      root.position.set(-center.x, -bounds.min.y, -center.z);
      addToScene(root);
      selectObject(root);
      resolve(root);
    }, undefined, error => {
      hideLoader();
      reject(error);
    });
  });
}

async function loadPolyHavenModel(slug) {
  showLoader(`Buscando ${slug}…`);
  try {
    const response = await fetch(`/api/polyhaven-files?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error(`Não foi possível buscar o modelo (${response.status}).`);
    const files = await response.json();
    const glbUrl = pickGlbUrl(files);
    if (!glbUrl) throw new Error('Este modelo não oferece um arquivo GLB compatível.');
    await loadGLBFromUrl(`${PROXY}${encodeURIComponent(glbUrl)}`, { type: 'polyhaven', slug, name: slug });
  } catch (error) {
    hideLoader();
    showToast(`❌ ${error.message}`);
  }
}

function pickGlbUrl(files) {
  return files?.gltf?.['1k']?.glb?.url
    || files?.gltf?.['2k']?.glb?.url
    || files?.gltf?.['4k']?.glb?.url
    || null;
}

async function loadLocalFile(file) {
  if (!/\.(glb|gltf)$/i.test(file.name)) {
    showToast('❌ Apenas arquivos GLB/GLTF são aceitos.');
    return;
  }
  const localId = createObjectId('local');
  const buffer = await file.arrayBuffer();
  try {
    await SceneDB.put(localId, { buffer, name: file.name });
  } catch (error) {
    console.warn('[IndexedDB] Não foi possível persistir o arquivo:', error.message);
    showToast('O arquivo será carregado, mas não ficará disponível após recarregar a página.');
  }
  const url = URL.createObjectURL(new Blob([buffer], { type: file.name.toLowerCase().endsWith('.glb') ? 'model/gltf-binary' : 'model/gltf+json' }));
  try {
    await loadGLBFromUrl(url, { type: 'local', localId, name: file.name });
  } finally {
    URL.revokeObjectURL(url);
  }
}

const SceneDB = {
  db: null,
  opening: null,
  async open() {
    if (this.db) return this.db;
    if (!this.opening) {
      this.opening = new Promise((resolve, reject) => {
        const request = indexedDB.open('f3d-scene', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('assets')) request.result.createObjectStore('assets', { keyPath: 'id' });
        };
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        request.onerror = () => {
          this.opening = null;
          reject(request.error);
        };
      });
    }
    return this.opening;
  },
  async put(id, data) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('assets', 'readwrite');
      transaction.objectStore('assets').put({ id, ...data });
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
    });
  },
  async get(id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('assets', 'readonly');
      const request = transaction.objectStore('assets').get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
};

async function loadPolyHavenBrowser() {
  if (state.polyhavenCache) {
    renderPolyHavenList(state.polyhavenCache);
    return;
  }
  $('#phResults').innerHTML = '<p class="empty-msg">Carregando modelos…</p>';
  try {
    const response = await fetch('/api/polyhaven?t=models');
    if (!response.ok) throw new Error(`Não foi possível carregar Poly Haven (${response.status}).`);
    const data = await response.json();
    state.polyhavenCache = Object.entries(data).map(([slug, item]) => ({
      slug,
      name: item.name || slug,
      thumb: `https://cdn.polyhaven.com/asset_img/thumbs/${encodeURIComponent(slug)}.png?width=100`,
      categories: item.categories || [],
    }));
    renderPolyHavenList(state.polyhavenCache);
  } catch (error) {
    console.error('[scene-composer/polyhaven]', error);
    $('#phResults').innerHTML = `<p class="empty-msg">${escapeHtml(error.message)}</p>`;
  }
}

function renderPolyHavenList(items, filter = '') {
  const normalized = filter.toLowerCase();
  const filtered = normalized
    ? items.filter(item => item.name.toLowerCase().includes(normalized) || item.slug.includes(normalized))
    : items;
  $('#phResults').innerHTML = filtered.slice(0, 100).map(item => `
    <button class="ph-item" type="button" data-ph-slug="${escapeHtml(item.slug)}">
      <img src="${escapeHtml(item.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer">
      <span class="ph-item-info">
        <span class="ph-item-name">${escapeHtml(item.name)}</span>
        <span class="ph-item-meta">${escapeHtml((item.categories || []).slice(0, 2).join(' · ') || 'Modelo 3D')}</span>
      </span>
    </button>
  `).join('') || '<p class="empty-msg">Nenhum resultado encontrado.</p>';
}

function updateProperties() {
  const element = $('#properties');
  if (!state.selected) {
    element.innerHTML = '<p class="empty-msg">Nenhum objeto selecionado</p>';
    return;
  }
  const object = state.selected;
  element.innerHTML = `
    <div class="prop-group"><label for="propName">Nome</label><input type="text" class="prop-input" id="propName" value="${escapeHtml(object.name)}"></div>
    <div class="prop-group"><label>Posição</label><div class="prop-vec3">
      <input type="number" step="0.1" class="prop-input" id="px" value="${object.position.x.toFixed(2)}">
      <input type="number" step="0.1" class="prop-input" id="py" value="${object.position.y.toFixed(2)}">
      <input type="number" step="0.1" class="prop-input" id="pz" value="${object.position.z.toFixed(2)}">
    </div></div>
    <div class="prop-group"><label>Rotação (°)</label><div class="prop-vec3">
      <input type="number" step="15" class="prop-input" id="rx" value="${(object.rotation.x * 180 / Math.PI).toFixed(1)}">
      <input type="number" step="15" class="prop-input" id="ry" value="${(object.rotation.y * 180 / Math.PI).toFixed(1)}">
      <input type="number" step="15" class="prop-input" id="rz" value="${(object.rotation.z * 180 / Math.PI).toFixed(1)}">
    </div></div>
    <div class="prop-group"><label>Escala</label><div class="prop-vec3">
      <input type="number" step="0.1" class="prop-input" id="sx" value="${object.scale.x.toFixed(2)}">
      <input type="number" step="0.1" class="prop-input" id="sy" value="${object.scale.y.toFixed(2)}">
      <input type="number" step="0.1" class="prop-input" id="sz" value="${object.scale.z.toFixed(2)}">
    </div></div>
    <div class="prop-actions"><button type="button" id="btnDuplicate">📋 Duplicar</button><button type="button" class="danger" id="btnDeleteProp">🗑 Remover</button></div>
  `;

  const inputs = [
    ['px', 'position', 'x'], ['py', 'position', 'y'], ['pz', 'position', 'z'],
    ['rx', 'rotation', 'x', true], ['ry', 'rotation', 'y', true], ['rz', 'rotation', 'z', true],
    ['sx', 'scale', 'x'], ['sy', 'scale', 'y'], ['sz', 'scale', 'z'],
  ];
  inputs.forEach(([id, property, axis, degrees]) => {
    $(`#${id}`).addEventListener('change', event => {
      const before = transformSnapshot(object);
      const value = Number(event.target.value);
      if (!Number.isFinite(value)) return;
      object[property][axis] = degrees ? value * Math.PI / 180 : value;
      history.push({ type: 'transform', object, before, after: transformSnapshot(object) });
      updateProperties();
    });
  });
  $('#propName').addEventListener('change', event => {
    object.name = event.target.value.trim() || 'Objeto';
    updateHierarchy();
  });
  $('#btnDuplicate').addEventListener('click', duplicateSelected);
  $('#btnDeleteProp').addEventListener('click', deleteSelected);
}

function updateHierarchy() {
  const hierarchy = $('#hierarchy');
  if (!state.objects.length) {
    hierarchy.innerHTML = '<p class="empty-msg">Adicione objetos do painel esquerdo</p>';
    return;
  }
  hierarchy.innerHTML = state.objects.map(object => {
    const icon = object.userData.type === 'light' ? '💡'
      : object.userData.type === 'polyhaven' ? '✨'
        : object.userData.type === 'local' ? '📁' : '📦';
    return `<button type="button" class="hierarchy-item ${state.selected === object ? 'selected' : ''}" data-obj-id="${escapeHtml(object.userData.id)}">
      <span class="icon">${icon}</span><span class="name">${escapeHtml(object.name)}</span>
    </button>`;
  }).join('');
  $$('.hierarchy-item').forEach(button => button.addEventListener('click', () => {
    const object = state.objects.find(item => item.userData.id === button.dataset.objId);
    if (object) selectObject(object);
  }));
}

function updateObjectCount() {
  const count = state.objects.length;
  $('#objCount').textContent = `${count} objeto${count === 1 ? '' : 's'}`;
}

function deleteSelected() {
  if (!state.selected) return;
  const object = state.selected;
  deselect();
  removeFromScene(object);
  showToast('Objeto removido.');
}

function duplicateSelected() {
  if (!state.selected) return;
  const clone = state.selected.clone(true);
  clone.position.x += 1;
  clone.userData = { ...state.selected.userData, id: createObjectId() };
  clone.name = `${state.selected.name} (cópia)`;
  addToScene(clone);
  selectObject(clone);
}

function serializeScene() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    environment: $('#envSelect').value,
    objects: state.objects.map(object => ({
      type: object.userData.type,
      name: object.name,
      position: object.position.toArray(),
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: object.scale.toArray(),
      userData: {
        primitiveType: object.userData.primitiveType,
        lightType: object.userData.lightType,
        slug: object.userData.slug,
        localId: object.userData.localId,
      },
    })),
    camera: { position: state.camera.position.toArray(), target: state.controls.target.toArray() },
  };
}

function saveScene() {
  try {
    localStorage.setItem(SCENE_KEY, JSON.stringify(serializeScene()));
    showToast(`Cena salva (${state.objects.length} objetos).`);
  } catch (error) {
    showToast(`Não foi possível salvar: ${error.message}`);
  }
}

function downloadSceneJSON() {
  const blob = new Blob([JSON.stringify(serializeScene(), null, 2)], { type: 'application/json' });
  downloadBlob(blob, `scene-${Date.now()}.json`);
  showToast('JSON exportado.');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function loadSceneFromStorage() {
  const raw = localStorage.getItem(SCENE_KEY);
  if (!raw) return;
  try {
    await loadSceneData(JSON.parse(raw));
    showToast('Cena restaurada.');
  } catch (error) {
    console.error('[scene-composer/restore]', error);
    showToast(`Não foi possível restaurar a cena: ${error.message}`);
  }
}

async function loadSceneData(data) {
  if (!data || !Array.isArray(data.objects) || data.objects.length > 500) {
    throw new Error('Arquivo de cena inválido ou com objetos demais.');
  }
  while (state.objects.length) state.scene.remove(state.objects.pop());
  deselect();
  history.stack = [];
  history.pointer = -1;

  if (ENV_URLS[data.environment]) {
    $('#envSelect').value = data.environment;
    loadEnvironment(data.environment);
  }
  if (Array.isArray(data.camera?.position) && data.camera.position.length === 3) {
    state.camera.position.fromArray(data.camera.position);
  }
  if (Array.isArray(data.camera?.target) && data.camera.target.length === 3) {
    state.controls.target.fromArray(data.camera.target);
  }

  showLoader('Restaurando cena…');
  const failures = [];
  for (const item of data.objects) {
    try {
      if (item.type === 'primitive') {
        const object = createPrimitive(item.userData?.primitiveType);
        if (!object) throw new Error(`Primitivo inválido: ${item.userData?.primitiveType || 'desconhecido'}.`);
        object.name = item.name || object.name;
        applyTransform(object, item);
        state.scene.add(object);
        state.objects.push(object);
      } else if (item.type === 'polyhaven' && item.userData?.slug) {
        const response = await fetch(`/api/polyhaven-files?slug=${encodeURIComponent(item.userData.slug)}`);
        if (!response.ok) throw new Error(`Não foi possível recuperar ${item.userData.slug} (${response.status}).`);
        const files = await response.json();
        const glbUrl = pickGlbUrl(files);
        if (!glbUrl) throw new Error(`Não há GLB disponível para ${item.userData.slug}.`);
        await loadRestoredModel(`${PROXY}${encodeURIComponent(glbUrl)}`, item);
      } else if (item.type === 'local' && item.userData?.localId) {
        const stored = await SceneDB.get(item.userData.localId);
        if (!stored) throw new Error(`O arquivo local ${item.name || ''} não está mais disponível.`);
        const url = URL.createObjectURL(new Blob([stored.buffer], { type: stored.name?.toLowerCase().endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary' }));
        try {
          await loadRestoredModel(url, item, item.userData.localId);
        } finally {
          URL.revokeObjectURL(url);
        }
      } else if (item.type === 'light') {
        const priorCount = state.objects.length;
        addLight(item.userData?.lightType, false);
        const light = state.objects[state.objects.length - 1];
        if (state.objects.length > priorCount && light) {
          applyTransform(light, item);
          light.name = item.name || light.name;
        }
      } else {
        throw new Error(`Tipo de objeto inválido: ${item.type || 'desconhecido'}.`);
      }
    } catch (error) {
      failures.push(error.message);
      console.warn('[scene-composer/restore-item]', error.message);
    }
  }
  hideLoader();
  refreshUI();
  if (failures.length) showToast(`${failures.length} objeto(s) não puderam ser restaurados.`);
}

function applyTransform(object, data) {
  const vectors = [data.position, data.rotation, data.scale];
  if (vectors.some(value => !Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))) {
    throw new Error('Transformação inválida no arquivo de cena.');
  }
  object.position.fromArray(data.position);
  object.rotation.set(...data.rotation);
  object.scale.fromArray(data.scale);
}

function loadRestoredModel(url, data, localId = null) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, gltf => {
      const root = gltf.scene;
      root.userData = {
        addedByUser: true,
        type: localId ? 'local' : 'polyhaven',
        id: createObjectId(),
        slug: data.userData?.slug,
        localId,
      };
      root.name = data.name || 'Modelo';
      applyTransform(root, data);
      state.scene.add(root);
      state.objects.push(root);
      resolve(root);
    }, undefined, reject);
  });
}

async function exportGLB() {
  if (!state.objects.length) {
    showToast('Adicione objetos antes de exportar.');
    return;
  }
  showLoader('Exportando GLB…');
  try {
    const group = new THREE.Group();
    state.objects.forEach(object => group.add(object.clone(true)));
    const exporter = new GLTFExporter();
    const result = await new Promise((resolve, reject) => {
      exporter.parse(group, resolve, reject, { binary: true });
    });
    downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), `scene-${Date.now()}.glb`);
    showToast('GLB exportado.');
  } catch (error) {
    showToast(`Falha ao exportar GLB: ${error.message}`);
  } finally {
    hideLoader();
  }
}

function takeScreenshot() {
  state.renderer.render(state.scene, state.camera);
  state.renderer.domElement.toBlob(blob => {
    if (!blob) return showToast('Não foi possível gerar a imagem.');
    downloadBlob(blob, `scene-${Date.now()}.png`);
    showToast('Screenshot salvo.');
  }, 'image/png');
}

function showLoader(text) {
  $('#loaderText').textContent = text || 'Carregando…';
  $('#canvasLoader').classList.add('show');
}
function hideLoader() { $('#canvasLoader').classList.remove('show'); }

let toastTimer;
function showToast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2400);
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function updateToolbar() {
  $('#btnUndo').disabled = history.pointer < 0;
  $('#btnRedo').disabled = history.pointer >= history.stack.length - 1;
  $('#btnUndo').style.opacity = history.pointer >= 0 ? 1 : 0.45;
  $('#btnRedo').style.opacity = history.pointer < history.stack.length - 1 ? 1 : 0.45;
}

function bindEvents() {
  $$('.tb-btn[data-mode]').forEach(button => button.addEventListener('click', () => setTransformMode(button.dataset.mode)));
  $('#btnSnap').addEventListener('click', toggleSnap);
  $('#btnGrid').addEventListener('click', toggleGrid);
  $('#btnUndo').addEventListener('click', () => history.undo());
  $('#btnRedo').addEventListener('click', () => history.redo());
  $('#btnSave').addEventListener('click', saveScene);
  $('#btnExportGLB').addEventListener('click', exportGLB);
  $('#btnExportJSON').addEventListener('click', downloadSceneJSON);
  $('#btnImportJSON').addEventListener('click', () => $('#importJSONFile').click());
  $('#btnScreenshot').addEventListener('click', takeScreenshot);
  $('#btnClear').addEventListener('click', () => {
    if (!state.objects.length || !confirm('Limpar toda a cena?')) return;
    state.objects.forEach(object => state.scene.remove(object));
    state.objects = [];
    deselect();
    history.stack = [];
    history.pointer = -1;
    updateToolbar();
    refreshUI();
    showToast('Cena limpa.');
  });
  $('#envSelect').addEventListener('change', event => loadEnvironment(event.target.value));
  $('#importJSONFile').addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      await loadSceneData(data);
      showToast('Cena importada.');
    } catch (error) {
      showToast(`Não foi possível importar: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  });

  $$('.panel-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.panel-tab').forEach(item => item.classList.toggle('active', item === tab));
    $$('.panel-content').forEach(panel => panel.classList.remove('active'));
    const panels = { prim: 'tabPrim', ph: 'tabPh', local: 'tabLocal' };
    $(`#${panels[tab.dataset.tab]}`).classList.add('active');
    if (tab.dataset.tab === 'ph') loadPolyHavenBrowser();
  }));
  $$('.prim-btn[data-prim]').forEach(button => button.addEventListener('click', () => addPrimitive(button.dataset.prim)));
  $$('.prim-btn[data-light]').forEach(button => button.addEventListener('click', () => addLight(button.dataset.light)));
  $('#phSearch').addEventListener('input', event => {
    if (state.polyhavenCache) renderPolyHavenList(state.polyhavenCache, event.target.value);
  });
  $('#phResults').addEventListener('click', event => {
    const button = event.target.closest('[data-ph-slug]');
    if (button) loadPolyHavenModel(button.dataset.phSlug);
  });
  $('#btnPickLocal').addEventListener('click', () => $('#localFile').click());
  $('#localFile').addEventListener('change', event => {
    for (const file of event.target.files) loadLocalFile(file).catch(error => showToast(`Falha ao carregar arquivo: ${error.message}`));
    event.target.value = '';
  });
  const dropzone = $('#dropzoneMini');
  dropzone.addEventListener('click', () => $('#localFile').click());
  dropzone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      $('#localFile').click();
    }
  });
  ['dragenter', 'dragover'].forEach(name => dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(name => dropzone.addEventListener(name, event => {
    event.preventDefault();
    dropzone.classList.remove('dragover');
  }));
  dropzone.addEventListener('drop', event => {
    for (const file of event.dataTransfer.files) loadLocalFile(file).catch(error => showToast(`Falha ao carregar arquivo: ${error.message}`));
  });
  const wrap = $('#canvasWrap');
  ['dragenter', 'dragover'].forEach(name => wrap.addEventListener(name, event => event.preventDefault()));
  wrap.addEventListener('drop', event => {
    event.preventDefault();
    for (const file of event.dataTransfer.files) loadLocalFile(file).catch(error => showToast(`Falha ao carregar arquivo: ${error.message}`));
  });

  document.addEventListener('keydown', event => {
    if (event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
    if (event.key === 'w' || event.key === 'W') setTransformMode('translate');
    if (event.key === 'e' || event.key === 'E') setTransformMode('rotate');
    if (event.key === 'r' || event.key === 'R') setTransformMode('scale');
    if (event.key === 'g' || event.key === 'G') toggleSnap();
    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (state.selected) {
        event.preventDefault();
        deleteSelected();
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && state.selected) {
      event.preventDefault();
      duplicateSelected();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) history.redo();
      else history.undo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      history.redo();
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      saveScene();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    initThree();
    bindEvents();
    updateToolbar();
    refreshUI();
    setTimeout(() => {
      if (localStorage.getItem(SCENE_KEY)) loadSceneFromStorage();
    }, 500);
  } catch (error) {
    console.error('[scene-composer/init]', error);
    showToast(`Não foi possível iniciar o editor 3D: ${error.message}`);
    $('#canvasLoader').classList.remove('show');
  }
});
