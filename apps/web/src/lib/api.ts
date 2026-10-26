import { FinancialSummary, Transaction, Debt, CurrencyCode } from '@cashflow-mate/shared';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('cashflow_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP ${response.status}: Request failed`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name?: string }) =>
    request<{ token: string; user: any; business: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any; business: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  demoLogin: () =>
    request<{ token: string; user: any; business: any }>('/auth/demo', {
      method: 'POST'
    }),

  getMe: () => request<{ user: any; business: any }>('/auth/me'),

  // Business Profile
  getBusiness: () => request<any>('/business'),
  updateBusiness: (data: any) =>
    request<any>('/business', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  resetDemoData: () =>
    request<{ success: boolean; message: string }>('/business/reset-demo', {
      method: 'POST'
    }),

  // Transactions
  getTransactions: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return request<{ total: number; transactions: Transaction[] }>(`/transactions?${query.toString()}`);
  },

  getTransactionSummary: (params: {
    periodType?: string;
    currency?: CurrencyCode;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) query.append(key, val);
    });
    return request<FinancialSummary>(`/transactions/summary?${query.toString()}`);
  },

  createTransaction: (data: any) =>
    request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateTransaction: (id: string, data: any) =>
    request<Transaction>(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  deleteTransaction: (id: string) =>
    request<{ success: boolean }>(`/transactions/${id}`, {
      method: 'DELETE'
    }),

  // Import
  previewCsv: (formData: FormData) => {
    const token = localStorage.getItem('cashflow_token');
    return fetch(`${API_BASE}/imports/preview`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || 'Failed to preview CSV');
      }
      return res.json();
    });
  },

  commitImport: (data: { filename: string; rows: any[]; skipDuplicates?: boolean }) =>
    request<{ importJobId: string; totalRows: number; importedCount: number; skippedCount: number; duplicateSkipped: number }>('/imports/commit', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // AI
  categorizeAi: (data: { description: string; amount: number; direction?: string }) =>
    request<any>('/ai/categorize', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  explainFinances: (data: { periodType?: string; question?: string; language?: string; currency?: string }) =>
    request<{ summary: FinancialSummary; answer: string; keyObservations: string[]; limitations: string }>('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Debts
  getDebts: (params: { direction?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.direction) query.append('direction', params.direction);
    if (params.status) query.append('status', params.status);
    return request<Debt[]>(`/debts?${query.toString()}`);
  },

  createDebt: (data: any) =>
    request<Debt>('/debts', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  recordDebtPayment: (id: string, paymentAmount: number) =>
    request<Debt>(`/debts/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ paymentAmount })
    }),

  deleteDebt: (id: string) =>
    request<{ success: boolean }>(`/debts/${id}`, {
      method: 'DELETE'
    })
};
