import type { CharLook } from '../types/littleRoom'
import { renderSheet } from './sprite'
import { renderPetSheet } from './petSprite'
import type { PetSpecies } from '../types/littleRoom'

const cache = new Map<string, string>()

/** Draws a look's sprite sheet and returns it as a small PNG data URL (cached, so changing nothing costs nothing). */
export function lookSheetUrl(look: CharLook): string {
  const key = JSON.stringify(look)
  const hit = cache.get(key)
  if (hit) return hit
  const s = renderSheet(look)
  const c = document.createElement('canvas')
  c.width = s.width; c.height = s.height
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(s.data), s.width, s.height), 0, 0)
  const url = c.toDataURL('image/png')
  if (cache.size > 40) cache.clear()
  cache.set(key, url)
  return url
}

export function petSheetUrl(species: PetSpecies, coat: string, accent: string): string {
  const key = `pet:${species}:${coat}:${accent}`
  const hit = cache.get(key)
  if (hit) return hit
  const s = renderPetSheet(species, coat, accent)
  const c = document.createElement('canvas')
  c.width = s.width; c.height = s.height
  c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(s.data), s.width, s.height), 0, 0)
  const url = c.toDataURL('image/png')
  cache.set(key, url)
  return url
}
