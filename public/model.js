const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { showToast('Não foi possível salvar neste navegador.'); }
};
let toastTimer;
function showToast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2200);
}
function modelId() {
  const match = /^\/model\/([^/]+)$/.exec(location.pathname);
  return match ? decodeURIComponent(match[1]) : new URLSearchParams(location.search).get('id');
}
async function fetchModel(id) {
  const response = await fetch(`/api/model?id=${encodeURIComponent(id)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível carregar o modelo.');
  return data;
}
function saveDownload(item) {
  const downloads = read('f3d_downloads', []);
  if (!downloads.some(entry => entry.itemId === item.itemId)) {
    downloads.unshift({ ...item, downloadedAt: Date.now() });
    write('f3d_downloads', downloads);
    showToast('Download adicionado ao seu histórico');
  }
}
function render(item, related) {
  const page = $('#modelPage');
  document.title = `${item.title} — Meu Acervo 3D`;
  const favorites = read('f3d_favorites', []);
  const downloads = read('f3d_downloads', []);
  const notes = read('f3d_notes', {});
  const ratings = read('f3d_ratings', {});
  const saved = favorites.some(entry => entry.itemId === item.itemId);
  const downloaded = downloads.some(entry => entry.itemId === item.itemId);
  const rating = Number(ratings[item.itemId]) || 0;
  const details = [
    item.author && ['Criador', item.author],
    item.faceCount && ['Polígonos', Number(item.faceCount).toLocaleString('pt-BR')],
    item.vertexCount && ['Vértices', Number(item.vertexCount).toLocaleString('pt-BR')],
    item.animationCount > 0 && ['Animações', item.animationCount],
    item.downloadCount > 0 && ['Downloads', Number(item.downloadCount).toLocaleString('pt-BR')],
    item.publishedAt && ['Publicado', new Date(
      typeof item.publishedAt === 'number' || /^\d+$/.test(String(item.publishedAt))
        ? (Number(item.publishedAt) < 1e12 ? Number(item.publishedAt) * 1000 : Number(item.publishedAt))
        : item.publishedAt,
    ).toLocaleDateString('pt-BR')],
  ].filter(Boolean);
  const viewer = item.source === 'sketchfab'
    ? `<iframe title="${esc(item.title)}" src="${esc(item.embedUrl)}" allow="autoplay; fullscreen" allowfullscreen></iframe>`
    : item.assetUrl
      ? `<model-viewer src="${esc(item.assetUrl)}" alt="${esc(item.title)}" camera-controls auto-rotate shadow-intensity="1" environment-image="neutral"></model-viewer>`
      : `<img src="${esc(item.thumb)}" alt="${esc(item.title)}">`;
  page.innerHTML = `<div class="model-layout">
    <div class="model-main">
      <div class="model-viewer-main">${viewer}</div>
      ${item.description ? `<section class="model-description"><div class="eyebrow muted-eyebrow">SOBRE ESTE MODELO</div><p>${esc(item.description)}</p></section>` : ''}
      ${related.length ? `<section class="model-related"><div class="eyebrow muted-eyebrow">CONTINUE EXPLORANDO</div><h2>Modelos semelhantes</h2><div class="related-grid">${related.slice(0, 4).map(model => `<a class="related-card" href="/model/${encodeURIComponent(model.itemId)}">${model.thumb ? `<img src="${esc(model.thumb)}" alt="">` : ''}<span>${esc(model.title)}</span></a>`).join('')}</div></section>` : ''}
    </div>
    <aside class="model-sidebar"><div class="eyebrow muted-eyebrow">${item.source === 'polyhaven' ? 'POLY HAVEN · CC0' : 'MODELO SKETCHFAB'}</div>
      <h1>${esc(item.title)}</h1><p class="model-author">por ${esc(item.author || 'Criador da comunidade')}</p>
      <div class="model-actions-stack"><a class="button-primary" href="${esc(item.url)}" target="_blank" rel="noopener">Ver modelo original ↗</a>
        ${item.assetFormat === 'glb' && item.downloadUrl ? `<a class="button-secondary" id="directDownload" href="${esc(item.downloadUrl)}" download="${esc(item.slug || item.title)}.glb">Baixar arquivo GLB ↓</a>` : ''}
        <button class="button-secondary" id="pageFavBtn">${saved ? '♥ Salvo nos favoritos' : '♡ Salvar nos favoritos'}</button>
        <button class="button-secondary" id="pageDownloadBtn">${downloaded ? '✓ Já está no histórico' : 'Marcar como baixado'}</button>
        <button class="button-secondary" id="copyCredit">Copiar crédito</button>
      </div>
      ${details.length ? `<div class="model-meta-list">${details.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}<div><span>Licença</span><strong>${esc(item.license || 'Grátis')}</strong></div></div>` : ''}
      <div class="detail-personal"><label>Minha avaliação</label><div class="rating-stars" id="pageRating">${[1,2,3,4,5].map(number => `<span data-rating="${number}" class="${number <= rating ? 'filled' : ''}">★</span>`).join('')}</div></div>
      <div class="detail-personal"><label for="pageNote">Notas pessoais</label><textarea id="pageNote" placeholder="Suas anotações sobre este modelo…">${esc(notes[item.itemId] || '')}</textarea></div>
      ${item.tags?.length ? `<div class="model-tags">${item.tags.slice(0, 10).map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
    </aside>
  </div>`;
  $('#pageFavBtn').addEventListener('click', () => {
    const list = read('f3d_favorites', []);
    const index = list.findIndex(entry => entry.itemId === item.itemId);
    if (index >= 0) list.splice(index, 1);
    else list.unshift({ ...item, savedAt: Date.now() });
    write('f3d_favorites', list);
    $('#pageFavBtn').textContent = index >= 0 ? '♡ Salvar nos favoritos' : '♥ Salvo nos favoritos';
    showToast(index >= 0 ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
  });
  $('#pageDownloadBtn').addEventListener('click', () => {
    saveDownload(item);
    $('#pageDownloadBtn').textContent = '✓ Já está no histórico';
  });
  $('#directDownload')?.addEventListener('click', () => saveDownload(item));
  $('#copyCredit').addEventListener('click', async () => {
    const attribution = item.source === 'sketchfab'
      ? `"${item.title}" por ${item.author}, licença ${item.license} — Sketchfab: ${item.url}`
      : `"${item.title}" por Poly Haven, licença CC0 — ${item.url}`;
    try {
      await navigator.clipboard.writeText(attribution);
      showToast('Crédito copiado');
    } catch {
      showToast('Não foi possível copiar. Verifique a permissão do navegador.');
    }
  });
  $('#pageRating').addEventListener('click', event => {
    const star = event.target.closest('[data-rating]');
    if (!star) return;
    const savedRatings = read('f3d_ratings', {});
    const selected = Number(star.dataset.rating);
    if (savedRatings[item.itemId] === selected) delete savedRatings[item.itemId];
    else savedRatings[item.itemId] = selected;
    write('f3d_ratings', savedRatings);
    $$('#pageRating [data-rating]').forEach(element => element.classList.toggle('filled', Number(element.dataset.rating) <= (savedRatings[item.itemId] || 0)));
  });
  let timer;
  $('#pageNote').addEventListener('input', event => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const savedNotes = read('f3d_notes', {});
      if (event.target.value.trim()) savedNotes[item.itemId] = event.target.value.trim();
      else delete savedNotes[item.itemId];
      write('f3d_notes', savedNotes);
      showToast('Nota salva');
    }, 500);
  });
}
function $$(selector, root = document) { return [...root.querySelectorAll(selector)]; }
async function boot() {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('/sw.js').catch(error => console.warn('Offline support unavailable:', error));
  }
  const id = modelId();
  if (!id) {
    $('#modelPage').innerHTML = '<div class="state">O endereço deste modelo é inválido. <a href="/">Voltar ao catálogo</a></div>';
    return;
  }
  try {
    const { item, related = [] } = await fetchModel(id);
    if (!item) throw new Error('Modelo não encontrado.');
    render(item, related);
  } catch (error) {
    console.error(error);
    $('#modelPage').innerHTML = `<div class="state">${esc(error.message)}<br><br><a class="button-secondary" href="/">← Voltar ao catálogo</a></div>`;
  }
}
document.addEventListener('DOMContentLoaded', boot);
