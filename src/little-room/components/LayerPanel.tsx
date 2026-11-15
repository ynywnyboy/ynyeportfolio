import { useRef, useState } from 'react'
import { ArrowDownToLine, ArrowUpToLine, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Lock, Trash2, Unlock } from 'lucide-react'
import type { House } from '../types/littleRoom'
import type { Sel } from './HouseView'
import type { Move } from '../utils/houseOps'

interface Props {
  house: House
  roomId: string
  selected: Sel | null
  onSelect: (s: Sel | null) => void
  onPatch: (iid: string, p: { name?: string; hidden?: boolean; locked?: boolean }) => void
  onMove: (iid: string, how: Move) => void
  onDrop: (iid: string, target: string) => void
  onDuplicate: (iid: string) => void
  onDelete: (iid: string) => void
}

const ib = 'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-stone-500 transition hover:bg-blush-100 hover:text-blush-600 disabled:opacity-30 dark:hover:bg-white/10'

/** Canva-style list of everything in the current room, front-most on top. Selecting here selects on the canvas and back. */
export function LayerPanel({ house, roomId, selected, onSelect, onPatch, onMove, onDrop, onDuplicate, onDelete }: Props) {
  const room = house.rooms[roomId]
  const [editing, setEditing] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  if (!room) return null
  const list = [...room.order].reverse().filter((id) => room.items[id])
  const sel = selected && selected.room === roomId ? selected.id : null
  const it = sel ? room.items[sel] : null

  return (
    <div className="flex min-h-0 flex-col">
      <p className="mb-1 text-[11px] text-stone-500">{room.name} · {list.length} layer{list.length === 1 ? '' : 's'} (front at top)</p>
      {it && (
        <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-xl bg-blush-50 p-1 dark:bg-white/5">
          <button className={ib} title="Bring to front" onClick={() => onMove(it.id, 'front')}><ArrowUpToLine size={15} /></button>
          <button className={ib} title="Forward" onClick={() => onMove(it.id, 'forward')}><ChevronUp size={15} /></button>
          <button className={ib} title="Backward" onClick={() => onMove(it.id, 'backward')}><ChevronDown size={15} /></button>
          <button className={ib} title="Send to back" onClick={() => onMove(it.id, 'back')}><ArrowDownToLine size={15} /></button>
          <span className="mx-1 h-4 w-px bg-blush-200" />
          <button className={ib} title="Duplicate" onClick={() => onDuplicate(it.id)}><Copy size={15} /></button>
          <button className={ib} title="Delete" onClick={() => onDelete(it.id)}><Trash2 size={15} /></button>
        </div>
      )}
      <ul className="min-h-0 space-y-1 overflow-y-auto pr-0.5" role="listbox" aria-label="Layers">
        {list.length === 0 && <li className="rounded-xl bg-white/50 p-3 text-center text-xs text-stone-500 dark:bg-white/5">Nothing here yet. Add something from the Library.</li>}
        {list.map((id) => {
          const i = room.items[id]
          const on = id === sel
          return (
            <li
              key={id} role="option" aria-selected={on} draggable={editing !== id}
              onDragStart={(e) => { dragId.current = id; e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(e) => { e.preventDefault(); setOver(id) }}
              onDragLeave={() => setOver((o) => (o === id ? null : o))}
              onDrop={(e) => { e.preventDefault(); if (dragId.current) onDrop(dragId.current, id); dragId.current = null; setOver(null) }}
              onClick={() => onSelect({ room: roomId, id })}
              className={`flex cursor-pointer items-center gap-1 rounded-xl px-1.5 py-1 text-sm transition ${on ? 'bg-blush-200/80 text-blush-700 dark:bg-blush-500/30 dark:text-white' : 'bg-white/60 hover:bg-white dark:bg-white/5'} ${over === id ? 'ring-2 ring-blush-400' : ''} ${i.hidden ? 'opacity-55' : ''}`}
            >
              {editing === id ? (
                <input
                  autoFocus defaultValue={i.name} maxLength={30} aria-label="Layer name"
                  className="min-w-0 flex-1 rounded-md border border-blush-300 bg-white px-1.5 py-0.5 text-sm outline-none dark:bg-white/10"
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== i.name) onPatch(id, { name: v }); setEditing(null) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditing(null) }}
                />
              ) : (
                <span className="min-w-0 flex-1 truncate px-1" onDoubleClick={() => setEditing(id)} title="Double-tap to rename">{i.name}</span>
              )}
              <button className={ib} aria-label={i.hidden ? 'Show' : 'Hide'} onClick={(e) => { e.stopPropagation(); onPatch(id, { hidden: !i.hidden }) }}>{i.hidden ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              <button className={ib} aria-label={i.locked ? 'Unlock' : 'Lock'} onClick={(e) => { e.stopPropagation(); onPatch(id, { locked: !i.locked }) }}>{i.locked ? <Lock size={15} /> : <Unlock size={15} />}</button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
