create or replace function public.extend_match_deadline(
  p_match_id uuid,
  p_effective_start timestamptz,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select coalesce(raw_app_meta_data->>'role', raw_user_meta_data->>'role')
    into v_role
  from auth.users
  where id = auth.uid();

  if coalesce(v_role, '') not in ('admin', 'super_admin') then
    raise exception 'admin_required';
  end if;

  if p_effective_start is null then raise exception 'effective_start_required'; end if;
  if p_effective_start <= now() then raise exception 'effective_start_must_be_future'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'extension_reason_required'; end if;

  update public.matches
  set effective_starts_at = p_effective_start,
      deadline_at = p_effective_start - interval '1 minute',
      status = 'scheduled',
      metadata = coalesce(metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'dd_extended', true,
          'dd_extension_reason', trim(p_reason),
          'dd_extended_at', now()
        ),
      updated_at = now()
  where id = p_match_id;

  if not found then raise exception 'match_not_found'; end if;
end;
$$;

revoke all on function public.extend_match_deadline(uuid,timestamptz,text) from public;
grant execute on function public.extend_match_deadline(uuid,timestamptz,text) to authenticated;
