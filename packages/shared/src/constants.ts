import { CategoryDefinition, CategoryKey } from './types';

export const STANDARD_CATEGORIES: Record<CategoryKey, CategoryDefinition> = {
  sales_goods: {
    key: 'sales_goods',
    label: 'Sales of Goods',
    defaultType: 'business_income',
    direction: 'inflow',
    iconName: 'ShoppingBag',
    description: 'Income from selling merchandise, groceries, clothing, or manufactured items.'
  },
  service_fee: {
    key: 'service_fee',
    label: 'Service Income',
    defaultType: 'business_income',
    direction: 'inflow',
    iconName: 'Wrench',
    description: 'Payments received for manual labor, repair work, haircutting, tailoring, or services.'
  },
  stock_purchase: {
    key: 'stock_purchase',
    label: 'Stock / Inventory Purchase',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'PackagePlus',
    description: 'Purchases of merchandise, raw materials, or stock for resale.'
  },
  rent: {
    key: 'rent',
    label: 'Stall / Shop Rent',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'Home',
    description: 'Rent paid for retail space, market stall, storage table, or kiosk.'
  },
  transport_fuel: {
    key: 'transport_fuel',
    label: 'Transport & Commute / Fuel',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'Truck',
    description: 'Kombi fares, fuel, haulage, delivery logistics, or runner fees.'
  },
  utilities_electricity: {
    key: 'utilities_electricity',
    label: 'Utilities & ZETDC Tokens',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'Zap',
    description: 'Electricity tokens (ZETDC), municipal water, market clean-up rates, or gas.'
  },
  mobile_money_fees: {
    key: 'mobile_money_fees',
    label: 'Mobile Money & Bank Fees',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'CreditCard',
    description: 'EcoCash, InnBucks, OneMoney cash-out fees, IMTT 2% levy, and bank charges.'
  },
  wages_labor: {
    key: 'wages_labor',
    label: 'Staff Wages & Casual Labor',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'Users',
    description: 'Daily payouts to assistants, shopkeepers, loaders, or security.'
  },
  packaging: {
    key: 'packaging',
    label: 'Packaging & Plastic Bags',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'Box',
    description: 'Plastics, carriers, boxes, wrapping paper, or receipt rolls.'
  },
  equipment_repair: {
    key: 'equipment_repair',
    label: 'Repairs & Tool Maintenance',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'Hammer',
    description: 'Repairs to solar invertor, fridge, sewing machine, scale, or phone.'
  },
  owner_drawings: {
    key: 'owner_drawings',
    label: 'Personal Drawings / Family',
    defaultType: 'owner_withdrawal',
    direction: 'outflow',
    iconName: 'UserMinus',
    description: 'Cash taken out for personal food, school fees, or home needs (excluded from business expenses).'
  },
  transfer_internal: {
    key: 'transfer_internal',
    label: 'Transfer Between My Accounts',
    defaultType: 'transfer',
    direction: 'neutral',
    iconName: 'ArrowLeftRight',
    description: 'Shifting money between EcoCash, InnBucks, Cash drawer, or Bank (not income or expense).'
  },
  loan_in: {
    key: 'loan_in',
    label: 'Loan Received',
    defaultType: 'loan_received',
    direction: 'inflow',
    iconName: 'Download',
    description: 'Borrowed cash from a microfinancier, round (mukando), or friend (not sales revenue).'
  },
  loan_out: {
    key: 'loan_out',
    label: 'Loan Repayment',
    defaultType: 'loan_repayment',
    direction: 'outflow',
    iconName: 'Upload',
    description: 'Paying back borrowed money or mukando contributions (principal not business expense).'
  },
  other_income: {
    key: 'other_income',
    label: 'Other Income',
    defaultType: 'business_income',
    direction: 'inflow',
    iconName: 'PlusCircle',
    description: 'Incidental receipts not covered by other categories.'
  },
  other_expense: {
    key: 'other_expense',
    label: 'Other Expense',
    defaultType: 'business_expense',
    direction: 'outflow',
    iconName: 'MinusCircle',
    description: 'Miscellaneous business payments.'
  },
  uncategorized: {
    key: 'uncategorized',
    label: 'Uncategorized (Needs Review)',
    defaultType: 'unknown',
    direction: 'neutral',
    iconName: 'HelpCircle',
    description: 'Transactions waiting for user confirmation or clarification.'
  }
};
