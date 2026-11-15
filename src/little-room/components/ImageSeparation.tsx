import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { Loader2, Scissors, Square, CheckSquare, Wand2 } from 'lucide-react'
import { Modal } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { errMsg } from '../../lib/data'
import { autoDetect, canvasToBlob, cutObject, cutRegion, detectObjects, fileToRaster, fingerprint, rasterToCanvas, type Box, type Detection, type Raster } from '../utils/imageProcessing'
import { saveAsset, separationCache } from '../utils/assetManagement'
import { aiForegroundMask } from '../utils/aiMask'
import { QUALITY, readQuality, saveQuality, type Quality } from '../utils/quality'
import type { Asset } from '../types/littleRoom'

interface Piece { key: string; name: string; raster: Raster; url: string; on: boolean }
const url = (r: Raster) => rasterToCanvas(r).toDataURL('image/png')
const range = 'w-full accent-[#e56b8a]'

/**
 * Splits one picture that holds several objects into separate transparent PNGs.
 * Runs entirely on this device (no AI service, no credits): it finds the background from the picture's border and
 * cuts out each separate object. It works best on a plain or softly-coloured background.
 */
export function ImageSeparation({ file, name, onClose, onSaved }: { file: Blob | null; name: string; onClose: () => void; onSaved: (a: Asset[], place: boolean) => void }) {
  const toast = useToast()
  const [raster, setRaster] = useState<Raster | null>(null)
  const [src, setSrc] = useState('')
  const [tol, setTol] = useState(18)
  const [gap, setGap] = useState(6)
  const [auto, setAuto] = useState<Piece[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])
  const [manual, setManual] = useState<Piece[]>([])
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [tune, setTune] = useState(true)
  const [used, setUsed] = useState({ tol: 18, gap: 6 })
  const [quality, setQuality] = useState<Quality>(readQuality)
  const [ai, setAi] = useState<Uint8Array | null>(null)
  const [aiState, setAiState] = useState<{ pct: number; label: string } | null>(null)
  const [draw, setDraw] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const det = useRef<Detection | null>(null)
  const names = useRef<Record<string, string>>({})
  const [, force] = useState(0)

  // load the picture
  useEffect(() => {
    setRaster(null); setAuto([]); setManual([]); setBoxes([]); setErr(''); setSrc(''); setAi(null); setAiState(null); names.current = {}
    if (!file) return
    let live = true
    fileToRaster(file, QUALITY[quality].work).then((r) => { if (live) { setRaster(r); setSrc(url(r)) } }).catch((e) => live && setErr(errMsg(e)))
    return () => { live = false }
  }, [file, quality])

  // find the objects (re-runs shortly after a slider moves)
  useEffect(() => {
    if (!raster) return
    setBusy(true)
    const t = window.setTimeout(() => {
      try {
        const big = Math.max(raster.width, raster.height)
        const scale = big / 900
        const g = Math.round(gap * scale)
        const key = `${fingerprint(raster)}:${tune ? 'auto' : `${tol}:${gap}`}:${ai ? 'ai' : 'px'}`
        let hit = separationCache.get(key) as { d: Detection; tol: number; gap: number } | undefined
        if (!hit) {
          if (tune) { const a = autoDetect(raster, scale, ai); hit = { d: a.det, tol: a.tol, gap: a.gap } }
          else hit = { d: detectObjects(raster, tol, g, 0.004, 40, ai), tol, gap: g }
          separationCache.set(key, hit)
        }
        const d = hit.d
        setUsed({ tol: hit.tol, gap: Math.round(hit.gap / scale) })
        det.current = d
        setBoxes(d.objects.map((o) => o.box))
        setAuto(d.objects.map((o, i) => {
          const r = cutObject(raster, d!, o)
          return { key: `a${o.id}`, name: names.current[`a${o.id}`] ?? `${name || 'Object'} ${i + 1}`, raster: r, url: url(r), on: true }
        }))
      } catch (e) { setErr(errMsg(e)) }
      setBusy(false)
    }, 220)
    return () => window.clearTimeout(t)
  }, [raster, tol, gap, name, ai, tune])

  const all = useMemo(() => [...auto, ...manual], [auto, manual])
  const picked = all.filter((p) => p.on)

  const toggle = (key: string) => {
    setAuto((l) => l.map((p) => (p.key === key ? { ...p, on: !p.on } : p)))
    setManual((l) => l.map((p) => (p.key === key ? { ...p, on: !p.on } : p)))
  }
  const rename = (key: string, v: string) => {
    names.current[key] = v
    setAuto((l) => l.map((p) => (p.key === key ? { ...p, name: v } : p)))
    setManual((l) => l.map((p) => (p.key === key ? { ...p, name: v } : p)))
  }

  const pt = (e: RPointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: Math.round(((e.clientX - r.left) / r.width) * (raster?.width ?? 1)), y: Math.round(((e.clientY - r.top) / r.height) * (raster?.height ?? 1)) }
  }
  const down = (e: RPointerEvent<SVGSVGElement>) => { e.currentTarget.setPointerCapture(e.pointerId); const p = pt(e); setDraw({ x0: p.x, y0: p.y, x1: p.x, y1: p.y }) }
  const move = (e: RPointerEvent<SVGSVGElement>) => { if (draw) { const p = pt(e); setDraw({ ...draw, x1: p.x, y1: p.y }) } }
  const up = () => {
    if (!draw || !raster) return
    const b: Box = { x0: Math.min(draw.x0, draw.x1), y0: Math.min(draw.y0, draw.y1), x1: Math.max(draw.x0, draw.x1), y1: Math.max(draw.y0, draw.y1) }
    setDraw(null)
    if (b.x1 - b.x0 < 12 || b.y1 - b.y0 < 12) return
    const r = cutRegion(raster, b, tol, ai)
    if (!r) { toast('Nothing to cut out in that box — try a bigger area.', 'info'); return }
    const key = `m${Date.now()}`
    setManual((l) => [...l, { key, name: `${name || 'Object'} cut ${l.length + 1}`, raster: r, url: url(r), on: true }])
    force((n) => n + 1)
  }

  const runAi = async () => {
    if (!file || !raster) return
    setErr(''); setAiState({ pct: 0, label: 'Starting' })
    try { setAi(await aiForegroundMask(file, raster, (pct, label) => setAiState({ pct, label }))); setManual([]) }
    catch (e) { setErr(errMsg(e)) }
    setAiState(null)
  }

  const save = async (place: boolean) => {
    if (!picked.length) return
    setSaving(true)
    try {
      const out: Asset[] = []
      for (const p of picked) {
        const blob = await canvasToBlob(rasterToCanvas(p.raster), 'image/png')
        out.push(await saveAsset(blob, { name: p.name.trim() || 'Object', category: 'Extracted Objects', w: p.raster.width, h: p.raster.height, from: 'extracted' }))
      }
      onSaved(out, place)
      toast(`Saved ${out.length} object${out.length === 1 ? '' : 's'} to your library ♡`, 'success')
      onClose()
    } catch (e) { toast(`Couldn’t save: ${errMsg(e)}`, 'error') }
    setSaving(false)
  }

  return (
    <Modal open={!!file} onClose={onClose} title="Separate objects" wide>
      <div className="space-y-3 text-sm">
        <p className="text-xs text-stone-500">Done on this device — no AI service or credits. It works best with a plain background and objects that don’t touch. Draw a box on the picture to cut out anything it missed.</p>
        {err && <p className="rounded-xl bg-red-50 p-2 text-red-600">{err}</p>}
        {!raster && !err && <p className="flex items-center gap-2 text-stone-500"><Loader2 className="animate-spin" size={16} /> Reading picture…</p>}
        {raster && (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] [background-size:16px_16px]">
                <img src={src} alt="Your picture" className="block w-full select-none" draggable={false} />
                <svg viewBox={`0 0 ${raster.width} ${raster.height}`} className="absolute inset-0 h-full w-full touch-none cursor-crosshair" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDraw(null)}>
                  {boxes.map((b, i) => <rect key={i} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} fill="none" stroke="#e56b8a" strokeWidth={Math.max(2, raster.width / 260)} strokeDasharray="6 4" />)}
                  {draw && <rect x={Math.min(draw.x0, draw.x1)} y={Math.min(draw.y0, draw.y1)} width={Math.abs(draw.x1 - draw.x0)} height={Math.abs(draw.y1 - draw.y0)} fill="rgba(229,107,138,.2)" stroke="#e56b8a" strokeWidth={Math.max(2, raster.width / 260)} />}
                </svg>
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs text-stone-500">Cut-out quality
                <select value={quality} onChange={(e) => { const q = e.target.value as Quality; setQuality(q); saveQuality(q) }} className="flex-1 rounded-lg border border-blush-200 bg-white/80 px-2 py-1 text-xs dark:bg-white/10">
                  {(Object.keys(QUALITY) as Quality[]).map((k) => <option key={k} value={k}>{QUALITY[k].label}</option>)}
                </select>
              </label>
              <button disabled={!!aiState} onClick={() => void runAi()} className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-blush-500 to-[#9b7fd6] px-3 py-2 text-xs font-medium text-white disabled:opacity-70">
                {aiState ? <><Loader2 size={14} className="animate-spin" /> {aiState.label}{aiState.pct ? ` ${aiState.pct}%` : '…'}</> : <><Wand2 size={14} /> {ai ? 'Smart cut applied — run again' : 'Smart cut (for busy / complex pictures)'}</>}
              </button>
              <p className="mt-1 text-[11px] text-stone-400">{ai ? 'Using the AI cut-out. Sensitivity no longer applies; “gap” still joins nearby parts.' : 'Runs in your browser, free. First use downloads a model (~40–80 MB) once.'}</p>
              <label className="mt-2 flex items-center gap-2 text-xs text-stone-500"><input type="checkbox" checked={tune} onChange={(e) => { if (!e.target.checked) { setTol(used.tol); setGap(used.gap) } setTune(e.target.checked) }} className="accent-[#e56b8a]" /> Auto-tune (recommended)</label>
              <label className="mt-1 block text-xs text-stone-500">Background sensitivity: {tune ? used.tol : tol}<input type="range" min={2} max={60} value={tune ? used.tol : tol} onChange={(e) => { setTune(false); setTol(Number(e.target.value)) }} className={range} /></label>
              <label className="block text-xs text-stone-500">Keep parts together (gap): {tune ? used.gap : gap}<input type="range" min={0} max={24} value={tune ? used.gap : gap} onChange={(e) => { setTune(false); setGap(Number(e.target.value)) }} className={range} /></label>
            </div>
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-300">
                {busy ? <Loader2 className="animate-spin" size={13} /> : <Scissors size={13} />} {all.length} object{all.length === 1 ? '' : 's'} found · {picked.length} selected
              </p>
              {all.length === 0 && !busy && <p className="rounded-xl bg-white/60 p-3 text-xs text-stone-500 dark:bg-white/5">No separate objects found. Try a lower sensitivity, or draw a box around the thing you want.</p>}
              <ul className="max-h-[46dvh] space-y-1.5 overflow-y-auto pr-1">
                {all.map((p) => (
                  <li key={p.key} className={`flex items-center gap-2 rounded-xl p-1.5 ${p.on ? 'bg-blush-100/80 dark:bg-white/10' : 'bg-white/50 opacity-70 dark:bg-white/5'}`}>
                    <button onClick={() => toggle(p.key)} aria-label={p.on ? 'Deselect' : 'Select'} className="text-blush-500">{p.on ? <CheckSquare size={18} /> : <Square size={18} />}</button>
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] [background-size:10px_10px]"><img src={p.url} alt="" className="max-h-full max-w-full object-contain" /></span>
                    <input value={p.name} maxLength={30} onChange={(e) => rename(p.key, e.target.value)} aria-label="Object name" className="min-w-0 flex-1 rounded-lg border border-blush-200 bg-white/80 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <button className="rounded-full px-4 py-2 text-stone-500" onClick={onClose}>Cancel</button>
          <button disabled={!picked.length || saving} className="rounded-full bg-white px-4 py-2 font-medium text-blush-600 shadow-sm disabled:opacity-40" onClick={() => void save(false)}>Save to library</button>
          <button disabled={!picked.length || saving} className="rounded-full bg-blush-500 px-4 py-2 font-medium text-white disabled:opacity-40" onClick={() => void save(true)}>{saving ? 'Saving…' : 'Save & place in room'}</button>
        </div>
      </div>
    </Modal>
  )
}
