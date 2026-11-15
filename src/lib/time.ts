import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export interface Duration {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** Calendar-accurate difference between two instants (from <= to). */
export function calendarDuration(from: Date, to: Date): Duration {
  if (to < from) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  let years = to.getFullYear() - from.getFullYear()
  let months = to.getMonth() - from.getMonth()
  let days = to.getDate() - from.getDate()
  let hours = to.getHours() - from.getHours()
  let minutes = to.getMinutes() - from.getMinutes()
  let seconds = to.getSeconds() - from.getSeconds()

  if (seconds < 0) { seconds += 60; minutes-- }
  if (minutes < 0) { minutes += 60; hours-- }
  if (hours < 0) { hours += 24; days-- }
  if (days < 0) {
    const prevMonthDays = new Date(to.getFullYear(), to.getMonth(), 0).getDate()
    days += prevMonthDays
    months--
  }
  if (months < 0) { months += 12; years-- }
  return { years, months, days, hours, minutes, seconds }
}

export function countdown(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime())
  const s = Math.floor(ms / 1000)
  return {
    done: ms <= 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  }
}

// ---- Server clock -------------------------------------------------------
// Letters unlock according to the database clock. The browser only uses this
// offset to *display* a countdown; the database refuses to hand out the body
// before unlock_at no matter what the device clock says.
let offsetMs = 0
let synced: Promise<void> | null = null

export function syncServerClock(): Promise<void> {
  if (!synced) {
    synced = (async () => {
      try {
        const t0 = Date.now()
        const { data, error } = await supabase.rpc('server_now')
        if (error || !data) return
        const t1 = Date.now()
        offsetMs = new Date(data as string).getTime() - (t0 + t1) / 2
      } catch {
        /* fall back to device clock for display only */
      }
    })()
  }
  return synced
}

export function serverNow(): Date {
  return new Date(Date.now() + offsetMs)
}

/** Re-renders every `ms` and returns the (server-corrected) current time. */
export function useNow(ms = 1000): Date {
  const [now, setNow] = useState(() => serverNow())
  useEffect(() => {
    syncServerClock().then(() => setNow(serverNow()))
    const id = setInterval(() => setNow(serverNow()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function fmtDate(d: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d.length === 10 ? d + 'T00:00:00' : d) : d
  return date.toLocaleDateString(undefined, opts ?? { year: 'numeric', month: 'long', day: 'numeric' })
}

export function fmtDateTime(d: string | Date | null | undefined) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** <input type="datetime-local"> value from an ISO string, in local time. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
