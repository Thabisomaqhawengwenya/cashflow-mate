import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  BusinessProfile,
  MobileStorageService,
  formatMoney,
  CATEGORIES,
} from '@/services/storage';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';

const SAMPLE_TEMPLATES = [
  {
    id: 'ecocash',
    name: 'EcoCash Merchant CSV',
    description: 'Typical weekly EcoCash customer payments and IMTT levies',
    rows: [
      {
        transactionDate: '2026-10-25',
        description: 'EcoCash Merchant: Cooking oil & sugar payment',
        amount: 22.00,
        direction: 'inflow' as const,
        type: 'business_income' as const,
        category: 'sales_goods',
        originalReference: 'MP261025.101',
      },
      {
        transactionDate: '2026-10-25',
        description: 'EcoCash IMTT & Cashout Fee Deduction',
        amount: 2.10,
        direction: 'outflow' as const,
        type: 'business_expense' as const,
        category: 'mobile_money_fees',
        originalReference: 'EC-TXF-1025',
      },
      {
        transactionDate: '2026-10-26',
        description: 'Bakers Inn Bread 30 Crates Restocking',
        amount: 33.00,
        direction: 'outflow' as const,
        type: 'business_expense' as const,
        category: 'stock_purchase',
        originalReference: 'BP261026.044',
      },
    ],
  },
  {
    id: 'innbucks',
    name: 'InnBucks USD Statement',
    description: 'Fast food & grocery customer transfers via InnBucks',
    rows: [
      {
        transactionDate: '2026-10-25',
        description: 'InnBucks: Chicken cuts & cold drinks',
        amount: 38.50,
        direction: 'inflow' as const,
        type: 'business_income' as const,
        category: 'sales_goods',
        originalReference: 'IB-902199',
      },
      {
        transactionDate: '2026-10-26',
        description: 'Kombi Haulage from Mbare Musika',
        amount: 8.00,
        direction: 'outflow' as const,
        type: 'business_expense' as const,
        category: 'transport_fuel',
        originalReference: 'TR-1026-09',
      },
    ],
  },
];

export default function ImportScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [selectedTemplate, setSelectedTemplate] = useState<string>('ecocash');
  const [isImporting, setIsImporting] = useState(false);
  const [successReport, setSuccessReport] = useState<{ count: number } | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  const currency = business?.currency || 'USD';
  const activeTemplate = SAMPLE_TEMPLATES.find((t) => t.id === selectedTemplate) || SAMPLE_TEMPLATES[0];

  useEffect(() => {
    MobileStorageService.getBusiness().then(setBusiness);
  }, []);

  const fingerprint = (row: {
    originalReference?: string;
    transactionDate: string;
    amount: number;
    description: string;
  }) =>
    row.originalReference ||
    `${row.transactionDate}|${row.amount.toFixed(2)}|${row.description}`;

  const handleCommitImport = async () => {
    setIsImporting(true);
    try {
      const existing = await MobileStorageService.getTransactions();
      const existingRefs = new Set(existing.map((t) => fingerprint(t)));

      let importedCount = 0;
      for (const row of activeTemplate.rows) {
        // Duplicate candidates: reference, or date+amount+description fingerprint
        if (existingRefs.has(fingerprint(row))) {
          continue;
        }

        await MobileStorageService.saveTransaction({
          transactionDate: row.transactionDate,
          description: row.description,
          amount: row.amount,
          currency,
          direction: row.direction,
          type: row.type,
          category: row.category,
          originalReference: row.originalReference,
          reviewStatus: 'confirmed',
        });
        existingRefs.add(fingerprint(row));
        importedCount++;
      }

      setSuccessReport({ count: importedCount });
    } catch (err: any) {
      Alert.alert('Import Failed', err.message || 'Could not import records');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Import Statements</Text>
        <Text style={[styles.subhead, { color: theme.tabIconDefault }]}>
          Import EcoCash, InnBucks, or cash register records with automatic categorization.
        </Text>
        <Text style={[styles.demoNote, { color: theme.review }]}>
          Demo statement importer: these are realistic sample payloads. A native file picker +
          CSV parser is the next planned feature.
        </Text>
      </View>

      {/* Template Selectors */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Statement Source:</Text>
      <View style={styles.templateRow}>
        {SAMPLE_TEMPLATES.map((tmpl) => {
          const isSelected = selectedTemplate === tmpl.id;
          return (
            <Pressable
              key={tmpl.id}
              onPress={() => {
                setSelectedTemplate(tmpl.id);
                setSuccessReport(null);
              }}
              style={[
                styles.templateCard,
                {
                  backgroundColor: isSelected ? theme.primaryContainer : theme.surface,
                  borderColor: isSelected ? theme.primary : theme.outlineVariant,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={20}
                color={isSelected ? theme.onPrimaryContainer : theme.tabIconDefault}
              />
              <Text
                style={[
                  styles.templateName,
                  { color: isSelected ? theme.onPrimaryContainer : theme.text },
                ]}
              >
                {tmpl.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Staged Rows Preview */}
      <M3Card variant="elevated" style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <Text style={[styles.previewTitle, { color: theme.text }]}>Staged Rows for Import</Text>
          <M3Badge label={`${activeTemplate.rows.length} Rows Ready`} variant="primary" />
        </View>
        <Text style={[styles.previewDesc, { color: theme.tabIconDefault }]}>
          {activeTemplate.description}
        </Text>

        <View style={styles.rowsList}>
          {activeTemplate.rows.map((row, idx) => (
            <View key={idx} style={[styles.previewRow, { borderBottomColor: theme.outlineVariant }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowDesc, { color: theme.text }]}>{row.description}</Text>
                <Text style={[styles.rowMeta, { color: theme.tabIconDefault }]}>
                  {row.transactionDate} &bull; {CATEGORIES[row.category]?.label || row.category}
                </Text>
              </View>
              <Text
                style={[
                  styles.rowAmount,
                  { color: row.direction === 'inflow' ? theme.inflow : theme.outflow },
                ]}
              >
                {row.direction === 'inflow' ? '+' : '-'}
                {formatMoney(row.amount, currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <M3Button
            label="Commit Import"
            variant="filled"
            onPress={handleCommitImport}
            isLoading={isImporting}
            icon={<Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />}
            style={{ width: '100%' }}
          />
        </View>
      </M3Card>

      {/* Success Banner */}
      {successReport && (
        <M3Card variant="elevated" style={[styles.successCard, { borderColor: theme.inflow }]}>
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={24} color={theme.inflow} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.successTitle, { color: theme.text }]}>Import Completed!</Text>
              <Text style={[styles.successBody, { color: theme.tabIconDefault }]}>
                {successReport.count} transaction(s) were successfully added and categorized into your records. Duplicates were automatically safely ignored.
              </Text>
            </View>
          </View>
        </M3Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: DesignTokens.spacing.gutter,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subhead: {
    fontSize: 12,
    marginTop: 2,
  },
  demoNote: {
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  templateRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  templateCard: {
    flex: 1,
    padding: 12,
    borderRadius: DesignTokens.shapes.card,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  templateName: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewCard: {
    padding: DesignTokens.spacing.cardPadding,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  previewDesc: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 12,
  },
  rowsList: {
    marginVertical: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowDesc: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  actionRow: {
    marginTop: 16,
  },
  successCard: {
    marginTop: 14,
    borderWidth: 1.5,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  successBody: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
});
