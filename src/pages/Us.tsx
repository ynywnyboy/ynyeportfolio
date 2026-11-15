import { useState } from 'react'
import { Cake, Music, Utensils, Heart, Pencil, Sparkles } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useAuth } from '../context/AuthContext'
import { Reveal } from '../components/Reveal'
import { BioEditor } from '../components/BioEditor'
import { Modal, SectionTitle, Spinner, ErrorBox } from '../components/ui'
import { publicUrl } from '../lib/storage'
import { fmtDate } from '../lib/time'
import type { Bio } from '../lib/types'

function BioCard({ bio, fallback, canEdit, onEdit, side }: { bio: Bio; fallback: string; canEdit: boolean; onEdit: () => void; side: 'left' | 'right' }) {
  const name = bio.nickname || bio.full_name || fallback
  const avatar = publicUrl(bio.avatar_path)
  return (
    <Reveal dir={side === 'left' ? 'right' : 'left'}>
      <article className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blush-100/70 blur-2xl dark:bg-blush-600/10" aria-hidden />
        {canEdit && (
          <button onClick={onEdit} className="btn-ghost absolute right-4 top-4 !px-3 !py-1.5"><Pencil className="h-3.5 w-3.5" /> Edit</button>
        )}
        <div className="relative flex flex-col items-center text-center">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blush-100 to-lilac-100 shadow-dreamy">
            {avatar ? <img src={avatar} alt={name} className="h-full w-full object-cover" loading="lazy" /> : (
              <div className="flex h-full w-full items-center justify-center text-4xl text-blush-300"><Heart className="h-10 w-10 fill-blush-200" /></div>
            )}
          </div>
          <h2 className="h-display mt-4 text-3xl">{name}</h2>
          {bio.full_name && bio.nickname && <p className="text-sm text-stone-500">{bio.full_name}</p>}
          {bio.birthday && <p className="mt-1 inline-flex items-center gap-1 text-sm text-stone-500"><Cake className="h-3.5 w-3.5" /> {fmtDate(bio.birthday)}</p>}
        </div>

        {bio.bio && <p className="mt-6 whitespace-pre-line leading-relaxed">{bio.bio}</p>}

        {bio.hobbies.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {bio.hobbies.map((h) => <span key={h} className="rounded-full bg-blush-100 px-3 py-1 text-xs text-blush-600 dark:bg-white/10">{h}</span>)}
          </div>
        )}

        <dl className="mt-6 space-y-3 text-sm">
          {bio.favorite_music && <Row icon={<Music className="h-4 w-4" />} label="Favorite music" value={bio.favorite_music} />}
          {bio.favorite_food && <Row icon={<Utensils className="h-4 w-4" />} label="Favorite food" value={bio.favorite_food} />}
          {bio.personality && <Row icon={<Sparkles className="h-4 w-4" />} label="Personality" value={bio.personality} />}
          {bio.favorite_memories && <Row icon={<Heart className="h-4 w-4" />} label="Favorite memories" value={bio.favorite_memories} />}
          {(bio.custom_fields ?? []).map((c, i) => <Row key={i} icon={<Heart className="h-4 w-4" />} label={c.label} value={c.value} />)}
        </dl>
      </article>
    </Reveal>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-blush-50/70 p-3 dark:bg-white/5">
      <span className="mt-0.5 text-blush-500">{icon}</span>
      <div>
        <dt className="text-xs uppercase tracking-wider text-stone-500">{label}</dt>
        <dd className="whitespace-pre-line">{value}</dd>
      </div>
    </div>
  )
}

export default function Us() {
  const { bios, settings, loading, error } = useSite()
  const { member } = useAuth()
  const [editing, setEditing] = useState<Bio | null>(null)

  if (loading && !bios.length) return <Spinner />
  if (error) return <ErrorBox message={error} />
  const names = [settings?.name_one ?? 'Partner One', settings?.name_two ?? 'Partner Two']

  return (
    <>
      <SectionTitle script="Two hearts" title="About Us" sub="Who we are, what we love, and what makes us, us." />
      <div className="grid gap-8 md:grid-cols-2">
        {bios.map((b) => (
          <BioCard
            key={b.slot}
            bio={b}
            fallback={names[b.slot - 1]}
            side={b.slot === 1 ? 'left' : 'right'}
            canEdit={member?.slot === b.slot}
            onEdit={() => setEditing(b)}
          />
        ))}
      </div>
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Edit my biography" wide>
        {editing && <BioEditor bio={bios.find((b) => b.slot === editing.slot) ?? editing} onDone={() => setEditing(null)} />}
      </Modal>
    </>
  )
}
