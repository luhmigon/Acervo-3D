const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const categories = [
  ['warrior', '⚔️', 'Guerreiros', 'Cavaleiros, soldados e gladiadores'],
  ['mage', '🧙', 'Magos', 'Magos, feiticeiros e bruxos'],
  ['archer', '🏹', 'Arqueiros', 'Arqueiros, patrulheiros e caçadores'],
  ['rogue', '🗡', 'Ladinos', 'Ladrões, assassinos e ninjas'],
  ['cleric', '⚕', 'Clérigos', 'Sacerdotes, paladinos e monges'],
  ['barbarian', '🪓', 'Bárbaros', 'Bárbaros, vikings e berserkers'],
  ['monk', '🥋', 'Monges', 'Monges e artistas marciais'],
  ['bard', '🎵', 'Bardos', 'Bardos, menestréis e músicos'],
  ['npc-civilian', '👨‍🌾', 'NPCs civis', 'Aldeões, mercadores e civis'],
  ['elf', '🧝', 'Elfos', 'Elfos da floresta e altos elfos'],
  ['dwarf', '🧔', 'Anões', 'Anões e guerreiros anões'],
  ['orc', '👹', 'Orcs', 'Orcs e meio-orcs'],
  ['undead-humanoid', '💀', 'Mortos-vivos', 'Zumbis, esqueletos e liches'],
  ['sci-fi-soldier', '🚀', 'Soldados sci-fi', 'Soldados espaciais e marines'],
  ['cyborg', '🤖', 'Cyborgs', 'Androides e robôs humanoides'],
  ['modern-casual', '👕', 'Modernos', 'Pessoas modernas e casuais'],
  ['anime', '🎌', 'Anime', 'Personagens em estilo anime'],
  ['chibi', '🎨', 'Chibi / Cartoon', 'Personagens estilizados'],
  ['superhero', '🦸', 'Super-heróis', 'Heróis e vigilantes'],
  ['samurai', '🗾', 'Samurais', 'Samurais e ronin'],
  ['cyberpunk', '🌃', 'Cyberpunk', 'Personagens cyberpunk'],
  ['steampunk', '⚙️', 'Steampunk', 'Personagens steampunk'],
  ['athlete', '⚽', 'Atletas', 'Atletas e esportistas'],
  ['elderly', '🧓', 'Idosos', 'Idosos e personagens mais velhos'],
  ['kid', '👶', 'Crianças', 'Crianças e jovens'],
].map(([id, emoji, name, desc]) => ({ id, emoji, name, desc }));

const state = {
  view: 'home',
  category: null,
  categoryName: '',
  cursor: null,
  loading: false,
  mixamoData: null,
  curatedData: null,
  requestId: 0,
  mixamoCategory: null,
};

function isActive() {
  return document.querySelector('[data-tab].active')?.dataset.tab === 'humanoids';
}

function sourceCard(source) {
  const tier = source.tier === 'legendary' ? '⭐' : source.tier === 'epic' ? '💎' : '📦';
  return `<a class="source-card humanoid-source-card" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">
    <span class="humanoid-tier-badge" aria-hidden="true">${tier}</span>
    <h3>${esc(source.name)}</h3><p>${esc(source.desc)}</p>
    <div class="source-tags">${source.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>
  </a>`;
}

function renderHome() {
  const mixamo = state.mixamoData;
  const curated = state.curatedData;
  const categoryCards = categories.map(category => `<button class="humanoid-cat" type="button" data-humanoid-cat="${category.id}">
    <span class="humanoid-emoji">${category.emoji}</span>
    <span class="humanoid-name">${esc(category.name)}</span>
    <span class="humanoid-desc">${esc(category.desc)}</span>
  </button>`).join('');
  const sources = (curated?.items || []).slice(0, 12).map(sourceCard).join('');
  const previews = (mixamo?.categories || []).slice(0, 6).map(category => `<button class="mixamo-cat-preview" type="button" data-mixamo-open="${esc(category.id)}">
    <span aria-hidden="true">${esc(category.emoji)}</span>
    <span><strong>${esc(category.name)}</strong><small>${category.clips.length} clipes curados</small></span>
  </button>`).join('');

  $('#results').innerHTML = `<section class="humanoid-intro">
      <h3>Personagens humanoides riggados</h3>
      <p>Explore modelos humanoides animados baixáveis no Sketchfab, personagens de fontes selecionadas e atalhos para animações do Mixamo. Confirme o rig, a licença e os requisitos na página de cada recurso.</p>
      <div class="humanoid-stats">
        <div><b>${categories.length}</b><span>categorias de busca</span></div>
        <div><b>${esc(mixamo?.total_animations || '2500+')}</b><span>animações no Mixamo</span></div>
        <div><b>${esc(mixamo?.total_characters || '50+')}</b><span>personagens no Mixamo</span></div>
        <div><b>${curated?.sources || 0}</b><span>fontes selecionadas</span></div>
      </div>
    </section>
    <div class="humanoid-grid">${categoryCards}</div>
    <section class="curated-section humanoid-section">
      <div class="humanoid-section-heading"><h3>📦 Fontes e pacotes selecionados</h3>
        <button class="chip" type="button" data-curated-all>Ver todas (${curated?.sources || 0}) →</button>
      </div>
      <div class="sources-grid">${sources}</div>
    </section>
    <section class="curated-section humanoid-section">
      <div class="humanoid-section-heading"><h3>🎬 Animações Mixamo</h3>
        <button class="chip" type="button" data-mixamo-open>Ver categorias →</button>
      </div>
      <p class="humanoid-note">${mixamo?.categories?.length || 0} categorias · links de busca para o catálogo oficial; login Adobe pode ser necessário.</p>
      <div class="mixamo-preview">${previews}</div>
    </section>`;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${categories.length} categorias · ${curated?.sources || 0} fontes`;
}

async function loadHome() {
  const requestId = state.requestId;
  const [mixamo, curated] = await Promise.all([
    fetch('/api/humanoids/mixamo').then(response => {
      if (!response.ok) throw new Error(`Mixamo indisponível (${response.status}).`);
      return response.json();
    }),
    fetch('/api/humanoids/curated').then(response => {
      if (!response.ok) throw new Error(`Curadoria indisponível (${response.status}).`);
      return response.json();
    }),
  ]);
  if (requestId !== state.requestId || !isActive()) return;
  state.mixamoData = mixamo;
  state.curatedData = curated;
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
  const favoriteLabel = 'Adicionar aos favoritos';
  return `<article class="card" data-id="${esc(item.itemId)}" data-item='${esc(JSON.stringify(item))}'>
    <div class="thumb"><img src="${esc(item.thumb)}" alt="${esc(item.title)}" loading="lazy" referrerpolicy="no-referrer">
      <button class="fav-btn" data-fav aria-label="${favoriteLabel}">♡</button>
      <span class="tag-badge">${item.animationCount ? 'Animado' : 'Verificar rig'}</span>
    </div>
    <div class="card-body"><a class="card-title" href="/model/${encodeURIComponent(item.itemId)}" data-detail>${esc(item.title)}</a>
      <div class="card-meta"><span class="card-author">${esc(item.author)}</span>
      <span class="license-tag ${/cc0|public domain/i.test(item.license) ? '' : 'warn'}">${esc(item.license)}</span></div>
    </div>
  </article>`;
}

async function loadCategory(append = false) {
  if (state.loading) return;
  state.loading = true;
  const requestId = ++state.requestId;
  const params = new URLSearchParams({ cat: state.category, count: '24' });
  if (append && state.cursor) params.set('cursor', state.cursor);
  if (!append) {
    state.cursor = null;
    $('#results').innerHTML = '<div class="state">Buscando modelos humanoides…</div>';
  }
  const more = $('#loadMoreBtn');
  more.disabled = true;
  more.textContent = 'Carregando…';
  try {
    const response = await fetch(`/api/humanoids/search?${params}`);
    if (!response.ok) throw new Error(`A busca falhou (${response.status}).`);
    const data = await response.json();
    if (requestId !== state.requestId || !isActive()) return;
    const models = (data.results || []).filter(model => model.thumbnails?.images?.length);
    const cards = models.map(modelCard).join('');
    const heading = `<div class="humanoid-results-heading"><button class="chip" type="button" data-humanoids-back>← Categorias</button><h3>${esc(state.categoryName)}</h3></div>`;
    if (!append) {
      $('#results').innerHTML = `${heading}${cards || '<div class="state">Nenhum modelo encontrado nesta categoria. Tente novamente mais tarde.</div>'}`;
    } else if (cards) {
      $('#results').insertAdjacentHTML('beforeend', cards);
    }
    state.cursor = data.next ? new URL(data.next).searchParams.get('cursor') : null;
    $('#loadMoreWrap').hidden = !state.cursor;
    $('#resultsInfo').textContent = `${$$('#results .card').length} modelos · ${state.categoryName}`;
  } finally {
    if (requestId === state.requestId) {
      state.loading = false;
      more.disabled = false;
      more.textContent = 'Carregar mais modelos';
    }
  }
}

function renderCurated() {
  state.requestId++;
  state.loading = false;
  const items = state.curatedData?.items || [];
  $('#results').innerHTML = `<div class="humanoid-results-heading">
    <button class="chip" type="button" data-humanoids-back>← Voltar</button>
    <h3>${items.length} fontes e pacotes</h3>
  </div>${items.map(sourceCard).join('')}`;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${items.length} fontes selecionadas`;
}

function renderMixamo(categoryId = null) {
  state.requestId++;
  state.loading = false;
  const data = state.mixamoData;
  if (!data) return;
  state.mixamoCategory = categoryId;
  const cats = data.categories.map(category => `<button class="mixamo-cat ${categoryId === category.id ? 'active' : ''}" type="button" data-mixamo-cat="${esc(category.id)}">
    <span>${esc(category.emoji)}</span><span><strong>${esc(category.name)}</strong><small>${category.clips.length} clipes</small></span>
  </button>`).join('');
  const category = data.categories.find(item => item.id === categoryId);
  const clips = category ? `<div class="mixamo-clips-heading"><h4>${esc(category.emoji)} ${esc(category.name)}</h4></div>
    ${category.clips.map(clip => {
      const url = `https://www.mixamo.com/#/?page=1&query=${encodeURIComponent(clip.query)}&type=Motion%2CMotionPack`;
      return `<article class="mixamo-clip">
        <div><strong>${esc(clip.name)}</strong><p>${esc(clip.desc)}</p>
          <div class="mixamo-clip-meta"><span class="tag-badge">${esc(clip.duration)}</span>${clip.tags.map(tag => `<span class="source-tag">${esc(tag)}</span>`).join('')}</div>
        </div><a class="button-primary" href="${url}" target="_blank" rel="noopener noreferrer">Abrir busca no Mixamo ↗</a>
      </article>`;
    }).join('')}` : '';
  $('#results').innerHTML = `<div class="humanoid-results-heading">
      <button class="chip" type="button" data-humanoids-back>← Voltar</button>
      <div><h3>Mixamo — ${esc(data.total_animations)} animações</h3>
      <p>${data.categories.length} categorias · ${esc(data.total_characters)} personagens no catálogo oficial.</p></div>
    </div>
    <div class="mixamo-cats">${cats}</div>${clips}
    <section class="mixamo-characters"><h4>Personagens de referência</h4>
      <p>Esta lista contém exemplos; o catálogo oficial pode variar. Acesse o Mixamo para conferir e baixar.</p>
      <div>${data.characters.map(character => `<span class="source-tag">${esc(character.name)}</span>`).join('')}</div>
    </section>`;
  $('#loadMoreWrap').hidden = true;
  $('#resultsInfo').textContent = `${data.categories.length} categorias · Mixamo`;
}

async function loadHumanoidsTab() {
  state.requestId++;
  state.loading = false;
  state.view = 'home';
  state.category = null;
  state.cursor = null;
  state.mixamoCategory = null;
  $('#results').innerHTML = '<div class="state">Carregando humanoides…</div>';
  $('#loadMoreWrap').hidden = true;
  await loadHome();
}

$('#results').addEventListener('click', event => {
  const categoryButton = event.target.closest('[data-humanoid-cat]');
  if (categoryButton && isActive()) {
    const category = categories.find(item => item.id === categoryButton.dataset.humanoidCat);
    if (!category) return;
    state.view = 'category';
    state.category = category.id;
    state.categoryName = `${category.emoji} ${category.name}`;
    state.cursor = null;
    loadCategory().catch(error => {
      if (isActive()) $('#results').innerHTML = `<div class="error-box">${esc(error.message)} <button type="button" data-humanoids-retry>Tentar novamente</button></div>`;
    });
    return;
  }
  if (event.target.closest('[data-humanoids-back]') && isActive()) {
    state.view = 'home';
    state.category = null;
    state.cursor = null;
    loadHumanoidsTab();
    return;
  }
  if (event.target.closest('[data-humanoids-retry]') && isActive()) {
    loadCategory().catch(error => {
      $('#results').innerHTML = `<div class="error-box">${esc(error.message)} <button type="button" data-humanoids-retry>Tentar novamente</button></div>`;
    });
    return;
  }
  if (event.target.closest('[data-curated-all]') && isActive()) {
    state.view = 'curated';
    renderCurated();
    return;
  }
  const mixamoButton = event.target.closest('[data-mixamo-open], [data-mixamo-cat]');
  if (mixamoButton && isActive()) {
    state.view = 'mixamo';
    renderMixamo(mixamoButton.dataset.mixamoOpen || mixamoButton.dataset.mixamoCat || null);
  }
});

window.__loadHumanoidMore = () => {
  if (isActive() && state.view === 'category') loadCategory(true).catch(error => {
    $('#resultsInfo').textContent = error.message;
  });
};

export { loadHumanoidsTab };
