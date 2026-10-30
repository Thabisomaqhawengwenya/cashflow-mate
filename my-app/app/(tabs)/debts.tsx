import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  BusinessProfile,
  MobileStorageService,
  MobileDebt,
  formatMoney,
  getLocalDateString,
} from '@/services/storage';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { CompanyBrandLogo } from '@/components/BrandLogos';
import { useLanguage } from '@/context/LanguageContext';

export default function DebtsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { t } = useLanguage();

  const [debts, setDebts] = useState<MobileDebt[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [filter, setFilter] = useState<'all' | 'owed_to_business' | 'owed_by_business'>('all');

  // Repayment Modal
  const [selectedDebt, setSelectedDebt] = useState<MobileDebt | null>(null);
  const [payAmount, setPayAmount] = useState('');

  // Add Debt Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [direction, setDirection] = useState<'owed_to_business' | 'owed_by_business'>('owed_to_business');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');

  const loadDebts = useCallback(async () => {
    const [all, profile] = await Promise.all([
      MobileStorageService.getDebts(),
      MobileStorageService.getBusiness(),
    ]);
    setDebts(all);
    setBusiness(profile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDebts();
    }, [loadDebts])
  );

  const currency = business?.currency || 'USD';
  const filteredDebts = debts.filter((d) => filter === 'all' || d.direction === filter);

  const totalOwedToBusiness = debts
    .filter(
      (d) => d.direction === 'owed_to_business' && d.status !== 'settled' && d.currency === currency
    )
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  const totalOwedByBusiness = debts
    .filter(
      (d) => d.direction === 'owed_by_business' && d.status !== 'settled' && d.currency === currency
    )
    .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0);

  const handleRecordPayment = async () => {
    if (!selectedDebt) return;
    const p = parseFloat(payAmount);
    if (isNaN(p) || p <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    const applied = await MobileStorageService.recordDebtPayment(selectedDebt.id, p);
    if (applied < p) {
      Alert.alert(
        'Payment Capped',
        `Only ${formatMoney(applied, selectedDebt.currency)} was outstanding; the balance is now settled.`
      );
    }
    setSelectedDebt(null);
    setPayAmount('');
    await loadDebts();
  };

  const handleDeleteDebt = (debt: MobileDebt) => {
    Alert.alert('Delete Debt Record', `Remove the credit record for ${debt.personName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await MobileStorageService.deleteDebt(debt.id);
          await loadDebts();
        },
      },
    ]);
  };

  const handleCreateDebt = async () => {
    const t = parseFloat(totalAmount);
    if (isNaN(t) || t <= 0 || !personName.trim()) {
      Alert.alert('Invalid Input', 'Please enter person name and valid total amount.');
      return;
    }

    await MobileStorageService.saveDebt({
      personName: personName.trim(),
      direction,
      totalAmount: t,
      currency,
      recordedDate: getLocalDateString(),
      notes: notes.trim() || undefined,
    });

    setIsAddOpen(false);
    setPersonName('');
    setTotalAmount('');
    setNotes('');
    await loadDebts();
  };

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Deep Forest Emerald Header */}
      <View style={styles.emeraldHeader}>
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('debts_title')}</Text>
          <Pressable
            onPress={() => setIsAddOpen(true)}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* 2-Stat Hero Row (Receivables vs Payables) */}
        <View style={styles.statHeroBar}>
          <View style={styles.statHeroCol}>
            <Text style={styles.statHeroAmount}>
              {formatMoney(totalOwedToBusiness, currency)}
            </Text>
            <Text style={styles.statHeroLabel}>{t('tab_owed_to_me')}</Text>
          </View>
          <View style={styles.statHeroDivider} />
          <View style={styles.statHeroCol}>
            <Text style={[styles.statHeroAmount, { color: EmeraldTokens.pastelRose }]}>
              {formatMoney(totalOwedByBusiness, currency)}
            </Text>
            <Text style={styles.statHeroLabel}>{t('tab_i_owe')}</Text>
          </View>
        </View>

        {/* Filter Capsules */}
        <View style={styles.filterPillsRow}>
          {[
            { id: 'all', label: t('filter_all_records') },
            { id: 'owed_to_business', label: t('tab_owed_to_me') },
            { id: 'owed_by_business', label: t('tab_i_owe') },
          ].map((item) => {
            const isActive = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id as any)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isActive
                      ? EmeraldTokens.mintCta
                      : 'rgba(255, 255, 255, 0.14)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isActive ? EmeraldTokens.mintDarkText : '#FFFFFF',
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. White Curved Body Sheet */}
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            Credit Ledgers <Text style={styles.countBadge}>({filteredDebts.length})</Text>
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredDebts.length > 0 ? (
            filteredDebts.map((debt) => {
              const isOwedToMe = debt.direction === 'owed_to_business';
              const remaining = debt.totalAmount - debt.paidAmount;
              const isSettled = debt.status === 'settled';

              return (
                <View key={debt.id} style={styles.debtCard}>
                  {/* Top Row: Person Name + Remaining Badge */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.personGroup}>
                      <CompanyBrandLogo
                        identifier={debt.personName + ' ' + (debt.notes || '')}
                        size={38}
                        fallbackIcon={
                          <View
                            style={[
                              styles.miniAvatar,
                              {
                                backgroundColor: isOwedToMe
                                  ? BlueTokens.pastelMint
                                  : BlueTokens.pastelRose,
                              },
                            ]}
                          >
                            <Ionicons
                              name={isOwedToMe ? 'arrow-down' : 'arrow-up'}
                              size={13}
                              color={
                                isOwedToMe
                                  ? BlueTokens.success
                                  : BlueTokens.error
                              }
                            />
                          </View>
                        }
                        style={{ marginRight: 10 }}
                      />
                      <View>
                        <Text style={styles.personName}>{debt.personName}</Text>
                        <Text style={styles.recordedDate}>
                          Recorded: {debt.recordedDate}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.remainingBadge,
                        {
                          backgroundColor: isSettled
                            ? '#F1F5F3'
                            : isOwedToMe
                            ? EmeraldTokens.pastelMint
                            : EmeraldTokens.pastelRose,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.remainingBadgeText,
                          {
                            color: isSettled
                              ? EmeraldTokens.textMuted
                              : isOwedToMe
                              ? EmeraldTokens.pastelMintText
                              : EmeraldTokens.pastelRoseText,
                          },
                        ]}
                      >
                        {isSettled
                          ? 'SETTLED'
                          : `${formatMoney(remaining, debt.currency)} DUE`}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(
                            100,
                            Math.round((debt.paidAmount / debt.totalAmount) * 100)
                          )}%`,
                          backgroundColor: isSettled
                            ? EmeraldTokens.deepPine
                            : EmeraldTokens.mintCta,
                        },
                      ]}
                    />
                  </View>

                  {/* Subtext info */}
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceSub}>
                      Paid: {formatMoney(debt.paidAmount, debt.currency)} of{' '}
                      {formatMoney(debt.totalAmount, debt.currency)}
                    </Text>
                    {debt.notes && (
                      <Text style={styles.notesText} numberOfLines={1}>
                        {debt.notes}
                      </Text>
                    )}
                  </View>

                  {/* Action buttons */}
                  {!isSettled && (
                    <View style={styles.actionRow}>
                      <Pressable
                        onPress={() => setSelectedDebt(debt)}
                        style={styles.payChip}
                      >
                        <Ionicons name="cash-outline" size={14} color={EmeraldTokens.mintDarkText} />
                        <Text style={styles.payChipText}>Record Repayment</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteDebt(debt)}
                        style={styles.delBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#E11D48" />
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={44} color={EmeraldTokens.textSubtle} />
              <Text style={styles.emptyTitle}>No credit records</Text>
              <Text style={styles.emptySub}>
                Tap the button below to add store credit or a supplier loan.
              </Text>
            </View>
          )}

          <View style={{ marginTop: 14, marginBottom: 24 }}>
            <M3Button
              label="ADD CREDIT RECORD"
              variant="mint"
              size="lg"
              icon={<Ionicons name="add" size={20} color={EmeraldTokens.mintDarkText} />}
              onPress={() => setIsAddOpen(true)}
            />
          </View>
        </ScrollView>
      </View>

      {/* Record Repayment Modal */}
      <Modal
        visible={!!selectedDebt}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDebt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Repayment</Text>
              <Pressable onPress={() => setSelectedDebt(null)}>
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            {selectedDebt && (
              <View>
                <Text style={styles.debtModalName}>{selectedDebt.personName}</Text>
                <Text style={styles.debtModalSub}>
                  Remaining Outstanding:{' '}
                  <Text style={{ fontWeight: '800', color: EmeraldTokens.deepPine }}>
                    {formatMoney(
                      selectedDebt.totalAmount - selectedDebt.paidAmount,
                      selectedDebt.currency
                    )}
                  </Text>
                </Text>

                <M3Input
                  label="Repayment Amount"
                  placeholder="0.00"
                  value={payAmount}
                  onChangeText={setPayAmount}
                  keyboardType="numeric"
                  prefix={`${selectedDebt.currency} `}
                />

                <M3Button
                  label="CONFIRM PAYMENT"
                  variant="mint"
                  size="lg"
                  onPress={handleRecordPayment}
                  style={{ marginTop: 16 }}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add New Debt Modal */}
      <Modal
        visible={isAddOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Credit Ledger</Text>
              <Pressable onPress={() => setIsAddOpen(false)}>
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            <View style={styles.directionToggle}>
              <Pressable
                onPress={() => setDirection('owed_to_business')}
                style={[
                  styles.toggleBtn,
                  direction === 'owed_to_business' && { backgroundColor: EmeraldTokens.deepPine },
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    direction === 'owed_to_business' && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  Customer Owes Me
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setDirection('owed_by_business')}
                style={[
                  styles.toggleBtn,
                  direction === 'owed_by_business' && { backgroundColor: EmeraldTokens.deepPine },
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    direction === 'owed_by_business' && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  I Owe Supplier
                </Text>
              </Pressable>
            </View>

            <M3Input
              label="Contact / Person Name"
              placeholder="e.g. Mai Ruvimbo, Mbare Veg Supplier"
              value={personName}
              onChangeText={setPersonName}
            />

            <M3Input
              label="Total Credit Amount"
              placeholder="0.00"
              value={totalAmount}
              onChangeText={setTotalAmount}
              keyboardType="numeric"
              prefix={`${currency} `}
            />

            <M3Input
              label="Notes (Optional)"
              placeholder="e.g. 2 boxes of cooking oil on credit"
              value={notes}
              onChangeText={setNotes}
            />

            <M3Button
              label="SAVE RECORD"
              variant="mint"
              size="lg"
              onPress={handleCreateDebt}
              style={{ marginTop: 14 }}
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
  emeraldHeader: {
    backgroundColor: EmeraldTokens.deepPine,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },

  statHeroBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  statHeroCol: {
    flex: 1,
    alignItems: 'center',
  },
  statHeroAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statHeroLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
    fontWeight: '500',
  },
  statHeroDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },

  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DesignTokens.shapes.pill,
  },
  filterPillText: {
    fontSize: 12,
  },

  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetHeader: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  countBadge: {
    fontSize: 14,
    color: EmeraldTokens.textMuted,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  debtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  personGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: 15,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  recordedDate: {
    fontSize: 11,
    color: EmeraldTokens.textSubtle,
    marginTop: 1,
  },
  remainingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignTokens.shapes.pill,
  },
  remainingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F3',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceSub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    fontWeight: '500',
  },
  notesText: {
    fontSize: 11,
    color: EmeraldTokens.textSubtle,
    maxWidth: '45%',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 23, 42, 0.05)',
    paddingTop: 10,
    marginTop: 4,
  },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: EmeraldTokens.pastelMint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
  },
  payChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.mintDarkText,
  },
  delBtn: {
    padding: 6,
  },

  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  debtModalName: {
    fontSize: 16,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  debtModalSub: {
    fontSize: 13,
    color: EmeraldTokens.textMuted,
    marginVertical: 8,
  },
  directionToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F3',
    borderRadius: DesignTokens.shapes.pill,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: EmeraldTokens.textMuted,
  },
});
