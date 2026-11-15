const headers = { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' };
const fetchJson = async url => {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`upstream_${response.status}`);
  return response.json();
};
const thumbnail = model => model.thumbnails?.images?.find(image => image.width >= 400)?.url
  || model.thumbnails?.images?.[0]?.url || '';

async function sketchfab(uid) {
  const model = await fetchJson(`https://api.sketchfab.com/v3/models/${encodeURIComponent(uid)}`);
  let related = [];
  const tag = model.tags?.[0]?.name || model.categories?.[0]?.name;
  if (tag) {
    try {
      const results = await fetchJson(`https://api.sketchfab.com/v3/search?type=models&downloadable=true&q=${encodeURIComponent(tag)}&count=12&sort_by=-likeCount`);
      related = (results.results || []).filter(item => item.uid !== uid).slice(0, 8).map(item => ({
        itemId: `sf_${item.uid}`, source: 'sketchfab', title: item.name, thumb: thumbnail(item),
        author: item.user?.displayName || 'Sketchfab', license: item.license?.label || 'Grátis',
        url: item.viewerUrl,
      }));
    } catch (error) {
      console.warn('Could not load related Sketchfab models:', error.message);
    }
  }
  return {
    item: {
      itemId: `sf_${model.uid}`, source: 'sketchfab', uid: model.uid,
      title: model.name, description: model.description || '', thumb: thumbnail(model),
      author: model.user?.displayName || 'Sketchfab', authorUrl: model.user?.profileUrl || '',
      license: model.license?.label || 'Grátis', url: model.viewerUrl,
      faceCount: model.faceCount, vertexCount: model.vertexCount,
      animationCount: model.animationCount || 0, tags: (model.tags || []).map(tagItem => tagItem.name),
      categories: (model.categories || []).map(category => category.name),
      publishedAt: model.publishedAt,
      embedUrl: `https://sketchfab.com/models/${encodeURIComponent(model.uid)}/embed?autostart=1&ui_theme=dark`,
    },
    related,
  };
}

async function polyhaven(slug) {
  const [assets, files] = await Promise.all([
    fetchJson('https://api.polyhaven.com/assets?t=models'),
    fetchJson(`https://api.polyhaven.com/files/${encodeURIComponent(slug)}`),
  ]);
  const info = assets[slug] || {};
  const glb = files.gltf?.['1k']?.glb || files.gltf?.['2k']?.glb || files.gltf?.['4k']?.glb;
  const gltf = files.gltf?.['1k']?.gltf || files.gltf?.['2k']?.gltf || files.gltf?.['4k']?.gltf;
  const category = info.categories?.[0];
  const related = Object.entries(assets)
    .filter(([name, value]) => name !== slug && (!category || value.categories?.includes(category)))
    .slice(0, 8)
    .map(([name, value]) => ({
      itemId: `ph_${name}`, source: 'polyhaven', slug: name, title: value.name || name,
      thumb: `https://cdn.polyhaven.com/asset_img/thumbs/${encodeURIComponent(name)}.png?width=460`,
      author: 'Poly Haven', license: 'CC0', url: `https://polyhaven.com/a/${encodeURIComponent(name)}`,
    }));
  return {
    item: {
      itemId: `ph_${slug}`, source: 'polyhaven', slug, title: info.name || slug,
      description: info.description || '',
      thumb: `https://cdn.polyhaven.com/asset_img/thumbs/${encodeURIComponent(slug)}.png?width=1200`,
      author: 'Poly Haven', license: 'CC0', url: `https://polyhaven.com/a/${encodeURIComponent(slug)}`,
      assetUrl: gltf ? `/api/polyhaven-gltf?slug=${encodeURIComponent(slug)}` : (glb?.url || ''),
      downloadUrl: glb?.url || gltf?.url || '',
      assetFormat: glb ? 'glb' : 'gltf',
      categories: info.categories || [], tags: info.tags || [],
      downloadCount: info.download_count || 0, publishedAt: info.date_published,
    },
    related,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const match = /^(sf|ph)_([a-z0-9_-]+)$/i.exec(String(req.query.id || ''));
  if (!match) return res.status(400).json({ error: 'invalid_id' });
  try {
    const result = match[1].toLowerCase() === 'sf'
      ? await sketchfab(match[2]) : await polyhaven(match[2]);
    res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
    return res.status(200).json(result);
  } catch (error) {
    console.error('Model details failed:', error.message);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}
