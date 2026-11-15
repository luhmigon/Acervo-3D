const STORAGE_KEY = 'f3d_audio_state';
const state = {
  audio: null,
  current: null,
  volume: 0.7,
  loop: false,
  rate: 1,
  savedTime: 0,
  initialized: false,
  saveTimer: null,
};

function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}
function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return;
    state.current = saved.current && safeUrl(saved.current.src)
      ? { ...saved.current, src: safeUrl(saved.current.src) } : null;
    state.volume = Number.isFinite(saved.volume) ? Math.min(Math.max(saved.volume, 0), 1) : 0.7;
    state.loop = Boolean(saved.loop);
    state.rate = [0.5, 0.75, 1, 1.25, 1.5, 2].includes(saved.rate) ? saved.rate : 1;
    state.savedTime = Number.isFinite(saved.currentTime) && saved.currentTime > 0 ? saved.currentTime : 0;
  } catch { state.current = null; }
}
function saveState() {
  if (!state.current) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      current: state.current,
      volume: state.volume,
      loop: state.loop,
      rate: state.rate,
      currentTime: state.audio?.currentTime || 0,
    }));
  } catch (error) {
    console.warn('[audio-player] Não foi possível salvar o estado:', error);
  }
}
function saveStateDebounced() {
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(saveState, 800);
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
function setVisible(visible) {
  const player = document.getElementById('globalAudioPlayer');
  if (!player) return;
  player.classList.toggle('show', visible);
  player.classList.toggle('hidden', !visible);
}
function updatePlayButton() {
  const button = document.getElementById('gapPlayBtn');
  if (!button) return;
  button.textContent = state.audio && !state.audio.paused ? '⏸' : '▶';
  button.setAttribute('aria-label', state.audio && !state.audio.paused ? 'Pausar áudio' : 'Tocar áudio');
}
function setCurrent(item) {
  const source = safeUrl(item.preview || item.src);
  if (!source) throw new Error('Este resultado não possui uma prévia de áudio válida.');
  state.current = {
    id: String(item.id ?? item.itemId ?? source),
    title: String(item.title || 'Áudio'),
    author: String(item.author || ''),
    thumb: safeUrl(item.thumb || ''),
    src: source,
    url: safeUrl(item.url || ''),
  };
  state.savedTime = 0;
  state.audio.src = source;
  state.audio.volume = state.volume;
  state.audio.loop = state.loop;
  state.audio.playbackRate = state.rate;
  document.getElementById('gapTitle').textContent = state.current.title;
  document.getElementById('gapAuthor').textContent = state.current.author || 'Fonte de áudio';
  const thumb = document.getElementById('gapThumb');
  thumb.src = state.current.thumb;
  thumb.hidden = !state.current.thumb;
  document.getElementById('gapLoopBtn').classList.toggle('active', state.loop);
  document.getElementById('gapVolume').value = String(Math.round(state.volume * 100));
  document.getElementById('gapRate').value = String(state.rate);
  setVisible(true);
  saveState();
}
function updateMediaSession() {
  if (!('mediaSession' in navigator) || !state.current) return;
  try {
    if ('MediaMetadata' in window) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.current.title,
        artist: state.current.author || 'Meu Acervo 3D',
        album: 'Meu Acervo 3D',
        artwork: state.current.thumb ? [{ src: state.current.thumb, sizes: '512x512' }] : [],
      });
    }
    navigator.mediaSession.setActionHandler('play', () => state.audio.play());
    navigator.mediaSession.setActionHandler('pause', () => state.audio.pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      state.audio.currentTime = Math.max(0, state.audio.currentTime - 10);
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      state.audio.currentTime = Math.min(state.audio.duration || 0, state.audio.currentTime + 10);
    });
  } catch (error) {
    console.warn('[audio-player] Media Session indisponível:', error);
  }
}
function createPlayerDOM() {
  if (document.getElementById('globalAudioPlayer')) return;
  const player = document.createElement('aside');
  player.id = 'globalAudioPlayer';
  player.className = 'gap hidden';
  player.setAttribute('aria-label', 'Player de áudio');
  player.innerHTML = `
    <div class="gap-waveform" aria-hidden="true">${Array.from({ length: 42 }, (_, index) => `<i style="--bar:${20 + ((index * 37) % 70)}%;--delay:${(index % 9) * -0.13}s"></i>`).join('')}</div>
    <div class="gap-info"><img id="gapThumb" class="gap-thumb" alt="" hidden><div class="gap-meta"><div id="gapTitle" class="gap-title">—</div><div id="gapAuthor" class="gap-author">—</div></div></div>
    <div class="gap-controls">
      <button id="gapPlayBtn" class="gap-btn" type="button" aria-label="Tocar áudio">▶</button>
      <button id="gapLoopBtn" class="gap-btn" type="button" aria-label="Ativar repetição">↻</button>
      <div class="gap-progress-wrap"><input type="range" id="gapProgress" min="0" max="100" step=".1" value="0" aria-label="Posição do áudio"><span id="gapTime" class="gap-time">0:00 / 0:00</span></div>
      <select id="gapRate" class="gap-rate" aria-label="Velocidade"><option value=".5">0.5×</option><option value=".75">0.75×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="2">2×</option></select>
      <label class="gap-vol-wrap" aria-label="Volume">🔊 <input type="range" id="gapVolume" min="0" max="100" value="70"></label>
      <button id="gapCloseBtn" class="gap-btn gap-close" type="button" aria-label="Fechar player">×</button>
    </div>
    <div id="gapError" class="gap-error" role="status" hidden></div>
    <audio id="gapAudio" preload="metadata"></audio>`;
  document.body.appendChild(player);
  state.audio = document.getElementById('gapAudio');
  bindControls();
}
function bindControls() {
  const audio = state.audio;
  document.getElementById('gapPlayBtn').addEventListener('click', () => {
    if (!audio.src) return;
    if (audio.paused) audio.play().catch(showPlaybackError);
    else audio.pause();
  });
  document.getElementById('gapLoopBtn').addEventListener('click', event => {
    state.loop = !state.loop;
    audio.loop = state.loop;
    event.currentTarget.classList.toggle('active', state.loop);
    saveState();
  });
  document.getElementById('gapCloseBtn').addEventListener('click', () => {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.current = null;
    state.savedTime = 0;
    localStorage.removeItem(STORAGE_KEY);
    setVisible(false);
  });
  document.getElementById('gapProgress').addEventListener('input', event => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = (Number(event.target.value) / 100) * audio.duration;
    }
  });
  document.getElementById('gapVolume').addEventListener('input', event => {
    state.volume = Number(event.target.value) / 100;
    audio.volume = state.volume;
    saveState();
  });
  document.getElementById('gapRate').addEventListener('change', event => {
    state.rate = Number(event.target.value);
    audio.playbackRate = state.rate;
    saveState();
  });
  audio.addEventListener('play', () => {
    updatePlayButton();
    updateMediaSession();
  });
  audio.addEventListener('pause', updatePlayButton);
  audio.addEventListener('ended', () => {
    updatePlayButton();
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
  });
  audio.addEventListener('loadedmetadata', () => {
    if (state.savedTime > 0 && state.savedTime < audio.duration) audio.currentTime = state.savedTime;
    state.savedTime = 0;
    document.getElementById('gapTime').textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  });
  audio.addEventListener('timeupdate', () => {
    const progress = document.getElementById('gapProgress');
    if (Number.isFinite(audio.duration) && audio.duration > 0) progress.value = String(audio.currentTime / audio.duration * 100);
    document.getElementById('gapTime').textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    saveStateDebounced();
  });
  audio.addEventListener('error', () => {
    console.warn('[audio-player] O navegador não conseguiu carregar a prévia.');
    showPlaybackError(new Error('Não foi possível carregar esta prévia de áudio.'));
    updatePlayButton();
  });
}
function showPlaybackError(error) {
  const element = document.getElementById('gapError');
  if (element) {
    element.textContent = error.message || 'Não foi possível reproduzir este áudio.';
    element.hidden = false;
  }
}
export function initGlobalPlayer() {
  if (state.initialized) return;
  state.initialized = true;
  readState();
  createPlayerDOM();
  if (!state.current) return;
  document.getElementById('gapTitle').textContent = state.current.title;
  document.getElementById('gapAuthor').textContent = state.current.author || 'Fonte de áudio';
  const thumb = document.getElementById('gapThumb');
  thumb.src = state.current.thumb;
  thumb.hidden = !state.current.thumb;
  state.audio.src = state.current.src;
  const errorEl = document.getElementById('gapError');
  if (errorEl) errorEl.hidden = true;
  state.audio.volume = state.volume;
  state.audio.loop = state.loop;
  state.audio.playbackRate = state.rate;
  document.getElementById('gapVolume').value = String(Math.round(state.volume * 100));
  document.getElementById('gapRate').value = String(state.rate);
  document.getElementById('gapLoopBtn').classList.toggle('active', state.loop);
  setVisible(true);
}
export function play(item) {
  if (!state.initialized) initGlobalPlayer();
  if (!item || !(item.preview || item.src)) throw new Error('Prévia de áudio indisponível.');
  const id = String(item.id ?? item.itemId ?? item.preview ?? item.src);
  if (state.current?.id === id && state.audio.src) {
    const errorEl = document.getElementById('gapError');
    if (errorEl) errorEl.hidden = true;
    setVisible(true);
    return state.audio.play().catch(error => { showPlaybackError(error); throw error; });
  }
  setCurrent({ ...item, id });
  const errorEl = document.getElementById('gapError');
  if (errorEl) errorEl.hidden = true;
  return state.audio.play().catch(error => { showPlaybackError(error); throw error; });
}
export function pause() {
  state.audio?.pause();
}
export function isPlaying() {
  return Boolean(state.audio && !state.audio.paused);
}
export function getCurrent() {
  return state.current;
}
