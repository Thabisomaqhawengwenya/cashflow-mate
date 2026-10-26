#!/usr/bin/env node
/**
 * DeepSeek Bridge - Antigravity Watcher
 * -------------------------------------
 * Subscribes to the DeepSeek socket/named pipe and listens for events from DeepSeek.
 *
 * When run with --once (recommended for Antigravity background tasks), it waits
 * for DeepSeek to complete an action, prints the event JSON to stdout, and exits 0.
 *
 * In Antigravity, running this as a background task will automatically wake Antigravity
 * the exact instant DeepSeek does something!
 *
 * Usage:
 *   node watch.mjs --once                         # waits for next DeepSeek event, then exits 0
 *   node watch.mjs --once --timeout 120           # waits up to 120s
 *   node watch.mjs --once --event deepseek.turn.completed
 *   node watch.mjs                                # follow mode: streams all events continuously
 */

import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARGS = process.argv.slice(2);

const hasFlag = (flag) => ARGS.includes(flag);
const argValue = (name, fallback) => {
  const index = ARGS.indexOf(name);
  if (index === -1) return fallback;
  const value = ARGS[index + 1];
  return value && !value.startsWith('-') ? value : fallback;
};

const PIPE_PATH = process.env.DEEPSEEK_BRIDGE_PIPE || argValue('--pipe', '\\\\.\\pipe\\deepseek-bridge');
const HTTP_PORT = parseInt(process.env.DEEPSEEK_BRIDGE_PORT || argValue('--port', '45124'), 10);
const ONCE = hasFlag('--once');
const NO_ENSURE = hasFlag('--no-ensure');
const VERBOSE = hasFlag('--verbose');
const FILTER_EVENTS = argValue('--event', 'all')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const TIMEOUT_SECONDS = Math.max(0, parseInt(argValue('--timeout', '0'), 10));

function diag(msg) {
  if (VERBOSE) console.error(`[deepseek-watch] ${msg}`);
}

function matches(event) {
  if (!event || !event.event) return false;
  // Ignore internal hello handshakes unless explicitly requested
  if (event.event === 'deepseek.hello' || event.event === 'connected') {
    return FILTER_EVENTS.includes('deepseek.hello');
  }
  if (FILTER_EVENTS.includes('all')) return true;
  return FILTER_EVENTS.includes(event.event);
}

function tryConnectPipe(pipePath) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(pipePath);
    socket.once('connect', () => resolve(socket));
    socket.once('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

async function ensureServer() {
  diag('Server not reachable, spawning server.mjs in background...');
  const serverScript = path.join(__dirname, 'server.mjs');
  if (process.platform === 'win32') {
    spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        `Start-Process -FilePath "${process.execPath}" -ArgumentList "${serverScript}" -WindowStyle Hidden`,
      ],
      { detached: true, stdio: 'ignore' }
    ).unref();
  } else {
    const child = spawn(process.execPath, [serverScript], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
  }

  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      return await tryConnectPipe(PIPE_PATH);
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('Timed out waiting for DeepSeek Bridge server to start');
}

function handleEvent(event) {
  if (!matches(event)) {
    diag(`Skipping non-matching event: ${event.event}`);
    return;
  }

  // Print event to stdout for the harness / Antigravity
  console.log(JSON.stringify(event));

  if (ONCE) {
    diag('Single-event match satisfied (--once), exiting 0.');
    process.exit(0);
  }
}

async function main() {
  let socket = null;

  try {
    socket = await tryConnectPipe(PIPE_PATH);
  } catch (err) {
    if (NO_ENSURE) {
      console.error(`[deepseek-watch] Failed connecting to pipe ${PIPE_PATH}: ${err.message}`);
      process.exit(1);
    }
    socket = await ensureServer();
  }

  diag(`Connected to DeepSeek Bridge pipe: ${PIPE_PATH}`);

  if (TIMEOUT_SECONDS > 0) {
    setTimeout(() => {
      console.log(
        JSON.stringify({
          event: 'watch.timeout',
          source: 'deepseek-watch',
          timeoutSeconds: TIMEOUT_SECONDS,
          ts: new Date().toISOString(),
        })
      );
      process.exit(2);
    }, TIMEOUT_SECONDS * 1000).unref();
  }

  let buffer = '';
  socket.setEncoding('utf8');
  socket.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // save incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        handleEvent(parsed);
      } catch (err) {
        diag(`Failed parsing JSON line: ${err.message}`);
      }
    }
  });

  socket.on('error', (err) => {
    console.error(`[deepseek-watch] Pipe error: ${err.message}`);
    process.exit(1);
  });

  socket.on('close', () => {
    diag('Pipe connection closed.');
    if (ONCE) {
      // If we closed before receiving a match in ONCE mode, exit with error
      process.exit(1);
    }
  });
}

main().catch((err) => {
  console.error('[deepseek-watch] Fatal error:', err.message);
  process.exit(1);
});
