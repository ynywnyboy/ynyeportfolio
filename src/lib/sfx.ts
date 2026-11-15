/**
 * Love Wheel sound effects — synthesized with the Web Audio API, so they are 100% original,
 * need no audio files (nothing copyrighted, nothing to download) and are tiny.
 *
 * They use their own AudioContext, completely separate from the background-music <audio>
 * element, so they can never pause, restart or duck the music player.
 */

export interface SfxSettings {
  enabled: boolean
  volume: number // 0..1
}

const KEY = 'olw-sfx'
const DEFAULTS: SfxSettings = { enabled: true, volume: 0.6 }

function load(): SfxSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const p = JSON.parse(raw) as Partial<SfxSettings>
    return {
      enabled: typeof p.enabled === 'boolean' ? p.enabled : DEFAULTS.enabled,
      volume: typeof p.volume === 'number' ? Math.min(1, Math.max(0, p.volume)) : DEFAULTS.volume,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

let settings: SfxSettings = load()
const subs = new Set<() => void>()

export const sfxSubscribe = (cb: () => void) => {
  subs.add(cb)
  return () => { subs.delete(cb) }
}
export const sfxSnapshot = () => settings

export function setSfx(patch: Partial<SfxSettings>) {
  settings = { ...settings, ...patch }
  try { localStorage.setItem(KEY, JSON.stringify(settings)) } catch { /* ignore */ }
  if (master && ctx) master.gain.setTargetAtTime(masterLevel(), ctx.currentTime, 0.02)
  subs.forEach((cb) => cb())
}

/* ---- audio graph ---- */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null

// Keep it gentle: even at 100% the effects are well below music level.
const masterLevel = () => settings.volume * 0.45

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = masterLevel()
    const comp = ctx.createDynamicsCompressor() // stops overlapping sounds from clipping
    master.connect(comp)
    comp.connect(ctx.destination)
  }
  return ctx
}

/** Call from a click/tap handler: mobile browsers only allow audio to start from a user gesture. */
export function unlockSfx() {
  const c = ensure()
  if (c && c.state === 'suspended') void c.resume()
}

function ready(): AudioContext | null {
  if (!settings.enabled) return null
  const c = ensure()
  if (!c || !master) return null
  if (c.state === 'suspended') void c.resume()
  return c
}

interface ToneOpts {
  freq: number
  freqEnd?: number
  type?: OscillatorType
  at?: number // seconds from now
  dur: number
  gain: number
}

function tone(c: AudioContext, o: ToneOpts) {
  const t0 = c.currentTime + (o.at ?? 0)
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, t0)
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + o.dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(o.gain, t0 + Math.min(0.012, o.dur / 3))
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur)
  osc.connect(g)
  g.connect(master!)
  osc.start(t0)
  osc.stop(t0 + o.dur + 0.03)
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noise
}

/* ---- the sounds ---- */

let lastTick = 0
/** Soft wooden click as the pointer flicks past a slice. */
export function sfxTick() {
  const c = ready()
  if (!c) return
  const now = performance.now()
  if (now - lastTick < 40) return // don't machine-gun when the wheel is fast
  lastTick = now
  tone(c, { freq: 1900, freqEnd: 1100, type: 'triangle', dur: 0.04, gain: 0.5 })
}

/** A gentle swish that rises and fades over the length of the spin. */
export function sfxSpin(seconds: number) {
  const c = ready()
  if (!c) return
  const t0 = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.4
  bp.frequency.setValueAtTime(350, t0)
  bp.frequency.exponentialRampToValueAtTime(1500, t0 + seconds * 0.18)
  bp.frequency.exponentialRampToValueAtTime(260, t0 + seconds)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.25)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds)
  src.connect(bp)
  bp.connect(g)
  g.connect(master!)
  src.start(t0)
  src.stop(t0 + seconds + 0.05)
  // a soft sliding hum underneath
  tone(c, { freq: 220, freqEnd: 110, type: 'sine', dur: seconds, gain: 0.07 })
}

/** Gentle pop + sparkle when the wheel stops. */
export function sfxPop() {
  const c = ready()
  if (!c) return
  tone(c, { freq: 420, freqEnd: 900, type: 'sine', dur: 0.09, gain: 0.5 })
  ;[1319, 1568, 2093].forEach((f, i) => tone(c, { freq: f, type: 'sine', at: 0.07 + i * 0.065, dur: 0.28, gain: 0.16 }))
}

/** Cute two-note notification as the result appears. */
export function sfxChime() {
  const c = ready()
  if (!c) return
  tone(c, { freq: 659, type: 'triangle', dur: 0.45, gain: 0.3 })
  tone(c, { freq: 988, type: 'triangle', at: 0.13, dur: 0.6, gain: 0.26 })
}

/** Soft "lub-dub" heartbeat for small interactions. */
export function sfxHeart() {
  const c = ready()
  if (!c) return
  tone(c, { freq: 330, freqEnd: 250, type: 'sine', dur: 0.11, gain: 0.45 })
  tone(c, { freq: 392, freqEnd: 300, type: 'sine', at: 0.13, dur: 0.14, gain: 0.4 })
}

/**
 * Door-opening sound: latch click, soft wooden creak, rising chime arpeggio, airy whoosh.
 * Controlled by its own toggle (olw-door-sound) rather than the wheel's settings.
 */
export function sfxDoorOpen(on: boolean) {
  if (!on) return
  if (typeof window === 'undefined') return
  const c = ensure()
  if (!c || !master) return
  if (c.state === 'suspended') void c.resume()
  const t0 = c.currentTime
  // latch click
  tone(c, { freq: 1500, freqEnd: 700, type: 'triangle', dur: 0.05, gain: 0.5 })
  tone(c, { freq: 260, freqEnd: 180, type: 'triangle', at: 0.06, dur: 0.08, gain: 0.35 })
  // creak: filtered noise + low saw glide
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 6
  bp.frequency.setValueAtTime(380, t0 + 0.15)
  bp.frequency.linearRampToValueAtTime(620, t0 + 1.1)
  bp.frequency.linearRampToValueAtTime(300, t0 + 1.8)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0 + 0.15)
  g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.5)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9)
  src.connect(bp); bp.connect(g); g.connect(master)
  src.start(t0 + 0.15); src.stop(t0 + 2)
  tone(c, { freq: 95, freqEnd: 140, type: 'sawtooth', at: 0.15, dur: 1.5, gain: 0.035 })
  // chime arpeggio C5 E5 G5 C6 E6
  ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(c, { freq: f, type: 'sine', at: 0.7 + i * 0.16, dur: 1.1, gain: 0.17 }))
  // airy whoosh
  const w = c.createBufferSource()
  w.buffer = noiseBuffer(c)
  w.loop = true
  const hp = c.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const wg = c.createGain()
  wg.gain.setValueAtTime(0.0001, t0 + 0.9)
  wg.gain.exponentialRampToValueAtTime(0.05, t0 + 1.7)
  wg.gain.exponentialRampToValueAtTime(0.0001, t0 + 3)
  w.connect(hp); hp.connect(wg); wg.connect(master)
  w.start(t0 + 0.9); w.stop(t0 + 3.1)
}

export const SFX_PREVIEWS: { id: string; label: string; play: () => void }[] = [
  { id: 'tick', label: 'Tick', play: sfxTick },
  { id: 'spin', label: 'Spin', play: () => sfxSpin(1.6) },
  { id: 'pop', label: 'Sparkle', play: sfxPop },
  { id: 'chime', label: 'Result', play: sfxChime },
  { id: 'heart', label: 'Heart', play: sfxHeart },
]
