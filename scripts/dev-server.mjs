#!/usr/bin/env node
/* Local preview server with the same routes as netlify.toml (no dependencies).
   Usage: npm run dev   →  http://localhost:3000                                */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const PORT = +process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const ROUTES = [
  [/^\/portfolio\/?$/, '/portfolio.html'], [/^\/portfolio\/.+/, '/project.html'],
  [/^\/services\/?$/, '/services.html'], [/^\/services\/.+/, '/service.html'],
  [/^\/admin\/login\/?$/, '/admin/login.html'], [/^\/admin\/reset\/?$/, '/admin/reset.html'],
  [/^\/admin(\/dashboard.*)?\/?$/, '/admin/index.html'],
];

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  for (const [re, to] of ROUTES) if (re.test(path)) { path = to; break; }
  if (path.endsWith('/')) path += 'index.html';
  if (!extname(path)) path += '.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  try {
    await stat(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': TYPES['.html'] });
    res.end(await readFile(join(ROOT, '404.html')));
  }
}).listen(PORT, () => console.log(`SHAH DESIGNS running at http://localhost:${PORT}`));
