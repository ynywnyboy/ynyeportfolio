import { FH, FW, FRAMES } from '../utils/sprite'

export interface SpriteInfo { url: string; cols: number; rows: number; fw: number; fh: number; /** blank pixels under the feet in each cell */ pad: number }
export const defaultSprite = (url: string): SpriteInfo => ({ url, cols: FRAMES, rows: 3, fw: FW, fh: FH, pad: 1 })
export const SPRITE_HEIGHT = 100 // how tall the character is in the house

/**
 * The playable character. It is one nested <svg> showing one cell of a sprite sheet (the walker changes the cell,
 * so walking is real frame animation, not a moving picture). Pixels stay sharp: no smoothing is applied.
 * The walker writes the position into this <g> and the facing into [data-flip].
 */
export function CharacterSprite({ sprite, innerRef }: { sprite: SpriteInfo; innerRef?: (el: SVGGElement | null) => void }) {
  const k = SPRITE_HEIGHT / sprite.fh
  const w = sprite.fw * k
  return (
    <g ref={innerRef} pointerEvents="none" className="lr-char" role="img" aria-label="You">
      <ellipse cx={0} cy={2} rx={w * 0.34} ry={5} fill="rgba(60,30,70,.2)" />
      <g data-flip="1">
        <g className="lr-idle">
          <svg data-sprite="1" data-cols={sprite.cols} data-rows={sprite.rows} data-fw={sprite.fw} data-fh={sprite.fh}
            x={-w / 2} y={-SPRITE_HEIGHT + sprite.pad * k} width={w} height={SPRITE_HEIGHT} viewBox={`0 0 ${sprite.fw} ${sprite.fh}`} overflow="hidden" shapeRendering="crispEdges">
            <image href={sprite.url} x={0} y={0} width={sprite.cols * sprite.fw} height={sprite.rows * sprite.fh} preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }} />
          </svg>
        </g>
      </g>
    </g>
  )
}
