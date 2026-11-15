/**
 * Canvas particle engines for the animated backgrounds. One <canvas>, one requestAnimationFrame
 * loop, no dependencies. Each engine draws with ctx in CSS pixels.
 */
import type { EffectKind } from './appearance'

export interface FxParams {
  kind: EffectKind
  speed: number
  density: number
  opacity: number
  intensity: number
  /** global animation-intensity multiplier (subtle .5 … dreamy 1.6) */
  factor: number
  dark: boolean
  low: boolean
  /** accent palette as "r g b" strings */
  b200: string
  b300: string
  b400: string
}

export interface Engine { resize: (w: number, h: number) => void; frame: (dt: number, t: number) => void }

const TAU = Math.PI * 2
const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const rgb = (s: string, a: number) => `rgba(${s.split(' ').join(',')},${a})`

function count(base: number, w: number, h: number, p: FxParams) {
  const area = Math.min(1.5, Math.max(0.4, (w * h) / (1280 * 720)))
  const n = Math.round(base * p.density * p.factor * area * (p.low ? 0.5 : 1))
  return Math.max(0, Math.min(p.low ? 90 : 180, n))
}

export function createEngine(ctx: CanvasRenderingContext2D, w0: number, h0: number, p: FxParams): Engine {
  let w = w0, h = h0
  switch (p.kind) {
    case 'rain': return rain(ctx, () => [w, h], (a, b) => { w = a; h = b }, p)
    case 'snow': return snow(ctx, () => [w, h], (a, b) => { w = a; h = b }, p)
    case 'petals': return petals(ctx, () => [w, h], (a, b) => { w = a; h = b }, p)
    case 'stars': return stars(ctx, () => [w, h], (a, b) => { w = a; h = b }, p)
    case 'fireflies': return fireflies(ctx, () => [w, h], (a, b) => { w = a; h = b }, p)
    case 'waves': return waves(ctx, () => [w, h], (a, b) => { w = a; h = b }, p)
    default: return { resize() {}, frame() {} }
  }
}

type Size = () => [number, number]
type SetSize = (w: number, h: number) => void

function rain(ctx: CanvasRenderingContext2D, size: Size, set: SetSize, p: FxParams): Engine {
  type Drop = { x: number; y: number; len: number; v: number; a: number }
  let drops: Drop[] = []
  const build = () => {
    const [w, h] = size()
    drops = Array.from({ length: count(95, w, h, p) }, () => ({ x: rnd(-40, w + 40), y: rnd(0, h), len: rnd(10, 24) * p.intensity, v: rnd(480, 820), a: rnd(0.25, 0.8) }))
  }
  build()
  const color = p.dark ? '185,210,255' : '88,135,200'
  return {
    resize(w, h) { set(w, h); build() },
    frame(dt) {
      const [w, h] = size()
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 1 + 0.4 * (p.intensity - 1)
      ctx.lineCap = 'round'
      const wind = 0.16
      for (const d of drops) {
        d.y += d.v * dt
        d.x += d.v * wind * dt
        if (d.y - d.len > h) { d.y = -d.len; d.x = rnd(-40, w + 40) }
        ctx.strokeStyle = `rgba(${color},${d.a * p.opacity})`
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.len * wind, d.y - d.len)
        ctx.stroke()
      }
    },
  }
}

function snow(ctx: CanvasRenderingContext2D, size: Size, set: SetSize, p: FxParams): Engine {
  type Flake = { x: number; y: number; r: number; v: number; ph: number; sw: number; a: number }
  let flakes: Flake[] = []
  const build = () => {
    const [w, h] = size()
    flakes = Array.from({ length: count(90, w, h, p) }, () => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(1.2, 4.2) * p.intensity, v: rnd(18, 58), ph: rnd(0, TAU), sw: rnd(0.4, 1.2), a: rnd(0.45, 1) }))
  }
  build()
  const color = p.dark ? '255,255,255' : '150,185,228'
  return {
    resize(w, h) { set(w, h); build() },
    frame(dt, t) {
      const [w, h] = size()
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.v * dt
        f.x += Math.sin(t * f.sw + f.ph) * 22 * dt
        if (f.y - f.r > h) { f.y = -f.r; f.x = rnd(0, w) }
        if (f.x < -10) f.x = w + 10
        if (f.x > w + 10) f.x = -10
        ctx.fillStyle = `rgba(${color},${f.a * p.opacity})`
        ctx.beginPath()
        ctx.arc(f.x, f.y, f.r, 0, TAU)
        ctx.fill()
      }
    },
  }
}

function petals(ctx: CanvasRenderingContext2D, size: Size, set: SetSize, p: FxParams): Engine {
  type Petal = { x: number; y: number; s: number; rot: number; vr: number; v: number; ph: number; sw: number; flip: number; c: number }
  let list: Petal[] = []
  const cols = [p.b200, p.b300, p.b400]
  const build = () => {
    const [w, h] = size()
    list = Array.from({ length: count(30, w, h, p) }, () => ({ x: rnd(0, w), y: rnd(-h, h), s: rnd(5, 11) * p.intensity, rot: rnd(0, TAU), vr: rnd(-1.2, 1.2), v: rnd(26, 62), ph: rnd(0, TAU), sw: rnd(0.4, 1), flip: rnd(1, 2.4), c: Math.floor(rnd(0, 3)) }))
  }
  build()
  return {
    resize(w, h) { set(w, h); build() },
    frame(dt, t) {
      const [w, h] = size()
      ctx.clearRect(0, 0, w, h)
      for (const q of list) {
        q.y += q.v * dt
        q.x += (Math.sin(t * q.sw + q.ph) * 38 + 14) * dt
        q.rot += q.vr * dt
        if (q.y - q.s > h) { q.y = -q.s * 2; q.x = rnd(-20, w) }
        if (q.x > w + 20) q.x = -20
        ctx.save()
        ctx.translate(q.x, q.y)
        ctx.rotate(q.rot)
        ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(t * q.flip + q.ph)))
        ctx.fillStyle = rgb(cols[q.c], p.opacity * 0.9)
        const s = q.s
        ctx.beginPath()
        ctx.moveTo(0, s * 0.9)
        ctx.bezierCurveTo(s * 1.1, s * 0.4, s * 0.7, -s * 0.9, 0, -s * 0.55)
        ctx.bezierCurveTo(-s * 0.7, -s * 0.9, -s * 1.1, s * 0.4, 0, s * 0.9)
        ctx.fill()
        ctx.restore()
      }
    },
  }
}

function stars(ctx: CanvasRenderingContext2D, size: Size, set: SetSize, p: FxParams): Engine {
  type Star = { x: number; y: number; r: number; ph: number; sp: number }
  let list: Star[] = []
  let shoot: { x: number; y: number; vx: number; vy: number; life: number } | null = null
  let nextShoot = rnd(3, 7)
  const build = () => {
    const [w, h] = size()
    list = Array.from({ length: count(85, w, h, p) }, () => ({ x: rnd(0, w), y: rnd(0, h), r: rnd(0.6, 2.4) * p.intensity, ph: rnd(0, TAU), sp: rnd(0.8, 2.6) }))
  }
  build()
  const col = p.dark ? '255,248,225' : '232,170,60'
  return {
    resize(w, h) { set(w, h); build() },
    frame(dt, t) {
      const [w, h] = size()
      ctx.clearRect(0, 0, w, h)
      for (const s of list) {
        const a = (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * p.opacity
        ctx.fillStyle = `rgba(${col},${a})`
        if (s.r > 1.7) { // four-point sparkle
          const L = s.r * 2.6
          ctx.beginPath()
          ctx.moveTo(s.x, s.y - L); ctx.quadraticCurveTo(s.x, s.y, s.x + L, s.y)
          ctx.quadraticCurveTo(s.x, s.y, s.x, s.y + L); ctx.quadraticCurveTo(s.x, s.y, s.x - L, s.y)
          ctx.quadraticCurveTo(s.x, s.y, s.x, s.y - L)
          ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill()
        }
      }
      // occasional shooting star
      nextShoot -= dt
      if (!shoot && nextShoot <= 0) {
        const sx = rnd(w * 0.1, w * 0.9), sy = rnd(0, h * 0.4)
        shoot = { x: sx, y: sy, vx: rnd(420, 640) * (Math.random() < 0.5 ? 1 : -1), vy: rnd(200, 320), life: 1 }
        nextShoot = rnd(6, 13) / Math.max(0.5, p.intensity)
      }
      if (shoot) {
        shoot.x += shoot.vx * dt; shoot.y += shoot.vy * dt; shoot.life -= dt * 1.1
        if (shoot.life <= 0 || shoot.x < -100 || shoot.x > w + 100 || shoot.y > h + 100) shoot = null
        else {
          const tail = 90 * p.intensity
          const k = tail / Math.hypot(shoot.vx, shoot.vy)
          const g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * k, shoot.y - shoot.vy * k)
          g.addColorStop(0, `rgba(${col},${Math.min(1, shoot.life) * p.opacity})`)
          g.addColorStop(1, `rgba(${col},0)`)
          ctx.strokeStyle = g; ctx.lineWidth = 1.8; ctx.lineCap = 'round'
          ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x - shoot.vx * k, shoot.y - shoot.vy * k); ctx.stroke()
        }
      }
    },
  }
}

function fireflies(ctx: CanvasRenderingContext2D, size: Size, set: SetSize, p: FxParams): Engine {
  type Fly = { x: number; y: number; vx: number; vy: number; ph: number; sp: number; r: number }
  let list: Fly[] = []
  // pre-render one soft glow sprite; drawing it is far cheaper than a gradient per firefly per frame
  const sprite = document.createElement('canvas')
  sprite.width = sprite.height = 64
  const sg = sprite.getContext('2d')!
  const grad = sg.createRadialGradient(32, 32, 0, 32, 32, 32)
  const core = p.dark ? '255,240,150' : '255,196,60'
  grad.addColorStop(0, `rgba(${core},1)`)
  grad.addColorStop(0.25, `rgba(${core},0.55)`)
  grad.addColorStop(1, `rgba(${core},0)`)
  sg.fillStyle = grad
  sg.fillRect(0, 0, 64, 64)
  const build = () => {
    const [w, h] = size()
    list = Array.from({ length: count(26, w, h, p) }, () => ({ x: rnd(0, w), y: rnd(0, h), vx: rnd(-10, 10), vy: rnd(-8, 8), ph: rnd(0, TAU), sp: rnd(0.35, 0.9), r: rnd(14, 30) * p.intensity }))
  }
  build()
  return {
    resize(w, h) { set(w, h); build() },
    frame(dt, t) {
      const [w, h] = size()
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = p.dark ? 'lighter' : 'source-over'
      for (const f of list) {
        f.vx += rnd(-14, 14) * dt; f.vy += rnd(-12, 12) * dt
        f.vx = Math.max(-16, Math.min(16, f.vx)); f.vy = Math.max(-12, Math.min(12, f.vy))
        f.x += f.vx * dt; f.y += f.vy * dt
        if (f.x < -30) f.x = w + 30
        if (f.x > w + 30) f.x = -30
        if (f.y < -30) f.y = h + 30
        if (f.y > h + 30) f.y = -30
        const s = Math.sin(t * f.sp + f.ph)
        const a = Math.pow(Math.max(0, s), 2) * p.opacity // slow fade in / out
        if (a < 0.01) continue
        ctx.globalAlpha = a
        ctx.drawImage(sprite, f.x - f.r, f.y - f.r, f.r * 2, f.r * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    },
  }
}

function waves(ctx: CanvasRenderingContext2D, size: Size, set: SetSize, p: FxParams): Engine {
  type Bubble = { x: number; y: number; r: number; v: number; ph: number; sw: number }
  let bubbles: Bubble[] = []
  const layers = [
    { base: 0.8, amp: 14, len: 150, spd: 0.5, ph: 0, a: 0.2 },
    { base: 0.86, amp: 12, len: 110, spd: -0.7, ph: 2, a: 0.26 },
    { base: 0.92, amp: 9, len: 80, spd: 0.95, ph: 4, a: 0.34 },
  ]
  const col = p.dark ? '110,170,240' : '90,160,225'
  const build = () => {
    const [w, h] = size()
    bubbles = Array.from({ length: count(18, w, h, p) }, () => ({ x: rnd(0, w), y: rnd(h * 0.6, h), r: rnd(2, 7) * p.intensity, v: rnd(14, 40), ph: rnd(0, TAU), sw: rnd(0.5, 1.4) }))
  }
  build()
  return {
    resize(w, h) { set(w, h); build() },
    frame(dt, t) {
      const [w, h] = size()
      ctx.clearRect(0, 0, w, h)
      for (const L of layers) {
        const amp = L.amp * p.intensity
        const top = h * L.base - amp * 2
        const g = ctx.createLinearGradient(0, top, 0, h)
        g.addColorStop(0, `rgba(${col},${L.a * p.opacity * 1.4})`)
        g.addColorStop(1, `rgba(${col},${L.a * p.opacity * 0.3})`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w + 10; x += 10) {
          const y = h * L.base + Math.sin(x / L.len + t * L.spd + L.ph) * amp + Math.sin(x / (L.len * 0.6) + t * L.spd * 1.3) * amp * 0.4
          ctx.lineTo(x, y)
        }
        ctx.lineTo(w + 10, h)
        ctx.closePath()
        ctx.fill()
      }
      ctx.lineWidth = 1.2
      for (const b of bubbles) {
        b.y -= b.v * dt
        b.x += Math.sin(t * b.sw + b.ph) * 8 * dt
        if (b.y + b.r < h * 0.7) { b.y = h + b.r; b.x = rnd(0, w) }
        ctx.strokeStyle = `rgba(255,255,255,${0.75 * p.opacity})`
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.stroke()
        ctx.fillStyle = `rgba(255,255,255,${0.35 * p.opacity})`
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 0, TAU); ctx.fill()
      }
    },
  }
}
