import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, Film, FolderPlus, Loader2, Pencil, Replace, Trash2, UploadCloud, X } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ConflictError, deleteRow, errMsg, insertRow, updateRow } from '../lib/data'
import { canDisplayImage, kindOf, mimeOf, publicUrl, removeFiles, uploadFile } from '../lib/storage'
import type { Album, Media } from '../lib/types'
import { ConfirmDialog, Dropzone, Field, Modal, SafeImage } from './ui'
import { Lightbox } from './Lightbox'
import { VideoThumb } from './VideoThumb'

const toDay = (ms: number) => new Date(ms).toISOString().slice(0, 10)

interface Staged {
  id: string
  file: File
  url: string
  kind: 'image' | 'video'
  caption: string
  takenAt: string
  status: 'ready' | 'uploading' | 'done' | 'error' | 'failed'
  error?: string
}

/** Upload, edit, replace and delete photos & videos. Used on /memories and in the dashboard. */
export function MemoryManager() {
  const { media, albums } = useSite()
  const { user } = useAuth()
  const toast = useToast()
  const [uploadAlbum, setUploadAlbum] = useState('')
  const [staged, setStaged] = useState<Staged[]>([])
  const [uploading, setUploading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [editing, setEditing] = useState<Media | null>(null)
  const [deleting, setDeleting] = useState<Media | null>(null)
  const [replacing, setReplacing] = useState<string | null>(null)
  const [view, setView] = useState<number | null>(null)
  const urls = useRef<string[]>([])

  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)) }, [])

  /** Show previews the instant files are chosen — nothing is uploaded until "Upload" is pressed. */
  const stage = async (files: File[]) => {
    setChecking(true)
    const items: Staged[] = []
    for (const file of files) {
      const kind = kindOf(file)
      if (kind !== 'image' && kind !== 'video') continue
      const url = URL.createObjectURL(file)
      urls.current.push(url)
      let status: Staged['status'] = 'ready'
      let error: string | undefined
      if (kind === 'image' && !(await canDisplayImage(url))) {
        status = 'error'
        error = 'This browser can’t display this photo format (iPhone HEIC?). Export or share it as JPEG and try again.'
      }
      items.push({ id: crypto.randomUUID(), file, url, kind, caption: '', takenAt: toDay(file.lastModified || Date.now()), status, error })
    }
    setStaged((cur) => [...cur, ...items])
    setChecking(false)
  }

  const patchStaged = (id: string, patch: Partial<Staged>) => setStaged((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const dropStaged = (id: string) => setStaged((cur) => {
    const hit = cur.find((x) => x.id === id)
    if (hit) { URL.revokeObjectURL(hit.url); urls.current = urls.current.filter((u) => u !== hit.url) }
    return cur.filter((x) => x.id !== id)
  })

  const uploadAll = async () => {
    const todo = staged.filter((x) => x.status === 'ready' || x.status === 'failed')
    if (!todo.length) return
    setUploading(true)
    let ok = 0
    for (const item of todo) {
      patchStaged(item.id, { status: 'uploading', error: undefined })
      let path: string | null = null
      try {
        path = await uploadFile(item.file, 'media')
        await insertRow<Media>('media', {
          album_id: uploadAlbum || null,
          kind: item.kind,
          storage_path: path,
          caption: item.caption.trim(),
          taken_at: item.takenAt || toDay(Date.now()),
          mime_type: mimeOf(item.file) || null,
          size_bytes: item.file.size,
          uploaded_by: user?.id,
        })
        ok++
        patchStaged(item.id, { status: 'done' })
        setTimeout(() => dropStaged(item.id), 900)
      } catch (e) {
        if (path) removeFiles([path]).catch(() => {})
        patchStaged(item.id, { status: 'failed', error: errMsg(e) })
        toast(`${item.file.name}: ${errMsg(e)}`, 'error')
      }
    }
    setUploading(false)
    if (ok) toast(`${ok} memor${ok === 1 ? 'y' : 'ies'} saved to the cloud ☁️`)
  }

  const replaceFile = async (m: Media, file: File) => {
    const kind = kindOf(file)
    if (kind !== 'image' && kind !== 'video') return toast('Please choose a photo or video.', 'error')
    setReplacing(m.id)
    let path: string | null = null
    try {
      path = await uploadFile(file, 'media')
      await updateRow<Media>('media', 'id', m.id, m.version, { storage_path: path, kind, mime_type: mimeOf(file) || null, size_bytes: file.size })
      removeFiles([m.storage_path]).catch(() => {})
      toast('Memory replaced')
    } catch (e) {
      if (path) removeFiles([path]).catch(() => {})
      toast(e instanceof ConflictError ? e.message : errMsg(e), 'error')
    } finally {
      setReplacing(null)
    }
  }

  const remove = async (m: Media) => {
    try {
      await deleteRow('media', 'id', m.id)
      await removeFiles([m.storage_path]).catch(() => {})
      toast('Memory deleted')
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setDeleting(null)
    }
  }

  const sorted = useMemo(() => [...media].sort((a, b) => b.taken_at.localeCompare(a.taken_at)), [media])
  const readyCount = staged.filter((x) => x.status === 'ready' || x.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Field label="Upload into album">
              <select className="input" value={uploadAlbum} onChange={(e) => setUploadAlbum(e.target.value)}>
                <option value="">No album</option>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </div>
        </div>
        <Dropzone accept="image/*,video/*,.heic,.heif" kinds={['image', 'video']} busy={checking} onFiles={stage} label="Drag photos & videos here, or click to choose" />

        {staged.length > 0 && (
          <div className="space-y-3" aria-live="polite">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Preview — {staged.length} file{staged.length === 1 ? '' : 's'} selected. Add captions if you like, then upload.
            </p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {staged.map((x) => (
                <li key={x.id} className="relative overflow-hidden rounded-2xl bg-white/80 p-1.5 shadow-soft dark:bg-night-800/80">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-blush-100">
                    {x.kind === 'image' && x.status !== 'error' ? (
                      <img src={x.url} alt={x.file.name} className="h-full w-full object-cover" />
                    ) : x.kind === 'video' ? (
                      <video src={`${x.url}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-2 text-center text-[0.7rem] text-red-600">{x.error}</div>
                    )}
                    {x.kind === 'video' && <Film className="absolute right-2 top-2 h-4 w-4 text-white drop-shadow" />}
                    {x.status === 'uploading' && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin text-blush-500" /></div>}
                    {x.status === 'done' && <div className="absolute inset-0 flex items-center justify-center bg-emerald-100/80 text-emerald-600"><Check className="h-8 w-8" /></div>}
                    {x.status !== 'uploading' && x.status !== 'done' && (
                      <button className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white" onClick={() => dropStaged(x.id)} aria-label={`Remove ${x.file.name}`}><X className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                  <input className="input mt-1.5 !rounded-xl !px-2.5 !py-1.5 !text-xs" placeholder="Caption (optional)" value={x.caption} maxLength={120} disabled={x.status === 'uploading' || x.status === 'done'} onChange={(e) => patchStaged(x.id, { caption: e.target.value })} aria-label={`Caption for ${x.file.name}`} />
                  <input type="date" className="input mt-1 !rounded-xl !px-2.5 !py-1.5 !text-xs" value={x.takenAt} disabled={x.status === 'uploading' || x.status === 'done'} onChange={(e) => patchStaged(x.id, { takenAt: e.target.value })} aria-label={`Date for ${x.file.name}`} />
                  {x.status === 'failed' && x.error && <p className="mt-1 text-[0.7rem] text-red-600">Upload failed — {x.error} (press Upload to retry)</p>}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-ghost" disabled={uploading} onClick={() => staged.forEach((x) => dropStaged(x.id))}>Clear selection</button>
              <button className="btn-primary" disabled={uploading || readyCount === 0} onClick={uploadAll}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Upload {readyCount || ''} {readyCount === 1 ? 'memory' : 'memories'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((m, i) => (
          <li key={m.id} className="card group relative overflow-hidden">
            <button className="relative block aspect-square w-full bg-blush-100 dark:bg-white/10" onClick={() => setView(i)} aria-label={`Open ${m.caption || 'memory'}`}>
              {m.kind === 'video' ? (
                <VideoThumb src={publicUrl(m.storage_path)} className="h-full !rounded-none" />
              ) : (
                <SafeImage src={publicUrl(m.storage_path)} alt={m.caption || 'Memory'} className="h-full w-full" />
              )}
              {replacing === m.id && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="h-6 w-6 animate-spin" /></div>}
            </button>
            <div className="p-2 text-xs">
              <p className="truncate font-medium">{m.caption || 'No caption'}</p>
              <p className="truncate text-stone-500">{albums.find((a) => a.id === m.album_id)?.name ?? 'No album'} · {m.taken_at}</p>
              <div className="mt-2 flex gap-1">
                <button className="rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => setEditing(m)} aria-label="Edit details"><Pencil className="h-3.5 w-3.5" /></button>
                <label className="cursor-pointer rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10" aria-label="Replace file">
                  <Replace className="h-3.5 w-3.5" />
                  <input type="file" hidden accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) replaceFile(m, f); e.target.value = '' }} />
                </label>
                <button className="ml-auto rounded-full p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setDeleting(m)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {!sorted.length && <p className="text-center text-sm text-stone-500">No memories yet — upload your first one above.</p>}

      {view !== null && (
        <Lightbox items={sorted} index={Math.min(view, sorted.length - 1)} onIndex={setView} onClose={() => setView(null)} albumName={(m) => albums.find((a) => a.id === m.album_id)?.name} />
      )}
      <MediaEditModal media={editing} albums={albums} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this memory?"
        message="This permanently removes the file from cloud storage for both of you. This can’t be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={() => { if (deleting) return remove(deleting) }}
      />
    </div>
  )
}

function MediaEditModal({ media, albums, onClose }: { media: Media | null; albums: Album[]; onClose: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState({ caption: '', description: '', taken_at: '', album_id: '' })
  const [saving, setSaving] = useState(false)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  if (media && loadedId !== media.id) {
    setLoadedId(media.id)
    setForm({ caption: media.caption, description: media.description, taken_at: media.taken_at, album_id: media.album_id ?? '' })
  }
  const save = async () => {
    if (!media) return
    if (!form.taken_at) return toast('Please choose a date.', 'error')
    setSaving(true)
    try {
      await updateRow<Media>('media', 'id', media.id, media.version, {
        caption: form.caption.trim(), description: form.description, taken_at: form.taken_at, album_id: form.album_id || null,
      })
      toast('Saved')
      onClose()
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal open={Boolean(media)} onClose={onClose} title="Memory details">
      <div className="space-y-3">
        <Field label="Caption"><input className="input" value={form.caption} maxLength={120} onChange={(e) => setForm({ ...form, caption: e.target.value })} /></Field>
        <Field label="Description"><textarea className="input min-h-24" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date of memory"><input type="date" className="input" value={form.taken_at} onChange={(e) => setForm({ ...form, taken_at: e.target.value })} /></Field>
          <Field label="Album">
            <select className="input" value={form.album_id} onChange={(e) => setForm({ ...form, album_id: e.target.value })}>
              <option value="">No album</option>
              {albums.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
        </div>
      </div>
    </Modal>
  )
}

/** Create / rename / delete albums. */
export function AlbumManager() {
  const { albums, media, settings } = useSite()
  const { user } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState<Album | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Album | null>(null)
  const [form, setForm] = useState({ name: '', description: '', category: '', exclude_from_random: false })
  const [saving, setSaving] = useState(false)

  const open = (a: Album | 'new') => {
    setEditing(a)
    setForm(a === 'new' ? { name: '', description: '', category: '', exclude_from_random: false } : { name: a.name, description: a.description, category: a.category, exclude_from_random: a.exclude_from_random })
  }

  const save = async () => {
    if (!form.name.trim()) return toast('Give the album a name.', 'error')
    setSaving(true)
    try {
      if (editing === 'new') await insertRow<Album>('albums', { ...form, name: form.name.trim(), created_by: user?.id })
      else if (editing) await updateRow<Album>('albums', 'id', editing.id, editing.version, { ...form, name: form.name.trim() })
      toast('Album saved')
      setEditing(null)
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  void settings

  return (
    <div className="space-y-4">
      <button className="btn-primary" onClick={() => open('new')}><FolderPlus className="h-4 w-4" /> New album</button>
      <ul className="grid gap-3 sm:grid-cols-2">
        {albums.map((a) => (
          <li key={a.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-display text-lg">{a.name}</p>
              <p className="text-xs text-stone-500">
                {media.filter((m) => m.album_id === a.id).length} memories{a.category ? ` · ${a.category}` : ''}{a.exclude_from_random ? ' · hidden from Take Me Back' : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <button className="rounded-full p-2 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => open(a)} aria-label={`Edit ${a.name}`}><Pencil className="h-4 w-4" /></button>
              <button className="rounded-full p-2 text-red-500 hover:bg-red-50" onClick={() => setDeleting(a)} aria-label={`Delete ${a.name}`}><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      {!albums.length && <p className="text-sm text-stone-500">No albums yet.</p>}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? 'New album' : 'Edit album'}>
        <div className="space-y-3">
          <Field label="Name"><input className="input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Category" hint="Used for filtering, e.g. Trips, Dates, Celebrations"><input className="input" value={form.category} maxLength={40} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-blush-500" checked={form.exclude_from_random} onChange={(e) => setForm({ ...form, exclude_from_random: e.target.checked })} />
            Exclude this album from “Take Me Back”
          </label>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete “${deleting?.name}”?`}
        message="The album will be removed. Photos and videos inside it are kept and become unsorted."
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return
          try { await deleteRow('albums', 'id', deleting.id); toast('Album deleted') } catch (e) { toast(errMsg(e), 'error') }
          setDeleting(null)
        }}
      />
    </div>
  )
}
