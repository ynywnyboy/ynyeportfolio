import { useEffect, useRef } from 'react'
import { useSite } from '../context/SiteContext'
import { motionFactor } from '../lib/appearance'
import { createEngine } from '../lib/bgEffects'
import { isLowEnd } from '../lib/perf'
import { usePageVisible } from '../lib/a11y'

/**
 * Animated background (rain, petals, snow, stars, fireflies, waves).
 * A single canvas behind the page content: pointer-events are off so it never blocks clicks or
 * scrolling. The loop is stopped while the tab is hidden, on weak devices it runs at ~30fps with
 * half the particles, and reduced-motion / "pause on this device" remove it completely.
 */
export function BackgroundEffect() {
  const { appearance, isDark, theme, motionAllowed } = useSite()
  const visible = usePageVisible()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fx = appearance.effect
  const factor = motionFactor(appearance.motion)
  const active = fx.enabled && fx.kind !== 'none' && factor > 0 && motionAllowed && visible

  useEffect(() => {
    const canvas = canvasRef.current
    if (!active || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const low = isLowEnd()
    const dpr = Math.min(window.devicePixelRatio || 1, low ? 1 : 1.5)

    const style = getComputedStyle(document.documentElement)
    const pal = (n: number) => style.getPropertyValue(`--blush-${n}`).trim() || '232 137 159'
    const params = {
      kind: fx.kind, speed: fx.speed, density: fx.density, opacity: fx.opacity, intensity: fx.intensity,
      factor, dark: isDark, low, b200: pal(200), b300: pal(300), b400: pal(400),
    }

    let w = window.innerWidth
    let h = window.innerHeight
    const fit = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    fit()
    const engine = createEngine(ctx, w, h, params)

    let raf = 0
    let last = performance.now()
    let t = 0
    const minGap = low ? 1000 / 30 : 0
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (now - last < minGap) return
      const dt = Math.min(0.05, (now - last) / 1000) * fx.speed
      last = now
      t += dt
      engine.frame(dt, t)
    }
    raf = requestAnimationFrame(loop)

    let timer: ReturnType<typeof setTimeout> | undefined
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => { fit(); engine.resize(w, h) }, 150)
    }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    // theme.accent: re-read the palette when the accent colour changes
  }, [active, fx.kind, fx.speed, fx.density, fx.opacity, fx.intensity, factor, isDark, theme.accent])

  if (!active) return null
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />
}
