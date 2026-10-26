import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long').optional()
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const businessOnboardingSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters long'),
  businessType: z.string().min(2, 'Please select or describe your business type'),
  currency: z.enum(['USD', 'ZWG', 'ZAR']).default('USD'),
  country: z.string().default('ZW'),
  preferredLanguage: z.enum(['en', 'sn', 'nd']).default('en')
});

export const manualTransactionSchema = z.object({
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  description: z.string().min(2, 'Description must be at least 2 characters'),
  amount: z.number().positive('Amount must be greater than zero'),
  currency: z.enum(['USD', 'ZWG', 'ZAR']).default('USD'),
  direction: z.enum(['inflow', 'outflow', 'neutral']),
  type: z.enum([
    'business_income',
    'business_expense',
    'transfer',
    'loan_received',
    'loan_repayment',
    'owner_contribution',
    'owner_withdrawal',
    'refund',
    'reversal',
    'unknown'
  ]),
  category: z.string().min(1, 'Category is required'),
  accountId: z.string().optional(),
  originalReference: z.string().optional(),
  notes: z.string().optional(),
  reviewStatus: z.enum(['confirmed', 'pending_review', 'flagged']).default('confirmed')
});

export const columnMappingSchema = z.object({
  dateColumn: z.string().min(1, 'Date column is required'),
  descriptionColumn: z.string().min(1, 'Description column is required'),
  amountColumn: z.string().optional(),
  debitColumn: z.string().optional(),
  creditColumn: z.string().optional(),
  referenceColumn: z.string().optional(),
  currencyColumn: z.string().optional(),
  dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'AUTO']).default('AUTO')
});

export const aiCategorizationResponseSchema = z.object({
  category: z.string(),
  transactionType: z.enum([
    'business_income',
    'business_expense',
    'transfer',
    'loan_received',
    'loan_repayment',
    'owner_contribution',
    'owner_withdrawal',
    'refund',
    'reversal',
    'unknown'
  ]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

export const debtSchema = z.object({
  personName: z.string().min(2, 'Name of person or customer is required'),
  direction: z.enum(['owed_to_business', 'owed_by_business']),
  totalAmount: z.number().positive('Total debt amount must be greater than 0'),
  paidAmount: z.number().min(0).default(0),
  currency: z.enum(['USD', 'ZWG', 'ZAR']).default('USD'),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  notes: z.string().optional()
});

export const debtPaymentSchema = z.object({
  paymentAmount: z.number().positive('Payment amount must be greater than 0')
});
