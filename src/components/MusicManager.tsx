import { useState } from 'react'
import { ArrowDown, ArrowUp, Loader2, Music2, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteRow, errMsg, insertRow, updateRow } from '../lib/data'
import { publicUrl, removeFiles, uploadFile, validateFile } from '../lib/storage'
import type { Track } from '../lib/types'
import { toEmbedUrl, usePlayer } from '../context/PlayerContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { ConfirmDialog, Field, Modal } from './ui'

const blank = { title: '', artist: '', source_kind: 'file' as Track['source_kind'], audio_url: '', embed_url: '', audio_path: null as string | null, artwork_path: null as string | null }

export function MusicManager() {
  const { tracks } = usePlayer()
  const { user } = useAuth()
  const toast = useToast()
  const [editing, setEditing] = useState<Track | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [fresh, setFresh] = useState<string[]>([])
  const [busy, setBusy] = useState<null | 'audio' | 'art' | 'save'>(null)
  const [deleting, setDeleting] = useState<Track | null>(null)

  const open = (t: Track | 'new') => {
    setEditing(t)
    setFresh([])
    setForm(t === 'new' ? blank : { title: t.title, artist: t.artist, source_kind: t.source_kind, audio_url: t.audio_url ?? '', embed_url: t.embed_url ?? '', audio_path: t.audio_path, artwork_path: t.artwork_path })
  }
  const close = () => { removeFiles(fresh).catch(() => {}); setEditing(null) }

  const upload = async (file: File | undefined, kind: 'audio' | 'art') => {
    if (!file) return
    const bad = validateFile(file, [kind === 'audio' ? 'audio' : 'image'])
    if (bad) return toast(bad, 'error')
    setBusy(kind)
    try {
      const p = await uploadFile(file, kind === 'audio' ? 'music' : 'artwork')
      setFresh((f) => [...f, p])
      setForm((f) => (kind === 'audio' ? { ...f, audio_path: p, title: f.title || file.name.replace(/\.[^.]+$/, '') } : { ...f, artwork_path: p }))
    } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(null) }
  }

  const save = async () => {
    if (!form.title.trim()) return toast('Please add a song title.', 'error')
    if (form.source_kind === 'file' && !form.audio_path) return toast('Upload an audio file first.', 'error')
    if (form.source_kind === 'url' && !/^https?:\/\/\S+$/.test(form.audio_url)) return toast('Enter a valid link to an audio file.', 'error')
    if (form.source_kind === 'embed' && !toEmbedUrl(form.embed_url)) return toast('Use a YouTube, Spotify or SoundCloud link.', 'error')
    setBusy('save')
    try {
      const patch = {
        title: form.title.trim(), artist: form.artist.trim(), source_kind: form.source_kind,
        audio_path: form.source_kind === 'file' ? form.audio_path : null,
        audio_url: form.source_kind === 'url' ? form.audio_url.trim() : null,
        embed_url: form.source_kind === 'embed' ? form.embed_url.trim() : null,
        artwork_path: form.artwork_path,
      }
      if (editing === 'new') {
        const last = tracks.length ? Math.max(...tracks.map((t) => t.position)) + 1 : 0
        await insertRow<Track>('tracks', { ...patch, position: last, created_by: user?.id })
      } else if (editing) {
        await updateRow<Track>('tracks', 'id', editing.id, editing.version, patch)
        const dropped = [editing.audio_path !== patch.audio_path ? editing.audio_path : null, editing.artwork_path !== patch.artwork_path ? editing.artwork_path : null]
        removeFiles(dropped).catch(() => {})
      }
      setFresh([])
      setEditing(null)
      toast('Playlist updated 🎵')
    } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(null) }
  }

  const move = async (i: number, d: -1 | 1) => {
    const a = tracks[i], b = tracks[i + d]
    if (!a || !b) return
    try {
      await Promise.all([
        updateRow<Track>('tracks', 'id', a.id, a.version, { position: b.position === a.position ? b.position + d : b.position }),
        updateRow<Track>('tracks', 'id', b.id, b.version, { position: a.position }),
      ])
    } catch (e) { toast(errMsg(e), 'error') }
  }

  const remove = async (t: Track) => {
    try { await deleteRow('tracks', 'id', t.id); removeFiles([t.audio_path, t.artwork_path]).catch(() => {}); toast('Track removed') } catch (e) { toast(errMsg(e), 'error') } finally { setDeleting(null) }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500">Only add music you have the right to use: your own recordings, royalty-free/licensed files, or embeds from YouTube, Spotify and SoundCloud.</p>
      <button className="btn-primary" onClick={() => open('new')}><Plus className="h-4 w-4" /> Add song</button>
      <ul className="space-y-2">
        {tracks.map((t, i) => (
          <li key={t.id} className="card flex items-center gap-3 p-3">
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-blush-100">
              {t.artwork_path ? <img src={publicUrl(t.artwork_path)} alt="" className="h-full w-full object-cover" /> : <Music2 className="m-3 h-5 w-5 text-blush-400" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.title}</p>
              <p className="truncate text-xs text-stone-500">{t.artist || '—'} · {t.source_kind}</p>
            </div>
            <button className="rounded-full p-2 hover:bg-blush-100 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
            <button className="rounded-full p-2 hover:bg-blush-100 disabled:opacity-30" disabled={i === tracks.length - 1} onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
            <button className="rounded-full p-2 hover:bg-blush-100" onClick={() => open(t)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
            <button className="rounded-full p-2 text-red-500 hover:bg-red-50" onClick={() => setDeleting(t)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
      {!tracks.length && <p className="text-sm text-stone-500">Your playlist is empty.</p>}

      <Modal open={Boolean(editing)} onClose={close} title={editing === 'new' ? 'Add a song' : 'Edit song'}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title"><input className="input" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
            <Field label="Artist"><input className="input" value={form.artist} maxLength={120} onChange={(e) => setForm({ ...form, artist: e.target.value })} /></Field>
          </div>
          <Field label="Source">
            <select className="input" value={form.source_kind} onChange={(e) => setForm({ ...form, source_kind: e.target.value as Track['source_kind'] })}>
              <option value="file">Upload an audio file</option>
              <option value="url">Link to a hosted audio file</option>
              <option value="embed">YouTube / Spotify / SoundCloud embed</option>
            </select>
          </Field>
          {form.source_kind === 'file' && (
            <div>
              <label className="btn-ghost cursor-pointer">
                {busy === 'audio' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Music2 className="h-4 w-4" />} {form.audio_path ? 'Replace audio file' : 'Choose audio file'}
                <input type="file" accept="audio/*" hidden onChange={(e) => { upload(e.target.files?.[0], 'audio'); e.target.value = '' }} />
              </label>
              {form.audio_path && <audio className="mt-2 w-full" controls src={publicUrl(form.audio_path)} />}
            </div>
          )}
          {form.source_kind === 'url' && <Field label="Audio file URL" hint="Direct link ending in .mp3 / .ogg / .wav"><input className="input" value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} placeholder="https://…" /></Field>}
          {form.source_kind === 'embed' && <Field label="Song link" hint="Embeds use the service’s own player controls"><input className="input" value={form.embed_url} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} placeholder="https://open.spotify.com/track/…" /></Field>}
          <div>
            <span className="label">Album artwork</span>
            <div className="flex items-center gap-3">
              {form.artwork_path && <img src={publicUrl(form.artwork_path)} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <label className="btn-ghost cursor-pointer">
                {busy === 'art' && <Loader2 className="h-4 w-4 animate-spin" />} Choose image
                <input type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0], 'art'); e.target.value = '' }} />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-ghost" onClick={close}>Cancel</button>
            <button className="btn-primary" onClick={save} disabled={busy !== null}>{busy === 'save' && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} title="Remove this song?" message={`“${deleting?.title}” will be removed from the playlist for both of you.`} onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) return remove(deleting) }} />
    </div>
  )
}
