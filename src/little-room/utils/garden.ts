import type { ItemType } from '../../lib/room'
import type { HItem, PlantState } from '../types/littleRoom'

/** Seeds you can plant. `petal` is the default bloom colour (you can pick another when planting). `H` = full height. */
export interface Seed { id: string; label: string; petal: string; H: number }
export const SEEDS: Seed[] = [
  { id: 'daisy', label: 'Daisy', petal: '#ffffff', H: 62 },
  { id: 'sunflower', label: 'Sunflower', petal: '#ffcf3d', H: 92 },
  { id: 'rose', label: 'Rose', petal: '#e0425f', H: 64 },
  { id: 'tulip', label: 'Tulip', petal: '#f0709a', H: 56 },
  { id: 'lavender', label: 'Lavender', petal: '#9b7fd6', H: 66 },
  { id: 'lily', label: 'Lily', petal: '#f7a1c4', H: 70 },
  { id: 'herb', label: 'Herb', petal: '#6cbf6e', H: 48 },
]
export const seedOf = (id: string) => SEEDS.find((s) => s.id === id) ?? SEEDS[0]
export const PETAL_COLORS = ['#ffffff', '#ffcf3d', '#e0425f', '#f0709a', '#f7a1c4', '#9b7fd6', '#7fb5e8', '#f09a6a']

export const STAGES = ['Seed', 'Sprout', 'Growing', 'Fully grown']
export const PASSIVE_MS = 8 * 3600 * 1000 // even without water, a plant moves on one stage every 8 hours
export const WATER_COOLDOWN_MS = 45 * 1000 // each watering counts once, then the soil needs a moment

export const PLOT_TYPES = new Set<ItemType>(['soil', 'raisedbed', 'flowerpot'])
const SLOTS: Partial<Record<ItemType, { x: number; y: number }[]>> = {
  soil: [{ x: 0, y: -15 }],
  raisedbed: [{ x: -78, y: -38 }, { x: 0, y: -38 }, { x: 78, y: -38 }],
  flowerpot: [{ x: 0, y: -62 }],
}
export const slotsOf = (type: ItemType | undefined) => (type ? SLOTS[type] ?? null : null)
export const isPlot = (it: HItem) => it.kind === 'art' && !!it.type && PLOT_TYPES.has(it.type)

export const stageOf = (p: PlantState, now: number) => Math.min(3, Math.max(0, Math.floor(p.w) + Math.floor(Math.max(0, now - p.t) / PASSIVE_MS)))
export const isWet = (p: PlantState, now: number) => now - p.l < 10 * 60 * 1000 && p.l > 0

/** Which slot a tap at item-local x (before scale) is nearest to. */
export function nearestSlot(type: ItemType | undefined, localX: number): number {
  const sl = slotsOf(type) ?? []
  let best = 0
  sl.forEach((s, i) => { if (Math.abs(s.x - localX) < Math.abs(sl[best].x - localX)) best = i })
  return best
}

/** Converts a tap position (room coordinates) into the item's own x (undoing its scale and flip; rotation is ignored). */
export const localX = (it: HItem, roomX: number) => ((roomX - it.x) / (it.s || 1)) * (it.f ? -1 : 1)

const withPlants = (it: HItem, list: (PlantState | null)[]): HItem => ({ ...it, plants: list })
const padded = (it: HItem) => { const n = slotsOf(it.type)?.length ?? 0; const l = [...(it.plants ?? [])]; while (l.length < n) l.push(null); return l }

export function plantSeed(it: HItem, slot: number, seed: string, color: string | undefined, now: number): { item: HItem; replaced: boolean } {
  const l = padded(it)
  const replaced = !!l[slot]
  l[slot] = { k: seed, w: 0, t: now, l: 0, c: color && color !== seedOf(seed).petal ? color : undefined }
  return { item: withPlants(it, l), replaced }
}

export type WaterResult = 'watered' | 'cooldown' | 'empty' | 'grown'
export function waterSlot(it: HItem, slot: number, now: number): { item: HItem; result: WaterResult } {
  const l = padded(it), p = l[slot]
  if (!p) return { item: it, result: 'empty' }
  if (now - p.l < WATER_COOLDOWN_MS) return { item: it, result: 'cooldown' }
  const was = stageOf(p, now)
  l[slot] = { ...p, w: was >= 3 ? p.w : p.w + 1, l: now }
  return { item: withPlants(it, l), result: was >= 3 ? 'grown' : 'watered' }
}

export function removePlant(it: HItem, slot: number): { item: HItem; had: boolean } {
  const l = padded(it)
  const had = !!l[slot]
  l[slot] = null
  return { item: withPlants(it, l.some(Boolean) ? l : []), had }
}

/** Waters every plant in a list of items (used by "Water all"). Returns the changed items and how many plants got water. */
export function waterAll(items: HItem[], now: number): { items: HItem[]; count: number } {
  let count = 0
  const out = items.map((it) => {
    if (!isPlot(it)) return it
    let cur = it
    ;(it.plants ?? []).forEach((p, i) => { if (p) { const r = waterSlot(cur, i, now); if (r.result === 'watered') { cur = r.item; count++ } } })
    return cur
  })
  return { items: out, count }
}

/** Cleans plants read from storage. */
export function normPlants(raw: unknown, slots: number): (PlantState | null)[] | undefined {
  if (!Array.isArray(raw) || !slots) return undefined
  const out: (PlantState | null)[] = []
  for (let i = 0; i < slots; i++) {
    const p = raw[i] as Record<string, unknown> | null | undefined
    if (p && typeof p === 'object' && typeof p.k === 'string' && SEEDS.some((s) => s.id === p.k))
      out.push({ k: p.k, w: typeof p.w === 'number' && p.w >= 0 ? Math.min(50, Math.floor(p.w)) : 0, t: typeof p.t === 'number' ? p.t : 0, l: typeof p.l === 'number' ? p.l : 0, c: typeof p.c === 'string' && /^#[0-9a-f]{6}$/i.test(p.c) ? p.c : undefined })
    else out.push(null)
  }
  return out.some(Boolean) ? out : undefined
}

/** Garden ground styles (stored in the garden room's `floor`), and ready-made garden themes. */
export const GROUNDS: Record<string, { label: string; a: string; b: string; blade: string }> = {
  meadow: { label: 'Spring meadow', a: '#8fd18a', b: '#7cc277', blade: '#5fae62' },
  lush: { label: 'Lush green', a: '#6fbf73', b: '#5aa862', blade: '#3f8f52' },
  autumn: { label: 'Autumn leaves', a: '#c9b26a', b: '#b99f55', blade: '#a8873f' },
  sand: { label: 'Sandy', a: '#ecd9aa', b: '#dcc58f', blade: '#c9b27a' },
  zen: { label: 'Zen gravel', a: '#d9d6cf', b: '#c9c5bd', blade: '#b2ada3' },
  snow: { label: 'Snowy', a: '#f4f8ff', b: '#e3ecf7', blade: '#c9d8ea' },
}
export const GARDEN_THEMES: { id: string; label: string; ground: string; sky: string; scene: 'garden' | 'rain' | 'snow' | 'city' | 'sea' }[] = [
  { id: 'spring', label: 'Spring meadow', ground: 'meadow', sky: '#cfe8f7', scene: 'garden' },
  { id: 'cottage', label: 'Cottage lawn', ground: 'lush', sky: '#d9ecf5', scene: 'garden' },
  { id: 'autumn', label: 'Autumn', ground: 'autumn', sky: '#f6dcc4', scene: 'garden' },
  { id: 'zen', label: 'Zen', ground: 'zen', sky: '#e4ecef', scene: 'garden' },
  { id: 'winter', label: 'Winter', ground: 'snow', sky: '#dfe9f6', scene: 'snow' },
]
