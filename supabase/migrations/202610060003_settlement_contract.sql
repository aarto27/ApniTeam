-- Settlement contract. Provider ingestion and payout policy should call this
-- only after the match is conclusively completed.
create table if not exists public.contest_leaderboard (
  contest_id uuid not null,
  entry_id uuid not null,
  user_id uuid not null,
  points numeric(14,3) not null default 0,
  rank integer,
  updated_at timestamptz not null default now(),
  primary key (contest_id, entry_id)
);

alter table public.contest_leaderboard enable row level security;

drop policy if exists leaderboard_read on public.contest_leaderboard;
create policy leaderboard_read on public.contest_leaderboard
  for select to authenticated using (true);

create or replace function public.recalculate_contest_ranks(p_contest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  with ranked as (
    select entry_id,
           dense_rank() over (order by points desc) as calculated_rank
    from public.contest_leaderboard
    where contest_id = p_contest_id
  )
  update public.contest_leaderboard l
  set rank = r.calculated_rank, updated_at = now()
  from ranked r
  where l.contest_id = p_contest_id and l.entry_id = r.entry_id;

  update public.contest_entries ce
  set rank = r.calculated_rank
  from ranked r
  where ce.contest_id = p_contest_id and ce.id = r.entry_id;
end;
$$;

revoke all on function public.recalculate_contest_ranks(uuid) from public;
