/**
 * "Our Little Room" — data model, catalogue and merge logic (pure; no React / Supabase).
 * The room is stored inside the existing `settings.theme` JSON under the key `room`,
 * so it needs no new table and no migration.
 */

export const ROOM_W = 800
export const ROOM_H = 520
export const FLOOR_Y = 350

export type ItemType =
  | 'bed' | 'nightstand' | 'desk' | 'shelf' | 'bookcase' | 'beanbag' | 'radio' | 'rug'
  | 'window' | 'plant' | 'lamp' | 'floorlamp' | 'poster' | 'frame' | 'calendar' | 'clock'
  | 'cat' | 'teddy' | 'books' | 'mug' | 'neon' | 'lights' | 'cushion'
  | 'sofa' | 'coffeetable' | 'tv' | 'fridge' | 'counter' | 'table' | 'chair' | 'toilet' | 'sink' | 'bathtub' | 'mirror'
  | 'tree' | 'bush' | 'flowerpot' | 'soil' | 'raisedbed' | 'fence' | 'pathway' | 'bench' | 'lamppost' | 'pond' | 'birdbath' | 'gnome'

export type Tab = 'furniture' | 'rugs' | 'decor'
export type Layer = 'rug' | 'wall' | 'floor'

export interface ItemMeta {
  label: string
  tab: Tab
  layer: Layer
  w: number
  h: number
  variants: string[]
  /** only one allowed in the room */
  single?: boolean
}

export const META: Record<ItemType, ItemMeta> = {
  bed:        { label: 'Bed',            tab: 'furniture', layer: 'floor', w: 270, h: 140, variants: ['Blush', 'Lilac', 'Sage', 'Cream', 'Sky', 'Peach'], single: true },
  nightstand: { label: 'Bedside table',  tab: 'furniture', layer: 'floor', w: 70,  h: 75,  variants: ['Wood', 'White', 'Blush'] },
  desk:       { label: 'Desk',           tab: 'furniture', layer: 'floor', w: 200, h: 120, variants: ['Wood', 'White', 'Lilac'], single: true },
  shelf:      { label: 'Wall shelf',     tab: 'furniture', layer: 'wall',  w: 150, h: 60,  variants: ['Books', 'Cosy', 'Plants'] },
  bookcase:   { label: 'Bookcase',       tab: 'furniture', layer: 'floor', w: 100, h: 170, variants: ['Wood', 'White'] },
  beanbag:    { label: 'Bean bag',       tab: 'furniture', layer: 'floor', w: 90,  h: 65,  variants: ['Blush', 'Lilac', 'Sage', 'Sky'] },
  radio:      { label: 'Music player',   tab: 'furniture', layer: 'floor', w: 70,  h: 50,  variants: ['Cream', 'Blush', 'Mint'], single: true },
  rug:        { label: 'Rug',            tab: 'rugs',      layer: 'rug',   w: 300, h: 70,  variants: ['Blush round', 'Lilac stripes', 'Sage', 'Hearts', 'Cream shag'] },
  window:     { label: 'Window',         tab: 'decor',     layer: 'wall',  w: 150, h: 135, variants: ['Blush curtains', 'Lilac curtains', 'Sage curtains', 'Cream curtains'], single: true },
  plant:      { label: 'Plant',          tab: 'decor',     layer: 'floor', w: 60,  h: 100, variants: ['Monstera', 'Cactus', 'Fern', 'Flowers', 'Tall leaf'] },
  lamp:       { label: 'Table lamp',     tab: 'decor',     layer: 'floor', w: 46,  h: 70,  variants: ['Blush', 'Cream', 'Lilac'] },
  floorlamp:  { label: 'Floor lamp',     tab: 'decor',     layer: 'floor', w: 50,  h: 190, variants: ['Gold', 'White'] },
  poster:     { label: 'Poster',         tab: 'decor',     layer: 'wall',  w: 74,  h: 100, variants: ['Mountains', 'Moon', 'Heart', 'Flower', 'Sunset', 'Our world'] },
  frame:      { label: 'Photo frame',    tab: 'decor',     layer: 'wall',  w: 80,  h: 96,  variants: ['Gold', 'White', 'Wood', 'Blush'] },
  calendar:   { label: 'Calendar',       tab: 'decor',     layer: 'wall',  w: 62,  h: 78,  variants: ['Blush', 'Lilac'], single: true },
  clock:      { label: 'Wall clock',     tab: 'decor',     layer: 'wall',  w: 56,  h: 56,  variants: ['Cream', 'Blush'] },
  cat:        { label: 'Sleepy cat',     tab: 'decor',     layer: 'floor', w: 70,  h: 40,  variants: ['Ginger', 'Grey', 'Cream'] },
  teddy:      { label: 'Teddy bear',     tab: 'decor',     layer: 'floor', w: 50,  h: 60,  variants: ['Brown', 'Pink'] },
  books:      { label: 'Book stack',     tab: 'decor',     layer: 'floor', w: 50,  h: 36,  variants: ['Pastel', 'Warm'] },
  mug:        { label: 'Cosy mug',       tab: 'decor',     layer: 'floor', w: 24,  h: 26,  variants: ['Blush', 'Cream', 'Sky'] },
  neon:       { label: 'Neon heart',     tab: 'decor',     layer: 'wall',  w: 60,  h: 56,  variants: ['Pink', 'Gold', 'Lilac'] },
  lights:     { label: 'Fairy lights',   tab: 'decor',     layer: 'wall',  w: 520, h: 50,  variants: ['Warm', 'Pink'] },
  sofa:       { label: 'Sofa',           tab: 'furniture', layer: 'floor', w: 210, h: 95,  variants: ['Blush', 'Lilac', 'Sage', 'Cream'] },
  coffeetable:{ label: 'Coffee table',   tab: 'furniture', layer: 'floor', w: 110, h: 46,  variants: ['Wood', 'White'] },
  tv:         { label: 'TV & stand',     tab: 'furniture', layer: 'floor', w: 130, h: 100, variants: ['Wood', 'White'] },
  fridge:     { label: 'Fridge',         tab: 'furniture', layer: 'floor', w: 74,  h: 165, variants: ['White', 'Mint', 'Pink'] },
  counter:    { label: 'Kitchen counter',tab: 'furniture', layer: 'floor', w: 230, h: 125, variants: ['Wood', 'White', 'Sage'] },
  table:      { label: 'Dining table',   tab: 'furniture', layer: 'floor', w: 140, h: 82,  variants: ['Wood', 'White'] },
  chair:      { label: 'Chair',          tab: 'furniture', layer: 'floor', w: 52,  h: 92,  variants: ['Wood', 'Blush', 'Sage'] },
  toilet:     { label: 'Toilet',         tab: 'furniture', layer: 'floor', w: 62,  h: 82,  variants: ['White'] },
  sink:       { label: 'Sink',           tab: 'furniture', layer: 'floor', w: 84,  h: 90,  variants: ['White', 'Blush'] },
  bathtub:    { label: 'Bathtub',        tab: 'furniture', layer: 'floor', w: 200, h: 84,  variants: ['White', 'Blush'] },
  mirror:     { label: 'Mirror',         tab: 'decor',     layer: 'wall',  w: 70,  h: 92,  variants: ['Gold', 'White'] },
  tree:       { label: 'Tree',           tab: 'decor',     layer: 'floor', w: 150, h: 230, variants: ['Oak', 'Pine', 'Cherry blossom', 'Autumn'] },
  bush:       { label: 'Bush',           tab: 'decor',     layer: 'floor', w: 100, h: 64,  variants: ['Green', 'Berry', 'Flowering'] },
  flowerpot:  { label: 'Flower pot',     tab: 'decor',     layer: 'floor', w: 56,  h: 70,  variants: ['Terracotta', 'White', 'Blue', 'Pink'] },
  soil:       { label: 'Soil patch',     tab: 'decor',     layer: 'rug',   w: 110, h: 30,  variants: ['Tilled soil', 'Dark soil'] },
  raisedbed:  { label: 'Raised bed',     tab: 'decor',     layer: 'floor', w: 240, h: 56,  variants: ['Wood', 'Stone'] },
  fence:      { label: 'Fence',          tab: 'decor',     layer: 'floor', w: 160, h: 70,  variants: ['Wood', 'White picket', 'Stone'] },
  pathway:    { label: 'Pathway',        tab: 'rugs',      layer: 'rug',   w: 170, h: 40,  variants: ['Stepping stones', 'Brick', 'Planks', 'Sand'] },
  bench:      { label: 'Garden bench',   tab: 'furniture', layer: 'floor', w: 130, h: 76,  variants: ['Wood', 'White', 'Green'] },
  lamppost:   { label: 'Lamp post',      tab: 'decor',     layer: 'floor', w: 34,  h: 180, variants: ['Black', 'Gold'] },
  pond:       { label: 'Pond',           tab: 'decor',     layer: 'rug',   w: 190, h: 44,  variants: ['Blue', 'Teal'] },
  birdbath:   { label: 'Bird bath',      tab: 'decor',     layer: 'floor', w: 54,  h: 72,  variants: ['Stone', 'White'] },
  gnome:      { label: 'Garden gnome',   tab: 'decor',     layer: 'floor', w: 38,  h: 58,  variants: ['Red hat', 'Blue hat', 'Green hat'] },
  cushion:    { label: 'Floor cushion',  tab: 'decor',     layer: 'floor', w: 56,  h: 26,  variants: ['Blush', 'Lilac', 'Sage'] },
}
export const ITEM_TYPES = Object.keys(META) as ItemType[]

export interface RoomItem {
  id: string
  type: ItemType
  x: number // bottom-centre anchor, in room units
  y: number
  s: number // scale
  r: number // rotation, degrees
  f: boolean // mirrored
  v: number // style index
  media?: string // photo frame: media id
}

export interface RoomDate { id: string; label: string; date: string }

export type Pattern = 'plain' | 'stripes' | 'dots' | 'hearts' | 'stars' | 'gingham'
export type TimeMode = 'auto' | 'day' | 'dusk' | 'night'
export type Scene = 'garden' | 'city' | 'sea' | 'rain' | 'snow'

export interface RoomState {
  v: 1
  wall: string
  pattern: Pattern
  floor: string
  lights: boolean
  scene: Scene
  note: string
  dates: RoomDate[]
  items: Record<string, RoomItem>
}

export const PATTERNS: { id: Pattern; label: string }[] = [
  { id: 'plain', label: 'Plain' }, { id: 'stripes', label: 'Stripes' }, { id: 'dots', label: 'Dots' },
  { id: 'hearts', label: 'Hearts' }, { id: 'stars', label: 'Stars' }, { id: 'gingham', label: 'Gingham' },
]
export const SCENES: { id: Scene; label: string }[] = [
  { id: 'garden', label: 'Garden' }, { id: 'city', label: 'City lights' }, { id: 'sea', label: 'Sea' },
  { id: 'rain', label: 'Rainy day' }, { id: 'snow', label: 'Snowfall' },
]
export const FLOORS: Record<string, { label: string; a: string; b: string; kind: 'plank' | 'checker' | 'carpet' }> = {
  wood:    { label: 'Warm wood',  a: '#d9a574', b: '#c98f5d', kind: 'plank' },
  birch:   { label: 'Birch',      a: '#ecd3b0', b: '#dcbd94', kind: 'plank' },
  dark:    { label: 'Walnut',     a: '#9a6b4b', b: '#845a3d', kind: 'plank' },
  checker: { label: 'Checkerboard', a: '#fbf1e6', b: '#f3c9d3', kind: 'checker' },
  carpet:  { label: 'Soft carpet', a: '#e9d5ef', b: '#e2c9ea', kind: 'carpet' },
}
export const WALL_COLORS = ['#fbe3e8', '#f4d9ea', '#e6dcf7', '#dcecf7', '#dff1e4', '#fdf0d5', '#fbe0d0', '#f3efe9', '#3d3558', '#2f4a4a']

export interface RoomTheme { id: string; label: string; wall: string; pattern: Pattern; floor: string }
export const THEMES: RoomTheme[] = [
  { id: 'blush',    label: 'Blush cottage',  wall: '#fbe3e8', pattern: 'hearts',  floor: 'wood' },
  { id: 'lavender', label: 'Lavender dream', wall: '#e6dcf7', pattern: 'stars',   floor: 'carpet' },
  { id: 'sage',     label: 'Sage garden',    wall: '#dff1e4', pattern: 'stripes', floor: 'birch' },
  { id: 'honey',    label: 'Honey café',     wall: '#fdf0d5', pattern: 'gingham', floor: 'checker' },
  { id: 'midnight', label: 'Midnight stars', wall: '#3d3558', pattern: 'stars',   floor: 'dark' },
]

let seq = 0
export const newId = () => `i${Date.now().toString(36)}${(seq++).toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`

export function makeItem(type: ItemType, over: Partial<RoomItem> = {}): RoomItem {
  const m = META[type]
  const wall = m.layer === 'wall'
  return {
    id: newId(), type,
    x: ROOM_W / 2 + (Math.random() - 0.5) * 60,
    y: wall ? 190 : m.layer === 'rug' ? 470 : 440,
    s: 1, r: 0, f: false, v: 0, ...over,
  }
}

export function defaultRoom(): RoomState {
  const list: RoomItem[] = [
    { id: 'rug1', type: 'rug', x: 400, y: 478, s: 1, r: 0, f: false, v: 0 },
    { id: 'lights1', type: 'lights', x: 400, y: 62, s: 1.4, r: 0, f: false, v: 0 },
    { id: 'win1', type: 'window', x: 305, y: 268, s: 1, r: 0, f: false, v: 0 },
    { id: 'cal1', type: 'calendar', x: 430, y: 240, s: 1, r: 0, f: false, v: 0 },
    { id: 'frame1', type: 'frame', x: 515, y: 232, s: 0.85, r: -4, f: false, v: 0 },
    { id: 'frame2', type: 'frame', x: 595, y: 215, s: 0.7, r: 3, f: false, v: 3 },
    { id: 'poster1', type: 'poster', x: 700, y: 245, s: 1, r: 0, f: false, v: 5 },
    { id: 'shelf1', type: 'shelf', x: 120, y: 205, s: 1, r: 0, f: false, v: 0 },
    { id: 'neon1', type: 'neon', x: 205, y: 150, s: 0.8, r: 0, f: false, v: 0 },
    { id: 'desk1', type: 'desk', x: 110, y: 430, s: 1, r: 0, f: false, v: 0 },
    { id: 'radio1', type: 'radio', x: 170, y: 322, s: 0.9, r: 0, f: false, v: 0 },
    { id: 'mug1', type: 'mug', x: 62, y: 322, s: 1, r: 0, f: false, v: 0 },
    { id: 'plant1', type: 'plant', x: 235, y: 438, s: 1, r: 0, f: false, v: 0 },
    { id: 'bed1', type: 'bed', x: 625, y: 440, s: 1, r: 0, f: false, v: 0 },
    { id: 'cat1', type: 'cat', x: 580, y: 364, s: 0.7, r: 0, f: false, v: 0 },
    { id: 'ns1', type: 'nightstand', x: 450, y: 438, s: 1, r: 0, f: false, v: 0 },
    { id: 'lamp1', type: 'lamp', x: 450, y: 365, s: 1, r: 0, f: false, v: 0 },
    { id: 'teddy1', type: 'teddy', x: 330, y: 482, s: 0.75, r: -6, f: false, v: 0 },
  ]
  return {
    v: 1, wall: '#fbe3e8', pattern: 'hearts', floor: 'wood', lights: true, scene: 'garden',
    note: 'Dear love, I hope today treats you gently. Come sit with me a while ♡', dates: [],
    items: Object.fromEntries(list.map((i) => [i.id, i])),
  }
}

const num = (v: unknown, d: number, lo: number, hi: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d

/** Accepts whatever is in the database and always returns a valid room. */
export function normalizeRoom(raw: unknown): RoomState {
  const base = defaultRoom()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Record<string, any>
  if (r.v !== 1 || !r.items || typeof r.items !== 'object') return base
  const items: Record<string, RoomItem> = {}
  for (const [id, it] of Object.entries(r.items as Record<string, any>)) {
    if (!it || typeof it.type !== 'string' || !(it.type in META)) continue
    const m = META[it.type as ItemType]
    items[id] = {
      id, type: it.type, x: num(it.x, 400, 0, ROOM_W), y: num(it.y, 400, 0, ROOM_H),
      s: num(it.s, 1, 0.4, 2.2), r: num(it.r, 0, -180, 180), f: Boolean(it.f),
      v: Math.floor(num(it.v, 0, 0, m.variants.length - 1)),
      media: typeof it.media === 'string' ? it.media : undefined,
    }
  }
  return {
    v: 1,
    wall: typeof r.wall === 'string' && /^#[0-9a-f]{6}$/i.test(r.wall) ? r.wall : base.wall,
    pattern: PATTERNS.some((p) => p.id === r.pattern) ? r.pattern : base.pattern,
    floor: r.floor in FLOORS ? r.floor : base.floor,
    lights: typeof r.lights === 'boolean' ? r.lights : true,
    scene: SCENES.some((s) => s.id === r.scene) ? r.scene : 'garden',
    note: typeof r.note === 'string' ? r.note.slice(0, 600) : base.note,
    dates: Array.isArray(r.dates)
      ? r.dates.filter((d: any) => d && typeof d.id === 'string' && typeof d.label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)).slice(0, 40)
      : [],
    items,
  }
}

/* ---------- conflict-safe saving: send only what *you* changed, apply it onto the latest ---------- */

export type Scalars = Pick<RoomState, 'wall' | 'pattern' | 'floor' | 'lights' | 'scene' | 'note' | 'dates'>
export interface RoomPatch {
  set?: Partial<Scalars>
  items?: Record<string, RoomItem | null> // null = removed
}
const SCALARS: (keyof Scalars)[] = ['wall', 'pattern', 'floor', 'lights', 'scene', 'note', 'dates']

export function diffRoom(base: RoomState, next: RoomState): RoomPatch {
  const patch: RoomPatch = {}
  for (const k of SCALARS) {
    if (JSON.stringify(base[k]) !== JSON.stringify(next[k])) {
      if (!patch.set) patch.set = {}
      patch.set[k] = next[k] as never
    }
  }
  for (const id of new Set([...Object.keys(base.items), ...Object.keys(next.items)])) {
    const a = base.items[id], b = next.items[id]
    if (!b) {
      if (!patch.items) patch.items = {}
      patch.items[id] = null
    }
    else if (!a || JSON.stringify(a) !== JSON.stringify(b)) {
      if (!patch.items) patch.items = {}
      patch.items[id] = b
    }
  }
  return patch
}

export const isEmptyPatch = (p: RoomPatch) => !p.set && !p.items

export function applyPatch(room: RoomState, patch: RoomPatch): RoomState {
  const items = { ...room.items }
  for (const [id, it] of Object.entries(patch.items ?? {})) {
    if (it === null) delete items[id]
    else items[id] = it
  }
  return { ...room, ...(patch.set ?? {}), items }
}
