import { Constellation } from '../components/Constellation'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Play, Settings2, Sparkles } from 'lucide-react'
import { useSite } from '../context/SiteContext'
import { useAuth } from '../context/AuthContext'
import { Reveal, ImageReveal } from '../components/Reveal'
import { Lightbox } from '../components/Lightbox'
import { AlbumManager, MemoryManager } from '../components/MemoryManager'
import { Empty, ErrorBox, SectionTitle, Spinner } from '../components/ui'
import { VideoThumb } from '../components/VideoThumb'
import { publicUrl } from '../lib/storage'

export default function Memories() {
  const { media, albums, loading, error } = useSite()
  const { isMember } = useAuth()
  const [params, setParams] = useSearchParams()
  const albumFilter = params.get('album') ?? 'all'
  const [category, setCategory] = useState('all')
  const [view, setView] = useState<number | null>(null)
  const [manage, setManage] = useState(false)
  const [constellation, setConstellation] = useState(() => {
    try { return localStorage.getItem('olw-constellation') === '1' } catch { return false }
  })
  const toggleConstellation = () => {
    const next = !constellation
    setConstellation(next)
    try { localStorage.setItem('olw-constellation', next ? '1' : '0') } catch { /* ignore */ }
  }

  const categories = useMemo(() => Array.from(new Set(albums.map((a) => a.category).filter(Boolean))), [albums])

  const filtered = useMemo(() => {
    return media.filter((m) => {
      if (albumFilter === 'none') return !m.album_id
      if (albumFilter !== 'all') return m.album_id === albumFilter
      if (category !== 'all') return albums.find((a) => a.id === m.album_id)?.category === category
      return true
    })
  }, [media, albums, albumFilter, category])

  // group by month, newest first
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>()
    filtered.forEach((m) => {
      const key = m.taken_at.slice(0, 7)
      map.set(key, [...(map.get(key) ?? []), m])
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  if (loading && !media.length) return <Spinner />
  if (error) return <ErrorBox message={error} />

  const setAlbum = (id: string) => {
    const next = new URLSearchParams(params)
    if (id === 'all') next.delete('album'); else next.set('album', id)
    setParams(next, { replace: true })
  }

  const chip = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${active ? 'bg-blush-500 text-white shadow-soft' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`

  return (
    <>
      <SectionTitle script="Little moments" title="Our Memories" sub="Every photo and video, kept safe in the cloud." />

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        <button className={chip(albumFilter === 'all' && category === 'all')} onClick={() => { setAlbum('all'); setCategory('all') }}>All</button>
        {albums.map((a) => <button key={a.id} className={chip(albumFilter === a.id)} onClick={() => setAlbum(a.id)}>{a.name}</button>)}
        {media.some((m) => !m.album_id) && albums.length > 0 && <button className={chip(albumFilter === 'none')} onClick={() => setAlbum('none')}>Unsorted</button>}
      </div>
      {categories.length > 0 && albumFilter === 'all' && (
        <div className="-mt-4 mb-8 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-stone-500">Category:</span>
          <button className={chip(category === 'all')} onClick={() => setCategory('all')}>Any</button>
          {categories.map((c) => <button key={c} className={chip(category === c)} onClick={() => setCategory(c)}>{c}</button>)}
        </div>
      )}

      <div className="mb-8 flex flex-wrap justify-center gap-3">
  {filtered.length > 1 && <button className="btn-primary" onClick={() => setView(0)}><Play className="h-4 w-4" /> Slideshow</button>}
  <button className="btn-ghost" onClick={toggleConstellation} aria-pressed={constellation}><Sparkles className="h-4 w-4" /> Our Constellation: {constellation ? 'On' : 'Off'}</button>
  {isMember && <button className="btn-ghost" onClick={() => setManage((m) => !m)}><Settings2 className="h-4 w-4" /> {manage ? 'Close manager' : 'Upload & manage'}</button>}
</div>
      {manage && isMember && (
        <div className="mb-12 space-y-8">
          <MemoryManager />
          <div><h2 className="h-display mb-3 text-2xl">Albums</h2><AlbumManager /></div>
        </div>
      )}

      {!groups.length && <Empty title="No memories here yet" hint={isMember ? 'Use “Upload & manage” to add your first photo or video.' : 'Sign in to add memories.'} />}
      
        {constellation && filtered.length > 0 && (
    <Constellation items={filtered} onOpen={(m) => setView(filtered.indexOf(m))} />
  )}

      <div className="space-y-14">
        {!constellation && groups.map(([key, items]) => (
          <section key={key}>
            <Reveal>
              <h2 className="h-script mb-4 text-3xl">{new Date(key + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            </Reveal>
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {items.map((m, i) => {
                const idx = filtered.indexOf(m)
                return (
                  <button
                    key={m.id}
                    onClick={() => setView(idx)}
                    className="group relative block w-full break-inside-avoid overflow-hidden rounded-3xl bg-white p-1.5 shadow-soft transition hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-dreamy dark:bg-night-800"
                    style={{ rotate: `${((i % 5) - 2) * 0.4}deg` }}
                    aria-label={m.caption || 'Open memory'}
                  >
                    {m.kind === 'video' ? (
                      <VideoThumb src={publicUrl(m.storage_path)} />
                    ) : (
                      <ImageReveal src={publicUrl(m.storage_path)} alt={m.caption || 'Memory'} />
                    )}
                    {m.caption && <p className="truncate px-2 pb-1 pt-2 text-left text-xs text-stone-600 dark:text-stone-300">{m.caption}</p>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {view !== null && (
        <Lightbox
          items={filtered}
          index={Math.min(view, filtered.length - 1)}
          onIndex={setView}
          onClose={() => setView(null)}
          albumName={(m) => albums.find((a) => a.id === m.album_id)?.name}
        />
      )}
    </>
  )
}
