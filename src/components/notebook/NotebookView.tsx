import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Book, Heart, User, Image as ImageIcon, Calendar, Link as LinkIcon, Music, ChevronLeft, ChevronRight, Settings as SettingsIcon, X } from 'lucide-react'
import { useSite } from '../../context/SiteContext'
import { Spinner } from '../../components/ui'

const Home = lazy(() => import('../../pages/Home'))
const Us = lazy(() => import('../../pages/Us'))
const BucketList = lazy(() => import('../../pages/BucketList'))
const Story = lazy(() => import('../../pages/Story'))
const Letters = lazy(() => import('../../pages/Letters'))
const LoveWheel = lazy(() => import('../../pages/LoveWheel'))

export type NotebookPage = 'home' | 'about' | 'gallery' | 'timeline' | 'links' | 'music'

const NOTEBOOK_PRESETS = [
  { id: 'classic-blue', name: 'Classic Blue', cover: '#2b4a7d', paper: '#fffef5', line: '#d6e4ff', ribbon: '#cf5f7e' },
  { id: 'lavender-diary', name: 'Lavender Diary', cover: '#7e6ba8', paper: '#f8f4ff', line: '#e0d6ff', ribbon: '#a9ecda' },
  { id: 'baby-blue', name: 'Baby Blue', cover: '#6b9bd1', paper: '#f0f7ff', line: '#d1e6ff', ribbon: '#f2a65a' },
  { id: 'pink-pastel', name: 'Pink Pastel', cover: '#e8899f', paper: '#fff5f7', line: '#ffe4ea', ribbon: '#c3a9ec' },
]

function PageSkeleton() {
  return <Spinner label="Loading…" />
}

export function NotebookView() {
  const { theme, updateTheme, isDark } = useSite()
  const [currentPage, setCurrentPage] = useState<NotebookPage>('home')
  const [isFlipping, setIsFlipping] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showCustomizer, setShowCustomizer] = useState(false)

  const notebook = theme.notebook || {
    coverColor: '#2b4a7d',
    paperColor: '#fffef5',
    lineColor: '#d6e4ff',
    font: 'caveat',
    ribbonColor: '#cf5f7e',
    preset: 'classic-blue'
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const pages: Array<{ id: NotebookPage; title: string; icon: React.ElementType }> = [
    { id: 'home', title: 'Cover', icon: Book },
    { id: 'about', title: 'About Us', icon: User },
    { id: 'gallery', title: 'Gallery', icon: ImageIcon },
    { id: 'timeline', title: 'Timeline', icon: Calendar },
    { id: 'links', title: 'Letters', icon: LinkIcon },
    { id: 'music', title: 'Fun', icon: Music },
  ]

  const pageIdx = pages.findIndex(p => p.id === currentPage)

  const handlePageChange = (page: NotebookPage) => {
    if (page === currentPage || isFlipping) return
    setIsFlipping(true)
    setTimeout(() => {
      setCurrentPage(page)
      setIsFlipping(false)
    }, 400)
  }

  const goNext = () => {
    const nextIdx = (pageIdx + 1) % pages.length
    handlePageChange(pages[nextIdx].id as NotebookPage)
  }

  const goPrev = () => {
    const prevIdx = (pageIdx - 1 + pages.length) % pages.length
    handlePageChange(pages[prevIdx].id as NotebookPage)
  }

  const updateNotebook = (patch: any) => {
    updateTheme({ notebook: { ...notebook, ...patch } }, { immediate: true, quiet: true })
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 flex flex-col items-center py-6 px-4 ${isDark ? 'bg-night-950' : 'bg-stone-100'}`}
      style={{ fontFamily: notebook.font === 'handwritten' ? 'Caveat, cursive' : (notebook.font === 'indie' ? 'Indie Flower, cursive' : 'inherit') }}
    >
      <div className="w-full max-w-5xl flex justify-between items-center mb-4 z-50">
        <button
          onClick={() => updateTheme({ kind: 'default' })}
          className="flex items-center gap-2 text-stone-500 hover:text-blush-500 transition-colors text-sm font-medium bg-white/50 dark:bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm"
        >
          <ChevronLeft className="h-4 w-4" /> Exit Notebook
        </button>

        <div className="flex items-center gap-2">
           <button
            onClick={() => setShowCustomizer(true)}
            className="p-2.5 rounded-full bg-white/80 dark:bg-white/10 shadow-sm text-stone-600 dark:text-stone-300 hover:scale-110 transition"
            title="Notebook Settings"
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-6xl h-[85vh] perspective-2000">
        <motion.div
          className="relative w-full h-full flex shadow-2xl rounded-r-3xl overflow-visible"
          style={{
            backgroundColor: notebook.coverColor,
            borderLeft: isMobile ? '8px solid rgba(0,0,0,0.2)' : '24px solid rgba(0,0,0,0.3)',
            boxShadow: 'inset -5px 0 15px rgba(0,0,0,0.2), 20px 20px 60px rgba(0,0,0,0.3)'
          }}
          initial={{ rotateX: 5, rotateY: -2 }}
          animate={{ rotateX: 0, rotateY: 0 }}
        >
          <div className="absolute left-[-12px] top-0 bottom-0 w-6 flex flex-col justify-around py-8 z-40 pointer-events-none">
            {[...Array(isMobile ? 6 : 12)].map((_, i) => (
              <div key={i} className="w-8 h-4 bg-stone-300 rounded-full shadow-[inset_2px_2px_4px_rgba(0,0,0,0.3)] border border-stone-400 -ml-1" />
            ))}
          </div>

          <div className="absolute right-0 top-2 bottom-2 w-4 bg-stone-200 rounded-r-lg shadow-inner z-10 border-r border-stone-300" />
          <div className="absolute right-1 top-3 bottom-3 w-4 bg-stone-100 rounded-r-lg shadow-inner z-10 border-r border-stone-200" />

          <div
            className={`flex-1 m-2 md:m-4 rounded-r-xl relative overflow-hidden flex ${isMobile ? 'flex-col' : 'flex-row'}`}
            style={{
              backgroundColor: notebook.paperColor,
              boxShadow: 'inset 10px 0 20px rgba(0,0,0,0.05)'
            }}
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
              backgroundImage: `linear-gradient(${notebook.lineColor} 1px, transparent 1px)`,
              backgroundSize: '100% 32px',
              top: '40px'
            }} />

            {!isMobile && <div className="absolute left-16 top-0 bottom-0 w-px bg-red-200 opacity-50" />}

            <div className="relative flex-1 h-full flex flex-col z-20">
              <div className="p-6 border-b border-stone-200/50 flex justify-between items-center">
                <h2 className="text-3xl font-bold text-stone-800" style={{ fontFamily: 'Caveat, cursive' }}>
                  {pages[pageIdx].title}
                </h2>
                <div className="flex items-center gap-4">
                  <button onClick={goPrev} className="p-2 hover:bg-stone-200/50 rounded-full transition"><ChevronLeft /></button>
                  <span className="text-xs font-mono text-stone-400">PAGE {pageIdx + 1} / {pages.length}</span>
                  <button onClick={goNext} className="p-2 hover:bg-stone-200/50 rounded-full transition"><ChevronRight /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 md:p-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPage}
                    initial={{ x: 50, opacity: 0, rotateY: 10 }}
                    animate={{ x: 0, opacity: 1, rotateY: 0 }}
                    exit={{ x: -50, opacity: 0, rotateY: -10 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="max-w-4xl mx-auto"
                  >
                    {currentPage === 'home' && <Suspense fallback={<PageSkeleton />}><Home /></Suspense>}
                    {currentPage === 'about' && <Suspense fallback={<PageSkeleton />}><Us /></Suspense>}
                    {currentPage === 'gallery' && <Suspense fallback={<PageSkeleton />}><BucketList /></Suspense>}
                    {currentPage === 'timeline' && <Suspense fallback={<PageSkeleton />}><Story /></Suspense>}
                    {currentPage === 'links' && <Suspense fallback={<PageSkeleton />}><Letters /></Suspense>}
                    {currentPage === 'music' && <Suspense fallback={<PageSkeleton />}><LoveWheel /></Suspense>}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className={`flex flex-col bg-stone-800/5 border-l border-stone-200/50 ${isMobile ? 'w-full h-16 flex-row overflow-x-auto' : 'w-20 py-10'}`}>
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePageChange(p.id)}
                  className={`flex flex-col items-center justify-center transition-all ${
                    isMobile ? 'flex-1 min-w-[70px]' : 'w-full py-6'
                  } ${currentPage === p.id ? 'bg-white/80 text-blush-500' : 'text-stone-400 hover:text-stone-600'}`}
                >
                  <p.icon className={isMobile ? 'h-5 w-5' : 'h-6 w-6 mb-1'} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{p.id}</span>
                </button>
              ))}
            </div>
          </div>

          <motion.div
            className="absolute top-0 right-32 w-10 h-64 rounded-b-lg shadow-xl z-30 pointer-events-none"
            style={{ backgroundColor: notebook.ribbonColor }}
            animate={{ height: [240, 260, 240] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-black/10 rounded-b-lg" />
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showCustomizer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomizer(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-night-900 rounded-3xl shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-blush-500" /> Notebook Settings
                </h3>
                <button onClick={() => setShowCustomizer(false)} className="p-2 hover:bg-stone-100 rounded-full"><X /></button>
              </div>

              <div className="space-y-6">
                <section>
                  <label className="text-xs font-bold uppercase text-stone-400 mb-3 block">Color Preset</label>
                  <div className="grid grid-cols-2 gap-2">
                    {NOTEBOOK_PRESETS.map(p => (
                      <button
                        key={p.id}
                        onClick={() => updateNotebook({ preset: p.id, coverColor: p.cover, paperColor: p.paper, lineColor: p.line, ribbonColor: p.ribbon })}
                        className={`flex items-center gap-2 p-2 rounded-xl border-2 transition ${notebook.preset === p.id ? 'border-blush-500 bg-blush-50' : 'border-stone-100 hover:border-stone-200'}`}
                      >
                        <div className="h-6 w-6 rounded-full shadow-sm" style={{ backgroundColor: p.cover }} />
                        <span className="text-xs font-medium">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-xs font-bold uppercase text-stone-400 mb-3 block">Handwriting Font</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'caveat', name: 'Caveat' },
                      { id: 'indie', name: 'Indie Flower' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => updateNotebook({ font: f.id })}
                        className={`p-3 rounded-xl border-2 text-center transition ${notebook.font === f.id ? 'border-blush-500 bg-blush-50' : 'border-stone-100 hover:border-stone-200'}`}
                      >
                         <span className="text-lg" style={{ fontFamily: f.id === 'caveat' ? 'Caveat, cursive' : 'Indie Flower, cursive' }}>{f.name}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                   <label className="text-xs font-bold uppercase text-stone-400 mb-3 block">Custom Cover</label>
                   <input
                    type="color"
                    value={notebook.coverColor}
                    onChange={(e) => updateNotebook({ coverColor: e.target.value, preset: 'custom' })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                   />
                </section>
              </div>

              <button
                onClick={() => setShowCustomizer(false)}
                className="w-full mt-8 btn-primary"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-2000 { perspective: 2000px; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Indie+Flower&display=swap');
      `}</style>
    </div>
  )
}