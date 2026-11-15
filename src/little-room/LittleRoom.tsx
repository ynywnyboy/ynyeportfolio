import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReducedMotion } from '../lib/a11y'
import { createPortal } from 'react-dom'
import { Cat, Check, CloudOff, Loader2, Maximize2, Minimize2, Moon, Pencil, Play, Redo2, Shirt, ShieldCheck, ShieldOff, Sparkles, Sun, Sunset, Undo2, ZoomIn, ZoomOut } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { usePlayer } from '../context/PlayerContext'
import { CalendarModal, NoteModal, PhotoModal } from '../components/room/RoomPopups'
import { SectionTitle, Spinner } from '../components/ui'
import { publicUrl } from '../lib/storage'
import { newId, SCENES, type ItemType, type RoomPatch, type RoomState, type TimeMode } from '../lib/room'
import type { Media } from '../lib/types'
import { ROOM_WIDTH, type Asset, type CharPreset, type HItem, type RoomKind } from './types/littleRoom'
import { layoutOf, roomAt, makeRoom, newArtItem, newAssetItem, roomId, solidBlocks } from './utils/house'
import { addAssets, addItem, addRoom, dropLayer, duplicateItem, moveLayer, patchAsset, patchItem, patchRoom, removeAsset, removeItem, removeRoom, moveRoom, resizeRoom, moveInside, saveCharacter, removeCharacter, savePet, removePet, movePet } from './utils/houseOps'
import { useHouse } from './hooks/useHouse'
import { readSaved, saveChar, useWalker } from './hooks/useWalker'
import { HouseView, type Sel } from './components/HouseView'
import type { Sky } from './components/Room'
import { CharacterCreator, spriteOf } from './components/CharacterCreator'
import { defaultPreset } from './utils/character'
import { RoomNavigation } from './components/RoomNavigation'
import { AddRoomDialog } from './components/AddRoomDialog'
import { LayerPanel } from './components/LayerPanel'
import { AssetLibrary } from './components/AssetLibrary'
import { ImageSeparation } from './components/ImageSeparation'
import { GardenBar, type GardenTool } from './components/GardenBar'
import { PetPanel, petSpriteOf } from './components/PetPanel'
import { usePet } from './hooks/usePet'
import { readPetPref, savePetPref, type PetMode } from './utils/pets'
import { isPlot, localX, nearestSlot, plantSeed, removePlant, seedOf, waterAll, waterSlot } from './utils/garden'
import { RoomSettings } from './components/RoomSettings'
import { ItemBar } from './components/ItemBar'
import './styles/little-room.css'

const TIME_KEY = 'olw-room-time'
const readTime = (): TimeMode => { try { const v = localStorage.getItem(TIME_KEY); return v === 'day' || v === 'dusk' || v === 'night' ? v : 'auto' } catch { return 'auto' } }
const skyFor = (mode: TimeMode, hour: number): Sky => (mode === 'auto' ? (hour >= 6 && hour < 17 ? 'day' : hour >= 17 && hour < 19 ? 'dusk' : 'night') : mode)
const typing = (t: EventTarget | null) => { const e = t as HTMLElement | null; return !!e && (e.tagName === 'INPUT' || e.tagName === 'TEXTAREA' || e.tagName === 'SELECT' || e.isContentEditable) }
const pill = 'inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-blush-600 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-40 dark:bg-white/10 dark:text-blush-200'
const KIND_MSG: Record<string, string> = {
  tv: 'Movie night? 🍿', fridge: 'Snacks! 🍓', toilet: '…privacy, please 🙈', sink: 'Squeaky clean ✨', bathtub: 'Bubble bath time 🛁',
  sofa: 'Cuddle time ♡', mirror: 'Looking cute today ✨', nightstand: 'Always a good book and a glass of water here ✨',
}

export default function LittleRoomPage() {
  const { settings, media } = useSite()
  const player = usePlayer()
  const hs = useHouse()
  const { house } = hs
  const houseRef = useRef(house)
  houseRef.current = house
  const reduced = !!useReducedMotion()
  const lowEnd = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency ?? 8) <= 2
  const motionOn = !reduced && !lowEnd

  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<Sel | null>(null)
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(1.6)
  const [tab, setTab] = useState<'library' | 'layers' | 'room'>('library')
  const [charId, setCharId] = useState(() => readSaved().preset)
  const [charOpen, setCharOpen] = useState(false)
  const [collision, setCollisionState] = useState(() => { try { return localStorage.getItem('olw-collision') !== '0' } catch { return true } })
  const setCollision = (v: boolean) => { setCollisionState(v); try { localStorage.setItem('olw-collision', v ? '1' : '0') } catch { /* ignore */ } }
  const [timeMode, setTimeModeState] = useState<TimeMode>(readTime)
  const [hour, setHour] = useState(() => new Date().getHours())
  const [resting, setResting] = useState(false)
  const [bubble, setBubble] = useState<string | null>(null)
  const [modal, setModal] = useState<'note' | 'calendar' | null>(null)
  const [photo, setPhoto] = useState<Media | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [sep, setSep] = useState<{ file: Blob; name: string } | null>(null)
  const [full, setFull] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [petOpen, setPetOpen] = useState(false)
  const [petPref, setPetPref] = useState(readPetPref)
  const [tool, setTool] = useState<GardenTool>('water')
  const [seed, setSeed] = useState('daisy')
  const [bloom, setBloom] = useState<string | null>(null)
  const clip = useRef<HItem | null>(null)
  const [hasClip, setHasClip] = useState(false)
  const timers = useRef<number[]>([])
  const nudgeAt = useRef(0)

  // ---- fullscreen (a fixed layer + the browser's real fullscreen where it exists); the page behind can't scroll
  const enterFull = () => { setFull(true); try { void document.documentElement.requestFullscreen?.() } catch { /* the fixed layer is enough */ } }
  const exitFull = useCallback(() => { setFull(false); try { if (document.fullscreenElement) void document.exitFullscreen() } catch { /* ignore */ } }, [])
  useEffect(() => {
    if (!full) return
    const html = document.documentElement
    const prev = [html.style.overflow, document.body.style.overflow, html.style.overscrollBehavior]
    html.style.overflow = 'hidden'; document.body.style.overflow = 'hidden'; html.style.overscrollBehavior = 'none'
    const onFs = () => { if (!document.fullscreenElement) setFull(false) }
    document.addEventListener('fullscreenchange', onFs)
    return () => { html.style.overflow = prev[0]; document.body.style.overflow = prev[1]; html.style.overscrollBehavior = prev[2]; document.removeEventListener('fullscreenchange', onFs) }
  }, [full])
  useEffect(() => () => { try { if (document.fullscreenElement) void document.exitFullscreen() } catch { /* ignore */ } }, [])

  useEffect(() => { const t = window.setInterval(() => { setHour(new Date().getHours()); setNow(Date.now()) }, 30000); return () => window.clearInterval(t) }, [])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)) }
  const say = useCallback((t: string) => { setBubble(t); timers.current.push(window.setTimeout(() => setBubble((b) => (b === t ? null : b)), 2800)) }, [])
  const setTimeMode = (t: TimeMode) => { setTimeModeState(t); try { localStorage.setItem(TIME_KEY, t) } catch { /* ignore */ } }
  const sky = skyFor(timeMode, hour)

  const photos = useMemo(() => Object.fromEntries(media.filter((m) => m.kind === 'image').map((m) => [m.id, publicUrl(m.storage_path)])), [media])

  // ---- walking + camera
  const blocks = useMemo(() => solidBlocks(house), [house])
  const layout = useMemo(() => layoutOf(house), [house])
  const walker = useWalker({ worldW: layout.total, roomX: layout.x, top: layout.top, worldH: layout.worldH, blocks, collision, editing, zoom, aspect, onRoom: setActive })
  // ---- pets: two behaviours only (idle / follow)
  const petObj = petPref.active ? house.pets[petPref.active] ?? null : null
  const petSprite = useMemo(() => (petObj ? petSpriteOf(petObj) : null), [petObj?.species, petObj?.coat, petObj?.accent, petObj?.sheet]) // eslint-disable-line react-hooks/exhaustive-deps
  const petHome = useMemo(() => {
    const at = petObj?.at
    const i = Math.max(0, house.roomOrder.indexOf(at?.room ?? ''))
    return { x: (layout.x[i] ?? 0) + (at?.x ?? 300), y: at?.y ?? 490 }
  }, [petObj?.at.room, petObj?.at.x, petObj?.at.y, house.roomOrder, layout]) // eslint-disable-line react-hooks/exhaustive-deps
  const petApi = usePet({ active: !!petObj, mode: petPref.mode, editing, home: petHome, worldW: layout.total, blocks, collision, reduced, walker })
  const rememberPet = useCallback((record: boolean) => {
    const id = petPref.active
    if (!id || !houseRef.current.pets[id]) return
    const w = petApi.where(), lay = layoutOf(houseRef.current), i = roomAt(lay, w.x)
    const at = { room: houseRef.current.roomOrder[i], x: Math.round(w.x - lay.x[i]), y: Math.round(w.y) }
    if (record) hs.act((h) => movePet(h, id, at)); else hs.change((h) => movePet(h, id, at))
  }, [petPref.active, petApi, hs])
  const chooseMode = (m: PetMode) => {
    if (m === 'idle' && petPref.mode === 'follow') rememberPet(false) // it stays where it is now
    setPetPref((p) => ({ ...p, mode: m })); savePetPref({ mode: m })
  }
  const choosePet = (id: string | null) => { setPetPref((p) => ({ ...p, active: id })); savePetPref({ active: id }) }
  const petTap = () => { if (petObj) { setBloom(null); say(petPref.mode === 'follow' ? `${petObj.name} trots along ♡` : `${petObj.name} says hi ♡`) } }

  const preset: CharPreset = house.characters[charId] ?? house.characters.default ?? defaultPreset()
  const sprite = useMemo(() => spriteOf(preset), [preset])

  const rooms = house.roomOrder.length
  const ai = Math.min(active, rooms - 1)
  const rid = house.roomOrder[ai]
  const room = house.rooms[rid]

  const selItem = selected ? house.rooms[selected.room]?.items[selected.id] ?? null : null
  useEffect(() => { if (selected && !house.rooms[selected.room]?.items[selected.id]) setSelected(null) }, [selected, house])

  const select = (s: Sel | null) => { setSelected(s); if (s) { const i = house.roomOrder.indexOf(s.room); if (i >= 0) setActive(i) } }
  const goRoom = (i: number) => {
    setActive(i)
    if (editing) walker.panTo(layout.x[i] + layout.w[i] / 2)
    else walker.place(layout.x[i] + 70, 450, 'right') // you step in through that room's entrance
  }

  const startEdit = () => { setEditing(true); setSelected(null); walker.releaseAll() }
  const stopEdit = () => { setEditing(false); setSelected(null); void hs.flush() }

  // ---- editing actions (each one is a single undo step)
  const patchSel = (p: Partial<HItem>) => selected && hs.act((h) => patchItem(h, selected.room, selected.id, p))
  const place = (it: HItem) => { hs.act((h) => addItem(h, rid, it)); setSelected({ room: rid, id: it.id }) }
  const jitter = () => (Math.random() - 0.5) * 120
  const placeArt = (t: ItemType) => place(newArtItem(t, { x: Math.round(400 + jitter()) }))
  const placeAsset = (a: Asset) => place(newAssetItem(a, { x: Math.round(400 + jitter()) }))
  const del = () => {
    if (!selected || !selItem) return
    if (selItem.locked) { say('Unlock it first 🔒'); return }
    hs.act((h) => removeItem(h, selected.room, selected.id)); setSelected(null)
  }
  const dup = (iid?: string) => {
    const r = selected?.room ?? rid, id = iid ?? selected?.id
    if (!id) return
    let nid: string | null = null
    hs.act((h) => { const o = duplicateItem(h, r, id); nid = o.id; return o.house })
    if (nid) setSelected({ room: r, id: nid })
  }
  const copy = () => { if (selItem) { clip.current = selItem; setHasClip(true); say('Copied ✓') } }
  const paste = () => {
    const c = clip.current
    if (!c) return
    const it: HItem = { ...c, id: newId(), x: Math.min(house.rooms[rid]?.w ?? ROOM_WIDTH, c.x + 30), y: c.y + 12, locked: undefined }
    if (it.kind === 'asset' && it.assetId && !house.assets[it.assetId]) { say('That picture was deleted from the library.'); return }
    place(it)
  }
  const addNewRoom = (kind: RoomKind, name: string, index: number) => {
    const r = makeRoom(roomId(), kind, name)
    hs.act((h) => addRoom(h, r, index))
    setActive(index)
    later(() => walker.panTo(layoutOf(houseRef.current).x[index] + ROOM_WIDTH / 2), 120)
  }
  const removeThisRoom = () => { hs.act((h) => removeRoom(h, rid)); setSelected(null); setActive((a) => Math.max(0, a - 1)) }
  const onSeparated = (list: Asset[], placeThem: boolean) => {
    hs.act((h) => {
      let n = addAssets(h, list)
      if (placeThem) list.forEach((a, i) => { n = addItem(n, rid, newAssetItem(a, { x: Math.round(160 + ((i * 130) % 520)) })) })
      return n
    })
  }

  // ---- keyboard shortcuts while editing
  useEffect(() => {
    if (!editing) return
    const key = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase()
      if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) hs.redo(); else hs.undo(); return }
      if (mod && k === 'y') { e.preventDefault(); hs.redo(); return }
      if (mod && k === 'c') { e.preventDefault(); copy(); return }
      if (mod && k === 'v') { e.preventDefault(); paste(); return }
      if (mod && k === 'd') { e.preventDefault(); dup(); return }
      if (!selected || !selItem) return
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); del(); return }
      if (e.key === 'Escape') { setSelected(null); return }
      const d = e.key === 'ArrowLeft' ? [-1, 0] : e.key === 'ArrowRight' ? [1, 0] : e.key === 'ArrowUp' ? [0, -1] : e.key === 'ArrowDown' ? [0, 1] : null
      if (d && !selItem.locked) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 2, now = Date.now()
        if (now - nudgeAt.current > 700) hs.checkpoint()
        nudgeAt.current = now
        hs.change((h) => patchItem(h, selected.room, selected.id, { x: Math.max(0, Math.min(house.rooms[selected.room]?.w ?? ROOM_WIDTH, selItem.x + d[0] * step)), y: Math.max(0, selItem.y + d[1] * step) }))
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  // ---- things you can tap while exploring
  const tendPlot = (it: HItem, r: { id: string }, at: { x: number }) => {
    const live = houseRef.current.rooms[r.id]?.items[it.id] ?? it
    const slot = nearestSlot(live.type, localX(live, at.x)), t = Date.now()
    if (tool === 'plant') {
      const o = plantSeed(live, slot, seed, bloom ?? undefined, t)
      hs.act((h) => patchItem(h, r.id, it.id, { plants: o.item.plants }))
      say(o.replaced ? `Replaced with ${seedOf(seed).label.toLowerCase()} 🌱` : `Planted ${seedOf(seed).label.toLowerCase()} 🌱`)
    } else if (tool === 'remove') {
      const o = removePlant(live, slot)
      if (!o.had) { say('Nothing planted there'); return }
      hs.act((h) => patchItem(h, r.id, it.id, { plants: o.item.plants ?? [] })); say('Pulled up 🍂')
    } else {
      const o = waterSlot(live, slot, t)
      if (o.result === 'empty') say('Nothing planted there yet — pick Plant 🌱')
      else if (o.result === 'cooldown') say('Still damp — give it a moment 💧')
      else if (o.result === 'grown') { hs.change((h) => patchItem(h, r.id, it.id, { plants: o.item.plants })); say('Already fully grown 🌸') }
      else { hs.change((h) => patchItem(h, r.id, it.id, { plants: o.item.plants })); say('Splash! 💧'); setNow(t) }
    }
    setNow(t)
  }
  const waterEverything = () => {
    const t = Date.now(), cur = houseRef.current
    const changes: [string, HItem][] = []
    let total = 0
    for (const rid2 of cur.roomOrder) { const o = waterAll(Object.values(cur.rooms[rid2].items), t); total += o.count; o.items.forEach((x, i) => { if (x !== Object.values(cur.rooms[rid2].items)[i]) changes.push([rid2, x]) }) }
    if (!changes.length) { say('Nothing needs water right now 🌿'); return }
    hs.change((h) => changes.reduce((acc, [r2, x]) => patchItem(acc, r2, x.id, { plants: x.plants }), h))
    say(`Watered ${total} plant${total === 1 ? '' : 's'} 💧`); setNow(t)
  }
  const onTap = (it: HItem, r: { id: string; lights: boolean; scene: string }, at: { x: number }) => {
    if (isPlot(it)) { tendPlot(it, r, at); return }
    const roomPatch = (p: Record<string, unknown>) => hs.change((h) => patchRoom(h, r.id, p))
    const lights = () => { roomPatch({ lights: !r.lights }); say(r.lights ? 'Lights off — sweet dreams 🌙' : 'Lights on ✨') }
    switch (it.type) {
      case 'bed': setResting(true); say('Mmm… so cozy ♡'); later(() => setResting(false), 5200); break
      case 'cat': setResting(true); say('Purrr… ♡'); later(() => setResting(false), 3000); break
      case 'window': { const i = SCENES.findIndex((s) => s.id === r.scene); const n = SCENES[(i + 1) % SCENES.length]; roomPatch({ scene: n.id }); say(`Outside: ${n.label}`); break }
      case 'radio':
        if (player.tracks.length === 0) say('Add songs in the dashboard to fill our house with music ♪')
        else { player.toggle(); say(player.playing ? 'Music paused' : `♪ ${player.current?.title ?? 'Our music'}`) }
        break
      case 'frame': { const m = it.media ? media.find((x) => x.id === it.media) : undefined; if (m) setPhoto(m); else say('This frame is waiting for a memory — tap Edit ♡'); break }
      case 'desk': setModal('note'); break
      case 'calendar': setModal('calendar'); break
      case 'lamp': case 'floorlamp': case 'neon': case 'lights': lights(); break
      default: if (it.type && KIND_MSG[it.type]) say(KIND_MSG[it.type])
    }
  }

  // The old popups were written for the single room; give them the two things they use (the desk note and the dates).
  const shim = useMemo(() => ({ note: house.note, dates: house.dates }) as unknown as RoomState, [house.note, house.dates])
  const quick = useCallback((p: RoomPatch) => {
    const s = p.set
    if (!s) return
    hs.act((h) => ({ ...h, ...(s.note !== undefined ? { note: s.note } : {}), ...(s.dates !== undefined ? { dates: s.dates } : {}) }))
  }, [hs.act]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hs.loaded) return <Spinner label="Opening our little house…" />

  const TimeIcon = sky === 'day' ? Sun : sky === 'dusk' ? Sunset : Moon
  const lightsOn = !!room?.lights
  const saveNote = hs.status === 'saving' ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : hs.status === 'error'
    ? <button className="inline-flex items-center gap-1 text-red-500" onClick={() => void hs.flush()}><CloudOff size={13} /> Not saved — retry</button>
    : hs.status === 'saved' ? <><Check size={13} /> Saved</> : null

  const tabBtn = (id: typeof tab, label: string) => (
    <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition ${tab === id ? 'bg-blush-500 text-white' : 'text-blush-600 hover:bg-white/60 dark:text-blush-200'}`}>{label}</button>
  )

  const content = (
    <div
      className={full ? 'fixed inset-0 z-[60] flex flex-col gap-2 overflow-hidden bg-gradient-to-b from-cream-50 via-blush-100 to-blush-200 p-2 dark:from-night-900 dark:via-night-800 dark:to-[#2a1f3d]' : undefined}
      style={full ? { overscrollBehavior: 'none', paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' } : undefined}
    >
      {!full && <SectionTitle script="Our Little House" title="ynnywnnysboyscoderot" sub="Walk through every room, move things around, and make it ours." />}

      <div className={full ? 'flex min-h-0 flex-1 flex-col gap-2 landscape:flex-row lg:flex-row' : 'mt-6 grid gap-4 lg:grid-cols-[1fr_21rem]'}>
        <div className={full ? 'flex min-h-0 min-w-0 flex-1 flex-col gap-2' : 'min-w-0'}>
          <RoomNavigation house={house} current={ai} onGo={goRoom} onAdd={() => setAddOpen(true)} editing={editing} />

          <motion.div
            initial={motionOn ? { opacity: 0, scale: 0.95, y: 14 } : { opacity: 0 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`relative overflow-hidden rounded-3xl shadow-dreamy ring-4 ring-white/70 dark:ring-white/10 ${full ? 'min-h-0 flex-1' : 'h-[min(68dvh,34rem)] min-h-[17rem]'}`}
          >
            <HouseView
              house={house} sky={sky} motion={motionOn} editing={editing} zoom={zoom} selected={selected} onSelect={select}
              change={hs.change} checkpoint={hs.checkpoint} onTap={onTap} onAspect={setAspect} now={now} pet={petSprite} petApi={petApi} onPetTap={petTap} onPetDrop={() => rememberPet(true)}
              playing={player.playing && player.tracks.length > 0} resting={resting} photos={photos} walker={walker} sprite={sprite} keysEnabled={!modal && !addOpen && !sep && !charOpen && !petOpen}
            />
            <AnimatePresence>
              {bubble && (
                <motion.div key={bubble} role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-x-0 top-3 mx-auto w-fit max-w-[90%] rounded-full bg-white/85 px-4 py-1.5 text-center text-sm text-blush-600 shadow-soft backdrop-blur">{bubble}</motion.div>
              )}
            </AnimatePresence>
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium text-blush-600 backdrop-blur">{editing ? 'Editing mode' : 'Walking mode'}</span>
          </motion.div>

          <div className="shrink-0">
            {editing && selItem && selected && (
              <ItemBar item={selItem} media={media} canPaste={hasClip} onPatch={patchSel} onDuplicate={() => dup()} onCopy={copy} onPaste={paste} onDelete={del} />
            )}
            {!editing && (room?.kind === 'garden' || (Object.values(room?.items ?? {}) as HItem[]).some(isPlot)) && (
              <GardenBar tool={tool} onTool={setTool} seed={seed} onSeed={setSeed} color={bloom} onColor={setBloom} onWaterAll={waterEverything} />
            )}
            {editing && !selItem && <p className="mt-1 text-center text-xs text-stone-500 sm:text-sm">Tap an item to select it, then drag it. Drag empty space to look around.</p>}

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              {editing ? (
                <>
                  <button className={pill} onClick={hs.undo} disabled={!hs.canUndo} aria-label="Undo"><Undo2 size={14} /> Undo</button>
                  <button className={pill} onClick={hs.redo} disabled={!hs.canRedo} aria-label="Redo"><Redo2 size={14} /> Redo</button>
                  <button className="inline-flex items-center gap-1.5 rounded-full bg-blush-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm" onClick={stopEdit}><Play size={14} /> Walk</button>
                </>
              ) : (
                <>
                  <button className={pill} onClick={startEdit}><Pencil size={14} /> Edit room</button>
                  <button className={pill} onClick={() => { hs.change((h) => patchRoom(h, rid, { lights: !lightsOn })); say(lightsOn ? 'Lights off 🌙' : 'Lights on ✨') }} aria-pressed={lightsOn}><Sparkles size={14} /> {lightsOn ? 'Lights on' : 'Lights off'}</button>
                  <button className={pill} onClick={() => setCollision(!collision)} aria-pressed={collision} title="Furniture blocks you when on">{collision ? <ShieldCheck size={14} /> : <ShieldOff size={14} />} Collision {collision ? 'on' : 'off'}</button>
                </>
              )}
              <button className={pill} onClick={() => setCharOpen(true)}><Shirt size={14} /> Character</button>
              <button className={pill} onClick={() => setPetOpen(true)}><Cat size={14} /> {petObj ? petObj.name : 'Pets'}{petObj ? (petPref.mode === 'follow' ? ' · follows' : ' · idle') : ''}</button>
              <button className={pill} onClick={() => setTimeMode(sky === 'day' ? 'dusk' : sky === 'dusk' ? 'night' : 'day')} aria-label="Change time of day"><TimeIcon size={14} /> {sky === 'day' ? 'Day' : sky === 'dusk' ? 'Dusk' : 'Night'}</button>
              <button className={pill} onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))} aria-label="Zoom out" disabled={zoom <= 0.6}><ZoomOut size={14} /></button>
              <button className={pill} onClick={() => setZoom((z) => Math.min(2, +(z + 0.2).toFixed(1)))} aria-label="Zoom in" disabled={zoom >= 2}><ZoomIn size={14} /></button>
              <button className={pill} onClick={full ? exitFull : enterFull} aria-label={full ? 'Exit fullscreen' : 'Fullscreen'}>{full ? <Minimize2 size={14} /> : <Maximize2 size={14} />} {full ? 'Exit' : 'Fullscreen'}</button>
              {saveNote && <span className="inline-flex items-center gap-1 text-xs text-stone-500" aria-live="polite">{saveNote}</span>}
            </div>
          </div>
        </div>

        {editing && (
          <aside className={`flex min-h-0 flex-col gap-2 rounded-3xl bg-white/60 p-3 shadow-soft backdrop-blur dark:bg-white/5 ${full ? 'max-h-[44dvh] landscape:max-h-full landscape:w-72 lg:max-h-full lg:w-80' : 'max-h-[40rem]'}`}>
            <div className="flex gap-1 rounded-full bg-blush-50 p-1 dark:bg-white/5">{tabBtn('library', 'Library')}{tabBtn('layers', 'Layers')}{tabBtn('room', 'Room')}</div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === 'library' && (
                <AssetLibrary
                  assets={house.assets} onPlaceArt={placeArt} onPlaceAsset={placeAsset}
                  onAdded={(l) => hs.act((h) => addAssets(h, l))}
                  onRename={(id, p) => hs.act((h) => patchAsset(h, id, p))}
                  onDelete={(a) => hs.act((h) => removeAsset(h, a.id))}
                  onSeparate={(file, name) => setSep({ file, name })}
                />
              )}
              {tab === 'layers' && (
                <LayerPanel
                  house={house} roomId={rid} selected={selected} onSelect={select}
                  onPatch={(iid, p) => hs.act((h) => patchItem(h, rid, iid, p))}
                  onMove={(iid, how) => hs.act((h) => moveLayer(h, rid, iid, how))}
                  onDrop={(iid, t) => hs.act((h) => dropLayer(h, rid, iid, t))}
                  onDuplicate={(iid) => dup(iid)}
                  onDelete={(iid) => { hs.act((h) => removeItem(h, rid, iid)); if (selected?.id === iid) setSelected(null) }}
                />
              )}
              {tab === 'room' && room && (
                <RoomSettings
                  house={house} roomId={rid}
                  onRoom={(p) => hs.act((h) => patchRoom(h, rid, p))}
                  onHouse={(p) => hs.act((h) => ({ ...h, ...p }))}
                  onSize={(w, hh) => hs.act((h) => resizeRoom(h, rid, w, hh))}
                  onFit={() => hs.act((h) => moveInside(h, rid))}
                  onMove={(d) => hs.act((h) => moveRoom(h, rid, d))}
                  onRemove={removeThisRoom}
                />
              )}
            </div>
            <p className="text-center text-[11px] text-stone-400">Changes save automatically · shared with your partner</p>
          </aside>
        )}
      </div>

      <CharacterCreator
        open={charOpen} onClose={() => setCharOpen(false)} house={house} activeId={preset.id} reduced={reduced}
        onUse={(id) => { setCharId(id); saveChar({ preset: id }) }}
        onSave={(p) => hs.act((h) => saveCharacter(h, p))}
        onDelete={(id) => hs.act((h) => removeCharacter(h, id))}
      />
      <PetPanel
        open={petOpen} onClose={() => setPetOpen(false)} house={house} activeId={petPref.active} mode={petPref.mode} reduced={reduced}
        onActive={choosePet} onMode={chooseMode}
        onSave={(p) => hs.act((h) => savePet(h, p))}
        onDelete={(id) => hs.act((h) => removePet(h, id))}
      />
      <AddRoomDialog open={addOpen} onClose={() => setAddOpen(false)} house={house} onAdd={addNewRoom} />
      <ImageSeparation file={sep?.file ?? null} name={sep?.name ?? ''} onClose={() => setSep(null)} onSaved={onSeparated} />
      <NoteModal key={modal === 'note' ? house.note : 'closed'} open={modal === 'note'} onClose={() => setModal(null)} room={shim} quick={quick} />
      <CalendarModal open={modal === 'calendar'} onClose={() => setModal(null)} room={shim} settings={settings} quick={quick} />
      <PhotoModal media={photo} onClose={() => setPhoto(null)} />
    </div>
  )

  return full ? createPortal(content, document.body) : content
}
