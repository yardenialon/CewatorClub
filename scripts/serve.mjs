#!/usr/bin/env node
/**
 * Minimal static server for local use only (binds to 127.0.0.1).
 * Some browsers restrict localStorage for file:// pages; this avoids that.
 *
 *   node scripts/serve.mjs            -> http://127.0.0.1:8765/
 *   PORT=9000 node scripts/serve.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml' };

export function createStaticServer(dir = root) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
    if (path.endsWith('/')) path += 'index.html';
    try {
      const body = await readFile(join(dir, path));
      res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 8765;
  createStaticServer().listen(port, '127.0.0.1', () => {
    console.log(`SimpliiGood Creator Club prototype: http://127.0.0.1:${port}/`);
    console.log('Local only. Do not expose this server to the internet.');
  });
}
