import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { SafeImage } from './ui'

type Dir = 'up' | 'down' | 'left' | 'right' | 'none'

/**
 * Fades/slides content in when it enters the viewport and out when it
 * leaves — in BOTH scroll directions (viewport.once = false).
 */
export function Reveal({
  children,
  dir = 'up',
  delay = 0,
  className = '',
}: {
  children: ReactNode
  dir?: Dir
  delay?: number
  className?: string
}) {
  const off = 36
  const from = {
    up: { y: off, x: 0 },
    down: { y: -off, x: 0 },
    left: { x: off, y: 0 },
    right: { x: -off, y: 0 },
    none: { x: 0, y: 0 },
  }[dir]
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...from }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: false, amount: 0.2, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Image that unveils each time it scrolls into view (fade + settle). Deliberately NOT a clip-path
 * reveal: a clipped ancestor can stop browsers from ever lazy-loading the picture inside it.
 */
export function ImageReveal({ src, alt, className = '', onClick }: { src: string; alt: string; className?: string; onClick?: () => void }) {
  return (
    <motion.div
      className={`overflow-hidden rounded-[1.25rem] ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
    >
      <motion.div
        initial={{ scale: 1.14 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <SafeImage src={src} alt={alt} imgClassName="transition-transform duration-700 group-hover:scale-105" />
      </motion.div>
    </motion.div>
  )
}

/** Gentle parallax: moves at a different speed than the scroll. */
export function Parallax({ children, speed = 40, className = '' }: { children: ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed])
  return (
    <motion.div ref={ref} style={{ y, willChange: 'transform' }} className={className}>
      {children}
    </motion.div>
  )
}
