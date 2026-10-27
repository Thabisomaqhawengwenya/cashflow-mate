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

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  let filePath = path.join(DIST_DIR, reqPath);

  // Serve static assets if they exist
  if (reqPath.startsWith('/_expo/') || reqPath.startsWith('/assets/') || reqPath === '/favicon.ico') {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      return res.end(data);
    }
  }

  // Fallback to index.html for Expo Router SPA client routing
  const indexPath = path.join(DIST_DIR, 'index.html');
  const data = fs.readFileSync(indexPath);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
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
