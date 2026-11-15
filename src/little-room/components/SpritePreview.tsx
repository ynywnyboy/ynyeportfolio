import { useEffect, useState } from 'react'
import type { Dir } from '../types/littleRoom'
import type { SpriteInfo } from './CharacterSprite'

/** A live animated preview of a sprite sheet: pick a direction, and it really steps through the walking frames. */
export function SpritePreview({ sprite, dir, walking, scale = 4, reduced = false }: { sprite: SpriteInfo; dir: Dir; walking: boolean; scale?: number; reduced?: boolean }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (!walking || reduced) { setF(0); return }
    const t = window.setInterval(() => setF((n) => (n + 1) % 4), 150)
    return () => window.clearInterval(t)
  }, [walking, reduced])
  const own = sprite.rows >= 4
  const row = dir === 'down' ? 0 : dir === 'up' ? 1 : dir === 'left' ? 2 : own ? 3 : 2
  const frame = walking ? [1, 0, 3, 0][f] % sprite.cols : 0
  const w = sprite.fw * scale, h = sprite.fh * scale
  return (
    <div className="lr-sprite-preview" role="img" aria-label={`Preview facing ${dir}`} style={{
      width: w, height: h, backgroundImage: `url(${sprite.url})`, backgroundRepeat: 'no-repeat',
      backgroundSize: `${sprite.cols * w}px ${sprite.rows * h}px`, backgroundPosition: `${-frame * w}px ${-row * h}px`,
      transform: dir === 'right' && !own ? 'scaleX(-1)' : undefined,
    }} />
  )
}
