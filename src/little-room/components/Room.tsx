import { memo, useMemo } from 'react'
import { FLOORS, META, type Pattern } from '../../lib/room'
import { ART } from '../../components/room/art'
import { FLOOR, ROOM_BOTTOM, type Asset, type HItem, type HRoom } from '../types/littleRoom'
import { assetUrl } from '../utils/assetManagement'
import { GROUNDS, isWet, isPlot, slotsOf, stageOf } from '../utils/garden'
import { Drops, PlantArt } from '../art/plants'
import { itemSize } from '../utils/house'

export type Sky = 'day' | 'dusk' | 'night'

const isDarkHex = (h: string) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 128 }
export const TAPPABLE = new Set(['bed', 'window', 'radio', 'frame', 'desk', 'lamp', 'floorlamp', 'neon', 'lights', 'calendar', 'cat', 'nightstand', 'tv', 'fridge', 'toilet', 'sink', 'bathtub', 'sofa', 'mirror', 'soil', 'raisedbed', 'flowerpot', 'gnome', 'bench', 'birdbath', 'pond', 'lamppost'])

/** The transform every item uses (also used by the selection handles so they line up exactly). */
export const itemTransform = (it: HItem, h: number) => `translate(${it.x} ${it.y}) rotate(${it.r} 0 ${(-h * it.s) / 2}) scale(${it.f ? -it.s : it.s} ${it.s})`

interface NodeProps {
  it: HItem; rid: string; asset?: Asset; photo?: string
  on: boolean; playing: boolean; resting: boolean; scene: HRoom['scene']; sky: Sky; motion: boolean; day: number; month: string
  editing: boolean; now: number
}

const ItemNode = memo(function ItemNode(p: NodeProps) {
  const { it } = p
  const size = itemSize(it, p.asset ? { [p.asset.id]: p.asset } : {})
  const Art = it.kind === 'art' && it.type ? ART[it.type] : null
  const tappable = it.kind === 'art' && it.type && TAPPABLE.has(it.type)
  return (
    <g data-item={it.id} data-room={p.rid} transform={itemTransform(it, size.h)}
      style={{ cursor: p.editing ? (it.locked ? 'not-allowed' : 'grab') : tappable ? 'pointer' : undefined }}>
      {Art ? (
        <Art v={it.v} id={it.id} photo={p.photo} on={p.on} playing={p.playing} resting={p.resting} scene={p.scene} sky={p.sky} motion={p.motion} day={p.day} month={p.month} />
      ) : p.asset ? (
        <image href={assetUrl(p.asset)} x={-size.w / 2} y={-size.h} width={size.w} height={size.h} preserveAspectRatio="none" />
      ) : (
        <g><rect x={-50} y={-100} width={100} height={100} rx={8} fill="rgba(255,255,255,.4)" stroke="#e8899f" strokeDasharray="6 4" /><text x="0" y="-44" textAnchor="middle" fontSize="28" fill="#e8899f">?</text></g>
      )}
      {p.now > 0 && it.plants && slotsOf(it.type)?.map((sl, i) => {
        const pl = it.plants?.[i]
        if (!pl) return null
        return (
          <g key={i} transform={`translate(${sl.x} ${sl.y})`} pointerEvents="none">
            <PlantArt kind={pl.k} stage={stageOf(pl, p.now)} color={pl.c} motion={p.motion} wet={isWet(pl, p.now)} />
            {pl.l > 0 && p.now - pl.l < 3500 && <Drops key={pl.l} />}
          </g>
        )
      })}
      <rect x={-size.w / 2} y={-size.h} width={size.w} height={size.h} fill="transparent" />
    </g>
  )
})

/** The garden's open sky, hills and grass (instead of walls and a floor). */
function GardenBackdrop({ room, sky, motion }: { room: HRoom; sky: Sky; motion: boolean }) {
  const W = room.w, T = ROOM_BOTTOM - room.h
  const g = GROUNDS[room.floor] ?? GROUNDS.meadow
  const col = sky === 'day' ? ['#bfe3fa', '#eaf6ff'] : sky === 'dusk' ? ['#f7b99a', '#fde3c8'] : ['#1d1b4a', '#3a3470']
  const hill = sky === 'night' ? ['#2f3f66', '#27365a'] : sky === 'dusk' ? ['#9bbf8a', '#86ab7a'] : [g.b, g.a]
  const gid = `gs-${room.id}`
  return (
    <g>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={col[0]} /><stop offset="1" stopColor={col[1]} /></linearGradient></defs>
      <rect y={T} width={W} height={FLOOR - T + 2} fill={`url(#${gid})`} />
      {sky === 'night' ? <>
        {[...Array(26)].map((_, i) => <circle key={i} cx={(i * 131 + 40) % W} cy={T + 20 + ((i * 53) % Math.max(60, FLOOR - T - 90))} r={i % 5 === 0 ? 1.8 : 1.1} fill="#fff" className={motion ? 'olw-twinkle' : undefined} style={{ animationDelay: `${(i % 7) * 0.4}s` }} opacity={motion ? undefined : 0.8} />)}
        <circle cx={W * 0.8} cy={T + 70} r={24} fill="#f7f1d0" /><circle cx={W * 0.8 + 9} cy={T + 64} r={22} fill="#1d1b4a" opacity=".55" />
      </> : <>
        <circle cx={W * 0.82} cy={T + 72} r={sky === 'dusk' ? 30 : 26} fill={sky === 'dusk' ? '#ffb070' : '#fff3b0'} opacity=".95" />
        {[[0.2, 60, 1], [0.55, 100, 0.8], [0.9, 50, 0.7]].map(([x, y, s], i) => <g key={i} transform={`translate(${W * x} ${T + y}) scale(${s})`} fill="#fff" opacity=".9" className={motion ? 'lr-cloud' : undefined}><ellipse cx={0} cy={0} rx={34} ry={12} /><ellipse cx={-18} cy={-8} rx={18} ry={11} /><ellipse cx={14} cy={-11} rx={22} ry={13} /></g>)}
      </>}
      <path d={`M0 ${FLOOR - 40} Q${W * 0.2} ${FLOOR - 95} ${W * 0.42} ${FLOOR - 48} T${W * 0.8} ${FLOOR - 62} T${W} ${FLOOR - 40} V${FLOOR + 2} H0Z`} fill={hill[0]} opacity=".85" />
      <path d={`M0 ${FLOOR - 22} Q${W * 0.3} ${FLOOR - 60} ${W * 0.6} ${FLOOR - 28} T${W} ${FLOOR - 30} V${FLOOR + 2} H0Z`} fill={hill[1]} />
      <rect y={FLOOR} width={W} height={ROOM_BOTTOM - FLOOR + 10} fill={g.a} />
      {[...Array(5)].map((_, i) => <rect key={i} y={FLOOR + i * 34} width={W} height={17} fill={g.b} opacity=".5" />)}
      {[...Array(Math.round(W / 14))].map((_, i) => { const x = (i * 83 + 17) % W, y = FLOOR + 14 + ((i * 47) % 150); return <path key={i} d={`M${x} ${y} l-2 -7 M${x} ${y} l1 -8 M${x} ${y} l3 -6`} stroke={g.blade} strokeWidth="1.3" fill="none" strokeLinecap="round" opacity=".8" /> })}
      <rect y={FLOOR} width={W} height="22" fill="rgba(0,0,0,.05)" />
      {room.scene === 'rain' && [...Array(Math.round(W / 22))].map((_, i) => <line key={i} x1={(i * 22) % W} y1={T + 10} x2={(i * 22) % W - 4} y2={T + 24} stroke="#e9f1ff" strokeWidth="1.3" className={motion ? 'olw-rain' : undefined} style={{ animationDelay: `${(i % 6) * 0.15}s` }} opacity={motion ? undefined : 0.5} />)}
      {room.scene === 'snow' && [...Array(Math.round(W / 26))].map((_, i) => <circle key={i} cx={(i * 26 + 9) % W} cy={T + 6 + ((i * 37) % 120)} r={2} fill="#fff" className={motion ? 'olw-snow' : undefined} style={{ animationDelay: `${(i % 6) * 0.5}s` }} opacity={motion ? undefined : 0.8} />)}
    </g>
  )
}

const FLUTTER = [['#f7a1c4', 0.25, 150, 0], ['#ffd45a', 0.6, 190, -3], ['#9bc4f5', 0.82, 130, -6]] as const
function Butterflies({ w, top }: { w: number; top: number }) {
  return (
    <g pointerEvents="none">
      {FLUTTER.map(([c, x, y, d], i) => (
        <g key={i} transform={`translate(${w * x} ${Math.max(top + 40, y + top * 0)})`}>
          <g className={`lr-flutter lr-flutter${i + 1}`} style={{ animationDelay: `${d}s` }}>
            <g className="lr-wing"><ellipse cx={-4} cy={-2} rx={4.5} ry={3.4} fill={c} stroke="rgba(0,0,0,.2)" strokeWidth=".6" /><ellipse cx={4} cy={-2} rx={4.5} ry={3.4} fill={c} stroke="rgba(0,0,0,.2)" strokeWidth=".6" /></g>
            <rect x={-0.8} y={-4} width={1.6} height={8} rx={0.8} fill="#4a3a52" />
          </g>
        </g>
      ))}
    </g>
  )
}

function Backdrop({ room, sky, motion }: { room: HRoom; sky: Sky; motion: boolean }) {
  if (room.kind === 'garden') return <GardenBackdrop room={room} sky={sky} motion={motion} />
  const dark = isDarkHex(room.wall)
  const ink = dark ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.65)'
  const ink2 = dark ? 'rgba(255,255,255,.08)' : 'rgba(180,120,140,.12)'
  const f = FLOORS[room.floor] ?? FLOORS.wood
  const h = ROOM_BOTTOM - FLOOR
  const W = room.w, T = ROOM_BOTTOM - room.h // local y of the ceiling
  const pid = (k: Pattern) => `wp-${room.id}-${k}`
  return (
    <g>
      <defs>
        <pattern id={pid('stripes')} width="40" height="10" patternUnits="userSpaceOnUse"><rect width="20" height="10" fill={ink} /></pattern>
        <pattern id={pid('dots')} width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="4" fill={ink} /></pattern>
        <pattern id={pid('hearts')} width="54" height="54" patternUnits="userSpaceOnUse"><path d="M27 36c-9-7-11-13-6-15 3-1 6 2 6 2s3-3 6-2c5 2 3 8-6 15z" fill={ink} /></pattern>
        <pattern id={pid('stars')} width="60" height="60" patternUnits="userSpaceOnUse"><path d="M30 18l2.6 7.2 7.4.3-5.8 4.6 2 7.2L30 33l-6.2 4.3 2-7.2-5.8-4.6 7.4-.3z" fill={ink} /></pattern>
        <pattern id={pid('gingham')} width="40" height="40" patternUnits="userSpaceOnUse"><rect width="20" height="40" fill={ink2} /><rect width="40" height="20" fill={ink2} /></pattern>
        <linearGradient id={`ws-${room.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(0,0,0,.08)" /><stop offset=".25" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor="rgba(0,0,0,.07)" /></linearGradient>
      </defs>
      <rect y={T} width={W} height={FLOOR - T} fill={room.wall} />
      {room.pattern !== 'plain' && <rect y={T} width={W} height={FLOOR - T} fill={`url(#${pid(room.pattern)})`} />}
      <rect y={T} width={W} height={FLOOR - T} fill={`url(#ws-${room.id})`} />
      <rect y={FLOOR - 14} width={W} height="14" fill="rgba(255,255,255,.55)" />
      <rect y={FLOOR - 2} width={W} height="2" fill="rgba(0,0,0,.1)" />
      <rect y={FLOOR} width={W} height={h} fill={f.a} />
      {f.kind === 'plank' && [...Array(7)].map((_, i) => (
        <g key={i}>
          <rect y={FLOOR + i * 26} width={W} height="26" fill={i % 2 ? f.b : f.a} opacity=".55" />
          {[...Array(6)].map((__, k) => { const x = ((k * 173 + i * 61) % W) + 20; return <line key={k} x1={x} x2={x} y1={FLOOR + i * 26} y2={FLOOR + i * 26 + 26} stroke="rgba(0,0,0,.1)" /> })}
        </g>
      ))}
      {f.kind === 'checker' && [...Array(5)].flatMap((_, r) => [...Array(Math.ceil(W / 40))].map((__, c) => ((r + c) % 2 ? <rect key={`${r}-${c}`} x={c * 40} y={FLOOR + r * 34} width="40" height="34" fill={f.b} /> : null)))}
      {f.kind === 'carpet' && [...Array(60)].map((_, i) => <circle key={i} cx={(i * 97) % W} cy={FLOOR + ((i * 53) % h)} r="2" fill={f.b} />)}
      <rect y={FLOOR} width={W} height="26" fill="rgba(0,0,0,.07)" />
    </g>
  )
}

const DUST = [...Array(8)].map((_, i) => ({ x: (i * 97 + 40) % 760, y: 90 + ((i * 53) % 330), r: 1 + (i % 3) * 0.6, d: 8 + (i % 4) * 2, delay: -((i * 1.7) % 9) }))

interface RoomProps {
  room: HRoom; ox: number; assets: Record<string, Asset>; photos: Record<string, string>
  sky: Sky; motion: boolean; editing: boolean; playing: boolean; resting: boolean; day: number; month: string; now: number
}

export const RoomView = memo(function RoomView({ room, ox, assets, photos, sky, motion, editing, playing, resting, day, month, now }: RoomProps) {
  const items = useMemo(() => room.order.map((id) => room.items[id]).filter((i): i is HItem => !!i && !i.hidden), [room.order, room.items])
  const win = items.find((i) => i.kind === 'art' && i.type === 'window')
  const base = sky === 'night' ? (room.lights ? 0.38 : 0.6) : sky === 'dusk' ? (room.lights ? 0.1 : 0.28) : room.lights ? 0 : 0.1
  const dark = editing ? base * 0.45 : base
  const glowing = room.lights ? items.filter((i) => i.kind === 'art' && i.type && ['lamp', 'floorlamp', 'neon', 'lights', 'lamppost'].includes(i.type)) : []
  const clip = `rc-${room.id}`
  return (
    <g transform={`translate(${ox} 0)`} clipPath={`url(#${clip})`}>
      <defs>
        <clipPath id={clip}><rect x="0" y={ROOM_BOTTOM - room.h} width={room.w} height={room.h + 10} /></clipPath>
        <radialGradient id={`gl-${room.id}`}><stop offset="0" stopColor="#ffe3a0" stopOpacity=".55" /><stop offset="1" stopColor="#ffe3a0" stopOpacity="0" /></radialGradient>
      </defs>
      <Backdrop room={room} sky={sky} motion={motion} />
      {win && (
        <polygon pointerEvents="none" className={motion ? 'olw-beam' : undefined}
          points={`${win.x - 62 * win.s},${win.y - 132 * win.s} ${win.x + 62 * win.s},${win.y - 132 * win.s} ${win.x + 190 * win.s},${FLOOR + 150} ${win.x - 20 * win.s},${FLOOR + 150}`}
          fill={sky === 'night' ? 'rgba(170,190,255,.14)' : sky === 'dusk' ? 'rgba(255,170,140,.25)' : 'rgba(255,238,180,.28)'} />
      )}
      {items.map((it) => (
        <ItemNode key={it.id} it={it} rid={room.id} asset={it.assetId ? assets[it.assetId] : undefined} photo={it.media ? photos[it.media] : undefined}
          on={room.lights} playing={playing} resting={resting} scene={room.scene} sky={sky} motion={motion} day={day} month={month} editing={editing} now={isPlot(it) ? now : 0} />
      ))}
      {resting && items.filter((i) => i.kind === 'art' && i.type === 'bed').map((b) => (
        <g key={b.id} pointerEvents="none" fill="#7a5a8a" fontSize="22" fontWeight="700">
          <text x={b.x - 70 * b.s} y={b.y - 150 * b.s} className="olw-zzz">z</text>
          <text x={b.x - 50 * b.s} y={b.y - 170 * b.s} className="olw-zzz olw-zzz2" fontSize="28">Z</text>
          <text x={b.x - 25 * b.s} y={b.y - 195 * b.s} className="olw-zzz olw-zzz3" fill="#f06292">♡</text>
        </g>
      ))}
      {dark > 0 && <rect x="0" y={ROOM_BOTTOM - room.h} width={room.w} height={room.h + 10} fill={sky === 'dusk' ? '#8a3f62' : '#16123f'} opacity={dark} pointerEvents="none" style={{ transition: 'opacity .8s' }} />}
      {glowing.map((g) => {
        const m = g.type ? META[g.type] : null
        const lamp = g.type !== 'lights' && g.type !== 'neon'
        const cy = g.type === 'lights' ? g.y + 20 : g.y - (m?.h ?? 60) * g.s * (lamp ? 0.6 : 0.4)
        const r = g.type === 'lights' ? 260 : g.type === 'floorlamp' ? 190 : 120
        return <circle key={g.id} cx={g.x} cy={cy} r={r * Math.max(0.7, g.s)} fill={`url(#gl-${room.id})`} pointerEvents="none" opacity={sky === 'day' ? 0.35 : 0.9} style={{ mixBlendMode: 'screen' }} />
      })}
      {motion && room.kind === 'garden' && sky !== 'night' && !editing && <Butterflies w={room.w} top={ROOM_BOTTOM - room.h} />}
      {motion && room.kind !== 'garden' && DUST.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#fff" className="olw-dust" style={{ animationDuration: `${d.d}s`, animationDelay: `${d.delay}s` }} pointerEvents="none" />)}
    </g>
  )
})
