import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Heart, Volume2, VolumeX } from 'lucide-react'
import { useReducedMotion } from '../../lib/a11y'
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

/** Shared timing constants */
const SWING = 2.5

/** Base door animation - the original magic door */
function DoorOpening({ phase, setPhase, reduced, onOpen, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  onOpen: () => void
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles />}
      <div className="relative z-10">
        <LittleWorldDoor open={phase !== 'idle'} reduced={reduced} onOpen={onOpen} dateLine={dateLine} duration={SWING} />
      </div>
      {phase === 'opening' && !reduced && <DoorBurst />}
      <motion.p
        className="relative z-10 text-sm font-medium tracking-wide text-blush-600 dark:text-blush-200 mt-6"
        animate={{ opacity: phase === 'idle' ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        Tap the door to enter ♡
      </motion.p>
    </div>
  )
}

/** Envelope opening - letter slides out */
function EnvelopeOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: 900 }}>
      {!reduced && <AmbientParticles count={12} />}
      <div className="relative mx-auto aspect-[3/2] w-full max-w-md" style={{ perspective: 900 }}>
        {/* back */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-300 shadow-soft dark:from-blush-600/60 dark:to-blush-600/40" />
        {/* letter */}
        <motion.div
          className="absolute inset-x-4 top-3 flex h-[85%] items-start justify-center overflow-hidden rounded-xl bg-cream-50 p-3 text-center shadow dark:bg-night-800"
          initial={false}
          animate={{ y: phase === 'opening' || phase === 'welcome' ? -50 : 0 }}
          transition={{ type: 'spring', damping: 16, delay: phase === 'opening' ? 0.6 : 0 }}
        >
          <span className="font-script text-lg text-blush-500">{dateLine || 'Our Little World'}</span>
        </motion.div>
        {/* front pocket */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-100 to-blush-200 dark:from-blush-600/30 dark:to-blush-600/20" style={{ clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)' }} />
        {/* flap */}
        <motion.div
          className="absolute inset-x-0 top-0 h-[55%] rounded-t-2xl bg-gradient-to-b from-blush-300 to-blush-200 dark:from-blush-600/70 dark:to-blush-600/50"
          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
          initial={false}
          animate={{ rotateX: phase === 'opening' ? 180 : 0, zIndex: phase === 'opening' ? 0 : 5 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        {/* seal */}
        <motion.div
          className="absolute left-1/2 top-[48%] z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blush-500 text-white shadow"
          animate={{ scale: phase === 'opening' ? 0 : 1, opacity: phase === 'opening' ? 0 : 1 }}
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

/** Gift box opening - ribbon unties, box pops open */
function GiftOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={14} />}
      <div className="relative h-48 w-48">
        {/* box base */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-blush-200 to-blush-300 shadow-soft dark:from-blush-600/60 dark:to-blush-600/40"
          animate={{ scale: phase === 'opening' ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 1.5 }}
        />
        {/* lid */}
        <motion.div
          className="absolute inset-0 rounded-t-lg bg-gradient-to-br from-blush-100 to-blush-200 dark:from-blush-600/30 dark:to-blush-600/20"
          animate={{
            rotateX: phase === 'opening' ? -90 : 0,
            y: phase === 'opening' ? -60 : 0,
            zIndex: phase === 'opening' ? 0 : 10
          }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
        />
        {/* ribbon */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-4 bg-gold-400"
          animate={{ scaleY: phase === 'opening' ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        />
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-4 bg-gold-400"
          animate={{ scaleX: phase === 'opening' ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        />
        {/* bow */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-16 w-20 bg-gold-400 rounded-lg"
          animate={{ rotate: phase === 'opening' ? 180 : 0, scale: phase === 'opening' ? 0 : 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />
        {/* confetti burst */}
        {phase === 'opening' && !reduced && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
                style={{
                  background: ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9f43'][i % 5],
                  transform: `translate(-50%, -50%)`
                }}
                animate={{ x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 - 100, opacity: 0, rotate: Math.random() * 360 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
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

/** Story book opening */
function BookOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
      {!reduced && <AmbientParticles count={12} />}
      <div className="relative mx-auto h-48 w-64" style={{ perspective: 1000 }}>
        {/* book cover */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-32 rounded-r-lg bg-gradient-to-b from-blush-400 to-blush-500 shadow-xl"
          style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: phase === 'opening' ? -160 : 0,
            zIndex: phase === 'opening' ? 0 : 10
          }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-script text-2xl text-cream-50">{dateLine || 'Our Story'}</span>
          </div>
        </motion.div>
        {/* book back cover */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-32 rounded-l-lg bg-gradient-to-b from-blush-300 to-blush-400 shadow-inner" />
        {/* pages */}
        <motion.div
          className="absolute left-1/2 top-4 -translate-x-1/2 h-[90%] w-[28rem] bg-cream-50 rounded-r shadow-inner dark:bg-night-800"
          style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
          animate={{ opacity: phase === 'opening' ? 1 : 0.3, rotateY: phase === 'opening' ? -20 : 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
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

/** Polaroid photo developing */
function PolaroidOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 3000)
      setTimeout(() => setPhase('leaving'), 4500)
      setTimeout(finish, 5500)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={10} />}
      <motion.div
        className="relative h-64 w-52 bg-white rounded-t-lg shadow-xl p-2 pb-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: phase === 'opening' ? 1 : 0.8,
          opacity: phase === 'opening' ? 1 : 0,
          filter: phase === 'opening' ? 'grayscale(0%) sepia(0%)' : 'grayscale(100%) sepia(100%) brightness(2)'
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <div className="aspect-square bg-gradient-to-br from-stone-200 to-stone-300 rounded-t-lg" />
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

/** Stage curtains opening */
function CurtainOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
      {!reduced && <AmbientParticles count={10} />}
      <div className="relative h-64 w-full max-w-2xl overflow-hidden rounded-t-xl bg-gradient-to-b from-blush-900 via-blush-800 to-blush-900 shadow-2xl">
        {/* left curtain */}
        <motion.div
          className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-blush-900 via-blush-700 to-blush-900 shadow-xl"
          animate={{ x: phase === 'opening' ? '-100%' : 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        {/* right curtain */}
        <motion.div
          className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blush-900 via-blush-700 to-blush-900 shadow-xl"
          animate={{ x: phase === 'opening' ? '100%' : 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
        {/* gold trim */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-1 bg-gradient-to-b from-gold-400 to-gold-600" />
        {/* stage content */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: phase === 'opening' ? 1 : 0, scale: phase === 'opening' ? 1 : 0.9 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <span className="font-script text-4xl text-gold-300">{dateLine || 'Welcome'}</span>
        </motion.div>
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

/** Cozy window opening */
function WindowOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
      {!reduced && <AmbientParticles count={8} />}
      <div className="relative h-64 w-56">
        {/* window frame */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-stone-600 to-stone-700 shadow-2xl p-2" />
        {/* window panes - left */}
        <motion.div
          className="absolute left-2 top-2 h-[calc(100%-4px)] w-[calc(50%-3px)] rounded bg-gradient-to-b from-slate-900 to-slate-800 shadow-inner"
          style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
          animate={{ rotateY: phase === 'opening' ? -90 : 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* window panes - right */}
        <motion.div
          className="absolute right-2 top-2 h-[calc(100%-4px)] w-[calc(50%-3px)] rounded bg-gradient-to-b from-slate-900 to-slate-800 shadow-inner"
          style={{ transformOrigin: 'right center', transformStyle: 'preserve-3d' }}
          animate={{ rotateY: phase === 'opening' ? 90 : 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        {/* stars behind */}
        <motion.div
          className="absolute inset-2 rounded bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-900"
          animate={{ opacity: phase === 'opening' ? 1 : 0, scale: phase === 'opening' ? 1 : 0.9 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent), radial-gradient(1px 1px at 85% 60%, #fff 50%, transparent), radial-gradient(1px 1px at 10% 75%, #fff 50%, transparent)'
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

/** Liquid glass expanding */
function LiquidGlassOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2000)
      setTimeout(() => setPhase('leaving'), 3500)
      setTimeout(finish, 4500)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={16} />}
      <motion.div
        className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/30 via-blush-100/20 to-blush-200/10 backdrop-blur-xl border border-white/30 shadow-2xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: phase === 'opening' ? 2.5 : 0,
          opacity: phase === 'opening' ? [0, 0.8, 0] : 0,
          borderWidth: phase === 'opening' ? '2px' : '1px'
        }}
        transition={{ duration: 2.5, ease: 'easeOut' }}
      >
        <motion.div
          className="absolute inset-0 rounded-full border border-white/40"
          animate={{ scale: phase === 'opening' ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
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

/** Dreamy fade */
function DreamyFadeOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={14} />}
      <motion.div
        className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/80 via-blush-100 to-blush-200 shadow-lg"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{
          scale: phase === 'opening' ? [0.5, 1.5, 1] : 0.5,
          opacity: phase === 'opening' ? [0, 1, 0] : 0
        }}
        transition={{ duration: 3, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)' }} />
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

/** Cinematic zoom */
function CinematicOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 3000)
      setTimeout(() => setPhase('leaving'), 4500)
      setTimeout(finish, 5500)
    }
  }

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
      {!reduced && <AmbientParticles count={12} />}
      <motion.div
        className="relative h-64 w-64 overflow-hidden rounded-lg shadow-2xl"
        initial={{ scale: 0.3, opacity: 0, rotateY: 15 }}
        animate={{
          scale: phase === 'opening' ? [0.3, 1.2, 1] : 0.3,
          opacity: phase === 'opening' ? [0, 1, 1] : 0,
          rotateY: phase === 'opening' ? [15, -5, 0] : 15
        }}
        transition={{ duration: 3, ease: 'easeOut' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blush-200 to-blush-300" />
        <motion.div
          className="absolute inset-0 bg-white/20 backdrop-blur"
          animate={{ opacity: phase === 'opening' ? [0, 0.5, 0] : 0 }}
          transition={{ duration: 2, delay: 0.5 }}
        />
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

/** Particle vortex */
function ParticleOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 3000)
      setTimeout(() => setPhase('leaving'), 4500)
      setTimeout(finish, 5500)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={20} />}
      <motion.div
        className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300"
        animate={{ scale: phase === 'opening' ? [0.5, 1.2, 1] : 0.5 }}
        transition={{ duration: 2.5 }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle, transparent 40%, rgba(255,215,0,0.3) 50%, rgba(255,215,0,0.1) 60%)' }}
          animate={{ rotate: phase === 'opening' ? 360 : 0, scale: phase === 'opening' ? [0.5, 1.5, 1] : 0.5, opacity: phase === 'opening' ? [0, 1, 0] : 0 }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
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

/** Bubble pop */
function BubblePopOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={16} />}
      <motion.div
        className="relative h-48 w-48 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300"
        animate={{ scale: phase === 'opening' ? [0.3, 1, 0] : 0.3 }}
        transition={{ duration: 2.5 }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/60"
            style={{
              left: `${20 + Math.random() * 60}%`,
              top: `${20 + Math.random() * 60}%`,
              width: `${10 + Math.random() * 20}%`,
              height: `${10 + Math.random() * 20}%`,
              transformOrigin: 'center center'
            }}
            animate={{
              scale: phase === 'opening' ? [0, 3, 0] : 0,
              opacity: phase === 'opening' ? [0, 0.8, 0] : 0
            }}
            transition={{ duration: 2, delay: i * 0.15, ease: 'easeOut' }}
          />
        ))}
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

/** Sliding panels */
function SlidingPanelsOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2000)
      setTimeout(() => setPhase('leaving'), 3500)
      setTimeout(finish, 4500)
    }
  }

  return (
    <div className="relative flex flex-col items-center" style={{ perspective: 1000 }}>
      {!reduced && <AmbientParticles count={10} />}
      <div className="relative h-64 w-64 overflow-hidden rounded-lg shadow-2xl">
        {/* left panel */}
        <motion.div
          className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-blush-200 to-blush-300"
          animate={{ x: phase === 'opening' ? '-100%' : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        {/* right panel */}
        <motion.div
          className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blush-200 to-blush-300"
          animate={{ x: phase === 'opening' ? '100%' : 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
        {/* center content */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/90 via-blush-100 to-blush-200"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: phase === 'opening' ? 1 : 0, scale: phase === 'opening' ? 1 : 0.8 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <span className="font-script text-3xl text-blush-500">{dateLine || 'Welcome'}</span>
        </motion.div>
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

/** Heart formation */
function HeartOpening({ phase, setPhase, reduced, finish, dateLine, sound, onEnter }: {
  phase: Phase
  setPhase: (p: Phase) => void
  reduced: boolean
  finish: () => void
  dateLine: string | null
  sound: boolean
  onEnter?: () => void
}) {
  const open = () => {
    if (phase !== 'idle') return
    markDoorSeen()
    unlockSfx()
    onEnter?.()
    setPhase('opening')
    if (reduced) {
      setTimeout(() => setPhase('welcome'), 450)
      setTimeout(() => setPhase('leaving'), 2000)
      setTimeout(finish, 2600)
    } else {
      setTimeout(() => setPhase('welcome'), 2500)
      setTimeout(() => setPhase('leaving'), 4000)
      setTimeout(finish, 5000)
    }
  }

  return (
    <div className="relative flex flex-col items-center">
      {!reduced && <AmbientParticles count={18} />}
      <motion.div
        className="relative h-48 w-48"
        animate={{ scale: phase === 'opening' ? [0.3, 1.2, 1] : 0.3 }}
        transition={{ duration: 2.5 }}
      >
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-blush-400"
            style={{
              left: '50%',
              top: '50%',
              fontSize: '2rem',
              transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-60px) rotate(${-i * 30}deg)`
            }}
            animate={{
              scale: phase === 'opening' ? [0, 1, 0] : 0,
              opacity: phase === 'opening' ? [0, 1, 0] : 0,
              y: phase === 'opening' ? [0, -20, 0] : 0
            }}
            transition={{ duration: 2, delay: i * 0.08, ease: 'easeInOut' }}
          >
            ♡
          </motion.div>
        ))}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: phase === 'opening' ? [0, 1.5, 1] : 0, opacity: phase === 'opening' ? [0, 1, 0] : 0 }}
          transition={{ duration: 2, delay: 1, ease: 'easeOut' }}
        >
          <Heart className="text-blush-500" size={60} fill="currentColor" />
        </motion.div>
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

/** Disabled - no intro */
function DisabledOpening({ finish }: { finish: () => void }) {
  // Just call finish immediately - no animation shown
  // The useEffect below runs once on mount
  return null
}

export function OpeningDispatcher({ openingKind, onDone, onEnter }: OpeningDispatcherProps) {
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

  const dateText = formatCreatedOn(SITE_CREATED_ON)
  const dateLine = dateText ? `Our Little World began on ${dateText}` : null
  const showScene = phase === 'idle' || phase === 'opening'
  const passThrough = phase === 'welcome' || phase === 'leaving'

  // Handle disabled - skip straight to done
  useEffect(() => {
    if (openingKind === 'disabled' && phase === 'idle') {
      finish()
    }
  }, [openingKind, phase, finish])

  // Escape skips at any point
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') finish() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [finish])

  const toggleSound = () => { const v = !sound; setSound(v); writeDoorSound(v) }

  const renderOpening = () => {
    const commonProps = {
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
        return <DoorOpening {...commonProps} onOpen={() => {
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
        }} />
      case 'envelope':
        return <EnvelopeOpening {...commonProps} />
      case 'gift':
        return <GiftOpening {...commonProps} />
      case 'book':
        return <BookOpening {...commonProps} />
      case 'polaroid':
        return <PolaroidOpening {...commonProps} />
      case 'curtain':
        return <CurtainOpening {...commonProps} />
      case 'window':
        return <WindowOpening {...commonProps} />
      case 'liquid-glass':
        return <LiquidGlassOpening {...commonProps} />
      case 'dreamy-fade':
        return <DreamyFadeOpening {...commonProps} />
      case 'cinematic':
        return <CinematicOpening {...commonProps} />
      case 'particle':
        return <ParticleOpening {...commonProps} />
      case 'bubble-pop':
        return <BubblePopOpening {...commonProps} />
      case 'sliding-panels':
        return <SlidingPanelsOpening {...commonProps} />
      case 'heart':
        return <HeartOpening {...commonProps} />
      case 'disabled':
        return <DisabledOpening finish={finish} />
      default:
        return <DoorOpening {...commonProps} onOpen={() => {
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
        }} />
    }
  }

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
              {renderOpening()}
            </div>
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
            {sound ? <span>🔊</span> : <span>🔇</span>}
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