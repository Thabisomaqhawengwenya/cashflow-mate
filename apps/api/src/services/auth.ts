import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getDb } from '../db';
import { config } from '../config';
import { User, Business, CurrencyCode } from '@cashflow-mate/shared';

export class AuthService {
  static async register(data: { email: string; password: string; name?: string }) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.toLowerCase().trim());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, data.email.toLowerCase().trim(), passwordHash, data.name || null, now);

    // Create default initial business
    const businessId = randomUUID();
    const businessName = data.name ? `${data.name}'s Enterprise` : 'My Enterprise';
    db.prepare(`
      INSERT INTO businesses (id, user_id, name, business_type, currency, country, preferred_language, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(businessId, userId, businessName, 'retail', 'USD', 'ZW', 'en', now);

    // Create default Cash Drawer account
    const accountId = randomUUID();
    db.prepare(`
      INSERT INTO accounts (id, business_id, name, type, currency, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(accountId, businessId, 'Cash Register Drawer', 'cash', 'USD', now);

    const token = jwt.sign(
      { userId, businessId, email: data.email.toLowerCase().trim() },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const user: User = { id: userId, email: data.email.toLowerCase().trim(), name: data.name, createdAt: now };
    const business: Business = {
      id: businessId,
      userId,
      name: businessName,
      businessType: 'retail',
      currency: 'USD',
      country: 'ZW',
      preferredLanguage: 'en',
      createdAt: now
    };

    return { token, user, business };
  }

  static async login(email: string, password: string) {
    const db = getDb();
    const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim()) as any;
    if (!userRow) {
      throw new Error('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, userRow.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password.');
    }

    // Load active business
    let businessRow = db.prepare('SELECT * FROM businesses WHERE user_id = ? LIMIT 1').get(userRow.id) as any;
    if (!businessRow) {
      // Auto-provision if missing
      const businessId = randomUUID();
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO businesses (id, user_id, name, business_type, currency, country, preferred_language, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(businessId, userRow.id, 'My Enterprise', 'retail', 'USD', 'ZW', 'en', now);
      businessRow = { id: businessId, user_id: userRow.id, name: 'My Enterprise', business_type: 'retail', currency: 'USD', country: 'ZW', preferred_language: 'en', created_at: now };
    }

    const token = jwt.sign(
      { userId: userRow.id, businessId: businessRow.id, email: userRow.email },
      config.jwtSecret,
      { expiresIn: '30d' }
    );

    const user: User = { id: userRow.id, email: userRow.email, name: userRow.name, createdAt: userRow.created_at };
    const business: Business = {
      id: businessRow.id,
      userId: businessRow.user_id,
      name: businessRow.name,
      businessType: businessRow.business_type,
      currency: businessRow.currency as CurrencyCode,
      country: businessRow.country,
      preferredLanguage: businessRow.preferred_language,
      createdAt: businessRow.created_at
    };

    return { token, user, business };
  }

  static demoLogin() {
    const db = getDb();
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get('user_demo_001') as any;
    const businessRow = db.prepare('SELECT * FROM businesses WHERE id = ?').get('biz_demo_001') as any;

    if (!userRow || !businessRow) {
      throw new Error('Demo dataset not found. Please re-seed the database.');
    }

    const token = jwt.sign(
      { userId: userRow.id, businessId: businessRow.id, email: userRow.email },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const user: User = { id: userRow.id, email: userRow.email, name: userRow.name, createdAt: userRow.created_at };
    const business: Business = {
      id: businessRow.id,
      userId: businessRow.user_id,
      name: businessRow.name,
      businessType: businessRow.business_type,
      currency: businessRow.currency as CurrencyCode,
      country: businessRow.country,
      preferredLanguage: businessRow.preferred_language,
      createdAt: businessRow.created_at
    };

    return { token, user, business };
  }
}
