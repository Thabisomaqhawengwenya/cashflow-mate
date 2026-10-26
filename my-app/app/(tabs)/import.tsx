import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  BusinessProfile,
  MobileStorageService,
  MobileTransaction,
  formatMoney,
  CATEGORIES,
} from '@/services/storage';
import {
  processCsvData,
  convertCsvRowsToTransactions,
  CsvImportResult,
} from '@/services/csvImporter';
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';

const SAMPLE_CSV_PRESETS = [
  {
    id: 'ecocash',
    name: 'EcoCash Merchant CSV',
    description: 'Weekly customer till payments and IMTT tax levies',
    csv: `Date,Description,Amount,Reference,Currency
2026-10-25,"EcoCash Merchant: Cooking oil & sugar payment",22.00,MP261025.101,USD
2026-10-25,"EcoCash IMTT & Cashout Fee Deduction",-2.10,EC-TXF-1025,USD
2026-10-26,"Bakers Inn Bread 30 Crates Restocking",-33.00,BP261026.044,USD
2026-10-26,"EcoCash Customer: Soap & Washing Powder",15.50,MP261026.210,USD
2026-10-27,"ZETDC Electricity 50kWh Token Restock",-12.00,ZETDC-99120,USD`,
  },
  {
    id: 'innbucks',
    name: 'InnBucks Statement',
    description: 'Fast food & counter customer transfers via InnBucks',
    csv: `Date,Description,Amount,Reference,Currency
2026-10-25,"InnBucks: Chicken cuts & cold drinks",38.50,IB-902199,USD
2026-10-26,"Kombi Haulage from Mbare Musika",-8.00,TR-1026-09,USD
2026-10-27,"InnBucks: Rice 5kg and Cooking Oil",19.00,IB-902245,USD
2026-10-27,"Harare City Council Stall Levy",-5.00,HCC-44012,USD`,
  },
  {
    id: 'cabs_bank',
    name: 'Bank / Till CSV',
    description: 'Commercial bank export or POS batch settlement',
    csv: `Posting Date,Details,Debit,Credit,Currency
2026-10-25,"POS Settlement: Saturday Afternoon Sales",,145.00,USD
2026-10-25,"National Foods: Mealie Meal Wholesale Restock",95.00,,USD
2026-10-26,"Monthly Maintenance & Ledger Fee",3.50,,USD
2026-10-27,"Counter Sales: Fresh Tomatoes & Veg",,42.00,USD`,
  },
];

export default function ImportScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const router = useRouter();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [existingTransactions, setExistingTransactions] = useState<MobileTransaction[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Import State
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [successReport, setSuccessReport] = useState<{ count: number } | null>(null);

  const currency = business?.currency || 'USD';

  // Always refresh latest transactions and business profile on focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        MobileStorageService.getBusiness(),
        MobileStorageService.getTransactions(),
      ]).then(([biz, txs]) => {
        if (!active) return;
        setBusiness(biz);
        setExistingTransactions(txs);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  // Handle picking real CSV file from device or browser
  const handlePickDocument = async () => {
    try {
      setIsReadingFile(true);
      setSuccessReport(null);
      setActivePresetId(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/comma-separated-values', 'text/csv', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsReadingFile(false);
        return;
      }

      const asset = result.assets[0];
      const fileName = asset.name || 'statement.csv';

      let text = '';
      if (Platform.OS === 'web' && (asset as any).file) {
        text = await (asset as any).file.text();
      } else {
        const response = await fetch(asset.uri);
        text = await response.text();
      }

      if (!text || text.trim().length === 0) {
        Alert.alert('Empty File', 'The selected file contains no readable text.');
        setIsReadingFile(false);
        return;
      }

      const parsed = processCsvData(text, existingTransactions, currency, fileName);
      setImportResult(parsed);
    } catch (err: any) {
      Alert.alert('File Read Error', err.message || 'Could not read the selected CSV file.');
    } finally {
      setIsReadingFile(false);
    }
  };

  // Load one of the preset sample statements
  const handleSelectPreset = (preset: (typeof SAMPLE_CSV_PRESETS)[0]) => {
    setActivePresetId(preset.id);
    setSuccessReport(null);
    const parsed = processCsvData(preset.csv, existingTransactions, currency, preset.name);
    setImportResult(parsed);
  };

  // Commit parsed rows into storage
  const handleCommitImport = async () => {
    if (!importResult || importResult.rows.length === 0) return;

    setIsCommitting(true);
    try {
      const candidates = convertCsvRowsToTransactions(importResult.rows, skipDuplicates);

      if (candidates.length === 0) {
        Alert.alert('No Records', 'All records in this statement are duplicates and were skipped.');
        setIsCommitting(false);
        return;
      }

      let count = 0;
      for (const row of candidates) {
        await MobileStorageService.saveTransaction(row);
        count++;
      }

      // Refresh existing transactions
      const refreshed = await MobileStorageService.getTransactions();
      setExistingTransactions(refreshed);

      setSuccessReport({ count });
      setImportResult(null);
      setActivePresetId(null);
    } catch (err: any) {
      Alert.alert('Import Failed', err.message || 'Could not import records into storage.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Import Statements</Text>
        <Text style={[styles.subhead, { color: theme.tabIconDefault }]}>
          Upload bank, EcoCash, or InnBucks CSV statements. Automatically categorizes transactions and detects duplicates.
        </Text>
      </View>

      {/* Success Banner */}
      {successReport && (
        <M3Card style={[styles.successBanner, { backgroundColor: theme.primaryContainer }]}>
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={28} color={theme.primary} />
            <View style={styles.successTextCol}>
              <Text style={[styles.successTitle, { color: theme.onPrimaryContainer }]}>
                Import Succeeded!
              </Text>
              <Text style={[styles.successSub, { color: theme.onPrimaryContainer }]}>
                {successReport.count} transaction{successReport.count === 1 ? '' : 's'} added to your till.
              </Text>
            </View>
          </View>
          <View style={{ marginTop: 12 }}>
            <M3Button
              label="View in Transactions"
              variant="filled"
              size="sm"
              onPress={() => router.push('/(tabs)/transactions')}
            />
          </View>
        </M3Card>
      )}

      {/* Main File Upload Action Card */}
      <M3Card style={styles.uploadCard}>
        <View style={styles.uploadCardInner}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: theme.primaryContainer },
            ]}
          >
            <Ionicons name="cloud-upload" size={32} color={theme.primary} />
          </View>
          <Text style={[styles.uploadHeading, { color: theme.text }]}>
            Upload Statement File
          </Text>
          <Text style={[styles.uploadDescription, { color: theme.tabIconDefault }]}>
            Select a .csv or .txt statement file from your phone storage or computer.
          </Text>

          <M3Button
            label={isReadingFile ? 'Reading File...' : 'Choose CSV File'}
            icon={<Ionicons name="document-attach-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
            variant="filled"
            size="lg"
            disabled={isReadingFile}
            style={styles.pickButton}
            onPress={handlePickDocument}
          />

          {isReadingFile && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 12 }} />
          )}
        </View>
      </M3Card>

      {/* Presets Row */}
      <View style={styles.presetsSection}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Or Try a Sample Statement:</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.tabIconDefault }]}>
          Test with realistic Zimbabwean mobile money & retail statements.
        </Text>

        <View style={styles.presetsRow}>
          {SAMPLE_CSV_PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => handleSelectPreset(p)}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isSelected ? theme.primaryContainer : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.outlineVariant,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Select sample statement: ${p.name}`}
              >
                <Ionicons
                  name="receipt-outline"
                  size={18}
                  color={isSelected ? theme.onPrimaryContainer : theme.tabIconDefault}
                />
                <Text
                  style={[
                    styles.presetName,
                    { color: isSelected ? theme.onPrimaryContainer : theme.text },
                  ]}
                >
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Interactive Staged Mapping & Duplicate Preview */}
      {importResult && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={[styles.previewTitle, { color: theme.text }]}>
                Statement Preview
              </Text>
              <Text style={[styles.previewMeta, { color: theme.tabIconDefault }]}>
                {importResult.fileName} • {importResult.validRows} valid rows found
              </Text>
            </View>

            {importResult.duplicateCount > 0 && (
              <M3Badge
                label={`${importResult.duplicateCount} duplicate${importResult.duplicateCount === 1 ? '' : 's'}`}
                variant="review"
              />
            )}
          </View>

          {/* Stats Summary Pill Bar */}
          <M3Card style={styles.statsCard}>
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: theme.text }]}>{importResult.totalRows}</Text>
              <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Total Rows</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.outlineVariant }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: theme.inflow }]}>
                {importResult.newRows}
              </Text>
              <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>New</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.outlineVariant }]} />
            <View style={styles.statCol}>
              <Text
                style={[
                  styles.statNum,
                  { color: importResult.duplicateCount > 0 ? theme.review : theme.tabIconDefault },
                ]}
              >
                {importResult.duplicateCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.tabIconDefault }]}>Duplicates</Text>
            </View>
          </M3Card>

          {/* Duplicate Filter Toggle */}
          {importResult.duplicateCount > 0 && (
            <Pressable
              onPress={() => setSkipDuplicates(!skipDuplicates)}
              style={styles.toggleRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: skipDuplicates }}
              accessibilityLabel="Skip detected duplicates toggle"
            >
              <Ionicons
                name={skipDuplicates ? 'checkbox' : 'square-outline'}
                size={22}
                color={skipDuplicates ? theme.primary : theme.tabIconDefault}
              />
              <Text style={[styles.toggleText, { color: theme.text }]}>
                Skip {importResult.duplicateCount} detected duplicate transaction{importResult.duplicateCount === 1 ? '' : 's'} (recommended)
              </Text>
            </Pressable>
          )}

          {/* Parsed Rows List */}
          <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 16 }]}>
            Mapped Records:
          </Text>

          {importResult.rows.map((row, idx) => {
            const isDup = row.isDuplicate;
            const willImport = !(isDup && skipDuplicates);
            const catInfo = CATEGORIES[row.category] || CATEGORIES.uncategorized;

            return (
              <M3Card
                key={`${row.fingerprint}_${idx}`}
                style={[
                  styles.rowCard,
                  {
                    opacity: willImport ? 1 : 0.45,
                    borderLeftColor: row.direction === 'inflow' ? theme.inflow : theme.outflow,
                    borderLeftWidth: 4,
                  },
                ]}
              >
                <View style={styles.rowTop}>
                  <View style={styles.rowDateCol}>
                    <Text style={[styles.rowDate, { color: theme.tabIconDefault }]}>
                      {row.date}
                    </Text>
                    {isDup ? (
                      <M3Badge label="Duplicate" variant="review" />
                    ) : (
                      <M3Badge label={catInfo.label} variant="neutral" />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.rowAmount,
                      { color: row.direction === 'inflow' ? theme.inflow : theme.outflow },
                    ]}
                  >
                    {row.direction === 'inflow' ? '+' : '-'}
                    {formatMoney(row.amount, row.currency)}
                  </Text>
                </View>

                <Text style={[styles.rowDesc, { color: theme.text }]} numberOfLines={2}>
                  {row.description}
                </Text>

                {row.reference && (
                  <Text style={[styles.rowRef, { color: theme.tabIconDefault }]}>
                    Ref: {row.reference}
                  </Text>
                )}
              </M3Card>
            );
          })}

          {/* Commit Action Button */}
          <View style={styles.commitBar}>
            <M3Button
              label={
                isCommitting
                  ? 'Importing...'
                  : `Import ${skipDuplicates ? importResult.newRows : importResult.validRows} Transactions`
              }
              icon={<Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />}
              variant="filled"
              size="lg"
              disabled={isCommitting || (skipDuplicates && importResult.newRows === 0)}
              onPress={handleCommitImport}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: DesignTokens.spacing.gutter,
    paddingBottom: 40,
  },
  header: {
    marginBottom: DesignTokens.spacing.gapLg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subhead: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  successBanner: {
    marginBottom: DesignTokens.spacing.gapLg,
    padding: DesignTokens.spacing.cardPadding,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successTextCol: {
    flex: 1,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  successSub: {
    fontSize: 13,
    marginTop: 2,
  },
  uploadCard: {
    padding: 24,
    marginBottom: DesignTokens.spacing.gapLg,
    alignItems: 'center',
  },
  uploadCardInner: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  uploadHeading: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  uploadDescription: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  pickButton: {
    width: '100%',
    minHeight: DesignTokens.buttonHeights.lg,
  },
  presetsSection: {
    marginBottom: DesignTokens.spacing.gapLg,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1,
    minHeight: 44,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewSection: {
    marginTop: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  previewMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    minHeight: 44,
    marginBottom: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  rowCard: {
    padding: 14,
    marginBottom: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  rowDateCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  rowAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowDesc: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  rowRef: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  commitBar: {
    marginTop: 18,
    marginBottom: 20,
  },
});
