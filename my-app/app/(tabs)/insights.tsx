import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import {
  BusinessProfile,
  MobileStorageService,
  MobileTransaction,
  MobileDebt,
  formatMoney,
  CATEGORIES,
} from '@/services/storage';
import { MobileNetworkService, NetworkConnectionState } from '@/services/network';
import {
  GeminiService,
  isBlatantlyOutOfScope,
  getOutOfScopeRefusal,
} from '@/services/gemini';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { useLanguage } from '@/context/LanguageContext';
import { SupportedLanguage } from '@/services/i18n';

const QUICK_QUESTIONS_MAP: Record<SupportedLanguage, string[]> = {
  en: [
    'What did I spend the most money on this month?',
    'Why is cash flow different from my profit?',
    'How much did I spend on stock and inventory?',
    'What transactions still need my review?',
  ],
  sn: [
    'Ndechipi chanyanya kudya mari mwedzi uno?',
    'Nei mari yasara yakasiyana nepurofiti?',
    'Imarii yandakashandisa kutenga zvitoro?',
    'Ndezvipi zvinyorwa zvinoda kuongororwa?',
  ],
  nd: [
    'Yiziphi izindleko ezinkulu kule inyanga?',
    'Kungani imali eseleyo yehlukene lenzuzo?',
    'Yimalini engiyisebenzise empahleni yesitolo?',
    'Yimaphi amarekhodi adinga ukuhlolwa?',
  ],
};

export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { language, setLanguage, t, supportedLanguages } = useLanguage();

  const [question, setQuestion] = useState('');
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [debts, setDebts] = useState<MobileDebt[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [observations, setObservations] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isAnswerOffline, setIsAnswerOffline] = useState(false);
  const [activeEngineSource, setActiveEngineSource] = useState<'gemini_flash' | 'offline_engine'>('offline_engine');

  // Gemini API Key State & Modal
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyTestMessage, setKeyTestMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Wi-Fi Connection & Notification State
  const [networkState, setNetworkState] = useState<NetworkConnectionState>({
    isConnected: true,
    isWifi: true,
    isCellular: false,
    connectionType: 'wifi',
    details: 'Checking network status...',
  });
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{
    type: 'warning' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const currency = business?.currency || 'USD';

  const refreshNetworkState = useCallback(async () => {
    setIsCheckingNetwork(true);
    const net = await MobileNetworkService.checkConnection();
    setNetworkState(net);
    setIsCheckingNetwork(false);
    return net;
  }, []);

  const loadData = useCallback(async () => {
    const [txs, profile, allDebts, key] = await Promise.all([
      MobileStorageService.getTransactions(),
      MobileStorageService.getBusiness(),
      MobileStorageService.getDebts(),
      MobileStorageService.getGeminiApiKey(),
    ]);
    setTransactions(txs);
    setBusiness(profile);
    setDebts(allDebts);
    setGeminiApiKey(key);
    setTempApiKey(key);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      refreshNetworkState();
    }, [loadData, refreshNetworkState])
  );

  const toggleSimulateWifi = async () => {
    const current = MobileNetworkService.getSimulatedWifiOverride();
    const next = current === false ? true : false;
    MobileNetworkService.setSimulatedWifiOverride(next);
    const net = await refreshNetworkState();
    if (!net.isWifi) {
      setNotificationToast({
        type: 'warning',
        title: t('not_connected_wifi_title'),
        message: t('not_connected_wifi_desc'),
      });
    } else {
      setNotificationToast(null);
    }
  };

  const handleSaveApiKey = async () => {
    const cleaned = tempApiKey.trim();
    await MobileStorageService.setGeminiApiKey(cleaned);
    setGeminiApiKey(cleaned);
    setIsApiKeyModalOpen(false);
    Alert.alert(
      'Gemini AI Configured',
      cleaned
        ? 'Real Google Gemini 1.5 Flash is now active with strict tuckshop domain guardrails!'
        : 'Gemini API key cleared. Operating in offline rule mode.'
    );
  };

  const handleRemoveApiKey = async () => {
    await MobileStorageService.clearGeminiApiKey();
    setGeminiApiKey('');
    setTempApiKey('');
    setKeyTestMessage(null);
    setIsApiKeyModalOpen(false);
    Alert.alert('Gemini Key Removed', 'CashFlow Mate is now operating in offline financial rule mode.');
  };

  const handleTestApiKey = async () => {
    if (!tempApiKey.trim()) {
      setKeyTestMessage({ success: false, text: 'Please enter a key first.' });
      return;
    }
    setIsTestingKey(true);
    setKeyTestMessage(null);
    const result = await GeminiService.testApiKey(tempApiKey.trim());
    setIsTestingKey(false);
    setKeyTestMessage({ success: result.success, text: result.message });
  };

  const categoryStats = (category: string) => {
    const rows = transactions.filter(
      (t) => t.currency === currency && t.category === category && t.direction === 'outflow'
    );
    const amount = rows.reduce((sum, t) => sum + t.amount, 0);
    return { amount: Math.round(amount * 100) / 100, count: rows.length };
  };

  const executeAiQuery = async (query: string, isOffline: boolean) => {
    setIsThinking(true);
    setAnswer(null);

    // 1. Client-Side Scope Guardrail Check (Declines out-of-scope immediately)
    if (isBlatantlyOutOfScope(query)) {
      setIsThinking(false);
      setAnswer(getOutOfScopeRefusal(language));
      setObservations([
        'CashFlow Mate AI is strictly restricted to tuckshop records, transactions, debts, and till operations.',
      ]);
      setIsAnswerOffline(false);
      setActiveEngineSource('gemini_flash');
      return;
    }

    const summary = MobileStorageService.calculateSummary(transactions, {
      period: 'this_month',
      currency,
    });
    const cashbox = MobileStorageService.calculateMultiCurrencyCashbox(transactions);

    // 2. Real Google Gemini Flash Execution (Online with API Key)
    if (!isOffline && geminiApiKey.trim()) {
      try {
        const geminiRes = await GeminiService.askGemini({
          apiKey: geminiApiKey,
          question: query,
          language,
          currency,
          summary,
          recentTransactions: transactions,
          debts,
          cashbox,
        });

        setAnswer(geminiRes.answer);
        setObservations(geminiRes.observations);
        setIsAnswerOffline(false);
        setActiveEngineSource('gemini_flash');
        setIsThinking(false);
        return;
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to offline engine:', err);
        Alert.alert(
          'Gemini Live Notice',
          `${err.message || 'Could not reach Gemini API.'}\n\nFalling back to local offline financial engine.`
        );
      }
    }

    // 3. Fallback: Local Deterministic Financial Rule Engine
    setIsAnswerOffline(true);
    setActiveEngineSource('offline_engine');
    const topExpense = summary.categoryBreakdown[0];
    const lower = query.toLowerCase();

    const matchedCategory = /stock|inventory|restock/.test(lower)
      ? 'stock_purchase'
      : /kombi|transport|fuel|haulage/.test(lower)
      ? 'transport_fuel'
      : /rent|stall|council/.test(lower)
      ? 'rent'
      : /fee|ecocash|bank|imtt|charge/.test(lower)
      ? 'mobile_money_fees'
      : /zetdc|electric|token|power|water/.test(lower)
      ? 'utilities_electricity'
      : /drawing|personal|family|school/.test(lower)
      ? 'owner_drawings'
      : null;

    const wantsReview = /review|pending|uncategor|attention/.test(lower);
    const wantsProfit = /profit|margin/.test(lower);
    const wantsCashFlow = /cash\s*flow|cashflow|net/.test(lower);

    setTimeout(() => {
      let ans = '';
      const obs: string[] = [];

      obs.push(
        `Recorded total inflows: ${formatMoney(summary.recordedInflows, currency)}; outflows: ${formatMoney(summary.recordedOutflows, currency)}; net cash flow: ${formatMoney(summary.netCashFlow, currency)}.`
      );

      if (language === 'sn') {
        ans = `Makadii! Mumwedzi uno webhizinesi, maita mari inosvika ${formatMoney(summary.recordedInflows, currency)} yemapayments, mukashandisa ${formatMoney(summary.recordedOutflows, currency)}. Cash yasara mubhizinesi ndeye ${formatMoney(summary.netCashFlow, currency)}. ${topExpense ? `Chakanyanya kudya mari ndeche ${topExpense.label}.` : ''} Profit yemazuva ose inofungidzirwa kuita ${formatMoney(summary.estimatedOperatingProfit, currency)}.`;
      } else if (language === 'nd') {
        ans = `Salibonani! Ngalikheli inyanga, ibhizimusi liholenze imali engange ${formatMoney(summary.recordedInflows, currency)}, lasebenzisa ${formatMoney(summary.recordedOutflows, currency)}. Imali eseleyo yi ${formatMoney(summary.netCashFlow, currency)}. ${topExpense ? `Okudle imali kakhulu yi ${topExpense.label}.` : ''} Inzuzo yokusebenza ilinganiselwa ku ${formatMoney(summary.estimatedOperatingProfit, currency)}.`;
      } else if (wantsReview) {
        ans =
          summary.unreviewedCount > 0
            ? `In ${summary.periodLabel}, ${summary.unreviewedCount} transaction${summary.unreviewedCount === 1 ? '' : 's'} still need review. Until they are categorized, the operating profit estimate can understate or overstate the real result. Open the Transactions tab and tap each record marked "Review".`
            : `Good news: every transaction recorded in ${summary.periodLabel} is confirmed and categorized, so your operating profit estimate is based on complete records.`;
      } else if (matchedCategory) {
        const stats = categoryStats(matchedCategory);
        const label = CATEGORIES[matchedCategory]?.label || matchedCategory;
        if (stats.count > 0) {
          ans = `In ${summary.periodLabel}, you recorded ${stats.count} transaction${stats.count === 1 ? '' : 's'} in ${label}, totaling ${formatMoney(stats.amount, currency)}. That is ${Math.round((stats.amount / Math.max(summary.recordedOutflows, 1)) * 100)}% of your recorded outflows.`;
          obs.push(`${label}: ${formatMoney(stats.amount, currency)} across ${stats.count} record(s).`);
        } else {
          ans = `You recorded no ${label.toLowerCase()} expenses in ${summary.periodLabel}. Your largest outflow category was ${topExpense ? `${topExpense.label} at ${formatMoney(topExpense.amount, currency)}` : 'not yet recorded'}.`;
        }
      } else if (wantsProfit) {
        ans = `Your estimated operating profit for ${summary.periodLabel} is ${formatMoney(summary.estimatedOperatingProfit, currency)} (operating revenue ${formatMoney(summary.operatingRevenue, currency)} minus operating expenses ${formatMoney(summary.operatingExpenses, currency)}). This deliberately excludes Mukando loans, owner drawings and internal float transfers. Your net cash flow, which does include those movements, is ${formatMoney(summary.netCashFlow, currency)}.`;
      } else if (wantsCashFlow) {
        ans = `In ${summary.periodLabel}, cash in was ${formatMoney(summary.recordedInflows, currency)} and cash out was ${formatMoney(summary.recordedOutflows, currency)}, leaving net cash flow of ${formatMoney(summary.netCashFlow, currency)}. Remember that cash flow includes loans, drawings and internal transfers, so it is not the same as profit.`;
      } else {
        ans = `During ${summary.periodLabel}, your business recorded ${formatMoney(summary.recordedInflows, currency)} in total cash inflows and spent ${formatMoney(summary.recordedOutflows, currency)}, leaving you with a net cash flow of ${formatMoney(summary.netCashFlow, currency)}. ${topExpense ? `Your largest expense allocation was dedicated to ${topExpense.label}.` : ''} Your estimated operating profit is ${formatMoney(summary.estimatedOperatingProfit, currency)}, which strictly focuses on trading sales minus operational expenses (excluding loan pools and personal drawings).`;
      }

      if (topExpense) {
        obs.push(
          `Largest expense category: ${topExpense.label} at ${formatMoney(topExpense.amount, currency)} (${topExpense.percentage}% of all expenses).`
        );
      }

      if (summary.unreviewedCount > 0) {
        obs.push(
          `You have ${summary.unreviewedCount} unreviewed transaction(s) waiting for category confirmation.`
        );
      }

      setAnswer(ans);
      setObservations(obs);
      setIsThinking(false);
    }, 300);
  };

  const handleAsk = async (q?: string) => {
    const query = (q || question).trim();
    if (!query) return;

    // 1. Verify Wi-Fi network connection
    const net = await refreshNetworkState();

    if (!net.isWifi) {
      setNotificationToast({
        type: 'warning',
        title: t('not_connected_wifi_title'),
        message: t('not_connected_wifi_desc'),
      });

      Alert.alert(
        t('not_connected_wifi_alert_title'),
        t('not_connected_wifi_alert_msg'),
        [
          {
            text: t('connect_wifi_btn'),
            style: 'cancel',
          },
          {
            text: t('use_offline_engine_btn'),
            onPress: () => {
              executeAiQuery(query, true);
            },
          },
        ]
      );
      return;
    }

    // Wi-Fi is active, clear warning and execute
    setNotificationToast(null);

    // If online but no API key is saved yet, execute offline and prompt key modal
    if (!geminiApiKey.trim()) {
      executeAiQuery(query, true);
      return;
    }

    executeAiQuery(query, false);
  };

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Deep Forest Emerald Header */}
      <View style={styles.emeraldHeader}>
        <View style={styles.topNavRow}>
          <Pressable onPress={() => router.push('/(tabs)')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{t('assistant_title')}</Text>
          <Pressable
            onPress={() => {
              setTempApiKey(geminiApiKey);
              setKeyTestMessage(null);
              setIsApiKeyModalOpen(true);
            }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Configure Gemini API Key"
          >
            <Ionicons name="sparkles" size={18} color={geminiApiKey ? '#34D399' : '#FFFFFF'} />
          </Pressable>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('assistant_subtitle')}
        </Text>

        {/* Language Selection Pills in Header */}
        <View style={styles.langPillsRow}>
          {[
            { id: 'en', label: 'English' },
            { id: 'sn', label: 'ChiShona' },
            { id: 'nd', label: 'SiNdebele' },
          ].map((item) => {
            const isActive = language === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setLanguage(item.id as any)}
                style={[
                  styles.langPill,
                  {
                    backgroundColor: isActive
                      ? EmeraldTokens.mintCta
                      : 'rgba(255, 255, 255, 0.12)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langPillText,
                    {
                      color: isActive
                        ? EmeraldTokens.mintDarkText
                        : 'rgba(255, 255, 255, 0.85)',
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
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Engine Status & Guardrail Card */}
        <View style={styles.engineCard}>
          <View style={styles.engineLeft}>
            <View
              style={[
                styles.engineIconCircle,
                { backgroundColor: geminiApiKey ? '#E0F2FE' : '#FEF3C7' },
              ]}
            >
              <Ionicons
                name={geminiApiKey ? 'sparkles' : 'shield-checkmark-outline'}
                size={18}
                color={geminiApiKey ? '#0284C7' : '#D97706'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.engineTitle}>
                  {geminiApiKey ? 'Google Gemini 1.5 Flash' : 'Offline Financial Engine'}
                </Text>
                <M3Badge
                  label={geminiApiKey ? 'LIVE AI' : 'OFFLINE'}
                  variant={geminiApiKey ? 'mint' : 'amber'}
                />
              </View>
              <Text style={styles.engineSub}>
                {geminiApiKey
                  ? 'Active with strict tuckshop domain guardrails'
                  : 'Free deterministic till calculations'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              setTempApiKey(geminiApiKey);
              setKeyTestMessage(null);
              setIsApiKeyModalOpen(true);
            }}
            style={styles.engineConfigBtn}
            accessibilityRole="button"
            accessibilityLabel="Configure Gemini API Key"
          >
            <Ionicons name="key-outline" size={13} color={EmeraldTokens.deepPine} />
            <Text style={styles.engineConfigBtnText}>
              {geminiApiKey ? 'Manage Key' : 'Connect Key'}
            </Text>
          </Pressable>
        </View>

        {/* Connection & Wi-Fi Notification Banner */}
        {!networkState.isWifi ? (
          <View style={styles.noWifiCard}>
            <View style={styles.noWifiHeaderRow}>
              <View style={styles.noWifiIconCircle}>
                <Ionicons name="wifi-outline" size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.noWifiTitleRow}>
                  <Text style={styles.noWifiTitle}>{t('not_connected_wifi_title')}</Text>
                  <View style={styles.noWifiBadge}>
                    <Text style={styles.noWifiBadgeText}>NO WI-FI</Text>
                  </View>
                </View>
                <Text style={styles.noWifiDesc}>{t('not_connected_wifi_desc')}</Text>
              </View>
            </View>

            <View style={styles.noWifiActionsRow}>
              <Pressable
                onPress={refreshNetworkState}
                style={styles.noWifiBtnSecondary}
                accessibilityRole="button"
                accessibilityLabel="Check Wi-Fi network connection"
              >
                <Ionicons
                  name={isCheckingNetwork ? 'sync' : 'refresh'}
                  size={14}
                  color="#92400E"
                />
                <Text style={styles.noWifiBtnSecondaryText}>
                  {isCheckingNetwork ? 'Checking...' : t('check_wifi_btn')}
                </Text>
              </Pressable>

              <Pressable
                onPress={toggleSimulateWifi}
                style={styles.noWifiBtnGhost}
                accessibilityRole="button"
                accessibilityLabel="Simulate Wi-Fi state for testing"
              >
                <Ionicons name="options-outline" size={13} color="#B45309" />
                <Text style={styles.noWifiBtnGhostText}>
                  {MobileNetworkService.getSimulatedWifiOverride() === false ? 'Restore Real Wi-Fi' : 'Simulate No Wi-Fi'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.wifiConnectedCard}>
            <View style={styles.wifiConnectedDot} />
            <Ionicons name="wifi" size={14} color="#16A34A" />
            <Text style={styles.wifiConnectedText}>{t('wifi_connected')}</Text>
            <Pressable
              onPress={toggleSimulateWifi}
              style={styles.wifiTestBtn}
              accessibilityRole="button"
              accessibilityLabel="Test without Wi-Fi"
            >
              <Text style={styles.wifiTestBtnText}>Test No Wi-Fi</Text>
            </Pressable>
          </View>
        )}

        {/* Question Input Card */}
        <View style={styles.askCard}>
          <View style={styles.inputRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={EmeraldTokens.deepPine} />
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder={t('ask_placeholder')}
              placeholderTextColor={EmeraldTokens.textSubtle}
              style={styles.textInput}
              onSubmitEditing={() => handleAsk()}
            />
          </View>
          <M3Button
            label={isThinking ? t('analyzing_button') : t('ask_button')}
            variant="mint"
            size="md"
            disabled={isThinking || !question.trim()}
            onPress={() => handleAsk()}
            style={{ marginTop: 10 }}
          />
        </View>

        {/* Common Quick Questions */}
        <Text style={styles.sectionHeading}>{t('quick_questions_title')}</Text>
        <View style={styles.quickGrid}>
          {(QUICK_QUESTIONS_MAP[language] || QUICK_QUESTIONS_MAP.en).map((q, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              style={({ pressed }) => [
                styles.quickChip,
                { transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
            >
              <Ionicons name="help-circle-outline" size={16} color={EmeraldTokens.deepPine} />
              <Text style={styles.quickChipText}>{q}</Text>
            </Pressable>
          ))}
        </View>

        {/* Response Card */}
        {isThinking && (
          <View style={styles.thinkingBox}>
            <ActivityIndicator size="small" color={EmeraldTokens.deepPine} />
            <Text style={styles.thinkingText}>
              {geminiApiKey && networkState.isWifi
                ? 'Consulting Google Gemini 1.5 Flash...'
                : t('thinking_text')}
            </Text>
          </View>
        )}

        {answer && (
          <View style={styles.answerCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              {isAnswerOffline ? (
                <View style={styles.offlineNoticePill}>
                  <Ionicons name="cloud-offline-outline" size={13} color="#D97706" />
                  <Text style={styles.offlineNoticePillText}>{t('offline_generated_badge')}</Text>
                </View>
              ) : (
                <View style={styles.geminiNoticePill}>
                  <Ionicons name="sparkles" size={13} color="#0284C7" />
                  <Text style={styles.geminiNoticePillText}>Real Gemini 1.5 Flash</Text>
                </View>
              )}

              <View style={styles.guardrailPill}>
                <Ionicons name="lock-closed" size={11} color={EmeraldTokens.deepPine} />
                <Text style={styles.guardrailPillText}>Tuckshop Scope Locked</Text>
              </View>
            </View>

            <View style={styles.answerHeader}>
              <View style={[styles.miniIcon, { backgroundColor: EmeraldTokens.pastelMint }]}>
                <Ionicons name="sparkles" size={16} color={EmeraldTokens.pastelMintText} />
              </View>
              <Text style={styles.answerTitle}>{t('explanation_title')}</Text>
            </View>

            <Text style={styles.answerBody}>{answer}</Text>

            {observations.length > 0 && (
              <View style={styles.obsList}>
                <Text style={styles.obsHeading}>{t('verified_facts')}:</Text>
                {observations.map((obs, i) => (
                  <View key={i} style={styles.obsItem}>
                    <Ionicons name="checkmark-circle" size={14} color={EmeraldTokens.pastelMintText} />
                    <Text style={styles.obsText}>{obs}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 3. Google Gemini API Key & Guardrail Configuration Modal */}
      <Modal
        visible={isApiKeyModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsApiKeyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconBox}>
                  <Ionicons name="sparkles" size={18} color="#0284C7" />
                </View>
                <Text style={styles.modalTitle}>Google Gemini AI Setup</Text>
              </View>
              <Pressable
                onPress={() => setIsApiKeyModalOpen(false)}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close Gemini API Key Modal"
              >
                <Ionicons name="close" size={22} color={EmeraldTokens.textSlate} />
              </Pressable>
            </View>

            {/* Scope Guardrail Explainer Banner */}
            <View style={styles.guardrailBanner}>
              <View style={styles.guardrailBannerHeader}>
                <Ionicons name="shield-checkmark" size={16} color="#047857" />
                <Text style={styles.guardrailBannerTitle}>Strict Tuckshop Guardrails Active</Text>
              </View>
              <Text style={styles.guardrailBannerDesc}>
                Gemini is constrained by built-in system rules to ONLY perform tasks and answer questions related to your CashFlow Mate records, sales, expenses, debts, and till drawers. Off-topic questions are firmly declined.
              </Text>
            </View>

            <M3Input
              label="Google Gemini API Key"
              placeholder="Paste AIzaSy... key from Google AI Studio"
              value={tempApiKey}
              onChangeText={setTempApiKey}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={false}
            />

            {keyTestMessage && (
              <View
                style={[
                  styles.testFeedbackBox,
                  {
                    backgroundColor: keyTestMessage.success ? '#ECFDF5' : '#FEF2F2',
                    borderColor: keyTestMessage.success ? '#A7F3D0' : '#FECACA',
                  },
                ]}
              >
                <Ionicons
                  name={keyTestMessage.success ? 'checkmark-circle' : 'alert-circle'}
                  size={15}
                  color={keyTestMessage.success ? '#059669' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.testFeedbackText,
                    { color: keyTestMessage.success ? '#065F46' : '#991B1B' },
                  ]}
                >
                  {keyTestMessage.text}
                </Text>
              </View>
            )}

            <View style={styles.modalActionRow}>
              <M3Button
                label={isTestingKey ? 'VERIFYING...' : 'TEST KEY'}
                variant="outlined"
                size="md"
                disabled={isTestingKey || !tempApiKey.trim()}
                onPress={handleTestApiKey}
                style={{ flex: 1 }}
              />
              <M3Button
                label="SAVE KEY"
                variant="mint"
                size="md"
                onPress={handleSaveApiKey}
                style={{ flex: 1 }}
              />
            </View>

            {geminiApiKey ? (
              <Pressable onPress={handleRemoveApiKey} style={styles.removeKeyBtn}>
                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                <Text style={styles.removeKeyBtnText}>Remove Saved API Key</Text>
              </Pressable>
            ) : null}

            <Text style={styles.getApiKeyHelpText}>
              Need a free key? Generate one at{' '}
              <Text style={{ fontWeight: '700', color: EmeraldTokens.deepPine }}>
                aistudio.google.com
              </Text>
            </Text>
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
    marginBottom: 14,
  },

  langPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: DesignTokens.shapes.pill,
  },
  langPillText: {
    fontSize: 12,
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
    paddingBottom: 150,
  },

  // Engine Status Card
  engineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  engineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  engineIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  engineSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },
  engineConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  engineConfigBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
  },

  askCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: EmeraldTokens.textSlate,
  },

  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 12,
    marginLeft: 4,
  },
  quickGrid: {
    gap: 8,
    marginBottom: 20,
  },
  quickChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
    flex: 1,
  },

  thinkingBox: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  thinkingText: {
    fontSize: 13,
    color: EmeraldTokens.textMuted,
  },

  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  answerBody: {
    fontSize: 14,
    lineHeight: 22,
    color: EmeraldTokens.textSlate,
    marginBottom: 14,
  },
  obsList: {
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  obsHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: EmeraldTokens.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  obsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  obsText: {
    fontSize: 12,
    color: EmeraldTokens.textSlate,
    flex: 1,
    lineHeight: 18,
  },

  // Wi-Fi Status & Notification Banners
  noWifiCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  noWifiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  noWifiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noWifiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noWifiTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  noWifiBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  noWifiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  noWifiDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F',
  },
  noWifiActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(217, 119, 6, 0.15)',
  },
  noWifiBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  noWifiBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  noWifiBtnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  noWifiBtnGhostText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },

  wifiConnectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
    gap: 8,
  },
  wifiConnectedDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  wifiConnectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  wifiTestBtn: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  wifiTestBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    textDecorationLine: 'underline',
  },

  offlineNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  offlineNoticePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },

  geminiNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  geminiNoticePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },

  guardrailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  guardrailPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: EmeraldTokens.deepPine,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  closeBtn: {
    padding: 4,
  },

  guardrailBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  guardrailBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  guardrailBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  guardrailBannerDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#047857',
  },

  testFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  testFeedbackText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },

  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  removeKeyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
  },
  removeKeyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  getApiKeyHelpText: {
    fontSize: 11,
    textAlign: 'center',
    color: EmeraldTokens.textMuted,
    marginTop: 14,
  },
});
