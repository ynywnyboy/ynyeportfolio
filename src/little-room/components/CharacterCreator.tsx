import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Dices, Loader2, Pencil, Plus, RotateCcw, Save, Trash2, Upload, X } from 'lucide-react'
import { Modal } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { errMsg } from '../../lib/data'
import { publicUrl, uploadFile } from '../../lib/storage'
import type { CharLook, CharPreset, Dir, House } from '../types/littleRoom'
import {
  BAGS, CLOTH_COLORS, DEFAULT_LOOK, DEFAULT_PRESET_ID, EXTRAS, EYE_COLORS, EYE_STYLES, FACES, GLASSES, HAIR_COLORS, HAIR_STYLES, HATS, JACKETS, PANTS, SHIRTS, SHOE_COLORS, SKIN_TONES,
  newPresetId, randomLook,
} from '../utils/character'
import { lookSheetUrl } from '../utils/spriteCanvas'
import { defaultSprite, type SpriteInfo } from './CharacterSprite'
import { SpritePreview } from './SpritePreview'

type Section = 'body' | 'hair' | 'clothes' | 'extras' | 'sprite'
const SECTIONS: { id: Section; label: string }[] = [{ id: 'body', label: 'Body' }, { id: 'hair', label: 'Hair' }, { id: 'clothes', label: 'Clothes' }, { id: 'extras', label: 'Extras' }, { id: 'sprite', label: 'Own sprite' }]
const DIRS: { id: Dir; label: string }[] = [{ id: 'down', label: 'Front' }, { id: 'up', label: 'Back' }, { id: 'left', label: 'Left' }, { id: 'right', label: 'Right' }]
const MAX_SHEET = 4 * 1024 * 1024

export const spriteOf = (p: CharPreset): SpriteInfo =>
  p.sheet ? { url: publicUrl(p.sheet.path), cols: p.sheet.cols, rows: p.sheet.rows, fw: p.sheet.fw, fh: p.sheet.fh, pad: 0 } : defaultSprite(lookSheetUrl(p.look))

const chip = (on: boolean) => `rounded-full px-2.5 py-1 text-xs transition ${on ? 'bg-blush-500 text-white' : 'bg-white/70 text-stone-600 hover:bg-white dark:bg-white/10 dark:text-stone-200'}`

function Choice({ label, options, value, onPick }: { label: string; options: string[]; value: number; onPick: (n: number) => void }) {
  return (
    <div><span className="mb-1 block text-xs text-stone-500">{label}</span>
      <div className="flex flex-wrap gap-1">{options.map((o, i) => <button key={o} onClick={() => onPick(i)} className={chip(value === i)}>{o}</button>)}</div>
    </div>
  )
}
function Swatches({ label, colors, value, onPick }: { label: string; colors: string[]; value: string; onPick: (c: string) => void }) {
  return (
    <div><span className="mb-1 block text-xs text-stone-500">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {colors.map((c) => <button key={c} aria-label={`${label} ${c}`} onClick={() => onPick(c)} className={`h-6 w-6 rounded-md border-2 ${value.toLowerCase() === c ? 'border-blush-500' : 'border-white'} shadow-sm`} style={{ background: c }} />)}
        <label className="grid h-6 w-6 cursor-pointer place-items-center overflow-hidden rounded-md border-2 border-white shadow-sm" title="Any colour" style={{ background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }}>
          <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="h-0 w-0 opacity-0" aria-label={`Custom ${label}`} />
        </label>
      </div>
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  house: House
  activeId: string
  reduced: boolean
  onUse: (id: string) => void
  onSave: (p: CharPreset) => void
  onDelete: (id: string) => void
}

export function CharacterCreator({ open, onClose, house, activeId, reduced, onUse, onSave, onDelete }: Props) {
  const toast = useToast()
  const presets = useMemo(() => Object.values(house.characters).sort((a, b) => (a.id === DEFAULT_PRESET_ID ? -1 : b.id === DEFAULT_PRESET_ID ? 1 : a.created.localeCompare(b.created))), [house.characters])
  const [id, setId] = useState(activeId)
  const [draft, setDraft] = useState<CharPreset | null>(null)
  const [section, setSection] = useState<Section>('body')
  const [dir, setDir] = useState<Dir>('down')
  const [walking, setWalking] = useState(true)
  const [turn, setTurn] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dims, setDims] = useState({ cols: 4, rows: 4 as 3 | 4, fw: 32, fh: 32 })

  // open on the character you are playing
  useEffect(() => { if (open) { setId(activeId); setConfirm(false) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const p = house.characters[id] ?? presets[0]; if (p) setDraft(JSON.parse(JSON.stringify(p))) }, [id, open]) // eslint-disable-line react-hooks/exhaustive-deps
  // "turn around" demo: cycles through all four directions
  useEffect(() => {
    if (!turn || !open) return
    const order: Dir[] = ['down', 'left', 'up', 'right']
    let i = order.indexOf(dir)
    const t = window.setInterval(() => { i = (i + 1) % 4; setDir(order[i]) }, 1400)
    return () => window.clearInterval(t)
  }, [turn, open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!draft) return null
  const look = draft.look
  const set = (p: Partial<CharLook>) => setDraft({ ...draft, look: { ...look, ...p } })
  const saved = house.characters[draft.id]
  const dirty = !saved || JSON.stringify(saved) !== JSON.stringify(draft)
  const sprite = spriteOf(draft)

  const save = () => { onSave({ ...draft, name: draft.name.trim() || 'My character', created: draft.created || new Date().toISOString() }); onUse(draft.id); toast('Character saved ♡') }
  const create = (from?: CharPreset) => {
    const p: CharPreset = { id: newPresetId(), name: from ? `${from.name} copy`.slice(0, 24) : 'New character', look: from ? { ...from.look } : { ...DEFAULT_LOOK }, sheet: from?.sheet, created: new Date().toISOString() }
    onSave(p); setId(p.id)
  }

  const pickSheet = async (file: File | null | undefined) => {
    if (!file) return
    if (file.type !== 'image/png' && file.type !== 'image/webp') { toast('Please use a PNG (or WebP) sprite sheet with a transparent background.', 'error'); return }
    if (file.size > MAX_SHEET) { toast('That file is over 4 MB — please use a smaller sheet.', 'error'); return }
    setBusy(true)
    try {
      const size = await new Promise<{ w: number; h: number }>((res, rej) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); res({ w: i.naturalWidth, h: i.naturalHeight }) }; i.onerror = () => rej(new Error('Could not read that picture.')); i.src = u })
      const path = await uploadFile(file, 'room-assets') // kept exactly as uploaded: no resizing, so pixel art stays sharp
      const cols = dims.cols, rows = dims.rows
      const fw = Math.floor(size.w / cols), fh = Math.floor(size.h / rows)
      if (fw < 4 || fh < 4) throw new Error('The sheet is too small for that many columns and rows.')
      setDims({ cols, rows, fw, fh })
      setDraft({ ...draft, sheet: { path, cols, rows, fw, fh } })
      toast(`Sprite sheet loaded: ${cols}×${rows} frames of ${fw}×${fh}px. Check the preview, then Save.`)
    } catch (e) { toast(errMsg(e), 'error') }
    setBusy(false)
    if (fileRef.current) fileRef.current.value = ''
  }
  const setGrid = (p: Partial<{ cols: number; rows: 3 | 4 }>) => {
    const d = { ...dims, ...p }
    setDims(d)
    if (draft.sheet) setDraft({ ...draft, sheet: { ...draft.sheet, cols: d.cols, rows: d.rows } })
  }

  return (
    <Modal open={open} onClose={onClose} title="Character" wide>
      <div className="grid gap-4 text-sm md:grid-cols-[15rem_1fr]">
        {/* preview + presets */}
        <div className="space-y-3">
          <div className="lr-stage-bg grid place-items-center p-4">
            <SpritePreview sprite={sprite} dir={dir} walking={walking} scale={Math.max(2, Math.min(6, Math.floor(160 / sprite.fh)))} reduced={reduced} />
          </div>
          <div className="flex flex-wrap justify-center gap-1">{DIRS.map((d) => <button key={d.id} onClick={() => { setTurn(false); setDir(d.id) }} className={chip(dir === d.id && !turn)}>{d.label}</button>)}</div>
          <div className="flex flex-wrap justify-center gap-1">
            <button onClick={() => setWalking((w) => !w)} className={chip(walking)}>{walking ? 'Walking' : 'Idle'}</button>
            <button onClick={() => setTurn((t) => !t)} className={chip(turn)}>Turn around</button>
          </div>

          <div className="rounded-2xl bg-white/50 p-2 dark:bg-white/5">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-stone-600 dark:text-stone-300">Saved characters
              <button onClick={() => create()} className="inline-flex items-center gap-1 rounded-full bg-blush-500 px-2 py-0.5 text-white"><Plus size={12} /> New</button></div>
            <ul className="max-h-36 space-y-1 overflow-y-auto">
              {presets.map((p) => (
                <li key={p.id}><button onClick={() => setId(p.id)} className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-xs ${p.id === draft.id ? 'bg-blush-100 text-blush-700 dark:bg-white/15 dark:text-white' : 'hover:bg-white/70 dark:hover:bg-white/10'}`}>
                  <span className="truncate">{p.name}</span>{p.id === activeId && <span className="ml-2 shrink-0 rounded-full bg-blush-500 px-1.5 text-[10px] text-white">playing</span>}</button></li>
              ))}
            </ul>
          </div>
        </div>

        {/* editor */}
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-blush-200 bg-white/80 px-2 dark:bg-white/10"><Pencil size={13} className="text-stone-400" />
              <input value={draft.name} maxLength={24} aria-label="Character name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none" /></label>
            <button title="Randomize" onClick={() => set(randomLook())} className="rounded-xl bg-white/80 p-2 text-blush-600 shadow-sm dark:bg-white/10"><Dices size={16} /></button>
            <button title="Reset to default look" onClick={() => setDraft({ ...draft, look: { ...DEFAULT_LOOK }, sheet: undefined })} className="rounded-xl bg-white/80 p-2 text-blush-600 shadow-sm dark:bg-white/10"><RotateCcw size={16} /></button>
            <button title="Duplicate" onClick={() => create(draft)} className="rounded-xl bg-white/80 p-2 text-blush-600 shadow-sm dark:bg-white/10"><Copy size={16} /></button>
            {draft.id !== DEFAULT_PRESET_ID && (confirm
              ? <span className="flex items-center gap-1 text-xs text-red-600">Delete? <button className="rounded-full bg-red-500 px-2 py-1 text-white" onClick={() => { onDelete(draft.id); setConfirm(false); setId(DEFAULT_PRESET_ID); if (activeId === draft.id) onUse(DEFAULT_PRESET_ID) }}>Yes</button><button onClick={() => setConfirm(false)}><X size={14} /></button></span>
              : <button title="Delete" onClick={() => setConfirm(true)} className="rounded-xl bg-white/80 p-2 text-red-500 shadow-sm dark:bg-white/10"><Trash2 size={16} /></button>)}
          </div>

          <div className="flex gap-1 overflow-x-auto rounded-full bg-blush-50 p-1 dark:bg-white/5">
            {SECTIONS.map((s) => <button key={s.id} onClick={() => setSection(s.id)} className={`shrink-0 flex-1 rounded-full px-3 py-1.5 text-xs font-medium ${section === s.id ? 'bg-blush-500 text-white' : 'text-blush-600 dark:text-blush-200'}`}>{s.label}</button>)}
          </div>

          <div className="max-h-[42dvh] space-y-3 overflow-y-auto pr-1">
            {section === 'body' && <>
              <Swatches label="Skin tone" colors={SKIN_TONES} value={look.skin} onPick={(c) => set({ skin: c })} />
              <Choice label="Eyes" options={EYE_STYLES} value={look.eyes} onPick={(n) => set({ eyes: n })} />
              <Swatches label="Eye colour" colors={EYE_COLORS} value={look.eyeColor} onPick={(c) => set({ eyeColor: c })} />
              <Choice label="Expression" options={FACES} value={look.face} onPick={(n) => set({ face: n })} />
            </>}
            {section === 'hair' && <>
              <Choice label="Hair style" options={HAIR_STYLES} value={look.hair} onPick={(n) => set({ hair: n })} />
              <Swatches label="Hair colour" colors={HAIR_COLORS} value={look.hairColor} onPick={(c) => set({ hairColor: c })} />
            </>}
            {section === 'clothes' && <>
              <Choice label="Top" options={SHIRTS} value={look.shirt} onPick={(n) => set({ shirt: n })} />
              <Swatches label="Top colour" colors={CLOTH_COLORS} value={look.shirtColor} onPick={(c) => set({ shirtColor: c })} />
              <Choice label="Bottoms" options={PANTS} value={look.pants} onPick={(n) => set({ pants: n })} />
              <Swatches label="Bottoms colour" colors={CLOTH_COLORS} value={look.pantsColor} onPick={(c) => set({ pantsColor: c })} />
              <Choice label="Jacket" options={JACKETS} value={look.jacket} onPick={(n) => set({ jacket: n })} />
              {look.jacket > 0 && <Swatches label="Jacket colour" colors={CLOTH_COLORS} value={look.jacketColor} onPick={(c) => set({ jacketColor: c })} />}
              <Swatches label="Shoes" colors={SHOE_COLORS} value={look.shoes} onPick={(c) => set({ shoes: c })} />
            </>}
            {section === 'extras' && <>
              <Choice label="Hat" options={HATS} value={look.hat} onPick={(n) => set({ hat: n })} />
              {look.hat > 0 && <Swatches label="Hat colour" colors={CLOTH_COLORS} value={look.hatColor} onPick={(c) => set({ hatColor: c })} />}
              <Choice label="Glasses" options={GLASSES} value={look.glasses} onPick={(n) => set({ glasses: n })} />
              <Choice label="Bag" options={BAGS} value={look.bag} onPick={(n) => set({ bag: n })} />
              {look.bag > 0 && <Swatches label="Bag colour" colors={CLOTH_COLORS} value={look.bagColor} onPick={(c) => set({ bagColor: c })} />}
              <Choice label="Decoration" options={EXTRAS} value={look.extra} onPick={(n) => set({ extra: n })} />
              {look.extra > 0 && <Swatches label="Decoration colour" colors={CLOTH_COLORS} value={look.extraColor} onPick={(c) => set({ extraColor: c })} />}
            </>}
            {section === 'sprite' && (
              <div className="space-y-2">
                <p className="rounded-xl bg-white/60 p-2 text-xs text-stone-600 dark:bg-white/5 dark:text-stone-300">
                  Use your own pixel-art character. Upload one <b>transparent PNG sprite sheet</b> where every frame is the same size (e.g. 32×32 each).
                  <b> Columns</b> = the walking frames (we use frames 1–4: stand, step, stand, step; 2 or 3 columns also work).
                  <b> Rows, top to bottom:</b> 1 facing front, 2 facing back, 3 facing <b>left</b>, 4 facing right (optional — with only 3 rows, row 3 is mirrored for right).
                  Frames sit on the bottom edge of each cell (feet at the bottom). The picture is never resized or smoothed.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <label className="flex items-center gap-1">Columns <input type="number" min={1} max={12} value={dims.cols} onChange={(e) => setGrid({ cols: Math.max(1, Math.min(12, Number(e.target.value) || 4)) })} className="w-14 rounded-lg border border-blush-200 bg-white/80 px-2 py-1 dark:bg-white/10" /></label>
                  <label className="flex items-center gap-1">Rows <select value={dims.rows} onChange={(e) => setGrid({ rows: Number(e.target.value) === 3 ? 3 : 4 })} className="rounded-lg border border-blush-200 bg-white/80 px-2 py-1 dark:bg-white/10"><option value={3}>3 (front, back, left)</option><option value={4}>4 (+ right)</option></select></label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-xl bg-blush-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload sprite sheet</button>
                  {draft.sheet && <button onClick={() => setDraft({ ...draft, sheet: undefined })} className="rounded-xl bg-white/80 px-3 py-2 text-xs text-stone-600 shadow-sm dark:bg-white/10">Use the built-in character instead</button>}
                </div>
                <input ref={fileRef} type="file" accept="image/png,image/webp" hidden onChange={(e) => void pickSheet(e.target.files?.[0])} />
                {draft.sheet && <p className="text-xs text-stone-500">Using your sprite: {draft.sheet.cols}×{draft.sheet.rows} frames, each {draft.sheet.fw}×{draft.sheet.fh}px.</p>}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-blush-100 pt-3 dark:border-white/10">
            {draft.id !== activeId && !dirty && <button onClick={() => { onUse(draft.id); toast(`Now playing as ${draft.name}`) }} className="rounded-full bg-white px-4 py-2 font-medium text-blush-600 shadow-sm">Play as this</button>}
            <button onClick={onClose} className="rounded-full px-4 py-2 text-stone-500">Close</button>
            <button onClick={save} disabled={!dirty && draft.id === activeId} className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-4 py-2 font-medium text-white disabled:opacity-40"><Save size={15} /> Save character</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
