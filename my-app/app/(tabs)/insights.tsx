import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
import { M3Card } from '@/components/M3/M3Card';
import { M3Button } from '@/components/M3/M3Button';
import { M3Badge } from '@/components/M3/M3Badge';
import { M3Input } from '@/components/M3/M3Input';

const QUICK_QUESTIONS = [
  'What did I spend the most money on this month?',
  'Why is cash flow different from my profit?',
  'How much did I spend on stock and inventory?',
  'What transactions still need my review?',
];

export default function InsightsScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  const [language, setLanguage] = useState<'en' | 'sn' | 'nd'>('en');
  const [question, setQuestion] = useState('');
  const [transactions, setTransactions] = useState<MobileTransaction[]>([]);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [observations, setObservations] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const currency = business?.currency || 'USD';

  const loadData = useCallback(async () => {
    const [txs, profile] = await Promise.all([
      MobileStorageService.getTransactions(),
      MobileStorageService.getBusiness(),
    ]);
    setTransactions(txs);
    setBusiness(profile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const categoryStats = (category: string) => {
    const rows = transactions.filter(
      (t) => t.currency === currency && t.category === category && t.direction === 'outflow'
    );
    const amount = rows.reduce((sum, t) => sum + t.amount, 0);
    return { amount: Math.round(amount * 100) / 100, count: rows.length };
  };

  const handleAsk = (q?: string) => {
    const query = (q || question).trim();
    if (!query) return;

    setIsThinking(true);
    setAnswer(null);

    const summary = MobileStorageService.calculateSummary(transactions, {
      period: 'this_month',
      currency,
    });
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
    }, 400);
  };

  const handleResetDemo = () => {
    Alert.alert('Reset Demo Data', 'Restore the synthetic Harare tuckshop dataset to original records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          await MobileStorageService.resetDemoData();
          await loadData();
          setAnswer(null);
          Alert.alert('Restored', 'Demo records restored successfully.');
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Grounded Business Assistant</Text>
          <Text style={[styles.subhead, { color: theme.tabIconDefault }]}>
            Deterministic answers from your recorded {currency} transactions
          </Text>
        </View>
        <M3Badge label="Grounded Rules" variant="primary" />
      </View>

      {/* Language Switcher */}
      <View style={styles.langRow}>
        {[
          { id: 'en', label: 'English' },
          { id: 'sn', label: 'ChiShona' },
          { id: 'nd', label: 'isiNdebele' },
        ].map((item) => {
          const isActive = language === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setLanguage(item.id as any)}
              accessibilityRole="button"
              accessibilityLabel={`Switch language to ${item.label}`}
              accessibilityState={{ selected: isActive }}
              style={[
                styles.langChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.surfaceContainer,
                  borderColor: isActive ? theme.primary : theme.outlineVariant,
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#FFFFFF' : theme.text }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Suggested Questions */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Common Trader Questions:</Text>
      <View style={styles.pillsCol}>
        {QUICK_QUESTIONS.map((q, idx) => (
          <Pressable
            key={idx}
            onPress={() => {
              setQuestion(q);
              handleAsk(q);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Ask question: ${q}`}
            style={[styles.questionPill, { backgroundColor: theme.surfaceContainer, borderColor: theme.outlineVariant }]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={15} color={theme.primary} />
            <Text style={[styles.questionText, { color: theme.text }]}>{q}</Text>
          </Pressable>
        ))}
      </View>

      {/* Custom Question Input */}
      <M3Card variant="elevated" style={styles.inputCard}>
        <M3Input
          label="Ask a Custom Question"
          placeholder="e.g. How much did I spend on kombi haulage?"
          value={question}
          onChangeText={setQuestion}
        />
        <View style={{ marginTop: 8 }}>
          <M3Button
            label="Explain Finances"
            variant="filled"
            onPress={() => handleAsk()}
            isLoading={isThinking}
            icon={<Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />}
            style={{ width: '100%' }}
          />
        </View>
      </M3Card>

      {/* Answer Output */}
      {answer && (
        <M3Card variant="elevated" style={[styles.answerCard, { borderColor: theme.primary }]}>
          <View style={styles.answerHeader}>
            <View style={[styles.aiIcon, { backgroundColor: theme.primaryContainer }]}>
              <Ionicons name="sparkles" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.answerTitle, { color: theme.text }]}>Verified Financial Analysis</Text>
          </View>

          <Text style={[styles.answerBody, { color: theme.text }]}>{answer}</Text>

          <View style={styles.obsSection}>
            <Text style={[styles.obsHeading, { color: theme.text }]}>Key Verified Facts:</Text>
            {observations.map((obs, idx) => (
              <View key={idx} style={styles.obsItem}>
                <View style={[styles.bullet, { backgroundColor: theme.primary }]} />
                <Text style={[styles.obsText, { color: theme.tabIconDefault }]}>{obs}</Text>
              </View>
            ))}
          </View>

          {/* Completeness Disclosure */}
          <View style={[styles.disclosureBox, { backgroundColor: theme.surfaceContainer }]}>
            <Text style={[styles.disclosureText, { color: theme.tabIconDefault }]}>
              <Text style={{ fontWeight: '700', color: theme.text }}>Completeness Disclosure: </Text>
              This explanation reflects only recorded transactions. Unrecorded cash handovers or uncollected credit are not calculated.
            </Text>
          </View>
        </M3Card>
      )}

      {/* Demo Controls */}
      <View style={styles.demoSection}>
        <M3Button
          label="Reset Harare Tuckshop Demo Data"
          variant="outlined"
          size="sm"
          onPress={handleResetDemo}
          icon={<Ionicons name="refresh-outline" size={14} color={theme.primary} />}
          style={{ width: '100%' }}
        />
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  subhead: {
    fontSize: 12,
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  langChip: {
    paddingHorizontal: 14,
    height: 32,
    borderRadius: DesignTokens.shapes.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  pillsCol: {
    gap: 8,
    marginBottom: 16,
  },
  questionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: DesignTokens.shapes.pill,
    borderWidth: 1,
  },
  questionText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputCard: {
    padding: DesignTokens.spacing.cardPadding,
    marginBottom: 14,
  },
  answerCard: {
    padding: DesignTokens.spacing.cardPadding,
    borderWidth: 1.5,
    marginBottom: 14,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  answerBody: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  obsSection: {
    gap: 6,
    marginVertical: 8,
  },
  obsHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  obsItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  obsText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  disclosureBox: {
    padding: 10,
    borderRadius: DesignTokens.shapes.medium,
    marginTop: 10,
  },
  disclosureText: {
    fontSize: 10,
    lineHeight: 14,
  },
  demoSection: {
    marginTop: 10,
  },
});
