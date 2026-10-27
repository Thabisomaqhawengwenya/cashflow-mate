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

  // Otherwise fallback to index.html for Expo Router SPA client routing
  const indexPath = path.join(DIST_DIR, 'index.html');
  const data = fs.readFileSync(indexPath);
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(data);
});

const PORT = 8089;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`SPA Server running at http://127.0.0.1:${PORT}`);

  const screens = [
    { name: 'home', url: `http://127.0.0.1:${PORT}/` },
    { name: 'profile_security', url: `http://127.0.0.1:${PORT}/modal` },
    { name: 'transactions', url: `http://127.0.0.1:${PORT}/transactions` },
    { name: 'debts', url: `http://127.0.0.1:${PORT}/debts` },
    { name: 'insights', url: `http://127.0.0.1:${PORT}/insights` },
  ];

  for (const s of screens) {
    const outPath = path.join(OUTPUT_DIR, `screenshot_${s.name}.png`);
    console.log(`\nCapturing ${s.name} from ${s.url}...`);
    try {
      const cmd = `powershell -ExecutionPolicy Bypass -File "${PS_SCRIPT}" -Url "${s.url}" -OutputFile "${outPath}" -Width 390 -Height 844`;
      const { stdout, stderr } = await execAsync(cmd);
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());
    } catch (err) {
      console.error(`Failed to capture ${s.name}:`, err.message);
    }
  }

  console.log('\nAll screens captured successfully!');
  server.close();
  process.exit(0);
});
