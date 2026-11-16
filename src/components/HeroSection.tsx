import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useScroll } from 'motion/react'
import { Heart, Sparkles } from 'lucide-react'
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

// ─── Swing ID Badge — large, CSS-only swing, no physics ──────────────────────

function SwingIDBadge({ idCardPath, lanyardColor, swingIntensity }: {
  idCardPath?: string | null
  lanyardColor?: string
  swingIntensity?: number
}) {
  const reduced = useReducedMotion()
  const intensity = swingIntensity ?? 1.0
  const lanyardClr = lanyardColor ?? '#8b5cf6'
  const animDur = `${2400 / intensity}ms`

  return (
    <div className="relative flex flex-col items-center" style={{ width: '200px', height: '420px' }}>
      {/* Lanyard rod */}
      <div
        className={`w-1 rounded-full ${reduced ? '' : 'origin-top'} `}
        style={{
          height: '320px',
          background: `linear-gradient(90deg, ${lanyardClr}dd, ${lanyardClr}aa, ${lanyardClr}dd)`,
          ...(reduced ? {} : {
            animation: `swing ${animDur} ease-in-out infinite`,
            transformOrigin: 'center top',
          }),
        }}
      />

      {/* Clip ring */}
      <div
        className="absolute w-3 h-3 rounded-full border-2 border-stone-400"
        style={{ top: '148px', left: 'calc(50% - 6px)', backgroundColor: '#cbd5e1' }}
      />

      {/* ID Card */}
      <div
        className={`absolute rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-slate-800 border border-stone-200/60 dark:border-white/10 select-none ${reduced ? '' : 'origin-top'}`}
        style={{
          width: '180px',
          height: '240px',
          top: '170px',
          left: '10px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
          ...(reduced ? {} : {
            animation: `swing ${animDur} ease-in-out infinite`,
          }),
        }}
      >
        {/* Photo area */}
        <div className="relative w-full h-[145px] overflow-hidden rounded-t-2xl">
          {idCardPath ? (
            <img src={publicUrl(idCardPath)} alt="ID" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blush-100 to-lilac-100 dark:from-night-700 dark:to-night-600">
              <Heart className="h-6 w-6 text-blush-300 mb-1" aria-hidden="true" />
              <span className="text-[9px] font-bold text-slate-700 tracking-widest">PORTFOLIO</span>
            </div>
          )}
          {/* Gloss overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-stone-200 dark:bg-white/10" />

        {/* Name / label */}
        <div className="flex flex-col items-center pt-3 pb-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 tracking-wide">
            {idCardPath ? 'HELLO!' : 'PORTFOLIO'}
          </span>
          <span className="text-[8px] text-stone-400 mt-0.5">{idCardPath ? 'CREATIVE STUDIO' : 'CREATIVE STUDIO'}</span>
        </div>

        {/* Bottom accent strip */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[156px] h-3 rounded-b-lg opacity-20"
          style={{ backgroundColor: lanyardClr }}
        />
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

          {/* HERO COMPOSITION — Title top-left, photos below, swing badge right */}
          <div className="relative z-10 flex w-full max-w-[560px] flex-col gap-5 lg:flex-row lg:items-start">

            {/* LEFT — Title (top-left) + Photos grid below */}
            <div className="w-full lg:-ml-4">
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

            {/* RIGHT — Large swing badge (desktop only; mobile gets it below the photos) */}
            <div className="hidden lg:flex shrink-0 items-start justify-center lg:ml-auto lg:pl-4">
              <SwingIDBadge
                idCardPath={idCardPath}
                lanyardColor={lanyardColor}
                swingIntensity={swingIntensity}
              />
            </div>

            {/* Mobile: swing badge centered below photos */}
            <div className="flex lg:hidden justify-center mt-4">
              <SwingIDBadge
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
