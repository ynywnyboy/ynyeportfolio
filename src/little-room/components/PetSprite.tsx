import type { SpriteInfo } from './CharacterSprite'

export const PET_HEIGHT = 46 // how tall a pet is in the house

/** The pet: like the player, one nested <svg> showing one cell of a sprite sheet; the pet hook swaps the cell as it moves. */
export function PetSprite({ sprite, innerRef }: { sprite: SpriteInfo; innerRef?: (el: SVGGElement | null) => void }) {
  const k = PET_HEIGHT / sprite.fh
  const w = sprite.fw * k
  return (
    <g ref={innerRef} className="lr-pet" data-pet="1" style={{ cursor: 'pointer' }}>
      <ellipse cx={0} cy={1} rx={w * 0.36} ry={3.5} fill="rgba(60,30,70,.2)" pointerEvents="none" />
      <g data-flip="1">
        <svg data-sprite="1" data-cols={sprite.cols} data-rows={sprite.rows} data-fw={sprite.fw} data-fh={sprite.fh} pointerEvents="none"
          x={-w / 2} y={-PET_HEIGHT + sprite.pad * k} width={w} height={PET_HEIGHT} viewBox={`0 0 ${sprite.fw} ${sprite.fh}`} overflow="hidden" shapeRendering="crispEdges">
          <image href={sprite.url} x={0} y={0} width={sprite.cols * sprite.fw} height={sprite.rows * sprite.fh} preserveAspectRatio="none" style={{ imageRendering: 'pixelated' }} />
        </svg>
      </g>
      <rect x={-w / 2} y={-PET_HEIGHT} width={w} height={PET_HEIGHT} fill="transparent" />
    </g>
  )
}
