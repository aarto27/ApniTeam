-- Idempotent live scoring ledger.
create table if not exists public.live_scoring_events (
  event_id text primary key,
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id text not null,
  points numeric(14,3) not null,
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.match_player_scores (
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id text not null,
  points numeric(14,3) not null default 0,
  last_event_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (match_id, player_id)
);

alter table public.live_scoring_events enable row level security;
alter table public.match_player_scores enable row level security;

create index if not exists live_scoring_events_match_idx
  on public.live_scoring_events(match_id, occurred_at);

create index if not exists match_player_scores_match_idx
  on public.match_player_scores(match_id);

drop policy if exists player_scores_read_authenticated on public.match_player_scores;
create policy player_scores_read_authenticated
  on public.match_player_scores for select to authenticated using (true);

create or replace function public.recalculate_match_contest_points(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.contest_entries ce
  set points = coalesce((
    select sum(
      mps.points *
      case
        when ut.captain_id = mps.player_id then 2
        when ut.vice_captain_id = mps.player_id then 1.5
        else 1
      end
    )
    from public.match_player_scores mps
    where mps.match_id = p_match_id
      and ut.players ? mps.player_id
  ), 0),
  rank = null;

  from public.contests c
  join public.user_teams ut on ut.id = ce.team_id
  where ce.contest_id = c.id
    and c.match_id = p_match_id;

  update public.contest_leaderboard cl
  set points = ce.points,
      updated_at = now()
  from public.contest_entries ce
  where cl.entry_id = ce.id
    and ce.contest_id in (
      select id from public.contests where match_id = p_match_id
    );

  insert into public.contest_leaderboard (contest_id, entry_id, user_id, points, updated_at)
  select ce.contest_id, ce.id, ce.user_id, ce.points, now()
  from public.contest_entries ce
  where ce.contest_id in (
    select id from public.contests where match_id = p_match_id
  )
  on conflict (contest_id, entry_id) do update
    set points = excluded.points, updated_at = excluded.updated_at;

  perform public.recalculate_contest_ranks(c.id)
  from public.contests c
  where c.match_id = p_match_id;
end;
$$;

create or replace function public.record_live_player_score(
  p_event_id text,
  p_match_id uuid,
  p_player_id text,
  p_points numeric,
  p_occurred_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_id is null or trim(p_event_id) = '' then
    raise exception 'event_id_required';
  end if;

  if not exists (
    select 1 from public.match_players
    where match_id = p_match_id and player_id = p_player_id
  ) then
    raise exception 'player_not_in_match';
  end if;

  insert into public.live_scoring_events(event_id, match_id, player_id, points, occurred_at)
  values (p_event_id, p_match_id, p_player_id, p_points, p_occurred_at)
  on conflict (event_id) do nothing;

  if not found then
    return false;
  end if;

  insert into public.match_player_scores(match_id, player_id, points, last_event_at, updated_at)
  values (p_match_id, p_player_id, p_points, p_occurred_at, now())
  on conflict (match_id, player_id) do update
    set points = excluded.points,
        last_event_at = excluded.last_event_at,
        updated_at = now()
  where public.match_player_scores.last_event_at is null
     or excluded.last_event_at >= public.match_player_scores.last_event_at;

  perform public.recalculate_match_contest_points(p_match_id);
  return true;
end;
$$;

revoke all on function public.record_live_player_score(text,uuid,text,numeric,timestamptz) from public;
revoke all on function public.recalculate_match_contest_points(uuid) from public;

-- Feed workers use a server-side credential. Clients must never write scoring events.
