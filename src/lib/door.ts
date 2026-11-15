/** Helpers for the Little World Door. Storage may be unavailable (private mode, blocked): never throw. */

const SEEN_KEY = 'olw-door-seen'
const SOUND_KEY = 'olw-door-sound'

let seenMemory = false
let soundMemory: boolean | null = null

export function hasSeenDoor(): boolean {
  if (seenMemory) return true
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}

export function markDoorSeen() {
  seenMemory = true
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
}

export function readDoorSound(): boolean {
  if (soundMemory !== null) return soundMemory
  try { return localStorage.getItem(SOUND_KEY) !== '0' } catch { return true }
}

export function writeDoorSound(on: boolean) {
  soundMemory = on
  try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch { /* ignore */ }
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "2026-11-01" -> "1 November 2026". Returns null for anything that isn't a real calendar date. */
export function formatCreatedOn(iso: string | undefined | null): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso ?? '').trim())
  if (!m) return null
  const y = +m[1], mo = +m[2], d = +m[3]
  const dt = new Date(y, mo - 1, d) // local date: no timezone shift
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null
  return `${d} ${MONTHS[mo - 1]} ${y}`
}

/** Should the door show on this page load? Every visit, but never during auth redirects / password recovery. */
export function shouldShowDoorOnLoad(pathname: string, search: string, hash: string): boolean {
  void pathname
  if (/access_token|refresh_token|type=recovery|error_description/.test(hash)) return false
  if (/[?&](code|error|error_description)=/.test(search)) return false
  return true
}
