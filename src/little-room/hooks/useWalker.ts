import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { Dir } from '../types/littleRoom'
import { WALK_BOTTOM, WALK_TOP, canStand, type Block } from '../utils/house'

/**
 * The walking character and the camera. Position, animation frame, camera and doors are written straight to the DOM
 * (React never re-renders the house while someone walks), and the loop only runs while something moves.
 * Movement is real 4-direction walking on the floor: left/right/up(back)/down(front), with furniture collision.
 */
const SPEED = 175 // world units per second (diagonals are normalised, so they are not faster)
const STEP = 11 // distance walked per animation frame, so the legs always match the speed
const KEY = 'olw-house-char'

export interface WalkerConfig {
  worldW: number
  roomX: number[] // left edge of every room
  top: number // world y of the top of the tallest room
  worldH: number
  blocks: Block[]
  collision: boolean
  editing: boolean
  zoom: number
  aspect: number // viewport width / height
  onRoom?: (index: number) => void
}

export interface Saved { x: number; y: number; preset: string }
export function readSaved(): Saved {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { x: typeof j.x === 'number' ? j.x : 400, y: typeof j.y === 'number' ? j.y : 450, preset: typeof j.preset === 'string' ? j.preset : 'default' }
  } catch { return { x: 400, y: 450, preset: 'default' } }
}
export function saveChar(p: Partial<Saved>) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readSaved(), ...p })) } catch { /* ignore */ }
}

export function useWalker(cfg: WalkerConfig) {
  const c = useRef(cfg)
  c.current = cfg
  const st = useRef({
    x: readSaved().x, y: readSaved().y, dir: 'down' as Dir, k: { left: false, right: false, up: false, down: false }, target: null as { x: number; y: number } | null,
    listeners: new Set<(ev: 'frame' | 'place') => void>(), dist: 0, moving: false, cam: 0, panTarget: 0, raf: 0, last: 0, room: -1, svg: null as SVGSVGElement | null, char: null as SVGGElement | null,
  })

  const view = () => {
    const vh = c.current.worldH / c.current.zoom, vw = vh * c.current.aspect
    return { vw, vh }
  }
  const clampCam = (x: number) => {
    const { vw } = view()
    return c.current.worldW <= vw ? (c.current.worldW - vw) / 2 : Math.max(0, Math.min(c.current.worldW - vw, x))
  }
  const free = (x: number, y: number) => canStand(c.current.blocks, c.current.collision, c.current.worldW, x, y)

  const apply = useCallback(() => {
    const s = st.current
    const { vw, vh } = view()
    const cf = c.current
    s.svg?.setAttribute('viewBox', `${s.cam.toFixed(1)} ${(cf.top + cf.worldH - vh).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`)
    if (s.char) {
      s.char.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`)
      const sp = s.char.querySelector<SVGSVGElement>('[data-sprite]')
      if (sp) {
        const cols = Number(sp.dataset.cols) || 4, rows = Number(sp.dataset.rows) || 3, fw = Number(sp.dataset.fw) || 20, fh = Number(sp.dataset.fh) || 32
        const own = rows >= 4
        const row = s.dir === 'down' ? 0 : s.dir === 'up' ? 1 : s.dir === 'left' ? 2 : own ? 3 : 2
        const frame = s.moving ? [1, 0, 3, 0][Math.floor(s.dist / STEP) % 4] % cols : 0 // idle = the standing frame
        sp.setAttribute('viewBox', `${frame * fw} ${row * fh} ${fw} ${fh}`)
        const flip = s.dir === 'right' && !own
        s.char.querySelector('[data-flip]')?.setAttribute('transform', flip ? 'scale(-1 1)' : '')
      }
      s.char.classList.toggle('walk', s.moving)
    }
    s.svg?.querySelectorAll<SVGGElement>('[data-door]').forEach((d) => {
      d.dataset.open = cf.editing || Math.abs(s.x - Number(d.dataset.door)) < 125 ? '1' : '0'
    })
  }, [])

  const stop = () => { if (st.current.raf) { cancelAnimationFrame(st.current.raf); st.current.raf = 0 } }

  const frame = useCallback((t: number) => {
    const s = st.current, cf = c.current
    const dt = Math.min(0.05, (t - s.last) / 1000 || 0.016)
    s.last = t
    let dx = (s.k.right ? 1 : 0) - (s.k.left ? 1 : 0), dy = (s.k.down ? 1 : 0) - (s.k.up ? 1 : 0)
    if (!dx && !dy && s.target) {
      const tx = s.target.x - s.x, ty = s.target.y - s.y
      if (Math.hypot(tx, ty) < 6) s.target = null
      else { dx = Math.abs(tx) > 4 ? Math.sign(tx) : 0; dy = Math.abs(ty) > 4 ? Math.sign(ty) : 0 }
    }
    s.moving = false
    if ((dx || dy) && !cf.editing) {
      const len = Math.hypot(dx, dy)
      const mx = (dx / len) * SPEED * dt, my = (dy / len) * SPEED * dt
      let moved = 0
      if (dx && free(s.x + mx, s.y)) { s.x += mx; moved += Math.abs(mx) }
      if (dy && free(s.x, s.y + my)) { s.y += my; moved += Math.abs(my) }
      if (moved > 0) { s.moving = true; s.dist += moved } else if (s.target) s.target = null // blocked: stop walking to the tapped spot
      // face where you are going (sideways wins on a diagonal, like the classic RPGs)
      if (dx) s.dir = dx > 0 ? 'right' : 'left'
      else if (dy) s.dir = dy > 0 ? 'down' : 'up'
    }
    const goal = cf.editing ? s.panTarget : clampCam(s.x - view().vw / 2)
    const settled = Math.abs(goal - s.cam) < 0.4
    s.cam = clampCam(settled ? goal : s.cam + (goal - s.cam) * Math.min(1, dt * 5))
    apply()
    s.listeners.forEach((f) => f('frame'))
    let idx = 0
    for (let i = cf.roomX.length - 1; i >= 0; i--) if (s.x >= cf.roomX[i]) { idx = i; break }
    if (idx !== s.room) { s.room = idx; cf.onRoom?.(idx) }
    const k = s.k
    if (s.moving || !settled || k.left || k.right || k.up || k.down || s.target) s.raf = requestAnimationFrame(frame)
    else { s.raf = 0; saveChar({ x: s.x, y: s.y }) }
  }, [apply])

  const kick = useCallback(() => { const s = st.current; if (!s.raf) { s.last = performance.now(); s.raf = requestAnimationFrame(frame) } }, [frame])

  /** If the character ended up inside furniture (it was moved, or the room was resized), step out to the nearest free spot. */
  const ensureFree = useCallback(() => {
    const s = st.current
    s.x = Math.max(24, Math.min(c.current.worldW - 24, s.x))
    s.y = Math.max(WALK_TOP, Math.min(WALK_BOTTOM, s.y))
    if (free(s.x, s.y)) return
    for (let r = 8; r < 700; r += 8) {
      for (let a = 0; a < 16; a++) {
        const x = s.x + Math.cos((a / 16) * Math.PI * 2) * r, y = s.y + Math.sin((a / 16) * Math.PI * 2) * r * 0.6
        if (free(x, y)) { s.x = x; s.y = y; return }
      }
    }
  }, [])

  const api = useMemo(() => ({
    bind(svg: SVGSVGElement | null, char: SVGGElement | null) { st.current.svg = svg; st.current.char = char; if (svg) { st.current.cam = clampCam(st.current.x - view().vw / 2); st.current.panTarget = st.current.cam; ensureFree(); apply(); kick() } },
    press(d: Dir) { const s = st.current; s.k[d === 'down' ? 'down' : d === 'up' ? 'up' : d] = true; s.target = null; kick() },
    release(d: Dir) { const s = st.current; s.k[d === 'down' ? 'down' : d === 'up' ? 'up' : d] = false; kick() },
    releaseAll() { const k = st.current.k; k.left = k.right = k.up = k.down = false },
    walkTo(x: number, y?: number) { st.current.target = { x: Math.max(24, Math.min(c.current.worldW - 24, x)), y: Math.max(WALK_TOP, Math.min(WALK_BOTTOM, y ?? st.current.y)) }; kick() },
    /** jump straight to a spot (used when you switch rooms: you appear at that room's entrance) */
    place(x: number, y: number, dir?: Dir) { const s = st.current; s.x = x; s.y = y; if (dir) s.dir = dir; s.target = null; ensureFree(); apply(); kick(); s.listeners.forEach((f) => f('place')) },
    /** other things that follow the player (the pet) listen here: 'frame' while moving, 'place' after a room switch */
    subscribe(fn: (ev: 'frame' | 'place') => void) { st.current.listeners.add(fn); return () => { st.current.listeners.delete(fn) } },
    state: () => ({ x: st.current.x, y: st.current.y, dir: st.current.dir, moving: st.current.moving }),
    charEl: () => st.current.char,
    ensureFree() { ensureFree(); apply(); kick() },
    panTo(x: number) { const s = st.current; s.panTarget = clampCam(x - view().vw / 2); kick() },
    panBy(dx: number) { const s = st.current; s.panTarget = clampCam(s.panTarget + dx); s.cam = s.panTarget; apply() },
    refresh() { const s = st.current; s.cam = clampCam(s.cam); s.panTarget = clampCam(s.panTarget); ensureFree(); apply(); kick() },
    x: () => st.current.x,
    y: () => st.current.y,
    cameraCentre: () => st.current.cam + view().vw / 2,
    stop,
  }), [apply, kick, ensureFree]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const s = st.current
    if (cfg.editing) s.panTarget = s.cam
    api.refresh()
  }, [cfg.worldW, cfg.zoom, cfg.aspect, cfg.editing, cfg.blocks, cfg.collision, cfg.top, cfg.worldH, api])

  useEffect(() => () => { stop(); saveChar({ x: st.current.x, y: st.current.y }) }, [])
  useEffect(() => {
    const save = () => saveChar({ x: st.current.x, y: st.current.y })
    window.addEventListener('pagehide', save)
    return () => window.removeEventListener('pagehide', save)
  }, [])

  return api
}
