import type { ItemType, Scene } from '../../lib/room'
import { GARDEN_ART } from '../../little-room/art/garden'

/** Hand-drawn SVG art. Every piece is drawn around local (0,0) = bottom-centre. */
export interface ArtProps {
  v: number
  id: string
  photo?: string
  on: boolean // room lights on
  playing: boolean
  resting: boolean
  scene: Scene
  sky: 'day' | 'dusk' | 'night'
  motion: boolean // animations allowed
  day: number // today's day of month (calendar)
  month: string
}

const C = {
  blush: '#f5b5c3', lilac: '#cdb4f0', sage: '#b8dcc0', cream: '#fbf1e6', sky: '#a9d4ee', peach: '#f7c59f',
  wood: '#c98f5d', woodD: '#a8714a', white: '#fffaf5', gold: '#e6c07b', ink: '#5a4a5e', shade: 'rgba(60,30,70,.14)',
}
const SOFT = [C.blush, C.lilac, C.sage, C.cream, C.sky, C.peach]
const Shadow = ({ w }: { w: number }) => <ellipse cx="0" cy="1" rx={w / 2} ry={Math.max(3, w / 18)} fill={C.shade} />

/* ---------------- furniture ---------------- */

function Bed({ v, resting, motion }: ArtProps) {
  const col = SOFT[v % SOFT.length]
  return (
    <g>
      <Shadow w={270} />
      <rect x="-132" y="-140" width="22" height="130" rx="9" fill={C.woodD} />
      <rect x="-132" y="-150" width="22" height="22" rx="11" fill={C.wood} />
      <rect x="-130" y="-50" width="262" height="30" rx="6" fill={C.wood} />
      <rect x="-124" y="-14" width="14" height="14" fill={C.woodD} /><rect x="112" y="-14" width="14" height="14" fill={C.woodD} />
      <rect x="-114" y="-82" width="236" height="36" rx="14" fill={C.cream} />
      <g className={resting && motion ? 'olw-breathe' : undefined}>
        <path d="M-70 -78 Q-70 -92 -50 -92 L100 -92 Q122 -92 122 -72 L122 -46 L-70 -46 Z" fill={col} />
        <path d="M-70 -78 Q-70 -92 -50 -92 L-20 -92 L-20 -46 L-70 -46 Z" fill="rgba(255,255,255,.35)" />
        <path d="M-20 -92 L-20 -46" stroke="rgba(0,0,0,.08)" strokeWidth="2" />
        {[20, 55, 90].map((x) => <path key={x} d={`M${x} -80 q6 8 0 16`} stroke="rgba(255,255,255,.7)" strokeWidth="2.5" fill="none" strokeLinecap="round" />)}
      </g>
      <ellipse cx="-90" cy="-96" rx="28" ry="14" fill={C.white} stroke="rgba(0,0,0,.06)" />
      <ellipse cx="-82" cy="-106" rx="24" ry="12" fill={C.blush} />
      <path d="M-82 -111 q-6 -7 -11 -1 q-3 5 11 12 q14 -7 11 -12 q-5 -6 -11 1z" fill="#fff" opacity=".8" transform="scale(.6) translate(-55 -62)" />
    </g>
  )
}
function Nightstand({ v }: ArtProps) {
  const c = [C.wood, C.white, C.blush][v % 3]
  return (
    <g>
      <Shadow w={70} />
      <rect x="-31" y="-72" width="62" height="64" rx="6" fill={c} stroke="rgba(0,0,0,.08)" />
      <line x1="-31" y1="-40" x2="31" y2="-40" stroke="rgba(0,0,0,.12)" />
      <circle cx="0" cy="-56" r="3" fill={C.gold} /><circle cx="0" cy="-24" r="3" fill={C.gold} />
      <rect x="-27" y="-8" width="6" height="8" fill={C.woodD} /><rect x="21" y="-8" width="6" height="8" fill={C.woodD} />
      <rect x="-35" y="-78" width="70" height="8" rx="4" fill={c} stroke="rgba(0,0,0,.08)" />
    </g>
  )
}
function Desk({ v }: ArtProps) {
  const c = [C.wood, C.white, C.lilac][v % 3]
  return (
    <g>
      <Shadow w={200} />
      <rect x="-100" y="-112" width="200" height="12" rx="5" fill={c} stroke="rgba(0,0,0,.08)" />
      <rect x="-92" y="-100" width="8" height="100" fill={C.woodD} /><rect x="84" y="-100" width="8" height="100" fill={C.woodD} />
      <rect x="-60" y="-98" width="120" height="44" rx="4" fill={c} stroke="rgba(0,0,0,.1)" />
      <circle cx="0" cy="-76" r="3.5" fill={C.gold} />
      <g transform="translate(-52 -112) rotate(-5)">
        <rect x="0" y="-20" width="30" height="20" rx="2" fill="#fffdf6" stroke="rgba(0,0,0,.12)" />
        {[-14, -9, -4].map((y) => <line key={y} x1="4" y1={y} x2="26" y2={y} stroke={C.blush} strokeWidth="1.5" />)}
      </g>
    </g>
  )
}
function Shelf({ v }: ArtProps) {
  const bk = [C.blush, C.lilac, C.sage, C.peach, C.sky]
  return (
    <g>
      <rect x="-72" y="-6" width="144" height="7" rx="3" fill={C.wood} /><path d="M-58 1l-8 12h16zM58 1l-8 12h16z" fill={C.woodD} />
      {v === 0 && bk.map((c, i) => <rect key={i} x={-62 + i * 14} y={-44 + (i % 2) * 4} width="11" height={38 - (i % 2) * 4} rx="1.5" fill={c} stroke="rgba(0,0,0,.08)" />)}
      {v === 0 && <><rect x="14" y="-30" width="44" height="7" rx="1.5" fill={C.sage} transform="rotate(-8 36 -26)" /><rect x="18" y="-36" width="38" height="7" rx="1.5" fill={C.cream} stroke="rgba(0,0,0,.08)" transform="rotate(-8 36 -33)" /></>}
      {v === 1 && <><path d="M-50-6v-18h20v18zM-46-24c0-8 12-8 12 0" fill={C.cream} stroke={C.gold} /><circle cx="0" cy="-16" r="10" fill={C.blush} /><path d="M30-6l10-26 10 26z" fill={C.lilac} /><circle cx="40" cy="-34" r="4" fill="#ffe08a" /></>}
      {v === 2 && [-45, -5, 40].map((x, i) => <g key={x}><path d={`M${x - 9} -6l3 -14h12l3 14z`} fill={[C.peach, C.cream, C.blush][i]} /><path d={`M${x} -20c-12-4-14-18-4-22 2 8 6 10 4 22 10-8 18-8 20-16-10-2-16 4-20 16`} fill="#8fc89a" /></g>)}
    </g>
  )
}
function Bookcase({ v }: ArtProps) {
  const c = v === 0 ? C.wood : C.white
  const bk = [C.blush, C.lilac, C.sage, C.peach, C.sky, C.cream]
  return (
    <g>
      <Shadow w={100} />
      <rect x="-48" y="-170" width="96" height="170" rx="5" fill={c} stroke="rgba(0,0,0,.1)" />
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x="-42" y={-163 + r * 41} width="84" height="36" fill="rgba(0,0,0,.06)" />
          {bk.map((b, i) => <rect key={i} x={-38 + i * 13 + (r % 2) * 2} y={-160 + r * 41 + (i % 3) * 3} width="10" height={30 - (i % 3) * 3} rx="1" fill={bk[(i + r) % 6]} />)}
        </g>
      ))}
    </g>
  )
}
function Beanbag({ v }: ArtProps) {
  const c = [C.blush, C.lilac, C.sage, C.sky][v % 4]
  return (
    <g>
      <Shadow w={90} />
      <path d="M-44 0 Q-48 -34 -22 -52 Q0 -66 24 -52 Q48 -34 44 0 Z" fill={c} />
      <path d="M-20 -48 Q0 -40 22 -48" stroke="rgba(255,255,255,.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  )
}
function Radio({ v, playing, motion }: ArtProps) {
  const c = [C.cream, C.blush, '#bfe7d4'][v % 3]
  return (
    <g>
      <Shadow w={64} />
      <rect x="-32" y="-44" width="64" height="44" rx="9" fill={c} stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
      <circle cx="-14" cy="-22" r="13" fill="#fff" stroke={C.ink} strokeWidth="1.5" opacity=".85" />
      <circle cx="-14" cy="-22" r="5" fill={C.ink} opacity=".7" />
      <rect x="6" y="-36" width="20" height="8" rx="2" fill="#fff" opacity=".8" />
      <circle cx="12" cy="-16" r="3" fill={C.gold} /><circle cx="22" cy="-16" r="3" fill={C.gold} />
      <path d="M20 -44 L36 -64" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
      {playing && (
        <g fill={C.blush} fontSize="14" textAnchor="middle">
          <text x="-8" y="-50" className={motion ? 'olw-note' : undefined}>♪</text>
          <text x="10" y="-52" className={motion ? 'olw-note olw-note2' : undefined}>♫</text>
        </g>
      )}
    </g>
  )
}
function Rug({ v }: ArtProps) {
  const rx = 150, ry = 32
  const cols: [string, string][] = [[C.blush, '#f9d6de'], [C.lilac, '#e6dcf7'], [C.sage, '#dff1e4'], ['#f6a9bb', '#fbe3e8'], [C.cream, '#fffaf5']]
  const [a, b] = cols[v % 5]
  return (
    <g>
      <ellipse cx="0" cy={-ry} rx={rx} ry={ry} fill={a} />
      <ellipse cx="0" cy={-ry} rx={rx - 14} ry={ry - 7} fill={b} />
      {v === 1 && [0, 1, 2].map((i) => <ellipse key={i} cx="0" cy={-ry} rx={rx - 34 - i * 30} ry={ry - 11 - i * 7} fill="none" stroke={a} strokeWidth="3" />)}
      {v === 3 && <path d="M0 -14c-24-14-34-26-22-34 8-5 16 0 22 7 6-7 14-12 22-7 12 8 2 20-22 34z" fill="#f48fb1" transform="translate(0 -12) scale(1.2)" />}
      {v === 0 && <ellipse cx="0" cy={-ry} rx="46" ry="10" fill={a} opacity=".8" />}
      {v === 4 && [...Array(14)].map((_, i) => <circle key={i} cx={-100 + i * 15} cy={-ry + ((i * 7) % 20) - 10} r="3" fill="#fff" opacity=".7" />)}
    </g>
  )
}

/* ---------------- window with scenery ---------------- */

const SKY = { day: ['#bfe3ff', '#e8f6ff'], dusk: ['#f6a6a0', '#ffd9a8'], night: ['#1c1a45', '#3a3770'] } as const

function Scenery({ scene, sky, id, motion }: { scene: Scene; sky: 'day' | 'dusk' | 'night'; id: string; motion: boolean }) {
  const [t, b] = SKY[sky]
  const night = sky === 'night'
  return (
    <g clipPath={`url(#wc-${id})`}>
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t} /><stop offset="1" stopColor={b} /></linearGradient>
      </defs>
      <rect x="-56" y="-124" width="112" height="108" fill={`url(#sky-${id})`} />
      {night && [[-40, -108], [-12, -96], [30, -112], [42, -84], [-30, -80], [8, -118]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="#fff" className={motion ? 'olw-twinkle' : undefined} style={{ animationDelay: `${i * 0.4}s` }} />)}
      {night ? <g><circle cx="26" cy="-98" r="11" fill="#fff6d6" /><circle cx="31" cy="-102" r="10" fill={t} /></g> : <circle cx="28" cy="-98" r="10" fill={sky === 'dusk' ? '#ffe0a0' : '#fff2b0'} />}
      {scene === 'garden' && <><path d="M-60 -34 Q-30 -64 0 -44 T60 -48 V-10 H-60z" fill={night ? '#2d5a4a' : '#9bd3a6'} /><path d="M-60 -22 Q-20 -46 20 -30 T60 -28 V-10 H-60z" fill={night ? '#255044' : '#7fc58f'} />{[-40, -14, 14, 38].map((x, i) => <circle key={x} cx={x} cy={-24 - (i % 2) * 6} r="3" fill={[C.blush, '#fff', C.peach, C.lilac][i]} />)}</>}
      {scene === 'city' && <>{[[-52, 40, 22], [-30, 52, 18], [-10, 34, 24], [14, 60, 20], [36, 44, 22]].map(([x, h, w], i) => <g key={i}><rect x={x} y={-16 - h} width={w} height={h} fill={night ? '#2a2658' : '#b9a9d6'} />{night && [0, 1, 2, 3].map((k) => <rect key={k} x={x + 4 + (k % 2) * 9} y={-16 - h + 6 + Math.floor(k / 2) * 12} width="5" height="6" fill="#ffd979" />)}</g>)}</>}
      {scene === 'sea' && <><rect x="-56" y="-52" width="112" height="40" fill={night ? '#26407a' : '#79c2e6'} />{[-44, -10, 24].map((x, i) => <path key={x} d={`M${x} ${-40 + i * 8} q6 -5 12 0 t12 0`} stroke="#fff" strokeWidth="1.6" fill="none" opacity=".8" className={motion ? 'olw-wave' : undefined} />)}</>}
      {scene === 'rain' && <><rect x="-56" y="-124" width="112" height="108" fill="rgba(110,120,150,.45)" />{[...Array(12)].map((_, i) => <line key={i} x1={-50 + i * 9} y1="-120" x2={-54 + i * 9} y2="-108" stroke="#e9f1ff" strokeWidth="1.3" className={motion ? 'olw-rain' : undefined} style={{ animationDelay: `${(i % 5) * 0.18}s` }} opacity={motion ? undefined : 0.7} />)}</>}
      {scene === 'snow' && <><path d="M-60 -28 Q-20 -48 20 -34 T60 -30 V-10 H-60z" fill="#f4f8ff" />{[...Array(12)].map((_, i) => <circle key={i} cx={-48 + i * 8.5} cy={-110 + (i % 4) * 18} r="2" fill="#fff" className={motion ? 'olw-snow' : undefined} style={{ animationDelay: `${(i % 6) * 0.5}s` }} />)}</>}
    </g>
  )
}
function Window(p: ArtProps) {
  const cur = ['#f5b5c3', '#cdb4f0', '#b8dcc0', '#fbf1e6'][p.v % 4]
  return (
    <g>
      <clipPath id={`wc-${p.id}`}><rect x="-56" y="-124" width="112" height="108" rx="4" /></clipPath>
      <rect x="-64" y="-132" width="128" height="124" rx="7" fill={C.white} stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
      <Scenery scene={p.scene} sky={p.sky} id={p.id} motion={p.motion} />
      <path d="M0 -124V-16M-56 -70H56" stroke={C.white} strokeWidth="5" />
      <rect x="-56" y="-124" width="112" height="108" rx="4" fill="none" stroke="rgba(0,0,0,.1)" />
      <path d="M-62 -128 q-14 54 -8 118 h26 q-6 -64 8 -118z" fill={cur} stroke="rgba(0,0,0,.08)" />
      <path d="M62 -128 q14 54 8 118 h-26 q6 -64 -8 -118z" fill={cur} stroke="rgba(0,0,0,.08)" />
      <path d="M-62 -90q12 8 6 20M62 -90q-12 8 -6 20" stroke="rgba(255,255,255,.6)" strokeWidth="2.5" fill="none" />
      <rect x="-78" y="-138" width="156" height="8" rx="4" fill={C.wood} />
      <rect x="-72" y="-10" width="144" height="8" rx="4" fill={C.white} stroke="rgba(0,0,0,.1)" />
    </g>
  )
}

/* ---------------- decor ---------------- */

function Plant({ v, motion }: ArtProps) {
  const pot = [C.peach, C.blush, C.lilac, C.cream, C.sky][v % 5]
  const sway = motion ? 'olw-sway' : undefined
  return (
    <g>
      <Shadow w={52} />
      <path d="M-18 -30 h36 l-5 30 h-26z" fill={pot} stroke="rgba(0,0,0,.1)" />
      <rect x="-20" y="-34" width="40" height="7" rx="3" fill={pot} stroke="rgba(0,0,0,.1)" />
      <g className={sway} style={{ transformOrigin: '0px -34px' }}>
        {v === 0 && [-50, -20, 20, 50].map((a) => <path key={a} d="M0 -34C-18 -52 -16 -78 0 -86 16 -78 18 -52 0 -34z" fill="#74b98a" transform={`rotate(${a} 0 -34)`} />)}
        {v === 1 && <><rect x="-10" y="-80" width="20" height="48" rx="10" fill="#7fc48f" /><rect x="-26" y="-64" width="12" height="28" rx="6" fill="#7fc48f" /><rect x="14" y="-58" width="12" height="22" rx="6" fill="#7fc48f" /><circle cx="0" cy="-84" r="4" fill={C.blush} /></>}
        {v === 2 && [-70, -45, -20, 0, 20, 45, 70].map((a) => <path key={a} d="M0 -34Q-8 -62 0 -84Q8 -62 0 -34z" fill="#8fd09a" transform={`rotate(${a} 0 -34)`} />)}
        {v === 3 && <>{[-24, -8, 10, 26].map((x, i) => <g key={x}><path d={`M0 -34 Q${x / 2} -52 ${x} ${-62 - i * 4}`} stroke="#74b98a" strokeWidth="2" fill="none" /><circle cx={x} cy={-64 - i * 4} r="7" fill={[C.blush, '#fff', C.peach, C.lilac][i]} /><circle cx={x} cy={-64 - i * 4} r="2.5" fill="#ffd979" /></g>)}</>}
        {v === 4 && [-30, 0, 30].map((a) => <path key={a} d="M0 -34C-14 -70 -8 -100 0 -108 8 -100 14 -70 0 -34z" fill="#68b585" transform={`rotate(${a} 0 -34)`} />)}
      </g>
    </g>
  )
}
function Lamp({ v, on }: ArtProps) {
  const c = [C.blush, C.cream, C.lilac][v % 3]
  return (
    <g>
      <rect x="-3" y="-34" width="6" height="34" fill={C.gold} /><ellipse cx="0" cy="-1" rx="14" ry="4" fill={C.gold} />
      <path d="M-20 -32 L-12 -70 H12 L20 -32z" fill={on ? '#ffe9a8' : c} stroke="rgba(0,0,0,.1)" />
      {on && <ellipse cx="0" cy="-32" rx="18" ry="4" fill="#fff6cf" opacity=".9" />}
    </g>
  )
}
function Floorlamp({ v, on }: ArtProps) {
  const c = v === 0 ? C.gold : '#e9e4ee'
  return (
    <g>
      <ellipse cx="0" cy="-2" rx="18" ry="5" fill={c} /><rect x="-2" y="-150" width="4" height="150" fill={c} />
      <path d="M-24 -142 L-14 -190 H14 L24 -142z" fill={on ? '#ffe9a8' : C.cream} stroke="rgba(0,0,0,.1)" />
    </g>
  )
}
function Poster({ v, id }: ArtProps) {
  return (
    <g>
      <clipPath id={`pc-${id}`}><rect x="-32" y="-92" width="64" height="84" /></clipPath>
      <rect x="-37" y="-100" width="74" height="100" rx="3" fill={C.white} stroke="rgba(0,0,0,.14)" strokeWidth="1.5" />
      <g clipPath={`url(#pc-${id})`}>
        {v === 0 && <><rect x="-32" y="-92" width="64" height="84" fill="#cfe6f7" /><path d="M-32 -20l22-44 16 26 14-30 32 48z" fill="#8fb3d9" /><path d="M-32 -8V-18l24-16 20 14 20-8 20 12v8z" fill="#7aa5cf" /></>}
        {v === 1 && <><rect x="-32" y="-92" width="64" height="84" fill="#2a2a5e" /><circle cx="6" cy="-56" r="16" fill="#fff6d6" /><circle cx="14" cy="-60" r="14" fill="#2a2a5e" />{[[-20, -78], [-8, -40], [22, -80], [-22, -30], [20, -26]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" />)}</>}
        {v === 2 && <><rect x="-32" y="-92" width="64" height="84" fill="#ffe3ea" /><path d="M0 -26C-30 -48 -22 -72 -8 -68 -2 -66 0 -60 0 -60S2 -66 8 -68C22 -72 30 -48 0 -26z" fill="#f06292" /></>}
        {v === 3 && <><rect x="-32" y="-92" width="64" height="84" fill="#fdf0d5" />{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-66" rx="7" ry="13" fill={C.blush} transform={`rotate(${a} 0 -52)`} />)}<circle cx="0" cy="-52" r="6" fill="#ffd979" /><path d="M0 -46V-12" stroke="#74b98a" strokeWidth="3" /></>}
        {v === 4 && <><rect x="-32" y="-92" width="64" height="84" fill="#ffc9a8" /><rect x="-32" y="-44" width="64" height="36" fill="#f08fa8" /><circle cx="0" cy="-44" r="18" fill="#ffe08a" /><rect x="-32" y="-40" width="64" height="32" fill="#f08fa8" /></>}
        {v === 5 && <><rect x="-32" y="-92" width="64" height="84" fill="#fbe3e8" /><text x="0" y="-60" textAnchor="middle" fontSize="13" fill="#d96b86" fontFamily="'Dancing Script',cursive" fontWeight="700">Our Little</text><text x="0" y="-44" textAnchor="middle" fontSize="13" fill="#d96b86" fontFamily="'Dancing Script',cursive" fontWeight="700">World</text><path d="M0 -20c-10-8-12-14-6-16 3-1 6 2 6 2s3-3 6-2c6 2 4 8-6 16z" fill="#f06292" /></>}
      </g>
    </g>
  )
}
function Frame({ v, id, photo }: ArtProps) {
  const fc = [C.gold, C.white, C.wood, C.blush][v % 4]
  return (
    <g>
      <clipPath id={`fc-${id}`}><rect x="-31" y="-86" width="62" height="76" /></clipPath>
      <rect x="-40" y="-96" width="80" height="96" rx="4" fill={fc} stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
      <rect x="-32" y="-87" width="64" height="78" fill="#fff6f0" />
      {photo ? <image href={photo} x="-31" y="-86" width="62" height="76" preserveAspectRatio="xMidYMid slice" clipPath={`url(#fc-${id})`} /> : (
        <path d="M0 -34c-14-11-18-22-9-27 5-2 9 2 9 2s4-4 9-2c9 5 5 16-9 27z" fill={C.blush} />
      )}
    </g>
  )
}
function Calendar({ v, day, month }: ArtProps) {
  const h = v === 0 ? '#f48fb1' : '#b497e0'
  return (
    <g>
      <rect x="-30" y="-78" width="60" height="78" rx="5" fill="#fff" stroke="rgba(0,0,0,.14)" />
      <path d="M-30 -73a5 5 0 0 1 5 -5h50a5 5 0 0 1 5 5v14h-60z" fill={h} />
      <circle cx="-14" cy="-80" r="2.5" fill={C.ink} /><circle cx="14" cy="-80" r="2.5" fill={C.ink} />
      <text x="0" y="-65" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">{month}</text>
      <text x="0" y="-26" textAnchor="middle" fontSize="30" fill={C.ink} fontWeight="700">{day}</text>
      <path d="M0 -8c-5-4-6-7-3-8 1-.3 3 1 3 1s2-1.3 3-1c3 1 2 4-3 8z" fill="#f06292" />
    </g>
  )
}
function Clock({ v }: ArtProps) {
  const now = new Date()
  const m = now.getMinutes() * 6, h = (now.getHours() % 12) * 30 + now.getMinutes() / 2
  return (
    <g>
      <circle cx="0" cy="-28" r="27" fill={v === 0 ? C.cream : C.blush} stroke={C.gold} strokeWidth="3" />
      {[0, 90, 180, 270].map((a) => <line key={a} x1="0" y1="-48" x2="0" y2="-44" stroke={C.ink} strokeWidth="2" transform={`rotate(${a} 0 -28)`} />)}
      <line x1="0" y1="-28" x2="0" y2="-42" stroke={C.ink} strokeWidth="2" strokeLinecap="round" transform={`rotate(${m} 0 -28)`} />
      <line x1="0" y1="-28" x2="0" y2="-37" stroke={C.ink} strokeWidth="3" strokeLinecap="round" transform={`rotate(${h} 0 -28)`} />
      <circle cx="0" cy="-28" r="2.5" fill={C.gold} />
    </g>
  )
}
function Cat({ v, resting, motion }: ArtProps) {
  const c = ['#f2b27a', '#a9a4b5', '#f6e6d2'][v % 3]
  return (
    <g className={motion ? 'olw-breathe' : undefined} style={{ transformOrigin: '0 0' }}>
      <ellipse cx="0" cy="-14" rx="32" ry="15" fill={c} />
      <circle cx="-24" cy="-18" r="13" fill={c} />
      <path d="M-34 -28l4 -10 8 7zM-18 -30l6 -9 4 11z" fill={c} />
      <path d="M-30 -18q3 3 6 0M-20 -18q3 3 6 0" stroke={C.ink} strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M-24 -13l-2 2h4z" fill="#f48fb1" />
      <path d="M30 -10q16 -2 14 -18" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round" />
      {resting && <text x="-4" y="-40" fontSize="12" fill={C.ink} className={motion ? 'olw-note' : undefined}>z</text>}
    </g>
  )
}
function Teddy({ v }: ArtProps) {
  const c = v === 0 ? '#c99a6b' : '#f6b9c9'
  return (
    <g>
      <Shadow w={44} />
      <circle cx="-13" cy="-52" r="8" fill={c} /><circle cx="13" cy="-52" r="8" fill={c} />
      <ellipse cx="0" cy="-22" rx="18" ry="22" fill={c} /><circle cx="0" cy="-44" r="14" fill={c} />
      <ellipse cx="0" cy="-17" rx="10" ry="12" fill="#f6e6d2" /><ellipse cx="0" cy="-40" rx="6" ry="5" fill="#f6e6d2" />
      <circle cx="-5" cy="-47" r="1.6" fill={C.ink} /><circle cx="5" cy="-47" r="1.6" fill={C.ink} /><circle cx="0" cy="-42" r="1.8" fill={C.ink} />
      <path d="M-5 -26 l5 -4 5 4 -5 6z" fill="#f06292" transform="translate(0 -4) scale(.8)" />
    </g>
  )
}
function Books({ v }: ArtProps) {
  const cols = v === 0 ? [C.blush, C.lilac, C.sage] : ['#e9a56c', '#c97b5a', '#f0cf8f']
  return (
    <g>
      {cols.map((c, i) => <rect key={i} x={-24 + i * 2} y={-12 * (i + 1)} width={48 - i * 6} height="11" rx="2" fill={c} stroke="rgba(0,0,0,.1)" transform={`rotate(${(i - 1) * 3} 0 ${-12 * i})`} />)}
    </g>
  )
}
function Mug({ v }: ArtProps) {
  const c = [C.blush, C.cream, C.sky][v % 3]
  return (
    <g>
      <rect x="-10" y="-22" width="20" height="22" rx="4" fill={c} stroke="rgba(0,0,0,.14)" />
      <path d="M10 -16q10 0 0 10" stroke={c} strokeWidth="3" fill="none" />
      <path d="M-4 -26q-3 -5 0 -9M3 -26q-3 -5 0 -9" stroke="rgba(150,130,150,.5)" strokeWidth="1.5" fill="none" />
    </g>
  )
}
function Neon({ v, on }: ArtProps) {
  const c = ['#ff7fa8', '#ffd36b', '#b99bff'][v % 3]
  return (
    <g>
      <path d="M0 -4C-26 -22 -32 -40 -18 -50 -8 -56 0 -46 0 -46S8 -56 18 -50C32 -40 26 -22 0 -4z" fill="none" stroke={c} strokeWidth="4" strokeLinejoin="round" opacity={on ? 1 : 0.55} style={{ filter: on ? `drop-shadow(0 0 5px ${c})` : undefined }} />
    </g>
  )
}
function Lights({ v, on, motion }: ArtProps) {
  const cols = v === 0 ? ['#ffe08a', '#ffd0a0', '#fff0b8'] : ['#ff9fbd', '#ffc2d6', '#ffe0ea']
  const pts = [...Array(13)].map((_, i) => { const x = -240 + i * 40; return [x, 6 + Math.sin((i / 12) * Math.PI) * 26] as const })
  return (
    <g>
      <path d={`M-260 -2 ${pts.map(([x, y]) => `L${x} ${y}`).join(' ')} L260 -2`} stroke="rgba(120,90,100,.5)" strokeWidth="1.5" fill="none" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y + 5} r="4.5" fill={cols[i % 3]} opacity={on ? 1 : 0.45} className={motion && on ? 'olw-twinkle' : undefined} style={{ animationDelay: `${(i % 5) * 0.5}s`, filter: on ? `drop-shadow(0 0 4px ${cols[i % 3]})` : undefined }} />)}
    </g>
  )
}
function Cushion({ v }: ArtProps) {
  const c = [C.blush, C.lilac, C.sage][v % 3]
  return (
    <g>
      <Shadow w={56} />
      <path d="M-28 0Q-32 -14 -22 -24Q0 -30 22 -24Q32 -14 28 0Z" fill={c} stroke="rgba(0,0,0,.08)" />
      <circle cx="0" cy="-20" r="2.5" fill="rgba(255,255,255,.7)" />
    </g>
  )
}

/* ---------------- house furniture (living room, kitchen, bathroom) ---------------- */

function Sofa({ v }: ArtProps) {
  const c = [C.blush, C.lilac, C.sage, C.cream][v % 4]
  return (
    <g>
      <Shadow w={210} />
      <rect x="-100" y="-92" width="200" height="60" rx="18" fill={c} stroke="rgba(0,0,0,.08)" />
      <rect x="-104" y="-58" width="26" height="52" rx="12" fill={c} stroke="rgba(0,0,0,.1)" /><rect x="78" y="-58" width="26" height="52" rx="12" fill={c} stroke="rgba(0,0,0,.1)" />
      <rect x="-80" y="-48" width="78" height="34" rx="10" fill="rgba(255,255,255,.35)" /><rect x="2" y="-48" width="78" height="34" rx="10" fill="rgba(255,255,255,.28)" />
      <rect x="-88" y="-8" width="10" height="8" fill={C.woodD} /><rect x="78" y="-8" width="10" height="8" fill={C.woodD} />
      <ellipse cx="-62" cy="-66" rx="16" ry="13" fill={C.white} opacity=".8" />
    </g>
  )
}
function Coffeetable({ v }: ArtProps) {
  const c = v === 0 ? C.wood : C.white
  return (
    <g>
      <Shadow w={110} />
      <rect x="-54" y="-44" width="108" height="9" rx="4" fill={c} stroke="rgba(0,0,0,.1)" />
      <rect x="-46" y="-36" width="7" height="36" fill={C.woodD} /><rect x="39" y="-36" width="7" height="36" fill={C.woodD} />
      <rect x="-14" y="-52" width="28" height="8" rx="2" fill={C.blush} /><path d="M-30 -44q4 -12 8 0z" fill="#8fc89a" />
    </g>
  )
}
function Tv({ v }: ArtProps) {
  const c = v === 0 ? C.wood : C.white
  return (
    <g>
      <Shadow w={130} />
      <rect x="-60" y="-40" width="120" height="40" rx="5" fill={c} stroke="rgba(0,0,0,.1)" />
      <line x1="0" y1="-40" x2="0" y2="0" stroke="rgba(0,0,0,.12)" />
      <rect x="-48" y="-98" width="96" height="56" rx="5" fill="#26233a" stroke="#4a4666" strokeWidth="2" />
      <rect x="-44" y="-94" width="88" height="48" rx="3" fill="#3d3a63" /><path d="M-44 -60 L-10 -94 L44 -94 L44 -80 L10 -46 L-44 -46z" fill="rgba(255,255,255,.07)" />
      <path d="M0 -62c-8-6-9-10-4-11 2-.5 4 1 4 1s2-1.500 4-1c5 1 4 5-4 11z" fill="#f48fb1" opacity=".8" />
    </g>
  )
}
function Fridge({ v }: ArtProps) {
  const c = ['#f4f1f6', '#cfeee0', '#fbd3df'][v % 3]
  return (
    <g>
      <Shadow w={74} />
      <rect x="-36" y="-165" width="72" height="165" rx="9" fill={c} stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
      <line x1="-36" y1="-100" x2="36" y2="-100" stroke="rgba(0,0,0,.18)" strokeWidth="2" />
      <rect x="22" y="-148" width="5" height="34" rx="2.500" fill="#b9b4c4" /><rect x="22" y="-92" width="5" height="26" rx="2.500" fill="#b9b4c4" />
      <rect x="-24" y="-140" width="14" height="12" rx="2" fill={C.blush} transform="rotate(-6 -17 -134)" />
    </g>
  )
}
function Counter({ v }: ArtProps) {
  const c = [C.wood, C.white, '#cfe8d6'][v % 3]
  return (
    <g>
      <Shadow w={230} />
      <rect x="-112" y="-96" width="224" height="96" rx="4" fill={c} stroke="rgba(0,0,0,.1)" />
      <rect x="-116" y="-106" width="232" height="12" rx="4" fill="#efe6dc" stroke="rgba(0,0,0,.1)" />
      {[-76, -22, 32, 86].map((x) => <g key={x}><rect x={x - 24} y="-86" width="48" height="76" rx="3" fill="rgba(255,255,255,.22)" stroke="rgba(0,0,0,.08)" /><circle cx={x + 14} cy="-48" r="3" fill={C.gold} /></g>)}
      <ellipse cx="-30" cy="-107" rx="26" ry="5" fill="#cfd6e4" stroke="rgba(0,0,0,.15)" /><path d="M-30 -112v-22q0-8 10-8" stroke="#9aa3b8" strokeWidth="4" fill="none" strokeLinecap="round" />
      {[62, 88].map((x) => <ellipse key={x} cx={x} cy="-107" rx="14" ry="3.500" fill="#4a4666" />)}
    </g>
  )
}
function Table({ v }: ArtProps) {
  const c = v === 0 ? C.wood : C.white
  return (
    <g>
      <Shadow w={140} />
      <rect x="-68" y="-82" width="136" height="10" rx="5" fill={c} stroke="rgba(0,0,0,.1)" />
      <rect x="-54" y="-72" width="8" height="72" fill={C.woodD} /><rect x="46" y="-72" width="8" height="72" fill={C.woodD} />
      <ellipse cx="-20" cy="-86" rx="16" ry="4" fill="#fff" stroke="rgba(0,0,0,.12)" /><ellipse cx="26" cy="-86" rx="16" ry="4" fill="#fff" stroke="rgba(0,0,0,.12)" />
      <path d="M-4 -92h8l-2 -14h-4z" fill={C.blush} />
    </g>
  )
}
function Chair({ v }: ArtProps) {
  const c = [C.wood, C.blush, C.sage][v % 3]
  return (
    <g>
      <Shadow w={52} />
      <rect x="-22" y="-92" width="8" height="92" rx="3" fill={C.woodD} />
      <rect x="-22" y="-92" width="34" height="38" rx="5" fill={c} stroke="rgba(0,0,0,.1)" />
      <rect x="-22" y="-46" width="44" height="9" rx="4" fill={c} stroke="rgba(0,0,0,.1)" />
      <rect x="-20" y="-38" width="6" height="38" fill={C.woodD} /><rect x="14" y="-38" width="6" height="38" fill={C.woodD} />
    </g>
  )
}
function Toilet() {
  return (
    <g>
      <Shadow w={62} />
      <rect x="-30" y="-82" width="30" height="46" rx="8" fill="#fbf9fd" stroke="rgba(0,0,0,.14)" />
      <rect x="-31" y="-88" width="32" height="8" rx="4" fill="#efeaf5" stroke="rgba(0,0,0,.12)" />
      <path d="M-4 -40 H34 q0 22 -14 28 v12 h-18 v-12 q-14 -6 -14 -28z" fill="#fbf9fd" stroke="rgba(0,0,0,.14)" />
      <rect x="-2" y="-44" width="36" height="7" rx="3.500" fill="#efeaf5" stroke="rgba(0,0,0,.12)" />
      <circle cx="-18" cy="-76" r="3" fill="#cfd6e4" />
    </g>
  )
}
function Sink({ v }: ArtProps) {
  const c = v === 0 ? '#fbf9fd' : '#fde3ea'
  return (
    <g>
      <Shadow w={84} />
      <path d="M-14 -50 h28 l-4 50 h-20z" fill={c} stroke="rgba(0,0,0,.12)" />
      <path d="M-40 -66 h80 q0 22 -40 22 q-40 0 -40 -22z" fill={c} stroke="rgba(0,0,0,.14)" />
      <path d="M0 -68v-18q0 -8 10 -8" stroke="#9aa3b8" strokeWidth="4" fill="none" strokeLinecap="round" /><circle cx="-12" cy="-72" r="3" fill={C.gold} />
    </g>
  )
}
function Bathtub({ v }: ArtProps) {
  const c = v === 0 ? '#fbf9fd' : '#fde3ea'
  return (
    <g>
      <Shadow w={200} />
      <path d="M-98 -64 H98 q2 40 -26 54 H-72 q-28 -14 -26 -54z" fill={c} stroke="rgba(0,0,0,.14)" strokeWidth="1.5" />
      <rect x="-102" y="-72" width="204" height="10" rx="5" fill={c} stroke="rgba(0,0,0,.14)" />
      <path d="M-84 -64 q80 22 168 0" fill="#bfe3f7" opacity=".7" />
      {[[-56, -74], [-30, -82], [-4, -76], [22, -84]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={7 + (i % 2) * 3} fill="#fff" stroke="#cfe3f5" opacity=".95" />)}
      <rect x="-80" y="-10" width="12" height="10" rx="3" fill={C.gold} /><rect x="68" y="-10" width="12" height="10" rx="3" fill={C.gold} />
      <path d="M86 -72v-26q0 -8 -10 -8" stroke="#9aa3b8" strokeWidth="4" fill="none" strokeLinecap="round" />
    </g>
  )
}
function Mirror({ v }: ArtProps) {
  const f = v === 0 ? C.gold : '#fff'
  return (
    <g>
      <ellipse cx="0" cy="-46" rx="34" ry="44" fill={f} stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
      <ellipse cx="0" cy="-46" rx="29" ry="39" fill="#dff1fb" />
      <path d="M-18 -64 q14 -18 30 -12" stroke="rgba(255,255,255,.9)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  )
}

export const ART: Record<ItemType, (p: ArtProps) => JSX.Element> = {
  bed: Bed, nightstand: Nightstand, desk: Desk, shelf: Shelf, bookcase: Bookcase, beanbag: Beanbag, radio: Radio, rug: Rug,
  window: Window, plant: Plant, lamp: Lamp, floorlamp: Floorlamp, poster: Poster, frame: Frame, calendar: Calendar, clock: Clock,
  cat: Cat, teddy: Teddy, books: Books, mug: Mug, neon: Neon, lights: Lights, cushion: Cushion,
  sofa: Sofa, coffeetable: Coffeetable, tv: Tv, fridge: Fridge, counter: Counter, table: Table, chair: Chair,
  toilet: Toilet, sink: Sink, bathtub: Bathtub, mirror: Mirror,
  ...GARDEN_ART,
}
