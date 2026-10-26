-- Realistic Synthetic Demo Data for CashFlow Mate
-- Business: Mbare Fresh Produce & Tuckshop (Harare, Zimbabwe)
-- Currency: USD (primary) with realistic mobile money and cash flows

-- Demo User (Password is: demo1234)
INSERT OR REPLACE INTO users (id, email, password_hash, name, created_at)
VALUES (
  'user_demo_001',
  'demo@cashflowmate.co.zw',
  '$2a$10$wO38r9bT1K4yqL1N6d0Z3e9qUo3T.l8.t5cW9eF6bY2qL9yP8pL0m', -- demo1234 hashed
  'Tinashe Moyo',
  '2026-10-01T08:00:00Z'
);

-- Demo Business
INSERT OR REPLACE INTO businesses (id, user_id, name, business_type, currency, country, preferred_language, created_at)
VALUES (
  'biz_demo_001',
  'user_demo_001',
  'Mbare Fresh Produce & Tuckshop',
  'tuckshop',
  'USD',
  'ZW',
  'en',
  '2026-10-01T08:00:00Z'
);

-- Accounts
INSERT OR REPLACE INTO accounts (id, business_id, name, type, currency, created_at) VALUES
('acc_01', 'biz_demo_001', 'EcoCash Merchant (0772 458 912)', 'mobile_money', 'USD', '2026-10-01T08:00:00Z'),
('acc_02', 'biz_demo_001', 'InnBucks USD Wallet', 'mobile_money', 'USD', '2026-10-01T08:00:00Z'),
('acc_03', 'biz_demo_001', 'Tuckshop Cash Drawer', 'cash', 'USD', '2026-10-01T08:00:00Z');

-- Initial Debts / Receivables
INSERT OR REPLACE INTO debts (id, business_id, person_name, direction, total_amount, paid_amount, currency, recorded_date, due_date, status, notes, created_at) VALUES
('debt_01', 'biz_demo_001', 'Mai Panashe (Corner Stall)', 'owed_to_business', 35.00, 15.00, 'USD', '2026-10-14', '2026-10-30', 'partially_paid', 'Credit for 2x Cooking oil and sugar', '2026-10-14T09:00:00Z'),
('debt_02', 'biz_demo_001', 'Baba Kevin', 'owed_to_business', 22.50, 0.00, 'USD', '2026-10-18', '2026-10-28', 'outstanding', 'Mealie meal 10kg bag', '2026-10-18T14:30:00Z'),
('debt_03', 'biz_demo_001', 'Farai Haulage Services', 'owed_by_business', 40.00, 40.00, 'USD', '2026-10-10', '2026-10-20', 'settled', 'Vegetable crate delivery from Musika', '2026-10-10T11:00:00Z');

-- Transactions (Current Month: October 2026)
INSERT OR REPLACE INTO transactions (
  id, business_id, account_id, transaction_date, description, original_reference,
  amount, currency, direction, type, category, review_status, ai_confidence, ai_reasoning, notes, created_at, updated_at
) VALUES
('tx_01', 'biz_demo_001', 'acc_01', '2026-10-02', 'EcoCash Merchant: Customer Payment - Bread & Milk', 'MP261002.1022.B49120', 14.50, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.95, 'Identified customer payment for merchandise sales', 'Morning counter sales', '2026-10-02T10:22:00Z', '2026-10-02T10:22:00Z'),
('tx_02', 'biz_demo_001', 'acc_03', '2026-10-02', 'Cash Sales: Daily Tuckshop Counter Groceries', 'CSH-261002-01', 85.00, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.98, 'Direct cash sales from till drawer', '', '2026-10-02T18:00:00Z', '2026-10-02T18:00:00Z'),
('tx_03', 'biz_demo_001', 'acc_01', '2026-10-03', 'Bakers Inn Logistics - 50 Crates Sliced Bread', 'BP261003.0745.C18239', 55.00, 'USD', 'outflow', 'business_expense', 'stock_purchase', 'confirmed', 0.99, 'Wholesale bread inventory purchase', 'Weekly bread stock', '2026-10-03T07:45:00Z', '2026-10-03T07:45:00Z'),
('tx_04', 'biz_demo_001', 'acc_02', '2026-10-04', 'InnBucks Payment: Chicken cuts & eggs retail', 'IB-90214819', 32.00, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.92, 'Mobile money receipt from retail customer', '', '2026-10-04T12:15:00Z', '2026-10-04T12:15:00Z'),
('tx_05', 'biz_demo_001', 'acc_03', '2026-10-05', 'Kombi Transport - Mbare Musika to Stall', 'RCP-TR-051', 12.00, 'USD', 'outflow', 'business_expense', 'transport_fuel', 'confirmed', 0.94, 'Commuter transport of produce boxes', 'Produce replenishment', '2026-10-05T08:30:00Z', '2026-10-05T08:30:00Z'),
('tx_06', 'biz_demo_001', 'acc_01', '2026-10-06', 'ZETDC Prepaid Token Purchase - Stall Meter #41920', 'ZT261006.1410.E90123', 20.00, 'USD', 'outflow', 'business_expense', 'utilities_electricity', 'confirmed', 0.99, 'Utility electricity token for refrigeration', 'Refrigeration power', '2026-10-06T14:10:00Z', '2026-10-06T14:10:00Z'),
('tx_07', 'biz_demo_001', 'acc_01', '2026-10-07', 'EcoCash Merchant: Customer Groceries Payment', 'MP261007.1645.B50182', 48.50, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.96, 'Retail sales receipt via EcoCash', '', '2026-10-07T16:45:00Z', '2026-10-07T16:45:00Z'),
('tx_08', 'biz_demo_001', 'acc_03', '2026-10-08', 'Stall Rental - Harare City Council Markets October', 'HCC-RC-1008', 70.00, 'USD', 'outflow', 'business_expense', 'rent', 'confirmed', 0.98, 'Municipal stall monthly lease payment', 'October rent paid', '2026-10-08T11:00:00Z', '2026-10-08T11:00:00Z'),
('tx_09', 'biz_demo_001', 'acc_03', '2026-10-09', 'Internal Shift: Cash Drawer Deposit to EcoCash', 'TRF-0910-01', 100.00, 'USD', 'neutral', 'transfer', 'transfer_internal', 'confirmed', 1.0, 'Internal account fund rebalancing (not income or expense)', 'Deposited float', '2026-10-09T17:00:00Z', '2026-10-09T17:00:00Z'),
('tx_10', 'biz_demo_001', 'acc_01', '2026-10-10', 'EcoCash IMTT & Merchant Fee Deduction', 'EC-TXF-1010', 3.80, 'USD', 'outflow', 'business_expense', 'mobile_money_fees', 'confirmed', 0.97, 'Transaction charges and government IMTT 2% levy', '', '2026-10-10T23:59:00Z', '2026-10-10T23:59:00Z'),
('tx_11', 'biz_demo_001', 'acc_03', '2026-10-12', 'Cash Sales: Saturday Busy Market Session', 'CSH-261012-02', 140.00, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.98, 'Counter retail sales', 'Saturday peak rush', '2026-10-12T19:00:00Z', '2026-10-12T19:00:00Z'),
('tx_12', 'biz_demo_001', 'acc_02', '2026-10-13', 'Probrands Zimbabwe - 20x Cooking Oil 2L Boxes', 'IB-PB-10134', 88.00, 'USD', 'outflow', 'business_expense', 'stock_purchase', 'confirmed', 0.98, 'Inventory restocking from distributor', 'Cooking oil stock', '2026-10-13T10:15:00Z', '2026-10-13T10:15:00Z'),
('tx_13', 'biz_demo_001', 'acc_03', '2026-10-15', 'Owner Drawings: Home Groceries & Kids School Bus', 'DRW-1015-01', 30.00, 'USD', 'outflow', 'owner_withdrawal', 'owner_drawings', 'confirmed', 1.0, 'Owner personal funds withdrawal (excluded from operating expenses)', 'Tinashe home allowance', '2026-10-15T16:00:00Z', '2026-10-15T16:00:00Z'),
('tx_14', 'biz_demo_001', 'acc_03', '2026-10-16', 'Mukando Savings Club Round Contribution Received', 'MKD-1016-01', 150.00, 'USD', 'inflow', 'loan_received', 'loan_in', 'confirmed', 0.95, 'Loan / Mukando cycle pool receipt (not sales income)', 'Revolving credit pool', '2026-10-16T12:00:00Z', '2026-10-16T12:00:00Z'),
('tx_15', 'biz_demo_001', 'acc_01', '2026-10-18', 'EcoCash Payment: Sugar, Rice & Drinks', 'MP261018.1512.B81923', 64.00, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.96, 'Customer sales receipt', '', '2026-10-18T15:12:00Z', '2026-10-18T15:12:00Z'),
('tx_16', 'biz_demo_001', 'acc_03', '2026-10-20', 'Bulk Plastic Carrier Bags - 500 pack', 'RCP-PC-1020', 8.50, 'USD', 'outflow', 'business_expense', 'packaging', 'confirmed', 0.93, 'Operational packaging supplies', 'Customer carrier bags', '2026-10-20T11:45:00Z', '2026-10-20T11:45:00Z'),
('tx_17', 'biz_demo_001', 'acc_01', '2026-10-22', 'Transfer from Farai Haulage (Unidentified)', 'MP261022.0911.B99214', 25.00, 'USD', 'inflow', 'unknown', 'uncategorized', 'pending_review', 0.45, 'Unclear whether this is debt settlement or service income', 'Needs Tinashe verification', '2026-10-22T09:11:00Z', '2026-10-22T09:11:00Z'),
('tx_18', 'biz_demo_001', 'acc_03', '2026-10-24', 'Cash Sales: Friday Afternoon Weekend Rush', 'CSH-261024-03', 112.00, 'USD', 'inflow', 'business_income', 'sales_goods', 'confirmed', 0.98, 'Cash sales from retail counter', '', '2026-10-24T18:30:00Z', '2026-10-24T18:30:00Z');
