import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  MobileStorageService,
  MobileTransaction,
  categoryClassification,
  formatMoney,
  sortTransactionsByDateDesc,
  CATEGORIES,
  BusinessProfile,
} from '@/services/storage';
import { MobileReceiptService } from '@/services/receipt';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { CompanyBrandLogo } from '@/components/BrandLogos';
import { useLanguage } from '@/context/LanguageContext';

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { t, getCategoryLabel } = useLanguage();

  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'inflow' | 'outflow' | 'review'>('all');

  // Edit Modal
  const [selectedTx, setSelectedTx] = useState<MobileTransaction | null>(null);
  const [editCategory, setEditCategory] = useState('sales_goods');
  const [editNotes, setEditNotes] = useState('');
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  const loadTransactions = useCallback(async () => {
    const [all, biz] = await Promise.all([
      MobileStorageService.getTransactions(),
      MobileStorageService.getBusiness(),
    ]);
    setTransactions(all);
    setBusiness(biz);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const filtered = sortTransactionsByDateDesc(
    transactions.filter((tx) => {
      const matchesSearch =
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        (tx.originalReference && tx.originalReference.toLowerCase().includes(search.toLowerCase())) ||
        tx.category.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'inflow') return tx.direction === 'inflow';
      if (selectedFilter === 'outflow') return tx.direction === 'outflow';
      if (selectedFilter === 'review') return tx.reviewStatus === 'pending_review';
      return true;
    })
  );

  const handleOpenEdit = (tx: MobileTransaction) => {
    setSelectedTx(tx);
    setEditCategory(tx.category);
    setEditNotes(tx.notes || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedTx) return;
    const classification = categoryClassification(editCategory);
    await MobileStorageService.updateTransaction(selectedTx.id, {
      category: editCategory,
      type: classification.type,
      direction: classification.direction,
      notes: editNotes,
      reviewStatus: 'confirmed',
    });
    setSelectedTx(null);
    await loadTransactions();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure you want to remove this record permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await MobileStorageService.deleteTransaction(id);
          setSelectedTx(null);
          await loadTransactions();
        },
      },
    ]);
  };

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Deep Forest Emerald Header with Filter Capsules (Directly from Screen 3) */}
      <View style={styles.emeraldHeader}>
        {/* Top Navigation Row */}
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            hitSlop={10}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('my_transactions')}</Text>
          <Pressable
            onPress={() => router.push('/modal')}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="filter-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search Bar inside Header */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={17} color="rgba(255, 255, 255, 0.6)" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('search_placeholder')}
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255, 255, 255, 0.6)" />
            </Pressable>
          )}
        </View>

        {/* Filter Capsule Tabs (Directly from Screen 3) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillRow}
        >
          {[
            { id: 'all', label: t('filter_all') },
            { id: 'inflow', label: t('filter_inflows') },
            { id: 'outflow', label: t('filter_outflows') },
            { id: 'review', label: t('filter_review') },
          ].map((item) => {
            const isActive = selectedFilter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedFilter(item.id as any)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.label}`}
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
        </ScrollView>
      </View>

      {/* 2. White Curved Body Sheet */}
      <View style={styles.sheetContainer}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>
            All Records <Text style={styles.countBadge}>({filtered.length})</Text>
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {filtered.length > 0 ? (
            filtered.map((tx) => {
              const isInflow = tx.direction === 'inflow';
              const catMeta = CATEGORIES[tx.category];

              return (
                <Pressable
                  key={tx.id}
                  onPress={() => handleOpenEdit(tx)}
                  style={({ pressed }) => [
                    styles.txCard,
                    { transform: [{ scale: pressed ? 0.98 : 1 }] },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <CompanyBrandLogo identifier={tx.description} size={38} style={{ marginRight: 12, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      {/* Top Row: Ref & Timestamp + Amount Badge */}
                      <View style={styles.cardTopRow}>
                        <View style={styles.cardRefGroup}>
                          <Text style={styles.cardRefCode}>
                            % {tx.originalReference || tx.id.slice(0, 8).toUpperCase()}
                          </Text>
                          <View style={styles.timeGroup}>
                            <Ionicons name="time-outline" size={12} color={BlueTokens.textSubtle} />
                            <Text style={styles.cardTimeText}>{tx.transactionDate}</Text>
                          </View>
                        </View>

                        {/* Amount Chip */}
                        <View
                          style={[
                            styles.cardAmountBadge,
                            {
                              backgroundColor: isInflow
                                ? BlueTokens.pastelMint
                                : BlueTokens.pastelRose,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cardAmountText,
                              {
                                color: isInflow
                                  ? BlueTokens.success
                                  : BlueTokens.error,
                              },
                            ]}
                          >
                            {isInflow ? '+' : '-'}
                            {formatMoney(tx.amount, tx.currency)}
                          </Text>
                        </View>
                      </View>

                      {/* Middle Row: Description */}
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {tx.description}
                      </Text>

                      {/* Bottom Row: Counterparty/Category + Review Status */}
                      <View style={styles.cardBottomRow}>
                        <View style={styles.avatarGroup}>
                          <View style={styles.miniAvatar}>
                            <Ionicons
                              name={isInflow ? 'arrow-down' : 'arrow-up'}
                              size={12}
                              color={BlueTokens.primary}
                            />
                          </View>
                          <Text style={styles.categoryName} numberOfLines={1}>
                            {getCategoryLabel(tx.category)}
                          </Text>
                        </View>

                        <M3Badge
                          label={tx.reviewStatus === 'confirmed' ? t('status_completed') : t('status_review')}
                          variant={tx.reviewStatus === 'confirmed' ? 'mint' : 'amber'}
                        />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={44} color={EmeraldTokens.textSubtle} />
              <Text style={styles.emptyTitle}>{t('empty_records_title')}</Text>
              <Text style={styles.emptySub}>{t('empty_records_sub')}</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Edit / Review Transaction Modal */}
      <Modal
        visible={!!selectedTx}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedTx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <Pressable onPress={() => setSelectedTx(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            {selectedTx && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalAmountBox}>
                  <Text style={styles.modalAmountLabel}>Total Amount</Text>
                  <Text
                    style={[
                      styles.modalAmountValue,
                      {
                        color:
                          selectedTx.direction === 'inflow'
                            ? EmeraldTokens.pastelMintText
                            : EmeraldTokens.pastelRoseText,
                      },
                    ]}
                  >
                    {selectedTx.direction === 'inflow' ? '+' : '-'}
                    {formatMoney(selectedTx.amount, selectedTx.currency)}
                  </Text>
                  <Text style={styles.modalDesc}>{selectedTx.description}</Text>
                </View>

                {/* Category Selection Carousel */}
                <Text style={styles.inputHeading}>Reclassify Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsRow}>
                  {Object.entries(CATEGORIES).map(([catId, cat]) => {
                    const isSelected = editCategory === catId;
                    return (
                      <Pressable
                        key={catId}
                        onPress={() => setEditCategory(catId)}
                        style={[
                          styles.catChoiceChip,
                          {
                            backgroundColor: isSelected
                              ? EmeraldTokens.deepPine
                              : '#F1F5F3',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catChoiceText,
                            { color: isSelected ? '#FFFFFF' : EmeraldTokens.textSlate },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <M3Input
                  label="Merchant / Notes"
                  placeholder="Add notes about supplier, receipt or terms..."
                  value={editNotes}
                  onChangeText={setEditNotes}
                  style={{ marginTop: 12 }}
                />

                <M3Button
                  label="SAVE & CONFIRM"
                  variant="mint"
                  size="lg"
                  onPress={handleSaveEdit}
                  style={{ marginTop: 16 }}
                />

                <Pressable
                  onPress={() => selectedTx && MobileReceiptService.shareReceipt(selectedTx, business)}
                  style={styles.shareReceiptBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Share digital receipt on WhatsApp"
                >
                  <Ionicons name="share-social-outline" size={17} color={EmeraldTokens.mintDarkText} />
                  <Text style={styles.shareReceiptBtnText}>Share Digital Receipt (WhatsApp)</Text>
                </Pressable>

                <Pressable
                  onPress={() => selectedTx && handleDelete(selectedTx.id)}
                  style={styles.deleteRow}
                >
                  <Ionicons name="trash-outline" size={16} color="#E11D48" />
                  <Text style={styles.deleteText}>Delete Record Permanently</Text>
                </Pressable>
              </ScrollView>
            )}
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
    marginBottom: 14,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: DesignTokens.shapes.pill,
    paddingHorizontal: 14,
    height: 42,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    marginLeft: 8,
  },
  filterPillRow: {
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

  // Curved Sheet
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

  // Transaction Cards (Matching Screen 3)
  txCard: {
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
    marginBottom: 8,
  },
  cardRefGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardRefCode: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.textSubtle,
    letterSpacing: 0.4,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTimeText: {
    fontSize: 11,
    color: EmeraldTokens.textSubtle,
  },
  cardAmountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: DesignTokens.shapes.pill,
  },
  cardAmountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: EmeraldTokens.pastelMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '500',
    color: EmeraldTokens.textMuted,
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
    maxHeight: '85%',
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
  closeBtn: {
    padding: 4,
  },
  modalAmountBox: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8FAF9',
    borderRadius: 18,
    marginBottom: 16,
  },
  modalAmountLabel: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    fontWeight: '600',
  },
  modalAmountValue: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 4,
  },
  modalDesc: {
    fontSize: 13,
    color: EmeraldTokens.textSlate,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  inputHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 8,
  },
  catChipsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  catChoiceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: DesignTokens.shapes.pill,
    marginRight: 8,
  },
  catChoiceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shareReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: EmeraldTokens.mintSoft,
    paddingVertical: 12,
    borderRadius: DesignTokens.shapes.pill,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: EmeraldTokens.mintBorder,
  },
  shareReceiptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.mintDarkText,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E11D48',
  },
});
