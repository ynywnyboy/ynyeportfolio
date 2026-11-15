/**
 * Local, deterministic image tools for Little Room — no AI service, no API key, no cost.
 * Object separation works like a "magic wand": the background colour is found from the picture's edges, flooded away,
 * and what is left is split into separate pieces. It works best on plain / evenly coloured backgrounds.
 * The pixel maths is pure (works on raw RGBA arrays) so it can be unit-tested; the canvas helpers sit at the bottom.
 */

export interface Raster { data: Uint8ClampedArray; width: number; height: number }
export interface Box { x0: number; y0: number; x1: number; y1: number } // inclusive pixels
export interface Found { id: number; box: Box; area: number }
export interface Detection { mask: Uint8Array; labels: Int32Array; objects: Found[] }

const idx = (r: Raster, x: number, y: number) => (y * r.width + x) * 4

function borderBackground(r: Raster): [number, number, number] | null {
  // most common (5-bit quantised) colour along the edge = the background
  const bins = new Map<number, { n: number; r: number; g: number; b: number }>()
  const add = (x: number, y: number) => {
    const i = idx(r, x, y)
    if (r.data[i + 3] < 16) return
    const k = ((r.data[i] >> 3) << 10) | ((r.data[i + 1] >> 3) << 5) | (r.data[i + 2] >> 3)
    const e = bins.get(k) ?? { n: 0, r: 0, g: 0, b: 0 }
    e.n++; e.r += r.data[i]; e.g += r.data[i + 1]; e.b += r.data[i + 2]
    bins.set(k, e)
  }
  for (let x = 0; x < r.width; x++) { add(x, 0); add(x, r.height - 1) }
  for (let y = 1; y < r.height - 1; y++) { add(0, y); add(r.width - 1, y) }
  let best: { n: number; r: number; g: number; b: number } | null = null
  bins.forEach((e) => { if (!best || e.n > best.n) best = e })
  const b = best as { n: number; r: number; g: number; b: number } | null
  return b ? [b.r / b.n, b.g / b.n, b.b / b.n] : null
}

/** 1 = object, 0 = background. `tol` is colour tolerance in percent (0–100). */
export function foregroundMask(r: Raster, tol: number): Uint8Array {
  const { width: w, height: h, data } = r
  const bg = borderBackground(r)
  const limit = (tol / 100) * 441.67
  const isBg = (i: number) => {
    if (data[i + 3] < 16) return true
    if (!bg) return false
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2]
    return Math.sqrt(dr * dr + dg * dg + db * db) <= limit
  }
  const out = new Uint8Array(w * h).fill(1)
  const stack = new Int32Array(w * h)
  let sp = 0
  const seed = (x: number, y: number) => { const p = y * w + x; if (out[p] === 1 && isBg(p * 4)) { out[p] = 0; stack[sp++] = p } }
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1) }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y) }
  while (sp > 0) { // flood the background inwards from the edges (so a white lamp on a white wall keeps its middle)
    const p = stack[--sp], x = p % w, y = (p / w) | 0
    if (x > 0) seed(x - 1, y)
    if (x < w - 1) seed(x + 1, y)
    if (y > 0) seed(x, y - 1)
    if (y < h - 1) seed(x, y + 1)
  }
  return out
}

function dilate(mask: Uint8Array, w: number, h: number, rad: number): Uint8Array {
  if (rad <= 0) return mask
  const tmp = new Uint8Array(w * h), out = new Uint8Array(w * h)
  const pre = new Int32Array(Math.max(w, h) + 1)
  for (let y = 0; y < h; y++) {
    pre[0] = 0
    for (let x = 0; x < w; x++) pre[x + 1] = pre[x] + mask[y * w + x]
    for (let x = 0; x < w; x++) tmp[y * w + x] = pre[Math.min(w, x + rad + 1)] - pre[Math.max(0, x - rad)] > 0 ? 1 : 0
  }
  for (let x = 0; x < w; x++) {
    pre[0] = 0
    for (let y = 0; y < h; y++) pre[y + 1] = pre[y] + tmp[y * w + x]
    for (let y = 0; y < h; y++) out[y * w + x] = pre[Math.min(h, y + rad + 1)] - pre[Math.max(0, y - rad)] > 0 ? 1 : 0
  }
  return out
}

/** Splits the object mask into separate pieces. `gap` (pixels) glues nearby parts together (a lamp shade and its base). */
export function detectObjects(r: Raster, tol = 18, gap = 6, minFrac = 0.004, max = 40, preMask?: Uint8Array | null): Detection {
  const { width: w, height: h } = r
  const mask = preMask && preMask.length === w * h ? preMask : foregroundMask(r, tol)
  const grown = dilate(mask, w, h, gap)
  const labels = new Int32Array(w * h)
  const found: Found[] = []
  const stack = new Int32Array(w * h)
  let next = 1
  for (let s = 0; s < w * h; s++) {
    if (!grown[s] || labels[s]) continue
    let sp = 0, area = 0
    const box: Box = { x0: w, y0: h, x1: 0, y1: 0 }
    labels[s] = next; stack[sp++] = s
    while (sp > 0) {
      const p = stack[--sp], x = p % w, y = (p / w) | 0
      if (mask[p]) { area++; if (x < box.x0) box.x0 = x; if (x > box.x1) box.x1 = x; if (y < box.y0) box.y0 = y; if (y > box.y1) box.y1 = y }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        const q = ny * w + nx
        if (grown[q] && !labels[q]) { labels[q] = next; stack[sp++] = q }
      }
    }
    found.push({ id: next, box, area })
    next++
  }
  const minArea = Math.max(80, w * h * minFrac)
  const objects = found.filter((f) => f.area >= minArea && f.box.x1 >= f.box.x0)
    .sort((p, q) => Math.round(p.box.y0 / (h / 4)) - Math.round(q.box.y0 / (h / 4)) || p.box.x0 - q.box.x0) // reading order
    .slice(0, max)
  return { mask, labels, objects }
}

/** Cuts one detected object out as its own transparent picture (original colours, soft edge, small margin). */
export function cutObject(r: Raster, det: Detection, obj: Found, pad = 2): Raster {
  const { box } = obj
  const w = box.x1 - box.x0 + 1 + pad * 2, h = box.y1 - box.y0 + 1 + pad * 2
  const own = new Uint8Array(w * h)
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x - pad + box.x0, sy = y - pad + box.y0
    if (sx < 0 || sy < 0 || sx >= r.width || sy >= r.height) continue
    const p = sy * r.width + sx
    if (det.mask[p] && det.labels[p] === obj.id) {
      own[y * w + x] = 1
      const i = p * 4, o = (y * w + x) * 4
      data[o] = r.data[i]; data[o + 1] = r.data[i + 1]; data[o + 2] = r.data[i + 2]; data[o + 3] = r.data[i + 3] || 255
    }
  }
  // soften the cut edge: alpha = share of neighbours that belong to the object
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const o = (y * w + x) * 4
    if (!data[o + 3]) continue
    let n = 0, c = 0
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) { n++; c += own[ny * w + nx] } }
    if (c < n) data[o + 3] = Math.round(data[o + 3] * (c / n) ** 0.7)
  }
  return { data, width: w, height: h }
}

/** Manual fallback: the user drags a box; everything in it that differs from its own edge colour becomes one object. */
export function cutRegion(r: Raster, box: Box, tol = 18, preMask?: Uint8Array | null): Raster | null {
  const w = box.x1 - box.x0 + 1, h = box.y1 - box.y0 + 1
  if (w < 6 || h < 6) return null
  const sub: Raster = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h }
  for (let y = 0; y < h; y++) {
    const s = idx(r, box.x0, box.y0 + y)
    sub.data.set(r.data.subarray(s, s + w * 4), y * w * 4)
  }
  let mask: Uint8Array
  if (preMask && preMask.length === r.width * r.height) {
    mask = new Uint8Array(w * h)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) mask[y * w + x] = preMask[(box.y0 + y) * r.width + box.x0 + x]
  } else mask = foregroundMask(sub, tol)
  const labels = new Int32Array(w * h)
  let x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0
  for (let p = 0; p < w * h; p++) if (mask[p]) { labels[p] = 1; area++; const x = p % w, y = (p / w) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  if (area < 30) return null
  return cutObject(sub, { mask, labels, objects: [] }, { id: 1, area, box: { x0, y0, x1, y1 } })
}

/** Cheap fingerprint of a picture, used to reuse earlier results instead of processing the same image again. */
export function fingerprint(r: Raster): string {
  let h = 2166136261
  const step = Math.max(1, Math.floor(r.data.length / 4 / 4000))
  for (let p = 0; p < r.data.length / 4; p += step) {
    const i = p * 4
    h ^= r.data[i] | (r.data[i + 1] << 8) | (r.data[i + 2] << 16); h = Math.imul(h, 16777619)
  }
  return `${r.width}x${r.height}-${(h >>> 0).toString(36)}`
}

/* ------------------------------------------------------------- canvas helpers (browser only) */

export function fileToRaster(file: Blob, maxDim = 900): Promise<Raster> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const k = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k))
      const c = document.createElement('canvas')
      c.width = w; c.height = h
      const g = c.getContext('2d', { willReadFrequently: true })
      if (!g) return reject(new Error('Canvas is not available in this browser.'))
      g.drawImage(img, 0, 0, w, h)
      resolve({ data: g.getImageData(0, 0, w, h).data, width: w, height: h })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That picture could not be read. Try a PNG, JPG or WebP file.')) }
    img.src = url
  })
}

export function rasterToCanvas(r: Raster): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = r.width; c.height = r.height
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(r.data), r.width, r.height), 0, 0)
  return c
}

export function canvasToBlob(c: HTMLCanvasElement, type = 'image/png', q = 0.9): Promise<Blob> {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not encode the image.'))), type, q))
}

/** Shrinks an uploaded picture (max side 1024) and keeps transparency, so storage and memory stay small. */
export async function compressImage(file: Blob, maxDim = 1024, webpQuality = 0.88): Promise<{ blob: Blob; w: number; h: number; hash: string }> {
  const r = await fileToRaster(file, maxDim)
  const c = rasterToCanvas(r)
  let blob = await canvasToBlob(c, 'image/webp', webpQuality)
  if (blob.type !== 'image/webp') blob = await canvasToBlob(c, 'image/png')
  return { blob, w: r.width, h: r.height, hash: fingerprint(r) }
}

/**
 * Picks the background sensitivity for you from how "clean" the picture's edge is: a flat background needs a very low
 * sensitivity (a high one eats pale outlines and breaks objects apart); a noisy photo needs more. `scale` = picture size / 900.
 */
export function autoDetect(r: Raster, scale = 1, preMask?: Uint8Array | null): { det: Detection; tol: number; gap: number } {
  const gap = 0
  if (preMask) return { det: detectObjects(r, 0, gap, 0.004, 40, preMask), tol: 0, gap }
  const bg = borderBackground(r)
  let tol = 18
  if (bg) {
    const { width: w, height: h, data } = r
    const d: number[] = []
    const add = (x: number, y: number) => { const i = (y * w + x) * 4; d.push(Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2])) }
    for (let x = 0; x < w; x++) { add(x, 0); add(x, h - 1) }
    for (let y = 0; y < h; y++) { add(0, y); add(w - 1, y) }
    d.sort((p, q) => p - q)
    const spread = d[Math.floor(d.length * 0.6)] ?? 0 // how far typical edge pixels wander from the background colour
    tol = Math.max(3, Math.min(18, Math.round((spread * 1.8 + 6) / 4.4167)))
  }
  return { det: detectObjects(r, tol, gap), tol, gap }
}
