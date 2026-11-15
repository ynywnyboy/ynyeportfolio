import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

export class ConflictError extends Error {
  constructor() {
    super('Someone else just changed this. Your edit was not saved — the latest version has been loaded.')
    this.name = 'ConflictError'
  }
}

/**
 * Exponential backoff wrapper for async operations
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastErr: any
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (e instanceof ConflictError) throw e // Don't retry conflicts here, handle at call site
      const delay = baseDelay * Math.pow(2, i)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  throw lastErr
}

/**
 * Tiny in-app event bus. Every successful insert / update / delete made through the
 * helpers below is applied to all mounted useTable() lists immediately, so the person
 * who made the change never has to wait for (or depend on) the realtime round-trip.
 * Supabase Realtime still delivers the same change to the other partner's device.
 */
type LocalEvent =
  | { table: string; type: 'upsert'; row: Record<string, any> }
  | { table: string; type: 'delete'; idKey: string; id: unknown }
  | { table: string; type: 'clear' }
const listeners = new Set<(e: LocalEvent) => void>()
export function emitLocal(e: LocalEvent) {
  listeners.forEach((l) => l(e))
}

interface Options {
  orderBy?: string
  ascending?: boolean
  enabled?: boolean
  /** Realtime channel name suffix when the same table is used twice */
  channel?: string
}

/**
 * Loads a whole table and keeps it in sync using Supabase Realtime
 * (INSERT / UPDATE / DELETE are applied locally — no refresh needed).
 */
export function useTable<T extends Record<string, any>>(
  table: string,
  idKey: keyof T & string,
  { orderBy, ascending = true, enabled = true, channel }: Options = {},
) {
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const sortRef = useRef({ orderBy, ascending })
  sortRef.current = { orderBy, ascending }

  const sortRows = useCallback((list: T[]) => {
    const { orderBy: key, ascending: asc } = sortRef.current
    if (!key) return list
    return [...list].sort((a, b) => {
      const av = a[key], bv = b[key]
      if (av === bv) return 0
      if (av == null) return 1
      if (bv == null) return -1
      return (av > bv ? 1 : -1) * (asc ? 1 : -1)
    })
  }, [])

  /** Insert or replace one row. Ignores stale copies (older `version`) so late events can't undo newer edits. */
  const applyRow = useCallback(
    (row: T) => {
      setRows((r) => {
        const i = r.findIndex((x) => x[idKey] === row[idKey])
        if (i < 0) return sortRows([...r, row])
        const cur = r[i] as Record<string, any>
        const incoming = row as Record<string, any>
        if (typeof cur.version === 'number' && typeof incoming.version === 'number' && cur.version > incoming.version) return r
        // Merge instead of replace: a realtime update can leave out big unchanged columns (e.g. settings.theme, which holds the
        // house). Replacing would wipe them, so anything missing from the incoming row keeps its current value.
        return sortRows(r.map((x, j) => (j === i ? ({ ...x, ...row } as T) : x)))
      })
    },
    [idKey, sortRows],
  )

  const reload = useCallback(async () => {
    let q = supabase.from(table).select('*')
    if (orderBy) q = q.order(orderBy, { ascending })
    const { data, error: err } = await q
    if (err) {
      setError(err.message)
    } else {
      setError(null)
      setRows((data ?? []) as unknown as T[])
    }
    setLoading(false)
  }, [table, orderBy, ascending])

  useEffect(() => {
    if (!enabled) { setRows([]); setLoading(false); return }
    setLoading(true)
    reload()
    const onLocal = (e: LocalEvent) => {
      if (e.table !== table) return
      if (e.type === 'upsert') applyRow(e.row as T)
      else if (e.type === 'delete') setRows((r) => r.filter((x) => x[idKey] !== e.id))
      else setRows([])
    }
    listeners.add(onLocal)
    const ch = supabase
      .channel(`rt-${table}${channel ? '-' + channel : ''}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'DELETE') {
          const id = (payload.old as any)?.[idKey]
          if (id !== undefined) setRows((r) => r.filter((x) => x[idKey] !== id))
          else reload()
          return
        }
        applyRow(payload.new as T)
      })
      .subscribe((status) => {
        // After a dropped connection, resync everything
        if (status === 'SUBSCRIBED') reload()
      })
    return () => {
      listeners.delete(onLocal)
      supabase.removeChannel(ch)
    }
  }, [table, enabled, reload, idKey, applyRow, channel])

  return { rows, loading, error, reload }
}

/**
 * Optimistic-concurrency update. The `version` column is bumped by a database
 * trigger on every update; if the row changed since you loaded it, nothing is
 * written and a ConflictError is thrown instead of silently overwriting.
 */
export async function updateRow<T extends Record<string, any>>(
  table: string,
  idKey: string,
  id: string | number,
  version: number,
  patch: Partial<T>,
): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .update(patch as never)
    .eq(idKey, id)
    .eq('version', version)
    .select()
  if (error) throw error
  if (!data || data.length === 0) throw new ConflictError()
  emitLocal({ table, type: 'upsert', row: data[0] })
  return data[0] as T
}

export async function insertRow<T extends Record<string, any>>(table: string, row: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.from(table).insert(row).select().single()
  if (error) throw error
  emitLocal({ table, type: 'upsert', row: data as Record<string, any> })
  return data as T
}

export async function deleteRow(table: string, idKey: string, id: string | number) {
  const { error } = await supabase.from(table).delete().eq(idKey, id)
  if (error) throw error
  emitLocal({ table, type: 'delete', idKey, id })
}

/** Deletes every row of a table the signed-in member may delete (used for "clear history"). */
export async function clearTable(table: string, idKey: string) {
  const { error } = await supabase.from(table).delete().not(idKey, 'is', null)
  if (error) throw error
  emitLocal({ table, type: 'clear' })
}

export function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message
  if (e && typeof e === 'object' && 'message' in e) return String((e as any).message)
  return 'Something went wrong. Please try again.'
}
