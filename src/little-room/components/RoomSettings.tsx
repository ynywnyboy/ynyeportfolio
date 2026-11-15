import { useState } from 'react'
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react'
import { FLOORS, PATTERNS, SCENES, THEMES, WALL_COLORS } from '../../lib/room'
import { ROOM_KINDS, ROOM_LIMITS, ROOM_SIZES, type House, type HRoom, type RoomKind } from '../types/littleRoom'
import { outsideItems } from '../utils/houseOps'
import { GARDEN_THEMES, GROUNDS } from '../utils/garden'

const sel = 'w-full rounded-xl border border-blush-200 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10'
const lab = 'mb-1 block text-xs text-stone-500'
const DOORS = ['#c98f5d', '#e9a3b6', '#b9a4e0', '#9fcfb0', '#8fbde0', '#f4f0ea', '#6b5a7a']

interface Props {
  house: House
  roomId: string
  onRoom: (p: Partial<HRoom>) => void
  onHouse: (p: { doorColor: string }) => void
  onSize: (w: number, h: number) => void
  onFit: () => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
}

export function RoomSettings({ house, roomId, onRoom, onHouse, onSize, onFit, onMove, onRemove }: Props) {
  const room = house.rooms[roomId]
  const [confirm, setConfirm] = useState(false)
  if (!room) return null
  const i = house.roomOrder.indexOf(roomId)
  const only = house.roomOrder.length <= 1
  const out = outsideItems(room)
  const preset = (Object.keys(ROOM_SIZES) as (keyof typeof ROOM_SIZES)[]).find((k) => ROOM_SIZES[k].w === room.w && ROOM_SIZES[k].h === room.h) ?? 'custom'
  const num = 'w-20 rounded-lg border border-blush-200 bg-white/80 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blush-300 dark:bg-white/10'

  return (
    <div className="space-y-3 overflow-y-auto pr-0.5 text-sm">
      <label className="block"><span className={lab}>Room name</span>
        <input key={room.id} defaultValue={room.name} maxLength={28} className={sel} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== room.name) onRoom({ name: v }) }} />
      </label>
      <label className="block"><span className={lab}>Room type</span>
        <select className={sel} value={room.kind} onChange={(e) => onRoom({ kind: e.target.value as RoomKind })}>{ROOM_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
      </label>

      <div><span className={lab}>Room size · {room.w} × {room.h}</span>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {(['small', 'medium', 'large'] as const).map((k) => <button key={k} onClick={() => onSize(ROOM_SIZES[k].w, ROOM_SIZES[k].h)} className={`rounded-full px-3 py-1 text-xs capitalize ${preset === k ? 'bg-blush-500 text-white' : 'bg-white/70 text-stone-600 hover:bg-white dark:bg-white/10 dark:text-stone-200'}`}>{k}</button>)}
          <span className={`rounded-full px-3 py-1 text-xs ${preset === 'custom' ? 'bg-blush-500 text-white' : 'bg-white/70 text-stone-400 dark:bg-white/10'}`}>Custom</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
          {([['Width', room.w, ROOM_LIMITS.minW, ROOM_LIMITS.maxW, (v: number) => onSize(v, room.h)], ['Height', room.h, ROOM_LIMITS.minH, ROOM_LIMITS.maxH, (v: number) => onSize(room.w, v)]] as const).map(([name, val, lo, hi, set]) => (
            <label key={name} className="flex items-center gap-1">{name}
              <button type="button" aria-label={`${name} smaller`} onClick={() => set(val - 40)} className="grid h-7 w-7 place-items-center rounded-lg bg-white/80 text-blush-600 dark:bg-white/10">−</button>
              <input key={`${room.id}-${name}-${val}`} type="number" min={lo} max={hi} step={10} defaultValue={val} className={num} aria-label={name}
                onBlur={(e) => { const v = Number(e.target.value); if (Number.isFinite(v) && v !== val) set(v) }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
              <button type="button" aria-label={`${name} bigger`} onClick={() => set(val + 40)} className="grid h-7 w-7 place-items-center rounded-lg bg-white/80 text-blush-600 dark:bg-white/10">+</button>
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-stone-400">{ROOM_LIMITS.minW}–{ROOM_LIMITS.maxW} wide, {ROOM_LIMITS.minH}–{ROOM_LIMITS.maxH} tall. Nothing is deleted when a room shrinks.</p>
        {out.length > 0 && (
          <div className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
            {out.length} item{out.length === 1 ? ' is' : 's are'} outside this room: {out.slice(0, 3).map((i) => i.name).join(', ')}{out.length > 3 ? '…' : ''}.
            <button onClick={onFit} className="ml-2 rounded-full bg-amber-500 px-2.5 py-1 font-medium text-white">Move them back inside</button>
          </div>
        )}
      </div>

      {room.kind === 'garden' ? (
        <>
          <div><span className={lab}>Garden theme</span>
            <div className="flex flex-wrap gap-1.5">
              {GARDEN_THEMES.map((t) => <button key={t.id} onClick={() => onRoom({ floor: t.ground, scene: t.scene as HRoom['scene'] })} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${room.floor === t.ground ? 'bg-blush-500 text-white' : 'bg-white/70 text-stone-600 hover:bg-white dark:bg-white/10 dark:text-stone-200'}`}><span className="h-3 w-3 rounded-full border border-black/10" style={{ background: GROUNDS[t.ground]?.a }} />{t.label}</button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block"><span className={lab}>Grass / ground</span>
              <select className={sel} value={room.floor in GROUNDS ? room.floor : 'meadow'} onChange={(e) => onRoom({ floor: e.target.value })}>{Object.entries(GROUNDS).map(([k, g]) => <option key={k} value={k}>{g.label}</option>)}</select></label>
            <label className="block"><span className={lab}>Weather</span>
              <select className={sel} value={['garden', 'rain', 'snow'].includes(room.scene) ? room.scene : 'garden'} onChange={(e) => onRoom({ scene: e.target.value as HRoom['scene'] })}><option value="garden">Clear</option><option value="rain">Rain</option><option value="snow">Snow</option></select></label>
          </div>
          <p className="text-[11px] text-stone-400">Add soil, raised beds, pots, trees, fences and paths from the Library’s Garden tab. To move or resize the garden, change its size above and use Move left / Move right below.</p>
        </>
      ) : (
        <>
      <div><span className={lab}>Style</span>
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => <button key={t.id} onClick={() => onRoom({ wall: t.wall, pattern: t.pattern, floor: t.floor })} className="flex items-center gap-1.5 rounded-full bg-white/70 px-2.5 py-1 text-xs text-stone-600 hover:bg-white dark:bg-white/10 dark:text-stone-200"><span className="h-3 w-3 rounded-full border border-black/10" style={{ background: t.wall }} />{t.label}</button>)}
        </div>
      </div>

      <div><span className={lab}>Wall colour</span>
        <div className="flex flex-wrap gap-1.5">
          {WALL_COLORS.map((c) => <button key={c} aria-label={`Wall ${c}`} onClick={() => onRoom({ wall: c })} className={`h-7 w-7 rounded-full border-2 ${room.wall === c ? 'border-blush-500' : 'border-white'} shadow-sm`} style={{ background: c }} />)}
          <label className="grid h-7 w-7 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-white text-[10px] shadow-sm" title="Pick any colour" style={{ background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)' }}>
            <input type="color" className="h-0 w-0 opacity-0" value={/^#[0-9a-f]{6}$/i.test(room.wall) ? room.wall : '#fbe3e8'} onChange={(e) => onRoom({ wall: e.target.value })} aria-label="Custom wall colour" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block"><span className={lab}>Wallpaper</span>
          <select className={sel} value={room.pattern} onChange={(e) => onRoom({ pattern: e.target.value as HRoom['pattern'] })}>{PATTERNS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
        <label className="block"><span className={lab}>Floor</span>
          <select className={sel} value={room.floor} onChange={(e) => onRoom({ floor: e.target.value })}>{Object.entries(FLOORS).map(([k, f]) => <option key={k} value={k}>{f.label}</option>)}</select></label>
        <label className="block"><span className={lab}>Window view</span>
          <select className={sel} value={room.scene} onChange={(e) => onRoom({ scene: e.target.value as HRoom['scene'] })}>{SCENES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <label className="flex items-end gap-2 pb-2"><input type="checkbox" checked={room.lights} onChange={(e) => onRoom({ lights: e.target.checked })} className="h-4 w-4 accent-[#e56b8a]" /><span>Lights on</span></label>
      </div>

        </>
      )}

      <div><span className={lab}>Door colour (whole house)</span>
        <div className="flex flex-wrap gap-1.5">{DOORS.map((c) => <button key={c} aria-label={`Door ${c}`} onClick={() => onHouse({ doorColor: c })} className={`h-7 w-7 rounded-full border-2 ${house.doorColor === c ? 'border-blush-500' : 'border-white'} shadow-sm`} style={{ background: c }} />)}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-blush-100 pt-3 dark:border-white/10">
        <button disabled={i <= 0} onClick={() => onMove(-1)} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs disabled:opacity-40 dark:bg-white/10"><ArrowLeft size={13} /> Move left</button>
        <button disabled={i >= house.roomOrder.length - 1} onClick={() => onMove(1)} className="inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs disabled:opacity-40 dark:bg-white/10">Move right <ArrowRight size={13} /></button>
        {confirm ? (
          <span className="flex items-center gap-2 text-xs text-red-600">Remove with everything in it?
            <button className="rounded-full bg-red-500 px-3 py-1.5 text-white" onClick={() => { setConfirm(false); onRemove() }}>Remove</button>
            <button className="px-2 py-1.5 text-stone-500" onClick={() => setConfirm(false)}>Keep</button></span>
        ) : (
          <button disabled={only} title={only ? 'A house needs at least one room' : undefined} onClick={() => setConfirm(true)} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-red-500 disabled:opacity-40"><Trash2 size={13} /> Remove room</button>
        )}
      </div>
    </div>
  )
}
