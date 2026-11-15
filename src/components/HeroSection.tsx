import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useScroll } from 'motion/react'
import { Heart, Sparkles } from 'lucide-react'
import * as Matter from 'matter-js'
import { useSite } from '../context/SiteContext'
import { useReducedMotion } from '../lib/a11y'
import { publicUrl } from '../lib/storage'
import { fmtDate } from '../lib/time'
import type { Media } from '../lib/types'
import { DigitalClock } from './DigitalClock'
import { Reveal } from './Reveal'
import { Spinner, ErrorBox, SafeImage } from './ui'

// ─── Floating Photo Gallery ──────────────────────────────────────────────

interface PhotoConfig {
  w: number
  h: number
  rot: number
  floatDelay: number
  floatSpeed: number
  floatAmp: number
}

const PHOTO_CONFIGS: PhotoConfig[] = [
  { w: 110, h: 150, rot: -4, floatDelay: 0,    floatSpeed: 4,   floatAmp: 4 },
  { w: 170, h: 130, rot: 2,   floatDelay: 0.6, floatSpeed: 5,   floatAmp: 3 },
  { w: 190, h: 120, rot: 1,   floatDelay: 1.2, floatSpeed: 4.5, floatAmp: 4 },
  { w: 100, h: 150, rot: -3,  floatDelay: 1.8, floatSpeed: 5.5, floatAmp: 5 },
  { w: 140, h: 170, rot: -2,  floatDelay: 2.4, floatSpeed: 4.2, floatAmp: 3 },
  { w: 160, h: 110, rot: 3,   floatDelay: 3.0, floatSpeed: 5,   floatAmp: 4 },
]

function FloatingPhotoCard({ config, img, index, visible, className }: {
  config: PhotoConfig
  img: Media | null
  index: number
  visible: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  const entry = 0.8 + index * 0.15

  if (reduced || !visible) {
    return (
      <div
        className={`overflow-hidden rounded-2xl shadow-lg ${className || ''}`}
        style={{ width: config.w, height: config.h, transform: `rotate(${config.rot}deg)` }}
      >
        {img ? (
          <SafeImage src={publicUrl(img.storage_path)} alt={img.caption || ''} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blush-200/60 to-lilac-200/60 dark:from-night-700 dark:to-night-600">
            <Heart className="h-5 w-5 text-blush-300/60 dark:text-blush-400/40" />
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82, y: 24, x: -30 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={{ delay: entry, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl shadow-lg cursor-pointer group transition-shadow hover:shadow-xl ${className || ''}`}
      style={{ width: config.w, height: config.h, transform: `rotate(${config.rot}deg)` }}
    >
      {/* Continuous independent float */}
      <motion.div
        animate={{ y: [0, -config.floatAmp, 0] }}
        transition={{
          duration: config.floatSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: config.floatDelay,
        }}
        className="h-full w-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {img ? (
          <SafeImage src={publicUrl(img.storage_path)} alt={img.caption || ''} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blush-200/60 to-lilac-200/60 dark:from-night-700 dark:to-night-600">
            <Heart className="h-5 w-5 text-blush-300/60 dark:text-blush-400/40" />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Ragdoll ID Badge (Matter.js) ─────────────────────────────────────────

function RagdollID({ enabled, idCardPath, lanyardColor, swingIntensity }: {
  enabled: boolean
  idCardPath?: string | null
  lanyardColor?: string
  swingIntensity?: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const badgeRef = useRef<Matter.Body | null>(null)
  const pointsRef = useRef<Matter.Body[]>([])
  const imgRef = useRef<HTMLImageElement | null>(null)
  const mouseRef = useRef<{ x: number; y: number; isDown: boolean }>({ x: 0, y: 0, isDown: false })
  const animFrameRef = useRef<number>(0)
  const reduced = useReducedMotion()

  const lanyardClr = lanyardColor ?? '#8b5cf6'
  const intensity = swingIntensity ?? 1.0

  useEffect(() => {
    if (!enabled || reduced || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const anchorX = W / 2
    const anchorY = 2

    // Preload image
    if (idCardPath) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = publicUrl(idCardPath)
      imgRef.current = img
    }

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.0 * intensity } })
    const ground = Matter.Bodies.rectangle(W / 2, H + 40, W, 80, { isStatic: true })
    Matter.World.add(engine.world, ground)

    const segments = 18
    const segLen = 12
    const pts: Matter.Body[] = []
    const pins = Matter.Bodies.circle(anchorX, anchorY, 3, { isStatic: true, friction: 0 })
    Matter.World.add(engine.world, pins)
    pts.push(pins)

    for (let i = 1; i <= segments; i++) {
      const p = Matter.Bodies.circle(
        anchorX + (i % 2 === 0 ? 1.5 : -1.5),
        anchorY + i * segLen,
        2,
        { friction: 0.3, density: 0.008 }
      )
      Matter.World.add(engine.world, p)
      pts.push(p)
      if (i > 1) {
        Matter.World.add(engine.world, Matter.Constraint.create({
          bodyA: pts[i - 2],
          bodyB: p,
          length: segLen,
          stiffness: 0.85,
          damping: 0.08,
        }))
      }
    }
    pointsRef.current = pts

    const bw = 110
    const bh = 150
    const badge = Matter.Bodies.rectangle(anchorX, anchorY + segments * segLen + bh / 2 + 4, bw, bh, {
      density: 0.003,
      frictionAir: 0.015,
      restitution: 0.2,
      chamfer: { radius: 8 },
    })
    Matter.World.add(engine.world, badge)
    badgeRef.current = badge
    Matter.World.add(engine.world, Matter.Constraint.create({
      bodyA: pts[pts.length - 1],
      bodyB: badge,
      pointA: { x: 0, y: -(bh / 2 + 4) },
      length: 6,
      stiffness: 0.5,
      damping: 0.05,
    }))

    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      mouseRef.current.x = e.clientX - r.left
      mouseRef.current.y = e.clientY - r.top
      if (mouseRef.current.isDown && badge) {
        Matter.Body.applyForce(badge, badge.position, { x: (e.movementX ?? 0) * 0.003, y: (e.movementY ?? 0) * 0.003 })
      }
    }
    const onMouseDown = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top
      if (badge && Math.hypot(mx - badge.position.x, my - badge.position.y) < 70) {
        mouseRef.current.isDown = true
        Matter.Body.applyForce(badge, badge.position, { x: (mx - badge.position.x) * 0.001, y: (my - badge.position.y) * 0.001 })
      }
    }
    const onMouseUp = () => { mouseRef.current.isDown = false }
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    canvas.style.cursor = 'grab'

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render)
      Matter.Engine.update(engine, 1000 / 60)
      ctx.clearRect(0, 0, W, H)

      // Lanyard chain - thicker for larger scale
      ctx.strokeStyle = lanyardClr
      ctx.lineWidth = 3.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(pts[0].position.x, pts[0].position.y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].position.x, pts[i].position.y)
      ctx.stroke()

      // Clip ring - larger
      const lastPt = pts[pts.length - 1]
      ctx.fillStyle = '#6b7280'
      ctx.beginPath()
      ctx.arc(lastPt.position.x, lastPt.position.y, 6, 0, Math.PI * 2)
      ctx.fill()

      // Badge
      if (badge) {
        const { x, y } = badge.position
        const angle = badge.angle
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.25)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetY = 8

        // Card body gradient
        const grad = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2)
        grad.addColorStop(0, '#ffffff')
        grad.addColorStop(1, '#f1f5f9')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 14)
        ctx.fill()

        ctx.shadowColor = 'transparent'

        // Border
        ctx.strokeStyle = 'rgba(0,0,0,0.08)'
        ctx.lineWidth = 1.5
        ctx.strokeRect(-bw / 2 + 1, -bh / 2 + 1, bw - 2, bh - 2)

        // Top hole - larger
        ctx.fillStyle = '#cbd5e1'
        ctx.beginPath()
        ctx.arc(0, -bh / 2 + 18, 7, 0, Math.PI * 2)
        ctx.fill()

        // Uploaded image
        const img = imgRef.current
        if (img && img.complete && img.naturalWidth > 0) {
          const ix = -bw / 2 + 12
          const iy = -bh / 2 + 34
          const iw = bw - 24
          const ih = bh - 48
          ctx.save()
          ctx.beginPath()
          ctx.roundRect(ix, iy, iw, ih, 6)
          ctx.clip()
          // Cover-fit the image inside the card
          const scale = Math.max(iw / img.naturalWidth, ih / img.naturalHeight)
          const dw = img.naturalWidth * scale
          const dh = img.naturalHeight * scale
          ctx.drawImage(img, ix + (iw - dw) / 2, iy + (ih - dh) / 2, dw, dh)
          ctx.restore()
        } else {
          // Fallback: placeholder illustration
          ctx.fillStyle = '#e2e8f0'
          ctx.fillRect(-bw / 2 + 12, -bh / 2 + 34, bw - 24, 70)
          ctx.fillStyle = '#94a3b8'
          ctx.font = 'bold 11px Inter, system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('PORTFOLIO', 0, -bh / 2 + 72)
          ctx.font = '9px Inter, system-ui, sans-serif'
          ctx.fillStyle = '#cbd5e1'
          ctx.fillText('CREATIVE STUDIO', 0, -bh / 2 + 90)
        }

        // Bottom strip
        ctx.fillStyle = lanyardClr
        ctx.globalAlpha = 0.15
        ctx.fillRect(-bw / 2 + 12, bh / 2 - 24, bw - 24, 14)
        ctx.globalAlpha = 1

        // Hello text
        ctx.fillStyle = '#334155'
        ctx.font = 'bold 12px Inter, system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('HELLO!', 0, bh / 2 - 12)

        ctx.restore()
      }

      // Mount dot
      ctx.fillStyle = '#94a3b8'
      ctx.beginPath()
      ctx.arc(anchorX, anchorY + 2, 4, 0, Math.PI * 2)
      ctx.fill()
    }
    render()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      Matter.Engine.clear(engine)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mouseup', onMouseUp)
      canvas.removeEventListener('mouseleave', onMouseUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reduced, idCardPath, lanyardClr, intensity])

  if (reduced) {
    return (
      <div className="relative w-[130px] h-[300px] flex flex-col items-center pt-1">
        <div className="w-0.5 h-20 bg-stone-400/60 dark:bg-stone-500/60" />
        <div className="mt-1 w-[110px] h-[150px] rounded-2xl bg-white border border-stone-200 shadow-lg flex flex-col items-center justify-center p-2 select-none">
          {idCardPath ? (
            <img src={publicUrl(idCardPath)} alt="ID card" className="w-full h-full object-cover rounded-lg" />
          ) : (
            <>
              <span className="text-[10px] font-bold text-slate-700 tracking-wide">PORTFOLIO</span>
              <span className="text-[8px] text-slate-400 mt-0.5">CREATIVE STUDIO</span>
              <div className="w-full h-px bg-stone-200 my-1" />
              <span className="text-[8px] text-slate-600 font-semibold">HELLO!</span>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-[130px] h-[300px] shrink-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ touchAction: 'none' }} />
    </div>
  )

}

// ─── Mobile ID Badge (CSS-only fallback, no physics) ───────────────────────

function MobileIDBadge({ idCardPath, lanyardColor, swingIntensity }: {
  idCardPath?: string | null
  lanyardColor?: string
  swingIntensity?: number
}) {
  const reduced = useReducedMotion()
  const intensity = swingIntensity ?? 1.0
  const lanyardClr = lanyardColor ?? '#8b5cf6'

  return (
    <div className="relative flex flex-col items-center" style={{ width: '130px', height: '300px' }}>
      {/* Lanyard - SVG path that swings with CSS */}
      <svg
        className={`w-1.5 h-[260px] transform-origin-top-center ${reduced ? '' : 'animate-swing'}`}
        viewBox="0 0 15 260"
        style={{
          transformOrigin: '7.5px 0',
          animationDuration: `${2000 / intensity}ms`,
        }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="lanyardGrad" x1="0" y1="0" x2="15" y2="0">
            <stop offset="0%" stopColor={lanyardClr} stopOpacity="0.9" />
            <stop offset="50%" stopColor={lanyardClr} stopOpacity="0.6" />
            <stop offset="100%" stopColor={lanyardClr} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Lanyard strap */}
        <path
          d="M7.5,0 C7.5,0 7.5,90 7.5,90 C7.5,90 7.5,180 7.5,180 C7.5,180 7.5,240 7.5,240"
          stroke="url(#lanyardGrad)"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Metal clip at top */}
        <rect x="4" y="0" width="7" height="12" rx="1.5" fill="#6b7280" />
        {/* Connection ring */}
        <circle cx="7.5" cy="240" r="6" fill="#6b7280" />
      </svg>

      {/* ID Badge - swings with the lanyard */}
      <div
        className={`relative w-[110px] h-[150px] rounded-2xl shadow-lg flex flex-col items-center justify-start p-2 select-none ${reduced ? '' : 'animate-swing'}`}
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          transformOrigin: '55px -245px',
          animationDuration: `${2000 / intensity}ms`,
        }}
      >
        {/* Top hole */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-stone-300" />

        {/* Uploaded image or placeholder */}
        <div className="relative w-full h-[92px] rounded-lg overflow-hidden">
          {idCardPath ? (
            <img
              src={publicUrl(idCardPath)}
              alt="ID card photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100">
              <span className="text-[10px] font-bold text-slate-700 tracking-wide">PORTFOLIO</span>
              <span className="text-[8px] text-slate-400 mt-0.5">CREATIVE STUDIO</span>
            </div>
          )}
        </div>

        {/* Bottom strip */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[86px] h-3.5 rounded-b-lg"
          style={{ backgroundColor: lanyardClr, opacity: 0.15 }} />

        {/* Hello text */}
        <span className="text-[9px] font-semibold text-slate-700">HELLO!</span>
      </div>


    </div>
  )
}

// ─── Memory Conveyor — Continuous Scrolling Photo Gallery ──────────────
// ─── Memory Conveyor — Infinite Downward Scrolling Gallery ──────────────
// Maintains a shuffled rotation queue of all unique photos; no repeats until exhausted.
// Each card uses CSS aspect-ratio to preserve original photo shape (no stretch).
// Three stacked identical copies of the batch enable a seamless CSS-only loop
// (translation jumps from -2/3 height back to 0 — invisible because content is identical).
// Between cycles the whole pool is reshuffled and re-picked, giving fresh unique photos.

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function MemoryConveyor({ images, config }: {
  images: Media[]
  config: PhotoConfig[]
}) {
  const reduced = useReducedMotion()
  const [batch, setBatch] = useState<Media[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastTickRef = useRef<number>(0)

  // Seed initial batch of 6 unique photos
  useEffect(() => {
    if (!images.length) return
    setBatch(shuffle(images).slice(0, 6))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images])

  // After 2 full cycles (16 s) replace the batch with a fresh shuffle of ALL images.
  // This gives a new set of 6 every time the loop completes, maximizing variety.
  useEffect(() => {
    if (reduced || !images.length) return
    const tick = 16_000 // 2 cycles × 8s each
    intervalRef.current = setInterval(() => {
      // Only advance if the batch hasn't changed (avoids double-firing on strict mode)
      if (Date.now() - lastTickRef.current > tick) {
        lastTickRef.current = Date.now()
        setBatch(prev => {
          // Don't swap if batch already contains all images — stay until pool shrinks
          const curIds = new Set(prev.map(m => m.id))
          const allIds = new Set(images.map(m => m.id))
          if (curIds.size >= allIds.size) return prev // already showed everything
          return shuffle(images).slice(0, 6)
        })
      }
    }, 2000) // poll every 2s to find the 16s mark
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, reduced])

  if (reduced || !images.length || batch.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-1 sm:gap-1 lg:gap-1.5 max-w-[360px]" style={{ width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' }}>
        {config.map((cfg, i) => (
          <FloatingPhotoCard
            key={`static-${i}`}
            config={cfg}
            img={images[i % images.length] ?? null}
            index={i}
            visible={true}
            className="overflow-hidden rounded-2xl shadow-md"
          />
        ))}
      </div>
    )
  }

  // 3 identical copies → CSS animates yPercent 0→100, instant snap-back is invisible
  const tripled = [...batch, ...batch, ...batch]

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: 380 }}>
      <div
        className="grid grid-cols-2 gap-1 sm:gap-1 lg:gap-1.5 max-w-[360px]"
        style={{
          width: 'fit-content',
          marginLeft: 'auto',
          marginRight: 'auto',
          animation: 'memory-conveyor 8s linear infinite',
        }}
      >
        {tripled.map((img, i) => {
          const cfg = config[i % config.length]
          return (
            <div
              key={`${img?.id ?? 'empty'}-${i}`}
              className="overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-shadow"
              style={{ width: cfg.w, height: cfg.h }}
            >
              {img ? (
                <SafeImage
                  src={publicUrl(img.storage_path)}
                  alt={img.caption || ''}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blush-200/60 to-lilac-200/60 dark:from-night-700 dark:to-night-600">
                  <Heart className="h-5 w-5 text-blush-300/60 dark:text-blush-400/40" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── LED Scrolling Marquee (compact, centered) ────────────────────────────

const LED_MESSAGES = [
  'OUR LITTLE PORTFOLIO  ★  ',
  'MEMORIES WE KEEP  ♡  ',
  'EVERY MOMENT MATTERS  ✦  ',
  'OUR STORY CONTINUES  ♥  ',
]

function LEDMarquee() {
  const reduced = useReducedMotion()
  const combined = [...LED_MESSAGES, ...LED_MESSAGES].join('')

  if (reduced) {
    return (
      <div className="bg-neutral-900 py-2.5 px-4 max-w-3xl mx-auto overflow-hidden rounded-lg">
        <p className="text-green-400 font-mono text-xs tracking-widest whitespace-nowrap opacity-80">
          {LED_MESSAGES.join('★')}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-900 py-2.5 overflow-hidden relative">
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-green-500/25" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-green-500/25" />
      <div className="max-w-3xl mx-auto overflow-hidden px-4">
        <div className="flex whitespace-nowrap" style={{ animation: 'led-scroll 28s linear infinite' }}>
          {combined.split('').map((ch, i) => (
            <span
              key={i}
              className={`inline-block ${ch === ' ' ? 'w-[8px]' : ''} ${['★', '♡', '✦', '♥'].includes(ch) ? 'text-yellow-400 mx-0.5' : 'text-green-400'} font-mono text-xs tracking-wider`}
              style={{ textShadow: '0 0 5px rgba(74,222,128,0.5)' }}
            >
              {ch === ' ' ? ' ' : ch}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Animated Nav Cards (slide right) ──────────────────────────────────────

function AnimatedNavCards() {
  return (
    <section aria-label="Explore sections" className="py-4">
      {/* "Explore our world" heading only — no "what would you like" subtitle */}
      <Reveal dir="right">
        <div className="mb-6 lg:mb-8">
          <p className="font-script text-xl sm:text-2xl text-blue-400 dark:text-blue-300 mb-1">Explore our world</p>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {NAV_ITEMS.map((item, i) => (
          <Reveal key={item.to} delay={i * 0.08} dir="right">
            <Link
              to={item.to}
              className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10 ${
                item.span === 'wide' ? 'col-span-2' : item.span === 'tall' ? 'row-span-2 min-h-[200px]' : 'min-h-[140px]'
              }`}
            >
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-semibold text-stone-100">{item.label}</h3>
              <p className="mt-0.5 text-xs text-stone-400">{item.subtitle}</p>
              <div className="mt-auto pt-3">
                <span className="text-xs text-stone-500 group-hover:text-blue-400 transition-colors flex items-center gap-1">
                  Discover
                  <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 9H4a1 1 0 110-2h8.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

// Simple icon components
function IconImage(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
}
function IconUsers(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function IconClock(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function IconListChecks(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
}
function IconMail(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><rect x="2" y="2" width="20" height="20" rx="2"/></svg>
}
function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20"/><path d="M4 20V8l8-5 8 5v12"/><path d="M9 20v-5h6v5"/></svg>
}
function IconMapPin(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
}

const NAV_ITEMS = [
  { to: '/memories', label: 'Memories',         icon: IconImage,   subtitle: 'Every photo & video', color: 'from-rose-400 to-pink-500', span: 'wide' as const },
  { to: '/us',       label: 'Biographies',       icon: IconUsers,   subtitle: 'Who we are',          color: 'from-amber-400 to-orange-500' },
  { to: '/story',    label: 'Timeline',          icon: IconClock,   subtitle: 'Moment by moment',    color: 'from-purple-400 to-violet-500' },
  { to: '/bucket-list', label: 'Bucket List',    icon: IconListChecks, subtitle: 'Dreams to tick off', color: 'from-emerald-400 to-teal-500' },
  { to: '/love-wheel', label: 'Love Wheel',      icon: Sparkles,    subtitle: 'Spin a sweet surprise', color: 'from-pink-400 to-fuchsia-500', span: 'tall' as const },
  { to: '/letters',  label: 'Letters',           icon: IconMail,    subtitle: 'Words for later',     color: 'from-blue-400 to-indigo-500' },
  { to: '/little-room', label: 'Little Room',    icon: IconHome,    subtitle: 'A private space',     color: 'from-violet-400 to-purple-500' },
  { to: '/memory-map', label: 'Memory Map',      icon: IconMapPin,  subtitle: 'Places we share',     color: 'from-cyan-400 to-sky-500' },
]

// ─── Digital Clock Rising from Below ───────────────────────────────────────

function DigitalClockRise({ since }: { since: string }) {
  return (
    <Reveal dir="up">
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <DigitalClock since={since} caption="Together since" />
      </motion.div>
    </Reveal>
  )
}

// ─── Main Hero Section ────────────────────────────────────────────────────

export default function HeroSection() {
  const { settings, media, loading, error } = useSite()
  const loc = useLocation()
  const [mounted, setMounted] = useState(false)
  const [images, setImages] = useState<Media[]>([])

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    setImages(media.filter(m => m.kind === 'image'))
  }, [media])

  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start end', 'end start'],
  })

  const photoConfigs = useMemo(() => {
    const shuffled = [...images].sort(() => Math.random() - 0.5).slice(0, 6)
    return PHOTO_CONFIGS.map((cfg, i) => ({
      ...cfg,
      img: shuffled[i] || null,
    }))
  }, [images])

  // Read ID card config from settings.theme (stored alongside theme data)
  const idCardPath = settings?.theme?.id_card_path as string | null | undefined ?? null
  const lanyardColor = settings?.theme?.lanyard_color as string | undefined
  const swingIntensity = settings?.theme?.swing_intensity as number | undefined ?? 1
  const restingRotation = settings?.theme?.resting_rotation as number | undefined ?? 0

  if (loading && !settings) return <Spinner />
  if (error) return <ErrorBox message={error} />
  if (!settings) return <ErrorBox message="Site settings not found." />

  const featuredImg = images[0] || null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={loc.pathname === '/' ? 'home' : 'other'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* ─── HERO SCENE 1 ─────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden px-4 pb-4 pt-6 md:pt-8"
          aria-label="Opening hero composition"
        >
          <FloatingDecor />

          {/* HERO COMPOSITION — Title top-left, photos below, ragdoll right */}
          <div className="relative z-10 flex w-full max-w-[560px] flex-col gap-5 lg:flex-row lg:items-start">

            {/* LEFT — Title (top-left) + Photos grid below */}
            <div className="w-full">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : -12 }}
                transition={{ delay: 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <h1
                  className="text-xs font-bold tracking-[0.22em] uppercase text-stone-800 dark:text-stone-100"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  OUR LITTLE{' '}
                  <span className="text-blue-400 inline-flex items-center gap-0.5">
                    PORTFOLIO
                    <Heart className="h-2.5 w-2.5 ml-0.5 fill-blue-400 animate-heartbeat" aria-hidden="true" />
                  </span>
                </h1>
                <p className="mt-1 h-script text-sm text-blush-500 dark:text-blush-400">
                  Koiii <span className="text-stone-400">&</span> Mai
                </p>
              </motion.div>
              <MemoryConveyor images={images} config={photoConfigs} />
            </div>

            {/* RIGHT — Ragdoll ID */}
            <div className="hidden lg:flex shrink-0 items-start justify-center lg:ml-auto lg:max-w-[130px]">
              <RagdollID
                enabled={mounted}
                idCardPath={idCardPath}
                lanyardColor={lanyardColor}
                swingIntensity={swingIntensity}
              />
            </div>

            {/* Mobile fallback: simple CSS-swinging ID badge (no physics) */}
            <div className="lg:hidden flex justify-center mt-4">
              <MobileIDBadge
                idCardPath={idCardPath}
                lanyardColor={lanyardColor}
                swingIntensity={swingIntensity}
              />
            </div>
          </div>

          {/* Scene transition overlay */}
          <ScrollTransitionLayer scrollProgress={heroScroll.get()} />
        </section>

        {/* ─── LED MARQUEE (compact, between hero and nav) ──────────── */}
        <div className="relative z-10 border-y border-white/10">
          <LEDMarquee />
        </div>

        {/* ─── SCENE 2: Navigation Cards + Digital Clock ─────────── */}
        <section className="py-14 px-4 bg-black/20 dark:bg-transparent">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">

              {/* LEFT: Navigation cards sliding toward right */}
              <div className="order-2 lg:order-1">
                <AnimatedNavCards />
              </div>

              {/* RIGHT: Digital clock rising from below */}
              <div className="order-1 lg:order-2 lg:sticky lg:top-24">
                <DigitalClockRise since={settings.anniversary} />
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURED MEMORY (existing preserved section) ───────── */}
        {featuredImg && (
          <section className="pb-16 px-4">
            <Reveal>
              <div className="text-center mb-10">
                <p className="h-script text-2xl">A moment we love</p>
              </div>
            </Reveal>
            <motion.figure
              className="mx-auto max-w-2xl tape relative rounded-3xl bg-white p-3 pb-6 shadow-dreamy dark:bg-night-800"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.9 }}
            >
              <SafeImage
                src={publicUrl(featuredImg.storage_path)}
                alt={featuredImg.caption || 'A memory'}
                className="rounded-2xl"
                imgClassName="max-h-[32rem]"
              />
              <figcaption className="mt-4 px-3 text-center">
                <p className="font-display text-lg">{featuredImg.caption || 'Untitled memory'}</p>
                <p className="text-sm text-stone-500">{fmtDate(featuredImg.taken_at)}</p>
              </figcaption>
            </motion.figure>
          </section>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Scroll Transition Layer ──────────────────────────────────────────────

function ScrollTransitionLayer({ scrollProgress }: { scrollProgress: number }) {
  return (
    <motion.div
      style={{
        opacity: Math.max(0, 1 - scrollProgress * 2),
        y: -scrollProgress * 40,
      }}
      className="pointer-events-none absolute inset-0"
    />
  )
}

// ─── Floating Decorations ─────────────────────────────────────────────────

const FLOAT_DECORATIONS = ['♡', '✦', '❋', '✿', '°', '·']

function FloatingDecor() {
  const reduced = useReducedMotion()
  const items = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      char: FLOAT_DECORATIONS[i % FLOAT_DECORATIONS.length],
      left: `${10 + (i * 12) % 80}%`,
      top: `${5 + (i * 7) % 60}%`,
      delay: i * 0.4,
      size: 12 + (i % 3) * 4,
      opacity: 0.2 + (i % 4) * 0.1,
    })), [])

  if (reduced) return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      {items.map((d, i) => (
        <motion.span
          key={i}
          className="absolute text-blush-400/40 dark:text-blush-300/30"
          style={{ left: d.left, top: d.top, fontSize: d.size }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [d.opacity, d.opacity * 1.5, d.opacity],
            y: [-8, 8, -8],
            rotate: [-5, 5, -5],
          }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, delay: d.delay }}
        >
          {d.char}
        </motion.span>
      ))}
    </div>
  )
}
