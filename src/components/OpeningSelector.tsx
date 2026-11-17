import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Settings2 } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { sanitizeAppearance } from '../lib/appearance'
import { OPENING_OPTIONS, type OpeningKind } from '../lib/opening'
import { OpeningPreview } from './OpeningPreview'

interface Props {
  className?: string
}

export function OpeningSelector({ className }: Props) {
  const { theme, updateTheme } = useSite()
  const currentOpening = theme.appearance.opening.kind
  const currentSpeed = theme.appearance.opening.speed
  const [previewKind, setPreviewKind] = React.useState<OpeningKind>(currentOpening)
  const [previewSpeed, setPreviewSpeed] = React.useState(currentSpeed)
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const selectAnimation = (kind: OpeningKind) => {
    setPreviewKind(kind)
    updateTheme({ appearance: sanitizeAppearance({ ...theme.appearance, opening: { kind, speed: previewSpeed } }) }, { immediate: true, quiet: true })
  }

  const setSpeed = (speed: number) => {
    setPreviewSpeed(speed)
    updateTheme({ appearance: sanitizeAppearance({ ...theme.appearance, opening: { kind: previewKind, speed } }) }, { immediate: true, quiet: true })
  }

  const save = () => {
    updateTheme({ appearance: sanitizeAppearance({ ...theme.appearance, opening: { kind: previewKind, speed: previewSpeed } }) }, { quiet: true })
    setIsOpen(false)
  }

  const cancel = () => {
    setPreviewKind(theme.appearance.opening.kind)
    setPreviewSpeed(theme.appearance.opening.speed)
    setIsOpen(false)
  }

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 bg-white/70 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20 shadow-sm hover:shadow-md"
      >
        <Settings2 className="h-4 w-4 text-blush-500" />
        <span className="text-stone-700 dark:text-stone-200">Opening Animation</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-100 px-2.5 py-0.5 text-xs font-semibold text-blush-700 dark:bg-white/20 dark:text-stone-200">
          {OPENING_OPTIONS.find(o => o.id === currentOpening)?.emoji} {OPENING_OPTIONS.find(o => o.id === currentOpening)?.label}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Full-screen backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[1000] bg-stone-900/60 backdrop-blur-sm"
              onClick={cancel}
            />
            {/* Modal panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose opening animation"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 22, stiffness: 350 }}
              className="fixed inset-0 z-[1001] flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-2xl">
                <div className="relative rounded-3xl bg-white shadow-2xl backdrop-blur-xl dark:bg-night-800 overflow-hidden border border-white/20 dark:border-white/10">
                  {/* Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blush-100/60 dark:border-white/10 bg-white/90 px-6 py-4 backdrop-blur-lg dark:bg-night-800/90">
                    <div>
                      <h2 className="font-display text-lg font-bold text-stone-800 dark:text-stone-100">Opening Animation</h2>
                      <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Choose how your world appears when visitors arrive</p>
                    </div>
                    <button
                      onClick={cancel}
                      className="rounded-xl p-2 text-stone-400 transition hover:bg-blush-100 hover:text-stone-600 dark:hover:bg-white/10 dark:hover:text-stone-200"
                      aria-label="Close"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Content scrollable */}
                  <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-6 py-5 space-y-6">
                    {/* Animation cards grid */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">Select Animation</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {OPENING_OPTIONS.map((opt) => {
                          const selected = previewKind === opt.id
                          return (
                            <motion.button
                              key={opt.id}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => selectAnimation(opt.id)}
                              className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all ${
                                selected
                                  ? 'border-blush-500 bg-blush-50 shadow-md dark:bg-blush-900/30 dark:border-blush-400'
                                  : 'border-transparent bg-stone-50 hover:bg-blush-50/50 dark:bg-white/5 dark:hover:bg-white/10'
                              }`}
                            >
                              {selected && (
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blush-500 text-white shadow-sm">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </span>
                              )}
                              <span className="text-3xl leading-none">{opt.emoji}</span>
                              <div>
                                <p className={`text-xs font-semibold leading-tight ${selected ? 'text-blush-700 dark:text-blush-300' : 'text-stone-700 dark:text-stone-200'}`}>
                                  {opt.label}
                                </p>
                                <p className="mt-1 hidden text-[10px] text-stone-400 dark:text-stone-500 leading-snug sm:block">
                                  {opt.description}
                                </p>
                              </div>
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Speed slider */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">Speed</p>
                        <span className="text-xs font-mono font-semibold text-blush-600 dark:text-blush-400 bg-blush-50 dark:bg-white/10 px-2 py-0.5 rounded">
                          {previewSpeed.toFixed(1)}×
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        value={previewSpeed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full accent-blush-500 h-2"
                      />
                      <div className="mt-1 flex justify-between text-[10px] text-stone-400 dark:text-stone-500">
                        <span>Slow</span>
                        <span>Fast</span>
                      </div>
                    </div>

                    {/* Live preview */}
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">Live Preview</p>
                      <div className="rounded-2xl overflow-hidden border border-blush-100/60 dark:border-white/10 bg-stone-100 dark:bg-night-900">
                        <OpeningPreview kind={previewKind} speed={previewSpeed} />
                      </div>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="sticky bottom-0 border-t border-blush-100/60 dark:border-white/10 bg-white/90 px-6 py-4 backdrop-blur-lg dark:bg-night-800/90 flex items-center justify-end gap-3">
                    <button
                      onClick={cancel}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/10 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={save}
                      className="rounded-xl bg-blush-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blush-600 active:scale-95 transition-all"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
