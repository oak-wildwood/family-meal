-- Public bucket for recipe photos (ADR 0001).
--
-- A public bucket serves its objects to anyone by URL, so there is no select policy for
-- everyone: the anon role cannot list or query storage.objects, it can only fetch a photo
-- whose path it already knows. An uploader can see their own objects, because an update
-- or delete has to find the row first. Uploads need a signed-in user. Replacing or
-- deleting a photo needs the user who uploaded it (storage records that in
-- `storage.objects.owner_id`), so a second account can't overwrite photos that are
-- served on public recipe pages. Imports use the service key, which bypasses these.

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
create policy "uploaders see their recipe photos"
  on storage.objects for select to authenticated
  using (bucket_id = 'recipe-photos' and owner_id = (select auth.uid())::text);
create policy "uploaders replace their recipe photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'recipe-photos' and owner_id = (select auth.uid())::text)
  with check (bucket_id = 'recipe-photos' and owner_id = (select auth.uid())::text);
create policy "uploaders delete their recipe photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-photos' and owner_id = (select auth.uid())::text);
