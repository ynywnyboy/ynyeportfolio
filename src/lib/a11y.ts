/**
 * PERSONAL accessibility / comfort preferences. Stored only in this browser (localStorage) and
 * never written to Supabase, so they are never shared with — or overwritten by — your partner.
 */
import { useEffect, useState, useSyncExternalStore } from 'react'

export interface A11yPrefs {
  /** Reduce motion on this device even if the system setting doesn't ask for it */
  reduceMotion: boolean
  /** Turn off animated backgrounds and floating decorations on this device */
  pauseBackground: boolean
}

const KEY = 'olw-a11y'
const DEFAULTS: A11yPrefs = { reduceMotion: false, pauseBackground: false }

function load(): A11yPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v && typeof v === 'object') return { reduceMotion: Boolean(v.reduceMotion), pauseBackground: Boolean(v.pauseBackground) }
  } catch { /* ignore */ }
  return DEFAULTS
}

let prefs = load()
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l) } }
const get = () => prefs

export function setA11yPrefs(patch: Partial<A11yPrefs>) {
  prefs = { ...prefs, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  listeners.forEach((l) => l())
}

export function useA11yPrefs(): A11yPrefs {
  return useSyncExternalStore(subscribe, get, get)
}

/** True when the OS asks for reduced motion OR the personal switch is on. */
export function useReducedMotion(): boolean {
  const { reduceMotion } = useA11yPrefs()
  const [system, setSystem] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return
    const on = () => setSystem(mq.matches)
    if (mq.addEventListener) { mq.addEventListener('change', on) } else { mq.addListener(on) }
    return () => { if (mq.removeEventListener) { mq.removeEventListener('change', on) } else { mq.removeListener(on) } }
  }, [])
  return system || reduceMotion
}

/** False while the tab is hidden — used to pause animation work. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  useEffect(() => {
    const on = () => setVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', on)
    return () => document.removeEventListener('visibilitychange', on)
  }, [])
  return visible
}
