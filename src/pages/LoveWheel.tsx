import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, Settings2, Volume2 } from 'lucide-react'
import { useWheelData } from '../components/wheel/useWheelData'
import { LoveWheel } from '../components/wheel/LoveWheel'
import { WheelManager } from '../components/wheel/WheelManager'
import { WheelHistory } from '../components/wheel/WheelHistory'
import { SoundPanel } from '../components/wheel/SoundPanel'
import { ErrorBox, SectionTitle, Spinner } from '../components/ui'
import { Reveal } from '../components/Reveal'

const WHEEL_KEY = 'olw-wheel-id'

export default function LoveWheelPage() {
  const data = useWheelData()
  const [wheelId, setWheelId] = useState<string | null>(() => {
    try { return localStorage.getItem(WHEEL_KEY) } catch { return null }
  })
  const [panel, setPanel] = useState<'customize' | 'sound' | null>(null)

  // Fall back to the first wheel if the remembered one was deleted (e.g. by your partner)
  const wheel = data.wheels.find((w) => w.id === wheelId) ?? data.wheels[0] ?? null
  useEffect(() => {
    if (wheel && wheel.id !== wheelId) setWheelId(wheel.id)
    if (wheel) { try { localStorage.setItem(WHEEL_KEY, wheel.id) } catch { /* ignore */ } }
  }, [wheel, wheelId])

  const enabled = useMemo(
    () => data.options.filter((o) => o.wheel_id === wheel?.id && o.enabled).sort((a, b) => a.position - b.position),
    [data.options, wheel?.id],
  )

  if (data.loading) return <Spinner />
  if (data.error) {
    return (
      <>
        <SectionTitle script="Little surprises" title="Spin the Love Wheel" />
        <ErrorBox message={`${data.error} — the Love Wheel tables may not exist yet. Run supabase/migrations/002_love_wheel.sql in the Supabase SQL editor.`} />
      </>
    )
  }

  const toggle = (p: 'customize' | 'sound') => setPanel((cur) => (cur === p ? null : p))

  return (
    <>
      <SectionTitle script="Little surprises" title="Spin the Love Wheel" sub="Let the wheel pick a sweet gesture, a surprise or a silly challenge. Completely optional — always." />

      {data.wheels.length > 1 && (
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Choose a wheel">
          {data.wheels.map((w) => (
            <button
              key={w.id}
              onClick={() => setWheelId(w.id)}
              aria-pressed={w.id === wheel?.id}
              className={`rounded-full px-4 py-1.5 text-sm transition ${w.id === wheel?.id ? 'bg-blush-500 text-white shadow-soft' : 'bg-white/70 hover:bg-blush-100 dark:bg-white/10'}`}
            >
              {w.emoji} {w.name}
            </button>
          ))}
        </div>
      )}

      {wheel ? (
        <Reveal dir="none">
          <LoveWheel wheel={wheel} options={enabled} history={data.history} />
        </Reveal>
      ) : (
        <p className="text-center text-stone-500">No wheel yet — run the 002_love_wheel.sql migration to create the first one.</p>
      )}

      <div className="mx-auto mt-12 max-w-3xl space-y-3">
        {([
          { id: 'customize', label: 'Customize the wheel', icon: Settings2 },
          { id: 'sound', label: 'Sound effects', icon: Volume2 },
        ] as const).map(({ id, label, icon: Icon }) => (
          <div key={id} className="card overflow-hidden">
            <button
              onClick={() => toggle(id)}
              aria-expanded={panel === id}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-medium"
            >
              <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-blush-500" /> {label}</span>
              <ChevronDown className={`h-4 w-4 transition ${panel === id ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {panel === id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="border-t border-blush-100 p-5 dark:border-white/10">
                    {id === 'customize' ? (
                      <WheelManager wheels={data.wheels} options={data.options} wheelId={wheel?.id ?? null} onSelect={setWheelId} reloadOptions={data.reloadOptions} />
                    ) : (
                      <SoundPanel />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <WheelHistory history={data.history} />
    </>
  )
}
