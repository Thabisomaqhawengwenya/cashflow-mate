import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import {
  Settings,
  Store,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { business, user, isDemo, theme, toggleTheme, logout, refreshProfile } = useAuth();
  const [name, setName] = useState<string>(business?.name || '');
  const [businessType, setBusinessType] = useState<string>(business?.businessType || 'tuckshop');
  const [currency, setCurrency] = useState<string>(business?.currency || 'USD');
  const [language, setLanguage] = useState<string>(business?.preferredLanguage || 'en');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [resettingDemo, setResettingDemo] = useState<boolean>(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await api.updateBusiness({
        name,
        businessType,
        currency,
        country: 'ZW',
        preferredLanguage: language
      });
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update business profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('This will reset the demo business back to the original synthetic tuckshop records. Continue?')) return;
    setResettingDemo(true);
    try {
      await api.resetDemoData();
      await refreshProfile();
      alert('Demo dataset successfully restored to original records.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo dataset');
    } finally {
      setResettingDemo(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-md-outline-variant/30">
        <h1 className="text-xl sm:text-2xl font-bold text-md-on-surface">Settings & Business Profile</h1>
        <p className="text-xs text-md-on-surface-variant mt-0.5">
          Configure reporting currency, business preferences, and account controls.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-lg bg-finance-inflow-container text-finance-inflow text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>Business settings saved successfully.</span>
        </div>
      )}

      {/* Business Details Form */}
      <Card variant="elevated" shape="lg" padding="md">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-md-outline-variant/30">
          <Store size={18} className="text-md-primary" />
          <h2 className="text-sm font-bold text-md-on-surface">Business Information</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Business Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Business Category / Type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            options={[
              { value: 'tuckshop', label: 'Tuckshop / Grocery Store' },
              { value: 'market_vendor', label: 'Informal Market Stall / Vendor' },
              { value: 'clothing_stall', label: 'Clothing & Second-Hand Apparel' },
              { value: 'food_vendor', label: 'Food Stall / Fast Food' },
              { value: 'service', label: 'Independent Service Provider / Repair' },
              { value: 'retail', label: 'General Retailer' }
            ]}
          />

          <Select
            label="Default Reporting Currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            helperText="Amounts in different currencies are never summed without explicit conversion."
            options={[
              { value: 'USD', label: 'United States Dollar (USD)' },
              { value: 'ZWG', label: 'Zimbabwe Gold (ZiG)' },
              { value: 'ZAR', label: 'South African Rand (ZAR)' }
            ]}
          />

          <Select
            label="Language Preference"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: 'en', label: 'English' },
              { value: 'sn', label: 'ChiShona (Shona)' },
              { value: 'nd', label: 'isiNdebele (Ndebele)' }
            ]}
          />

          <div className="flex justify-end pt-2">
            <Button variant="filled" size="md" type="submit" isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Appearance & Theme */}
      <Card variant="elevated" shape="lg" padding="md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-md-on-surface">Theme & Appearance</h3>
            <span className="text-xs text-md-on-surface-variant">
              Switch between Material 3 Light and Dark Expressive themes
            </span>
          </div>
          <Button
            variant="tonal"
            size="sm"
            onClick={toggleTheme}
            icon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          >
            {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          </Button>
        </div>
      </Card>

      {/* Demo Reset (If in demo mode) */}
      {isDemo && (
        <Card variant="elevated" shape="lg" padding="md" className="border border-md-primary/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="primary" size="sm">Demo Environment</Badge>
                <h3 className="text-sm font-bold text-md-on-surface">Reset Synthetic Data</h3>
              </div>
              <p className="text-xs text-md-on-surface-variant max-w-md">
                Reset all sample transactions, debts, and categories back to the default Harare tuckshop demo dataset.
              </p>
            </div>
            <Button
              variant="outlined"
              size="sm"
              onClick={handleResetDemo}
              isLoading={resettingDemo}
              icon={<RefreshCw size={14} />}
            >
              Reset Demo
            </Button>
          </div>
        </Card>
      )}

      {/* Account Session & Privacy */}
      <Card variant="elevated" shape="lg" padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-md-on-surface">Account Session</h3>
            <span className="text-xs text-md-on-surface-variant">
              Signed in as: <strong className="text-md-on-surface">{user?.email}</strong>
            </span>
          </div>
          <Button
            variant="text"
            size="sm"
            onClick={logout}
            className="text-md-error hover:bg-md-error/10"
            icon={<LogOut size={15} />}
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};
