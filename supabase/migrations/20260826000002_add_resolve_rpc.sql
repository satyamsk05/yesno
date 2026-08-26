-- SQL Migration: Add resolve_market RPC function for Pari-Mutuel Payouts

create or replace function public.resolve_market(
  market_id_param uuid,
  result_param text
)
returns void as $$
declare
  m_status text;
  total_pool numeric;
  winning_vol numeric;
  pos_record record;
  calculated_payout numeric;
begin
  -- 1. Lock market row and check status to prevent concurrent resolutions
  select status into m_status
  from public.markets
  where id = market_id_param
  for update;

  if m_status is null then
    raise exception 'Market not found';
  end if;

  if m_status != 'open' then
    -- Market is already resolved or closed, do nothing
    return;
  end if;

  -- 2. Update market status and outcome result
  update public.markets
  set status = 'resolved',
      resolution_result = result_param
  where id = market_id_param;

  -- 3. Calculate total pool and winning side volume
  select coalesce(sum(amount), 0) into total_pool
  from public.positions
  where market_id = market_id_param;

  select coalesce(sum(amount), 0) into winning_vol
  from public.positions
  where market_id = market_id_param and side = result_param;

  -- 4. Distribute payouts to winners using standard pari-mutuel ratio
  -- payout = (user_stake / winning_side_total) * total_pool
  if winning_vol > 0 and total_pool > 0 then
    for pos_record in
      select id, user_id, amount
      from public.positions
      where market_id = market_id_param and side = result_param
    loop
      calculated_payout := (pos_record.amount / winning_vol) * total_pool;

      -- Credit user balance
      update public.users
      set balance = balance + calculated_payout
      where id = pos_record.user_id;

      -- Insert transaction ledger record
      insert into public.transactions (user_id, type, amount, reference_id)
      values (pos_record.user_id, 'resolve_win', calculated_payout, pos_record.id);
    end loop;
  end if;
end;
$$ language plpgsql security definer;
