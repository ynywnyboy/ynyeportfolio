# Graph Report - our-little-world-v1.1  (2026-11-17)

## Corpus Check
- 122 files · ~110,561 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 4, .css 2, .graphify-bak 1)

## Summary
- 1106 nodes · 3388 edges · 41 communities (37 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 112 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ab658adf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Auth & Context
- UI Layouts
- Memory Management
- PetPanel.tsx
- Door Transitions
- Little Room Components
- appearance.ts
- Garden & Plants
- SiteContext.tsx
- sprite.ts
- CharacterCreator.tsx
- Our Little World 💞
- PlayerContext.tsx
- room.ts
- Settings & Config
- useSite
- package.json
- BucketList
- Notebook
- CLAUDE.md
- Particle Systems
- littleRoom.ts
- Theme & Appearance
- types.ts
- NotebookView.tsx
- HeroSection.tsx
- App.tsx
- AnimationSettings.tsx
- 8. Installation & Deployment Guide
- OpeningSelector.tsx
- 10. Maintenance & Development Guide
- Media
- Our Little World 💞 — Website Documentation
- Walker Logic
- 9. Limitations & Known Constraints
- 4. Backend / Database Architecture
- 7. Authentication & Security
- Appendix: Key Constants & Interfaces
- Particles.tsx

## God Nodes (most connected - your core abstractions)
1. `LittleRoomPage()` - 70 edges
2. `react` - 68 edges
3. `lucide-react` - 53 edges
4. `useToast()` - 53 edges
5. `publicUrl()` - 53 edges
6. `useAuth()` - 51 edges
7. `useSite()` - 50 edges
8. `errMsg()` - 48 edges
9. `Spinner()` - 36 edges
10. `Modal()` - 34 edges

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

## Communities (41 total, 4 thin omitted)

### Community 0 - "Auth & Context"
Cohesion: 0.08
Nodes (111): lucide-react, motion, react, BioEditor(), toForm(), AnimatedCheck(), blank, BucketListView() (+103 more)

### Community 1 - "UI Layouts"
Cohesion: 0.05
Nodes (28): ArtProps, Bathtub(), Beanbag(), Bed(), Bookcase(), C, Chair(), Coffeetable() (+20 more)

### Community 2 - "Memory Management"
Cohesion: 0.09
Nodes (45): COLORS, Confetti(), GLYPHS, LoveWheel(), SoundPanel(), Switch(), DEFAULTS, ensure() (+37 more)

### Community 3 - "PetPanel.tsx"
Cohesion: 0.08
Nodes (39): chip(), PetPanel(), PetPreview(), petSpriteOf(), Props, Pet, PetSheet, PetSpecies (+31 more)

### Community 4 - "Door Transitions"
Cohesion: 0.11
Nodes (39): ART, AssetLibrary(), Tab, Thumb(), ImageSeparation(), Piece, url(), aiForegroundMask() (+31 more)

### Community 5 - "Little Room Components"
Cohesion: 0.12
Nodes (41): NoteModal(), newId(), AddRoomDialog(), LayerPanel(), RoomNavigation(), RoomSettings(), KIND_MSG, LittleRoomPage() (+33 more)

### Community 6 - "appearance.ts"
Cohesion: 0.09
Nodes (30): AnimationConfig, AnimationPreset, AnimationsConfig, AnimLevel, AppearanceVars, applyAppearance(), backgroundCss(), bgImageUrl() (+22 more)

### Community 7 - "Garden & Plants"
Cohesion: 0.10
Nodes (25): ConfirmDialog(), CustomizeWorld(), pct(), Props, sameAppearance(), Section(), Seg(), Slider() (+17 more)

### Community 8 - "SiteContext.tsx"
Cohesion: 0.20
Nodes (17): Ctx, FALLBACK_THEME, SiteProvider(), UpdateOpts, Appearance, DEFAULT_APPEARANCE, applyTheme(), clearLegacyThemeOverride() (+9 more)

### Community 9 - "sprite.ts"
Cohesion: 0.15
Nodes (19): SPRITE_HEIGHT, Cell, drawCell(), drawFront(), drawSide(), FH, FRAMES, FW (+11 more)

### Community 10 - "CharacterCreator.tsx"
Cohesion: 0.09
Nodes (37): CharacterCreator(), chip(), Choice(), DIRS, Props, Section, SECTIONS, spriteOf() (+29 more)

### Community 11 - "Our Little World 💞"
Cohesion: 0.13
Nodes (14): 1. Create a Supabase account and project, 2. Create the database, storage bucket and security policies, 2b. Love Wheel migration (added in v1.1 — safe to run on your existing project), 3. Configure authentication, 4. Environment variables, 5. Run it, Free-tier limits (Supabase Free plan — check current numbers at supabase.com/pricing), How the important parts work (+6 more)

### Community 12 - "PlayerContext.tsx"
Cohesion: 0.06
Nodes (39): DoorOpeningTransition(), Phase, Props, AmbientParticles(), DoorBurst(), rnd(), LittleWorldDoor(), Props (+31 more)

### Community 13 - "room.ts"
Cohesion: 0.08
Nodes (23): FLOOR_Y, FLOORS, ITEM_TYPES, ItemMeta, Layer, makeItem(), PATTERNS, ROOM_H (+15 more)

### Community 14 - "Settings & Config"
Cohesion: 0.10
Nodes (33): defaultRoom(), normalizeRoom(), num(), useHouse(), defaultPreset(), normPreset(), normSheet(), normPlants() (+25 more)

### Community 15 - "useSite"
Cohesion: 0.30
Nodes (11): react-router-dom, BackgroundEffect(), FloatingNav(), links, Layout(), fmt(), MusicPlayer(), Particles() (+3 more)

### Community 16 - "package.json"
Cohesion: 0.06
Nodes (47): dependencies, gsap@^3.15.1, lucide-react@^0.460.0, motion@^11.11.0, react@^18.3.1, react-dom@^18.3.1, react-leaflet@^4.2.1, react-router-dom@^6.28.0 (+39 more)

### Community 17 - "BucketList"
Cohesion: 0.09
Nodes (39): Bloom(), Drops(), PlantArt(), SEED_IDS, shade(), b(), GardenBar(), GardenTool (+31 more)

### Community 18 - "Notebook"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 20 - "Particle Systems"
Cohesion: 0.28
Nodes (14): EffectKind, count(), createEngine(), Engine, fireflies(), FxParams, petals(), rain() (+6 more)

### Community 21 - "littleRoom.ts"
Cohesion: 0.11
Nodes (25): ItemType, Pattern, RoomDate, Props, Sel, Props, NodeProps, RoomProps (+17 more)

### Community 22 - "Theme & Appearance"
Cohesion: 0.12
Nodes (27): CharacterSprite(), SpriteInfo, Drag, HouseView(), norm(), Props, PET_HEIGHT, PetSprite() (+19 more)

### Community 23 - "types.ts"
Cohesion: 0.08
Nodes (36): leaflet@^1.9.4, leaflet, Props, Props, MemoryMapView(), defaultIcon, MapClickHandler(), MemoryMarker() (+28 more)

### Community 24 - "NotebookView.tsx"
Cohesion: 0.31
Nodes (10): BucketList, Home, Letters, LoveWheel, NOTEBOOK_PRESETS, NotebookPage, NotebookView(), PageSkeleton() (+2 more)

### Community 25 - "HeroSection.tsx"
Cohesion: 0.06
Nodes (43): Awake(), build(), chamfer(), Constellation(), fmtLong(), fmtShort(), Label, markPlayed() (+35 more)

### Community 26 - "App.tsx"
Cohesion: 0.11
Nodes (26): App(), BucketList, Home, Letters, LittleRoom, LoveWheel, Memories, MemoryMap (+18 more)

### Community 27 - "AnimationSettings.tsx"
Cohesion: 0.23
Nodes (11): ANIMATION_CATALOG, ANIMATION_DIRECTION_OPTIONS, ANIMATION_PRESETS, AnimationPresetName, DEFAULT_ANIMATIONS, sameAppearance(), AnimationSettings(), Badge() (+3 more)

### Community 28 - "8. Installation & Deployment Guide"
Cohesion: 0.20
Nodes (10): 8. Installation & Deployment Guide, Allow Emails, Apply Database Schema, Clone & Install, Deploy to Netlify, Environment Variables, Free Tier Limits (Supabase), Populate Default Settings (+2 more)

### Community 29 - "OpeningSelector.tsx"
Cohesion: 0.40
Nodes (7): OpeningPreview(), Props, OpeningSelector(), Props, OpeningKind, OPENING_OPTIONS, OpeningOptionInfo

### Community 30 - "10. Maintenance & Development Guide"
Cohesion: 0.22
Nodes (9): 10. Maintenance & Development Guide, Adding a Database Table, Adding a New Page, Common Pain Points, Debugging Realtime Issues, Git Workflow, Running Graphify Updates, Testing Local Changes (+1 more)

### Community 31 - "Media"
Cohesion: 0.36
Nodes (7): TNode, META, Media, ItemBar(), Props, HItem, isSolid()

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

### Community 40 - "Particles.tsx"
Cohesion: 0.20
Nodes (10): FLOWER_GLYPHS, HEART_GLYPHS, Item, Pixel(), PIXEL_HEART, PIXEL_STAR, STAR_GLYPHS, AnimationGroupKey (+2 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Auth & Context` to `Memory Management`, `PetPanel.tsx`, `Door Transitions`, `Little Room Components`, `Garden & Plants`, `SiteContext.tsx`, `CharacterCreator.tsx`, `PlayerContext.tsx`, `room.ts`, `useSite`, `package.json`, `BucketList`, `littleRoom.ts`, `Theme & Appearance`, `types.ts`, `NotebookView.tsx`, `HeroSection.tsx`, `App.tsx`, `AnimationSettings.tsx`, `OpeningSelector.tsx`, `Particles.tsx`?**
  _High betweenness centrality (0.181) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `LittleRoomPage()` (e.g. with `readTime()` and `readPetPref()`) actually correct?**
  _`LittleRoomPage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Auth & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07605363984674329 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Auth & Context` to `Memory Management`, `PetPanel.tsx`, `Door Transitions`, `Little Room Components`, `Garden & Plants`, `CharacterCreator.tsx`, `PlayerContext.tsx`, `room.ts`, `useSite`, `package.json`, `BucketList`, `littleRoom.ts`, `Theme & Appearance`, `types.ts`, `NotebookView.tsx`, `HeroSection.tsx`, `AnimationSettings.tsx`, `OpeningSelector.tsx`, `Media`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Should `UI Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Why does `useTable()` connect `Auth & Context` to `9. Limitations & Known Constraints`, `SiteContext.tsx`, `Our Little World 💞`, `PlayerContext.tsx`, `types.ts`, `App.tsx`, `10. Maintenance & Development Guide`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Should `Memory Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09333333333333334 - nodes in this community are weakly interconnected._