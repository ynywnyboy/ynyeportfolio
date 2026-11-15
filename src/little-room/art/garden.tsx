import type { ArtProps } from '../../components/room/art'

/** Garden pieces. Like all room art, each is drawn around (0,0) = bottom-centre. Leaves sway only when animation is allowed. */
const S = 'rgba(0,0,0,.16)'

function Tree({ v, motion }: ArtProps) {
  const pine = v === 1
  const cols = [['#6fbf73', '#58a862', '#7fd085'], ['#3f8f63', '#2f7a52', '#4ea274'], ['#f7bdd2', '#f19dba', '#fbd0e0'], ['#e8913f', '#d4703a', '#f2b05a']][v % 4]
  return (
    <g>
      <ellipse cx={0} cy={2} rx={46} ry={7} fill="rgba(0,0,0,.12)" />
      <path d="M-9 0 L-6 -100 H6 L9 0Z" fill="#8a5a38" stroke={S} />
      <path d="M-3 -10 V-70" stroke="rgba(0,0,0,.14)" strokeWidth="2" />
      <g className={motion ? 'lr-leaves' : undefined}>
        {pine ? <>
          <path d="M0 -230 L-44 -150 H44Z" fill={cols[0]} stroke={S} /><path d="M0 -190 L-58 -100 H58Z" fill={cols[1]} stroke={S} /><path d="M0 -150 L-70 -60 H70Z" fill={cols[0]} stroke={S} />
        </> : <>
          <circle cx={-34} cy={-130} r={40} fill={cols[1]} stroke={S} /><circle cx={34} cy={-132} r={40} fill={cols[1]} stroke={S} />
          <circle cx={0} cy={-168} r={48} fill={cols[0]} stroke={S} /><circle cx={-10} cy={-140} r={42} fill={cols[0]} />
          {[[-30, -165], [22, -190], [4, -135], [38, -150], [-48, -122]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7} fill={cols[2]} opacity=".85" />)}
        </>}
      </g>
    </g>
  )
}

function Bush({ v, motion }: ArtProps) {
  const g = ['#5fb36a', '#4f9f62', '#79c785']
  return (
    <g className={motion ? 'lr-leaves' : undefined}>
      <ellipse cx={0} cy={2} rx={46} ry={6} fill="rgba(0,0,0,.12)" />
      <ellipse cx={-26} cy={-24} rx={28} ry={24} fill={g[1]} stroke={S} /><ellipse cx={26} cy={-24} rx={28} ry={24} fill={g[1]} stroke={S} />
      <ellipse cx={0} cy={-34} rx={34} ry={28} fill={g[0]} stroke={S} /><ellipse cx={-8} cy={-40} rx={18} ry={12} fill={g[2]} opacity=".7" />
      {v === 1 && [[-20, -30], [8, -48], [26, -26], [-4, -22], [18, -40]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={4.2} fill="#d94b6c" stroke="rgba(0,0,0,.2)" strokeWidth=".6" />)}
      {v === 2 && [[-24, -34], [6, -52], [28, -30], [-6, -24], [18, -44], [-34, -18]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={5} fill={i % 2 ? '#ffd1e0' : '#fff'} /><circle cx={x} cy={y} r={1.8} fill="#ffd45a" /></g>)}
    </g>
  )
}

function Flowerpot({ v }: ArtProps) {
  const c = [['#d98a5f', '#c5774c'], ['#f4f0ea', '#e0d9cf'], ['#7fb5e8', '#6aa2d6'], ['#f4a6bc', '#e48fa8']][v % 4]
  return (
    <g>
      <ellipse cx={0} cy={2} rx={28} ry={5} fill="rgba(0,0,0,.12)" />
      <path d="M-26 -58 H26 L19 0 H-19Z" fill={c[0]} stroke={S} /><rect x={-29} y={-68} width={58} height={13} rx={4} fill={c[1]} stroke={S} />
      <ellipse cx={0} cy={-62} rx={24} ry={4} fill="#6b4630" /><path d="M-18 -40 H18" stroke="rgba(255,255,255,.35)" strokeWidth="3" />
    </g>
  )
}

function Soil({ v }: ArtProps) {
  const d = v === 1 ? ['#4d3223', '#3d281c'] : ['#7a5236', '#66432c']
  return (
    <g>
      <rect x={-55} y={-26} width={110} height={26} rx={9} fill={d[0]} stroke={S} />
      {[...Array(5)].map((_, i) => <path key={i} d={`M${-46 + i * 21} -22 q4 -3 8 0 M${-42 + i * 21} -10 q4 -3 8 0`} stroke={d[1]} strokeWidth="2" fill="none" strokeLinecap="round" />)}
    </g>
  )
}

function Raisedbed({ v }: ArtProps) {
  const stone = v === 1
  return (
    <g>
      <ellipse cx={0} cy={3} rx={122} ry={6} fill="rgba(0,0,0,.12)" />
      <rect x={-120} y={-50} width={240} height={50} rx={5} fill={stone ? '#b9b4ad' : '#b9855a'} stroke={S} />
      <rect x={-112} y={-50} width={224} height={14} rx={4} fill="#6b4630" />
      {stone
        ? [...Array(7)].map((_, i) => <path key={i} d={`M${-120 + i * 34} -32 V0`} stroke="rgba(0,0,0,.16)" />)
        : <><path d="M-120 -24 H120" stroke="rgba(0,0,0,.18)" /><path d="M-60 -34 V0 M60 -34 V0" stroke="rgba(0,0,0,.14)" /></>}
    </g>
  )
}

function Fence({ v }: ArtProps) {
  if (v === 2) return (
    <g><ellipse cx={0} cy={2} rx={80} ry={5} fill="rgba(0,0,0,.1)" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={-80 + c * 40 + (r % 2) * 20 - (r % 2 && c === 3 ? 20 : 0)} y={-60 + r * 20} width={r % 2 && c === 3 ? 20 : 40} height={20} fill={(r + c) % 2 ? '#c9c2b8' : '#b9b2a8'} stroke="rgba(0,0,0,.2)" />))}</g>
  )
  const white = v === 1
  const c = white ? '#fbf7ef' : '#b9855a'
  return (
    <g>
      <ellipse cx={0} cy={2} rx={80} ry={5} fill="rgba(0,0,0,.1)" />
      {[...Array(8)].map((_, i) => <path key={i} d={`M${-76 + i * 22} 0 V-52 l4 -8 l4 8 V0Z`} fill={c} stroke={S} />)}
      <rect x={-80} y={-42} width={160} height={7} fill={white ? '#f1e9db' : '#a5724a'} stroke={S} /><rect x={-80} y={-20} width={160} height={7} fill={white ? '#f1e9db' : '#a5724a'} stroke={S} />
    </g>
  )
}

function Pathway({ v }: ArtProps) {
  if (v === 0) return <g>{[[-70, -8, 22, 9], [-26, -22, 24, 10], [20, -12, 22, 9], [64, -24, 24, 10]].map(([x, y, rx, ry], i) => <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={i % 2 ? '#c3bdb4' : '#b3ada3'} stroke={S} />)}</g>
  if (v === 1) return <g>{[0, 1, 2].map((r) => [...Array(6)].map((_, c) => <rect key={`${r}${c}`} x={-84 + c * 28 + (r % 2) * 14} y={-36 + r * 12} width={26} height={11} rx={2} fill={(r + c) % 2 ? '#c4654a' : '#b45a42'} stroke="rgba(0,0,0,.2)" />))}</g>
  if (v === 2) return <g>{[...Array(4)].map((_, i) => <rect key={i} x={-84 + i * 42} y={-34} width={40} height={32} rx={3} fill={i % 2 ? '#c9965f' : '#b9855a'} stroke={S} />)}</g>
  return <g><path d="M-84 -6 Q-60 -38 -10 -30 T84 -10 Q60 6 0 2 T-84 -6Z" fill="#ecd9aa" stroke={S} />{[[-50, -14], [-10, -18], [30, -10], [60, -12]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={1.6} fill="#c9b27a" />)}</g>
}

function Bench({ v }: ArtProps) {
  const c = ['#b9855a', '#fbf7ef', '#7cc9a0'][v % 3]
  return (
    <g>
      <ellipse cx={0} cy={2} rx={66} ry={5} fill="rgba(0,0,0,.12)" />
      <rect x={-58} y={-74} width={116} height={9} rx={3} fill={c} stroke={S} /><rect x={-58} y={-60} width={116} height={9} rx={3} fill={c} stroke={S} />
      <rect x={-62} y={-38} width={124} height={11} rx={3} fill={c} stroke={S} />
      <rect x={-54} y={-27} width={9} height={27} fill="#7a5a40" stroke={S} /><rect x={45} y={-27} width={9} height={27} fill="#7a5a40" stroke={S} />
      <rect x={-56} y={-74} width={7} height={46} fill="#7a5a40" /><rect x={49} y={-74} width={7} height={46} fill="#7a5a40" />
    </g>
  )
}

function Lamppost({ v, on, sky }: ArtProps) {
  const c = v === 1 ? '#d9b55a' : '#3d3a46'
  const lit = on && sky !== 'day'
  return (
    <g>
      <ellipse cx={0} cy={2} rx={16} ry={4} fill="rgba(0,0,0,.14)" />
      <rect x={-12} y={-14} width={24} height={14} rx={3} fill={c} /><rect x={-3.5} y={-170} width={7} height={160} fill={c} />
      <path d="M-14 -168 L-10 -184 H10 L14 -168Z" fill={c} /><rect x={-10} y={-168} width={20} height={20} rx={4} fill={lit ? '#ffe9a8' : '#e9f1f5'} stroke={S} />
      <path d="M-12 -186 H12 L0 -196Z" fill={c} />
    </g>
  )
}

function Pond({ v, motion }: ArtProps) {
  const w = v === 1 ? ['#6fc7c0', '#9ae0d8'] : ['#6fb7e8', '#9fd3f5']
  return (
    <g>
      <ellipse cx={0} cy={-18} rx={92} ry={24} fill="#a8a29a" stroke={S} />
      <ellipse cx={0} cy={-19} rx={84} ry={19} fill={w[0]} /><ellipse cx={-14} cy={-23} rx={50} ry={8} fill={w[1]} opacity=".7" />
      <ellipse cx={30} cy={-17} rx={13} ry={5} fill="#5fb36a" /><path d="M30 -17 L38 -21" stroke="#fff" strokeWidth="1" />
      <circle cx={-38} cy={-18} r={4} fill="#f7a1c4" />
      {motion && <ellipse cx={-30} cy={-16} rx={10} ry={3} fill="none" stroke="rgba(255,255,255,.7)" className="lr-ripple" />}
    </g>
  )
}

function Birdbath({ v }: ArtProps) {
  const c = v === 1 ? '#f4f0ea' : '#b9b4ad'
  return (
    <g>
      <ellipse cx={0} cy={2} rx={22} ry={4} fill="rgba(0,0,0,.12)" />
      <path d="M-12 0 L-6 -42 H6 L12 0Z" fill={c} stroke={S} /><ellipse cx={0} cy={-46} rx={26} ry={8} fill={c} stroke={S} /><ellipse cx={0} cy={-47} rx={21} ry={5.5} fill="#8fc9ef" />
    </g>
  )
}

function Gnome({ v }: ArtProps) {
  const hat = ['#d9534f', '#4f86d9', '#4faa6a'][v % 3]
  return (
    <g>
      <ellipse cx={0} cy={2} rx={17} ry={4} fill="rgba(0,0,0,.12)" />
      <path d="M-12 0 Q-14 -22 0 -26 Q14 -22 12 0Z" fill="#6aa0d6" stroke={S} /><circle cx={0} cy={-30} r={9} fill="#fbd9c4" stroke={S} />
      <path d="M-10 -28 Q0 -10 10 -28 Q0 -22 -10 -28Z" fill="#fff" stroke={S} /><path d="M-11 -34 L0 -58 L11 -34Z" fill={hat} stroke={S} />
      <circle cx={0} cy={-31} r={1.8} fill="#e48fa8" /><circle cx={-4} cy={-34} r={1} fill="#333" /><circle cx={4} cy={-34} r={1} fill="#333" />
    </g>
  )
}

export const GARDEN_ART = { tree: Tree, bush: Bush, flowerpot: Flowerpot, soil: Soil, raisedbed: Raisedbed, fence: Fence, pathway: Pathway, bench: Bench, lamppost: Lamppost, pond: Pond, birdbath: Birdbath, gnome: Gnome }
