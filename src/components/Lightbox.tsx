import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X, ChevronLeft, ChevronRight, Play, Pause, Maximize2, ImageOff } from 'lucide-react'
import type { Media } from '../lib/types'
import { publicUrl } from '../lib/storage'
import { fmtDate } from '../lib/time'

/** Full-screen viewer with keyboard nav, video playback and slideshow mode. */
export function Lightbox({
  items,
  index,
  onIndex,
  onClose,
  albumName,
}: {
  items: Media[]
  index: number
  onIndex: (i: number) => void
  onClose: () => void
  albumName?: (m: Media) => string | undefined
}) {
  const [slideshow, setSlideshow] = useState(false)
  const [failed, setFailed] = useState<string | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const item = items[index]

  const go = useCallback((d: number) => onIndex((index + d + items.length) % items.length), [index, items.length, onIndex])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [go, onClose])

  // Slideshow advances images every 4s; videos advance when they end
  useEffect(() => {
    if (!slideshow || !item || item.kind === 'video' || items.length < 2) return
    const id = setTimeout(() => go(1), 4000)
    return () => clearTimeout(id)
  }, [slideshow, item, go, items.length])

  // Close if the item was deleted by the other person while open
  useEffect(() => { if (!item) onClose() }, [item, onClose])
  if (!item) return null

  const fullscreen = () => root.current?.requestFullscreen?.().catch(() => {})

  return (
    <div ref={root} className="fixed inset-0 z-[90] flex flex-col bg-black/95 text-white" role="dialog" aria-modal="true" aria-label="Memory viewer">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm text-white/70">{index + 1} / {items.length}</span>
        <div className="flex gap-1">
          {items.length > 1 && (
            <button className="rounded-full p-2 hover:bg-white/10" onClick={() => setSlideshow((s) => !s)} aria-label={slideshow ? 'Pause slideshow' : 'Start slideshow'}>
              {slideshow ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}
          <button className="rounded-full p-2 hover:bg-white/10" onClick={fullscreen} aria-label="Full screen"><Maximize2 className="h-5 w-5" /></button>
          <button className="rounded-full p-2 hover:bg-white/10" onClick={onClose} aria-label="Close"><X className="h-6 w-6" /></button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-14">
        {items.length > 1 && (
          <button className="absolute left-2 z-10 rounded-full bg-white/10 p-3 hover:bg-white/20" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex h-full w-full items-center justify-center"
          >
            {item.kind === 'video' ? (
              <video
                key={item.id}
                src={publicUrl(item.storage_path)}
                controls
                autoPlay
                playsInline
                onEnded={() => slideshow && go(1)}
                className="max-h-full max-w-full rounded-xl"
              />
            ) : (
              failed === item.id ? (
                <div className="flex flex-col items-center gap-2 text-white/70"><ImageOff className="h-10 w-10" /><p className="text-sm">This photo can’t be loaded right now.</p></div>
              ) : (
                <img src={publicUrl(item.storage_path)} alt={item.caption || 'Memory'} onError={() => setFailed(item.id)} className="max-h-full max-w-full rounded-xl object-contain" />
              )
            )}
          </motion.div>
        </AnimatePresence>
        {items.length > 1 && (
          <button className="absolute right-2 z-10 rounded-full bg-white/10 p-3 hover:bg-white/20" onClick={() => go(1)} aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
        )}
      </div>

      <div className="p-5 text-center">
        <p className="font-display text-xl">{item.caption || 'Untitled memory'}</p>
        <p className="text-sm text-white/60">
          {fmtDate(item.taken_at)}{albumName?.(item) ? ` · ${albumName(item)}` : ''}
        </p>
        {item.description && <p className="mx-auto mt-2 max-w-xl text-sm text-white/80">{item.description}</p>}
      </div>
    </div>
  )
}
