import { useMemo, useRef, useState } from 'react'
import { Eye, Loader2, Pencil, Scissors, Search, Trash2, Upload } from 'lucide-react'
import { Modal } from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { errMsg } from '../../lib/data'
import { ART } from '../../components/room/art'
import { META, ITEM_TYPES, type ItemType } from '../../lib/room'
import { LIB_CATS, type Asset, type LibCat } from '../types/littleRoom'
import { categoryOf } from '../utils/house'
import { assetUrl, saveAsset } from '../utils/assetManagement'
import { compressImage } from '../utils/imageProcessing'
import { QUALITY, readQuality, saveQuality, type Quality } from '../utils/quality'

interface Props {
  assets: Record<string, Asset>
  onPlaceArt: (t: ItemType) => void
  onPlaceAsset: (a: Asset) => void
  onAdded: (a: Asset[]) => void
  onRename: (id: string, p: { name?: string; category?: LibCat }) => void
  onDelete: (a: Asset) => void
  onSeparate: (file: Blob, name: string) => void
}

type Tab = 'All' | LibCat
const MAX_FILE = 12 * 1024 * 1024
const tile = 'group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/70 p-1.5 text-center transition hover:bg-white hover:shadow-soft dark:bg-white/5'

function Thumb({ type }: { type: ItemType }) {
  const m = META[type], Art = ART[type]
  const pad = 6
  return (
    <svg viewBox={`${-m.w / 2 - pad} ${-m.h - pad} ${m.w + pad * 2} ${m.h + pad * 2}`} className="h-full w-full" aria-hidden>
      <Art v={0} id={`thumb-${type}`} on={false} playing={false} resting={false} scene="garden" sky="day" motion={false} day={1} month="JAN" />
    </svg>
  )
}

export function AssetLibrary({ assets, onPlaceArt, onPlaceAsset, onAdded, onRename, onDelete, onSeparate }: Props) {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('All')
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [quality, setQuality] = useState<Quality>(readQuality)
  const [detail, setDetail] = useState<Asset | null>(null)
  const [confirm, setConfirm] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const sepRef = useRef<HTMLInputElement>(null)

  const mine = useMemo(() => Object.values(assets).sort((a, b) => b.created.localeCompare(a.created)), [assets])
  const needle = q.trim().toLowerCase()
  const shownAssets = mine.filter((a) => (tab === 'All' || a.category === tab) && (!needle || a.name.toLowerCase().includes(needle)))
  const shownArt = ITEM_TYPES.filter((t) => (tab === 'All' || categoryOf(t) === tab) && (!needle || META[t].label.toLowerCase().includes(needle)))

  const upload = async (files: FileList | null, cat: LibCat) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'))
    if (!list.length) { if (files?.length) toast('Please choose picture files (PNG, JPG or WebP).', 'error'); return }
    setBusy(true)
    const added: Asset[] = []
    for (const f of list) {
      if (f.size > MAX_FILE) { toast(`${f.name} is over 12 MB — please pick a smaller picture.`, 'error'); continue }
      try {
        const c = await compressImage(f, QUALITY[quality].upload, QUALITY[quality].webp)
        added.push(await saveAsset(c.blob, { name: f.name.replace(/\.[^.]+$/, '').slice(0, 30) || 'Picture', category: cat, w: c.w, h: c.h, from: 'upload', hash: c.hash }))
      } catch (e) { toast(`${f.name}: ${errMsg(e)}`, 'error') }
    }
    setBusy(false)
    if (added.length) { onAdded(added); toast(`Added ${added.length} picture${added.length === 1 ? '' : 's'} to your library ♡`) }
    if (fileRef.current) fileRef.current.value = ''
  }

  const pickSeparate = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { toast('Please choose a picture file.', 'error'); return }
    onSeparate(f, f.name.replace(/\.[^.]+$/, '').slice(0, 20))
    if (sepRef.current) sepRef.current.value = ''
  }

  const chip = (t: Tab) => (
    <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${tab === t ? 'bg-blush-500 text-white' : 'bg-white/70 text-blush-600 hover:bg-white dark:bg-white/10 dark:text-blush-200'}`}>{t}</button>
  )

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex gap-2">
        <button disabled={busy} onClick={() => fileRef.current?.click()} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blush-500 px-3 py-2 text-xs font-medium text-white disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Upload furniture
        </button>
        <button onClick={() => sepRef.current?.click()} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-blush-600 shadow-sm dark:bg-white/10 dark:text-blush-200" title="Split one picture with several objects into separate pieces">
          <Scissors size={14} /> Separate objects
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files, 'Uploaded Images')} />
        <input ref={sepRef} type="file" accept="image/*" hidden onChange={(e) => pickSeparate(e.target.files)} />
      </div>
      <label className="flex items-center gap-2 text-[11px] text-stone-500">Picture quality
        <select value={quality} onChange={(e) => { const q = e.target.value as Quality; setQuality(q); saveQuality(q) }} className="flex-1 rounded-lg border border-blush-200 bg-white/80 px-2 py-1 text-xs dark:bg-white/10" aria-label="Picture quality">
          {(Object.keys(QUALITY) as Quality[]).map((k) => <option key={k} value={k}>{QUALITY[k].label}</option>)}
        </select>
      </label>
      <label className="relative block">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search library" aria-label="Search library" className="w-full rounded-xl border border-blush-200 bg-white/80 py-2 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10" />
      </label>
      <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">{(['All', ...LIB_CATS] as Tab[]).map(chip)}</div>

      <div className="grid min-h-0 grid-cols-3 gap-2 overflow-y-auto pr-0.5 sm:grid-cols-4 lg:grid-cols-3">
        {shownAssets.map((a) => (
          <div key={a.id} className={tile}>
            <button className="flex h-full w-full items-center justify-center" onClick={() => onPlaceAsset(a)} aria-label={`Place ${a.name}`}>
              <img src={assetUrl(a)} alt="" loading="lazy" className="max-h-[78%] max-w-full object-contain" />
            </button>
            <span className="w-full truncate text-[10px] text-stone-500">{a.name}</span>
            <button className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-blush-600 shadow-sm" aria-label={`Details for ${a.name}`} onClick={() => { setDetail(a); setConfirm(false) }}><Pencil size={12} /></button>
          </div>
        ))}
        {shownArt.map((t) => (
          <button key={t} className={tile} onClick={() => onPlaceArt(t)} aria-label={`Place ${META[t].label}`}>
            <span className="h-[78%] w-full"><Thumb type={t} /></span>
            <span className="w-full truncate text-[10px] text-stone-500">{META[t].label}</span>
          </button>
        ))}
        {!shownAssets.length && !shownArt.length && <p className="col-span-full rounded-xl bg-white/60 p-3 text-center text-xs text-stone-500 dark:bg-white/5">Nothing matches. Upload your own picture to add it here.</p>}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? 'Picture'}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="grid h-48 place-items-center overflow-hidden rounded-2xl bg-[conic-gradient(#eee_25%,#fff_0_50%,#eee_0_75%,#fff_0)] [background-size:16px_16px]">
              <img src={assetUrl(detail)} alt={detail.name} className="max-h-full max-w-full object-contain" />
            </div>
            <label className="block"><span className="mb-1 block text-xs text-stone-500">Name</span>
              <input defaultValue={detail.name} maxLength={30} key={detail.id} className="w-full rounded-xl border border-blush-200 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10"
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== detail.name) { onRename(detail.id, { name: v }); setDetail({ ...detail, name: v }) } }} />
            </label>
            <label className="block"><span className="mb-1 block text-xs text-stone-500">Category</span>
              <select value={detail.category} className="w-full rounded-xl border border-blush-200 bg-white/80 px-3 py-2 outline-none dark:bg-white/10"
                onChange={(e) => { const c = e.target.value as LibCat; onRename(detail.id, { category: c }); setDetail({ ...detail, category: c }) }}>
                {LIB_CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap justify-between gap-2">
              {confirm ? (
                <span className="flex items-center gap-2 text-xs text-red-600">Delete it and every copy in the house?
                  <button className="rounded-full bg-red-500 px-3 py-1.5 text-white" onClick={() => { onDelete(detail); setDetail(null) }}>Delete</button>
                  <button className="rounded-full px-2 py-1.5 text-stone-500" onClick={() => setConfirm(false)}>Keep</button></span>
              ) : (
                <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-red-500" onClick={() => setConfirm(true)}><Trash2 size={14} /> Delete</button>
              )}
              <span className="flex gap-2">
                {detail.category === 'Uploaded Images' && (
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-blush-600 shadow-sm" onClick={async () => {
                    try { const b = await (await fetch(assetUrl(detail))).blob(); setDetail(null); onSeparate(b, detail.name.slice(0, 20)) } catch (e) { toast(`Couldn’t open it: ${errMsg(e)}`, 'error') }
                  }}><Scissors size={14} /> Separate</button>
                )}
                <button className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-3 py-2 font-medium text-white" onClick={() => { onPlaceAsset(detail); setDetail(null) }}><Eye size={14} /> Place in room</button>
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
