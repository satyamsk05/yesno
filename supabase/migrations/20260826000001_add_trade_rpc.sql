-- SQL Migration: Add execute_trade RPC function and Seed Prediction Markets

-- Postgres RPC function to atomically execute trades
create or replace function public.execute_trade(
  market_id_param uuid,
  user_id_param uuid,
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
  -- 0. Security validation: Ensure calling user is editing their own record
  if auth.uid() != user_id_param then
    raise exception 'Unauthorized: Cannot execute trade on behalf of another user';
  end if;

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
    calculated_odds := 50;
  else
    if side_param = 'yes' then
      calculated_odds := round((yes_vol / total_vol) * 100);
    else
      calculated_odds := round((no_vol / total_vol) * 100);
    end if;
    
    -- Clamp odds between 1 and 99 cents
    if calculated_odds < 1 then
      calculated_odds := 1;
    elsif calculated_odds > 99 then
      calculated_odds := 99;
    end if;
  end if;

  -- 4. Deduct user balance
  update public.users
  set balance = balance - amount_param
  where id = user_id_param;

  -- 5. Insert position record
  insert into public.positions (user_id, market_id, side, amount, odds_at_entry)
  values (user_id_param, market_id_param, side_param, amount_param, calculated_odds)
  returning id into new_position_id;

  -- 6. Insert transaction ledger record
  insert into public.transactions (user_id, type, amount, reference_id)
  values (user_id_param, 'buy_' || side_param, -amount_param, new_position_id);

  return new_position_id;
end;
$$ language plpgsql security definer;

-- Seed prediction markets
insert into public.markets (title, asset, target_price, direction, resolve_at, status)
values 
  ('Will BTC resolve above $97,000.00 by tomorrow?', 'BTC', 97000.00, 'above', now() + interval '24 hours', 'open'),
  ('Will BTC resolve below $95,000.00 by tomorrow?', 'BTC', 95000.00, 'below', now() + interval '24 hours', 'open'),
  ('Will BTC resolve above $100,000.00 in 3 days?', 'BTC', 100000.00, 'above', now() + interval '72 hours', 'open');
