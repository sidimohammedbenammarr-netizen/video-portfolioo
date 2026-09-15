-- =========================================================
-- Video Portfolio — Supabase schema
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- =========================================================

-- 1. Table -------------------------------------------------
create table if not exists public.videos (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null default '',
  category      text not null default 'Other'
                  check (category in ('Reels','Social Media','Ads','Motion Graphics','YouTube','Other')),
  video_url     text not null,
  thumbnail_url text not null,
  client        text not null default '',
  duration      text not null default '',   -- e.g. "01:24" (stored as text, free-form)
  "order"       integer not null default 0, -- lower = shown first
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists videos_order_idx on public.videos ("order");
create index if not exists videos_published_idx on public.videos (published);

-- 2. Row Level Security -------------------------------------
alter table public.videos enable row level security;

-- Anyone (including logged-out visitors) can read published videos.
drop policy if exists "public can read published videos" on public.videos;
create policy "public can read published videos"
  on public.videos for select
  using ( published = true );

-- Any authenticated user (i.e. you, once logged in via the admin login page)
-- can read every video, published or not.
drop policy if exists "authenticated can read all videos" on public.videos;
create policy "authenticated can read all videos"
  on public.videos for select
  to authenticated
  using ( true );

-- Only authenticated users can insert / update / delete.
drop policy if exists "authenticated can insert videos" on public.videos;
create policy "authenticated can insert videos"
  on public.videos for insert
  to authenticated
  with check ( true );

drop policy if exists "authenticated can update videos" on public.videos;
create policy "authenticated can update videos"
  on public.videos for update
  to authenticated
  using ( true )
  with check ( true );

drop policy if exists "authenticated can delete videos" on public.videos;
create policy "authenticated can delete videos"
  on public.videos for delete
  to authenticated
  using ( true );

-- 3. Storage buckets -----------------------------------------
-- One bucket for thumbnails (images) and one for videos hosted directly in
-- Supabase Storage. Both are public-read so the site can display them; only
-- authenticated (admin) users can upload/replace/delete.
-- file_size_limit is in bytes; raise it here (and re-run) if you need to
-- upload videos larger than 500MB. allowed_mime_types is a defense-in-depth
-- check enforced by Supabase itself, on top of the check the admin
-- dashboard already does before it starts an upload.
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

-- 4. Seed a couple of example rows (safe to delete from the admin dashboard) --
insert into public.videos (title, description, category, video_url, thumbnail_url, client, duration, "order", published)
values
  ('Coastal Brand Reel', 'A punchy 30-second reel cut for a surfwear launch.', 'Reels',
   'https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.mp4',
   'https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.jpg',
   'Salt & Pine', '00:31', 1, true),
  ('Product Launch Ad', 'Fast-paced promo for a fitness app''s app-store campaign.', 'Ads',
   'https://res.cloudinary.com/demo/video/upload/samples/elephants.mp4',
   'https://res.cloudinary.com/demo/video/upload/samples/elephants.jpg',
   'Pulse Fitness', '00:45', 2, true)
on conflict do nothing;
