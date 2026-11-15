const FIELDS = 'id,name,description,previews,license,duration,username,images,tags,filesize,type';

function boundedNumber(value, fallback, min, max) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, min), max) : fallback;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'api_key_missing',
      message: 'A busca no Freesound está desativada; use a curadoria ou configure FREESOUND_API_KEY.',
      fallback: 'curated',
    });
  }

  const query = String(req.query.q || '').trim().slice(0, 120) || 'ambient';
  const page = Math.floor(boundedNumber(req.query.page, 1, 1, 100000));
  const pageSize = Math.floor(boundedNumber(req.query.pageSize, 20, 1, 100));
  const sort = ['score', 'rating_desc', 'downloads_desc', 'created_desc'].includes(String(req.query.sort))
    ? String(req.query.sort) : 'score';
  const minDuration = boundedNumber(req.query.minDuration, 0, 0, 3600);
  const maxDuration = boundedNumber(req.query.maxDuration, 120, minDuration, 3600);
  const params = new URLSearchParams({
    query,
    page: String(page),
    page_size: String(pageSize),
    sort,
    fields: FIELDS,
    token: apiKey,
    filter: `duration:[${minDuration} TO ${maxDuration}]`,
  });
  if (req.query.license === 'cc0') {
    params.set('filter', `${params.get('filter')} license:"Creative Commons 0"`);
  }

  try {
    const response = await fetch(`https://freesound.org/apiv2/search/text/?${params}`, {
      headers: { Accept: 'application/json', 'User-Agent': 'Free3DHub-Personal/2.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`Freesound respondeu ${response.status}`);
    const data = await response.json();
    const results = (data.results || []).map(sound => ({
      id: sound.id,
      itemId: `fs_${sound.id}`,
      source: 'freesound',
      title: sound.name,
      description: sound.description || '',
      url: `https://freesound.org/s/${sound.id}/`,
      preview: sound.previews?.['preview-hq-mp3'] || sound.previews?.['preview-lq-mp3'] || '',
      duration: Math.round(Number(sound.duration || 0) * 10) / 10,
      author: sound.username || '',
      license: sound.license || '',
      thumb: sound.images?.waveform_m || '',
      tags: (sound.tags || []).slice(0, 8),
      filesize: sound.filesize || 0,
    }));
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json({ query, page, pageSize, total: data.count || 0, results, next: data.next || null });
  } catch (error) {
    console.error('[audio:freesound]', error.message);
    return res.status(502).json({ error: 'upstream_failed', message: 'Não foi possível buscar no Freesound agora.' });
  }
}
