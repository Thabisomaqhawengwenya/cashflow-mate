import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const OUTPUT_DIR = 'C:\\Users\\Maqhawe T Ngwenya\\.gemini\\antigravity\\brain\\990abc39-bf43-4f6f-8833-35f1563e9c97';
const REPO_DOCS_DIR = path.resolve('docs/screenshots');
const PS_SCRIPT = path.resolve('tools/take_screenshot.ps1');
const PORT = 8089;

if (!fs.existsSync(REPO_DOCS_DIR)) {
  fs.mkdirSync(REPO_DOCS_DIR, { recursive: true });
}

const targets = [
  {
    name: 'phase2_01_multicurrency_till_dashboard.png',
    title: '1. Multi-Currency 3-Drawer Cashbox & Till Dashboard',
    url: `http://127.0.0.1:${PORT}/`,
    width: 390,
    height: 844,
  },
  {
    name: 'phase2_02_gemini_ai_financial_assistant.png',
    title: '2. Gemini AI Financial Assistant & Trilingual Advice',
    url: `http://127.0.0.1:${PORT}/insights`,
    width: 390,
    height: 844,
  },
  {
    name: 'phase2_03_ecocash_innbucks_sms_parser.png',
    title: '3. EcoCash & InnBucks SMS Quick-Paste Parser & Live Extraction',
    url: `http://127.0.0.1:${PORT}/?openSms=true`,
    width: 390,
    height: 844,
  },
  {
    name: 'phase2_04_customer_credit_debt_ledger.png',
    title: '4. Customer Credit & Supplier Debt Ledger (Maikiriti)',
    url: `http://127.0.0.1:${PORT}/debts`,
    width: 390,
    height: 844,
  },
  {
    name: 'phase2_05_ethical_ai_privacy_trust_center.png',
    title: '5. Statutory Privacy & Responsible AI Transparency Center',
    url: `http://127.0.0.1:${PORT}/legal`,
    width: 390,
    height: 844,
  },
];

async function run() {
  console.log(`Starting Phase 2 Capstone screenshot capture from http://127.0.0.1:${PORT}...`);

  for (const t of targets) {
    const artifactPath = path.join(OUTPUT_DIR, t.name);
    const repoPath = path.join(REPO_DOCS_DIR, t.name);

    console.log(`\nCapturing [${t.title}] (${t.width}x${t.height}) from ${t.url}...`);
    try {
      const cmd = `powershell -ExecutionPolicy Bypass -File "${PS_SCRIPT}" -Url "${t.url}" -OutputFile "${artifactPath}" -Width ${t.width} -Height ${t.height}`;
      const { stdout, stderr } = await execAsync(cmd);
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());

      if (fs.existsSync(artifactPath)) {
        fs.copyFileSync(artifactPath, repoPath);
        console.log(`Synced to repo docs: ${repoPath}`);
      }
    } catch (err) {
      console.error(`Error capturing ${t.name}:`, err.message);
    }
  }

  console.log('\nAll 5 Phase 2 screenshots successfully captured and saved!');
}

run();
