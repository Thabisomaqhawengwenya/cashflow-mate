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
import {
  MobileStorageService,
  MobileDebt,
  formatMoney,
  roundMoney,
} from '@/services/storage';
import { MobileOperationsService, TraderContact } from '@/services/operations';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { M3Badge } from '@/components/M3/M3Badge';
import { useAppearance } from '@/context/AppearanceContext';

export default function ContactsScreen() {
  const { palette, cardRadius, chipRadius } = useAppearance();
  const [contacts, setContacts] = useState<TraderContact[]>([]);
  const [debts, setDebts] = useState<MobileDebt[]>([]);
  const [filter, setFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add Contact Form
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer' | 'supplier'>('customer');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Harare, Zimbabwe');
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    const [cnts, dbs] = await Promise.all([
      MobileOperationsService.getContacts(),
      MobileStorageService.getDebts(),
    ]);
    setContacts(cnts);
    setDebts(dbs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const visibleContacts = contacts.filter((c) => {
    if (filter === 'all') return true;
    return c.role === filter;
  });

  const customerCount = contacts.filter((c) => c.role === 'customer').length;
  const supplierCount = contacts.filter((c) => c.role === 'supplier').length;
  const totalVolume = roundMoney(contacts.reduce((s, c) => s + c.totalVolumeUsd, 0));

  const getOutstandingForContact = (personName: string) => {
    const lower = personName.toLowerCase();
    return roundMoney(
      debts
        .filter(
          (d) =>
            d.status !== 'settled' &&
            (d.personName.toLowerCase().includes(lower) ||
              lower.includes(d.personName.toLowerCase()))
        )
        .reduce((sum, d) => sum + Math.max(0, d.totalAmount - d.paidAmount), 0)
    );
  };

  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing Details', 'Please enter the contact name and phone number.');
      return;
    }
    await MobileOperationsService.addContact({
      name,
      role,
      phone,
      location,
      preferredCurrency: 'USD',
      notes,
      totalVolumeUsd: 0,
    });
    setName('');
    setPhone('');
    setNotes('');
    setIsModalOpen(false);
    await loadData();
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
            <Text style={styles.headerTitle}>Customers & Suppliers</Text>
            <Text style={[styles.headerSub, { color: palette.accent }]}>
              REPEAT BUYERS • WHOLESALE DEPOTS
            </Text>
          </View>
          <Pressable
            onPress={() => setIsModalOpen(true)}
            style={[styles.addBtn, { backgroundColor: palette.primary, borderRadius: chipRadius }]}
            accessibilityRole="button"
            accessibilityLabel="Add new contact"
          >
            <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Add Contact</Text>
          </Pressable>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{String(customerCount).padStart(2, '0')}</Text>
            <Text style={styles.kpiLabel}>Customers</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiValue}>{String(supplierCount).padStart(2, '0')}</Text>
            <Text style={styles.kpiLabel}>Suppliers</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={[styles.kpiValue, { color: '#34D399' }]}>
              {formatMoney(totalVolume, 'USD')}
            </Text>
            <Text style={styles.kpiLabel}>Trade Volume</Text>
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
          <View style={styles.filterRow}>
            {[
              { id: 'all', label: `All Directory (${contacts.length})` },
              { id: 'customer', label: `Customers (${customerCount})` },
              { id: 'supplier', label: `Suppliers (${supplierCount})` },
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

          {visibleContacts.map((contact) => {
            const outstanding = getOutstandingForContact(contact.name);
            return (
              <View key={contact.id} style={[styles.card, { borderRadius: cardRadius }]}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatarRow}>
                    <View
                      style={[
                        styles.avatarBox,
                        {
                          backgroundColor:
                            contact.role === 'supplier' ? '#E0F2FE' : '#DCFCE7',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          contact.role === 'supplier' ? 'business-outline' : 'person-outline'
                        }
                        size={20}
                        color={contact.role === 'supplier' ? '#0369A1' : '#065F46'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactMeta}>
                        {contact.phone} • {contact.location}
                      </Text>
                    </View>
                  </View>
                  <M3Badge
                    label={contact.role === 'supplier' ? 'SUPPLIER' : 'CUSTOMER'}
                    variant={contact.role === 'supplier' ? 'primary' : 'mint'}
                  />
                </View>

                {contact.notes ? <Text style={styles.notesText}>{contact.notes}</Text> : null}

                <View style={styles.statsBar}>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>LIFETIME VOLUME</Text>
                    <Text style={styles.statVal}>
                      {formatMoney(contact.totalVolumeUsd, 'USD')}
                    </Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={styles.statLabel}>OPEN CREDIT / BALANCE</Text>
                    <Text
                      style={[
                        styles.statVal,
                        { color: outstanding > 0 ? '#D97706' : '#059669' },
                      ]}
                    >
                      {outstanding > 0 ? formatMoney(outstanding, 'USD') : 'Settled ($0.00)'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => router.push('/invoices' as any)}
                    style={[
                      styles.actionBtn,
                      { backgroundColor: palette.primary, borderRadius: chipRadius },
                    ]}
                  >
                    <Ionicons name="document-text-outline" size={15} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>New Quote</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/(tabs)/debts' as any)}
                    style={[styles.secondaryBtn, { borderRadius: chipRadius }]}
                  >
                    <Ionicons name="book-outline" size={15} color={EmeraldTokens.deepPine} />
                    <Text style={styles.secondaryBtnText}>Credit Book</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add Contact Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer or Supplier</Text>
              <Pressable onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close-circle" size={26} color={EmeraldTokens.textMuted} />
              </Pressable>
            </View>

            <View style={styles.roleSwitch}>
              {(['customer', 'supplier'] as const).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRole(r)}
                  style={[
                    styles.roleChip,
                    { borderRadius: chipRadius },
                    role === r && { backgroundColor: palette.headerBg },
                  ]}
                >
                  <Text style={[styles.roleChipText, role === r && { color: '#FFFFFF' }]}>
                    {r === 'customer' ? 'Customer (Buyer)' : 'Supplier (Wholesaler)'}
                  </Text>
                </Pressable>
              ))}
            </View>

            <M3Input
              label="Full Name or Company Name"
              placeholder="e.g. Delta Beverages Depot"
              value={name}
              onChangeText={setName}
            />
            <M3Input
              label="Phone / WhatsApp Number"
              placeholder="e.g. +263 77 200 1100"
              value={phone}
              onChangeText={setPhone}
            />
            <M3Input
              label="Market / Location"
              placeholder="e.g. Mbare Musika, Harare"
              value={location}
              onChangeText={setLocation}
            />
            <M3Input
              label="Delivery or Credit Notes"
              placeholder="e.g. Delivers every Tuesday & Friday"
              value={notes}
              onChangeText={setNotes}
            />

            <M3Button
              label="SAVE TO DIRECTORY"
              variant="mint"
              size="lg"
              onPress={handleAddContact}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
  },
  contactMeta: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },
  notesText: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginBottom: 12,
    lineHeight: 17,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  statCell: {
    flex: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: EmeraldTokens.textSubtle,
    letterSpacing: 0.5,
  },
  statVal: {
    fontSize: 13,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    paddingVertical: 10,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
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
  roleSwitch: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  roleChip: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
  },
});
