import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import {
  Palette,
  CheckCircle,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Plus
} from 'lucide-react';

export const DesignSystemPreviewPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testSelect, setTestSelect] = useState('one');

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-3 border-b border-md-outline-variant/30 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Palette size={22} className="text-md-primary" />
            <h1 className="text-2xl font-bold text-md-on-surface">Material 3 Expressive Design System</h1>
          </div>
          <p className="text-xs text-md-on-surface-variant mt-1">
            Component laboratory, color roles, typography scale, and responsive layout tokens.
          </p>
        </div>
        <Badge variant="primary" size="md">M3 Expressive Spec</Badge>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-md-on-surface uppercase tracking-wide">1. Core Semantic Colors</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-md-primary text-md-on-primary font-medium shadow-xs">
            <span>Primary</span>
            <span className="block text-[10px] opacity-80">--md-sys-color-primary</span>
          </div>
          <div className="p-3 rounded-lg bg-md-primary-container text-md-on-primary-container font-medium">
            <span>Primary Container</span>
            <span className="block text-[10px] opacity-80">Selected states</span>
          </div>
          <div className="p-3 rounded-lg bg-md-secondary-container text-md-on-secondary-container font-medium">
            <span>Secondary Container</span>
            <span className="block text-[10px] opacity-80">Muted badges</span>
          </div>
          <div className="p-3 rounded-lg bg-md-tertiary-container text-md-on-tertiary-container font-medium">
            <span>Tertiary Container</span>
            <span className="block text-[10px] opacity-80">Operating profit</span>
          </div>
        </div>

        <h3 className="text-xs font-bold text-md-on-surface-variant uppercase tracking-wide pt-2">Financial Semantic Tokens</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-finance-inflow-container text-finance-inflow border border-finance-inflow/20 font-semibold">
            <span>Confirmed Inflow</span>
            <span className="block text-[10px] font-normal">Customer Sales / Receipts</span>
          </div>
          <div className="p-3 rounded-lg bg-finance-outflow-container text-finance-outflow border border-finance-outflow/20 font-semibold">
            <span>Confirmed Outflow</span>
            <span className="block text-[10px] font-normal">Stock & Expenses</span>
          </div>
          <div className="p-3 rounded-lg bg-finance-neutral-container text-finance-neutral border border-finance-neutral/20 font-semibold">
            <span>Neutral Transfer</span>
            <span className="block text-[10px] font-normal">Internal Account Shift</span>
          </div>
          <div className="p-3 rounded-lg bg-finance-review-container text-finance-review border border-finance-review/20 font-semibold">
            <span>Pending Review</span>
            <span className="block text-[10px] font-normal">Needs Trader Confirmation</span>
          </div>
        </div>
      </section>

      {/* 2. Button Inventory */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-md-on-surface uppercase tracking-wide">2. Action Buttons & Variants</h2>
        <Card variant="elevated" shape="lg" padding="md">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="filled">Filled (Primary)</Button>
            <Button variant="tonal">Filled Tonal</Button>
            <Button variant="outlined">Outlined</Button>
            <Button variant="text">Text Button</Button>
            <Button variant="pill" icon={<Sparkles size={14} />}>Full Pill Capsule</Button>
            <Button variant="fab" icon={<Plus size={16} />}>FAB</Button>
            <Button variant="filled" isLoading>Loading State</Button>
          </div>
        </Card>
      </section>

      {/* 3. Badges and Chips */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-md-on-surface uppercase tracking-wide">3. Badges & Chips</h2>
        <Card variant="elevated" shape="lg" padding="md">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="inflow" icon={<ArrowDownLeft size={13} />}>+$120.00 Sales Inflow</Badge>
            <Badge variant="outflow" icon={<ArrowUpRight size={13} />}>-$55.00 Stock Outflow</Badge>
            <Badge variant="neutral">Internal Transfer</Badge>
            <Badge variant="review" icon={<AlertTriangle size={13} />}>Review Required</Badge>
            <Badge variant="flagged">Duplicate Warning</Badge>
            <Badge variant="primary">Demo Active</Badge>
          </div>
        </Card>
      </section>

      {/* 4. Form Controls */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-md-on-surface uppercase tracking-wide">4. Form Inputs & Accessibility</h2>
        <Card variant="elevated" shape="lg" padding="md" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Standard Text Field"
              placeholder="Enter merchant description..."
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              helperText="Helper message text for accessible guidance"
            />
            <Input
              label="Amount with Validation Error"
              defaultValue="-45.00"
              error="Amount cannot be negative. Select Outflow direction instead."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Accessible Dropdown"
              value={testSelect}
              onChange={(e) => setTestSelect(e.target.value)}
              options={[
                { value: 'one', label: 'Option 1: EcoCash Statement' },
                { value: 'two', label: 'Option 2: InnBucks Receipt' },
                { value: 'three', label: 'Option 3: Cash Register Till' }
              ]}
            />
            <div className="flex items-end">
              <Button variant="tonal" onClick={() => setIsModalOpen(true)} className="w-full">
                Trigger Interactive M3 Dialog
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Typography Scale Preview */}
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-md-on-surface uppercase tracking-wide">5. Typography & Tabular Numerals</h2>
        <Card variant="elevated" shape="lg" padding="md" className="space-y-3">
          <div className="text-2xl font-bold text-md-on-surface">Headline Large: Know your business numbers</div>
          <div className="text-lg font-semibold text-md-on-surface">Title Medium: Section Header</div>
          <div className="text-sm text-md-on-surface-variant">Body Medium: Financial record assistant built for informal traders in Zimbabwe.</div>
          <div className="text-xs font-mono tabular-nums text-md-primary">
            Tabular Numerals Test: $1,245.50 vs $9,800.00 vs $0.15 (Digits align perfectly in tables)
          </div>
        </Card>
      </section>

      {/* Interactive Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Material 3 Expressive Dialog"
        subtitle="Accessible modal dialog with backdrop blur and keyboard escape listener"
      >
        <div className="space-y-3 text-xs text-md-on-surface-variant leading-relaxed">
          <p>
            This modal complies with WCAG accessibility guidelines. It prevents background scrolling while open, traps keyboard focus, and responds immediately to the Escape key or close action.
          </p>
          <div className="pt-3 flex justify-end gap-2">
            <Button variant="text" size="md" onClick={() => setIsModalOpen(false)}>
              Dismiss
            </Button>
            <Button variant="filled" size="md" onClick={() => setIsModalOpen(false)}>
              Got It
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
