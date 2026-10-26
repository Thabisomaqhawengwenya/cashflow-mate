import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User, Business } from '@cashflow-mate/shared';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  token: string | null;
  isLoading: boolean;
  isDemo: boolean;
  theme: 'light' | 'dark';
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  startDemo: () => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cashflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cashflow_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('cashflow_theme', theme);
  }, [theme]);

  const refreshProfile = async () => {
    if (!token) {
      setUser(null);
      setBusiness(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setBusiness(data.business);
    } catch (err) {
      console.warn('Session expired or invalid, clearing token');
      localStorage.removeItem('cashflow_token');
      setToken(null);
      setUser(null);
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    localStorage.setItem('cashflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setBusiness(res.business);
    setCurrentTab('dashboard');
  };

  const register = async (email: string, pass: string, name?: string) => {
    const res = await api.register({ email, password: pass, name });
    localStorage.setItem('cashflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setBusiness(res.business);
    setCurrentTab('dashboard');
  };

  const startDemo = async () => {
    setIsLoading(true);
    const res = await api.demoLogin();
    localStorage.setItem('cashflow_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setBusiness(res.business);
    setCurrentTab('dashboard');
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('cashflow_token');
    setToken(null);
    setUser(null);
    setBusiness(null);
    setCurrentTab('landing');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDemo = user?.id === 'user_demo_001';

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        token,
        isLoading,
        isDemo,
        theme,
        currentTab,
        setCurrentTab,
        login,
        register,
        startDemo,
        logout,
        toggleTheme,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
