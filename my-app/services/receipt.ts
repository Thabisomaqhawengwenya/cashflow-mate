import { Share, Platform } from 'react-native';
import { MobileTransaction, formatMoney, BusinessProfile } from './storage';

export class MobileReceiptService {
  /**
   * Generates a clean, WhatsApp & SMS compatible receipt text
   */
  static generateReceiptText(tx: MobileTransaction, business?: BusinessProfile | null): string {
    const bizName = business?.name || 'CashFlow Mate Market Stall';
    const amountStr = formatMoney(tx.amount, tx.currency);
    const dateStr = tx.transactionDate;
    const ref = tx.originalReference || tx.id.slice(0, 10).toUpperCase();
    const typeLabel = tx.direction === 'inflow' ? 'PAYMENT RECEIVED' : 'OFFICIAL DISBURSEMENT';

    return [
      `🧾 *OFFICIAL TILL RECEIPT*`,
      `🏪 *${bizName}*`,
      `📅 Date: ${dateStr}`,
      `🔖 Reference: ${ref}`,
      `---------------------------------`,
      `📝 *Details:* ${tx.description}`,
      `💵 *Amount:* ${amountStr}`,
      `📌 *Type:* ${typeLabel}`,
      `✅ *Status:* VERIFIED & RECORDED`,
      `---------------------------------`,
      `_Thank you for your custom!_`,
      `_Issued via CashFlow Mate Till OS_`,
    ].join('\n');
  }

  /**
   * Launches native device share sheet (WhatsApp, SMS, Email, Clipboard)
   */
  static async shareReceipt(tx: MobileTransaction, business?: BusinessProfile | null): Promise<boolean> {
    const text = this.generateReceiptText(tx, business);
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `Receipt for ${tx.description}`,
          text,
        });
        return true;
      }

      const result = await Share.share({
        message: text,
        title: `Receipt - ${business?.name || 'CashFlow Mate'}`,
      });

      return result.action === Share.sharedAction;
    } catch (e) {
      console.warn('Share error:', e);
      return false;
    }
  }
}
