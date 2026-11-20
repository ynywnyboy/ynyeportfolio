import React from 'react'
import { motion } from 'motion/react'
import { Heart, Loader2, RotateCcw, SkipForward, Check, X } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { OPENING_OPTIONS, type OpeningKind } from '../lib/opening'

interface Props {
  kind: OpeningKind
  speed: number
  className?: string
}

export function OpeningPreview({ kind, speed, className }: Props) {
  const { theme } = useSite()
  const accent = theme.accent || '#e8899f'
  const isDark = theme.mode === 'dark'

  // Simplified visual preview based on animation type
  const renderPreview = () => {
    switch (kind) {
      case 'door':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-24 rounded-lg bg-gradient-to-b from-white/80 via-blush-200 to-blush-300 shadow-lg" />
            <p className="text-sm text-stone-600">Classic door swings open</p>
          </div>
        )
      case 'envelope':
        return (
          <div className="flex flex-col items-center gap-4">
            <motion.div
              className="h-24 w-32 rounded-lg bg-gradient-to-br from-white/90 via-blush-100 to-blush-200 shadow-md"
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <p className="text-sm text-stone-600">Envelope slides & unfolds</p>
          </div>
        )
      case 'gift':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-28 w-28">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/80 via-blush-200 to-blush-300" />
              <div className="absolute -bottom-2 -right-2 h-12 w-12 rotate-45 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full shadow-lg" />
            </div>
            <p className="text-sm text-stone-600">Gift box pops open</p>
          </div>
        )
      case 'book':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-40" style={{ perspective: 1000 }}>
              <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-20 rounded-r-lg bg-gradient-to-b from-blush-400 to-blush-500 shadow-xl" style={{ transformOrigin: 'left center' }} />
              <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-20 rounded-l-lg bg-gradient-to-b from-blush-300 to-blush-400 shadow-inner" />
              <div className="absolute left-1/2 top-4 -translate-x-1/2 h-[90%] w-[90%] max-w-[16rem] bg-cream-50 rounded-r shadow-inner" style={{ transformOrigin: 'left center' }} />
            </div>
            <p className="text-sm text-stone-600">Story book opens</p>
          </div>
        )
      case 'polaroid':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-40 w-32 bg-white rounded-t-lg shadow-xl p-2 pb-10">
              <div className="aspect-square bg-gradient-to-br from-stone-100 via-stone-200 to-stone-300 rounded-t-lg" />
              <div className="mt-2 text-center text-xs text-stone-600 font-script">Developing...</div>
            </div>
            <p className="text-sm text-stone-600">Photo develops</p>
          </div>
        )
      case 'curtain':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-40 overflow-hidden rounded-t-xl bg-gradient-to-b from-blush-900 via-blush-800 to-blush-900 shadow-2xl">
              <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-blush-900 via-blush-700 to-blush-900" style={{ transformOrigin: 'left center' }} />
              <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-blush-900 via-blush-700 to-blush-900" style={{ transformOrigin: 'right center' }} />
              <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-px bg-gradient-to-b from-transparent via-gold-400 to-transparent" />
            </div>
            <p className="text-sm text-stone-600">Curtains part</p>
          </div>
        )
      case 'window':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-28" style={{ perspective: 1000 }}>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-b from-stone-600 to-stone-700 shadow-2xl p-2" />
              <div className="absolute left-2 top-2 h-[calc(100%-4px)] w-[calc(50%-3px)] rounded bg-gradient-to-b from-slate-900 to-slate-800" style={{ transformOrigin: 'left center' }} />
              <div className="absolute right-2 top-2 h-[calc(100%-4px)] w-[calc(50%-3px)] rounded bg-gradient-to-b from-slate-900 to-slate-800" style={{ transformOrigin: 'right center' }} />
            </div>
            <p className="text-sm text-stone-600">Window opens</p>
          </div>
        )
      case 'liquid-glass':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-white/90 via-blush-200/50 to-blush-300/30 backdrop-blur-md shadow-2xl">
              <div className="absolute inset-0 rounded-full border border-white/40" />
            </div>
            <p className="text-sm text-stone-600">Bubbly glass expands</p>
          </div>
        )
      case 'dreamy-fade':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-white/80 via-blush-100 to-blush-200 shadow-lg">
              <div className="absolute inset-0 rounded-full opacity-50" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)' }} />
            </div>
            <p className="text-sm text-stone-600">Soft glow & fade</p>
          </div>
        )
      case 'cinematic':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blush-200 to-blush-300" />
              <div className="absolute inset-0" style={{ transform: 'perspective(1000px) rotateY(5deg) scale(1.1)', opacity: 0.3 }}>
                <div className="h-full w-full bg-white/20 backdrop-blur" />
              </div>
            </div>
            <p className="text-sm text-stone-600">Depth zoom effect</p>
          </div>
        )
      case 'particle':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, transparent 40%, rgba(255,215,0,0.3) 50%, rgba(255,215,0,0.1) 60%)' }} />
            </div>
            <p className="text-sm text-stone-600">Particles gather</p>
          </div>
        )
      case 'bubble-pop':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6), transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.4), transparent 60%)' }} />
            </div>
            <p className="text-sm text-stone-600">Bubbles expand</p>
          </div>
        )
      case 'sliding-panels':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32 overflow-hidden rounded-lg shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/90 via-blush-200 to-blush-300" />
              <div className="absolute inset-0" style={{ transform: 'translateX(-50%) scale(0.9)', opacity: 0.5 }}>
                <div className="h-full w-full bg-white/20 backdrop-blur" />
              </div>
            </div>
            <p className="text-sm text-stone-600">Panels slide apart</p>
          </div>
        )
      case 'heart':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/80 via-blush-200 to-blush-300" />
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle, rgba(255,192,203,0.4) 0%, transparent 60%)' }} />
            </div>
            <p className="text-sm text-stone-600">Hearts converge</p>
          </div>
        )
      case 'disabled':
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-lg bg-white/50 shadow-sm flex items-center justify-center border border-stone-200">
              <p className="text-xs text-stone-500">No intro</p>
            </div>
            <p className="text-sm text-stone-600">Direct open</p>
          </div>
        )
      default:
        return (
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-white/80 via-blush-200 to-blush-300 shadow-lg" />
            <p className="text-sm text-stone-600">Custom animation</p>
          </div>
        )
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-white/60 dark:bg-night-800/60 backdrop-blur-md shadow-soft ${className}`}>
      <div className="text-center mb-4">
        <h3 className="h-display text-xl mb-2">{OPENING_OPTIONS.find(o => o.id === kind)?.label}</h3>
        <p className="text-sm text-stone-500 max-w-xs">{OPENING_OPTIONS.find(o => o.id === kind)?.description}</p>
      </div>
      {renderPreview()}
      <div className="mt-4 w-full max-w-xs">
        <div className="flex justify-between text-xs text-stone-500 mb-1">
          <span>Slow</span>
          <span>Fast</span>
        </div>
        <div className="relative h-2 bg-stone-200 dark:bg-white/20 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blush-400 to-blush-600 rounded-full" style={{ width: `${(speed - 0.5) / 1.5 * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-stone-500 mt-1">
          <span>0.5×</span>
          <span>2.0×</span>
        </div>
      </div>
    </div>
  )
}
