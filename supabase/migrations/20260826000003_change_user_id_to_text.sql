-- SQL Migration: Change users.id and user_id references to text to support Clerk IDs

-- 1. Drop legacy triggers and functions related to Supabase auth syncing
drop trigger if exists on_auth_user_created on auth.users cascade;
drop function if exists public.handle_new_user() cascade;

-- 2. Drop RLS policies that depend on the columns to be altered
drop policy if exists "Users can read own record" on public.users;
drop policy if exists "Users can update own record" on public.users;
drop policy if exists "Users can read own positions" on public.positions;
drop policy if exists "Users can insert own positions" on public.positions;
drop policy if exists "Users can update own positions" on public.positions;
drop policy if exists "Users can delete own positions" on public.positions;
drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can insert own transactions" on public.transactions;

-- 3. Drop foreign key constraints to allow column type alterations
alter table public.positions drop constraint if exists positions_user_id_fkey;
alter table public.transactions drop constraint if exists transactions_user_id_fkey;
alter table public.users drop constraint if exists users_id_fkey;

-- 4. Alter id and user_id columns from UUID to TEXT
alter table public.users alter column id type text;
alter table public.positions alter column user_id type text;
alter table public.transactions alter column user_id type text;

-- 5. Re-add foreign key constraints referencing public.users(id)
alter table public.positions
  add constraint positions_user_id_fkey
  foreign key (user_id)
  references public.users(id)
  on delete cascade;

alter table public.transactions
  add constraint transactions_user_id_fkey
  foreign key (user_id)
  references public.users(id)
  on delete cascade;

-- 6. Drop the old execute_trade RPC signature
drop function if exists public.execute_trade(uuid, uuid, text, numeric);

-- 7. Redefine execute_trade to accept user_id_param as TEXT and remove auth.uid() check
create or replace function public.execute_trade(
  market_id_param uuid,
  user_id_param text,
  side_param text,
  amount_param numeric
)
returns uuid as $$
declare
  current_balance numeric;
  market_status text;
  market_resolve timestamptz;
  yes_vol numeric;
  no_vol numeric;
  total_vol numeric;
  calculated_odds numeric;
  new_position_id uuid;
begin
  -- 1. Lock and check user balance
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

  -- 2. Check market status
  select status, resolve_at into market_status, market_resolve
  from public.markets
  where id = market_id_param
  for share;

  if market_status is null then
    raise exception 'Market not found';
  end if;

  if market_status != 'open' then
    raise exception 'Market is already resolved or closed';
  end if;

  if market_resolve <= now() then
    raise exception 'Market has expired';
  end if;

  -- 3. Calculate dynamic odds based on existing positions in this market
  select 
    coalesce(sum(amount) filter (where side = 'yes'), 0),
    coalesce(sum(amount) filter (where side = 'no'), 0)
  into yes_vol, no_vol
  from public.positions
  where market_id = market_id_param;

  total_vol := yes_vol + no_vol;

  if total_vol = 0 then
    calculated_odds := 50; -- default 50/50 odds if no positions yet
  else
    if side_param = 'yes' then
      calculated_odds := (yes_vol / total_vol) * 100;
    else
      calculated_odds := (no_vol / total_vol) * 100;
    end if;
    
    -- Clamp odds between 1¢ and 99¢
    calculated_odds := greatest(1, least(99, round(calculated_odds)));
  end if;

  -- 4. Deduct user balance
  update public.users
  set balance = balance - amount_param
  where id = user_id_param;

  -- 5. Insert position record
  new_position_id := gen_random_uuid();
  insert into public.positions (id, user_id, market_id, side, amount, odds_at_entry)
  values (new_position_id, user_id_param, market_id_param, side_param, amount_param, calculated_odds);

  -- 6. Insert transaction ledger record
  insert into public.transactions (user_id, type, amount, reference_id)
  values (user_id_param, 'bet_placement', -amount_param, new_position_id);

  return new_position_id;
end;
$$ language plpgsql security definer;
