#!/usr/bin/env node
/**
 * Antigravity Watch
 * -----------------
 * Subscribes to the Antigravity bridge's local named pipe and turns bridge
 * events into process exit notifications. Designed to be run as a background
 * job from the DeepSeek Harness: when Antigravity finishes a turn, this process
 * prints the completion event and exits 0, which wakes the agent.
 *
 * Usage:
 *   node watch.mjs --once                        # wait for the next completed turn
 *   node watch.mjs --once --event agent.turn.started
 *   node watch.mjs --once --event all --timeout 600
 *   node watch.mjs                               # follow mode: stream every event
 *   node watch.mjs --no-ensure                   # fail instead of starting bridge
 *
 * Exit codes:
 *   0  matching event received (event JSON is printed on stdout)
 *   2  --timeout expired (watch.timeout event is printed on stdout)
 *   1  bridge unavailable / pipe error
 *
 * The bridge is auto-started in the background if it is not running yet.
 */

import fs from 'node:fs';
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

const STATE_DIR = process.env.AG_BRIDGE_STATE_DIR || path.join(__dirname, '.state');
const PIPE_PATH = process.env.AG_BRIDGE_PIPE || argValue('--pipe', '\\\\.\\pipe\\antigravity-bridge');
const ONCE = hasFlag('--once');
const VERBOSE = hasFlag('--verbose');
const NO_ENSURE = hasFlag('--no-ensure');
const EVENTS = argValue('--event', 'agent.turn.completed')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const TIMEOUT_MS = Math.max(0, Number(argValue('--timeout', '0')) * 1000) || 0;

function diag(message) {
  console.error(`[antigravity-watch] ${message}`);
}

function tryConnect(pipePath) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(pipePath);
    socket.once('connect', () => resolve(socket));
    socket.once('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

async function ensureBridge() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  diag('bridge not reachable, starting it in the background...');
  const child = spawn(process.execPath, [path.join(__dirname, 'bridge.mjs')], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      return await tryConnect(PIPE_PATH);
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error('bridge did not become reachable within 20s');
}

function matches(event) {
  if (event.event === 'bridge.hello') return EVENTS.includes('bridge.hello');
  return EVENTS.includes('all') || EVENTS.includes(event.event);
}

async function main() {
  let socket;
  try {
    socket = await tryConnect(PIPE_PATH);
  } catch (err) {
    if (NO_ENSURE) {
      diag(`cannot connect to ${PIPE_PATH}: ${err.message}`);
      process.exit(1);
    }
    try {
      socket = await ensureBridge();
    } catch (startErr) {
      diag(startErr.message);
      process.exit(1);
    }
  }

  socket.setEncoding('utf8');
  let buffer = '';
  let finished = false;

  const cleanup = () => {
    try {
      socket.destroy();
    } catch {
      /* ignore */
    }
  };

  const finish = (event, code) => {
    if (finished) return;
    finished = true;
    if (event) process.stdout.write(JSON.stringify(event) + '\n');
    cleanup();
    process.exit(code);
  };

  if (ONCE && TIMEOUT_MS > 0) {
    setTimeout(() => {
      finish(
        {
          event: 'watch.timeout',
          ts: new Date().toISOString(),
          source: 'antigravity-watch',
          waitedFor: EVENTS,
          timeoutMs: TIMEOUT_MS,
        },
        2
      );
    }, TIMEOUT_MS).unref();
  }

  socket.on('data', (chunk) => {
    buffer += chunk;
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;

      let event;
      try {
        event = JSON.parse(line);
      } catch {
        if (VERBOSE) diag(`unparseable line: ${line.slice(0, 120)}`);
        continue;
      }

      if (event.event === 'bridge.hello') {
        if (VERBOSE) {
          diag(
            `connected to bridge pid=${event.pid} attached=${event.attached} conversation=${event.conversationId || 'unknown'} working=${event.working}`
          );
        }
        if (ONCE && EVENTS.includes('bridge.hello')) finish(event, 0);
        else if (!ONCE && (EVENTS.includes('bridge.hello') || EVENTS.includes('all'))) {
          process.stdout.write(line + '\n');
        }
        continue;
      }

      if (ONCE) {
        if (matches(event)) finish(event, 0);
        else if (VERBOSE) diag(`ignoring ${event.event}`);
        continue;
      }

      // Follow mode: stream everything (hello filtered above unless asked for).
      if (event.event === 'bridge.hello' && !EVENTS.includes('bridge.hello')) continue;
      process.stdout.write(line + '\n');
    }
  });

  socket.on('close', () => {
    if (finished) return;
    diag('bridge pipe closed');
    process.exit(1);
  });

  socket.on('error', (err) => {
    if (finished) return;
    diag(`pipe error: ${err.message}`);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    if (!finished) diag('interrupted');
    cleanup();
    process.exit(130);
  });
}

void main().catch((err) => {
  diag(err.stack || err.message);
  process.exit(1);
});
