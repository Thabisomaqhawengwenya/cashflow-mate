/**
 * CashFlow Mate - Council of AI Agents Dispatcher
 * Allows Mr Q and Antigravity (2iC) to dispatch tasks across Council members:
 * - DeepSeek (Strategic Thinker & Edge Case Auditor)
 * - Aesthetic Craftsman (UI/UX & Design Specialist)
 * - Core Systems Engineer (Deterministic Math & Storage)
 * - Security Sentinel (HMAC-SHA256 & QA Harness)
 * - Zimbabwe Market Analyst (EcoCash, Mukando & Trader Empathy)
 */

import { execSync } from 'child_process';
import path from 'path';

const COUNCIL_MEMBERS = [
  { id: 'deepseek', name: 'DeepSeek', role: 'Strategic Thinker & Critical Auditor', status: 'Connected via Bridge' },
  { id: 'aesthetic', name: 'Aesthetic Craftsman', role: 'UI/UX & Material 3 Expressive Lead', status: 'Active Subagent' },
  { id: 'core', name: 'Core Systems Engineer', role: 'Deterministic Math & Storage Engine', status: 'Active Subagent' },
  { id: 'sentinel', name: 'Security Sentinel', role: 'HMAC-SHA256 & QA Test Automation', status: 'Active Subagent' },
  { id: 'zim-analyst', name: 'Zim Market Analyst', role: 'EcoCash, Mukando & Trader Empathy', status: 'Active Subagent' },
];

function printCouncilRoster() {
  console.log('\n======================================================');
  console.log('   THE COUNCIL OF AI AGENTS — CASHFLOW MATE');
  console.log('   Supreme Commander : Mr Q');
  console.log('   Second in Command : Antigravity');
  console.log('======================================================\n');
  COUNCIL_MEMBERS.forEach((m, idx) => {
    console.log(` [${idx + 1}] ${m.name.padEnd(22)} | ${m.role.padEnd(38)} | ${m.status}`);
  });
  console.log('\nReady to receive executive commands from Mr Q.\n');
}

const args = process.argv.slice(2);
if (args.includes('--roster') || args.length === 0) {
  printCouncilRoster();
} else if (args.includes('--dispatch')) {
  const taskIndex = args.indexOf('--dispatch') + 1;
  const task = args[taskIndex] || 'General System Review';
  console.log(`[Council 2iC] Antigravity dispatching task to Council: "${task}"`);
  
  // Notify DeepSeek Bridge
  try {
    execSync(`node tools/deepseek-bridge/notify.mjs --event council.task.dispatched --summary "${task.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
    });
  } catch (e) {
    console.error('Bridge notification error:', e.message);
  }
}
