import { useMemo } from 'react'
import { motion } from 'motion/react'
import { Heart, Sparkles } from 'lucide-react'

const rnd = (seed: number) => {
  // tiny deterministic PRNG so server/client and re-renders agree
  const x = Math.sin(seed * 9999.17) * 10000
  return x - Math.floor(x)
}

/** Slow ambient sparkles and hearts drifting up the whole screen. */
export function AmbientParticles({ count = 22 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rnd(i + 1) * 100,
        size: 10 + rnd(i + 50) * 14,
        dur: 9 + rnd(i + 90) * 9,
        delay: -rnd(i + 130) * 14,
        heart: i % 3 === 0,
      })),
    [count],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((p, i) => {
        const Icon = p.heart ? Heart : Sparkles
        return (
          <span
            key={i}
            className={`absolute bottom-[-2rem] animate-floaty ${p.heart ? 'text-blush-400' : 'text-amber-300'}`}
            style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s` }}
          >
            <Icon size={p.size} fill={p.heart ? 'currentColor' : 'none'} />
          </span>
        )
      })}
    </div>
  )
}

/** A burst of hearts and sparkles rising out of the doorway. Positioned at the centre of its parent. */
export function DoorBurst({ count = 30 }: { count?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: (rnd(i + 7) - 0.5) * 220,
        drift: (rnd(i + 31) - 0.5) * 120,
        rise: 160 + rnd(i + 61) * 300,
        size: 10 + rnd(i + 91) * 16,
        delay: 0.5 + rnd(i + 121) * 1.5,
        dur: 1.8 + rnd(i + 151) * 1.4,
        heart: i % 3 === 0,
      })),
    [count],
  )
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex justify-center">
      {items.map((p, i) => {
        const Icon = p.heart ? Heart : Sparkles
        return (
          <motion.span
            key={i}
            className={`absolute ${p.heart ? 'text-blush-400' : 'text-amber-300'}`}
            initial={{ x: p.x, y: 40, opacity: 0, scale: 0.4 }}
            animate={{ x: p.x + p.drift, y: -p.rise, opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.6] }}
            transition={{ delay: p.delay, duration: p.dur, ease: 'easeOut' }}
          >
            <Icon size={p.size} fill={p.heart ? 'currentColor' : 'none'} />
          </motion.span>
        )
      })}
    </div>
  )
}
