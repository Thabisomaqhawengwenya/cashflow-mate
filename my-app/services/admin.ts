import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_REPORTED_INDIVIDUALS = '@cashflow_admin_reported_individuals_v1';
export const STORAGE_KEY_SUPPORT_TICKETS = '@cashflow_admin_support_tickets_v1';
export const STORAGE_KEY_SYSTEM_BROADCAST = '@cashflow_admin_broadcast_v1';
export const STORAGE_KEY_SAAS_PAYMENTS = '@cashflow_admin_saas_payments_v1';
export const STORAGE_KEY_AUDIT_LOGS = '@cashflow_admin_audit_logs_v1';
export const STORAGE_KEY_PARSER_RULES = '@cashflow_admin_parser_rules_v1';
export const STORAGE_KEY_PUSH_CAMPAIGNS = '@cashflow_admin_push_campaigns_v1';
export const STORAGE_KEY_ADMIN_TEAM = '@cashflow_admin_team_staff_v1';
export const STORAGE_KEY_FEATURE_FLAGS = '@cashflow_admin_feature_flags_v1';

export type FraudCategory =
  | 'fake_ecocash_sms'
  | 'credit_defaulter'
  | 'counterfeit_notes'
  | 'supplier_scam'
  | 'identity_impersonation';

export interface ReportedIndividual {
  id: string;
  reportedName: string;
  phoneNumber: string;
  nationalIdOrRef?: string;
  cityMarket: string;
  category: FraudCategory;
  severity: 'critical' | 'high' | 'medium';
  status: 'investigating' | 'blacklisted' | 'cleared';
  reportedByTrader: string;
  reportedByEmail: string;
  amountInvolvedUsd: number;
  evidenceSummary: string;
  adminNotes?: string;
  reportsCount: number;
  createdAt: string;
}

export type TicketCategory =
  | 'bug_report'
  | 'csv_import_error'
  | 'license_activation'
  | 'sms_parser_issue'
  | 'account_access'
  | 'feature_request';

export interface UserProblemTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  businessName: string;
  city: string;
  category: TicketCategory;
  priority: 'urgent' | 'high' | 'normal';
  status: 'open' | 'in_progress' | 'resolved';
  subject: string;
  description: string;
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'critical';
  active: boolean;
  updatedAt: string;
}

export interface SubscriptionPaymentRecord {
  id: string;
  invoiceRef: string;
  traderName: string;
  traderEmail: string;
  businessName: string;
  city: string;
  planTier: 'pro' | 'enterprise';
  amountUsd: number;
  paymentMethod: 'EcoCash USD' | 'InnBucks' | 'Visa / Mastercard' | 'CBZ Bank Transfer';
  status: 'paid' | 'pending_verification' | 'failed';
  licenseKeyIssued: string;
  paidAt: string;
  expiresAt: string;
}

export interface AdminAuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  eventType:
    | 'ADMIN_AUTH'
    | 'USER_MODERATION'
    | 'WATCHLIST_BLACKLIST'
    | 'FEATURE_FLAG'
    | 'LICENSE_MINT'
    | 'SECURITY_ALERT';
  severity: 'info' | 'warning' | 'critical';
  target: string;
  summary: string;
  ipOrDevice: string;
}

export interface ParserRuleConfig {
  id: string;
  providerName: string;
  channelType: 'Mobile Money SMS' | 'Bank CSV Statement' | 'Remittance Receipt';
  patternSample: string;
  successRatePct: number;
  parsedCount30d: number;
  failedCount30d: number;
  status: 'active' | 'degraded' | 'maintenance';
  lastUpdated: string;
}

export interface PushCampaignRecord {
  id: string;
  title: string;
  body: string;
  targetAudience: 'All Registered Traders' | 'Harare Hub Only' | 'Bulawayo Hub Only' | 'Starter Tier Upsell' | 'Pro & Enterprise';
  urgency: 'info' | 'warning' | 'critical';
  deliveredCount: number;
  sentBy: string;
  sentAt: string;
}

export interface AdminStaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Trust & Safety Officer' | 'Support Engineer' | 'Billing & KYC Auditor';
  permissionsSummary: string;
  status: 'active' | 'suspended';
  lastLogin: string;
}

export interface PlatformFeatureFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: 'Global Platform' | 'Pro & Enterprise Only' | 'Beta Rollout';
  updatedAt: string;
}

const INITIAL_REPORTED_INDIVIDUALS: ReportedIndividual[] = [
  {
    id: 'rep_001',
    reportedName: 'Blessing "Boss B" Chikwanda',
    phoneNumber: '+263 77 891 3304',
    nationalIdOrRef: '63-2910448-K-42',
    cityMarket: 'Mbare Musika, Harare',
    category: 'fake_ecocash_sms',
    severity: 'critical',
    status: 'blacklisted',
    reportedByTrader: 'Farai Moyo (Mbare Fresh Produce)',
    reportedByEmail: 'farai@mbaretuckshop.co.zw',
    amountInvolvedUsd: 185.0,
    evidenceSummary:
      'Sent forged sender-ID SMS pretending to be EcoCash Cash-In for 3 crates of cooking oil and fled before wallet balance updated.',
    adminNotes: 'Verified across 3 separate stalls in Harare. Phone number flagged network-wide.',
    reportsCount: 4,
    createdAt: '2026-10-31',
  },
  {
    id: 'rep_002',
    reportedName: 'Lovemore Sibanda',
    phoneNumber: '+263 71 409 8821',
    nationalIdOrRef: '08-1149821-F-08',
    cityMarket: 'Renkini & Lobengula St, Bulawayo',
    category: 'credit_defaulter',
    severity: 'high',
    status: 'investigating',
    reportedByTrader: 'Chipo Ndlovu (Bulawayo Wholesale)',
    reportedByEmail: 'chipo@bulawayotraders.co.zw',
    amountInvolvedUsd: 340.0,
    evidenceSummary:
      'Took bale of sugar and flour on 7-day credit invoice QT-2026-089; blocked trader on WhatsApp and moved stall location.',
    adminNotes: 'Cross-checking phone number with other Bulawayo Pro traders.',
    reportsCount: 2,
    createdAt: '2026-11-01',
  },
  {
    id: 'rep_003',
    reportedName: 'Tafadzwa "Taffy" Mupfumi',
    phoneNumber: '+263 78 612 0094',
    nationalIdOrRef: '75-092114-M-75',
    cityMarket: 'Sakubva Market, Mutare',
    category: 'counterfeit_notes',
    severity: 'critical',
    status: 'blacklisted',
    reportedByTrader: 'Farai Mutasa (Mutare Timber & Hardware)',
    reportedByEmail: 'farai@mutarehardware.co.zw',
    amountInvolvedUsd: 100.0,
    evidenceSummary:
      'Attempted to pay for cement bags during evening rush using washed $50 USD notes with duplicate serial numbers.',
    adminNotes: 'Confirmed counterfeit alert broadcasted to Manicaland traders.',
    reportsCount: 3,
    createdAt: '2026-10-29',
  },
  {
    id: 'rep_004',
    reportedName: 'Simbarashe Gumbo (Cross-Border Runner)',
    phoneNumber: '+263 77 302 7719',
    nationalIdOrRef: '42-883920-B-21',
    cityMarket: 'Beitbridge Border Post & Masvingo',
    category: 'supplier_scam',
    severity: 'high',
    status: 'investigating',
    reportedByTrader: 'Tendai Chauke (Masvingo Agro)',
    reportedByEmail: 'tendai@masvingoagro.co.zw',
    amountInvolvedUsd: 520.0,
    evidenceSummary:
      'Collected USD deposit for Musina wholesale stock runner order and failed to deliver goods for 14 days.',
    adminNotes: 'Awaiting runner response before permanent national blacklist.',
    reportsCount: 2,
    createdAt: '2026-11-01',
  },
];

const INITIAL_SUPPORT_TICKETS: UserProblemTicket[] = [
  {
    id: 'tkt_101',
    ticketNumber: 'TKT-2026-101',
    userId: 'usr_seed_002',
    userName: 'Chipo Ndlovu',
    userEmail: 'chipo@bulawayotraders.co.zw',
    businessName: 'Bulawayo Wholesale Grocery Stall #12',
    city: 'Bulawayo',
    category: 'sms_parser_issue',
    priority: 'urgent',
    status: 'open',
    subject: 'InnBucks ZAR remittance SMS format not auto-detecting currency',
    description:
      'When pasting an InnBucks cross-border ZAR message from South Africa, the quick-paste parser defaults to USD instead of ZAR.',
    createdAt: '2026-11-02 08:15',
    updatedAt: '2026-11-02 08:15',
  },
  {
    id: 'tkt_102',
    ticketNumber: 'TKT-2026-102',
    userId: 'usr_seed_004',
    userName: 'Tariro Moyo',
    userEmail: 'tariro@gweruboutique.co.zw',
    businessName: 'Midlands Textiles & School Uniforms',
    city: 'Gweru',
    category: 'license_activation',
    priority: 'high',
    status: 'open',
    subject: 'Paid $15 via EcoCash for Enterprise upgrade : awaiting license key',
    description:
      'Sent $15 USD via EcoCash merchant code 449012 (Ref: MP261102.0911.A09123). Please issue my CFM-ENT activation key.',
    createdAt: '2026-11-02 09:20',
    updatedAt: '2026-11-02 09:20',
  },
  {
    id: 'tkt_103',
    ticketNumber: 'TKT-2026-103',
    userId: 'usr_seed_003',
    userName: 'Farai Mutasa',
    userEmail: 'farai@mutarehardware.co.zw',
    businessName: 'Mutare Timber & Hardware Depot',
    city: 'Mutare',
    category: 'csv_import_error',
    priority: 'normal',
    status: 'in_progress',
    subject: 'Steward Bank ZiG statement CSV date column format',
    description:
      'Steward Bank exports dates as DD/MM/YYYY with trailing timestamps. Requesting smoother import mapping.',
    adminReply:
      'Engineering added DD/MM/YYYY timestamp stripping in patch v1.2.1. Monitoring your next upload.',
    createdAt: '2026-10-30 14:40',
    updatedAt: '2026-11-01 11:10',
  },
  {
    id: 'tkt_104',
    ticketNumber: 'TKT-2026-104',
    userId: 'usr_seed_005',
    userName: 'Nqobile Dube',
    userEmail: 'nqobile@beitbridgerunners.co.zw',
    businessName: 'Beitbridge Cross-Border Logistics',
    city: 'Beitbridge',
    category: 'account_access',
    priority: 'high',
    status: 'open',
    subject: 'Cashier forgot 4-digit Market Till PIN after shift handover',
    description:
      'Our evening cashier locked the counter till PIN and went off shift. Requesting Admin PIN reset verification.',
    createdAt: '2026-11-01 16:05',
    updatedAt: '2026-11-02 07:30',
  },
];

const INITIAL_SAAS_PAYMENTS: SubscriptionPaymentRecord[] = [
  {
    id: 'pay_001',
    invoiceRef: 'INV-CFM-9041',
    traderName: 'Farai Moyo',
    traderEmail: 'farai@mbaretuckshop.co.zw',
    businessName: 'Mbare Fresh Produce & Tuckshop',
    city: 'Harare',
    planTier: 'enterprise',
    amountUsd: 15.0,
    paymentMethod: 'EcoCash USD',
    status: 'paid',
    licenseKeyIssued: 'CFM-ENT-FARAI-89F21C04',
    paidAt: '2026-10-15',
    expiresAt: '2029-10-15',
  },
  {
    id: 'pay_002',
    invoiceRef: 'INV-CFM-9042',
    traderName: 'Chipo Ndlovu',
    traderEmail: 'chipo@bulawayotraders.co.zw',
    businessName: 'Bulawayo Wholesale Grocery Stall #12',
    city: 'Bulawayo',
    planTier: 'pro',
    amountUsd: 5.0,
    paymentMethod: 'InnBucks',
    status: 'paid',
    licenseKeyIssued: 'CFM-PRO-CHIPONDL-44A90E11',
    paidAt: '2026-10-19',
    expiresAt: '2028-10-19',
  },
  {
    id: 'pay_003',
    invoiceRef: 'INV-CFM-9043',
    traderName: 'Farai Mutasa',
    traderEmail: 'farai@mutarehardware.co.zw',
    businessName: 'Mutare Timber & Hardware Depot',
    city: 'Mutare',
    planTier: 'pro',
    amountUsd: 5.0,
    paymentMethod: 'EcoCash USD',
    status: 'paid',
    licenseKeyIssued: 'CFM-PRO-FARAIMUT-77C12B08',
    paidAt: '2026-10-24',
    expiresAt: '2028-10-24',
  },
  {
    id: 'pay_004',
    invoiceRef: 'INV-CFM-9044',
    traderName: 'Tendai Chauke',
    traderEmail: 'tendai@masvingoagro.co.zw',
    businessName: 'Great Zimbabwe Agro & Seed Supply',
    city: 'Masvingo',
    planTier: 'enterprise',
    amountUsd: 15.0,
    paymentMethod: 'CBZ Bank Transfer',
    status: 'paid',
    licenseKeyIssued: 'CFM-ENT-TENDAICH-19D44A20',
    paidAt: '2026-10-18',
    expiresAt: '2029-10-18',
  },
  {
    id: 'pay_005',
    invoiceRef: 'INV-CFM-9045',
    traderName: 'Tariro Moyo',
    traderEmail: 'tariro@gweruboutique.co.zw',
    businessName: 'Midlands Textiles & School Uniforms',
    city: 'Gweru',
    planTier: 'enterprise',
    amountUsd: 15.0,
    paymentMethod: 'EcoCash USD',
    status: 'pending_verification',
    licenseKeyIssued: 'PENDING ADMIN APPROVAL',
    paidAt: '2026-11-02',
    expiresAt: '2029-11-02',
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditLogEntry[] = [
  {
    id: 'aud_001',
    timestamp: '2026-11-02 12:40:18',
    actor: 'System Administrator (admin)',
    actorRole: 'Super Admin',
    eventType: 'ADMIN_AUTH',
    severity: 'info',
    target: 'Desktop Admin Portal (/admin)',
    summary: 'Authenticated into Admin Command Center using 2-Factor Secret Access Code (CFM-HQ-2026).',
    ipOrDevice: '197.221.240.14 • Windows Desktop Chrome',
  },
  {
    id: 'aud_002',
    timestamp: '2026-11-02 10:14:05',
    actor: 'Trust & Safety Desk',
    actorRole: 'Trust & Safety Officer',
    eventType: 'WATCHLIST_BLACKLIST',
    severity: 'critical',
    target: '+263 77 891 3304 (Blessing Chikwanda)',
    summary: 'Confirmed 4 independent trader fraud reports in Mbare Musika; blacklisted phone number network-wide.',
    ipOrDevice: '197.221.240.19 • Harare HQ Workstation',
  },
  {
    id: 'aud_003',
    timestamp: '2026-11-01 17:52:40',
    actor: 'Automated Security Sentinel',
    actorRole: 'System Guard',
    eventType: 'SECURITY_ALERT',
    severity: 'warning',
    target: 'usr_seed_005 (Beitbridge Cross-Border Logistics)',
    summary: 'Flagged account for manual KYC & AML review after 3 cross-border runner dispute reports.',
    ipOrDevice: 'CashFlow Mate Risk Engine v2.1',
  },
  {
    id: 'aud_004',
    timestamp: '2026-11-01 11:10:02',
    actor: 'Support Engineer (Rudo M.)',
    actorRole: 'Support Engineer',
    eventType: 'USER_MODERATION',
    severity: 'info',
    target: 'TKT-2026-103 (Farai Mutasa)',
    summary: 'Deployed Steward Bank DD/MM/YYYY CSV date parser rule update and replied to trader.',
    ipOrDevice: '41.78.72.104 • Harare Support Desk',
  },
];

const INITIAL_PARSER_RULES: ParserRuleConfig[] = [
  {
    id: 'prs_001',
    providerName: 'EcoCash Zimbabwe (USD & ZiG)',
    channelType: 'Mobile Money SMS',
    patternSample: 'EcoCash: Cash-In / Send Money Confirmation. Txn ID: MP26... Amount: USD...',
    successRatePct: 99.4,
    parsedCount30d: 4820,
    failedCount30d: 29,
    status: 'active',
    lastUpdated: '2026-10-28',
  },
  {
    id: 'prs_002',
    providerName: 'InnBucks MicroBank (USD & ZAR)',
    channelType: 'Mobile Money SMS',
    patternSample: 'InnBucks: You have received USD/ZAR ... from ... Ref: IBK...',
    successRatePct: 94.8,
    parsedCount30d: 2190,
    failedCount30d: 114,
    status: 'degraded',
    lastUpdated: '2026-11-01',
  },
  {
    id: 'prs_003',
    providerName: 'CBZ Bank Touch & Corporate CSV',
    channelType: 'Bank CSV Statement',
    patternSample: 'Date,Transaction Description,Reference,Debit,Credit,Balance',
    successRatePct: 98.9,
    parsedCount30d: 940,
    failedCount30d: 10,
    status: 'active',
    lastUpdated: '2026-10-22',
  },
  {
    id: 'prs_004',
    providerName: 'Steward Bank Square / CSV Export',
    channelType: 'Bank CSV Statement',
    patternSample: 'Value Date (DD/MM/YYYY HH:mm),Narration,Dr,Cr,Running Balance',
    successRatePct: 97.6,
    parsedCount30d: 615,
    failedCount30d: 15,
    status: 'active',
    lastUpdated: '2026-11-01',
  },
  {
    id: 'prs_005',
    providerName: 'Mukuru & Mama Money Cross-Border',
    channelType: 'Remittance Receipt',
    patternSample: 'Mukuru Order #... Payout USD / ZAR collected at Booth...',
    successRatePct: 99.1,
    parsedCount30d: 1120,
    failedCount30d: 9,
    status: 'active',
    lastUpdated: '2026-10-25',
  },
];

const INITIAL_PUSH_CAMPAIGNS: PushCampaignRecord[] = [
  {
    id: 'cmp_001',
    title: 'Security Alert: Fake EcoCash Sender-ID SMS Scammers in Mbare & Renkini',
    body: 'Always verify your actual *151# wallet balance before handing over stock for orders above $50 USD.',
    targetAudience: 'All Registered Traders',
    urgency: 'critical',
    deliveredCount: 6,
    sentBy: 'System Administrator',
    sentAt: '2026-11-01 09:00',
  },
  {
    id: 'cmp_002',
    title: 'New Feature: Multi-Currency 3-Drawer Cashbox (USD, ZiG, ZAR)',
    body: 'Cashflow v1.3 now tracks separate physical drawers for US Dollars, Zimbabwe Gold (ZiG), and South African Rand with Supabase cloud multi-user isolation.',
    targetAudience: 'All Registered Traders',
    urgency: 'info',
    deliveredCount: 6,
    sentBy: 'Product Release Desk',
    sentAt: '2026-10-27 14:30',
  },
];

const INITIAL_ADMIN_TEAM: AdminStaffMember[] = [
  {
    id: 'adm_001',
    name: 'Market Admin HQ (System Administrator)',
    email: 'admin@cashflowmate.co.zw',
    role: 'Super Admin',
    permissionsSummary: 'Full Root Governance, Secret Code Rotation, License Signing, RBAC & Billing',
    status: 'active',
    lastLogin: 'Active now',
  },
  {
    id: 'adm_002',
    name: 'Tendai Moyo',
    email: 'safety@cashflowmate.co.zw',
    role: 'Trust & Safety Officer',
    permissionsSummary: 'Fraud Watchlist Blacklisting, Reported Individuals Investigation, KYC Verification',
    status: 'active',
    lastLogin: '42 mins ago',
  },
  {
    id: 'adm_003',
    name: 'Rudo Chikowore',
    email: 'support@cashflowmate.co.zw',
    role: 'Support Engineer',
    permissionsSummary: 'User Support Tickets, SMS/CSV Parser Rules, Trader PIN Reset Assistance',
    status: 'active',
    lastLogin: '2 hours ago',
  },
  {
    id: 'adm_004',
    name: 'Kudzai Ndlovu',
    email: 'billing@cashflowmate.co.zw',
    role: 'Billing & KYC Auditor',
    permissionsSummary: 'EcoCash/InnBucks Subscription Verification, Pro/Enterprise License Issuance',
    status: 'active',
    lastLogin: 'Yesterday',
  },
];

const INITIAL_FEATURE_FLAGS: PlatformFeatureFlag[] = [
  {
    key: 'gemini_ai_assistant',
    name: 'Grounded Gemini AI Financial Assistant',
    description: 'Allows traders to query their cashflow, margins, and expenses using natural language.',
    enabled: true,
    scope: 'Global Platform',
    updatedAt: '2026-11-01',
  },
  {
    key: 'ecocash_innbucks_sms_parser',
    name: 'EcoCash & InnBucks Instant SMS Quick-Paste Parser',
    description: 'Enables automatic extraction of transaction amounts, references, and fees from mobile money SMS.',
    enabled: true,
    scope: 'Global Platform',
    updatedAt: '2026-11-01',
  },
  {
    key: 'multi_currency_drawers',
    name: '3-Drawer Multi-Currency Cashbox (USD / ZiG / ZAR)',
    description: 'Enables simultaneous multi-currency till balancing and RBZ/market exchange rate conversion.',
    enabled: true,
    scope: 'Global Platform',
    updatedAt: '2026-11-01',
  },
  {
    key: 'national_fraud_watchlist_sync',
    name: 'Real-Time National Scammer & Defaulter Watchlist Alerts',
    description: 'Warns traders when a customer phone number matches a blacklisted scammer in the Admin database.',
    enabled: true,
    scope: 'Pro & Enterprise Only',
    updatedAt: '2026-11-01',
  },
  {
    key: 'new_trader_self_signup',
    name: 'Public Self-Service Trader Registration (/signup)',
    description: 'Allows new market traders to create Starter accounts without manual Admin provisioning.',
    enabled: true,
    scope: 'Global Platform',
    updatedAt: '2026-11-01',
  },
  {
    key: 'platform_maintenance_lock',
    name: 'Emergency Platform Maintenance Mode',
    description: 'Temporarily places cloud sync and AI endpoints into read-only maintenance mode during upgrades.',
    enabled: false,
    scope: 'Global Platform',
    updatedAt: '2026-11-01',
  },
];

const DEFAULT_BROADCAST: SystemBroadcast = {
  id: 'bcast_001',
  title: 'Security Alert: Verify EcoCash SMS Balances Before Releasing High-Value Stock',
  message:
    'Admin HQ has blacklisted 2 phone numbers in Harare & Mutare for sending forged EcoCash SMS notifications. Always dial *151# or check your live wallet balance on orders above $50.',
  level: 'warning',
  active: true,
  updatedAt: '2026-11-02',
};

export const FRAUD_CATEGORY_LABELS: Record<FraudCategory, string> = {
  fake_ecocash_sms: 'Fake EcoCash / InnBucks SMS',
  credit_defaulter: 'Runaway Credit Defaulter',
  counterfeit_notes: 'Counterfeit Banknotes',
  supplier_scam: 'Supplier / Runner Scam',
  identity_impersonation: 'Identity Impersonation',
};

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  bug_report: 'App Bug / Crash',
  csv_import_error: 'Bank / CSV Import Issue',
  license_activation: 'License & Billing Upgrade',
  sms_parser_issue: 'EcoCash / InnBucks SMS Parser',
  account_access: 'PIN / Password Recovery',
  feature_request: 'Feature Request',
};

export class MobileAdminService {
  static async getReportedIndividuals(): Promise<ReportedIndividual[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_REPORTED_INDIVIDUALS);
    if (!raw) {
      await AsyncStorage.setItem(
        STORAGE_KEY_REPORTED_INDIVIDUALS,
        JSON.stringify(INITIAL_REPORTED_INDIVIDUALS)
      );
      return INITIAL_REPORTED_INDIVIDUALS;
    }
    try {
      const parsed = JSON.parse(raw) as ReportedIndividual[];
      return parsed.length > 0 ? parsed : INITIAL_REPORTED_INDIVIDUALS;
    } catch {
      return INITIAL_REPORTED_INDIVIDUALS;
    }
  }

  static async addReportedIndividual(
    data: Omit<ReportedIndividual, 'id' | 'createdAt' | 'reportsCount' | 'status'>
  ): Promise<ReportedIndividual[]> {
    const list = await this.getReportedIndividuals();
    const existingIdx = list.findIndex(
      (r) => r.phoneNumber.replace(/\s+/g, '') === data.phoneNumber.replace(/\s+/g, '')
    );

    if (existingIdx >= 0) {
      list[existingIdx] = {
        ...list[existingIdx],
        reportsCount: list[existingIdx].reportsCount + 1,
        amountInvolvedUsd: list[existingIdx].amountInvolvedUsd + data.amountInvolvedUsd,
        evidenceSummary: `${list[existingIdx].evidenceSummary} | +1 Report by ${data.reportedByTrader}: ${data.evidenceSummary}`,
      };
    } else {
      list.unshift({
        ...data,
        id: `rep_${Date.now()}`,
        status: 'investigating',
        reportsCount: 1,
        createdAt: new Date().toISOString().slice(0, 10),
      });
    }

    await AsyncStorage.setItem(STORAGE_KEY_REPORTED_INDIVIDUALS, JSON.stringify(list));
    await this.appendAuditLog({
      actor: data.reportedByTrader,
      actorRole: 'Network Reporter',
      eventType: 'WATCHLIST_BLACKLIST',
      severity: 'warning',
      target: `${data.reportedName} (${data.phoneNumber})`,
      summary: `Submitted new fraud/default report ($${data.amountInvolvedUsd} USD exposure).`,
    });
    return list;
  }

  static async updateReportedStatus(
    id: string,
    status: 'investigating' | 'blacklisted' | 'cleared',
    adminNotes?: string
  ): Promise<ReportedIndividual[]> {
    const list = await this.getReportedIndividuals();
    let targetName = id;
    const updated = list.map((item) => {
      if (item.id === id) {
        targetName = `${item.reportedName} (${item.phoneNumber})`;
        return {
          ...item,
          status,
          ...(adminNotes !== undefined ? { adminNotes } : {}),
        };
      }
      return item;
    });
    await AsyncStorage.setItem(STORAGE_KEY_REPORTED_INDIVIDUALS, JSON.stringify(updated));
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'WATCHLIST_BLACKLIST',
      severity: status === 'blacklisted' ? 'critical' : 'info',
      target: targetName,
      summary: `Updated watchlist status to ${status.toUpperCase()}${adminNotes ? `: Note: ${adminNotes}` : ''}.`,
    });
    return updated;
  }

  static async deleteReportedIndividual(id: string): Promise<ReportedIndividual[]> {
    const list = await this.getReportedIndividuals();
    const updated = list.filter((i) => i.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_REPORTED_INDIVIDUALS, JSON.stringify(updated));
    return updated;
  }

  static async getSupportTickets(): Promise<UserProblemTicket[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SUPPORT_TICKETS);
    if (!raw) {
      await AsyncStorage.setItem(
        STORAGE_KEY_SUPPORT_TICKETS,
        JSON.stringify(INITIAL_SUPPORT_TICKETS)
      );
      return INITIAL_SUPPORT_TICKETS;
    }
    try {
      const parsed = JSON.parse(raw) as UserProblemTicket[];
      return parsed.length > 0 ? parsed : INITIAL_SUPPORT_TICKETS;
    } catch {
      return INITIAL_SUPPORT_TICKETS;
    }
  }

  static async submitSupportTicket(data: {
    userId: string;
    userName: string;
    userEmail: string;
    businessName: string;
    city: string;
    category: TicketCategory;
    priority: 'urgent' | 'high' | 'normal';
    subject: string;
    description: string;
  }): Promise<UserProblemTicket[]> {
    const list = await this.getSupportTickets();
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newTicket: UserProblemTicket = {
      ...data,
      id: `tkt_${Date.now()}`,
      ticketNumber: `TKT-2026-${105 + list.length}`,
      status: 'open',
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    const next = [newTicket, ...list];
    await AsyncStorage.setItem(STORAGE_KEY_SUPPORT_TICKETS, JSON.stringify(next));
    return next;
  }

  static async updateSupportTicket(
    id: string,
    updates: {
      status?: 'open' | 'in_progress' | 'resolved';
      adminReply?: string;
      priority?: 'urgent' | 'high' | 'normal';
    }
  ): Promise<UserProblemTicket[]> {
    const list = await this.getSupportTickets();
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    let ticketNum = id;
    const updated = list.map((t) => {
      if (t.id === id) {
        ticketNum = t.ticketNumber;
        return {
          ...t,
          ...updates,
          updatedAt: nowStr,
        };
      }
      return t;
    });
    await AsyncStorage.setItem(STORAGE_KEY_SUPPORT_TICKETS, JSON.stringify(updated));
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Support Desk',
      eventType: 'USER_MODERATION',
      severity: 'info',
      target: ticketNum,
      summary: `Updated support ticket status to ${(updates.status || 'updated').toUpperCase()}.`,
    });
    return updated;
  }

  static async getSystemBroadcast(): Promise<SystemBroadcast> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SYSTEM_BROADCAST);
    if (!raw) return DEFAULT_BROADCAST;
    try {
      return JSON.parse(raw) as SystemBroadcast;
    } catch {
      return DEFAULT_BROADCAST;
    }
  }

  static async saveSystemBroadcast(bcast: Partial<SystemBroadcast>): Promise<SystemBroadcast> {
    const current = await this.getSystemBroadcast();
    const next: SystemBroadcast = {
      ...current,
      ...bcast,
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    await AsyncStorage.setItem(STORAGE_KEY_SYSTEM_BROADCAST, JSON.stringify(next));
    return next;
  }

  // ============================================================================
  // NEW ADMIN BACK-OFFICE SERVICES (SaaS Revenue, Audit Logs, Parser Ops, RBAC)
  // ============================================================================

  static async getSubscriptionPayments(): Promise<SubscriptionPaymentRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SAAS_PAYMENTS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_SAAS_PAYMENTS, JSON.stringify(INITIAL_SAAS_PAYMENTS));
      return INITIAL_SAAS_PAYMENTS;
    }
    try {
      return JSON.parse(raw) as SubscriptionPaymentRecord[];
    } catch {
      return INITIAL_SAAS_PAYMENTS;
    }
  }

  static async approveSubscriptionPayment(
    paymentId: string,
    licenseKey: string
  ): Promise<SubscriptionPaymentRecord[]> {
    const list = await this.getSubscriptionPayments();
    let targetTrader = paymentId;
    const updated = list.map((p) => {
      if (p.id === paymentId) {
        targetTrader = `${p.traderName} (${p.invoiceRef})`;
        return {
          ...p,
          status: 'paid' as const,
          licenseKeyIssued: licenseKey,
        };
      }
      return p;
    });
    await AsyncStorage.setItem(STORAGE_KEY_SAAS_PAYMENTS, JSON.stringify(updated));
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Billing Auditor',
      eventType: 'LICENSE_MINT',
      severity: 'info',
      target: targetTrader,
      summary: `Verified subscription payment and issued signed key ${licenseKey}.`,
    });
    return updated;
  }

  static async recordNewSubscriptionPayment(data: {
    traderName: string;
    traderEmail: string;
    businessName: string;
    city: string;
    planTier: 'pro' | 'enterprise';
    amountUsd: number;
    paymentMethod: SubscriptionPaymentRecord['paymentMethod'];
    licenseKeyIssued: string;
  }): Promise<SubscriptionPaymentRecord[]> {
    const list = await this.getSubscriptionPayments();
    const today = new Date().toISOString().slice(0, 10);
    const nextRecord: SubscriptionPaymentRecord = {
      id: `pay_${Date.now()}`,
      invoiceRef: `INV-CFM-${9046 + list.length}`,
      ...data,
      status: 'paid',
      paidAt: today,
      expiresAt: `2029-${today.slice(5)}`,
    };
    const updated = [nextRecord, ...list];
    await AsyncStorage.setItem(STORAGE_KEY_SAAS_PAYMENTS, JSON.stringify(updated));
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'LICENSE_MINT',
      severity: 'info',
      target: `${data.traderName} (${data.planTier.toUpperCase()})`,
      summary: `Recorded $${data.amountUsd} ${data.paymentMethod} subscription and issued key ${data.licenseKeyIssued}.`,
    });
    return updated;
  }

  static async getAuditLogs(): Promise<AdminAuditLogEntry[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw) as AdminAuditLogEntry[];
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  static async appendAuditLog(entry: {
    actor: string;
    actorRole: string;
    eventType: AdminAuditLogEntry['eventType'];
    severity: AdminAuditLogEntry['severity'];
    target: string;
    summary: string;
  }): Promise<AdminAuditLogEntry[]> {
    const list = await this.getAuditLogs();
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newItem: AdminAuditLogEntry = {
      id: `aud_${Date.now()}`,
      timestamp: nowStr,
      ...entry,
      ipOrDevice: '197.221.240.14 • Admin Console Session',
    };
    const updated = [newItem, ...list];
    await AsyncStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(updated));
    return updated;
  }

  static async getParserRules(): Promise<ParserRuleConfig[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PARSER_RULES);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_PARSER_RULES, JSON.stringify(INITIAL_PARSER_RULES));
      return INITIAL_PARSER_RULES;
    }
    try {
      return JSON.parse(raw) as ParserRuleConfig[];
    } catch {
      return INITIAL_PARSER_RULES;
    }
  }

  static async toggleParserRuleStatus(id: string): Promise<ParserRuleConfig[]> {
    const list = await this.getParserRules();
    const order: ParserRuleConfig['status'][] = ['active', 'degraded', 'maintenance'];
    const updated = list.map((rule) => {
      if (rule.id === id) {
        const nextStatus = order[(order.indexOf(rule.status) + 1) % order.length];
        return {
          ...rule,
          status: nextStatus,
          successRatePct: nextStatus === 'active' ? 99.2 : rule.successRatePct,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      }
      return rule;
    });
    await AsyncStorage.setItem(STORAGE_KEY_PARSER_RULES, JSON.stringify(updated));
    return updated;
  }

  static async addParserRule(data: {
    providerName: string;
    channelType: ParserRuleConfig['channelType'];
    patternSample: string;
  }): Promise<ParserRuleConfig[]> {
    const list = await this.getParserRules();
    const newRule: ParserRuleConfig = {
      id: `prs_${Date.now()}`,
      providerName: data.providerName,
      channelType: data.channelType,
      patternSample: data.patternSample,
      successRatePct: 100,
      parsedCount30d: 1,
      failedCount30d: 0,
      status: 'active',
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    const updated = [newRule, ...list];
    await AsyncStorage.setItem(STORAGE_KEY_PARSER_RULES, JSON.stringify(updated));
    return updated;
  }

  static async getPushCampaigns(): Promise<PushCampaignRecord[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_PUSH_CAMPAIGNS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_PUSH_CAMPAIGNS, JSON.stringify(INITIAL_PUSH_CAMPAIGNS));
      return INITIAL_PUSH_CAMPAIGNS;
    }
    try {
      return JSON.parse(raw) as PushCampaignRecord[];
    } catch {
      return INITIAL_PUSH_CAMPAIGNS;
    }
  }

  static async sendPushCampaign(data: {
    title: string;
    body: string;
    targetAudience: PushCampaignRecord['targetAudience'];
    urgency: PushCampaignRecord['urgency'];
    deliveredCount: number;
  }): Promise<PushCampaignRecord[]> {
    const list = await this.getPushCampaigns();
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newCamp: PushCampaignRecord = {
      id: `cmp_${Date.now()}`,
      ...data,
      sentBy: 'System Administrator',
      sentAt: nowStr,
    };
    const updated = [newCamp, ...list];
    await AsyncStorage.setItem(STORAGE_KEY_PUSH_CAMPAIGNS, JSON.stringify(updated));
    await this.saveSystemBroadcast({
      title: data.title,
      message: data.body,
      level: data.urgency,
      active: true,
    });
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'USER_MODERATION',
      severity: data.urgency === 'critical' ? 'critical' : 'info',
      target: data.targetAudience,
      summary: `Dispatched push broadcast: "${data.title}" to ${data.deliveredCount} merchant tills.`,
    });
    return updated;
  }

  static async getAdminTeam(): Promise<AdminStaffMember[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_ADMIN_TEAM);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_ADMIN_TEAM, JSON.stringify(INITIAL_ADMIN_TEAM));
      return INITIAL_ADMIN_TEAM;
    }
    try {
      return JSON.parse(raw) as AdminStaffMember[];
    } catch {
      return INITIAL_ADMIN_TEAM;
    }
  }

  static async addAdminStaffMember(data: {
    name: string;
    email: string;
    role: AdminStaffMember['role'];
    permissionsSummary: string;
  }): Promise<AdminStaffMember[]> {
    const list = await this.getAdminTeam();
    const newMember: AdminStaffMember = {
      id: `adm_${Date.now()}`,
      ...data,
      status: 'active',
      lastLogin: 'Invited just now',
    };
    const updated = [...list, newMember];
    await AsyncStorage.setItem(STORAGE_KEY_ADMIN_TEAM, JSON.stringify(updated));
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'ADMIN_AUTH',
      severity: 'info',
      target: `${data.name} (${data.role})`,
      summary: `Provisioned new Admin staff member with ${data.role} RBAC permissions.`,
    });
    return updated;
  }

  static async toggleAdminStaffStatus(id: string): Promise<AdminStaffMember[]> {
    const list = await this.getAdminTeam();
    const updated = list.map((m) =>
      m.id === id
        ? { ...m, status: (m.status === 'active' ? 'suspended' : 'active') as 'active' | 'suspended' }
        : m
    );
    await AsyncStorage.setItem(STORAGE_KEY_ADMIN_TEAM, JSON.stringify(updated));
    return updated;
  }

  static async getFeatureFlags(): Promise<PlatformFeatureFlag[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FEATURE_FLAGS);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY_FEATURE_FLAGS, JSON.stringify(INITIAL_FEATURE_FLAGS));
      return INITIAL_FEATURE_FLAGS;
    }
    try {
      return JSON.parse(raw) as PlatformFeatureFlag[];
    } catch {
      return INITIAL_FEATURE_FLAGS;
    }
  }

  static async toggleFeatureFlag(key: string): Promise<PlatformFeatureFlag[]> {
    const list = await this.getFeatureFlags();
    let flagLabel = key;
    let nextState = false;
    const updated = list.map((f) => {
      if (f.key === key) {
        flagLabel = f.name;
        nextState = !f.enabled;
        return {
          ...f,
          enabled: nextState,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      }
      return f;
    });
    await AsyncStorage.setItem(STORAGE_KEY_FEATURE_FLAGS, JSON.stringify(updated));
    await this.appendAuditLog({
      actor: 'System Administrator',
      actorRole: 'Super Admin',
      eventType: 'FEATURE_FLAG',
      severity: 'warning',
      target: flagLabel,
      summary: `Toggled global platform feature flag "${flagLabel}" to ${nextState ? 'ENABLED' : 'DISABLED'}.`,
    });
    return updated;
  }
}
