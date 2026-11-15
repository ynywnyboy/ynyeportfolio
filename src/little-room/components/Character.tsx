export const OUTFITS = [
  { dress: '#f48fb1', hair: '#7a4b3a', label: 'Rose' },
  { dress: '#7aa7e8', hair: '#3b3350', label: 'Sky' },
  { dress: '#8fd0a3', hair: '#a8643b', label: 'Sage' },
  { dress: '#b497e0', hair: '#2f2a3d', label: 'Lilac' },
]

/**
 * The little person who lives in the house. Drawn around (0,0) = feet. The outer <g> is moved by useWalker,
 * the inner one is mirrored when facing left, and the "walk" class (set by the walker) swings the legs.
 */
export function Character({ outfit, innerRef }: { outfit: number; innerRef?: (el: SVGGElement | null) => void }) {
  const o = OUTFITS[outfit % OUTFITS.length]
  return (
    <g ref={innerRef} pointerEvents="none" className="lr-char">
      <g>
        <ellipse cx="0" cy="2" rx="22" ry="5" fill="rgba(60,30,70,.18)" className="lr-shadow" />
        <g className="lr-leg lr-legA"><rect x="-9" y="-30" width="8" height="30" rx="4" fill="#fbd9c4" /><rect x="-10" y="-5" width="11" height="6" rx="3" fill="#6b4c5a" /></g>
        <g className="lr-leg lr-legB"><rect x="1" y="-30" width="8" height="30" rx="4" fill="#fbd9c4" /><rect x="0" y="-5" width="11" height="6" rx="3" fill="#6b4c5a" /></g>
        <g className="lr-body">
          <path d="M-16 -32 Q-14 -62 -9 -66 H9 Q14 -62 16 -32 Z" fill={o.dress} />
          <rect x="-20" y="-64" width="8" height="26" rx="4" fill="#fbd9c4" className="lr-arm lr-armA" />
          <rect x="12" y="-64" width="8" height="26" rx="4" fill="#fbd9c4" className="lr-arm lr-armB" />
          <g>
            <circle cx="0" cy="-84" r="20" fill="#fbd9c4" />
            <path d="M-21 -84 Q-22 -108 0 -108 Q22 -108 21 -84 Q14 -98 0 -97 Q-14 -98 -21 -84Z" fill={o.hair} />
            <circle cx="-7" cy="-82" r="2.4" fill="#4a3342" /><circle cx="7" cy="-82" r="2.4" fill="#4a3342" />
            <circle cx="-12" cy="-76" r="3.4" fill="#f8a8b8" opacity=".6" /><circle cx="12" cy="-76" r="3.4" fill="#f8a8b8" opacity=".6" />
            <path d="M-4 -74 Q0 -71 4 -74" stroke="#a55b6b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
        </g>
      </g>
    </g>
  )
}
