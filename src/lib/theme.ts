/**
 * Theme: accent colour + light/dark mode + particles toggle + saved presets + notebook config.
 * Stored as one JSON blob in settings.theme so it syncs via realtime.
 */

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeKind = 'default' | 'custom' | 'notebook'

export interface NotebookConfig {
  coverColor: string
  paperColor: string
  lineColor: string
  font: 'caveat' | 'indie' | 'handwritten'
  ribbonColor: string
  preset: string
}

export interface ThemeValue {
  kind: ThemeKind
  accent: string
  mode: ThemeMode
  particles: boolean
  appearance: any
  saved: any[]
  notebook?: NotebookConfig
}

export const DEFAULT_ACCENT = '#e8899f'

const STORAGE_KEY = 'olw-theme-cache'

export function readThemeCache(): ThemeValue | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function writeThemeCache(theme: ThemeValue, toPublicUrl: (p: string) => string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme))
  } catch {
    /* ignore */
  }
}

export function clearLegacyThemeOverride(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('olw-theme-override')
  } catch {
    /* ignore */
  }
}

const HEX = /^#[0-9a-fA-F]{6}$/

export function sanitizeTheme(raw: unknown): ThemeValue {
  const d: ThemeValue = {
    kind: 'default',
    accent: DEFAULT_ACCENT,
    mode: 'system',
    particles: true,
    appearance: null,
    saved: [],
  }
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Record<string, any>
  return {
    kind: ['default', 'custom', 'notebook'].includes(r.kind) ? r.kind : 'default',
    accent: typeof r.accent === 'string' && HEX.test(r.accent) ? r.accent : DEFAULT_ACCENT,
    mode: r.mode === 'light' || r.mode === 'dark' || r.mode === 'system' ? r.mode : 'system',
    particles: Boolean(r.particles),
    appearance: r.appearance ?? null,
    saved: Array.isArray(r.saved) ? r.saved.slice(0, 24) : [],
    notebook: r.notebook && typeof r.notebook === 'object' ? r.notebook : undefined,
  }
}

export function resolveDark(mode: ThemeMode): boolean {
  if (mode === 'light') return false
  if (mode === 'dark') return true
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(accent: string, mode: ThemeMode): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--olw-accent', accent)
  const dark = resolveDark(mode)
  root.classList.toggle('dark', dark)
}
