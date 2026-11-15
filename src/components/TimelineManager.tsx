import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useTable, deleteRow, errMsg, insertRow, updateRow } from '../lib/data'
import { publicUrl, removeFiles, uploadFile } from '../lib/storage'
import type { TimelineEvent } from '../lib/types'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog, Dropzone, Field, Modal, Spinner } from './ui'

export const DECORATIONS: Record<string, string> = {
  heart: '💖', star: '⭐', flower: '🌸', ring: '💍', cake: '🎂', plane: '✈️', camera: '📸', sparkle: '✨', kiss: '💋', home: '🏡',
}

const blank = { title: '', event_date: '', description: '', decoration: 'heart', photo_paths: [] as string[], video_path: null as string | null }

function nextPosition(list: TimelineEvent[], date: string): { pos: number; renumber: boolean } {
  const idx = list.findIndex((e) => e.event_date > date)
  if (!list.length) return { pos: 0, renumber: false }
  if (idx === -1) return { pos: list[list.length - 1].position + 1000, renumber: false }
  if (idx === 0) return { pos: list[0].position - 1000, renumber: false }
  const a = list[idx - 1].position
  const b = list[idx].position
  const mid = Math.floor((a + b) / 2)
  return { pos: mid, renumber: mid <= a || mid >= b }
}

export function TimelineManager() {
  const toast = useToast()
  const { user } = useAuth()
  const { rows, loading } = useTable<TimelineEvent>('timeline_events', 'id', { orderBy: 'position' })
  const [editing, setEditing] = useState<TimelineEvent | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [newFiles, setNewFiles] = useState<string[]>([]) // uploaded in this session (cleanup on cancel)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<TimelineEvent | null>(null)

  const open = (e: TimelineEvent | 'new') => {
    setEditing(e)
    setNewFiles([])
    setForm(e === 'new' ? blank : { title: e.title, event_date: e.event_date, description: e.description, decoration: e.decoration, photo_paths: e.photo_paths, video_path: e.video_path })
  }

  const close = () => {
    removeFiles(newFiles).catch(() => {}) // discard files uploaded but never saved
    setEditing(null)
  }

  const addPhotos = async (files: File[]) => {
    setUploading(true)
    try {
      const paths: string[] = []
      for (const f of files) paths.push(await uploadFile(f, 'timeline'))
      setNewFiles((n) => [...n, ...paths])
      setForm((f) => ({ ...f, photo_paths: [...f.photo_paths, ...paths] }))
    } catch (e) { toast(errMsg(e), 'error') } finally { setUploading(false) }
  }
  const setVideo = async (files: File[]) => {
    setUploading(true)
    try {
      const p = await uploadFile(files[0], 'timeline')
      setNewFiles((n) => [...n, p])
      setForm((f) => ({ ...f, video_path: p }))
    } catch (e) { toast(errMsg(e), 'error') } finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Please add a title.', 'error')
    if (!form.event_date) return toast('Please choose a date.', 'error')
    setSaving(true)
    try {
      const patch = { title: form.title.trim(), event_date: form.event_date, description: form.description, decoration: form.decoration, photo_paths: form.photo_paths, video_path: form.video_path }
      if (editing === 'new') {
        const { pos, renumber } = nextPosition(rows, form.event_date)
        const created = await insertRow<TimelineEvent>('timeline_events', { ...patch, position: pos, created_by: user?.id })
        if (renumber) {
          const ordered = [...rows, created].sort((a, b) => a.event_date.localeCompare(b.event_date) || a.position - b.position)
          await Promise.all(ordered.map((r, i) => supabaseSetPosition(r, i * 1000)))
        }
      } else if (editing) {
        await updateRow<TimelineEvent>('timeline_events', 'id', editing.id, editing.version, patch)
        // Delete files that were removed from this entry
        const dropped = [...editing.photo_paths.filter((p) => !form.photo_paths.includes(p)), ...(editing.video_path && editing.video_path !== form.video_path ? [editing.video_path] : [])]
        removeFiles(dropped).catch(() => {})
      }
      setNewFiles([])
      setEditing(null)
      toast('Timeline saved 💕')
    } catch (e) { toast(errMsg(e), 'error') } finally { setSaving(false) }
  }

  const move = async (i: number, d: -1 | 1) => {
    const a = rows[i], b = rows[i + d]
    if (!a || !b) return
    try {
      await Promise.all([
        updateRow<TimelineEvent>('timeline_events', 'id', a.id, a.version, { position: b.position }),
        updateRow<TimelineEvent>('timeline_events', 'id', b.id, b.version, { position: a.position }),
      ])
    } catch (e) { toast(errMsg(e), 'error') }
  }

  const sortByDate = async () => {
    const ordered = [...rows].sort((a, b) => a.event_date.localeCompare(b.event_date))
    try {
      await Promise.all(ordered.map((r, i) => supabaseSetPosition(r, i * 1000)))
      toast('Sorted by date')
    } catch (e) { toast(errMsg(e), 'error') }
  }

  const remove = async (e: TimelineEvent) => {
    try {
      await deleteRow('timeline_events', 'id', e.id)
      removeFiles([...e.photo_paths, e.video_path]).catch(() => {})
      toast('Entry deleted')
    } catch (err) { toast(errMsg(err), 'error') } finally { setDeleting(null) }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add moment</button>
        {rows.length > 1 && <button className="btn-ghost" onClick={sortByDate}>Sort by date</button>}
      </div>

      <ul className="space-y-2">
        {rows.map((e, i) => (
          <li key={e.id} className="card flex items-center gap-3 p-3">
            <span className="text-2xl" aria-hidden>{DECORATIONS[e.decoration] ?? '💖'}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.title}</p>
              <p className="text-xs text-stone-500">{e.event_date} · {e.photo_paths.length} photo(s){e.video_path ? ' · video' : ''}</p>
            </div>
            <button className="rounded-full p-2 hover:bg-blush-100 disabled:opacity-30 dark:hover:bg-white/10" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
            <button className="rounded-full p-2 hover:bg-blush-100 disabled:opacity-30 dark:hover:bg-white/10" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
            <button className="rounded-full p-2 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => open(e)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
            <button className="rounded-full p-2 text-red-500 hover:bg-red-50" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      {!rows.length && <p className="text-sm text-stone-500">No moments yet. Add when you met, your first date, your first trip…</p>}

      <Modal open={Boolean(editing)} onClose={close} title={editing === 'new' ? 'Add a moment' : 'Edit moment'} wide>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title"><input className="input" value={form.title} maxLength={100} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="The day we met" /></Field>
            <Field label="Date" hint="Future dates show as upcoming events"><input type="date" className="input" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></Field>
          </div>
          <Field label="Description"><textarea className="input min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div>
            <span className="label">Decoration</span>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DECORATIONS).map(([k, v]) => (
                <button type="button" key={k} onClick={() => setForm({ ...form, decoration: k })} className={`h-10 w-10 rounded-full text-xl transition ${form.decoration === k ? 'bg-blush-200 ring-2 ring-blush-500' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`} aria-label={k} aria-pressed={form.decoration === k}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">Photos</span>
            <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {form.photo_paths.map((p) => (
                <div key={p} className="relative aspect-square overflow-hidden rounded-2xl">
                  <img src={publicUrl(p)} alt="" className="h-full w-full object-cover" />
                  <button className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white" onClick={() => setForm({ ...form, photo_paths: form.photo_paths.filter((x) => x !== p) })} aria-label="Remove photo"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <Dropzone accept="image/*" kinds={['image']} onFiles={addPhotos} busy={uploading} compact label="Add photos" />
          </div>
          <div>
            <span className="label">Video (optional)</span>
            {form.video_path ? (
              <div className="space-y-2">
                <video src={publicUrl(form.video_path)} controls className="max-h-48 rounded-2xl" />
                <button className="btn-ghost !py-1" onClick={() => setForm({ ...form, video_path: null })}>Remove video</button>
              </div>
            ) : <Dropzone accept="video/*" kinds={['video']} multiple={false} onFiles={setVideo} busy={uploading} compact label="Add a video" />}
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving || uploading}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} title="Delete this moment?" message={`“${deleting?.title}” and its photos and video will be permanently removed for both of you.`} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) return remove(deleting) }} />
    </div>
  )
}

async function supabaseSetPosition(r: TimelineEvent, position: number) {
  if (r.position === position) return
  await updateRow<TimelineEvent>('timeline_events', 'id', r.id, r.version, { position })
}
