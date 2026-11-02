import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_REPORTED_INDIVIDUALS = '@cashflow_admin_reported_individuals_v1';
export const STORAGE_KEY_SUPPORT_TICKETS = '@cashflow_admin_support_tickets_v1';
export const STORAGE_KEY_SYSTEM_BROADCAST = '@cashflow_admin_broadcast_v1';

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
    reportedByTrader: 'Mr Q (Mbare Fresh Produce)',
    reportedByEmail: 'mrq@mbaretuckshop.co.zw',
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
    reportedName: 'Kudzai Transport Runners',
    phoneNumber: '+263 77 332 7109',
    cityMarket: 'Beitbridge Border Post',
    category: 'supplier_scam',
    severity: 'medium',
    status: 'investigating',
    reportedByTrader: 'Tariro Moyo (Gweru CBD Hub)',
    reportedByEmail: 'tariro@gweruboutique.co.zw',
    amountInvolvedUsd: 220.0,
    evidenceSummary:
      'Collected R4,000 ZAR runner deposit for Musina stock purchase and delayed delivery by 11 days without waybill proof.',
    reportsCount: 1,
    createdAt: '2026-11-02',
  },
];

const INITIAL_SUPPORT_TICKETS: UserProblemTicket[] = [
  {
    id: 'tkt_001',
    ticketNumber: 'TKT-2026-104',
    userId: 'usr_seed_002',
    userName: 'Chipo Ndlovu',
    userEmail: 'chipo@bulawayotraders.co.zw',
    businessName: 'Bulawayo Wholesale Grocery Stall #12',
    city: 'Bulawayo',
    category: 'sms_parser_issue',
    priority: 'urgent',
    status: 'open',
    subject: 'New InnBucks USD voucher SMS format not auto-detecting fee',
    description:
      'When customers send InnBucks with the new November SMS template ("InnBucks Ref: IB992..."), the amount parses fine but the 1.5% withdrawal fee is not separated.',
    createdAt: '2026-11-02 09:14',
    updatedAt: '2026-11-02 09:14',
  },
  {
    id: 'tkt_002',
    ticketNumber: 'TKT-2026-103',
    userId: 'usr_seed_003',
    userName: 'Farai Mutasa',
    userEmail: 'farai@mutarehardware.co.zw',
    businessName: 'Mutare Timber & Hardware Depot',
    city: 'Mutare',
    category: 'license_activation',
    priority: 'high',
    status: 'in_progress',
    subject: 'Requesting upgrade from Pro to Enterprise Hub for 3 branch tills',
    description:
      'We paid $15 via EcoCash Biller 44910 for Enterprise Hub so our Sakubva and Dangamvura branches can sync. Please issue our CFM-ENT key.',
    adminReply: 'Payment verified in EcoCash merchant portal. Generating CFM-ENT key now.',
    createdAt: '2026-11-01 16:40',
    updatedAt: '2026-11-02 08:20',
  },
  {
    id: 'tkt_003',
    ticketNumber: 'TKT-2026-102',
    userId: 'usr_seed_004',
    userName: 'Tariro Moyo',
    userEmail: 'tariro@gweruboutique.co.zw',
    businessName: 'Gweru CBD Bales & Runner Hub',
    city: 'Gweru',
    category: 'csv_import_error',
    priority: 'normal',
    status: 'open',
    subject: 'Steward Bank ZiG statement CSV has extra header rows',
    description:
      'My monthly Steward Bank CSV export has 4 bank address lines before the Date/Amount columns start, causing row 1-4 to be skipped.',
    createdAt: '2026-10-31 14:05',
    updatedAt: '2026-10-31 14:05',
  },
  {
    id: 'tkt_004',
    ticketNumber: 'TKT-2026-101',
    userId: 'usr_seed_001',
    userName: 'Mr Q',
    userEmail: 'mrq@mbaretuckshop.co.zw',
    businessName: 'Mbare Fresh Produce & Tuckshop',
    city: 'Harare',
    category: 'feature_request',
    priority: 'normal',
    status: 'resolved',
    subject: 'Add WhatsApp pro-forma quote sharing for wholesale buyers',
    description:
      'Need ability to generate quick quotes and share directly to customer WhatsApp numbers.',
    adminReply: 'Deployed in v1.2.0 under Quotes & Pro-Forma Invoices screen!',
    createdAt: '2026-10-28 11:30',
    updatedAt: '2026-10-30 15:00',
  },
];

const DEFAULT_BROADCAST: SystemBroadcast = {
  id: 'bcast_001',
  title: 'Security Alert: Verify EcoCash SMS Balance Before Releasing Stock',
  message:
    'Admin HQ Watchlist Alert: 4 reports in Harare & Bulawayo of spoofed EcoCash SMS messages. Always dial *151# or check your live wallet balance before handing over wholesale stock.',
  level: 'warning',
  active: true,
  updatedAt: '2026-11-02',
};

export const FRAUD_CATEGORY_LABELS: Record<FraudCategory, string> = {
  fake_ecocash_sms: 'Fake EcoCash / InnBucks SMS',
  credit_defaulter: 'Runaway Credit Defaulter',
  counterfeit_notes: 'Counterfeit Banknotes',
  supplier_scam: 'Runner / Supplier Scam',
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
    return list;
  }

  static async updateReportedStatus(
    id: string,
    status: 'investigating' | 'blacklisted' | 'cleared',
    adminNotes?: string
  ): Promise<ReportedIndividual[]> {
    const list = await this.getReportedIndividuals();
    const updated = list.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            ...(adminNotes !== undefined ? { adminNotes } : {}),
          }
        : item
    );
    await AsyncStorage.setItem(STORAGE_KEY_REPORTED_INDIVIDUALS, JSON.stringify(updated));
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
    const updated = list.map((t) =>
      t.id === id
        ? {
            ...t,
            ...updates,
            updatedAt: nowStr,
          }
        : t
    );
    await AsyncStorage.setItem(STORAGE_KEY_SUPPORT_TICKETS, JSON.stringify(updated));
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
}
