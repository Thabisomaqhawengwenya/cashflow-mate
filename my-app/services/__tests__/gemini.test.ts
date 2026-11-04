import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeminiService,
  isBlatantlyOutOfScope,
  getOutOfScopeRefusal,
  CASHFLOW_MATE_GUARDRAIL_RULES,
} from '../gemini';
import { FinancialSummary } from '../storage';

// Ensure global __DEV__ is defined in test runner
(globalThis as any).__DEV__ = true;

const MOCK_SUMMARY: FinancialSummary = {
  period: 'this_month',
  periodLabel: 'This Month',
  periodStartDate: '2026-10-01',
  periodEndDate: '2026-10-31',
  currency: 'USD',
  transactionCount: 8,
  recordedInflows: 450.0,
  recordedOutflows: 310.0,
  netCashFlow: 140.0,
  estimatedOperatingProfit: 125.0,
  operatingRevenue: 450.0,
  operatingExpenses: 325.0,
  unreviewedCount: 1,
  categoryBreakdown: [
    { category: 'stock_purchase', label: 'Stock / Inventory', amount: 200.0, percentage: 65 },
    { category: 'transport_fuel', label: 'Transport & Kombi', amount: 60.0, percentage: 19 },
    { category: 'mobile_money_fees', label: 'EcoCash & Bank Fees', amount: 15.0, percentage: 5 },
  ],
};

describe('CashFlow Mate Gemini AI & Guardrails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Scope Guardrails & Interceptor', () => {
    it('detects blatantly out-of-scope queries (trivia, coding, politics, recipes)', () => {
      expect(isBlatantlyOutOfScope('Who is the president of France?')).toBe(true);
      expect(isBlatantlyOutOfScope('Write a python function to calculate fibonacci')).toBe(true);
      expect(isBlatantlyOutOfScope('What is the recipe for chicken pasta?')).toBe(true);
      expect(isBlatantlyOutOfScope('Who won the premier league match yesterday?')).toBe(true);
      expect(isBlatantlyOutOfScope('Can you write code for a website in react?')).toBe(true);
      expect(isBlatantlyOutOfScope('Tell me a joke about dogs')).toBe(true);
      expect(isBlatantlyOutOfScope('What are the symptoms and cure for malaria?')).toBe(true);
    });

    it('permits in-scope financial and tuckshop queries', () => {
      expect(isBlatantlyOutOfScope('How much profit did my tuckshop make this month?')).toBe(false);
      expect(isBlatantlyOutOfScope('What did I spend on Bakers Inn bread and stock?')).toBe(false);
      expect(isBlatantlyOutOfScope('Why is my cashflow different from my profit?')).toBe(false);
      expect(isBlatantlyOutOfScope('How much is in my EcoCash ZiG drawer?')).toBe(false);
      expect(isBlatantlyOutOfScope('What kombi transport expenses did I record?')).toBe(false);
      expect(isBlatantlyOutOfScope('Do I have any customer debts or Mukando loans?')).toBe(false);
      expect(isBlatantlyOutOfScope('What transactions still need review?')).toBe(false);
    });

    it('returns culturally grounded polite refusals in English, Shona, and Ndebele', () => {
      const en = getOutOfScopeRefusal('en');
      expect(en).toContain('strictly to your business finances');
      expect(en).toContain('CashFlow Mate AI');

      const sn = getOutOfScopeRefusal('sn');
      expect(sn).toContain('mari yebhizinesi');
      expect(sn).toContain('matransactions');

      const nd = getOutOfScopeRefusal('nd');
      expect(nd).toContain('ezemali yebhizimusi');
      expect(nd).toContain('izikwelede');
    });

    it('system guardrail instructions include mandatory boundaries and refusal rules', () => {
      expect(CASHFLOW_MATE_GUARDRAIL_RULES).toContain('PERMITTED TOPICS ONLY');
      expect(CASHFLOW_MATE_GUARDRAIL_RULES).toContain('MANDATORY REFUSAL FOR OUT-OF-SCOPE QUERIES');
      expect(CASHFLOW_MATE_GUARDRAIL_RULES).toContain('ZERO-HALLUCINATION GROUNDING');
      expect(CASHFLOW_MATE_GUARDRAIL_RULES).toContain('The 3-Drawer Cashbox (USD Cash Drawer, EcoCash ZiG Wallet, Rand Float / ZAR)');
      expect(CASHFLOW_MATE_GUARDRAIL_RULES).toContain('Bakers Inn bread crates');
    });
  });

  describe('GeminiService Client', () => {
    it('validates empty API keys when testing', async () => {
      const res = await GeminiService.testApiKey('');
      expect(res.success).toBe(false);
      expect(res.message).toContain('valid Google Gemini API key');
    });

    it('handles test key failure response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: { message: 'API_KEY_INVALID' } }),
      } as any);

      const res = await GeminiService.testApiKey('bad-key');
      expect(res.success).toBe(false);
      expect(res.message).toContain('API_KEY_INVALID');
    });

    it('handles test key success response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'PONG' }] } }] }),
      } as any);

      const res = await GeminiService.testApiKey('AIzaSyValidKey123');
      expect(res.success).toBe(true);
      expect(res.message).toContain('verified and active');
    });

    it('intercepts out-of-scope query without sending network request', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy as any;

      const res = await GeminiService.askGemini({
        apiKey: 'AIzaSyTestKey',
        question: 'Who is Napoleon Bonaparte?',
        language: 'en',
        summary: MOCK_SUMMARY,
      });

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(res.answer).toContain('strictly to your business finances');
      expect(res.source).toBe('gemini_flash');
    });

    it('makes real Gemini call with system instructions and returns parsed JSON', async () => {
      const mockGeminiJson = {
        answer: 'During This Month, your tuckshop recorded $450.00 in inflows and $310.00 in outflows.',
        observations: [
          'Largest expense was Stock / Inventory at $200.00.',
          'Operating profit is estimated at $125.00.',
        ],
      };

      globalThis.fetch = vi.fn().mockImplementation((url, opts) => {
        const body = JSON.parse(opts.body);
        expect(body.system_instruction).toBeDefined();
        expect(body.system_instruction.parts[0].text).toContain('STRICT DOMAIN & SCOPE BOUNDARY RULES');
        expect(body.generationConfig.responseMimeType).toBe('application/json');

        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: JSON.stringify(mockGeminiJson) }],
                },
              },
            ],
          }),
        });
      });

      const res = await GeminiService.askGemini({
        apiKey: 'AIzaSyTestKey123',
        question: 'How is my business doing this month?',
        language: 'en',
        summary: MOCK_SUMMARY,
      });

      expect(res.answer).toContain('$450.00 in inflows');
      expect(res.observations.length).toBe(2);
      expect(res.source).toBe('gemini_flash');
    });
  });
});
