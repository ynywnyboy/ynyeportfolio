import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Check, Pencil, Copy, Trash2, Upload, RotateCcw, X, Save, Loader2 } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { DEFAULT_APPEARANCE, BG_PRESETS, THEME_PRESETS, DECO_KINDS, EFFECTS, HEADING_FONTS, BODY_FONTS, CARD_STYLES, MOTION_LEVELS, type Appearance, type SavedTheme, type DecoKind, type BgKind, type ThemePreset, type MotionLevel, type CardStyle, type ShadowLevel } from '../lib/appearance'
import { useA11yPrefs, setA11yPrefs } from '../lib/a11y'
import { useReducedMotion } from '../lib/a11y'
import { validateFile, shrinkImage, normalizeImage, uploadFile } from '../lib/storage'
import { errMsg } from '../lib/data'
import { useToast } from '../context/ToastContext'

interface Props {
  edit?: boolean
}

// --- tiny UI primitives ---
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-4">
      <div>
        <h3 className="font-display text-base text-stone-800 dark:text-stone-100">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{hint}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
function Seg({ label, value, options, onChange }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (id: string) => void }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onChange(o.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              value === o.id
                ? 'bg-blush-500 text-white shadow-soft scale-105'
                : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
function Slider({ label, value, min, max, step, onChange, format }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string }) {
  const pct = (v: number) => `${Math.round(((v - min) / (max - min)) * 100)}%`
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        <span className="text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blush-500 mt-2"
        style={{ background: `linear-gradient(to right, #f9a8c1 0%, #f9a8c1 ${pct(value)}, #e5e7eb ${pct(value)}, #e5e7eb 100%)` }}
        aria-label={label}
      />
    </div>
  )
}
function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-within:focus-visible:ring-2 focus-within:focus-visible:ring-blush-500 focus-within:focus-visible:ring-offset-2 ${on ? 'bg-blush-500' : 'bg-stone-300 dark:bg-stone-600'}`}
        onClick={() => onChange(!on)}
      >
        <span
          className={`pointer-events-none block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${on ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </span>
      <span className="select-none text-sm text-stone-700 dark:text-stone-200 group-hover:text-stone-900 dark:group-hover:text-stone-100">{label}</span>
    </label>
  )
}
function sameAppearance(a: Appearance, b: Appearance): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
function pct(v: number) { return `${Math.round(v * 100)}%` }
function ConfirmDialog({ open, title, message, confirmLabel, onCancel, onConfirm }: { open: boolean; title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-night-800"
      >
        <h3 className="font-display text-lg text-stone-800 dark:text-stone-100">{title}</h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </motion.div>
    </div>
  )
}

export function CustomizeWorld({ edit }: Props) {
  const toast = useToast()
  const { theme, updateTheme, appearance, setPreviewAppearance } = useSite()
  const reduced = useReducedMotion()
  const a11y = useA11yPrefs()
  const saved = theme.appearance
  const [draft, setDraft] = useState<Appearance>(saved)
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(theme.saved ?? [])
  const [newName, setNewName] = useState('')
  const [matchAccent, setMatchAccent] = useState(false)
  const [presetAccent, setPresetAccent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState<SavedTheme | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const dirty = !sameAppearance(draft, saved)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const lastSaved = useRef(saved)
  const savedKey = JSON.stringify(saved)

  // live preview of the unsaved draft on this screen only; leaving the page cancels it
  useEffect(() => { setPreviewAppearance(dirty ? draft : null) }, [draft, dirty, setPreviewAppearance])
  useEffect(() => () => setPreviewAppearance(null), [setPreviewAppearance])
  // when nothing is being edited, follow changes your partner saves
  useEffect(() => {
    if (sameAppearance(draftRef.current, lastSaved.current)) setDraft(saved)
    lastSaved.current = saved
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey])
  useEffect(() => () => { const u = draftRef.current.bg.image; if (u.startsWith('blob:')) URL.revokeObjectURL(u) }, [])

  const editFn = (fn: (a: Appearance) => Appearance) => setDraft((d) => fn(d))
  const setBg = (patch: Partial<Appearance['bg']>) => editFn((a) => ({ ...a, bg: { ...a.bg, ...patch } }))
  const setFx = (patch: Partial<Appearance['effect']>) => editFn((a) => ({ ...a, effect: { ...a.effect, ...patch } }))
  const setCard = (patch: Partial<Appearance['card']>) => editFn((a) => ({ ...a, card: { ...a.card, ...patch } }))

  const toggleDeco = (k: DecoKind) =>
    editFn((a) => ({ ...a, decorations: a.decorations.includes(k) ? a.decorations.filter((x) => x !== k) : [...a.decorations, k] }))

  const pickPreset = (p: ThemePreset) => { setDraft(p.appearance); setPendingFile(null); setPresetAccent(p.accent) }

  const pickImage = async (file: File | undefined) => {
    if (!file) return
    const err = validateFile(file, ['image'])
    if (err) return toast(err, 'error')
    try {
      const ready = await shrinkImage(await normalizeImage(file))
      const old = draftRef.current.bg.image
      if (old.startsWith('blob:')) URL.revokeObjectURL(old)
      setPendingFile(ready)
      setBg({ kind: 'image', image: URL.createObjectURL(ready) })
    } catch (e) { toast(errMsg(e), 'error') }
  }

  /** Upload a chosen background photo only when it is actually saved (nothing is orphaned by Cancel). */
  const withUploadedImage = async (a: Appearance): Promise<Appearance> => {
    if (a.bg.kind === 'image' && a.bg.image.startsWith('blob:') && pendingFile) {
      const path = await uploadFile(pendingFile, 'backgrounds')
      URL.revokeObjectURL(a.bg.image)
      setPendingFile(null)
      return { ...a, bg: { ...a.bg, image: path } }
    }
    return a
  }

  const apply = async () => {
    setBusy(true)
    try {
      const final = await withUploadedImage(draft)
      updateTheme({ appearance: final, ...(matchAccent && presetAccent ? { accent: presetAccent } : {}) }, { immediate: true })
      setDraft(final)
      setPreviewAppearance(null)
    } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(false) }
  }
  const cancel = () => { setDraft(saved); setPendingFile(null); setPresetAccent(null); setPreviewAppearance(null) }
  const reset = () => { setDraft(DEFAULT_APPEARANCE); setPendingFile(null); setPresetAccent(null) }

  // ---- saved custom themes ----
  const saveAs = async () => {
    const name = newName.trim()
    if (!name) return toast('Give your theme a name.', 'error')
    if (savedThemes.length >= 24) return toast('You can keep up to 24 themes — delete one first.', 'error')
    setBusy(true)
    try {
      const final = await withUploadedImage(draft)
      setDraft(final)
      updateTheme({ saved: [...savedThemes, { id: crypto.randomUUID(), name, appearance: final }] }, { immediate: true })
      setNewName('')
    } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(false) }
  }
  const duplicate = (t: { id: string; name: string; appearance: Appearance }) => {
    if (savedThemes.length >= 24) return toast('You can keep up to 24 themes — delete one first.', 'error')
    updateTheme({ saved: [...savedThemes, { id: crypto.randomUUID(), name: `${t.name} (copy)`.slice(0, 40), appearance: t.appearance }] }, { immediate: true, quiet: true })
  }
  const rename = () => {
    if (!renaming) return
    const name = renaming.name.trim()
    if (name) updateTheme({ saved: savedThemes.map((t: SavedTheme) => (t.id === renaming.id ? { ...t, name: name.slice(0, 40) } : t)) }, { immediate: true, quiet: true })
    setRenaming(null)
  }
  const remove = (t: { id: string; name: string; appearance: Appearance }) => {
    updateTheme({ saved: savedThemes.filter((x: { id: string; name: string; appearance: Appearance }) => x.id !== t.id) }, { immediate: true, quiet: true })
    setDeleting(null)
  }

  const bgTabs: { id: BgKind; label: string }[] = useMemo(() => [
    { id: 'default', label: 'Original' }, { id: 'solid', label: 'Solid' }, { id: 'gradient', label: 'Gradient' },
    { id: 'preset', label: 'Presets' }, { id: 'image', label: 'My photo' },
  ], [])

  return (
    <div className="space-y-5">
      {/* Presets grid */}
      <Section title="Presets" hint="A whole look in one tap — you can tweak anything afterwards.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {THEME_PRESETS.map((p) => {
            const css = BG_PRESETS.find((b) => b.id === p.appearance.bg.preset)?.css
            return (
              <motion.button
                key={p.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pickPreset(p)}
                className="group overflow-hidden rounded-2xl text-left shadow-md ring-1 ring-black/5 transition-all hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-400"
              >
                <span className="block h-20 w-full" style={{ background: css }} aria-hidden />
                <div className="bg-white/90 px-3 py-2.5 dark:bg-night-800/90 backdrop-blur-sm">
                  <span className="block text-sm font-semibold text-stone-800 dark:text-stone-100">{p.emoji} {p.name}</span>
                  <span className="block text-[11px] text-stone-500 dark:text-stone-400 leading-tight">{p.blurb}</span>
                </div>
              </motion.button>
            )
          })}
        </div>
        <label className="flex items-start gap-2 text-xs text-stone-500 dark:text-stone-400 cursor-pointer mt-2">
          <input type="checkbox" className="mt-0.5 accent-blush-500" checked={matchAccent} onChange={(e) => setMatchAccent(e.target.checked)} />
          <span>Also switch the accent color to the preset's color when I press Apply</span>
        </label>
      </Section>

      {/* My Themes */}
      <Section title="My Themes" hint="Save the look you're editing under a name, and bring it back any time. Shared with your partner.">
        <div className="flex gap-2">
          <input
            className="input flex-1 min-w-0" maxLength={40} placeholder="Name this look…" value={newName}
            onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void saveAs()}
            aria-label="Theme name"
          />
          <button className="btn-primary shrink-0" onClick={() => void saveAs()} disabled={busy}>
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
        {savedThemes.length === 0 && <p className="text-sm text-stone-500 dark:text-stone-400 pt-2">No saved themes yet.</p>}
        {savedThemes.length > 0 && (
          <ul className="divide-y divide-blush-100/60 dark:divide-white/5 mt-2 space-y-1">
            {savedThemes.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5">
                {renaming?.id === t.id ? (
                  <>
                    <input className="input !w-auto min-w-0 flex-1" autoFocus maxLength={40} value={renaming.name} onChange={(e) => setRenaming({ id: t.id, name: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') rename(); if (e.key === 'Escape') setRenaming(null) }} aria-label="New name" />
                    <button className="btn-primary !px-3 !py-1.5" onClick={rename}><Check className="h-4 w-4" /></button>
                    <button className="btn-ghost !px-3 !py-1.5" onClick={() => setRenaming(null)}><X className="h-4 w-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800 dark:text-stone-100">{t.name}</span>
                    <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => { setDraft(t.appearance); setPendingFile(null); setPresetAccent(null) }}>Use</button>
                    <button className="rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10 transition" onClick={() => setRenaming({ id: t.id, name: t.name })} aria-label={`Rename ${t.name}`}><Pencil className="h-4 w-4" /></button>
                    <button className="rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10 transition" onClick={() => duplicate(t)} aria-label={`Duplicate ${t.name}`}><Copy className="h-4 w-4" /></button>
                    <button className="rounded-full p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition" onClick={() => setDeleting(t)} aria-label={`Delete ${t.name}`}><Trash2 className="h-4 w-4" /></button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Background */}
      <Section title="Background">
        <Seg label="Background type" value={draft.bg.kind} options={bgTabs.map(t => ({ ...t, id: t.id as string }))} onChange={(kind) => setBg({ kind: kind as BgKind })} />
        {draft.bg.kind === 'solid' && (
          <label className="flex items-center gap-3 text-sm cursor-pointer"><input type="color" value={draft.bg.color} onChange={(e) => setBg({ color: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-0 p-0" aria-label="Background color" /> Pick a color</label>
        )}
        {draft.bg.kind === 'gradient' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={draft.bg.from} onChange={(e) => setBg({ from: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-0 p-0" aria-label="Gradient start" /> From</label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={draft.bg.to} onChange={(e) => setBg({ to: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-0 p-0" aria-label="Gradient end" /> To</label>
            </div>
            <Slider label="Angle" value={draft.bg.angle} min={0} max={360} step={5} onChange={(angle) => setBg({ angle })} format={(v) => `${Math.round(v)}°`} />
          </div>
        )}
        {draft.bg.kind === 'preset' && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {BG_PRESETS.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBg({ preset: p.id })}
                aria-pressed={draft.bg.preset === p.id}
                className={`overflow-hidden rounded-2xl text-left ring-offset-2 transition-all ${draft.bg.preset === p.id ? 'ring-2 ring-blush-500 shadow-lg' : 'ring-1 ring-black/10 hover:shadow-md'}`}
              >
                <span className="block h-16 w-full" style={{ background: p.css }} aria-hidden />
                <span className="block bg-white/80 px-2 py-1.5 text-[11px] font-medium dark:bg-night-800/80">{p.name}</span>
              </motion.button>
            ))}
          </div>
        )}
        {draft.bg.kind === 'image' && (
          <div className="space-y-3">
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = '' }} />
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> {draft.bg.image ? 'Choose a different photo' : 'Choose a photo'}</button>
            {draft.bg.image && <Slider label="Softening (keeps text readable)" value={draft.bg.dim} min={0} max={0.8} step={0.05} onChange={(dim) => setBg({ dim })} format={pct} />}
            <p className="text-xs text-stone-500 dark:text-stone-400">Big photos are shrunk automatically. The photo is uploaded only when you press Apply.</p>
          </div>
        )}
        {(draft.bg.kind !== 'default') && <p className="text-xs text-stone-500 dark:text-stone-400">In dark mode every custom background is dimmed so text stays easy to read.</p>}
      </Section>

      {/* Fonts */}
      <Section title="Fonts">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="label">Headings</span>
            <select className="input mt-1" value={draft.fonts.heading} onChange={(e) => editFn((a) => ({ ...a, fonts: { ...a.fonts, heading: e.target.value } }))}>
              {HEADING_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
          <label className="block"><span className="label">Body text</span>
            <select className="input mt-1" value={draft.fonts.body} onChange={(e) => editFn((a) => ({ ...a, fonts: { ...a.fonts, body: e.target.value } }))}>
              {BODY_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </label>
        </div>
      </Section>

      {/* Decorations & animation */}
      <Section title="Decorations & Animation" hint="Little things that float across the page.">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Decorations">
          {DECO_KINDS.map((k) => {
            const on = draft.decorations.includes(k.id)
            return (
              <motion.button
                key={k.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleDeco(k.id)}
                aria-pressed={on}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  on
                    ? 'bg-blush-500 text-white shadow-md'
                    : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200'
                }`}
              >
                <span aria-hidden>{k.emoji}</span> {k.label}
              </motion.button>
            )
          })}
        </div>
        <div className="pt-2">
          <span className="label">Animation intensity</span>
          <Seg label="Animation intensity" value={draft.motion} options={MOTION_LEVELS.map((m) => ({ id: m.id, label: m.label }))} onChange={(motion) => editFn((a) => ({ ...a, motion: motion as MotionLevel }))} />
          <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">"Off" also turns off floating decorations and animated backgrounds.</p>
        </div>
      </Section>

      {/* Cards */}
      <Section title="Cards" hint="How boxes of content look on every page.">
        <Seg label="Card style" value={draft.card.style} options={CARD_STYLES} onChange={(style) => setCard({ style: style as CardStyle })} />
        <div>
          <span className="label">Shadow</span>
          <Seg label="Shadow" value={draft.card.shadow} options={[{ id: 'none', label: 'None' }, { id: 'soft', label: 'Soft' }, { id: 'dreamy', label: 'Dreamy' }]} onChange={(shadow) => setCard({ shadow: shadow as ShadowLevel })} />
        </div>
        <Toggle on={draft.card.glow} onChange={(glow) => setCard({ glow })} label="Glowing border" />
      </Section>

      {/* Animated background */}
      <Section title="Animated Background" hint="Choose an effect that plays softly behind everything.">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Background effect">
          {EFFECTS.map((e) => (
            <motion.button
              key={e.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              role="radio"
              aria-checked={draft.effect.kind === e.id}
              onClick={() => setFx({ kind: e.id as unknown as typeof e.id, enabled: e.id !== 'none' })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                draft.effect.kind === e.id ? 'bg-blush-500 text-white shadow-md' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10 dark:hover:bg-white/20 text-stone-700 dark:text-stone-200'
              }`}
            >
              <span aria-hidden>{e.emoji}</span> {e.label}
            </motion.button>
          ))}
        </div>
        {draft.effect.kind !== 'none' && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
            <Toggle on={draft.effect.enabled} onChange={(enabled) => setFx({ enabled })} label="Effect enabled" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Slider label="Speed" value={draft.effect.speed} min={0.2} max={2.5} step={0.1} onChange={(speed) => setFx({ speed })} format={(v) => `${v.toFixed(1)}×`} />
              <Slider label="Density" value={draft.effect.density} min={0.2} max={2} step={0.1} onChange={(density) => setFx({ density })} format={(v) => `${v.toFixed(1)}×`} />
              <Slider label="Opacity" value={draft.effect.opacity} min={0.1} max={1} step={0.05} onChange={(opacity) => setFx({ opacity })} format={pct} />
              <Slider label="Intensity" value={draft.effect.intensity} min={0.5} max={1.6} step={0.1} onChange={(intensity) => setFx({ intensity })} format={(v) => `${v.toFixed(1)}×`} />
            </div>
          </motion.div>
        )}
      </Section>

      {/* Comfort settings */}
      <Section title="Just for this device" hint="Comfort settings. They stay on this device only — they are never shared with your partner and never change the shared theme.">
        <Toggle on={a11y.reduceMotion} onChange={(reduceMotion) => setA11yPrefs({ reduceMotion })} label="Reduce motion (also follows your device's own setting)" />
        <Toggle on={a11y.pauseBackground} onChange={(pauseBackground) => setA11yPrefs({ pauseBackground })} label="Hide animated backgrounds & floating decorations" />
      </Section>

      {/* Floating action bar — fixed at bottom, cleared properly */}
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-1/2 z-[60] flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 items-center justify-between gap-2 rounded-2xl border border-white/50 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-night-800/95"
            role="status" aria-live="polite"
          >
            <p className="text-sm text-blush-600 dark:text-blush-400 font-medium whitespace-nowrap">
              ● Previewing — not saved yet
            </p>
            <div className="flex shrink-0 gap-2">
              <button className="btn-ghost text-sm" onClick={cancel} disabled={!dirty || busy}><X className="h-4 w-4" /> Cancel</button>
              <button className="btn-ghost text-sm" onClick={reset} disabled={busy || sameAppearance(draft, DEFAULT_APPEARANCE)}><RotateCcw className="h-4 w-4" /> Reset</button>
              <button className="btn-primary text-sm" onClick={() => void apply()} disabled={!dirty || busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={Boolean(deleting)} title="Delete this theme?" message={`"${deleting?.name ?? ''}" will be removed for both of you. The look that's currently applied isn't affected.`} confirmLabel="Delete" onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) remove(deleting) }} />
    </div>
  )
}