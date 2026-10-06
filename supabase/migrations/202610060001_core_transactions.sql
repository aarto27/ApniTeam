-- ApniTeam transactional backend contract.
-- Run after creating the referenced tables. Functions fail closed if the schema is missing.

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
begin
  if v_user is null then raise exception 'not_authenticated'; end if;
  if coalesce(trim(p_team_name), '') = '' then raise exception 'team_name_required'; end if;
  if p_player_ids is null or cardinality(p_player_ids) <> 11 then raise exception 'exactly_11_players_required'; end if;
  if p_captain_id is null or p_vice_captain_id is null or p_captain_id = p_vice_captain_id then
    raise exception 'invalid_captain_selection';
  end if;
  if not (p_captain_id = any(p_player_ids) and p_vice_captain_id = any(p_player_ids)) then
    raise exception 'captain_must_be_selected';
  end if;

  -- Team validation belongs here too. The client validation is only UX.
  if (select count(*) from public.match_players mp
      where mp.match_id = p_match_id and mp.player_id::text = any(p_player_ids)) <> 11 then
    raise exception 'invalid_player_selection';
  end if;

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

revoke all on function public.save_fantasy_team(uuid,text,text[],text,text) from public;
grant execute on function public.save_fantasy_team(uuid,text,text[],text,text) to authenticated;

-- Join contract. Wallet deduction, seat allocation and entry creation must happen
-- under one transaction, so a retry cannot double-charge the user.
create or replace function public.join_contest(
  p_contest_id uuid,
  p_team_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_entry_id uuid;
  v_fee numeric;
  v_match_id uuid;
  v_effective_start timestamptz;
  v_deadline timestamptz;
  v_status text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select c.entry_fee, c.match_id
    into v_fee, v_match_id
  from public.contests c
  where c.id = p_contest_id
    and c.status = 'open'
    and c.filled_spots < c.total_spots
  for update;

  if not found then raise exception 'contest_unavailable'; end if;

  select m.effective_starts_at, m.deadline_at, m.status
    into v_effective_start, v_deadline, v_status
  from public.matches m
  where m.id = v_match_id;

  if not found then raise exception 'match_not_found'; end if;
  if v_status in ('completed', 'cancelled') then raise exception 'match_closed'; end if;
  if v_deadline is not null and now() >= v_deadline then raise exception 'deadline_passed'; end if;
  if v_effective_start is not null and now() >= v_effective_start then raise exception 'match_started'; end if;

  if not exists (
    select 1 from public.user_teams t
    where t.id = p_team_id and t.user_id = v_user and t.match_id = v_match_id
  ) then
    raise exception 'team_not_owned_for_match';
  end if;

  if exists (
    select 1 from public.contest_entries e
    where e.contest_id = p_contest_id and e.user_id = v_user
  ) then
    raise exception 'already_joined';
  end if;

  perform public.debit_wallet(
    v_user,
    v_fee,
    'contest_entry',
    p_contest_id::text,
    'contest:' || p_contest_id::text || ':user:' || v_user::text
  );

  insert into public.contest_entries(contest_id, user_id, team_id)
  values (p_contest_id, v_user, p_team_id)
  returning id into v_entry_id;

  update public.contests
  set filled_spots = filled_spots + 1
  where id = p_contest_id;

  return v_entry_id;
end;
$$;

revoke all on function public.join_contest(uuid,uuid) from public;
grant execute on function public.join_contest(uuid,uuid) to authenticated;
