import { newId } from '../../lib/room'
import { ROOM_BOTTOM, ROOM_LIMITS, type Asset, type CharPreset, type HItem, type Pet, type HRoom, type House, type LibCat } from '../types/littleRoom'

/** Small pure House → House edits. Every function returns the same object when nothing changed. */

export function patchItem(h: House, rid: string, iid: string, p: Partial<HItem>): House {
  const room = h.rooms[rid], it = room?.items[iid]
  if (!room || !it) return h
  return { ...h, rooms: { ...h.rooms, [rid]: { ...room, items: { ...room.items, [iid]: { ...it, ...p } } } } }
}

export function patchRoom(h: House, rid: string, p: Partial<HRoom>): House {
  const room = h.rooms[rid]
  return room ? { ...h, rooms: { ...h.rooms, [rid]: { ...room, ...p } } } : h
}

export function addItem(h: House, rid: string, it: HItem): House {
  const room = h.rooms[rid]
  if (!room) return h
  return patchRoom(h, rid, { items: { ...room.items, [it.id]: it }, order: [...room.order, it.id] })
}

export function removeItem(h: House, rid: string, iid: string): House {
  const room = h.rooms[rid]
  if (!room?.items[iid]) return h
  const items = { ...room.items }
  delete items[iid]
  return patchRoom(h, rid, { items, order: room.order.filter((x) => x !== iid) })
}

/** Copies an item right above the original, nudged a little so you can see it. */
export function duplicateItem(h: House, rid: string, iid: string): { house: House; id: string | null } {
  const room = h.rooms[rid], it = room?.items[iid]
  if (!room || !it) return { house: h, id: null }
  const copy: HItem = { ...it, id: newId(), name: `${it.name} copy`, x: Math.min(800, it.x + 26), y: Math.min(560, it.y + 14), locked: undefined }
  const at = room.order.indexOf(iid) + 1
  const order = [...room.order]
  order.splice(at, 0, copy.id)
  return { house: patchRoom(h, rid, { items: { ...room.items, [copy.id]: copy }, order }), id: copy.id }
}

export type Move = 'front' | 'back' | 'forward' | 'backward'
export function moveLayer(h: House, rid: string, iid: string, how: Move): House {
  const room = h.rooms[rid]
  if (!room) return h
  const i = room.order.indexOf(iid)
  if (i < 0) return h
  const order = [...room.order]
  order.splice(i, 1)
  const to = how === 'front' ? order.length : how === 'back' ? 0 : how === 'forward' ? Math.min(order.length, i + 1) : Math.max(0, i - 1)
  order.splice(to, 0, iid)
  return order.join() === room.order.join() ? h : patchRoom(h, rid, { order })
}

/** Drag-and-drop in the layer list: put `iid` where `beforeId` currently is (null = very front). */
export function dropLayer(h: House, rid: string, iid: string, targetId: string): House {
  const room = h.rooms[rid]
  if (!room || iid === targetId) return h
  const order = room.order.filter((x) => x !== iid)
  const t = order.indexOf(targetId)
  if (t < 0) return h
  order.splice(t + 1, 0, iid) // the list is shown front-first, so "on top of the target" = just after it in back→front order
  return patchRoom(h, rid, { order })
}

export function addRoom(h: House, room: HRoom, index: number): House {
  const roomOrder = [...h.roomOrder]
  roomOrder.splice(Math.max(0, Math.min(roomOrder.length, index)), 0, room.id)
  return { ...h, rooms: { ...h.rooms, [room.id]: room }, roomOrder }
}

export function removeRoom(h: House, rid: string): House {
  if (h.roomOrder.length <= 1 || !h.rooms[rid]) return h
  const rooms = { ...h.rooms }
  delete rooms[rid]
  return { ...h, rooms, roomOrder: h.roomOrder.filter((x) => x !== rid) }
}

export function moveRoom(h: House, rid: string, dir: -1 | 1): House {
  const i = h.roomOrder.indexOf(rid), j = i + dir
  if (i < 0 || j < 0 || j >= h.roomOrder.length) return h
  const roomOrder = [...h.roomOrder]
  ;[roomOrder[i], roomOrder[j]] = [roomOrder[j], roomOrder[i]]
  return { ...h, roomOrder }
}

export function addAssets(h: House, list: Asset[]): House {
  const assets = { ...h.assets }
  list.forEach((a) => { assets[a.id] = a })
  return { ...h, assets }
}

export function patchAsset(h: House, id: string, p: Partial<Pick<Asset, 'name' | 'category'>>): House {
  return h.assets[id] ? { ...h, assets: { ...h.assets, [id]: { ...h.assets[id], ...p } } } : h
}

/** Removes the library entry and every copy of it placed in any room. */
export function removeAsset(h: House, id: string): House {
  if (!h.assets[id]) return h
  const assets = { ...h.assets }
  delete assets[id]
  const rooms: Record<string, HRoom> = {}
  for (const [rid, room] of Object.entries(h.rooms)) {
    const gone = Object.values(room.items).filter((i) => i.assetId === id).map((i) => i.id)
    if (!gone.length) { rooms[rid] = room; continue }
    const items = { ...room.items }
    gone.forEach((g) => delete items[g])
    rooms[rid] = { ...room, items, order: room.order.filter((x) => !gone.includes(x)) }
  }
  return { ...h, assets, rooms }
}

export const assetsByCategory = (assets: Asset[], cat: LibCat | 'All') => (cat === 'All' ? assets : assets.filter((a) => a.category === cat))

/* ---------------------------------------------------------------- room size */

export const clampSize = (w: number, h: number) => ({
  w: Math.round(Math.max(ROOM_LIMITS.minW, Math.min(ROOM_LIMITS.maxW, Number.isFinite(w) ? w : 800))),
  h: Math.round(Math.max(ROOM_LIMITS.minH, Math.min(ROOM_LIMITS.maxH, Number.isFinite(h) ? h : 520))),
})

/** Changes a room's size. Nothing inside it is moved or removed — use `outsideItems` to see what no longer fits. */
export function resizeRoom(h: House, rid: string, w: number, hgt: number): House {
  const room = h.rooms[rid]
  if (!room) return h
  const s = clampSize(w, hgt)
  return room.w === s.w && room.h === s.h ? h : patchRoom(h, rid, s)
}

/** Items that sit outside the room's walls or ceiling. */
export function outsideItems(room: HRoom): HItem[] {
  const top = ROOM_BOTTOM - room.h
  return room.order.map((id) => room.items[id]).filter((i): i is HItem => !!i && (i.x < 0 || i.x > room.w || i.y < top + 4 || i.y > ROOM_BOTTOM + 40))
}

/** Moves every item that is outside the walls back inside (everything else stays exactly where it is). */
export function moveInside(h: House, rid: string): House {
  const room = h.rooms[rid]
  if (!room) return h
  const top = ROOM_BOTTOM - room.h
  const items = { ...room.items }
  let changed = false
  for (const it of outsideItems(room)) {
    items[it.id] = { ...it, x: Math.round(Math.max(30, Math.min(room.w - 30, it.x))), y: Math.round(Math.max(top + 40, Math.min(ROOM_BOTTOM + 30, it.y))) }
    changed = true
  }
  return changed ? patchRoom(h, rid, { items }) : h
}

/* ---------------------------------------------------------------- characters */
export function saveCharacter(h: House, p: CharPreset): House {
  return { ...h, characters: { ...h.characters, [p.id]: p } }
}
export function removeCharacter(h: House, id: string): House {
  if (id === 'default' || !h.characters[id]) return h
  const characters = { ...h.characters }
  delete characters[id]
  return { ...h, characters }
}

/* ---------------------------------------------------------------- pets */
export function savePet(h: House, p: Pet): House { return { ...h, pets: { ...h.pets, [p.id]: p } } }
export function removePet(h: House, id: string): House {
  if (!h.pets[id]) return h
  const pets = { ...h.pets }
  delete pets[id]
  return { ...h, pets }
}
export function movePet(h: House, id: string, at: Pet['at']): House {
  const p = h.pets[id]
  return p ? { ...h, pets: { ...h.pets, [id]: { ...p, at } } } : h
}
