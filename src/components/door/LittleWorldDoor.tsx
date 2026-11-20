import { motion } from 'motion/react'
import { Heart } from 'lucide-react'
import { DoorBurst } from './DoorParticles'

interface Props {
  open: boolean
  reduced: boolean
  onOpen: () => void
  /** e.g. "Our Little World began on 1 November 2026" — hidden when null */
  dateLine: string | null
  /** swing duration in seconds */
  duration?: number
}

const GOLD = '#e6c07b'
const GOLD_DEEP = '#b98a3e'

/**
 * The fantasy door itself: glowing arched frame, warm light behind it, and a leaf that swings
 * on its left hinges. The whole door is one real <button>, so it works with touch, mouse and keyboard.
 */
export function LittleWorldDoor({ open, reduced, onOpen, dateLine, duration = 2.5 }: Props) {
  console.log('LittleWorldDoor open state:', open)
  return (
    <div className="relative flex flex-col items-center">
      {/* halo */}
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-1/2 -z-10 h-[140%] w-[200%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(255,214,140,0.55), rgba(255,214,140,0) 70%)' }}
        animate={reduced ? undefined : { opacity: open ? 1 : [0.55, 0.9, 0.55], scale: open ? 1.25 : [1, 1.06, 1] }}
        transition={open ? { duration: 1.6 } : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative" style={{ height: 'min(44vh, 26rem)', width: 'calc(min(44vh, 26rem) * 3 / 5)', aspectRatio: '3 / 5' }}>
        {/* frame */}
        <div
          aria-hidden
          className="absolute -inset-[9px] rounded-t-[999px] rounded-b-md"
          style={{
            background: `linear-gradient(160deg, #f8e3b0, ${GOLD} 40%, ${GOLD_DEEP})`,
            boxShadow: '0 0 40px 6px rgba(255,205,120,0.45), 0 18px 50px -10px rgba(0,0,0,0.35)',
          }}
        />
        {/* doorway + door leaf share a perspective box */}
        <div className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-sm" style={{ perspective: '1200px' }}>
          {/* warm light from inside */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 50% 70%, #fff6d8 0%, #ffe0a0 38%, #ffc27a 75%, #f0a35e 100%)' }}
          />
          {!reduced && (
            <motion.div
              aria-hidden
              className="absolute left-1/2 top-[70%] h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 opacity-40"
              style={{
                background:
                  'repeating-conic-gradient(from 0deg, rgba(255,255,255,0.7) 0deg 6deg, transparent 6deg 24deg)',
                maskImage: 'radial-gradient(closest-side, #000 10%, transparent 70%)',
                WebkitMaskImage: 'radial-gradient(closest-side, #000 10%, transparent 70%)',
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            />
          )}

          {/* the leaf */}
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-t-[999px] rounded-b-sm"
            style={{
              transformOrigin: 'left center',
              background: 'linear-gradient(170deg, rgb(var(--blush-100)), rgb(var(--blush-200)) 55%, rgb(var(--blush-300)))',
              boxShadow: `inset 0 0 0 4px ${GOLD}, inset 0 0 30px rgba(255,255,255,0.5)`,
            }}
            animate={
              reduced
                ? { opacity: open ? 0 : 1 }
                : open
                  ? { rotateY: [0, -3, 0, 100], opacity: 0 }
                  : { rotateY: 0, opacity: 1 }
            }
            transition={
              reduced
                ? { duration: 0.6 }
                : {
                    rotateY: { duration, times: [0, 0.07, 0.15, 1], ease: [0.45, 0, 0.2, 1] },
                    opacity: { duration: 0.4, delay: duration - 0.4 },
                  }
            }
          >
            {/* panels */}
            <div className="absolute inset-x-[14%] top-[10%] h-[38%] rounded-t-[999px] border-2 border-[#e6c07b]/80 bg-white/20" />
            <div className="absolute inset-x-[14%] bottom-[8%] h-[34%] rounded-md border-2 border-[#e6c07b]/80 bg-white/20" />
            {/* heart emblem */}
            <div className="absolute left-1/2 top-[30%] -translate-x-1/2 text-blush-500 drop-shadow">
              <Heart size={30} fill="currentColor" />
            </div>
            {/* handle */}
            <span
              className="absolute right-[10%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full"
              style={{ background: `radial-gradient(circle at 35% 35%, #fff4cf, ${GOLD} 55%, ${GOLD_DEEP})`, boxShadow: '0 2px 6px rgba(0,0,0,.35)' }}
            />
            {/* hinges */}
            {['18%', '50%', '82%'].map((t) => (
              <span
                key={t}
                className="absolute left-0 h-6 w-2 -translate-y-1/2 rounded-r"
                style={{ top: t, background: `linear-gradient(90deg, ${GOLD_DEEP}, #f8e3b0)` }}
              />
            ))}
          </motion.div>
        </div>

        {open && !reduced && <DoorBurst />}

        {/* the interactive surface */}
        <button
          type="button"
          onClick={onOpen}
          disabled={open}
          autoFocus
          aria-label="Open the door and enter Our Little World"
          className="absolute -inset-[9px] z-30 cursor-pointer rounded-t-[999px] rounded-b-md outline-none transition focus-visible:ring-4 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-default"
        />
      </div>

      {dateLine && (
        <motion.p
          className="mt-6 text-xs italic tracking-wide text-blush-600 dark:text-blush-300 sm:text-sm"
          animate={{ opacity: open ? 0 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {dateLine}
        </motion.p>
      )}
    </div>
  )
}
