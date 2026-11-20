import { motion, type Variants, type Transition } from 'motion/react'

/** Easing curves shared by every opening animation. */
export const EASE = {
  out: [0.22, 1, 0.36, 1] as const, // soft deceleration
  inOut: [0.45, 0, 0.22, 1] as const, // natural acceleration/deceleration
  spring: { type: 'spring', damping: 26, stiffness: 300 } as const, // used for UI springs
  smooth: [0.32, 0.6, 0.28, 1] as const,
  outBack: [0.34, 1.56, 0.64, 1] as const,
} as const

/** Base durations (seconds). Speed factor scales these at runtime. */
export const DUR = {
  stage: 0.55, // a single motion stage
  reveal: 1.1, // main reveal beat
  main: 2.4, // primary opening motion
  cinematic: 3.4, // extended sequences
}

/** Shared entrance variants. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.stage, ease: EASE.out } },
}

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}

/** Deterministic PRNG so particle layouts are stable across renders and hydration. */
export function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }
export function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)) }

export function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Build a particle profile with per-particle variation. */
export interface Particle {
  x: number // -1..1 horizontal offset
  y: number // -1..1 vertical offset
  size: number
  dur: number
  delay: number
  rot: number
}

export function particles(n: number, seed = 7, spread = 1.4): Particle[] {
  const r = seeded(seed)
  return Array.from({ length: n }, () => ({
    x: (r() - 0.5) * spread,
    y: (r() - 0.5) * spread,
    size: 6 + r() * 12,
    dur: 0.9 + r() * 1.6,
    delay: r() * 0.4,
    rot: r() * 360,
  }))
}

export const fadeOut: Transition = { duration: 0.5, ease: EASE.out }
export const fadeOutLong: Transition = { duration: 1.1, ease: EASE.out }

/** Motion wrapper that respects prefers-reduced-motion: when reduced, use instant transitions. */
export function motionTransition(reduced: boolean, t: Transition): Transition {
  return reduced ? { duration: 0 } : t
}

export { motion, type Variants, type Transition }