const $ = selector => document.querySelector(selector);
const MAX_SELECTION_SIZE = 100 * 1024 * 1024;
let currentFile = null;
let currentFiles = [];
let currentDocument = null;
let gltfLib = null;
let previewUrl = '';
let outputUrl = '';
let toastTimer;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function showError(message) {
  const error = $('#optError');
  error.textContent = message;
  error.hidden = false;
  $('#optResult').hidden = true;
}

function updateProgress(percent, message) {
  $('#optProgress').hidden = false;
  $('#optProgressBar').value = percent;
  $('#optProgressText').textContent = message;
}

async function loadGltfTransform() {
  if (gltfLib) return gltfLib;
  updateProgress(5, 'Carregando ferramentas de processamento…');
  const [core, extensions, functions, meshoptModule] = await Promise.all([
    import('https://esm.sh/@gltf-transform/core@4.5.1?target=es2022'),
    import('https://esm.sh/@gltf-transform/extensions@4.5.1?target=es2022'),
    import('https://esm.sh/@gltf-transform/functions@4.5.1?target=es2022'),
    import('https://esm.sh/meshoptimizer@0.20.0'),
  ]);
  const io = new core.WebIO()
    .setLogger(core.Logger.DEFAULT_INSTANCE)
    .registerExtensions(extensions.ALL_EXTENSIONS);
  gltfLib = {
    core,
    io,
    functions,
    simplifier: meshoptModule.MeshoptSimplifier || meshoptModule.default?.MeshoptSimplifier,
    dracoPromise: null,
  };
  if (!gltfLib.simplifier) throw new Error('A biblioteca de simplificação não ficou disponível.');
  return gltfLib;
}

async function registerDraco(lib) {
  if (!lib.dracoPromise) {
    lib.dracoPromise = (async () => {
      const dracoModule = await import('https://esm.sh/draco3dgltf@1.5.7');
      const draco = dracoModule.default || dracoModule;
      const locateDracoFile = file => new URL(file, 'https://cdn.jsdelivr.net/npm/draco3dgltf@1.5.7/').href;
      const [decoder, encoder] = await Promise.all([
        draco.createDecoderModule({ locateFile: locateDracoFile }),
        draco.createEncoderModule({ locateFile: locateDracoFile }),
      ]);
      lib.io.registerDependencies({
        'draco3d.decoder': decoder,
        'draco3d.encoder': encoder,
      });
    })();
  }
  try {
    await lib.dracoPromise;
  } catch (error) {
    lib.dracoPromise = null;
    throw error;
  }
}

function normalizedPath(value) {
  const stack = [];
  for (const part of value.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

function filePath(file) {
  return file.webkitRelativePath || file.name;
}

async function resourceBytes(uri, modelFile, files) {
  if (uri.startsWith('data:')) {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Um recurso embutido no GLTF não pôde ser lido.');
    return new Uint8Array(await response.arrayBuffer());
  }
  if (/^(?:[a-z]+:)?\/\//i.test(uri) || uri.startsWith('/')) {
    throw new Error('Este GLTF aponta para recursos remotos. Por privacidade, o otimizador não os busca; selecione arquivos locais ou exporte um GLB.');
  }

  let decodedUri;
  try { decodedUri = decodeURIComponent(uri); }
  catch { throw new Error(`O caminho de recurso “${uri}” é inválido.`); }
  const modelPath = filePath(modelFile).replace(/\\/g, '/');
  const directory = modelPath.includes('/') ? modelPath.slice(0, modelPath.lastIndexOf('/') + 1) : '';
  const expected = normalizedPath(`${directory}${decodedUri}`);
  const candidates = files.filter(file => file !== modelFile && normalizedPath(filePath(file)) === expected);
  const basename = decodedUri.split('/').pop();
  const matches = candidates.length
    ? candidates
    : files.filter(file => file !== modelFile && filePath(file).replace(/\\/g, '/').split('/').pop() === basename);
  if (matches.length !== 1) {
    throw new Error(`Não foi possível localizar de forma única o recurso “${basename}”. Selecione a pasta completa do GLTF.`);
  }
  return new Uint8Array(await matches[0].arrayBuffer());
}

async function readGltf(file, files, lib) {
  const io = lib.io;
  const extension = file.name.split('.').pop().toLowerCase();
  let doc;
  if (extension === 'glb') {
    doc = await io.readBinary(new Uint8Array(await file.arrayBuffer()));
  } else {
    if (extension !== 'gltf') throw new Error('Selecione um arquivo .glb ou .gltf.');
    let json;
    try { json = JSON.parse(await file.text()); }
    catch { throw new Error('O arquivo GLTF não contém JSON válido.'); }
    if (json.asset?.version !== '2.0') throw new Error('Apenas arquivos glTF 2.0 são aceitos.');

    const uris = new Set([
      ...(json.buffers || []).map(buffer => buffer.uri),
      ...(json.images || []).map(image => image.uri),
    ].filter(Boolean));
    const resources = Object.create(null);
    for (const uri of uris) resources[uri] = await resourceBytes(uri, file, files);
    doc = await io.readJSON({ json, resources });
  }
  return doc.setLogger(lib.core.Logger.DEFAULT_INSTANCE);
}

function countDocument(doc) {
  let vertices = 0;
  let triangles = 0;
  const meshes = doc.getRoot().listMeshes();
  for (const mesh of meshes) {
    for (const primitive of mesh.listPrimitives()) {
      const positions = primitive.getAttribute('POSITION');
      const mode = primitive.getMode();
      if (positions) vertices += positions.getCount();
      if (mode === undefined || mode === 4) {
        const indices = primitive.getIndices();
        triangles += indices ? indices.getCount() / 3 : (positions?.getCount() || 0) / 3;
      }
    }
  }
  return {
    meshes: meshes.length,
    vertices,
    triangles: Math.round(triangles),
    materials: doc.getRoot().listMaterials().length,
    textures: doc.getRoot().listTextures().length,
  };
}

function setStats(file, doc) {
  const stats = countDocument(doc);
  $('#statSize').textContent = formatBytes(file.size);
  $('#statMeshes').textContent = stats.meshes.toLocaleString('pt-BR');
  $('#statVerts').textContent = stats.vertices.toLocaleString('pt-BR');
  $('#statTris').textContent = stats.triangles.toLocaleString('pt-BR');
  $('#statMats').textContent = stats.materials.toLocaleString('pt-BR');
  $('#statTex').textContent = stats.textures.toLocaleString('pt-BR');
}

function containsDracoCompressedPrimitive(binary) {
  const bytes = new Uint8Array(binary.buffer, binary.byteOffset, binary.byteLength);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    if (chunkType === 0x4e4f534a) {
      const json = JSON.parse(new TextDecoder().decode(bytes.subarray(offset + 8, offset + 8 + chunkLength)).trim());
      return (json.meshes || []).some(mesh =>
        (mesh.primitives || []).some(primitive => primitive.extensions?.KHR_draco_mesh_compression)
      );
    }
    offset += 8 + chunkLength;
  }
  return false;
}

async function handleFiles(fileList) {
  const files = [...fileList];
  const models = files.filter(file => /\.(glb|gltf)$/i.test(file.name));
  if (models.length !== 1) {
    showError('Selecione exatamente um arquivo .glb ou .gltf e, se necessário, seus arquivos auxiliares.');
    return;
  }
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize > MAX_SELECTION_SIZE) {
    showError('A seleção ultrapassa o limite de 100 MB.');
    return;
  }

  $('#btnOptimize').disabled = true;
  $('#optError').hidden = true;
  $('#optResult').hidden = true;
  $('#optimizerWorkspace').hidden = false;
  $('#fileSummary').hidden = true;
  currentFile = null;
  currentFiles = [];
  currentDocument = null;
  updateProgress(3, 'Lendo arquivo local…');
  try {
    const lib = await loadGltfTransform();
    const doc = await readGltf(models[0], files, lib);
    const preview = await lib.io.writeBinary(doc);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(new Blob([preview], { type: 'model/gltf-binary' }));
    $('#preview').src = previewUrl;
    currentFile = models[0];
    currentFiles = files;
    currentDocument = doc;
    setStats(currentFile, doc);
    const extraCount = files.length - 1;
    const summary = $('#fileSummary');
    summary.textContent = extraCount
      ? `${currentFile.name} carregado com ${extraCount} arquivo(s) auxiliar(es).`
      : `${currentFile.name} carregado.`;
    summary.hidden = false;
    $('#optProgress').hidden = true;
  } catch (error) {
    console.error(error);
    $('#optProgress').hidden = true;
    showError(`Não foi possível abrir o modelo: ${error.message}`);
  } finally {
    $('#btnOptimize').disabled = false;
  }
}

async function optimize() {
  if (!currentFile || !currentDocument) {
    showError('Selecione um arquivo antes de iniciar.');
    return;
  }
  const basic = $('#optBasic').checked;
  const simplify = $('#optSimplify').checked;
  const draco = $('#optDraco').checked;
  if (!basic && !simplify && !draco) {
    showError('Selecione pelo menos uma opção de otimização.');
    return;
  }

  $('#btnOptimize').disabled = true;
  $('#optError').hidden = true;
  $('#optResult').hidden = true;
  try {
    updateProgress(10, 'Preparando o modelo…');
    const lib = await loadGltfTransform();
    const doc = await readGltf(currentFile, currentFiles, lib);
    const transforms = [];

    if (basic) {
      updateProgress(35, 'Removendo duplicatas e dados não usados…');
      transforms.push(lib.functions.dedup(), lib.functions.prune(), lib.functions.weld());
    }
    if (simplify) {
      updateProgress(60, 'Simplificando a malha…');
      await lib.simplifier.ready;
      transforms.push(lib.functions.simplify({
        simplifier: lib.simplifier,
        ratio: Number($('#simplifyRange').value) / 100,
        error: 0.001,
      }));
    }
    if (draco) {
      updateProgress(75, 'Configurando compressão Draco…');
      await registerDraco(lib);
      transforms.push(lib.functions.draco({ method: 'edgebreaker' }));
    }

    await doc.transform(...transforms);
    updateProgress(90, 'Gerando arquivo GLB…');
    const output = await lib.io.writeBinary(doc);
    if (draco && !containsDracoCompressedPrimitive(output)) {
      throw new Error('O codificador Draco não conseguiu comprimir nenhuma malha. Tente outro modelo ou desmarque Draco.');
    }
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = URL.createObjectURL(new Blob([output], { type: 'model/gltf-binary' }));

    const baseName = currentFile.name.replace(/\.(glb|gltf)$/i, '');
    const afterSize = output.byteLength;
    const difference = currentFile.size - afterSize;
    const percentage = currentFile.size ? (difference / currentFile.size) * 100 : 0;
    const result = $('#optResult');
    result.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = 'Otimização concluída';
    const summary = document.createElement('p');
    summary.textContent = `Antes: ${formatBytes(currentFile.size)} · Depois: ${formatBytes(afterSize)} · ${difference >= 0 ? `Economia de ${percentage.toFixed(1)}%` : `Arquivo ${Math.abs(percentage).toFixed(1)}% maior`}`;
    const download = document.createElement('a');
    download.className = 'button-primary';
    download.href = outputUrl;
    download.download = `${baseName}-optimized.glb`;
    download.textContent = 'Baixar GLB otimizado';
    result.append(title, summary, download);
    result.hidden = false;
    updateProgress(100, 'Pronto.');
    showToast('Arquivo GLB otimizado e pronto para baixar.');
  } catch (error) {
    console.error(error);
    showError(`Não foi possível otimizar o modelo: ${error.message}`);
  } finally {
    $('#btnOptimize').disabled = false;
    setTimeout(() => { $('#optProgress').hidden = true; }, 1200);
  }
}

function bindEvents() {
  const input = $('#fileInput');
  const folderInput = $('#folderInput');
  $('#browseFiles').addEventListener('click', () => input.click());
  $('#browseFolder').addEventListener('click', () => folderInput.click());
  input.addEventListener('change', () => {
    if (input.files?.length) handleFiles(input.files);
    input.value = '';
  });
  folderInput.addEventListener('change', () => {
    if (folderInput.files?.length) handleFiles(folderInput.files);
    folderInput.value = '';
  });
  const dropzone = $('#dropzone');
  dropzone.addEventListener('dragover', event => {
    event.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', event => {
    if (!dropzone.contains(event.relatedTarget)) dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', event => {
    event.preventDefault();
    dropzone.classList.remove('dragover');
    if (event.dataTransfer?.files?.length) handleFiles(event.dataTransfer.files);
  });
  $('#optSimplify').addEventListener('change', event => {
    $('#simplifySlider').hidden = !event.target.checked;
  });
  $('#simplifyRange').addEventListener('input', event => {
    $('#simplifyPct').textContent = `${event.target.value}%`;
  });
  $('#btnOptimize').addEventListener('click', optimize);
}

window.addEventListener('beforeunload', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  if (outputUrl) URL.revokeObjectURL(outputUrl);
});
document.addEventListener('DOMContentLoaded', bindEvents);
