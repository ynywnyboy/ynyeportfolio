import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles, Maximize2, FolderOpen, Settings2, RefreshCw } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Lightbox } from '../components/Lightbox'
import { Empty, ErrorBox, Modal, SafeImage, SectionTitle, Spinner } from '../components/ui'
import { errMsg, updateRow } from '../lib/data'
import { publicUrl } from '../lib/storage'
import { fmtDate } from '../lib/time'
import type { Album, Media } from '../lib/types'

/** Verifies that the file really loads (skips deleted / inaccessible media). */
function canLoad(m: Media): Promise<boolean> {
  const url = publicUrl(m.storage_path)
  return new Promise((resolve) => {
    if (m.kind === 'image') {
      const img = new Image()
      img.onload = () => resolve(true)
      img.onerror = () => resolve(false)
      img.src = url
    } else {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.onloadedmetadata = () => resolve(true)
      v.onerror = () => resolve(false)
      v.src = url
    }
    setTimeout(() => resolve(false), 12000)
  })
}

export default function TakeMeBack() {
  const { media, albums, loading, error } = useSite()
  const { isMember } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState<Media | null>(null)
  const [busy, setBusy] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const lastId = useRef<string | null>(null)
  const bad = useRef(new Set<string>())

  const eligible = useMemo(() => {
    const excluded = new Set(albums.filter((a) => a.exclude_from_random).map((a) => a.id))
    return media.filter((m) => !(m.album_id && excluded.has(m.album_id)) && !bad.current.has(m.id))
  }, [media, albums])

  const pick = useCallback(async () => {
    setBusy(true)
    const pool = eligible.filter((m) => eligible.length < 2 || m.id !== lastId.current)
    const tried = new Set<string>()
    while (tried.size < pool.length) {
      const candidates = pool.filter((m) => !tried.has(m.id))
      const choice = candidates[Math.floor(Math.random() * candidates.length)]
      tried.add(choice.id)
      if (await canLoad(choice)) {
        lastId.current = choice.id
        setCurrent(choice)
        setBusy(false)
        return
      }
      bad.current.add(choice.id)
    }
    setCurrent(null)
    setBusy(false)
  }, [eligible])

  // If the current memory is deleted by the other person, move on
  useEffect(() => {
    if (current && !media.some((m) => m.id === current.id)) { setCurrent(null) }
  }, [media, current])

  if (loading && !media.length) return <Spinner />
  if (error) return <ErrorBox message={error} />

  const album = current ? albums.find((a) => a.id === current.album_id) : undefined

  const toggleExclude = async (a: Album) => {
    try {
      await updateRow<Album>('albums', 'id', a.id, a.version, { exclude_from_random: !a.exclude_from_random })
    } catch (e) {
      toast(errMsg(e), 'error')
    }
  }

  return (
    <>
      <SectionTitle script="Rediscover" title="Take Me Back" sub="Let the universe pick a moment from our story." />

      {!media.length ? (
        <Empty title="No memories to revisit yet" hint="Upload a few photos or videos first." />
      ) : (
        <div className="mx-auto max-w-2xl text-center">
          <AnimatePresence mode="wait">
            {current ? (
              <motion.figure
                key={current.id}
                initial={{ opacity: 0, scale: 0.94, rotate: -2, filter: 'sepia(1) blur(8px)' }}
                animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'sepia(0) blur(0px)' }}
                exit={{ opacity: 0, scale: 0.96, rotate: 2 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="tape relative rounded-[2rem] bg-white p-3 pb-6 shadow-dreamy dark:bg-night-800"
              >
                {current.kind === 'video' ? (
                  <video src={publicUrl(current.storage_path)} controls playsInline className="max-h-[32rem] w-full rounded-[1.5rem] bg-black" />
                ) : (
                  <SafeImage src={publicUrl(current.storage_path)} alt={current.caption || 'A memory'} className="rounded-[1.5rem]" imgClassName="max-h-[32rem]" />
                )}
                <figcaption className="mt-4 space-y-1 px-3">
                  <p className="h-script text-2xl">{fmtDate(current.taken_at)}</p>
                  {album && <p className="text-sm text-stone-500">Album: {album.name}</p>}
                  <p className="font-display text-xl">{current.caption || 'A beautiful moment'}</p>
                  {current.description && <p className="text-sm text-stone-600 dark:text-stone-300">{current.description}</p>}
                  <div className="flex flex-wrap justify-center gap-2 pt-3">
                    <button className="btn-ghost !py-1.5" onClick={() => setFullscreen(true)}><Maximize2 className="h-4 w-4" /> Full screen</button>
                    {album && <Link className="btn-ghost !py-1.5" to={`/memories?album=${album.id}`}><FolderOpen className="h-4 w-4" /> Open album</Link>}
                  </div>
                </figcaption>
              </motion.figure>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card p-12">
                <Sparkles className="mx-auto h-10 w-10 text-blush-400" />
                <p className="mt-3 text-stone-500">Press the button and we’ll drift back to a moment we’ve kept.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <motion.button whileTap={{ scale: 0.95 }} className="btn-primary !px-8 !py-3 text-base" onClick={pick} disabled={busy || !eligible.length}>
              {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {current ? 'Show another memory' : 'Take me back'}
            </motion.button>
            <button className="btn-ghost" onClick={() => setSettingsOpen(true)}><Settings2 className="h-4 w-4" /> Settings</button>
          </div>
          {!eligible.length && <p className="mt-4 text-sm text-stone-500">Every album is excluded — change that in Settings.</p>}
        </div>
      )}

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Which albums can appear?">
        {albums.length ? (
          <ul className="space-y-2">
            {albums.map((a) => (
              <li key={a.id}>
                <label className="flex items-center gap-3 rounded-2xl bg-blush-50/70 p-3 text-sm dark:bg-white/5">
                  <input
                    type="checkbox"
                    className="accent-blush-500"
                    checked={!a.exclude_from_random}
                    disabled={!isMember}
                    onChange={() => toggleExclude(a)}
                  />
                  {a.name}
                </label>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-stone-500">No albums yet — all memories are included.</p>}
        {!isMember && <p className="mt-3 text-xs text-stone-500">Sign in to change this.</p>}
      </Modal>

      {fullscreen && current && (
        <Lightbox items={[current]} index={0} onIndex={() => {}} onClose={() => setFullscreen(false)} albumName={() => album?.name} />
      )}
    </>
  )
}
