create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  materia_id text not null,
  categoria text not null check (categoria in ('donde_cursar', 'opiniones', 'consejos')),
  contenido text not null check (char_length(contenido) <= 500 and char_length(contenido) > 0),
  nombre_usuario text,
  created_at timestamptz not null default now()
);

create index if not exists comments_materia_id_idx on public.comments (materia_id);
create index if not exists comments_materia_categoria_idx on public.comments (materia_id, categoria);

alter table public.comments enable row level security;

create policy "comments_select_public"
  on public.comments for select
  to anon, authenticated
  using (true);

create policy "comments_insert_public"
  on public.comments for insert
  to anon, authenticated
  with check (true);
