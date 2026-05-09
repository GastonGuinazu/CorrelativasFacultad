-- Permite incrementar votos_count desde el cliente si el RPC no está desplegado
-- (fallback en CommentsService.incrementVotosViaUpdate).
-- Preferible mantener la función increment_comment_votes (incremento atómico).

create policy "comments_update_public"
  on public.comments for update
  to anon, authenticated
  using (true)
  with check (true);
