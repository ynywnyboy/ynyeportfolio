import { motion, AnimatePresence } from 'motion/react'
import { X, MapPin, Calendar, Tag, Edit, Trash2 } from 'lucide-react'
import { deleteRow, errMsg } from '../../lib/data'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import type { MemoryPlace } from '../../lib/types'

interface Props {
  place: MemoryPlace
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function MemoryDetails({ place, onClose, onEdit, onDelete }: Props) {
  const { user } = useAuth()
  const toast = useToast()
  const isOwner = place.created_by === user?.id

  const handleDelete = async () => {
    if (!confirm('Delete this memory? This cannot be undone.')) return
    try {
      await deleteRow('memory_places', 'id', place.id)
      toast('Memory deleted')
      onDelete()
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg bg-white dark:bg-night-900 rounded-3xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Hero image */}
          <div className="relative h-48 bg-blush-100 dark:bg-blush-900/30">
            {place.image_paths[0] ? (
              <img
                src={place.image_paths[0]}
                alt={place.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <MapPin className="h-12 w-12 text-blush-300" />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full bg-white/80 dark:bg-night-800/80 p-2 hover:bg-white transition"
            >
              <X className="h-5 w-5 text-stone-600 dark:text-stone-300" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-script text-xl text-blush-500">{place.category}</p>
                <h2 className="font-display text-2xl text-stone-800 dark:text-stone-100 mt-1">
                  {place.title}
                </h2>
                <div className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{place.location_name}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {isOwner && (
                  <>
                    <button
                      onClick={onEdit}
                      className="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-stone-600 dark:text-stone-300" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{new Date(place.memory_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>{place.category}</span>
              </div>
            </div>

            {place.description && (
              <p className="mt-4 text-stone-700 dark:text-stone-300 leading-relaxed">
                {place.description}
              </p>
            )}

            {/* Photo gallery */}
            {place.image_paths.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-2">
                {place.image_paths.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${place.title} ${i + 1}`}
                    className="w-full h-24 object-cover rounded-xl"
                  />
                ))}
              </div>
            )}

            <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
              📍 {place.latitude.toFixed(5)}, {place.longitude.toFixed(5)}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
