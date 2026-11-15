import { useMemo } from 'react'
import { motion } from 'motion/react'

const GLYPHS = ['♥', '♥', '✦', '★', '✧', '♡', '💗', '✨']
const COLORS = ['rgb(var(--blush-400))', 'rgb(var(--blush-500))', '#c3a9ec', '#f6c453', 'rgb(var(--blush-300))']

/** A short burst of hearts, stars and sparkles. Skipped for people who prefer reduced motion. */
export function Confetti({ count = 44 }: { count?: number }) {
  const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const small = typeof window !== 'undefined' && window.innerWidth < 640
  const items = useMemo(
    () =>
      Array.from({ length: small ? Math.round(count * 0.6) : count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const power = 140 + Math.random() * 260
        return {
          id: i,
          glyph: GLYPHS[i % GLYPHS.length],
          color: COLORS[i % COLORS.length],
          x: Math.cos(angle) * power,
          up: Math.sin(angle) * power * 0.7 - 160,
          rot: (Math.random() - 0.5) * 540,
          size: 14 + Math.random() * 18,
          dur: 1.8 + Math.random() * 1.2,
          delay: Math.random() * 0.12,
        }
      }),
    [count, small],
  )
  if (reduce) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[95] overflow-hidden" aria-hidden>
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-[45%] select-none"
          style={{ fontSize: p.size, color: p.color, willChange: 'transform, opacity' }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.3, rotate: 0 }}
          animate={{
            x: [0, p.x, p.x * 1.2],
            y: [0, p.up, p.up + 520],
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1.1, 1],
            rotate: p.rot,
          }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
        >
          {p.glyph}
        </motion.span>
      ))}
    </div>
  )
}
