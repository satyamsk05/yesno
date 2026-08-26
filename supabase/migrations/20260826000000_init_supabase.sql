-- SQL Migration: Setup Prediction Market Database Schema

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Create public.users table (synced with auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  username text,
  balance numeric not null default 1000 check (balance >= 0),
  created_at timestamptz not null default now()
);

-- 2. Create public.markets table
create table public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  asset text not null default 'BTC',
  target_price numeric not null,
  direction text not null, -- e.g. 'above', 'below', 'up', 'down'
  resolve_at timestamptz not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  resolution_result text, -- e.g. 'yes', 'no'
  created_at timestamptz not null default now()
);

-- 3. Create public.positions table
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  side text not null check (side in ('yes', 'no')),
  amount numeric not null check (amount > 0),
  odds_at_entry numeric not null check (odds_at_entry > 0),
  created_at timestamptz not null default now()
);

-- 4. Create public.transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null, -- e.g. 'deposit', 'withdrawal', 'bet_placement', 'bet_resolution', etc.
  amount numeric not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.markets enable row level security;
alter table public.positions enable row level security;
alter table public.transactions enable row level security;

-- Row Level Security Policies

-- users policies
-- Users can read their own user record
create policy "Users can read own record" on public.users
  for select using (auth.uid() = id);

-- Users can update their own user record
create policy "Users can update own record" on public.users
  for update using (auth.uid() = id);

-- markets policies
-- Anyone (public or authenticated) can view markets
create policy "Markets are publicly readable" on public.markets
  for select using (true);

-- positions policies
-- Users can read their own positions
create policy "Users can read own positions" on public.positions
  for select using (auth.uid() = user_id);

-- Users can insert their own positions
create policy "Users can insert own positions" on public.positions
  for insert with check (auth.uid() = user_id);

-- Users can update their own positions
create policy "Users can update own positions" on public.positions
  for update using (auth.uid() = user_id);

-- Users can delete their own positions
create policy "Users can delete own positions" on public.positions
  for delete using (auth.uid() = user_id);

-- transactions policies
-- Users can read their own transactions
create policy "Users can read own transactions" on public.transactions
  for select using (auth.uid() = user_id);

-- Users can insert their own transactions
create policy "Users can insert own transactions" on public.transactions
  for insert with check (auth.uid() = user_id);

-- Trigger: Sync public.users with auth.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username, balance)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    1000
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
