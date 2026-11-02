import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const DIST_DIR = path.resolve('my-app/dist');
const PORT = 8089;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath);

  // Serve static assets if they exist
  if (reqPath.startsWith('/_expo/') || reqPath.startsWith('/assets/') || reqPath === '/favicon.ico') {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType, ...NO_CACHE_HEADERS });
      return res.end(data);
    }

    // If a stale chunk hash was requested after a rebuild (e.g. /_expo/static/js/web/login-oldhash.js),
    // automatically match the latest file with the same route prefix in that directory!
    const dir = path.dirname(filePath);
    const base = path.basename(filePath);
    const dashIdx = base.lastIndexOf('-');
    if (dashIdx > 0 && base.endsWith('.js') && fs.existsSync(dir)) {
      const prefix = base.slice(0, dashIdx + 1);
      const candidates = fs.readdirSync(dir).filter((f) => f.startsWith(prefix) && f.endsWith('.js'));
      if (candidates.length > 0) {
        const fallbackFile = path.join(dir, candidates[0]);
        const data = fs.readFileSync(fallbackFile);
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          ...NO_CACHE_HEADERS,
        });
        return res.end(data);
      }
    }
  }

  // Fallback to index.html for Expo Router SPA client routing
  const indexPath = path.join(DIST_DIR, 'index.html');
  const data = fs.readFileSync(indexPath);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...NO_CACHE_HEADERS });
  res.end(data);
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n======================================================`);
  console.log(`  CASHFLOW MATE — INTERACTIVE LIVE PREVIEW`);
  console.log(`======================================================`);
  console.log(`\n🟢 App running at: ${url}`);
  console.log(`\nTip: Press F12 -> Toggle Device Toolbar (Ctrl+Shift+M)`);
  console.log(`     to preview in mobile device dimensions (iPhone / Android).`);
  console.log(`\nPress Ctrl+C to stop the preview server.\n`);

  // Automatically open default browser on Windows
  exec(`start ${url}`);
});
