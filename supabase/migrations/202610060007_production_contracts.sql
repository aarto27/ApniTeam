-- Production contracts: settlement, withdrawals, notifications and admin audit.

create table if not exists public.contest_prizes (
  contest_id uuid not null references public.contests(id) on delete cascade,
  rank_from integer not null,
  rank_to integer not null,
  amount numeric(14,2) not null,
  primary key (contest_id, rank_from),
  check (rank_from > 0 and rank_to >= rank_from and amount >= 0)
);

create table if not exists public.contest_settlements (
  contest_id uuid primary key references public.contests(id) on delete cascade,
  settled_at timestamptz not null default now(),
  settled_by uuid references auth.users(id),
  status text not null default 'completed'
);

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'pending',
  payout_method jsonb not null default '{}'::jsonb,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.contest_prizes enable row level security;
alter table public.contest_settlements enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists contest_prizes_read on public.contest_prizes;
create policy contest_prizes_read on public.contest_prizes for select to authenticated using (true);

drop policy if exists settlements_read on public.contest_settlements;
create policy settlements_read on public.contest_settlements for select to authenticated using (true);

drop policy if exists withdrawals_self_read on public.withdrawal_requests;
create policy withdrawals_self_read on public.withdrawal_requests for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_self_read on public.notifications;
create policy notifications_self_read on public.notifications for select to authenticated using (user_id = auth.uid());

drop policy if exists push_tokens_self_read on public.push_tokens;
create policy push_tokens_self_read on public.push_tokens for select to authenticated using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt()->'app_metadata'->>'role') in ('admin','super_admin')
    or (auth.jwt()->'user_metadata'->>'role') in ('admin','super_admin'),
    false
  );
$$;

create or replace function public.settle_contest(p_contest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_id uuid;
  v_rank integer;
  v_amount numeric;
  v_user uuid;
  v_count integer;
begin
  select c.match_id into v_match_id
  from public.contests c
  where c.id = p_contest_id
  for update;

  if not found then raise exception 'contest_not_found'; end if;

  if exists (select 1 from public.contest_settlements where contest_id = p_contest_id) then
    return false;
  end if;

  if not exists (
    select 1 from public.matches
    where id = v_match_id and status in ('completed','settled')
  ) then
    raise exception 'match_not_completed';
  end if;

  select count(*) into v_count
  from public.contest_entries
  where contest_id = p_contest_id;

  if v_count = 0 then
    insert into public.contest_settlements(contest_id, settled_by) values (p_contest_id, auth.uid());
    return true;
  end if;

  for v_rank, v_amount in
    select rank_from, amount
    from public.contest_prizes
    where contest_id = p_contest_id
    order by rank_from
  loop
    for v_user in
      select ce.user_id
      from public.contest_entries ce
      where ce.contest_id = p_contest_id and ce.rank between v_rank and (
        select rank_to from public.contest_prizes
        where contest_id = p_contest_id and rank_from = v_rank
      )
    loop
      perform public.credit_wallet(
        v_user,
        v_amount,
        'winnings',
        p_contest_id::text,
        'settlement:' || p_contest_id::text || ':' || v_rank::text || ':' || v_user::text,
        jsonb_build_object('contest_id', p_contest_id, 'rank', v_rank)
      );
    end loop;
  end loop;

  insert into public.contest_settlements(contest_id, settled_by)
  values (p_contest_id, auth.uid());

  update public.contests set status = 'settled' where id = p_contest_id;
  return true;
end;
$$;

create or replace function public.request_withdrawal(
  p_amount numeric,
  p_payout_method jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_balance numeric;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if p_amount < 100 then raise exception 'minimum_withdrawal_100'; end if;

  select balance into v_balance
  from public.wallets
  where user_id = v_user
  for update;

  if coalesce(v_balance, 0) < p_amount then raise exception 'insufficient_balance'; end if;

  perform public.debit_wallet(
    v_user,
    p_amount,
    'withdrawal_hold',
    null,
    'withdrawal:' || gen_random_uuid()::text,
    jsonb_build_object('payout_method', p_payout_method)
  );

  insert into public.withdrawal_requests(user_id, amount, payout_method)
  values (v_user, p_amount, coalesce(p_payout_method, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.resolve_withdrawal(
  p_withdrawal_id uuid,
  p_status text,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_amount numeric;
  v_old_status text;
begin
  if not public.is_admin() then raise exception 'admin_required'; end if;
  if p_status not in ('approved','rejected','paid') then raise exception 'invalid_withdrawal_status'; end if;

  select user_id, amount, status into v_user, v_amount, v_old_status
  from public.withdrawal_requests
  where id = p_withdrawal_id
  for update;

  if not found then raise exception 'withdrawal_not_found'; end if;
  if v_old_status not in ('pending','approved') then raise exception 'withdrawal_already_resolved'; end if;

  update public.withdrawal_requests
  set status = p_status, admin_note = p_admin_note, updated_at = now()
  where id = p_withdrawal_id;

  insert into public.admin_audit_log(admin_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'resolve_withdrawal', 'withdrawal', p_withdrawal_id::text,
    jsonb_build_object('status', p_status, 'amount', v_amount, 'user_id', v_user)
  );
end;
$$;

create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.push_tokens(user_id, token, platform, updated_at)
  values (auth.uid(), p_token, p_platform, now())
  on conflict (user_id, token) do update
  set platform = excluded.platform, updated_at = now();
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notifications
  set read_at = now()
  where id = p_notification_id and user_id = auth.uid();
$$;

revoke all on function public.settle_contest(uuid) from public;
revoke all on function public.request_withdrawal(numeric,jsonb) from public;
revoke all on function public.resolve_withdrawal(uuid,text,text) from public;
revoke all on function public.register_push_token(text,text) from public;
revoke all on function public.mark_notification_read(uuid) from public;

grant execute on function public.settle_contest(uuid) to service_role;
grant execute on function public.request_withdrawal(numeric,jsonb) to authenticated;
grant execute on function public.resolve_withdrawal(uuid,text,text) to authenticated;
grant execute on function public.register_push_token(text,text) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
