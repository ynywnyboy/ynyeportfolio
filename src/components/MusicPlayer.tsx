import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle, Repeat, Repeat1, Music2, ChevronDown, ListMusic, Heart, AlertTriangle,
} from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { publicUrl } from '../lib/storage'

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export function MusicPlayer() {
  const p = usePlayer()
  const [open, setOpen] = useState(false)
  const [showList, setShowList] = useState(false)
  if (!p.tracks.length || !p.current) return null
  const art = publicUrl(p.current.artwork_path)

  const Art = ({ size }: { size: string }) => (
    <div
      className={`${size} shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blush-200 to-lilac-200 shadow-soft ${p.playing && !p.isEmbed ? 'animate-[spin_12s_linear_infinite]' : ''}`}
    >
      {art ? <img src={art} alt="" className="h-full w-full object-cover" /> : (
        <div className="flex h-full w-full items-center justify-center text-blush-600"><Music2 className="h-1/2 w-1/2" /></div>
      )}
    </div>
  )

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-3 sm:bottom-6 sm:left-6">
      <AnimatePresence>
        {p.autoplayBlocked && !p.playing && !p.isEmbed && !open && (
          <motion.button
            key="tap"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            onClick={p.play}
            className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-blush-400 to-blush-600 px-5 py-3 text-sm font-medium text-white shadow-dreamy"
            aria-label="Tap to play our music"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-blush-400/40" aria-hidden />
            <Heart className="relative h-4 w-4 fill-white" />
            <span className="relative">Tap to play our music</span>
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.button
            key="mini"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="card flex items-center gap-3 rounded-full p-2 pr-5 hover:shadow-dreamy"
            aria-label="Open music player"
          >
            <Art size="h-11 w-11" />
            <div className="max-w-[9rem] text-left">
              <p className="truncate text-sm font-medium">{p.current.title}</p>
              <p className={`truncate text-xs ${p.trackError ? 'text-red-500' : 'text-stone-500'}`}>{p.trackError ? 'Can’t play this song' : p.current.artist || 'Our playlist'}</p>
            </div>
            {!p.isEmbed && (
              <span
                role="button"
                tabIndex={0}
                aria-label={p.playing ? 'Pause' : 'Play'}
                onClick={(e) => { e.stopPropagation(); p.toggle() }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); p.toggle() } }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-500 text-white"
              >
                {p.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-px" />}
              </span>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="full"
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.96 }}
            className="card w-[min(92vw,22rem)] p-5 shadow-dreamy"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="h-script text-lg">Our music</span>
              <div className="flex gap-1">
                <button className="rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => setShowList((s) => !s)} aria-label="Toggle playlist">
                  <ListMusic className="h-4 w-4" />
                </button>
                <button className="rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Minimize player">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Art size="h-20 w-20" />
              <div className="min-w-0">
                <p className="truncate font-display text-lg">{p.current.title}</p>
                <p className="truncate text-sm text-stone-500">{p.current.artist || '—'}</p>
              </div>
            </div>

            {p.trackError && (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 p-2.5 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-200" role="alert">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {p.trackError}
              </p>
            )}

            {p.isEmbed && p.embedSrc && p.playing ? (
              <iframe
                title={p.current.title}
                src={p.embedSrc}
                className="mt-4 h-20 w-full rounded-2xl"
                allow="autoplay; encrypted-media"
                loading="lazy"
              />
            ) : null}

            {!p.isEmbed && (
              <div className="mt-4">
                <input
                  type="range"
                  min={0}
                  max={p.duration || 0}
                  step={0.5}
                  value={Math.min(p.progress, p.duration || 0)}
                  onChange={(e) => p.seek(Number(e.target.value))}
                  className="w-full accent-blush-500"
                  aria-label="Progress"
                />
                <div className="flex justify-between text-xs text-stone-500">
                  <span>{fmt(p.progress)}</span>
                  <span>{fmt(p.duration)}</span>
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <button className={`rounded-full p-2 ${p.shuffle ? 'text-blush-600' : 'text-stone-400'}`} onClick={p.toggleShuffle} aria-label="Shuffle" aria-pressed={p.shuffle}>
                <Shuffle className="h-4 w-4" />
              </button>
              <button className="rounded-full p-2 hover:bg-blush-100 dark:hover:bg-white/10" onClick={p.prev} aria-label="Previous track"><SkipBack className="h-5 w-5" /></button>
              <button
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blush-400 to-blush-600 text-white shadow-soft"
                onClick={p.toggle}
                aria-label={p.playing ? 'Pause' : 'Play'}
              >
                {p.playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 translate-x-px" />}
              </button>
              <button className="rounded-full p-2 hover:bg-blush-100 dark:hover:bg-white/10" onClick={p.next} aria-label="Next track"><SkipForward className="h-5 w-5" /></button>
              <button className={`rounded-full p-2 ${p.repeat !== 'off' ? 'text-blush-600' : 'text-stone-400'}`} onClick={p.cycleRepeat} aria-label={`Repeat: ${p.repeat}`}>
                {p.repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>

            {!p.isEmbed && (
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => p.setVolume(p.volume > 0 ? 0 : 0.7)} aria-label={p.volume > 0 ? 'Mute' : 'Unmute'}>
                  {p.volume > 0 ? <Volume2 className="h-4 w-4 text-stone-500" /> : <VolumeX className="h-4 w-4 text-stone-500" />}
                </button>
                <input type="range" min={0} max={1} step={0.01} value={p.volume} onChange={(e) => p.setVolume(Number(e.target.value))} className="w-full accent-blush-500" aria-label="Volume" />
              </div>
            )}

            <AnimatePresence>
              {showList && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 max-h-44 space-y-1 overflow-y-auto">
                  {p.tracks.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => p.playTrack(t.id)}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition hover:bg-blush-100 dark:hover:bg-white/10 ${t.id === p.current?.id ? 'bg-blush-100/70 text-blush-600 dark:bg-white/10' : ''}`}
                      >
                        <Music2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{t.title}</span>
                        <span className="ml-auto truncate text-xs text-stone-500">{t.artist}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
