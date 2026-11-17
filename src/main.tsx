import React, { Component, type ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { SiteProvider } from './context/SiteContext'
import { PlayerProvider } from './context/PlayerContext'
import { DoorProvider } from './context/DoorContext'
import './index.css'
import 'leaflet/dist/leaflet.css'

class CatchBox extends Component<{ children: ReactNode }> {
  state = { err: null as string | null }
  static getDerivedStateFromError(e: unknown) { return { err: String(e) } }
  render() {
    if (this.state.err) return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#fff5f7' }}>
        <div style={{ maxWidth: 480, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#e11d48', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.08em' }}>Application error</p>
          <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{this.state.err}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 20px', borderRadius: 999, border: 'none', background: '#e11d48', color: '#fff', cursor: 'pointer', fontSize: 14 }}>Reload</button>
        </div>
      </div>
    )
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CatchBox>
        <ToastProvider>
          <AuthProvider>
            <SiteProvider>
              <PlayerProvider>
                <DoorProvider>
                  <App />
                </DoorProvider>
              </PlayerProvider>
            </SiteProvider>
          </AuthProvider>
        </ToastProvider>
      </CatchBox>
    </BrowserRouter>
  </React.StrictMode>,
)