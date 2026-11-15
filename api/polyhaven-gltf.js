const headers = { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' };
const fetchJson = async url => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  return response.json();
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const slug = String(req.query.slug || '');
  const resolution = ['1k', '2k', '4k'].includes(req.query.resolution) ? req.query.resolution : '1k';
  if (!/^[a-z0-9_-]+$/i.test(slug)) return res.status(400).json({ error: 'invalid_slug' });
  try {
    const files = await fetchJson(`https://api.polyhaven.com/files/${encodeURIComponent(slug)}`);
    const descriptor = files.gltf?.[resolution]?.gltf;
    if (!descriptor?.url) return res.status(404).json({ error: 'gltf_unavailable' });
    const model = await fetchJson(descriptor.url);
    const included = descriptor.include || {};
    const resolveResource = uri => {
      if (/^(data:|https?:\/\/)/i.test(uri)) return uri;
      const resource = included[uri];
      if (!resource?.url) throw new Error(`missing_resource_${uri}`);
      return resource.url;
    };
    for (const buffer of model.buffers || []) buffer.uri = resolveResource(buffer.uri);
    for (const image of model.images || []) image.uri = resolveResource(image.uri);
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(model);
  } catch (error) {
    console.error('Poly Haven GLTF preparation failed:', error.message);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
