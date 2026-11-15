import { useState } from 'react'
import { Film, VideoOff } from 'lucide-react'

/** Poster-frame thumbnail for a video, with a placeholder if the file can't be loaded. */
export function VideoThumb({ src, className = '' }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className={`flex min-h-32 w-full flex-col items-center justify-center gap-1 rounded-[1.25rem] bg-blush-100/60 p-3 text-xs text-stone-500 dark:bg-white/5 ${className}`}>
        <VideoOff className="h-6 w-6 text-blush-300" /> Video unavailable
      </div>
    )
  }
  return (
    <div className={`relative overflow-hidden rounded-[1.25rem] bg-black/5 ${className}`}>
      <video
        src={`${src}#t=0.5`}
        preload="metadata"
        muted
        playsInline
        onError={() => setFailed(true)}
        className="h-full min-h-32 w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="rounded-full bg-black/50 p-3 text-white"><Film className="h-5 w-5" /></span>
      </span>
    </div>
  )
}
