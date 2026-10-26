import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  MobileStorageService,
  MobileTransaction,
  categoryClassification,
  formatMoney,
  sortTransactionsByDateDesc,
  CATEGORIES,
} from '@/services/storage';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'inflow' | 'outflow'>('all');

  // Edit Modal
  const [selectedTx, setSelectedTx] = useState<MobileTransaction | null>(null);
  const [editCategory, setEditCategory] = useState('sales_goods');
  const [editNotes, setEditNotes] = useState('');

  const loadTransactions = useCallback(async () => {
    const all = await MobileStorageService.getTransactions();
    setTransactions(all);
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
        (tx.originalReference && tx.originalReference.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = selectedCategory === 'all' || tx.category === selectedCategory;
      const matchesDir = directionFilter === 'all' || tx.direction === directionFilter;

      return matchesSearch && matchesCat && matchesDir;
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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Search Header */}
      <View style={styles.header}>
        <M3Input
          label="Search Transactions"
          placeholder="Search by vendor, bread, customer name, ref..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Direction & Category Filter Chips */}
      <View style={styles.filterSection}>
        {/* Direction Switcher */}
        <View style={styles.directionRow}>
          {[
            { id: 'all', label: 'All' },
            { id: 'inflow', label: '+ Inflows' },
            { id: 'outflow', label: '- Outflows' },
          ].map((item) => {
            const isActive = directionFilter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setDirectionFilter(item.id as any)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${item.label}`}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? theme.primary : theme.surfaceContainer,
                    borderColor: isActive ? theme.primary : theme.outlineVariant,
                  },
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: '600', color: isActive ? '#FFFFFF' : theme.text }}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Categories Horizontal Carousel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catCarousel}>
          <Pressable
            onPress={() => setSelectedCategory('all')}
            accessibilityRole="button"
            accessibilityLabel="Filter by All Categories"
            accessibilityState={{ selected: selectedCategory === 'all' }}
            style={[
              styles.catChip,
              {
                backgroundColor: selectedCategory === 'all' ? theme.secondaryContainer : theme.surfaceContainer,
                borderColor: selectedCategory === 'all' ? theme.primary : 'transparent',
              },
            ]}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.text }}>All Categories</Text>
          </Pressable>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <Pressable
              key={key}
              onPress={() => setSelectedCategory(key)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by category ${cat.label}`}
              accessibilityState={{ selected: selectedCategory === key }}
              style={[
                styles.catChip,
                {
                  backgroundColor: selectedCategory === key ? theme.secondaryContainer : theme.surfaceContainer,
                  borderColor: selectedCategory === key ? theme.primary : 'transparent',
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.text }}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Transactions List */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filtered.length > 0 ? (
          filtered.map((tx) => {
            const isIncome = tx.direction === 'inflow';
            const isOutflow = tx.direction === 'outflow';

            return (
              <Pressable key={tx.id} onPress={() => handleOpenEdit(tx)}>
                <M3Card variant="elevated" style={styles.card}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardLeft}>
                      <View
                        style={[
                          styles.iconBubble,
                          {
                            backgroundColor: isIncome
                              ? theme.inflowContainer
                              : isOutflow
                              ? theme.outflowContainer
                              : theme.neutralContainer,
                          },
                        ]}
                      >
                        <Ionicons
                          name={isIncome ? 'arrow-down' : isOutflow ? 'arrow-up' : 'swap-horizontal'}
                          size={16}
                          color={isIncome ? theme.inflow : isOutflow ? theme.outflow : theme.neutral}
                        />
                      </View>
                      <View style={styles.descCol}>
                        <Text style={[styles.descText, { color: theme.text }]} numberOfLines={1}>
                          {tx.description}
                        </Text>
                        <Text style={[styles.metaText, { color: theme.tabIconDefault }]}>
                          {tx.transactionDate} &bull; {CATEGORIES[tx.category]?.label || tx.category}
                        </Text>
                        {tx.originalReference && (
                          <Text style={[styles.refText, { color: theme.tabIconDefault }]}>
                            Ref: {tx.originalReference}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.cardRight}>
                      <Text
                        style={[
                          styles.amountText,
                          {
                            color: isIncome ? theme.inflow : isOutflow ? theme.outflow : theme.neutral,
                          },
                        ]}
                      >
                        {isIncome ? '+' : isOutflow ? '-' : ''}
                        {formatMoney(tx.amount, tx.currency)}
                      </Text>
                      {tx.reviewStatus === 'pending_review' && (
                        <M3Badge label="Review" variant="review" style={{ marginTop: 4 }} />
                      )}
                    </View>
                  </View>
                </M3Card>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyBox}>
            <Ionicons name="receipt-outline" size={40} color={theme.tabIconDefault} />
            <Text style={[styles.emptyText, { color: theme.tabIconDefault }]}>
              No transactions match your search or filter.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Transaction Modal */}
      <Modal visible={selectedTx !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Transaction</Text>
              <Pressable
                onPress={() => setSelectedTx(null)}
                accessibilityRole="button"
                accessibilityLabel="Close category editor"
                hitSlop={12}
              >
                <Ionicons name="close" size={22} color={theme.tabIconDefault} />
              </Pressable>
            </View>

            {selectedTx && (
              <View style={styles.modalBody}>
                <View style={[styles.detailsBox, { backgroundColor: theme.surfaceContainer }]}>
                  <Text style={[styles.detailsDesc, { color: theme.text }]}>{selectedTx.description}</Text>
                  <Text style={[styles.detailsAmount, { color: theme.primary }]}>
                    {formatMoney(selectedTx.amount, selectedTx.currency)} &bull; {selectedTx.transactionDate}
                  </Text>
                </View>

                <Text style={[styles.sectionLabel, { color: theme.text }]}>Assign Category:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalCatRow}>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <Pressable
                      key={key}
                      onPress={() => setEditCategory(key)}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: editCategory === key ? theme.primary : theme.surfaceContainer,
                          borderColor: editCategory === key ? theme.primary : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '600',
                          color: editCategory === key ? '#FFFFFF' : theme.text,
                        }}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <M3Input
                  label="Notes"
                  placeholder="Additional merchant notes..."
                  value={editNotes}
                  onChangeText={setEditNotes}
                />

                <View style={styles.modalFooter}>
                  <M3Button
                    label="Delete"
                    variant="text"
                    onPress={() => handleDelete(selectedTx.id)}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <M3Button
                    label="Save"
                    variant="filled"
                    onPress={handleSaveEdit}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing.gutter,
    paddingTop: 12,
  },
  filterSection: {
    paddingHorizontal: DesignTokens.spacing.gutter,
    marginBottom: 8,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  catCarousel: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    height: 30,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: DesignTokens.spacing.gutter,
    paddingBottom: 30,
  },
  card: {
    marginVertical: 4,
    padding: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  descCol: {
    flex: 1,
  },
  descText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 10,
    marginTop: 2,
  },
  refText: {
    fontSize: 9,
    fontFamily: 'System',
    marginTop: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 12,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: DesignTokens.shapes.sheet,
    borderTopRightRadius: DesignTokens.shapes.sheet,
    padding: DesignTokens.spacing.gutter,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    gap: 10,
  },
  detailsBox: {
    padding: 12,
    borderRadius: DesignTokens.shapes.medium,
  },
  detailsDesc: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsAmount: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  modalCatRow: {
    flexDirection: 'row',
    maxHeight: 36,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 14,
  },
});
