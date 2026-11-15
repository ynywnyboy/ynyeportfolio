import type { Raster } from './imageProcessing'

/**
 * Optional "smart cut": an AI background-remover that runs inside the browser (no account, no API key, no credits).
 * It is loaded from a CDN only when you press the button, and the model (~40–80 MB) is downloaded once and cached by the browser.
 * Tries the first address, then the second.
 */
const SOURCES = [
  'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm',
  'https://esm.sh/@imgly/background-removal@1.7.0',
]
type Remove = (img: Blob, cfg?: Record<string, unknown>) => Promise<Blob>
let loaded: Remove | null = null

async function load(): Promise<Remove> {
  if (loaded) return loaded
  let last: unknown
  for (const src of SOURCES) {
    try {
      const m = (await import(/* @vite-ignore */ src)) as { removeBackground?: Remove; default?: Remove }
      const fn = m.removeBackground ?? m.default
      if (typeof fn === 'function') { loaded = fn; return fn }
    } catch (e) { last = e }
  }
  throw new Error(`The smart-cut tool couldn’t be loaded (check your internet connection). ${last instanceof Error ? last.message : ''}`.trim())
}

/** Returns a mask (1 = object) the same size as `r`, from the AI's cut-out of the picture. */
export async function aiForegroundMask(file: Blob, r: Raster, onProgress?: (pct: number, label: string) => void): Promise<Uint8Array> {
  const remove = await load()
  const out = await remove(file, {
    model: 'isnet_quint8',
    output: { format: 'image/png' },
    progress: (key: string, cur: number, total: number) => { if (total > 0) onProgress?.(Math.round((cur / total) * 100), String(key).includes('fetch') || String(key).startsWith('fetch') ? 'Downloading model' : 'Working') },
  })
  const url = URL.createObjectURL(out)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read the result.')); i.src = url })
    const c = document.createElement('canvas')
    c.width = r.width; c.height = r.height
    const g = c.getContext('2d', { willReadFrequently: true })!
    g.drawImage(img, 0, 0, r.width, r.height)
    const d = g.getImageData(0, 0, r.width, r.height).data
    const mask = new Uint8Array(r.width * r.height)
    for (let p = 0; p < mask.length; p++) mask[p] = d[p * 4 + 3] > 127 ? 1 : 0
    return mask
  } finally { URL.revokeObjectURL(url) }
}
