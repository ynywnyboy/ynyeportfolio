import { Droplets, Shovel, Sprout } from 'lucide-react'
import { PETAL_COLORS, SEEDS, seedOf } from '../utils/garden'

export type GardenTool = 'water' | 'plant' | 'remove'

interface Props {
  tool: GardenTool
  onTool: (t: GardenTool) => void
  seed: string
  onSeed: (s: string) => void
  color: string | null
  onColor: (c: string | null) => void
  onWaterAll: () => void
}

const b = (on: boolean) => `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur transition ${on ? 'bg-emerald-500 text-white' : 'bg-white/70 text-emerald-700 hover:bg-white dark:bg-white/10 dark:text-emerald-200'}`

/** Garden tools for Walking mode: choose a tool, then tap a soil patch, raised bed or flower pot. */
export function GardenBar({ tool, onTool, seed, onSeed, color, onColor, onWaterAll }: Props) {
  return (
    <div className="mt-2 rounded-2xl bg-emerald-50/70 p-2 backdrop-blur dark:bg-white/5" role="toolbar" aria-label="Garden tools">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <button className={b(tool === 'water')} onClick={() => onTool('water')} aria-pressed={tool === 'water'}><Droplets size={14} /> Water</button>
        <button className={b(tool === 'plant')} onClick={() => onTool('plant')} aria-pressed={tool === 'plant'}><Sprout size={14} /> Plant</button>
        <button className={b(tool === 'remove')} onClick={() => onTool('remove')} aria-pressed={tool === 'remove'}><Shovel size={14} /> Remove</button>
        <button className={b(false)} onClick={onWaterAll}><Droplets size={14} /> Water all</button>
      </div>
      {tool === 'plant' && (
        <div className="mt-2 space-y-1.5">
          <div className="flex flex-wrap justify-center gap-1">
            {SEEDS.map((s) => <button key={s.id} onClick={() => { onSeed(s.id); onColor(null) }} className={`rounded-full px-2.5 py-1 text-[11px] ${seed === s.id ? 'bg-emerald-500 text-white' : 'bg-white/70 text-stone-600 dark:bg-white/10 dark:text-stone-200'}`}>{s.label}</button>)}
          </div>
          {seed !== 'herb' && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-stone-500">
              Colour
              <button aria-label="Natural colour" onClick={() => onColor(null)} className={`h-5 w-5 rounded-full border-2 ${color === null ? 'border-emerald-500' : 'border-white'} shadow-sm`} style={{ background: seedOf(seed).petal }} />
              {PETAL_COLORS.filter((c) => c !== seedOf(seed).petal).map((c) => <button key={c} aria-label={`Colour ${c}`} onClick={() => onColor(c)} className={`h-5 w-5 rounded-full border-2 ${color === c ? 'border-emerald-500' : 'border-white'} shadow-sm`} style={{ background: c }} />)}
            </div>
          )}
          <p className="text-center text-[11px] text-stone-500">Tap soil, a raised bed or a flower pot to plant. Planting on a plant replaces it.</p>
        </div>
      )}
      {tool === 'water' && <p className="mt-1.5 text-center text-[11px] text-stone-500">Tap a plant to water it. Each watering helps it grow: seed → sprout → growing → fully grown.</p>}
      {tool === 'remove' && <p className="mt-1.5 text-center text-[11px] text-stone-500">Tap a plant to pull it up.</p>}
    </div>
  )
}
