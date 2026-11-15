import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Dices, Loader2, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { Modal } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { errMsg } from '../../lib/data'
import { publicUrl, uploadFile } from '../../lib/storage'
import type { House, Pet, PetSpecies } from '../types/littleRoom'
import { ACCENTS, COATS, SPECIES, newPetId, speciesOf, type PetMode } from '../utils/pets'
import { PFRAMES, PFH, PFW } from '../utils/petSprite'
import { petSheetUrl } from '../utils/spriteCanvas'
import type { SpriteInfo } from './CharacterSprite'

export const petSpriteOf = (p: Pet): SpriteInfo =>
  p.sheet ? { url: publicUrl(p.sheet.path), cols: p.sheet.cols, rows: p.sheet.rows, fw: p.sheet.fw, fh: p.sheet.fh, pad: 0 } : { url: petSheetUrl(p.species, p.coat, p.accent), cols: PFRAMES, rows: 2, fw: PFW, fh: PFH, pad: 0 }

const chip = (on: boolean) => `rounded-full px-2.5 py-1 text-xs transition ${on ? 'bg-blush-500 text-white' : 'bg-white/70 text-stone-600 hover:bg-white dark:bg-white/10 dark:text-stone-200'}`
const MAX_SHEET = 4 * 1024 * 1024

function PetPreview({ sprite, walking, face, reduced, scale }: { sprite: SpriteInfo; walking: boolean; face: 'left' | 'right'; reduced: boolean; scale: number }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (reduced) { setF(0); return }
    const t = window.setInterval(() => setF((n) => (n + 1) % 4), walking ? 150 : 420)
    return () => window.clearInterval(t)
  }, [walking, reduced])
  const w = sprite.fw * scale, h = sprite.fh * scale
  const frame = (walking ? [1, 0, 3, 0][f] : f) % sprite.cols
  return <div className="lr-sprite-preview" role="img" aria-label="Pet preview" style={{ width: w, height: h, backgroundImage: `url(${sprite.url})`, backgroundRepeat: 'no-repeat', backgroundSize: `${sprite.cols * w}px ${sprite.rows * h}px`, backgroundPosition: `${-frame * w}px ${-(walking ? 1 : 0) * h}px`, transform: face === 'right' ? 'scaleX(-1)' : undefined }} />
}

interface Props {
  open: boolean
  onClose: () => void
  house: House
  activeId: string | null
  mode: PetMode
  reduced: boolean
  onActive: (id: string | null) => void
  onMode: (m: PetMode) => void
  onSave: (p: Pet) => void
  onDelete: (id: string) => void
}

export function PetPanel({ open, onClose, house, activeId, mode, reduced, onActive, onMode, onSave, onDelete }: Props) {
  const toast = useToast()
  const pets = useMemo(() => Object.values(house.pets).sort((a, b) => a.created.localeCompare(b.created) || a.name.localeCompare(b.name)), [house.pets])
  const [id, setId] = useState<string | null>(activeId ?? pets[0]?.id ?? null)
  const [draft, setDraft] = useState<Pet | null>(null)
  const [walking, setWalking] = useState(true)
  const [face, setFace] = useState<'left' | 'right'>('left')
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [dims, setDims] = useState({ cols: 4, rows: 2 as 2 | 3 | 4 })
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) { setId(activeId ?? pets[0]?.id ?? null); setConfirm(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const p = id ? house.pets[id] : undefined; setDraft(p ? JSON.parse(JSON.stringify(p)) : null) }, [id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  const create = (from?: Pet) => {
    const sp = from ? speciesOf(from.species) : SPECIES[0]
    const home = house.pets[activeId ?? '']?.at ?? { room: house.roomOrder[0], x: 300, y: 490 }
    const p: Pet = { id: newPetId(), name: from ? `${from.name} 2`.slice(0, 20) : sp.label, species: sp.id, coat: from?.coat ?? sp.coat, accent: from?.accent ?? sp.accent, sheet: from?.sheet, at: { ...home, x: home.x + 40 }, created: new Date().toISOString() }
    onSave(p); setId(p.id)
  }
  const setSpecies = (s: PetSpecies) => { if (draft) { const sp = speciesOf(s); setDraft({ ...draft, species: s, coat: sp.coat, accent: sp.accent, sheet: undefined }) } }

  const pickSheet = async (file: File | null | undefined) => {
    if (!file || !draft) return
    if (file.type !== 'image/png' && file.type !== 'image/webp') { toast('Please use a PNG (or WebP) sprite sheet with a transparent background.', 'error'); return }
    if (file.size > MAX_SHEET) { toast('That file is over 4 MB — please use a smaller sheet.', 'error'); return }
    setBusy(true)
    try {
      const size = await new Promise<{ w: number; h: number }>((res, rej) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res({ w: i.naturalWidth, h: i.naturalHeight }) }; i.onerror = () => rej(new Error('Could not read that picture.')); i.src = u })
      const path = await uploadFile(file, 'room-assets') // stored exactly as uploaded: pixels stay sharp
      const fw = Math.floor(size.w / dims.cols), fh = Math.floor(size.h / dims.rows)
      if (fw < 4 || fh < 4) throw new Error('The sheet is too small for that many columns and rows.')
      setDraft({ ...draft, sheet: { path, cols: dims.cols, rows: dims.rows, fw, fh } })
      toast(`Sprite sheet loaded: ${dims.cols}×${dims.rows} frames of ${fw}×${fh}px. Check the preview, then Save.`)
    } catch (e) { toast(errMsg(e), 'error') }
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }
  const setGrid = (p: Partial<{ cols: number; rows: 2 | 3 | 4 }>) => { const d = { ...dims, ...p }; setDims(d); if (draft?.sheet) setDraft({ ...draft, sheet: { ...draft.sheet, cols: d.cols, rows: d.rows } }) }

  const saved = draft ? house.pets[draft.id] : undefined
  const dirty = !!draft && JSON.stringify(saved) !== JSON.stringify(draft)

  return (
    <Modal open={open} onClose={onClose} title="Pets" wide>
      <div className="space-y-3 text-sm">
        {/* the two behaviours */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white/50 p-2 dark:bg-white/5">
          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">Behaviour</span>
          <div className="flex gap-1 rounded-full bg-blush-50 p-1 dark:bg-white/5">
            {(['idle', 'follow'] as PetMode[]).map((m) => <button key={m} disabled={!activeId} onClick={() => onMode(m)} className={`rounded-full px-4 py-1.5 text-xs font-medium disabled:opacity-40 ${mode === m ? 'bg-blush-500 text-white' : 'text-blush-600 dark:text-blush-200'}`}>{m === 'idle' ? 'Idle (stays put)' : 'Follow me'}</button>)}
          </div>
          <span className="text-[11px] text-stone-500">To move an idle pet, switch to Edit mode and drag it.</span>
        </div>

        <div className="grid gap-3 md:grid-cols-[13rem_1fr]">
          <div className="space-y-2">
            <div className="rounded-2xl bg-white/50 p-2 dark:bg-white/5">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300">Your pets<button onClick={() => create()} className="inline-flex items-center gap-1 rounded-full bg-blush-500 px-2 py-0.5 text-white"><Plus size={12} /> New</button></div>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                <li><button onClick={() => onActive(null)} className={`w-full rounded-lg px-2 py-1 text-left text-xs ${activeId === null ? 'bg-blush-100 text-blush-700 dark:bg-white/15 dark:text-white' : 'hover:bg-white/70 dark:hover:bg-white/10'}`}>No pet</button></li>
                {pets.map((p) => (
                  <li key={p.id} className={`flex items-center gap-1 rounded-lg px-1 ${p.id === id ? 'bg-blush-100/70 dark:bg-white/10' : ''}`}>
                    <button onClick={() => setId(p.id)} className="min-w-0 flex-1 truncate px-1 py-1 text-left text-xs">{p.name}</button>
                    <button onClick={() => onActive(p.id)} className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${activeId === p.id ? 'bg-blush-500 text-white' : 'bg-white/80 text-blush-600 dark:bg-white/10'}`}>{activeId === p.id ? 'with me' : 'choose'}</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {draft ? (
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="lr-stage-bg grid h-28 w-40 place-items-center"><PetPreview sprite={petSpriteOf(draft)} walking={walking} face={face} reduced={reduced} scale={Math.max(2, Math.min(6, Math.floor(70 / Math.max(draft.sheet?.fh ?? PFH, 1))) || 2)} /></div>
                <div className="space-y-1">
                  <div className="flex gap-1"><button onClick={() => setWalking(false)} className={chip(!walking)}>Idle</button><button onClick={() => setWalking(true)} className={chip(walking)}>Walking</button></div>
                  <div className="flex gap-1"><button onClick={() => setFace('left')} className={chip(face === 'left')}>Left</button><button onClick={() => setFace('right')} className={chip(face === 'right')}>Right</button></div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-blush-200 bg-white/80 px-2 dark:bg-white/10"><Pencil size={13} className="text-stone-400" />
                  <input value={draft.name} maxLength={20} aria-label="Pet name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none" /></label>
                <button title="Random colours" onClick={() => setDraft({ ...draft, coat: COATS[Math.floor(Math.random() * COATS.length)], accent: ACCENTS[Math.floor(Math.random() * ACCENTS.length)], sheet: undefined })} className="rounded-xl bg-white/80 p-2 text-blush-600 shadow-sm dark:bg-white/10"><Dices size={16} /></button>
                <button title="Duplicate" onClick={() => create(draft)} className="rounded-xl bg-white/80 p-2 text-blush-600 shadow-sm dark:bg-white/10"><Copy size={16} /></button>
                {confirm
                  ? <span className="flex items-center gap-1 text-xs text-red-600">Delete? <button className="rounded-full bg-red-500 px-2 py-1 text-white" onClick={() => { const gone = draft.id; onDelete(gone); setConfirm(false); if (activeId === gone) onActive(null); setId(null) }}>Yes</button><button onClick={() => setConfirm(false)}><X size={14} /></button></span>
                  : <button title="Delete" onClick={() => setConfirm(true)} className="rounded-xl bg-white/80 p-2 text-red-500 shadow-sm dark:bg-white/10"><Trash2 size={16} /></button>}
              </div>

              {!draft.sheet && <>
                <div><span className="mb-1 block text-xs text-stone-500">Animal</span><div className="flex flex-wrap gap-1">{SPECIES.map((s) => <button key={s.id} onClick={() => setSpecies(s.id)} className={chip(draft.species === s.id)}>{s.label}</button>)}</div></div>
                {(['coat', 'accent'] as const).map((k) => (
                  <div key={k}><span className="mb-1 block text-xs text-stone-500">{k === 'coat' ? 'Fur / feather colour' : 'Detail colour (ears, beak, cheeks)'}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(k === 'coat' ? COATS : ACCENTS).map((c) => <button key={c} aria-label={`${k} ${c}`} onClick={() => setDraft({ ...draft, [k]: c })} className={`h-6 w-6 rounded-md border-2 ${draft[k].toLowerCase() === c ? 'border-blush-500' : 'border-white'} shadow-sm`} style={{ background: c }} />)}
                      <label className="grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-md border-2 border-white shadow-sm" title="Any colour" style={{ background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }}><input type="color" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className="h-0 w-0 opacity-0" aria-label={`Custom ${k}`} /></label>
                    </div></div>
                ))}
              </>}

              <details className="rounded-xl bg-white/50 p-2 text-xs dark:bg-white/5" open={!!draft.sheet}>
                <summary className="cursor-pointer font-medium text-stone-600 dark:text-stone-300">Use my own pet sprite</summary>
                <p className="mt-2 text-stone-600 dark:text-stone-300">
                  Upload a <b>transparent PNG sprite sheet</b> where every frame is the same size. <b>Columns</b> are animation frames (4 works best).
                  <b> Rows, top to bottom:</b> 1 = idle, 2 = walking (both facing <b>left</b>; we mirror them for right), 3 = walking down and 4 = walking up (both optional).
                  The feet sit on the bottom edge of each cell. Animated sprites loop their columns; a single static picture also works (1 column, 2 rows). Pixels are never smoothed.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-1">Columns <input type="number" min={1} max={12} value={dims.cols} onChange={(e) => setGrid({ cols: Math.max(1, Math.min(12, Number(e.target.value) || 4)) })} className="w-14 rounded-lg border border-blush-200 bg-white/80 px-2 py-1 dark:bg-white/10" /></label>
                  <label className="flex items-center gap-1">Rows <select value={dims.rows} onChange={(e) => setGrid({ rows: Number(e.target.value) === 3 ? 3 : Number(e.target.value) === 4 ? 4 : 2 })} className="rounded-lg border border-blush-200 bg-white/80 px-2 py-1 dark:bg-white/10"><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option></select></label>
                  <button disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl bg-blush-500 px-3 py-2 font-medium text-white disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload sprite sheet</button>
                  {draft.sheet && <button onClick={() => setDraft({ ...draft, sheet: undefined })} className="rounded-xl bg-white/80 px-3 py-2 text-stone-600 shadow-sm dark:bg-white/10">Use built-in animal</button>}
                  <input ref={fileRef} type="file" accept="image/png,image/webp" hidden onChange={(e) => void pickSheet(e.target.files?.[0])} />
                </div>
              </details>

              <div className="flex justify-end gap-2 border-t border-blush-100 pt-3 dark:border-white/10">
                <button onClick={onClose} className="rounded-full px-4 py-2 text-stone-500">Close</button>
                <button disabled={!dirty} onClick={() => { onSave({ ...draft, name: draft.name.trim() || speciesOf(draft.species).label, created: draft.created || new Date().toISOString() }); toast('Pet saved ♡') }} className="rounded-full bg-blush-500 px-4 py-2 font-medium text-white disabled:opacity-40">Save pet</button>
              </div>
            </div>
          ) : <p className="rounded-xl bg-white/50 p-4 text-center text-xs text-stone-500 dark:bg-white/5">No pet selected. Press “New” to adopt one.</p>}
        </div>
      </div>
    </Modal>
  )
}
