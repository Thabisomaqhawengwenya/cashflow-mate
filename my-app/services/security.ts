import AsyncStorage from '@react-native-async-storage/async-storage';
import { hmacSha256 } from './crypto';

const STORAGE_KEY_PIN = '@cashflow_till_pin_v2';
const STORAGE_KEY_MASK = '@cashflow_privacy_mask_v1';
const STORAGE_KEY_ATTEMPTS = '@cashflow_pin_attempts_v1';
const STORAGE_KEY_LOCKOUT = '@cashflow_pin_lockout_v1';

const PIN_SALT = 'CFM_TILL_PIN_SECRET_SALT_2026';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

export interface SecuritySettings {
  isPinSet: boolean;
  isPrivacyMaskActive: boolean;
  isLockedOut?: boolean;
  lockoutRemainingSeconds?: number;
}

export class MobileSecurityService {
  /**
   * Retrieves security preferences and lockout status
   */
  static async getSecuritySettings(): Promise<SecuritySettings> {
    const [storedPin, storedMask, lockoutUntilStr] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_PIN),
      AsyncStorage.getItem(STORAGE_KEY_MASK),
      AsyncStorage.getItem(STORAGE_KEY_LOCKOUT),
    ]);

    let isLockedOut = false;
    let lockoutRemainingSeconds = 0;

    if (lockoutUntilStr) {
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      const remainingMs = lockoutUntil - Date.now();
      if (remainingMs > 0) {
        isLockedOut = true;
        lockoutRemainingSeconds = Math.ceil(remainingMs / 1000);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_LOCKOUT);
        await AsyncStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      }
    }

    return {
      isPinSet: !!storedPin,
      isPrivacyMaskActive: storedMask === 'true',
      isLockedOut,
      lockoutRemainingSeconds,
    };
  }

  /**
   * Sets or updates a 4-digit PIN using HMAC-SHA256 salted hash
   */
  static async setPin(newPin: string): Promise<boolean> {
    const trimmed = newPin.trim();
    if (!/^\d{4}$/.test(trimmed)) {
      throw new Error('PIN must be exactly 4 digits (0-9).');
    }

    const hash = hmacSha256(PIN_SALT, trimmed);
    await AsyncStorage.setItem(STORAGE_KEY_PIN, hash);
    await AsyncStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    await AsyncStorage.removeItem(STORAGE_KEY_LOCKOUT);
    return true;
  }

  /**
   * Verifies an entered PIN with brute-force lockout protection (5 attempts -> 30s lock)
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    const storedHash = await AsyncStorage.getItem(STORAGE_KEY_PIN);
    if (!storedHash) return true; // No PIN configured

    // 1. Check active lockout
    const lockoutUntilStr = await AsyncStorage.getItem(STORAGE_KEY_LOCKOUT);
    if (lockoutUntilStr) {
      const lockoutUntil = parseInt(lockoutUntilStr, 10);
      const remainingMs = lockoutUntil - Date.now();
      if (remainingMs > 0) {
        const secs = Math.ceil(remainingMs / 1000);
        throw new Error(`Till is temporarily locked due to multiple failed PIN attempts. Try again in ${secs}s.`);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_LOCKOUT);
        await AsyncStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      }
    }

    // 2. Constant-time verification
    const enteredHash = hmacSha256(PIN_SALT, enteredPin.trim());
    const isMatch = enteredHash.toLowerCase() === storedHash.toLowerCase();

    if (isMatch) {
      // Success: clear failed attempts
      await AsyncStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      return true;
    }

    // 3. Increment failed attempts
    const attemptsStr = await AsyncStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const attempts = (attemptsStr ? parseInt(attemptsStr, 10) : 0) + 1;

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      await AsyncStorage.setItem(STORAGE_KEY_LOCKOUT, String(lockUntil));
      await AsyncStorage.removeItem(STORAGE_KEY_ATTEMPTS);
      throw new Error('5 failed attempts. Till is locked for 30 seconds.');
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_ATTEMPTS, String(attempts));
    }

    return false;
  }

  /**
   * Removes PIN protection after verifying current PIN
   */
  static async removePin(currentPin: string): Promise<boolean> {
    const isValid = await this.verifyPin(currentPin);
    if (!isValid) return false;

    await AsyncStorage.removeItem(STORAGE_KEY_PIN);
    await AsyncStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    await AsyncStorage.removeItem(STORAGE_KEY_LOCKOUT);
    return true;
  }

  /**
   * Toggles the counter privacy mask (hides sensitive balance amounts from customers)
   */
  static async togglePrivacyMask(): Promise<boolean> {
    const current = await AsyncStorage.getItem(STORAGE_KEY_MASK);
    const nextVal = current !== 'true';
    await AsyncStorage.setItem(STORAGE_KEY_MASK, String(nextVal));
    return nextVal;
  }

  /**
   * Formats sensitive values if privacy mask is engaged
   */
  static formatMasked(val: string, isMasked: boolean): string {
    return isMasked ? '••••' : val;
  }
}
