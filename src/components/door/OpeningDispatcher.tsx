import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Heart, Volume2, VolumeX } from 'lucide-react'
import { useReducedMotion } from '../../lib/a11y'
import { usePhaseOrchestrator } from '../../lib/motion/orchestrator'
import { LittleWorldDoor } from './LittleWorldDoor'
import { AmbientParticles, DoorBurst } from './DoorParticles'
import { formatCreatedOn, markDoorSeen, readDoorSound, writeDoorSound } from '../../lib/door'
import { sfxDoorOpen, unlockSfx } from '../../lib/sfx'
import { SITE_CREATED_ON } from '../../config'

type Phase = 'idle' | 'opening' | 'welcome' | 'leaving'
type OpeningKind = 'door' | 'envelope' | 'gift' | 'book' | 'polaroid' | 'curtain' | 'window' | 'liquid-glass' | 'dreamy-fade' | 'cinematic' | 'particle' | 'bubble-pop' | 'sliding-panels' | 'heart' | 'disabled'

interface OpeningDispatcherProps {
  openingKind: OpeningKind
  onDone: () => void
  onEnter?: () => void
}

interface CommonProps {
  phase: Phase
  setPhase: React.Dispatch<React.SetStateAction<Phase>>
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}

/** Shared timing constants */
const SWING = 2.5

export function OpeningDispatcher({ openingKind, onDone, onEnter }: OpeningDispatcherProps) {
  const reduced = !!useReducedMotion()
  const { phase, setPhase, later, clearTimers } = usePhaseOrchestrator(onDone, reduced)

  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }, [])

  const timers = useRef<number[]>([])
  const laterSafe = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => clear, [])

  const dateText = formatCreatedOn(SITE_CREATED_ON)
  const dateLine = dateText ? `Our Little World began on ${dateText}` : null
  const finished = useRef(false)
  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    clearTimers()
    markDoorSeen()
    onDone()
  }, [onDone, clearTimers])

  // Reset finish flag on unmount to prevent stale close
  useEffect(() => {
    return () => { finished.current = false }
  }, [])

  const [sound, setSound] = useState<boolean>(readDoorSound)
  const toggleSound = () => { const v = !sound; setSound(v); writeDoorSound(v) }

  // ─── 1. MAGIC DOOR ─────────────────────────────────────────────────────────
  function DoorOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={16} />}
        <LittleWorldDoor
          open={phase !== 'idle'}
          reduced={reduced}
          onOpen={open}
          dateLine={dateLine}
          duration={SWING}
        />
        {phase === 'opening' && !reduced && <DoorBurst />}
      </div>
    )
  }

  // ─── 2. LOVE ENVELOPE ──────────────────────────────────────────────────────
  function EnvelopeOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
        {!reduced && <AmbientParticles count={12} />}
        <div className="relative mx-auto aspect-[3/2] w-full max-w-md" style={{ perspective: 1000 }}>
          {/* back of envelope */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-300 shadow-soft dark:from-blush-600/60 dark:to-blush-600/40" />
          {/* letter */}
          <motion.div
            className="absolute inset-x-4 top-3 flex h-[85%] items-start justify-center overflow-hidden rounded-xl bg-cream-50 p-3 text-center shadow dark:bg-night-800"
            initial={false}
            animate={{ y: phase === 'opening' || phase === 'welcome' ? -60 : 0, opacity: phase === 'opening' ? 1 : 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300, delay: phase === 'opening' ? 0.6 : 0 }}
          >
            <span className="font-script text-lg text-blush-500">{dateLine || 'Our Little World'}</span>
          </motion.div>
          {/* front pocket */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-100 to-blush-200 dark:from-blush-600/30 dark:to-blush-600/20" style={{ clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)' }} />
          {/* flap */}
          <motion.div
            className="absolute inset-x-0 top-0 h-[55%] rounded-t-2xl bg-gradient-to-b from-blush-300 to-blush-200 dark:from-blush-600/70 dark:to-blush-600/50"
            style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden', transformOrigin: 'center top' }}
            initial={false}
            animate={{ rotateX: phase === 'opening' ? 180 : 0, zIndex: phase === 'opening' ? 0 : 5 }}
            transition={{ duration: 1.0, ease: [0.34, 1.56, 0.64, 1] }}
          />
          {/* seal */}
          <motion.div
            className="absolute left-1/2 top-[48%] z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blush-500 text-white shadow"
            animate={{ scale: phase === 'opening' ? 0 : 1, opacity: phase === 'opening' ? 0 : 1, rotate: phase === 'opening' ? 360 : 0 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Heart className="h-4 w-4 fill-white" />
          </motion.div>
          {/* interactive surface */}
          <button
            type="button"
            onClick={open}
            disabled={phase !== 'idle'}
            autoFocus
            aria-label="Open the envelope and enter Our Little World"
            className="absolute inset-0 z-30 cursor-pointer rounded-2xl outline-none transition focus-visible:ring-4 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-default"
          />
        </div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap the envelope to open ♡
        </motion.p>
      </div>
    )
  }

  // ─── 3. GIFT BOX ───────────────────────────────────────────────────────────
  function GiftOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    const giftParticles = [
      { x: -50, y: -40, c: '#ff6b9d', d: 0 }, { x: 50, y: -45, c: '#ffd93d', d: 0.1 },
      { x: -40, y: -55, c: '#6bcb77', d: 0.05 }, { x: 60, y: -50, c: '#4d96ff', d: 0.15 },
      { x: -60, y: -35, c: '#ff9f43', d: 0.08 }, { x: 45, y: -60, c: '#ff6b9d', d: 0.12 },
      { x: -30, y: -65, c: '#ffd93d', d: 0.03 }, { x: 55, y: -40, c: '#6bcb77', d: 0.18 },
      { x: -55, y: -50, c: '#4d96ff', d: 0.07 }, { x: 40, y: -55, c: '#ff9f43', d: 0.14 },
      { x: -45, y: -45, c: '#ff6b9d', d: 0.09 }, { x: 35, y: -50, c: '#ffd93d', d: 0.16 },
      { x: -35, y: -40, c: '#6bcb77', d: 0.02 }, { x: 65, y: -35, c: '#4d96ff', d: 0.11 },
      { x: -20, y: -70, c: '#ff9f43', d: 0.13 }, { x: 20, y: -65, c: '#ff6b9d', d: 0.04 },
    ]

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={14} />}
        <div className="relative h-48 w-48">
          {/* box base */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-br from-blush-200 to-blush-300 shadow-soft dark:from-blush-600/60 dark:to-blush-600/40"
            animate={{ scale: phase === 'opening' ? [1, 1.04, 1, 1.02, 1] : 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* lid */}
          <motion.div
            className="absolute inset-0 rounded-t-lg bg-gradient-to-br from-blush-100 to-blush-200 dark:from-blush-600/30 dark:to-blush-600/20"
            animate={{
              rotateX: phase === 'opening' ? -105 : 0,
              y: phase === 'opening' ? -70 : 0,
              zIndex: phase === 'opening' ? 0 : 10
            }}
            transition={{ duration: 1.0, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
            style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
          />
          {/* vertical ribbon */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-4 bg-gold-400"
            animate={{ scaleY: phase === 'opening' ? [1, 0.8, 0] : 1, opacity: phase === 'opening' ? [1, 0] : 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
          {/* horizontal ribbon */}
          <motion.div
            className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-4 bg-gold-400"
            animate={{ scaleX: phase === 'opening' ? [1, 0.8, 0] : 1, opacity: phase === 'opening' ? [1, 0] : 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          />
          {/* bow */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-16 w-20 bg-gold-400 rounded-lg"
            animate={{
              rotate: phase === 'opening' ? [0, 90, 180] : 0,
              scale: phase === 'opening' ? [1, 1.2, 0] : 1,
              opacity: phase === 'opening' ? [1, 0.8, 0] : 1
            }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          />
          {/* confetti burst */}
          {phase === 'opening' && !reduced && (
            <div className="absolute inset-0">
              {giftParticles.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                  style={{
                    background: p.c,
                    transform: `translate(-50%, -50%)`,
                    transformOrigin: 'center center'
                  }}
                  initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
                  animate={{ x: p.x, y: p.y - 20, opacity: [0, 1, 0], scale: [0, 1, 0], rotate: Math.random() * 360 }}
                  transition={{ duration: 1.0, delay: p.d, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          )}
        </div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap the gift to open ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 4. STORY BOOK ─────────────────────────────────────────────────────────
  function BookOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center" style={{ perspective: 1200 }}>
        {!reduced && <AmbientParticles count={12} />}
        <div className="relative mx-auto h-48 w-64" style={{ perspective: 1200 }}>
          {/* book cover */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-32 rounded-r-lg bg-gradient-to-b from-blush-400 to-blush-500 shadow-xl"
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            animate={{
              rotateY: phase === 'opening' ? -155 : 0,
              zIndex: phase === 'opening' ? 0 : 10
            }}
            transition={{ duration: 1.5, ease: [0.45, 0, 0.22, 1] }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-script text-2xl text-cream-50">{dateLine || 'Our Story'}</span>
            </div>
            {/* cover detail - spine texture */}
            <div className="absolute left-4 inset-y-4 flex items-center" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15))' }} />
          </motion.div>
          {/* book back cover */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-32 rounded-l-lg bg-gradient-to-b from-blush-300 to-blush-400 shadow-inner" />
          {/* pages - fanned */}
          <motion.div
            className="absolute left-1/2 top-4 -translate-x-1/2 h-[90%] w-[90%] max-w-[26rem] bg-cream-50 rounded-r shadow-inner dark:bg-night-800"
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            animate={{
              opacity: phase === 'opening' ? 1 : 0.3,
              rotateY: phase === 'opening' ? -15 : 0,
              scale: phase === 'opening' ? 1 : 0.95
            }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.45, 0, 0.22, 1] }}
          >
            {/* page lines */}
            <div className="absolute inset-0 flex flex-col justify-between p-6" style={{ pointerEvents: 'none' }}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="border-t border-blush-200/40 dark:border-blush-600/30" style={{ height: '10%' }} />
              ))}
            </div>
          </motion.div>
          {/* subtle page turn shadow */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-32 rounded-r-lg"
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d', background: 'linear-gradient(90deg, rgba(0,0,0,0.15), transparent)' }}
            animate={{ rotateY: phase === 'opening' ? -155 : 0, opacity: phase === 'opening' ? 0.3 : 0 }}
            transition={{ duration: 1.5, ease: [0.45, 0, 0.22, 1] }}
          />
        </div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap the book to open ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 5. POLAROID PHOTO ─────────────────────────────────────────────────────
  function PolaroidOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={10} />}
        <motion.div
          className="relative h-64 w-52 bg-white rounded-t-lg shadow-xl p-2 pb-10"
          initial={{ scale: 0.8, opacity: 0, rotateX: 10 }}
          animate={{
            scale: phase === 'opening' ? 1 : 0.8,
            opacity: phase === 'opening' ? 1 : 0,
            rotateX: phase === 'opening' ? 0 : 10,
            filter: phase === 'opening' ? 'grayscale(0%) sepia(0%) contrast(100%)' : 'grayscale(100%) sepia(80%) contrast(150%) brightness(120%)'
          }}
          transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="aspect-square bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 rounded-t-lg relative overflow-hidden">
            {/* developing photo effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-blush-200/30 to-transparent"
              animate={{ opacity: phase === 'opening' ? [0, 0.5, 0] : 0, scale: phase === 'opening' ? [0.8, 1.2, 1] : 0.8 }}
              transition={{ duration: 1.8, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            />
            {/* vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%)'
            }} />
          </div>
          <div className="mt-2 text-center text-sm text-stone-600 font-script">
            {dateLine || 'Developing...'}
          </div>
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to develop ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 6. STAGE CURTAINS ─────────────────────────────────────────────────────
  function CurtainOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
        {!reduced && <AmbientParticles count={10} />}
        <div className="relative h-64 w-full max-w-2xl overflow-hidden rounded-t-xl bg-gradient-to-b from-blush-900 via-blush-800 to-blush-900 shadow-2xl">
          {/* left curtain - with fabric folds */}
          <motion.div
            className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-blush-900 via-blush-700 to-blush-900 shadow-xl"
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            animate={{
              x: phase === 'opening' ? '-100%' : 0,
              rotateY: phase === 'opening' ? -15 : 0,
              skewX: phase === 'opening' ? 8 : 0,
              opacity: phase === 'opening' ? 0.9 : 1
            }}
            transition={{ duration: 1.8, ease: [0.32, 0.6, 0.28, 1], delay: 0 }}
          >
            {/* fabric fold lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 20%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 22%)'
            }} />
          </motion.div>
          {/* right curtain */}
          <motion.div
            className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blush-900 via-blush-700 to-blush-900 shadow-xl"
            style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
            animate={{
              x: phase === 'opening' ? '100%' : 0,
              rotateY: phase === 'opening' ? 15 : 0,
              skewX: phase === 'opening' ? -8 : 0,
              opacity: phase === 'opening' ? 0.9 : 1
            }}
            transition={{ duration: 1.8, ease: [0.32, 0.6, 0.28, 1], delay: 0 }}
          >
            {/* fabric fold lines */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'repeating-linear-gradient(-90deg, transparent, transparent 20%, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 22%)'
            }} />
          </motion.div>
          {/* gold trim center */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-1 bg-gradient-to-b from-gold-400 to-gold-600"
            animate={{ scaleY: phase === 'opening' ? [1, 0] : 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          />
          {/* stage content revealed */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{
              opacity: phase === 'opening' ? 1 : 0,
              scale: phase === 'opening' ? 1 : 0.9,
              y: phase === 'opening' ? 0 : 20
            }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="font-script text-4xl text-gold-300 drop-shadow-md">{dateLine || 'Welcome'}</span>
          </motion.div>
          {/* spotlights */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,200,0.3) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(255,255,200,0.3) 0%, transparent 50%)'
            }}
            animate={{ opacity: phase === 'opening' ? 1 : 0 }}
            transition={{ duration: 1.5, delay: 0.6 }}
          />
        </div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap the curtains to open ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 7. COZY WINDOW ────────────────────────────────────────────────────────
  function WindowOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center" style={{ perspective: 1200 }}>
        {!reduced && <AmbientParticles count={8} />}
        <div className="relative h-64 w-56">
          {/* window frame */}
          <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-stone-600 to-stone-700 shadow-2xl p-2" />
          {/* window panes - left */}
          <motion.div
            className="absolute left-2 top-2 h-[calc(100%-4px)] w-[calc(50%-3px)] rounded bg-gradient-to-b from-slate-900 to-slate-800 shadow-inner"
            style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            animate={{ rotateY: phase === 'opening' ? -100 : 0, opacity: phase === 'opening' ? 0.3 : 1 }}
            transition={{ duration: 1.3, ease: [0.34, 1.56, 0.64, 1] }}
          />
          {/* window panes - right */}
          <motion.div
            className="absolute right-2 top-2 h-[calc(100%-4px)] w-[calc(50%-3px)] rounded bg-gradient-to-b from-slate-900 to-slate-800 shadow-inner"
            style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
            animate={{ rotateY: phase === 'opening' ? 100 : 0, opacity: phase === 'opening' ? 0.3 : 1 }}
            transition={{ duration: 1.3, ease: [0.34, 1.56, 0.64, 1] }}
          />
          {/* scene behind window - stars + moon */}
          <motion.div
            className="absolute inset-2 rounded bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900"
            animate={{ opacity: phase === 'opening' ? 1 : 0, scale: phase === 'opening' ? 1 : 0.95 }}
            transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* stars */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent), radial-gradient(1px 1px at 85% 60%, #fff 50%, transparent), radial-gradient(1px 1px at 10% 75%, #fff 50%, transparent), radial-gradient(1.5px 1.5px at 40% 40%, #fff 50%, transparent), radial-gradient(1px 1px at 80% 80%, #fff 50%, transparent)'
            }} />
            {/* moon */}
            <motion.div
              className="absolute right-8 top-8 h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-300 shadow-[0_0_30px_rgba(255,220,150,0.6)]"
              animate={{ scale: phase === 'opening' ? [0, 1.2, 1] : 0, opacity: phase === 'opening' ? 1 : 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 1.0 }}
            />
            {/* ambient light glow */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{
              background: 'linear-gradient(to top, rgba(255,220,150,0.3), transparent)'
            }} />
          </motion.div>
        </div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap the window to open ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 8. LIQUID GLASS ───────────────────────────────────────────────────────
  function LiquidGlassOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    const glassParticles = [
      { x: -45, y: -35, s: 12 }, { x: 50, y: -40, s: 8 }, { x: -30, y: -55, s: 10 },
      { x: 55, y: -30, s: 6 }, { x: -60, y: -25, s: 9 }, { x: 40, y: -50, s: 11 },
      { x: -20, y: -60, s: 7 }, { x: 60, y: -20, s: 8 }, { x: -50, y: -15, s: 5 },
      { x: 35, y: -45, s: 10 }, { x: -40, y: -20, s: 8 }, { x: 45, y: -55, s: 9 },
    ]

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={16} />}
        <motion.div
          className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/30 via-blush-100/20 to-blush-200/10 backdrop-blur-xl border border-white/30 shadow-2xl"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: phase === 'opening' ? [0, 1.1, 1] : 0,
            opacity: phase === 'opening' ? [0, 0.9, 0.8] : 0,
            borderWidth: phase === 'opening' ? '3px' : '1px',
            boxShadow: phase === 'opening'
              ? '0 0 60px 20px rgba(255,226,170,0.4), 0 20px 60px -10px rgba(0,0,0,0.3)'
              : '0 0 40px 10px rgba(255,226,170,0.2), 0 20px 40px -10px rgba(0,0,0,0.2)'
          }}
          transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* inner refractive ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-white/40"
            animate={{
              scale: phase === 'opening' ? [1, 1.05, 1] : 1,
              opacity: phase === 'opening' ? 0.6 : 0
            }}
            transition={{ duration: 3, repeat: Infinity, ease: [0.45, 0, 0.22, 1] }}
          />
          {/* caustic light pattern */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)',
              mixBlendMode: 'screen'
            }}
            animate={{
              scale: phase === 'opening' ? [0.8, 1.2, 1] : 0.8,
              opacity: phase === 'opening' ? [0, 0.4, 0.2] : 0,
              rotate: phase === 'opening' ? 180 : 0
            }}
            transition={{ duration: 4, repeat: Infinity, ease: [0.45, 0, 0.22, 1] }}
          />
          {/* floating glass particles */}
          {phase === 'opening' && !reduced && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {glassParticles.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/60 backdrop-blur-sm"
                  style={{
                    left: `calc(50% + ${p.x}%)`,
                    top: `calc(50% + ${p.y}%)`,
                    width: `${p.s}px`,
                    height: `${p.s}px`,
                    transformOrigin: 'center center'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.8, x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60 - 30 }}
                  transition={{ duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.5, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          )}
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap the glass ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 9. DREAMY FADE ────────────────────────────────────────────────────────
  function DreamyFadeOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    const dreamyOrbs = [
      { x: -40, y: -30, s: 80, d: 0 }, { x: 50, y: -40, s: 60, d: 0.3 },
      { x: -20, y: 40, s: 70, d: 0.15 }, { x: 45, y: 30, s: 50, d: 0.4 },
      { x: -50, y: 10, s: 55, d: 0.2 }, { x: 30, y: -50, s: 65, d: 0.35 },
    ]

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={14} />}
        <motion.div
          className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/80 via-blush-100 to-blush-200 shadow-lg"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: phase === 'opening' ? [0.5, 1.3, 1] : 0.5,
            opacity: phase === 'opening' ? [0, 1, 0.85] : 0,
            filter: phase === 'opening' ? 'blur(0px)' : 'blur(4px)'
          }}
          transition={{ duration: 3.0, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* inner glow */}
          <div className="absolute inset-0 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)' }} />
          {/* floating orbs */}
          {phase === 'opening' && !reduced && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {dreamyOrbs.map((o, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-gradient-to-br from-blush-300/40 to-blush-100/20"
                  style={{
                    left: `calc(50% + ${o.x}%)`,
                    top: `calc(50% + ${o.y}%)`,
                    width: `${o.s}px`,
                    height: `${o.s}px`,
                    transformOrigin: 'center center'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1, 0.8], opacity: [0, 0.6, 0.3], x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 }}
                  transition={{ duration: 3 + Math.random() * 2, delay: o.d + Math.random() * 0.5, ease: [0.45, 0, 0.22, 1] }}
                />
              ))}
            </div>
          )}
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to enter ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 10. CINEMATIC ZOOM ────────────────────────────────────────────────────
  function CinematicOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center" style={{ perspective: 1200 }}>
        {!reduced && <AmbientParticles count={12} />}
        <motion.div
          className="relative h-64 w-64 overflow-hidden rounded-lg shadow-2xl"
          initial={{ scale: 0.3, opacity: 0, rotateY: 15, z: -200 }}
          animate={{
            scale: phase === 'opening' ? [0.3, 1.15, 1] : 0.3,
            opacity: phase === 'opening' ? [0, 1, 1] : 0,
            rotateY: phase === 'opening' ? [15, -3, 0] : 15,
            z: phase === 'opening' ? 0 : -200,
            boxShadow: phase === 'opening'
              ? '0 0 80px 30px rgba(255,226,170,0.3), 0 30px 80px -20px rgba(0,0,0,0.4)'
              : '0 20px 40px -10px rgba(0,0,0,0.2)'
          }}
          transition={{ duration: 3.0, ease: [0.32, 0.6, 0.28, 1] }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blush-200 to-blush-300" />
          {/* parallax layer */}
          <motion.div
            className="absolute inset-0 bg-white/20 backdrop-blur"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: phase === 'opening' ? [0, 0.6, 0] : 0,
              scale: phase === 'opening' ? [1.1, 1.0, 0.9] : 1.1,
              rotateY: phase === 'opening' ? [10, -2, 0] : 10
            }}
            transition={{ duration: 2.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.25) 100%)'
          }} />
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to zoom in ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 11. PARTICLE VORTEX ───────────────────────────────────────────────────
  function ParticleOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    // Generate deterministic particle positions
    const genParticles = (count: number, seed: number) => {
      const r = seeded(seed)
      return Array.from({ length: count }, (_, i) => ({
        x: (r() - 0.5) * 200,
        y: (r() - 0.5) * 200,
        size: 4 + r() * 8,
        dur: 1.5 + r() * 2,
        delay: r() * 0.8,
        rot: r() * 360,
        color: ['#ffd93d', '#ff6b9d', '#6bcb77', '#4d96ff', '#ff9f43'][Math.floor(r() * 5)]
      }))
    }

    const particles = genParticles(30, 42)

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={20} />}
        <motion.div
          className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300"
          animate={{ scale: phase === 'opening' ? [0.5, 1.2, 1] : 0.5 }}
          transition={{ duration: 2.5, ease: [0.32, 0.6, 0.28, 1] }}
        >
          {/* vortex particles */}
          {phase === 'opening' && !reduced && (
            <motion.div
              className="absolute inset-0"
              initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
              animate={{
                rotate: 360,
                scale: [0.5, 1.5, 1],
                opacity: [0, 1, 0.7]
              }}
              transition={{ duration: 3, ease: [0.45, 0, 0.22, 1] }}
              style={{
                background: 'radial-gradient(circle, transparent 30%, rgba(255,215,0,0.2) 45%, rgba(255,215,0,0.05) 60%)',
                mixBlendMode: 'screen'
              }}
            />
          )}
          {/* individual particles */}
          {phase === 'opening' && !reduced && (
            <div className="absolute inset-0">
              {particles.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    background: p.color,
                    transformOrigin: 'center center'
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: p.rot }}
                  animate={{
                    x: phase === 'opening' ? p.x : 0,
                    y: phase === 'opening' ? p.y : 0,
                    scale: phase === 'opening' ? 1 : 0,
                    opacity: phase === 'opening' ? [0, 1, 0.5] : 0,
                    rotate: phase === 'opening' ? p.rot + 720 : p.rot
                  }}
                  transition={{ duration: p.dur, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </div>
          )}
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to gather ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 12. BUBBLE POP ────────────────────────────────────────────────────────
  function BubblePopOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    const bubbles = [
      { x: -35, y: -20, s: 28, d: 0 }, { x: 40, y: -30, s: 22, d: 0.1 },
      { x: -20, y: -45, s: 18, d: 0.05 }, { x: 50, y: -15, s: 24, d: 0.15 },
      { x: -50, y: -10, s: 20, d: 0.08 }, { x: 30, y: -40, s: 26, d: 0.12 },
      { x: -15, y: -50, s: 16, d: 0.03 }, { x: 45, y: -25, s: 20, d: 0.18 },
      { x: -40, y: -35, s: 22, d: 0.07 }, { x: 25, y: -30, s: 18, d: 0.14 },
      { x: -30, y: -25, s: 24, d: 0.09 }, { x: 35, y: -50, s: 16, d: 0.16 },
      { x: -10, y: -35, s: 20, d: 0.02 }, { x: 55, y: -20, s: 14, d: 0.11 },
      { x: -25, y: -15, s: 26, d: 0.13 }, { x: 15, y: -45, s: 18, d: 0.04 },
    ]

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={16} />}
        <motion.div
          className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300"
          animate={{ scale: phase === 'opening' ? [0.8, 1.1, 1] : 0.8 }}
          transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
        >
          {phase === 'opening' && !reduced && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              {bubbles.map((b, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-white/40 border border-white/60 backdrop-blur-sm"
                  style={{
                    left: `calc(50% + ${b.x}%)`,
                    top: `calc(50% + ${b.y}%)`,
                    width: `${b.s}px`,
                    height: `${b.s}px`,
                    transformOrigin: 'center center'
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 1.5, 0],
                    opacity: [0, 0.8, 0.4, 0],
                    x: (Math.random() - 0.5) * 30,
                    y: (Math.random() - 0.5) * 30 - 40
                  }}
                  transition={{ duration: 1.8, delay: b.d + Math.random() * 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                />
              ))}
            </div>
          )}
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to pop ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 13. SLIDING PANELS ────────────────────────────────────────────────────
  function SlidingPanelsOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    return (
      <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
        {!reduced && <AmbientParticles count={10} />}
        <div className="relative h-64 w-64 overflow-hidden rounded-lg shadow-2xl">
          {/* left panel */}
          <motion.div
            className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-blush-200 to-blush-300"
            animate={{
              x: phase === 'opening' ? '-110%' : 0,
              scaleX: phase === 'opening' ? [1, 0.95, 1] : 1,
              opacity: phase === 'opening' ? 0.9 : 1
            }}
            transition={{ duration: 1.4, ease: [0.32, 0.6, 0.28, 1] }}
          >
            {/* panel texture */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(90deg, transparent 45%, rgba(255,255,255,0.2) 50%, transparent 55%)'
            }} />
          </motion.div>
          {/* right panel */}
          <motion.div
            className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blush-200 to-blush-300"
            animate={{
              x: phase === 'opening' ? '110%' : 0,
              scaleX: phase === 'opening' ? [1, 0.95, 1] : 1,
              opacity: phase === 'opening' ? 0.9 : 1
            }}
            transition={{ duration: 1.4, ease: [0.32, 0.6, 0.28, 1] }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(-90deg, transparent 45%, rgba(255,255,255,0.2) 50%, transparent 55%)'
            }} />
          </motion.div>
          {/* center reveal */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/90 via-blush-100 to-blush-200"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{
              opacity: phase === 'opening' ? 1 : 0,
              scale: phase === 'opening' ? 1 : 0.85,
              y: phase === 'opening' ? 0 : 30
            }}
            transition={{ duration: 1.0, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="font-script text-3xl text-blush-500">{dateLine || 'Welcome'}</span>
          </motion.div>
          {/* divider line */}
          <motion.div
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-gold-400 to-transparent"
            animate={{
              scaleY: phase === 'opening' ? [1, 0] : 1,
              opacity: phase === 'opening' ? [1, 0] : 1
            }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
        </div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to slide open ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 14. HEART FORMATION ───────────────────────────────────────────────────
  function HeartOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: CommonProps) {
    const open = () => {
      if (phase !== 'idle') return
      markDoorSeen()
      unlockSfx()
      onEnter?.()
      setPhase('opening')
    }

    const hearts = [
      { angle: 0, r: 80, s: 32, d: 0 }, { angle: 30, r: 75, s: 28, d: 0.05 },
      { angle: 60, r: 70, s: 24, d: 0.1 }, { angle: 90, r: 85, s: 30, d: 0.15 },
      { angle: 120, r: 80, s: 26, d: 0.2 }, { angle: 150, r: 75, s: 22, d: 0.25 },
      { angle: 180, r: 85, s: 28, d: 0.3 }, { angle: 210, r: 80, s: 24, d: 0.35 },
      { angle: 240, r: 75, s: 30, d: 0.4 }, { angle: 270, r: 70, s: 26, d: 0.45 },
      { angle: 300, r: 85, s: 22, d: 0.5 }, { angle: 330, r: 80, s: 28, d: 0.55 },
    ]

    return (
      <div className="relative flex flex-col items-center">
        {!reduced && <AmbientParticles count={18} />}
        <motion.div
          className="relative h-48 w-48"
          animate={{ scale: phase === 'opening' ? [0.3, 1.2, 1] : 0.3 }}
          transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {phase === 'opening' && !reduced && (
            <div className="absolute inset-0">
              {hearts.map((h, i) => (
                <motion.div
                  key={i}
                  className="absolute text-blush-400"
                  style={{
                    left: '50%',
                    top: '50%',
                    fontSize: `${h.s}px`,
                    transform: `translate(-50%, -50%) rotate(${h.angle}deg) translateY(-${h.r}px) rotate(${-h.angle}deg)`
                  }}
                  initial={{ scale: 0, opacity: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0.8],
                    opacity: [0, 1, 0.6],
                    y: [0, -10, 0],
                    rotate: [0, h.angle * 0.1, 0]
                  }}
                  transition={{ duration: 2.0, delay: h.d + Math.random() * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  ♡
                </motion.div>
              ))}
              {/* central heart burst */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1.5, 1],
                  opacity: [0, 1, 0.9]
                }}
                transition={{ duration: 1.5, delay: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Heart className="text-blush-500 drop-shadow-[0_0_10px_rgba(255,182,193,0.6)]" size={60} fill="currentColor" />
              </motion.div>
            </div>
          )}
        </motion.div>
        <motion.p
          className="mt-6 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200"
          animate={{ opacity: phase === 'idle' ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          Tap to form hearts ♡
        </motion.p>
        <button
          type="button"
          onClick={open}
          disabled={phase !== 'idle'}
          autoFocus
          className="absolute inset-0 z-30 cursor-pointer outline-none disabled:cursor-default"
        />
      </div>
    )
  }

  // ─── 15. DISABLED ──────────────────────────────────────────────────────────
  function DisabledOpening({ finish }: { finish: () => void }) {
    useEffect(() => {
      finish()
    }, [finish])
    return null
  }

  // ─── Render selected animation ─────────────────────────────────────────────
  const renderOpening = () => {
    const common = {
      phase,
      setPhase,
      reduced,
      finish,
      dateLine,
      sound,
      onEnter
    }

    switch (openingKind) {
      case 'door':
        return <DoorOpening {...common} />
      case 'envelope':
        return <EnvelopeOpening {...common} />
      case 'gift':
        return <GiftOpening {...common} />
      case 'book':
        return <BookOpening {...common} />
      case 'polaroid':
        return <PolaroidOpening {...common} />
      case 'curtain':
        return <CurtainOpening {...common} />
      case 'window':
        return <WindowOpening {...common} />
      case 'liquid-glass':
        return <LiquidGlassOpening {...common} />
      case 'dreamy-fade':
        return <DreamyFadeOpening {...common} />
      case 'cinematic':
        return <CinematicOpening {...common} />
      case 'particle':
        return <ParticleOpening {...common} />
      case 'bubble-pop':
        return <BubblePopOpening {...common} />
      case 'sliding-panels':
        return <SlidingPanelsOpening {...common} />
      case 'heart':
        return <HeartOpening {...common} />
      case 'disabled':
        return <DisabledOpening finish={finish} />
      default:
        return <DoorOpening {...common} />
    }
  }

  return (
    <div
      role={phase === 'welcome' || phase === 'leaving' ? undefined : 'dialog'}
      aria-modal={phase === 'welcome' || phase === 'leaving' ? undefined : true}
      aria-label="Welcome to Our Little World"
      className={`fixed inset-0 z-[100] overflow-hidden ${phase === 'welcome' || phase === 'leaving' ? 'pointer-events-none' : ''}`}
    >
      <AnimatePresence>
        {phase !== 'leaving' && (
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
              style={{ backgroundImage: 'radial-gradient(1.5px 1.5px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 85% 60%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 10% 75%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 60% 85%, #fff 50%, transparent 51%)' }} />
            <div aria-hidden className="pointer-events-none absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at 50% 55%, rgba(255,226,170,0.45), transparent 60%)' }} />

            <motion.div
              className="relative z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              {renderOpening()}
            </motion.div>

            <motion.p
              className="relative z-10 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200 mt-6"
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
        {phase === 'welcome' && (
          <motion.div
            key="welcome"
            className="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
      {phase !== 'leaving' && (
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

// Stash seeded function for particle generation
function seeded(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}