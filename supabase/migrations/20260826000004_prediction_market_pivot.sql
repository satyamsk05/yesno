-- SQL Migration: Pivot database schema to time-bound predictions

-- 1. Drop old tables if they exist
drop table if exists public.positions cascade;
drop table if exists public.transactions cascade;
drop table if exists public.markets cascade;

-- 2. Create public.bets table (user-specific predictions)
create table public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  timeframe text not null, -- e.g. '1m', '2m', '3m', '5m', '10m', '15m', '30m', '1h'
  prediction text not null check (prediction in ('up', 'down')),
  amount numeric not null check (amount > 0),
  entry_price numeric not null check (entry_price > 0),
  resolve_time timestamptz not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  exit_price numeric,
  result text check (result in ('win', 'loss', 'draw')),
  payout numeric check (payout >= 0),
  created_at timestamptz not null default now()
);

-- 3. Create public.transactions table (INR wallet transactions ledger)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  type text not null check (type in ('deposit', 'withdrawal', 'bet_placement', 'bet_resolution')),
  amount numeric not null, -- Positive for deposits/resolutions, negative for withdrawals/placements
  reference_id uuid, -- Reference to the bet ID if applicable
  created_at timestamptz not null default now()
);

-- 4. Enable Row Level Security (RLS) on new tables
alter table public.bets enable row level security;
alter table public.transactions enable row level security;

-- (No public client RLS policies are needed for bets/transactions as they are private server-managed operations)

-- 5. Stored Procedure: Place Bet atomically
create or replace function public.place_bet(
  user_id_param text,
  timeframe_param text,
  prediction_param text,
  amount_param numeric,
  entry_price_param numeric,
  resolve_time_param timestamptz
)
returns uuid as $$
declare
  current_balance numeric;
  new_bet_id uuid;
begin
  -- Lock user record to prevent race conditions
  select balance into current_balance
  from public.users
  where id = user_id_param
  for update;

  if current_balance is null then
    raise exception 'User profile not found';
  end if;

  if current_balance < amount_param then
    raise exception 'Insufficient balance';
  end if;

  -- Deduct user balance
  update public.users
  set balance = balance - amount_param
  where id = user_id_param;

  -- Create bet ID
  new_bet_id := gen_random_uuid();

  -- Insert bet record
  insert into public.bets (id, user_id, timeframe, prediction, amount, entry_price, resolve_time)
  values (new_bet_id, user_id_param, timeframe_param, prediction_param, amount_param, entry_price_param, resolve_time_param);

  -- Insert transaction ledger record (negative value indicating placement)
  insert into public.transactions (user_id, type, amount, reference_id)
  values (user_id_param, 'bet_placement', -amount_param, new_bet_id);

  return new_bet_id;
end;
$$ language plpgsql security definer;

-- 6. Stored Procedure: Resolve Bet atomically
create or replace function public.resolve_bet(
  bet_id_param uuid,
  exit_price_param numeric,
  result_param text,
  payout_param numeric
)
returns void as $$
declare
  target_user_id text;
  bet_status text;
begin
  -- Lock bet record and fetch status + user reference
  select user_id, status into target_user_id, bet_status
  from public.bets
  where id = bet_id_param
  for update;

  if bet_status is null then
    raise exception 'Bet record not found';
  end if;

  if bet_status != 'open' then
    raise exception 'Bet is already resolved';
  end if;

  -- Update bet status
  update public.bets
  set status = 'resolved',
      exit_price = exit_price_param,
      result = result_param,
      payout = payout_param
  where id = bet_id_param;

  -- Credit user balance and insert transaction record if there is a payout
  if payout_param > 0 then
    -- Lock and update user balance
    update public.users
    set balance = balance + payout_param
    where id = target_user_id;

    -- Insert transaction ledger record
    insert into public.transactions (user_id, type, amount, reference_id)
    values (target_user_id, 'bet_resolution', payout_param, bet_id_param);
  end if;
end;
$$ language plpgsql security definer;
