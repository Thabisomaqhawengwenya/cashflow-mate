import React from 'react';
import { useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ImportPage } from './pages/ImportPage';
import { InsightsPage } from './pages/InsightsPage';
import { DebtsPage } from './pages/DebtsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DesignSystemPreviewPage } from './pages/DesignSystemPreviewPage';

export const App: React.FC = () => {
  const { user, token, isLoading, currentTab } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-md-surface flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-md-primary flex items-center justify-center text-md-on-primary font-bold shadow-md animate-pulse">
            CM
          </div>
          <span className="text-xs font-semibold text-md-on-surface-variant">
            Loading CashFlow Mate...
          </span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <LandingPage />;
  }

  return (
    <AppShell>
      {currentTab === 'dashboard' && <DashboardPage />}
      {currentTab === 'transactions' && <TransactionsPage />}
      {currentTab === 'import' && <ImportPage />}
      {currentTab === 'insights' && <InsightsPage />}
      {currentTab === 'debts' && <DebtsPage />}
      {currentTab === 'reports' && <ReportsPage />}
      {currentTab === 'settings' && <SettingsPage />}
      {currentTab === 'design-system' && <DesignSystemPreviewPage />}
    </AppShell>
  );
};
