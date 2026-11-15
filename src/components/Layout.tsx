
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { Particles } from './Particles'
import { BackgroundEffect } from './BackgroundEffect'
import { MusicPlayer } from './MusicPlayer'
import { NotebookView } from './notebook/NotebookView'
import { FloatingNav } from './FloatingNav'

export function Layout() {
  const { theme, appearance } = useSite()
  const loc = useLocation()

  if (theme.kind === 'notebook') {
    return <NotebookView />
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundEffect />
      <Particles enabled={theme.particles} kinds={appearance.decorations} motion={appearance.motion} />

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-40 pt-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <FloatingNav />
      <MusicPlayer />
    </div>
  )
}
