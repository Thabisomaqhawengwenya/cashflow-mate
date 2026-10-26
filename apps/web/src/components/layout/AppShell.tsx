import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Receipt,
  UploadCloud,
  Sparkles,
  Users,
  BarChart3,
  Settings,
  Palette,
  Sun,
  Moon,
  LogOut,
  RefreshCw,
  Store
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface NavItem {
  id: string;
  label: string;
  icon: any;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'import', label: 'Import', icon: UploadCloud },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },
  { id: 'debts', label: 'Debts & Credit', icon: Users },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'design-system', label: 'Design System', icon: Palette }
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { business, isDemo, theme, toggleTheme, currentTab, setCurrentTab, logout } = useAuth();

  return (
    <div className="min-h-screen bg-md-surface flex flex-col md:flex-row text-md-on-surface">
      {/* Desktop / Tablet Navigation Drawer */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-md-surface-container-low border-r border-md-outline-variant/30 shrink-0 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-md-outline-variant/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-md-primary flex items-center justify-center text-md-on-primary font-bold shadow-sm">
              CM
            </div>
            <div>
              <h1 className="font-bold text-base leading-tight tracking-tight text-md-on-surface">
                CashFlow Mate
              </h1>
              <p className="text-[10px] text-md-on-surface-variant font-medium">Zimbabwe Business</p>
            </div>
          </div>
        </div>

        {/* Active Business Card */}
        <div className="p-4 mx-3 my-3 bg-md-surface-container rounded-lg border border-md-outline-variant/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Store size={15} className="text-md-primary" />
            <span className="font-semibold text-xs text-md-on-surface truncate">
              {business?.name || 'Tuckshop'}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-md-on-surface-variant">
            <span>Currency: <strong className="text-md-on-surface">{business?.currency || 'USD'}</strong></span>
            {isDemo && (
              <Badge variant="primary" size="sm">Demo Mode</Badge>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-md-primary-container text-md-on-primary-container font-semibold shadow-xs'
                    : 'text-md-on-surface-variant hover:bg-md-surface-container-high hover:text-md-on-surface'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-md-primary' : 'text-md-on-surface-variant'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-md-outline-variant/30 flex items-center justify-between">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-md-on-surface-variant hover:text-md-on-surface rounded-md hover:bg-md-surface-container-high transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={logout}
            className="p-2 text-md-error hover:bg-md-error/10 rounded-md transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Mobile Header Bar */}
        <header className="md:hidden h-14 bg-md-surface-container-low px-4 flex items-center justify-between border-b border-md-outline-variant/30 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-md-primary flex items-center justify-center text-md-on-primary font-bold text-xs">
              CM
            </div>
            <div>
              <h2 className="font-bold text-sm text-md-on-surface leading-tight">CashFlow Mate</h2>
              <span className="text-[10px] text-md-on-surface-variant truncate block max-w-[150px]">
                {business?.name}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && <Badge variant="primary" size="sm">Demo</Badge>}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-md-on-surface-variant hover:bg-md-surface-container"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile Pinned Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-md-surface-container-high border-t border-md-outline-variant/30 flex items-center justify-around z-40 px-2 shadow-lg">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                isActive ? 'text-md-primary font-semibold' : 'text-md-on-surface-variant'
              }`}
            >
              <div
                className={`p-1 rounded-full transition-all ${
                  isActive ? 'bg-md-primary-container px-3' : ''
                }`}
              >
                <Icon size={19} className={isActive ? 'text-md-primary' : 'text-md-on-surface-variant'} />
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
