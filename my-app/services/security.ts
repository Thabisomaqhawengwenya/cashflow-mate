import AsyncStorage from '@react-native-async-storage/async-storage';
import { hmacSha256 } from './crypto';

const STORAGE_KEY_PIN = '@cashflow_till_pin_v2';
const STORAGE_KEY_MASK = '@cashflow_privacy_mask_v1';
const PIN_SALT = 'CFM_TILL_PIN_SECRET_SALT_2026';

export interface SecuritySettings {
  isPinSet: boolean;
  isPrivacyMaskActive: boolean;
}

export class MobileSecurityService {
  /**
   * Retrieves security preferences
   */
  static async getSecuritySettings(): Promise<SecuritySettings> {
    const [storedPin, storedMask] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_PIN),
      AsyncStorage.getItem(STORAGE_KEY_MASK),
    ]);

    return {
      isPinSet: !!storedPin,
      isPrivacyMaskActive: storedMask === 'true',
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
    return true;
  }

  /**
   * Verifies an entered PIN against the stored HMAC-SHA256 hash
   */
  static async verifyPin(enteredPin: string): Promise<boolean> {
    const storedHash = await AsyncStorage.getItem(STORAGE_KEY_PIN);
    if (!storedHash) return true; // No PIN configured

    const enteredHash = hmacSha256(PIN_SALT, enteredPin.trim());
    return enteredHash.toLowerCase() === storedHash.toLowerCase();
  }

  /**
   * Removes PIN protection after verifying current PIN
   */
  static async removePin(currentPin: string): Promise<boolean> {
    const isValid = await this.verifyPin(currentPin);
    if (!isValid) return false;

    await AsyncStorage.removeItem(STORAGE_KEY_PIN);
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
