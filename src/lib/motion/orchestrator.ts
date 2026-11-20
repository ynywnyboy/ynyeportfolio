/**
 * Motion orchestration utilities for opening animations.
 * Replaces raw setTimeout chains with a declarative stage-based approach.
 */
import { useEffect, useRef, useState, useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from 'react'
import type { Phase } from './types'

// ─── Easing presets (cubic-bezier arrays usable by motion) ──────────────────
export const ease = {
  /** Soft deceleration — default for reveals */
  out: [0.22, 1, 0.36, 1] as const,
  /** Natural accel/decel — used for physical movement */
  inOut: [0.45, 0, 0.22, 1] as const,
  /** Smooth ease — between out and inOut */
  smooth: [0.32, 60, 0.28, 1] as const,
  /** Slight overshoot — gives weight to entrance */
  outBack: [0.34, 1.56, 0.64, 1] as const,
  /** Gentle spring feel */
  spring: { type: 'spring' as const, damping: 24, stiffness: 280 } as const,
  /** Tight spring for small bounces */
  tightSpring: { type: 'spring' as const, damping: 20, stiffness: 400 } as const,
} as const

// ─── Duration constants (base seconds; scale by speed factor at runtime) ─────
export const D = {
  tap: 0.15,          // button press feedback
  reveal: 0.9,        // main reveal beat
  linger: 1.8,        // welcome message display duration
  gateOpen: 2.0,      // full gate/opening sequence
  cinematic: 3.2,     // extended dramatic sequences
} as const

// ─── PRNG helpers ────────────────────────────────────────────────────────────
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
}

export function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

export interface Particle { x: number; y: number; size: number; dur: number; delay: number; rot: number }

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

// ─── Phase orchestrator ──────────────────────────────────────────────────────
interface TimerHooks {
  timers: MutableRefObject<number[]>
  clearTimers: () => void
  later: (fn: () => void, ms: number) => void
}

export function usePhaseOrchestrator(
  onDone: () => void,
  reduced: boolean,
  totalMs?: number,
): { phase: Phase; setPhase: Dispatch<SetStateAction<Phase>> } & TimerHooks {
  const [phase, setPhase] = useState<Phase>('idle')
  const finished = useRef(false)

  const timers = useRef<number[]>([])
  const clearTimers = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    clearTimers()
    onDone()
  }, [onDone, clearTimers])

  // Auto-transition through phases when not reduced
  useEffect(() => {
    if (reduced) return
    if (phase === 'opening') {
      later(() => setPhase('welcome'), D.gateOpen * 1000)
      later(() => setPhase('leaving'), (D.gateOpen + D.linger) * 1000)
      later(finish, (totalMs ?? (D.gateOpen + D.linger + D.reveal)) * 1000)
    }
  }, [phase, reduced, later, finish, totalMs])

  // Reduced motion: collapse all phases instantly
  useEffect(() => {
    if (!reduced) return
    if (phase === 'opening') {
      later(() => setPhase('welcome'), 80)
      later(() => setPhase('leaving'), 160)
      later(finish, 240)
    }
  }, [phase, reduced, later, finish])

  return { phase, setPhase, timers, clearTimers, later }
}
