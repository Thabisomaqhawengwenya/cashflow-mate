#!/usr/bin/env node
/**
 * DeepSeek Bridge - Socket & Event Server
 * ---------------------------------------
 * Serves as the central communication bridge between DeepSeek and Antigravity.
 *
 * Exposes:
 *  1. Windows Named Pipe: \\.\pipe\deepseek-bridge (default)
 *  2. Local HTTP & SSE API: http://127.0.0.1:45124
 *
 * When DeepSeek completes an action, turn, or task:
 *  - DeepSeek calls POST /notify or writes to the socket/pipe
 *  - Server broadcasts the event to all connected watchers (Antigravity background tasks)
 *  - Triggers native Windows desktop toast notification for Mr Q
 *  - Wakes up Antigravity's waiting harness/background task with exit code 0
 */

import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const VERSION = '1.0.0';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARGS = process.argv.slice(2);

const hasFlag = (flag) => ARGS.includes(flag);
const argValue = (name, fallback) => {
  const index = ARGS.indexOf(name);
  if (index === -1) return fallback;
  const value = ARGS[index + 1];
  return value && !value.startsWith('-') ? value : fallback;
};

const STATE_DIR = process.env.DEEPSEEK_BRIDGE_STATE_DIR || path.join(__dirname, '.state');
const PIPE_PATH = process.env.DEEPSEEK_BRIDGE_PIPE || argValue('--pipe', '\\\\.\\pipe\\deepseek-bridge');
const HTTP_PORT = parseInt(process.env.DEEPSEEK_BRIDGE_PORT || argValue('--port', '45124'), 10);
const HOST = '127.0.0.1';

const EVENTS_FILE = path.join(STATE_DIR, 'events.jsonl');
const LOG_FILE = path.join(STATE_DIR, 'server.log');
const STATE_FILE = path.join(STATE_DIR, 'server.json');
const TOAST_ENABLED = !hasFlag('--no-toast') && process.env.DEEPSEEK_BRIDGE_NO_TOAST !== '1';
const STARTED_AT = new Date().toISOString();

fs.mkdirSync(STATE_DIR, { recursive: true });

function log(level, message, extra) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}${extra ? ' ' + JSON.stringify(extra) : ''}`;
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {}
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

const runtime = {
  activePipeSubscribers: 0,
  activeHttpSubscribers: 0,
  lastEvent: null,
  totalEventsPublished: 0,
};

function writeState() {
  const state = {
    pid: process.pid,
    version: VERSION,
    startedAt: STARTED_AT,
    pipe: PIPE_PATH,
    httpUrl: `http://${HOST}:${HTTP_PORT}`,
    eventsFile: EVENTS_FILE,
    pipeSubscribers: runtime.activePipeSubscribers,
    httpSubscribers: runtime.activeHttpSubscribers,
    lastEvent: runtime.lastEvent,
    totalEvents: runtime.totalEventsPublished,
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  } catch (err) {
    log('warn', 'state write failed', { error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Toast Notification Dispatcher
// ---------------------------------------------------------------------------

function triggerNativeToast(title, body) {
  if (!TOAST_ENABLED) return;
  const scriptPath = path.join(__dirname, 'toast.ps1');
  if (fs.existsSync(scriptPath)) {
    try {
      const child = spawn(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Title', title, '-Message', body],
        { detached: true, stdio: 'ignore', windowsHide: true }
      );
      child.unref();
    } catch (err) {
      log('warn', 'PowerShell toast spawn error', { error: err.message });
    }
  }

  // Also notify via Antigravity DevTools if available
  try {
    const devtoolsPath = path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'Antigravity',
      'DevToolsActivePort'
    );
    if (fs.existsSync(devtoolsPath)) {
      const port = Number(fs.readFileSync(devtoolsPath, 'utf8').split(/\r?\n/)[0].trim());
      if (port > 0) {
        // DevTools notification is secondary and non-blocking
        log('info', 'Antigravity DevTools detected on port', { port });
      }
    }
  } catch {}
}

// ---------------------------------------------------------------------------
// Subscriber Sets
// ---------------------------------------------------------------------------

/** @type {Set<import('node:net').Socket>} */
const pipeSubscribers = new Set();

/** @type {Set<import('node:http').ServerResponse>} */
const sseSubscribers = new Set();

// ---------------------------------------------------------------------------
// Event Publishing
// ---------------------------------------------------------------------------

function publish(data) {
  const event = {
    event: data.event || 'deepseek.action',
    ts: new Date().toISOString(),
    source: 'deepseek-bridge',
    version: VERSION,
    summary: data.summary || data.message || 'DeepSeek completed an action',
    ...data,
  };

  runtime.lastEvent = event;
  runtime.totalEventsPublished++;

  // 1. Write to persistent JSONL log
  try {
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n');
  } catch (err) {
    log('warn', 'failed appending to events.jsonl', { error: err.message });
  }

  const payloadString = JSON.stringify(event) + '\n';

  // 2. Broadcast to named pipe subscribers
  for (const socket of pipeSubscribers) {
    try {
      socket.write(payloadString);
    } catch {
      pipeSubscribers.delete(socket);
    }
  }

  // 3. Broadcast to SSE subscribers
  const sseData = `data: ${JSON.stringify(event)}\n\n`;
  for (const res of sseSubscribers) {
    try {
      res.write(sseData);
    } catch {
      sseSubscribers.delete(res);
    }
  }

  runtime.activePipeSubscribers = pipeSubscribers.size;
  runtime.activeHttpSubscribers = sseSubscribers.size;
  writeState();

  log('info', `Event published: ${event.event}`, {
    summary: event.summary,
    pipeSubscribers: pipeSubscribers.size,
    httpSubscribers: sseSubscribers.size,
  });

  // 4. Trigger Toast Notification
  const toastTitle = `DeepSeek Notification`;
  const toastBody = `${event.summary}`;
  triggerNativeToast(toastTitle, toastBody);

  return event;
}

// ---------------------------------------------------------------------------
// Named Pipe Server
// ---------------------------------------------------------------------------

const pipeServer = net.createServer((socket) => {
  pipeSubscribers.add(socket);
  runtime.activePipeSubscribers = pipeSubscribers.size;
  writeState();

  socket.setEncoding('utf8');

  // Send hello handshake
  const hello = {
    event: 'deepseek.hello',
    ts: new Date().toISOString(),
    source: 'deepseek-bridge',
    version: VERSION,
    pipe: PIPE_PATH,
    pid: process.pid,
  };
  try {
    socket.write(JSON.stringify(hello) + '\n');
  } catch {
    pipeSubscribers.delete(socket);
  }

  let buffer = '';
  socket.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep remainder
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed);
        publish(parsed);
      } catch (err) {
        log('warn', 'invalid JSON received on pipe', { input: trimmed, error: err.message });
      }
    }
  });

  const cleanup = () => {
    pipeSubscribers.delete(socket);
    runtime.activePipeSubscribers = pipeSubscribers.size;
    writeState();
  };

  socket.on('close', cleanup);
  socket.on('error', cleanup);
});

pipeServer.on('error', (err) => {
  log('error', 'Named pipe server error', { pipe: PIPE_PATH, error: err.message });
});

pipeServer.listen(PIPE_PATH, () => {
  log('info', `Named pipe listening on ${PIPE_PATH}`);
  writeState();
});

// ---------------------------------------------------------------------------
// HTTP & SSE Server
// ---------------------------------------------------------------------------

const httpServer = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // Health / Status
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify(
        {
          status: 'ok',
          service: 'deepseek-bridge',
          version: VERSION,
          pid: process.pid,
          pipe: PIPE_PATH,
          httpUrl: `http://${HOST}:${HTTP_PORT}`,
          pipeSubscribers: pipeSubscribers.size,
          httpSubscribers: sseSubscribers.size,
          lastEvent: runtime.lastEvent,
          totalEvents: runtime.totalEventsPublished,
        },
        null,
        2
      )
    );
    return;
  }

  // SSE Stream for subscribers
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ event: 'connected', ts: new Date().toISOString() })}\n\n`);

    sseSubscribers.add(res);
    runtime.activeHttpSubscribers = sseSubscribers.size;
    writeState();

    req.on('close', () => {
      sseSubscribers.delete(res);
      runtime.activeHttpSubscribers = sseSubscribers.size;
      writeState();
    });
    return;
  }

  // POST /notify or /event
  if (req.method === 'POST' && (url.pathname === '/notify' || url.pathname === '/event')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB limit
    });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        const publishedEvent = publish(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            ok: true,
            event: publishedEvent,
            subscribers: pipeSubscribers.size + sseSubscribers.size,
          })
        );
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body', message: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.on('error', (err) => {
  log('error', `HTTP server error on port ${HTTP_PORT}`, { error: err.message });
});

httpServer.listen(HTTP_PORT, HOST, () => {
  log('info', `DeepSeek Bridge HTTP & SSE server listening on http://${HOST}:${HTTP_PORT}`);
  writeState();
});

// ---------------------------------------------------------------------------
// Clean Shutdown
// ---------------------------------------------------------------------------

function shutdown() {
  log('info', 'Shutting down DeepSeek Bridge server...');
  try {
    pipeServer.close();
  } catch {}
  try {
    httpServer.close();
  } catch {}
  try {
    if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
  } catch {}
  process.exit(0);
}

process.on('uncaughtException', (err) => {
  log('error', 'Uncaught Exception in server.mjs', { error: err.stack || err.message });
});

process.on('unhandledRejection', (reason) => {
  log('error', 'Unhandled Rejection in server.mjs', { reason: String(reason) });
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
