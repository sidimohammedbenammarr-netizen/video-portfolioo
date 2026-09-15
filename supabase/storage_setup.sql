-- =========================================================
-- Storage setup only — run this if the admin dashboard shows
-- "Bucket not found" when adding a video.
--
-- This creates the two storage buckets (thumbnails, videos) and their
-- access policies on their own, in case the full supabase/schema.sql
-- run didn't create them (e.g. it stopped partway through on an
-- earlier statement). Safe to run more than once.
-- =========================================================

-- file_size_limit is in bytes; raise it here (and re-run) if you need to
-- upload videos larger than 500MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('thumbnails', 'thumbnails', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
  on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('videos', 'videos', true, 524288000, array['video/mp4','video/quicktime','video/webm','video/x-matroska'])
  on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "public read thumbnails" on storage.objects;
create policy "public read thumbnails"
  on storage.objects for select
  using ( bucket_id = 'thumbnails' );

drop policy if exists "public read videos" on storage.objects;
create policy "public read videos"
  on storage.objects for select
  using ( bucket_id = 'videos' );

drop policy if exists "authenticated write thumbnails" on storage.objects;
create policy "authenticated write thumbnails"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'thumbnails' );

drop policy if exists "authenticated update thumbnails" on storage.objects;
create policy "authenticated update thumbnails"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'thumbnails' );

drop policy if exists "authenticated delete thumbnails" on storage.objects;
create policy "authenticated delete thumbnails"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'thumbnails' );

drop policy if exists "authenticated write videos" on storage.objects;
create policy "authenticated write videos"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'videos' );

drop policy if exists "authenticated update videos" on storage.objects;
create policy "authenticated update videos"
  on storage.objects for update
  to authenticated
  using ( bucket_id = 'videos' );

drop policy if exists "authenticated delete videos" on storage.objects;
create policy "authenticated delete videos"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'videos' );
