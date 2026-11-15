import { FLOORS, META, PATTERNS, SCENES, defaultRoom, newId, normalizeRoom, type ItemType, type RoomState } from '../../lib/room'
import { DEFAULT_PRESET_ID, defaultPreset, normPreset } from './character'
import { GROUNDS, normPlants, slotsOf } from './garden'
import { defaultPet, normPet } from './pets'
import { FLOOR, ROOM_BOTTOM, ROOM_KINDS, ROOM_LIMITS, ROOM_WIDTH, LIB_CATS, type Asset, type HItem, type HRoom, type CharPreset, type House, type Pet, type LibCat, type Op, type RoomKind } from '../types/littleRoom'

/* ---------------------------------------------------------------- defaults */

const a = (id: string, type: ItemType, x: number, y: number, o: Partial<HItem> = {}): HItem => ({
  id, kind: 'art', type, name: META[type].label, x, y, s: 1, r: 0, f: false, v: 0, ...o,
})

type Spec = [string, ItemType, number, number, Partial<HItem>?]
const mk = (prefix: string, specs: Spec[]): HItem[] => specs.map(([k, t, x, y, o]) => a(`${prefix}-${k}`, t, x, y, o))

/** Starting furniture for each kind of room. Ids are fixed, so every device builds the identical default. */
export function defaultItems(kind: RoomKind, prefix: string): HItem[] {
  switch (kind) {
    case 'living': return mk(prefix, [
      ['rug', 'rug', 400, 486, { v: 1 }], ['lights', 'lights', 400, 62, { s: 1.4 }], ['win', 'window', 170, 268, { v: 1 }],
      ['f1', 'frame', 335, 222, { s: 0.85, r: -3 }], ['f2', 'frame', 425, 212, { s: 0.7, r: 3, v: 3 }],
      ['sofa', 'sofa', 380, 452, { v: 1 }], ['table', 'coffeetable', 380, 486, { s: 0.85 }],
      ['tv', 'tv', 640, 448], ['plant', 'plant', 55, 442, { v: 4 }], ['lamp', 'floorlamp', 560, 450],
      ['book', 'bookcase', 740, 446, { s: 0.95 }], ['cat', 'cat', 262, 360, { s: 0.55 }],
    ])
    case 'kitchen': return mk(prefix, [
      ['win', 'window', 520, 268, { v: 3 }], ['lights', 'lights', 400, 62, { s: 1.2, v: 1 }],
      ['fridge', 'fridge', 62, 448], ['counter', 'counter', 240, 448], ['mug', 'mug', 330, 346],
      ['clock', 'clock', 230, 190], ['table', 'table', 620, 460], ['c1', 'chair', 540, 462], ['c2', 'chair', 700, 462, { f: true }],
      ['plant', 'plant', 760, 346, { s: 0.45, v: 2 }],
    ])
    case 'bathroom': return mk(prefix, [
      ['rug', 'rug', 400, 488, { v: 2, s: 0.7 }], ['tub', 'bathtub', 225, 452], ['toilet', 'toilet', 450, 450],
      ['mirror', 'mirror', 630, 238], ['sink', 'sink', 630, 450], ['plant', 'plant', 740, 444, { v: 2, s: 0.8 }],
      ['win', 'window', 340, 255, { v: 0, s: 0.6 }],
    ])
    case 'study': return mk(prefix, [
      ['rug', 'rug', 400, 486, { v: 4 }], ['win', 'window', 560, 268, { v: 2 }], ['desk', 'desk', 250, 452, { v: 1 }],
      ['chair', 'chair', 330, 460], ['lamp', 'lamp', 160, 340], ['shelf', 'shelf', 250, 205], ['book', 'bookcase', 55, 446],
      ['plant', 'plant', 730, 442, { v: 0 }], ['f1', 'frame', 440, 222, { s: 0.8 }], ['books', 'books', 330, 340],
    ])
    case 'storage': return mk(prefix, [
      ['b1', 'bookcase', 90, 446], ['b2', 'bookcase', 210, 446, { v: 1 }], ['shelf', 'shelf', 420, 200, { v: 2 }],
      ['books', 'books', 560, 450], ['cush', 'cushion', 650, 450, { v: 1 }], ['lamp', 'floorlamp', 740, 450],
    ])
    case 'hallway': return mk(prefix, [
      ['rug', 'rug', 400, 488, { v: 0, s: 0.9 }], ['lights', 'lights', 400, 62, { s: 1.3 }], ['f1', 'frame', 200, 230, { s: 0.8 }], ['f2', 'frame', 330, 222, { s: 0.7, v: 2 }],
      ['f3', 'frame', 560, 228, { s: 0.85, v: 3 }], ['plant', 'plant', 70, 442, { v: 4 }], ['lamp', 'floorlamp', 730, 450], ['mirror', 'mirror', 440, 238],
    ])
    case 'garden': return mk(prefix, [
      ['path1', 'pathway', 120, 505, { v: 0 }], ['path2', 'pathway', 290, 520, { v: 0 }], ['path3', 'pathway', 460, 505, { v: 0, f: true }],
      ['f1', 'fence', 80, 372], ['f2', 'fence', 240, 372], ['f3', 'fence', 400, 372], ['f4', 'fence', 560, 372], ['f5', 'fence', 720, 372],
      ['tree', 'tree', 135, 408, { s: 0.95 }], ['lamp', 'lamppost', 215, 392], ['bush', 'bush', 690, 406], ['bench', 'bench', 360, 424, { v: 2 }],
      ['bed', 'raisedbed', 600, 470], ['soil', 'soil', 520, 505], ['pot1', 'flowerpot', 735, 500, { v: 3 }], ['pot2', 'flowerpot', 40, 478], ['gnome', 'gnome', 650, 515],
    ])
    case 'custom': return mk(prefix, [['rug', 'rug', 400, 486, { v: 3 }], ['lamp', 'lamp', 130, 440], ['plant', 'plant', 700, 442]])
    case 'bedroom':
    default: return []
  }
}

const KIND_STYLE: Record<RoomKind, { wall: string; pattern: HRoom['pattern']; floor: string }> = {
  living: { wall: '#e6dcf7', pattern: 'stars', floor: 'birch' },
  kitchen: { wall: '#fdf0d5', pattern: 'gingham', floor: 'checker' },
  bedroom: { wall: '#fbe3e8', pattern: 'hearts', floor: 'wood' },
  bathroom: { wall: '#dcecf7', pattern: 'dots', floor: 'checker' },
  study: { wall: '#dff1e4', pattern: 'stripes', floor: 'dark' },
  hallway: { wall: '#fdf0d5', pattern: 'plain', floor: 'birch' },
  garden: { wall: '#cfe8f7', pattern: 'plain', floor: 'meadow' },
  storage: { wall: '#f3efe9', pattern: 'plain', floor: 'birch' },
  custom: { wall: '#fbe3e8', pattern: 'plain', floor: 'wood' },
}

export function makeRoom(id: string, kind: RoomKind, name: string, items?: HItem[]): HRoom {
  const st = KIND_STYLE[kind]
  const list = items ?? defaultItems(kind, id)
  return { id, name, kind, ...st, w: ROOM_WIDTH, h: ROOM_BOTTOM, lights: true, scene: 'garden', items: Object.fromEntries(list.map((i) => [i.id, i])), order: list.map((i) => i.id) }
}

/** Sorts a flat item list into sensible layers: rugs at the back, then wall pieces, then floor furniture by depth. */
function layered(items: HItem[]): HItem[] {
  const rank = (i: HItem) => (i.type ? ({ rug: 0, wall: 1, floor: 2 }[META[i.type].layer]) : 2)
  return [...items].sort((p, q) => rank(p) - rank(q) || (rank(p) === 2 ? p.y - q.y : 0))
}

/** The bedroom is the old single "Little Room", so nothing you already decorated is lost. */
function bedroomFrom(old: RoomState | null): HRoom {
  if (!old) {
    const base = defaultRoom()
    const items = layered(Object.values(base.items).map((i) => a(`bed-${i.id}`, i.type, i.x, i.y, { s: i.s, r: i.r, f: i.f, v: i.v, media: i.media })))
    return { ...makeRoom('bedroom', 'bedroom', 'Bedroom', items), wall: base.wall, pattern: base.pattern, floor: base.floor, lights: base.lights, scene: base.scene }
  }
  const items = layered(Object.values(old.items).map((i) => a(`bed-${i.id}`, i.type, i.x, i.y, { s: i.s, r: i.r, f: i.f, v: i.v, media: i.media })))
  return { ...makeRoom('bedroom', 'bedroom', 'Bedroom', items), wall: old.wall, pattern: old.pattern, floor: old.floor, lights: old.lights, scene: old.scene }
}

export function defaultHouse(oldRoom: unknown = null): House {
  const old = oldRoom && typeof oldRoom === 'object' ? normalizeRoom(oldRoom) : null
  const rooms = [makeRoom('living', 'living', 'Living Room'), makeRoom('kitchen', 'kitchen', 'Kitchen'), bedroomFrom(old), makeRoom('bathroom', 'bathroom', 'Bathroom (CR)')]
  return {
    v: 2, rooms: Object.fromEntries(rooms.map((r) => [r.id, r])), roomOrder: rooms.map((r) => r.id), assets: {},
    note: old?.note ?? 'Dear love, I hope today treats you gently. Come sit with me a while ♡', dates: old?.dates ?? [], doorColor: '#f3c9d3',
    characters: { [DEFAULT_PRESET_ID]: defaultPreset() },
    pets: { [defaultPet(rooms[0].id).id]: defaultPet(rooms[0].id) },
  }
}

/* ------------------------------------------------------------ normalisation */

const num = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)
const str = (v: unknown, d: string, max = 80) => (typeof v === 'string' && v.trim() ? v.slice(0, max) : d)

function normItem(raw: any, id: string): HItem | null {
  if (!raw || typeof raw !== 'object') return null
  const kind = raw.kind === 'asset' ? 'asset' : 'art'
  if (kind === 'art' && !(raw.type in META)) return null
  if (kind === 'asset' && typeof raw.assetId !== 'string') return null
  const m = kind === 'art' ? META[raw.type as ItemType] : null
  return {
    id, kind, type: kind === 'art' ? raw.type : undefined, assetId: kind === 'asset' ? raw.assetId : undefined,
    name: str(raw.name, m?.label ?? 'Picture'),
    x: num(raw.x, 400, -400, 2200), y: num(raw.y, 440, -400, 640), s: num(raw.s, 1, 0.15, 6), r: num(raw.r, 0, -360, 360), f: Boolean(raw.f),
    v: m ? Math.floor(num(raw.v, 0, 0, m.variants.length - 1)) : 0, media: typeof raw.media === 'string' ? raw.media : undefined,
    plants: normPlants(raw.plants, slotsOf(kind === 'art' ? raw.type : undefined)?.length ?? 0), hidden: raw.hidden === true ? true : undefined, locked: raw.locked === true ? true : undefined, solid: typeof raw.solid === 'boolean' ? raw.solid : undefined,
  }
}

function normRoom(raw: any, id: string): HRoom | null {
  if (!raw || typeof raw !== 'object') return null
  const items: Record<string, HItem> = {}
  for (const [iid, it] of Object.entries((raw.items ?? {}) as Record<string, unknown>)) { const n = normItem(it, iid); if (n) items[iid] = n }
  // keep the layer order in sync with the items (a partner may have added/removed items meanwhile)
  const seen = new Set<string>()
  const order: string[] = []
  for (const iid of Array.isArray(raw.order) ? raw.order : []) if (typeof iid === 'string' && items[iid] && !seen.has(iid)) { seen.add(iid); order.push(iid) }
  for (const iid of Object.keys(items)) if (!seen.has(iid)) order.push(iid)
  return {
    id, name: str(raw.name, 'Room'), kind: ROOM_KINDS.some((k) => k.id === raw.kind) ? raw.kind : 'custom',
    wall: /^#[0-9a-f]{6}$/i.test(raw.wall) ? raw.wall : '#fbe3e8', pattern: PATTERNS.some((p) => p.id === raw.pattern) ? raw.pattern : 'plain',
    floor: raw.floor in FLOORS || raw.floor in GROUNDS ? raw.floor : 'wood', w: Math.round(num(raw.w, ROOM_WIDTH, ROOM_LIMITS.minW, ROOM_LIMITS.maxW)), h: Math.round(num(raw.h, ROOM_BOTTOM, ROOM_LIMITS.minH, ROOM_LIMITS.maxH)), lights: raw.lights !== false, scene: SCENES.some((s) => s.id === raw.scene) ? raw.scene : 'garden', items, order,
  }
}

export function normalizeHouse(raw: unknown, oldRoom: unknown = null): House {
  const fallback = defaultHouse(oldRoom)
  if (!raw || typeof raw !== 'object' || (raw as any).v !== 2) return fallback
  const r = raw as any
  const rooms: Record<string, HRoom> = {}
  for (const [id, rr] of Object.entries((r.rooms ?? {}) as Record<string, unknown>)) { const n = normRoom(rr, id); if (n) rooms[id] = n }
  const roomOrder: string[] = []
  for (const id of Array.isArray(r.roomOrder) ? r.roomOrder : []) if (typeof id === 'string' && rooms[id] && !roomOrder.includes(id)) roomOrder.push(id)
  for (const id of Object.keys(rooms)) if (!roomOrder.includes(id)) roomOrder.push(id)
  if (!roomOrder.length) return fallback
  const assets: Record<string, Asset> = {}
  for (const [id, x] of Object.entries((r.assets ?? {}) as Record<string, any>)) {
    if (x && typeof x.path === 'string') assets[id] = { id, name: str(x.name, 'Asset'), category: LIB_CATS.includes(x.category) ? x.category : 'Custom Assets', path: x.path, w: num(x.w, 200, 1, 4096), h: num(x.h, 200, 1, 4096), from: x.from === 'extracted' ? 'extracted' : 'upload', hash: typeof x.hash === 'string' ? x.hash : undefined, created: str(x.created, '') }
  }
  const characters: Record<string, CharPreset> = {}
  for (const [id, c] of Object.entries((r.characters ?? {}) as Record<string, unknown>)) { const n = normPreset(c, id); if (n) characters[id] = n }
  if (!characters[DEFAULT_PRESET_ID]) characters[DEFAULT_PRESET_ID] = defaultPreset()
  // pets: a house that never had any gets the default one; once you have changed the list, it is kept exactly as you left it
  const pets: Record<string, Pet> = {}
  if (r.pets && typeof r.pets === 'object') { for (const [id, pp] of Object.entries(r.pets as Record<string, unknown>)) { const n = normPet(pp, id, roomOrder); if (n) pets[id] = n } }
  else { const d = defaultPet(roomOrder[0]); pets[d.id] = d }
  return {
    v: 2, rooms, roomOrder, assets,
    note: typeof r.note === 'string' ? r.note.slice(0, 600) : fallback.note,
    dates: Array.isArray(r.dates) ? r.dates.filter((d: any) => d && typeof d.id === 'string' && typeof d.label === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date)).slice(0, 60) : [],
    doorColor: /^#[0-9a-f]{6}$/i.test(r.doorColor) ? r.doorColor : '#f3c9d3',
    characters,
    pets,
  }
}

/* ------------------------------------------------- conflict-safe diff / apply */
// Objects are compared key by key down to the item level (rooms → room → items → item); arrays and leaves are whole values.
// A save only sends what *you* changed, and is applied on top of the newest copy, so a partner's edits are never overwritten.

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const sameJson = (p: unknown, q: unknown) => p === q || JSON.stringify(p) === JSON.stringify(q)
const MAX_DEPTH = 4 // house.rooms[id].items[id] is depth 4: an item is one whole value

export function diffHouse(base: unknown, next: unknown, path: string[] = []): Op[] {
  if (sameJson(base, next)) return []
  if (path.length < MAX_DEPTH && isObj(base) && isObj(next)) {
    const ops: Op[] = []
    for (const k of new Set([...Object.keys(base), ...Object.keys(next)])) ops.push(...diffHouse(base[k], next[k], [...path, k]))
    return ops
  }
  return [{ path, value: next }]
}

export function applyOps<T>(root: T, ops: Op[]): T {
  const out: any = Array.isArray(root) ? [...(root as any)] : { ...(root as any) }
  for (const { path, value } of ops) {
    let cur = out
    for (let i = 0; i < path.length - 1; i++) {
      const k = path[i]
      // deleting something inside a room that no longer exists is a no-op
      if (!isObj(cur[k])) { if (value === undefined) { cur = null; break } cur[k] = {} } else cur[k] = { ...(cur[k] as object) }
      cur = cur[k]
    }
    if (!cur) continue
    const last = path[path.length - 1]
    if (value === undefined) delete cur[last]; else cur[last] = value
  }
  return out as T
}

/* ------------------------------------------------------------------ helpers */

export const SOLID_TYPES = new Set<ItemType>(['tree', 'bush', 'flowerpot', 'raisedbed', 'fence', 'bench', 'lamppost', 'pond', 'birdbath', 'bed', 'desk', 'bookcase', 'sofa', 'fridge', 'counter', 'bathtub', 'table', 'nightstand', 'tv', 'toilet', 'sink'])
/** Big furniture blocks the character (you walk around it); "Solid" in the item bar overrides this for any piece. */
export const isSolid = (i: HItem) => (i.solid !== undefined ? i.solid : i.kind === 'art' && !!i.type && SOLID_TYPES.has(i.type))

export function itemSize(i: HItem, assets: Record<string, Asset>): { w: number; h: number } {
  if (i.kind === 'art' && i.type) return { w: META[i.type].w, h: META[i.type].h }
  const as = i.assetId ? assets[i.assetId] : undefined
  const k = as ? 200 / Math.max(as.w, as.h, 1) : 1
  return as ? { w: as.w * k, h: as.h * k } : { w: 120, h: 120 }
}

/** Where each room sits in the world: rooms are placed side by side, all standing on the same ground line. */
export interface Layout { x: number[]; w: number[]; h: number[]; total: number; maxH: number; top: number; worldH: number }
export function layoutOf(house: House): Layout {
  const x: number[] = [], w: number[] = [], h: number[] = []
  let at = 0
  for (const id of house.roomOrder) { const r = house.rooms[id]; x.push(at); w.push(r.w); h.push(r.h); at += r.w }
  const maxH = Math.max(...h, ROOM_LIMITS.minH)
  return { x, w, h, total: at, maxH, top: ROOM_BOTTOM + 10 - maxH - 20, worldH: maxH + 20 }
}
/** Index of the room that holds world position `wx`. */
export function roomAt(l: Layout, wx: number): number {
  for (let i = l.x.length - 1; i >= 0; i--) if (wx >= l.x[i]) return i
  return 0
}

/** The floor patch a solid piece of furniture covers (world units). The character can't step into it. */
export interface Block { x0: number; x1: number; y0: number; y1: number }
export const FOOT_DEPTH = 22 // how far in front of / behind its base line a piece blocks you
export const WALK_TOP = FLOOR + 36 // the farthest back (up) the character can stand
export const WALK_BOTTOM = ROOM_BOTTOM - 14

/** how much of a piece's width actually blocks you (a tree trunk is much narrower than its leaves) */
const FOOT_FACTOR: Partial<Record<ItemType, number>> = { tree: 0.22, lamppost: 0.6, birdbath: 0.6, bush: 0.7, fence: 0.95, pond: 0.8 }
export const HALF_W = 12 // the character's footprint (half width / half depth)
export const HALF_D = 5
/** Can the character stand with its feet at (x, y)? Inside the house, on the floor, and not inside solid furniture. */
export function canStand(blocks: Block[], collision: boolean, worldW: number, x: number, y: number, hw = HALF_W, hd = HALF_D): boolean {
  if (x < 24 || x > worldW - 24 || y < WALK_TOP || y > WALK_BOTTOM) return false
  return !collision || !blocks.some((b) => x + hw > b.x0 && x - hw < b.x1 && y + hd > b.y0 && y - hd < b.y1)
}

/** Solid furniture as world-space floor patches. Anything near a doorway is ignored so a door can never be blocked. */
export function solidBlocks(house: House): Block[] {
  const out: Block[] = []
  const l = layoutOf(house)
  house.roomOrder.forEach((rid, idx) => {
    const room = house.rooms[rid]
    for (const id of room.order) {
      const it = room.items[id]
      if (!it || it.hidden || !isSolid(it) || it.y < FLOOR + 20) continue
      const { w } = itemSize(it, house.assets)
      const cx = l.x[idx] + it.x, half = (w * it.s) / 2 * (it.type ? FOOT_FACTOR[it.type] ?? 0.78 : 0.78)
      const x0 = cx - half, x1 = cx + half
      let nearDoor = false
      for (let d = 1; d < l.x.length; d++) if (x1 > l.x[d] - 80 && x0 < l.x[d] + 80) nearDoor = true
      if (!nearDoor) out.push({ x0, x1, y0: it.y - FOOT_DEPTH, y1: it.y + 6 })
    }
  })
  return out
}

const GARDEN_TYPES = new Set<ItemType>(['tree', 'bush', 'flowerpot', 'soil', 'raisedbed', 'fence', 'pathway', 'bench', 'lamppost', 'pond', 'birdbath', 'gnome'])
export const categoryOf = (t: ItemType): LibCat => {
  if (GARDEN_TYPES.has(t)) return 'Garden'
  if (t === 'plant') return 'Plants'
  if (['fridge', 'counter', 'tv', 'radio', 'toilet', 'sink', 'bathtub'].includes(t)) return 'Appliances'
  if (META[t].tab === 'decor' || t === 'rug') return 'Decorations'
  return 'Furniture'
}

export const roomId = () => `r${newId()}`
export const assetId = () => `a${newId()}`

export function newArtItem(type: ItemType, over: Partial<HItem> = {}): HItem {
  const m = META[type]
  return { id: newId(), kind: 'art', type, name: m.label, x: 400, y: m.layer === 'wall' ? 220 : m.layer === 'rug' ? 480 : 450, s: 1, r: 0, f: false, v: 0, ...over }
}
export function newAssetItem(asset: Asset, over: Partial<HItem> = {}): HItem {
  return { id: newId(), kind: 'asset', assetId: asset.id, name: asset.name, x: 400, y: 450, s: 1, r: 0, f: false, v: 0, ...over }
}
