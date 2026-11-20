# Graph Report - our-little-world-v1.1  (2026-11-17)

## Corpus Check
- 122 files · ~110,691 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 9 file(s) not represented in the graph (top: (none) 4, .css 2, .graphify-bak 1)

## Summary
- 1109 nodes · 3389 edges · 42 communities (38 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 112 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cfc1b2e9`
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
- petSprite.ts
- sprite.ts
- CharacterCreator.tsx
- Our Little World 💞
- PlayerContext.tsx
- room.ts
- Settings & Config
- useWalker.ts
- package.json
- BucketList
- Notebook
- CLAUDE.md
- Particle Systems
- littleRoom.ts
- Room.tsx
- types.ts
- 3. Existing Features
- HeroSection.tsx
- App.tsx
- AnimationSettings.tsx
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
- Particles.tsx
- LayerPanel.tsx

## God Nodes (most connected - your core abstractions)
1. `LittleRoomPage()` - 70 edges
2. `react` - 68 edges
3. `useToast()` - 53 edges
4. `publicUrl()` - 53 edges
5. `lucide-react` - 53 edges
6. `useAuth()` - 51 edges
7. `useSite()` - 50 edges
8. `errMsg()` - 48 edges
9. `Spinner()` - 36 edges
10. `Modal()` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Optimistic Concurrency Control` --references--> `ConflictError`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/lib/data.ts
- ``Versioned` base (mixed into most entities)` --references--> `Versioned`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/lib/types.ts
- `3.8 Letters (Sealed Messages)` --references--> `Envelope()`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/components/Envelope.tsx
- `How the important parts work` --references--> `useTable()`  [INFERRED]
  README.md → src/lib/data.ts
- `Adding a Database Table` --references--> `useTable()`  [INFERRED]
  WEBSITE_DOCUMENTATION.md → src/lib/data.ts

## Import Cycles
- 1-file cycle: `src/pages/admin/Settings.tsx -> src/pages/admin/Settings.tsx`

## Communities (42 total, 4 thin omitted)

### Community 0 - "Auth & Context"
Cohesion: 0.07
Nodes (115): lucide-react, motion, react, BioEditor(), toForm(), AnimatedCheck(), blank, BucketListView() (+107 more)

### Community 1 - "UI Layouts"
Cohesion: 0.05
Nodes (28): ArtProps, Bathtub(), Beanbag(), Bed(), Bookcase(), C, Chair(), Coffeetable() (+20 more)

### Community 2 - "Memory Management"
Cohesion: 0.08
Nodes (50): COLORS, Confetti(), GLYPHS, LoveWheel(), Props, SoundPanel(), Props, Switch() (+42 more)

### Community 3 - "PetPanel.tsx"
Cohesion: 0.18
Nodes (17): chip(), PetPanel(), PetPreview(), petSpriteOf(), Props, Pet, ACCENTS, COATS (+9 more)

### Community 4 - "Door Transitions"
Cohesion: 0.11
Nodes (40): ART, AssetLibrary(), Tab, Thumb(), ImageSeparation(), Piece, url(), LIB_CATS (+32 more)

### Community 5 - "Little Room Components"
Cohesion: 0.11
Nodes (42): CalendarModal(), fmt(), nextYearly(), NoteModal(), PhotoModal(), makeItem(), newId(), RoomPatch (+34 more)

### Community 6 - "appearance.ts"
Cohesion: 0.09
Nodes (30): AnimationConfig, AnimationPreset, AnimationsConfig, AnimLevel, AppearanceVars, applyAppearance(), backgroundCss(), bgImageUrl() (+22 more)

### Community 7 - "Garden & Plants"
Cohesion: 0.10
Nodes (26): ConfirmDialog(), CustomizeWorld(), pct(), Props, sameAppearance(), Section(), Seg(), Slider() (+18 more)

### Community 8 - "petSprite.ts"
Cohesion: 0.18
Nodes (15): bird(), drawPetCell(), EYE, G, hamster(), INK, Look, PET_ROW (+7 more)

### Community 9 - "sprite.ts"
Cohesion: 0.20
Nodes (15): Cell, drawCell(), drawFront(), drawSide(), hat(), INK, LONGISH, Pal (+7 more)

### Community 10 - "CharacterCreator.tsx"
Cohesion: 0.10
Nodes (34): CharacterCreator(), chip(), Choice(), DIRS, Props, Section, SECTIONS, Swatches() (+26 more)

### Community 11 - "Our Little World 💞"
Cohesion: 0.13
Nodes (14): 1. Create a Supabase account and project, 2. Create the database, storage bucket and security policies, 2b. Love Wheel migration (added in v1.1 — safe to run on your existing project), 3. Configure authentication, 4. Environment variables, 5. Run it, Free-tier limits (Supabase Free plan — check current numbers at supabase.com/pricing), How the important parts work (+6 more)

### Community 12 - "PlayerContext.tsx"
Cohesion: 0.06
Nodes (47): react-router-dom, DoorOpeningTransition(), Phase, Props, AmbientParticles(), DoorBurst(), rnd(), LittleWorldDoor() (+39 more)

### Community 13 - "room.ts"
Cohesion: 0.07
Nodes (28): FLOOR_Y, FLOORS, ITEM_TYPES, ItemMeta, Layer, PATTERNS, ROOM_H, ROOM_W (+20 more)

### Community 14 - "Settings & Config"
Cohesion: 0.09
Nodes (36): defaultRoom(), normalizeRoom(), num(), useHouse(), Op, ROOM_WIDTH, defaultPreset(), normPreset() (+28 more)

### Community 15 - "useWalker.ts"
Cohesion: 0.28
Nodes (11): BEHIND, PetConfig, readSaved(), saveChar(), Saved, useWalker(), WalkerConfig, Block (+3 more)

### Community 16 - "package.json"
Cohesion: 0.05
Nodes (48): dependencies, gsap@^3.15.1, leaflet@^1.9.4, lucide-react@^0.460.0, motion@^11.11.0, react@^18.3.1, react-dom@^18.3.1, react-leaflet@^4.2.1 (+40 more)

### Community 17 - "BucketList"
Cohesion: 0.11
Nodes (28): Bloom(), PlantArt(), SEED_IDS, shade(), b(), GardenBar(), GardenTool, Props (+20 more)

### Community 18 - "Notebook"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 20 - "Particle Systems"
Cohesion: 0.28
Nodes (14): EffectKind, count(), createEngine(), Engine, fireflies(), FxParams, petals(), rain() (+6 more)

### Community 21 - "littleRoom.ts"
Cohesion: 0.14
Nodes (13): SPRITE_HEIGHT, SpriteInfo, PET_HEIGHT, SpritePreview(), Dir, PetSheet, ROOM_HEIGHT, SpriteSheet (+5 more)

### Community 22 - "Room.tsx"
Cohesion: 0.11
Nodes (33): Pattern, Drops(), CharacterSprite(), Drag, HouseView(), norm(), Props, PetSprite() (+25 more)

### Community 23 - "types.ts"
Cohesion: 0.06
Nodes (53): leaflet, Props, Props, MemoryMapView(), defaultIcon, MapClickHandler(), MemoryMarker(), MemoryPopupContent() (+45 more)

### Community 24 - "3. Existing Features"
Cohesion: 0.20
Nodes (10): 3.10 Little Room (House Decorating Game), 3.11 Notebook Theme Mode, 3.13 Door Opening Animation, 3.1 Authentication & Access Control, 3.2 Public ↔ Private Toggle, 3.5 Timeline ("Our Story"), 3.6 Biographies ("Us"), 3.7 Bucket List (+2 more)

### Community 25 - "HeroSection.tsx"
Cohesion: 0.07
Nodes (36): Awake(), build(), chamfer(), Constellation(), fmtLong(), fmtShort(), Label, markPlayed() (+28 more)

### Community 26 - "App.tsx"
Cohesion: 0.11
Nodes (26): App(), BucketList, Home, Letters, LittleRoom, LoveWheel, Memories, MemoryMap (+18 more)

### Community 27 - "AnimationSettings.tsx"
Cohesion: 0.21
Nodes (12): ANIMATION_CATALOG, ANIMATION_DIRECTION_OPTIONS, ANIMATION_PRESETS, AnimationGroupKey, AnimationPresetName, Appearance, DEFAULT_ANIMATIONS, AnimationSettings() (+4 more)

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
Cohesion: 0.28
Nodes (8): ItemType, META, Props, ItemBar(), Props, HItem, LibCat, isSolid()

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
Cohesion: 0.19
Nodes (12): BackgroundEffect(), FLOWER_GLYPHS, HEART_GLYPHS, Item, Particles(), Pixel(), PIXEL_HEART, PIXEL_STAR (+4 more)

### Community 41 - "LayerPanel.tsx"
Cohesion: 0.60
Nodes (4): Sel, LayerPanel(), Props, Move

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Auth & Context` to `Memory Management`, `PetPanel.tsx`, `Door Transitions`, `Little Room Components`, `Garden & Plants`, `Particles.tsx`, `LayerPanel.tsx`, `CharacterCreator.tsx`, `PlayerContext.tsx`, `room.ts`, `useWalker.ts`, `package.json`, `littleRoom.ts`, `Room.tsx`, `types.ts`, `HeroSection.tsx`, `App.tsx`, `AnimationSettings.tsx`?**
  _High betweenness centrality (0.182) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `LittleRoomPage()` (e.g. with `readTime()` and `readPetPref()`) actually correct?**
  _`LittleRoomPage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Auth & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.07364238410596026 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Auth & Context` to `Memory Management`, `PetPanel.tsx`, `Door Transitions`, `Little Room Components`, `Garden & Plants`, `LayerPanel.tsx`, `CharacterCreator.tsx`, `PlayerContext.tsx`, `room.ts`, `package.json`, `BucketList`, `Room.tsx`, `types.ts`, `HeroSection.tsx`, `AnimationSettings.tsx`, `Media`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `UI Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Why does `useTable()` connect `Auth & Context` to `9. Limitations & Known Constraints`, `Our Little World 💞`, `PlayerContext.tsx`, `types.ts`, `App.tsx`, `10. Maintenance & Development Guide`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Should `Memory Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08376623376623377 - nodes in this community are weakly interconnected._