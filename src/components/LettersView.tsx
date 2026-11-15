import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Eye, Loader2, Lock, Mail, Pencil, Plus, Send, Trash2, X, ImagePlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTable, deleteRow, errMsg, insertRow, updateRow } from '../lib/data'
import { countdown, fmtDate, fmtDateTime, toLocalInput, useNow } from '../lib/time'
import { publicUrl, removeFiles, uploadFile, validateFile } from '../lib/storage'
import type { Letter, LetterBody, Member } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { useToast } from '../context/ToastContext'
import { ConfirmDialog, ErrorBox, Field, Modal, Spinner } from './ui'
import { Envelope } from './Envelope'

const AUDIENCE_HELP = {
  self: 'Private — only I can read it when it opens',
  partner: 'For my partner — only they can read it when it opens',
  both: 'Shared — we can both read it when it opens',
} as const

export function LettersView() {
  const { user, member } = useAuth()
  const { settings } = useSite()
  const toast = useToast()
  const now = useNow(1000)
  const { rows, loading, error } = useTable<Letter>('letters', 'id', { orderBy: 'created_at', ascending: false })
  const [members, setMembers] = useState<Member[]>([])
  const [editing, setEditing] = useState<Letter | 'new' | null>(null)
  const [reading, setReading] = useState<Letter | null>(null)
  const [deleting, setDeleting] = useState<Letter | null>(null)

  useEffect(() => {
    supabase.from('members').select('*').then(({ data }) => setMembers((data as Member[]) ?? []))
  }, [])

  const nameOf = (uid: string) => {
    const slot = members.find((m) => m.user_id === uid)?.slot
    return slot === 2 ? settings?.name_two ?? 'Partner Two' : settings?.name_one ?? 'Partner One'
  }
  const partnerName = member?.slot === 1 ? settings?.name_two : settings?.name_one

  const audienceLabel = (l: Letter) => {
    if (l.audience === 'both') return 'Shared letter'
    if (l.audience === 'self') return l.author_id === user?.id ? 'Private to me' : 'Private'
    return l.author_id === user?.id ? `To ${partnerName ?? 'my partner'}` : `From ${nameOf(l.author_id)} to you`
  }

  const drafts = useMemo(() => rows.filter((r) => r.status === 'draft'), [rows])
  const sealed = useMemo(() => rows.filter((r) => r.status === 'sealed').sort((a, b) => (a.unlock_at ?? '').localeCompare(b.unlock_at ?? '')), [rows])

  const remove = async (l: Letter) => {
    try {
      const { data } = await supabase.from('letter_bodies').select('photo_paths').eq('letter_id', l.id).maybeSingle()
      await deleteRow('letters', 'id', l.id)
      removeFiles((data?.photo_paths as string[]) ?? []).catch(() => {})
      toast('Draft deleted')
    } catch (e) { toast(errMsg(e), 'error') } finally { setDeleting(null) }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  // A plain render function (not a component) so cards don't remount on every clock tick
  const renderCard = (l: Letter) => {
    const unlockAt = l.unlock_at ? new Date(l.unlock_at) : null
    const cd = unlockAt ? countdown(unlockAt, now) : null
    const isDraft = l.status === 'draft'
    const locked = !isDraft && cd && !cd.done
    return (
      <motion.li key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-col p-5 text-center">
        <Envelope locked={Boolean(locked)} title={isDraft ? 'Draft' : locked ? '' : l.title} />
        <h3 className="h-display mt-5 text-xl">{l.title}</h3>
        <p className="text-xs uppercase tracking-wider text-stone-500">{audienceLabel(l)} · written {fmtDate(l.created_at)}</p>

        {isDraft && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn-ghost !py-1.5" onClick={() => setEditing(l)}><Pencil className="h-4 w-4" /> Continue writing</button>
            <button className="rounded-full p-2 text-red-500 hover:bg-red-50" onClick={() => setDeleting(l)} aria-label="Delete draft"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}

        {locked && cd && (
          <div className="mt-4">
            <p className="flex items-center justify-center gap-1 text-sm text-blush-600"><Lock className="h-3.5 w-3.5" /> Something special is waiting for us</p>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center" role="timer" aria-label="Time until this letter opens">
              {([['days', cd.days], ['hrs', cd.hours], ['min', cd.minutes], ['sec', cd.seconds]] as const).map(([u, v]) => (
                <div key={u} className="rounded-2xl bg-blush-50 py-2 dark:bg-white/5">
                  <div className="font-display text-xl tabular-nums text-blush-600">{v}</div>
                  <div className="text-[0.6rem] uppercase tracking-widest text-stone-500">{u}</div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-stone-500">Opens {fmtDateTime(l.unlock_at)}</p>
          </div>
        )}

        {!isDraft && cd?.done && (
          <button className="btn-primary mt-4 animate-pulse self-center" onClick={() => setReading(l)}><Mail className="h-4 w-4" /> Open letter</button>
        )}
      </motion.li>
    )
  }

  return (
    <div>
      <div className="mb-10 flex justify-center">
        <button className="btn-primary" onClick={() => setEditing('new')}><Plus className="h-4 w-4" /> Write a letter</button>
      </div>

      {drafts.length > 0 && (
        <section className="mb-12">
          <h2 className="h-display mb-4 text-2xl">My drafts</h2>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{drafts.map((l) => renderCard(l))}</ul>
        </section>
      )}

      <section>
        <h2 className="h-display mb-4 text-2xl">Sealed letters</h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{sealed.map((l) => renderCard(l))}</ul>
        {!sealed.length && <p className="text-center text-sm text-stone-500">No sealed letters yet. Write one for the future 💌</p>}
      </section>

      <LetterEditor letter={editing} onClose={() => setEditing(null)} partnerName={partnerName} />
      <LetterReader letter={reading} onClose={() => setReading(null)} author={reading ? nameOf(reading.author_id) : ''} />
      <ConfirmDialog open={Boolean(deleting)} title="Delete this draft?" message="Your unsent draft will be permanently deleted." onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting) return remove(deleting) }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function LetterEditor({ letter, onClose, partnerName }: { letter: Letter | 'new' | null; onClose: () => void; partnerName?: string }) {
  const { user } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ title: '', audience: 'both' as Letter['audience'], unlock: '', body: '', photos: [] as string[] })
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | 'draft' | 'seal' | 'photo' | 'load'>(null)
  const [confirmSeal, setConfirmSeal] = useState(false)
  const current = useRef<Letter | null>(null)
  const added = useRef<string[]>([])

  useEffect(() => {
    if (letter === null) { setLoadedFor(null); return }
    const key = letter === 'new' ? 'new' : letter.id
    if (loadedFor === key) return
    setLoadedFor(key)
    added.current = []
    current.current = letter === 'new' ? null : letter
    if (letter === 'new') { setForm({ title: '', audience: 'both', unlock: '', body: '', photos: [] }); return }
    setBusy('load')
    supabase.from('letter_bodies').select('*').eq('letter_id', letter.id).maybeSingle().then(({ data }) => {
      const b = data as LetterBody | null
      setForm({ title: letter.title, audience: letter.audience, unlock: toLocalInput(letter.unlock_at), body: b?.body ?? '', photos: b?.photo_paths ?? [] })
      setBusy(null)
    })
  }, [letter, loadedFor])

  const close = () => { removeFiles(added.current).catch(() => {}); added.current = []; onClose() }

  const addPhoto = async (file?: File) => {
    if (!file) return
    const bad = validateFile(file, ['image'])
    if (bad) return toast(bad, 'error')
    setBusy('photo')
    try {
      const p = await uploadFile(file, 'letters')
      added.current.push(p)
      setForm((f) => ({ ...f, photos: [...f.photos, p] }))
    } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(null) }
  }

  /** Saves the draft; returns the letter row. */
  const persist = async (): Promise<Letter> => {
    let row = current.current
    const meta = { title: form.title.trim() || 'Untitled letter', audience: form.audience, unlock_at: form.unlock ? new Date(form.unlock).toISOString() : null }
    if (!row) row = await insertRow<Letter>('letters', { ...meta, author_id: user!.id, status: 'draft' })
    else row = await updateRow<Letter>('letters', 'id', row.id, row.version, meta)
    current.current = row
    const { error } = await supabase.from('letter_bodies').upsert({ letter_id: row.id, body: form.body, photo_paths: form.photos })
    if (error) throw error
    return row
  }

  const saveDraft = async () => {
    setBusy('draft')
    try { await persist(); added.current = []; toast('Draft saved'); onClose() } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(null) }
  }

  const seal = async () => {
    setConfirmSeal(false)
    if (!form.unlock) return toast('Choose when this letter should open.', 'error')
    if (new Date(form.unlock).getTime() <= Date.now()) return toast('Pick a date in the future.', 'error')
    if (!form.body.trim()) return toast('Write something first 💕', 'error')
    setBusy('seal')
    try {
      const row = await persist()
      // The database re-checks unlock_at > now() using ITS clock, then locks the row for good.
      await updateRow<Letter>('letters', 'id', row.id, row.version, { status: 'sealed' })
      added.current = []
      toast('Sealed 💌 It will open on the date you chose.')
      onClose()
    } catch (e) { toast(errMsg(e), 'error') } finally { setBusy(null) }
  }

  const minLocal = toLocalInput(new Date(Date.now() + 60_000).toISOString())

  return (
    <>
      <Modal open={letter !== null} onClose={close} title={letter === 'new' ? 'Write a letter' : 'Edit draft'} wide>
        {busy === 'load' ? <Spinner /> : (
          <div className="space-y-4">
            <Field label="Title"><input className="input" value={form.title} maxLength={100} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Open when we’re celebrating 5 years" /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Who can read it?" hint={AUDIENCE_HELP[form.audience]}>
                <select className="input" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as Letter['audience'] })}>
                  <option value="both">Both of us (shared)</option>
                  <option value="partner">{partnerName ? `Only ${partnerName}` : 'My partner'}</option>
                  <option value="self">Only me (private)</option>
                </select>
              </Field>
              <Field label="Opens on" hint="Locked until this moment, checked by the server clock">
                <input type="datetime-local" className="input" min={minLocal} value={form.unlock} onChange={(e) => setForm({ ...form, unlock: e.target.value })} />
              </Field>
            </div>
            <Field label="Your message"><textarea className="input min-h-56 font-display text-base leading-relaxed" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Dear future us…" /></Field>
            <div>
              <span className="label">Photos (optional)</span>
              <div className="flex flex-wrap gap-2">
                {form.photos.map((p) => (
                  <div key={p} className="relative h-20 w-20 overflow-hidden rounded-2xl">
                    <img src={publicUrl(p)} alt="" className="h-full w-full object-cover" />
                    <button className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white" onClick={() => setForm({ ...form, photos: form.photos.filter((x) => x !== p) })} aria-label="Remove photo"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-blush-200 text-blush-400 hover:bg-blush-50">
                  {busy === 'photo' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  <input type="file" accept="image/*" hidden onChange={(e) => { addPhoto(e.target.files?.[0]); e.target.value = '' }} />
                </label>
              </div>
            </div>
            <p className="rounded-2xl bg-blush-50 p-3 text-xs text-stone-600 dark:bg-white/5 dark:text-stone-300">
              Drafts can be edited any time. <strong>Once sealed, a letter can’t be changed or opened</strong> until its date arrives — not even by you.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn-ghost" onClick={close}>Cancel</button>
              <button className="btn-ghost" onClick={saveDraft} disabled={busy !== null}>{busy === 'draft' && <Loader2 className="h-4 w-4 animate-spin" />} Save draft</button>
              <button className="btn-primary" onClick={() => setConfirmSeal(true)} disabled={busy !== null}>{busy === 'seal' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Seal letter</button>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={confirmSeal} title="Seal this letter?" message="After sealing, nobody can edit or read it until the opening date. Ready to lock it away?" confirmLabel="Seal it 💌" onCancel={() => setConfirmSeal(false)} onConfirm={seal} />
    </>
  )
}

/* ------------------------------------------------------------------ */

function LetterReader({ letter, onClose, author }: { letter: Letter | null; onClose: () => void; author: string }) {
  const [body, setBody] = useState<LetterBody | null>(null)
  const [state, setState] = useState<'loading' | 'refused' | 'ok'>('loading')
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    if (!letter) { setBody(null); setOpened(false); setState('loading'); return }
    let cancelled = false
    let retry: ReturnType<typeof setTimeout>
    const load = async () => {
      // Row Level Security answers using the database clock. If the date hasn't truly arrived, no row comes back.
      const { data } = await supabase.from('letter_bodies').select('*').eq('letter_id', letter.id).maybeSingle()
      if (cancelled) return
      if (data) {
        setBody(data as LetterBody)
        setState('ok')
        setTimeout(() => !cancelled && setOpened(true), 250)
      } else {
        setState('refused')
        retry = setTimeout(load, 5000)
      }
    }
    setState('loading')
    load()
    return () => { cancelled = true; clearTimeout(retry) }
  }, [letter?.id])

  return (
    <Modal open={Boolean(letter)} onClose={onClose} title={state === 'ok' ? letter?.title : 'Opening…'} wide>
      {state === 'loading' && <Spinner label="Unsealing…" />}
      {state === 'refused' && (
        <div className="py-6 text-center">
          <Envelope locked title="" />
          <p className="mt-4 flex items-center justify-center gap-2 text-blush-600"><Lock className="h-4 w-4" /> Not quite yet — something special is waiting for us.</p>
          <p className="mt-1 text-xs text-stone-500">The server confirms the opening time. We’ll keep checking.</p>
        </div>
      )}
      {state === 'ok' && body && (
        <div>
          <Envelope open={opened} title={letter?.title} />
          <AnimatePresence>
            {opened && (
              <motion.article initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.8 }} className="mt-8 rounded-3xl bg-cream-50 p-6 shadow-soft sm:p-10 dark:bg-night-900">
                <p className="text-xs uppercase tracking-wider text-stone-500">From {author} · written {fmtDate(letter?.created_at)} · opened {fmtDate(letter?.unlock_at)}</p>
                <p className="mt-4 whitespace-pre-wrap font-display text-lg leading-loose">{body.body}</p>
                {body.photo_paths.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {body.photo_paths.map((p) => <img key={p} src={publicUrl(p)} alt="" className="aspect-square w-full rounded-2xl object-cover shadow-soft" loading="lazy" />)}
                  </div>
                )}
              </motion.article>
            )}
          </AnimatePresence>
        </div>
      )}
      {state === 'ok' && !body && <p className="text-sm"><Eye className="mr-1 inline h-4 w-4" />Empty letter.</p>}
    </Modal>
  )
}
