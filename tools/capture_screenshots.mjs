import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const DIST_DIR = path.resolve('my-app/dist');
const OUTPUT_DIR = 'C:\\Users\\Maqhawe T Ngwenya\\.gemini\\antigravity\\brain\\990abc39-bf43-4f6f-8833-35f1563e9c97';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
};

// 1. Simple static file server
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  let filePath = path.join(DIST_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else {
      filePath = path.join(DIST_DIR, 'index.html');
    }
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 8089;
server.listen(PORT, async () => {
  console.log(`Static server running at http://localhost:${PORT}`);

  const screens = [
    { name: 'home', url: `http://localhost:${PORT}/index.html` },
    { name: 'profile_security', url: `http://localhost:${PORT}/modal.html` },
    { name: 'transactions', url: `http://localhost:${PORT}/transactions.html` },
    { name: 'debts', url: `http://localhost:${PORT}/debts.html` },
    { name: 'insights', url: `http://localhost:${PORT}/insights.html` },
  ];

const TMP_PROFILE = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'chrome_screenshot_profile');
if (!fs.existsSync(TMP_PROFILE)) {
  fs.mkdirSync(TMP_PROFILE, { recursive: true });
}

  for (const s of screens) {
    const outPath = path.join(OUTPUT_DIR, `screenshot_${s.name}.png`);
    console.log(`Capturing ${s.name} -> ${outPath}...`);
    try {
      const cmd = `"${CHROME_PATH}" --headless --user-data-dir="${TMP_PROFILE}" --no-first-run --no-default-browser-check --disable-gpu --disable-extensions --window-size=390,844 --screenshot="${outPath}" "${s.url}"`;
      execSync(cmd, { stdio: 'inherit', timeout: 15000 });
      console.log(`Captured ${s.name} successfully!`);
    } catch (err) {
      console.error(`Error capturing ${s.name}:`, err.message);
    }
  }

  console.log('All screenshots captured!');
  server.close();
  process.exit(0);
});
