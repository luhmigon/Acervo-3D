const CATEGORIES = {
  fabric: 'Fabric', ground: 'Ground', metal: 'Metal', rock: 'Rock',
  wood: 'Wood', bricks: 'Bricks', concrete: 'Concrete', tiles: 'Tiles',
  plaster: 'Plaster', plastic: 'Plastic', leather: 'Leather', food: 'Food',
  liquid: 'Liquid', organic: 'Organic', paper: 'Paper', road: 'Road',
  roof: 'Roof', surface: 'SurfaceImperfections', wall: 'Wall',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const parsedOffset = Number.parseInt(req.query.offset, 10);
    const limit = Math.min(Math.max(parsedLimit || 24, 1), 100);
    const offset = Math.max(parsedOffset || 0, 0);
    const q = String(req.query.q || '').trim().slice(0, 200);
    const category = String(req.query.cat || '').toLowerCase();
    const requestedSort = String(req.query.sort || '');
    const sort = ['Latest', 'Popular', 'Alphabet', 'DownloadCount'].includes(requestedSort)
      ? requestedSort
      : 'Popular';
    const params = new URLSearchParams({
      type: 'Material',
      limit: String(limit),
      offset: String(offset),
      sort,
      include: 'previewImage,tagData,downloadData',
    });
    if (q) params.set('q', q);
    if (category && CATEGORIES[category]) params.set('category', CATEGORIES[category]);

    const response = await fetch(`https://ambientcg.com/api/v2/full_json?${params}`, {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`upstream_${response.status}`);

    const data = await response.json();
    const assets = (data.foundAssets || []).map(asset => {
      const downloads = asset.downloadFolders?.default?.downloadFiletypeCategories?.zip?.downloads || [];
      const download = downloads.find(item => (item.attribute || '').includes('1K-JPG'))
        || downloads.find(item => (item.attribute || '').includes('2K-JPG'))
        || downloads[0];

      return {
        itemId: `acg_${asset.assetId}`,
        source: 'ambientcg',
        slug: asset.assetId,
        title: asset.displayName || asset.assetId,
        thumb: asset.previewImage?.['512-PNG'] || asset.previewImage?.['256-PNG'],
        url: `https://ambientcg.com/view?id=${encodeURIComponent(asset.assetId)}`,
        author: 'ambientCG',
        license: 'CC0',
        category: asset.displayCategory || '',
        tags: (asset.tags || []).slice(0, 8),
        downloadUrl: download?.downloadLink,
        downloadFile: download?.fileName,
        downloadSize: download?.size,
        pbrMaps: ['Diffuse', 'Normal', 'Roughness', 'Metalness', 'AO', 'Displacement'],
      };
    });

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      assets,
      total: data.numberOfResults || assets.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('[ambientcg]', error);
    return res.status(502).json({
      error: 'upstream_failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
