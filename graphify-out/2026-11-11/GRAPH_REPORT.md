# Graph Report - our-little-world-v1.1  (2026-11-11)

## Corpus Check
- 116 files · ~99,056 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 2, .css 2, .graphify-bak 1)

## Summary
- 942 nodes · 3098 edges · 36 communities (33 shown, 3 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 80 edges (avg confidence: 0.85)
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
- Utilities
- Supabase & Data
- App Core
- Admin Pages
- Settings & Config
- Navigation & Routing
- Animations
- BucketList
- Notebook
- Image Assets
- Particle Systems
- Background Effects
- Theme & Appearance
- Door Logic
- A11y & Performance
- Love Wheel Core
- Character Creator
- Asset Management
- House Operations
- Image Processing
- Sprite Logic
- Pet Systems
- Garden Logic
- Walker Logic

## God Nodes (most connected - your core abstractions)
1. `LittleRoomPage()` - 70 edges
2. `react` - 68 edges
3. `lucide-react` - 49 edges
4. `publicUrl()` - 49 edges
5. `useToast()` - 48 edges
6. `errMsg()` - 46 edges
7. `useAuth()` - 45 edges
8. `useSite()` - 37 edges
9. `Modal()` - 36 edges
10. `Spinner()` - 32 edges

## Surprising Connections (you probably didn't know these)
- `SiteProvider()` --indirect_call--> `publicUrl()`  [INFERRED]
  src/context/SiteContext.tsx → src/lib/storage.ts
- `deleteAssetFile()` --calls--> `removeFiles()`  [EXTRACTED]
  src/little-room/utils/assetManagement.ts → src/lib/storage.ts
- `App()` --calls--> `Layout()`  [EXTRACTED]
  src/App.tsx → src/components/Layout.tsx
- `BackgroundEffect()` --calls--> `useSite()`  [EXTRACTED]
  src/components/BackgroundEffect.tsx → src/context/SiteContext.tsx
- `BackgroundEffect()` --calls--> `createEngine()`  [EXTRACTED]
  src/components/BackgroundEffect.tsx → src/lib/bgEffects.ts

## Import Cycles
- None detected.

## Communities (36 total, 3 thin omitted)

### Community 0 - "Auth & Context"
Cohesion: 0.06
Nodes (141): lucide-react, motion, react, react-router-dom, App(), NotConfigured(), Protected(), BioEditor() (+133 more)

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
Nodes (41): ITEM_TYPES, AssetLibrary(), Props, Tab, Thumb(), ImageSeparation(), Piece, url() (+33 more)

### Community 5 - "Little Room Components"
Cohesion: 0.12
Nodes (40): newId(), AddRoomDialog(), spriteOf(), ItemBar(), RoomSettings(), KIND_MSG, LittleRoomPage(), readTime() (+32 more)

### Community 6 - "Character & Sprites"
Cohesion: 0.07
Nodes (35): dependencies, lucide-react@^0.460.0, motion@^11.11.0, react@^18.3.1, react-dom@^18.3.1, react-router-dom@^6.28.0, @supabase/supabase-js@^2.45.0, devDependencies (+27 more)

### Community 7 - "Garden & Plants"
Cohesion: 0.10
Nodes (28): CustomizeWorld(), Section(), Seg(), Slider(), Toggle(), setA11yPrefs(), AppearanceVars, backgroundCss() (+20 more)

### Community 8 - "Wheel History"
Cohesion: 0.12
Nodes (30): Ctx, FALLBACK_THEME, SiteProvider(), UpdateOpts, Appearance, applyAppearance(), buildAppearanceVars(), DEFAULT_APPEARANCE (+22 more)

### Community 9 - "Room Scene"
Cohesion: 0.12
Nodes (29): Pattern, Drops(), SpriteInfo, Drag, HouseView(), norm(), Props, PET_HEIGHT (+21 more)

### Community 10 - "Utilities"
Cohesion: 0.12
Nodes (29): CharacterCreator(), chip(), Choice(), DIRS, Props, Section, SECTIONS, Swatches() (+21 more)

### Community 11 - "Supabase & Data"
Cohesion: 0.14
Nodes (21): CharacterSprite(), defaultSprite(), SPRITE_HEIGHT, Cell, drawCell(), drawFront(), drawSide(), FH (+13 more)

### Community 12 - "App Core"
Cohesion: 0.15
Nodes (18): DoorOpeningTransition(), Phase, Props, AmbientParticles(), DoorBurst(), rnd(), LittleWorldDoor(), Props (+10 more)

### Community 13 - "Admin Pages"
Cohesion: 0.12
Nodes (23): ART, PanelTab, Preview(), RoomPanel(), TABS, FLOORS, ItemMeta, Layer (+15 more)

### Community 14 - "Settings & Config"
Cohesion: 0.14
Nodes (24): DEFAULT_PRESET_ID, defaultPreset(), normPlants(), a(), bedroomFrom(), defaultHouse(), defaultItems(), FOOT_DEPTH (+16 more)

### Community 15 - "Navigation & Routing"
Cohesion: 0.16
Nodes (19): BackgroundEffect(), Layout(), links, fmt(), MusicPlayer(), FLOWER_GLYPHS, HEART_GLYPHS, Item (+11 more)

### Community 16 - "Animations"
Cohesion: 0.17
Nodes (20): Props, Props, PlayerState, SiteState, Album, Bio, BUCKET_CATEGORIES, BucketCategory (+12 more)

### Community 17 - "BucketList"
Cohesion: 0.15
Nodes (20): ItemType, HItem, isPlot(), localX(), nearestSlot(), padded(), PASSIVE_MS, plantSeed() (+12 more)

### Community 18 - "Notebook"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 19 - "Image Assets"
Cohesion: 0.17
Nodes (15): DUST, Floor(), isDarkHex(), ORDER, Props, RoomScene, RoomSceneBase(), Sky (+7 more)

### Community 20 - "Particle Systems"
Cohesion: 0.28
Nodes (14): EffectKind, count(), createEngine(), Engine, fireflies(), FxParams, petals(), rain() (+6 more)

### Community 21 - "Background Effects"
Cohesion: 0.16
Nodes (12): SpritePreview(), CharLook, Dir, LIB_CATS, PlantState, ROOM_HEIGHT, ROOM_KINDS, ROOM_WIDTH (+4 more)

### Community 22 - "Theme & Appearance"
Cohesion: 0.26
Nodes (12): BEHIND, PetConfig, usePet(), readSaved(), saveChar(), Saved, useWalker(), WalkerConfig (+4 more)

### Community 23 - "Door Logic"
Cohesion: 0.24
Nodes (12): Awake(), build(), chamfer(), Constellation(), fmtLong(), fmtShort(), Label, markPlayed() (+4 more)

### Community 24 - "A11y & Performance"
Cohesion: 0.23
Nodes (11): Bloom(), PlantArt(), SEED_IDS, shade(), b(), GardenBar(), GardenTool, Props (+3 more)

### Community 25 - "Love Wheel Core"
Cohesion: 0.27
Nodes (8): A11yPrefs, DEFAULTS, get(), listeners, prefs, subscribe(), useA11yPrefs(), useReducedMotion()

### Community 26 - "Character Creator"
Cohesion: 0.27
Nodes (8): RoomDate, Sel, LayerPanel(), Props, RoomNavigation(), Props, House, Move

### Community 27 - "Asset Management"
Cohesion: 0.39
Nodes (8): useRoom(), applyPatch(), defaultRoom(), diffRoom(), isEmptyPatch(), normalizeRoom(), num(), RoomPatch

### Community 28 - "House Operations"
Cohesion: 0.36
Nodes (7): SaveStatus, useHouse(), Op, applyOps(), diffHouse(), isObj(), sameJson()

### Community 29 - "Image Processing"
Cohesion: 0.47
Nodes (5): CalendarModal(), fmt(), nextYearly(), NoteModal(), PhotoModal()

### Community 30 - "Sprite Logic"
Cohesion: 0.40
Nodes (6): hex(), num(), oneOf(), sanitizeAppearance(), sanitizeSaved(), sanitizeTheme()

### Community 31 - "Pet Systems"
Cohesion: 0.50
Nodes (4): TNode, META, Media, Props

### Community 32 - "Garden Logic"
Cohesion: 0.40
Nodes (5): hex(), normLook(), normPreset(), normSheet(), pick()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Auth & Context` to `Memory Management`, `Music & Audio`, `Door Transitions`, `Little Room Components`, `Character & Sprites`, `Garden & Plants`, `Wheel History`, `Room Scene`, `Utilities`, `App Core`, `Admin Pages`, `Navigation & Routing`, `Image Assets`, `Background Effects`, `Theme & Appearance`, `Door Logic`, `Love Wheel Core`, `Character Creator`, `Asset Management`, `House Operations`, `Image Processing`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `LittleRoomPage()` (e.g. with `readTime()` and `readPetPref()`) actually correct?**
  _`LittleRoomPage()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Auth & Context` be split into smaller, more focused modules?**
  _Cohesion score 0.05533275210694565 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Auth & Context` to `Memory Management`, `Music & Audio`, `Door Transitions`, `Little Room Components`, `Character & Sprites`, `Garden & Plants`, `Room Scene`, `Utilities`, `App Core`, `Admin Pages`, `Navigation & Routing`, `Door Logic`, `A11y & Performance`, `Character Creator`, `Image Processing`, `Pet Systems`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Should `UI Layouts` be split into smaller, more focused modules?**
  _Cohesion score 0.05064935064935065 - nodes in this community are weakly interconnected._
- **Why does `useToast()` connect `Auth & Context` to `Memory Management`, `Music & Audio`, `Door Transitions`, `Garden & Plants`, `Wheel History`, `Utilities`, `Asset Management`, `House Operations`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Memory Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09551020408163265 - nodes in this community are weakly interconnected._