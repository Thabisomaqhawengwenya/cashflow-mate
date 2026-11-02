import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageService, CurrencyCode, BusinessProfile } from './storage';

export const STORAGE_KEY_AUTH_SESSION = '@cashflow_user_session_v2';
export const STORAGE_KEY_HAS_ACCOUNT = '@cashflow_has_registered_account_v1';
export const STORAGE_KEY_REGISTERED_USERS = '@cashflow_registered_users_v1';

export interface UserSession {
  userId: string;
  name: string;
  username?: string;
  email: string;
  businessName: string;
  currency: CurrencyCode;
  token?: string;
  isLoggedIn: boolean;
  isDemo?: boolean;
  loggedInAt: string;
}

interface StoredTraderAccount {
  userId: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  businessName: string;
  currency: CurrencyCode;
}

const DEFAULT_DEMO_SESSION: UserSession = {
  userId: 'user_demo_001',
  name: 'Mr Q',
  username: 'Mr Q',
  email: 'demo@cashflowmate.co.zw',
  businessName: 'Mbare Fresh Produce & Tuckshop',
  currency: 'USD',
  token: 'mock_jwt_demo_token_valid',
  isLoggedIn: true,
  isDemo: true,
  loggedInAt: new Date().toISOString(),
};

export class MobileAuthService {
  /**
   * Get active user session
   */
  static async getSession(): Promise<UserSession | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as UserSession;
      if (parsed.isDemo && (parsed.name === 'Tinashe Moyo' || !parsed.username)) {
        parsed.name = 'Mr Q';
        parsed.username = 'Mr Q';
        await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(parsed));
      }
      if (!parsed.username && parsed.name) {
        parsed.username = parsed.name;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Check whether a trader has previously registered or signed in on this device
   */
  static async hasRegisteredAccount(): Promise<boolean> {
    const flag = await AsyncStorage.getItem(STORAGE_KEY_HAS_ACCOUNT);
    return flag === 'true';
  }

  private static async getRegisteredAccounts(): Promise<StoredTraderAccount[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as StoredTraderAccount[];
    } catch {
      return [];
    }
  }

  /**
   * Log in user with email & password (offline-tolerant)
   */
  static async login(email: string, password: string): Promise<UserSession> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter both email and password.');
    }

    // Check if demo account
    if (cleanEmail === 'demo@cashflowmate.co.zw' || cleanEmail === 'demo') {
      return this.demoLogin();
    }

    // Check if this email matches a registered local account
    const accounts = await this.getRegisteredAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (existing && existing.password && existing.password !== cleanPass) {
      throw new Error('Incorrect password for this trader account.');
    }

    const namePart = cleanEmail.split('@')[0];
    const fallbackName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const resolvedName = existing?.name || fallbackName;
    const resolvedUsername = existing?.username || resolvedName;
    const resolvedBusiness = existing?.businessName || `${resolvedName}'s Enterprise`;
    const resolvedCurrency = existing?.currency || 'USD';

    const session: UserSession = {
      userId: existing?.userId || `usr_${Date.now()}`,
      name: resolvedName,
      username: resolvedUsername,
      email: cleanEmail,
      businessName: resolvedBusiness,
      currency: resolvedCurrency,
      token: `cfm_token_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');

    // Sync business profile
    await MobileStorageService.updateBusiness({
      name: session.businessName,
      ownerName: session.username,
      businessType: 'retail',
      currency: session.currency,
      country: 'ZW',
      preferredLanguage: 'en',
    });

    return session;
  }

  /**
   * Register a new trader account
   */
  static async register(data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    currency: CurrencyCode;
  }): Promise<UserSession> {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPass = data.password.trim();
    const cleanBiz = data.businessName.trim() || `${cleanName}'s Stall`;

    if (!cleanName) throw new Error('Please enter your full name.');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
    if (!cleanPass || cleanPass.length < 6) throw new Error('Password must be at least 6 characters.');

    const userId = `usr_${Date.now()}`;
    const session: UserSession = {
      userId,
      name: cleanName,
      username: cleanName,
      email: cleanEmail,
      businessName: cleanBiz,
      currency: data.currency || 'USD',
      token: `cfm_token_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    const accounts = await this.getRegisteredAccounts();
    const filtered = accounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
    filtered.push({
      userId,
      name: cleanName,
      username: cleanName,
      email: cleanEmail,
      password: cleanPass,
      businessName: cleanBiz,
      currency: data.currency || 'USD',
    });

    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(filtered));
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');

    // Update local business profile
    await MobileStorageService.updateBusiness({
      name: cleanBiz,
      ownerName: cleanName,
      businessType: 'retail',
      currency: data.currency || 'USD',
      country: 'ZW',
      preferredLanguage: 'en',
    });

    return session;
  }

  /**
   * Instant Demo Login
   */
  static async demoLogin(): Promise<UserSession> {
    const session = {
      ...DEFAULT_DEMO_SESSION,
      loggedInAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');
    return session;
  }

  /**
   * Update active user session details (e.g. username, name, businessName)
   */
  static async updateSession(partial: Partial<UserSession>): Promise<UserSession | null> {
    const current = await this.getSession();
    if (!current) return null;
    const updated: UserSession = {
      ...current,
      ...partial,
    };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(updated));
    return updated;
  }

  /**
   * Sign out current user
   */
  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
  }
}
