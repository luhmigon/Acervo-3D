const escapeXml = value => String(value).replace(/[<>&'"]/g, char => ({
  '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
}[char]));
const urlTag = (loc, freq = 'monthly', priority = '0.5') =>
  `  <url><loc>${escapeXml(loc)}</loc><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;

export default async function handler(req, res) {
  const host = req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const base = `${proto}://${host}`;
  const pages = [
    { path: '/', freq: 'daily', priority: '1.0' },
    { path: '/sobre', freq: 'weekly', priority: '0.8' },
    { path: '/roadmap', freq: 'weekly', priority: '0.8' },
    { path: '/termos', freq: 'yearly', priority: '0.3' },
    { path: '/privacidade', freq: 'yearly', priority: '0.3' },
    { path: '/scene-composer', freq: 'weekly', priority: '0.8' },
    { path: '/optimize', freq: 'weekly', priority: '0.8' },
  ];
  const urls = pages.map(({ path, freq, priority }) => urlTag(`${base}${path}`, freq, priority));
  try {
    const response = await fetch('https://api.sketchfab.com/v3/search?type=models&downloadable=true&count=100&sort_by=-likeCount', {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (response.ok) {
      const data = await response.json();
      for (const model of data.results || []) urls.push(urlTag(`${base}/model/sf_${model.uid}`));
    }
  } catch (error) {
    console.error('Sitemap Sketchfab fetch failed:', error.message);
  }
  try {
    const response = await fetch('https://api.polyhaven.com/assets?t=models', {
      headers: { 'User-Agent': 'Free3DHub-Personal/2.0' },
      signal: AbortSignal.timeout(12000),
    });
    if (response.ok) {
      const assets = await response.json();
      for (const [slug] of Object.entries(assets).slice(0, 200)) urls.push(urlTag(`${base}/model/ph_${slug}`));
    }
  } catch (error) {
    console.error('Sitemap Poly Haven fetch failed:', error.message);
  }
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=43200');
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
}
