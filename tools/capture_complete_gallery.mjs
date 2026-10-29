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

const PORT = 8089;
server.listen(PORT, '127.0.0.1', async () => {
  console.log(`SPA Server running at http://127.0.0.1:${PORT}`);

  const targets = [
    // 1. Home Dashboard
    { name: 'screenshot_mobile_home.png', url: `http://127.0.0.1:${PORT}/`, width: 390, height: 844 },
    { name: 'screenshot_desktop_home.png', url: `http://127.0.0.1:${PORT}/`, width: 1280, height: 800 },

    // 2. Ledger Records / Transactions
    { name: 'screenshot_mobile_records.png', url: `http://127.0.0.1:${PORT}/transactions`, width: 390, height: 844 },
    { name: 'screenshot_desktop_records.png', url: `http://127.0.0.1:${PORT}/transactions`, width: 1280, height: 800 },

    // 3. CSV Data Ingestion
    { name: 'screenshot_mobile_import.png', url: `http://127.0.0.1:${PORT}/import`, width: 390, height: 844 },
    { name: 'screenshot_desktop_import.png', url: `http://127.0.0.1:${PORT}/import`, width: 1280, height: 800 },

    // 4. Customer Debts & Mukando Credit
    { name: 'screenshot_mobile_debts.png', url: `http://127.0.0.1:${PORT}/debts`, width: 390, height: 844 },
    { name: 'screenshot_desktop_debts.png', url: `http://127.0.0.1:${PORT}/debts`, width: 1280, height: 800 },

    // 5. AI Financial Assistant / Insights
    { name: 'screenshot_mobile_insights.png', url: `http://127.0.0.1:${PORT}/insights`, width: 390, height: 844 },
    { name: 'screenshot_desktop_insights.png', url: `http://127.0.0.1:${PORT}/insights`, width: 1280, height: 800 },

    // 6. Profile & Security / Market Exchange Rates / Backup Modal
    { name: 'screenshot_mobile_profile.png', url: `http://127.0.0.1:${PORT}/modal`, width: 390, height: 844 },
    { name: 'screenshot_desktop_profile.png', url: `http://127.0.0.1:${PORT}/modal`, width: 1280, height: 800 },

    // 7. Sign In Screen
    { name: 'screenshot_mobile_login.png', url: `http://127.0.0.1:${PORT}/login`, width: 390, height: 844 },
    { name: 'screenshot_desktop_login.png', url: `http://127.0.0.1:${PORT}/login`, width: 1280, height: 800 },

    // 8. Sign Up Screen
    { name: 'screenshot_mobile_signup.png', url: `http://127.0.0.1:${PORT}/signup`, width: 390, height: 844 },
    { name: 'screenshot_desktop_signup.png', url: `http://127.0.0.1:${PORT}/signup`, width: 1280, height: 800 },
  ];

  for (const t of targets) {
    const outPath = path.join(OUTPUT_DIR, t.name);
    console.log(`\nCapturing [${t.name}] (${t.width}x${t.height}) from ${t.url}...`);
    try {
      const cmd = `powershell -ExecutionPolicy Bypass -File "${PS_SCRIPT}" -Url "${t.url}" -OutputFile "${outPath}" -Width ${t.width} -Height ${t.height}`;
      const { stdout, stderr } = await execAsync(cmd);
      console.log(stdout.trim());
      if (stderr) console.error('STDERR:', stderr.trim());
    } catch (err) {
      console.error(`Error capturing ${t.name}:`, err.message);
    }
  }

  console.log('\nAll 16 screenshots captured successfully!');
  server.close();
  process.exit(0);
});
