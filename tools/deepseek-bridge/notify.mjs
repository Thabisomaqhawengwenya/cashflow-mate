#!/usr/bin/env node
/**
 * DeepSeek Bridge - Event Notifier CLI
 * -------------------------------------
 * DeepSeek runs this script (or calls HTTP POST http://127.0.0.1:45124/notify)
 * to notify Antigravity whenever DeepSeek has completed an action or turn.
 *
 * Usage:
 *   node notify.mjs "Finished updating API routes"
 *   node notify.mjs --event deepseek.turn.completed --summary "Added tests for transaction importer"
 *   node notify.mjs --event deepseek.file.saved --file "services/storage.ts"
 *   node notify.mjs --details '{"filesChanged": 3, "testsPassed": 8}'
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

// Non-flag arguments serve as summary
const positionalArgs = ARGS.filter((a, i) => {
  if (a.startsWith('-')) return false;
  const prev = ARGS[i - 1];
  if (prev && ['--event', '--summary', '--file', '--details', '--pipe', '--port'].includes(prev)) return false;
  return true;
});

const PIPE_PATH = process.env.DEEPSEEK_BRIDGE_PIPE || argValue('--pipe', '\\\\.\\pipe\\deepseek-bridge');
const HTTP_PORT = parseInt(process.env.DEEPSEEK_BRIDGE_PORT || argValue('--port', '45124'), 10);
const NO_ENSURE = hasFlag('--no-ensure');

const EVENT_NAME = argValue('--event', 'deepseek.turn.completed');
const SUMMARY = argValue('--summary', positionalArgs.join(' ') || 'DeepSeek action completed');
const FILE_PATH = argValue('--file', null);
const DETAILS_RAW = argValue('--details', null);

let parsedDetails = null;
if (DETAILS_RAW) {
  try {
    parsedDetails = JSON.parse(DETAILS_RAW);
  } catch {
    parsedDetails = { raw: DETAILS_RAW };
  }
}

const payload = {
  event: EVENT_NAME,
  summary: SUMMARY,
  file: FILE_PATH,
  details: parsedDetails,
  source: 'deepseek-client',
  ts: new Date().toISOString(),
};

function tryPipe(pipePath, data) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(pipePath);
    socket.once('connect', () => {
      socket.write(JSON.stringify(data) + '\n', () => {
        socket.end();
        resolve(true);
      });
    });
    socket.once('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

function tryHttp(port, data) {
  return new Promise((resolve, reject) => {
    const reqData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: port,
        path: '/notify',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(reqData),
        },
        timeout: 3000,
      },
      (res) => {
        let respBody = '';
        res.on('data', (c) => (respBody += c));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(respBody || '{}'));
          } else {
            reject(new Error(`HTTP status ${res.statusCode}: ${respBody}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timed out'));
    });
    req.write(reqData);
    req.end();
  });
}

async function ensureServerRunning() {
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

  // Wait for server to come up
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      await tryPipe(PIPE_PATH, { ping: true });
      return;
    } catch {}
    try {
      await tryHttp(HTTP_PORT, { ping: true });
      return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function main() {
  // First attempt via Named Pipe
  try {
    await tryPipe(PIPE_PATH, payload);
    console.log(JSON.stringify({ status: 'delivered', transport: 'named-pipe', event: payload }));
    return;
  } catch (pipeErr) {
    // Next attempt via HTTP
    try {
      const httpRes = await tryHttp(HTTP_PORT, payload);
      console.log(JSON.stringify({ status: 'delivered', transport: 'http', result: httpRes }));
      return;
    } catch (httpErr) {
      if (NO_ENSURE) {
        console.error(`[deepseek-notify] Failed connecting to server: ${pipeErr.message} | ${httpErr.message}`);
        process.exit(1);
      }

      // Auto-start server and retry
      console.error('[deepseek-notify] Server not running, auto-starting server.mjs in background...');
      await ensureServerRunning();

      try {
        await tryPipe(PIPE_PATH, payload);
        console.log(JSON.stringify({ status: 'delivered', transport: 'named-pipe-autostart', event: payload }));
      } catch {
        const httpRes = await tryHttp(HTTP_PORT, payload);
        console.log(JSON.stringify({ status: 'delivered', transport: 'http-autostart', result: httpRes }));
      }
    }
  }
}

main().catch((err) => {
  console.error('[deepseek-notify] Error:', err.message);
  process.exit(1);
});
