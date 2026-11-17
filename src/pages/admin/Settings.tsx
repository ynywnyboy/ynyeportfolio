import { useEffect, useRef, useState } from 'react'
import { Loader2, ImagePlus, Camera, Palette, LogOut, Mail, Shield, User } from 'lucide-react'
import { useSite } from '../../context/SiteContext'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ConflictError, errMsg, updateRow } from '../../lib/data'
import { supabase } from '../../lib/supabase'
import { publicUrl, removeFiles, uploadFile, validateFile } from '../../lib/storage'
import { toLocalInput } from '../../lib/time'
import type { Settings } from '../../lib/types'
import { Field, Spinner } from '../../components/ui'
import { OpeningSelector } from '../../components/OpeningSelector'
import { CustomizeWorld } from '../../components/CustomizeWorld'

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-stone-800 dark:text-stone-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function useSettingsSave() {
  const { settings } = useSite()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const save = async (patch: Partial<Settings>, msg = 'Saved 💕') => {
    if (!settings) return false
    setSaving(true)
    try {
      await updateRow<Settings>('settings', 'id', settings.id, settings.version, patch)
      toast(msg)
      return true
    } catch (e) {
      toast(e instanceof ConflictError ? e.message : errMsg(e), 'error')
      return false
    } finally { setSaving(false) }
  }
  return { settings, saving, save }
}

export function RelationshipSettings() {
  const { settings, saving, save } = useSettingsSave()
  const toast = useToast()
  const [form, setForm] = useState({ name_one: '', name_two: '', anniversary: '', welcome_message: '', is_public: false })
  const [uploadingHero, setUploadingHero] = useState(false)
  const [ready, setReady] = useState(false)

  // ID editor state
  const [idState, setIdState] = useState({ idCardPath: '' as string | null, lanyardColor: '#8b5cf6', swingIntensity: 1.0, restingRotation: 0, uploadingId: false })
  const idFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (settings && !ready) {
      setForm({ name_one: settings.name_one, name_two: settings.name_two, anniversary: toLocalInput(settings.anniversary), welcome_message: settings.welcome_message, is_public: settings.is_public })
      const t = (settings.theme ?? {}) as Record<string, unknown>
      setIdState(s => ({
        ...s,
        idCardPath: (t.id_card_path as string | null | undefined) ?? null,
        lanyardColor: (t.lanyard_color as string | undefined) ?? s.lanyardColor,
        swingIntensity: (t.swing_intensity as number | undefined) ?? s.swingIntensity,
        restingRotation: (t.resting_rotation as number | undefined) ?? s.restingRotation,
      }))
      setReady(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  if (!settings) return <Spinner />

  const submit = () => {
    if (!form.name_one.trim() || !form.name_two.trim()) return toast('Both names are required.', 'error')
    if (!form.anniversary) return toast('Choose your anniversary date.', 'error')
    const d = new Date(form.anniversary)
    if (d.getTime() > Date.now()) return toast('Your anniversary should be today or in the past.', 'error')
    save({ name_one: form.name_one.trim(), name_two: form.name_two.trim(), anniversary: d.toISOString(), welcome_message: form.welcome_message, is_public: form.is_public })
  }

  const uploadHero = async (file?: File) => {
    if (!file) return
    const bad = validateFile(file, ['image'])
    if (bad) return toast(bad, 'error')
    setUploadingHero(true)
    try {
      const path = await uploadFile(file, 'featured')
      const old = settings.featured_photo_path
      const ok = await save({ featured_photo_path: path }, 'Featured photo updated')
      if (!ok) removeFiles([path]).catch(() => {})
      else if (old) removeFiles([old]).catch(() => {})
    } catch (e) { toast(errMsg(e), 'error') } finally { setUploadingHero(false) }
  }

  const uploadIdCard = async (file?: File) => {
    if (!file) return
    const bad = validateFile(file, ['image'])
    if (bad) return toast(bad, 'error')
    setIdState(s => ({ ...s, uploadingId: true }))
    try {
      const path = await uploadFile(file, 'id-card')
      const oldPath = (settings.theme as Record<string, unknown>)?.id_card_path as string | null | undefined
      const nextTheme = { ...(settings.theme ?? {}), id_card_path: path, lanyard_color: idState.lanyardColor, swing_intensity: idState.swingIntensity, resting_rotation: idState.restingRotation }
      const ok = await save({ theme: nextTheme }, 'ID card updated')
      if (ok) {
        setIdState(s => ({ ...s, idCardPath: path }))
        if (oldPath) removeFiles([oldPath]).catch(() => {})
      }
    } catch (e) { toast(errMsg(e), 'error') } finally { setIdState(s => ({ ...s, uploadingId: false })) }
  }

  const updateIdField = async <K extends keyof typeof idState>(key: K, value: (typeof idState)[K]) => {
    setIdState(s => ({ ...s, [key]: value }))
    // Defer theme save until upload or explicit save
  }

  const saveIdSettings = async () => {
    const nextTheme = { ...(settings.theme ?? {}), lanyard_color: idState.lanyardColor, swing_intensity: idState.swingIntensity, resting_rotation: idState.restingRotation }
    if (idState.idCardPath !== ((settings.theme as Record<string, unknown>)?.id_card_path as string | null)) {
      nextTheme.id_card_path = idState.idCardPath as string | null
    }
    await save({ theme: nextTheme }, 'Badge settings saved')
  }

  return (
    <div className="space-y-6">
      <Panel title="Relationship settings">
        <div className="card max-w-2xl space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Her / his name"><input className="input" value={form.name_one} maxLength={40} onChange={(e) => setForm({ ...form, name_one: e.target.value })} /></Field>
            <Field label="Their name"><input className="input" value={form.name_two} maxLength={40} onChange={(e) => setForm({ ...form, name_two: e.target.value })} /></Field>
          </div>
          <Field label="Official anniversary" hint="The home page counter counts up from this moment"><input type="datetime-local" className="input" value={form.anniversary} onChange={(e) => setForm({ ...form, anniversary: e.target.value })} /></Field>
          <Field label="Welcome message"><textarea className="input min-h-24" value={form.welcome_message} maxLength={400} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} /></Field>
          <div>
            <span className="label">Featured couple photo</span>
            <div className="flex items-center gap-3">
              {settings.featured_photo_path && <img src={publicUrl(settings.featured_photo_path)} alt="" className="h-20 w-16 rounded-2xl object-cover" />}
              <label className="btn-ghost cursor-pointer">
                {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Choose photo
                <input type="file" accept="image/*" hidden onChange={(e) => { uploadHero(e.target.files?.[0]); e.target.value = '' }} />
              </label>
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl bg-blush-50/80 p-4 text-sm dark:bg-white/5">
            <input type="checkbox" className="mt-1 accent-blush-500" checked={form.is_public} onChange={(e) => setForm({ ...form, is_public: e.target.checked })} />
            <span>
              <strong>Let visitors view the site (read-only)</strong>
              <br />When off, the website shows nothing to people who aren't signed in. Letters are never public. Visitors can never edit anything.
            </span>
          </label>
          <div className="flex justify-end"><button className="btn-primary" onClick={submit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save settings</button></div>
        </div>
      </Panel>

      {/* ─── Ragdoll ID Editor ───────────────────────────── */}
      <Panel title="Ragdoll ID Badge" subtitle="Upload a photo for the hanging ID badge on the homepage. It swings with real physics.">
        <div className="card max-w-2xl space-y-5 p-6">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-blush-500" />
            <h3 className="font-display text-base font-semibold text-stone-800 dark:text-stone-100">ID Card Image</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-24 w-20 overflow-hidden rounded-xl border border-stone-200 dark:border-white/10 bg-white flex items-center justify-center">
              {idState.idCardPath ? (
                <img src={publicUrl(idState.idCardPath)} alt="ID preview" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-8 w-8 text-stone-300 dark:text-stone-600" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="btn-ghost cursor-pointer text-sm">
                {idState.uploadingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {idState.idCardPath ? 'Replace photo' : 'Upload photo'}
                <input ref={idFileRef} type="file" accept="image/*" hidden onChange={(e) => { uploadIdCard(e.target.files?.[0]); e.target.value = '' }} />
              </label>
              {idState.idCardPath && (
                <button className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 underline" onClick={() => {
                  const prev = idState.idCardPath
                  setIdState(s => ({ ...s, idCardPath: null }))
                  save({ theme: { ...(settings.theme ?? {}), id_card_path: null as any, lanyard_color: idState.lanyardColor, swing_intensity: idState.swingIntensity, resting_rotation: idState.restingRotation } }).then(ok => { if (!ok) setIdState(s => ({ ...s, idCardPath: prev })) })
                }}>Remove photo</button>
              )}
            </div>
          </div>

          <div>
            <span className="label">Lanyard Color</span>
            <div className="flex items-center gap-3 flex-wrap mt-2">
              {[
                { color: '#8b5cf6', label: 'Purple' },
                { color: '#ec4899', label: 'Pink' },
                { color: '#3b82f6', label: 'Blue' },
                { color: '#10b981', label: 'Green' },
                { color: '#f59e0b', label: 'Amber' },
                { color: '#ef4444', label: 'Red' },
              ].map(({ color, label }) => (
                <button key={color} className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${idState.lanyardColor === color ? 'border-stone-800 dark:border-white shadow-md' : 'border-transparent'}`} style={{ backgroundColor: color }} title={label} onClick={() => updateIdField('lanyardColor', color)} />
              ))}
              <input type="color" value={idState.lanyardColor} onChange={(e) => updateIdField('lanyardColor', e.target.value)} className="h-8 w-10 rounded cursor-pointer border-0 p-0" />
              <span className="text-xs text-stone-500 font-mono">{idState.lanyardColor}</span>
            </div>
          </div>

          <div>
            <span className="label">Swing Intensity: {idState.swingIntensity.toFixed(1)}</span>
            <input type="range" min="0.2" max="2" step="0.1" value={idState.swingIntensity} onChange={(e) => updateIdField('swingIntensity', parseFloat(e.target.value))} className="w-full accent-blush-500" />
          </div>

          <div>
            <span className="label">Resting Rotation: {idState.restingRotation}°</span>
            <input type="range" min="-30" max="30" step="1" value={idState.restingRotation} onChange={(e) => updateIdField('restingRotation', parseInt(e.target.value))} className="w-full accent-blush-500" />
          </div>

          <div className="flex justify-end">
            <button className="btn-primary" onClick={saveIdSettings} disabled={saving}>Save badge settings</button>
          </div>
        </div>
      </Panel>
    </div>
  )
}

// ─── Theme Settings ───────────────────────────────────────────────

export function ThemeSettings() {
  const { settings, saving, save } = useSettingsSave()
  const { appearance } = useSite()
  const toast = useToast()

  if (!settings) return <Spinner />

  return (
    <div className="card max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-blush-500" />
        <h3 className="font-display text-base font-semibold text-stone-800 dark:text-stone-100">Theme</h3>
      </div>

      <div>
        <span className="label">Accent Color</span>
        <div className="flex items-center gap-3 flex-wrap mt-2">
          {['#e8899f', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'].map((color) => (
            <button key={color} className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${settings.theme.accent === color ? 'border-stone-800 dark:border-white shadow-md' : 'border-transparent'}`} style={{ backgroundColor: color }} title={color} onClick={() => save({ theme: { ...settings.theme, accent: color } })} />
          ))}
          <input type="color" value={settings.theme.accent} onChange={(e) => save({ theme: { ...settings.theme, accent: e.target.value } })} className="h-8 w-10 rounded cursor-pointer border-0 p-0" />
          <span className="text-xs text-stone-500 font-mono">{settings.theme.accent}</span>
        </div>
      </div>

      <div>
        <span className="label">Color Mode</span>
        <div className="flex gap-2 mt-2">
          {['light', 'dark', 'system'].map((mode) => (
            <button key={mode} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${settings.theme.mode === mode ? 'bg-stone-900 text-white shadow' : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20'}`} onClick={() => save({ theme: { ...settings.theme, mode: mode as 'light' | 'dark' | 'system' } })}>{mode}</button>
          ))}
        </div>
      </div>

      <div>
        <label className="flex items-center gap-3 rounded-2xl bg-blush-50/80 p-4 text-sm dark:bg-white/5 cursor-pointer">
          <input type="checkbox" className="mt-1 accent-blush-500" checked={settings.theme.particles} onChange={(e) => save({ theme: { ...settings.theme, particles: e.target.checked } })} />
          <span>Enable background particles</span>
        </label>
      </div>

      <CustomizeWorld edit />

      {/* ─── Opening Animation ─────────────────────────────── */}
      <OpeningSelector />
    </div>
  )
}

// ─── Account Settings ─────────────────────────────────────────────

export function AccountSettings() {
  const { settings } = useSite()
  const { member, signOut } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  if (!settings) return <Spinner />

  const handleReset = async () => {
    if (!email.trim()) return toast('Enter your email.', 'error')
    setSending(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      if (error) throw error
      toast('Reset link sent!')
    } catch (e) { toast(errMsg(e), 'error') }
    finally { setSending(false) }
  }

  return (
    <div className="card max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-blush-500" />
        <h3 className="font-display text-base font-semibold text-stone-800 dark:text-stone-100">Account</h3>
      </div>

      <div className="rounded-2xl bg-white/80 dark:bg-white/5 p-4 space-y-3 border border-white/20 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blush-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
            {member?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-stone-800 dark:text-stone-100">{member?.email || 'Unknown'}</p>
            <p className="text-xs text-stone-500">Signed in as admin</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/20 dark:border-white/10 p-4 space-y-3 bg-white/80 dark:bg-white/5">
        <p className="text-sm text-stone-600 dark:text-stone-400">Need to change your password? Enter your email and we'll send a reset link.</p>
        <div className="flex gap-2">
          <input type="email" className="input flex-1" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary" onClick={handleReset} disabled={sending || !email.trim()}>{sending && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link</button>
        </div>
      </div>

      <div className="rounded-2xl border border-blush-200/60 dark:border-blush-500/20 bg-blush-50/80 dark:bg-blush-900/20 p-4 space-y-2">
        <p className="font-medium text-stone-800 dark:text-stone-100">Danger zone</p>
        <p className="text-sm text-stone-600 dark:text-stone-400">Signing out will end your session. You'll need to sign in again to access the admin panel.</p>
        <button className="btn-ghost text-blush-600 dark:text-blush-400 hover:bg-blush-100/50 dark:hover:bg-blush-900/30" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </button>
      </div>
    </div>
  )
}

// Re-export for backwards compat
export { RelationshipSettings as default } from './Settings'
