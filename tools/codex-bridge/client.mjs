/**
 * CashFlow Mate — Codex Socket Bridge Client
 * -------------------------------------------
 * Connects directly to active OpenAI Codex Named Pipe IPC sockets on Windows:
 * - \\.\pipe\codex-ipc
 * - \\.\pipe\OpenAI.CodexSandbox.OpenAI.Codex_2p2nqsd0c76g0
 * - \\.\pipe\codex-app-tools-*
 *
 * Wire Protocol:
 * 4-byte Little-Endian UInt32 length prefix followed by UTF-8 JSON payload.
 */

import net from 'node:net';

export const CODEX_PIPES = {
  sandbox: '\\\\.\\pipe\\OpenAI.CodexSandbox.OpenAI.Codex_2p2nqsd0c76g0',
  ipc: '\\\\.\\pipe\\codex-ipc',
};

/**
 * Frames a JSON message with a 4-byte little-endian length prefix.
 */
export function frameMessage(obj) {
  const jsonStr = JSON.stringify(obj);
  const jsonBuf = Buffer.from(jsonStr, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(jsonBuf.length, 0);
  return Buffer.concat([lenBuf, jsonBuf]);
}

/**
 * Unframes a length-prefixed buffer into a JSON object or string.
 */
export function unframeMessage(buf) {
  if (!buf || buf.length < 4) return null;
  const len = buf.readUInt32LE(0);
  const jsonBuf = buf.subarray(4, 4 + len);
  try {
    return JSON.parse(jsonBuf.toString('utf8'));
  } catch {
    return jsonBuf.toString('utf8');
  }
}

/**
 * Sends a message to a Codex named pipe and waits for response.
 */
export async function sendCodexMessage(pipePath, messageObj, timeoutMs = 4000) {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const socket = net.createConnection(pipePath, () => {
      const packet = frameMessage(messageObj);
      socket.write(packet);
    });

    socket.on('data', (data) => {
      if (resolved) return;
      resolved = true;
      const parsed = unframeMessage(data);
      socket.end();
      resolve({ status: 'success', raw: data, parsed });
    });

    socket.on('error', (err) => {
      if (resolved) return;
      resolved = true;
      resolve({ status: 'error', error: err.message });
    });

    socket.setTimeout(timeoutMs, () => {
      if (resolved) return;
      resolved = true;
      socket.end();
      resolve({ status: 'timeout', message: 'Socket connection timed out.' });
    });
  });
}

/**
 * Pings Codex Sandbox IPC socket.
 */
export async function pingCodexSandbox() {
  const msg = {
    version: 1,
    type: 'provision_sandbox_request',
    payload: {
      codex_home: 'C:\\Users\\Maqhawe T Ngwenya\\.codex',
      settings: {
        proxy_ports: [],
        allow_local_binding: true,
      },
      listeners: [[], []],
    },
  };

  return sendCodexMessage(CODEX_PIPES.sandbox, msg);
}
