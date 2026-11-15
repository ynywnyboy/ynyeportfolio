import { ChevronLeft, ChevronRight, ClipboardPaste, Copy, FlipHorizontal2, Lock, RotateCcw, RotateCw, Trash2, Unlock, ZoomIn, ZoomOut } from 'lucide-react'
import { META } from '../../lib/room'
import type { Media } from '../../lib/types'
import type { HItem } from '../types/littleRoom'
import { isSolid } from '../utils/house'

const b = 'grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/80 text-blush-600 shadow-sm transition hover:bg-white disabled:opacity-40 dark:bg-white/10 dark:text-blush-200'

interface Props {
  item: HItem
  media: Media[]
  canPaste: boolean
  onPatch: (p: Partial<HItem>) => void
  onDuplicate: () => void
  onCopy: () => void
  onPaste: () => void
  onDelete: () => void
}

/** Controls for the selected object (the same actions also work with keys: Delete, Ctrl+D/C/V, arrows). */
export function ItemBar({ item, media, canPaste, onPatch, onDuplicate, onCopy, onPaste, onDelete }: Props) {
  const meta = item.kind === 'art' && item.type ? META[item.type] : null
  const n = meta?.variants.length ?? 0
  const photos = media.filter((m) => m.kind === 'image')
  const solid = isSolid(item)
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 rounded-2xl bg-white/60 p-1.5 backdrop-blur dark:bg-white/5" role="toolbar" aria-label="Selected object">
      <input key={item.id} defaultValue={item.name} maxLength={30} aria-label="Name" className="h-8 w-28 rounded-lg border border-blush-200 bg-white/80 px-2 text-xs outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10"
        onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== item.name) onPatch({ name: v }) }} />
      {n > 1 && <>
        <button className={b} aria-label="Previous style" disabled={item.locked} onClick={() => onPatch({ v: (item.v + n - 1) % n })}><ChevronLeft size={15} /></button>
        <button className={b} aria-label="Next style" disabled={item.locked} onClick={() => onPatch({ v: (item.v + 1) % n })}><ChevronRight size={15} /></button>
      </>}
      <button className={b} aria-label="Smaller" disabled={item.locked} onClick={() => onPatch({ s: Math.max(0.2, +(item.s - 0.1).toFixed(2)) })}><ZoomOut size={15} /></button>
      <button className={b} aria-label="Bigger" disabled={item.locked} onClick={() => onPatch({ s: Math.min(4, +(item.s + 0.1).toFixed(2)) })}><ZoomIn size={15} /></button>
      <button className={b} aria-label="Rotate left" disabled={item.locked} onClick={() => onPatch({ r: item.r - 15 })}><RotateCcw size={15} /></button>
      <button className={b} aria-label="Rotate right" disabled={item.locked} onClick={() => onPatch({ r: item.r + 15 })}><RotateCw size={15} /></button>
      <button className={b} aria-label="Flip" disabled={item.locked} onClick={() => onPatch({ f: !item.f })}><FlipHorizontal2 size={15} /></button>
      <button className={b} aria-label={item.locked ? 'Unlock' : 'Lock'} onClick={() => onPatch({ locked: !item.locked })}>{item.locked ? <Lock size={15} /> : <Unlock size={15} />}</button>
      <button className={b} aria-label="Duplicate" onClick={onDuplicate}><Copy size={15} /></button>
      <button className={`${b} text-[10px] font-semibold`} aria-label="Copy" onClick={onCopy}>Cp</button>
      <button className={b} aria-label="Paste" disabled={!canPaste} onClick={onPaste}><ClipboardPaste size={15} /></button>
      <button className={`${b} text-red-500`} aria-label="Delete" onClick={onDelete}><Trash2 size={15} /></button>
      <label className="ml-1 flex items-center gap-1 text-[11px] text-stone-500"><input type="checkbox" className="accent-[#e56b8a]" checked={solid} onChange={(e) => onPatch({ solid: e.target.checked })} /> Solid</label>
      {item.type === 'frame' && (
        <select aria-label="Photo" className="h-8 max-w-[9rem] rounded-lg border border-blush-200 bg-white/80 px-1 text-xs dark:bg-white/10" value={item.media ?? ''} onChange={(e) => onPatch({ media: e.target.value || undefined })}>
          <option value="">No photo</option>
          {photos.map((m) => <option key={m.id} value={m.id}>{m.caption || 'Memory'}</option>)}
        </select>
      )}
    </div>
  )
}
