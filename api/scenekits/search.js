const DEFAULT_QUERIES = {
  castelo: 'castle fortress medieval',
  'vila-medieval': 'medieval village town house',
  masmorra: 'dungeon catacombs cellar',
  floresta: 'forest trees woodland',
  neve: 'snow arctic winter',
  deserto: 'desert sand canyon',
  caverna: 'cave underground',
  'sci-fi': 'sci-fi spaceship space station',
  cyberpunk: 'cyberpunk futuristic city',
  'pos-apocaliptico': 'post apocalyptic wasteland',
  japao: 'japanese samurai temple',
  fantasia: 'fantasy magic props',
  mineracao: 'mine mining cave',
  'ilha-tropical': 'tropical island beach',
  industrial: 'industrial factory warehouse',
  'cidade-moderna': 'modern city urban building',
  interiores: 'interior room furniture house',
  templo: 'temple church cathedral',
  cemiterio: 'graveyard cemetery tomb',
  'velho-oeste': 'western cowboy town',
  pirata: 'pirate ship harbor',
  steampunk: 'steampunk victorian machinery',
  montanha: 'mountain cliff rock',
  espaco: 'space planets asteroids',
  'floresta-magica': 'magic forest mushrooms',
};

function getCursor(value) {
  const input = String(value || '').slice(0, 2000);
  try {
    return new URL(input).searchParams.get('cursor') || '';
  } catch {
    return input;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const category = String(req.query.cat || '');
  const query = String(req.query.q || '').trim().slice(0, 200);
  if (!query && !Object.hasOwn(DEFAULT_QUERIES, category)) {
    return res.status(400).json({ error: 'invalid_category' });
  }
  const params = new URLSearchParams({
    type: 'models',
    downloadable: 'true',
    count: String(Math.min(Math.max(Number.parseInt(req.query.count, 10) || 24, 1), 48)),
    sort_by: req.query.sort === 'recent' ? '-publishedAt' : '-likeCount',
  });
  const effectiveQuery = query || DEFAULT_QUERIES[category];
  if (effectiveQuery) params.set('q', effectiveQuery);
  const cursor = getCursor(req.query.cursor);
  if (cursor) params.set('cursor', cursor);

  try {
    const response = await fetch(`https://api.sketchfab.com/v3/search?${params}`, {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    const data = await response.json();
    return res.status(200).json({
      query: effectiveQuery,
      category: category || null,
      total: data.results?.length || 0,
      results: data.results || [],
      next: data.next || null,
    });
  } catch (error) {
    console.error('[scenekits/search]', error.message);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
