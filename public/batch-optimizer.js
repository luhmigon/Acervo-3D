const $ = selector => document.querySelector(selector);
const MAX_SIZE = 100 * 1024 * 1024;
const state = { files: [], running: false, lib: null, results: [] };
let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function safeName(name) {
  return name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/^\.+/, '') || 'model';
}
async function loadLib() {
  if (state.lib) return state.lib;
  const [core, extensions, functions, meshoptModule] = await Promise.all([
    import('https://esm.sh/@gltf-transform/core@4.5.1?target=es2022'),
    import('https://esm.sh/@gltf-transform/extensions@4.5.1?target=es2022'),
    import('https://esm.sh/@gltf-transform/functions@4.5.1?target=es2022'),
    import('https://esm.sh/meshoptimizer@0.20.0'),
  ]);
  const io = new core.WebIO().registerExtensions(extensions.ALL_EXTENSIONS);
  const simplifier = meshoptModule.MeshoptSimplifier || meshoptModule.default?.MeshoptSimplifier;
  if (!simplifier) throw new Error('A biblioteca de simplificação não ficou disponível.');
  state.lib = { core, extensions, functions, io, simplifier, dracoPromise: null };
  return state.lib;
}
async function registerDraco(lib) {
  if (!lib.dracoPromise) {
    lib.dracoPromise = (async () => {
      const imported = await import('https://esm.sh/draco3dgltf@1.5.7');
      const draco = imported.default || imported;
      const locateFile = file => new URL(file, 'https://cdn.jsdelivr.net/npm/draco3dgltf@1.5.7/').href;
      const [decoder, encoder] = await Promise.all([
        draco.createDecoderModule({ locateFile }),
        draco.createEncoderModule({ locateFile }),
      ]);
      lib.io.registerDependencies({ 'draco3d.decoder': decoder, 'draco3d.encoder': encoder });
    })();
  }
  try { await lib.dracoPromise; }
  catch (error) { lib.dracoPromise = null; throw error; }
}
function normalizedPath(value) {
  const parts = [];
  for (const part of value.replace(/\\/g, '/').split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop();
    else parts.push(part);
  }
  return parts.join('/');
}
function pathOf(file) { return file.webkitRelativePath || file.name; }
async function getResource(uri, modelFile, files) {
  if (uri.startsWith('data:')) return new Uint8Array(await (await fetch(uri)).arrayBuffer());
  if (/^(?:[a-z]+:)?\/\//i.test(uri) || uri.startsWith('/')) {
    throw new Error('O GLTF referencia arquivos remotos. Selecione os recursos locais ou use GLB.');
  }
  let decoded;
  try { decoded = decodeURIComponent(uri); } catch { throw new Error(`Caminho de recurso inválido: ${uri}`); }
  const modelPath = pathOf(modelFile).replace(/\\/g, '/');
  const dir = modelPath.includes('/') ? modelPath.slice(0, modelPath.lastIndexOf('/') + 1) : '';
  const expected = normalizedPath(`${dir}${decoded}`);
  let matches = files.filter(file => file !== modelFile && normalizedPath(pathOf(file)) === expected);
  if (!matches.length) {
    const basename = decoded.split(/[\\/]/).pop();
    matches = files.filter(file => file !== modelFile && pathOf(file).replace(/\\/g, '/').split('/').pop() === basename);
  }
  if (matches.length !== 1) throw new Error(`Não foi possível localizar de forma única o recurso “${decoded}”.`);
  return new Uint8Array(await matches[0].arrayBuffer());
}
async function readDocument(entry, lib) {
  const file = entry.file;
  if (/\.glb$/i.test(file.name)) return lib.io.readBinary(new Uint8Array(await file.arrayBuffer()));
  let json;
  try { json = JSON.parse(await file.text()); } catch { throw new Error('O arquivo GLTF não contém JSON válido.'); }
  if (json.asset?.version !== '2.0') throw new Error('Apenas arquivos glTF 2.0 são aceitos.');
  const references = new Set([
    ...(json.buffers || []).map(item => item.uri),
    ...(json.images || []).map(item => item.uri),
  ].filter(uri => uri && !uri.startsWith('data:')));
  const resources = Object.create(null);
  let inputSize = file.size;
  for (const uri of references) {
    resources[uri] = await getResource(uri, file, entry.sourceFiles);
    inputSize += resources[uri].byteLength;
  }
  entry.beforeSize = inputSize;
  return lib.io.readJSON({ json, resources });
}
function renderQueue() {
  $('#config').hidden = !state.files.length;
  $('#queue').hidden = !state.files.length;
  $('#fileCount').textContent = state.files.length;
  $('#fileList').innerHTML = state.files.map((entry, index) => {
    const stateLabel = { pending: 'Aguardando', processing: 'Processando…', success: '✓ Sucesso', error: 'Erro' }[entry.status];
    return `<div class="batch-file"><div class="batch-file-info"><div class="batch-file-name">${escapeHtml(entry.file.name)}</div><div class="batch-file-meta">${formatBytes(entry.file.size)}${entry.afterSize ? ` → ${formatBytes(entry.afterSize)}` : ''}${entry.error ? ` · ${escapeHtml(entry.error)}` : ''}</div></div><span class="batch-status ${entry.status}">${stateLabel}</span>${entry.status !== 'processing' && !state.running ? `<button class="remove-entry" data-remove="${index}" aria-label="Remover arquivo">×</button>` : ''}</div>`;
  }).join('');
  $('#process').disabled = state.running || !state.files.some(entry => ['pending', 'error'].includes(entry.status));
  $('#clearQueue').disabled = state.running;
}
function addFiles(fileList) {
  const files = [...fileList];
  const models = files.filter(file => /\.(glb|gltf)$/i.test(file.name));
  if (!models.length) { toast('Selecione pelo menos um arquivo GLB ou GLTF.'); return; }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_SIZE) { toast('A seleção ultrapassa o limite total de 100 MB.'); return; }
  const known = new Set(state.files.map(entry => entry.file));
  for (const file of models) {
    if (known.has(file)) continue;
    known.add(file);
    state.files.push({ file, sourceFiles: files, status: 'pending', beforeSize: file.size, afterSize: 0, output: null, error: '' });
  }
  $('#summary').classList.remove('show');
  renderQueue();
}
function readOptions() {
  return {
    basic: $('#basic').checked,
    simplify: $('#simplify').checked,
    draco: $('#draco').checked,
    ratio: Number($('#ratio').value) / 100,
  };
}
async function optimizeEntry(entry) {
  entry.status = 'processing';
  entry.error = '';
  renderQueue();
  const lib = await loadLib();
  const doc = await readDocument(entry, lib);
  const options = readOptions();
  const transforms = [];
  if (options.basic) transforms.push(lib.functions.dedup(), lib.functions.prune(), lib.functions.weld(), lib.functions.resample(), lib.functions.flatten());
  if (options.simplify) {
    await lib.simplifier.ready;
    transforms.push(lib.functions.simplify({ simplifier: lib.simplifier, ratio: options.ratio, error: .001 }));
  }
  if (options.draco) {
    await registerDraco(lib);
    transforms.push(lib.functions.draco({ method: 'edgebreaker' }));
  }
  if (transforms.length) await doc.transform(...transforms);
  const output = await lib.io.writeBinary(doc);
  entry.output = output;
  entry.afterSize = output.byteLength;
  entry.status = 'success';
}
function createResultFiles() {
  const usedNames = new Set();
  state.results = state.files.filter(entry => entry.status === 'success').map(entry => {
    const base = safeName(entry.file.name.replace(/\.(glb|gltf)$/i, ''));
    let name = `${base}-optimized.glb`;
    let suffix = 2;
    while (usedNames.has(name.toLowerCase())) name = `${base}-optimized-${suffix++}.glb`;
    usedNames.add(name.toLowerCase());
    return { name, data: entry.output };
  });
}
function showSummary() {
  const success = state.files.filter(entry => entry.status === 'success');
  const failed = state.files.filter(entry => entry.status === 'error');
  const before = success.reduce((sum, entry) => sum + entry.beforeSize, 0);
  const after = success.reduce((sum, entry) => sum + entry.afterSize, 0);
  $('#sumTotal').textContent = state.files.length;
  $('#sumSuccess').textContent = success.length;
  $('#sumFailed').textContent = failed.length;
  $('#sumBefore').textContent = formatBytes(before);
  $('#sumAfter').textContent = formatBytes(after);
  $('#sumSaved').textContent = `${before ? ((1 - after / before) * 100).toFixed(1) : 0}%`;
  $('#summary').classList.add('show');
  $('#downloadZip').disabled = !success.length;
}
async function processAll() {
  if (state.running) return;
  if (!$('#basic').checked && !$('#simplify').checked && !$('#draco').checked) {
    toast('Selecione ao menos uma opção de otimização.'); return;
  }
  state.running = true;
  $('#summary').classList.remove('show');
  const queue = state.files.filter(entry => ['pending', 'error'].includes(entry.status));
  const concurrency = Number($('#concurrency').value);
  let cursor = 0;
  const worker = async () => {
    while (cursor < queue.length) {
      const entry = queue[cursor++];
      try { await optimizeEntry(entry); }
      catch (error) { entry.status = 'error'; entry.error = error.message || 'Falha ao otimizar'; }
      renderQueue();
    }
  };
  toast(`Otimizando ${queue.length} arquivo(s)…`);
  try {
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
    createResultFiles();
    showSummary();
    toast('Processamento concluído');
  } finally {
    state.running = false;
    renderQueue();
  }
}
async function downloadZip() {
  if (!state.results.length) return;
  try {
    toast('Montando arquivo ZIP…');
    const imported = await import('https://esm.sh/jszip@3.10.1');
    const zip = new imported.default();
    state.results.forEach(result => zip.file(result.name, result.data));
    const report = state.files.map(entry => ({
      name: entry.file.name,
      status: entry.status,
      beforeBytes: entry.beforeSize,
      afterBytes: entry.afterSize,
      error: entry.error || null,
    }));
    zip.file('report.json', JSON.stringify(report, null, 2));
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `batch-optimized-${new Date().toISOString().slice(0, 10)}.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('ZIP baixado');
  } catch (error) { toast(`Falha ao criar ZIP: ${error.message}`); }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function applyPreset(name) {
  const presets = {
    light: { basic: true, simplify: false, draco: false, ratio: 95 },
    medium: { basic: true, simplify: true, draco: false, ratio: 50 },
    aggressive: { basic: true, simplify: true, draco: true, ratio: 25 },
  };
  const preset = presets[name];
  $('#basic').checked = preset.basic;
  $('#simplify').checked = preset.simplify;
  $('#draco').checked = preset.draco;
  $('#ratio').value = preset.ratio;
  $('#ratioLabel').textContent = `${preset.ratio}%`;
}
function bindEvents() {
  const input = $('#files');
  const dropzone = $('#dropzone');
  dropzone.addEventListener('click', event => { if (!event.target.closest('button')) input.click(); });
  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragover', 'dragenter'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault(); dropzone.classList.add('dragover');
  }));
  ['dragleave', 'drop'].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault(); dropzone.classList.remove('dragover');
  }));
  dropzone.addEventListener('drop', event => { if (event.dataTransfer?.files) addFiles(event.dataTransfer.files); });
  $('#addMore').addEventListener('click', () => input.click());
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-preset]').forEach(item => item.classList.toggle('active', item === button));
    applyPreset(button.dataset.preset);
  }));
  $('#ratio').addEventListener('input', event => { $('#ratioLabel').textContent = `${event.target.value}%`; });
  $('#concurrency').addEventListener('input', event => { $('#concurrencyLabel').textContent = event.target.value; });
  $('#fileList').addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button || state.running) return;
    state.files.splice(Number(button.dataset.remove), 1);
    renderQueue();
  });
  $('#clearQueue').addEventListener('click', () => {
    if (state.running || !state.files.length || !confirm('Limpar toda a fila?')) return;
    state.files = [];
    state.results = [];
    $('#summary').classList.remove('show');
    renderQueue();
  });
  $('#process').addEventListener('click', processAll);
  $('#downloadZip').addEventListener('click', downloadZip);
}
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  applyPreset('medium');
});
