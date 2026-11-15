# Our Little World 💞 — Website Documentation

## 1. Overview

**Our Little World** is a private couple website — a shared digital space where two people curate their memories, dreams, and messages together. It is designed as a romantic, intimate scrapbook that only the couple can fully access; a public "view-only" mode shows highlights to guests without revealing private content.

### Purpose & Target Users

- **Couple**: Two people who want one shared, always-updated place to store photos, plans, songs, love letters (with future unlock dates), bucket lists, little games ("love wheels"), decorations, and a timeline of their relationship.
- **Visitors**: Friends/family who see a trimmed-down public version when `is_public` is enabled.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18.3.1 with TypeScript 5.6.3 |
| Build tool | Vite 5.4.10 (`@vitejs/plugin-react`) |
| Styling | Tailwind CSS 3.4.14 + PostCSS + Autoprefixer |
| Animations | `motion/react` (formerly framer-motion) 11.11.0 |
| Icons | Lucide React 0.460.0 |
| Client-side routing | react-router-dom 6.28.0 |
| Backend / DB | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Hosting | Netlify (production) |
| Dev environment | Vite dev server (`npm run dev`) |

---

## 2. Technologies & Dependencies

See `package.json` for the full dependency list. Key packages:

- `react`, `react-dom` — UI library
- `typescript` — type safety
- `vite` — bundler
- `tailwindcss` — utility CSS
- `motion/react` — declarative animations (AnimatePresence, motion.div, useMotionValue)
- `lucide-react` — icon set
- `react-router-dom` — client-side routing
- `@supabase/supabase-js` — official JS client for PostgreSQL, Auth, Realtime, Storage

No Redux or Zustand — global state lives in React contexts (`AuthContext`, `SiteContext`, `ToastContext`, `PlayerContext`, `DoorContext`).

---

## 3. Existing Features

### 3.1 Authentication & Access Control

**File**: `src/context/AuthContext.tsx` · `src/pages/Login.tsx`

- Email/password sign-in via **Supabase Auth**.
- No self-service signup. Access is granted only if the email appears in the `allowed_emails` table. A trigger `handle_new_user()` inserts a `members` row **only** when:
  1. The email is allow-listed.
  2. There is a free slot (max 2 members total).
- Each member gets a fixed `slot` value of `1` or `2`. Slot ownership gates editing of biographies.
- After login the user is redirected to `/admin`.
- Password reset flow: request reset → check email link → update password. Implemented in the same `Login` page toggled into *recovery* or *reset* modes.
- `isMember` flag from `AuthContext` gates every private route.

### 3.2 Public ↔ Private Toggle

**File**: `src/pages/admin/Settings.tsx` (Relationship settings panel) → writes `settings.is_public`.

When `true`:
- Home, Us, Story, Memories, Bucket List, Love Wheel become publicly viewable (read-only).
- FloatingNav drops private links for non-members, adds a **Login** button.
- Admin/editor routes remain behind the member gate.

A visitor may independently choose light/dark mode; this preference is stored in `localStorage` key `olw-visitor-mode` and does **not** affect the shared theme.

### 3.3 Memories Gallery

**Page**: `src/pages/Memories.tsx`  
**Manager**: `src/components/MemoryManager.tsx`

- Grid of photos/videos pulled from the `media` table, grouped by album tabs.
- Optional **category sub-filter** chips, a **constellations toggle** (persisted in `localStorage`), and a full-screen lightbox (`Lightbox` component).
- For members, an upload/manage toggle opens `MemoryManager`, which supports:
  - Drag-and-drop or file-picker upload with preview grid.
  - Batch upload showing per-file progress.
  - Editing caption, description, date, album assignment on each card.
  - Replacing the file or deleting it (with confirmation).
- Album management (`AlbumManager` sub-component) lets you create/edit albums and mark them to be excluded from random memories.

### 3.4 Music Player (Persistent Across Navigation)

**Component**: `src/components/MusicPlayer.tsx`  
**Provider**: `src/context/PlayerContext.tsx` (injected as `PlayerProvider` in `main.tsx`)

The `<audio>` element lives **outside** the router so music continues playing while the user navigates between pages.

Features:
- Fixed-position bar just below the nav area.
- Spinning album art when playing; pause/resume toggle.
- Seek slider, volume control, shuffle/repeat modes.
- Expandable playlist panel.
- Shows a **"Tap to play"** overlay if the browser blocks autoplay; otherwise plays once automatically on first interaction.
- Supports three source kinds per track: uploaded file, remote URL, or embed URI (validated by `toEmbedUrl()` in `MusicManager.tsx`). Embed URLs warn about licensing.
- Manager (`src/components/MusicManager.tsx`) provides CRUD for tracks plus **drag-to-reorder** via position swap (no actual drag-and-drop library; re-ordering is done with up/down buttons).

### 3.5 Timeline ("Our Story")

**Page**: `src/pages/Story.tsx`  
**Manager**: `src/components/TimelineManager.tsx`

- Vertical alternating-left/right card layout.
- Each event has a title, date, description, optional decoration emoji, photo(s), and video.
- Future/upcoming events are visually distinguished with dashed borders.
- Admin editor supports CRUD and position ordering.

### 3.6 Biographies ("Us")

**Page**: `src/pages/Us.tsx`  
**Editor**: `src/components/BioEditor.tsx`  
**Admin route**: `/admin/profile` (own profile) and `/admin/bios` (both profiles)

- Side-by-side bio cards: avatar, nickname, full name, birthday, bio text, personality blurb, hobby tags, favorites (music, food, memories), and custom key-value fields.
- Edit button visible only to the slot owner of that bio row.
- Avatar image uploads to `couple-media` storage.

### 3.7 Bucket List

**Page**: `src/pages/BucketList.tsx` → wraps `BucketListView`.  
**Public view** shows items read-only; `editable={isMember}` enables full CRUD for members.

- Items grouped by category chips (Travel, Dates, Food, Adventures, Celebrations, Personal Goals, Future Dreams).
- Each item stores a target date, cover image, description, and completion status.
- Animated checkmark on completion.
- Completed items sort reverse-chronologically at the top.

### 3.8 Letters (Sealed Messages)

**Page**: `src/pages/Letters.tsx`  
**View**: `src/components/LettersView.tsx`  
**Envelope visual**: `src/components/Envelope.tsx`

Architecture: two tables, `letters` (metadata/status/timestamps) and `letter_bodies` (the actual message text + attached photo paths). Server-side SQL functions enforce privacy:

- `can_see_letter(letter_id)` — can this member view the envelope?
- `can_read_letter_body(letter_id)` — is the body unlocked yet?

A letter goes through these states:
- **Draft** — editable/deletable by its author. Appears in the draft list.
- **Sealed** — immutably locked by the `letters_guard()` trigger. Cannot be edited or deleted after sealing.

Each sealed letter has an `unlock_at` timestamp derived from database/server time. Until that moment the recipient sees a countdown timer and an opaque envelope with a lock icon. The body content remains encrypted in plain-text inside the DB; access is enforced via the SQL function checks, not encryption.

The `Envelope` component animates flap opening and letter slide-out using Motion springs.

### 3.9 Love Wheel

**Page**: `src/pages/LoveWheel.tsx`  
**Component**: `src/components/wheel/LoveWheel.tsx`

A decorative spinning wheel used for fun couple activities. Tables involved:

- `wheel_sets` — named wheels (e.g., "Date ideas", "Things to do").
- `wheel_options` — individual slices with label, emoji, category, enabled flag, position.
- `wheel_history` — every spin recorded as a `WheelSpin` row so results persist as "Our Little Moments".

Mechanics (`src/lib/wheel.ts`):
- Options rendered as SVG pie slices with emoji + short label.
- 28 decorative bulbs around the rim flicker while spinning.
- Pointer bounces via spring animation; tick sound fires on each slice change; chime + pop on stop.
- Result lands via `pickIndex()` using `secureRandom()` from `lib/wheel.ts`.
- Confetti burst on result modal via `Confetti` component.
- User marks a result as **done** (❤️) or **skipped** (💛); skipping keeps the option available for next spin.
- Multi-wheel selector persisted in `localStorage`; switch wheels without losing history.

If the wheel tables don't exist, the page surfaces a hint to run migration `002_love_wheel.sql`.

### 3.10 Little Room (House Decorating Game)

**Page**: `src/pages/LittleRoom.tsx` → thin re-export from `src/little-room/LittleRoom.tsx`.

A 2D side-view house you can furnish room-by-room:
- Rooms defined in `lib/room.ts` constants (`SCENES`).
- Use-house hook (`hooks/useHouse`) persists house layout in localStorage; walker/pet hooks manage avatars and pets.
- Asset library, layer panel, room settings, garden tools (water/seeds), pet panel, character creator—all wired into the single-page game view.
- Time-of-day sky cycles between day/dusk/night (auto-follows device clock or manual override persisted under `olw-room-time`).
- Collision detection toggle persisted in `localStorage`.

### 3.11 Notebook Theme Mode

**Trigger**: `theme.kind === 'notebook'` checked in `Layout.tsx`.

Instead of the normal app chrome, renders `NotebookView` — a 3-D styled journal:
- Cover color, paper color, line color, ribbon color, handwritten font (Caveat or Indie Flower).
- Six "pages": Home, About Us, Gallery, Timeline, Letters, Fun (Love Wheel).
- Page-flip animation via `AnimatePresence` with spring damping.
- Settings modal to pick from 4 presets (`classic-blue`, `lavender-diary`, `baby-blue`, `pink-pastel`) or customize colors/fonts directly.
- Spine rings, paper-stack depth effect, red margin line, floating bookmark ribbon.

### 3.12 Theme Customization

**Admin route**: `/admin/theme`  
**Components**: `ThemeSettings` (in `src/pages/admin/Settings.tsx`), `CustomizeWorld` (`src/components/CustomizeWorld.tsx`)

Three layers of theming:

1. **Accent colour picker** — any hex writes a new blush-50..600 palette (see `lib/theme.ts:buildPalette()`) that cascades to buttons, links, backgrounds, and card accents system-wide.
2. **Mode** — light / dark / system (follows OS `prefers-color-scheme` live via `matchMedia`).
3. **Appearance** — background gradient, card style, animated decoration effect, floating particle kind—managed by `lib/appearance.ts` and written to `<html>` via `applyAppearance()`.

Persistence model:
- `settings.theme` JSONB in the DB is the canonical value.
- Local unsaved edits sit in `SiteContext.pending` until a debounce flush (450 ms) calls `updateRow('settings', …)` with the merged patch.
- On conflict (same field edited concurrently), the flush retries up to 3 times using the latest `version`.
- A flash-free first paint cache lives in `localStorage['olw-theme-cache']` and is read by an inline script in `index.html` before React hydrates.

Notebook-specific overrides live in `theme.notebook` (a `NotebookSettings` record: coverColor, paperColor, lineColor, font, binding, decorations, stickers, ribbonColor, preset).

### 3.13 Door Opening Animation

**Directories**: `src/components/door/`, `src/lib/door.ts`, `src/lib/opening.ts`  
**Context**: `DoorContext` in `main.tsx`

A cinematic transition played once at entry: animated doors swing open with a parallax scene reveal. Seeded by the `opening.ts` utilities and driven by Motion.

---

## 4. Backend / Database Architecture

All schema lives in `supabase/schema.sql` (~505 lines) plus additive migration `supabase/migrations/002_love_wheel.sql`.

### 4.1 Core Tables

| Table | Primary Key | Role |
|---|---|---|
| `allowed_emails` | `email` (text) | Gate: emails permitted to become members |
| `members` | `user_id` (uuid) | Maps auth users to slots 1/2; inserted by trigger `handle_new_user()` |
| `settings` | `id` (int, single row) | Shared name pair, anniversary date, welcome message, theme JSONB, `is_public`, `excluded_album_ids` |
| `bios` | `slot` (smallint) | One row per partner with bio, hobbies, favs, custom fields |
| `albums` | `id` (uuid) | Photo/video collection buckets |
| `media` | `id` (uuid) | Individual photos & videos; points to album |
| `timeline_events` | `id` (uuid) | Relationship milestones with images/video |
| `tracks` | `id` (uuid) | Playlist songs; ordered by `position` |
| `bucket_items` | `id` (uuid) | Bucket list entries; `completed` flips sorting order |
| `letters` | `id` (uuid) | Letter metadata; author, audience, status, timestamps |
| `letter_bodies` | `letter_id` (pk) | Letter content + embedded photo paths |
| `wheel_sets` | `id` (uuid) | Named wheels |
| `wheel_options` | `id` (uuid) | Slices/options within a wheel |
| `wheel_history` | `id` (uuid) | Every spin ever made ("Our Little Moments") |

Every editable row carries a `version integer NOT NULL DEFAULT 1` column and an `updated_at timestamptz`. A DB trigger `bump_version()` increments `version` on every UPDATE.

### 4.2 Row Level Security (RLS)

Every table has RLS **enabled**. Representative patterns:

- `is_member()` helper returns true when the current auth uid is in `members`.
- Public reads of display tables (`albums`, `media`, `timeline_events`, `bucket_items`, `bios`, `settings` excluding secrets) are allowed to anonymous users; writes require membership.
- `letters` / `letter_bodies` enforce audience rules: `audience = 'self'` rows are readable only by their author; `partner` rows by the other slot owner; `both` by either member. Non-members see nothing.
- `allowed_emails` is readable only by members.
- Storage bucket `couple-media` has a member-only policy for uploads and deletes; read URLs are signed but also accessible to anyone who possesses the public URL (acceptable because paths are UUIDs and not guessable).

### 4.3 Supabase Realtime

All relevant tables are published on the realtime channel. The data layer subscribes to INSERT/UPDATE/DELETE events and applies them locally without page reloads (see §5).

### 4.4 Storage

Bucket name constant exported as `BUCKET = 'couple-media'` from `src/lib/supabase.ts`. Files are stored under UUID-named paths. Helper functions in `src/lib/storage.ts` handle:
- File validation & MIME inference from extension fallback.
- Upload via `uploadFile(path, file)`.
- Remove via `removeFiles(paths)`.
- Public URL construction via `publicUrl(path)`.
- **HEIC handling**: Safari converts HEIC in-browser via `createImageBitmap`; unsupported formats surface a clear error message rather than failing silently.

### 4.5 Helper Functions (SQL RPCs)

| Function | Purpose |
|---|---|
| `is_member()` | Returns boolean |
| `my_slot()` | Returns the calling member's slot (1 or 2) |
| `server_now()` | Returns Supabase server timestamp (used to sync device clocks) |
| `is_public_site()` | Reads `settings.is_public` |
| `can_see_letter(id)` | Privacy guard for envelopes |
| `can_read_letter_body(id)` | Privacy guard for letter contents |

---

## 5. Architecture & File Structure

```
our-little-world-v1.1/
├── src/
│   ├── main.tsx                     # App entry: router → providers → <App>
│   ├── App.tsx                      # Route tree + Protected wrapper + clock sync
│   ├── index.html                   # Inline first-paint theme script
│   ├── lib/
│   │   ├── types.ts                 # All TS interfaces matching DB tables
│   │   ├── supabase.ts              # createClient(), BUCKET constant
│   │   ├── data.ts                  # useTable<T>(), insertRow, updateRow, deleteRow, emitLocal
│   │   ├── theme.ts                 # buildPalette, applyTheme, sanitizeTheme, cache helpers
│   │   ├── appearance.ts            # Background/font/card style vars
│   │   ├── storage.ts               # Upload/remove/URL/HEIC helpers
│   │   ├── time.ts                  # calendarDuration, countdown, syncServerClock, useNow
│   │   ├── wheel.ts                 # SVG slice math, pickIndex, secureRandom
│   │   ├── door.ts / opening.ts     # Door animation utilities
│   │   ├── room.ts                  # Little Room scene definitions
│   │   ├── sfx.ts                   # Web Audio API sounds (tick/chime/pop/heart/spin)
│   │   ├── perf.ts                  # Performance helpers
│   │   └── a11y.ts                  # Reduced-motion / a11y pref hooks
│   ├── context/
│   │   ├── AuthContext.tsx          # session/user/member state, signIn/signOut/reset/updatePassword
│   │   ├── SiteContext.tsx          # settings/bios/albums/media + theme merging & debounced save
│   │   ├── ToastContext.tsx         # lightweight toast notifications
│   │   └── PlayerContext.tsx        # audio ref forwarded to MusicPlayer
│   ├── pages/
│   │   ├── Home.tsx                 # Hero with names, anniversary counter, photo slideshow
│   │   ├── Us.tsx                   # Bio cards side-by-side
│   │   ├── Story.tsx                # Vertical timeline
│   │   ├── Memories.tsx             # Photo/video gallery wrapper
│   │   ├── TakeMeBack.tsx           # Random memory with sepia/blur entrance animation
│   │   ├── BucketList.tsx           # Thin wrapper for public/private
│   │   ├── Letters.tsx              # Section header over LettersView
│   │   ├── LoveWheel.tsx            # Multi-wheel selector + wheel renderer
│   │   ├── LittleRoom.tsx           # Re-export from little-room/
│   │   ├── Login.tsx                # Sign-in / reset / recovery forms
│   │   └── admin/
│   │       ├── Admin.tsx            # Dashboard shell: sidebar nav + <Routes>
│   │       └── Settings.tsx         # Relationship / Theme / Account sub-components
│   ├── components/
│   │   ├── Layout.tsx               # Wraps pages; routes to NotebookView when applicable
│   │   ├── FloatingNav.tsx          # Mobile-first pill navbar; dark/light toggle; sign-out
│   │   ├── MusicPlayer.tsx          # Persistent player bar + playlist panel
│   │   ├── Counter.tsx              # Animated relationship duration counter
│   │   ├── Particles.tsx            # Floating background particles (hearts/stars/etc.)
│   │   ├── BackgroundEffect.tsx     # Gradient/mesh backdrop
│   │   ├── Reveal.tsx               # Scroll-triggered fade-in wrapper
│   │   ├── Lightbox.tsx             # Full-screen image viewer
│   │   ├── Constellation.tsx        # Star-field connection diagrams in gallery
│   │   ├── SafeImage.tsx            # Img wrapper with loading="lazy" + error placeholder
│   │   ├── VideoThumb.tsx           # Video thumbnail player
│   │   ├── ConnectionStatus.tsx     # Offline indicator
│   │   ├── CustomizeWorld.tsx       # Appearance customizer panel
│   │   ├── BioEditor.tsx            # Biography form
│   │   ├── MemoryManager.tsx        # Media upload + album management
│   │   ├── MusicManager.tsx         # Track CRUD + position swap
│   │   ├── TimelineManager.tsx      # Event CRUD
│   │   ├── LettersView.tsx          # Draft/list/reader + sealed envelope UI
│   │   ├── BucketListView.tsx       # Item CRUD + category filter chips
│   │   ├── Envelope.tsx             # Animated envelope component
│   │   ├── ui.tsx                   # Shared primitives (Spinner, SectionTitle, Button variants)
│   │   ├── door/                    # Door transition component
│   │   ├── notebook/
│   │   │   ├── NotebookView.tsx     # Journal-mode wrapper with page-flip animation
│   │   │   ├── RoomPanel.tsx
│   │   │   ├── RoomPopups.tsx
│   │   │   ├── RoomScene.tsx
│   │   │   ├── useRoom.ts
│   │   │   └── art.tsx
│   │   ├── room/                    # Little Room (house decorator) components
│   │   ├── wheel/
│   │   │   ├── LoveWheel.tsx        # SVG spinner
│   │   │   ├── WheelManager.tsx
│   │   │   ├── useWheelData.ts
│   │   │   ├── WheelHistory.tsx
│   │   │   └── SoundPanel.tsx
│   │   └── opening/
│   │       ├── OpeningPreview.tsx
│   │       └── OpeningSelector.tsx
│   └── little-room/                 # Fully fleshed house-decorator game
│       ├── LittleRoom.tsx           # Main game loop
│       ├── components/              # HouseView, CharacterCreator, GardenBar, PetPanel, etc.
│       ├── hooks/                   # useHouse, useWalker, usePet
│       ├── utils/                   # houseOps, character, garden, pets
│       ├── styles/
│       └── types/
├── supabase/
│   ├── schema.sql                   # Full DDL: tables, RLS policies, triggers, functions
│   └── migrations/
│       └── 002_love_wheel.sql       # Additive migration adding wheel_* tables + seed defaults
├── .env.example                     # Template: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
├── vite.config.ts                   # Only @vitejs/plugin-react
├── postcss.config.js
├── tailwind.config.*                # Custom blush/lilac palettes, plugins
├── tsconfig.json                    # Strict TS, ES2020, JSX transform, bundler moduleResolution
└── package.json
```

---

## 6. How the Website Works Step-by-Step

### First Load

1. `index.html` runs an inline `<script>` that reads `localStorage['olw-theme-cache']` and writes CSS variables / attributes to `<html>` **before** React paints — eliminating the flash of default colours.
2. `src/main.tsx` mounts the React tree with providers layered in this order (innermost wins): `BrowserRouter` → `ToastProvider` → `AuthProvider` → `SiteProvider` → `PlayerProvider` → `DoorProvider` → `App`.
3. `App.tsx` registers routes (public pages under `/`, private pages gated by `<Protected>`, plus `/login`). On mount it calls `syncServerClock()` — an RPC to `server_now()` — to compute the offset between device clock and Supabase clock.

### Authentication Flow

1. Visitor arrives. `AuthContext` fetches the Supabase session. If none, `isMember = false`.
2. Clicking **Login** navigates to `/login`. Entering email + password calls `signIn(email, password)`.
3. If the email is in `allowed_emails`, the DB trigger auto-inserts a `members` row and redirects to `/admin`.
4. Subsequent page loads restore the session from Supabase Auth persistence (cookie/localstorage).

### Data Loading (useTable)

`src/lib/data.ts` exports `useTable<T>(table, primaryKey, opts?)`:
- Fetches the whole table once on mount.
- Subscribes to realtime INSERT/UPDATE/DELETE.
- On each event, re-fetches or patches the local array.
- Exposes `rows`, `loading`, `error`, `reload()`.

Tables loaded globally by `SiteContext`: `settings`, `bios`, `albums`, `media`. Others load on-demand inside their own components via separate `useTable` calls.

### Local Event Bus

Every successful mutation (`insertRow`, `updateRow`, `deleteRow`) calls `emitLocal(event)` immediately after the DB call resolves. Mounted `useTable` hooks listen and apply the change **without waiting** for the realtime round-trip. This gives snappy, instant UI feedback; realtime then propagates the same event to your partner's browser.

### Optimistic Concurrency Control

`updateRow<T>(table, pkCol, pk, version, patch)`:
- Builds `update(...).set(patch).eq('version', version)`.
- If another member saved first, Supabase affects 0 rows; the client catches `ConflictError` and surfaces it.
- Most callers retry once or twice automatically (theme flush retries up to 3 times).
- Write-everything strategies (replace the entire object) minimize collision surface.

### Server Clock Sync

`src/lib/time.ts`:
- `syncServerClock()` fetches `rpc.server_now()`, compares to `Date.now()`, stores the offset.
- `useNow()` returns a reactive timer whose interval is adjusted by the stored offset, so date calculations (letter unlocks, anniversary counters) reflect **database time**, not potentially-drifting device time.
- The device clock still drives display countdowns (easily adjustable), but the authoritative gate is `unlock_at` compared against server time.

### Theme Live-Sync Between Partners

1. One partner changes accent colour in the theme panel → `updateTheme({ accent })` writes to `pendingRef` and starts a 450 ms debounce timer.
2. Timer fires → `flush()` reads current DB row, merges patch, calls `updateRow('settings', …)`.
3. Supabase Realtime delivers the UPDATE event to both browsers; `SiteContext` re-derives `shared` from the fresh row, `applyTheme(accent, mode)` rewrites CSS variables on `<html>`, and the new palette blooms instantly on screen for both users.
4. Unsaved local changes stay in `pending` on the editing device until committed; they never leak to the partner's screen.

### Music Persistence

The `<audio>` DOM element is owned by `PlayerContext`, injected above the router. Because it sits outside `<Outlet />`, navigating between pages doesn't unmount it—the song continues playing seamlessly. Only a full page reload (or explicitly stopping the player) halts audio.

### Letters Unlocking

- Drafts show immediately for their author.
- Sealed letters with a future `unlock_at` render an envelope with a live countdown built from `useNow()`.
- At midnight server time, the realtime UPDATE arrives, the letter switches to "available" in the UI, and tapping the envelope opens the reader modal. Body content is fetched only when `can_read_letter_body()` returns true on the server.

---

## 7. Authentication & Security

### Auth Mechanism
- **Supabase Auth** (email/password). Sessions persisted in Supabase localStorage strategy.
- No third-party OAuth providers configured.

### Protection Strategy
- **Row Level Security** on every table is the primary defence. Policies reference `auth.uid()`, `is_member()`, `my_slot()`, `can_see_letter()`, `can_read_letter_body()`.
- **Application-layer checks**: `isMember` from `AuthContext` guards client-side navigation and conditional rendering.
- **Allowed emails gate**: new sign-ups are rejected by the trigger if the address isn't pre-approved. There is no open registration endpoint.

### Secrets Management
- Environment variables in `.env` (never committed):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY` (also accepted as `VITE_SUPABASE_ANON_KEY` for legacy projects)
- These are client-side-safe keys; actual protection comes from RLS policies, not secret confidentiality.
- Supabase service-role key stays on the server side (not exposed to the browser).

### Storage Security
- `couple-media` bucket policies restrict write/delete to authenticated members.
- Public URLs use UUID paths, making enumeration impractical.

### Password Handling
- Password resets go through Supabase's standard secure email flow. The app never sees or stores raw passwords.
- Password updates after reset use `updatePassword(newPassword)` from `AuthContext`.

---

## 8. Installation & Deployment Guide

### Prerequisites
- Node.js ≥ 18 (for Vite 5).
- A Supabase project (free tier works; limits noted below).
- A Netlify account (or any static host + dev proxy for local Supabase).

### Clone & Install
```bash
git clone <repo-url>
cd our-little-world-v1.1
npm install
```

### Environment Variables
Copy the example and fill in your Supabase credentials:
```bash
cp .env.example .env
# Edit .env:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```
The key must be the **anon/publishable** key from Supabase Dashboard → API. Never commit `.env`.

### Apply Database Schema
In the Supabase Dashboard SQL Editor, run `supabase/schema.sql` followed by `supabase/migrations/002_love_wheel.sql`. Verify tables appear under Database → Tables.

### Allow Emails
Insert yourself into `allowed_emails` (one row per partner):
```sql
INSERT INTO allowed_emails (email) VALUES ('you@example.com'), ('partner@example.com');
```
When either signs in for the first time, the trigger creates their `members` row and assigns slot 1 or 2.

### Populate Default Settings
The schema doesn't seed `settings`; insert the initial row via SQL or the admin dashboard after deploy. Minimum required fields: `name_one`, `name_two`, `anniversary`, `welcome_message`.

### Run Locally
```bash
npm run dev
```
Open `http://localhost:5173`. Login with an allowed email to reach the editor.

### Deploy to Netlify
1. Push to a git repo (GitHub/GitLab/Bitbucket).
2. In Netlify: **Add new site** → import repo → build command `npm run build`, publish dir `dist`.
3. Add environment variables in Netlify Settings → Environment Variables.
4. Trigger a deploy. Netlify will rebuild; after ~60 seconds the live URL is ready.

### Free Tier Limits (Supabase)
- **Database**: 500 MB.
- **File storage**: 1 GB (`couple-media`).
- **Bandwidth**: 5 GB/month out.
- **Anonymous requests**: 1 per second (enough for this workload).
- **Concurrent connections**: ~10 (two members + admin queries).

Keep photos under ~5 MB each and compress before uploading to avoid filling 1 GB quickly. Video files consume storage and bandwidth faster—use YouTube/Vimeo embeds where possible (MusicManager validates embed URLs).

---

## 9. Limitations & Known Constraints

### Platform Limitations
- **HEIC images from iPhones**: Desktop Safari displays them correctly (browser-side ImageBitmap conversion); Chrome/Firefox/Safari on Windows do not. A clear error prompts the user to convert the file elsewhere. No server-side transcoding exists.
- **Autoplay blocking**: Browsers prevent `<audio>` autoplay without user gesture. The app attempts autoplay once on first interaction; if blocked, a "Tap to play our music" button remains visible until the user taps it.
- **Drag reorder in MusicManager**: Uses up/down buttons, not native HTML5 drag-and-drop. Touch devices work fine; mouse drag would need additional wiring.

### Data Limitations
- **No soft-delete for sealed letters**: Once sealed, the row is immutable. Deleting requires a direct DB operation or toggling status back (if the UI ever exposes that). Currently there is no UI path to delete a sealed letter.
- **No search across memories**: Albums provide categorical grouping, but there is no text-search facet.
- **Single settings row**: Global app config is a single row; there is no per-partner theming—everything is shared. Disagreements resolve via last-write-wins + conflict retry.

### Scale Limits
- Designed for **2 members max**. `members` trigger enforces this hard cap. No multi-couple support exists.
- `useTable` loads every row of a table into memory and diff-matches against realtime events. With thousands of media rows the UI may stutter; not designed for album libraries larger than a few thousand photos.
- No pagination or virtualization on Memories or Timeline views.

### Realtime & Network
- Offline changes cannot be reconciled (no CRDT or queue). The app assumes persistent connectivity; `ConnectionStatus` component indicates when offline.
- Local event bus only reaches browsers currently viewing the app. Closing a tab means losing pending real-time events until it reopens.

### Security Observations
- RLS is the sole protection boundary. Anyone with a valid `couple-media` URL can view the asset even without logging in (paths are UUIDs, but not cryptographically random). Acceptable for a private couple site; not suitable for sensitive data.
- `allowed_emails` is world-readable unless you add a policy restricting it. Consider tightening if the list grows large.

### Features Not Yet Implemented
- No push/email notifications on new letters or spins.
- No export/import of the entire dataset (backup must be done via Supabase Dashboard).
- No role-based permissions beyond "member vs. visitor"—both members share full write access except bio editing is slot-scoped.
- Little Room does not sync house state between partners in real-time (persists per-device in localStorage).

---

## 10. Maintenance & Development Guide

### Adding a New Page
1. Create `src/pages/NewPage.tsx`.
2. Export a default React component.
3. Register a route in `src/App.tsx` under the appropriate section (public or inside `<Protected>`).
4. Optionally add a nav link in `src/components/FloatingNav.tsx` `links` array with `private: true` if member-only.

### Adding a Database Table
1. Write DDL in a new file under `supabase/migrations/` following naming convention `NNN_<name>.sql`.
2. Include RLS policies, triggers (if version bumping), and helper functions.
3. Run `supabase db push` or apply via Dashboard SQL Editor.
4. Add the TypeScript interface to `src/lib/types.ts`.
5. Access via `useTable` from `src/lib/data.ts`.

### Updating Theme Colours or Tailwind Config
Tailwind config defines the blush-50..600 tokens and appearance variants. Changing the accent colour at runtime bypasses Tailwind build time—it writes CSS variables directly. To add new semantic colours, update `tailwind.config.*` and restart `npm run dev`.

### Debugging Realtime Issues
- Open browser DevTools → Network → WebSocket tab; look for Supabase realtime frames.
- Console logs from `useTable` errors surface in `SiteContext.error` and individual hook errors.
- Test conflicts by editing the same setting from two incognito windows simultaneously.

### Testing Local Changes
```bash
npm run dev        # starts dev server on :5173
npm run build      # verifies production build succeeds
npm run lint       # runs ESLint if configured
```

### Running Graphify Updates
After modifying code, keep the knowledge graph current:
```bash
npx graphify update .
```
The graph powers `graphify query/explain/path` commands referenced in CLAUDE.md for codebase questions.

### Git Workflow
This project does not enforce a branch model in documentation, but typical practice:
1. `git checkout -b feature/<name>`
2. Commit often with descriptive messages.
3. Open a PR; the `graphify-out/graph.json` diff is expected and should not be flagged as churn.
4. Merge to main → push triggers Netlify deploy.

### Common Pain Points
- **Missing .env**: App falls back to `localhost:54321` with an anonymous key—Supabase calls fail silently or throw. Check console.
- **Flash of wrong theme on refresh**: Caused by missing `olw-theme-cache` entry (first visit) or stale cache (after theme change). Clear localStorage key or wait for next write cycle.
- **Letters not unlocking**: Verify `server_now()` RPC works and that `unlock_at` is truly in the past relative to server time (not device time).
- **Image uploads stuck**: Check `couple-media` bucket size and remaining Supabase bandwidth. Large batches hit rate limits.

---

## Appendix: Key Constants & Interfaces

### `Settings.theme` shape (stored as JSONB)
```ts
{
  kind: 'default' | 'notebook',
  accent: string,           // hex, e.g. '#e8899f'
  mode: 'light' | 'dark' | 'system',
  particles: boolean,
  appearance: { ... },      // background, fonts, decorations
  saved: SavedTheme[],      // named custom themes
  notebook?: NotebookSettings // only when kind === 'notebook'
}
```

### `Versioned` base (mixed into most entities)
```ts
interface Versioned {
  version: number
  updated_at: string
}
```

### Environment variables
| Variable | Required | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | Anon key (preferred name) |
| `VITE_SUPABASE_ANON_KEY` | yes (fallback) | Legacy anon key name |

### Stored localStorage keys
| Key | Used by |
|---|---|
| `olw-theme-cache` | Flash-free first paint |
| `olw-visitor-mode` | Visitor light/dark choice |
| `olw-room-time` | Little Room time-of-day override |
| `olw-collision` | Little Room collision toggle |
| wheel selection key | `localStorage` (internal to wheel component) |

---

*Documentation generated from source inspection of `our-little-world-v1.1` on 2026-11-12. Reflects the codebase as present at that time; features marked "not yet implemented" were confirmed absent on direct read.*
