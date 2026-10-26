#!/usr/bin/env node
/**
 * Antigravity Bridge
 * ------------------
 * Connects to the running Antigravity IDE over its Chrome DevTools Protocol
 * WebSocket (the IDE's `DevToolsActivePort`), observes the live agent state in
 * the conversation renderer, and republishes "Antigravity finished a turn"
 * events on a local Windows named pipe.
 *
 * Why CDP? Antigravity is an Electron app and its DevTools endpoint is the
 * only stable, non-private socket it exposes locally. The bridge attaches to
 * the conversation page, injects a read-only observer, and listens for the
 * agent's loading state to go true -> false. It never writes files in the
 * workspace and it does not touch the agent's messages.
 *
 * Usage:
 *   node bridge.mjs                     # run in the foreground
 *   node bridge.mjs --no-toast          # don't raise a native notification
 *   node bridge.mjs --toast-test        # send one test notification on attach
 *   node bridge.mjs --pipe "\\.\pipe\some-name"
 *
 * Outputs:
 *   .state/events.jsonl   append-only event log
 *   .state/bridge.log     human-readable log
 *   .state/bridge.json    current state (pid, pipe, attached, conversation)
 *
 * Subscribers (see watch.mjs) receive newline-delimited JSON:
 *   {"event":"bridge.hello", ...}
 *   {"event":"bridge.attached", ...}
 *   {"event":"agent.turn.started", ...}
 *   {"event":"agent.turn.completed", ...}
 */

import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSION = '1.0.0';
const BINDING_NAME = '__agBridgeNotify';
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
const EVENTS_FILE = path.join(STATE_DIR, 'events.jsonl');
const LOG_FILE = path.join(STATE_DIR, 'bridge.log');
const STATE_FILE = path.join(STATE_DIR, 'bridge.json');
const TOAST_ENABLED = !hasFlag('--no-toast') && process.env.AG_BRIDGE_NO_TOAST !== '1';
const APPDATA = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const DEVTOOLS_FILE = path.join(APPDATA, 'Antigravity', 'DevToolsActivePort');
const STARTED_AT = new Date().toISOString();

fs.mkdirSync(STATE_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Logging + state
// ---------------------------------------------------------------------------

function log(level, message, extra) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}${extra ? ' ' + JSON.stringify(extra) : ''}`;
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch {
    /* logging must never crash the bridge */
  }
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

const runtime = {
  attached: false,
  working: null,
  conversationId: null,
  conversationTitle: null,
  devtoolsPort: null,
  lastEventAt: null,
};

function writeState() {
  const state = {
    pid: process.pid,
    version: VERSION,
    startedAt: STARTED_AT,
    pipe: PIPE_PATH,
    eventsFile: EVENTS_FILE,
    devtoolsPort: runtime.devtoolsPort,
    attached: runtime.attached,
    working: runtime.working,
    conversationId: runtime.conversationId,
    conversationTitle: runtime.conversationTitle,
    lastEventAt: runtime.lastEventAt,
    updatedAt: new Date().toISOString(),
  };
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2) + '\n');
  } catch (err) {
    log('warn', 'state write failed', { error: err.message });
  }
}

// ---------------------------------------------------------------------------
// Named pipe publisher
// ---------------------------------------------------------------------------

/** @type {Set<import('node:net').Socket>} */
const subscribers = new Set();

function helloEvent() {
  return {
    event: 'bridge.hello',
    ts: new Date().toISOString(),
    source: 'antigravity-bridge',
    version: VERSION,
    pid: process.pid,
    pipe: PIPE_PATH,
    attached: runtime.attached,
    devtoolsPort: runtime.devtoolsPort,
    conversationId: runtime.conversationId,
    conversationTitle: runtime.conversationTitle,
    working: runtime.working,
    startedAt: STARTED_AT,
  };
}

const pipeServer = net.createServer((socket) => {
  subscribers.add(socket);
  socket.setEncoding('utf8');
  socket.on('close', () => subscribers.delete(socket));
  socket.on('error', () => subscribers.delete(socket));
  socket.on('data', () => {
    /* clients are read-only; ignore inbound frames */
  });
  try {
    socket.write(JSON.stringify(helloEvent()) + '\n');
  } catch {
    subscribers.delete(socket);
  }
});

pipeServer.on('error', (err) => {
  log('error', 'named pipe server error', { pipe: PIPE_PATH, error: err.message });
  process.exitCode = 1;
});

pipeServer.listen(PIPE_PATH, () => {
  log('info', 'named pipe listening', { pipe: PIPE_PATH });
  writeState();
});

function publish(eventName, data) {
  const event = {
    event: eventName,
    ts: new Date().toISOString(),
    source: 'antigravity-bridge',
    version: VERSION,
    ...data,
  };
  runtime.lastEventAt = event.ts;

  try {
    fs.appendFileSync(EVENTS_FILE, JSON.stringify(event) + '\n');
  } catch (err) {
    log('warn', 'event log write failed', { error: err.message });
  }

  const line = JSON.stringify(event) + '\n';
  for (const socket of subscribers) {
    try {
      socket.write(line);
    } catch {
      subscribers.delete(socket);
    }
  }

  if (eventName === 'agent.turn.completed') {
    log('info', 'turn completed', {
      conversationId: event.conversationId,
      durationMs: event.durationMs,
      workedFor: event.workedFor,
    });
    void sendToast(event);
  } else {
    log('info', eventName, { conversationId: event.conversationId });
  }
  writeState();
}

// ---------------------------------------------------------------------------
// Observer (injected into the Antigravity renderer)
// ---------------------------------------------------------------------------

const OBSERVER_SOURCE = String.raw`
(() => {
  if (window.__agBridgeObserver) return;
  window.__agBridgeObserver = true;

  var BINDING = '__agBridgeNotify';
  var queue = [];

  function send(payload) {
    try {
      if (typeof window[BINDING] === 'function') {
        window[BINDING](payload);
        return true;
      }
    } catch (e) { /* binding not ready yet */ }
    queue.push(payload);
    if (queue.length > 50) queue.shift();
    return false;
  }

  function notify(event) {
    if (!event.ts) event.ts = new Date().toISOString();
    send(JSON.stringify(event));
  }

  setInterval(function () {
    if (typeof window[BINDING] !== 'function') return;
    while (queue.length) {
      try { window[BINDING](queue.shift()); } catch (e) { return; }
    }
  }, 500);

  function visible(el) {
    if (!el) return false;
    try {
      if (el.getClientRects().length === 0) return false;
      var style = window.getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') return false;
      return true;
    } catch (e) { return false; }
  }

  function conversationId() {
    var match = /\/c\/([^/?#]+)/.exec(location.pathname || '');
    return match ? match[1] : null;
  }

  function lastAssistantText() {
    var nodes = document.querySelectorAll('[data-testid="planner-response-text"]');
    if (!nodes.length) return '';
    var text = (nodes[nodes.length - 1].innerText || '').trim();
    return text.slice(-800);
  }

  function workedFor() {
    var nodes = document.querySelectorAll('[data-testid="worked-for-collapsible"]');
    if (!nodes.length) return null;
    return (nodes[nodes.length - 1].innerText || '').trim().slice(0, 40);
  }

  function workedCount() {
    return document.querySelectorAll('[data-testid="worked-for-collapsible"]').length;
  }

  function readState() {
    var loading = visible(document.querySelector('[data-testid="agent-loading"]'));
    var stop = visible(document.querySelector('button[aria-label="Stop execution"]'));
    return {
      working: !!(loading || stop),
      conversationId: conversationId(),
      title: document.title || null,
      workedCount: workedCount(),
      workedFor: workedFor(),
      lastAssistantText: lastAssistantText(),
      url: location.href
    };
  }
  window.__agBridgeState = readState;

  var wasWorking = null;
  var turnStartedAt = 0;
  var turnStartSource = 'observed';
  var lastWorkedCount = workedCount();
  var settleTimer = null;
  var lastCompletedAt = 0;
  var lastSignature = '';

  function complete(reason, state) {
    var now = Date.now();
    if (now - lastCompletedAt < 1500) return;
    lastCompletedAt = now;
    var duration = turnStartedAt ? now - turnStartedAt : null;
    notify({
      type: 'turn-completed',
      reason: reason,
      conversationId: state.conversationId,
      title: state.title,
      url: state.url,
      durationMs: duration,
      durationSource: duration === null ? 'unknown' : turnStartSource,
      workedFor: state.workedFor,
      workedCount: state.workedCount,
      lastAssistantText: state.lastAssistantText
    });
    turnStartedAt = 0;
  }

  function tick() {
    var state;
    try { state = readState(); } catch (e) { return; }

    var signature = String(state.working) + '|' + String(state.conversationId) + '|' + String(state.workedCount) + '|' + String(state.title);
    if (signature !== lastSignature) {
      lastSignature = signature;
      notify({
        type: 'state',
        working: state.working,
        conversationId: state.conversationId,
        title: state.title,
        workedCount: state.workedCount
      });
    }

    if (wasWorking === null) {
      wasWorking = state.working;
      if (state.working) {
        turnStartedAt = Date.now();
        turnStartSource = 'approx';
        notify({
          type: 'turn-started',
          initial: true,
          conversationId: state.conversationId,
          title: state.title,
          url: state.url
        });
      }
    } else if (state.working && !wasWorking) {
      wasWorking = true;
      turnStartedAt = Date.now();
      turnStartSource = 'observed';
      if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
      notify({
        type: 'turn-started',
        initial: false,
        conversationId: state.conversationId,
        title: state.title,
        url: state.url
      });
    } else if (!state.working && wasWorking) {
      wasWorking = false;
      if (settleTimer) clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        settleTimer = null;
        var recheck;
        try { recheck = readState(); } catch (e) { return; }
        if (!recheck.working) complete('idle', recheck);
        else wasWorking = true;
      }, 1000);
    }

    if (state.workedCount > lastWorkedCount && !state.working) {
      complete('worked-chip', state);
    }
    lastWorkedCount = state.workedCount;
  }

  try {
    var mutationObserver = new MutationObserver(function () { tick(); });
    mutationObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-label', 'data-testid', 'class', 'style']
    });
  } catch (e) { /* documentElement may not exist yet */ }

  setInterval(tick, 700);
  tick();

  notify({
    type: 'observer-ready',
    conversationId: conversationId(),
    title: document.title,
    working: readState().working
  });
})();
`;

// ---------------------------------------------------------------------------
// CDP connection
// ---------------------------------------------------------------------------

let ws = null;
let cdpId = 1;
/** @type {Map<number, (msg: any) => void>} */
const cdpPending = new Map();
let connecting = false;
let attached = false;
let devtoolsPort = null;
let lastAttachError = null;
let lastAttachLogAt = 0;

function readDevToolsPort() {
  try {
    const first = fs.readFileSync(DEVTOOLS_FILE, 'utf8').split(/\r?\n/)[0].trim();
    const port = Number(first);
    if (!Number.isInteger(port) || port <= 0) throw new Error(`invalid port: ${first}`);
    return port;
  } catch (err) {
    throw new Error(`cannot read Antigravity DevToolsActivePort (${DEVTOOLS_FILE}): ${err.message}`);
  }
}

async function findConversationTarget() {
  devtoolsPort = readDevToolsPort();
  runtime.devtoolsPort = devtoolsPort;
  const response = await fetch(`http://127.0.0.1:${devtoolsPort}/json/list`, {
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error(`DevTools HTTP ${response.status}`);
  const targets = await response.json();
  const page =
    targets.find((target) => target.type === 'page' && /\/c\/[0-9a-f-]{8,}/i.test(target.url)) ||
    targets.find((target) => target.type === 'page' && String(target.url).startsWith('https://127.0.0.1'));
  if (!page || !page.webSocketDebuggerUrl) throw new Error('no Antigravity conversation page target');
  return page;
}

function cdpSend(method, params = {}, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      reject(new Error('CDP socket is not open'));
      return;
    }
    const id = cdpId++;
    const timer = setTimeout(() => {
      cdpPending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, timeoutMs);
    cdpPending.set(id, (message) => {
      clearTimeout(timer);
      resolve(message);
    });
    try {
      ws.send(JSON.stringify({ id, method, params }));
    } catch (err) {
      clearTimeout(timer);
      cdpPending.delete(id);
      reject(err);
    }
  });
}

async function queryState() {
  if (!attached) return null;
  try {
    const result = await cdpSend('Runtime.evaluate', {
      expression:
        "(function(){try{return JSON.stringify(window.__agBridgeState ? window.__agBridgeState() : null);}catch(e){return JSON.stringify({error:String(e)});}})()",
      returnByValue: true,
      awaitPromise: false,
    });
    const value = result?.result?.result?.value;
    if (!value) return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function refreshState() {
  const state = await queryState();
  if (!state || state.error) return;
  if (
    state.working !== runtime.working ||
    state.conversationId !== runtime.conversationId ||
    state.title !== runtime.conversationTitle
  ) {
    runtime.working = state.working;
    runtime.conversationId = state.conversationId;
    runtime.conversationTitle = state.title;
    writeState();
  }
}

async function sendBridgeToast(title, body) {
  try {
    const options = { title, body, silent: false, payload: { source: 'antigravity-bridge', event: 'bridge.connected' } };
    await cdpSend('Runtime.evaluate', {
      expression: `window.nativeNotifications && window.nativeNotifications.send(${JSON.stringify(options)})`,
      returnByValue: true,
      awaitPromise: false,
    });
    log('info', 'native notification sent', { title });
  } catch (err) {
    log('warn', 'native notification failed', { error: err.message });
  }
}

async function sendToast(event) {
  if (!TOAST_ENABLED) return;
  const title = 'Antigravity finished';
  const workedFor = event.workedFor || formatDuration(event.durationMs);
  const body = [event.title || event.conversationId || 'Conversation', workedFor ? `Worked ${workedFor}` : null]
    .filter(Boolean)
    .join('\n');
  try {
    const options = {
      title,
      body,
      silent: false,
      payload: {
        source: 'antigravity-bridge',
        event: 'agent.turn.completed',
        conversationId: event.conversationId || null,
      },
    };
    await cdpSend('Runtime.evaluate', {
      expression: `window.nativeNotifications && window.nativeNotifications.send(${JSON.stringify(options)})`,
      returnByValue: true,
      awaitPromise: false,
    });
  } catch (err) {
    log('warn', 'completion toast failed', { error: err.message });
  }
}

function formatDuration(ms) {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms <= 0) return null;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function handleObserverPayload(payload) {
  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    log('warn', 'invalid observer payload', { error: err.message });
    return;
  }

  if (event.type === 'observer-ready') {
    log('info', 'observer ready', {
      conversationId: event.conversationId,
      working: event.working,
    });
    void refreshState();
    return;
  }

  if (event.type === 'state') {
    runtime.working = event.working;
    runtime.conversationId = event.conversationId;
    runtime.conversationTitle = event.title;
    writeState();
    return;
  }

  if (event.type === 'turn-started') {
    runtime.working = true;
    runtime.conversationId = event.conversationId;
    runtime.conversationTitle = event.title;
    publish('agent.turn.started', {
      conversationId: event.conversationId,
      title: event.title,
      url: event.url,
      initial: Boolean(event.initial),
    });
    return;
  }

  if (event.type === 'turn-completed') {
    runtime.working = false;
    runtime.conversationId = event.conversationId;
    runtime.conversationTitle = event.title;
    publish('agent.turn.completed', {
      conversationId: event.conversationId,
      title: event.title,
      url: event.url,
      durationMs: typeof event.durationMs === 'number' ? event.durationMs : null,
      durationSource: event.durationSource || null,
      workedFor: event.workedFor || null,
      workedCount: event.workedCount ?? null,
      lastAssistantText: event.lastAssistantText || null,
    });
  }
}

function onCdpMessage(raw) {
  let message;
  try {
    message = JSON.parse(raw);
  } catch {
    return;
  }

  if (message.id != null && cdpPending.has(message.id)) {
    const resolve = cdpPending.get(message.id);
    cdpPending.delete(message.id);
    resolve(message);
    return;
  }

  if (message.method === 'Runtime.bindingCalled' && message.params?.name === BINDING_NAME) {
    handleObserverPayload(message.params.payload);
  }
}

async function setupSession() {
  await cdpSend('Runtime.enable');
  await cdpSend('Page.enable');
  await cdpSend('Runtime.addBinding', { name: BINDING_NAME });
  await cdpSend('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVER_SOURCE });
  await cdpSend('Runtime.evaluate', {
    expression: OBSERVER_SOURCE,
    returnByValue: true,
    awaitPromise: false,
  });

  attached = true;
  runtime.attached = true;

  const state = await queryState();
  if (state && !state.error) {
    runtime.working = state.working;
    runtime.conversationId = state.conversationId;
    runtime.conversationTitle = state.title;
  }
  writeState();
  log('info', 'attached', {
    port: devtoolsPort,
    conversationId: runtime.conversationId,
    title: runtime.conversationTitle,
    working: runtime.working,
  });

  publish('bridge.attached', {
    conversationId: runtime.conversationId,
    title: runtime.conversationTitle,
    working: runtime.working,
    devtoolsPort,
  });

  if (hasFlag('--toast-test')) {
    await sendBridgeToast(
      'Antigravity bridge connected',
      'DeepSeek is now listening for Antigravity turn completions.'
    );
  }
}

async function connect() {
  if (connecting || attached) return;
  connecting = true;
  try {
    const target = await findConversationTarget();
    log('info', 'attaching to Antigravity', {
      port: devtoolsPort,
      target: target.title,
    });

    const socket = new WebSocket(target.webSocketDebuggerUrl);
    ws = socket;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket connect timeout')), 6000);
      socket.addEventListener(
        'open',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true }
      );
      socket.addEventListener(
        'error',
        () => {
          clearTimeout(timer);
          reject(new Error('WebSocket connect failed'));
        },
        { once: true }
      );
    });

    socket.addEventListener('message', (event) => onCdpMessage(event.data));
    socket.addEventListener('close', () => {
      const wasAttached = attached;
      attached = false;
      runtime.attached = false;
      ws = null;
      cdpPending.clear();
      log(wasAttached ? 'warn' : 'info', 'CDP socket closed');
      writeState();
    });
    socket.addEventListener('error', () => {
      /* close handler runs next */
    });

    await setupSession();
    lastAttachError = null;
  } catch (err) {
    attached = false;
    runtime.attached = false;
    ws = null;
    cdpPending.clear();
    const now = Date.now();
    if (lastAttachError !== err.message || now - lastAttachLogAt > 30000) {
      log('warn', 'attach failed (will retry)', { error: err.message });
      lastAttachError = err.message;
      lastAttachLogAt = now;
    }
    writeState();
  } finally {
    connecting = false;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

writeState();
log('info', 'Antigravity bridge starting', { version: VERSION, pipe: PIPE_PATH, stateDir: STATE_DIR });

void connect();
setInterval(() => {
  if (!attached && !connecting) void connect();
}, 3000);

setInterval(() => {
  if (attached) void refreshState();
}, 5000);

function shutdown(signal) {
  log('info', 'shutting down', { signal });
  try {
    pipeServer.close();
  } catch {
    /* ignore */
  }
  if (ws) {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
  }
  runtime.attached = false;
  writeState();
  setTimeout(() => process.exit(0), 100).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  log('error', 'uncaught exception', { error: err.message, stack: err.stack });
});
