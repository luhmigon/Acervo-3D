const ALLOWED = ['q', 'type', 'downloadable', 'animated', 'count', 'sort_by', 'license', 'tags', 'categories', 'min_face_count', 'max_face_count', 'cursor'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const params = new URLSearchParams();
    for (const key of ALLOWED) {
      const value = req.query[key];
      if (value !== undefined && value !== '') params.set(key, String(value));
    }
    if (!params.has('downloadable')) params.set('downloadable', 'true');
    if (!params.has('count')) params.set('count', '24');
    if (!params.has('sort_by')) params.set('sort_by', '-likeCount');
    const response = await fetch(`https://api.sketchfab.com/v3/search?${params}`, {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('Sketchfab API failed:', error.message);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
