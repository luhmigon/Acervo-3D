const DEFAULT_QUERIES = {
  warrior: 'warrior knight soldier',
  mage: 'mage wizard sorcerer',
  archer: 'archer ranger hunter',
  rogue: 'rogue thief assassin',
  cleric: 'cleric priest paladin',
  barbarian: 'barbarian viking',
  monk: 'monk martial artist',
  bard: 'bard musician',
  'npc-civilian': 'npc civilian villager',
  elf: 'elf elven',
  dwarf: 'dwarf dwarven',
  orc: 'orc orcish',
  'undead-humanoid': 'zombie skeleton undead humanoid',
  'sci-fi-soldier': 'sci-fi soldier space marine',
  cyborg: 'cyborg android robot humanoid',
  'modern-casual': 'casual person modern civilian',
  anime: 'anime character',
  chibi: 'chibi cartoon character',
  superhero: 'superhero hero',
  samurai: 'samurai japanese warrior',
  cyberpunk: 'cyberpunk character',
  steampunk: 'steampunk character',
  athlete: 'athlete sport person',
  elderly: 'elderly old person',
  kid: 'child kid young character',
};

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
  const count = Math.min(Math.max(Number.parseInt(req.query.count, 10) || 24, 1), 48);
  const params = new URLSearchParams({
    type: 'models',
    downloadable: 'true',
    animated: 'true',
    count: String(count),
    sort_by: req.query.sort === 'recent' ? '-publishedAt' : '-likeCount',
  });
  const cursor = String(req.query.cursor || '').slice(0, 2000);
  const effectiveQuery = query || DEFAULT_QUERIES[category];
  if (effectiveQuery) params.set('q', effectiveQuery);
  if (cursor) params.set('cursor', cursor);

  try {
    const response = await fetch(`https://api.sketchfab.com/v3/search?${params}`, {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('[humanoids/search]', error.message);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
