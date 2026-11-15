/** Picture quality for uploads and object cut-outs (remembered on this device). Higher = sharper but slower and bigger. */
export type Quality = 'standard' | 'high' | 'max'
export const QUALITY: Record<Quality, { label: string; upload: number; work: number; webp: number }> = {
  standard: { label: 'Standard', upload: 1024, work: 900, webp: 0.88 },
  high: { label: 'High', upload: 2048, work: 1600, webp: 0.95 },
  max: { label: 'Max (slower)', upload: 3072, work: 2400, webp: 0.98 },
}
const KEY = 'olw-img-quality'
export const readQuality = (): Quality => { try { const v = localStorage.getItem(KEY); return v === 'high' || v === 'max' ? v : 'standard' } catch { return 'standard' } }
export const saveQuality = (q: Quality) => { try { localStorage.setItem(KEY, q) } catch { /* ignore */ } }
