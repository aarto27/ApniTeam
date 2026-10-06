-- ApniTeam wallet ledger.
-- All balance-changing operations should append a ledger row and update the
-- materialized wallet balance in the same transaction.

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  deposit numeric(14,2) not null default 0,
  winnings numeric(14,2) not null default 0,
  bonus numeric(14,2) not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null,
  kind text not null,
  reference_id text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists wallet_ledger_idempotency_idx
  on public.wallet_ledger(user_id, idempotency_key)
  where idempotency_key is not null;

alter table public.wallets enable row level security;
alter table public.wallet_ledger enable row level security;

drop policy if exists wallet_self_read on public.wallets;
create policy wallet_self_read on public.wallets
  for select to authenticated using (user_id = auth.uid());

drop policy if exists ledger_self_read on public.wallet_ledger;
create policy ledger_self_read on public.wallet_ledger
  for select to authenticated using (user_id = auth.uid());

create or replace function public.credit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_kind text,
  p_reference_id text default null,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount <= 0 then raise exception 'amount_must_be_positive'; end if;

  insert into public.wallets(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  if p_idempotency_key is not null and exists (
    select 1 from public.wallet_ledger
    where user_id = p_user_id and idempotency_key = p_idempotency_key
  ) then
    select balance into v_balance from public.wallets where user_id = p_user_id;
    return v_balance;
  end if;

  insert into public.wallet_ledger(user_id, amount, kind, reference_id, idempotency_key, metadata)
  values (p_user_id, p_amount, p_kind, p_reference_id, p_idempotency_key, coalesce(p_metadata, '{}'::jsonb));

  update public.wallets
  set balance = balance + p_amount,
      deposit = case when p_kind = 'deposit' then deposit + p_amount else deposit end,
      winnings = case when p_kind = 'winnings' then winnings + p_amount else winnings end,
      bonus = case when p_kind = 'bonus' then bonus + p_amount else bonus end,
      updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance;

  return v_balance;
end;
$$;

create or replace function public.debit_wallet(
  p_user_id uuid,
  p_amount numeric,
  p_kind text,
  p_reference_id text,
  p_idempotency_key text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount <= 0 then raise exception 'amount_must_be_positive'; end if;

  insert into public.wallets(user_id) values (p_user_id)
  on conflict (user_id) do nothing;

  select balance into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if p_idempotency_key is not null and exists (
    select 1 from public.wallet_ledger
    where user_id = p_user_id and idempotency_key = p_idempotency_key
  ) then
    return v_balance;
  end if;

  if v_balance < p_amount then raise exception 'insufficient_balance'; end if;

  insert into public.wallet_ledger(user_id, amount, kind, reference_id, idempotency_key, metadata)
  values (p_user_id, -p_amount, p_kind, p_reference_id, p_idempotency_key, coalesce(p_metadata, '{}'::jsonb));

  update public.wallets
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id
  returning balance into v_balance;

  return v_balance;
end;
$$;

revoke all on function public.credit_wallet(uuid,numeric,text,text,text,jsonb) from public;
revoke all on function public.debit_wallet(uuid,numeric,text,text,text,jsonb) from public;
