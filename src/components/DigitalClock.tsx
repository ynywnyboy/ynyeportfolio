import { useEffect, useRef, useState } from 'react'
import { animate } from 'motion'
import type { Duration } from '../lib/time'
import { calendarDuration } from '../lib/time'
import { useReducedMotion } from '../lib/a11y'

interface ClockUnitProps {
  value: number
  label: string
  digitCount?: number
}

function DigitCard({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced) return
    if (prev.current !== value && ref.current) {
      // Quick scale flash to indicate change
      const c = animate({ opacity: [0.6, 1], scale: [0.92, 1] }, {
        duration: 0.35,
        ease: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      })
      prev.current = value
      return () => c.stop()
    }
    prev.current = value
  }, [value, reduced])

  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className="relative flex h-10 sm:h-12 md:h-14 w-full items-center justify-center rounded-lg bg-night-900/90 p-1 shadow-inner dark:bg-white/10 overflow-hidden">
        <span
          ref={ref}
          className="clock-digit text-xl font-bold text-blush-400 dark:text-blush-300 tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(1rem, 3vw, 1.75rem)' }}
        >
          {String(value).padStart(2, '0')}
        </span>
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-blush-400/5 to-transparent pointer-events-none" />
      </div>
      <span className="text-[0.5rem] uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500 whitespace-nowrap">{label}</span>
    </div>
  )
}

export function DigitalClock({ since, caption }: { since: string; caption?: string }) {
  const [now, setNow] = useState(new Date())
  const reduced = useReducedMotion()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const d = calendarDuration(new Date(since), now)

  const units: { key: keyof Duration; label: string }[] = [
    { key: 'years', label: 'Years' },
    { key: 'months', label: 'Months' },
    { key: 'days', label: 'Days' },
    { key: 'hours', label: 'Hours' },
    { key: 'minutes', label: 'Mins' },
    { key: 'seconds', label: 'Secs' },
  ]

  // Compute weeks separately so they don't conflict with the days count
  const sinceDate = new Date(since)
  const totalMs = now.getTime() - sinceDate.getTime()
  const totalDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(totalDays / 7)

  return (
    <div className="w-full">
      <div
        className={`rounded-2xl border border-white/20 p-3 shadow-glow backdrop-blur-md ${
          reduced ? '' : 'transition-shadow hover:shadow-[0_0_40px_rgb(var(--blush-400)/0.4)]'
        }`}
        style={{ background: 'linear-gradient(135deg, rgb(20 16 28 / 0.95), rgb(29 24 38 / 0.95))' }}
      >
        {/* Top bar decoration */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blush-400 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-stone-400">Together</span>
          </div>
          <span className="font-mono text-xs text-stone-500">since {new Date(since).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Digit grid - 7 columns, no overlap */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5 sm:gap-2">
          {units.map(({ key, label }, i) => (
            <DigitCard
              key={key}
              value={d[key]}
              label={label}
            />
          ))}
          {/* Weeks gets its own slot */}
          <DigitCard
            key="weeks"
            value={weeks}
            label="Weeks"
          />
        </div>

        {/* Caption */}
        {caption && (
          <p className="mt-3 text-center font-script text-sm text-blush-400/80">
            {caption}
          </p>
        )}

        {/* Bottom accent line */}
        <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-blush-500/30 to-transparent" />
      </div>
    </div>
  )
}

/** Lighter variant for embedding inside home page cards. */
export function CompactCounter({ since }: { since: string }) {
  const [now, setNow] = useState(new Date())
  const reduced = useReducedMotion()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const d = calendarDuration(new Date(since), now)

  if (reduced) {
    return (
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {([['years', d.years], ['months', d.months], ['days', d.days], ['hours', d.hours], ['minutes', d.minutes], ['seconds', d.seconds]] as [string, number][]).map(([key, val]) => (
          <div key={key} className="text-center">
            <div className="font-mono text-xl font-bold text-blush-600 dark:text-blush-400 tabular-nums">{val}</div>
            <div className="text-[0.6rem] uppercase tracking-wider text-stone-400">{key}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {([['years', d.years], ['months', d.months], ['days', d.days], ['hours', d.hours], ['minutes', d.minutes], ['seconds', d.seconds]] as [string, number][]).map(([key, val]) => (
        <div key={key} className="flex flex-col items-center rounded-xl border border-white/40 bg-white/60 p-2 shadow-soft dark:bg-white/5 dark:border-white/10">
          <span className="font-mono text-lg font-semibold text-blush-600 dark:text-blush-400 tabular-nums">{val}</span>
          <span className="mt-0.5 text-[0.5rem] uppercase tracking-widest text-stone-500">{key}</span>
        </div>
      ))}
    </div>
  )
}
