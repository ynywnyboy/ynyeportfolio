import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ConflictError, errMsg, updateRow } from '../../lib/data'
import { supabase } from '../../lib/supabase'
import type { Settings } from '../../lib/types'
import { useSite } from '../../context/SiteContext'
import { useToast } from '../../context/ToastContext'
import { applyOps, diffHouse, normalizeHouse } from '../utils/house'
import type { House, Op } from '../types/littleRoom'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
const HISTORY = 60

/**
 * The shared house. It lives in settings.theme.house (no new table) and arrives live through the existing settings
 * subscription. Edits are shown instantly, saved automatically ~1s later, and sent as "what I changed" so they are
 * applied on top of the newest copy — a partner's edits are never overwritten. Undo/redo are local to this device.
 */
export function useHouse() {
  const { settings } = useSite()
  const toast = useToast()
  const settingsRef = useRef<Settings | null>(settings)
  settingsRef.current = settings

  const theme = settings?.theme as { house?: unknown; room?: unknown } | undefined
  const live = useMemo(() => normalizeHouse(theme?.house, theme?.room), [settings?.version, Boolean(settings)]) // eslint-disable-line react-hooks/exhaustive-deps
  const liveRef = useRef(live)
  liveRef.current = live

  const [local, setLocal] = useState<House | null>(null)
  const localRef = useRef<House | null>(null)
  const baseRef = useRef<House>(live) // what the database had when our unsaved edits started
  const past = useRef<House[]>([])
  const future = useRef<House[]>([])
  const [, bump] = useState(0)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timer = useRef<number | null>(null)

  const house = local ?? live

  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const commit = useCallback((ops: Op[]): Promise<void> => {
    const run = async () => {
      let cur = settingsRef.current
      for (let attempt = 0; attempt < 4; attempt++) {
        if (!cur) throw new Error('Still loading — try again in a moment.')
        try {
          const t = (cur.theme ?? {}) as Record<string, unknown>
          const next = { ...t, house: applyOps(normalizeHouse(t.house, t.room), ops) }
          await updateRow<Settings>('settings', 'id', cur.id, cur.version, { theme: next } as unknown as Partial<Settings>)
          return
        } catch (e) {
          if (!(e instanceof ConflictError) || attempt === 3) throw e
          const { data } = await supabase.from('settings').select('*').eq('id', cur.id).maybeSingle()
          cur = (data as Settings | null) ?? settingsRef.current
        }
      }
    }
    const result = queue.current.then(run, run)
    queue.current = result.catch(() => undefined)
    return result
  }, [])

  const flush = useCallback(async () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null }
    const loc = localRef.current
    if (!loc) return
    const prevBase = baseRef.current
    const ops = diffHouse(prevBase, loc)
    if (!ops.length) return
    baseRef.current = loc
    setStatus('saving')
    try {
      await commit(ops)
      setStatus('saved')
    } catch (e) {
      if (baseRef.current === loc) baseRef.current = prevBase // so the next save includes these changes again
      setStatus('error')
      toast(`Couldn’t save the house: ${errMsg(e)}`, 'error')
    }
  }, [commit, toast])

  const schedule = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    setStatus('saving')
    timer.current = window.setTimeout(() => { void flush() }, 900)
  }, [flush])

  /** Change without touching undo history (used while dragging and for tiny live changes). */
  const change = useCallback((fn: (h: House) => House) => {
    const cur = localRef.current ?? liveRef.current
    const next = fn(cur)
    if (next === cur) return
    if (!localRef.current) baseRef.current = liveRef.current
    localRef.current = next
    setLocal(next)
    schedule()
  }, [schedule])

  const checkpoint = useCallback(() => {
    past.current.push(localRef.current ?? liveRef.current)
    if (past.current.length > HISTORY) past.current.shift()
    future.current = []
    bump((n) => n + 1)
  }, [])

  /** One undoable action. */
  const act = useCallback((fn: (h: House) => House) => {
    const cur = localRef.current ?? liveRef.current
    const next = fn(cur) // computed once, so ids made inside fn match what is saved
    if (next === cur) return
    checkpoint()
    change(() => next)
  }, [change, checkpoint])

  const travel = useCallback((from: React.MutableRefObject<House[]>, to: React.MutableRefObject<House[]>) => {
    const target = from.current.pop()
    if (!target) return
    to.current.push(localRef.current ?? liveRef.current)
    if (!localRef.current) baseRef.current = liveRef.current
    localRef.current = target
    setLocal(target)
    bump((n) => n + 1)
    schedule()
  }, [schedule])
  const undo = useCallback(() => travel(past, future), [travel])
  const redo = useCallback(() => travel(future, past), [travel])

  // A newer copy arrived (your partner, or our own save coming back): keep our unsaved edits and put them on top of it.
  useEffect(() => {
    const loc = localRef.current
    if (!loc) { baseRef.current = live; return }
    const ops = diffHouse(baseRef.current, loc)
    baseRef.current = live
    if (!ops.length) { localRef.current = null; setLocal(null); return }
    const merged = normalizeHouse(applyOps(live, ops))
    localRef.current = merged
    setLocal(merged)
  }, [live])

  useEffect(() => {
    const save = () => { void flush() }
    const vis = () => { if (document.visibilityState === 'hidden') save() }
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', vis)
    return () => { window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', vis); save() }
  }, [flush])

  return { house, loaded: Boolean(settings), status, change, act, checkpoint, undo, redo, canUndo: past.current.length > 0, canRedo: future.current.length > 0, flush }
}
