import type { CharLook, Dir } from '../types/littleRoom'

/**
 * Pixel-art character generator (pure — no canvas, so it can be tested anywhere).
 * Every look is drawn as a sprite sheet: 4 frames per row (stand, step, stand, step) and 3 rows (down, up, side).
 * The side row faces left; the game flips it for "right", so no duplicate art is needed.
 * One sprite cell is 20 × 32 pixels and is shown 3–4× larger with crisp (non-blurred) scaling.
 */
export const FW = 20
export const FH = 32
export const FRAMES = 4
export const ROW: Record<Dir, number> = { down: 0, up: 1, left: 2, right: 2 }
export interface Sheet { data: Uint8ClampedArray; width: number; height: number; fw: number; fh: number; cols: number; rows: number }

type RGB = [number, number, number]
const rgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const shade = (c: RGB, k: number): RGB => [Math.max(0, Math.min(255, Math.round(c[0] * k))), Math.max(0, Math.min(255, Math.round(c[1] * k))), Math.max(0, Math.min(255, Math.round(c[2] * k)))]
const INK: RGB = [58, 42, 63]
const WHITE: RGB = [255, 255, 255]

class Cell {
  d = new Uint8ClampedArray(FW * FH * 4)
  px(x: number, y: number, c: RGB) { if (x < 0 || y < 0 || x >= FW || y >= FH) return; const i = (y * FW + x) * 4; this.d[i] = c[0]; this.d[i + 1] = c[1]; this.d[i + 2] = c[2]; this.d[i + 3] = 255 }
  rect(x: number, y: number, w: number, h: number, c: RGB) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c) }
  /** rounded block: corners cut */
  round(x: number, y: number, w: number, h: number, c: RGB) { this.rect(x, y, w, h, c); for (const [cx, cy] of [[x, y], [x + w - 1, y], [x, y + h - 1], [x + w - 1, y + h - 1]]) this.clear(cx, cy) }
  clear(x: number, y: number) { if (x < 0 || y < 0 || x >= FW || y >= FH) return; this.d[(y * FW + x) * 4 + 3] = 0 }
  on(x: number, y: number) { return x >= 0 && y >= 0 && x < FW && y < FH && this.d[(y * FW + x) * 4 + 3] > 0 }
  /** a 1-pixel dark outline around everything drawn, so the character reads clearly on any floor */
  outline() {
    const add: [number, number][] = []
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (!this.on(x, y) && (this.on(x - 1, y) || this.on(x + 1, y) || this.on(x, y - 1) || this.on(x, y + 1))) add.push([x, y])
    for (const [x, y] of add) this.px(x, y, INK)
  }
}

interface Pal { skin: RGB; skinD: RGB; hair: RGB; hairD: RGB; eye: RGB; shirt: RGB; shirtD: RGB; pants: RGB; pantsD: RGB; jacket: RGB; jacketD: RGB; shoes: RGB; hat: RGB; hatD: RGB; bag: RGB; bagD: RGB; extra: RGB; extraD: RGB }
const palette = (l: CharLook): Pal => {
  const f = (h: string) => rgb(h)
  return { skin: f(l.skin), skinD: shade(f(l.skin), 0.88), hair: f(l.hairColor), hairD: shade(f(l.hairColor), 0.78), eye: f(l.eyeColor), shirt: f(l.shirtColor), shirtD: shade(f(l.shirtColor), 0.82), pants: f(l.pantsColor), pantsD: shade(f(l.pantsColor), 0.8), jacket: f(l.jacketColor), jacketD: shade(f(l.jacketColor), 0.8), shoes: f(l.shoes), hat: f(l.hatColor), hatD: shade(f(l.hatColor), 0.78), bag: f(l.bagColor), bagD: shade(f(l.bagColor), 0.78), extra: f(l.extraColor), extraD: shade(f(l.extraColor), 0.8) }
}

// hair ids: 0 bald, 1 short, 2 messy, 3 bob, 4 long, 5 ponytail, 6 twin tails, 7 bun, 8 spiky
const LONGISH = new Set([3, 4, 5, 6])

/* ------------------------------------------------------------------ front & back */
function drawFront(c: Cell, l: CharLook, p: Pal, f: number, back: boolean) {
  const lp = [0, 1, 0, -1][f]
  const legs = l.pants === 3 ? 'skin' : 'cloth'
  // hair behind the body
  if (l.hair === 4) c.rect(4, 8, 12, 14, p.hairD)
  if (l.hair === 3) c.rect(4, 8, 12, 6, p.hairD)
  if (l.hair === 5) { c.rect(15, 7, 2, 8, p.hairD); c.rect(16, 13, 1, 3, p.hairD) }
  if (l.hair === 6) { c.rect(3, 8, 2, 8, p.hairD); c.rect(15, 8, 2, 8, p.hairD) }
  if (l.bag === 1 && !back) c.rect(5, 16, 10, 7, p.bagD)
  // legs + shoes (the leg that steps forward lifts a pixel)
  const liftL = lp === 1 ? 1 : 0, liftR = lp === -1 ? 1 : 0
  const legC = (shorts: boolean, y: number) => (shorts ? p.skin : p.pants)
  for (const [x, lift] of [[7, liftL], [10, liftR]] as const) {
    c.rect(x, 23, 3, 6 - lift, l.pants === 0 ? p.pants : p.skin)
    if (l.pants === 1) { c.rect(x, 23, 3, 2, p.pants) }
    c.rect(x - 1, 29 - lift, 4, 2, p.shoes)
  }
  void legs; void legC
  if (l.pants === 2 || l.shirt === 3) c.rect(5, 22, 10, 4, l.shirt === 3 ? p.shirt : p.pants)
  // torso
  const tor = l.shirt === 2 ? 1 : 0
  c.rect(6 + tor, 15, 8 - tor * 2, 8, l.shirt === 3 ? p.shirt : p.shirt)
  if (l.shirt === 0 || l.shirt === 2) c.rect(6, 22, 8, 1, l.pants === 0 ? p.pants : p.shirt)
  // arms
  const armY = (side: number) => 15 + (side === 0 ? -lp : lp) * 0
  const sleeve = l.shirt === 1 || l.shirt === 3 ? 7 : l.shirt === 0 ? 3 : 0
  for (const side of [0, 1]) {
    const x = side === 0 ? 4 : 14, dy = side === 0 ? -lp : lp
    c.rect(x, armY(side) + dy, 2, 7, p.skin)
    if (sleeve) c.rect(x, armY(side) + dy, 2, sleeve, l.shirt === 3 ? p.shirt : p.shirtD)
  }
  // jacket
  if (l.jacket) {
    const jc = l.jacket === 3 ? shade(p.jacket, 1.12) : p.jacket
    c.rect(6, 15, 8, 8, jc)
    c.rect(9, 15, 2, 8, back ? jc : p.shirt) // open front shows the shirt
    for (const side of [0, 1]) { const x = side === 0 ? 4 : 14, dy = side === 0 ? -lp : lp; c.rect(x, 15 + dy, 2, 6, jc); c.rect(x, 20 + dy, 2, 1, p.jacketD) }
    if (l.jacket === 2) c.rect(6, 14, 8, 2, p.jacketD) // hood
  }
  if (l.bag === 1 && !back) { c.rect(7, 16, 1, 5, p.bag); c.rect(12, 16, 1, 5, p.bag) }
  if (l.bag === 1 && back) { c.rect(5, 15, 10, 8, p.bag); c.rect(5, 20, 10, 3, p.bagD); c.rect(8, 17, 4, 2, p.bagD) }
  if (l.bag === 2) { for (let i = 0; i < 8; i++) c.px(7 + i, 15 + i, p.bag); c.rect(12, 20, 5, 4, p.bag); c.rect(12, 20, 5, 1, p.bagD) }
  // accessories on the body
  if (l.extra === 1) { c.rect(6, 14, 8, 2, p.extra); if (!back) c.rect(8, 16, 2, 4, p.extraD) }
  if (l.extra === 2 && !back) { c.rect(11, 17, 2, 2, [255, 105, 150]); c.px(10, 17, [255, 105, 150]); c.px(13, 17, [255, 105, 150]); c.px(12, 19, [255, 105, 150]) }
  // head
  c.round(5, 5, 10, 10, p.skin)
  if (!back) {
    const ey = 10
    const E = (x: number) => {
      if (l.eyes === 0) c.rect(x, ey, 1, 2, p.eye)
      else if (l.eyes === 1) { c.rect(x, ey, 2, 2, p.eye); c.px(x, ey, WHITE) }
      else if (l.eyes === 2) { c.rect(x, ey + 1, 2, 1, p.eye); c.px(x - 1 < 5 ? x : x - 1, ey, p.eye) }
      else { c.rect(x, ey - 1, 2, 3, p.eye); c.px(x, ey - 1, WHITE) }
    }
    const ex = l.eyes === 0 ? [7, 12] : [7, 11]
    if (l.face === 2) { for (const x of ex) c.rect(x, ey + 1, l.eyes === 0 ? 1 : 2, 1, p.eye) } else { for (const x of ex) E(x) }
    const m: RGB = [165, 91, 107]
    if (l.face === 0) c.rect(9, 13, 2, 1, m)
    if (l.face === 1) { c.px(8, 12, m); c.rect(9, 13, 2, 1, m); c.px(11, 12, m) }
    if (l.face === 2) c.rect(9, 13, 2, 1, m)
    if (l.face === 3) { c.rect(9, 13, 2, 1, m); c.rect(6, 12, 2, 1, [250, 150, 170]); c.rect(12, 12, 2, 1, [250, 150, 170]) }
    if (l.face === 4) c.rect(9, 13, 2, 2, m)
    if (l.glasses) {
      const g: RGB = l.glasses === 3 ? [30, 25, 40] : [70, 55, 80]
      if (l.glasses === 3) { c.rect(6, 9, 4, 3, g); c.rect(10, 9, 4, 3, g) }
      else for (const x of [6, 10]) { c.rect(x, 9, 4, 1, g); c.rect(x, 12, 4, 1, g); c.rect(x, 9, 1, 4, g); c.rect(x + 3, 9, 1, 4, g) }
      c.rect(9, 10, 2, 1, g); c.px(5, 10, g); c.px(14, 10, g)
    }
  }
  // front hair
  const H = p.hair
  if (l.hair !== 0) {
    if (back) c.round(5, 4, 10, 11, H)
    else if (l.hair === 1 || l.hair === 5 || l.hair === 6 || l.hair === 7) { c.round(5, 4, 10, 5, H); c.rect(5, 8, 2, 2, H); c.rect(13, 8, 2, 2, H) }
    else if (l.hair === 2) { c.round(5, 4, 10, 5, H); c.rect(5, 8, 3, 2, H); c.rect(12, 8, 3, 2, H); c.px(9, 9, H); c.px(10, 3, H); c.px(6, 3, H); c.px(13, 3, H) }
    else if (l.hair === 3 || l.hair === 4) { c.round(5, 4, 10, 5, H); c.rect(5, 8, 3, 6, H); c.rect(12, 8, 3, 6, H); c.rect(8, 8, 4, 1, H) }
    else if (l.hair === 8) { c.round(5, 5, 10, 4, H); for (const x of [5, 8, 11, 13]) c.rect(x, 2, 2, 3, H); c.rect(5, 8, 2, 2, H); c.rect(13, 8, 2, 2, H) }
    if (l.hair === 7) { c.rect(8, 1, 4, 4, H); c.rect(9, 0, 2, 1, H) }
    if (l.hair === 5 && back) c.rect(9, 12, 2, 8, p.hairD)
  }
  // hats & ear things
  hat(c, l, p, 'front', back)
  if (l.extra === 4) { c.rect(5, 3, 10, 1, [60, 55, 75]); c.rect(3, 8, 2, 5, p.extra); c.rect(15, 8, 2, 5, p.extra) }
}

function hat(c: Cell, l: CharLook, p: Pal, view: 'front' | 'side', back = false) {
  const x0 = view === 'front' ? 5 : 5
  if (l.hat === 1) { c.rect(x0, 2, 10, 4, p.hat); c.rect(x0, 5, 10, 1, p.hatD); if (!back) { if (view === 'front') c.rect(5, 6, 10, 1, p.hatD); else c.rect(1, 5, 6, 2, p.hatD) } }
  if (l.hat === 2) { c.round(5, 1, 10, 6, p.hat); c.rect(5, 6, 10, 2, p.hatD); c.px(9, 0, p.hatD); c.px(10, 0, p.hatD) }
  if (l.hat === 3) { const bx = view === 'front' ? 11 : 10; c.rect(bx, 3, 3, 3, p.hat); c.rect(bx + 3, 2, 3, 5, p.hat); c.rect(bx - 3, 2, 3, 5, p.hat); c.px(bx + 1, 4, p.hatD) }
  if (l.hat === 4) { const g: RGB = [255, 214, 96]; c.rect(6, 3, 8, 2, g); for (const x of [6, 9, 12]) c.rect(x, 1, 2, 2, g); c.px(9, 3, [230, 90, 120]) }
  if (l.hat === 5) { const cols: RGB[] = [[255, 150, 180], [255, 255, 255], [255, 214, 96], [180, 150, 235]]; for (let i = 0; i < 5; i++) c.rect(5 + i * 2, 3 + (i % 2), 2, 2, cols[i % 4]); c.rect(5, 5, 10, 1, [110, 180, 120]) }
  if (l.extra === 3 && l.hat === 0) { const s: RGB = [255, 214, 96]; c.px(view === 'front' ? 12 : 8, 5, s); c.rect(view === 'front' ? 11 : 7, 6, 3, 1, s); c.px(view === 'front' ? 12 : 8, 7, s) }
}

/* ------------------------------------------------------------------ side (faces left) */
function drawSide(c: Cell, l: CharLook, p: Pal, f: number) {
  const lp = [0, 1, 0, -1][f]
  const H = p.hair
  // hair behind
  if (l.hair === 4) c.rect(9, 8, 7, 13, p.hairD)
  if (l.hair === 3) c.rect(9, 8, 7, 6, p.hairD)
  if (l.hair === 5) { c.rect(14, 7, 3, 3, H); c.rect(15, 9, 2, 7, p.hairD) }
  if (l.hair === 6) c.rect(14, 8, 2, 8, p.hairD)
  if (l.bag === 1) c.rect(10, 15, 5, 8, p.bag)
  // far leg + far arm (darker)
  c.rect(9 - lp * 2, 23, 3, 6, l.pants === 0 ? p.pantsD : p.skinD); c.rect(8 - lp * 2, 29, 4, 2, shade(p.shoes, 0.85))
  c.rect(8 + lp * 2, 15 + 0, 2, 6, p.skinD)
  // near leg
  const lift = Math.abs(lp) === 1 && lp === 1 ? 1 : 0
  c.rect(8 + lp * 2, 23, 3, 6 - lift, l.pants === 0 ? p.pants : p.skin)
  if (l.pants === 1) c.rect(8 + lp * 2, 23, 3, 2, p.pants)
  c.rect(7 + lp * 2, 29 - lift, 4, 2, p.shoes)
  if (l.pants === 2 || l.shirt === 3) c.rect(6, 22, 8, 4, l.shirt === 3 ? p.shirt : p.pants)
  // torso
  c.rect(7, 15, 6, 8, p.shirt)
  if (l.shirt === 0 || l.shirt === 2) c.rect(7, 22, 6, 1, l.pants === 0 ? p.pants : p.shirt)
  if (l.jacket) { const jc = l.jacket === 3 ? shade(p.jacket, 1.12) : p.jacket; c.rect(7, 15, 6, 8, jc); c.rect(7, 22, 6, 1, p.jacketD); if (l.jacket === 2) c.rect(8, 14, 5, 2, p.jacketD) }
  // near arm swings opposite to the near leg
  const ax = 8 - lp * 2
  c.rect(ax, 15, 2, 7, p.skin)
  const sleeve = l.jacket ? 7 : l.shirt === 1 || l.shirt === 3 ? 7 : l.shirt === 0 ? 3 : 0
  if (sleeve) c.rect(ax, 15, 2, sleeve, l.jacket ? (l.jacket === 3 ? shade(p.jacket, 1.12) : p.jacket) : p.shirtD)
  if (l.bag === 2) { c.rect(7, 16, 1, 5, p.bag); c.rect(5, 19, 4, 4, p.bag); c.rect(5, 19, 4, 1, p.bagD) }
  if (l.extra === 1) c.rect(7, 14, 6, 2, p.extra)
  // head
  c.round(5, 5, 10, 10, p.skin)
  c.px(4, 11, p.skin); c.px(4, 12, p.skin) // nose
  const ey = 10
  if (l.face === 2) c.rect(6, ey + 1, 2, 1, p.eye)
  else if (l.eyes === 0) c.rect(7, ey, 1, 2, p.eye)
  else if (l.eyes === 1) { c.rect(6, ey, 2, 2, p.eye); c.px(6, ey, WHITE) }
  else if (l.eyes === 2) c.rect(6, ey + 1, 2, 1, p.eye)
  else { c.rect(6, ey - 1, 2, 3, p.eye); c.px(6, ey - 1, WHITE) }
  const m: RGB = [165, 91, 107]
  if (l.face === 1) { c.px(5, 13, m); c.px(6, 13, m) } else c.px(6, 13, m)
  if (l.face === 3) c.rect(8, 12, 2, 1, [250, 150, 170])
  if (l.face === 4) c.rect(5, 13, 2, 2, m)
  if (l.glasses) { const g: RGB = l.glasses === 3 ? [30, 25, 40] : [70, 55, 80]; if (l.glasses === 3) c.rect(5, 9, 4, 3, g); else { c.rect(5, 9, 4, 1, g); c.rect(5, 12, 4, 1, g); c.rect(5, 9, 1, 4, g); c.rect(8, 9, 1, 4, g) } c.rect(9, 10, 5, 1, g) }
  // front hair
  if (l.hair !== 0) {
    if (l.hair === 8) { c.round(5, 5, 10, 4, H); for (const x of [6, 9, 12]) c.rect(x, 2, 2, 3, H); c.rect(10, 8, 5, 5, H) }
    else { c.round(5, 4, 10, 5, H); c.rect(10, 8, 5, 5, H); c.rect(5, 8, 2, l.hair === 2 ? 2 : 1, H) }
    if (l.hair === 7) { c.rect(10, 1, 4, 4, H); c.rect(11, 0, 2, 1, H) }
    if (LONGISH.has(l.hair)) c.rect(10, 8, 5, 5, H)
  }
  hat(c, l, p, 'side')
  if (l.extra === 4) { c.rect(5, 3, 10, 1, [60, 55, 75]); c.rect(8, 8, 4, 5, p.extra) }
}

/* ------------------------------------------------------------------ sheet */
export function drawCell(look: CharLook, dir: 'down' | 'up' | 'side', frame: number): Uint8ClampedArray {
  const c = new Cell(), p = palette(look)
  if (dir === 'side') drawSide(c, look, p, frame)
  else drawFront(c, look, p, frame, dir === 'up')
  c.outline()
  return c.d
}

export function renderSheet(look: CharLook): Sheet {
  const rows = 3, width = FW * FRAMES, height = FH * rows
  const data = new Uint8ClampedArray(width * height * 4)
  ;(['down', 'up', 'side'] as const).forEach((dir, r) => {
    for (let f = 0; f < FRAMES; f++) {
      const cell = drawCell(look, dir, f)
      for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
        const s = (y * FW + x) * 4, d = ((r * FH + y) * width + f * FW + x) * 4
        data[d] = cell[s]; data[d + 1] = cell[s + 1]; data[d + 2] = cell[s + 2]; data[d + 3] = cell[s + 3]
      }
    }
  })
  return { data, width, height, fw: FW, fh: FH, cols: FRAMES, rows }
}
