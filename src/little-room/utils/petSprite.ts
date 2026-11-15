import type { PetSpecies } from '../types/littleRoom'

/**
 * Pixel-art pets, generated like the player character (pure code, no downloads).
 * One cell is 20 × 16 pixels, 4 frames per row: row 0 = idle (breathing / blinking / tail), row 1 = walking.
 * Both rows face LEFT; the game mirrors them for "right".
 */
export const PFW = 20
export const PFH = 16
export const PFRAMES = 4
export const PET_ROW = { idle: 0, walk: 1 }

type RGB = [number, number, number]
const rgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const shade = (c: RGB, k: number): RGB => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))]
const INK: RGB = [58, 42, 63]
const EYE: RGB = [40, 30, 50]

class G {
  d = new Uint8ClampedArray(PFW * PFH * 4)
  px(x: number, y: number, c: RGB) { if (x < 0 || y < 0 || x >= PFW || y >= PFH) return; const i = (y * PFW + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255 }
  rect(x: number, y: number, w: number, h: number, c: RGB) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c) }
  on(x: number, y: number) { return x >= 0 && y >= 0 && x < PFW && y < PFH && this.d[(y * PFW + x) * 4 + 3] > 0 }
  outline() {
    const add: [number, number][] = []
    for (let y = 0; y < PFH; y++) for (let x = 0; x < PFW; x++) if (!this.on(x, y) && (this.on(x - 1, y) || this.on(x + 1, y) || this.on(x, y - 1) || this.on(x, y + 1))) add.push([x, y])
    for (const [x, y] of add) this.px(x, y, INK)
  }
}

interface Look { coat: RGB; coatD: RGB; coatL: RGB; acc: RGB }

function quad(g: G, sp: PetSpecies, k: Look, row: number, f: number) {
  const walking = row === PET_ROW.walk
  const odd = f % 2 === 1
  const bob = walking ? (odd ? 0 : 1) * (sp === 'rabbit' ? 2 : 1) : f === 1 || f === 3 ? 1 : 0 // body rises a little in time with the steps / breathing
  const dy = sp === 'rabbit' ? 1 : 0
  const up = bob
  // legs (4): the pairs swing opposite each other while walking
  const legs: [number, number][] = [[5, 0], [7, 1], [11, 1], [13, 0]]
  for (const [x, pair] of legs) {
    const swing = walking ? (f === 1 ? (pair ? 1 : -1) : f === 3 ? (pair ? -1 : 1) : 0) : 0
    const lift = walking && ((f === 1 && pair === 1) || (f === 3 && pair === 0)) ? 1 : 0
    g.rect(x + swing, 11 + dy - 0, 2, 4 - lift - dy, pair ? k.coatD : k.coat)
  }
  // tail
  const wag = f === 1 ? -1 : f === 3 ? 1 : 0
  if (sp === 'cat') { g.rect(15, 7 - up, 2, 4, k.coat); g.rect(16 + wag, 3 - up, 2, 5, k.coat); g.rect(16 + wag, 3 - up, 2, 2, k.acc) }
  if (sp === 'dog') { g.rect(15, 6 - up, 2, 3, k.coat); g.rect(16, 4 - up + (wag > 0 ? 0 : 1), 2, 3, k.coatD) }
  if (sp === 'fox') { g.rect(15, 7 - up, 3, 4, k.coat); g.rect(17, 6 - up + (wag ? 0 : 0), 3, 5, k.coat); g.rect(18, 7 - up, 2, 3, [255, 255, 255]) }
  if (sp === 'rabbit') { g.rect(15, 8 - up + dy, 3, 3, [255, 255, 255]) }
  // body
  g.rect(5, 6 - up + dy, 10, 6 - dy, k.coat); g.rect(6, 10 - up + dy, 8, 2, k.coatL)
  if (sp === 'cat') { g.rect(9, 6 - up, 1, 2, k.coatD); g.rect(12, 6 - up, 1, 2, k.coatD) }
  // head
  g.rect(1, 3 - up + dy, 7, 6, k.coat); g.rect(0, 6 - up + dy, 2, 3, sp === 'fox' ? [255, 255, 255] : k.coatL)
  g.px(0, 6 - up + dy, k.acc)
  if (sp === 'cat') { g.rect(1, 1 - up, 2, 2, k.coat); g.rect(6, 1 - up, 2, 2, k.coat); g.px(2, 2 - up, k.acc); g.px(6, 2 - up, k.acc) }
  if (sp === 'fox') { g.rect(1, 1 - up, 2, 2, k.coat); g.rect(6, 1 - up, 2, 2, k.coat); g.px(1, 1 - up, INK); g.px(7, 1 - up, INK) }
  if (sp === 'dog') { g.rect(5, 3 - up, 3, 5, k.acc); g.rect(1, 2 - up, 3, 1, k.coatD) }
  if (sp === 'rabbit') { g.rect(3, -1 + 0, 2, 5 - up + 1, k.coat); g.rect(5, 0, 2, 5 - up + 1, k.coat); g.px(4, 1, k.acc); g.px(5, 2, k.acc) }
  // eye (blinks on frame 2 when idle)
  if (!(row === PET_ROW.idle && f === 2)) g.px(3, 5 - up + dy + (sp === 'rabbit' ? 0 : 0), EYE)
  else g.rect(2, 6 - up + dy, 2, 1, EYE)
}

function bird(g: G, k: Look, row: number, f: number) {
  const walking = row === PET_ROW.walk
  const hop = walking ? (f % 2 === 1 ? 2 : 0) : f === 1 || f === 3 ? 1 : 0
  const swing = walking ? (f === 1 ? 1 : f === 3 ? -1 : 0) : 0
  g.rect(7 + swing, 13 - hop, 1, 2 + hop, k.acc); g.rect(10 - swing, 13 - hop, 1, 2 + hop, k.acc)
  g.rect(13, 7 - hop, 4, 2, k.coatD); g.rect(14, 9 - hop, 3, 2, k.coatD) // tail feathers
  g.rect(4, 6 - hop, 10, 7, k.coat); g.rect(5, 12 - hop, 8, 1, k.coatL); g.rect(5, 10 - hop, 4, 3, k.coatL) // body + belly
  g.rect(8, 7 - hop, 5, 4, k.coatD) // wing
  g.rect(2, 3 - hop, 6, 6, k.coat) // head
  g.rect(0, 5 - hop, 2, 2, k.acc) // beak
  if (!(row === PET_ROW.idle && f === 2)) g.px(3, 5 - hop, EYE); else g.rect(3, 6 - hop, 2, 1, EYE)
  g.rect(4, 1 - hop, 2, 2, k.coat) // a little head feather
}

function hamster(g: G, k: Look, row: number, f: number) {
  const walking = row === PET_ROW.walk
  const hop = walking ? (f % 2 === 1 ? 1 : 0) : f === 1 || f === 3 ? 1 : 0
  const swing = walking ? (f === 1 ? 1 : f === 3 ? -1 : 0) : 0
  g.rect(5 + swing, 12, 2, 3, k.coatD); g.rect(11 - swing, 12, 2, 3, k.coatD)
  g.rect(3, 6 - hop, 12, 7, k.coat); g.rect(4, 11 - hop, 10, 2, k.coatL); g.rect(8, 6 - hop, 5, 3, k.coatD) // body, belly, patch
  g.rect(1, 6 - hop, 6, 6, k.coat) // round head
  g.rect(0, 9 - hop, 2, 2, k.acc) // pink cheek
  g.rect(3, 4 - hop, 2, 2, k.coat); g.px(3, 5 - hop, k.acc) // ear
  if (!(row === PET_ROW.idle && f === 2)) g.px(3, 8 - hop, EYE); else g.rect(2, 9 - hop, 2, 1, EYE)
  g.px(0, 8 - hop, INK)
}

export function drawPetCell(species: PetSpecies, coat: string, accent: string, row: number, frame: number): Uint8ClampedArray {
  const c = rgb(coat), k: Look = { coat: c, coatD: shade(c, 0.82), coatL: shade(c, 1.15), acc: rgb(accent) }
  const g = new G()
  if (species === 'bird') bird(g, k, row, frame)
  else if (species === 'hamster') hamster(g, k, row, frame)
  else quad(g, species, k, row, frame)
  g.outline()
  return g.d
}

export function renderPetSheet(species: PetSpecies, coat: string, accent: string) {
  const rows = 2, width = PFW * PFRAMES, height = PFH * rows
  const data = new Uint8ClampedArray(width * height * 4)
  for (let r = 0; r < rows; r++) for (let f = 0; f < PFRAMES; f++) {
    const cell = drawPetCell(species, coat, accent, r, f)
    for (let y = 0; y < PFH; y++) for (let x = 0; x < PFW; x++) {
      const s = (y * PFW + x) * 4, d = ((r * PFH + y) * width + f * PFW + x) * 4
      data[d] = cell[s]; data[d + 1] = cell[s + 1]; data[d + 2] = cell[s + 2]; data[d + 3] = cell[s + 3]
    }
  }
  return { data, width, height, fw: PFW, fh: PFH, cols: PFRAMES, rows }
}
