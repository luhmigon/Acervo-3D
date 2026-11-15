import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(root, '.env') });
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT) || 3000;
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.py': 'text/x-python; charset=utf-8',
};

function proxyJSON(upstream, res, cache = 'public, max-age=60') {
  return fetch(upstream, {
    headers: { 'User-Agent': 'Free3DHub-Personal/2.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  }).then(async response => {
    const body = await response.text();
    res.writeHead(response.status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cache,
    });
    res.end(body);
  }).catch(error => {
    console.error('API proxy failed:', error.message);
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'upstream_failed' }));
  });
}

function toVercelRequest(req, url) {
  const query = Object.fromEntries(url.searchParams.entries());
  return Object.assign(req, { query });
}

async function serveFile(res, filePath, options = {}) {
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': options.cache || 'no-cache',
    });
    res.end(options.head ? undefined : data);
  } catch (error) {
    return sendFileError(res, error, options.head);
  }
}

async function sendFileError(res, error, head = false) {
  const missing = error.code === 'ENOENT' || error.code === 'ENOTDIR';
  if (missing) {
    try {
      const page = await fs.readFile(path.join(publicDir, '404.html'));
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(head ? undefined : page);
      return;
    } catch (pageError) {
      if (pageError.code !== 'ENOENT' && pageError.code !== 'ENOTDIR') {
        console.error('404 page read failed:', pageError);
      }
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(head ? undefined : 'Não encontrado');
    return;
  }
  console.error('Static file read failed:', error);
  res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(head ? undefined : 'Erro interno do servidor');
}

const server = http.createServer(async (req, res) => {
  let url;
  let pathname;
  try {
    url = new URL(req.url, `http://localhost:${port}`);
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('URL inválida');
  }
  const head = req.method === 'HEAD';
  const apiRoutes = {
    '/api/sketchfab': './api/sketchfab.js',
    '/api/polyhaven': './api/polyhaven.js',
    '/api/polyhaven-files': './api/polyhaven-files.js',
    '/api/polyhaven-gltf': './api/polyhaven-gltf.js',
    '/api/ambientcg': './api/ambientcg.js',
    '/api/model': './api/model.js',
    '/api/sitemap': './api/sitemap.js',
    '/api/mixamo': './api/mixamo.js',
    '/api/humanoids/mixamo': './api/humanoids/mixamo.js',
    '/api/humanoids/curated': './api/humanoids/curated.js',
    '/api/humanoids/search': './api/humanoids/search.js',
    '/api/scenekits/curated': './api/scenekits/curated.js',
    '/api/scenekits/search': './api/scenekits/search.js',
    '/api/scenekits/glb-proxy': './api/scenekits/glb-proxy.js',
    '/api/audio/curated': './api/audio/curated.js',
    '/api/audio/freesound': './api/audio/freesound.js',
    '/api/audio/pixabay': './api/audio/pixabay.js',
  };

  if (pathname.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' });
      return res.end();
    }
    const handlerPath = apiRoutes[pathname];
    if (!handlerPath) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'not_found' }));
    }
    try {
      const { default: handler } = await import(handlerPath);
      const request = toVercelRequest(req, url);
      res.status = code => { res.statusCode = code; return res; };
      res.json = value => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(value));
        return res;
      };
      res.send = value => { res.end(value); return res; };
      return await handler(request, res);
    } catch (error) {
      console.error(`Handler failed for ${pathname}:`, error);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'internal_error' }));
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  if (pathname === '/sitemap.xml') {
    url.pathname = '/api/sitemap';
    const { default: handler } = await import('./api/sitemap.js');
    const request = toVercelRequest(req, url);
    res.status = code => { res.statusCode = code; return res; };
    res.send = value => { res.end(head ? undefined : value); return res; };
    return handler(request, res);
  }
  const staticPages = {
    '/sobre': 'sobre.html',
    '/roadmap': 'roadmap.html',
    '/termos': 'termos.html',
    '/privacidade': 'privacidade.html',
  };
  if (staticPages[pathname]) {
    return serveFile(res, path.join(publicDir, staticPages[pathname]), { head });
  }
  if (pathname.startsWith('/model/')) {
    return serveFile(res, path.join(publicDir, 'model.html'), { head });
  }
  if (pathname === '/optimize') {
    return serveFile(res, path.join(publicDir, 'optimizer.html'), { head });
  }
  if (pathname === '/pbr-editor') {
    return serveFile(res, path.join(publicDir, 'pbr-editor.html'), { head });
  }
  if (pathname === '/batch-optimize') {
    return serveFile(res, path.join(publicDir, 'batch-optimizer.html'), { head });
  }
  if (pathname === '/scene-composer') {
    return serveFile(res, path.join(publicDir, 'scene-composer.html'), { head });
  }
  if (pathname === '/blender-addon') {
    return serveFile(res, path.join(publicDir, 'blender-addon.html'), { head });
  }

  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(publicDir, relative);
  if (!filePath.startsWith(`${publicDir}${path.sep}`) && filePath !== path.join(publicDir, 'index.html')) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    return sendFileError(res, error, head);
  }
});

server.listen(port, () => {
  console.log(`\n  🧊  Free3D Hub — Meu Acervo Pessoal\n  ➜  http://localhost:${port}\n`);
});
