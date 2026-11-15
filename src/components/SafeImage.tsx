import { useEffect, useRef, useState } from 'react'
import { ImageOff, RotateCcw } from 'lucide-react'

/**
 * <img> that never leaves an invisible hole.
 *  - The picture is ALWAYS visible (never hidden waiting for an onLoad event), so a fast/cached
 *    load can't get stuck behind a "loading" state. onLoad only removes the pale placeholder.
 *  - Retries once with a cache-busting query, then shows a friendly fallback with the HTTP status.
 */
export function SafeImage({
  src,
  alt,
  className = '',
  imgClassName = 'h-full w-full object-cover',
  minHeightClass = 'min-h-[8rem]',
  lazy = true,
}: {
  src: string
  alt: string
  /** wrapper classes */
  className?: string
  imgClassName?: string
  /** reserve space until the picture arrives (set '' to disable) */
  minHeightClass?: string
  lazy?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [why, setWhy] = useState<string | null>(null)
  const ref = useRef<HTMLImageElement>(null)

  // New picture -> start over. Done while rendering (not in an effect) so it can never
  // run AFTER a quick onLoad and wipe it out.
  const [prevSrc, setPrevSrc] = useState(src)
  if (prevSrc !== src) {
    setPrevSrc(src)
    setLoaded(false)
    setFailed(false)
    setAttempt(0)
    setWhy(null)
  }

  // Already finished loading (e.g. from cache) before React attached onLoad?
  useEffect(() => {
    const el = ref.current
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true)
  }, [src, attempt])

  // When a picture finally fails, ask the server why (shown small, for easy diagnosis)
  useEffect(() => {
    if (!failed || !src) return
    let cancelled = false
    fetch(src, { method: 'HEAD' })
      .then((r) => { if (!cancelled) setWhy(r.ok ? `The file loads (HTTP ${r.status}, ${r.headers.get('content-type') ?? 'unknown type'}) but the browser can’t display it` : `Storage answered HTTP ${r.status}`) })
      .catch(() => { if (!cancelled) setWhy('The storage address could not be reached') })
    return () => { cancelled = true }
  }, [failed, src])

  const retry = () => { setFailed(false); setLoaded(false); setAttempt((n) => n + 1) }
  const url = !src ? '' : attempt === 0 ? src : `${src}${src.includes('?') ? '&' : '?'}r=${attempt}`

  if (!src || failed) {
    return (
      <div className={`flex min-h-[8rem] w-full flex-col items-center justify-center gap-2 rounded-2xl bg-blush-100/70 p-4 text-center text-blush-600 dark:bg-white/5 ${className}`} role="img" aria-label={alt ? `${alt} (picture unavailable)` : 'Picture unavailable'}>
        <ImageOff className="h-6 w-6" />
        <span className="text-xs">Picture can’t be shown right now</span>
        {why && <span className="text-[10px] opacity-70">{why}</span>}
        {src && (
          <span
            role="button"
            tabIndex={0}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs hover:bg-white dark:bg-white/10"
            onClick={(e) => { e.stopPropagation(); retry() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); retry() } }}
          >
            <RotateCcw className="h-3 w-3" /> Try again
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${loaded ? '' : `${minHeightClass} animate-pulse bg-blush-100/70 dark:bg-white/5`} ${className}`}>
      <img
        ref={ref}
        src={url}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => { if (attempt < 1) setAttempt(1); else setFailed(true) }}
        className={imgClassName}
      />
    </div>
  )
}
