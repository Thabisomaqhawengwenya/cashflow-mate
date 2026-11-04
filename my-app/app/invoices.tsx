import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { CurrencyCode, formatMoney, roundMoney } from '@/services/storage';
import { MobileOperationsService, InvoiceQuote } from '@/services/operations';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { M3Badge } from '@/components/M3/M3Badge';
import { useAppearance } from '@/context/AppearanceContext';

export default function InvoicesScreen() {
  const { palette, cardRadius, chipRadius } = useAppearance();
  const [invoices, setInvoices] = useState<InvoiceQuote[]>([]);
  const [filter, setFilter] = useState<'all' | 'open' | 'settled'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // Builder State
  const [docType, setDocType] = useState<'quote' | 'invoice'>('quote');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [itemDesc, setItemDesc] = useState('');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [notes, setNotes] = useState('');

  const loadInvoices = useCallback(async () => {
    const data = await MobileOperationsService.getInvoices();
    setInvoices(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  const openTotalUsd = roundMoney(
    invoices
      .filter((i) => i.status === 'open' && i.currency === 'USD')
      .reduce((sum, i) => sum + i.totalAmount, 0)
  );
  const paidTotalUsd = roundMoney(
    invoices
      .filter((i) => i.status === 'paid' && i.currency === 'USD')
      .reduce((sum, i) => sum + i.totalAmount, 0)
  );

  const visibleInvoices = invoices.filter((i) => {
    if (filter === 'open') return i.status === 'open';
    if (filter === 'settled') return i.status !== 'open';
    return true;
  });

  const handleCreateQuote = async () => {
    if (!customerName.trim() || !itemDesc.trim() || !itemPrice.trim()) {
      Alert.alert(
        'Missing Fields',
        'Please enter customer name, item description, and unit price.'
      );
      return;
    }

    const created = await MobileOperationsService.addInvoice({
      docType,
      customerName,
      customerPhone: customerPhone || '+263 77 000 0000',
      currency,
      items: [
        {
          description: itemDesc.trim(),
          quantity: Math.max(1, Number(itemQty) || 1),
          unitPrice: Math.max(0, Number(itemPrice) || 0),
        },
      ],
      notes,
    });

    setCustomerName('');
    setCustomerPhone('');
    setItemDesc('');
    setItemQty('1');
    setItemPrice('');
    setNotes('');
    setIsModalOpen(false);
    await loadInvoices();
    setBanner(`Created ${created.referenceNumber} for ${created.customerName}`);
    setTimeout(() => setBanner(null), 3500);
  };

  const handleConvertToCash = async (inv: InvoiceQuote) => {
    const res = await MobileOperationsService.convertInvoiceToCashSale(inv.id);
    if (res) {
      await loadInvoices();
      setBanner(
        `${inv.referenceNumber} marked PAID (+${formatMoney(inv.totalAmount, inv.currency)} added to Till)`
      );
      setTimeout(() => setBanner(null), 4000);
    }
  };

  const handleConvertToCredit = async (inv: InvoiceQuote) => {
    const res = await MobileOperationsService.convertInvoiceToCreditDebt(inv.id);
    if (res) {
      await loadInvoices();
      setBanner(
        `${inv.referenceNumber} moved to Customer Credit (${inv.customerName} owes ${formatMoney(inv.totalAmount, inv.currency)})`
      );
      setTimeout(() => setBanner(null), 4000);
    }
  };

  const handleShareQuote = async (inv: InvoiceQuote) => {
    const lines = inv.items
      .map(
        (line) =>
          `- ${line.quantity}x ${line.description} @ ${formatMoney(line.unitPrice, inv.currency)}`
      )
      .join('\n');
    const summary = `CASHFLOW MATE ${inv.docType.toUpperCase()} (${inv.referenceNumber})\nTo: ${inv.customerName}\n${lines}\nTotal: ${formatMoney(inv.totalAmount, inv.currency)}\nValid until: ${inv.dueDate}`;

    try {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(summary);
          setBanner(`Copied ${inv.referenceNumber} quotation to clipboard`);
        } else {
          setBanner(`Quotation ${inv.referenceNumber} ready`);
        }
      } else {
        await Share.share({
          message: summary,
          title: `Quotation ${inv.referenceNumber}`,
        });
        setBanner(`Shared ${inv.referenceNumber}`);
      }
    } catch (err: any) {
      setBanner(`Unable to share: ${err.message || 'Error'}`);
    }
    setTimeout(() => setBanner(null), 3500);
  };

  return (
    <View style={[styles.screenWrapper, { backgroundColor: palette.headerBg }]}>
      {/* 1. Header */}
      <View style={[styles.header, { backgroundColor: palette.headerBg }]}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={styles.headerTitle}>Quotes & Pro-Forma</Text>
            <Text style={[styles.headerSub, { color: palette.accent }]}>
              QUOTATIONS • ONE-TAP TILL CONVERSION
            </Text>
          </View>
          <Pressable
            onPress={() => setIsModalOpen(true)}
            style={[styles.addBtn, { backgroundColor: palette.primary, borderRadius: chipRadius }]}
            accessibilityRole="button"
            accessibilityLabel="Create new quotation or invoice"
          >
            <Ionicons name="document-text-outline" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New Quote</Text>
          </Pressable>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiValue, { color: '#FBBF24' }]}>
              {formatMoney(openTotalUsd, 'USD')}
            </Text>
            <Text style={styles.kpiLabel}>Open Quotes</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiValue, { color: '#34D399' }]}>
              {formatMoney(paidTotalUsd, 'USD')}
            </Text>
            <Text style={styles.kpiLabel}>Converted Sales</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{String(invoices.length).padStart(2, '0')}</Text>
            <Text style={styles.kpiLabel}>Total Docs</Text>
          </View>
        </View>
      </View>

      {/* 2. Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          {banner ? (
            <View style={[styles.toastBanner, { borderRadius: cardRadius }]}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.toastText}>{banner}</Text>
            </View>
          ) : null}

          <View style={styles.filterRow}>
            {[
              { id: 'all', label: `All (${invoices.length})` },
              {
                id: 'open',
                label: `Open Quotes (${invoices.filter((i) => i.status === 'open').length})`,
              },
              {
                id: 'settled',
                label: `Converted (${invoices.filter((i) => i.status !== 'open').length})`,
              },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => setFilter(tab.id as any)}
                  style={[
                    styles.filterChip,
                    { borderRadius: chipRadius },
                    active && { backgroundColor: palette.headerBg },
                  ]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {visibleInvoices.map((inv) => {
            const isOpen = inv.status === 'open';
            return (
              <View key={inv.id} style={[styles.card, { borderRadius: cardRadius }]}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.refRow}>
                      <Text style={styles.refCode}>{inv.referenceNumber}</Text>
                      <Text style={styles.dot}>•</Text>
                      <Text style={styles.dueText}>Due {inv.dueDate}</Text>
                    </View>
                    <Text style={styles.customerName}>{inv.customerName}</Text>
                    <Text style={styles.customerPhone}>{inv.customerPhone}</Text>
                  </View>

                  <View style={styles.amountCol}>
                    <Text style={[styles.totalText, { color: palette.primary }]}>
                      {formatMoney(inv.totalAmount, inv.currency)}
                    </Text>
                    <M3Badge
                      label={
                        inv.status === 'paid'
                          ? 'PAID SALE'
                          : inv.status === 'credit'
                          ? 'MOVED TO CREDIT'
                          : 'OPEN QUOTE'
                      }
                      variant={
                        inv.status === 'paid'
                          ? 'mint'
                          : inv.status === 'credit'
                          ? 'primary'
                          : 'amber'
                      }
                    />
                  </View>
                </View>

                {/* Line Items */}
                <View style={styles.linesBox}>
                  {inv.items.map((line, idx) => (
                    <View key={idx} style={styles.lineRow}>
                      <Text style={styles.lineDesc}>
                        {line.quantity}x {line.description}
                      </Text>
                      <Text style={styles.lineSub}>
                        {formatMoney(roundMoney(line.quantity * line.unitPrice), inv.currency)}
                      </Text>
                    </View>
                  ))}
                  {inv.notes ? <Text style={styles.noteText}>{inv.notes}</Text> : null}
                </View>

                {/* Actions */}
                <View style={styles.actionRow}>
                  {isOpen ? (
                    <>
                      <Pressable
                        onPress={() => handleConvertToCash(inv)}
                        style={[
                          styles.primaryActionBtn,
                          { backgroundColor: palette.primary, borderRadius: chipRadius },
                        ]}
                      >
                        <Ionicons name="cash-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.primaryActionText}>Convert to Sale</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleConvertToCredit(inv)}
                        style={[styles.secondaryActionBtn, { borderRadius: chipRadius }]}
                      >
                        <Ionicons
                          name="people-outline"
                          size={15}
                          color={EmeraldTokens.deepPine}
                        />
                        <Text style={styles.secondaryActionText}>To Credit</Text>
                      </Pressable>
                    </>
                  ) : null}

                  <Pressable
                    onPress={() => handleShareQuote(inv)}
                    style={[styles.shareBtn, { borderRadius: chipRadius }]}
                  >
                    <Ionicons name="share-social-outline" size={15} color={palette.primary} />
                    <Text style={[styles.shareBtnText, { color: palette.primary }]}>
                      Copy Quote
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Create Quote Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Quotation / Invoice</Text>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close-circle" size={26} color={EmeraldTokens.textMuted} />
              </Pressable>
            </View>

            <View style={styles.typeSwitchRow}>
              {(['quote', 'invoice'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setDocType(t)}
                  style={[
                    styles.typeChip,
                    { borderRadius: chipRadius },
                    docType === t && { backgroundColor: palette.headerBg },
                  ]}
                >
                  <Text style={[styles.typeChipText, docType === t && { color: '#FFFFFF' }]}>
                    {t === 'quote' ? 'Quotation (QT)' : 'Pro-Forma Invoice (INV)'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <M3Input
              label="Customer / Business Name"
              placeholder="e.g. Chipo Catering Services"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <M3Input
              label="Customer WhatsApp / Phone"
              placeholder="e.g. +263 77 412 8890"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />
            <M3Input
              label="Line Item Description"
              placeholder="e.g. 10x ZimGold Cooking Oil 2L"
              value={itemDesc}
              onChangeText={setItemDesc}
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <M3Input
                  label="Quantity"
                  placeholder="1"
                  value={itemQty}
                  onChangeText={setItemQty}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <M3Input
                  label="Unit Price ($)"
                  placeholder="38.00"
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <M3Input
              label="Payment Terms / Notes (Optional)"
              placeholder="e.g. Payable via EcoCash USD or Cash on delivery"
              value={notes}
              onChangeText={setNotes}
            />

            <M3Button
              label="GENERATE QUOTATION"
              variant="mint"
              size="lg"
              onPress={handleCreateQuote}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 52 : 34,
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  kpiLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 3,
    fontWeight: '600',
  },
  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 48,
  },
  innerContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E2E8F0',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  refCode: {
    fontSize: 11,
    fontWeight: '800',
    color: EmeraldTokens.deepPine,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dot: {
    fontSize: 10,
    color: EmeraldTokens.textSubtle,
  },
  dueText: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  customerPhone: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  linesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineDesc: {
    fontSize: 13,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
    flex: 1,
  },
  lineSub: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  noteText: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  primaryActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 5,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 5,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 21, 46, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  typeSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
  },
});
