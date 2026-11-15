import { SEEDS, seedOf } from '../utils/garden'

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0')
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`
}
const LEAF = '#5fb36a', LEAF_D = '#4a9a57'

function Bloom({ id, c, H }: { id: string; c: string; H: number }) {
  const top = -H
  const ring = (n: number, r: number, rx: number, ry: number, fill: string) =>
    [...Array(n)].map((_, i) => <ellipse key={i} cx={0} cy={-r} rx={rx} ry={ry} fill={fill} transform={`translate(0 ${top}) rotate(${(360 / n) * i})`} stroke="rgba(0,0,0,.12)" strokeWidth=".6" />)
  switch (id) {
    case 'sunflower': return <g>{ring(14, 11, 4, 9, c)}{ring(14, 8, 3, 6, shade(c, 0.9))}<circle cx={0} cy={top} r={8} fill="#7a4a2a" /><circle cx={0} cy={top} r={5} fill="#5a3418" /></g>
    case 'daisy': return <g>{ring(9, 7, 2.6, 6, c)}<circle cx={0} cy={top} r={4} fill="#ffcf3d" /></g>
    case 'rose': return <g><circle cx={0} cy={top} r={9} fill={shade(c, 0.85)} /><circle cx={0} cy={top} r={6.5} fill={c} /><path d={`M-3 ${top} q3 -5 6 0 q-3 4 -6 0z`} fill={shade(c, 0.7)} /><circle cx={0} cy={top} r={2.6} fill={shade(c, 1.1)} /></g>
    case 'tulip': return <g><path d={`M-8 ${top - 8} q0 14 8 14 q8 0 8 -14 l-4 5 l-4 -7 l-4 7z`} fill={c} stroke="rgba(0,0,0,.14)" strokeWidth=".6" /><path d={`M-3 ${top - 6} q3 12 6 0`} fill={shade(c, 0.85)} /></g>
    case 'lavender': return <g>{[-7, 0, 7].map((x, k) => <g key={k}><line x1={x * 0.4} y1={-H * 0.5} x2={x} y2={top} stroke={LEAF_D} strokeWidth="1.5" />{[0, 1, 2, 3, 4, 5].map((i) => <ellipse key={i} cx={x + (i % 2 ? 1.6 : -1.6)} cy={top + i * 5} rx={2.6} ry={3.6} fill={i % 2 ? shade(c, 1.1) : c} />)}</g>)}</g>
    case 'lily': return <g>{ring(6, 8, 3.4, 8, c)}{ring(6, 5, 2, 5, shade(c, 1.12))}<circle cx={0} cy={top} r={2} fill="#ffe08a" /></g>
    default: return <g>{[[-9, -4, -30], [9, -4, 30], [-6, -12, -50], [6, -12, 50], [0, -16, 0]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={top + 6 + y} rx={5} ry={9} fill={i % 2 ? LEAF : LEAF_D} transform={`rotate(${r} ${x} ${top + 6 + y})`} />)}</g>
  }
}

/**
 * One plant, drawn around (0,0) = where the stem meets the soil. Four growth stages:
 * seed (a mound), sprout, growing (stem + bud), fully grown (bloom). Sways gently when `motion` is on.
 */
export function PlantArt({ kind, stage, color, motion, wet }: { kind: string; stage: number; color?: string; motion: boolean; wet: boolean }) {
  const seed = seedOf(kind), H = seed.H, c = color ?? seed.petal
  const soil = wet ? '#4a2f1f' : '#6b4630'
  return (
    <g pointerEvents="none">
      <ellipse cx={0} cy={0} rx={stage === 0 ? 11 : 9} ry={stage === 0 ? 4.5 : 3.5} fill={soil} />
      <g key={stage} className={`lr-pop${motion && stage >= 2 ? ' lr-sway' : ''}`}>
        {stage === 0 && <ellipse cx={0} cy={-3.2} rx={3.2} ry={2} fill="#9a6a3a" stroke="#6b4630" strokeWidth=".8" />}
        {stage >= 1 && (
          <g>
            <path d={`M0 0 Q${stage === 1 ? 2 : 3} ${-(stage === 1 ? 7 : H * 0.5)} 0 ${-(stage === 1 ? 14 : stage === 2 ? H * 0.72 : H)}`} stroke={LEAF_D} strokeWidth={stage === 1 ? 2.4 : 3} fill="none" strokeLinecap="round" />
            {stage === 1 && <><ellipse cx={-6} cy={-13} rx={6} ry={3} fill={LEAF} transform="rotate(-25 -6 -13)" /><ellipse cx={6} cy={-13} rx={6} ry={3} fill={LEAF} transform="rotate(25 6 -13)" /></>}
            {stage >= 2 && <>
              <ellipse cx={-9} cy={-H * 0.28} rx={9} ry={3.8} fill={LEAF} transform={`rotate(-30 -9 ${-H * 0.28})`} />
              <ellipse cx={9} cy={-H * 0.4} rx={9} ry={3.8} fill={LEAF_D} transform={`rotate(30 9 ${-H * 0.4})`} />
            </>}
            {stage === 2 && <><ellipse cx={0} cy={-H * 0.76} rx={4.4} ry={5.6} fill={LEAF} /><ellipse cx={0} cy={-H * 0.79} rx={3} ry={3.4} fill={seed.id === 'herb' ? LEAF : c} opacity=".85" /></>}
            {stage === 3 && <Bloom id={seed.id} c={c} H={H} />}
          </g>
        )}
      </g>
    </g>
  )
}

export const SEED_IDS = SEEDS.map((s) => s.id)

/** A short burst of water drops (plays once). */
export function Drops() {
  return <g pointerEvents="none" className="lr-drops">{[-10, -3, 4, 11].map((x, i) => <ellipse key={i} cx={x} cy={-60} rx={1.6} ry={2.6} fill="#7fc6ef" style={{ animationDelay: `${i * 0.12}s` }} />)}</g>
}
