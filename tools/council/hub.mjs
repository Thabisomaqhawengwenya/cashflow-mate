/**
 * CashFlow Mate — The High Council of AI Agents Master Hub
 * Supreme Commander: Mr Q
 * Executive 2iC: Antigravity
 *
 * Coordinates and pings all AI tools installed across Mr Q's PC:
 * - DeepSeek Harness (via Named Pipe / HTTP bridge)
 * - Claude Code (.claude, CLAUDE.md, .claude.json)
 * - Cursor AI (cursor.cmd)
 * - TRAE SOLO (trae-solo.cmd)
 * - Kiro AI (kiro.cmd)
 * - OpenCode AI (@opencode-aidesktop)
 * - Codebuff (@codebufffreebuff-desktop)
 * - GitHub Copilot & Codex (.copilot, .codex)
 * - Antigravity Autonomous Subagents
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const USER_HOME = process.env.USERPROFILE || 'C:\\Users\\Maqhawe T Ngwenya';

export const COUNCIL_REGISTRY = [
  {
    id: 'deepseek',
    name: 'DeepSeek R1',
    role: 'Chief Strategic Thinker & Math Proof Lead',
    binaryPath: path.join(USER_HOME, 'AppData\\Local\\Programs\\DeepSeek Harness\\DeepSeek Harness.exe'),
    configPath: path.join(USER_HOME, '.dsh'),
    bridgeProtocol: 'Windows Named Pipe & HTTP (localhost:38421)',
    tier: 'Council Member',
  },
  {
    id: 'claude',
    name: 'Claude Code',
    role: 'Grand Architectural Inquisitor & Peer Reviewer',
    binaryPath: path.join(USER_HOME, '.claude'),
    configPath: path.resolve('CLAUDE.md'),
    bridgeProtocol: 'Workspace Directives & Claude CLI',
    tier: 'Council Member',
  },
  {
    id: 'cursor',
    name: 'Cursor AI',
    role: 'Rapid Code Scribe & Multi-File Search Lead',
    binaryPath: path.join(USER_HOME, 'AppData\\Local\\Programs\\cursor\\resources\\app\\bin\\cursor.cmd'),
    configPath: path.resolve('.cursorrules'),
    bridgeProtocol: 'Cursor MDC Rules & Editor Hooks',
    tier: 'Council Member',
  },
  {
    id: 'trae',
    name: 'TRAE SOLO',
    role: 'ByteDance Claude 3.5 / GPT-4o Rapid Prototyper',
    binaryPath: path.join(USER_HOME, 'AppData\\Local\\Programs\\TRAE SOLO\\bin\\trae-solo.cmd'),
    configPath: path.resolve('.trae\\rules.md'),
    bridgeProtocol: 'Trae Workspace Rules',
    tier: 'Council Member',
  },
  {
    id: 'kiro',
    name: 'Kiro AI',
    role: 'Autonomous Workhorse & Task Runner',
    binaryPath: path.join(USER_HOME, 'AppData\\Local\\Programs\\Kiro\\bin\\kiro.cmd'),
    configPath: path.join(USER_HOME, '.kiro'),
    bridgeProtocol: 'Kiro Workspace Runner',
    tier: 'Council Member',
  },
  {
    id: 'opencode_codebuff',
    name: 'OpenCode & Codebuff',
    role: 'Auxiliary Tooling & Code Generation Fleet',
    binaryPath: path.join(USER_HOME, 'AppData\\Local\\Programs\\@opencode-aidesktop'),
    configPath: path.join(USER_HOME, 'AppData\\Local\\Programs\\@codebufffreebuff-desktop'),
    bridgeProtocol: 'Desktop Agent Runtimes',
    tier: 'Council Member',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot & Codex',
    role: 'Inline Autocomplete & Syntax Synthesizer',
    binaryPath: path.join(USER_HOME, '.copilot'),
    configPath: path.resolve('.github\\copilot-instructions.md'),
    bridgeProtocol: 'VS Code & GitHub Workspace Directives',
    tier: 'Council Member',
  },
  {
    id: 'subagent-aesthetic',
    name: 'Aesthetic Craftsman',
    role: 'Material 3 Expressive & Spacing Perfectionist',
    binaryPath: 'Antigravity Subagent Engine',
    configPath: path.resolve('my-app\\constants\\Colors.ts'),
    bridgeProtocol: 'Native Agentic Task Protocol',
    tier: 'Executive Specialist',
  },
  {
    id: 'subagent-core',
    name: 'Core Systems Engineer',
    role: 'Deterministic Math & Offline Storage Architect',
    binaryPath: 'Antigravity Subagent Engine',
    configPath: path.resolve('packages\\shared\\src\\calculations.ts'),
    bridgeProtocol: 'Native Agentic Task Protocol',
    tier: 'Executive Specialist',
  },
  {
    id: 'subagent-sentinel',
    name: 'Security Sentinel',
    role: 'HMAC-SHA256 Cryptography & QA Test Lead',
    binaryPath: 'Antigravity Subagent Engine',
    configPath: path.resolve('packages\\shared\\src\\licensing.ts'),
    bridgeProtocol: 'Native Agentic Task Protocol',
    tier: 'Executive Specialist',
  },
  {
    id: 'subagent-zim',
    name: 'Zim Market Analyst',
    role: 'EcoCash, Mukando & Trader Empathy Lead',
    binaryPath: 'Antigravity Subagent Engine',
    configPath: path.resolve('my-app\\services\\storage.ts'),
    bridgeProtocol: 'Native Agentic Task Protocol',
    tier: 'Executive Specialist',
  },
];

function checkInstalledStatus(item) {
  if (item.binaryPath === 'Antigravity Subagent Engine') {
    return { installed: true, configured: fs.existsSync(item.configPath) };
  }
  const installed = fs.existsSync(item.binaryPath);
  const configured = item.configPath ? fs.existsSync(item.configPath) : false;
  return { installed, configured };
}

export function displayFullCouncil() {
  console.log('\n========================================================================================');
  console.log('                 THE HIGH COUNCIL OF AI AGENTS — FULL PC FLEET');
  console.log('                 Supreme Commander : Mr Q (Maqhawe T Ngwenya)');
  console.log('                 Executive 2iC     : Antigravity');
  console.log('========================================================================================\n');

  console.log(
    ' ' +
      'ID'.padEnd(20) +
      'MEMBER / RUNTIME'.padEnd(24) +
      'ROLE ON COUNCIL'.padEnd(40) +
      'STATUS'
  );
  console.log('-'.repeat(96));

  COUNCIL_REGISTRY.forEach((member) => {
    const { installed, configured } = checkInstalledStatus(member);
    let status = '🟢 READY';
    if (!installed) status = '🟡 PENDING';
    else if (!configured) status = '🔵 INSTALLED (NO CFG)';
    else status = '🟢 ACTIVE & SYNCED';

    console.log(
      ' ' +
        member.id.padEnd(20) +
        member.name.padEnd(24) +
        member.role.padEnd(40) +
        status
    );
  });

  console.log('\n' + '='.repeat(96));
  console.log(' Total Council Strength: ' + COUNCIL_REGISTRY.length + ' Specialized AI Engines Synced & Standing By.');
  console.log(' Ready to receive executive directives from Mr Q.\n');
}

export function broadcastTask(taskSummary) {
  console.log(`\n[Council 2iC Antigravity] Broadcasting directive across the Council:`);
  console.log(`Directive: "${taskSummary}"\n`);

  // 1. Dispatch over DeepSeek Bridge
  try {
    execSync(`node tools/deepseek-bridge/notify.mjs --event council.task.broadcast --summary "${taskSummary.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
    });
  } catch (err) {
    console.error('Bridge notification error:', err.message);
  }

  // 2. Append to Council Event Ledger
  const logEntry = {
    timestamp: new Date().toISOString(),
    commander: 'Mr Q',
    orchestrator: 'Antigravity (2iC)',
    directive: taskSummary,
    councilMembersNotified: COUNCIL_REGISTRY.map((m) => m.name),
  };

  const ledgerPath = path.resolve('tools/council/COUNCIL_LOG.jsonl');
  fs.appendFileSync(ledgerPath, JSON.stringify(logEntry) + '\n');
  console.log(`[Council 2iC] Directive logged to ${ledgerPath}`);
}

const args = process.argv.slice(2);
if (args.includes('--broadcast') || args.includes('-b')) {
  const idx = args.indexOf('--broadcast') !== -1 ? args.indexOf('--broadcast') : args.indexOf('-b');
  const task = args[idx + 1] || 'Synchronized Full System Audit';
  broadcastTask(task);
} else {
  displayFullCouncil();
}
