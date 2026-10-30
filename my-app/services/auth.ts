import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageService, CurrencyCode, BusinessProfile } from './storage';

export const STORAGE_KEY_AUTH_SESSION = '@cashflow_user_session_v2';

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

    // Derive or create session
    const namePart = cleanEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const session: UserSession = {
      userId: `usr_${Date.now()}`,
      name: formattedName,
      username: formattedName,
      email: cleanEmail,
      businessName: `${formattedName}'s Enterprise`,
      currency: 'USD',
      token: `cfm_token_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));

    // Sync business profile
    await MobileStorageService.updateBusiness({
      name: session.businessName,
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

    const session: UserSession = {
      userId: `usr_${Date.now()}`,
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

    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));

    // Update local business profile
    await MobileStorageService.updateBusiness({
      name: cleanBiz,
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
