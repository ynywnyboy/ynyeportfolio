# Graph Report - our-little-world-v1.1  (2026-11-15)

## Corpus Check
- 131 files · ~115,230 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .graphify-bak 1)

## Summary
- 1119 nodes · 3499 edges · 40 communities (36 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 116 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth & Context
- UI Layouts
- Memory Management
- PetPanel.tsx
- Door Transitions
- Little Room Components
- Character & Sprites
- Garden & Plants
- Wheel History
- HouseView.tsx
- CharacterCreator.tsx
- Our Little World 💞
- App Core
- room.ts
- Settings & Config
- Navigation & Routing
- sprite.ts
- BucketList
- Notebook
- CLAUDE.md
- Particle Systems
- littleRoom.ts
- Theme & Appearance
- Door Logic
- petSprite.ts
- react
- 6. How the Website Works Step-by-Step
- 3. Existing Features
- 8. Installation & Deployment Guide
- spriteCanvas.ts
- 10. Maintenance & Development Guide
- Media
- Our Little World 💞 — Website Documentation
- Walker Logic
- 9. Limitations & Known Constraints
- 4. Backend / Database Architecture
- 7. Authentication & Security
- Appendix: Key Constants & Interfaces

## God Nodes (most connected - your core abstractions)
1. `react` - 75 edges
2. `LittleRoomPage()` - 70 edges
3. `lucide-react` - 57 edges
4. `publicUrl()` - 56 edges
5. `useToast()` - 55 edges
6. `useAuth()` - 53 edges
7. `errMsg()` - 50 edges
8. `useSite()` - 44 edges
9. `Modal()` - 36 edges
10. `motion` - 35 edges

## Surprising Connections (you probably didn't know these)
- `3.8 Letters (Sealed Messages)` --references--> `Envelope()`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/components/Envelope.tsx
- `Optimistic Concurrency Control` --references--> `ConflictError`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/lib/data.ts
- `How the important parts work` --references--> `useTable()`  [INFERRED]
  README.md → src/lib/data.ts
- `Adding a Database Table` --references--> `useTable()`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/lib/data.ts
- `Data Loading (useTable)` --references--> `useTable()`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/lib/data.ts

## Import Cycles
- 1-file cycle: `src/pages/admin/Settings.tsx -> src/pages/admin/Settings.tsx`

## Communities (40 total, 4 thin omitted)

### Community 0 - "Auth & Context"
Cohesion: 0.06
Nodes (114): leaflet, @supabase/supabase-js, BioEditor(), toForm(), AnimatedCheck(), blank, BucketListView(), EMOJI (+106 more)

### Community 1 - "UI Layouts"
Cohesion: 0.05
Nodes (28): ArtProps, Bathtub(), Beanbag(), Bed(), Bookcase(), C, Chair(), Coffeetable() (+20 more)

### Community 2 - "Memory Management"
Cohesion: 0.06
Nodes (65): COLORS, Confetti(), GLYPHS, LoveWheel(), Props, SoundPanel(), useWheelData(), WheelData (+57 more)

### Community 3 - "PetPanel.tsx"
Cohesion: 0.17
Nodes (18): chip(), PetPanel(), PetPreview(), petSpriteOf(), Props, Pet, PetSheet, ACCENTS (+10 more)

### Community 4 - "Door Transitions"
Cohesion: 0.11
Nodes (41): ITEM_TYPES, AssetLibrary(), Props, Tab, Thumb(), ImageSeparation(), Piece, url() (+33 more)

### Community 5 - "Little Room Components"
Cohesion: 0.10
Nodes (45): CalendarModal(), fmt(), nextYearly(), NoteModal(), PhotoModal(), newId(), RoomDate, RoomPatch (+37 more)

### Community 6 - "Character & Sprites"
Cohesion: 0.06
Nodes (45): dependencies, gsap@^3.15.1, leaflet@^1.9.4, lucide-react@^0.460.0, matter-js@^0.20.0, motion@^11.11.0, react@^18.3.1, react-dom@^18.3.1 (+37 more)

### Community 7 - "Garden & Plants"
Cohesion: 0.09
Nodes (31): ConfirmDialog(), pct(), Props, sameAppearance(), Section(), Seg(), Slider(), Toggle() (+23 more)

### Community 8 - "Wheel History"
Cohesion: 0.11
Nodes (35): Ctx, FALLBACK_THEME, SiteProvider(), SiteState, UpdateOpts, Appearance, applyAppearance(), buildAppearanceVars() (+27 more)

### Community 9 - "HouseView.tsx"
Cohesion: 0.19
Nodes (17): CharacterSprite(), SpriteInfo, Drag, HouseView(), norm(), Props, Sel, Props (+9 more)

### Community 10 - "CharacterCreator.tsx"
Cohesion: 0.10
Nodes (36): CharacterCreator(), chip(), Choice(), DIRS, Props, Section, SECTIONS, Swatches() (+28 more)

### Community 11 - "Our Little World 💞"
Cohesion: 0.14
Nodes (13): 1. Create a Supabase account and project, 2. Create the database, storage bucket and security policies, 2b. Love Wheel migration (added in v1.1 — safe to run on your existing project), 3. Configure authentication, 4. Environment variables, 5. Run it, Free-tier limits (Supabase Free plan — check current numbers at supabase.com/pricing), How the important parts work (+5 more)

### Community 12 - "App Core"
Cohesion: 0.13
Nodes (21): DoorOpeningTransition(), Phase, Props, AmbientParticles(), DoorBurst(), rnd(), LittleWorldDoor(), Props (+13 more)

### Community 13 - "room.ts"
Cohesion: 0.07
Nodes (47): ART, PanelTab, Preview(), RoomPanel(), TABS, DUST, Floor(), isDarkHex() (+39 more)

### Community 14 - "Settings & Config"
Cohesion: 0.12
Nodes (30): SaveStatus, useHouse(), Op, defaultPreset(), normPlants(), a(), applyOps(), bedroomFrom() (+22 more)

### Community 15 - "Navigation & Routing"
Cohesion: 0.13
Nodes (22): BackgroundEffect(), FLOWER_GLYPHS, HEART_GLYPHS, Item, Particles(), Pixel(), PIXEL_HEART, PIXEL_STAR (+14 more)

### Community 16 - "sprite.ts"
Cohesion: 0.15
Nodes (19): SPRITE_HEIGHT, Cell, drawCell(), drawFront(), drawSide(), FH, FRAMES, FW (+11 more)

### Community 17 - "BucketList"
Cohesion: 0.07
Nodes (48): Pattern, Bloom(), Drops(), PlantArt(), SEED_IDS, shade(), b(), GardenBar() (+40 more)

### Community 18 - "Notebook"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 20 - "Particle Systems"
Cohesion: 0.28
Nodes (14): EffectKind, count(), createEngine(), Engine, fireflies(), FxParams, petals(), rain() (+6 more)

### Community 21 - "littleRoom.ts"
Cohesion: 0.18
Nodes (11): SpritePreview(), Dir, LIB_CATS, PlantState, ROOM_HEIGHT, ROOM_KINDS, ROOM_WIDTH, RoomKind (+3 more)

### Community 22 - "Theme & Appearance"
Cohesion: 0.26
Nodes (12): BEHIND, PetConfig, usePet(), readSaved(), saveChar(), Saved, useWalker(), WalkerConfig (+4 more)

### Community 23 - "Door Logic"
Cohesion: 0.22
Nodes (13): Awake(), build(), chamfer(), Constellation(), fmtLong(), fmtShort(), Label, markPlayed() (+5 more)

### Community 24 - "petSprite.ts"
Cohesion: 0.18
Nodes (15): bird(), drawPetCell(), EYE, G, hamster(), INK, Look, PET_ROW (+7 more)

### Community 25 - "react"
Cohesion: 0.05
Nodes (85): lucide-react, motion, react, react-router-dom, App(), NotConfigured(), Protected(), SyncStatus (+77 more)

### Community 26 - "6. How the Website Works Step-by-Step"
Cohesion: 0.22
Nodes (10): serverNow(), useNow(), 6. How the Website Works Step-by-Step, Authentication Flow, Data Loading (useTable), Letters Unlocking, Music Persistence, Optimistic Concurrency Control (+2 more)

### Community 27 - "3. Existing Features"
Cohesion: 0.20
Nodes (10): 3.10 Little Room (House Decorating Game), 3.11 Notebook Theme Mode, 3.13 Door Opening Animation, 3.1 Authentication & Access Control, 3.2 Public ↔ Private Toggle, 3.5 Timeline ("Our Story"), 3.6 Biographies ("Us"), 3.7 Bucket List (+2 more)

### Community 28 - "8. Installation & Deployment Guide"
Cohesion: 0.20
Nodes (10): 8. Installation & Deployment Guide, Allow Emails, Apply Database Schema, Clone & Install, Deploy to Netlify, Environment Variables, Free Tier Limits (Supabase), Populate Default Settings (+2 more)

### Community 29 - "spriteCanvas.ts"
Cohesion: 0.28
Nodes (8): spriteOf(), defaultSprite(), PetSpecies, renderPetSheet(), renderSheet(), cache, lookSheetUrl(), petSheetUrl()

### Community 30 - "10. Maintenance & Development Guide"
Cohesion: 0.22
Nodes (9): 10. Maintenance & Development Guide, Adding a Database Table, Adding a New Page, Common Pain Points, Debugging Realtime Issues, Git Workflow, Running Graphify Updates, Testing Local Changes (+1 more)

### Community 31 - "Media"
Cohesion: 0.53
Nodes (5): Media, ItemBar(), Props, HItem, isSolid()

### Community 32 - "Our Little World 💞 — Website Documentation"
Cohesion: 0.29
Nodes (6): 1. Overview, 2. Technologies & Dependencies, 5. Architecture & File Structure, Our Little World 💞 — Website Documentation, Purpose & Target Users, Tech Stack

### Community 36 - "9. Limitations & Known Constraints"
Cohesion: 0.29
Nodes (7): 9. Limitations & Known Constraints, Data Limitations, Features Not Yet Implemented, Platform Limitations, Realtime & Network, Scale Limits, Security Observations

### Community 37 - "4. Backend / Database Architecture"
Cohesion: 0.33
Nodes (6): 4.1 Core Tables, 4.2 Row Level Security (RLS), 4.3 Supabase Realtime, 4.4 Storage, 4.5 Helper Functions (SQL RPCs), 4. Backend / Database Architecture

### Community 38 - "7. Authentication & Security"
Cohesion: 0.33
Nodes (6): 7. Authentication & Security, Auth Mechanism, Password Handling, Protection Strategy, Secrets Management, Storage Security

### Community 39 - "Appendix: Key Constants & Interfaces"
Cohesion: 0.40
Nodes (5): Appendix: Key Constants & Interfaces, Environment variables, `Settings.theme` shape (stored as JSONB), Stored localStorage keys, `Versioned` base (mixed into most entities)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `Auth & Context`, `Memory Management`, `PetPanel.tsx`, `Door Transitions`, `Little Room Components`, `Character & Sprites`, `Garden & Plants`, `Wheel History`, `HouseView.tsx`, `CharacterCreator.tsx`, `App Core`, `room.ts`, `Settings & Config`, `Navigation & Routing`, `BucketList`, `littleRoom.ts`, `Theme & Appearance`, `Door Logic`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `LittleRoomPage()` (e.g. with `readTime()` and `readPetPref()`) actually correct?**
  _`LittleRoomPage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Auth & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05704008221993834 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `Auth & Context`, `Memory Management`, `PetPanel.tsx`, `Door Transitions`, `Little Room Components`, `Character & Sprites`, `Garden & Plants`, `HouseView.tsx`, `CharacterCreator.tsx`, `App Core`, `room.ts`, `BucketList`, `Door Logic`, `Media`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `UI Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Why does `useTable()` connect `Auth & Context` to `Memory Management`, `9. Limitations & Known Constraints`, `Wheel History`, `Our Little World 💞`, `react`, `6. How the Website Works Step-by-Step`, `10. Maintenance & Development Guide`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Should `Memory Management` be split into smaller, more focused modules?**
  _Cohesion score 0.0640503517215846 - nodes in this community are weakly interconnected._