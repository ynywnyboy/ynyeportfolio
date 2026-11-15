import { useEffect, useRef, useState, type ReactNode, type DragEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, UploadCloud, X, AlertTriangle, ImageOff, RefreshCw } from 'lucide-react'
import { kindOf, validateFile, type UploadKind } from '../lib/storage'

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-stone-500" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-blush-500" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="my-4 flex items-start gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-200" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function Empty({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="card mx-auto my-8 max-w-md p-10 text-center">
      <div className="mb-3 flex justify-center text-4xl text-blush-400">{icon ?? '♡'}</div>
      <p className="h-display text-lg">{title}</p>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  // Rendered into <body> so the dialog is never trapped under the page's stacking layer
  // (header, music player) or positioned relative to the animated page wrapper on phones.
  if (typeof document === 'undefined') return null
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-stone-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={`card max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-b-none pb-[max(1.5rem,env(safe-area-inset-bottom))] bg-white p-6 sm:rounded-3xl dark:bg-night-800 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="h-display text-xl">{title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-blush-100 hover:text-blush-600" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}) {
  const [busy, setBusy] = useState(false)
  return (
    <Modal open={open} onClose={() => !busy && onCancel()} title={title}>
      <p className="text-sm text-stone-600 dark:text-stone-300">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-ghost" onClick={onCancel} disabled={busy}>Cancel</button>
        <button
          className="btn-danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try { await onConfirm() } finally { setBusy(false) }
          }}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/** Drag-and-drop + click file picker with validation. */
export function Dropzone({
  accept,
  kinds,
  multiple = true,
  label,
  onFiles,
  busy,
  compact = false,
}: {
  accept: string
  kinds: UploadKind[]
  multiple?: boolean
  label?: string
  onFiles: (files: File[]) => void | Promise<void>
  busy?: boolean
  compact?: boolean
}) {
  const [over, setOver] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const handle = (list: FileList | File[]) => {
    const files = Array.from(list)
    const bad = files.map((f) => validateFile(f, kinds)).find(Boolean)
    if (bad) { setErr(bad); return }
    setErr(null)
    const ok = files.filter((f) => kindOf(f))
    if (ok.length) onFiles(multiple ? ok : ok.slice(0, 1))
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    handle(e.dataTransfer.files)
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
        tabIndex={0}
        role="button"
        aria-label={label ?? 'Upload files'}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed text-center transition ${
          compact ? 'p-4' : 'p-8'
        } ${over ? 'border-blush-500 bg-blush-100/60' : 'border-blush-200 bg-white/50 hover:bg-blush-50 dark:border-white/10 dark:bg-white/5'}`}
      >
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-blush-500" /> : <UploadCloud className="h-6 w-6 text-blush-400" />}
        <p className="mt-2 text-sm font-medium">{busy ? 'Uploading…' : label ?? 'Drop files here or click to browse'}</p>
        <p className="text-xs text-stone-500">Max 50 MB per file</p>
        <input
          ref={input}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={(e) => { if (e.target.files) handle(e.target.files); e.target.value = '' }}
        />
      </div>
      {err && <p className="mt-2 text-xs text-red-600" role="alert">{err}</p>}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

export function SectionTitle({ script, title, sub }: { script?: string; title: string; sub?: string }) {
  return (
    <div className="mb-10 text-center">
      {script && <p className="h-script text-2xl">{script}</p>}
      <h1 className="h-display text-4xl font-semibold sm:text-5xl">{title}</h1>
      {sub && <p className="mx-auto mt-3 max-w-xl text-stone-500 dark:text-stone-400">{sub}</p>}
    </div>
  )
}

/**
 * Image with a loading shimmer and a friendly placeholder (with retry) if the file can't be
 * fetched or decoded — so a missing/deleted/blocked picture never shows as a broken icon.
 */
export function SafeImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  lazy = false,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  lazy?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => { setFailed(false); setAttempt(0) }, [src])
  const url = attempt ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src
  const retry = () => { setAttempt((a) => a + 1); setFailed(false) }

  // The picture is always visible (never hidden waiting for an onLoad event, which can be missed);
  // the shimmer is only a background behind it, and the placeholder appears only on a real error.
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-blush-100 to-lilac-100 dark:from-white/5 dark:to-white/10 ${className}`}>
      {!failed && (
        <img
          key={url}
          src={url}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onError={() => setFailed(true)}
          className={`block h-full min-h-32 w-full object-cover ${imgClassName}`}
        />
      )}
      {failed && (
        <div className="flex h-full min-h-32 w-full flex-col items-center justify-center gap-1.5 p-3 text-center text-xs text-stone-500" role="img" aria-label={`${alt || 'Photo'} could not be loaded`}>
          <ImageOff className="h-6 w-6 text-blush-300" />
          <span>Photo unavailable</span>
          <span
            role="button"
            tabIndex={0}
            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-white/80 px-2 py-0.5 text-blush-600 hover:bg-white dark:bg-white/10"
            onClick={(e) => { e.stopPropagation(); retry() }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); retry() } }}
          >
            <RefreshCw className="h-3 w-3" /> Try again
          </span>
        </div>
      )}
    </div>
  )
}
