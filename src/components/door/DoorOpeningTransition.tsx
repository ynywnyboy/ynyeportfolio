import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Heart, Volume2, VolumeX } from 'lucide-react'
import { LittleWorldDoor } from './LittleWorldDoor'
import { AmbientParticles } from './DoorParticles'
import { formatCreatedOn, markDoorSeen, readDoorSound, writeDoorSound } from '../../lib/door'
import { sfxDoorOpen, unlockSfx } from '../../lib/sfx'
import { SITE_CREATED_ON } from '../../config'

type Phase = 'idle' | 'opening' | 'welcome' | 'leaving'

interface Props {
  /** Called once the overlay has completely finished (and is safe to unmount). */
  onDone: () => void
  /** Called from the tap itself (a user gesture) — used to start the music if autoplay was blocked. */
  onEnter?: () => void
}

const SWING = 2.5 // seconds the door takes to swing

/**
 * Full-screen overlay: the magical door, the opening sequence and the welcome message.
 * The real homepage is already mounted underneath, so it is revealed as the overlay fades —
 * there is no reload and no route change.
 */
export function DoorOpeningTransition({ onDone, onEnter }: Props) {
  const reduced = !!useReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  const [sound, setSound] = useState(readDoorSound)
  const timers = useRef<number[]>([])
  const finished = useRef(false)

  const clear = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [] }
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }

  useEffect(() => clear, [])

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    clear()
    markDoorSeen()
    onDone()
  }, [onDone])

  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    sfxDoorOpen(sound)
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      later(() => setPhase('welcome'), 450)
      later(() => setPhase('leaving'), 2000)
      later(finish, 2600)
    } else {
      later(() => setPhase('welcome'), SWING * 1000 + 100)
      later(() => setPhase('leaving'), 4200)
      later(finish, 5100)
    }
  }

  // Escape skips at any point.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  const toggleSound = () => { const v = !sound; setSound(v); writeDoorSound(v) }

  const dateText = formatCreatedOn(SITE_CREATED_ON)
  const dateLine = dateText ? `Our Little World began on ${dateText}` : null
  const showScene = phase === 'idle' || phase === 'opening'
  // once the welcome appears the overlay must not trap clicks
  const passThrough = phase === 'welcome' || phase === 'leaving'

  return (
    <div
      role={passThrough ? undefined : 'dialog'}
      aria-modal={passThrough ? undefined : true}
      aria-label="Welcome to Our Little World"
      className={`fixed inset-0 z-[100] overflow-hidden ${passThrough ? 'pointer-events-none' : ''}`}
    >
      <AnimatePresence>
        {showScene && (
          <motion.div
            key="scene"
            className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-center
                       bg-gradient-to-b from-cream-50 via-blush-100 to-blush-200
                       dark:from-night-900 dark:via-night-800 dark:to-[#2a1f3d]"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: reduced ? 0.5 : 1.1 } }}
          >
            {/* soft glow + stars (dark mode) */}
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100"
              style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 85% 60%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 10% 75%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 45% 12%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 60% 85%, #fff 50%, transparent 51%)' }} />
            <div aria-hidden className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(255,226,170,0.45), transparent 60%)' }} />
            {!reduced && <AmbientParticles />}

            <motion.div
              className="relative z-10"
              animate={{ opacity: phase === 'opening' ? 0 : 1, y: phase === 'opening' ? -10 : 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-script text-5xl text-blush-600 drop-shadow-sm dark:text-blush-200 sm:text-6xl">Our Little World</h1>
              <p className="mx-auto mt-2 max-w-xs text-sm text-gray-600 dark:text-gray-300 sm:max-w-md sm:text-base">
                A little world filled with our favorite moments awaits...
              </p>
            </motion.div>

            <div className="relative z-10">
              <LittleWorldDoor open={phase !== 'idle'} reduced={reduced} onOpen={open} dateLine={dateLine} duration={SWING} />
            </div>

            <motion.p
              className="relative z-10 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
              animate={{ opacity: phase === 'idle' ? 1 : 0 }}
              transition={{ duration: 0.4 }}
            >
              Tap the door to enter ♡
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* golden glow that brightens as the door opens, then clears to reveal the homepage */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 55%, #fff3cf 0%, #ffe3a3 45%, #ffd27f 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === 'opening' ? (reduced ? 0.5 : 0.85) : 0 }}
        transition={{ duration: phase === 'opening' ? SWING * 0.8 : 1.2, delay: phase === 'opening' && !reduced ? 0.6 : 0 }}
      />

      {/* welcome message */}
      <AnimatePresence>
        {passThrough && (
          <motion.div
            key="welcome"
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase === 'welcome' ? 1 : 0 }}
            transition={{ duration: 0.8 }}
          >
            {!reduced && <AmbientParticles count={14} />}
            <div className="relative rounded-3xl bg-cream-50/70 px-8 py-6 text-center shadow-soft backdrop-blur-md dark:bg-night-900/70">
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-full bg-amber-200/50 blur-2xl" />
              <p role="status" className="font-script text-3xl text-blush-600 dark:text-blush-200 sm:text-5xl">
                Welcome to Our Little World <Heart className="inline -translate-y-0.5 text-blush-500" size={28} fill="currentColor" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* controls */}
      {showScene && (
        <div className="absolute right-3 top-3 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={sound}
            aria-label={sound ? 'Turn door sound off' : 'Turn door sound on'}
            className="rounded-full bg-white/70 p-2 text-blush-600 shadow-soft backdrop-blur hover:bg-white dark:bg-night-800/70 dark:text-blush-200"
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            type="button"
            onClick={finish}
            className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-blush-600 shadow-soft backdrop-blur hover:bg-white dark:bg-night-800/70 dark:text-blush-200"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  )
}
