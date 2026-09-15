# Sidi Mohammed — Video Editor Portfolio

A dark, cinematic portfolio site for a freelance video editor, with a private
admin dashboard for adding, editing, reordering, hiding and deleting projects
— no code changes required to update your portfolio.

**Stack:** Next.js 14 (App Router) + Tailwind CSS + Supabase (Postgres
database, Auth, and Storage for thumbnails/videos). This combination was
chosen because Supabase gives you a database, authentication and file
storage in one free-tier project, so there's nothing else to host or wire
together.

---

## 1. What's included

- **Public site** — Home, Work (filterable video gallery with a custom
  in-page lightbox player), About, Contact.
- **Admin dashboard** (`/admin`) — protected by login. Add/edit/delete
  videos, upload a thumbnail image and either upload a video file or paste
  a video URL (e.g. a Cloudinary link), reorder with up/down arrows, and
  toggle a video between published/hidden without deleting it.
- **Database + storage schema** in `supabase/schema.sql`, including Row
  Level Security so only signed-in users (you) can write data, while
  visitors can only ever read *published* videos.

## 2. One-time setup

### a) Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project (free tier is fine).
2. Once it's created, open **SQL Editor → New query**, paste the entire
   contents of `supabase/schema.sql`, and run it. This creates the
   `videos` table, security policies, and two storage buckets
   (`thumbnails`, `videos`), plus two example rows so you can see the
   layout immediately.
3. Go to **Project Settings → API** and copy:
   - `Project URL`
   - `anon public` key

### b) Create your admin login
Supabase Auth has no public sign-up page in this app on purpose — only you
should be able to log in.
1. In Supabase, go to **Authentication → Users → Add user**.
2. Enter your email and a password. That's your admin login for `/admin`.
   (You can add more team members the same way later.)

### c) Configure environment variables
1. Copy `.env.example` to `.env.local`.
2. Fill in the two values from step (a):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
   The anon key is meant to be public — it's restricted by the database
   policies in `schema.sql`, so it can never be used to write data without
   being logged in. Never put your `service_role` key in this file or
   anywhere in frontend code.

### d) Install and run
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` for the site and
`http://localhost:3000/admin/login` to sign in.

## 3. Deploying

The easiest option is [Vercel](https://vercel.com):
1. Push this project to a GitHub repo.
2. Import it in Vercel.
3. Add the same two environment variables from `.env.local` in the
   Vercel project settings.
4. Deploy. Every push to your main branch redeploys automatically.

## 4. Day-to-day: managing your portfolio

You never need to touch the code to update your portfolio:

1. Go to `yourdomain.com/admin/login` and sign in.
2. **Add a video** — click "Add video", fill in the title, description,
   category, client and duration, upload a thumbnail image, and either
   upload a video file or paste a video URL. Set it to Published to make
   it live immediately, or leave it unpublished to save it as a draft.
3. **Reorder** — use the ▲ / ▼ arrows on the dashboard; the public Work
   page reflects the new order right away.
4. **Hide/show** — click "Hide" to pull a video off the public site
   without deleting it (useful if a client asks you to take something
   down temporarily).
5. **Edit or delete** — from the same dashboard row.

### Where video files live
- If you **upload a file** (the default), it's stored in your Supabase
  Storage `videos`/`thumbnails` buckets and served from there. Deleting a
  video, or replacing its file/thumbnail while editing, automatically
  removes the old file from storage too — nothing is left behind, and you
  never need to open the Supabase dashboard for routine changes.
- If you **paste a URL** instead (switch the toggle to "Paste URL"), the
  site just plays from wherever that URL points (Cloudinary, your own CDN,
  etc.) and nothing is uploaded. Useful for large/long videos where a
  dedicated video host will load faster than serving directly from
  Supabase. Delete/replace never touches external URLs — only files that
  live in your own buckets are ever cleaned up.

## 5. Project structure

```
src/
  app/
    page.tsx                 Home
    work/page.tsx             Portfolio gallery
    about/page.tsx             About
    contact/page.tsx           Contact
    admin/
      login/page.tsx           Admin sign-in
      page.tsx                 Admin dashboard (list, reorder, hide, delete)
      new/page.tsx              Add video
      [id]/edit/page.tsx        Edit video
  components/                 Navbar, Footer, VideoCard, VideoGrid,
                               VideoLightbox (custom player), PortfolioBrowser
                               (category filter), AdminVideoList, VideoForm
  lib/
    types.ts                  Video + Category types
    supabase/                 Browser + server Supabase clients
  middleware.ts                Protects /admin routes, refreshes auth session
supabase/schema.sql            Database table, RLS policies, storage buckets
```

## 6. Security notes

- `/admin/*` is gated server-side by `src/middleware.ts` — visiting any
  admin URL while logged out redirects to `/admin/login`.
- Row Level Security in `schema.sql` enforces the same rule at the
  database level: logged-out requests can only ever `select` rows where
  `published = true`, and can never insert/update/delete. This means even
  if someone bypassed the frontend entirely and called the Supabase API
  directly, they still couldn't write data or read unpublished drafts.
- The only key used in the browser is the Supabase `anon` public key,
  which is designed to be exposed — it has no power on its own without
  the RLS policies granting it.

## 7. Troubleshooting

**"Bucket not found" when adding a video** — this means the
`thumbnails`/`videos` storage buckets weren't created when you ran
`supabase/schema.sql` (usually because an earlier line in that script
errored and stopped the rest from running). Fix it by running
`supabase/storage_setup.sql` on its own in the SQL Editor — it only
creates the two buckets and their policies, and is safe to run more than
once. Afterwards, check **Storage** in the Supabase dashboard sidebar to
confirm both buckets show up before trying to add a video again.

