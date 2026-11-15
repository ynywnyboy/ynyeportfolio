import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Modal, SafeImage } from '../ui'
import { newId, type RoomDate, type RoomPatch, type RoomState } from '../../lib/room'
import { publicUrl } from '../../lib/storage'
import type { Media, Settings } from '../../lib/types'

const input = 'w-full rounded-xl border border-blush-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10'
const day = 86400000

const fmt = (d: Date) => d.toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })
const nextYearly = (d: Date, now: Date) => {
  const n = new Date(now.getFullYear(), d.getMonth(), d.getDate())
  if (n.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) n.setFullYear(n.getFullYear() + 1)
  return n
}

export function NoteModal({ open, onClose, room, quick }: { open: boolean; onClose: () => void; room: RoomState; quick: (p: RoomPatch) => void }) {
  const [text, setText] = useState(room.note)
  return (
    <Modal open={open} onClose={onClose} title="A note on our desk">
      <div className="rounded-2xl bg-[#fffdf6] p-4 shadow-inner dark:bg-white/5">
        <textarea
          className={`${input} min-h-[9rem] resize-y font-script text-xl leading-relaxed`}
          value={text} maxLength={600} onChange={(e) => setText(e.target.value)} aria-label="Desk note"
        />
        <div className="mt-1 text-right text-[11px] text-stone-400">{text.length}/600</div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="rounded-full px-4 py-2 text-sm text-stone-500" onClick={onClose}>Close</button>
        <button className="rounded-full bg-blush-500 px-4 py-2 text-sm font-medium text-white" onClick={() => { if (text !== room.note) quick({ set: { note: text } }); onClose() }}>Leave note</button>
      </div>
    </Modal>
  )
}

export function CalendarModal({
  open, onClose, room, settings, quick,
}: { open: boolean; onClose: () => void; room: RoomState; settings: Settings | null; quick: (p: RoomPatch) => void }) {
  const [label, setLabel] = useState('')
  const [date, setDate] = useState('')
  const now = useMemo(() => new Date(), [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const out: { id: string; label: string; when: Date; yearly: boolean; custom: boolean }[] = []
    if (settings?.anniversary) {
      const a = new Date(settings.anniversary)
      out.push({ id: 'ann', label: 'Our anniversary', when: nextYearly(a, now), yearly: true, custom: false })
      const m = new Date(now.getFullYear(), now.getMonth(), a.getDate())
      if (m.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) m.setMonth(m.getMonth() + 1)
      out.push({ id: 'mon', label: 'Our next monthsary', when: m, yearly: false, custom: false })
    }
    for (const d of room.dates) {
      const [y, mo, da] = d.date.split('-').map(Number)
      out.push({ id: d.id, label: d.label, when: new Date(y, mo - 1, da), yearly: false, custom: true })
    }
    return out.sort((a, b) => a.when.getTime() - b.when.getTime())
  }, [room.dates, settings?.anniversary, now])

  const together = settings?.anniversary ? Math.max(0, Math.floor((now.getTime() - new Date(settings.anniversary).getTime()) / day)) : null
  const left = (d: Date) => Math.round((d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / day)

  const add = () => {
    if (!label.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    const d: RoomDate = { id: newId(), label: label.trim().slice(0, 60), date }
    quick({ set: { dates: [...room.dates, d] } })
    setLabel(''); setDate('')
  }
  const remove = (id: string) => quick({ set: { dates: room.dates.filter((d) => d.id !== id) } })

  return (
    <Modal open={open} onClose={onClose} title="Our important dates">
      {together !== null && <p className="mb-3 rounded-2xl bg-blush-100 px-4 py-2 text-center text-sm text-blush-600 dark:bg-white/10 dark:text-blush-200">{together.toLocaleString()} days of us ♡</p>}
      <ul className="space-y-2">
        {rows.map((r) => {
          const n = left(r.when)
          return (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-2 dark:bg-white/10">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.label}</p>
                <p className="text-xs text-stone-500">{fmt(r.when)}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-blush-600 dark:text-blush-300">{n === 0 ? 'Today ♡' : n > 0 ? `in ${n} day${n === 1 ? '' : 's'}` : `${-n} days ago`}</span>
              {r.custom && <button aria-label={`Remove ${r.label}`} onClick={() => remove(r.id)} className="text-stone-400 hover:text-rose-500"><Trash2 size={15} /></button>}
            </li>
          )
        })}
        {rows.length === 0 && <li className="text-sm text-stone-500">No dates yet — add one below.</li>}
      </ul>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_9.5rem_auto]">
        <input className={input} placeholder="e.g. Our first trip" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} aria-label="Date name" />
        <input className={input} type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
        <button className="rounded-full bg-blush-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50" disabled={!label.trim() || !date} onClick={add}>Add</button>
      </div>
    </Modal>
  )
}

export function PhotoModal({ media, onClose }: { media: Media | null; onClose: () => void }) {
  return (
    <Modal open={!!media} onClose={onClose} title={media?.caption || 'A memory'} wide>
      {media && (
        <div>
          {media.kind === 'image'
            ? <SafeImage src={publicUrl(media.storage_path)} alt={media.caption || 'Memory'} className="mx-auto max-h-[65vh] overflow-hidden rounded-2xl" imgClassName="mx-auto max-h-[65vh] w-auto rounded-2xl object-contain" />
            : null}
          {media.description && <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">{media.description}</p>}
          <p className="mt-1 text-xs text-stone-400">{new Date(media.taken_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      )}
    </Modal>
  )
}
