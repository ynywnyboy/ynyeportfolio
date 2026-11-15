import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { ROOM_BOTTOM, type Dir, type HItem, type HRoom, type House } from '../types/littleRoom'
import { itemSize, layoutOf } from '../utils/house'
import { patchItem } from '../utils/houseOps'
import { CharacterSprite, type SpriteInfo } from './CharacterSprite'
import { PetSprite } from './PetSprite'
import type { usePet } from '../hooks/usePet'
import { RoomView, itemTransform, type Sky } from './Room'
import type { useWalker } from '../hooks/useWalker'

export interface Sel { room: string; id: string }

interface Props {
  house: House
  sky: Sky
  motion: boolean
  editing: boolean
  zoom: number
  selected: Sel | null
  onSelect: (s: Sel | null) => void
  change: (fn: (h: House) => House) => void
  checkpoint: () => void
  onTap: (it: HItem, room: HRoom, at: { x: number }) => void
  now: number
  pet: SpriteInfo | null
  petApi: ReturnType<typeof usePet>
  onPetTap: () => void
  onPetDrop: () => void
  onAspect: (aspect: number) => void
  playing: boolean
  resting: boolean
  photos: Record<string, string>
  walker: ReturnType<typeof useWalker>
  sprite: SpriteInfo
  keysEnabled: boolean
}

type Drag =
  | { kind: 'tap'; sx: number; sy: number }
  | { kind: 'move'; room: string; id: string; ri: number; dx: number; dy: number }
  | { kind: 'resize'; room: string; id: string; cx: number; cy: number; d0: number; s0: number }
  | { kind: 'rotate'; room: string; id: string; cx: number; cy: number }
  | { kind: 'pan'; lastX: number }
  | { kind: 'pet' }

const norm = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180

export function HouseView(p: Props) {
  const { house, editing, walker } = p
  const box = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const charRef = useRef<SVGGElement | null>(null)
  const drag = useRef<Drag | null>(null)
  const [size, setSize] = useState({ w: 800, h: 540 })

  const layout = useMemo(() => layoutOf(house), [house])
  const worldW = layout.total
  const now = useMemo(() => new Date(), [])
  const day = now.getDate()
  const month = now.toLocaleString('en', { month: 'short' }).toUpperCase()

  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight
      if (w > 0 && h > 0) { setSize({ w, h }); p.onAspect(w / h) }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { walker.bind(svgRef.current, charRef.current); return () => walker.bind(null, null) }, [walker])
  useEffect(() => { walker.refresh(); p.petApi.refresh() }, [p.sprite, p.pet]) // eslint-disable-line react-hooks/exhaustive-deps

  // keyboard walking
  useEffect(() => {
    if (!p.keysEnabled || editing) return
    const typing = (e: KeyboardEvent) => { const t = e.target as HTMLElement | null; return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) }
    const dirOf = (k: string): Dir | null => (k === 'ArrowLeft' || k === 'a' || k === 'A' ? 'left' : k === 'ArrowRight' || k === 'd' || k === 'D' ? 'right' : k === 'ArrowUp' || k === 'w' || k === 'W' ? 'up' : k === 'ArrowDown' || k === 's' || k === 'S' ? 'down' : null)
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.ctrlKey || e.metaKey || e.altKey) return
      const d = dirOf(e.key)
      if (d) { e.preventDefault(); walker.press(d) }
    }
    const up = (e: KeyboardEvent) => { const d = dirOf(e.key); if (d) walker.release(d) }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', walker.releaseAll)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', walker.releaseAll); walker.releaseAll() }
  }, [p.keysEnabled, editing, walker])

  const toWorld = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current, m = svg?.getScreenCTM()
    if (!svg || !m) return null
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY
    const r = pt.matrixTransform(m.inverse())
    return { x: r.x, y: r.y }
  }
  const k = size.h / (layout.worldH / p.zoom) // screen pixels per world unit

  const itemOf = (t: Element | null) => {
    const g = t?.closest('[data-item]') as SVGGElement | null
    if (!g) return null
    const room = house.rooms[g.dataset.room ?? '']
    const it = room?.items[g.dataset.item ?? '']
    return room && it ? { room, it } : null
  }

  const down = (e: RPointerEvent<SVGSVGElement>) => {
    const t = e.target as Element
    svgRef.current?.setPointerCapture(e.pointerId)
    if (!editing) { drag.current = { kind: 'tap', sx: e.clientX, sy: e.clientY }; return }
    const h = t.closest('[data-handle]')
    const w = toWorld(e)
    if (t.closest('[data-pet]') && w) { p.onSelect(null); drag.current = { kind: 'pet' }; return }
    if (h && p.selected && w) {
      const room = house.rooms[p.selected.room], it = room?.items[p.selected.id]
      if (room && it && !it.locked) {
        const ri = house.roomOrder.indexOf(room.id)
        const { h: ih } = itemSize(it, house.assets)
        const cx = layout.x[ri] + it.x, cy = it.y - (ih * it.s) / 2
        p.checkpoint()
        drag.current = h.getAttribute('data-handle') === 'rotate'
          ? { kind: 'rotate', room: room.id, id: it.id, cx, cy }
          : { kind: 'resize', room: room.id, id: it.id, cx, cy, d0: Math.max(8, Math.hypot(w.x - cx, w.y - cy)), s0: it.s }
        return
      }
    }
    const hit = itemOf(t)
    if (hit && w) {
      p.onSelect({ room: hit.room.id, id: hit.it.id })
      if (!hit.it.locked) {
        const ri = house.roomOrder.indexOf(hit.room.id)
        p.checkpoint()
        drag.current = { kind: 'move', room: hit.room.id, id: hit.it.id, ri, dx: hit.it.x - (w.x - layout.x[ri]), dy: hit.it.y - w.y }
      }
      return
    }
    p.onSelect(null)
    drag.current = { kind: 'pan', lastX: e.clientX }
  }

  const move = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    if (!d || d.kind === 'tap') return
    if (d.kind === 'pan') { walker.panBy(-(e.clientX - d.lastX) / k); d.lastX = e.clientX; return }
    const w = toWorld(e)
    if (!w) return
    if (d.kind === 'pet') { p.petApi.setPos(w.x, w.y); return }
    if (d.kind === 'move') {
      const rm = house.rooms[d.room]
      const x = Math.round(Math.max(0, Math.min(rm?.w ?? 800, w.x - layout.x[d.ri] + d.dx)))
      const y = Math.round(Math.max(ROOM_BOTTOM - (rm?.h ?? 520), Math.min(ROOM_BOTTOM + 40, w.y + d.dy)))
      p.change((h) => patchItem(h, d.room, d.id, { x, y }))
    } else if (d.kind === 'resize') {
      const s = Math.max(0.15, Math.min(6, +(d.s0 * (Math.hypot(w.x - d.cx, w.y - d.cy) / d.d0)).toFixed(3)))
      p.change((h) => patchItem(h, d.room, d.id, { s }))
    } else {
      let r = norm((Math.atan2(w.y - d.cy, w.x - d.cx) * 180) / Math.PI + 90)
      const snap = Math.round(r / 15) * 15
      if (Math.abs(r - snap) < 4) r = snap
      p.change((h) => patchItem(h, d.room, d.id, { r: Math.round(r) }))
    }
  }

  const up = (e: RPointerEvent<SVGSVGElement>) => {
    const d = drag.current
    drag.current = null
    if (d?.kind === 'pet') { p.onPetDrop(); return }
    if (editing || !d || d.kind !== 'tap') return
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 8) return
    if ((e.target as Element).closest('[data-pet]')) { p.onPetTap(); return }
    const hit = itemOf(e.target as Element)
    const w = toWorld(e)
    if (hit && p.onTap) p.onTap(hit.it, hit.room, { x: w ? w.x - layout.x[Math.max(0, house.roomOrder.indexOf(hit.room.id))] : hit.it.x })
    if (w && (!hit || !hit.it.type || !['bed', 'window', 'radio', 'frame', 'desk', 'calendar', 'lamp', 'floorlamp', 'neon', 'lights', 'soil', 'raisedbed', 'flowerpot', 'gnome', 'birdbath', 'pond'].includes(hit.it.type))) walker.walkTo(w.x, w.y)
  }

  const selRoom = p.selected ? house.rooms[p.selected.room] : null
  const selItem = selRoom && p.selected ? selRoom.items[p.selected.id] : null
  const selIdx = selRoom ? house.roomOrder.indexOf(selRoom.id) : -1

  const hr = 9 / k
  const rooms = house.roomOrder.map((id) => house.rooms[id])
  const door = house.doorColor
  const setCharRef = useCallback((el: SVGGElement | null) => { charRef.current = el }, [])

  return (
    <div ref={box} className="lr-stage relative h-full w-full overflow-hidden" data-editing={editing ? '1' : '0'}>
      <svg
        ref={svgRef} viewBox={`0 ${layout.top} 800 ${layout.worldH}`} className="block h-full w-full select-none"
        style={{ touchAction: editing ? 'none' : 'manipulation' }} role="group" aria-label="Our little house"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null }}
      >
        {rooms.map((r, i) => (
          <RoomView key={r.id} room={r} ox={layout.x[i]} assets={house.assets} photos={p.photos} sky={p.sky} motion={p.motion} editing={editing}
            playing={p.playing} resting={p.resting} day={day} month={month} now={p.now} />
        ))}

        {/* outer walls, roof beams and foundation make it one house */}
        <g pointerEvents="none">
          <rect x={-40} y={layout.top - 30} width={worldW + 80} height={layout.worldH + 60} fill="rgba(170,195,235,.18)" />
          {rooms.map((r, i) => r.kind === 'garden' ? null : <rect key={r.id} x={layout.x[i] - 14} y={ROOM_BOTTOM - r.h - 4} width={r.w + 28} height={12} rx={4} fill="#c79d7c" />)}
          <rect x={-14} y={ROOM_BOTTOM - rooms[0].h} width={14} height={rooms[0].h + 20} fill="#d9b89a" />
          <rect x={worldW} y={ROOM_BOTTOM - rooms[rooms.length - 1].h} width={14} height={rooms[rooms.length - 1].h + 20} fill="#d9b89a" />
          <rect x={-14} y={ROOM_BOTTOM} width={worldW + 28} height={20} fill="#b88f70" />
        </g>

        {/* doorways between rooms: a lintel above, and a door that swings open when you come close */}
        {rooms.slice(1).map((r, i) => {
          const x = layout.x[i + 1], left = rooms[i]
          const tl = ROOM_BOTTOM - left.h, tr = ROOM_BOTTOM - r.h
          return (
            <g key={r.id} data-door={x} data-open="0" className="lr-door" transform={`translate(${x} 0)`} pointerEvents="none">
              <rect x={-14} y={tl} width={14} height={340 - tl} fill={left.wall} /><rect x={0} y={tr} width={14} height={340 - tr} fill={r.wall} />
              <rect x={-14} y={Math.min(tl, tr)} width={28} height={340 - Math.min(tl, tr)} fill="rgba(0,0,0,.06)" />
              <rect x={-17} y={326} width={34} height={12} rx={4} fill={door} stroke="rgba(0,0,0,.18)" />
              <rect x={-14} y={ROOM_BOTTOM - 10} width={28} height={10} fill="rgba(0,0,0,.1)" />
              <g className="lr-leaf">
                <rect x={-14} y={338} width={28} height={ROOM_BOTTOM - 348} rx={5} fill={door} stroke="rgba(0,0,0,.2)" />
                <rect x={-8} y={350} width={16} height={ROOM_BOTTOM - 372} rx={3} fill="rgba(255,255,255,.28)" />
                <circle cx={8} cy={430} r={3.5} fill="#e6c07b" />
              </g>
            </g>
          )
        })}

        {/* the walking character */}
        <CharacterSprite sprite={p.sprite} innerRef={setCharRef} />
        {p.pet && <PetSprite sprite={p.pet} innerRef={p.petApi.bind} />}

        {/* selection box and handles */}
        {editing && selItem && selRoom && selIdx >= 0 && !selItem.hidden && (() => {
          const { w, h } = itemSize(selItem, house.assets)
          const sw = w * selItem.s, sh = h * selItem.s
          return (
            <g transform={`translate(${layout.x[selIdx]} 0) translate(${selItem.x} ${selItem.y}) rotate(${selItem.r} 0 ${-sh / 2})`}>
              <rect x={-sw / 2 - 5} y={-sh - 5} width={sw + 10} height={sh + 10} rx={6} fill="rgba(244,143,177,.08)" stroke={selItem.locked ? '#9a8aa8' : '#e8899f'} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" pointerEvents="none" />
              {!selItem.locked && (
                <>
                  <line x1={0} y1={-sh - 5} x2={0} y2={-sh - 24 / k} stroke="#e8899f" strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />
                  <circle data-handle="rotate" cx={0} cy={-sh - 24 / k} r={hr} fill="#fff" stroke="#e8899f" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ cursor: 'grab' }} />
                  <rect data-handle="resize" x={sw / 2 + 5 - hr} y={5 - hr} width={hr * 2} height={hr * 2} rx={hr / 3} fill="#fff" stroke="#e8899f" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ cursor: 'nwse-resize' }} />
                  <rect data-handle="resize" x={-sw / 2 - 5 - hr} y={-sh - 5 - hr} width={hr * 2} height={hr * 2} rx={hr / 3} fill="#fff" stroke="#e8899f" strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ cursor: 'nwse-resize' }} />
                </>
              )}
            </g>
          )
        })()}
      </svg>

      {/* on-screen directional pad (touch + mouse) */}
      {!editing && (
        <div className="pointer-events-none absolute bottom-3 left-3">
          <div className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1" role="group" aria-label="Walk">
            {([[null, 'up', null], ['left', null, 'right'], [null, 'down', null]] as (Dir | null)[][]).flat().map((d, i) => d ? (
              <button key={i} type="button" aria-label={`Walk ${d}`} className="lr-pad"
                onPointerDown={(e) => { e.preventDefault(); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); walker.press(d) }}
                onPointerUp={() => walker.release(d)} onPointerCancel={() => walker.release(d)} onLostPointerCapture={() => walker.release(d)}>
                {d === 'up' ? <ChevronUp size={22} /> : d === 'down' ? <ChevronDown size={22} /> : d === 'left' ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
              </button>
            ) : <span key={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}

export { itemTransform }
export type { Sky }
