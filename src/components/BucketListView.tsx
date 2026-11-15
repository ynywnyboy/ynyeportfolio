import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, Loader2, Pencil, Plus, Trash2, ImagePlus, X } from 'lucide-react'
import { useTable, deleteRow, errMsg, insertRow, updateRow } from '../lib/data'
import { publicUrl, removeFiles, uploadFile, validateFile } from '../lib/storage'
import { BUCKET_CATEGORIES, type BucketCategory, type BucketItem } from '../lib/types'
import { fmtDate } from '../lib/time'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ConfirmDialog, ErrorBox, Field, Modal, Spinner } from './ui'
import { Reveal } from './Reveal'

const EMOJI: Record<BucketCategory, string> = {
  Travel: '🌍', Dates: '🌹', Food: '🍜', Adventures: '🏔️', Celebrations: '🎉', 'Personal Goals': '🌱', 'Future Dreams': '🏡',
}

function AnimatedCheck({ done }: { done: boolean }) {
  return (
    <span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition ${done ? 'border-emerald-400 bg-emerald-400' : 'border-blush-300 bg-white dark:bg-transparent'}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }} transition={{ duration: 0.45, ease: 'easeOut' }} />
      </svg>
    </span>
  )
}

const blank = { title: '', description: '', category: 'Adventures' as BucketCategory, target_date: '', cover_path: null as string | null }

export function BucketListView({ editable }: { editable?: boolean }) {
  const { rows, loading, error } = useTable<BucketItem>('bucket_items', 'id', { orderBy: 'created_at' })
  const { user } = useAuth()
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | BucketCategory>('all')
  const [editing, setEditing] = useState<BucketItem | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [newCover, setNewCover] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<BucketItem | null>(null)

  const visible = useMemo(() => rows.filter((r) => filter === 'all' || r.category === filter), [rows, filter])
  const pending = visible.filter((r) => !r.completed)
  const done = visible.filter((r) => r.completed).sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
  const pct = rows.length ? Math.round((rows.filter((r) => r.completed).length / rows.length) * 100) : 0

  const open = (i: BucketItem | 'new') => {
    setEditing(i)
    setNewCover(null)
    setForm(i === 'new' ? blank : { title: i.title, description: i.description, category: i.category, target_date: i.target_date ?? '', cover_path: i.cover_path })
  }
  const close = () => { if (newCover) removeFiles([newCover]).catch(() => {}); setEditing(null) }

  const pickCover = async (file?: File) => {
    if (!file) return
    const bad = validateFile(file, ['image'])
    if (bad) return toast(bad, 'error')
    setUploading(true)
    try {
      const p = await uploadFile(file, 'bucket')
      if (newCover) removeFiles([newCover]).catch(() => {})
      setNewCover(p)
      setForm((f) => ({ ...f, cover_path: p }))
    } catch (e) { toast(errMsg(e), 'error') } finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Please give it a title.', 'error')
    setSaving(true)
    try {
      const patch = { title: form.title.trim(), description: form.description, category: form.category, target_date: form.target_date || null, cover_path: form.cover_path }
      if (editing === 'new') await insertRow<BucketItem>('bucket_items', { ...patch, created_by: user?.id })
      else if (editing) {
        await updateRow<BucketItem>('bucket_items', 'id', editing.id, editing.version, patch)
        if (editing.cover_path && editing.cover_path !== form.cover_path) removeFiles([editing.cover_path]).catch(() => {})
      }
      setNewCover(null)
      setEditing(null)
      toast('Saved to our list ✨')
    } catch (e) { toast(errMsg(e), 'error') } finally { setSaving(false) }
  }

  const toggle = async (i: BucketItem) => {
    try {
      await updateRow<BucketItem>('bucket_items', 'id', i.id, i.version, { completed: !i.completed })
      if (!i.completed) toast('Another dream ticked off! 🎉')
    } catch (e) { toast(errMsg(e), 'error') }
  }

  const remove = async (i: BucketItem) => {
    try {
      await deleteRow('bucket_items', 'id', i.id)
      removeFiles([i.cover_path]).catch(() => {})
      toast('Removed')
    } catch (e) { toast(errMsg(e), 'error') } finally { setDeleting(null) }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  const renderItem = (i: BucketItem) => (
    <motion.li key={i.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`card relative overflow-hidden transition ${i.completed ? 'bg-emerald-50/70 dark:bg-emerald-950/20' : ''}`}>
      {i.cover_path && <img src={publicUrl(i.cover_path)} alt="" loading="lazy" className={`h-36 w-full object-cover ${i.completed ? 'saturate-50' : ''}`} />}
      <div className="flex gap-3 p-4">
        <button disabled={!editable} onClick={() => toggle(i)} className="mt-0.5 shrink-0 disabled:cursor-default" aria-label={i.completed ? `Mark “${i.title}” as not done` : `Mark “${i.title}” as done`} aria-pressed={i.completed}>
          <AnimatedCheck done={i.completed} />
        </button>
        <div className="min-w-0 flex-1">
          <p className={`font-display text-lg ${i.completed ? 'text-stone-500 line-through decoration-emerald-400/70' : ''}`}>{i.title}</p>
          <p className="text-xs text-stone-500">{EMOJI[i.category]} {i.category}</p>
          {i.description && <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">{i.description}</p>}
          <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
            <CalendarDays className="h-3.5 w-3.5" />
            {i.completed ? `Done ${fmtDate(i.completed_at)}` : i.target_date ? `Target ${fmtDate(i.target_date)}` : 'Someday'}
          </p>
        </div>
        {editable && (
          <div className="flex shrink-0 flex-col">
            <button className="rounded-full p-1.5 hover:bg-blush-100 dark:hover:bg-white/10" onClick={() => open(i)} aria-label={`Edit ${i.title}`}><Pencil className="h-4 w-4" /></button>
            <button className="rounded-full p-1.5 text-red-500 hover:bg-red-50" onClick={() => setDeleting(i)} aria-label={`Delete ${i.title}`}><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </motion.li>
  )

  return (
    <div>
      <Reveal>
        <div className="card mx-auto mb-8 max-w-2xl p-5" aria-live="polite">
          <div className="mb-2 flex items-end justify-between">
            <span className="h-script text-xl">Our progress</span>
            <span className="font-display text-3xl text-blush-600">{pct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-blush-100 dark:bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <motion.div className="h-full rounded-full bg-gradient-to-r from-blush-300 to-blush-500" animate={{ width: `${pct}%` }} transition={{ type: 'spring', damping: 20 }} />
          </div>
          <p className="mt-2 text-xs text-stone-500">{rows.filter((r) => r.completed).length} of {rows.length} dreams completed</p>
        </div>
      </Reveal>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {(['all', ...BUCKET_CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1.5 text-sm transition ${filter === c ? 'bg-blush-500 text-white shadow-soft' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`}>
            {c === 'all' ? 'All' : `${EMOJI[c]} ${c}`}
          </button>
        ))}
        {editable && <button className="btn-primary ml-2 !py-1.5" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add dream</button>}
      </div>

      <h2 className="h-display mb-3 text-2xl">To do together <span className="text-sm text-stone-500">({pending.length})</span></h2>
      <ul className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>{pending.map((i) => renderItem(i))}</AnimatePresence>
      </ul>
      {!pending.length && <p className="mb-12 text-sm text-stone-500">Nothing pending here{editable ? ' — add something new!' : '.'}</p>}

      <h2 className="h-display mb-3 text-2xl">Done ✓ <span className="text-sm text-stone-500">({done.length})</span></h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>{done.map((i) => renderItem(i))}</AnimatePresence>
      </ul>
      {!done.length && <p className="text-sm text-stone-500">Nothing completed yet — go make a memory.</p>}

      <Modal open={Boolean(editing)} onClose={close} title={editing === 'new' ? 'Add to our bucket list' : 'Edit dream'}>
        <div className="space-y-3">
          <Field label="What do we want to do?"><input className="input" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Description"><textarea className="input min-h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as BucketCategory })}>
                {BUCKET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Target date (optional)"><input type="date" className="input" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} /></Field>
          </div>
          <div>
            <span className="label">Cover image (optional)</span>
            {form.cover_path ? (
              <div className="relative">
                <img src={publicUrl(form.cover_path)} alt="" className="h-36 w-full rounded-2xl object-cover" />
                <button className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white" onClick={() => setForm({ ...form, cover_path: null })} aria-label="Remove cover"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <label className="btn-ghost cursor-pointer">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Choose image
                <input type="file" accept="image/*" hidden onChange={(e) => { pickCover(e.target.files?.[0]); e.target.value = '' }} />
              </label>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={saving || uploading}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} title="Remove from our list?" message={`“${deleting?.title}” will be permanently deleted for both of you.`} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) return remove(deleting) }} />
    </div>
  )
}
