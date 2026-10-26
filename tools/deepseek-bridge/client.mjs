/**
 * DeepSeek Bridge - Node.js Client Library
 * -----------------------------------------
 * Programmatic helper to notify or listen for DeepSeek events.
 */

import http from 'node:http';
import net from 'node:net';

const DEFAULT_PIPE = '\\\\.\\pipe\\deepseek-bridge';
const DEFAULT_PORT = 45124;

/**
 * Send an event notification to the DeepSeek Bridge
 */
export async function notifyDeepSeekEvent(data, options = {}) {
  const payload = {
    event: data.event || 'deepseek.action',
    summary: data.summary || data.message || 'DeepSeek action',
    ts: new Date().toISOString(),
    ...data,
  };

  const pipePath = options.pipe || process.env.DEEPSEEK_BRIDGE_PIPE || DEFAULT_PIPE;
  const port = options.port || parseInt(process.env.DEEPSEEK_BRIDGE_PORT || DEFAULT_PORT, 10);

  // Try pipe first
  try {
    return await new Promise((resolve, reject) => {
      const socket = net.connect(pipePath);
      socket.once('connect', () => {
        socket.write(JSON.stringify(payload) + '\n', () => {
          socket.end();
          resolve({ ok: true, transport: 'named-pipe', event: payload });
        });
      });
      socket.once('error', reject);
    });
  } catch {
    // Fallback to HTTP
    return new Promise((resolve, reject) => {
      const body = JSON.stringify(payload);
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: port,
          path: '/notify',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
          timeout: 4000,
        },
        (res) => {
          let resp = '';
          res.on('data', (d) => (resp += d));
          res.on('end', () => {
            resolve({ ok: true, transport: 'http', response: JSON.parse(resp || '{}') });
          });
        }
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
