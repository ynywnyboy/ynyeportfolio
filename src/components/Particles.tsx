import { useMemo } from 'react'
import { motionFactor, type AnimationGroupKey, type DecoKind, type MotionLevel } from '../lib/appearance'
import { useReducedMotion } from '../lib/a11y'
import { useSite } from '../context/SiteContext'

const HEART_GLYPHS = ['♥', '♡', '♥', '♡']
const STAR_GLYPHS = ['✦', '✧', '★', '·']
const FLOWER_GLYPHS = ['🌸', '🌼', '🌷', '💮']

// tiny pixel-art sprites (1 = filled), drawn as crisp SVG rects
const PIXEL_HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000']
const PIXEL_STAR = ['0001000', '0001000', '1111111', '0011100', '0110110', '1100011']

function Pixel({ rows, size, color }: { rows: string[]; size: number; color: string }) {
  const cell = size / 7
  return (
    <svg width={size} height={cell * rows.length} viewBox={`0 0 7 ${rows.length}`} shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' }} aria-hidden>
      {rows.flatMap((row, y) => Array.from(row).map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)))}
    </svg>
  )
}

interface Item { id: number; kind: DecoKind; glyph: string; left: number; size: number; dur: number; delay: number; tone: number }

/**
 * Floating decorations (hearts, stars, flowers, petals, butterflies, bubbles, pixels).
 * CSS transform/opacity animations only.
 */
export function Particles({ enabled = true, kinds = ['hearts', 'stars'], motion = 'normal', group = 'backgroundParticles' }: { enabled?: boolean; kinds?: DecoKind[]; motion?: MotionLevel; group?: AnimationGroupKey }) {
  const reduced = useReducedMotion()
  const { appearance } = useSite()
  const cfg = appearance.animations[group]
  const factor = motionFactor(motion)
  const total = Math.min(48, Math.round(22 * factor))
  const key = kinds.join(',')

  const items = useMemo<Item[]>(() => {
    if (!key) return []
    const list = key.split(',') as DecoKind[]
    return Array.from({ length: total }, (_, i) => {
      const kind = list[i % list.length]
      const glyphs = kind === 'hearts' ? HEART_GLYPHS : kind === 'stars' ? STAR_GLYPHS : kind === 'flowers' ? FLOWER_GLYPHS : kind === 'butterflies' ? ['🦋'] : ['']
      return {
        id: i,
        kind,
        glyph: glyphs[Math.floor(i / list.length) % glyphs.length],
        left: Math.random() * 100,
        size: kind === 'bubbles' ? 10 + Math.random() * 26 : kind === 'butterflies' ? 18 + Math.random() * 12 : kind === 'pixels' ? 14 + Math.random() * 12 : 10 + Math.random() * 16,
        dur: (kind === 'petals' ? 12 : kind === 'butterflies' ? 20 : 14) + Math.random() * 18,
        delay: -Math.random() * 30,
        tone: i % 3,
      }
    })
  }, [key, total])

  if (!enabled || !cfg.enabled || reduced || factor === 0 || !items.length) return null
  const anim = (k: DecoKind) => (k === 'petals' ? 'animate-petalfall' : k === 'butterflies' ? 'animate-flutter' : k === 'pixels' ? 'animate-pixelrise' : 'animate-floaty')
  const color = (tone: number) => (tone === 0 ? '#c3a9ec' : 'var(--accent)')
  // effective per-item duration: base * speed multiplier, clamped
  const baseDur = 16
  const durScale = cfg.duration / baseDur / cfg.speed

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden" style={{ contain: 'strict' }}>
      {items.map((p) => (
        <span
          key={p.id}
          className={`absolute select-none ${p.kind === 'petals' ? 'top-0' : 'bottom-[-40px]'} ${anim(p.kind)}`}
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            lineHeight: 1,
            animationDuration: `${(p.dur * durScale).toFixed(2)}s`,
            animationDelay: `${p.delay}s`,
            color: color(p.tone),
            opacity: Math.max(0.15, 0.6 * cfg.intensity),
            willChange: 'transform, opacity',
          }}
        >
          {p.kind === 'petals' && (
            <span className="block" style={{ width: p.size * 0.9, height: p.size * 1.2, borderRadius: '150% 0 150% 0', background: `linear-gradient(135deg, rgb(var(--blush-200)), rgb(var(--blush-400)))`, opacity: 0.85 }} />
          )}
          {p.kind === 'bubbles' && (
            <span className="block rounded-full" style={{ width: p.size, height: p.size, border: '1.5px solid rgb(255 255 255 / 0.8)', background: 'radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.7), rgb(var(--blush-200) / 0.15) 60%, transparent)' }} />
          )}
          {p.kind === 'butterflies' && <span className="block animate-wing" style={{ transformOrigin: 'center' }}>{p.glyph}</span>}
          {p.kind === 'pixels' && <Pixel rows={p.id % 2 ? PIXEL_STAR : PIXEL_HEART} size={p.size} color={p.tone === 0 ? '#c3a9ec' : 'rgb(var(--blush-500))'} />}
          {(p.kind === 'hearts' || p.kind === 'stars' || p.kind === 'flowers') && p.glyph}
        </span>
      ))}
    </div>
  )
}
