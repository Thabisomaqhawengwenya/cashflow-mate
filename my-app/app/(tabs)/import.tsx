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
import { useFocusEffect, router } from 'expo-router';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
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
import { MobileLicenseService, LicenseInfo } from '@/services/licensing';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Button } from '@/components/M3/M3Button';
import {
  EcoCashLogo,
  InnBucksLogo,
  CabsLogo,
  CompanyBrandLogo,
} from '@/components/BrandLogos';
import { useLanguage } from '@/context/LanguageContext';

const SAMPLE_CSV_PRESETS = [
  {
    id: 'ecocash',
    name: 'EcoCash Merchant CSV',
    description: 'Weekly customer till payments and IMTT tax deductions',
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
    description: 'Counter customer transfers and logistics via InnBucks',
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
  const { t, getCategoryLabel } = useLanguage();

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [existingTransactions, setExistingTransactions] = useState<MobileTransaction[]>([]);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Import State
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [successReport, setSuccessReport] = useState<{ count: number } | null>(null);

  const currency = business?.currency || 'USD';
  const isProUnlocked = license?.tier === 'pro' || license?.tier === 'enterprise';

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        MobileStorageService.getBusiness(),
        MobileStorageService.getTransactions(),
        MobileLicenseService.getActiveLicense(),
      ]).then(([biz, txs, lic]) => {
        if (!active) return;
        setBusiness(biz);
        setExistingTransactions(txs);
        setLicense(lic);
      });
      return () => {
        active = false;
      };
    }, [])
  );

  const handlePickDocument = async () => {
    if (!isProUnlocked) {
      Alert.alert(
        'Pro Feature',
        'CSV statement import is available on Pro and Enterprise. Activate a license key to continue.'
      );
      return;
    }
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
      const MAX_BYTES = 5 * 1024 * 1024;

      if (typeof asset.size === 'number' && asset.size > MAX_BYTES) {
        Alert.alert('File Too Large', 'Please choose a CSV file smaller than 5 MB.');
        setIsReadingFile(false);
        return;
      }

      let text = '';
      if (Platform.OS === 'web' && (asset as any).file) {
        text = await (asset as any).file.text();
      } else {
        const { File } = await import('expo-file-system');
        text = await new File(asset.uri).text();
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

  const handleSelectPreset = (preset: (typeof SAMPLE_CSV_PRESETS)[0]) => {
    setActivePresetId(preset.id);
    setSuccessReport(null);
    const parsed = processCsvData(preset.csv, existingTransactions, currency, preset.name);
    setImportResult(parsed);
  };

  const handleCommitImport = async () => {
    if (!isProUnlocked) {
      Alert.alert('Pro Feature', 'Activate a Pro or Enterprise license before importing statements.');
      return;
    }
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
    <View style={styles.screenWrapper}>
      {/* 1. Deep Forest Emerald Header */}
      <View style={styles.emeraldHeader}>
        <View style={styles.topNavRow}>
          <Pressable onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('import_title')}</Text>
          <Pressable onPress={() => router.push('/modal')} style={styles.backButton}>
            <Ionicons name="key-outline" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('import_subtitle')}
        </Text>
      </View>

      {/* 2. White Curved Body Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Gate Banner if Starter */}
        {!isProUnlocked && (
          <View style={styles.gateCard}>
            <View style={styles.gateLeft}>
              <View style={[styles.miniIcon, { backgroundColor: EmeraldTokens.pastelAmber }]}>
                <Ionicons name="lock-closed" size={16} color={EmeraldTokens.pastelAmberText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gateTitle}>{t('pro_feature')}</Text>
                <Text style={styles.gateSub}>
                  {t('pro_feature_sub')}
                </Text>
              </View>
            </View>
            <M3Button
              label={t('activate_button')}
              size="sm"
              variant="mint"
              onPress={() => router.push('/modal')}
            />
          </View>
        )}

        {/* Success Banner */}
        {successReport && (
          <View style={styles.successCard}>
            <View style={styles.gateLeft}>
              <View style={[styles.miniIcon, { backgroundColor: EmeraldTokens.pastelMint }]}>
                <Ionicons name="checkmark-done" size={18} color={EmeraldTokens.pastelMintText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Import Succeeded!</Text>
                <Text style={styles.successSub}>
                  {successReport.count} transactions successfully committed to your till.
                </Text>
              </View>
            </View>
            <M3Button
              label="VIEW RECORDS"
              size="sm"
              variant="mint"
              onPress={() => router.push('/(tabs)/transactions')}
              style={{ marginTop: 10 }}
            />
          </View>
        )}

        {/* Main Upload Box */}
        <View style={styles.uploadCard}>
          <View style={[styles.iconSquircle, { backgroundColor: EmeraldTokens.pastelSky }]}>
            <Ionicons name="cloud-upload-outline" size={26} color={EmeraldTokens.pastelSkyText} />
          </View>
          <Text style={styles.uploadTitle}>{t('upload_csv_title')}</Text>
          <Text style={styles.uploadSub}>
            {t('upload_csv_sub')}
          </Text>

          <M3Button
            label={
              !isProUnlocked
                ? t('pro_license_required')
                : isReadingFile
                ? 'READING FILE...'
                : t('select_csv_file')
            }
            variant="mint"
            size="lg"
            disabled={isReadingFile || !isProUnlocked}
            onPress={handlePickDocument}
            style={{ marginTop: 14, width: '100%' }}
          />
          {isReadingFile && (
            <ActivityIndicator size="small" color={EmeraldTokens.deepPine} style={{ marginTop: 10 }} />
          )}
        </View>

        {/* Presets Row */}
        <Text style={styles.sectionHeading}>{t('preset_title')}</Text>
        <View style={styles.presetGrid}>
          {SAMPLE_CSV_PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            const renderLogo = () => {
              if (p.id === 'ecocash') return <EcoCashLogo size={36} />;
              if (p.id === 'innbucks') return <InnBucksLogo size={36} />;
              return <CabsLogo size={36} />;
            };

            return (
              <Pressable
                key={p.id}
                onPress={() => handleSelectPreset(p)}
                style={[
                  styles.presetCard,
                  isSelected && {
                    borderColor: BlueTokens.primary,
                    backgroundColor: '#EBF3FF',
                  },
                ]}
              >
                <View style={styles.presetRow}>
                  {renderLogo()}
                  <View style={styles.presetContent}>
                    <View style={styles.presetTop}>
                      <Text style={styles.presetName}>{p.name}</Text>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={BlueTokens.primary} />
                      )}
                    </View>
                    <Text style={styles.presetSub} numberOfLines={2}>
                      {p.description}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Parsed Preview Section */}
        {importResult && (
          <View style={styles.previewSection}>
            <Text style={styles.sectionHeading}>Preview Statement Records</Text>

            <View style={styles.summaryBar}>
              <Text style={styles.summaryText}>
                Total Rows: <Text style={{ fontWeight: '700' }}>{importResult.totalRows}</Text>
              </Text>
              <Text style={styles.summaryText}>
                Duplicates: <Text style={{ fontWeight: '700', color: BlueTokens.error }}>{importResult.duplicateCount}</Text>
              </Text>
              <Text style={styles.summaryText}>
                Valid Rows: <Text style={{ fontWeight: '700', color: BlueTokens.success }}>{importResult.validRows}</Text>
              </Text>
            </View>

            {/* Rows list */}
            {importResult.rows.map((row, idx) => {
              const catMeta = CATEGORIES[row.category];
              return (
                <View key={idx} style={styles.previewRowCard}>
                  <View style={styles.previewRowLayout}>
                    <CompanyBrandLogo identifier={row.description} size={34} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.previewTop}>
                        <Text style={styles.previewDate}>{row.date}</Text>
                        <Text
                          style={[
                            styles.previewAmount,
                            {
                              color:
                                row.direction === 'inflow'
                                  ? BlueTokens.success
                                  : BlueTokens.error,
                            },
                          ]}
                        >
                          {row.direction === 'inflow' ? '+' : '-'}
                          {formatMoney(row.amount, currency)}
                        </Text>
                      </View>
                      <Text style={styles.previewDesc}>{row.description}</Text>
                      <View style={styles.previewBottom}>
                        <M3Badge
                          label={catMeta ? catMeta.label : row.category}
                          variant="purple"
                        />
                        {row.isDuplicate && (
                          <M3Badge label="DUPLICATE (SKIP)" variant="amber" />
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}

            <M3Button
              label={isCommitting ? 'COMMITTING...' : `IMPORT ${importResult.rows.length} TRANSACTIONS`}
              variant="mint"
              size="lg"
              disabled={isCommitting}
              onPress={handleCommitImport}
              style={{ marginTop: 14 }}
            />
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 22,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 2,
    lineHeight: 18,
  },

  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  gateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  gateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  miniIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  gateSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
  },

  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: EmeraldTokens.pastelMintText,
  },
  successTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: EmeraldTokens.pastelMintText,
  },
  successSub: {
    fontSize: 12,
    color: EmeraldTokens.textSlate,
  },

  uploadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  iconSquircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 4,
  },
  uploadSub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 12,
    marginLeft: 4,
  },
  presetGrid: {
    gap: 10,
    marginBottom: 20,
  },
  presetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  presetContent: {
    flex: 1,
  },
  presetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  presetSub: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
  },

  previewSection: {
    marginTop: 10,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 12,
    color: EmeraldTokens.textSlate,
  },
  previewRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  previewRowLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 11,
    color: EmeraldTokens.textSubtle,
  },
  previewAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  previewDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
    marginBottom: 8,
  },
  previewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
