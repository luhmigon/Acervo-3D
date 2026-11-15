import { getCurrent, isPlaying, pause as pauseAudio, play as playAudio } from './audio-player.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const categories = {
  sfx: [
    ['', 'Todos'], ['weapons', '⚔️ Armas'], ['magic', '✨ Magias'], ['ui', '🖱️ Interface'],
    ['impacts', '💥 Impactos'], ['pickup', '💰 Coletas'], ['ambient', '🌿 Ambientes'], ['sci-fi', '🚀 Sci-Fi'],
  ],
  music: [
    ['', 'Todas'], ['epic', '🔥 Épica'], ['battle', '⚔️ Batalha'], ['ambient', '🌅 Ambiente'],
    ['happy', '😊 Alegre'], ['sad', '😢 Triste'], ['tense', '😰 Tensa'],
  ],
  ambient: [
    ['', 'Todos'], ['forest', '🌲 Floresta'], ['city', '🏙️ Cidade'], ['weather', '🌧️ Clima'], ['interior', '🏛️ Interior'],
  ],
};
const labels = { sfx: 'Efeitos sonoros', music: 'Música', ambient: 'Ambientes' };
const state = {
  subTab: 'sfx',
  query: '',
  category: '',
  curated: [],
  totals: { sfx: 0, music: 0, ambient: 0 },
  results: [],
  next: null,
  searchRequest: 0,
  activeCheck: () => true,
};
let bound = false;

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}
function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}
async function fetchJSON(url) {
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `A solicitação falhou (${response.status}).`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
function renderShell() {
  const tabs = Object.entries(labels).map(([id, name]) =>
    `<button class="audio-subtab ${state.subTab === id ? 'active' : ''}" type="button" data-audio-tab="${id}">${id === 'sfx' ? '🔊' : id === 'music' ? '🎵' : '🌿'} ${name}<span class="audio-badge">${state.totals[id] || '…'}</span></button>`
  ).join('');
  const catButtons = categories[state.subTab].map(([id, name]) =>
    `<button class="audio-cat ${state.category === id ? 'active' : ''}" type="button" data-audio-category="${escapeHtml(id)}">${name}</button>`
  ).join('');
  $('#results').innerHTML = `
    <div class="audio-browser">
      <nav class="audio-subtabs" aria-label="Tipo de áudio">${tabs}</nav>
      <form class="audio-search-wrap" id="audioSearchForm">
        <input id="audioSearch" class="audio-search" type="search" maxlength="120" placeholder="Buscar áudio: espada, trovão, floresta…" value="${escapeHtml(state.query)}" aria-label="Buscar áudio">
        <button class="button-primary" type="submit">Buscar</button>
      </form>
      <div class="audio-cats" id="audioCategories">${catButtons}</div>
      <div class="audio-content" id="audioContent"><div class="state">Carregando curadoria…</div></div>
    </div>`;
  if (!bound) {
    bound = true;
    $('#results').addEventListener('click', handleClick);
    $('#results').addEventListener('submit', handleSubmit);
  }
}
function updateTabCounts() {
  $$('.audio-subtab').forEach(button => {
    const count = state.totals[button.dataset.audioTab];
    $('.audio-badge', button).textContent = count || 0;
  });
}
function renderCurated(notice = '') {
  const container = $('#audioContent');
  if (!container) return;
  const query = state.query.toLocaleLowerCase('pt-BR');
  const items = state.curated.filter(item => {
    const matchesCategory = !state.category || item.cat?.includes(state.category);
    const searchable = `${item.name} ${item.desc} ${(item.tags || []).join(' ')} ${(item.cat || []).join(' ')}`.toLocaleLowerCase('pt-BR');
    return matchesCategory && (!query || searchable.includes(query));
  });
  const noticeHtml = notice
    ? `<div class="audio-callout warning">${escapeHtml(notice)}</div>` : '';
  if (!items.length) {
    container.innerHTML = `${noticeHtml}<div class="state">Nenhuma fonte encontrada. Tente outra busca ou categoria.</div>`;
    return;
  }
  container.innerHTML = `${noticeHtml}
    <div class="audio-callout"><b>${items.length} fontes nesta seleção.</b> As licenças e permissões variam; confira os termos na página de cada recurso. ${state.subTab !== 'ambient' ? 'Pesquise para tentar encontrar áudios individuais.' : ''}</div>
    <div class="sources-grid">${items.map(item => {
      const url = safeHttpUrl(item.url);
      return `<a class="source-card audio-source-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
        <h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.desc)}</p>
        <div class="source-tags">${(item.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
      </a>`;
    }).join('')}</div>`;
}
function renderLiveResults(data, append = false) {
  const container = $('#audioContent');
  if (!container) return;
  const incoming = data.results || [];
  state.results = append ? [...state.results, ...incoming] : incoming;
  state.next = data.next || null;
  const notice = state.subTab === 'sfx'
    ? `Resultados do Freesound para “${state.query}”. Confira a licença individual antes de usar.`
    : `Resultados do Pixabay para “${state.query}”. Confira os termos de uso de cada áudio.`;
  const cards = state.results.map(item => {
    const url = safeHttpUrl(item.url);
    const hasPreview = Boolean(safeHttpUrl(item.preview));
    const current = getCurrent()?.id === String(item.id ?? item.itemId);
    return `<article class="audio-card" data-audio-id="${escapeHtml(item.id ?? item.itemId)}">
      <button class="audio-card-play" type="button" data-audio-play="${escapeHtml(item.id ?? item.itemId)}" ${hasPreview ? '' : 'disabled'} aria-label="${current && isPlaying() ? 'Pausar' : 'Tocar'} prévia">${current && isPlaying() ? '⏸' : '▶'}</button>
      <div class="audio-card-info"><strong class="audio-card-title">${escapeHtml(item.title)}</strong>
        <div class="audio-card-meta">${escapeHtml(item.author || 'Autor desconhecido')} · ${Number(item.duration) ? `${Number(item.duration).toFixed(1)} s` : 'duração indisponível'} · ${escapeHtml(item.license || '')}</div>
        <div class="audio-card-waveform" aria-hidden="true">${item.thumb && safeHttpUrl(item.thumb) ? `<img src="${escapeHtml(safeHttpUrl(item.thumb))}" alt="" loading="lazy">` : '<span></span>'}</div>
      </div>
      ${url ? `<a class="audio-action-btn" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir fonte">↗</a>` : ''}
    </article>`;
  }).join('');
  container.innerHTML = `<div class="audio-callout">${escapeHtml(notice)}${data.total ? ` Encontrados: ${Number(data.total).toLocaleString('pt-BR')}.` : ''}</div>
    <div class="audio-results">${cards || '<div class="state">Nenhum áudio encontrado.</div>'}</div>
    ${state.next ? '<div class="audio-more"><button type="button" class="button-secondary" data-audio-more>Carregar mais</button></div>' : ''}`;
}
async function searchLive(append = false) {
  const container = $('#audioContent');
  if (!container) return;
  const requestId = ++state.searchRequest;
  container.innerHTML = '<div class="state">Buscando áudios…</div>';
  const params = new URLSearchParams({
    q: state.query || (state.subTab === 'sfx' ? 'ambient' : 'music'),
    pageSize: '24',
    perPage: '24',
    page: String(append
      ? (typeof state.next === 'number' ? state.next : Number(new URL(state.next).searchParams.get('page')) || 1)
      : 1),
  });
  if (state.subTab === 'sfx') {
    params.set('minDuration', '0');
    params.set('maxDuration', '120');
    params.set('sort', 'score');
  } else {
    params.set('type', 'music');
  }
  try {
    const endpoint = state.subTab === 'sfx' ? '/api/audio/freesound' : '/api/audio/pixabay';
    const data = await fetchJSON(`${endpoint}?${params}`);
    if (requestId !== state.searchRequest || !state.activeCheck()) return;
    renderLiveResults(data, append);
  } catch (error) {
    if (requestId !== state.searchRequest || !state.activeCheck()) return;
    if (error.status === 503 || error.status === 502) {
      renderCurated(error.data?.message || 'Busca externa indisponível; mostrando a curadoria estática.');
      return;
    }
    container.innerHTML = `<div class="audio-callout warning">${escapeHtml(error.message)}<button class="button-secondary" type="button" data-audio-retry> Tentar novamente</button></div>`;
  }
}
async function loadCurated() {
  const requestId = ++state.searchRequest;
  $('#audioContent').innerHTML = '<div class="state">Carregando curadoria…</div>';
  try {
    const data = await fetchJSON(`/api/audio/curated?type=${encodeURIComponent(state.subTab)}`);
    if (requestId !== state.searchRequest || !state.activeCheck()) return;
    state.curated = data.items || [];
    state.totals = data.totals || state.totals;
    updateTabCounts();
    if (state.query && state.subTab !== 'ambient') await searchLive();
    else renderCurated();
  } catch (error) {
    if (requestId !== state.searchRequest || !state.activeCheck()) return;
    $('#audioContent').innerHTML = `<div class="audio-callout warning">Não foi possível carregar a curadoria: ${escapeHtml(error.message)}</div>`;
  }
}
export async function loadAudioTab(isCurrent = () => true, options = {}) {
  state.activeCheck = isCurrent;
  if (['sfx', 'music', 'ambient'].includes(options.subTab)) state.subTab = options.subTab;
  if (typeof options.query === 'string') state.query = options.query;
  state.category = '';
  state.results = [];
  state.next = null;
  renderShell();
  await loadCurated();
}
async function handleSubmit(event) {
  if (event.target.id !== 'audioSearchForm') return;
  event.preventDefault();
  state.query = $('#audioSearch').value.trim();
  state.next = null;
  state.results = [];
  if (state.subTab === 'ambient') renderCurated();
  else if (state.query) await searchLive();
  else renderCurated();
}
async function handleClick(event) {
  const tab = event.target.closest('[data-audio-tab]');
  if (tab) {
    state.subTab = tab.dataset.audioTab;
    state.query = '';
    state.category = '';
    state.results = [];
    state.next = null;
    renderShell();
    await loadCurated();
    return;
  }
  const category = event.target.closest('[data-audio-category]');
  if (category) {
    state.searchRequest++;
    state.results = [];
    state.next = null;
    state.category = category.dataset.audioCategory;
    $$('.audio-cat').forEach(button => button.classList.toggle('active', button === category));
    renderCurated();
    return;
  }
  if (event.target.closest('[data-audio-retry]')) {
    await searchLive();
    return;
  }
  if (event.target.closest('[data-audio-more]')) {
    await searchLive(true);
    return;
  }
  const playButton = event.target.closest('[data-audio-play]');
  if (!playButton) return;
  const item = state.results.find(result => String(result.id ?? result.itemId) === playButton.dataset.audioPlay);
  if (!item) return;
  try {
    if (getCurrent()?.id === String(item.id ?? item.itemId) && isPlaying()) pauseAudio();
    else await playAudio(item);
    renderLiveResults({ results: state.results, total: undefined, next: state.next });
  } catch (error) {
    $('#audioContent').insertAdjacentHTML('afterbegin', `<div class="audio-callout warning">${escapeHtml(error.message)}</div>`);
  }
}
