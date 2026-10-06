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
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select c.entry_fee
    into v_fee
  from public.contests c
  where c.id = p_contest_id
    and c.status = 'open'
    and c.filled_spots < c.total_spots
  for update;

  if not found then raise exception 'contest_unavailable'; end if;

  if not exists (
    select 1 from public.user_teams t
    where t.id = p_team_id and t.user_id = v_user
  ) then
    raise exception 'team_not_owned';
  end if;

  if exists (
    select 1 from public.contest_entries e
    where e.contest_id = p_contest_id and e.user_id = v_user
  ) then
    raise exception 'already_joined';
  end if;

  -- The concrete wallet schema should expose a single authoritative balance.
  -- Implement the debit ledger atomically in the production wallet migration.
  raise exception 'wallet_transaction_contract_not_installed'
    using hint = 'Install the wallet ledger migration before enabling contest joins';

  return v_entry_id;
end;
$$;

revoke all on function public.join_contest(uuid,uuid) from public;
grant execute on function public.join_contest(uuid,uuid) to authenticated;
