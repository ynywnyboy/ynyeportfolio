import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ConflictError, errMsg, updateRow, useTable } from '../lib/data'
import { supabase } from '../lib/supabase'
import {
  applyTheme, clearLegacyThemeOverride, DEFAULT_ACCENT, readThemeCache, resolveDark, sanitizeTheme, writeThemeCache,
  type ThemeMode, type ThemeValue,
} from '../lib/theme'
import { applyAppearance, DEFAULT_APPEARANCE, type Appearance } from '../lib/appearance'
import { publicUrl } from '../lib/storage'
import { useReducedMotion } from '../lib/a11y'
import type { Settings, Bio, Album, Media } from '../lib/types'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

interface UpdateOpts {
  /** Save right away instead of waiting for further changes (e.g. while dragging a colour picker) */
  immediate?: boolean
  /** Don't show the "Theme saved" toast */
  quiet?: boolean
}

interface SiteState {
  settings: Settings | null
  bios: Bio[]
  albums: Album[]
  media: Media[]
  loading: boolean
  error: string | null
  /** Re-fetch media (used after uploads so images show even if a realtime event is missed) */
  reloadMedia: () => Promise<void>
  /** The theme currently on screen (shared theme + any change still being saved) */
  theme: ThemeValue
  isDark: boolean
  /** Change the shared theme. Applies instantly, saves to Supabase, and syncs to your partner. */
  updateTheme: (patch: Partial<ThemeValue>, opts?: UpdateOpts) => void
  /** What is on screen: the saved look, or the unsaved preview from the "Customize Our World" editor */
  appearance: Appearance
  /** Live-preview an unsaved look on this screen only (null = stop previewing) */
  setPreviewAppearance: (a: Appearance | null) => void
  /** Animated effects & decorations are allowed (not paused/reduced on this device) */
  motionAllowed: boolean
}

const Ctx = createContext<SiteState | null>(null)

const FALLBACK_THEME: ThemeValue = { kind: 'default', accent: DEFAULT_ACCENT, mode: 'system', particles: true, appearance: DEFAULT_APPEARANCE, saved: [] }
const VISITOR_KEY = 'olw-visitor-mode'

/** Shared, realtime-synced site data used across pages. */
export function SiteProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading, isMember } = useAuth()
  const toast = useToast()
  const enabled = !authLoading
  const s = useTable<Settings>('settings', 'id', { enabled })
  const b = useTable<Bio>('bios', 'slot', { orderBy: 'slot', enabled })
  const a = useTable<Album>('albums', 'id', { orderBy: 'created_at', enabled })
  const m = useTable<Media>('media', 'id', { orderBy: 'taken_at', ascending: false, enabled })

  const settings = s.rows[0] ?? null
  const settingsRef = useRef<Settings | null>(settings)
  settingsRef.current = settings

  // ---- THEME -------------------------------------------------------------
  // Source of truth = settings.theme in Supabase. `pending` holds a change that
  // has been made on this device but not yet confirmed by the database, so the
  // UI reacts instantly. Nothing in localStorage can override the shared theme
  // (the cache is only a copy used to avoid a flash on first paint).
  const [pending, setPending] = useState<Partial<ThemeValue>>({})
  const pendingRef = useRef<Partial<ThemeValue>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const quietRef = useRef(true)
  const [visitorMode, setVisitorMode] = useState<ThemeMode | null>(() => {
    try { const v = localStorage.getItem(VISITOR_KEY); return v === 'light' || v === 'dark' || v === 'system' ? v : null } catch { return null }
  })
  const [systemTick, setSystemTick] = useState(0)

  useEffect(() => { clearLegacyThemeOverride() }, [])

  const shared = useMemo(() => sanitizeTheme(settings?.theme ?? readThemeCache() ?? FALLBACK_THEME), [settings?.theme])
  const [preview, setPreview] = useState<Appearance | null>(null)
  const reduced = useReducedMotion()
  const theme: ThemeValue = useMemo(() => {
    const merged = { ...shared, ...pending }
    // Visitors (not signed in) can't change the shared theme; they may pick light/dark for themselves.
    if (!isMember && visitorMode) merged.mode = visitorMode
    return merged
  }, [shared, pending, isMember, visitorMode])

  // Keep a copy of the shared theme for flash-free first paint
  useEffect(() => { if (settings?.theme) writeThemeCache(shared, publicUrl) }, [settings?.theme, shared])

  // Apply to the page whenever anything relevant changes
  useEffect(() => { applyTheme(theme.accent, theme.mode) }, [theme.accent, theme.mode, systemTick])

  // Background / fonts / card style (or the editor's unsaved preview)
  const appearance = preview ?? theme.appearance
  useEffect(() => { applyAppearance(appearance, publicUrl) }, [appearance])

  // Personal comfort settings live on <html> for CSS (never shared with your partner)
  useEffect(() => { document.documentElement.setAttribute('data-reduce-motion', reduced ? 'on' : 'off') }, [reduced])

  // "System" mode follows the OS live
  useEffect(() => {
    if (theme.mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const on = () => setSystemTick((n) => n + 1)
    if (mq.addEventListener) { mq.addEventListener('change', on) } else { mq.addListener(on) }
    return () => { if (mq.removeEventListener) { mq.removeEventListener('change', on) } else { mq.removeListener(on) } }
  }, [theme.mode])

  const flush: () => Promise<void> = useCallback(async () => {
    saveTimer.current = null
    const patch = pendingRef.current
    if (!Object.keys(patch).length) return
    const quiet = quietRef.current
    quietRef.current = true
    try {
      let attempt = 0
      // Retry on conflict: theme edits are tiny and last-writer-wins is the right behaviour here.
      for (;;) {
        let cur = settingsRef.current
        if (attempt > 0 || !cur) {
          const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle()
          cur = (data as Settings | null) ?? cur
        }
        if (!cur) throw new Error('Site settings not found.')
        try {
          await updateRow<Settings>('settings', 'id', cur.id, cur.version, { theme: { ...cur.theme, ...sanitizeTheme(cur.theme), ...patch } })
          break
        } catch (e) {
          if (e instanceof ConflictError && attempt < 3) { attempt++; continue }
          throw e
        }
      }
      await s.reload()
      if (!quiet) toast('Theme saved 💕')
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      // Anything changed again while saving stays pending and gets its own save
      const still = pendingRef.current
      const stillPending: Partial<ThemeValue> = {}
      for (const k of Object.keys(still) as (keyof ThemeValue)[]) {
        if (still[k] !== patch[k]) (stillPending as any)[k] = still[k]
      }
      pendingRef.current = stillPending
      setPending(stillPending)
      if (Object.keys(stillPending).length && !saveTimer.current) saveTimer.current = setTimeout(flush, 450)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, s.reload])

  const updateTheme = useCallback((patch: Partial<ThemeValue>, opts: UpdateOpts = {}) => {
    if (!isMember) {
      // Not signed in: only the light/dark choice is allowed, and only for this device.
      if (patch.mode) {
        setVisitorMode(patch.mode)
        try { localStorage.setItem(VISITOR_KEY, patch.mode) } catch { /* ignore */ }
      }
      return
    }
       const next = { ...pendingRef.current, ...patch }
    pendingRef.current = next
    setPending(next)
    if (!opts.quiet) quietRef.current = false
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(flush, opts.immediate ? 0 : 450)
  }, [isMember, flush])

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  const value: SiteState = {
    settings,
    bios: b.rows,
    albums: a.rows,
    media: m.rows,
    loading: s.loading || b.loading || a.loading || m.loading,
    error: s.error || b.error || a.error || m.error,
    reloadMedia: m.reload,
    theme,
    isDark: resolveDark(theme.mode),
    updateTheme,
    appearance,
    setPreviewAppearance: setPreview,
    motionAllowed: !reduced,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSite() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSite must be used inside SiteProvider')
  return c
}
