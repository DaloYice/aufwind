// Mini-Webserver ohne Abhängigkeiten: node server.mjs [port]
// Lauscht auf allen Schnittstellen, damit die App auch vom Handy im WLAN erreichbar ist.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.argv[2]) || 8080;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

// Lokale Nachbildung der Cloudflare-Funktion /api/sync/:id mit Arbeitsspeicher statt KV
const { onRequest: syncHandler } = await import(pathToFileURL(join(root, 'functions', 'api', 'sync', '[id].js')).href);
const kvMap = new Map();
const KV = {
  async get(k, t) { const v = kvMap.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
  async put(k, v) { kvMap.set(k, v); },
  async delete(k) { kvMap.delete(k); },
};
const readBody = (req) => new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c).toString())); });

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path.startsWith('/api/sync/')) {
    const body = ['PUT', 'POST'].includes(req.method) ? await readBody(req) : undefined;
    const r = await syncHandler({ request: new Request(`http://x${req.url}`, { method: req.method, body }), env: { AUFWIND_SYNC: KV }, params: { id: path.split('/')[3] } });
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(await r.text());
    return;
  }
  if (path.endsWith('/')) path += 'index.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(normalize(root)) || /[\\/](tests|\.git)[\\/]/.test(file)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Nicht gefunden');
  }
}).listen(port, () => {
  console.log(`Aufwind läuft: http://localhost:${port}`);
  for (const list of Object.values(networkInterfaces())) {
    for (const n of list || []) if (n.family === 'IPv4' && !n.internal) console.log(`Im WLAN:      http://${n.address}:${port}`);
  }
});
