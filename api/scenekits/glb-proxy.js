const ALLOWED_HOSTS = new Set([
  'dl.polyhaven.org',
  'cdn.polyhaven.com',
  'polyhaven.com',
  'ambientcg.com',
  'cdn.ambientcg.com',
]);
const MAX_FILE_BYTES = 100 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:'
      && !url.username
      && !url.password
      && !url.port
      && ALLOWED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const value = req.query?.url;
  if (typeof value !== 'string' || value.length > 2048) {
    return res.status(400).json({ error: 'missing_or_invalid_url' });
  }
  if (!isAllowedUrl(value)) return res.status(403).json({ error: 'domain_not_allowed' });

  try {
    let target = new URL(value);
    let upstream;
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      upstream = await fetch(target, {
        headers: { 'User-Agent': 'Free3DHub-Personal/2.0' },
        redirect: 'manual',
        signal: AbortSignal.timeout(30000),
      });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      if (redirects === MAX_REDIRECTS) throw new Error('too_many_redirects');
      const location = upstream.headers.get('location');
      if (!location) throw new Error('redirect_without_location');
      target = new URL(location, target);
      if (!isAllowedUrl(target.href)) return res.status(403).json({ error: 'redirect_domain_not_allowed' });
    }

    if (!upstream?.ok) throw new Error(`upstream_${upstream?.status || 'failed'}`);
    const contentLength = Number(upstream.headers.get('content-length'));
    if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES) {
      return res.status(413).json({ error: 'file_too_large' });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_FILE_BYTES) return res.status(413).json({ error: 'file_too_large' });

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('[glb-proxy]', error.message);
    return res.status(502).json({ error: 'proxy_failed' });
  }
}
