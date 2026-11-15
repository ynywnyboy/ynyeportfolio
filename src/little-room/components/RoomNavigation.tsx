import { DoorOpen, Plus } from 'lucide-react'
import type { House } from '../types/littleRoom'

/** Chips along the top: tap one to walk (or, while editing, pan) to that room. */
export function RoomNavigation({ house, current, onGo, onAdd, editing }: { house: House; current: number; onGo: (i: number) => void; onAdd: () => void; editing: boolean }) {
  return (
    <nav aria-label="Rooms" className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
      {house.roomOrder.map((id, i) => {
        const on = i === current
        return (
          <button
            key={id} onClick={() => onGo(i)} aria-current={on ? 'true' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition ${on ? 'bg-blush-500 text-white' : 'bg-white/70 text-blush-600 hover:bg-white dark:bg-white/10 dark:text-blush-200'}`}
          >
            <DoorOpen size={13} /> {house.rooms[id]?.name ?? 'Room'}
          </button>
        )
      })}
      {editing && (
        <button onClick={onAdd} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-dashed border-blush-300 px-3 py-1.5 text-xs font-medium text-blush-600 transition hover:bg-white/60 dark:text-blush-200">
          <Plus size={13} /> Add room
        </button>
      )}
    </nav>
  )
}
