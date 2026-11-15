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
      <h1 className="font-display text-2xl">Almost there 💞</h1>
      <p className="mt-3 text-sm">
        Supabase isn't connected yet. Create <code>.env.local</code> from <code>.env.example</code>, add your project URL and
        public anon key, run <code>supabase/schema.sql</code>, then restart <code>npm run dev</code>. Full steps are in the README.
      </p>
    </div>
  )
}

function PageSkeleton() {
  return <Spinner label="Loading…" />
}

export default function App() {
  useEffect(() => { syncServerClock() }, [])
  if (!isConfigured) return <NotConfigured />
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
