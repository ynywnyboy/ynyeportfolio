import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { errMsg } from '../lib/data'
import { Field } from '../components/ui'

export default function Login() {
  const { signIn, resetPassword, updatePassword, recovering, session, isMember, loading } = useAuth()
  const toast = useToast()
  const nav = useNavigate()
  const loc = useLocation() as { state?: { from?: string } }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPass, setNewPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<'in' | 'reset'>('in')
  const [error, setError] = useState<string | null>(null)

  if (!loading && session && isMember && !recovering) return <Navigate to={loc.state?.from ?? '/admin'} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Please enter a valid email address.')
    setBusy(true)
    try {
      if (mode === 'in') {
        if (password.length < 6) throw new Error('Password must be at least 6 characters.')
        await signIn(email, password)
        nav(loc.state?.from ?? '/admin', { replace: true })
      } else {
        await resetPassword(email)
        toast('If that email is registered, a reset link is on its way.', 'info')
        setMode('in')
      }
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  const setPass = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newPass.length < 8) return setError('Choose a password with at least 8 characters.')
    setBusy(true)
    try {
      await updatePassword(newPass)
      toast('Password updated 💕')
      nav('/admin', { replace: true })
    } catch (err) {
      setError(errMsg(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-md">
      <div className="card p-8">
        <div className="mb-6 text-center">
          <Heart className="mx-auto mb-2 h-8 w-8 fill-blush-300 text-blush-400" />
          <h1 className="h-display text-3xl">{recovering ? 'Choose a new password' : mode === 'in' ? 'Welcome home' : 'Reset password'}</h1>
          <p className="mt-1 text-sm text-stone-500">Only the two of you can sign in here.</p>
        </div>

        {recovering ? (
          <form onSubmit={setPass} className="space-y-4">
            <Field label="New password">
              <input className="input" type="password" autoComplete="new-password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
            </Field>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save password</button>
          </form>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            {mode === 'in' && (
              <Field label="Password">
                <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </Field>
            )}
            {session && !isMember && !loading && (
              <p className="text-sm text-red-600" role="alert">This account isn’t authorized for this site.</p>
            )}
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {mode === 'in' ? 'Sign in' : 'Send reset link'}
            </button>
            <button type="button" className="w-full text-center text-sm text-blush-600 hover:underline" onClick={() => { setMode(mode === 'in' ? 'reset' : 'in'); setError(null) }}>
              {mode === 'in' ? 'Forgot your password?' : 'Back to sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
