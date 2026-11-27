-- Public bucket for recipe photos (ADR 0001).
--
-- A public bucket serves its objects to anyone by URL, so there is deliberately no
-- select policy: the anon role cannot list or query storage.objects, it can only fetch
-- a photo whose path it already knows. Writes need a signed-in user; with sign-ups off
-- that is the owner.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-photos',
  'recipe-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "signed-in users upload recipe photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-photos');
create policy "signed-in users replace recipe photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-photos')
  with check (bucket_id = 'recipe-photos');
create policy "signed-in users delete recipe photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-photos');
