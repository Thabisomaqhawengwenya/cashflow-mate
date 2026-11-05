-- ==============================================================================
-- CASHFLOW PRODUCTION SUPABASE SCHEMA MIGRATION
-- Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. PROFILES TABLE (Linked directly to Supabase Auth Users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  merchant_code text unique not null default ('CFM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10))),
  email text,
  full_name text,
  stall_name text,
  phone text,
  city text default 'Harare (CBD)',
  currency text not null default 'USD',
  starting_balance numeric not null default 0.00,
  onboarding_completed boolean not null default false,
  avatar_uri text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Security Trigger: Prevent tampering with immutable identifiers (id, merchant_code)
create or replace function public.protect_profile_immutable_fields()
returns trigger as $$
begin
  if new.id <> old.id then
    raise exception 'Security Error: Profile ID cannot be modified.';
  end if;
  if new.merchant_code is distinct from old.merchant_code then
    raise exception 'Security Error: merchant_code is an immutable internal identifier and cannot be modified.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_protect_profile_immutable_fields on public.profiles;
create trigger trg_protect_profile_immutable_fields
  before update on public.profiles
  for each row execute function public.protect_profile_immutable_fields();

-- Auto-provision profile on auth signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, merchant_code, email, full_name, stall_name, currency, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'merchant_code', 'CFM-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 10))),
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'stall_name', 'My Stall'),
    coalesce(new.raw_user_meta_data->>'currency', 'USD'),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. TRANSACTIONS TABLE
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null default current_date,
  description text not null,
  amount numeric not null check (amount > 0),
  currency text not null default 'USD',
  direction text not null check (direction in ('inflow', 'outflow', 'neutral')),
  type text not null default 'business_income',
  category text not null default 'uncategorized',
  original_reference text,
  notes text,
  review_status text not null default 'confirmed' check (review_status in ('confirmed', 'pending_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can manage own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_transactions_user_date on public.transactions(user_id, transaction_date desc);
create index if not exists idx_transactions_currency on public.transactions(user_id, currency);

-- 3. DEBTS & CUSTOMER CREDIT BOOK TABLE
create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  direction text not null check (direction in ('owed_to_business', 'owed_by_business')),
  total_amount numeric not null check (total_amount > 0),
  paid_amount numeric not null default 0.00 check (paid_amount >= 0),
  currency text not null default 'USD',
  recorded_date date not null default current_date,
  due_date date,
  status text not null default 'outstanding' check (status in ('outstanding', 'partially_paid', 'settled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.debts enable row level security;

create policy "Users can manage own debts"
  on public.debts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_debts_user_status on public.debts(user_id, status);

-- 4. INVENTORY TABLE
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sku text,
  category text not null default 'General',
  quantity integer not null default 0 check (quantity >= 0),
  min_stock_level integer not null default 5,
  unit_cost numeric not null default 0.00 check (unit_cost >= 0),
  selling_price numeric not null default 0.00 check (selling_price >= 0),
  currency text not null default 'USD',
  supplier_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.inventory enable row level security;

create policy "Users can manage own inventory"
  on public.inventory for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_inventory_user on public.inventory(user_id);

-- 5. QUOTATIONS & INVOICES TABLE
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference_number text not null,
  doc_type text not null default 'quote' check (doc_type in ('quote', 'invoice')),
  customer_name text not null,
  customer_phone text,
  currency text not null default 'USD',
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0.00 check (total_amount >= 0),
  status text not null default 'open' check (status in ('open', 'paid', 'credit')),
  due_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;

create policy "Users can manage own invoices"
  on public.invoices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_invoices_user on public.invoices(user_id);

-- 6. CONTACTS DIRECTORY TABLE
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('customer', 'supplier')),
  phone text not null,
  location text,
  preferred_currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contacts enable row level security;

create policy "Users can manage own contacts"
  on public.contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_contacts_user on public.contacts(user_id);
