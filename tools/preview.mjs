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
      const candidates = fs
        .readdirSync(dir)
        .filter((f) => f.startsWith(prefix) && f.endsWith('.js'))
        .sort(
          (a, b) =>
            fs.statSync(path.join(dir, b)).mtimeMs -
            fs.statSync(path.join(dir, a)).mtimeMs
        );
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
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Inject automatic demo session initializer for seamless preview & screenshot capture
  const sessionSeedScript = `
    <script>
      (function() {
        try {
          // Always dismiss cookie banner in preview
          localStorage.setItem('@cashflow_cookie_storage_consent_v1', 'accepted');
          localStorage.setItem('@cashflow_cookie_consent_v1', 'true');

          var sessionKey = '@cashflow_user_session_v2';
          var txKey = '@cashflow_mate_tx_v1';
          var debtsKey = '@cashflow_mate_debts_v1';

          var demoSession = {
            id: 'client_demo_mbare_01',
            name: 'Farai Moyo',
            username: 'farai_moyo',
            email: 'client@cashflowmate.co.zw',
            role: 'trader',
            currency: 'USD',
            businessName: 'Mbare Fresh Produce & Tuckshop',
            stallNumber: 'Stall #14, Vegetable Shed',
            city: 'Harare (Mbare Musika)',
            isLoggedIn: true,
            onboardingCompleted: true,
            token: 'demo_token_mbare_client'
          };
          localStorage.setItem(sessionKey, JSON.stringify(demoSession));

          var today = new Date().toISOString().split('T')[0];

          var demoTx = [
            {
              id: 'tx_01',
              transactionDate: today,
              description: 'Mbare Musika Morning Produce Sales (Tomatoes & Onions)',
              amount: 145.00,
              currency: 'USD',
              direction: 'inflow',
              type: 'business_income',
              category: 'sales_goods',
              reviewStatus: 'confirmed'
            },
            {
              id: 'tx_02',
              transactionDate: today,
              description: 'Murehwa Farm Delivery (5 Crates Cabbage)',
              amount: 35.00,
              currency: 'USD',
              direction: 'outflow',
              type: 'business_expense',
              category: 'stock_purchase',
              reviewStatus: 'confirmed'
            },
            {
              id: 'tx_03',
              transactionDate: today,
              description: 'City of Harare Daily Stall Levy',
              amount: 15.00,
              currency: 'USD',
              direction: 'outflow',
              type: 'business_expense',
              category: 'rent',
              reviewStatus: 'confirmed'
            },
            {
              id: 'tx_04',
              transactionDate: today,
              description: 'EcoCash Customer Till Payment #194827',
              amount: 850.00,
              currency: 'ZWG',
              direction: 'inflow',
              type: 'business_income',
              category: 'sales_goods',
              reviewStatus: 'confirmed'
            },
            {
              id: 'tx_05',
              transactionDate: today,
              description: 'ZAR Cash Cross-Border Produce Settlement',
              amount: 420.00,
              currency: 'ZAR',
              direction: 'inflow',
              type: 'business_income',
              category: 'sales_goods',
              reviewStatus: 'confirmed'
            }
          ];
          localStorage.setItem(txKey, JSON.stringify(demoTx));

          var demoDebts = [
            {
              id: 'debt_01',
              personName: 'Mai Rudo (Corner Tuckshop)',
              direction: 'owed_to_business',
              totalAmount: 35.00,
              paidAmount: 0.00,
              currency: 'USD',
              recordedDate: today,
              dueDate: '2026-11-09',
              status: 'outstanding',
              notes: 'Cooking oil and sugar on credit'
            },
            {
              id: 'debt_02',
              personName: 'Tendai Mutasa (Stand 4)',
              direction: 'owed_to_business',
              totalAmount: 20.00,
              paidAmount: 10.00,
              currency: 'USD',
              recordedDate: today,
              status: 'partially_paid',
              notes: 'Cabbage bulk order ($10 deposit received)'
            },
            {
              id: 'debt_03',
              personName: 'Honde Valley Banana Supplier',
              direction: 'owed_by_business',
              totalAmount: 50.00,
              paidAmount: 0.00,
              currency: 'USD',
              recordedDate: today,
              dueDate: '2026-11-12',
              status: 'outstanding',
              notes: 'Balance for Friday delivery'
            }
          ];
          localStorage.setItem(debtsKey, JSON.stringify(demoDebts));
        } catch(e) {}
      })();
    </script>
  `;

  if (html.includes('</head>')) {
    html = html.replace('</head>', `${sessionSeedScript}</head>`);
  }

  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...NO_CACHE_HEADERS });
  res.end(html);
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
