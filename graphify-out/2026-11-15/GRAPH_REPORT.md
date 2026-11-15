# Graph Report - our-little-world-v1.1  (2026-11-11)

## Corpus Check
- 116 files · ~98,904 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .graphify-bak 1)

## Summary
- 960 nodes · 3123 edges · 29 communities (25 shown, 4 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Auth & Context
- UI Layouts
- Memory Management
- Music & Audio
- Door Transitions
- Little Room Components
- Character & Sprites
- Garden & Plants
- Wheel History
- Room Scene
- CharacterCreator.tsx
- Our Little World 💞
- App Core
- room.ts
- Settings & Config
- Navigation & Routing
- Animations
- BucketList
- Notebook
- CLAUDE.md
- Particle Systems
- littleRoom.ts
- Theme & Appearance
- Door Logic
- Love Wheel Core
- Media
- Walker Logic

## God Nodes (most connected - your core abstractions)
1. `LittleRoomPage()` - 70 edges
2. `react` - 67 edges
3. `lucide-react` - 49 edges
4. `publicUrl()` - 49 edges
5. `useToast()` - 48 edges
6. `useAuth()` - 46 edges
7. `errMsg()` - 46 edges
8. `useSite()` - 39 edges
9. `Modal()` - 36 edges
10. `Spinner()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `How the important parts work` --references--> `useTable()`  [INFERRED]
  README.md → src/lib/data.ts
- `TNode` --references--> `Media`  [EXTRACTED]
  src/components/Constellation.tsx → src/lib/types.ts
- `SiteProvider()` --indirect_call--> `publicUrl()`  [INFERRED]
  src/context/SiteContext.tsx → src/lib/storage.ts
- `deleteAssetFile()` --calls--> `removeFiles()`  [EXTRACTED]
  src/little-room/utils/assetManagement.ts → src/lib/storage.ts
- `App()` --calls--> `Layout()`  [EXTRACTED]
  src/App.tsx → src/components/Layout.tsx

## Import Cycles
- None detected.

## Communities (29 total, 4 thin omitted)

### Community 0 - "Auth & Context"
Cohesion: 0.06
Nodes (133): lucide-react, motion, react, react-router-dom, App(), NotConfigured(), Protected(), BioEditor() (+125 more)

### Community 1 - "UI Layouts"
Cohesion: 0.05
Nodes (28): ArtProps, Bathtub(), Beanbag(), Bed(), Bookcase(), C, Chair(), Coffeetable() (+20 more)

### Community 2 - "Memory Management"
Cohesion: 0.10
Nodes (44): COLORS, Confetti(), GLYPHS, LoveWheel(), SoundPanel(), Switch(), DEFAULTS, ensure() (+36 more)

### Community 3 - "Music & Audio"
Cohesion: 0.08
Nodes (39): chip(), PetPanel(), PetPreview(), petSpriteOf(), Props, Pet, PetSheet, PetSpecies (+31 more)

### Community 4 - "Door Transitions"
Cohesion: 0.11
Nodes (39): ITEM_TYPES, AssetLibrary(), Tab, Thumb(), ImageSeparation(), Piece, url(), aiForegroundMask() (+31 more)

### Community 5 - "Little Room Components"
Cohesion: 0.10
Nodes (44): CalendarModal(), fmt(), nextYearly(), NoteModal(), PhotoModal(), newId(), RoomDate, AddRoomDialog() (+36 more)

### Community 6 - "Character & Sprites"
Cohesion: 0.07
Nodes (35): dependencies, lucide-react@^0.460.0, motion@^11.11.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^6.28.0, @supabase/supabase-js@^2.45.0, devDependencies (+27 more)

### Community 7 - "Garden & Plants"
Cohesion: 0.09
Nodes (32): CustomizeWorld(), Section(), Seg(), Slider(), Toggle(), setA11yPrefs(), AppearanceVars, backgroundCss() (+24 more)

### Community 8 - "Wheel History"
Cohesion: 0.12
Nodes (34): Ctx, FALLBACK_THEME, SiteProvider(), SiteState, UpdateOpts, Appearance, applyAppearance(), buildAppearanceVars() (+26 more)

### Community 9 - "Room Scene"
Cohesion: 0.14
Nodes (23): Drops(), SpriteInfo, Drag, HouseView(), norm(), PET_HEIGHT, PetSprite(), Backdrop() (+15 more)

### Community 10 - "CharacterCreator.tsx"
Cohesion: 0.06
Nodes (59): CharacterCreator(), chip(), Choice(), DIRS, Props, Section, SECTIONS, Swatches() (+51 more)

### Community 11 - "Our Little World 💞"
Cohesion: 0.14
Nodes (13): 1. Create a Supabase account and project, 2. Create the database, storage bucket and security policies, 2b. Love Wheel migration (added in v1.1 — safe to run on your existing project), 3. Configure authentication, 4. Environment variables, 5. Run it, Free-tier limits (Supabase Free plan — check current numbers at supabase.com/pricing), How the important parts work (+5 more)

### Community 12 - "App Core"
Cohesion: 0.12
Nodes (20): DoorOpeningTransition(), Phase, Props, AmbientParticles(), DoorBurst(), rnd(), LittleWorldDoor(), Props (+12 more)

### Community 13 - "room.ts"
Cohesion: 0.09
Nodes (39): ART, PanelTab, Preview(), RoomPanel(), TABS, DUST, Floor(), isDarkHex() (+31 more)

### Community 14 - "Settings & Config"
Cohesion: 0.12
Nodes (30): SaveStatus, useHouse(), Op, defaultPreset(), normPlants(), a(), applyOps(), bedroomFrom() (+22 more)

### Community 15 - "Navigation & Routing"
Cohesion: 0.15
Nodes (20): BackgroundEffect(), FloatingNav(), links, Layout(), fmt(), MusicPlayer(), FLOWER_GLYPHS, HEART_GLYPHS (+12 more)

### Community 16 - "Animations"
Cohesion: 0.13
Nodes (24): Props, Props, Ctx, PlayerProvider(), PlayerState, RepeatMode, srcFor(), store (+16 more)

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
Cohesion: 0.10
Nodes (26): Pattern, SCENES, WALL_COLORS, Sel, Props, DOORS, Props, RoomSettings() (+18 more)

### Community 22 - "Theme & Appearance"
Cohesion: 0.25
Nodes (13): Props, BEHIND, PetConfig, usePet(), readSaved(), saveChar(), Saved, useWalker() (+5 more)

### Community 23 - "Door Logic"
Cohesion: 0.22
Nodes (13): Awake(), build(), chamfer(), Constellation(), fmtLong(), fmtShort(), Label, markPlayed() (+5 more)

### Community 25 - "Love Wheel Core"
Cohesion: 0.27
Nodes (8): A11yPrefs, DEFAULTS, get(), listeners, prefs, subscribe(), useA11yPrefs(), useReducedMotion()

### Community 31 - "Media"
Cohesion: 0.21
Nodes (12): ItemType, META, Media, Props, ItemBar(), Props, NodeProps, RoomProps (+4 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Auth & Context` to `Memory Management`, `Music & Audio`, `Door Transitions`, `Little Room Components`, `Character & Sprites`, `Garden & Plants`, `Wheel History`, `Room Scene`, `CharacterCreator.tsx`, `App Core`, `room.ts`, `Settings & Config`, `Navigation & Routing`, `Animations`, `littleRoom.ts`, `Theme & Appearance`, `Door Logic`, `Love Wheel Core`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `LittleRoomPage()` (e.g. with `readTime()` and `readPetPref()`) actually correct?**
  _`LittleRoomPage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Auth & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.060098522167487685 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Auth & Context` to `Memory Management`, `Music & Audio`, `Door Transitions`, `Little Room Components`, `Character & Sprites`, `Garden & Plants`, `Room Scene`, `CharacterCreator.tsx`, `App Core`, `room.ts`, `Navigation & Routing`, `BucketList`, `littleRoom.ts`, `Door Logic`, `Media`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Should `UI Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Why does `useTable()` connect `Auth & Context` to `Animations`, `Wheel History`, `Our Little World 💞`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Memory Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09551020408163265 - nodes in this community are weakly interconnected._