/** Pure helpers for the Love Wheel (no DOM / React / Supabase, so they can be unit-tested). */

export const WHEEL_VIEW = 400
export const CENTER = WHEEL_VIEW / 2
export const RADIUS = 192

export const DEFAULT_CATEGORIES = ['Affectionate Gestures', 'Romantic Surprises', 'Fun Challenges'] as const

/** Slice fills; the blush ones follow the shared accent colour. */
const SLICE_FILLS = [
  'rgb(var(--blush-200))',
  '#ddcdf5',
  'rgb(var(--blush-300))',
  '#fbf1e6',
  '#c3a9ec',
  'rgb(var(--blush-100))',
]

export function sliceFill(i: number, n: number): string {
  let k = i % SLICE_FILLS.length
  // the last slice touches the first: make sure they never share a colour
  if (n > 1 && i === n - 1 && k === 0) k = 3
  return SLICE_FILLS[k]
}

/** Angle is degrees clockwise from 12 o'clock. */
export function polar(angleDeg: number, r: number): { x: number; y: number } {
  const a = (angleDeg * Math.PI) / 180
  return { x: CENTER + r * Math.sin(a), y: CENTER - r * Math.cos(a) }
}

const f = (n: number) => Math.round(n * 1000) / 1000

/** SVG path of slice `i` out of `n` (n >= 2). */
export function slicePath(i: number, n: number): string {
  const step = 360 / n
  const a0 = i * step
  const a1 = (i + 1) * step
  const p0 = polar(a0, RADIUS)
  const p1 = polar(a1, RADIUS)
  const large = step > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${f(p0.x)} ${f(p0.y)} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${f(p1.x)} ${f(p1.y)} Z`
}

export function sliceMid(i: number, n: number): number {
  return ((i + 0.5) * 360) / n
}

const mod = (a: number, m: number) => ((a % m) + m) % m

/** Which slice is under the pointer (12 o'clock) when the wheel has been turned `rotation`° clockwise. */
export function indexAtPointer(rotation: number, n: number, pointerOffset: number = 0): number {
  if (n <= 0) return 0
  const wheelAngle = mod(pointerOffset - rotation, 360)
  return Math.min(n - 1, Math.floor(wheelAngle / (360 / n)))
}

/**
 * The rotation to animate to so that slice `index` ends under the pointer.
 * `offset` in (-0.5, 0.5) nudges the stop away from dead-centre (kept inside the slice) so it feels natural.
 * Always turns clockwise by at least `spins` full turns.
 */
export function targetRotation(current: number, index: number, n: number, spins: number, offset: number): number {
  const wheelAngle = (index + 0.5 + Math.max(-0.4, Math.min(0.4, offset))) * (360 / n)
  const needed = mod(-wheelAngle - current, 360)
  return current + spins * 360 + needed
}

/**
 * Chooses which enabled option to land on. Avoids repeating the previous result
 * whenever there is more than one option to choose from.
 * `rand` must return a number in [0, 1).
 */
export function pickIndex(options: { id: string }[], lastId: string | null, rand: () => number = Math.random): number {
  if (options.length === 0) return -1
  const pool = options.map((_, i) => i).filter((i) => options.length < 2 || options[i].id !== lastId)
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]
}

/** Uniform random in [0, 1) from the browser's crypto source when available. */
export function secureRandom(): number {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto
    if (c && typeof c.getRandomValues === 'function') {
      const buf = new Uint32Array(1)
      c.getRandomValues(buf)
      return buf[0] / 4294967296
    }
  } catch { /* fall through */ }
  return Math.random()
}

export function shortLabel(label: string, max: number): string {
  const t = label.trim()
  return t.length <= max ? t : `${t.slice(0, Math.max(1, max - 1)).trimEnd()}…`
}

/** How much text fits on a slice for a given slice count. */
export function labelStyle(n: number): { showLabel: boolean; max: number; fontSize: number; emojiSize: number } {
  if (n <= 6) return { showLabel: true, max: 22, fontSize: 15, emojiSize: 26 }
  if (n <= 10) return { showLabel: true, max: 19, fontSize: 13, emojiSize: 22 }
  if (n <= 16) return { showLabel: true, max: 15, fontSize: 11, emojiSize: 19 }
  if (n <= 24) return { showLabel: true, max: 13, fontSize: 9.5, emojiSize: 16 }
  return { showLabel: false, max: 0, fontSize: 0, emojiSize: 13 }
}

/** Groups items by category, keeping first-seen order. */
export function groupByCategory<T extends { category: string }>(items: T[]): { category: string; items: T[] }[] {
  const out: { category: string; items: T[] }[] = []
  for (const it of items) {
    let g = out.find((x) => x.category === it.category)
    if (!g) { g = { category: it.category, items: [] }; out.push(g) }
    g.items.push(it)
  }
  return out
}
