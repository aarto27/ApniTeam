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
begin
  if p_effective_start is null then raise exception 'effective_start_required'; end if;
  if p_effective_start <= now() then raise exception 'effective_start_must_be_future'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'extension_reason_required'; end if;

  -- Admin authorization must be enforced by the production admin role/RLS.
  -- This function deliberately does not trust the mobile client.
  update public.matches
  set effective_starts_at = p_effective_start,
      deadline_at = p_effective_start - interval '1 minute',
      status = 'upcoming',
      metadata = coalesce(metadata, '{}'::jsonb) ||
        jsonb_build_object(
          'dd_extended', true,
          'dd_extension_reason', trim(p_reason),
          'dd_extended_at', now()
        )
  where id = p_match_id;

  if not found then raise exception 'match_not_found'; end if;
end;
$$;

revoke all on function public.extend_match_deadline(uuid,timestamptz,text) from public;
