import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageService, CurrencyCode } from './storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { SupabaseDataService } from './supabaseData';
import { sanitizeSessionForLocalhost, FAKE_DEMO_TRADER } from '../utils/localhostSanitizer';

export const STORAGE_KEY_AUTH_SESSION = '@cashflow_user_session_v2';
export const STORAGE_KEY_HAS_ACCOUNT = '@cashflow_has_registered_account_v1';
export const STORAGE_KEY_REGISTERED_USERS = '@cashflow_registered_users_v2';
export const STORAGE_KEY_ADMIN_SECRET = '@cashflow_admin_secret_code_v1';

export const DEFAULT_ADMIN_SECRET_CODE = 'CFM-HQ-2026';

export interface UserSession {
  userId: string;
  merchantCode?: string;
  name: string;
  username?: string;
  avatarUri?: string;
  avatarPreset?: string;
  phone?: string;
  city?: string;
  tagline?: string;
  stallNumber?: string;
  merchantTillNumber?: string;
  operatingHours?: string;
  email: string;
  businessName: string;
  currency: CurrencyCode;
  role?: 'trader' | 'admin';
  token?: string;
  isLoggedIn: boolean;
  isDemo?: boolean;
  onboardingCompleted?: boolean;
  loggedInAt: string;
}

export interface StoredTraderAccount {
  userId: string;
  name: string;
  username: string;
  email: string;
  phone?: string;
  city?: string;
  tagline?: string;
  avatarUri?: string;
  avatarPreset?: string;
  stallNumber?: string;
  merchantTillNumber?: string;
  operatingHours?: string;
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

function formatAuthError(err: any): string {
  if (!err) return 'An unexpected authentication error occurred.';
  const msg = typeof err === 'string' ? err : err.message || '';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Incorrect email or password. Please verify your credentials.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Please check your inbox and verify your email address before logging in.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (lower.includes('password') && lower.includes('least 6')) {
    return 'Password must be at least 6 characters.';
  }
  if (lower.includes('network') || lower.includes('fetch failed') || lower.includes('failed to fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  return msg || 'Authentication request failed.';
}

export interface DemoAccountDefinition {
  userId: string;
  name: string;
  username: string;
  email: string;
  password: string;
  alternatePasswords?: string[];
  businessName: string;
  stallNumber: string;
  merchantTillNumber: string;
  city: string;
  phone: string;
  tagline: string;
  operatingHours: string;
  currency: CurrencyCode;
  role: 'trader' | 'admin';
  tier: 'starter' | 'pro' | 'enterprise';
  initialBalance?: number;
}

export const PRECONFIGURED_DEMO_ACCOUNTS: DemoAccountDefinition[] = [
  // 1. Admin HQ Command Center
  {
    userId: 'admin_hq_001',
    name: 'Cashflow Admin HQ',
    username: 'admin',
    email: 'admin@cashflow.co.zw',
    password: 'admin',
    alternatePasswords: ['admin123', 'password', '123456'],
    businessName: 'Cashflow Command Center',
    stallNumber: 'Suite 401, Celestial Park',
    merchantTillNumber: 'ADMIN-HQ-01',
    city: 'Harare (CBD)',
    phone: '+263 77 100 0000',
    tagline: 'Centralized small merchant till oversight and fraud protection.',
    operatingHours: '24/7 Continuous Booth',
    currency: 'USD',
    role: 'admin',
    tier: 'enterprise',
  },
  // 2. Client Demo 1: Farai Moyo (Fresh Produce Stall)
  {
    userId: 'trader_farai_001',
    name: 'Farai Moyo',
    username: 'trader',
    email: 'trader@cashflow.co.zw',
    password: 'trader123',
    alternatePasswords: ['123456', 'password', 'trader', 'farai123'],
    businessName: 'Mbare Fresh Produce & Tuckshop',
    stallNumber: 'Stall #14, Vegetable Shed',
    merchantTillNumber: 'EcoCash: 194827',
    city: 'Harare (Mbare Musika)',
    phone: '+263 77 234 5678',
    tagline: 'Fresh quality farm produce and cold drinks daily.',
    operatingHours: '6:00 AM - 6:00 PM (Mon - Sat)',
    currency: 'USD',
    role: 'trader',
    tier: 'starter',
    initialBalance: 340,
  },
  // 3. Client Demo 2: Tendai Mutasa (Multi-Currency Grocery)
  {
    userId: 'trader_tendai_002',
    name: 'Tendai Mutasa',
    username: 'tuckshop',
    email: 'tuckshop@cashflow.co.zw',
    password: 'trader123',
    alternatePasswords: ['123456', 'password', 'tuckshop'],
    businessName: 'Highfield Corner Tuckshop',
    stallNumber: 'Stand #8, Machipisa Shopping Centre',
    merchantTillNumber: 'EcoCash: 552190',
    city: 'Harare (Highfield)',
    phone: '+263 71 889 0123',
    tagline: 'Cold beverages, maize meal, cooking oil & groceries.',
    operatingHours: '7:00 AM - 8:00 PM (Daily)',
    currency: 'USD',
    role: 'trader',
    tier: 'pro',
    initialBalance: 520,
  },
  // 4. Client Demo 3: Chipo Ndlovu (Clothing & Bales Boutique)
  {
    userId: 'trader_chipo_003',
    name: 'Chipo Ndlovu',
    username: 'retail',
    email: 'retail@cashflow.co.zw',
    password: 'trader123',
    alternatePasswords: ['123456', 'password', 'retail', 'chipo123'],
    businessName: 'Chipo Fashion Bales & Spares',
    stallNumber: 'Bay 3, Renkini Market Complex',
    merchantTillNumber: 'EcoCash: 883412',
    city: 'Bulawayo (Renkini)',
    phone: '+263 73 456 7890',
    tagline: 'Imported first-grade clothing bales and shoes.',
    operatingHours: '8:00 AM - 5:00 PM (Weekdays)',
    currency: 'ZAR',
    role: 'trader',
    tier: 'enterprise',
    initialBalance: 4500,
  },
];

export class MobileAuthService {
  /**
   * Get active user session from Supabase or cached storage
   */
  static async getSession(): Promise<UserSession | null> {
    if (isSupabaseConfigured) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          // If no active Supabase session, clear local cached trader session (preserve local admin if active)
          const localRaw = await AsyncStorage.getItem(STORAGE_KEY_AUTH_SESSION);
          if (localRaw) {
            try {
              const parsed = JSON.parse(localRaw) as UserSession;
              if (parsed.role === 'admin') return parsed;
            } catch {}
          }
          await AsyncStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
          return null;
        }

        const user = session.user;
        const profile = await SupabaseDataService.getProfile();

        const userSession: UserSession = {
          userId: user.id,
          merchantCode: profile?.merchantCode || (user.user_metadata?.merchant_code as string) || ('CFM-' + user.id.slice(0, 8).toUpperCase()),
          name: profile?.fullName || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Trader',
          username: profile?.fullName || (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Trader',
          email: user.email || '',
          businessName: profile?.stallName || (user.user_metadata?.business_name as string) || 'My Stall',
          currency: profile?.currency || (user.user_metadata?.currency as CurrencyCode) || 'USD',
          role: (user.user_metadata?.role as any) || 'trader',
          token: session.access_token,
          isLoggedIn: true,
          isDemo: false,
          onboardingCompleted: profile ? profile.onboardingCompleted : false,
          avatarUri: profile?.avatarUri,
          city: profile?.city,
          phone: profile?.phone,
          loggedInAt: new Date().toISOString(),
        };

        await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(userSession));
        return sanitizeSessionForLocalhost(userSession);
      } catch {
        // Fall back to AsyncStorage if offline
      }
    }

    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUTH_SESSION);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as UserSession;
      if (!parsed.username && parsed.name) {
        parsed.username = parsed.name;
      }
      return sanitizeSessionForLocalhost(parsed);
    } catch {
      return null;
    }
  }

  /**
   * Listen to auth state transitions
   */
  static onAuthStateChange(callback: (session: UserSession | null) => void) {
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!session) {
          callback(null);
        } else {
          const fresh = await this.getSession();
          callback(fresh);
        }
      });
      return () => subscription.unsubscribe();
    }
    return () => {};
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
    let accounts: StoredTraderAccount[] = [];
    if (raw) {
      try {
        accounts = JSON.parse(raw) as StoredTraderAccount[];
      } catch {}
    }

    // Filter out any legacy, personal, or test accounts
    accounts = accounts.filter(
      (a) =>
        !a.email.toLowerCase().includes('mrq') &&
        !a.username.toLowerCase().includes('mrq') &&
        !a.name.toLowerCase().includes('mrq') &&
        !a.email.toLowerCase().includes('maqhawe')
    );

    // Merge default preconfigured client demo accounts if not already in the list
    const clientDemos = PRECONFIGURED_DEMO_ACCOUNTS.filter((d) => d.role === 'trader');
    for (const demo of clientDemos) {
      const exists = accounts.some(
        (a) =>
          a.email.toLowerCase() === demo.email.toLowerCase() ||
          a.username.toLowerCase() === demo.username.toLowerCase()
      );
      if (!exists) {
        accounts.push({
          userId: demo.userId,
          name: demo.name,
          username: demo.username,
          email: demo.email,
          phone: demo.phone,
          city: demo.city,
          tagline: demo.tagline,
          stallNumber: demo.stallNumber,
          merchantTillNumber: demo.merchantTillNumber,
          operatingHours: demo.operatingHours,
          password: demo.password,
          businessName: demo.businessName,
          currency: demo.currency,
          tier: demo.tier,
          status: 'active',
          kycVerified: true,
          txCount: 16,
          monthlyVolumeUsd: demo.initialBalance || 450,
          flagsCount: 0,
          lastActive: 'Active today',
          createdAt: '2026-10-15',
        });
      }
    }

    return accounts;
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
   * Authenticate Administrator
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
      cleanUser === 'admin@cashflow.co.zw';

    const validPass =
      cleanPass === 'admin' ||
      cleanPass === 'admin123' ||
      cleanPass === 'password' ||
      cleanPass === '123456';

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
      name: 'Market Admin HQ',
      username: 'admin',
      email: 'admin@cashflow.co.zw',
      businessName: 'Cashflow Command Center',
      currency: 'USD',
      role: 'admin',
      token: `cfm_admin_jwt_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      onboardingCompleted: true,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(adminSession));
    await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');
    return adminSession;
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
    const updated = accounts.map((acc: StoredTraderAccount) =>
      acc.userId === userId ? { ...acc, kycVerified: !acc.kycVerified } : acc
    );
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  }

  static async adminToggleAccountStatus(userId: string): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const updated = accounts.map((acc: StoredTraderAccount) =>
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
    const updated = accounts.map((acc: StoredTraderAccount) =>
      acc.userId === userId ? { ...acc, tier } : acc
    );
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  }

  static async adminDeleteAccount(userId: string): Promise<StoredTraderAccount[]> {
    const accounts = await this.getAllAccounts();
    const updated = accounts.filter((acc: StoredTraderAccount) => acc.userId !== userId);
    await AsyncStorage.setItem(STORAGE_KEY_REGISTERED_USERS, JSON.stringify(updated));
    return updated;
  }

  static async demoLogin(): Promise<UserSession> {
    const session: UserSession = {
      userId: 'user_demo_001',
      name: FAKE_DEMO_TRADER.fullName,
      username: FAKE_DEMO_TRADER.username,
      email: FAKE_DEMO_TRADER.email,
      businessName: FAKE_DEMO_TRADER.stallName,
      currency: 'USD',
      role: 'trader',
      token: 'cfm_demo_token',
      isLoggedIn: true,
      isDemo: true,
      onboardingCompleted: true,
      loggedInAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    return session;
  }

  /**
   * Log in user with email & password via Supabase
   */
  static async login(email: string, password: string): Promise<UserSession> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      throw new Error('Please enter both email and password.');
    }

    // 1. Direct Preconfigured Demo Check (Online/Offline, Instant & Seamless)
    const matchingDemo = PRECONFIGURED_DEMO_ACCOUNTS.find(
      (d) =>
        d.email.toLowerCase() === cleanEmail ||
        d.username.toLowerCase() === cleanEmail
    );

    if (matchingDemo) {
      const allowedPasswords = [
        matchingDemo.password,
        ...(matchingDemo.alternatePasswords || []),
      ];
      const isPassValid = allowedPasswords.some(
        (p) => p.toLowerCase() === cleanPass.toLowerCase()
      );

      if (!isPassValid) {
        throw new Error(
          `Incorrect password for "${matchingDemo.username}". Try password "${matchingDemo.password}".`
        );
      }

      if (matchingDemo.role === 'admin') {
        const adminSession: UserSession = {
          userId: matchingDemo.userId,
          name: matchingDemo.name,
          username: matchingDemo.username,
          email: matchingDemo.email,
          businessName: matchingDemo.businessName,
          currency: matchingDemo.currency,
          role: 'admin',
          token: `cfm_admin_jwt_${Date.now()}`,
          isLoggedIn: true,
          isDemo: false,
          onboardingCompleted: true,
          loggedInAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(adminSession));
        await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');
        return adminSession;
      }

      const clientSession: UserSession = {
        userId: matchingDemo.userId,
        merchantCode: 'CFM-' + matchingDemo.userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase(),
        name: matchingDemo.name,
        username: matchingDemo.username,
        email: matchingDemo.email,
        phone: matchingDemo.phone,
        city: matchingDemo.city,
        tagline: matchingDemo.tagline,
        stallNumber: matchingDemo.stallNumber,
        merchantTillNumber: matchingDemo.merchantTillNumber,
        operatingHours: matchingDemo.operatingHours,
        businessName: matchingDemo.businessName,
        currency: matchingDemo.currency,
        role: 'trader',
        token: `cfm_demo_jwt_${Date.now()}`,
        isLoggedIn: true,
        isDemo: true,
        onboardingCompleted: true,
        loggedInAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(clientSession));
      await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');

      await MobileStorageService.updateBusiness({
        name: matchingDemo.businessName,
        ownerName: matchingDemo.name,
        businessType: 'retail',
        currency: matchingDemo.currency,
        country: 'ZW',
        preferredLanguage: 'en',
      });

      // Seed realistic market transactions for demo accounts if none exist
      const existingTxs = await MobileStorageService.getTransactions();
      if (existingTxs.length === 0) {
        await MobileStorageService.resetDemoData();
      }

      return clientSession;
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (error) {
        throw new Error(formatAuthError(error));
      }

      if (!data.user || !data.session) {
        throw new Error('Sign in succeeded but session could not be established. Please check verification.');
      }

      const profile = await SupabaseDataService.getProfile();
      const resolvedName = profile?.fullName || (data.user.user_metadata?.full_name as string) || cleanEmail.split('@')[0];
      const resolvedBiz = profile?.stallName || (data.user.user_metadata?.business_name as string) || `${resolvedName}'s Business`;
      const resolvedCurrency = (profile?.currency || data.user.user_metadata?.currency || 'USD') as CurrencyCode;
      const isUserAdmin = data.user.user_metadata?.role === 'admin' || (profile as any)?.role === 'admin';

      const session: UserSession = {
        userId: data.user.id,
        merchantCode: profile?.merchantCode || (data.user.user_metadata?.merchant_code as string) || ('CFM-' + data.user.id.slice(0, 8).toUpperCase()),
        name: resolvedName,
        username: resolvedName,
        email: cleanEmail,
        businessName: resolvedBiz,
        currency: resolvedCurrency,
        role: isUserAdmin ? 'admin' : 'trader',
        token: data.session.access_token,
        isLoggedIn: true,
        isDemo: false,
        onboardingCompleted: profile ? profile.onboardingCompleted : false,
        loggedInAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');

      await MobileStorageService.updateBusiness({
        name: session.businessName,
        ownerName: session.name,
        businessType: 'retail',
        currency: session.currency,
        country: 'ZW',
        preferredLanguage: 'en',
      });

      return session;
    }

    // Local fallback for offline/development without Supabase keys
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
    const resolvedBusiness = existing?.businessName || `${resolvedName}'s Business`;
    const resolvedCurrency = existing?.currency || 'USD';

    const session: UserSession = {
      userId: existing?.userId || `usr_${Date.now()}`,
      merchantCode: (existing as any)?.merchantCode || ('CFM-' + (existing?.userId || Date.now().toString()).slice(-8).toUpperCase()),
      name: resolvedName,
      username: resolvedUsername,
      email: cleanEmail,
      businessName: resolvedBusiness,
      currency: resolvedCurrency,
      role: 'trader',
      token: `cfm_token_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      onboardingCompleted: true,
      loggedInAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
    await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');

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
   * Register a new trader account with Supabase
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
    const cleanBiz = data.businessName.trim() || `${cleanName}'s Business`;
    const uniqueMerchantCode =
      'CFM-' +
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    if (!cleanName) throw new Error('Please enter your full name.');
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Please enter a valid email address.');
    if (!cleanPass || cleanPass.length < 6) throw new Error('Password must be at least 6 characters.');

    if (isSupabaseConfigured) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: {
            full_name: cleanName,
            business_name: cleanBiz,
            currency: data.currency || 'USD',
            merchant_code: uniqueMerchantCode,
          },
        },
      });

      if (error) {
        throw new Error(formatAuthError(error));
      }

      const user = authData.user;
      if (!user) {
        throw new Error('Registration could not be completed. Please try again.');
      }

      // Upsert profile row into Supabase with unique secret merchant_code
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          merchant_code: uniqueMerchantCode,
          email: cleanEmail,
          full_name: cleanName,
          stall_name: cleanBiz,
          currency: data.currency || 'USD',
          onboarding_completed: false,
          role: 'trader',
        });
      } catch {}

      const session: UserSession = {
        userId: user.id,
        merchantCode: uniqueMerchantCode,
        name: cleanName,
        username: cleanName,
        email: cleanEmail,
        businessName: cleanBiz,
        currency: data.currency || 'USD',
        role: 'trader',
        token: authData.session?.access_token || `token_${user.id}`,
        isLoggedIn: true,
        isDemo: false,
        onboardingCompleted: false,
        loggedInAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(session));
      await AsyncStorage.setItem(STORAGE_KEY_HAS_ACCOUNT, 'true');

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

    // Local fallback for offline mode
    const userId = `usr_${Date.now()}`;
    const session: UserSession = {
      userId,
      merchantCode: uniqueMerchantCode,
      name: cleanName,
      username: cleanName,
      email: cleanEmail,
      businessName: cleanBiz,
      currency: data.currency || 'USD',
      role: 'trader',
      token: `cfm_token_${Date.now()}`,
      isLoggedIn: true,
      isDemo: false,
      onboardingCompleted: false,
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
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        throw new Error(formatAuthError(error));
      }
      return {
        success: true,
        message: 'Password reset link sent to your email. Please check your inbox.',
      };
    }

    return {
      success: true,
      message: 'Password reset instructions sent. Please check your inbox.',
    };
  }

  /**
   * Complete user onboarding setup (currency, optional starting float, business details)
   */
  static async completeOnboarding(params: {
    currency: CurrencyCode;
    startingFloat?: number;
    businessName?: string;
    city?: string;
    businessType?: string;
    tagline?: string;
    operatingHours?: string;
    preferredLanguage?: string;
  }): Promise<void> {
    const session = await this.getSession();
    if (!session) throw new Error('No active session.');

    const startingFloat = Number(params.startingFloat) || 0;
    const currency = params.currency || session.currency;
    const businessName = params.businessName?.trim() || session.businessName;
    const city = params.city || session.city || 'Harare (Mbare Musika)';

    // 1. Update profile in Supabase
    if (isSupabaseConfigured) {
      try {
        await SupabaseDataService.updateProfile({
          currency,
          stallName: businessName,
          city,
          startingBalance: startingFloat,
          onboardingCompleted: true,
        });
      } catch {}
    }

    // 2. If starting float > 0, create initial transaction
    if (startingFloat > 0) {
      await MobileStorageService.saveTransaction({
        transactionDate: new Date().toISOString().slice(0, 10),
        description: 'Opening Cash Float (Initial Setup)',
        direction: 'inflow',
        type: 'business_income',
        category: 'sales',
        amount: startingFloat,
        currency,
        notes: 'Initial starting cash balance set during account onboarding.',
        reviewStatus: 'confirmed',
      });
    }

    // 3. Update Business Profile in Storage
    await MobileStorageService.updateBusiness({
      name: businessName,
      currency,
      city,
      businessType: params.businessType || 'Tuckshop & Grocery',
      tagline: params.tagline || '',
      operatingHours: params.operatingHours || '6:00 AM - 6:00 PM (Mon - Sat)',
      preferredLanguage: (params.preferredLanguage as 'en' | 'sn' | 'nd') || 'en',
    });

    // 4. Update session
    await this.updateSession({
      currency,
      businessName,
      city,
      tagline: params.tagline,
      operatingHours: params.operatingHours,
      onboardingCompleted: true,
    });
  }

  /**
   * Update active user session details
   */
  static async updateSession(partial: Partial<UserSession>): Promise<UserSession | null> {
    const current = await this.getSession();
    if (!current) return null;
    const updated: UserSession = {
      ...current,
      ...partial,
    };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_SESSION, JSON.stringify(updated));

    if (isSupabaseConfigured && current.userId) {
      try {
        await SupabaseDataService.updateProfile({
          fullName: partial.name,
          stallName: partial.businessName,
          currency: partial.currency,
          phone: partial.phone,
          city: partial.city,
          avatarUri: partial.avatarUri,
          onboardingCompleted: partial.onboardingCompleted,
        });
      } catch {}
    }

    return updated;
  }

  /**
   * Sign out current user
   */
  static async logout(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_SESSION);
  }
}
