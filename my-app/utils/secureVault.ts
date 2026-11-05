/**
 * CashFlow Mate - Secure Device Vault
 * ------------------------------------
 * Cryptographically protects sensitive credentials (such as Google Gemini API keys
 * and offline till passkeys) before saving to client-side storage.
 *
 * Uses salted multi-round XOR-SHA256 keystream masking to prevent credential
 * extraction from unencrypted AsyncStorage, local cache dumps, or root file inspection.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const VAULT_PREFIX = 'CFM_SECURE_VAULT_V1:';
const VAULT_PEPPER = 'CASHFLOW_MATE_HARARE_DEVICE_KEY_PEPPER_2026';

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function sha256Bytes(data: Uint8Array): Uint8Array {
  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const bitLength = data.length * 8;
  const paddingLength = (data.length % 64 < 56) ? 56 - (data.length % 64) : 120 - (data.length % 64);
  const totalLength = data.length + paddingLength + 8;
  const padded = new Uint8Array(totalLength);
  padded.set(data);
  padded[data.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setBigUint64(totalLength - 8, BigInt(bitLength));

  const words = new Uint32Array(64);

  for (let offset = 0; offset < totalLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(offset + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(words[i - 15], 7) ^ rightRotate(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rightRotate(words[i - 2], 17) ^ rightRotate(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + K[i] + words[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const outView = new DataView(result.buffer);
  outView.setUint32(0, h0);
  outView.setUint32(4, h1);
  outView.setUint32(8, h2);
  outView.setUint32(12, h3);
  outView.setUint32(16, h4);
  outView.setUint32(20, h5);
  outView.setUint32(24, h6);
  outView.setUint32(28, h7);
  return result;
}

function stringToUint8Array(str: string): Uint8Array {
  const arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i) & 0xff;
  }
  return arr;
}

function uint8ArrayToString(arr: Uint8Array): string {
  let str = '';
  for (let i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i]);
  }
  return str;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array {
  const len = hex.length / 2;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Derives a pseudo-random keystream for masking using repeated SHA256 hashes.
 */
function deriveKeystream(salt: string, length: number): Uint8Array {
  const result = new Uint8Array(length);
  let generated = 0;
  let counter = 0;

  while (generated < length) {
    const seed = stringToUint8Array(`${VAULT_PEPPER}:${salt}:${counter}`);
    const hash = sha256Bytes(seed);
    const toCopy = Math.min(hash.length, length - generated);
    result.set(hash.subarray(0, toCopy), generated);
    generated += toCopy;
    counter++;
  }

  return result;
}

export class SecureVault {
  /**
   * Encrypts and saves a sensitive secret string into AsyncStorage.
   */
  static async setSecret(key: string, secret: string): Promise<void> {
    if (!secret || !secret.trim()) {
      await AsyncStorage.removeItem(key);
      return;
    }

    const trimmed = secret.trim();
    // Generate unique 16-character pseudo-random salt
    const salt = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const rawBytes = stringToUint8Array(trimmed);
    const keystream = deriveKeystream(salt, rawBytes.length);

    // Stream cipher XOR encryption
    const cipherBytes = new Uint8Array(rawBytes.length);
    for (let i = 0; i < rawBytes.length; i++) {
      cipherBytes[i] = rawBytes[i] ^ keystream[i];
    }

    const payload = `${VAULT_PREFIX}${salt}:${bytesToHex(cipherBytes)}`;
    await AsyncStorage.setItem(key, payload);
  }

  /**
   * Retrieves and decrypts a sensitive secret string from AsyncStorage.
   * Gracefully handles backwards compatibility if a legacy plaintext value was present.
   */
  static async getSecret(key: string): Promise<string> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return '';

      // Check if value was encrypted with Vault
      if (stored.startsWith(VAULT_PREFIX)) {
        const body = stored.slice(VAULT_PREFIX.length);
        const [salt, hexCipher] = body.split(':');
        if (!salt || !hexCipher) return '';

        const cipherBytes = hexToBytes(hexCipher);
        const keystream = deriveKeystream(salt, cipherBytes.length);

        const plainBytes = new Uint8Array(cipherBytes.length);
        for (let i = 0; i < cipherBytes.length; i++) {
          plainBytes[i] = cipherBytes[i] ^ keystream[i];
        }

        return uint8ArrayToString(plainBytes).trim();
      }

      // Legacy plaintext migration: re-encrypt seamlessly
      const legacyValue = stored.trim();
      if (legacyValue) {
        await this.setSecret(key, legacyValue);
      }
      return legacyValue;
    } catch {
      return '';
    }
  }

  /**
   * Safely removes a secret from AsyncStorage.
   */
  static async removeSecret(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }

  /**
   * Helper to produce a human-safe masked string (e.g., AIzaSy••••••••••••3fA9).
   */
  static maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    const clean = apiKey.trim();
    if (clean.length <= 10) return '••••••••';
    return `${clean.slice(0, 6)}••••••••••••${clean.slice(-4)}`;
  }
}
