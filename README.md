# Our Little World 💞

A private, real-time digital scrapbook for two: memories, timeline, bucket list, music, and time-locked letters.
Built with React + TypeScript + Tailwind + Motion + Lucide, backed by Supabase (Auth, Postgres, Realtime, Storage, RLS).

## 1. Create a Supabase account and project

1. Go to https://supabase.com → **Start your project** → sign up (free).
2. **New project** → pick a name (e.g. `our-little-world`), a strong database password, and the region closest to you. Wait ~2 minutes.

## 2. Create the database, storage bucket and security policies

1. Open **SQL Editor → New query**.
2. Paste the whole of `supabase/schema.sql` and press **Run**. This creates, in one go:
   - all tables (settings, bios, albums, media, timeline, tracks, bucket list, letters)
   - **Row Level Security** on every table
   - the `couple-media` **storage bucket** (50 MB per file) and its policies
   - realtime publication for all tables
   - the server-side letter lock (see below)
3. In a **new query**, allow-list your two emails (edit them first):
   ```sql
   insert into public.allowed_emails (email) values ('you@example.com'), ('her@example.com');
   ```
   Only these two emails can ever become members; everyone else gets no access.

### 2b. Love Wheel migration (added in v1.1 — safe to run on your existing project)

Run `supabase/migrations/002_love_wheel.sql` the same way (SQL Editor → New query → Run). It only **adds** three tables
(`wheel_sets`, `wheel_options`, `wheel_history`), two functions, their members-only security policies and realtime
publication, and seeds one wheel with the 19 original ideas. It never alters or deletes anything that already exists,
and is safe to run more than once.

## 3. Configure authentication

1. **Authentication → Providers → Email**: keep enabled. For simplicity you can turn **Confirm email** off, or keep it on.
2. **Authentication → Sign In / Providers → turn OFF "Allow new users to sign up"** *after* creating both accounts.
3. Create the two accounts: **Authentication → Users → Add user → Create new user** (tick *Auto Confirm User*), using the two allow-listed emails and passwords. The first becomes partner 1, the second partner 2.
   > The allow-list must be filled **before** you create the users.
4. **Authentication → URL Configuration**: set **Site URL** to your site (`http://localhost:5173` while developing, your real URL after deploying) and add it to **Redirect URLs** (needed for password reset emails).

## 4. Environment variables

1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. `cp .env.example .env.local` and fill in:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # (the older "anon" key also works, under VITE_SUPABASE_ANON_KEY)
   ```
3. **Never** put the `service_role` key anywhere in this project. The anon key is designed to be public — your data is protected by the Row Level Security policies.

## 5. Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
```

Sign in at `/login`, then open **Dashboard → Relationship** to set your names, anniversary and featured photo.

Deploy `dist/` to any static host (Netlify, Vercel, Cloudflare Pages). Add the two env vars in the host's settings, and make sure unknown routes fall back to `index.html` (SPA rewrite). Update the Supabase Site URL.

## How the important parts work

| Requirement | Implementation |
|---|---|
| Real-time sync | `useTable` loads each table then applies Supabase Realtime INSERT/UPDATE/DELETE events live; it re-syncs after reconnects. |
| No accidental overwrites | Every editable row has a `version` column bumped by a DB trigger. Saves use `update … where version = <loaded>`; if the other person saved first you get a clear message instead of a silent overwrite. |
| Persistent media | Files go to Supabase Storage (never Base64/DB). Only the path is stored; deleting a memory also deletes the file. |
| Locked letters | Letter **metadata** and **body** live in separate tables. RLS only returns a sealed body when `unlock_at <= now()` on the **database** clock — a changed phone clock can't open it early. Sealed letters are immutable (DB trigger). The countdown uses the server clock offset for display only. |
| Letter privacy | `self` = only the author, `partner` = author + the other person, `both` = shared. Drafts are visible to the author only. Others never even see private letters exist. |
| Public view-only | Off by default. Turn on in **Relationship settings**; anonymous visitors then get SELECT-only on shared content (never letters). |

## Free-tier limits (Supabase Free plan — check current numbers at supabase.com/pricing)

- **File storage: 1 GB total.** Photos from phones are typically 2–5 MB, so roughly 200–500 photos; videos use it up fast.
- **Max 50 MB per file** (enforced by the bucket and the app). Compress long videos first.
- **Bandwidth (egress): ~5 GB/month** across everything. Viewing your own site a lot is fine; sharing the public site widely could exceed it.
- **Database: 500 MB** (text only — plenty).
- **Realtime: 200 concurrent connections** — more than enough for two people.
- **Projects pause after ~1 week of inactivity** on the free plan. Opening the site (or the Supabase dashboard) regularly keeps it awake; a paused project can be restored from the dashboard.
- Free projects have **no automatic backups**. Periodically download your photos, and consider exporting the database.

## Notes & honest limitations

- Storage bucket is **public-read** so image URLs persist and load fast. File names are random UUIDs, and the database rows that reveal them are hidden from non-members (unless you enable public view), but anyone *with* a direct file URL can open it. Letter photos are in the same bucket for this reason; avoid attaching highly sensitive photos.
- Music: embeds (YouTube/Spotify/SoundCloud) use the provider's own controls and can't be controlled by the mini-player's progress/volume. Uploaded/linked audio files get full control. Only add music you have rights to.
- Letter images stay in cloud storage as normal files.
- iOS Safari may require a tap before audio starts (browser policy).

## Project structure

```
supabase/schema.sql      database, RLS, storage, realtime
src/lib/                 supabase client, realtime hook, storage + time helpers
src/context/             auth, site data, toasts, persistent music player
src/components/          Layout, Lightbox, managers, Envelope, Counter, Reveal…
src/pages/               Home, Us, Story, Memories, TakeMeBack, BucketList, Letters, Login
src/pages/admin/         Dashboard + settings
```


## Netlify

Build command `npm run build`, publish directory `dist`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
in Site settings → Environment variables. `public/_redirects` makes page refreshes on routes like `/memories` work.

## v1.1 notes

- **Theme**: the accent palette is CSS-variable driven (`src/lib/theme.ts`); the shared theme lives in `settings.theme`
  and syncs live. The header sun/moon button changes the *shared* mode for signed-in partners.
- **Memories**: files are previewed on selection before upload; iPhone HEIC photos only display in Safari — export as JPEG.
- **Music**: tries to autoplay once; if the browser blocks it a "Tap to play our music" button appears. Last song and position are remembered per device.
- **Love Wheel**: `/love-wheel` (signed-in only). Sound effects are generated in the browser (no audio files).
# ynyeportfolio
