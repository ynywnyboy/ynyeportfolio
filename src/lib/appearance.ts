/**
 * "Customize Our World": the shared look of the site beyond the accent colour — background,
 * fonts, decorations, card style and animated effect. Stored inside the existing
 * `settings.theme` JSON (no new tables) so it syncs between partners through the existing
 * realtime subscription. Everything is applied through CSS variables / data attributes on <html>.
 */

export type BgKind = 'default' | 'solid' | 'gradient' | 'preset' | 'image'
export type MotionLevel = 'off' | 'subtle' | 'normal' | 'dreamy'
export type CardStyle = 'rounded' | 'scrapbook' | 'polaroid' | 'glass' | 'minimal'
export type ShadowLevel = 'none' | 'soft' | 'dreamy'
export type DecoKind = 'hearts' | 'stars' | 'flowers' | 'petals' | 'butterflies' | 'bubbles' | 'pixels'
export type EffectKind = 'none' | 'rain' | 'petals' | 'snow' | 'stars' | 'fireflies' | 'waves'

export type OpeningKind = 'door' | 'envelope' | 'gift' | 'book' | 'polaroid' | 'curtain' | 'window' | 'liquid-glass' | 'dreamy-fade' | 'cinematic' | 'particle' | 'bubble-pop' | 'sliding-panels' | 'heart' | 'disabled'

export interface Appearance {
  bg: { kind: BgKind; color: string; from: string; to: string; angle: number; preset: string; image: string; dim: number }
  fonts: { heading: string; body: string }
  decorations: DecoKind[]
  motion: MotionLevel
  card: { style: CardStyle; shadow: ShadowLevel; glow: boolean }
  effect: { kind: EffectKind; enabled: boolean; speed: number; density: number; opacity: number; intensity: number }
  opening: { kind: OpeningKind; speed: number }
}

export interface SavedTheme { id: string; name: string; appearance: Appearance }

export const DECO_KINDS: { id: DecoKind; label: string; emoji: string }[] = [
  { id: 'hearts', label: 'Hearts', emoji: '💗' },
  { id: 'stars', label: 'Stars', emoji: '✨' },
  { id: 'flowers', label: 'Flowers', emoji: '🌸' },
  { id: 'petals', label: 'Petals', emoji: '🌺' },
  { id: 'butterflies', label: 'Butterflies', emoji: '🦋' },
  { id: 'bubbles', label: 'Bubbles', emoji: '🫧' },
  { id: 'pixels', label: 'Pixels', emoji: '👾' },
]

export const EFFECTS: { id: EffectKind; label: string; emoji: string }[] = [
  { id: 'none', label: 'None', emoji: '🚫' },
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'petals', label: 'Falling petals', emoji: '🌸' },
  { id: 'snow', label: 'Snow', emoji: '❄️' },
  { id: 'stars', label: 'Stars', emoji: '🌠' },
  { id: 'fireflies', label: 'Fireflies', emoji: '✨' },
  { id: 'waves', label: 'Ocean waves', emoji: '🌊' },
]

export const MOTION_LEVELS: { id: MotionLevel; label: string; factor: number }[] = [
  { id: 'off', label: 'Off', factor: 0 },
  { id: 'subtle', label: 'Subtle', factor: 0.5 },
  { id: 'normal', label: 'Normal', factor: 1 },
  { id: 'dreamy', label: 'Dreamy', factor: 1.6 },
]
export const motionFactor = (m: MotionLevel) => MOTION_LEVELS.find((x) => x.id === m)?.factor ?? 1

export const CARD_STYLES: { id: CardStyle; label: string }[] = [
  { id: 'rounded', label: 'Rounded' },
  { id: 'scrapbook', label: 'Scrapbook' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'glass', label: 'Glass' },
  { id: 'minimal', label: 'Minimal' },
]

// ---- fonts (loaded from Google Fonts only when chosen) -----------------------
export interface FontChoice { id: string; label: string; stack: string; gf: string | null }
export const HEADING_FONTS: FontChoice[] = [
  { id: 'default', label: 'Playfair Display (classic)', stack: '"Playfair Display", Georgia, serif', gf: null },
  { id: 'cormorant', label: 'Cormorant Garamond', stack: '"Cormorant Garamond", Georgia, serif', gf: 'Cormorant+Garamond:wght@500;700' },
  { id: 'dm-serif', label: 'DM Serif Display', stack: '"DM Serif Display", Georgia, serif', gf: 'DM+Serif+Display' },
  { id: 'lora', label: 'Lora', stack: '"Lora", Georgia, serif', gf: 'Lora:wght@500;700' },
  { id: 'abril', label: 'Abril Fatface', stack: '"Abril Fatface", Georgia, serif', gf: 'Abril+Fatface' },
  { id: 'shippori', label: 'Shippori Mincho', stack: '"Shippori Mincho", Georgia, serif', gf: 'Shippori+Mincho:wght@500;700' },
  { id: 'im-fell', label: 'IM Fell English (vintage)', stack: '"IM Fell English", Georgia, serif', gf: 'IM+Fell+English' },
  { id: 'fredoka', label: 'Fredoka (rounded)', stack: '"Fredoka", system-ui, sans-serif', gf: 'Fredoka:wght@500;600' },
  { id: 'quicksand', label: 'Quicksand', stack: '"Quicksand", system-ui, sans-serif', gf: 'Quicksand:wght@500;700' },
  { id: 'pacifico', label: 'Pacifico (playful)', stack: '"Pacifico", cursive', gf: 'Pacifico' },
  { id: 'silkscreen', label: 'Silkscreen (pixel)', stack: '"Silkscreen", monospace', gf: 'Silkscreen:wght@400;700' },
  { id: 'dancing-script', label: 'Dancing Script', stack: '"Dancing Script", cursive', gf: 'Dancing+Script:wght@400;700' },
  { id: 'indie-flower', label: 'Indie Flower', stack: '"Indie Flower", cursive', gf: 'Indie+Flower' },
  { id: 'caveat', label: 'Caveat', stack: '"Caveat", cursive', gf: 'Caveat:wght@400;700' },
]
export const BODY_FONTS: FontChoice[] = [
  { id: 'default', label: 'Inter (classic)', stack: '"Inter", system-ui, sans-serif', gf: null },
  { id: 'nunito', label: 'Nunito', stack: '"Nunito", system-ui, sans-serif', gf: 'Nunito:wght@400;500;600;700' },
  { id: 'quicksand', label: 'Quicksand', stack: '"Quicksand", system-ui, sans-serif', gf: 'Quicksand:wght@400;500;600;700' },
  { id: 'dm-sans', label: 'DM Sans', stack: '"DM Sans", system-ui, sans-serif', gf: 'DM+Sans:wght@400;500;600' },
  { id: 'poppins', label: 'Poppins', stack: '"Poppins", system-ui, sans-serif', gf: 'Poppins:wght@400;500;600' },
  { id: 'zen-maru', label: 'Zen Maru Gothic', stack: '"Zen Maru Gothic", system-ui, sans-serif', gf: 'Zen+Maru+Gothic:wght@400;500;700' },
  { id: 'lora', label: 'Lora (serif)', stack: '"Lora", Georgia, serif', gf: 'Lora:wght@400;500;600' },
  { id: 'merriweather', label: 'Merriweather (serif)', stack: '"Merriweather", Georgia, serif', gf: 'Merriweather:wght@400;700' },
  { id: 'courier-prime', label: 'Courier Prime (typewriter)', stack: '"Courier Prime", "Courier New", monospace', gf: 'Courier+Prime:wght@400;700' },
]

// ---- background presets ------------------------------------------------------
export interface BgPreset { id: string; name: string; css: string }
const grid = 'linear-gradient(rgba(120,80,200,.13) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, rgba(120,80,200,.13) 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(160deg, #efe7ff, #ffd9f1)'
export const BG_PRESETS: BgPreset[] = [
  { id: 'blush-haze', name: 'Blush haze', css: 'linear-gradient(160deg, #fff1f4, #ffd9e2)' },
  { id: 'lavender-dusk', name: 'Lavender dusk', css: 'linear-gradient(160deg, #f1eaff, #d9c9f7)' },
  { id: 'mint-cream', name: 'Mint cream', css: 'linear-gradient(160deg, #effaf3, #cdeedd)' },
  { id: 'peach-glow', name: 'Peach glow', css: 'linear-gradient(160deg, #fff3e6, #ffd2b3)' },
  { id: 'ocean-mist', name: 'Ocean mist', css: 'linear-gradient(170deg, #e6f6ff, #a9d8f0)' },
  { id: 'sunset', name: 'Sunset', css: 'linear-gradient(170deg, #ffe3d0, #ffb7c5 55%, #c9a7ee)' },
  { id: 'night-sky', name: 'Night sky', css: 'linear-gradient(180deg, #1b1740, #3a2a6b 60%, #6b3f7f)' },
  { id: 'paper', name: 'Old paper', css: 'linear-gradient(160deg, #f7f0e3, #eadfc8)' },
  { id: 'sakura', name: 'Sakura', css: 'radial-gradient(circle at 20% 8%, #ffe9f0, transparent 55%), linear-gradient(#fff7fa, #ffe1ea)' },
  { id: 'cafe-latte', name: 'Café latte', css: 'linear-gradient(160deg, #f6e9db, #e2c8a8)' },
  { id: 'garden', name: 'Garden', css: 'linear-gradient(160deg, #eaf6e4, #c8e6bd)' },
  { id: 'pixel-grid', name: 'Pixel grid', css: grid },
]

// ---- defaults & theme presets ------------------------------------------------
export const DEFAULT_APPEARANCE: Appearance = {
  bg: { kind: 'default', color: '#fff5f7', from: '#fff1f4', to: '#e9defa', angle: 160, preset: 'blush-haze', image: '', dim: 0.15 },
  fonts: { heading: 'default', body: 'default' },
  decorations: ['hearts', 'stars'], // what the site always floated before
  motion: 'normal',
  card: { style: 'rounded', shadow: 'soft', glow: false },
  effect: { kind: 'none', enabled: false, speed: 1, density: 1, opacity: 0.6, intensity: 1 },
  opening: { kind: 'door', speed: 1 },
}

type Deep<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : Deep<T[K]>) : T[K] }
const make = (p: Deep<Appearance>): Appearance => ({
  bg: { ...DEFAULT_APPEARANCE.bg, ...p.bg } as Appearance['bg'],
  fonts: { ...DEFAULT_APPEARANCE.fonts, ...p.fonts },
  decorations: (p.decorations as DecoKind[] | undefined) ?? DEFAULT_APPEARANCE.decorations,
  motion: p.motion ?? DEFAULT_APPEARANCE.motion,
  card: { ...DEFAULT_APPEARANCE.card, ...p.card } as Appearance['card'],
  effect: { ...DEFAULT_APPEARANCE.effect, ...p.effect } as Appearance['effect'],
  opening: { ...DEFAULT_APPEARANCE.opening, ...p.opening } as Appearance['opening'],
})

export interface ThemePreset { id: string; name: string; emoji: string; blurb: string; accent: string; appearance: Appearance }
export const THEME_PRESETS: ThemePreset[] = [
  { id: 'love-letter', name: 'Love Letter', emoji: '💌', blurb: 'Warm paper, pink hearts', accent: '#e8899f',
    appearance: make({ bg: { kind: 'preset', preset: 'blush-haze' }, fonts: { heading: 'cormorant', body: 'lora' }, decorations: ['hearts'], card: { style: 'scrapbook', shadow: 'soft', glow: false } }) },
  { id: 'starlight', name: 'Starlight', emoji: '🌠', blurb: 'Twinkling night sky', accent: '#c3a9ec',
    appearance: make({ bg: { kind: 'preset', preset: 'night-sky' }, fonts: { heading: 'cormorant', body: 'nunito' }, decorations: ['stars'], card: { style: 'glass', shadow: 'dreamy', glow: true }, effect: { kind: 'stars', enabled: true, opacity: 0.8 } }) },
  { id: 'secret-garden', name: 'Secret Garden', emoji: '🌷', blurb: 'Flowers & butterflies', accent: '#7fb8a4',
    appearance: make({ bg: { kind: 'preset', preset: 'garden' }, fonts: { heading: 'lora', body: 'nunito' }, decorations: ['flowers', 'butterflies'], card: { style: 'rounded', shadow: 'soft', glow: false }, effect: { kind: 'fireflies', enabled: true, opacity: 0.55, density: 0.7 } }) },
  { id: 'cozy-cafe', name: 'Cozy Café', emoji: '☕', blurb: 'Latte tones, gentle rain', accent: '#c98a5b',
    appearance: make({ bg: { kind: 'preset', preset: 'cafe-latte' }, fonts: { heading: 'dm-serif', body: 'nunito' }, decorations: [], card: { style: 'polaroid', shadow: 'soft', glow: false }, effect: { kind: 'rain', enabled: true, opacity: 0.45, density: 0.8, speed: 0.8 } }) },
  { id: 'ocean-dreams', name: 'Ocean Dreams', emoji: '🌊', blurb: 'Waves & bubbles', accent: '#6b9bd1',
    appearance: make({ bg: { kind: 'preset', preset: 'ocean-mist' }, fonts: { heading: 'quicksand', body: 'quicksand' }, decorations: ['bubbles'], card: { style: 'glass', shadow: 'soft', glow: false }, effect: { kind: 'waves', enabled: true, opacity: 0.55 } }) },
  { id: 'pixel-love', name: 'Pixel Love', emoji: '👾', blurb: 'Retro arcade romance', accent: '#e86aa8',
    appearance: make({ bg: { kind: 'preset', preset: 'pixel-grid' }, fonts: { heading: 'silkscreen', body: 'dm-sans' }, decorations: ['pixels'], card: { style: 'minimal', shadow: 'none', glow: true } }) },
  { id: 'vintage-memories', name: 'Vintage Memories', emoji: '📷', blurb: 'Sepia & Polaroids', accent: '#b5835a',
    appearance: make({ bg: { kind: 'preset', preset: 'paper' }, fonts: { heading: 'im-fell', body: 'courier-prime' }, decorations: [], motion: 'subtle', card: { style: 'polaroid', shadow: 'soft', glow: false } }) },
  { id: 'sakura-spring', name: 'Sakura Spring', emoji: '🌸', blurb: 'Drifting cherry blossoms', accent: '#f08fb0',
    appearance: make({ bg: { kind: 'preset', preset: 'sakura' }, fonts: { heading: 'shippori', body: 'zen-maru' }, decorations: ['flowers'], card: { style: 'rounded', shadow: 'soft', glow: false }, effect: { kind: 'petals', enabled: true, opacity: 0.7 } }) },
]

// ---- sanitising (the JSON comes from the database; never trust its shape) ----
const HEX = /^#[0-9a-fA-F]{6}$/
const hex = (v: unknown, d: string) => (typeof v === 'string' && HEX.test(v) ? v : d)
const num = (v: unknown, d: number, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d)
const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T => (typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d)

export function sanitizeAppearance(raw: unknown): Appearance {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const d = DEFAULT_APPEARANCE
  const bg = r.bg ?? {}, fonts = r.fonts ?? {}, card = r.card ?? {}, fx = r.effect ?? {}, op = r.opening ?? {}
  const decos = Array.isArray(r.decorations) ? r.decorations.filter((x: unknown): x is DecoKind => DECO_KINDS.some((k) => k.id === x)) : d.decorations
  return {
    bg: {
      kind: oneOf(bg.kind, ['default', 'solid', 'gradient', 'preset', 'image'] as const, d.bg.kind),
      color: hex(bg.color, d.bg.color), from: hex(bg.from, d.bg.from), to: hex(bg.to, d.bg.to),
      angle: num(bg.angle, d.bg.angle, 0, 360),
      preset: BG_PRESETS.some((p) => p.id === bg.preset) ? bg.preset : d.bg.preset,
      image: typeof bg.image === 'string' && !bg.image.startsWith('blob:') ? bg.image.slice(0, 300) : '',
      dim: num(bg.dim, d.bg.dim, 0, 0.8),
    },
    fonts: {
      heading: HEADING_FONTS.some((f) => f.id === fonts.heading) ? fonts.heading : 'default',
      body: BODY_FONTS.some((f) => f.id === fonts.body) ? fonts.body : 'default',
    },
    decorations: Array.from(new Set(decos)),
    motion: oneOf(r.motion, ['off', 'subtle', 'normal', 'dreamy'] as const, d.motion),
    card: {
      style: oneOf(card.style, ['rounded', 'scrapbook', 'polaroid', 'glass', 'minimal'] as const, d.card.style),
      shadow: oneOf(card.shadow, ['none', 'soft', 'dreamy'] as const, d.card.shadow),
      glow: Boolean(card.glow),
    },
    effect: {
      kind: oneOf(fx.kind, ['none', 'rain', 'petals', 'snow', 'stars', 'fireflies', 'waves'] as const, 'none'),
      enabled: Boolean(fx.enabled),
      speed: num(fx.speed, 1, 0.2, 2.5), density: num(fx.density, 1, 0.2, 2),
      opacity: num(fx.opacity, 0.6, 0.1, 1), intensity: num(fx.intensity, 1, 0.5, 1.6),
    },
    opening: {
      kind: oneOf(op.kind, ['door', 'envelope', 'gift', 'book', 'polaroid', 'curtain', 'window', 'liquid-glass', 'dreamy-fade', 'cinematic', 'particle', 'bubble-pop', 'sliding-panels', 'heart', 'disabled'] as const, d.opening.kind),
      speed: num(op.speed, 1, 0.5, 2),
    },
  }
}

export function sanitizeSaved(raw: unknown): SavedTheme[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string')
    .slice(0, 24)
    .map((t) => ({ id: String(t.id).slice(0, 60), name: String(t.name).slice(0, 40), appearance: sanitizeAppearance(t.appearance) }))
}

export const sameAppearance = (a: Appearance, b: Appearance) => JSON.stringify(a) === JSON.stringify(b)

// ---- applying to the page ----------------------------------------------------
export function bgImageUrl(image: string, toPublicUrl: (p: string) => string): string {
  return image.startsWith('blob:') || image.startsWith('http') ? image : toPublicUrl(image)
}

export function backgroundCss(a: Appearance, toPublicUrl: (p: string) => string): string {
  const b = a.bg
  switch (b.kind) {
    case 'solid': return b.color
    case 'gradient': return `linear-gradient(${Math.round(b.angle)}deg, ${b.from}, ${b.to})`
    case 'preset': return (BG_PRESETS.find((p) => p.id === b.preset) ?? BG_PRESETS[0]).css
    case 'image': return b.image ? `center / cover no-repeat url("${bgImageUrl(b.image, toPublicUrl)}")` : 'none'
    default: return 'none'
  }
}

export interface AppearanceVars { vars: Record<string, string>; attrs: Record<string, string>; links: string[] }

export function buildAppearanceVars(a: Appearance, toPublicUrl: (p: string) => string): AppearanceVars {
  const css = backgroundCss(a, toPublicUrl)
  const custom = a.bg.kind !== 'default' && css !== 'none'
  const isImg = a.bg.kind === 'image'
  const heading = HEADING_FONTS.find((f) => f.id === a.fonts.heading) ?? HEADING_FONTS[0]
  const body = BODY_FONTS.find((f) => f.id === a.fonts.body) ?? BODY_FONTS[0]
  const links = [heading, body].filter((f) => f.gf).map((f) => `https://fonts.googleapis.com/css2?family=${f.gf}&display=swap`)
  return {
    vars: {
      '--olw-bg': css,
      // a soft scrim keeps text readable on photos; in dark mode every custom background is dimmed
      '--olw-dim-light': isImg ? `rgba(255, 250, 245, ${a.bg.dim})` : 'transparent',
      '--olw-dim-dark': `rgba(20, 16, 28, ${isImg ? 0.5 + a.bg.dim * 0.4 : 0.72})`,
      '--font-heading': heading.stack,
      '--font-body': body.stack,
    },
    attrs: {
      'data-bg': custom ? 'custom' : 'default',
      'data-card': a.card.style,
      'data-shadow': a.card.shadow,
      'data-glow': a.card.glow ? 'on' : 'off',
      'data-motion': a.motion,
    },
    links: Array.from(new Set(links)),
  }
}

export function ensureFontLinks(links: string[]) {
  if (typeof document === 'undefined') return
  for (const href of links) {
    if (document.head.querySelector(`link[data-olw-font="${href}"]`)) continue
    const el = document.createElement('link')
    el.rel = 'stylesheet'
    el.href = href
    el.setAttribute('data-olw-font', href)
    document.head.appendChild(el)
  }
}

export function applyAppearance(a: Appearance, toPublicUrl: (p: string) => string) {
  const root = document.documentElement
  const { vars, attrs, links } = buildAppearanceVars(a, toPublicUrl)
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
  for (const [k, v] of Object.entries(attrs)) root.setAttribute(k, v)
  ensureFontLinks(links)
}
