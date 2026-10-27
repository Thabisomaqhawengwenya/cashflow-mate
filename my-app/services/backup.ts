import AsyncStorage from '@react-native-async-storage/async-storage';
import { MobileStorageService, MobileTransaction, MobileDebt, BusinessProfile } from './storage';
import { sha256 } from './crypto';

export interface BackupEnvelope {
  version: number;
  exportedAt: string;
  source: string;
  business: BusinessProfile;
  transactions: MobileTransaction[];
  debts: MobileDebt[];
  checksum: string;
}

export class MobileBackupService {
  /**
   * Exports full market till data into a verifiable, portable JSON string
   */
  static async createBackup(): Promise<string> {
    const [business, transactions, debts] = await Promise.all([
      MobileStorageService.getBusiness(),
      MobileStorageService.getTransactions(),
      MobileStorageService.getDebts(),
    ]);

    const payloadWithoutChecksum = {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: 'CashFlow Mate Mobile OS',
      business,
      transactions,
      debts,
    };

    const checksum = sha256(JSON.stringify(payloadWithoutChecksum));

    const envelope: BackupEnvelope = {
      ...payloadWithoutChecksum,
      checksum,
    };

    return JSON.stringify(envelope, null, 2);
  }

  /**
   * Validates and restores a JSON backup into active storage
   */
  static async restoreBackup(jsonString: string): Promise<{
    transactionsCount: number;
    debtsCount: number;
    businessName: string;
  }> {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new Error('Invalid backup data: empty or not a valid JSON text.');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString.trim());
    } catch {
      throw new Error('Failed to parse backup JSON. Please check file format.');
    }

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.debts)) {
      throw new Error('Unsupported or corrupted backup structure.');
    }

    // Verify integrity checksum
    const { checksum, ...withoutChecksum } = parsed;
    const computed = sha256(JSON.stringify(withoutChecksum));
    if (checksum && computed !== checksum) {
      throw new Error('Integrity validation failed: Backup data appears modified or damaged.');
    }

    // Restore business profile
    if (parsed.business && parsed.business.name) {
      await MobileStorageService.updateBusiness(parsed.business);
    }

    // Restore transactions
    await AsyncStorage.setItem('@cashflow_mate_tx_v1', JSON.stringify(parsed.transactions));

    // Restore debts
    await AsyncStorage.setItem('@cashflow_mate_debts_v1', JSON.stringify(parsed.debts));

    return {
      transactionsCount: parsed.transactions.length,
      debtsCount: parsed.debts.length,
      businessName: parsed.business?.name || 'Restored Enterprise',
    };
  }
}
