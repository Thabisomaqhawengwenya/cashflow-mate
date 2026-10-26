import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import {
  CategoryKey,
  TransactionType,
  TransactionDirection,
  FinancialSummary,
  STANDARD_CATEGORIES
} from '@cashflow-mate/shared';

export interface AICategorizationResult {
  category: CategoryKey;
  transactionType: TransactionType;
  direction: TransactionDirection;
  confidence: number;
  reasoning: string;
}

export class AIService {
  private static geminiClient: GoogleGenerativeAI | null = null;

  private static getClient(): GoogleGenerativeAI | null {
    if (!this.geminiClient && config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return this.geminiClient;
  }

  /**
   * Proposes a category for a transaction description.
   * If Gemini API is available and online, calls Gemini with structured JSON prompt.
   * Otherwise, seamlessly falls back to the Zimbabwean merchant rule engine.
   */
  static async categorize(
    description: string,
    amount: number,
    directionHint?: TransactionDirection
  ): Promise<AICategorizationResult> {
    const client = this.getClient();

    if (client) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const categoriesList = Object.keys(STANDARD_CATEGORIES).join(', ');

        const prompt = `
You are a financial record categorization assistant for small informal traders in Zimbabwe.
Analyze this transaction description and return a JSON object with this exact structure:
{
  "category": "one_of_the_allowed_categories",
  "transactionType": "business_income" | "business_expense" | "transfer" | "loan_received" | "loan_repayment" | "owner_contribution" | "owner_withdrawal" | "unknown",
  "direction": "inflow" | "outflow" | "neutral",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation in English"
}

Allowed categories: ${categoriesList}
Direction hint: ${directionHint || 'unknown'}
Description: "${description}"
Amount: ${amount}

Respond with pure JSON only, no markdown wrapping.
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonStr = text.replace(/^```json\s*|\s*```$/g, '');
        const parsed = JSON.parse(jsonStr);

        if (STANDARD_CATEGORIES[parsed.category as CategoryKey]) {
          return {
            category: parsed.category as CategoryKey,
            transactionType: parsed.transactionType || (parsed.direction === 'inflow' ? 'business_income' : 'business_expense'),
            direction: parsed.direction || (parsed.transactionType === 'business_income' ? 'inflow' : 'outflow'),
            confidence: Math.min(Math.max(parsed.confidence || 0.8, 0.1), 1.0),
            reasoning: parsed.reasoning || 'Categorized by Gemini AI'
          };
        }
      } catch (err: any) {
        console.warn('Gemini categorization failed or offline, using rule-based fallback:', err.message);
      }
    }

    // Heuristic fallback
    return this.heuristicCategorize(description, amount, directionHint);
  }

  /**
   * Deterministic rule-based local categorization engine tailored for Zimbabwean trade patterns.
   */
  static heuristicCategorize(
    description: string,
    amount: number,
    directionHint?: TransactionDirection
  ): AICategorizationResult {
    const desc = description.toLowerCase();

    // Internal transfers between own accounts
    if (
      desc.includes('transfer to my') ||
      desc.includes('cash drawer deposit') ||
      desc.includes('float deposit') ||
      desc.includes('bank transfer to ecocash') ||
      desc.includes('shift to cash') ||
      desc.includes('internal shift')
    ) {
      return {
        category: 'transfer_internal',
        transactionType: 'transfer',
        direction: 'neutral',
        confidence: 0.95,
        reasoning: 'Recognized internal fund movement between business accounts'
      };
    }

    // Bread and bakery
    if (desc.includes('bakers inn') || desc.includes('proton') || desc.includes('loaves') || desc.includes('bread')) {
      const isWholesale = amount > 20 || desc.includes('crates') || desc.includes('logistics') || desc.includes('wholesale');
      return {
        category: isWholesale ? 'stock_purchase' : (directionHint === 'inflow' ? 'sales_goods' : 'stock_purchase'),
        transactionType: isWholesale ? 'business_expense' : (directionHint === 'inflow' ? 'business_income' : 'business_expense'),
        direction: directionHint || (isWholesale ? 'outflow' : 'inflow'),
        confidence: 0.9,
        reasoning: isWholesale ? 'Bulk bread stock purchase for resale' : 'Bread sale or retail purchase'
      };
    }

    // Groceries, Cooking oil, Milling, Mealie Meal
    if (
      desc.includes('probrands') ||
      desc.includes('national foods') ||
      desc.includes('oil') ||
      desc.includes('mealie') ||
      desc.includes('sugar') ||
      desc.includes('rice') ||
      desc.includes('flour') ||
      desc.includes('stock')
    ) {
      if (directionHint === 'inflow' || desc.includes('customer payment') || desc.includes('sales')) {
        return {
          category: 'sales_goods',
          transactionType: 'business_income',
          direction: 'inflow',
          confidence: 0.92,
          reasoning: 'Customer grocery sale receipt'
        };
      }
      return {
        category: 'stock_purchase',
        transactionType: 'business_expense',
        direction: 'outflow',
        confidence: 0.92,
        reasoning: 'Commercial stock/inventory purchase'
      };
    }

    // Transport / Kombi / Fuel
    if (
      desc.includes('kombi') ||
      desc.includes('fuel') ||
      desc.includes('total') ||
      desc.includes('zuda') ||
      desc.includes('haulage') ||
      desc.includes('transport') ||
      desc.includes('musika to stall')
    ) {
      return {
        category: 'transport_fuel',
        transactionType: 'business_expense',
        direction: 'outflow',
        confidence: 0.94,
        reasoning: 'Transport, commuter, or produce haulage expense'
      };
    }

    // Rent / City Council / Stall
    if (desc.includes('rent') || desc.includes('city council') || desc.includes('stall lease') || desc.includes('hcc-rc')) {
      return {
        category: 'rent',
        transactionType: 'business_expense',
        direction: 'outflow',
        confidence: 0.96,
        reasoning: 'Market stall or retail space rent'
      };
    }

    // Electricity / Utilities
    if (desc.includes('zetdc') || desc.includes('electricity') || desc.includes('power token') || desc.includes('water rates')) {
      return {
        category: 'utilities_electricity',
        transactionType: 'business_expense',
        direction: 'outflow',
        confidence: 0.98,
        reasoning: 'Prepaid electricity (ZETDC) or municipal utility'
      };
    }

    // Mobile Money Fees / Bank fees / IMTT
    if (desc.includes('fee') || desc.includes('imtt') || desc.includes('charge') || desc.includes('levy') || desc.includes('cashout')) {
      return {
        category: 'mobile_money_fees',
        transactionType: 'business_expense',
        direction: 'outflow',
        confidence: 0.97,
        reasoning: 'Mobile money, IMTT tax, or transaction processing fee'
      };
    }

    // Personal / Owner Drawings
    if (desc.includes('drawings') || desc.includes('home groceries') || desc.includes('school bus') || desc.includes('personal cash')) {
      return {
        category: 'owner_drawings',
        transactionType: 'owner_withdrawal',
        direction: 'outflow',
        confidence: 0.95,
        reasoning: 'Owner personal withdrawal (excluded from operating expenses)'
      };
    }

    // Mukando / Loan Received
    if (desc.includes('mukando') || desc.includes('loan received') || desc.includes('round pool') || desc.includes('borrowed')) {
      return {
        category: 'loan_in',
        transactionType: 'loan_received',
        direction: 'inflow',
        confidence: 0.91,
        reasoning: 'Loan or mukando savings cycle fund received'
      };
    }

    // Customer payments / retail sales
    if (directionHint === 'inflow' || desc.includes('customer') || desc.includes('cash sales') || desc.includes('innbucks payment') || desc.includes('ecocash merchant')) {
      return {
        category: 'sales_goods',
        transactionType: 'business_income',
        direction: 'inflow',
        confidence: 0.9,
        reasoning: 'Customer retail payment'
      };
    }

    // Default unknown / unclassified
    return {
      category: 'uncategorized',
      transactionType: directionHint === 'outflow' ? 'business_expense' : 'unknown',
      direction: directionHint || 'neutral',
      confidence: 0.4,
      reasoning: 'Unclassified transaction awaiting manual review'
    };
  }

  /**
   * Generates a plain-language financial explanation strictly grounded
   * in pre-computed deterministic summary data.
   */
  static async explainFinances(
    summary: FinancialSummary,
    question?: string,
    language: 'en' | 'sn' | 'nd' = 'en'
  ): Promise<{ answer: string; keyObservations: string[]; limitations: string }> {
    const client = this.getClient();

    // Prepare verified facts payload
    const facts = {
      periodLabel: summary.period.label,
      recordedInflows: summary.recordedInflows,
      recordedOutflows: summary.recordedOutflows,
      netCashFlow: summary.netCashFlow,
      operatingRevenue: summary.estimatedOperatingProfit.operatingRevenue,
      operatingExpenses: summary.estimatedOperatingProfit.operatingExpenses,
      estimatedProfit: summary.estimatedOperatingProfit.amount,
      unreviewedCount: summary.unreviewedCount,
      topCategories: summary.categoryBreakdown.slice(0, 4).map((c) => `${c.label}: $${c.amount} (${c.percentageOfTotal}%)`),
      comparison: summary.comparison
        ? {
            priorLabel: summary.comparison.priorLabel,
            inflowDelta: summary.comparison.inflowDelta,
            inflowPct: summary.comparison.inflowPercentageChange,
            outflowDelta: summary.comparison.outflowDelta,
            outflowPct: summary.comparison.outflowPercentageChange
          }
        : 'No prior period available'
    };

    if (client) {
      try {
        const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
You are a warm, honest, down-to-earth business assistant for a Zimbabwean small trader (tuckshop or market vendor).
You MUST follow these strict rules:
1. ONLY refer to the pre-calculated numbers in the VERIFIED FACTS below. NEVER calculate new numbers, balances, or speculate on unrecorded amounts.
2. Emphasize that "Net Cash Flow" is cash movement, whereas "Estimated Profit" excludes loans and personal drawings.
3. If unreviewed transactions exist (${summary.unreviewedCount}), remind them to review them for accurate reports.
4. Keep the explanation concise, practical, and respectful.
5. Language preference: ${language === 'sn' ? 'English with natural Shona greetings' : language === 'nd' ? 'English with natural Ndebele greetings' : 'Clear accessible English'}.

VERIFIED FACTS:
${JSON.stringify(facts, null, 2)}

USER QUESTION: "${question || 'How is my business doing this period and where did my money go?'}"

Provide your response as a JSON object:
{
  "answer": "Plain-language 2-3 paragraph explanation grounded in the facts",
  "keyObservations": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "limitations": "Disclosure on data completeness"
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const jsonStr = text.replace(/^```json\s*|\s*```$/g, '');
        const parsed = JSON.parse(jsonStr);

        return {
          answer: parsed.answer,
          keyObservations: parsed.keyObservations || [],
          limitations: parsed.limitations || summary.estimatedOperatingProfit.disclosure
        };
      } catch (err: any) {
        console.warn('Gemini explanation failed or offline, using grounded template engine:', err.message);
      }
    }

    // Deterministic grounded explanation template
    const topExpense = summary.categoryBreakdown.find((c) => c.direction === 'outflow');
    const observations: string[] = [];

    observations.push(
      `You brought in $${summary.recordedInflows.toFixed(2)} in total cash inflows and recorded $${summary.recordedOutflows.toFixed(2)} in outflows, giving a net cash flow of $${summary.netCashFlow.toFixed(2)}.`
    );

    if (topExpense) {
      observations.push(
        `Your largest expense was ${topExpense.label} at $${topExpense.amount.toFixed(2)} (${topExpense.percentageOfTotal}% of recorded outflows).`
      );
    }

    if (summary.comparison && summary.comparison.inflowDelta !== undefined) {
      const dir = summary.comparison.inflowDelta >= 0 ? 'increased' : 'decreased';
      const pctStr = summary.comparison.inflowPercentageChange !== null ? ` (${Math.abs(summary.comparison.inflowPercentageChange)}%)` : '';
      observations.push(
        `Compared to ${summary.comparison.priorLabel}, cash inflows ${dir} by $${Math.abs(summary.comparison.inflowDelta).toFixed(2)}${pctStr}.`
      );
    }

    if (summary.unreviewedCount > 0) {
      observations.push(
        `You have ${summary.unreviewedCount} transactions waiting for categorization. Reviewing them will sharpen your profit estimate.`
      );
    }

    const answer = `During ${summary.period.label}, your business recorded $${summary.recordedInflows.toFixed(2)} in cash inflows and spent $${summary.recordedOutflows.toFixed(2)}, leaving you with a net cash flow of $${summary.netCashFlow.toFixed(2)}. ${
      topExpense ? `Most of your spending was dedicated to ${topExpense.label}.` : ''
    } Your estimated operating profit is $${summary.estimatedOperatingProfit.amount.toFixed(2)}, which focuses strictly on trading sales minus day-to-day operating overhead.`;

    return {
      answer,
      keyObservations: observations,
      limitations: summary.estimatedOperatingProfit.disclosure
    };
  }
}
