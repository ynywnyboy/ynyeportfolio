import { useCallback, useEffect, useMemo, useRef } from 'react'
import { canStand, type Block } from '../utils/house'
import type { useWalker } from './useWalker'

/**
 * The pet has exactly two behaviours:
 *  - idle:   stays where it was put (plays a small idle animation)
 *  - follow: trails the player at a small distance, walking smoothly around walls and solid furniture.
 * Like the player, its position and animation frame are written straight to the DOM; the loop only runs while it moves.
 */
const HW = 8 // the pet's footprint (smaller than the player's)
const HD = 4
const STEP = 8 // distance per walking frame, so the paws match the speed
const BEHIND: Record<string, [number, number]> = { left: [46, 6], right: [-46, 6], down: [34, -12], up: [34, 14] }

export interface PetConfig {
  active: boolean
  mode: 'idle' | 'follow'
  editing: boolean
  home: { x: number; y: number } // where it stays in idle mode (world coordinates)
  worldW: number
  blocks: Block[]
  collision: boolean
  reduced: boolean
  walker: ReturnType<typeof useWalker>
}

export function usePet(cfg: PetConfig) {
  const c = useRef(cfg)
  c.current = cfg
  const st = useRef({
    x: cfg.home.x, y: cfg.home.y, face: 'left' as 'left' | 'right' | 'down' | 'up', moving: false, dist: 0, idle: 0, raf: 0, last: 0, stuck: 0, detour: 0,
    el: null as SVGGElement | null, placed: false,
  })

  const free = (x: number, y: number) => canStand(c.current.blocks, c.current.collision, c.current.worldW, x, y, HW, HD)

  const apply = useCallback(() => {
    const s = st.current
    if (!s.el) return
    s.el.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)})`)
    const sp = s.el.querySelector<SVGSVGElement>('[data-sprite]')
    if (sp) {
      const cols = Number(sp.dataset.cols) || 4, rows = Number(sp.dataset.rows) || 2, fw = Number(sp.dataset.fw) || 20, fh = Number(sp.dataset.fh) || 16
      const vertical = s.moving && rows >= 3 && (s.face === 'down' || s.face === 'up')
      const row = vertical ? (s.face === 'down' ? 2 : rows >= 4 ? 3 : 2) : s.moving ? 1 : 0
      const frame = (s.moving ? [1, 0, 3, 0][Math.floor(s.dist / STEP) % 4] : c.current.reduced ? 0 : s.idle) % cols
      sp.setAttribute('viewBox', `${frame * fw} ${row * fh} ${fw} ${fh}`)
      s.el.querySelector('[data-flip]')?.setAttribute('transform', s.face === 'right' && !vertical ? 'scale(-1 1)' : '')
    }
    // draw in front of or behind the player depending on who is nearer the screen
    const ch = c.current.walker.charEl()
    if (ch && ch.parentNode && s.el.parentNode === ch.parentNode) {
      const front = s.y > c.current.walker.y()
      const after = ch.nextSibling === s.el
      if (front && !after) ch.parentNode.insertBefore(s.el, ch.nextSibling)
      else if (!front && ch.previousSibling !== s.el) ch.parentNode.insertBefore(s.el, ch)
    }
  }, [])

  const ensureFree = useCallback(() => {
    const s = st.current
    s.x = Math.max(24, Math.min(c.current.worldW - 24, s.x))
    if (free(s.x, s.y)) return
    for (let r = 6; r < 600; r += 6) for (let a = 0; a < 16; a++) {
      const x = s.x + Math.cos((a / 16) * Math.PI * 2) * r, y = s.y + Math.sin((a / 16) * Math.PI * 2) * r * 0.6
      if (free(x, y)) { s.x = x; s.y = y; return }
    }
  }, [])

  const stop = () => { const s = st.current; if (s.raf) { cancelAnimationFrame(s.raf); s.raf = 0 } }

  const beside = useCallback(() => {
    const s = st.current, p = c.current.walker.state()
    const [ox, oy] = BEHIND[p.dir] ?? BEHIND.left
    s.x = p.x + ox; s.y = p.y + oy; s.stuck = 0; s.moving = false
    ensureFree()
  }, [ensureFree])

  const frame = useCallback((t: number) => {
    const s = st.current, cf = c.current
    const dt = Math.min(0.05, (t - s.last) / 1000 || 0.016)
    s.last = t
    s.moving = false
    if (cf.active && cf.mode === 'follow' && !cf.editing) {
      const p = cf.walker.state()
      const [ox, oy] = BEHIND[p.dir] ?? BEHIND.left
      const tx = p.x + ox, ty = Math.max(300, p.y + oy + s.detour)
      const dx = tx - s.x, dy = ty - s.y, d = Math.hypot(dx, dy)
      if (d > 14) {
        const sp = Math.max(70, Math.min(250, 60 + d * 1.8)) * dt // smooth: slows down as it arrives, hurries when far behind
        const mx = (dx / d) * sp, my = (dy / d) * sp
        let moved = 0
        if (Math.abs(mx) > 0.01 && free(s.x + mx, s.y)) { s.x += mx; moved += Math.abs(mx) }
        if (Math.abs(my) > 0.01 && free(s.x, s.y + my)) { s.y += my; moved += Math.abs(my) }
        if (moved > 0.05) { s.moving = true; s.dist += moved; s.stuck = 0; if (Math.abs(dx) >= Math.abs(dy) * 0.6) s.face = dx > 0 ? 'right' : 'left'; else s.face = dy > 0 ? 'down' : 'up' }
        else {
          s.stuck += dt
          if (s.stuck > 0.5 && !s.detour) s.detour = (Math.random() < 0.5 ? -1 : 1) * 40 // try going round
          if (s.stuck > 2.4) { beside() } // truly stuck: hop to the player's side instead of staying behind a wall
        }
        if (d > 520) beside() // far behind (e.g. after a long run): catch up
      } else { s.detour = 0; s.stuck = 0 }
    }
    apply()
    const near = cf.active && cf.mode === 'follow' && !cf.editing
    if (s.moving || near) { if (near && !s.moving && s.stuck === 0) { s.raf = 0; return } s.raf = requestAnimationFrame(frame) } else s.raf = 0
  }, [apply, beside])

  const kick = useCallback(() => { const s = st.current; if (!s.raf) { s.last = performance.now(); s.raf = requestAnimationFrame(frame) } }, [frame])

  // wake up whenever the player moves, or jumps to another room
  useEffect(() => cfg.walker.subscribe((ev) => {
    const cf = c.current
    if (!cf.active || cf.mode !== 'follow' || cf.editing) return
    if (ev === 'place') { beside(); apply() }
    kick()
  }), [cfg.walker, kick, beside, apply])

  // idle: stand at home. follow: start beside the player. Called when pet / mode / home / room layout changes.
  useEffect(() => {
    const s = st.current
    if (!cfg.active) return
    if (cfg.mode === 'idle' || cfg.editing) {
      if (cfg.mode === 'idle') { s.x = cfg.home.x; s.y = cfg.home.y }
      s.moving = false
      ensureFree()
    } else if (!s.placed) beside()
    s.placed = true
    apply(); kick()
  }, [cfg.active, cfg.mode, cfg.editing, cfg.home.x, cfg.home.y, cfg.worldW, cfg.blocks, cfg.collision, ensureFree, beside, apply, kick])

  // the idle animation: a slow 4-frame loop only while the pet is standing, the tab is visible and motion is allowed
  useEffect(() => {
    if (!cfg.active || cfg.reduced) return
    const t = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || st.current.moving) return
      st.current.idle = (st.current.idle + 1) % 4
      apply()
    }, 420)
    return () => window.clearInterval(t)
  }, [cfg.active, cfg.reduced, apply])

  useEffect(() => () => stop(), [])

  return useMemo(() => ({
    bind(el: SVGGElement | null) { st.current.el = el; if (el) { apply(); } },
    where: () => ({ x: st.current.x, y: st.current.y }),
    /** used while dragging the pet in editing mode */
    setPos(x: number, y: number) { const s = st.current; s.x = Math.max(24, Math.min(c.current.worldW - 24, x)); s.y = Math.max(330, Math.min(510, y)); apply() },
    refresh() { apply() },
  }), [apply])
}
