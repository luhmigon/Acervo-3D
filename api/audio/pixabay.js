function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'api_key_missing',
      message: 'A busca no Pixabay está desativada; use a curadoria ou configure PIXABAY_API_KEY.',
      fallback: 'curated',
    });
  }

  const query = String(req.query.q || '').trim().slice(0, 120) || 'music';
  const page = boundedInteger(req.query.page, 1, 1, 100000);
  const perPage = boundedInteger(req.query.perPage, 20, 3, 100);
  const type = req.query.type === 'sfx' ? 'sound_effects' : 'music';
  const params = new URLSearchParams({
    key: apiKey,
    q: query,
    page: String(page),
    per_page: String(perPage),
    safesearch: 'true',
  });
  const endpoint = type === 'sound_effects'
    ? `https://pixabay.com/api/audio/?${params}`
    : `https://pixabay.com/api/?${params}&audio_type=music`;

  try {
    const response = await fetch(endpoint, {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Pixabay respondeu ${response.status}`);
    const data = await response.json();
    const results = (data.hits || []).map(hit => ({
      id: hit.id,
      itemId: `px_${hit.id}`,
      source: 'pixabay',
      title: hit.tags || hit.user || 'Áudio',
      description: hit.tags || '',
      url: hit.pageURL || `https://pixabay.com/`,
      preview: hit.audio || hit.previewURL || '',
      duration: Number(hit.duration) || 0,
      author: hit.user || '',
      license: 'Pixabay License — confira os termos',
      thumb: hit.previewURL || hit.userImageURL || '',
      tags: String(hit.tags || '').split(',').map(tag => tag.trim()).filter(Boolean).slice(0, 8),
    }));
    const total = data.totalHits || 0;
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json({ query, page, perPage, total, results, next: page * perPage < total ? page + 1 : null });
  } catch (error) {
    console.error('[audio:pixabay]', error.message);
    return res.status(502).json({ error: 'upstream_failed', message: 'Não foi possível buscar no Pixabay agora.' });
  }
}
