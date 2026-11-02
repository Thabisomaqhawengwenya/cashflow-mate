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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { CurrencyCode, formatMoney, roundMoney } from '@/services/storage';
import { MobileOperationsService, InventoryItem } from '@/services/operations';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { M3Badge } from '@/components/M3/M3Badge';
import { useAppearance } from '@/context/AppearanceContext';

export default function InventoryScreen() {
  const { palette, cardRadius, chipRadius } = useAppearance();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'low_stock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Item Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [supplierName, setSupplierName] = useState('');
  const [quantity, setQuantity] = useState('10');
  const [minStockLevel, setMinStockLevel] = useState('5');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    const data = await MobileOperationsService.getInventory();
    setItems(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInventory();
    }, [loadInventory])
  );

  const lowStockItems = items.filter((i) => i.quantity <= i.minStockLevel);
  const visibleItems = filter === 'low_stock' ? lowStockItems : items;

  const totalRetailValueUsd = roundMoney(
    items
      .filter((i) => i.currency === 'USD')
      .reduce((sum, i) => sum + i.quantity * i.sellingPrice, 0)
  );
  const totalExpectedMarginUsd = roundMoney(
    items
      .filter((i) => i.currency === 'USD')
      .reduce((sum, i) => sum + i.quantity * Math.max(0, i.sellingPrice - i.unitCost), 0)
  );

  const handleQuickSale = async (item: InventoryItem) => {
    if (item.quantity <= 0) {
      Alert.alert('Out of Stock', `${item.name} has 0 units left. Tap Restock first.`);
      return;
    }
    const res = await MobileOperationsService.recordQuickStockSale(item.id, 1);
    if (res) {
      await loadInventory();
      setStatusBanner(
        `Sold 1x ${item.name} (+${formatMoney(item.sellingPrice, item.currency)} added to Till)`
      );
      setTimeout(() => setStatusBanner(null), 3500);
    }
  };

  const handleQuickRestock = async (item: InventoryItem) => {
    const res = await MobileOperationsService.restockItem(item.id, 5, true);
    if (res) {
      await loadInventory();
      setStatusBanner(`Restocked +5x ${item.name} (Stock now ${res.item.quantity} units)`);
      setTimeout(() => setStatusBanner(null), 3500);
    }
  };

  const handleAddItem = async () => {
    if (!name.trim() || !sellingPrice.trim()) {
      Alert.alert('Missing Details', 'Please enter both the product name and selling price.');
      return;
    }
    await MobileOperationsService.addInventoryItem({
      name: name.trim(),
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      category: category.trim() || 'General',
      supplierName: supplierName.trim() || 'Local Wholesaler',
      quantity: Number(quantity) || 0,
      minStockLevel: Number(minStockLevel) || 5,
      unitCost: Number(unitCost) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      currency,
    });
    setName('');
    setSupplierName('');
    setUnitCost('');
    setSellingPrice('');
    setIsAddModalOpen(false);
    await loadInventory();
    setStatusBanner(`Added ${name.trim()} to shelf inventory`);
    setTimeout(() => setStatusBanner(null), 3500);
  };

  const handleDelete = async (id: string) => {
    await MobileOperationsService.deleteInventoryItem(id);
    await loadInventory();
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
            <Text style={styles.headerTitle}>Stock & Shelf Inventory</Text>
            <Text style={[styles.headerSub, { color: palette.accent }]}>
              LIVE STOCK • ONE-TAP TILL DEDUCTION
            </Text>
          </View>
          <Pressable
            onPress={() => setIsAddModalOpen(true)}
            style={[styles.addBtn, { backgroundColor: palette.primary, borderRadius: chipRadius }]}
            accessibilityRole="button"
            accessibilityLabel="Add new stock item"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>New Item</Text>
          </Pressable>
        </View>

        {/* KPI Bar */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{formatMoney(totalRetailValueUsd, 'USD')}</Text>
            <Text style={styles.kpiLabel}>Shelf Value</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiValue, { color: '#34D399' }]}>
              +{formatMoney(totalExpectedMarginUsd, 'USD')}
            </Text>
            <Text style={styles.kpiLabel}>Est. Profit</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text
              style={[
                styles.kpiValue,
                { color: lowStockItems.length > 0 ? '#FBBF24' : '#FFFFFF' },
              ]}
            >
              {String(lowStockItems.length).padStart(2, '0')}
            </Text>
            <Text style={styles.kpiLabel}>Low Alerts</Text>
          </View>
        </View>
      </View>

      {/* 2. Sheet Content */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          {statusBanner ? (
            <View style={[styles.toastBanner, { borderRadius: cardRadius }]}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.toastText}>{statusBanner}</Text>
            </View>
          ) : null}

          {/* Filter Row */}
          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setFilter('all')}
              style={[
                styles.filterChip,
                { borderRadius: chipRadius },
                filter === 'all' && { backgroundColor: palette.headerBg },
              ]}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All Products ({items.length})
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setFilter('low_stock')}
              style={[
                styles.filterChip,
                { borderRadius: chipRadius },
                filter === 'low_stock' && { backgroundColor: '#B45309' },
              ]}
            >
              <Text
                style={[styles.filterText, filter === 'low_stock' && styles.filterTextActive]}
              >
                Low Stock Alert ({lowStockItems.length})
              </Text>
            </Pressable>
          </View>

          {/* Inventory List */}
          {visibleItems.map((item) => {
            const isLow = item.quantity <= item.minStockLevel;
            const unitMargin = roundMoney(item.sellingPrice - item.unitCost);

            return (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  { borderRadius: cardRadius },
                  isLow && styles.itemCardLow,
                ]}
              >
                <View style={styles.itemTopRow}>
                  <View style={styles.itemTitleBlock}>
                    <View style={styles.categoryBadgeRow}>
                      <Text style={styles.skuText}>{item.sku}</Text>
                      <Text style={styles.dotSep}>•</Text>
                      <Text style={styles.supplierText}>{item.supplierName}</Text>
                    </View>
                    <Text style={styles.itemName}>{item.name}</Text>
                  </View>

                  <M3Badge
                    label={isLow ? `LOW: ${item.quantity} LEFT` : `${item.quantity} IN STOCK`}
                    variant={isLow ? 'amber' : 'mint'}
                  />
                </View>

                <View style={styles.priceGrid}>
                  <View style={styles.priceCell}>
                    <Text style={styles.priceCellLabel}>BUY COST</Text>
                    <Text style={styles.priceCellVal}>
                      {formatMoney(item.unitCost, item.currency)}
                    </Text>
                  </View>
                  <View style={styles.priceCell}>
                    <Text style={styles.priceCellLabel}>SELL PRICE</Text>
                    <Text style={[styles.priceCellVal, { color: palette.primary }]}>
                      {formatMoney(item.sellingPrice, item.currency)}
                    </Text>
                  </View>
                  <View style={styles.priceCell}>
                    <Text style={styles.priceCellLabel}>UNIT PROFIT</Text>
                    <Text style={[styles.priceCellVal, { color: '#059669' }]}>
                      +{formatMoney(unitMargin, item.currency)}
                    </Text>
                  </View>
                </View>

                {/* Action Row: One-Tap Sell & Restock */}
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => handleQuickSale(item)}
                    style={[
                      styles.sellBtn,
                      { backgroundColor: palette.primary, borderRadius: chipRadius },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Record 1 sale of ${item.name}`}
                  >
                    <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.sellBtnText}>
                      Sell 1 (+{formatMoney(item.sellingPrice, item.currency)})
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleQuickRestock(item)}
                    style={[styles.restockBtn, { borderRadius: chipRadius }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Restock 5 units of ${item.name}`}
                  >
                    <Ionicons name="add-circle-outline" size={16} color={EmeraldTokens.deepPine} />
                    <Text style={styles.restockBtnText}>+5 Restock</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    style={styles.deleteIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${item.name}`}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Item Modal */}
      <Modal visible={isAddModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { borderTopLeftRadius: 28, borderTopRightRadius: 28 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Shelf Stock Item</Text>
              <Pressable onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close-circle" size={26} color={EmeraldTokens.textMuted} />
              </Pressable>
            </View>

            <M3Input
              label="Product Name"
              placeholder="e.g. Mahatma Rice (2kg)"
              value={name}
              onChangeText={setName}
            />
            <M3Input
              label="Supplier / Wholesaler"
              placeholder="e.g. National Foods"
              value={supplierName}
              onChangeText={setSupplierName}
            />

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <M3Input
                  label="Current Stock Qty"
                  placeholder="12"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <M3Input
                  label="Low Alert Threshold"
                  placeholder="5"
                  value={minStockLevel}
                  onChangeText={setMinStockLevel}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.twoColRow}>
              <View style={{ flex: 1 }}>
                <M3Input
                  label="Unit Buy Cost ($)"
                  placeholder="1.80"
                  value={unitCost}
                  onChangeText={setUnitCost}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <M3Input
                  label="Selling Price ($)"
                  placeholder="2.50"
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <M3Button
              label="SAVE PRODUCT TO SHELF"
              variant="mint"
              size="lg"
              onPress={handleAddItem}
              style={{ marginTop: 12 }}
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
    gap: 4,
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
  itemCard: {
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
  itemCardLow: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  itemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemTitleBlock: {
    flex: 1,
    marginRight: 10,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    gap: 5,
  },
  skuText: {
    fontSize: 10,
    fontWeight: '700',
    color: EmeraldTokens.textSubtle,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  dotSep: {
    fontSize: 10,
    color: EmeraldTokens.textSubtle,
  },
  supplierText: {
    fontSize: 11,
    fontWeight: '600',
    color: EmeraldTokens.textMuted,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  priceGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    justifyContent: 'space-between',
  },
  priceCell: {
    flex: 1,
  },
  priceCellLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: EmeraldTokens.textSubtle,
    letterSpacing: 0.5,
  },
  priceCellVal: {
    fontSize: 14,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  sellBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  restockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  restockBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
  },
  deleteIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 21, 46, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
