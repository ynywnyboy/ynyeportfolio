import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useTable } from '../lib/data'
import { publicUrl } from '../lib/storage'
import type { Track } from '../lib/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export type RepeatMode = 'off' | 'all' | 'one'

interface PlayerState {
  tracks: Track[]
  current: Track | null
  isEmbed: boolean
  embedSrc: string | null
  playing: boolean
  progress: number
  duration: number
  volume: number
  shuffle: boolean
  repeat: RepeatMode
  /** The browser refused to start music on its own — show the "Tap to play" button. */
  autoplayBlocked: boolean
  /** Set when the current song's file is missing or can't be decoded. */
  trackError: string | null
  toggle: () => void
  play: () => void
  playTrack: (id: string) => void
  next: () => void
  prev: () => void
  seek: (t: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  cycleRepeat: () => void
}

const Ctx = createContext<PlayerState | null>(null)

const LAST_TRACK_KEY = 'olw-last-track'
const LAST_POS_KEY = 'olw-last-pos'
const VOLUME_KEY = 'olw-vol'

const store = {
  get(k: string): string | null {
    try { return localStorage.getItem(k) } catch { return null }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v) } catch { /* private mode / storage full — not critical */ }
  },
}

/** Turn a pasted YouTube / Spotify / SoundCloud link into an embeddable URL. */
export function toEmbedUrl(raw: string | null): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1`
    if (host.endsWith('youtube.com')) {
      if (u.pathname.startsWith('/embed/')) return `${u.origin}${u.pathname}?autoplay=1`
      const v = u.searchParams.get('v')
      if (v) return `https://www.youtube.com/embed/${v}?autoplay=1`
    }
    if (host === 'open.spotify.com') {
      const path = u.pathname.startsWith('/embed') ? u.pathname : `/embed${u.pathname}`
      return `https://open.spotify.com${path}`
    }
    if (host === 'soundcloud.com') {
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&auto_play=true`
    }
  } catch {
    /* not a URL */
  }
  return null
}

const srcFor = (t: Track | null) =>
  !t || t.source_kind === 'embed' ? '' : t.audio_path ? publicUrl(t.audio_path) : t.audio_url ?? ''

/**
 * Lives ABOVE the router, so the single <audio> element (and the song) keeps playing while
 * people move between pages — nothing here is torn down on navigation.
 */
export function PlayerProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth()
  const toast = useToast()
  // Realtime: when either partner adds, edits, reorders or removes a song, this list updates live.
  const { rows: tracks } = useTable<Track>('tracks', 'id', { orderBy: 'position', enabled: !authLoading })

  const audioRef = useRef<HTMLAudioElement | null>(null)
  if (!audioRef.current && typeof Audio !== 'undefined') audioRef.current = new Audio()

  const [currentId, setCurrentId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(() => {
    const v = Number(store.get(VOLUME_KEY))
    return Number.isFinite(v) && store.get(VOLUME_KEY) !== null ? Math.min(1, Math.max(0, v)) : 0.7
  })
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState<RepeatMode>('off')
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)

  // Until the saved song has been restored we expose nothing, so we never load the wrong file first
  const current = useMemo(() => (ready ? tracks.find((t) => t.id === currentId) ?? tracks[0] ?? null : null), [ready, tracks, currentId])
  const embedSrc = current?.source_kind === 'embed' ? toEmbedUrl(current.embed_url) : null
  const isEmbed = current?.source_kind === 'embed'
  const src = srcFor(current)

  // Latest values for event handlers that are attached once
  const live = useRef({ tracks, current, shuffle, repeat, playing })
  live.current = { tracks, current, shuffle, repeat, playing }
  const pendingSeek = useRef<number | null>(null)
  const autoplayTried = useRef(false)
  const errorStreak = useRef(0)
  const lastSave = useRef(0)
  const skipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const loadedSrc = useRef('')

  /** Start the audio element. Never forces: if the browser says no, we show the Tap-to-play button instead. */
  const tryPlay = useCallback(() => {
    const a = audioRef.current
    if (!a || !a.src) return
    const p = a.play()
    if (p && typeof p.catch === 'function') {
      p.catch((err: unknown) => {
        const name = (err as { name?: string })?.name
        if (name === 'NotAllowedError') {
          setPlaying(false)
          setAutoplayBlocked(true)
        } else if (name !== 'AbortError') {
          // AbortError = we changed the source while it was starting; anything else is a real failure
          setPlaying(false)
        }
      })
    }
  }, [])

  const pick = useCallback((dir: 1 | -1, auto = false) => {
    const { tracks: list, current: cur, shuffle: sh, repeat: rep } = live.current
    if (!list.length) return
    const a = audioRef.current!
    const restart = () => { a.currentTime = 0; setPlaying(true); tryPlay() }
    if (auto && rep === 'one') return restart()
    const idx = list.findIndex((t) => t.id === cur?.id)
    let nextIdx: number
    if (sh && list.length > 1) {
      do { nextIdx = Math.floor(Math.random() * list.length) } while (nextIdx === idx)
    } else {
      nextIdx = idx + dir
      if (nextIdx >= list.length) {
        if (auto && rep === 'off') { setPlaying(false); return }
        nextIdx = 0
      }
      if (nextIdx < 0) nextIdx = list.length - 1
    }
    if (list[nextIdx].id === cur?.id) return restart() // one-song playlist with repeat-all
    setCurrentId(list[nextIdx].id)
    setPlaying(true)
  }, [tryPlay])

  const savePosition = useCallback(() => {
    const a = audioRef.current
    if (!a || !a.src || !Number.isFinite(a.currentTime)) return
    store.set(LAST_POS_KEY, String(Math.floor(a.currentTime)))
  }, [])

  // ---- Audio element events (attached once) --------------------------------
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = volume

    const onTime = () => {
      setProgress(a.currentTime)
      const now = Date.now()
      if (now - lastSave.current > 2000) { lastSave.current = now; savePosition() }
    }
    const onMeta = () => {
      const d = Number.isFinite(a.duration) ? a.duration : 0
      setDuration(d)
      const seek = pendingSeek.current
      pendingSeek.current = null
      if (seek && d > 0 && seek < d - 3) a.currentTime = seek // resume where we left off
    }
    const onEnd = () => { store.set(LAST_POS_KEY, '0'); pick(1, true) }
    const onPlay = () => { setPlaying(true); setAutoplayBlocked(false) }
    const onPlaying = () => { errorStreak.current = 0; setTrackError(null) }
    const onPause = () => { if (!a.ended) setPlaying(false) }
    const onError = () => {
      if (!a.getAttribute('src')) return
      setTrackError('This song can’t be played (the file is missing or unsupported).')
      errorStreak.current += 1
      const { tracks: list } = live.current
      if (list.length > 1 && errorStreak.current < list.length) {
        // try the next song, but stop once we've failed on every song so we never loop forever
        clearTimeout(skipTimer.current)
        skipTimer.current = setTimeout(() => pick(1), 1200)
      } else {
        setPlaying(false)
        toast('Couldn’t play this song — check the file in Dashboard → Music.', 'error')
      }
    }
    const onHide = () => savePosition()

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnd)
    a.addEventListener('play', onPlay)
    a.addEventListener('playing', onPlaying)
    a.addEventListener('pause', onPause)
    a.addEventListener('error', onError)
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('playing', onPlaying)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('error', onError)
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onHide)
      clearTimeout(skipTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, savePosition, toast])

  // ---- First load: restore last song + position, then ask the browser (once) to autoplay ----
  useEffect(() => {
    if (ready || !tracks.length) return
    const savedId = store.get(LAST_TRACK_KEY)
    const saved = tracks.find((t) => t.id === savedId)
    const start = saved ?? tracks[0]
    setCurrentId(start.id)
    const pos = Number(store.get(LAST_POS_KEY))
    if (saved && Number.isFinite(pos) && pos > 1) pendingSeek.current = pos
    setReady(true)
    if (start.source_kind !== 'embed' && !autoplayTried.current) {
      autoplayTried.current = true // one polite attempt — never repeated, never worked around
      setPlaying(true)
    }
  }, [tracks, ready])

  // Remember which song we're on (only after the saved one has been restored)
  useEffect(() => {
    if (ready && current) store.set(LAST_TRACK_KEY, current.id)
  }, [ready, current?.id])

  // ---- Load a new source only when the *file* actually changes (never on page navigation) ----
  useEffect(() => {
    const a = audioRef.current
    if (!a || src === loadedSrc.current) return
    loadedSrc.current = src
    setProgress(0)
    setDuration(0)
    setTrackError(null)
    if (!src) {
      a.pause()
      a.removeAttribute('src')
      a.load()
      return
    }
    a.src = src
    a.load()
    if (live.current.playing) tryPlay()
  }, [src, tryPlay])

  // ---- Keep element in step with the play/pause state ----
  useEffect(() => {
    const a = audioRef.current
    if (!a || !src) return
    if (playing && a.paused) tryPlay()
    if (!playing && !a.paused) a.pause()
  }, [playing, src, tryPlay])

  const play = useCallback(() => {
    setAutoplayBlocked(false)
    setPlaying(true)
    tryPlay() // called straight from the click so the browser counts it as a user gesture
  }, [tryPlay])

  const value: PlayerState = {
    tracks,
    current,
    isEmbed,
    embedSrc,
    playing,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    autoplayBlocked,
    trackError,
    play,
    toggle: () => {
      if (live.current.playing) setPlaying(false)
      else play()
    },
    playTrack: (id) => {
      errorStreak.current = 0
      setCurrentId(id)
      setPlaying(true)
      if (id === live.current.current?.id) tryPlay()
    },
    next: () => pick(1),
    prev: () => {
      const a = audioRef.current
      if (a && a.currentTime > 4) { a.currentTime = 0; return }
      pick(-1)
    },
    seek: (t) => { if (audioRef.current) audioRef.current.currentTime = t },
    setVolume: (v) => {
      setVolumeState(v)
      if (audioRef.current) audioRef.current.volume = v
      store.set(VOLUME_KEY, String(v))
    },
    toggleShuffle: () => setShuffle((s) => !s),
    cycleRepeat: () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePlayer() {
  const c = useContext(Ctx)
  if (!c) throw new Error('usePlayer must be used inside PlayerProvider')
  return c
}
