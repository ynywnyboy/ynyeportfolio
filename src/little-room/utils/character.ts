import { newId } from '../../lib/room'
import type { CharLook, CharPreset, SpriteSheet } from '../types/littleRoom'

/** Names of the choices in each category (the picture itself is drawn by utils/sprite.ts). */
export const HAIR_STYLES = ['Bald', 'Short', 'Messy', 'Bob', 'Long', 'Ponytail', 'Twin tails', 'Bun', 'Spiky']
export const EYE_STYLES = ['Dots', 'Round', 'Sleepy', 'Sparkle']
export const FACES = ['Neutral', 'Happy', 'Sleepy', 'Blush', 'Surprised']
export const SHIRTS = ['T-shirt', 'Long sleeve', 'Tank top', 'Dress']
export const PANTS = ['Pants', 'Shorts', 'Skirt', 'None']
export const JACKETS = ['None', 'Jacket', 'Hoodie', 'Cardigan']
export const HATS = ['None', 'Cap', 'Beanie', 'Bow', 'Crown', 'Flower crown']
export const GLASSES = ['None', 'Round', 'Square', 'Sunglasses']
export const BAGS = ['None', 'Backpack', 'Shoulder bag']
export const EXTRAS = ['None', 'Scarf', 'Heart pin', 'Star clip', 'Headphones']

export const SKIN_TONES = ['#ffe0cc', '#fbd3b5', '#f2b98f', '#d99a6c', '#b87a4f', '#8a5634', '#5f3a24']
export const HAIR_COLORS = ['#2f2230', '#5a3825', '#8a5a34', '#d6a352', '#f0d68a', '#c8553d', '#e58fb0', '#8e7be0', '#59a5d8', '#4fb089', '#e9e5e0', '#7d7a86']
export const CLOTH_COLORS = ['#e9708f', '#f4a6bc', '#b59bea', '#7fb5e8', '#7cc9a0', '#f2c66d', '#f09a6a', '#e9e5e0', '#5b5470', '#2f2a3d', '#c0463f', '#3f6fb5']
export const EYE_COLORS = ['#3b2a35', '#5b3a29', '#2f6fb0', '#2e8b6a', '#7a4ab5', '#c4527a', '#666666']
export const SHOE_COLORS = ['#6b4c5a', '#2f2a3d', '#e9e5e0', '#c0463f', '#7fb5e8', '#e9708f', '#8a5a34']

export const DEFAULT_LOOK: CharLook = {
  skin: SKIN_TONES[1], hair: 3, hairColor: HAIR_COLORS[1], eyes: 0, eyeColor: EYE_COLORS[0], face: 1,
  shirt: 0, shirtColor: CLOTH_COLORS[0], pants: 0, pantsColor: CLOTH_COLORS[8], jacket: 0, jacketColor: CLOTH_COLORS[2], shoes: SHOE_COLORS[0],
  hat: 0, hatColor: CLOTH_COLORS[1], glasses: 0, bag: 0, bagColor: CLOTH_COLORS[5], extra: 0, extraColor: CLOTH_COLORS[1],
}

const hex = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d)
const pick = (v: unknown, n: number, d: number) => (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < n ? v : d)

export function normLook(raw: unknown): CharLook {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const D = DEFAULT_LOOK
  return {
    skin: hex(r.skin, D.skin), hair: pick(r.hair, HAIR_STYLES.length, D.hair), hairColor: hex(r.hairColor, D.hairColor),
    eyes: pick(r.eyes, EYE_STYLES.length, D.eyes), eyeColor: hex(r.eyeColor, D.eyeColor), face: pick(r.face, FACES.length, D.face),
    shirt: pick(r.shirt, SHIRTS.length, D.shirt), shirtColor: hex(r.shirtColor, D.shirtColor), pants: pick(r.pants, PANTS.length, D.pants), pantsColor: hex(r.pantsColor, D.pantsColor),
    jacket: pick(r.jacket, JACKETS.length, D.jacket), jacketColor: hex(r.jacketColor, D.jacketColor), shoes: hex(r.shoes, D.shoes),
    hat: pick(r.hat, HATS.length, D.hat), hatColor: hex(r.hatColor, D.hatColor), glasses: pick(r.glasses, GLASSES.length, D.glasses),
    bag: pick(r.bag, BAGS.length, D.bag), bagColor: hex(r.bagColor, D.bagColor), extra: pick(r.extra, EXTRAS.length, D.extra), extraColor: hex(r.extraColor, D.extraColor),
  }
}

const int = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d)

export function normSheet(raw: unknown): SpriteSheet | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.path !== 'string' || !r.path) return undefined
  return { path: r.path, cols: int(r.cols, 4, 1, 12), rows: r.rows === 3 ? 3 : 4, fw: int(r.fw, 32, 4, 512), fh: int(r.fh, 32, 4, 512) }
}

export function normPreset(raw: unknown, id: string): CharPreset | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  return { id, name: typeof r.name === 'string' && r.name.trim() ? r.name.slice(0, 24) : 'My character', look: normLook(r.look), sheet: normSheet(r.sheet), created: typeof r.created === 'string' ? r.created : '' }
}

export const DEFAULT_PRESET_ID = 'default'
export const defaultPreset = (): CharPreset => ({ id: DEFAULT_PRESET_ID, name: 'Default', look: { ...DEFAULT_LOOK }, created: '' })
export const newPresetId = () => `c${newId()}`

const rnd = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]
const rn = (n: number) => Math.floor(Math.random() * n)
export function randomLook(): CharLook {
  return {
    skin: rnd(SKIN_TONES), hair: rn(HAIR_STYLES.length), hairColor: rnd(HAIR_COLORS), eyes: rn(EYE_STYLES.length), eyeColor: rnd(EYE_COLORS), face: rn(FACES.length - 1),
    shirt: rn(SHIRTS.length), shirtColor: rnd(CLOTH_COLORS), pants: rn(PANTS.length - 1), pantsColor: rnd(CLOTH_COLORS), jacket: Math.random() < 0.35 ? 1 + rn(JACKETS.length - 1) : 0, jacketColor: rnd(CLOTH_COLORS),
    shoes: rnd(SHOE_COLORS), hat: Math.random() < 0.3 ? 1 + rn(HATS.length - 1) : 0, hatColor: rnd(CLOTH_COLORS), glasses: Math.random() < 0.25 ? 1 + rn(GLASSES.length - 1) : 0,
    bag: Math.random() < 0.25 ? 1 + rn(BAGS.length - 1) : 0, bagColor: rnd(CLOTH_COLORS), extra: Math.random() < 0.3 ? 1 + rn(EXTRAS.length - 1) : 0, extraColor: rnd(CLOTH_COLORS),
  }
}
