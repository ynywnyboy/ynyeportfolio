import { useEffect, useState, type FormEvent } from 'react'
import { Loader2, Plus, Trash2, Camera } from 'lucide-react'
import type { Bio } from '../lib/types'
import { ConflictError, errMsg, updateRow } from '../lib/data'
import { publicUrl, removeFiles, uploadFile, validateFile } from '../lib/storage'
import { useToast } from '../context/ToastContext'
import { Field } from './ui'

/** Edits one biography. Uses optimistic locking so simultaneous edits can't silently overwrite each other. */
export function BioEditor({ bio, onDone }: { bio: Bio; onDone?: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState(() => toForm(bio))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [staleVersion, setStaleVersion] = useState(false)

  // If the other person saved while we were editing, flag it (don't clobber typing)
  useEffect(() => { if (bio.version !== form.version) setStaleVersion(true) }, [bio.version])

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return
    const bad = validateFile(file, ['image'])
    if (bad) return setError(bad)
    setUploading(true)
    setError(null)
    try {
      const path = await uploadFile(file, 'avatars')
      const old = form.avatar_path
      const saved = await updateRow<Bio>('bios', 'slot', bio.slot, form.version, { avatar_path: path })
      setForm((f) => ({ ...f, avatar_path: path, version: saved.version }))
      if (old) removeFiles([old]).catch(() => {})
      toast('Profile picture updated')
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.nickname.trim().length === 0 && form.full_name.trim().length === 0) {
      return setError('Please add a name or nickname.')
    }
    setSaving(true)
    try {
      const saved = await updateRow<Bio>('bios', 'slot', bio.slot, form.version, {
        nickname: form.nickname.trim(),
        full_name: form.full_name.trim(),
        birthday: form.birthday || null,
        bio: form.bio,
        personality: form.personality,
        hobbies: form.hobbies.split(',').map((s) => s.trim()).filter(Boolean),
        favorite_music: form.favorite_music,
        favorite_food: form.favorite_food,
        favorite_memories: form.favorite_memories,
        custom_fields: form.custom_fields.filter((c) => c.label.trim()),
      })
      setForm(toForm(saved))
      setStaleVersion(false)
      toast('Biography saved 💕')
      onDone?.()
    } catch (err) {
      if (err instanceof ConflictError) {
        setStaleVersion(true)
        setError(err.message)
      } else setError(errMsg(err))
    } finally {
      setSaving(false)
    }
  }

  const loadLatest = () => { setForm(toForm(bio)); setStaleVersion(false); setError(null) }

  return (
    <form onSubmit={submit} className="space-y-4">
      {staleVersion && (
        <div className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="alert">
          This biography was updated elsewhere.{' '}
          <button type="button" className="font-medium underline" onClick={loadLatest}>Load the latest version</button> (your unsaved changes here will be replaced).
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-blush-100">
          {form.avatar_path ? <img src={publicUrl(form.avatar_path)} alt="Profile" className="h-full w-full object-cover" /> : null}
          {uploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-5 w-5 animate-spin" /></div>}
        </div>
        <label className="btn-ghost cursor-pointer">
          <Camera className="h-4 w-4" /> Change photo
          <input type="file" accept="image/*" hidden onChange={(e) => { pickAvatar(e.target.files?.[0]); e.target.value = '' }} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nickname"><input className="input" value={form.nickname} onChange={(e) => set('nickname', e.target.value)} maxLength={40} /></Field>
        <Field label="Full name"><input className="input" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} maxLength={80} /></Field>
        <Field label="Birthday"><input className="input" type="date" value={form.birthday} onChange={(e) => set('birthday', e.target.value)} /></Field>
        <Field label="Hobbies & interests" hint="Separate with commas"><input className="input" value={form.hobbies} onChange={(e) => set('hobbies', e.target.value)} /></Field>
        <Field label="Favorite music"><input className="input" value={form.favorite_music} onChange={(e) => set('favorite_music', e.target.value)} /></Field>
        <Field label="Favorite food"><input className="input" value={form.favorite_food} onChange={(e) => set('favorite_food', e.target.value)} /></Field>
      </div>
      <Field label="About me"><textarea className="input min-h-28" value={form.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
      <Field label="Personality"><textarea className="input min-h-20" value={form.personality} onChange={(e) => set('personality', e.target.value)} /></Field>
      <Field label="Favorite memories of us"><textarea className="input min-h-20" value={form.favorite_memories} onChange={(e) => set('favorite_memories', e.target.value)} /></Field>

      <div>
        <span className="label">Custom fields</span>
        <div className="space-y-2">
          {form.custom_fields.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className="input" placeholder="Label (e.g. Love language)" value={c.label} onChange={(e) => set('custom_fields', form.custom_fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
              <input className="input" placeholder="Value" value={c.value} onChange={(e) => set('custom_fields', form.custom_fields.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
              <button type="button" className="rounded-full p-2 text-stone-400 hover:bg-red-50 hover:text-red-500" onClick={() => set('custom_fields', form.custom_fields.filter((_, j) => j !== i))} aria-label="Remove field">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="btn-ghost mt-2 !py-1.5" onClick={() => set('custom_fields', [...form.custom_fields, { label: '', value: '' }])}>
          <Plus className="h-4 w-4" /> Add field
        </button>
      </div>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex justify-end">
        <button className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save biography</button>
      </div>
    </form>
  )
}

function toForm(b: Bio) {
  return {
    nickname: b.nickname,
    full_name: b.full_name,
    birthday: b.birthday ?? '',
    bio: b.bio,
    personality: b.personality,
    hobbies: b.hobbies.join(', '),
    favorite_music: b.favorite_music,
    favorite_food: b.favorite_food,
    favorite_memories: b.favorite_memories,
    custom_fields: b.custom_fields ?? [],
    avatar_path: b.avatar_path,
    version: b.version,
  }
}
