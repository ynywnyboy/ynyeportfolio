import type { ItemType, Pattern, RoomDate, Scene } from '../../lib/room'

export const ROOM_WIDTH = 800
export const ROOM_HEIGHT = 520
export const FLOOR = 350
export const WORLD_TOP = -10
export const WORLD_H = 540
/** Every room sits on the same ground line (its bottom edge is always y = ROOM_BOTTOM); width and height are per room. */
export const ROOM_BOTTOM = 520
export const ROOM_LIMITS = { minW: 400, maxW: 1800, minH: 380, maxH: 720 }
export const ROOM_SIZES = { small: { w: 600, h: 460 }, medium: { w: 800, h: 520 }, large: { w: 1100, h: 580 } } as const

export type RoomKind = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'hallway' | 'garden' | 'storage' | 'study' | 'custom'
export type LibCat = 'Uploaded Images' | 'Extracted Objects' | 'Furniture' | 'Decorations' | 'Appliances' | 'Plants' | 'Garden' | 'Custom Assets'
export const LIB_CATS: LibCat[] = ['Uploaded Images', 'Extracted Objects', 'Furniture', 'Decorations', 'Appliances', 'Plants', 'Garden', 'Custom Assets']

export const ROOM_KINDS: { id: RoomKind; label: string }[] = [
  { id: 'bedroom', label: 'Bedroom' }, { id: 'bathroom', label: 'Bathroom' }, { id: 'hallway', label: 'Hallway' }, { id: 'garden', label: 'Garden (outdoors)' }, { id: 'kitchen', label: 'Kitchen' },
  { id: 'living', label: 'Living room' }, { id: 'study', label: 'Study room' }, { id: 'storage', label: 'Storage room' }, { id: 'custom', label: 'Custom room' },
]

/** One object in a room. `kind: 'art'` = built-in drawing, `kind: 'asset'` = one of your own pictures. */
export interface HItem {
  id: string
  kind: 'art' | 'asset'
  type?: ItemType
  assetId?: string
  name: string
  x: number // bottom-centre, in the room's own coordinates (0..800)
  y: number
  s: number
  r: number
  f: boolean
  v: number
  media?: string
  hidden?: boolean
  locked?: boolean
  solid?: boolean
  /** garden plots only: what is growing in each slot (null = empty) */
  plants?: (PlantState | null)[]
}

/** A planted seed. Growth stage is worked out from `w` (waterings) and `t` (planted time), so it needs no timer. */
export interface PlantState { k: string; w: number; t: number; l: number; c?: string }

export interface HRoom {
  id: string
  name: string
  kind: RoomKind
  wall: string
  pattern: Pattern
  floor: string
  /** room size in world units (default 800 × 520) */
  w: number
  h: number
  lights: boolean
  scene: Scene
  items: Record<string, HItem>
  /** layer order, back → front */
  order: string[]
}

export interface Asset {
  id: string
  name: string
  category: LibCat
  path: string // storage path in the existing media bucket
  w: number
  h: number
  from: 'upload' | 'extracted'
  hash?: string
  created: string
}

export interface House {
  v: 2
  rooms: Record<string, HRoom>
  roomOrder: string[]
  assets: Record<string, Asset>
  note: string
  dates: RoomDate[]
  doorColor: string
  /** saved characters (presets) — shared by both of you; which one you play is remembered per device */
  characters: Record<string, CharPreset>
  /** pets (shared); which one you play with and Idle/Follow are remembered per device */
  pets: Record<string, Pet>
}

/** What this person changed (so we can apply it on top of the newest saved copy). */
export interface Op { path: string[]; value: unknown } // value === undefined → delete

/* ---------------------------------------------------------------- playable character */
export type Dir = 'down' | 'up' | 'left' | 'right'
export interface CharLook {
  skin: string; hair: number; hairColor: string; eyes: number; eyeColor: string; face: number
  shirt: number; shirtColor: string; pants: number; pantsColor: string; jacket: number; jacketColor: string; shoes: string
  hat: number; hatColor: string; glasses: number; bag: number; bagColor: string; extra: number; extraColor: string
}
/** An uploaded sprite sheet: `cols` frames per row; rows are down, up, left, right (right may be left mirrored). */
export interface SpriteSheet { path: string; cols: number; rows: 3 | 4; fw: number; fh: number }
export interface CharPreset { id: string; name: string; look: CharLook; sheet?: SpriteSheet; created: string }

/* ---------------------------------------------------------------- pets */
export type PetSpecies = 'cat' | 'dog' | 'rabbit' | 'bird' | 'hamster' | 'fox'
/** An uploaded pet sprite sheet: `cols` frames per row. Row 1 = idle, row 2 = walking (both facing LEFT; mirrored for right).
 *  Optional row 3 = walking down (toward you), row 4 = walking up. */
export interface PetSheet { path: string; cols: number; rows: 2 | 3 | 4; fw: number; fh: number }
export interface Pet {
  id: string; name: string; species: PetSpecies; coat: string; accent: string; sheet?: PetSheet
  /** where it stays in Idle mode: a room and a spot inside it */
  at: { room: string; x: number; y: number }
  created: string
}
