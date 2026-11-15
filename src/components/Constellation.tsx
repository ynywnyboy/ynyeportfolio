import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useReducedMotion } from 'motion/react'
import { CalendarDays, ChevronRight, Film, GitBranch, RotateCcw, Sparkles, X } from 'lucide-react'
import type { Media } from '../lib/types'
import { publicUrl } from '../lib/storage'
import { useSite } from '../context/SiteContext'

/**
 * "Our Constellation" — a game-style specialization tree. Every memory is a real, clickable node.
 *  • the first memory is the root; every album (or year, when there is no album) grows its own branch
 *  • branches run through time, so you read the tree like a skill tree
 *  • on first open the tree "unlocks": light travels along each path before the next node wakes up
 * Plain DOM + SVG, only opacity/transform are animated, and it works inside a scrollable pane.
 */

const PLAYED_KEY = 'olw-constellation-played'
let playedThisSession = (() => { try { return sessionStorage.getItem(PLAYED_KEY) === '1' } catch { return false } })()
const markPlayed = () => { playedThisSession = true; try { sessionStorage.setItem(PLAYED_KEY, '1') } catch { /* ignore */ } }

function rand(seed: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619) }
  h ^= h >>> 15; h = Math.imul(h, 2246822519); h ^= h >>> 13
  return ((h >>> 0) % 100000) / 100000
}

type Rank = 'root' | 'head' | 'cap' | 'node'
interface TNode { m: Media; x: number; y: number; size: number; rank: Rank; parent: number; depth: number; t: number; lane: string }
interface TEdge { id: string; a: number; b: number; d: string; tree: boolean; t0: number; dur: number }
interface Label { x: number; y: number; text: string }

const GOLD = '#f6c667'

/** Straight / chamfered orthogonal path through points (the corner cut gives the "circuit board" skill-tree look). */
function chamfer(pts: [number, number][], r = 14): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1]
    const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy)
    const k = Math.min(r, l1 / 2, l2 / 2)
    d += ` L${cx - ((cx - px) / l1) * k} ${cy - ((cy - py) / l1) * k} L${cx + ((nx - cx) / l2) * k} ${cy + ((ny - cy) / l2) * k}`
  }
  const e = pts[pts.length - 1]
  return `${d} L${e[0]} ${e[1]}`
}

function build(sorted: Media[], narrow: boolean, albumName: (id: string | null) => string | undefined) {
  const sp = narrow ? 104 : 120
  const rowH = narrow ? 132 : 146
  const padL = narrow ? 80 : 100
  const padT = narrow ? 80 : 90
  const C = narrow ? 8 : 11 // nodes per row before the branch "snakes" into the next row
  const sizes = narrow ? { root: 86, head: 70, cap: 62, node: 56 } : { root: 96, head: 78, cap: 68, node: 62 }
  const nodes: TNode[] = []
  const edges: TEdge[] = []
  const labels: Label[] = []
  if (!sorted.length) return { nodes, edges, labels, W: 300, H: 300, maxDepth: 0, step: 0.3 }

  // lanes: albums (or years) in order of their first memory; the very first memory is the root
  const lanes = new Map<string, { label: string; items: Media[] }>()
  sorted.slice(1).forEach((m) => {
    const key = m.album_id ?? `y${m.taken_at.slice(0, 4)}`
    if (!lanes.has(key)) lanes.set(key, { label: (m.album_id && albumName(m.album_id)) || m.taken_at.slice(0, 4), items: [] })
    lanes.get(key)!.items.push(m)
  })
  const rows: { label: string; items: Media[]; reverse: boolean; first: boolean; cont: boolean; lane: string }[] = []
  lanes.forEach((ln, key) => {
    for (let c = 0; c * C < ln.items.length; c++) rows.push({ label: ln.label, items: ln.items.slice(c * C, (c + 1) * C), reverse: c % 2 === 1, first: c === 0, cont: c > 0, lane: key })
  })

  const maxLen = Math.max(1, ...rows.map((r) => r.items.length))
  const W = padL + (maxLen + 1) * sp
  const H = Math.max(narrow ? 420 : 460, rows.length * rowH + padT * 2)
  const top = (H - rows.length * rowH) / 2
  const rootY = H / 2

  nodes.push({ m: sorted[0], x: padL, y: rootY, size: sizes.root, rank: 'root', parent: -1, depth: 0, t: 0, lane: '' })
  labels.push({ x: padL, y: rootY - sizes.root / 2 - 16, text: 'THE BEGINNING' })

  const busX = padL + sp * 0.5
  const grid: (number | null)[][] = [] // node index per row / column (for cross-links)
  rows.forEach((row, ri) => {
    const y = top + (ri + 0.5) * rowH
    grid[ri] = []
    row.items.forEach((m, k) => {
      const col = row.reverse ? C - k : k + 1
      const lastOfLane = k === row.items.length - 1 && (ri === rows.length - 1 || rows[ri + 1].lane !== row.lane)
      const rank: Rank = row.first && k === 0 ? 'head' : lastOfLane ? 'cap' : 'node'
      const idx = nodes.length
      const parent = k === 0 ? (row.cont ? nodes.length - 1 : 0) : idx - 1
      nodes.push({ m, x: padL + col * sp, y, size: sizes[rank], rank, parent, depth: nodes[parent].depth + 1, t: 0, lane: row.label })
      grid[ri][col] = idx
      const p = nodes[parent], c = nodes[idx]
      const d = parent === 0 && k === 0 ? chamfer(Math.abs(p.y - c.y) < 2 ? [[p.x, p.y], [c.x, c.y]] : [[p.x, p.y], [busX, p.y], [busX, c.y], [c.x, c.y]])
        : `M${p.x} ${p.y} L${c.x} ${c.y}`
      edges.push({ id: `${parent}-${idx}`, a: parent, b: idx, d, tree: true, t0: 0, dur: 0 })
    })
    if (row.first) labels.push({ x: padL + sp - sizes.head / 2, y: y - sizes.head / 2 - 14, text: row.label.toUpperCase() })
  })

  // a few vertical cross-links between neighbouring branches — this is what turns the tree into a web
  let cross = 0
  for (let ri = 0; ri + 1 < rows.length && cross < Math.ceil(nodes.length / 3); ri++) {
    for (let col = 1; col <= C; col++) {
      const a = grid[ri][col], b = grid[ri + 1][col]
      if (a == null || b == null || edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))) continue
      if (rand(nodes[b].m.id, 11) < 0.7) continue
      edges.push({ id: `${a}-${b}`, a, b, d: `M${nodes[a].x} ${nodes[a].y} L${nodes[b].x} ${nodes[b].y}`, tree: false, t0: 0, dur: 0 })
      cross++
    }
  }

  const maxDepth = Math.max(...nodes.map((n) => n.depth))
  const step = Math.max(0.07, Math.min(0.55, 5 / (maxDepth + 1)))
  const start = 1
  nodes.forEach((n) => { n.t = start + n.depth * step })
  edges.forEach((e) => {
    if (e.tree) { e.t0 = nodes[e.a].t; e.dur = step * 0.9 } else { e.t0 = Math.max(nodes[e.a].t, nodes[e.b].t) + step * 0.4; e.dur = 0.6 }
  })
  return { nodes, edges, labels, W, H, maxDepth, step }
}

const fmtLong = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
const fmtShort = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' })

/** "7 / 12 awakened" — counts up while the tree unlocks. */
function Awake({ nodes, intro, run }: { nodes: TNode[]; intro: boolean; run: number }) {
  const [n, setN] = useState(intro ? 0 : nodes.length)
  useEffect(() => {
    if (!intro) { setN(nodes.length); return }
    setN(0)
    const t0 = performance.now()
    const id = window.setInterval(() => {
      const s = (performance.now() - t0) / 1000
      const c = nodes.filter((x) => x.t <= s).length
      setN(c)
      if (c >= nodes.length) window.clearInterval(id)
    }, 120)
    return () => window.clearInterval(id)
  }, [intro, run, nodes])
  return <span className="tabular-nums">{n} / {nodes.length}</span>
}

export function Constellation({ items, onOpen }: { items: Media[]; onOpen: (m: Media) => void }) {
  const { albums } = useSite()
  const reduced = !!useReducedMotion()
  const lowEnd = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 2
  const motionOn = !reduced && !lowEnd

  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(max-width: 640px)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 640px)')
    if (!mq) return
    const on = () => setNarrow(mq.matches)
    if (mq.addEventListener) { mq.addEventListener('change', on) } else { mq.addListener(on) }
    return () => { if (mq.removeEventListener) { mq.removeEventListener('change', on) } else { mq.removeListener(on) } }
  }, [])

  const sorted = useMemo(() => [...items].sort((a, b) => a.taken_at.localeCompare(b.taken_at) || a.id.localeCompare(b.id)), [items])
  const albumName = useMemo(() => { const map = new Map(albums.map((a) => [a.id, a.name])); return (id: string | null) => (id ? map.get(id) : undefined) }, [albums])
  const { nodes, edges, labels, W, H, maxDepth, step } = useMemo(() => build(sorted, narrow, albumName), [sorted, narrow, albumName])

  // unlock sequence: first time per session, or when "Replay" is pressed — never when a node is selected
  const [run, setRun] = useState(() => (motionOn && !playedThisSession ? 1 : 0))
  const intro = run > 0 && motionOn
  const total = 1 + (maxDepth + 1) * step + 1.4
  useEffect(() => {
    if (!intro) return
    const t = window.setTimeout(markPlayed, total * 1000)
    return () => window.clearTimeout(t)
  }, [intro, run, total])

  const [selId, setSelId] = useState<string | null>(null)
  const [broken, setBroken] = useState<Set<string>>(() => new Set())
  const selIdx = selId ? nodes.findIndex((n) => n.m.id === selId) : -1
  const sel = selIdx >= 0 ? nodes[selIdx] : null
  useEffect(() => { if (selId && selIdx < 0) setSelId(null) }, [selId, selIdx]) // memory deleted
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelId(null) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  // which paths light up for the selected node: the ones touching it, plus its road back to the root
  const hot = useMemo(() => {
    const s = new Set<string>()
    if (selIdx < 0) return s
    edges.forEach((e) => { if (e.a === selIdx || e.b === selIdx) s.add(e.id) })
    for (let i = selIdx; i > 0; i = nodes[i].parent) s.add(`${nodes[i].parent}-${i}`)
    return s
  }, [edges, nodes, selIdx])
  const neighbours = useMemo(() => (selIdx < 0 ? [] : edges.filter((e) => e.a === selIdx || e.b === selIdx).map((e) => nodes[e.a === selIdx ? e.b : e.a])), [edges, nodes, selIdx])

  // glide the selected node to the middle of the pane (only scrolls the pane, never the page)
  const pane = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!sel || !pane.current || !inner.current) return
    const p = pane.current, i = inner.current
    p.scrollTo({ left: Math.max(0, i.offsetLeft + sel.x - p.clientWidth / 2), top: Math.max(0, i.offsetTop + sel.y - p.clientHeight / 2), behavior: motionOn ? 'smooth' : 'auto' })
  }, [selId]) // eslint-disable-line react-hooks/exhaustive-deps

  const unlockDelay = (t: number) => (intro ? { animationDelay: `${t}s` } : undefined)
  const v = (o: Record<string, string>) => o as CSSProperties

  return (
    <section aria-label="Our Constellation" className="overflow-hidden rounded-3xl border border-indigo-300/20 bg-[#080720] text-white shadow-[0_20px_60px_-20px_rgba(90,70,200,.6)]">
      <style>{`
        .cn-grid { background-color: #090820; background-image: radial-gradient(circle at 1px 1px, rgba(140,130,255,.22) 1px, transparent 0), radial-gradient(ellipse 60% 50% at 20% 30%, rgba(94,70,220,.28), transparent), radial-gradient(ellipse 55% 45% at 85% 75%, rgba(40,100,230,.2), transparent); background-size: 30px 30px, auto, auto; }
        .cn-dim-a { animation: cn-dim 1s ease-out both; } @keyframes cn-dim { from { opacity: .78 } to { opacity: 0 } }
        .cn-glow-a { animation: cn-glow 1.1s ease-out both; } @keyframes cn-glow { 0% { opacity: 0; transform: scale(.5) } 40% { opacity: 1; transform: scale(1.35) } 100% { opacity: .75; transform: scale(1) } }
        .cn-draw { stroke-dasharray: 1; animation: cn-draw var(--dur) linear both; } @keyframes cn-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        .cn-head { stroke-dasharray: .06 1; animation: cn-head var(--dur) linear both; } @keyframes cn-head { from { stroke-dashoffset: .06; opacity: 1 } 92% { opacity: 1 } to { stroke-dashoffset: -1; opacity: 0 } }
        .cn-pulse { opacity: 0; animation: cn-pulse 1.4s ease-in-out both; } @keyframes cn-pulse { 0% { opacity: 0 } 45% { opacity: .85 } 100% { opacity: 0 } }
        .cn-lit { animation: cn-lit 3.6s ease-in-out infinite; } @keyframes cn-lit { 0%,100% { opacity: .55 } 50% { opacity: .85 } }
        .cn-spin { animation: cn-spin 14s linear infinite; } @keyframes cn-spin { to { transform: rotate(360deg) } }
        .cn-sel { animation: cn-sel .5s cubic-bezier(.2,.9,.3,1.3) both; } @keyframes cn-sel { from { transform: scale(.88) } to { transform: scale(1.12) } }
        .cn-node { transition: transform .22s ease, box-shadow .22s ease; }
        .cn-node:hover { transform: scale(1.08); }
        .cn-node:focus-visible { outline: 2px solid #fff; outline-offset: 4px; }
        .cn-mote { opacity: 0; animation: cn-mote var(--d) ease-in-out infinite; } @keyframes cn-mote { 0% { opacity: 0; transform: translateY(0) } 30% { opacity: .7 } 100% { opacity: 0; transform: translateY(-26px) } }
        @media (prefers-reduced-motion: reduce) { .cn-dim-a,.cn-glow-a,.cn-draw,.cn-head,.cn-pulse,.cn-lit,.cn-spin,.cn-sel,.cn-mote { animation: none !important } .cn-head,.cn-pulse,.cn-mote { opacity: 0 } }
      `}</style>

      {/* title bar */}
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-300/15 bg-white/[.03] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-2 w-2 rotate-45" style={{ background: GOLD, boxShadow: `0 0 10px ${GOLD}` }} />
          <h2 className="text-[11px] font-semibold uppercase tracking-[.32em] text-amber-200 sm:text-xs">Our Constellation</h2>
        </div>
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest text-indigo-200/80">
          <span>Memories awakened <b className="ml-1 text-amber-200"><Awake nodes={nodes} intro={intro} run={run} /></b></span>
          {motionOn && nodes.length > 0 && (
            <button type="button" onClick={() => { setSelId(null); setRun((r) => r + 1) }} className="inline-flex items-center gap-1 rounded-md border border-indigo-300/25 px-2 py-1 normal-case tracking-normal text-indigo-100 transition hover:bg-white/10">
              <RotateCcw size={12} /> Replay
            </button>
          )}
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* ============ the tree ============ */}
        <div className="relative cn-grid">
          <div ref={pane} className="flex h-[58dvh] min-h-[22rem] overflow-auto overscroll-contain lg:h-[min(74vh,44rem)]" onClick={() => setSelId(null)}>
            <div ref={inner} key={run} className="relative m-auto shrink-0" style={{ width: W, height: H }}>
              <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0" aria-hidden>
                <defs>
                  <linearGradient id="cn-gold" x1="0" x2="1"><stop offset="0" stopColor="#ffe9a8" /><stop offset="1" stopColor="#f2b84b" /></linearGradient>
                </defs>
                {/* dormant paths */}
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {edges.map((e) => <path key={e.id} d={e.d} stroke="#3d4290" strokeWidth="2" strokeDasharray={e.tree ? undefined : '4 6'} opacity=".75" />)}
                </g>
                {/* lit paths — drawn out of the parent node, with a spark of light travelling along */}
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {edges.map((e) => (
                    <g key={e.id}>
                      <path d={e.d} pathLength={1} stroke="rgba(246,198,103,.22)" strokeWidth="7" className={intro ? 'cn-draw' : undefined} style={intro ? v({ '--dur': `${e.dur}s`, animationDelay: `${e.t0}s` }) : undefined} />
                      <path d={e.d} pathLength={1} stroke="url(#cn-gold)" strokeWidth={e.tree ? 2.2 : 1.5} className={intro ? 'cn-draw' : undefined} style={intro ? v({ '--dur': `${e.dur}s`, animationDelay: `${e.t0}s` }) : undefined} />
                      {intro && <path d={e.d} pathLength={1} stroke="#fff" strokeWidth="4" className="cn-head" style={v({ '--dur': `${e.dur}s`, animationDelay: `${e.t0}s` })} />}
                    </g>
                  ))}
                </g>
                {/* highlighted road for the selected node */}
                <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                  {edges.filter((e) => hot.has(e.id)).map((e) => (
                    <g key={`${selId}-${e.id}`}>
                      <path d={e.d} stroke="rgba(255,240,200,.35)" strokeWidth="9" />
                      <path d={e.d} pathLength={1} stroke="#fff6dc" strokeWidth="3.2" className={motionOn ? 'cn-draw' : undefined} style={v({ '--dur': '.45s' })} />
                    </g>
                  ))}
                </g>
                {/* one soft pulse across the finished network */}
                {intro && (
                  <g fill="none" strokeLinecap="round" className="cn-pulse" style={{ animationDelay: `${total - 1.4}s` }}>
                    {edges.map((e) => <path key={e.id} d={e.d} stroke="#fff2c8" strokeWidth="3.5" />)}
                  </g>
                )}
                {motionOn && [...Array(10)].map((_, i) => <circle key={i} className="cn-mote" cx={(i * 211 + 40) % W} cy={(i * 137 + 60) % H} r="1.6" fill="#ffe3a0" style={v({ '--d': `${6 + (i % 4) * 2}s`, animationDelay: `${-i}s` })} />)}
              </svg>

              {labels.map((l, i) => (
                <span key={i} className="pointer-events-none absolute whitespace-nowrap text-[10px] font-semibold tracking-[.22em] text-indigo-200/70" style={{ left: l.x, top: l.y, transform: i === 0 ? 'translateX(-50%)' : undefined }}>{l.text}</span>
              ))}

              {nodes.map((n) => {
                const selected = selId === n.m.id
                const showPhoto = n.m.kind === 'image' && !broken.has(n.m.id)
                const title = n.m.caption || 'A little memory'
                const big = n.rank === 'root'
                return (
                  <div key={n.m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: n.x, top: n.y, width: n.size, height: n.size }}>
                    {/* glow that switches on when the node unlocks */}
                    <span aria-hidden className={`pointer-events-none absolute -inset-[42%] rounded-full ${intro ? 'cn-glow-a' : motionOn && selected ? 'cn-lit' : ''}`}
                      style={{ background: `radial-gradient(closest-side, rgba(246,198,103,${selected ? 0.7 : 0.38}), rgba(246,198,103,0))`, ...unlockDelay(n.t) }} />
                    <button
                      type="button" aria-pressed={selected} title={title}
                      aria-label={`${title}, ${fmtLong(n.m.taken_at)}${n.rank === 'root' ? ' — the first memory' : ''}`}
                      onClick={(e) => { e.stopPropagation(); setSelId((c) => (c === n.m.id ? null : n.m.id)) }}
                      className={`cn-node relative block h-full w-full rounded-full ${selected ? 'cn-sel' : ''}`}
                      style={{ transform: selected ? 'scale(1.12)' : undefined, boxShadow: `0 0 0 ${big ? 4 : 3}px ${selected ? '#fff3cf' : GOLD}, 0 0 0 ${big ? 8 : 6}px rgba(246,198,103,.18), 0 0 ${selected ? 30 : 16}px ${selected ? 8 : 2}px rgba(246,198,103,${selected ? 0.75 : 0.5}), inset 0 0 12px rgba(0,0,0,.6)` }}
                    >
                      <span className="absolute inset-0 overflow-hidden rounded-full bg-[#171447]">
                        {showPhoto ? (
                          <img src={publicUrl(n.m.storage_path)} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" onError={() => setBroken((b) => new Set(b).add(n.m.id))} />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-amber-200">{n.m.kind === 'video' ? <Film size={n.size * 0.34} /> : <Sparkles size={n.size * 0.36} />}</span>
                        )}
                        {intro && <span aria-hidden className="cn-dim-a absolute inset-0 bg-[#0b0a2a]" style={unlockDelay(n.t)} />}
                      </span>
                      {/* spinning ring when selected, ticked ring on the root */}
                      {selected && <span aria-hidden className={`pointer-events-none absolute -inset-[9px] rounded-full border-2 border-dashed border-amber-100/80 ${motionOn ? 'cn-spin' : ''}`} />}
                      {big && !selected && <span aria-hidden className="pointer-events-none absolute -inset-[12px] rounded-full border border-dotted border-amber-200/50" />}
                    </button>
                    <span className={`pointer-events-none absolute left-1/2 top-full mt-2.5 -translate-x-1/2 whitespace-nowrap text-[10px] tracking-wide ${selected ? 'font-semibold text-amber-100' : 'text-indigo-200/70'}`}>{fmtShort(n.m.taken_at)}</span>
                  </div>
                )
              })}
              {intro && <span aria-hidden className="pointer-events-none absolute inset-0 cn-pulse" style={{ animationDelay: `${total - 1.4}s`, background: 'radial-gradient(ellipse at center, rgba(246,198,103,.12), transparent 70%)' }} />}
            </div>
          </div>
          <p className="pointer-events-none absolute bottom-2.5 left-1/2 flex w-max max-w-[92%] -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-300/20 bg-[#0c0a2c]/85 px-3.5 py-1.5 text-[11px] text-indigo-100/90 backdrop-blur sm:text-xs">
            <span aria-hidden className="text-amber-300">◆</span> Each glowing node represents a memory <span className="hidden text-indigo-300/60 sm:inline">· drag to explore</span>
          </p>
        </div>

        {/* ============ details panel ============ */}
        <aside className="relative border-t border-indigo-300/15 bg-[#0d0b2e] lg:h-[min(74vh,44rem)] lg:overflow-y-auto lg:border-l lg:border-t-0" aria-live="polite">
          {sel ? (
            <div key={sel.m.id} className="p-4">
              <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-widest text-indigo-200/80">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {fmtLong(sel.m.taken_at)}</span>
                <button type="button" onClick={() => setSelId(null)} aria-label="Close details" className="rounded-md p-1 text-indigo-200 transition hover:bg-white/10"><X size={16} /></button>
              </div>
              <div className="overflow-hidden rounded-2xl border border-amber-200/30 bg-black shadow-[0_0_24px_rgba(246,198,103,.25)]">
                {sel.m.kind === 'video'
                  ? <video src={publicUrl(sel.m.storage_path)} controls playsInline preload="metadata" className="max-h-60 w-full object-contain" />
                  : <img src={publicUrl(sel.m.storage_path)} alt={sel.m.caption || 'Memory'} decoding="async" className="max-h-60 w-full object-cover" />}
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[.3em] text-amber-200/80">
                {sel.rank === 'root' ? 'The beginning' : sel.rank === 'head' ? 'Branch start' : sel.rank === 'cap' ? 'Latest on this branch' : 'Memory'}
                {sel.lane && <span className="text-indigo-200/60"> · {sel.lane}</span>}
              </p>
              <h3 className="mt-1 font-display text-2xl leading-tight text-white">{sel.m.caption || 'A little memory'} <span className="text-pink-300">♡</span></h3>
              {sel.m.description ? <p className="mt-2 text-sm leading-relaxed text-indigo-100/80">{sel.m.description}</p> : <p className="mt-2 text-sm italic text-indigo-200/50">No details written for this one yet.</p>}
              <p className="mt-3 text-xs text-indigo-200/60">Memory {selIdx + 1} of {nodes.length}</p>
              <button type="button" onClick={() => onOpen(sel.m)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-amber-200/40 bg-gradient-to-r from-amber-300/20 to-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-100 transition hover:from-amber-300/30">
                <span>Open full memory</span><ChevronRight size={16} />
              </button>
              {neighbours.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[.3em] text-indigo-200/60"><GitBranch size={12} /> Connected memories</p>
                  <div className="flex flex-wrap gap-2">
                    {neighbours.map((nb) => (
                      <button key={nb.m.id} type="button" onClick={() => setSelId(nb.m.id)} title={nb.m.caption || fmtLong(nb.m.taken_at)} className="h-12 w-12 overflow-hidden rounded-full border-2 border-amber-200/60 bg-[#171447] transition hover:scale-105">
                        {nb.m.kind === 'image' && !broken.has(nb.m.id) ? <img src={publicUrl(nb.m.storage_path)} alt={nb.m.caption || 'Memory'} loading="lazy" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-amber-200"><Sparkles size={16} /></span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[11rem] flex-col items-center justify-center gap-3 p-6 text-center">
              <span aria-hidden className="h-3 w-3 rotate-45" style={{ background: GOLD, boxShadow: `0 0 14px ${GOLD}` }} />
              <p className="text-sm text-indigo-100/85">Choose a node to read its memory.</p>
              <p className="max-w-[16rem] text-xs leading-relaxed text-indigo-200/55">The first memory is the root. Each album grows its own branch, and branches run through time.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
