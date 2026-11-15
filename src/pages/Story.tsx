import { useState } from 'react'
import { motion } from 'motion/react'
import { Settings2 } from 'lucide-react'
import { useTable } from '../lib/data'
import { publicUrl } from '../lib/storage'
import { fmtDate } from '../lib/time'
import type { TimelineEvent } from '../lib/types'
import { useAuth } from '../context/AuthContext'
import { Reveal } from '../components/Reveal'
import { DECORATIONS, TimelineManager } from '../components/TimelineManager'
import { Empty, ErrorBox, SectionTitle, Spinner } from '../components/ui'

export default function Story() {
  const { rows, loading, error } = useTable<TimelineEvent>('timeline_events', 'id', { orderBy: 'position' })
  const { isMember } = useAuth()
  const [manage, setManage] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  if (loading) return <Spinner />
  if (error) return <ErrorBox message={error} />

  return (
    <>
      <SectionTitle script="Chapter by chapter" title="Our Story" sub="The moments that brought us here — and the ones still to come." />
      {isMember && (
        <div className="mb-10 flex justify-center">
          <button className="btn-ghost" onClick={() => setManage((m) => !m)}><Settings2 className="h-4 w-4" /> {manage ? 'Close editor' : 'Edit timeline'}</button>
        </div>
      )}
      {manage && isMember && <div className="mb-12"><TimelineManager /></div>}
      {!rows.length && <Empty title="Our story is just beginning" hint={isMember ? 'Use “Edit timeline” to add your first moment.' : undefined} />}

      <div className="relative mx-auto max-w-4xl">
        <motion.div
          aria-hidden
          className="absolute left-5 top-0 h-full w-0.5 origin-top bg-gradient-to-b from-blush-300 via-lilac-300 to-blush-200 md:left-1/2"
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: false, amount: 0.05 }}
          transition={{ duration: 1.4 }}
        />
        <ol className="space-y-12">
          {rows.map((e, i) => {
            const left = i % 2 === 0
            const upcoming = e.event_date > today
            return (
              <li key={e.id} className="relative pl-14 md:grid md:grid-cols-2 md:gap-14 md:pl-0">
                <motion.span
                  className="absolute left-0 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-soft md:left-1/2 md:-translate-x-1/2 dark:bg-night-800"
                  initial={{ scale: 0, rotate: -90 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: false, amount: 0.8 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16 }}
                  aria-hidden
                >
                  {DECORATIONS[e.decoration] ?? '💖'}
                </motion.span>
                <Reveal dir={left ? 'right' : 'left'} className={left ? 'md:col-start-1 md:text-right' : 'md:col-start-2'}>
                  <article className={`card p-5 ${upcoming ? 'border-2 border-dashed border-lilac-300' : ''}`}>
                    <p className="h-script text-xl">{fmtDate(e.event_date)} {upcoming && <span className="ml-1 rounded-full bg-lilac-100 px-2 py-0.5 font-sans text-xs text-lilac-300">upcoming</span>}</p>
                    <h2 className="h-display text-2xl">{e.title}</h2>
                    {e.description && <p className="mt-2 whitespace-pre-line text-stone-600 dark:text-stone-300">{e.description}</p>}
                    {e.photo_paths.length > 0 && (
                      <div className={`mt-4 grid gap-2 ${e.photo_paths.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {e.photo_paths.map((p, k) => (
                          <motion.img
                            key={p}
                            src={publicUrl(p)}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-soft"
                            style={{ rotate: `${(k % 2 ? 1 : -1) * 1.2}deg` }}
                            whileHover={{ scale: 1.04, rotate: 0 }}
                          />
                        ))}
                      </div>
                    )}
                    {e.video_path && <video src={publicUrl(e.video_path)} controls playsInline preload="metadata" className="mt-4 w-full rounded-2xl" />}
                  </article>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </>
  )
}
