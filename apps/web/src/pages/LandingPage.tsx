import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Store,
  HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, register, startDemo, isLoading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      setAuthMode(null);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-md-surface text-md-on-surface flex flex-col">
      {/* Top Header */}
      <header className="border-b border-md-outline-variant/30 sticky top-0 bg-md-surface/90 backdrop-blur-md z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-md-primary flex items-center justify-center text-md-on-primary font-bold shadow-xs">
            CM
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-md-on-surface">CashFlow Mate</span>
            <span className="text-[10px] block text-md-on-surface-variant font-medium">Zimbabwe</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="text" size="sm" onClick={() => setAuthMode('login')}>
            Sign In
          </Button>
          <Button variant="tonal" size="sm" onClick={startDemo} isLoading={isLoading}>
            Explore Demo
          </Button>
          <Button variant="filled" size="sm" onClick={() => setAuthMode('register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-8 pt-12 pb-16 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-md-primary-container text-md-on-primary-container text-xs font-semibold mb-6">
          <Sparkles size={14} className="text-md-primary" />
          <span>AI-Powered Financial Record Assistant for Small Traders</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-md-on-surface max-w-3xl leading-tight">
          Know where your business money goes.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-md-on-surface-variant max-w-2xl leading-relaxed">
          Bring your transaction records together, understand your spending, and track your business cash flow without complicated spreadsheets or accounting jargon.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Button
            variant="filled"
            size="lg"
            onClick={() => setAuthMode('register')}
            className="px-8 shadow-md"
            icon={<ArrowRight size={18} />}
          >
            Get Started Free
          </Button>
          <Button
            variant="tonal"
            size="lg"
            onClick={startDemo}
            isLoading={isLoading}
            className="px-8"
          >
            Explore Live Demo
          </Button>
        </div>

        {/* Realistic Product Preview Mockup */}
        <div className="mt-12 w-full max-w-4xl bg-md-surface-container rounded-2xl border border-md-outline-variant/40 p-4 sm:p-6 shadow-xl text-left">
          <div className="flex items-center justify-between pb-4 border-b border-md-outline-variant/30 mb-4">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-md-primary" />
              <span className="font-semibold text-sm text-md-on-surface">Mbare Fresh Produce & Tuckshop</span>
              <Badge variant="primary" size="sm">October 2026</Badge>
            </div>
            <span className="text-xs text-md-on-surface-variant font-medium">Currency: USD</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 bg-md-surface-container-lowest rounded-lg border border-md-outline-variant/20">
              <span className="text-[11px] text-md-on-surface-variant block font-medium">Recorded Inflows</span>
              <span className="text-lg font-bold text-finance-inflow tabular-nums">$626.00</span>
            </div>
            <div className="p-3 bg-md-surface-container-lowest rounded-lg border border-md-outline-variant/20">
              <span className="text-[11px] text-md-on-surface-variant block font-medium">Recorded Outflows</span>
              <span className="text-lg font-bold text-finance-outflow tabular-nums">$327.30</span>
            </div>
            <div className="p-3 bg-md-surface-container-lowest rounded-lg border border-md-outline-variant/20">
              <span className="text-[11px] text-md-on-surface-variant block font-medium">Net Cash Flow</span>
              <span className="text-lg font-bold text-md-primary tabular-nums">+$298.70</span>
            </div>
            <div className="p-3 bg-md-surface-container-lowest rounded-lg border border-md-outline-variant/20">
              <span className="text-[11px] text-md-on-surface-variant block font-medium">Estimated Profit</span>
              <span className="text-lg font-bold text-md-tertiary tabular-nums">$228.70</span>
            </div>
          </div>

          <div className="p-3.5 bg-md-primary-container/40 rounded-lg border border-md-primary/20 flex items-start gap-3">
            <Sparkles size={18} className="text-md-primary shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-md-on-surface">
              <strong className="font-semibold text-md-primary block mb-0.5">AI Grounded Insight:</strong>
              Your bread and grocery sales generated $476.00. Wholesale stock purchases from Bakers Inn and Probrands accounted for 44% of expenses. You have 1 uncategorized transaction waiting for review.
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 sm:px-8 py-16 bg-md-surface-container-low border-y border-md-outline-variant/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-md-on-surface">
              Built for how Zimbabwean business actually moves.
            </h2>
            <p className="mt-2 text-sm text-md-on-surface-variant">
              From tuckshops and clothing vendors to food stalls and independent service providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="elevated" shape="lg" padding="md">
              <div className="w-10 h-10 rounded-lg bg-md-primary-container text-md-primary flex items-center justify-center mb-4">
                <Smartphone size={20} />
              </div>
              <h3 className="font-bold text-base text-md-on-surface mb-2">Mobile Money Friendly</h3>
              <p className="text-xs text-md-on-surface-variant leading-relaxed">
                Import CSV records from EcoCash, InnBucks, Cash drawer notes, or bank statements without retyping every line.
              </p>
            </Card>

            <Card variant="elevated" shape="lg" padding="md">
              <div className="w-10 h-10 rounded-lg bg-finance-inflow-container text-finance-inflow flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="font-bold text-base text-md-on-surface mb-2">Accurate Financial Rules</h3>
              <p className="text-xs text-md-on-surface-variant leading-relaxed">
                Pure deterministic math. Moving cash between EcoCash and your cash register is never falsely recorded as sales profit or business expense.
              </p>
            </Card>

            <Card variant="elevated" shape="lg" padding="md">
              <div className="w-10 h-10 rounded-lg bg-finance-review-container text-finance-review flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="font-bold text-base text-md-on-surface mb-2">Honest AI Explanations</h3>
              <p className="text-xs text-md-on-surface-variant leading-relaxed">
                Ask questions in plain language and get answers strictly grounded in your verified numbers. No AI hallucinations.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-md-on-surface">Three simple steps</h2>
          <p className="mt-2 text-sm text-md-on-surface-variant">
            From scattered transaction slips to complete cash-flow clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-md-primary text-md-on-primary font-bold text-lg flex items-center justify-center mb-4 shadow-sm">
              1
            </div>
            <h4 className="font-bold text-sm text-md-on-surface mb-1.5">Import Transaction Records</h4>
            <p className="text-xs text-md-on-surface-variant leading-relaxed">
              Upload standard CSV statements or type transactions with our quick manual entry form.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-md-primary text-md-on-primary font-bold text-lg flex items-center justify-center mb-4 shadow-sm">
              2
            </div>
            <h4 className="font-bold text-sm text-md-on-surface mb-1.5">Review Categorized Rows</h4>
            <p className="text-xs text-md-on-surface-variant leading-relaxed">
              Our AI automatically suggests categories (stock, transport, rent, utilities) while you maintain final control.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-md-primary text-md-on-primary font-bold text-lg flex items-center justify-center mb-4 shadow-sm">
              3
            </div>
            <h4 className="font-bold text-sm text-md-on-surface mb-1.5">Understand Cash Flow</h4>
            <p className="text-xs text-md-on-surface-variant leading-relaxed">
              Track customer debts, see where your money goes, and make confident restocking decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-md-outline-variant/30 py-8 px-4 sm:px-8 bg-md-surface-container-low text-xs text-md-on-surface-variant">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-md-on-surface">CashFlow Mate</span>
            <span>&copy; {new Date().getFullYear()} — Built for Zimbabwean Traders</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("CashFlow Mate Privacy: Your transaction records are stored locally or in your encrypted private database. AI analysis only transmits sanitized descriptions."); }} className="hover:underline">
              Privacy Policy
            </a>
            <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Terms of Use: CashFlow Mate is a recordkeeping and cash-flow assistant, not a financial lending platform or bank."); }} className="hover:underline">
              Terms & Limits
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <Modal
        isOpen={authMode !== null}
        onClose={() => setAuthMode(null)}
        title={authMode === 'login' ? 'Sign In to CashFlow Mate' : 'Create Your Business Account'}
        subtitle={
          authMode === 'login'
            ? 'Enter your credentials to access your financial records'
            : 'Set up your small business in less than a minute'
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-md-error-container text-md-on-error-container text-xs font-medium">
              {error}
            </div>
          )}

          {authMode === 'register' && (
            <Input
              label="Your Name or Business Operator Name"
              type="text"
              placeholder="e.g. Tinashe Moyo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="trader@example.co.zw"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="pt-2 flex flex-col gap-2.5">
            <Button variant="filled" size="md" type="submit" isLoading={submitting} className="w-full">
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-xs text-md-primary hover:underline font-medium"
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign up free"
                  : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
