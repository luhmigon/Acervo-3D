const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const categories = [
  ['castelo', '🏰', 'Castelo medieval', 'Castelos, fortalezas e muralhas'],
  ['vila-medieval', '🏘️', 'Vila medieval', 'Vilas, casas e tavernas'],
  ['masmorra', '💀', 'Masmorra', 'Masmorras, catacumbas e calabouços'],
  ['floresta', '🌲', 'Floresta', 'Florestas, árvores e natureza'],
  ['neve', '❄️', 'Neve / Ártico', 'Neve, gelo e regiões polares'],
  ['deserto', '🏜️', 'Deserto', 'Desertos, dunas e cânions'],
  ['caverna', '🕳️', 'Caverna', 'Cavernas e espaços subterrâneos'],
  ['sci-fi', '🚀', 'Sci-Fi', 'Naves, estações e cenários futuristas'],
  ['cyberpunk', '🌃', 'Cyberpunk', 'Cidades futuristas e neon'],
  ['pos-apocaliptico', '☢️', 'Pós-apocalíptico', 'Ruínas e cenários de sobrevivência'],
  ['japao', '🏯', 'Japão feudal', 'Samurais, templos e vilas japonesas'],
  ['fantasia', '🐉', 'Fantasia', 'Cenários mágicos e fantásticos'],
  ['mineracao', '⛏️', 'Mineração', 'Minas e cavernas de minério'],
  ['ilha-tropical', '🌊', 'Ilha tropical', 'Praias, palmeiras e oceano'],
  ['industrial', '🏭', 'Industrial', 'Fábricas, galpões e indústria'],
  ['cidade-moderna', '🏙️', 'Cidade moderna', 'Cenários urbanos e edifícios'],
  ['interiores', '🏠', 'Interiores', 'Salas, casas e móveis'],
  ['templo', '⛪', 'Templo / Igreja', 'Templos, catedrais e mosteiros'],
  ['cemiterio', '🪦', 'Cemitério', 'Túmulos, horror e estilo gótico'],
  ['velho-oeste', '🤠', 'Velho Oeste', 'Cenários western e cowboy'],
  ['pirata', '🏴‍☠️', 'Pirata', 'Navios, portos e tesouros'],
  ['steampunk', '⚙️', 'Steampunk', 'Estilo vitoriano e máquinas a vapor'],
  ['montanha', '🏔️', 'Montanha', 'Picos, penhascos e rochas'],
  ['espaco', '🌌', 'Espaço sideral', 'Planetas, asteroides e nebulosas'],
  ['floresta-magica', '🍄', 'Floresta mágica', 'Cogumelos e ambientes encantados'],
].map(([id, emoji, name, desc]) => ({ id, emoji, name, desc }));

const state = {
  view: 'home',
  category: null,
  categoryName: '',
  cursor: null,
  loading: false,
  requestId: 0,
  curatedData: null,
};

function isActive() {
  return document.querySelector('[data-tab].active')?.dataset.tab === 'scenekits';
}

function renderPackCard(pack) {
  const tier = pack.tier === 'legendary' ? '⭐' : pack.tier === 'epic' ? '💎' : '📦';
  return `<a class="source-card scene-source-card" href="${esc(pack.url)}" target="_blank" rel="noopener noreferrer">
    <span class="scene-tier-badge" aria-hidden="true">${tier}</span>
    <h3>${esc(pack.name)}</h3><p>${esc(pack.desc)}</p>
    <span class="scene-count">${Number(pack.count).toLocaleString('pt-BR')}+ itens informados</span>
    <div class="source-tags">${pack.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
    <small class="scene-formats">Formatos listados: ${pack.formats.map(esc).join(', ') || 'consulte a fonte'}</small>
  </a>`;
}

function renderHome() {
  const data = state.curatedData;
  const categoryCards = categories.map(category => `<button class="scene-cat" type="button" data-scene-cat="${category.id}">
    <span class="scene-emoji">${category.emoji}</span>
    <span class="scene-name">${esc(category.name)}</span>
    <span class="scene-desc">${esc(category.desc)}</span>
  </button>`).join('');
  const featured = data.items.filter(item => item.tier === 'legendary').slice(0, 12);

  $('#results').innerHTML = `<section class="scene-intro">
      <h3>Kits e cenários para seus projetos 3D</h3>
      <p>Busque cenários baixáveis no Sketchfab por tema ou explore fontes selecionadas. Os catálogos externos podem se sobrepor; quantidades, disponibilidade e licenças devem ser confirmadas em cada fonte.</p>
      <div class="scene-stats">
        <div><b>${categories.length}</b><span>categorias temáticas</span></div>
        <div><b>${data.sources}</b><span>fontes selecionadas</span></div>
        <div><b>${data.legendary}</b><span>fontes em destaque</span></div>
      </div>
    </section>
    <div class="scene-grid">${categoryCards}</div>
    <section class="curated-section scene-section">
      <div class="scene-section-heading"><h3>⭐ Kits em destaque</h3>
        <button class="chip" type="button" data-scene-curated>Ver todos (${data.sources}) →</button>
      </div>
      <div class="sources-grid">${featured.map(renderPackCard).join('')}</div>
    </section>`;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${categories.length} categorias · ${data.sources} fontes`;
}

async function loadHome() {
  const requestId = state.requestId;
  const response = await fetch('/api/scenekits/curated');
  if (!response.ok) throw new Error(`A curadoria de cenários falhou (${response.status}).`);
  const data = await response.json();
  if (requestId !== state.requestId || !isActive()) return;
  state.curatedData = data;
  renderHome();
}

function modelCard(model) {
  const thumbnail = model.thumbnails?.images?.find(image => image.width >= 400) || model.thumbnails?.images?.[0];
  if (!thumbnail) return '';
  const item = {
    itemId: `sf_${model.uid}`,
    source: 'sketchfab',
    uid: model.uid,
    title: model.name,
    thumb: thumbnail.url,
    url: model.viewerUrl,
    author: model.user?.displayName || 'Sketchfab',
    license: model.license?.label || 'Licença não informada',
    animationCount: model.animationCount || 0,
  };
  return `<article class="card" data-id="${esc(item.itemId)}" data-item='${esc(JSON.stringify(item))}'>
    <div class="thumb"><img src="${esc(item.thumb)}" alt="${esc(item.title)}" loading="lazy" referrerpolicy="no-referrer">
      <button class="fav-btn" data-fav aria-label="Adicionar aos favoritos">♡</button>
      <span class="tag-badge">Cenário</span>
    </div>
    <div class="card-body"><a class="card-title" href="/model/${encodeURIComponent(item.itemId)}" data-detail>${esc(item.title)}</a>
      <div class="card-meta"><span class="card-author">${esc(item.author)}</span>
        <span class="license-tag ${/cc0|public domain/i.test(item.license) ? '' : 'warn'}">${esc(item.license)}</span>
      </div>
    </div>
  </article>`;
}

async function loadCategory(append = false) {
  if (state.loading || !state.category) return;
  state.loading = true;
  const requestId = ++state.requestId;
  const params = new URLSearchParams({ cat: state.category, count: '24' });
  if (append && state.cursor) params.set('cursor', state.cursor);
  if (!append) {
    state.cursor = null;
    $('#results').innerHTML = '<div class="state">Buscando kits de cenário…</div>';
  }
  const button = $('#loadMoreBtn');
  button.disabled = true;
  button.textContent = 'Carregando…';
  try {
    const response = await fetch(`/api/scenekits/search?${params}`);
    if (!response.ok) throw new Error(`A busca de cenários falhou (${response.status}).`);
    const data = await response.json();
    if (requestId !== state.requestId || !isActive()) return;
    const models = (data.results || []).filter(model => model.thumbnails?.images?.length);
    const cards = models.map(modelCard).join('');
    const heading = `<div class="scene-results-heading"><button class="chip" type="button" data-scene-back>← Categorias</button><h3>${esc(state.categoryName)}</h3></div>`;
    if (!append) {
      $('#results').innerHTML = `${heading}${cards || '<div class="state">Nenhum cenário encontrado nesta categoria. Tente novamente mais tarde.</div>'}`;
    } else if (cards) {
      $('#results').insertAdjacentHTML('beforeend', cards);
    }
    state.cursor = data.next ? new URL(data.next).searchParams.get('cursor') : null;
    $('#loadMoreWrap').hidden = !state.cursor;
    $('#resultsInfo').textContent = `${$$('#results .card').length} resultados · ${state.categoryName}`;
  } finally {
    if (requestId === state.requestId) {
      state.loading = false;
      button.disabled = false;
      button.textContent = 'Carregar mais modelos';
    }
  }
}

function renderCurated() {
  state.requestId++;
  state.loading = false;
  const items = state.curatedData?.items || [];
  const groups = [
    ['legendary', '⭐ Kits em destaque'],
    ['epic', '💎 Mais kits'],
    ['common', '📦 Kits de nicho'],
  ].map(([tier, title]) => {
    const packs = items.filter(item => item.tier === tier);
    if (!packs.length) return '';
    return `<section class="scene-tier-section"><h3>${title} (${packs.length})</h3>
      <div class="sources-grid">${packs.map(renderPackCard).join('')}</div>
    </section>`;
  }).join('');
  $('#results').innerHTML = `<div class="scene-results-heading">
    <button class="chip" type="button" data-scene-back>← Voltar</button><h3>${items.length} fontes e kits</h3>
  </div>${groups}`;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${items.length} fontes selecionadas`;
}

async function loadSceneKitsTab() {
  state.requestId++;
  state.loading = false;
  state.view = 'home';
  state.category = null;
  state.cursor = null;
  $('#results').innerHTML = '<div class="state">Carregando kits de cenários…</div>';
  $('#loadMoreWrap').hidden = true;
  await loadHome();
}

$('#results').addEventListener('click', event => {
  if (!isActive()) return;
  const categoryButton = event.target.closest('[data-scene-cat]');
  if (categoryButton) {
    const category = categories.find(item => item.id === categoryButton.dataset.sceneCat);
    if (!category) return;
    state.view = 'category';
    state.category = category.id;
    state.categoryName = `${category.emoji} ${category.name}`;
    state.cursor = null;
    loadCategory().catch(error => {
      if (isActive()) $('#results').innerHTML = `<div class="error-box">${esc(error.message)} <button type="button" data-scene-retry>Tentar novamente</button></div>`;
    });
    return;
  }
  if (event.target.closest('[data-scene-back]')) {
    state.view = 'home';
    state.category = null;
    state.cursor = null;
    loadSceneKitsTab();
    return;
  }
  if (event.target.closest('[data-scene-retry]')) {
    loadCategory().catch(error => {
      if (isActive()) $('#results').innerHTML = `<div class="error-box">${esc(error.message)} <button type="button" data-scene-retry>Tentar novamente</button></div>`;
    });
    return;
  }
  if (event.target.closest('[data-scene-curated]')) {
    state.view = 'curated';
    renderCurated();
  }
});

window.__loadSceneKitMore = () => {
  if (isActive() && state.view === 'category' && state.cursor) {
    loadCategory(true).catch(error => { $('#resultsInfo').textContent = error.message; });
  }
};

export { loadSceneKitsTab };
