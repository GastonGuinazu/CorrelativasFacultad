alter table public.comments
  add column if not exists votos_count integer not null default 0;

-- Retorno escalar: PostgREST RPC con RETURNS public.comments suele fallar o devolver null.
create or replace function public.increment_comment_votes(p_comment_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  update public.comments
  set votos_count = coalesce(votos_count, 0) + 1
  where id = p_comment_id
  returning votos_count into new_count;
  if new_count is null then
    raise exception 'Comentario no encontrado';
  end if;
  return new_count;
end;
$$;

grant execute on function public.increment_comment_votes(uuid) to anon, authenticated;
