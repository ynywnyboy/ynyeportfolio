import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DoorOpeningTransition } from '../components/door/DoorOpeningTransition'
import { shouldShowDoorOnLoad } from '../lib/door'
import { usePlayer } from './PlayerContext'

interface DoorState {
  /** Show the entrance again (and go to the homepage). */
  replay: () => void
  showing: boolean
}

const Ctx = createContext<DoorState | null>(null)

/**
 * Owns the door overlay. Mount it inside BrowserRouter and PlayerProvider, wrapping <App />.
 * - Decided once, on first load only: so moving between pages never brings the door back.
 * - Never shows during an auth redirect / password-recovery link.
 * - The app is rendered underneath at all times, so auth, realtime and the music player are untouched.
 */
export function DoorProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate()
  const loc = useLocation()
  const { play } = usePlayer()
  const [showing, setShowing] = useState(() =>
    typeof window === 'undefined' ? false : shouldShowDoorOnLoad(loc.pathname, loc.search, loc.hash),
  )
  const [entered, setEntered] = useState(false)
  const appRef = useRef<HTMLDivElement>(null)

  // While the door is waiting for a tap, nothing behind it can be tabbed to or read out.
  useEffect(() => {
    const el = appRef.current
    if (!el) return
    if (showing && !entered) el.setAttribute('inert', '')
    else el.removeAttribute('inert')
    return () => el.removeAttribute('inert')
  }, [showing, entered])

  const replay = useCallback(() => {
    setEntered(false)
    nav('/')
    setShowing(true)
    window.scrollTo?.(0, 0)
  }, [nav])

  const onEnter = useCallback(() => {
    setEntered(true)
    // The tap is a user gesture: if the browser blocked autoplay, this is the moment music may start.
    // Browsers block autoplay until a tap, so this tap starts the music on every visit.
    play()
  }, [play])

  const onDone = useCallback(() => { setShowing(false); setEntered(true) }, [])

  const value = useMemo(() => ({ replay, showing }), [replay, showing])

  return (
    <Ctx.Provider value={value}>
      <div ref={appRef}>{children}</div>
      {showing && <DoorOpeningTransition onDone={onDone} onEnter={onEnter} />}
    </Ctx.Provider>
  )
}

export function useDoor() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useDoor must be used inside DoorProvider')
  return c
}
