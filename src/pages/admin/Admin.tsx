import { useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  LayoutDashboard, UserRound, BookHeart, Images, FolderHeart, Clock, Music, ListChecks, Mail, HeartHandshake, Palette, Settings, Sparkles, Menu, X, ChevronDown,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSite } from '../../context/SiteContext'
import { BioEditor } from '../../components/BioEditor'
import { MemoryManager, AlbumManager } from '../../components/MemoryManager'
import { TimelineManager } from '../../components/TimelineManager'
import { MusicManager } from '../../components/MusicManager'
import { BucketListView } from '../../components/BucketListView'
import { LettersView } from '../../components/LettersView'
import { Spinner } from '../../components/ui'
import { RelationshipSettings, ThemeSettings, AccountSettings } from './Settings'
import { AnimationSettings } from './AnimationSettings'
import { CustomizeWorld } from '../../components/CustomizeWorld'

const nav = [
  { to: '', label: 'Overview', icon: LayoutDashboard, end: true, section: 'Content' },
  { to: 'profile', label: 'My profile', icon: UserRound, section: 'Content' },
  { to: 'bios', label: 'Biographies', icon: BookHeart, section: 'Content' },
  { to: 'memories', label: 'Memories', icon: Images, section: 'Media' },
  { to: 'albums', label: 'Albums', icon: FolderHeart, section: 'Media' },
  { to: 'timeline', label: 'Timeline', icon: Clock, section: 'Media' },
  { to: 'music', label: 'Music', icon: Music, section: 'Media' },
  { to: 'bucket', label: 'Bucket list', icon: ListChecks, section: 'Lists' },
  { to: 'letters', label: 'Letters', icon: Mail, section: 'Messages', private: true },
  { to: 'relationship', label: 'Relationship', icon: HeartHandshake, section: 'Settings' },
  { to: 'theme', label: 'Theme', icon: Palette, section: 'Settings' },
  { to: 'animations', label: 'Animations', icon: Sparkles, section: 'Settings' },
  { to: 'account', label: 'Account', icon: Settings, section: 'Settings' },
]

const sections = [...new Set(nav.map((n) => n.section))]

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

function Overview() {
  const { media, albums, bios, settings } = useSite()
  const stats = [
    { label: 'Memories', value: media.length },
    { label: 'Albums', value: albums.length },
    { label: 'Photos', value: media.filter((m) => m.kind === 'image').length },
    { label: 'Videos', value: media.filter((m) => m.kind === 'video').length },
  ]
  const usedMB = Math.round(media.reduce((s, m) => s + (m.size_bytes ?? 0), 0) / 1024 / 1024)
  return (
    <Panel title="Our dashboard" subtitle="Everything here is shared — changes appear instantly for both of you.">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5 text-center">
            <div className="font-display text-4xl text-blush-600">{s.value}</div>
            <div className="text-xs uppercase tracking-widest text-stone-500">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="card mt-6 p-5">
        <p className="font-medium">Cloud storage used by memories: ~{usedMB} MB of 1 GB (Supabase free tier)</p>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-blush-100"><div className="h-full rounded-full bg-blush-400" style={{ width: `${Math.min(100, (usedMB / 1024) * 100)}%` }} /></div>
        <p className="mt-2 text-xs text-stone-500">Free tier: 1 GB file storage, 5 GB bandwidth per month, 50 MB per file. See the README for details.</p>
      </div>
      <p className="mt-6 text-sm text-stone-500">Site visibility: <strong>{settings?.is_public ? 'Public (view-only for visitors)' : 'Private (sign-in required)'}</strong> · {bios.length} profiles</p>
    </Panel>
  )
}

function OwnProfile() {
  const { member } = useAuth()
  const { bios, loading } = useSite()
  if (loading) return <Spinner />
  const mine = bios.find((b) => b.slot === member?.slot)
  return <Panel title="My profile">{mine ? <div className="card p-6"><BioEditor bio={mine} /></div> : <p>Profile not found.</p>}</Panel>
}

function AllBios() {
  const { bios, settings } = useSite()
  const [slot, setSlot] = useState<1 | 2>(1)
  const bio = bios.find((b) => b.slot === slot)
  return (
    <Panel title="Biographies">
      <div className="mb-4 flex gap-2">
        {([1, 2] as const).map((s) => (
          <button key={s} onClick={() => setSlot(s)} className={`rounded-full px-4 py-1.5 text-sm ${slot === s ? 'bg-blush-500 text-white' : 'bg-white/70 dark:bg-white/10'}`}>
            {s === 1 ? settings?.name_one : settings?.name_two}
          </button>
        ))}
      </div>
      {bio && <div className="card p-6"><BioEditor key={slot} bio={bio} /></div>}
    </Panel>
  )
}

export default function Admin() {
  const { isMember } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const visible = nav.filter((l) => !l.private || isMember)

  return (
    <div className="relative min-h-screen">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-blush-100/60 dark:border-white/10 bg-white/80 dark:bg-night-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-display text-lg text-stone-800 dark:text-stone-100">Editor</h1>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-xl p-2 text-stone-600 hover:bg-blush-100 dark:text-stone-300 dark:hover:bg-white/10 transition"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <nav className="px-4 pb-4 space-y-1" aria-label="Dashboard">
                {sections.map((section) => (
                  <div key={section}>
                    <p className="mb-1 mt-3 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">{section}</p>
                    {visible
                      .filter((n) => n.section === section)
                      .map(({ to, label, icon: Icon }) => (
                        <NavLink
                          key={to}
                          to={to}
                          end={(section === 'Content' && to === '') as boolean}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                              isActive
                                ? 'bg-blush-100 text-blush-700 dark:bg-white/15 dark:text-stone-100 font-medium'
                                : 'text-stone-600 hover:bg-blush-50 dark:text-stone-300 dark:hover:bg-white/5'
                            }`
                          }
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {label}
                        </NavLink>
                      ))}
                  </div>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:w-56 xl:w-64 shrink-0">
            <nav aria-label="Dashboard" className="sticky top-24 space-y-5">
              <div>
                <p className="mb-2 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">Editor</p>
                <div className="space-y-0.5">
                  {sections.map((section) => (
                    <div key={section}>
                      <p className="mb-1 mt-3 px-3 text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">{section}</p>
                      {visible
                        .filter((n) => n.section === section)
                        .map(({ to, label, icon: Icon }) => (
                          <NavLink
                            key={to}
                            to={to}
                            end={(section === 'Content' && to === '') as boolean}
                            className={({ isActive }) =>
                              `group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-blush-100 text-blush-700 dark:bg-white/15 dark:text-stone-100 font-medium shadow-sm'
                                  : 'text-stone-600 hover:bg-blush-50/60 dark:text-stone-300 dark:hover:bg-white/5'
                              }`
                            }
                          >
                            <Icon className={`h-4 w-4 shrink-0 transition ${location.pathname.includes(to) && visible.find((n) => n.to === to)?.to === location.pathname.slice(-to.length) ? 'text-blush-500' : 'text-stone-400 dark:text-stone-500 group-hover:text-stone-600 dark:group-hover:text-stone-300'}`} />
                            {label}
                          </NavLink>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          </aside>

          {/* Main content area */}
          <main className="min-w-0 flex-1 pb-24">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="profile" element={<OwnProfile />} />
              <Route path="bios" element={<AllBios />} />
              <Route path="memories" element={<Panel title="Memory manager"><MemoryManager /></Panel>} />
              <Route path="albums" element={<Panel title="Album manager"><AlbumManager /></Panel>} />
              <Route path="timeline" element={<Panel title="Timeline editor"><TimelineManager /></Panel>} />
              <Route path="music" element={<Panel title="Music manager"><MusicManager /></Panel>} />
              <Route path="bucket" element={<Panel title="Bucket list manager"><BucketListView editable /></Panel>} />
              <Route path="letters" element={<Panel title="Future letters"><LettersView /></Panel>} />
              <Route path="relationship" element={<Panel title="Relationship settings"><RelationshipSettings /></Panel>} />
              <Route path="theme" element={
                <Panel title="Theme customization" subtitle="Personalize how your world looks and feels. Changes are shared with your partner.">
                  <ThemeSettings />
                  <div className="mt-10">
                    <CustomizeWorld />
                  </div>
                </Panel>
              } />
              <Route path="animations" element={<Panel title="Animation settings"><AnimationSettings /></Panel>} />
              <Route path="account" element={<Panel title="Account settings"><AccountSettings /></Panel>} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}
