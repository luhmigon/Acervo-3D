export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const type = ['models', 'textures', 'hdris', 'all'].includes(req.query.t) ? req.query.t : 'models';
  try {
    const response = await fetch(`https://api.polyhaven.com/assets?t=${type}`, {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('Poly Haven assets failed:', error.message);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
