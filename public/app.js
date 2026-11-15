import { initGlobalPlayer } from './audio-player.js';
import { loadAudioTab } from './audio.js';
import { loadHumanoidsTab } from './humanoids.js?v=2.22';
import { loadSceneKitsTab } from './scenekits.js?v=2.22';
import { clearCategoryTree, initCategoryTree } from './category-tree.js?v=2.26';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const keys = {
  favorites: 'f3d_favorites', downloads: 'f3d_downloads', notes: 'f3d_notes',
  ratings: 'f3d_ratings', history: 'f3d_history', view: 'f3d_view',
};
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { toast('Não foi possível salvar. O armazenamento do navegador pode estar cheio.'); }
};
const config = {
  models: { label: 'Modelos em destaque', source: 'sketchfab', params: { type: 'models', downloadable: 'true' } },
  animations: { label: 'Animações', source: 'sketchfab', params: { type: 'models', downloadable: 'true', animated: 'true' } },
  'polyhaven-models': { label: 'Modelos Poly Haven', source: 'polyhaven', type: 'models' },
  textures: { label: 'Texturas Poly Haven', source: 'polyhaven', type: 'textures' },
  hdris: { label: 'HDRIs Poly Haven', source: 'polyhaven', type: 'hdris' },
  pbr: { label: 'PBR Library', source: 'ambientcg' },
  magias: { label: 'Magias & VFX', source: 'magias' },
  mixamo: { label: 'Animações Mixamo', source: 'mixamo' },
  creatures: { label: 'Criaturas animadas', source: 'creatures' },
  'pbr-editor': { label: 'Editor de materiais PBR', source: 'pbr-editor' },
  batch: { label: 'Otimizador em lote', source: 'batch' },
  audio: { label: 'Áudio', source: 'audio' },
  humanoids: { label: 'Humanoides riggados', source: 'humanoids' },
  scenekits: { label: 'Kits de Cenários', source: 'scenekits' },
  composer: { label: 'Scene Composer', source: 'composer' },
  'blender-addon': { label: 'Add-on para Blender', source: 'blender-addon' },
  optimizer: { label: 'Otimizador', source: 'optimizer' },
  acervo: { label: 'Minha biblioteca', source: 'acervo' },
};
const state = {
  tab: 'models', query: '', mine: '', sort: 'popular', cursor: null, loading: false,
  magiaQuery: '', magiaLabel: '',
  creatureQuery: '', creatureName: '', creatureCursor: null,
  requestId: 0,
  polyCache: {}, lastCards: [], favorites: read(keys.favorites, []),
  downloads: read(keys.downloads, []), notes: read(keys.notes, {}),
  ratings: read(keys.ratings, {}), history: read(keys.history, []),
  categoryNode: null, categoryPath: [], categorySource: '', categoryCat: '',
  audioSubTab: 'sfx', audioQuery: '',
};
let toastTimer;
let noteTimer;
let activeModalItem = null;

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
}
const CREATURE_CATEGORIES = [
  { emoji: '🐉', name: 'Dragões', query: 'dragon', desc: 'Dragões de fogo, gelo, orientais e ocidentais' },
  { emoji: '🐺', name: 'Lobos', query: 'wolf', desc: 'Lobos, lobisomens e canídeos' },
  { emoji: '👹', name: 'Goblins & Orcs', query: 'goblin orc', desc: 'Criaturas goblinoides hostis' },
  { emoji: '🐎', name: 'Cavalos', query: 'horse', desc: 'Cavalos, pégasos e unicórnios' },
  { emoji: '🐍', name: 'Serpentes', query: 'snake serpent', desc: 'Cobras, naga e serpentes gigantes' },
  { emoji: '🦅', name: 'Pássaros', query: 'bird eagle', desc: 'Águias, corvos e aves' },
  { emoji: '🐟', name: 'Peixes & Marinhos', query: 'fish sea creature', desc: 'Peixes, tubarões e criaturas marinhas' },
  { emoji: '🦂', name: 'Insetos', query: 'insect bug', desc: 'Besouros, escorpiões e artrópodes' },
  { emoji: '🐻', name: 'Ursos', query: 'bear', desc: 'Ursos, pandas e ursos polares' },
  { emoji: '🦁', name: 'Felinos', query: 'cat lion tiger', desc: 'Leões, tigres, panteras e gatos' },
  { emoji: '💀', name: 'Mortos-vivos', query: 'zombie skeleton', desc: 'Zumbis, esqueletos e liches' },
  { emoji: '🤖', name: 'Robôs & Mechs', query: 'robot mech', desc: 'Androides, mechs e drones' },
  { emoji: '👾', name: 'Aliens', query: 'alien', desc: 'Criaturas extraterrestres' },
  { emoji: '🦖', name: 'Dinossauros', query: 'dinosaur trex', desc: 'T-Rex, velociraptors e répteis pré-históricos' },
  { emoji: '🕷', name: 'Aranhas', query: 'spider', desc: 'Aranhas gigantes e aracnídeos' },
  { emoji: '🦇', name: 'Morcegos', query: 'bat', desc: 'Morcegos, vampiros e criaturas noturnas' },
  { emoji: '🐙', name: 'Kraken & Polvos', query: 'octopus kraken', desc: 'Krakens, polvos e cefalópodes' },
  { emoji: '👻', name: 'Fantasmas', query: 'ghost spirit', desc: 'Fantasmas, espíritos e assombrações' },
  { emoji: '🧚', name: 'Fadas & Mágicas', query: 'fairy magical', desc: 'Fadas, gnomos e criaturas feéricas' },
  { emoji: '👺', name: 'Ogros & Gigantes', query: 'ogre giant troll', desc: 'Ogros, gigantes, trolls e ciclopes' },
];
const CREATURE_SOURCES = [
  ['Quaternius — Ultimate Animated Animals', 'Animais animados com rig completo (CC0)', 'https://quaternius.com/packs/ultimateanimatedanimals.html', ['CC0', 'GLB']],
  ['Quaternius — Ultimate Animated Monsters', 'Monstros animados com animações variadas', 'https://quaternius.com/packs/ultimateanimatedmonsters.html', ['CC0', 'GLB']],
  ['Quaternius — Ultimate Animated Characters', 'Humanoides e criaturas animadas', 'https://quaternius.com/packs/ultimateanimatedcharacters.html', ['CC0', 'GLB']],
  ['Quaternius — Animals Pack', 'Animais low-poly, alguns animados', 'https://quaternius.com/packs/animatedanimals.html', ['CC0', 'GLB']],
  ['Quaternius — Fantasy Characters', 'Goblins, orcs, esqueletos e magos', 'https://quaternius.com/packs/ultimatefantasycharacters.html', ['CC0', 'GLB']],
  ['Kenney — Animated Characters', 'Personagens animados low-poly', 'https://kenney.nl/assets/animated-characters', ['CC0']],
  ['Kenney — Animated Characters 2', 'Mais personagens animados', 'https://kenney.nl/assets/animated-characters-2', ['CC0']],
  ['Kenney — Mini Characters', 'Personagens mini com rig', 'https://kenney.nl/assets/mini-characters', ['CC0']],
  ['Mixamo — Criaturas', 'Animações para rigs humanoides', 'https://www.mixamo.com', ['Grátis', 'FBX']],
  ['Poly Pizza — Creatures', 'Criaturas low-poly', 'https://poly.pizza/search/creature', ['CC0/CC-BY', 'GLB']],
  ['Sketchfab — Animated Creatures', 'Modelos animados baixáveis', 'https://sketchfab.com/search?type=models&q=creature&features=downloadable&animated=true&sort_by=-likeCount', ['Sketchfab']],
  ['OpenGameArt — Creatures', 'Modelos 3D de criaturas livres', 'https://opengameart.org/art-search-advanced?keys=creature&field_art_type_tid[]=10', ['CC0/CC-BY']],
];
function renderCreatureHome() {
  const categories = CREATURE_CATEGORIES.map(item => `<button class="creature-cat" type="button" data-creature-query="${esc(item.query)}" data-creature-name="${esc(`${item.emoji} ${item.name}`)}"><span class="creature-emoji">${item.emoji}</span><strong>${esc(item.name)}</strong><small>${esc(item.desc)}</small></button>`).join('');
  const sources = CREATURE_SOURCES.map(([name, desc, url, tags]) => `<a class="source-card" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><h3>${esc(name)}</h3><p>${esc(desc)}</p><div class="source-tags">${tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div></a>`).join('');
  $('#results').innerHTML = `<div class="creature-intro"><h3>Criaturas animadas</h3><p>Escolha uma categoria para buscar modelos animados baixáveis no Sketchfab. A disponibilidade e as licenças variam por modelo.</p></div><div class="creature-grid">${categories}</div><section class="curated-section"><h3>Pacotes e fontes selecionados</h3><div class="sources-grid">${sources}</div></section>`;
  state.lastCards = [];
  state.creatureCursor = null;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${CREATURE_CATEGORIES.length} categorias`;
}
async function loadCreatureCategory(append, requestId) {
  const params = new URLSearchParams({
    type: 'models', downloadable: 'true', animated: 'true', q: state.creatureQuery,
    count: '24', sort_by: state.sort === 'recent' ? '-publishedAt' : '-likeCount',
  });
  if (append && state.creatureCursor) {
    const next = new URL(state.creatureCursor);
    for (const [key, value] of next.searchParams) params.set(key, value);
  }
  const data = await request(`/api/sketchfab?${params}`);
  if (requestId !== state.requestId || state.tab !== 'creatures') return;
  const items = personalize(sketchfabItems(data.results || []));
  const heading = `<div class="creature-heading"><button class="chip" type="button" data-creatures-back>← Categorias</button><h3>${esc(state.creatureName)}</h3></div>`;
  const results = $('#results');
  if (!append) results.innerHTML = `${heading}${items.length ? items.map(card).join('') : '<div class="state">Nenhuma criatura encontrada. Tente outra categoria.</div>'}`;
  else if (items.length) results.insertAdjacentHTML('beforeend', items.map(card).join(''));
  state.lastCards = $$('.card', results);
  state.creatureCursor = data.next || null;
  $('#loadMoreWrap').hidden = !state.creatureCursor;
  $('#resultsInfo').textContent = `${state.lastCards.length} modelos · ${state.creatureName}`;
}
function showToolPage(title, description, href, button) {
  const icon = title.includes('PBR') ? '🎨' : title.includes('Scene Composer') ? '🎬' : title.includes('Blender') ? '🧩' : '▣';
  $('#results').innerHTML = `<section class="optimizer-intro"><div class="optimizer-icon" aria-hidden="true">${icon}</div><h3>${esc(title)}</h3><p>${esc(description)}</p><a class="button-primary" href="${esc(href)}">${esc(button)} →</a></section>`;
  state.lastCards = [];
  state.cursor = null;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = 'Ferramenta local';
}
function isFav(id) { return state.favorites.some(item => item.itemId === id); }
function isDownloaded(id) { return state.downloads.some(item => item.itemId === id); }
function isNoted(id) { return Boolean(state.notes[id]); }
function updateStats() {
  $('#statFavs').textContent = state.favorites.length;
  $('#statDownloads').textContent = state.downloads.length;
  $('#statNotes').textContent = Object.keys(state.notes).length;
  $('#favCount').textContent = state.favorites.length;
}
function itemFromCard(card) {
  try { return JSON.parse(card.dataset.item); } catch { return null; }
}
function badges(id) {
  return `${isDownloaded(id) ? '<span class="downloaded-badge">Baixado</span>' : ''}${isNoted(id) ? '<span class="noted-badge">Nota</span>' : ''}`;
}
function itemHref(item) {
  return item.source === 'sketchfab' || (item.source === 'polyhaven' && (item.type || 'models') === 'models')
    ? `/model/${encodeURIComponent(item.itemId)}`
    : esc(item.url || '#');
}
function itemTarget(item) {
  return item.source === 'mixamo' || item.source === 'ambientcg'
    || (item.source === 'polyhaven' && item.type && item.type !== 'models')
    ? 'target="_blank" rel="noopener"' : '';
}
function card(item) {
  const id = item.itemId;
  const title = esc(item.title);
  const thumb = item.thumb ? esc(item.thumb) : '';
  const author = esc(item.author || (item.source === 'polyhaven' ? 'Poly Haven' : ''));
  const license = esc(item.license || 'Grátis');
  const typeLabel = item.source === 'ambientcg' ? 'PBR · CC0'
    : item.type === 'textures' ? 'Textura'
      : item.type === 'hdris' ? 'HDRI' : item.source === 'polyhaven' ? 'CC0' : '';
  const detailHref = itemHref(item);
  const detailAttr = detailHref.startsWith('/model/') ? 'data-detail' : 'target="_blank" rel="noopener"';
  const pbrBadges = item.source === 'ambientcg' && item.pbrMaps?.length
    ? `<div class="pbr-badges">${item.pbrMaps.map(map => `<span class="pbr-badge">${esc(map.slice(0, 4))}</span>`).join('')}</div>` : '';
  return `<article class="card" data-id="${esc(id)}" data-item='${esc(JSON.stringify(item))}'>
    <div class="thumb">${thumb ? `<img src="${thumb}" alt="${title}" loading="lazy" referrerpolicy="no-referrer">` : '<div class="modal-placeholder">◇</div>'}
      ${badges(id)}<button class="fav-btn ${isFav(id) ? 'active' : ''}" data-fav aria-label="${isFav(id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">${isFav(id) ? '♥' : '♡'}</button>
      ${typeLabel ? `<span class="tag-badge">${esc(typeLabel)}</span>` : ''}
    </div><div class="card-body"><a class="card-title" href="${detailHref}" ${detailAttr}>${title}</a>
      ${pbrBadges}
      <div class="card-meta"><span class="card-author">${author || 'Acervo comunitário'}</span><span class="license-tag ${/cc0/i.test(license) ? '' : 'warn'}">${license}</span></div>
    </div></article>`;
}
function skeletons(count = 12) {
  return Array.from({ length: count }, () => '<div class="skeleton"><div class="skeleton-thumb"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div></div>').join('');
}
async function request(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`A solicitação falhou (${response.status}).`);
  return response.json();
}
async function getPoly(type) {
  if (!state.polyCache[type]) state.polyCache[type] = await request(`/api/polyhaven?t=${encodeURIComponent(type)}`);
  return state.polyCache[type];
}
function personalize(items) {
  return items.filter(item => {
    if (state.mine === 'favorites' && !isFav(item.itemId)) return false;
    if (state.mine === 'not-downloaded' && isDownloaded(item.itemId)) return false;
    return true;
  });
}
function updateGrid(items, append, total) {
  const results = $('#results');
  const html = items.map(card).join('');
  if (!append) results.innerHTML = html || '<div class="state">Nenhum resultado encontrado. Tente outra busca ou categoria.</div>';
  else results.insertAdjacentHTML('beforeend', html);
  state.lastCards = $$('.card', results);
  const count = state.lastCards.length;
  $('#resultsInfo').textContent = total == null ? `${count} ${count === 1 ? 'modelo' : 'modelos'}` : `${count} de ${total}`;
}
async function loadSketchfab(append, requestId) {
  const tab = state.tab;
  const query = state.query;
  const sort = state.sort;
  const cursor = state.cursor;
  const params = new URLSearchParams({
    ...config[tab].params,
    count: '24',
    sort_by: sort === 'recent' ? '-publishedAt' : '-likeCount',
  });
  if (query) params.set('q', query);
  if (append && cursor) {
    const next = new URL(cursor);
    for (const [key, value] of next.searchParams) params.set(key, value);
  }
  const data = await request(`/api/sketchfab?${params}`);
  if (requestId !== state.requestId || state.tab !== tab) return;
  const visible = personalize(sketchfabItems(data.results || []));
  updateGrid(visible, append);
  state.cursor = data.next || null;
  $('#loadMoreWrap').hidden = !state.cursor;
}
function polyItem(slug, value, type) {
  return {
    itemId: `ph_${slug}`, source: 'polyhaven', slug, type,
    title: value.name || slug,
    thumb: `https://cdn.polyhaven.com/asset_img/thumbs/${encodeURIComponent(slug)}.png?width=520`,
    url: `https://polyhaven.com/a/${encodeURIComponent(slug)}`, author: 'Poly Haven', license: 'CC0',
  };
}
function sketchfabItems(results = []) {
  return results.filter(model => model.thumbnails?.images?.length).map(model => {
    const thumbnail = model.thumbnails.images.find(image => image.width >= 400) || model.thumbnails.images[0];
    return {
      itemId: `sf_${model.uid}`, source: 'sketchfab', uid: model.uid, title: model.name,
      thumb: thumbnail.url, url: model.viewerUrl, author: model.user?.displayName || 'Sketchfab',
      license: model.license?.label || 'Grátis', animationCount: model.animationCount || 0,
    };
  });
}
async function loadPoly(type, append, requestId) {
  const tab = state.tab;
  const query = state.query;
  const sort = state.sort;
  const data = await getPoly(type);
  if (requestId !== state.requestId || state.tab !== tab) return;
  let entries = Object.entries(data);
  if (query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    entries = entries.filter(([slug, item]) => {
      const text = `${slug} ${item.name || ''} ${(item.categories || []).join(' ')} ${(item.tags || []).join(' ')}`.toLowerCase();
      return terms.every(term => text.includes(term));
    });
  }
  entries.sort(([, a], [, b]) => sort === 'recent'
    ? Number(b.date_published || 0) - Number(a.date_published || 0)
    : Number(b.download_count || 0) - Number(a.download_count || 0));
  let items = entries.map(([slug, value]) => polyItem(slug, value, type));
  items = personalize(items);
  const offset = append ? state.lastCards.length : 0;
  const page = items.slice(offset, offset + 24);
  updateGrid(page, append, items.length);
  $('#loadMoreWrap').hidden = offset + page.length >= items.length;
}
async function loadAmbientCG(append, requestId) {
  const tab = state.tab;
  const offset = append && Number.isFinite(state.cursor) ? state.cursor : 0;
  const params = new URLSearchParams({
    limit: '24',
    offset: String(offset),
    sort: state.sort === 'recent' ? 'Latest' : 'Popular',
  });
  if (state.query) params.set('q', state.query);
  const category = $('#ambientCategory').value;
  if (category) params.set('cat', category);

  const data = await request(`/api/ambientcg?${params}`);
  if (requestId !== state.requestId || state.tab !== tab) return;
  const items = (data.assets || []).map(asset => ({
    ...asset,
    category: asset.category || '',
    pbrMaps: asset.pbrMaps || [],
  }));
  updateGrid(personalize(items), append, data.total);
  const nextOffset = Number(data.offset ?? offset) + (data.assets || []).length;
  state.cursor = nextOffset < Number(data.total || 0) ? nextOffset : null;
  $('#loadMoreWrap').hidden = state.cursor === null;
}

const MAGIA_CATEGORIES = [
  { name: '🔥 Fogo', query: 'fire' },
  { name: '❄️ Gelo', query: 'ice' },
  { name: '⚡ Raio', query: 'lightning' },
  { name: '✨ Arcano', query: 'arcane' },
  { name: '🧪 Poções', query: 'potion' },
  { name: '🌀 Portais', query: 'portal' },
  { name: '💎 Cristais', query: 'crystal' },
  { name: '📜 Runas', query: 'rune' },
  { name: '🌟 Aura', query: 'aura' },
  { name: '💫 Partículas', query: 'particles' },
];
const MAGIA_CURATED = [
  { name: 'Kenney Particle Pack', desc: 'Pacote de partículas para criar efeitos visuais.', url: 'https://kenney.nl/assets/particle-pack', tags: ['CC0', 'VFX'] },
  { name: 'Kenney Fantasy UI', desc: 'Elementos de interface com tema de fantasia.', url: 'https://kenney.nl/assets/fantasy-ui-borders', tags: ['CC0', 'UI'] },
  { name: 'OpenGameArt VFX', desc: 'Recursos comunitários de efeitos visuais.', url: 'https://opengameart.org/art-search-advanced?keys=magic+effect&field_art_type_tid[]=3', tags: ['Comunidade', 'VFX'] },
  { name: 'VFXMed Free', desc: 'Pacotes gratuitos de efeitos para Unity.', url: 'https://vfxmed.com/free/', tags: ['Unity', 'Grátis'] },
  { name: 'Unity Particle Pack', desc: 'Pacote de partículas disponível na Asset Store.', url: 'https://assetstore.unity.com/packages/vfx/particles/particle-pack-127496', tags: ['Unity', 'Grátis'] },
  { name: 'Sketchfab: Magic', desc: 'Pesquise modelos de magia baixáveis e animados.', url: 'https://sketchfab.com/search?type=models&q=magic&features=downloadable&animated=true', tags: ['Sketchfab', 'Animado'] },
];
async function loadMagias(append, requestId) {
  const tab = state.tab;
  if (!state.magiaQuery) {
    const categories = MAGIA_CATEGORIES.map(category =>
      `<button class="magia-category" type="button" data-magia-query="${esc(category.query)}" data-magia-label="${esc(category.name)}">${esc(category.name)}</button>`
    ).join('');
    const sources = MAGIA_CURATED.map(source => `
      <a class="source-card" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">
        <h3>${esc(source.name)}</h3><p>${esc(source.desc)}</p>
        <div class="source-tags">${source.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
      </a>`).join('');
    $('#results').innerHTML = `
      <p class="magia-intro">Escolha um tema para buscar modelos animados baixáveis no Sketchfab. Confira a licença e as condições de uso na página de cada recurso.</p>
      <div class="magia-categories">${categories}</div>
      <section class="curated-section"><h3>Fontes e pacotes selecionados</h3><div class="sources-grid">${sources}</div></section>`;
    state.lastCards = [];
    state.cursor = null;
    $('#loadMoreWrap').hidden = true;
    $('#resultsInfo').textContent = 'Escolha uma categoria';
    return;
  }

  const params = new URLSearchParams({
    type: 'models',
    downloadable: 'true',
    animated: 'true',
    count: '24',
    sort_by: state.sort === 'recent' ? '-publishedAt' : '-likeCount',
    q: [state.magiaQuery, state.query].filter(Boolean).join(' '),
  });
  if (append && state.cursor) {
    const next = new URL(state.cursor);
    for (const [key, value] of next.searchParams) params.set(key, value);
  }
  const data = await request(`/api/sketchfab?${params}`);
  if (requestId !== state.requestId || state.tab !== tab) return;

  const items = personalize(sketchfabItems(data.results || []));
  const heading = `<div class="magia-intro"><button class="chip" type="button" data-magias-back>← Categorias</button><p>Resultados para <strong>${esc(state.magiaLabel)}</strong></p></div>`;
  const results = $('#results');
  if (!append) results.innerHTML = `${heading}${items.length ? '' : '<div class="state">Nenhum resultado para esta categoria. Escolha outro tema.</div>'}`;
  if (items.length) results.insertAdjacentHTML('beforeend', items.map(card).join(''));
  state.lastCards = $$('.card', results);
  $('#resultsInfo').textContent = `${state.lastCards.length} modelos · ${state.magiaLabel}`;
  state.cursor = data.next || null;
  $('#loadMoreWrap').hidden = !state.cursor;
}
function showOptimizerPage() {
  $('#results').innerHTML = `
    <section class="optimizer-intro">
      <div class="optimizer-icon" aria-hidden="true">⚡</div>
      <h3>Otimizador de malha 3D</h3>
      <p>Analise e otimize arquivos GLB/GLTF diretamente no seu navegador. Seus arquivos não são enviados ao servidor.</p>
      <a class="button-primary" href="/optimize">Abrir otimizador →</a>
    </section>`;
  state.lastCards = [];
  state.cursor = null;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = 'Processamento local';
}
async function loadMixamo(requestId) {
  const data = await request('/api/mixamo');
  if (requestId !== state.requestId || state.tab !== 'mixamo') return;
  const items = data.categories.flatMap(category => category.clips.map(clip => ({
    itemId: `mx_${category.id}_${clip.query.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    source: 'mixamo', title: clip.name, author: 'Mixamo · Adobe', license: 'Grátis',
    url: `https://www.mixamo.com/#/?page=1&query=${encodeURIComponent(clip.query)}&type=Motion%2CMotionPack`,
    thumb: '',
  })));
  const filtered = state.query ? items.filter(item => item.title.toLowerCase().includes(state.query.toLowerCase())) : items;
  updateGrid(personalize(filtered), false, filtered.length);
  $('#loadMoreWrap').hidden = true;
}
function loadLibrary() {
  const unique = new Map();
  [...state.favorites, ...state.downloads].forEach(item => unique.set(item.itemId, item));
  const items = [...unique.values()];
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${items.length} ${items.length === 1 ? 'item salvo' : 'itens salvos'}`;
  updateGrid(items, false, items.length);
  const library = $('#acervoResults');
  library.innerHTML = items.length
    ? items.slice(0, 8).map(card).join('')
    : '<div class="state">Sua biblioteca ainda está vazia. Salve um favorito para começar.</div>';
}
async function loadCatalog(append = false) {
  if (append && state.loading) return;
  const requestId = ++state.requestId;
  state.loading = true;
  const cfg = config[state.tab];
  $('#sectionTitle').innerHTML = state.categoryNode
    ? `${esc(state.categoryNode.emoji || '📁')} <span>${esc(state.categoryNode.name)}</span>`
    : `${esc(cfg.label.split(' ')[0])} <span>${esc(cfg.label.split(' ').slice(1).join(' '))}</span>`;
  const results = $('#results');
  const more = $('#loadMoreBtn');
  if (!append) {
    more.disabled = false;
    more.textContent = 'Carregar mais modelos';
    state.cursor = null;
    state.lastCards = [];
    if (state.tab !== 'acervo') results.innerHTML = skeletons();
    $('#loadMoreWrap').hidden = true;
  } else {
    more.disabled = true;
    more.textContent = 'Carregando…';
  }
  try {
    if (cfg.source === 'sketchfab') await loadSketchfab(append, requestId);
    else if (cfg.source === 'polyhaven') await loadPoly(cfg.type, append, requestId);
    else if (cfg.source === 'ambientcg') await loadAmbientCG(append, requestId);
    else if (cfg.source === 'magias') await loadMagias(append, requestId);
    else if (cfg.source === 'mixamo') await loadMixamo(requestId);
    else if (cfg.source === 'creatures') {
      if (!state.creatureQuery) renderCreatureHome();
      else await loadCreatureCategory(append, requestId);
    }
    else if (cfg.source === 'pbr-editor') showToolPage('Editor de materiais PBR', 'Visualize materiais em formas 3D, carregue mapas PBR e ajuste material, UV e iluminação.', '/pbr-editor', 'Abrir Editor PBR');
    else if (cfg.source === 'batch') showToolPage('Otimizador em lote', 'Otimize vários arquivos GLB/GLTF localmente e baixe os resultados em um ZIP.', '/batch-optimize', 'Abrir Batch Optimizer');
    else if (cfg.source === 'audio') {
      state.lastCards = [];
      state.cursor = null;
      $('#loadMoreWrap').hidden = true;
      await loadAudioTab(
        () => requestId === state.requestId && state.tab === 'audio',
        { subTab: state.audioSubTab, query: state.audioQuery },
      );
      $('#resultsInfo').textContent = 'SFX, música e ambientes';
    }
    else if (cfg.source === 'humanoids') {
      state.cursor = null;
      state.lastCards = [];
      $('#loadMoreWrap').hidden = true;
      await loadHumanoidsTab();
    }
    else if (cfg.source === 'scenekits') {
      state.cursor = null;
      state.lastCards = [];
      $('#loadMoreWrap').hidden = true;
      await loadSceneKitsTab();
    }
    else if (cfg.source === 'composer') showToolPage(
      'Scene Composer',
      'Monte cenas 3D no navegador: combine primitivas, modelos Poly Haven e arquivos locais, ajuste objetos e exporte o resultado em GLB ou JSON.',
      '/scene-composer',
      'Abrir Scene Composer',
    );
    else if (cfg.source === 'blender-addon') showToolPage(
      'Free3D Hub para Blender',
      'Pesquise modelos no Free3D Hub pelo Blender e importe modelos Poly Haven diretamente para a cena.',
      '/blender-addon',
      'Instalar add-on do Blender',
    );
    else if (cfg.source === 'optimizer') showOptimizerPage();
    else loadLibrary();
  } catch (error) {
    console.error(error);
    if (requestId === state.requestId) {
      if (!append) results.innerHTML = `<div class="error-box">Não foi possível carregar o catálogo. Verifique sua conexão e tente novamente.<button id="retryLoad">Tentar novamente</button></div>`;
      else toast(error.message);
      $('#loadMoreWrap').hidden = true;
    }
  } finally {
    if (requestId === state.requestId) {
      state.loading = false;
      more.disabled = false;
      more.textContent = 'Carregar mais modelos';
    }
  }
}
function toggleFavorite(item) {
  const index = state.favorites.findIndex(saved => saved.itemId === item.itemId);
  if (index >= 0) {
    state.favorites.splice(index, 1);
    toast('Removido dos favoritos');
  } else {
    state.favorites.unshift({ ...item, savedAt: Date.now() });
    toast('Adicionado aos favoritos');
  }
  write(keys.favorites, state.favorites);
  updateStats();
  refreshBadges();
  if ($('#favoritesDrawer').classList.contains('open')) renderFavorites();
  if (state.tab === 'acervo' || state.mine === 'favorites') loadCatalog();
}
function markDownloaded(item) {
  if (isDownloaded(item.itemId)) return toast('Este item já está no seu histórico');
  state.downloads.unshift({ ...item, downloadedAt: Date.now() });
  write(keys.downloads, state.downloads);
  updateStats();
  renderHistory();
  refreshBadges();
  toast('Download registrado no seu acervo');
}
function refreshBadges() {
  $$('.card').forEach(element => {
    const item = itemFromCard(element);
    if (!item) return;
    const favorite = $('[data-fav]', element);
    if (favorite) {
      favorite.classList.toggle('active', isFav(item.itemId));
      favorite.textContent = isFav(item.itemId) ? '♥' : '♡';
      favorite.setAttribute('aria-label', isFav(item.itemId) ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
    }
    const thumb = $('.thumb', element);
    thumb?.querySelectorAll('.downloaded-badge,.noted-badge').forEach(badge => badge.remove());
    if (thumb) thumb.insertAdjacentHTML('beforeend', badges(item.itemId));
  });
}
function renderHistory() {
  const list = $('#historicoList');
  $('#historicoInfo').textContent = state.downloads.length ? `${state.downloads.length} salvos` : 'Nenhum item';
  if (!state.downloads.length) {
    list.innerHTML = '<div class="state">Os modelos que você marcar como baixados aparecem aqui.</div>';
    return;
  }
  list.innerHTML = state.downloads.slice(0, 30).map(item => `<div class="history-row">
    ${item.thumb ? `<img src="${esc(item.thumb)}" alt="">` : '<div class="history-thumb"></div>'}
    <span class="history-name">${esc(item.title)}</span><small>${new Date(item.downloadedAt || Date.now()).toLocaleDateString('pt-BR')}</small>
    <a class="button-secondary" href="${itemHref(item)}" ${itemTarget(item)}>Abrir</a>
  </div>`).join('');
}
function renderFavorites() {
  const list = $('#favoritesList');
  if (!state.favorites.length) {
    list.innerHTML = '<div class="state">Seus favoritos aparecem aqui. Use o coração em um modelo para salvá-lo.</div>';
    return;
  }
  list.innerHTML = state.favorites.map(item => `<div class="favorite-row">
    ${item.thumb ? `<img src="${esc(item.thumb)}" alt="">` : '<div class="favorite-placeholder"></div>'}
    <a href="${itemHref(item)}" ${itemTarget(item)}>${esc(item.title)}</a>
    <button class="remove-fav" data-remove-fav="${esc(item.itemId)}" aria-label="Remover favorito">×</button>
  </div>`).join('');
}
function setDrawer(drawer, open) {
  drawer.classList.toggle('open', open);
  const anyOpen = $$('.drawer').some(item => item.classList.contains('open'));
  $('#scrim').classList.toggle('show', anyOpen);
  document.body.style.overflow = anyOpen ? 'hidden' : '';
}
function ratingHtml(itemId) {
  const rating = Number(state.ratings[itemId]) || 0;
  return [1, 2, 3, 4, 5].map(number => `<span data-rating="${number}" class="${number <= rating ? 'filled' : ''}">★</span>`).join('');
}
function formatBytes(bytes) {
  if (!Number.isFinite(Number(bytes)) || Number(bytes) <= 0) return '';
  const size = Number(bytes);
  return size >= 1024 * 1024 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(size / 1024)} KB`;
}
function openModal(cardElement) {
  const item = itemFromCard(cardElement);
  if (!item) return;
  activeModalItem = item;
  $('#modal').dataset.id = item.itemId;
  const viewer = $('#modalViewer');
  $('#modalTitle').textContent = item.title;
  $('#modalTypeLabel').textContent = item.source === 'ambientcg' ? 'VISUALIZAÇÃO DO MATERIAL PBR' : 'VISUALIZAÇÃO DO MODELO';
  const sizeLabel = item.source === 'ambientcg' ? formatBytes(item.downloadSize) : '';
  const mapsLabel = item.source === 'ambientcg' && item.pbrMaps?.length ? `<br>Mapas: ${item.pbrMaps.map(esc).join(' · ')}` : '';
  $('#modalInfo').innerHTML = `<strong>${esc(item.author || '')}</strong> · ${esc(item.license || 'Grátis')}${item.category ? ` · ${esc(item.category)}` : ''}${sizeLabel ? ` · ZIP 1K JPG: ${esc(sizeLabel)}` : ''}${mapsLabel}`;
  $('#modalLink').href = item.url || '#';
  $('#modalLink').textContent = item.source === 'ambientcg' ? 'Ver ambientCG ↗' : 'Ver original ↗';
  $('#modalDetailLink').href = itemHref(item);
  $('#modalDetailLink').target = itemTarget(item).includes('target=') ? '_blank' : '';
  $('#modalDetailLink').rel = itemTarget(item).includes('rel=') ? 'noopener' : '';
  $('#modalDetailLink').hidden = item.source === 'ambientcg';
  $('#modalDownloadBtn').href = '#';
  $('#modalDownloadBtn').removeAttribute('download');
  $('#modalDownloadBtn').textContent = 'Baixar arquivo GLB ↓';
  $('#modalSaveBtn').textContent = isFav(item.itemId) ? '♥ Salvo' : '♡ Salvar';
  $('#modalNote').value = state.notes[item.itemId] || '';
  $('#modalRating').innerHTML = ratingHtml(item.itemId);
  $('#modalDownloadRow').hidden = true;
  if (item.source === 'ambientcg') {
    viewer.innerHTML = item.thumb
      ? `<img src="${esc(item.thumb)}" alt="Prévia de ${esc(item.title)}">`
      : '<div class="modal-placeholder">Prévia indisponível</div>';
    if (item.downloadUrl) {
      const download = $('#modalDownloadBtn');
      download.href = item.downloadUrl;
      download.download = item.downloadFile || `${item.slug}_1K-JPG.zip`;
      download.textContent = 'Baixar material PBR (1K JPG) ↓';
      $('#modalDownloadRow').hidden = false;
    }
  } else if (item.source === 'sketchfab') {
    viewer.innerHTML = `<iframe title="${esc(item.title)}" src="https://sketchfab.com/models/${encodeURIComponent(item.uid)}/embed?autostart=1&ui_theme=dark" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  } else if (item.source === 'polyhaven' && (item.type || 'models') === 'models') {
    viewer.innerHTML = '<div class="modal-placeholder">Preparando visualização 3D…</div><model-viewer alt="" camera-controls auto-rotate shadow-intensity="1" environment-image="neutral"></model-viewer>';
    const model = $('model-viewer', viewer);
    model.alt = item.title;
    request(`/api/polyhaven-files?slug=${encodeURIComponent(item.slug)}`).then(files => {
      const asset = files.gltf?.['1k']?.glb || files.gltf?.['2k']?.glb || files.gltf?.['4k']?.glb;
      const gltf = files.gltf?.['1k']?.gltf || files.gltf?.['2k']?.gltf || files.gltf?.['4k']?.gltf;
      const modelUrl = asset?.url || (gltf ? `/api/polyhaven-gltf?slug=${encodeURIComponent(item.slug)}` : '');
      if (!modelUrl) throw new Error('3D preview unavailable');
      model.src = modelUrl;
      $('.modal-placeholder', viewer)?.remove();
      if (asset?.url) {
        const download = $('#modalDownloadBtn');
        download.href = asset.url;
        download.download = `${item.slug}.glb`;
        download.textContent = 'Baixar arquivo GLB ↓';
        $('#modalDownloadRow').hidden = false;
      }
    }).catch(() => {
      viewer.innerHTML = `<img src="${esc(item.thumb)}" alt="${esc(item.title)}">`;
      $('#modalDownloadRow').hidden = true;
    });
  } else if (item.thumb) {
    viewer.innerHTML = `<img src="${esc(item.thumb)}" alt="${esc(item.title)}">`;
  } else {
    viewer.innerHTML = `<div class="modal-placeholder"><strong>${esc(item.title)}</strong><p>Abra o Mixamo para escolher e baixar esta animação.</p></div>`;
  }
  $('#modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('#modal').classList.remove('open');
  $('#modalViewer').innerHTML = '';
  activeModalItem = null;
  document.body.style.overflow = $$('.drawer').some(drawer => drawer.classList.contains('open')) ? 'hidden' : '';
}
function saveNote(itemId, value) {
  if (value.trim()) state.notes[itemId] = value.trim();
  else delete state.notes[itemId];
  write(keys.notes, state.notes);
  updateStats();
  refreshBadges();
}
function exportData() {
  const data = {
    version: 1, exportedAt: new Date().toISOString(),
    favorites: state.favorites, downloads: state.downloads, notes: state.notes,
    ratings: state.ratings, history: state.history,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `meu-acervo-3d-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  toast('Backup exportado');
}
async function importData(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data !== 'object' || (!Array.isArray(data.favorites) && !Array.isArray(data.downloads))) {
      throw new Error('O arquivo não parece ser um backup válido do Acervo 3D.');
    }
    for (const [property, key] of [['favorites', keys.favorites], ['downloads', keys.downloads]]) {
      if (Array.isArray(data[property])) {
        state[property] = data[property].filter(item => item && typeof item.itemId === 'string');
        write(key, state[property]);
      }
    }
    for (const property of ['notes', 'ratings']) {
      if (data[property] && typeof data[property] === 'object' && !Array.isArray(data[property])) {
        state[property] = data[property];
        write(keys[property], state[property]);
      }
    }
    updateStats();
    renderHistory();
    loadCatalog();
    toast('Backup importado');
    setDrawer($('#dataDrawer'), false);
  } catch (error) {
    alert(`Não foi possível importar: ${error.message}`);
  }
}
function clearData() {
  if (!confirm('Apagar favoritos, downloads, notas e avaliações deste navegador? Esta ação não pode ser desfeita.')) return;
  for (const key of Object.values(keys)) localStorage.removeItem(key);
  state.favorites = [];
  state.downloads = [];
  state.notes = {};
  state.ratings = {};
  state.history = [];
  updateStats();
  renderHistory();
  renderFavorites();
  refreshBadges();
  loadCatalog();
  toast('Seus dados foram apagados');
  setDrawer($('#dataDrawer'), false);
}
function updateCatalogControls() {
  $('#ambientCategory').hidden = state.tab !== 'pbr';
  $('.search-wrap').hidden = ['audio', 'humanoids', 'scenekits', 'composer', 'blender-addon'].includes(state.tab);
  $('#filterChips').parentElement.hidden = ['magias', 'creatures', 'optimizer', 'pbr-editor', 'batch', 'audio', 'humanoids', 'scenekits', 'composer', 'blender-addon'].includes(state.tab);
  $('#sortSelect').hidden = ['optimizer', 'pbr-editor', 'batch', 'audio', 'humanoids', 'scenekits', 'composer', 'blender-addon'].includes(state.tab);
  $('.view-toggle').hidden = ['optimizer', 'pbr-editor', 'batch', 'audio', 'humanoids', 'scenekits', 'composer', 'blender-addon'].includes(state.tab);
}
function resetCategoryContext() {
  const hadCategory = Boolean(state.categoryNode);
  clearCategoryTree();
  if (hadCategory) {
    state.query = '';
    $('#searchInput').value = '';
  }
  state.categoryNode = null;
  state.categoryPath = [];
  state.categorySource = '';
  state.categoryCat = '';
  state.audioSubTab = 'sfx';
  state.audioQuery = '';
}
function selectCatalogCategory({ node, path, query, source, cat }) {
  const isRoot = node.id === 'root';
  const tabBySource = {
    sketchfab: 'models',
    scenekits: 'models',
    ambientcg: 'pbr',
    'polyhaven-hdri': 'hdris',
    'audio-sfx': 'audio',
    'audio-music': 'audio',
    'audio-ambient': 'audio',
  };
  state.categoryNode = isRoot ? null : node;
  state.categoryPath = path;
  state.categorySource = source;
  state.categoryCat = cat;
  state.tab = tabBySource[source] || 'models';
  state.query = isRoot ? '' : query;
  state.mine = '';
  state.magiaQuery = '';
  state.magiaLabel = '';
  state.creatureQuery = '';
  state.creatureName = '';
  state.creatureCursor = null;
  state.audioSubTab = source.startsWith('audio-') ? source.slice('audio-'.length) : 'sfx';
  state.audioQuery = source.startsWith('audio-') ? query : '';
  $('#searchInput').value = state.query;
  $('#ambientCategory').value = cat.toLowerCase();
  $$('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === state.tab));
  $$('.chip').forEach(chip => chip.classList.remove('active'));
  $('.chip[data-q=""]')?.classList.add('active');
  updateCatalogControls();
  loadCatalog();
}
function bindEvents() {
  $('#searchForm').addEventListener('submit', event => {
    event.preventDefault();
    const input = $('#searchInput');
    const query = input.value.trim();
    if (!query) return;
    resetCategoryContext();
    state.query = query;
    state.history = [query, ...state.history.filter(entry => entry !== query)].slice(0, 8);
    write(keys.history, state.history);
    $('#searchHistory').hidden = true;
    loadCatalog();
  });
  $('#searchInput').addEventListener('focus', () => {
    if (!state.history.length) return;
    $('#searchHistory').innerHTML = state.history.map(value => `<button class="history-option" data-history="${esc(value)}">⌕ &nbsp;${esc(value)}</button>`).join('');
    $('#searchHistory').hidden = false;
  });
  $('#searchHistory').addEventListener('click', event => {
    const button = event.target.closest('[data-history]');
    if (!button) return;
    resetCategoryContext();
    state.query = button.dataset.history;
    $('#searchInput').value = state.query;
    $('#searchHistory').hidden = true;
    loadCatalog();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.search-wrap')) $('#searchHistory').hidden = true;
  });
  $('#tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-tab]');
    if (!button) return;
    resetCategoryContext();
    state.tab = button.dataset.tab;
    state.mine = '';
    state.magiaQuery = '';
    state.magiaLabel = '';
    state.creatureQuery = '';
    state.creatureName = '';
    state.creatureCursor = null;
    $('#ambientCategory').value = '';
    updateCatalogControls();
    $$('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
    $$('.chip').forEach(chip => chip.classList.remove('active'));
    $('.chip[data-q=""]')?.classList.add('active');
    loadCatalog();
  });
  $$('.nav-link').forEach(link => link.addEventListener('click', () => {
    if (link.hash !== '#acervo') return;
    resetCategoryContext();
    state.tab = 'acervo';
    state.magiaQuery = '';
    state.magiaLabel = '';
    $('#ambientCategory').value = '';
    updateCatalogControls();
    $$('.tab').forEach(tab => tab.classList.toggle('active', tab.dataset.tab === 'acervo'));
    loadCatalog();
  }));
  $('#filterChips').addEventListener('click', event => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    resetCategoryContext();
    $$('.chip').forEach(item => item.classList.toggle('active', item === chip));
    state.mine = chip.dataset.mine || '';
    if (chip.dataset.q !== undefined) {
      state.query = chip.dataset.q;
      $('#searchInput').value = state.query;
    }
    loadCatalog();
  });
  $('#sortSelect').addEventListener('change', event => {
    state.sort = event.target.value;
    loadCatalog();
  });
  $('#ambientCategory').addEventListener('change', () => loadCatalog());
  $$('.view-btn').forEach(button => button.addEventListener('click', () => {
    const view = button.dataset.view;
    write(keys.view, view);
    $$('.view-btn').forEach(item => item.classList.toggle('active', item === button));
    $('#results').dataset.view = view;
    $('#acervoResults').dataset.view = view;
  }));
  const savedView = read(keys.view, 'grid');
  $('#results').dataset.view = savedView;
  $('#acervoResults').dataset.view = savedView;
  $$('.view-btn').forEach(button => button.classList.toggle('active', button.dataset.view === savedView));
  $('#loadMoreBtn').addEventListener('click', () => {
    if (state.tab === 'humanoids') window.__loadHumanoidMore?.();
    else if (state.tab === 'scenekits') window.__loadSceneKitMore?.();
    else loadCatalog(true);
  });
  $('#results').addEventListener('click', event => {
    const magiaCategory = event.target.closest('[data-magia-query]');
    if (magiaCategory) {
      state.magiaQuery = magiaCategory.dataset.magiaQuery;
      state.magiaLabel = magiaCategory.dataset.magiaLabel;
      loadCatalog();
      return;
    }
    if (event.target.closest('[data-magias-back]')) {
      state.magiaQuery = '';
      state.magiaLabel = '';
      loadCatalog();
      return;
    }
    const creatureCategory = event.target.closest('[data-creature-query]');
    if (creatureCategory) {
      state.creatureQuery = creatureCategory.dataset.creatureQuery;
      state.creatureName = creatureCategory.dataset.creatureName;
      state.creatureCursor = null;
      loadCatalog();
      return;
    }
    if (event.target.closest('[data-creatures-back]')) {
      state.creatureQuery = '';
      state.creatureName = '';
      state.creatureCursor = null;
      loadCatalog();
      return;
    }
    if (event.target.closest('[data-fav]')) {
      event.preventDefault();
      event.stopPropagation();
      const item = itemFromCard(event.target.closest('.card'));
      if (item) toggleFavorite(item);
      return;
    }
    if (event.target.closest('[data-detail]')) return;
    if (event.target.closest('a')) return;
    const element = event.target.closest('.card');
    if (element) openModal(element);
  });
  $('#acervoResults').addEventListener('click', event => {
    if (event.target.closest('[data-fav]')) {
      event.preventDefault();
      event.stopPropagation();
      const item = itemFromCard(event.target.closest('.card'));
      if (item) toggleFavorite(item);
      return;
    }
    if (event.target.closest('a')) return;
    const element = event.target.closest('.card');
    if (element) openModal(element);
  });
  $('#results').addEventListener('click', event => {
    if (event.target.id === 'retryLoad') loadCatalog();
  });
  $('#modalClose').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', event => { if (event.target === $('#modal')) closeModal(); });
  $('#modalSaveBtn').addEventListener('click', () => {
    if (activeModalItem) {
      toggleFavorite(activeModalItem);
      $('#modalSaveBtn').textContent = isFav(activeModalItem.itemId) ? '♥ Salvo' : '♡ Salvar';
    }
  });
  $('#modal').addEventListener('click', event => {
    if (event.target.id === 'modalAttributionBtn') {
      const item = activeModalItem;
      if (item) {
        const attribution = item.source === 'sketchfab'
          ? `"${item.title}" por ${item.author}, licença ${item.license} — Sketchfab: ${item.url}`
          : `"${item.title}" por ${item.author || 'Acervo comunitário'}, licença ${item.license || '—'} — ${item.url}`;
        navigator.clipboard?.writeText(attribution).then(() => toast('Crédito copiado')).catch(() => toast('Não foi possível copiar o crédito.'));
      }
    }
  });
  $('#modal').addEventListener('click', event => {
    if (event.target.id === 'modalDownloadBtn') {
      const item = activeModalItem;
      if (item) markDownloaded(item);
    }
  });
  $('#modalRating').addEventListener('click', event => {
    const star = event.target.closest('[data-rating]');
    const itemId = $('#modal').dataset.id;
    if (!star || !itemId) return;
    const selected = Number(star.dataset.rating);
    if (state.ratings[itemId] === selected) delete state.ratings[itemId];
    else state.ratings[itemId] = selected;
    write(keys.ratings, state.ratings);
    $('#modalRating').innerHTML = ratingHtml(itemId);
  });
  $('#modalNote').addEventListener('input', () => {
    const itemId = $('#modal').dataset.id;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => { if (itemId) saveNote(itemId, $('#modalNote').value); }, 450);
  });
  $('#btnFavorites').addEventListener('click', () => { renderFavorites(); setDrawer($('#favoritesDrawer'), true); });
  $('#btnData').addEventListener('click', () => setDrawer($('#dataDrawer'), true));
  $('#drawerClose').addEventListener('click', () => setDrawer($('#favoritesDrawer'), false));
  $('#dataDrawerClose').addEventListener('click', () => setDrawer($('#dataDrawer'), false));
  $('#scrim').addEventListener('click', () => $$('.drawer').forEach(drawer => setDrawer(drawer, false)));
  $('#favoritesList').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-fav]');
    if (!button) return;
    const item = state.favorites.find(entry => entry.itemId === button.dataset.removeFav);
    if (item) toggleFavorite(item);
  });
  $('#btnExportData').addEventListener('click', exportData);
  $('#btnImportData').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (file) importData(file);
    event.target.value = '';
  });
  $('#btnClearAll').addEventListener('click', clearData);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
      $$('.drawer').forEach(drawer => setDrawer(drawer, false));
    }
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      event.preventDefault();
      $('#searchInput').focus();
    }
  });
}
function registerServiceWorker() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Offline support unavailable:', error));
  }
}
function boot() {
  updateStats();
  renderHistory();
  initGlobalPlayer();
  bindEvents();
  initCategoryTree({ onSelect: selectCatalogCategory });
  registerServiceWorker();
  if (!state.categoryNode) loadCatalog();
}
document.addEventListener('DOMContentLoaded', boot);
