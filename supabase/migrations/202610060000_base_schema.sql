create extension if not exists pgcrypto;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  sport text not null default 'cricket',
  title text,
  short_title text,
  home_team text,
  away_team text,
  starts_at timestamptz not null,
  effective_starts_at timestamptz not null,
  status text not null default 'scheduled',
  provider_status text,
  toss text,
  lineup_announced boolean not null default false,
  deadline_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id text not null,
  name text not null,
  role text not null,
  team_id text,
  team_name text,
  credit numeric(6,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(match_id, player_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  team_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  name text not null,
  players jsonb not null default '[]'::jsonb,
  captain_id text,
  vice_captain_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  name text not null,
  entry_fee numeric(14,2) not null default 0,
  prize_pool numeric(14,2) not null default 0,
  total_spots integer not null,
  filled_spots integer not null default 0,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.contest_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.user_teams(id) on delete restrict,
  points numeric(14,3) not null default 0,
  rank integer,
  created_at timestamptz not null default now(),
  unique(contest_id, user_id)
);

create index if not exists matches_start_idx on public.matches(effective_starts_at);
create index if not exists match_players_match_idx on public.match_players(match_id);
create index if not exists user_teams_user_match_idx on public.user_teams(user_id, match_id);
create index if not exists contests_match_idx on public.contests(match_id);
create index if not exists entries_contest_idx on public.contest_entries(contest_id);

alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.profiles enable row level security;
alter table public.user_teams enable row level security;
alter table public.contests enable row level security;
alter table public.contest_entries enable row level security;

drop policy if exists matches_read_authenticated on public.matches;
create policy matches_read_authenticated on public.matches for select to authenticated using (true);

drop policy if exists players_read_authenticated on public.match_players;
create policy players_read_authenticated on public.match_players for select to authenticated using (true);

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists profiles_self_write on public.profiles;
create policy profiles_self_write on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists teams_self_read on public.user_teams;
create policy teams_self_read on public.user_teams for select to authenticated using (user_id = auth.uid());

drop policy if exists contests_read_authenticated on public.contests;
create policy contests_read_authenticated on public.contests for select to authenticated using (true);

drop policy if exists entries_self_read on public.contest_entries;
create policy entries_self_read on public.contest_entries for select to authenticated using (user_id = auth.uid());
