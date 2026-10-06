-- Team lifecycle hardening.
-- Team create/edit is closed by the same server-side deadline/effective-start
-- contract used by contest joins.

create or replace function public.validate_fantasy_team_selection(
  p_match_id uuid,
  p_player_ids text[],
  p_captain_id text,
  p_vice_captain_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sport text;
  v_unique_count integer;
begin
  if p_player_ids is null or cardinality(p_player_ids) <> 11 then
    raise exception 'exactly_11_players_required';
  end if;

  if p_captain_id is null or p_vice_captain_id is null or p_captain_id = p_vice_captain_id then
    raise exception 'invalid_captain_selection';
  end if;

  if not (p_captain_id = any(p_player_ids) and p_vice_captain_id = any(p_player_ids)) then
    raise exception 'captain_must_be_selected';
  end if;

  select m.sport into v_sport from public.matches m where m.id = p_match_id;
  if not found then raise exception 'match_not_found'; end if;

  select count(distinct mp.player_id) into v_unique_count
  from public.match_players mp
  where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids);

  if v_unique_count <> 11 then raise exception 'invalid_player_selection'; end if;

  if v_sport = 'football' then
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'GK') <> 1 then raise exception 'invalid_goalkeeper_count'; end if;
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'DEF') not between 3 and 5 then raise exception 'invalid_defender_count'; end if;
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'MID') not between 3 and 5 then raise exception 'invalid_midfielder_count'; end if;
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'ST') not between 1 and 3 then raise exception 'invalid_striker_count'; end if;
  else
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'WK') not between 1 and 4 then raise exception 'invalid_wicketkeeper_count'; end if;
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'BAT') not between 3 and 6 then raise exception 'invalid_batter_count'; end if;
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'AR') not between 1 and 4 then raise exception 'invalid_allrounder_count'; end if;
    if (select count(*) from public.match_players mp where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids) and mp.role = 'BOWL') not between 3 and 6 then raise exception 'invalid_bowler_count'; end if;
  end if;

  if (select max(team_count) from (
      select mp.team_id, count(*) as team_count
      from public.match_players mp
      where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids)
      group by mp.team_id
    ) grouped) > 7 then
    raise exception 'too_many_players_from_one_team';
  end if;
end;
$$;

create or replace function public.save_fantasy_team(
  p_match_id uuid,
  p_team_name text,
  p_player_ids text[],
  p_captain_id text,
  p_vice_captain_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_team_id uuid;
  v_effective_start timestamptz;
  v_deadline timestamptz;
  v_status text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if coalesce(trim(p_team_name), '') = '' then raise exception 'team_name_required'; end if;

  select m.effective_starts_at, m.deadline_at, m.status
    into v_effective_start, v_deadline, v_status
  from public.matches m
  where m.id = p_match_id
  for share;

  if not found then raise exception 'match_not_found'; end if;
  if v_status in ('completed', 'cancelled') then raise exception 'match_closed'; end if;
  if v_deadline is not null and now() >= v_deadline then raise exception 'deadline_passed'; end if;
  if v_effective_start is not null and now() >= v_effective_start then raise exception 'match_started'; end if;

  perform public.validate_fantasy_team_selection(
    p_match_id, p_player_ids, p_captain_id, p_vice_captain_id
  );

  insert into public.user_teams (
    user_id, match_id, name, players, captain_id, vice_captain_id, updated_at
  )
  values (
    v_user, p_match_id, trim(p_team_name),
    to_jsonb(p_player_ids), p_captain_id, p_vice_captain_id, now()
  )
  returning id into v_team_id;

  return v_team_id;
end;
$$;

create or replace function public.update_fantasy_team(
  p_team_id uuid,
  p_team_name text,
  p_player_ids text[],
  p_captain_id text,
  p_vice_captain_id text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_match_id uuid;
  v_effective_start timestamptz;
  v_deadline timestamptz;
  v_status text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if coalesce(trim(p_team_name), '') = '' then raise exception 'team_name_required'; end if;

  select t.match_id into v_match_id
  from public.user_teams t
  where t.id = p_team_id and t.user_id = v_user
  for update;

  if not found then raise exception 'team_not_owned'; end if;

  select m.effective_starts_at, m.deadline_at, m.status
    into v_effective_start, v_deadline, v_status
  from public.matches m
  where m.id = v_match_id
  for share;

  if not found then raise exception 'match_not_found'; end if;
  if v_status in ('completed', 'cancelled') then raise exception 'match_closed'; end if;
  if v_deadline is not null and now() >= v_deadline then raise exception 'deadline_passed'; end if;
  if v_effective_start is not null and now() >= v_effective_start then raise exception 'match_started'; end if;

  perform public.validate_fantasy_team_selection(
    v_match_id, p_player_ids, p_captain_id, p_vice_captain_id
  );

  update public.user_teams
  set name = trim(p_team_name),
      players = to_jsonb(p_player_ids),
      captain_id = p_captain_id,
      vice_captain_id = p_vice_captain_id,
      updated_at = now()
  where id = p_team_id and user_id = v_user;

  return p_team_id;
end;
$$;

revoke all on function public.validate_fantasy_team_selection(uuid,text[],text,text) from public;
revoke all on function public.save_fantasy_team(uuid,text,text[],text,text) from public;
revoke all on function public.update_fantasy_team(uuid,text,text[],text,text) from public;

grant execute on function public.save_fantasy_team(uuid,text,text[],text,text) to authenticated;
grant execute on function public.update_fantasy_team(uuid,text,text[],text,text) to authenticated;
