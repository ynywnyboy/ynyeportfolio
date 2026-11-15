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
import eruda from 'eruda'
eruda.init()

// Polyfill for Canvas roundRect (iOS < 15.4)
if (typeof window !== 'undefined' && window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r: number | number[]) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.moveTo(x + r[0], y);
    this.arcTo(x + w, y, x + w, y + h, r[1]);
    this.arcTo(x + w, y + h, x, y + h, r[2]);
    this.arcTo(x, y + h, x, y, r[3]);
    this.arcTo(x, y, x + w, y, r[0]);
    this.closePath();
    return this;
  };
}

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
