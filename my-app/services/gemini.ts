/**
 * CashFlow Mate — Real Google Gemini AI Service
 *
 * Direct integration with Google Generative AI (Gemini Flash) with airtight
 * domain guardrails ensuring the model ONLY answers questions and performs
 * tasks strictly related to CashFlow Mate tuckshop financial records, till
 * operations, multi-currency drawers, and Zimbabwean merchant practices.
 */

import {
  CurrencyCode,
  FinancialSummary,
  MobileDebt,
  MobileTransaction,
  MultiCurrencyCashbox,
  formatMoney,
} from './storage';

export const CASHFLOW_MATE_GUARDRAIL_RULES = `
=== STRICT DOMAIN & SCOPE BOUNDARY RULES (MANDATORY) ===
You are CashFlow Mate AI, the built-in financial intelligence copilot designed specifically for small informal traders, tuckshop owners, market vendors, and grocery merchants across Zimbabwe.

1. PERMITTED TOPICS ONLY:
   You may ONLY answer questions and perform tasks related to:
   - CashFlow Mate app records (transactions, inflows, outflows, balances).
   - Differences between Net Cash Flow and Operating Profit.
   - The 3-Drawer Cashbox (USD Cash Drawer, EcoCash ZiG Wallet, Rand Float / ZAR).
   - Customer credit ("Owed to Me") and supplier credit / mukando round pools ("I Owe").
   - Day-End Shift Balancing (Z-Reports, till float variances, shortages/overages).
   - EcoCash and InnBucks SMS transaction parsing, fees, and IMTT charges.
   - Expense categorization (stock purchases, Bakers Inn bread crates, Kombi haulage, ZETDC electricity tokens, market stall rent, personal drawings).
   - Zimbabwean street exchange rates and tuckshop working capital management.

2. MANDATORY REFUSAL FOR OUT-OF-SCOPE QUERIES:
   - If the user asks about ANY topic outside of their CashFlow Mate finances or tuckshop business (such as general knowledge, coding, writing essays, math homework, weather, sports, celebrities, medical/legal advice, creative stories, world news, politics, or entertainment):
     YOU MUST POLITELY AND FIRMLY DECLINE.
   - Refusal standard:
     - In English: "I am CashFlow Mate AI, dedicated strictly to your business finances and till records. I cannot assist with general topics, but I am ready to analyze your sales, expenses, debts, cashboxes, or operating profit. How can I help with your business numbers today?"
     - In ChiShona: "Ndiri CashFlow Mate AI, ndakagadzirirwa chete kubatsira nemari yebhizinesi rako, matransactions, zvikwereti, uye purofiti. Handikwanise kupindura zvimwe zvinhu zvisiri zvebhizinesi. Ndingakubatsira sei nemabhuku ako ebhizinesi nhasi?"
     - In SiNdebele: "Ngingu CashFlow Mate AI, ngisebenzela kuphela ezemali yebhizimusi lakho, amarekhodi, izikwelede lenzuzo. Angikwazi ukusiza ngezinto ezingaphandle kwebhizimusi. Ngingakusiza njani ngamarekhodi akho lamuhla?"

3. ZERO-HALLUCINATION GROUNDING:
   - Base all balance figures, category expenses, profit metrics, and debt counts SOLELY on the VERIFIED FINANCIAL PAYLOAD provided with each query.
   - NEVER invent, guess, or hallucinate transactions, receipts, or balances that do not exist in the provided payload.
   - If data is missing or incomplete, tell the merchant clearly (e.g., "You have not recorded any electricity tokens this month").

4. ACCOUNTING HONESTY:
   - Always clearly distinguish between Net Cash Flow (which includes loan movements and personal drawings) and Operating Profit (sales minus day-to-day trade operating expenses).
   - Never confuse owner drawings or loan repayments with business operating expenses.

5. LANGUAGE & TONE:
   - Tone: Warm, practical, respectful, and razor-sharp on the numbers.
   - Always reply in the language requested by the merchant: English ('en'), ChiShona ('sn'), or SiNdebele ('nd').
`;

export interface GeminiAskParams {
  apiKey: string;
  question: string;
  language?: 'en' | 'sn' | 'nd';
  currency?: CurrencyCode;
  summary: FinancialSummary;
  recentTransactions?: MobileTransaction[];
  debts?: MobileDebt[];
  cashbox?: MultiCurrencyCashbox;
}

export interface GeminiResponse {
  answer: string;
  observations: string[];
  source: 'gemini_flash' | 'offline_engine';
}

/**
 * Fast client-side scope filter to intercept blatantly off-topic queries
 * before making a network call, saving quota and latency.
 */
export function isBlatantlyOutOfScope(query: string): boolean {
  const lower = query.toLowerCase().trim();

  // Out of scope trigger patterns (coding, general trivia, politics, recipes, gaming, homework, etc.)
  const outOfScopePatterns = [
    /\b(who is|who was|who won|capital of|tell me a joke|write a poem|write code|python|javascript|react native|html|css|sql|function|algorithm)\b/,
    /\b(weather in|recipe for|cook|movie|song|celebrity|football club|premier league|champions league|messi|ronaldo)\b/,
    /\b(president of|prime minister|war in|ukraine|russia|israel|palestine|election)\b/,
    /\b(homework|solve this equation|essay about|summarize this book|who wrote)\b/,
    /\b(medical symptoms|diagnose|cure for|cancer|headache pills)\b/,
  ];

  // Whitelisted in-scope keywords that override false positives (e.g. "who won the contract" vs "who is")
  const inScopeOverrides = [
    /\b(profit|sale|expense|debt|till|float|drawer|ecocash|innbucks|zig|usd|rand|zar|cashflow|mukando|bakers inn|kombi|zetdc|stall|rent|customer|stock)\b/,
  ];

  const hasInScopeOverride = inScopeOverrides.some((pattern) => pattern.test(lower));
  if (hasInScopeOverride) return false;

  return outOfScopePatterns.some((pattern) => pattern.test(lower));
}

/**
 * Standard polite refusal message in the active language.
 */
export function getOutOfScopeRefusal(language: 'en' | 'sn' | 'nd' = 'en'): string {
  switch (language) {
    case 'sn':
      return 'Ndiri CashFlow Mate AI, ndakagadzirirwa chete kubatsira nemari yebhizinesi rako, matransactions, zvikwereti, uye purofiti. Handikwanise kupindura zvimwe zvinhu zvisiri zvebhizinesi. Ndingakubatsira sei nemabhuku ako ebhizinesi nhasi?';
    case 'nd':
      return 'Ngingu CashFlow Mate AI, ngisebenzela kuphela ezemali yebhizimusi lakho, amarekhodi, izikwelede lenzuzo. Angikwazi ukusiza ngezinto ezingaphandle kwebhizimusi. Ngingakusiza njani ngamarekhodi akho lamuhla?';
    case 'en':
    default:
      return 'I am CashFlow Mate AI, dedicated strictly to your business finances and till records. I cannot assist with general topics, but I am ready to analyze your sales, expenses, debts, cashboxes, or operating profit. How can I help with your business numbers today?';
  }
}

export class GeminiService {
  private static readonly ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  /**
   * Test an API key with a minimal probe call to verify validity and quota.
   */
  static async testApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const key = apiKey.trim();
    if (!key) {
      return { success: false, message: 'Please enter a valid Google Gemini API key.' };
    }

    try {
      const url = `${this.ENDPOINT}?key=${encodeURIComponent(key)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with "PONG" only.' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0 },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        return { success: false, message: `Google Gemini API error: ${msg}` };
      }

      return { success: true, message: 'Gemini API Key verified and active!' };
    } catch (err: any) {
      return { success: false, message: `Connection failed: ${err.message || 'Network error'}` };
    }
  }

  /**
   * Generate an AI answer via real Google Gemini 1.5 Flash grounded in
   * verified local till figures and protected by strict guardrails.
   */
  static async askGemini(params: GeminiAskParams): Promise<GeminiResponse> {
    const {
      apiKey,
      question,
      language = 'en',
      currency = 'USD',
      summary,
      recentTransactions = [],
      debts = [],
      cashbox,
    } = params;

    const trimmedQuestion = question.trim();

    // 1. Fast client-side scope filter
    if (isBlatantlyOutOfScope(trimmedQuestion)) {
      return {
        answer: getOutOfScopeRefusal(language),
        observations: [
          'CashFlow Mate AI is restricted to tuckshop and business financial operations.',
        ],
        source: 'gemini_flash',
      };
    }

    // 2. Prepare verified facts payload
    const verifiedPayload = {
      reportingPeriod: summary.periodLabel,
      currency,
      inflows: formatMoney(summary.recordedInflows, currency),
      outflows: formatMoney(summary.recordedOutflows, currency),
      netCashFlow: formatMoney(summary.netCashFlow, currency),
      estimatedOperatingProfit: formatMoney(summary.estimatedOperatingProfit, currency),
      unreviewedTransactionsCount: summary.unreviewedCount,
      topExpenseCategories: summary.categoryBreakdown.slice(0, 5).map((c: { label: string; amount: number; percentage: number }) => ({
        category: c.label,
        amount: formatMoney(c.amount, currency),
        percentage: `${c.percentage}% of outflows`,
      })),
      cashboxDrawers: cashbox
        ? {
            usdCashDrawer: formatMoney(cashbox.USD.netCashFlow, 'USD'),
            ecoCashZiG: formatMoney(cashbox.ZWG.netCashFlow, 'ZWG'),
            randFloat: formatMoney(cashbox.ZAR.netCashFlow, 'ZAR'),
          }
        : undefined,
      activeDebts: {
        owedToBusinessCount: debts.filter((d) => d.direction === 'owed_to_business' && d.status !== 'settled').length,
        totalOwedToBusiness: formatMoney(
          debts
            .filter((d) => d.direction === 'owed_to_business' && d.status !== 'settled')
            .reduce((sum, d) => sum + (d.totalAmount - d.paidAmount), 0),
          currency
        ),
        owedByBusinessCount: debts.filter((d) => d.direction === 'owed_by_business' && d.status !== 'settled').length,
      },
      recentTransactionsSample: recentTransactions.slice(0, 8).map((tx) => ({
        date: tx.transactionDate,
        description: tx.description,
        amount: formatMoney(tx.amount, tx.currency),
        direction: tx.direction,
        category: tx.category,
        reviewStatus: tx.reviewStatus,
      })),
    };

    const userPrompt = `
MERCHANT LANGUAGE PREFERENCE: ${language} (en = English, sn = ChiShona, nd = SiNdebele)
MERCHANT QUESTION: "${trimmedQuestion}"

VERIFIED APP FINANCIAL DATA PAYLOAD:
${JSON.stringify(verifiedPayload, null, 2)}

Instructions:
1. First, check if the question is related to the merchant's business finances or tuckshop operations. If NOT, refuse politely using the designated formula in ${language}.
2. If IN SCOPE, answer directly, practically, and warmly in ${language}, strictly using the numbers in the VERIFIED APP FINANCIAL DATA PAYLOAD.
3. Keep the explanation concise (2 to 3 paragraphs maximum).
4. Provide 2-3 short bullet observations highlighting key financial facts from the data.
5. Format your output strictly as a JSON object:
{
  "answer": "Your plain-language explanation in ${language}",
  "observations": ["bullet observation 1", "bullet observation 2"]
}
Respond with pure JSON only, with no markdown code blocks or wrapping.
`;

    const url = `${this.ENDPOINT}?key=${encodeURIComponent(apiKey.trim())}`;

    const requestBody = {
      system_instruction: {
        parts: [{ text: CASHFLOW_MATE_GUARDRAIL_RULES }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1200,
        responseMimeType: 'application/json',
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 16000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!rawText) {
        throw new Error('Empty response received from Gemini AI.');
      }

      // Clean potential JSON markdown wrapper
      const jsonStr = rawText.replace(/^```json\s*|\s*```$/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        answer: parsed.answer || rawText,
        observations: Array.isArray(parsed.observations) ? parsed.observations : [],
        source: 'gemini_flash',
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Gemini API request timed out after 16 seconds.');
      }
      throw err;
    }
  }
}
