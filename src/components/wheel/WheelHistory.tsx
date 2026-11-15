import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { clearTable, errMsg } from '../../lib/data'
import { fmtDate } from '../../lib/time'
import type { WheelSpin } from '../../lib/types'
import { useToast } from '../../context/ToastContext'
import { Reveal } from '../Reveal'
import { ConfirmDialog } from '../ui'

const PAGE = 18
const STATUS: Record<WheelSpin['status'], { text: string; cls: string }> = {
  spun: { text: 'landed here', cls: 'bg-lilac-100 text-lilac-300 dark:bg-white/10' },
  done: { text: 'we did it 💗', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
  skipped: { text: 'skipped — no pressure', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200' },
}

const dayKey = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** "Our Little Moments" — everything the wheel has chosen, newest first, synced live for both of us. */
export function WheelHistory({ history }: { history: WheelSpin[] }) {
  const toast = useToast()
  const [shown, setShown] = useState(PAGE)
  const [confirm, setConfirm] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, WheelSpin[]>()
    history.slice(0, shown).forEach((h) => {
      const k = dayKey(h.created_at)
      map.set(k, [...(map.get(k) ?? []), h])
    })
    return Array.from(map.entries())
  }, [history, shown])

  const clear = async () => {
    try {
      await clearTable('wheel_history', 'id')
      toast('History cleared')
    } catch (e) {
      toast(errMsg(e), 'error')
    } finally {
      setConfirm(false)
    }
  }

  return (
    <section aria-labelledby="moments" className="mt-20">
      <Reveal>
        <div className="mb-8 text-center">
          <p className="h-script text-2xl">Every spin, remembered</p>
          <h2 id="moments" className="h-display text-3xl font-semibold sm:text-4xl">Our Little Moments</h2>
          <p className="mt-2 text-sm text-stone-500">{history.length ? `${history.length} little moment${history.length === 1 ? '' : 's'} so far` : 'Nothing yet — give the wheel a spin!'}</p>
        </div>
      </Reveal>

      {history.length > 0 && (
        <>
          <div className="space-y-10">
            {groups.map(([key, items]) => (
              <div key={key}>
                <Reveal><h3 className="h-script mb-4 text-2xl">{fmtDate(items[0].created_at, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3></Reveal>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((h, i) => (
                    <Reveal key={h.id} delay={(i % 3) * 0.06}>
                      <article
                        className="tape relative rounded-[1.75rem] bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:rotate-0 hover:shadow-dreamy dark:bg-night-800"
                        style={{ rotate: `${((i % 3) - 1) * 0.9}deg` }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-4xl" aria-hidden>{h.emoji}</span>
                          <div className="min-w-0">
                            <p className="font-display text-lg leading-snug">{h.label}</p>
                            <p className="mt-1 text-xs text-stone-500">{h.category}{h.wheel_name ? ` · ${h.wheel_name}` : ''}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className={`rounded-full px-2.5 py-1 ${STATUS[h.status].cls}`}>{STATUS[h.status].text}</span>
                          <time dateTime={h.created_at} className="text-stone-500">
                            {new Date(h.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </time>
                        </div>
                      </article>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {history.length > shown && <button className="btn-ghost" onClick={() => setShown((s) => s + PAGE)}>Show more</button>}
            <button className="btn-ghost text-red-600" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" /> Clear history</button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirm}
        title="Clear all of Our Little Moments?"
        message="Every past spin will be deleted for both of you. Your wheels and ideas are not affected. This can’t be undone."
        confirmLabel="Clear history"
        onCancel={() => setConfirm(false)}
        onConfirm={clear}
      />
    </section>
  )
}
