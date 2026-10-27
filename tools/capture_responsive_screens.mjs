import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const DIST_DIR = path.resolve('my-app/dist');
const OUTPUT_DIR = 'C:\\Users\\Maqhawe T Ngwenya\\.gemini\\antigravity\\brain\\990abc39-bf43-4f6f-8833-35f1563e9c97';
const PS_SCRIPT = path.resolve('tools/take_screenshot.ps1');

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

  if (reqPath.startsWith('/_expo/') || reqPath.startsWith('/assets/') || reqPath === '/favicon.ico') {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      return res.end(data);
    }
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  const data = fs.readFileSync(indexPath);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(data);
});

const PORT = 8092;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`SPA Server running at http://127.0.0.1:${PORT}`);

  const targets = [
    // Desktop Viewports (1280x800)
    { name: 'desktop_home', url: `http://127.0.0.1:${PORT}/`, width: 1280, height: 800 },
    { name: 'desktop_records', url: `http://127.0.0.1:${PORT}/transactions`, width: 1280, height: 800 },
    { name: 'desktop_debts', url: `http://127.0.0.1:${PORT}/debts`, width: 1280, height: 800 },
    
    // Mobile Viewports (390x844)
    { name: 'mobile_home', url: `http://127.0.0.1:${PORT}/`, width: 390, height: 844 },
    { name: 'mobile_records', url: `http://127.0.0.1:${PORT}/transactions`, width: 390, height: 844 },
  ];

  for (const t of targets) {
    const outPath = path.join(OUTPUT_DIR, `screenshot_${t.name}.png`);
    console.log(`\nCapturing ${t.name} (${t.width}x${t.height}) from ${t.url}...`);
    try {
      const cmd = `powershell -NoProfile -ExecutionPolicy Bypass -File "${PS_SCRIPT}" -Url "${t.url}" -OutputFile "${outPath}" -Width ${t.width} -Height ${t.height}`;
      const { stdout } = await execAsync(cmd);
      console.log(stdout.trim());
    } catch (err) {
      console.error(`Error capturing ${t.name}:`, err.message);
    }
  }

  console.log('\nAll captures completed!');
  server.close();
  process.exit(0);
});
