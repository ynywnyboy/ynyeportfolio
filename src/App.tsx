import { useEffect, Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui'
import { useAuth } from './context/AuthContext'
import { isConfigured } from './lib/supabase'
import { syncServerClock } from './lib/time'

// Eager: Login, Admin
import Login from './pages/Login'
import Admin from './pages/admin/Admin'
const Home = lazy(() => import('./pages/Home'))

// Lazy: all other pages
const Us = lazy(() => import('./pages/Us'))
const Story = lazy(() => import('./pages/Story'))
const Memories = lazy(() => import('./pages/Memories'))
const TakeMeBack = lazy(() => import('./pages/TakeMeBack'))
const BucketList = lazy(() => import('./pages/BucketList'))
const Letters = lazy(() => import('./pages/Letters'))
const LoveWheel = lazy(() => import('./pages/LoveWheel'))
const LittleRoom = lazy(() => import('./pages/LittleRoom'))
const MemoryMap = lazy(() => import('./pages/MemoryMap'))

function Protected({ children }: { children: JSX.Element }) {
  const { loading, isMember, session } = useAuth()
  const loc = useLocation()
  if (loading) return <Spinner />
  if (!session || !isMember) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  return children
}

function NotConfigured() {
  return (
    <div className="mx-auto mt-24 max-w-xl rounded-3xl bg-white p-8 text-stone-700 shadow-soft">
      <h1 className="font-display text-2xl">Not configured 💞</h1>
      <p className="mt-3 text-sm">
        This page needs environment variables set up before it can run.
        In production (Cloudflare Pages), these must be configured in the
        Cloudflare dashboard under <strong>Environment variables</strong>:
        <br /><br />
        <code>VITE_SUPABASE_URL</code> — your Supabase project URL (e.g.{' '}
        <code>https://xxxx.supabase.co</code>)
        <br />
        <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> — your anon/public key
        <br /><br />
        See <code>.env.example</code> for reference. Once set, redeploy to apply.
      </p>
    </div>
  )
}

function PageSkeleton() {
  return <Spinner label="Loading…" />
}

export default function App() {
  useEffect(() => { syncServerClock() }, [])
  if (!isConfigured) {
    return (
      <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:24,background:'#fff5f7',textAlign:'center'}}>
        <h1 style={{fontFamily:'system-ui',fontSize:'24px',fontWeight:600,color:'#1e293b',marginBottom:16}}>Not configured 💞</h1>
        <p style={{fontFamily:'system-ui',fontSize:'14px',color:'#64748b'}}>Environment variables missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Cloudflare and redeploy.</p>
      </div>
    )
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Suspense fallback={<PageSkeleton />}><Home /></Suspense>} />
        <Route path="us" element={<Suspense fallback={<PageSkeleton />}><Us /></Suspense>} />
        <Route path="story" element={<Suspense fallback={<PageSkeleton />}><Story /></Suspense>} />
        <Route path="memories" element={<Suspense fallback={<PageSkeleton />}><Memories /></Suspense>} />
        <Route path="take-me-back" element={<Suspense fallback={<PageSkeleton />}><TakeMeBack /></Suspense>} />
        <Route path="bucket-list" element={<Suspense fallback={<PageSkeleton />}><BucketList /></Suspense>} />
        <Route path="letters" element={<Protected><Suspense fallback={<PageSkeleton />}><Letters /></Suspense></Protected>} />
        <Route path="love-wheel" element={<Protected><Suspense fallback={<PageSkeleton />}><LoveWheel /></Suspense></Protected>} />
        <Route path="little-room" element={<Protected><Suspense fallback={<PageSkeleton />}><LittleRoom /></Suspense></Protected>} />
        <Route path="memory-map" element={<Protected><Suspense fallback={<PageSkeleton />}><MemoryMap /></Suspense></Protected>} />
        <Route path="login" element={<Login />} />
        <Route path="admin/*" element={<Protected><Admin /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
