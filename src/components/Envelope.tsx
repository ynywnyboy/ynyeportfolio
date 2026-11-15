import { motion } from 'motion/react'
import { Lock, Heart } from 'lucide-react'

/** Envelope with a flap that opens (rotates back) and a letter that slides out. */
export function Envelope({ locked, open, title, children }: { locked?: boolean; open?: boolean; title?: string; children?: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[3/2] w-full max-w-sm" style={{ perspective: 900 }}>
      {/* back */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-200 to-blush-300 shadow-soft dark:from-blush-600/60 dark:to-blush-600/40" />
      {/* letter */}
      <motion.div
        className="absolute inset-x-4 top-3 flex h-[85%] items-start justify-center overflow-hidden rounded-xl bg-cream-50 p-3 text-center shadow dark:bg-night-800"
        initial={false}
        animate={{ y: open ? -46 : 0 }}
        transition={{ type: 'spring', damping: 16, delay: open ? 0.45 : 0 }}
      >
        <span className="font-script text-lg text-blush-500">{title}</span>
      </motion.div>
      {/* front pocket */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blush-100 to-blush-200 dark:from-blush-600/30 dark:to-blush-600/20" style={{ clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)' }} />
      {/* flap */}
      <motion.div
        className="envelope-flap absolute inset-x-0 top-0 h-[55%] rounded-t-2xl bg-gradient-to-b from-blush-300 to-blush-200 dark:from-blush-600/70 dark:to-blush-600/50"
        style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        initial={false}
        animate={{ rotateX: open ? 180 : 0, zIndex: open ? 0 : 5 }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      />
      {/* seal */}
      <motion.div
        className="absolute left-1/2 top-[48%] z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blush-500 text-white shadow"
        animate={{ scale: open ? 0 : 1, opacity: open ? 0 : 1 }}
      >
        {locked ? <Lock className="h-4 w-4" /> : <Heart className="h-4 w-4 fill-white" />}
      </motion.div>
      {children}
    </div>
  )
}
