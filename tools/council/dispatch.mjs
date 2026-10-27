/**
 * CashFlow Mate - Council of AI Agents Dispatcher
 * Allows Mr Q and Antigravity (2iC) to dispatch tasks across Council members
 */

import { execSync } from 'child_process';
import path from 'path';
import { COUNCIL_REGISTRY } from './hub.mjs';

function printCouncilRoster() {
  console.log('\n========================================================================================');
  console.log('                 THE HIGH COUNCIL OF AI AGENTS — CASHFLOW MATE');
  console.log('                 Supreme Commander : Mr Q (Maqhawe T Ngwenya)');
  console.log('                 Executive 2iC     : Antigravity');
  console.log('========================================================================================\n');
  COUNCIL_REGISTRY.forEach((m, idx) => {
    console.log(` [${String(idx + 1).padStart(2, ' ')}] ${m.name.padEnd(26)} | ${m.role.padEnd(46)} | ${m.tier}`);
  });
  console.log(`\nTotal Active Council Strength: ${COUNCIL_REGISTRY.length} Specialized AI Engines.`);
  console.log('Ready to receive executive commands from Mr Q.\n');
}

const args = process.argv.slice(2);
if (args.includes('--roster') || args.length === 0) {
  printCouncilRoster();
} else if (args.includes('--dispatch')) {
  const taskIndex = args.indexOf('--dispatch') + 1;
  const task = args[taskIndex] || 'General System Review';
  console.log(`[Council 2iC] Antigravity dispatching task to Council: "${task}"`);
  
  // 1. Notify DeepSeek Bridge
  try {
    execSync(`node tools/deepseek-bridge/notify.mjs --event council.task.dispatched --summary "${task.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
    });
  } catch (e) {
    console.error('Bridge notification error:', e.message);
  }

  // 2. Notify Codex IPC Socket Bridge
  try {
    execSync(`node tools/codex-bridge/notify.mjs "${task.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
    });
  } catch (e) {
    console.error('Codex Bridge notification error:', e.message);
  }
}
