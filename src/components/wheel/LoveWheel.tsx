import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react'
import { Heart, Loader2, RotateCcw, SkipForward, Check, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { errMsg, insertRow, updateRow } from '../../lib/data'
import { sfxChime, sfxHeart, sfxPop, sfxSpin, sfxTick, unlockSfx } from '../../lib/sfx'
import type { WheelOption, WheelSet, WheelSpin } from '../../lib/types'
import {
  CENTER, RADIUS, indexAtPointer, labelStyle, pickIndex, polar, secureRandom, shortLabel, sliceFill, slicePath, sliceMid, targetRotation,
} from '../../lib/wheel'
import { Confetti } from './Confetti'

interface Props {
  wheel: WheelSet
  /** Enabled options of this wheel, in wheel order. */
  options: WheelOption[]
  history: WheelSpin[]
}

const LIGHTS = 28

export function LoveWheel({ wheel, options, history }: Props) {
  const { user } = useAuth()
  const toast = useToast()
  const n = options.length
  const rotation = useMotionValue(0)
  const pointer = useMotionValue(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<{ option: WheelOption; spin: WheelSpin | null } | null>(null)
  const [burst, setBurst] = useState(0)
  const [busyAction, setBusyAction] = useState(false)
  const controls = useRef<ReturnType<typeof animate> | null>(null)
  const unsub = useRef<(() => void) | null>(null)
  const mounted = useRef(true)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastSpun = useRef<string | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      controls.current?.stop()
      unsub.current?.()
      timers.current.forEach(clearTimeout)
    }
  }, [])

  // Changing the wheel (or its options) while idle just resets the pose
  useEffect(() => { if (!spinning) rotation.set(0) }, [wheel.id, n]) // eslint-disable-line react-hooks/exhaustive-deps

  const style = useMemo(() => labelStyle(n), [n])
  const lights = useMemo(() => Array.from({ length: LIGHTS }, (_, i) => polar((i * 360) / LIGHTS, 195.5)), [])

  const flick = () => {
    pointer.set(-22)
    animate(pointer, 0, { type: 'spring', stiffness: 700, damping: 18 })
  }

  const spin = async () => {
    if (spinning || n === 0) return
    unlockSfx() // allowed because this runs from the click
    setResult(null)

    // Don't land on the same thing twice in a row when there is a choice
    const lastId = lastSpun.current ?? history.find((h) => h.wheel_id === wheel.id)?.option_id ?? null
    const idx = pickIndex(options, lastId, secureRandom)
    const chosen = options[idx]
    lastSpun.current = chosen.id

    const from = rotation.get()
    const turns = 5 + Math.floor(secureRandom() * 3)
    const to = targetRotation(from, idx, n, turns, secureRandom() - 0.5)
    const seconds = 4.6 + secureRandom() * 1.2

    setSpinning(true)
    sfxSpin(seconds)
    let lastIdx = indexAtPointer(from, n, pointer.get())
    unsub.current = rotation.on('change', (v: number) => {
      const i = indexAtPointer(v, n, pointer.get())
      if (i !== lastIdx) { lastIdx = i; sfxTick(); flick() }
    })

    await new Promise<void>((resolve) => {
      controls.current = animate(rotation, to, { duration: seconds, ease: [0.12, 0.62, 0.1, 1], onComplete: () => resolve() })
      // if the animation is stopped (page left) resolve too, so we never hang
      controls.current.then?.(() => resolve())
    })
    unsub.current?.()
    unsub.current = null
    if (!mounted.current) return

    rotation.set(((to % 360) + 360) % 360) // same pose, smaller number
    setSpinning(false)

    // Save it for both of us ("Our Little Moments")
    let spinRow: WheelSpin | null = null
    try {
      spinRow = await insertRow<WheelSpin>('wheel_history', {
        wheel_id: wheel.id,
        wheel_name: wheel.name,
        option_id: chosen.id,
        label: chosen.label,
        emoji: chosen.emoji,
        category: chosen.category,
        spun_by: user?.id ?? null,
      })
    } catch (e) {
      toast(`Couldn’t save this to Our Little Moments: ${errMsg(e)}`, 'error')
    }
    if (!mounted.current) return

    setResult({ option: chosen, spin: spinRow })
    setBurst((b) => b + 1)
    sfxPop()
    timers.current.push(setTimeout(sfxChime, 420))
  }

  const mark = async (status: 'done' | 'skipped') => {
    if (!result?.spin || busyAction) { setResult(null); return }
    setBusyAction(true)
    try {
      await updateRow<WheelSpin>('wheel_history', 'id', result.spin.id, result.spin.version, { status })
      if (status === 'done') sfxHeart()
      toast(status === 'done' ? 'Saved to Our Little Moments 💗' : 'No pressure — skipped 💛')
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setBusyAction(false)
      setResult(null)
    }
  }

  const again = () => {
    setResult(null)
    timers.current.push(setTimeout(spin, 250))
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[min(26rem,88vw)]">
        {/* pointer */}
        <motion.div
          className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[38%]"
          style={{ rotate: pointer, transformOrigin: '50% 30%' }}
          aria-hidden
        >
          <svg width="46" height="58" viewBox="0 0 46 58">
            <path d="M23 56 C23 56 4 34 4 20 A19 19 0 0 1 42 20 C42 34 23 56 23 56 Z" fill="rgb(var(--blush-600))" stroke="white" strokeWidth="3" />
            <circle cx="23" cy="20" r="6.5" fill="white" />
          </svg>
        </motion.div>

        <div className="relative aspect-square w-full rounded-full bg-gradient-to-br from-blush-200 via-white to-lilac-200 p-[4.5%] shadow-dreamy dark:from-blush-600/40 dark:via-night-800 dark:to-lilac-300/30">
          {/* bulbs around the rim */}
          <svg viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`} className="pointer-events-none absolute inset-0 z-10 h-full w-full" aria-hidden>
            {lights.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3.4}
                className={spinning ? 'animate-shimmer' : ''}
                style={{ fill: i % 2 ? 'rgb(var(--blush-400))' : '#fff', animationDelay: `${(i % 4) * 0.25}s` }}
              />
            ))}
          </svg>

          {n === 0 ? (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white/80 p-10 text-center text-sm text-stone-500 dark:bg-night-800/80">
              <p>
                Nothing is switched on for this wheel.<br />Open <strong>Customize</strong> to enable or add something sweet.
              </p>
            </div>
          ) : (
            <motion.div className="h-full w-full rounded-full" style={{ rotate: rotation, willChange: 'transform' }} role="img" aria-label={`Wheel with ${n} options`}>
              <svg viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`} className="h-full w-full drop-shadow">
                {n === 1 ? (
                  <circle cx={CENTER} cy={CENTER} r={RADIUS} style={{ fill: sliceFill(0, 1) }} />
                ) : (
                  options.map((o, i) => <path key={o.id} d={slicePath(i, n)} style={{ fill: sliceFill(i, n) }} stroke="white" strokeWidth={2} />)
                )}
                {options.map((o, i) => {
                  const mid = n === 1 ? 0 : sliceMid(i, n)
                  return (
                    <g key={o.id} transform={`rotate(${mid - 90} ${CENTER} ${CENTER})`} aria-hidden>
                      <text x={CENTER + RADIUS * 0.84} y={CENTER} fontSize={style.emojiSize} textAnchor="middle" dominantBaseline="central">
                        {o.emoji}
                      </text>
                      {style.showLabel && (
                        <text x={CENTER + RADIUS * 0.74} y={CENTER} fontSize={style.fontSize} textAnchor="end" dominantBaseline="central" fill="#44403c" fontWeight={500}>
                          {shortLabel(o.label, style.max)}
                        </text>
                      )}
                    </g>
                  )
                })}
                <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="white" strokeWidth={5} />
              </svg>
            </motion.div>
          )}

          {/* hub */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex h-[17%] w-[17%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-soft ring-4 ring-blush-200 dark:bg-night-800">
            <motion.span animate={{ scale: spinning ? [1, 1.25, 1] : 1 }} transition={{ repeat: spinning ? Infinity : 0, duration: 0.7 }}>
              <Heart className="h-6 w-6 fill-blush-400 text-blush-500" />
            </motion.span>
          </div>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: spinning || n === 0 ? 1 : 1.04 }}
        onClick={spin}
        disabled={spinning || n === 0}
        className="btn-primary mt-8 !px-14 !py-4 font-display text-2xl tracking-wide"
        aria-label="Spin the love wheel"
      >
        {spinning ? <Loader2 className="h-6 w-6 animate-spin" /> : <Heart className="h-6 w-6 fill-white" />}
        {spinning ? 'Spinning…' : 'SPIN'}
      </motion.button>
      <p className="mt-3 max-w-sm text-center text-xs text-stone-500">
        Just for fun — every result is optional. Skip it or spin again any time 💛
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {result ? `The wheel chose: ${result.option.label}` : spinning ? 'Spinning' : ''}
      </p>

      {burst > 0 && result && <Confetti key={burst} />}

      <AnimatePresence>
        {result && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-stone-900/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) setResult(null) }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your love wheel result"
              className="card relative w-full max-w-md bg-white p-8 text-center dark:bg-night-800"
              initial={{ scale: 0.6, rotate: -6, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 14, stiffness: 220 }}
            >
              <button onClick={() => setResult(null)} className="absolute right-4 top-4 rounded-full p-1.5 text-stone-400 hover:bg-blush-100" aria-label="Close"><X className="h-5 w-5" /></button>
              <p className="h-script text-xl">{result.option.category}</p>
              <motion.div className="my-3 text-7xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1], rotate: [0, -10, 8, 0] }} transition={{ duration: 0.8, delay: 0.1 }} aria-hidden>
                {result.option.emoji}
              </motion.div>
              <h2 className="h-display text-2xl font-semibold leading-snug sm:text-3xl">{result.option.label}</h2>
              <p className="mt-3 text-xs text-stone-500">Only if you both feel like it — skipping is always okay.</p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button className="btn-primary" onClick={() => mark('done')} disabled={busyAction}><Check className="h-4 w-4" /> We did it</button>
                <button className="btn-ghost" onClick={again}><RotateCcw className="h-4 w-4" /> Spin again</button>
                <button className="btn-ghost" onClick={() => mark('skipped')} disabled={busyAction}><SkipForward className="h-4 w-4" /> Skip this one</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
