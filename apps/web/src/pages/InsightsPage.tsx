import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import {
  Sparkles,
  Send,
  HelpCircle,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  PackageCheck,
  AlertCircle,
  Globe
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What did I spend the most money on this month?',
  'Why was my cash flow different from last month?',
  'How much did I spend on stock and inventory?',
  'What transactions still need my attention?',
  'Is my business cash position improving?'
];

export const InsightsPage: React.FC = () => {
  const { business } = useAuth();
  const [question, setQuestion] = useState<string>('');
  const [language, setLanguage] = useState<'en' | 'sn' | 'nd'>('en');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await api.explainFinances({
        periodType: 'this_month',
        question: q,
        language,
        currency: business?.currency || 'USD'
      });
      setResponse(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate financial explanation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-md-outline-variant/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">AI Financial Assistant</h1>
            <Badge variant="primary" size="sm">Grounded Intelligence</Badge>
          </div>
          <p className="text-xs text-md-on-surface-variant mt-0.5">
            Ask plain-language questions about your sales, spending, and cash position without accounting jargon.
          </p>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-md-surface-container rounded-lg border border-md-outline-variant/30 text-xs self-start sm:self-auto">
          <Globe size={14} className="text-md-on-surface-variant ml-1.5" />
          {[
            { id: 'en', label: 'English' },
            { id: 'sn', label: 'Shona' },
            { id: 'nd', label: 'Ndebele' }
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setLanguage(l.id as any)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                language === l.id
                  ? 'bg-md-surface-container-lowest text-md-primary font-bold shadow-xs'
                  : 'text-md-on-surface-variant hover:text-md-on-surface'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Questions Pills */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-md-on-surface-variant block">
          Quick Questions to Ask:
        </span>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((sq) => (
            <button
              key={sq}
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-md-surface-container hover:bg-md-surface-container-high border border-md-outline-variant/40 text-md-on-surface transition-all text-left active:scale-[0.98]"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Box */}
      <Card variant="elevated" shape="lg" padding="md" className="space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="e.g. How much did I spend on kombi transport and fuel this month?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="filled"
            size="md"
            type="submit"
            isLoading={isLoading}
            disabled={!question.trim()}
            icon={<Send size={15} />}
          >
            Ask
          </Button>
        </form>

        <div className="flex items-center gap-1.5 text-[11px] text-md-on-surface-variant">
          <ShieldCheck size={14} className="text-finance-inflow shrink-0" />
          <span>
            Strict Financial Grounding: Answers are calculated strictly from your recorded transactions. The AI never hallucinates numbers.
          </span>
        </div>
      </Card>

      {error && (
        <div className="p-3.5 rounded-lg bg-md-error-container text-md-on-error-container text-xs font-medium">
          {error}
        </div>
      )}

      {/* AI Explanation Result Card */}
      {response && (
        <Card variant="elevated" shape="lg" padding="lg" className="space-y-5 animate-fade-in border border-md-primary/30">
          <div className="flex items-center gap-2 pb-3 border-b border-md-outline-variant/30">
            <div className="w-8 h-8 rounded-lg bg-md-primary-container text-md-primary flex items-center justify-center">
              <Sparkles size={17} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-md-on-surface">CashFlow Intelligence Explanation</h3>
              <span className="text-[11px] text-md-on-surface-variant">
                Based on verified records for {response.summary?.period?.label}
              </span>
            </div>
          </div>

          {/* Main Plain-Language Explanation */}
          <div className="text-sm text-md-on-surface leading-relaxed whitespace-pre-line bg-md-surface-container-low p-4 rounded-xl border border-md-outline-variant/20">
            {response.answer}
          </div>

          {/* Key Verified Observations */}
          {response.keyObservations && response.keyObservations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-md-on-surface uppercase tracking-wide">
                Key Observations:
              </h4>
              <ul className="space-y-2">
                {response.keyObservations.map((obs: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-md-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-md-primary shrink-0 mt-1.5" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Completeness Limitation Notice */}
          <div className="p-3 bg-md-surface-container rounded-lg border border-md-outline-variant/30 text-[11px] text-md-on-surface-variant flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 text-md-on-surface-variant mt-0.5" />
            <div>
              <strong className="font-semibold text-md-on-surface block">Data Completeness Disclosure:</strong>
              {response.limitations ||
                'This financial explanation reflects only the transactions recorded in CashFlow Mate. Cash payments made outside the records or uncollected customer debts are not included.'}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
