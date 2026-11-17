import { useState, useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { useSite } from '../../context/SiteContext'
import {
  ANIMATION_CATALOG, ANIMATION_PRESETS, ANIMATION_DIRECTION_OPTIONS,
  DEFAULT_ANIMATIONS, type AnimationGroupKey, type AnimationPresetName, type Appearance,
} from '../../lib/appearance'

// ── primitives (re-use CustomizeWorld pattern) ───────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={on} onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? 'bg-blush-500' : 'bg-stone-200 dark:bg-white/10'
      }`}
    >
      <span className={`inline-block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format: (v: number) => string
}) {
  const pct = (v: number) => `${Math.round(((v - min) / (max - min)) * 100)}%`
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-stone-600 dark:text-stone-300">{label}</span>
        <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blush-500" style={{ backgroundImage: `linear-gradient(to right, #f9a8d4 ${pct(value)}, transparent ${pct(value)})` }} />
    </div>
  )
}

function Seg({ label, value, options, onChange }: {
  label: string; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void
}) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} role="radio" aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
              value === o.id
                ? 'bg-blush-500 text-white shadow-soft scale-105'
                : 'bg-stone-100 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200'
            }`}
          >{o.label}</button>
        ))}
      </div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-md bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">{children}</span>
}

// ── main component ───────────────────────────────────────────────────────────

export function AnimationSettings() {
  const { settings, appearance, updateTheme, setPreviewAppearance } = useSite()
  const saved = (settings?.theme?.appearance as Appearance | null) ?? null
  const savedAnimations = saved?.animations ?? DEFAULT_ANIMATIONS
  const draftRef = useRef(appearance.animations)
  const [draft, setDraft] = useState(() => ({ ...appearance.animations }))

  const sameAnimations = (a: Appearance['animations'], b: Appearance['animations']) =>
    JSON.stringify(a) === JSON.stringify(b)

  // sync when partner saves externally
  useEffect(() => {
    const lastSaved = settings?.theme?.appearance as Appearance | null
    if (lastSaved && sameAnimations(draftRef.current, lastSaved.animations ?? DEFAULT_ANIMATIONS)) {
      setDraft({ ...appearance.animations })
    }
    draftRef.current = appearance.animations
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.theme?.appearance])

  // dirty = unsaved changes against the saved look (not against a live preview)
  const dirty = !sameAnimations(draft, savedAnimations)

  // live preview — only affect animations group
  useEffect(() => {
    if (dirty) {
      setPreviewAppearance(saved ? { ...saved, animations: draft } : { ...appearance, animations: draft })
    } else {
      setPreviewAppearance(null)
    }
    return () => setPreviewAppearance(null)
  }, [draft, dirty, saved, appearance, setPreviewAppearance])

  const editFn = (fn: (a: typeof draft) => typeof draft) => setDraft((d) => fn({ ...d }))

  const setItem = (key: AnimationGroupKey, patch: Partial<typeof draft[AnimationGroupKey]>) =>
    editFn((a) => ({ ...a, [key]: { ...a[key], ...patch } }))

  // reset to defaults
  const handleReset = () => { setDraft({ ...DEFAULT_ANIMATIONS }); setPreviewAppearance(null) }

  // apply (save)
  const handleApply = async () => {
    if (!settings) return
    const final: Appearance = { ...appearance, animations: draft }
    await updateTheme({ appearance: final }, { immediate: true })
  }

  // cancel (drop unsaved changes)
  const handleCancel = () => { setDraft({ ...appearance.animations }); setPreviewAppearance(null) }

  // pick preset
  const pickPreset = (preset: typeof ANIMATION_PRESETS[number]) => {
    setDraft({ ...preset.animations })
  }

  // direction selector
  const renderDirection = (key: AnimationGroupKey) => {
    const item = draft[key] as { direction?: string }
    const opts = ANIMATION_DIRECTION_OPTIONS[key]
    if (!opts || !item) return null
    return <Seg label="Direction" value={item.direction ?? ''} options={opts} onChange={(id) => setItem(key, { direction: id as never })} />
  }

  return (
    <div className="card max-w-2xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blush-500" />
          <h3 className="font-display text-base font-semibold text-stone-800 dark:text-stone-100">Animations</h3>
          <Badge>v1.1</Badge>
        </div>

        {/* save status */}
        {dirty && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={handleCancel} className="btn-ghost text-xs">Cancel</button>
            <button onClick={handleReset} className="btn-ghost text-xs">Reset</button>
            <button onClick={handleApply} disabled={!dirty} className="btn-primary text-xs">Apply</button>
          </div>
        )}
      </div>

      {/* Presets */}
      <div className="card p-4 space-y-3 bg-blush-50/50 dark:bg-night-800/50 border-dashed">
        <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">Presets</span>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ANIMATION_PRESETS.map((p) => (
            <button key={p.id} onClick={() => pickPreset(p)}
              className="group text-left rounded-xl border border-stone-200 dark:border-white/10 p-3 transition-all hover:border-blush-400 hover:shadow-md hover:scale-[1.02]">
              <div className="text-2xl mb-1">{p.emoji}</div>
              <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">{p.name}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{p.blurb}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {ANIMATION_CATALOG.map(({ group, items }) => (
        <div key={group} className="space-y-4">
          <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-200 border-b border-stone-200 dark:border-white/10 pb-2">{group}</h4>
          {items.map(({ key, label, desc, hasDirection }) => {
            const cfg = draft[key]
            if (!cfg) return null
            return (
              <div key={key} className="rounded-xl border border-stone-200 dark:border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{label}</div>
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{desc}</div>
                  </div>
                  <Toggle on={cfg.enabled} onChange={(v) => setItem(key, { enabled: v })} />
                </div>
                {cfg.enabled && (
                  <>
                    <Slider label="Speed" value={cfg.speed} min={0.2} max={3} step={0.1}
                      onChange={(v) => setItem(key, { speed: v })}
                      format={(v) => `${v.toFixed(1)}×`} />
                    <Slider label="Intensity" value={cfg.intensity} min={0} max={2} step={0.1}
                      onChange={(v) => setItem(key, { intensity: v })}
                      format={(v) => `${Math.round(v * 100)}%`} />
                    <Slider label="Duration" value={cfg.duration} min={0.1} max={120} step={0.1}
                      onChange={(v) => setItem(key, { duration: v })}
                      format={(v) => `${v.toFixed(1)}s`} />
                    <Slider label="Delay" value={cfg.delay} min={0} max={10} step={0.1}
                      onChange={(v) => setItem(key, { delay: v })}
                      format={(v) => `${v.toFixed(1)}s`} />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-600 dark:text-stone-300">Loop</span>
                      <Toggle on={cfg.loop} onChange={(v) => setItem(key, { loop: v })} />
                    </div>
                    {hasDirection && renderDirection(key)}
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
