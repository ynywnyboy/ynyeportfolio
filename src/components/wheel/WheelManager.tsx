import { useMemo, useState } from 'react'
import { Heart, Loader2, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { deleteRow, errMsg, insertRow, updateRow } from '../../lib/data'
import { sfxHeart } from '../../lib/sfx'
import type { WheelOption, WheelSet } from '../../lib/types'
import { DEFAULT_CATEGORIES, groupByCategory } from '../../lib/wheel'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ConfirmDialog, ErrorBox, Field, Modal, Spinner } from '../ui'
import { useWheelData } from './useWheelData'

const EMOJIS = ['💗', '💋', '😘', '🤗', '🥰', '💌', '🌹', '🎁', '📸', '🍓', '🍷', '🎬', '🎶', '💃', '🌅', '✨', '🧸', '☕', '🍜', '🏖️']
const NEW_CATEGORY = '__new__'

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${checked ? 'bg-blush-500' : 'bg-stone-300 dark:bg-white/20'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.375rem]' : 'left-0.5'}`} />
    </button>
  )
}

interface Props {
  wheels: WheelSet[]
  options: WheelOption[]
  wheelId: string | null
  onSelect: (id: string) => void
  reloadOptions: () => void
}

/** Add / edit / delete / enable options, manage several wheels, reset to defaults. Both partners see changes live. */
export function WheelManager({ wheels, options, wheelId, onSelect, reloadOptions }: Props) {
  const { user } = useAuth()
  const toast = useToast()
  const wheel = wheels.find((w) => w.id === wheelId) ?? null
  const mine = useMemo(() => options.filter((o) => o.wheel_id === wheelId).sort((a, b) => a.position - b.position), [options, wheelId])
  const groups = useMemo(() => groupByCategory(mine), [mine])
  const categories = useMemo(() => Array.from(new Set([...DEFAULT_CATEGORIES, ...mine.map((o) => o.category)])), [mine])
  const enabledCount = mine.filter((o) => o.enabled).length

  const [optModal, setOptModal] = useState<WheelOption | 'new' | null>(null)
  const [form, setForm] = useState({ label: '', emoji: '💗', category: DEFAULT_CATEGORIES[1] as string, newCategory: '' })
  const [saving, setSaving] = useState(false)
  const [delOpt, setDelOpt] = useState<WheelOption | null>(null)

  const [wheelModal, setWheelModal] = useState<'new' | 'edit' | null>(null)
  const [wForm, setWForm] = useState({ name: '', emoji: '💗', defaults: true })
  const [delWheel, setDelWheel] = useState(false)
  const [resetting, setResetting] = useState(false)

  const openOption = (o: WheelOption | 'new') => {
    setOptModal(o)
    setForm(o === 'new'
      ? { label: '', emoji: '💗', category: categories[1] ?? categories[0], newCategory: '' }
      : { label: o.label, emoji: o.emoji, category: o.category, newCategory: '' })
  }

  const saveOption = async () => {
    const label = form.label.trim()
    const category = (form.category === NEW_CATEGORY ? form.newCategory : form.category).trim()
    if (!label) return toast('Write what the wheel should say.', 'error')
    if (!category) return toast('Give the new category a name.', 'error')
    if (!wheelId) return
    setSaving(true)
    try {
      const emoji = form.emoji.trim() || '💗'
      if (optModal === 'new') {
        const pos = mine.length ? Math.max(...mine.map((o) => o.position)) + 1 : 1
        await insertRow<WheelOption>('wheel_options', { wheel_id: wheelId, label, emoji, category, position: pos, enabled: true, created_by: user?.id ?? null })
        sfxHeart()
        toast('Added to the wheel 💗')
      } else if (optModal) {
        await updateRow<WheelOption>('wheel_options', 'id', optModal.id, optModal.version, { label, emoji, category })
        toast('Saved')
      }
      setOptModal(null)
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (o: WheelOption, enabled: boolean) => {
    try { await updateRow<WheelOption>('wheel_options', 'id', o.id, o.version, { enabled }) } catch (e) { toast(errMsg(e), 'error') }
  }

  const setCategory = async (items: WheelOption[], enabled: boolean) => {
    try {
      await Promise.all(items.filter((o) => o.enabled !== enabled).map((o) => updateRow<WheelOption>('wheel_options', 'id', o.id, o.version, { enabled })))
    } catch (e) { toast(errMsg(e), 'error') }
  }

  const removeOption = async (o: WheelOption) => {
    try { await deleteRow('wheel_options', 'id', o.id); toast('Removed from the wheel') } catch (e) { toast(errMsg(e), 'error') } finally { setDelOpt(null) }
  }

  const openWheel = (mode: 'new' | 'edit') => {
    setWheelModal(mode)
    setWForm(mode === 'edit' && wheel ? { name: wheel.name, emoji: wheel.emoji, defaults: false } : { name: '', emoji: '💗', defaults: true })
  }

  const saveWheel = async () => {
    const name = wForm.name.trim()
    if (!name) return toast('Give the wheel a name.', 'error')
    setSaving(true)
    try {
      const emoji = wForm.emoji.trim() || '💗'
      if (wheelModal === 'new') {
        const pos = wheels.length ? Math.max(...wheels.map((w) => w.position)) + 1 : 0
        const created = await insertRow<WheelSet>('wheel_sets', { name, emoji, position: pos, created_by: user?.id ?? null })
        if (wForm.defaults) {
          const { error } = await supabase.rpc('reset_love_wheel', { p_wheel: created.id })
          if (error) throw error
          reloadOptions()
        }
        onSelect(created.id)
        toast('New wheel created ✨')
      } else if (wheel) {
        await updateRow<WheelSet>('wheel_sets', 'id', wheel.id, wheel.version, { name, emoji })
        toast('Wheel renamed')
      }
      setWheelModal(null)
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeWheel = async () => {
    if (!wheel) return
    try {
      await deleteRow('wheel_sets', 'id', wheel.id)
      const next = wheels.find((w) => w.id !== wheel.id)
      if (next) onSelect(next.id)
      reloadOptions()
      toast('Wheel deleted')
    } catch (e) { toast(errMsg(e), 'error') } finally { setDelWheel(false) }
  }

  const resetWheel = async () => {
    if (!wheel) return
    setResetting(true)
    try {
      const { error } = await supabase.rpc('reset_love_wheel', { p_wheel: wheel.id })
      if (error) throw error
      reloadOptions()
      toast('Wheel reset to the original options 💗')
    } catch (e) { toast(errMsg(e), 'error') } finally { setResetting(false); setConfirmReset(false) }
  }
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-blush-50/80 p-4 text-sm text-stone-600 dark:bg-white/5 dark:text-stone-300">
        <Heart className="mr-1.5 inline h-4 w-4 fill-blush-300 text-blush-400" />
        Everything on the wheel is optional. Either of you can edit, switch off or delete any idea — and a result is never an obligation.
      </div>

      {/* wheels */}
      <div className="flex flex-wrap items-center gap-2">
        {wheels.map((w) => (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            aria-pressed={w.id === wheelId}
            className={`rounded-full px-4 py-1.5 text-sm transition ${w.id === wheelId ? 'bg-blush-500 text-white shadow-soft' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`}
          >
            {w.emoji} {w.name}
          </button>
        ))}
        <button className="btn-ghost !py-1.5" onClick={() => openWheel('new')}><Plus className="h-4 w-4" /> New wheel</button>
      </div>

      {wheel && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary !py-2" onClick={() => openOption('new')}><Plus className="h-4 w-4" /> Add an idea</button>
            <button className="btn-ghost !py-2" onClick={() => openWheel('edit')}><Pencil className="h-4 w-4" /> Rename wheel</button>
            <button className="btn-ghost !py-2" onClick={() => setConfirmReset(true)} disabled={resetting}>
              {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reset to defaults
            </button>
            <button className="btn-ghost !py-2 text-red-600" onClick={() => setDelWheel(true)} disabled={wheels.length < 2} title={wheels.length < 2 ? 'Keep at least one wheel' : undefined}>
              <Trash2 className="h-4 w-4" /> Delete wheel
            </button>
            <span className="ml-auto text-xs text-stone-500" aria-live="polite">{enabledCount} of {mine.length} switched on</span>
          </div>

          {mine.length === 0 && <p className="text-sm text-stone-500">This wheel is empty. Add an idea, or reset it to the original options.</p>}

          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.category} className="card p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="h-display text-lg">{g.category}</h3>
                  <div className="flex gap-1 text-xs">
                    <button className="rounded-full px-3 py-1 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => setCategory(g.items, true)}>All on</button>
                    <button className="rounded-full px-3 py-1 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => setCategory(g.items, false)}>All off</button>
                  </div>
                </div>
                <ul className="divide-y divide-blush-100 dark:divide-white/10">
                  {g.items.map((o) => (
                    <li key={o.id} className="flex items-center gap-3 py-2">
                      <Switch checked={o.enabled} onChange={(v) => toggle(o, v)} label={`${o.enabled ? 'Switch off' : 'Switch on'}: ${o.label}`} />
                      <span className="text-xl" aria-hidden>{o.emoji}</span>
                      <span className={`min-w-0 flex-1 text-sm ${o.enabled ? '' : 'text-stone-400 line-through'}`}>{o.label}</span>
                      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => openOption(o)} aria-label={`Edit ${o.label}`}><Pencil className="h-4 w-4" /></button>
                      <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setDelOpt(o)} aria-label={`Delete ${o.label}`}><Trash2 className="h-4 w-4" /></button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {/* option editor */}
      <Modal open={optModal !== null} onClose={() => setOptModal(null)} title={optModal === 'new' ? 'Add an idea' : 'Edit idea'}>
        <div className="space-y-3">
          <Field label="What should the wheel say?">
            <input className="input" value={form.label} maxLength={140} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Share a favorite memory" autoFocus />
          </Field>
          <div>
            <span className="label">Little icon</span>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => setForm({ ...form, emoji: em })} aria-pressed={form.emoji === em} className={`h-9 w-9 rounded-full text-lg transition ${form.emoji === em ? 'bg-blush-200 ring-2 ring-blush-500' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`}>{em}</button>
              ))}
              <input className="input !w-20 text-center" value={form.emoji} maxLength={8} onChange={(e) => setForm({ ...form, emoji: e.target.value })} aria-label="Custom emoji" />
            </div>
          </div>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={NEW_CATEGORY}>＋ New category…</option>
            </select>
          </Field>
          {form.category === NEW_CATEGORY && (
            <Field label="New category name"><input className="input" value={form.newCategory} maxLength={60} onChange={(e) => setForm({ ...form, newCategory: e.target.value })} placeholder="Cozy nights in" /></Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setOptModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={saveOption} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          </div>
        </div>
      </Modal>

      {/* wheel editor */}
      <Modal open={wheelModal !== null} onClose={() => setWheelModal(null)} title={wheelModal === 'new' ? 'New wheel' : 'Rename wheel'}>
        <div className="space-y-3">
          <Field label="Name"><input className="input" value={wForm.name} maxLength={60} onChange={(e) => setWForm({ ...wForm, name: e.target.value })} placeholder="Cozy night in" autoFocus /></Field>
          <div>
            <span className="label">Icon</span>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.slice(0, 12).map((em) => (
                <button key={em} type="button" onClick={() => setWForm({ ...wForm, emoji: em })} aria-pressed={wForm.emoji === em} className={`h-9 w-9 rounded-full text-lg ${wForm.emoji === em ? 'bg-blush-200 ring-2 ring-blush-500' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`}>{em}</button>
              ))}
            </div>
          </div>
          {wheelModal === 'new' && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-blush-500" checked={wForm.defaults} onChange={(e) => setWForm({ ...wForm, defaults: e.target.checked })} />
              Start with the original ideas (you can change them all)
            </label>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={() => setWheelModal(null)}>Cancel</button>
            <button className="btn-primary" onClick={saveWheel} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} {wheelModal === 'new' ? 'Create' : 'Save'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(delOpt)} title="Remove this idea?" message={`“${delOpt?.label}” will be removed from the wheel for both of you. (Past results stay in Our Little Moments.)`} onCancel={() => setDelOpt(null)} onConfirm={() => { if (delOpt) return removeOption(delOpt) }} />
      <ConfirmDialog open={delWheel} title={`Delete “${wheel?.name}”?`} message="This wheel and all of its ideas will be deleted for both of you. Past results stay in Our Little Moments." onCancel={() => setDelWheel(false)} onConfirm={removeWheel} />
      <ConfirmDialog open={confirmReset} title="Reset to the original options?" message={`“${wheel?.name}” will go back to the original 19 ideas. Any ideas you added or edited on this wheel will be replaced. Your history is not affected.`} confirmLabel="Reset" onCancel={() => setConfirmReset(false)} onConfirm={resetWheel} />
    </div>
  )
}

/** Stand-alone version for the admin dashboard (loads its own live data). */
export function WheelAdminPanel() {
  const data = useWheelData()
  const [wheelId, setWheelId] = useState<string | null>(null)
  const effective = wheelId && data.wheels.some((w) => w.id === wheelId) ? wheelId : data.wheels[0]?.id ?? null
  if (data.loading) return <Spinner />
  if (data.error) return <ErrorBox message={`${data.error} — have you run supabase/migrations/002_love_wheel.sql?`} />
  return <WheelManager wheels={data.wheels} options={data.options} wheelId={effective} onSelect={setWheelId} reloadOptions={data.reloadOptions} />
}
