import * as THREE from 'https://esm.sh/three@0.160.0';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

const $ = selector => document.querySelector(selector);
const envUrls = {
  studio: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
  sunset: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr',
  night: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonless_golf_1k.hdr',
  forest: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr',
  city: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr',
  warehouse: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
};
const state = {
  scene: null, camera: null, renderer: null, controls: null, mesh: null, material: null,
  textures: {}, slot: null, environment: null, background: null, envRequest: 0,
};
let toastTimer;
function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}
function disposeObject(object) {
  object.traverse?.(child => {
    if (child.geometry) child.geometry.dispose();
  });
}
function createGeometry(name) {
  return ({
    sphere: () => new THREE.SphereGeometry(1, 64, 48),
    cube: () => new THREE.BoxGeometry(1.6, 1.6, 1.6, 24, 24, 24),
    plane: () => new THREE.PlaneGeometry(2.4, 2.4, 96, 96),
    cylinder: () => new THREE.CylinderGeometry(1, 1, 2, 48, 16),
    torusknot: () => new THREE.TorusKnotGeometry(.9, .32, 180, 24),
  }[name] || (() => new THREE.SphereGeometry(1, 64, 48)))();
}
function buildShape(name) {
  if (state.mesh) {
    state.scene.remove(state.mesh);
    disposeObject(state.mesh);
  }
  const geometry = createGeometry(name);
  if (geometry.attributes.uv) geometry.setAttribute('uv1', geometry.attributes.uv.clone());
  state.mesh = new THREE.Mesh(geometry, state.material);
  if (name === 'plane') state.mesh.rotation.x = -Math.PI / 2;
  state.mesh.position.y = name === 'plane' ? 0 : .15;
  state.scene.add(state.mesh);
}
async function loadEnvironment(name) {
  const requestId = ++state.envRequest;
  try {
    const { RGBELoader } = await import('https://esm.sh/three@0.160.0/examples/jsm/loaders/RGBELoader.js');
    const hdr = await new Promise((resolve, reject) => new RGBELoader().load(envUrls[name], resolve, undefined, reject));
    if (requestId !== state.envRequest) { hdr.dispose(); return; }
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const generator = new THREE.PMREMGenerator(state.renderer);
    const nextEnvironment = generator.fromEquirectangular(hdr).texture;
    generator.dispose();
    hdr.dispose();
    if (state.environment) state.environment.dispose();
    state.environment = nextEnvironment;
    state.scene.environment = nextEnvironment;
    toast(`Ambiente ${name} carregado`);
  } catch (error) {
    if (requestId === state.envRequest) toast(`Não foi possível carregar o HDRI: ${error.message}`);
  }
}
function loadTexture(slot, file) {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(url, texture => {
      const old = state.textures[slot];
      if (old) { old.texture.dispose(); URL.revokeObjectURL(old.url); }
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      if (slot === 'map') texture.colorSpace = THREE.SRGBColorSpace;
      state.textures[slot] = { texture, url };
      state.material[slot] = texture;
      if (slot === 'aoMap' && state.mesh?.geometry.attributes.uv) {
        state.mesh.geometry.setAttribute('uv1', state.mesh.geometry.attributes.uv.clone());
      }
      state.material.needsUpdate = true;
      applyUV();
      const element = $(`[data-map="${slot}"]`);
      element.classList.add('filled');
      element.querySelector('small').textContent = 'Carregado';
      resolve();
    }, undefined, error => { URL.revokeObjectURL(url); reject(error); });
  });
}
function applyUV() {
  const repeat = [Number($('#tileX').value), Number($('#tileY').value)];
  const offset = [Number($('#offX').value), Number($('#offY').value)];
  const rotation = Number($('#rotation').value) * Math.PI / 180;
  Object.values(state.textures).forEach(({ texture }) => {
    texture.repeat.set(...repeat);
    texture.offset.set(...offset);
    texture.center.set(.5, .5);
    texture.rotation = rotation;
  });
}
function setBackground(mode) {
  if (state.background) {
    state.background.dispose();
    state.background = null;
  }
  if (mode === 'dark') {
    state.scene.background = new THREE.Color(0x08090d);
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const context = canvas.getContext('2d');
  if (mode === 'gradient') {
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#202637');
    gradient.addColorStop(1, '#08090d');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    const cell = 32;
    for (let y = 0; y < canvas.height; y += cell) {
      for (let x = 0; x < canvas.width; x += cell) {
        context.fillStyle = ((x + y) / cell) % 2 ? '#20232b' : '#111319';
        context.fillRect(x, y, cell, cell);
      }
    }
  }
  state.background = new THREE.CanvasTexture(canvas);
  state.background.colorSpace = THREE.SRGBColorSpace;
  state.scene.background = state.background;
}
function snapshot() {
  return {
    version: 1,
    values: Object.fromEntries(['tileX', 'tileY', 'offX', 'offY', 'rotation', 'roughness', 'metalness', 'normalScale', 'displaceScale', 'aoIntensity', 'envIntensity', 'exposure']
      .map(id => [id, Number($(`#${id}`).value)])),
    env: $('#env').value, background: $('#background').value,
  };
}
function applyPreset(preset) {
  if (!preset?.values || typeof preset.values !== 'object') throw new Error('Preset inválido');
  for (const [id, value] of Object.entries(preset.values)) {
    const input = $(`#${id}`);
    if (!input || !Number.isFinite(Number(value))) continue;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
  if (envUrls[preset.env]) {
    $('#env').value = preset.env;
    loadEnvironment(preset.env);
  }
  if (['dark', 'gradient', 'checker'].includes(preset.background)) {
    $('#background').value = preset.background;
    setBackground(preset.background);
  }
  toast('Preset carregado');
}
const presetKey = 'f3d_pbr_presets';
function getPresets() {
  try {
    const parsed = JSON.parse(localStorage.getItem(presetKey) || '[]');
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.name === 'string' && item.values) : [];
  } catch { return []; }
}
function renderPresets() {
  const container = $('#presets');
  const presets = getPresets();
  container.innerHTML = presets.length ? presets.map((preset, index) =>
    `<div class="pbr-preset"><button type="button" data-load-preset="${index}">${escapeHtml(preset.name)}</button><button type="button" data-delete-preset="${index}" aria-label="Excluir preset">×</button></div>`
  ).join('') : '<p class="dropzone-hint">Nenhum preset salvo.</p>';
}
function storePresets(presets) {
  try {
    localStorage.setItem(presetKey, JSON.stringify(presets));
    return true;
  } catch (error) {
    toast(`Não foi possível salvar presets: ${error.message}`);
    return false;
  }
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
async function loadCustomModel(file) {
  $('#loading').classList.add('show');
  const url = URL.createObjectURL(file);
  try {
    const gltf = await new Promise((resolve, reject) => new GLTFLoader().load(url, resolve, undefined, reject));
    gltf.scene.traverse(child => {
      if (!child.isMesh) return;
      child.material = state.material;
      if (child.geometry.attributes.uv && !child.geometry.attributes.uv1) {
        child.geometry.setAttribute('uv1', child.geometry.attributes.uv.clone());
      }
    });
    if (state.mesh) {
      state.scene.remove(state.mesh);
      disposeObject(state.mesh);
    }
    state.mesh = gltf.scene;
    state.scene.add(state.mesh);
    const bounds = new THREE.Box3().setFromObject(state.mesh);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    state.mesh.position.sub(center);
    const maxDimension = Math.max(size.x, size.y, size.z, .1);
    state.camera.position.set(0, maxDimension * .3, maxDimension * 2.2);
    state.controls.target.set(0, 0, 0);
    state.controls.update();
    toast('Modelo carregado');
  } catch (error) {
    toast(`Falha ao carregar o GLB: ${error.message}`);
  } finally {
    URL.revokeObjectURL(url);
    $('#loading').classList.remove('show');
  }
}
function bindRange(id, callback, format = value => Number(value).toFixed(2)) {
  const input = $(`#${id}`);
  input.addEventListener('input', () => {
    input.nextElementSibling.textContent = format(input.value);
    callback(Number(input.value));
  });
}
function init() {
  const canvas = $('#canvas3d');
  const wrap = canvas.parentElement;
  state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  state.renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  state.scene = new THREE.Scene();
  state.scene.background = new THREE.Color(0x08090d);
  state.camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, .1, 1000);
  state.camera.position.set(0, 1, 4);
  state.controls = new OrbitControls(state.camera, canvas);
  state.controls.enableDamping = true;
  state.controls.autoRotate = true;
  [[0xffffff, 1.5, 3, 5, 3], [0xffffff, .7, -3, 2, -3], [0x9983ff, .8, 0, -3, 5]].forEach(([color, intensity, x, y, z]) => {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(x, y, z);
    state.scene.add(light);
  });
  state.scene.add(new THREE.AmbientLight(0xffffff, .2));
  state.material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .5 });
  buildShape('sphere');
  const resize = () => {
    state.camera.aspect = wrap.clientWidth / Math.max(wrap.clientHeight, 1);
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(wrap.clientWidth, wrap.clientHeight);
  };
  window.addEventListener('resize', resize);
  const animate = () => {
    requestAnimationFrame(animate);
    state.controls.update();
    state.renderer.render(state.scene, state.camera);
  };
  animate();
  loadEnvironment('studio');

  document.querySelectorAll('[data-shape]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-shape]').forEach(item => item.classList.toggle('active', item === button));
    buildShape(button.dataset.shape);
  }));
  $('#rotate').addEventListener('click', event => {
    state.controls.autoRotate = !state.controls.autoRotate;
    event.currentTarget.classList.toggle('active', state.controls.autoRotate);
  });
  $('#wireframe').addEventListener('click', event => {
    state.material.wireframe = !state.material.wireframe;
    event.currentTarget.classList.toggle('active', state.material.wireframe);
  });
  $('#uploadModel').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb';
    input.addEventListener('change', () => { if (input.files[0]) loadCustomModel(input.files[0]); });
    input.click();
  });
  $('#screenshot').addEventListener('click', () => {
    try {
      state.renderer.render(state.scene, state.camera);
      const anchor = document.createElement('a');
      anchor.href = canvas.toDataURL('image/png');
      anchor.download = `pbr-preview-${Date.now()}.png`;
      anchor.click();
    } catch (error) { toast(`Não foi possível gerar a imagem: ${error.message}`); }
  });
  document.querySelectorAll('.pbr-slot').forEach(element => element.addEventListener('click', () => {
    state.slot = element.dataset.map;
    $('#textureUpload').click();
  }));
  $('#textureUpload').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (file && state.slot) {
      try { await loadTexture(state.slot, file); toast('Textura carregada'); }
      catch (error) { toast(`Falha ao carregar textura: ${error.message}`); }
    }
    event.target.value = '';
  });
  $('#clearMaps').addEventListener('click', () => {
    for (const [slot, entry] of Object.entries(state.textures)) {
      state.material[slot] = null;
      entry.texture.dispose();
      URL.revokeObjectURL(entry.url);
      $(`[data-map="${slot}"]`).classList.remove('filled');
      $(`[data-map="${slot}"] small`).textContent = 'Vazio';
    }
    state.textures = {};
    state.material.needsUpdate = true;
    toast('Mapas limpos');
  });
  $('#ambientcg').addEventListener('click', async () => {
    const id = prompt('ID do material ambientCG (ex.: Wood067):')?.trim();
    if (!id) return;
    try {
      const result = await fetch(`/api/ambientcg?q=${encodeURIComponent(id)}&limit=10`).then(response => {
        if (!response.ok) throw new Error(`Solicitação falhou (${response.status})`);
        return response.json();
      });
      const asset = result.assets?.find(item => item.slug.toLowerCase() === id.toLowerCase()) || result.assets?.[0];
      if (!asset?.downloadUrl) throw new Error('Material ou arquivo de download não encontrado.');
      window.open(asset.downloadUrl, '_blank', 'noopener');
      toast(`Download de ${asset.title} aberto; carregue os mapas extraídos individualmente.`);
    } catch (error) { toast(error.message); }
  });
  ['tileX', 'tileY', 'offX', 'offY', 'rotation'].forEach(id => bindRange(id, applyUV, value =>
    id.startsWith('off') ? Number(value).toFixed(2) : id === 'rotation' ? `${value}°` : Number(value).toFixed(1)));
  bindRange('roughness', value => { state.material.roughness = value; });
  bindRange('metalness', value => { state.material.metalness = value; });
  bindRange('normalScale', value => state.material.normalScale.set(value, value));
  bindRange('displaceScale', value => { state.material.displacementScale = value; });
  bindRange('aoIntensity', value => { state.material.aoMapIntensity = value; });
  bindRange('envIntensity', value => { state.scene.environmentIntensity = value; });
  bindRange('exposure', value => { state.renderer.toneMappingExposure = value; });
  $('#env').addEventListener('change', event => loadEnvironment(event.target.value));
  $('#background').addEventListener('change', event => setBackground(event.target.value));
  $('#savePreset').addEventListener('click', () => {
    const name = prompt('Nome do preset:', 'Meu material')?.trim();
    if (!name) return;
    const presets = getPresets();
    presets.push({ ...snapshot(), name });
    if (storePresets(presets)) {
      renderPresets();
      toast('Preset salvo');
    }
  });
  $('#presets').addEventListener('click', event => {
    const loadIndex = event.target.closest('[data-load-preset]');
    const deleteIndex = event.target.closest('[data-delete-preset]');
    const presets = getPresets();
    if (loadIndex) {
      try { applyPreset(presets[Number(loadIndex.dataset.loadPreset)]); } catch (error) { toast(error.message); }
    }
    if (deleteIndex) {
      presets.splice(Number(deleteIndex.dataset.deletePreset), 1);
      if (storePresets(presets)) renderPresets();
    }
  });
  $('#exportPreset').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ ...snapshot(), name: 'Preset exportado' }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = `pbr-preset-${Date.now()}.json`; anchor.click();
    URL.revokeObjectURL(url);
  });
  $('#importPreset').addEventListener('click', () => $('#presetFile').click());
  $('#presetFile').addEventListener('change', async event => {
    try {
      if (event.target.files[0]) applyPreset(JSON.parse(await event.target.files[0].text()));
    } catch (error) { toast(`Importação falhou: ${error.message}`); }
    event.target.value = '';
  });
  renderPresets();
}
document.addEventListener('DOMContentLoaded', () => {
  try { init(); }
  catch (error) { toast(`Não foi possível iniciar o editor 3D: ${error.message}`); }
});
window.addEventListener('beforeunload', () => {
  Object.values(state.textures).forEach(entry => {
    entry.texture.dispose();
    URL.revokeObjectURL(entry.url);
  });
  state.environment?.dispose();
  state.background?.dispose();
});
