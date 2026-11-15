import { useEffect, useState } from 'react'
import { Modal } from '../../components/ui'
import { ROOM_KINDS, type House, type RoomKind } from '../types/littleRoom'

const input = 'w-full rounded-xl border border-blush-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10'

export function AddRoomDialog({ open, onClose, house, onAdd }: { open: boolean; onClose: () => void; house: House; onAdd: (kind: RoomKind, name: string, index: number) => void }) {
  const [kind, setKind] = useState<RoomKind>('bedroom')
  const [name, setName] = useState('')
  const [at, setAt] = useState(house.roomOrder.length)
  useEffect(() => { if (open) { setKind('bedroom'); setName(''); setAt(house.roomOrder.length) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const label = ROOM_KINDS.find((k) => k.id === kind)?.label ?? 'Room'
  const same = house.roomOrder.filter((id) => house.rooms[id]?.kind === kind).length
  const fallback = same ? `${label} ${same + 1}` : label

  return (
    <Modal open={open} onClose={onClose} title="Add a room">
      <div className="space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-stone-500">Type of room</span>
          <select className={input} value={kind} onChange={(e) => setKind(e.target.value as RoomKind)}>
            {ROOM_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-500">Name</span>
          <input className={input} value={name} maxLength={28} placeholder={fallback} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-500">Where does it go?</span>
          <select className={input} value={at} onChange={(e) => setAt(Number(e.target.value))}>
            <option value={0}>At the very left</option>
            {house.roomOrder.map((id, i) => <option key={id} value={i + 1}>{i === house.roomOrder.length - 1 ? 'At the very right, after ' : 'After '}{house.rooms[id]?.name}</option>)}
          </select>
        </label>
        <p className="text-xs text-stone-500">New rooms come with a few matching pieces to start. You can have as many bedrooms as you like.</p>
        <div className="flex justify-end gap-2">
          <button className="rounded-full px-4 py-2 text-stone-500" onClick={onClose}>Cancel</button>
          <button className="rounded-full bg-blush-500 px-4 py-2 font-medium text-white" onClick={() => { onAdd(kind, name.trim() || fallback, at); onClose() }}>Add room</button>
        </div>
      </div>
    </Modal>
  )
}
