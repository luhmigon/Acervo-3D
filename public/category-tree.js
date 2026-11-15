import { CATEGORY_TREE, getAncestors } from './categories.js?v=2.26';

const STORAGE_KEY = 'f3d_expanded_categories';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const DEFAULT_EXPANDED = ['root'];

let expandedNodes = readExpandedNodes();
let activePath = [];
let onCategorySelect = null;
let searchFilter = '';

function readExpandedNodes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return new Set(Array.isArray(saved) ? saved : DEFAULT_EXPANDED);
  } catch {
    return new Set(DEFAULT_EXPANDED);
  }
}

function persistExpandedNodes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...expandedNodes]));
  } catch {
    // The tree remains usable for the current page if storage is unavailable.
  }
}

export function initCategoryTree(options = {}) {
  onCategorySelect = options.onSelect || null;
  renderTree();
  restoreFromURL(false);
  setupEventListeners();
  window.addEventListener('popstate', () => restoreFromURL(true));
}

function renderTree() {
  const container = $('#categoryTree');
  if (!container) return;
  container.innerHTML = renderNode(CATEGORY_TREE, 0);
}

function renderNode(node, depth) {
  const active = activePath[activePath.length - 1] === node.id;
  const inPath = activePath.includes(node.id);
  const hasChildren = Boolean(node.children?.length);
  const expanded = expandedNodes.has(node.id) || Boolean(searchFilter);
  if (searchFilter && !matchesFilter(node, searchFilter)) return '';

  const paddingLeft = depth * 14 + 8;
  if (node.url) {
    return `<a href="${escapeHtml(node.url)}" class="tree-item tree-item-link"
      style="padding-left:${paddingLeft}px">
      <span class="tree-icon">${node.emoji || '📁'}</span>
      <span class="tree-label">${escapeHtml(node.name)}</span>
      <span class="tree-external" aria-hidden="true">↗</span>
    </a>`;
  }

  const children = hasChildren
    ? `<div class="tree-children ${expanded ? 'expanded' : ''}" data-children-of="${escapeHtml(node.id)}">
        <div class="tree-children-inner">${node.children.map(child => renderNode(child, depth + 1)).join('')}</div>
      </div>`
    : '';
  return `<div class="tree-node" data-node-id="${escapeHtml(node.id)}">
    <div class="tree-row" style="padding-left:${depth * 14 + 8}px">
      ${hasChildren
        ? `<button class="tree-toggle ${expanded ? 'expanded' : ''}" type="button" data-toggle="${escapeHtml(node.id)}"
            aria-label="${expanded ? 'Recolher' : 'Expandir'} ${escapeHtml(node.name)}" aria-expanded="${expanded}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          </button>`
        : '<span class="tree-toggle-placeholder" aria-hidden="true"></span>'}
      <button class="tree-item ${active ? 'active' : ''} ${inPath ? 'in-path' : ''} ${hasChildren ? 'has-children' : ''}"
        type="button" data-node-id="${escapeHtml(node.id)}" aria-current="${active ? 'page' : 'false'}">
        <span class="tree-icon" aria-hidden="true">${node.emoji || '📁'}</span>
        <span class="tree-label">${escapeHtml(node.name)}</span>
        ${node.count != null ? `<span class="tree-count">${Number(node.count).toLocaleString('pt-BR')}</span>` : ''}
      </button>
    </div>${children}
  </div>`;
}

function matchesFilter(node, filter) {
  const term = filter.toLocaleLowerCase('pt-BR');
  return node.name.toLocaleLowerCase('pt-BR').includes(term)
    || Boolean(node.children?.some(child => matchesFilter(child, filter)));
}

function bindTreeEvents() {
  const container = $('#categoryTree');
  if (!container) return;
  container.addEventListener('click', event => {
    const toggle = event.target.closest('[data-toggle]');
    if (toggle) {
      event.stopPropagation();
      toggleNode(toggle.dataset.toggle);
      return;
    }
    const item = event.target.closest('.tree-item:not(.tree-item-link)');
    if (item) selectNode(item.dataset.nodeId);
  });
}

function toggleNode(nodeId) {
  if (expandedNodes.has(nodeId)) expandedNodes.delete(nodeId);
  else expandedNodes.add(nodeId);
  persistExpandedNodes();
  const children = document.querySelector(`[data-children-of="${CSS.escape(nodeId)}"]`);
  const toggle = document.querySelector(`[data-toggle="${CSS.escape(nodeId)}"]`);
  const expanded = expandedNodes.has(nodeId);
  children?.classList.toggle('expanded', expanded);
  toggle?.classList.toggle('expanded', expanded);
  toggle?.setAttribute('aria-expanded', String(expanded));
  toggle?.setAttribute('aria-label', `${expanded ? 'Recolher' : 'Expandir'} ${children?.previousElementSibling.querySelector('.tree-label')?.textContent || ''}`);
}

function findPathToNode(node, targetId, path = []) {
  const currentPath = [...path, node];
  if (node.id === targetId) return currentPath;
  for (const child of node.children || []) {
    const found = findPathToNode(child, targetId, currentPath);
    if (found) return found;
  }
  return null;
}

function selectNode(nodeId) {
  const path = findPathToNode(CATEGORY_TREE, nodeId);
  if (!path) return;
  activePath = path.map(node => node.id);
  activePath.forEach(id => expandedNodes.add(id));
  persistExpandedNodes();
  updateURL(activePath);
  renderBreadcrumb(path);
  renderTree();
  closeMobileSidebar();

  if (!onCategorySelect) return;
  const node = path[path.length - 1];
  onCategorySelect({
    node,
    path,
    query: node.query || '',
    source: node.source || inferSourceFromPath(path),
    cat: [...path].reverse().find(item => item.cat)?.cat || '',
    name: node.name,
  });
}

function inferSourceFromPath(path) {
  for (let index = path.length - 1; index >= 0; index--) {
    if (path[index].source) return path[index].source;
  }
  const sourceByRoot = {
    modelos: 'sketchfab',
    texturas: 'ambientcg',
    audio: 'audio-sfx',
    cenarios: 'scenekits',
  };
  return sourceByRoot[path[1]?.id] || 'sketchfab';
}

function updateURL(path) {
  const url = new URL(location.href);
  if (path.length <= 1) url.searchParams.delete('cat');
  else url.searchParams.set('cat', path.slice(1).join('/'));
  history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function restoreFromURL(notifyEmpty) {
  const categoryPath = new URLSearchParams(location.search).get('cat');
  if (!categoryPath) {
    activePath = [];
    renderBreadcrumb([CATEGORY_TREE]);
    renderTree();
    if (notifyEmpty) selectRootWithoutHistory();
    return;
  }

  const ids = categoryPath.split('/').filter(Boolean);
  const path = getAncestors(ids);
  if (path.length !== ids.length + 1) {
    activePath = [];
    renderBreadcrumb([CATEGORY_TREE]);
    renderTree();
    if (notifyEmpty) selectRootWithoutHistory();
    return;
  }
  activePath = path.map(node => node.id);
  activePath.forEach(id => expandedNodes.add(id));
  persistExpandedNodes();
  renderBreadcrumb(path);
  renderTree();
  if (onCategorySelect) {
    const node = path[path.length - 1];
    onCategorySelect({
      node,
      path,
      query: node.query || '',
      source: node.source || inferSourceFromPath(path),
      cat: [...path].reverse().find(item => item.cat)?.cat || '',
      name: node.name,
    });
  }
}

function selectRootWithoutHistory() {
  const path = [CATEGORY_TREE];
  if (!onCategorySelect) return;
  onCategorySelect({
    node: CATEGORY_TREE,
    path,
    query: '',
    source: 'sketchfab',
    cat: '',
    name: CATEGORY_TREE.name,
  });
}

function renderBreadcrumb(path) {
  const container = $('#breadcrumb');
  if (!container) return;
  container.innerHTML = path.map((node, index) => {
    const active = index === path.length - 1;
    return `${index ? '<span class="crumb-sep" aria-hidden="true">›</span>' : ''}
      <button class="crumb ${active ? 'active' : ''}" type="button" data-crumb-id="${escapeHtml(node.id)}"
        ${active ? 'aria-current="page"' : ''}>
        <span class="crumb-icon" aria-hidden="true">${node.emoji || '📁'}</span>
        <span>${escapeHtml(node.name)}</span>
      </button>`;
  }).join('');
}

function clearCategorySelection() {
  activePath = [];
  renderBreadcrumb([CATEGORY_TREE]);
  renderTree();
}

function setupEventListeners() {
  bindTreeEvents();
  $('#breadcrumb')?.addEventListener('click', event => {
    const crumb = event.target.closest('[data-crumb-id]');
    if (crumb) selectNode(crumb.dataset.crumbId);
  });
  $('#clearCategory')?.addEventListener('click', () => selectNode('root'));

  const search = $('#categorySearch');
  let debounceTimer;
  search?.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchFilter = search.value.trim();
      renderTree();
    }, 120);
  });

  $('#expandAllCategories')?.addEventListener('click', () => {
    expandedNodes = new Set(collectExpandableNodes(CATEGORY_TREE));
    persistExpandedNodes();
    renderTree();
  });
  $('#collapseAllCategories')?.addEventListener('click', () => {
    expandedNodes.clear();
    persistExpandedNodes();
    renderTree();
  });

  const sidebar = $('#categorySidebar');
  const mobileToggle = $('#categoryMobileToggle');
  const backdrop = $('#categoryBackdrop');
  mobileToggle?.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    backdrop.hidden = !open;
    mobileToggle.setAttribute('aria-expanded', String(open));
  });
  backdrop?.addEventListener('click', closeMobileSidebar);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMobileSidebar();
  });
}

function collectExpandableNodes(node) {
  if (!node.children?.length) return [];
  return [node.id, ...node.children.flatMap(collectExpandableNodes)];
}

function closeMobileSidebar() {
  const sidebar = $('#categorySidebar');
  const mobileToggle = $('#categoryMobileToggle');
  const backdrop = $('#categoryBackdrop');
  sidebar?.classList.remove('open');
  if (backdrop) backdrop.hidden = true;
  mobileToggle?.setAttribute('aria-expanded', 'false');
}

export function clearCategoryTree(updateHistory = true) {
  if (updateHistory) {
    const url = new URL(location.href);
    if (url.searchParams.has('cat')) {
      url.searchParams.delete('cat');
      history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }
  clearCategorySelection();
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}
