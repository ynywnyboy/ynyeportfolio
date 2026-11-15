import React from 'react'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </React.StrictMode>,
)
