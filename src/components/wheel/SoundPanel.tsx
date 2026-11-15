import { useSyncExternalStore } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { SFX_PREVIEWS, setSfx, sfxSnapshot, sfxSubscribe, unlockSfx } from '../../lib/sfx'
import { Switch } from './WheelManager'

/** Sound-effect settings for the wheel. Separate from the background music player. */
export function SoundPanel() {
  const s = useSyncExternalStore(sfxSubscribe, sfxSnapshot, sfxSnapshot)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {s.enabled ? <Volume2 className="h-5 w-5 text-blush-500" /> : <VolumeX className="h-5 w-5 text-stone-400" />}
          <span className="font-medium">Sound effects</span>
        </div>
        <Switch checked={s.enabled} onChange={(v) => { unlockSfx(); setSfx({ enabled: v }) }} label="Sound effects on or off" />
      </div>

      <label className={`block ${s.enabled ? '' : 'opacity-50'}`}>
        <span className="label">Volume — {Math.round(s.volume * 100)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={s.volume}
          disabled={!s.enabled}
          onChange={(e) => setSfx({ volume: Number(e.target.value) })}
          className="w-full accent-blush-500"
          aria-label="Sound effects volume"
        />
      </label>

      <div>
        <span className="label">Preview</span>
        <div className="flex flex-wrap gap-2">
          {SFX_PREVIEWS.map((p) => (
            <button key={p.id} className="btn-ghost !px-4 !py-1.5" disabled={!s.enabled} onClick={() => { unlockSfx(); p.play() }}>{p.label}</button>
          ))}
        </div>
      </div>
      <p className="text-xs text-stone-500">These never touch your music. On iPhones, the silent switch also mutes sound effects.</p>
    </div>
  )
}
