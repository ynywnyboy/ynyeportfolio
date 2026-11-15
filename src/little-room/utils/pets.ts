import { newId } from '../../lib/room'
import type { Pet, PetSheet, PetSpecies } from '../types/littleRoom'

export const SPECIES: { id: PetSpecies; label: string; coat: string; accent: string }[] = [
  { id: 'cat', label: 'Cat', coat: '#e0a96b', accent: '#f4a6bc' },
  { id: 'dog', label: 'Dog', coat: '#d9b48a', accent: '#8a5a34' },
  { id: 'rabbit', label: 'Rabbit', coat: '#f1ece6', accent: '#f4a6bc' },
  { id: 'bird', label: 'Bird', coat: '#7fb5e8', accent: '#f09a3a' },
  { id: 'hamster', label: 'Hamster', coat: '#e8c79a', accent: '#f4a6bc' },
  { id: 'fox', label: 'Fox', coat: '#e87f3a', accent: '#2f2a3d' },
]
export const COATS = ['#e0a96b', '#d9b48a', '#f1ece6', '#8a8a96', '#2f2a3d', '#e87f3a', '#f2d27a', '#7fb5e8', '#b59bea', '#f4a6bc']
export const ACCENTS = ['#f4a6bc', '#8a5a34', '#f09a3a', '#2f2a3d', '#7cc9a0', '#e9708f', '#ffffff']
export const speciesOf = (id: string) => SPECIES.find((s) => s.id === id) ?? SPECIES[0]

export const DEFAULT_PET_ID = 'mochi'
export const newPetId = () => `p${newId()}`

const hex = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d)
const int = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d)

export function normPetSheet(raw: unknown): PetSheet | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  if (typeof r.path !== 'string' || !r.path) return undefined
  return { path: r.path, cols: int(r.cols, 4, 1, 12), rows: r.rows === 3 ? 3 : r.rows === 4 ? 4 : 2, fw: int(r.fw, 32, 4, 512), fh: int(r.fh, 32, 4, 512) }
}

export function normPet(raw: unknown, id: string, roomIds: string[]): Pet | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, any>
  const sp = SPECIES.find((s) => s.id === r.species) ?? SPECIES[0]
  const at = r.at && typeof r.at === 'object' ? r.at : {}
  const room = typeof at.room === 'string' && roomIds.includes(at.room) ? at.room : roomIds[0]
  return {
    id, name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 20) : sp.label, species: sp.id, coat: hex(r.coat, sp.coat), accent: hex(r.accent, sp.accent), sheet: normPetSheet(r.sheet),
    at: { room, x: int(at.x, 300, -200, 2200), y: int(at.y, 480, 300, 640) }, created: typeof r.created === 'string' ? r.created : '',
  }
}

export function defaultPet(roomId: string): Pet {
  const s = SPECIES[0]
  return { id: DEFAULT_PET_ID, name: 'Mochi', species: s.id, coat: s.coat, accent: s.accent, at: { room: roomId, x: 300, y: 490 }, created: '' }
}

/* what each device remembers: which pet is with you, and whether it follows */
const KEY = 'olw-house-pet'
export type PetMode = 'idle' | 'follow'
export interface PetPref { active: string | null; mode: PetMode }
export function readPetPref(): PetPref {
  try { const j = JSON.parse(localStorage.getItem(KEY) ?? '{}'); return { active: typeof j.active === 'string' ? j.active : j.active === null ? null : DEFAULT_PET_ID, mode: j.mode === 'follow' ? 'follow' : 'idle' } } catch { return { active: DEFAULT_PET_ID, mode: 'idle' } }
}
export function savePetPref(p: Partial<PetPref>) { try { localStorage.setItem(KEY, JSON.stringify({ ...readPetPref(), ...p })) } catch { /* ignore */ } }
