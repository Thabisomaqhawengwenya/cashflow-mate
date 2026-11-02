import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageService, CurrencyCode } from './storage';

export const STORAGE_KEY_AUTH_SESSION = '@cashflow_user_session_v2';
export const STORAGE_KEY_HAS_ACCOUNT = '@cashflow_has_registered_account_v1';
export const STORAGE_KEY_REGISTERED_USERS = '@cashflow_registered_users_v2';
export const STORAGE_KEY_ADMIN_SECRET = '@cashflow_admin_secret_code_v1';

export const DEFAULT_ADMIN_SECRET_CODE = 'CFM-HQ-2026';

export interface UserSession {
  userId: string;
  name: string;
  username?: string;
  email: string;
  businessName: string;
  currency: CurrencyCode;
  role?: 'trader' | 'admin';
  token?: string;
  isLoggedIn: boolean;
  isDemo?: boolean;
  loggedInAt: string;
}

export interface StoredTraderAccount {
  userId: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  password?: string;
  businessName: string;
  currency: CurrencyCode;
  tier?: 'starter' | 'pro' | 'enterprise';
  status?: 'active' | 'suspended' | 'flagged';
  kycVerified?: boolean;
  txCount?: number;
  monthlyVolumeUsd?: number;
  flagsCount?: number;
  lastActive?: string;
  createdAt?: string;
}

const DEFAULT_DEMO_SESSION: UserSession = {
  userId: 'user_demo_001',
  name: 'Mr Q',
  username: 'Mr Q',
  email: 'demo@cashflowmate.co.zw',
  businessName: 'Mbare Fresh Produce & Tuckshop',
  currency: 'USD',
  role: 'trader',
  token: 'mock_jwt_demo_token_valid',
  isLoggedIn: true,
  isDemo: true,
  loggedInAt: new Date().toISOString(),
};

const SEED_TRADER_ACCOUNTS: StoredTraderAccount[] = [
  {
    userId: 'usr_seed_001',
    name: 'Mr Q',
    username: 'Mr Q',
    email: 'mrq@mbaretuckshop.co.zw',
    phone: '+263 77 200 1001',
    city: 'Harare (Mbare Musika)',
    businessName: 'Mbare Fresh Produce & Tuckshop',
    currency: 'USD',
    tier: 'enterprise',
    status: 'active',
    kycVerified: true,
    txCount: 142,
    monthlyVolumeUsd: 4850,
    flagsCount: 0,
    lastActive: '2 mins ago',
    createdAt: '2026-10-15',
  },
  {
    userId: 'usr_seed_002',
    name: 'Chipo Ndlovu',
    username: 'Mai Chipo',
    email: 'chipo@bulawayotraders.co.zw',
    phone: '+263 71 388 4412',
    city: 'Bulawayo (Renkini)',
    businessName: 'Bulawayo Wholesale Grocery Stall #12',
    currency: 'ZAR',
    tier: 'pro',
    status: 'active',
    kycVerified: true,
    txCount: 98,
    monthlyVolumeUsd: 3120,
    flagsCount: 0,
    lastActive: '18 mins ago',
    createdAt: '2026-10-19',
  },
  {
    userId: 'usr_seed_003',
    name: 'Farai Mutasa',
    username: 'Farai Agro',
    email: 'farai@mutarehardware.co.zw',
    phone: '+263 77 419 9022',
    city: 'Mutare (Sakubva)',
    businessName: 'Mutare Timber & Hardware Depot',
    currency: 'USD',
    tier: 'pro',
    status: 'active',
    kycVerified: true,
    txCount: 76,
    monthlyVolumeUsd: 2690,
    flagsCount: 0,
    lastActive: '1 hour ago',
    createdAt: '2026-10-24',
  },
  {
    userId: 'usr_seed_004',
    name: 'Tariro Moyo',
    username: 'Tariro Fashion',
    email: 'tariro@gweruboutique.co.zw',
    phone: '+263 78 551 3090',
    city: 'Gweru (CBD Hub)',
    businessName: 'Gweru CBD Bales & Runner Hub',
    currency: 'ZWG',
    tier: 'starter',
    status: 'active',
    kycVerified: false,
    txCount: 34,
    monthlyVolumeUsd: 780,
    flagsCount: 0,
    lastActive: '3 hours ago',
    createdAt: '2026-10-29',
  },
  {
    userId: 'usr_seed_005',
    name: 'Tawanda Zhou',
    username: 'Tawanda Border',
    email: 'tawanda@beitbridgerunners.co.zw',
    phone: '+263 77 901 2241',
    city: 'Beitbridge (Border Post)',
    businessName: 'Cross-Border Clearing & ZAR Float Stall',
    currency: 'ZAR',
    tier: 'pro',
    status: 'flagged',
    kycVerified: false,
    txCount: 61,
    monthlyVolumeUsd: 1940,
    flagsCount: 2,
    lastActive: 'Yesterday',
    createdAt: '2026-10-27',
  },
  {
    userId: 'usr_seed_006',
    name: 'Nyasha Gumbo',
    username: 'Nyasha Agro',
    email: 'nyasha@masvingofresh.co.zw',
    phone: '+263 71 774 1180',
    city: 'Masvingo (Chitima Market)',
    businessName: 'Chitima Grain & Poultry Supply',
    currency: 'USD',
    tier: 'enterprise',
    status: 'active',
    kycVerified: true,
    txCount: 115,
    monthlyVolumeUsd: 3910,
    flagsCount: 0,
    lastActive: '42 mins ago',
    createdAt: '2026-10-21',
  },
];

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
      if (
        parsed.role === 'admin' ||
        parsed.userId?.startsWith('admin') ||
        parsed.email?.toLowerCase() === 'admin' ||
        parsed.email?.toLowerCase().startsWith('admin@') ||
        parsed.username?.toLowerCase() === 'admin' ||
        parsed.name?.toLowerCase().includes('admin')
      ) {
        parsed.role = 'admin';
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

  static async getAllAccounts(): Promise<StoredTraderAccount[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_REGISTERED_USERS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(SEED_TRADER_ACCOUNTS));
      return SEED_TRADER_ACCOUNTS;
    }
    try {
      const parsed = JSON.parse(raw) as StoredTraderAccount[];
      if (parsed.length === 0) {
        await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(SEED_TRADER_ACCOUNTS));
        return SEED_TRADER_ACCOUNTS;
      }
      return parsed;
    } catch {
      return SEED_TRADER_ACCOUNTS;
    }
  }

  static async getAdminSecretCode(): Promise<string> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY_ADMIN_SECRET);
    return stored || DEFAULT_ADMIN_SECRET_CODE;
  }

  static async setAdminSecretCode(newCode: string): Promise<void> {
    const clean = newCode.trim();
    if (!clean || clean.length < 4) {
      throw new Error('Secret code must be at least 4 characters.');
    }
    await AsyncStorage.setItem(STORAGE_KEY_ADMIN_SECRET, clean);
  }

  /**
   * Authenticate Administrator with Username/Email, Password, and Secret Access Code
   */
  static async adminLogin(
    usernameOrEmail: string,
    password: string,
    secretCode: string
  ): Promise<UserSession> {
    const cleanUser = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanSecret = secretCode.trim().toUpperCase();

    if (!cleanUser || !cleanPass) {
      throw new Error('Please enter both Admin username and password.');
    }
    if (!cleanSecret) {
      throw new Error('Admin Secret Access Code is required.');
    }

    const validUser =
      cleanUser === 'admin' ||
      cleanUser === 'admin@cashflow.co.zw' ||
      cleanUser === 'mrq' ||
      cleanUser === 'mrq@cashflow.co.zw';

    const validPass = cleanPass === 'admin' || cleanPass === 'admin123';

    if (!validUser || !validPass) {
      throw new Error('Invalid Admin credentials. Use username "admin" and password "admin".');
    }

    const activeSecret = (await this.getAdminSecretCode()).toUpperCase();
    const isSecretValid =
      cleanSecret === activeSecret ||
      cleanSecret === 'CFM-HQ-2026' ||
      cleanSecret === '7788' ||
      cleanSecret === 'ADMIN-2026';

    if (!isSecretValid) {
      throw new Error(
        `Invalid Admin Secret Code. Enter "${activeSecret}" or "7788".`
      );
    }

    const adminSession: UserSession = {
      userId: 'admin_hq_001',
      name: 'Mr Q (Admin HQ)',
      username: 'Mr Q',
      email: 'admin@cashflow.co.zw',
      businessName: 'CashFlow Mate Command Center',
      currency: 'USD',
      role: 'admin',
      token: `cfm_admin_jwt_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(adminSession));
    await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');
    return adminSession;
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
    const accounts = await this.getAllAccounts();
    const existing = accounts.find(
      (a) =>
        a.email.toLowerCase() === cleanEmail ||
        a.username.toLowerCase() === cleanEmail
    );

    if (existing && existing.status === 'suspended') {
      throw new Error('This trader account has been suspended by Admin HQ.');
    }

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
      role: 'trader',
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
      role: 'trader',
      token: `cfm_token_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };

    const accounts = await this.getAllAccounts();
    const filtered = accounts.filter((a) => a.email.toLowerCase() !== cleanEmail);
    filtered.unshift({
      userId,
      name: cleanName,
      username: cleanName,
      email: cleanEmail,
      password: cleanPass,
      businessName: cleanBiz,
      currency: data.currency || 'USD',
      tier: 'starter',
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
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
   * Admin: Provision or update a trader account
   */
  static async adminSaveAccount(data: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
    city?: string;
    businessName: string;
    currency: CurrencyCode;
    tier: 'starter' | 'pro' | 'enterprise';
    password?: string;
  }): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const existingIdx = data.userId
      ? accounts.findIndex((a) => a.userId === data.userId)
      : accounts.findIndex((a) => a.email.toLowerCase() === data.email.trim().toLowerCase());

    if (existingIdx >= 0) {
      accounts[existingIdx] = {
        ...accounts[existingIdx],
        name: data.name.trim(),
        username: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        ...(data.phone ? { phone: data.phone.trim() } : {}),
        ...(data.city ? { city: data.city.trim() } : {}),
        businessName: data.businessName.trim(),
        currency: data.currency,
        tier: data.tier,
        ...(data.password ? { password: data.password } : {}),
      };
    } else {
      accounts.unshift({
        userId: `usr_${Date.now()}`,
        name: data.name.trim(),
        username: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || '+263 77 000 0000',
        city: data.city?.trim() || 'Harare',
        password: data.password || 'trader123',
        businessName: data.businessName.trim() || `${data.name.trim()}'s Stall`,
        currency: data.currency,
        tier: data.tier,
        status: 'active',
        kycVerified: true,
        txCount: 0,
        monthlyVolumeUsd: 0,
        flagsCount: 0,
        lastActive: 'Just now',
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }

    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(accounts));
    return accounts;
  }

  static async adminToggleKyc(userId: string): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const updated = accounts.map((acc) =>
      acc.userId === userId ? { ...acc, kycVerified: !acc.kycVerified } : acc
    );
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  }

  static async adminToggleAccountStatus(userId: string): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const updated = accounts.map((acc) =>
      acc.userId === userId
        ? { ...acc, status: (acc.status === 'suspended' ? 'active' : 'suspended') as 'active' | 'suspended' }
        : acc
    );
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  }

  static async adminUpdateAccountTier(
    userId: string,
    tier: 'starter' | 'pro' | 'enterprise'
  ): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const updated = accounts.map((acc) =>
      acc.userId === userId ? { ...acc, tier } : acc
    );
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  }

  static async adminDeleteAccount(userId: string): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const updated = accounts.filter((acc) => acc.userId !== userId);
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
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
