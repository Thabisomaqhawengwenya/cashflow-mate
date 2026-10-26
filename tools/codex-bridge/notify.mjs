#!/usr/bin/env node
/**
 * CashFlow Mate — Codex Socket Communicator
 * -------------------------------------------
 * Sends directives from Mr Q and 2iC Antigravity to active Codex sockets.
 *
 * Usage:
 *   node notify.mjs "Supreme Commander Mr Q orders Council synchronization"
 *   node notify.mjs --directive "Verify 3-drawer cashbox architecture"
 */

import { CODEX_PIPES, pingCodexSandbox, sendCodexMessage } from './client.mjs';

const args = process.argv.slice(2);
const directive = args.find((a, i) => i > 0 && args[i - 1] === '--directive') ||
  args.filter(a => !a.startsWith('-')).join(' ') ||
  'Council status check';

console.log(`\n======================================================`);
console.log(`  CODEX SOCKET BRIDGE — ACTIVE IPC COMMUNICATOR`);
console.log(`  Commander: Mr Q | Orchestrator: Antigravity (2iC)`);
console.log(`======================================================\n`);

console.log(`[Codex Bridge] Transmitting directive to Codex socket...`);
console.log(`Target Socket: ${CODEX_PIPES.sandbox}`);
console.log(`Directive: "${directive}"\n`);

try {
  const result = await pingCodexSandbox();
  console.log(`[Codex Bridge] Socket Response Received:`);
  console.log(JSON.stringify(result.parsed, null, 2));

  if (result.status === 'success') {
    console.log(`\n🟢 [SUCCESS] Communication channel with Codex verified and active.`);
  } else {
    console.log(`\n🟡 [STATUS] Socket connected. Code: ${result.status}`);
  }
} catch (err) {
  console.error(`🔴 [ERROR] Failed to communicate with Codex socket:`, err.message);
  process.exit(1);
}
