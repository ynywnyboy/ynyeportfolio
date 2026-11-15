import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Plus, Trash2, Upload } from 'lucide-react'
import { insertRow, updateRow, errMsg } from '../../lib/data'
import { uploadFile, publicUrl } from '../../lib/storage'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { BUCKET } from '../../lib/supabase'
import { MEMORY_CATEGORIES, type MemoryPlace } from '../../lib/types'
import type L from 'leaflet'

interface Props {
  place?: MemoryPlace | null
  initialLatLng?: L.LatLng | null
  onClose: () => void
  onSave: () => void
}

export function MemoryForm({ place, initialLatLng, onClose, onSave }: Props) {
  const { user } = useAuth()
  const toast = useToast()
  const isEdit = !!place

  const [title, setTitle] = useState(place?.title ?? '')
  const [locationName, setLocationName] = useState(place?.location_name ?? '')
  const [description, setDescription] = useState(place?.description ?? '')
  const [category, setCategory] = useState(place?.category ?? 'Other')
  const [date, setDate] = useState(place?.memory_date ?? new Date().toISOString().split('T')[0])
  const [images, setImages] = useState<string[]>(place?.image_paths ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latlng, setLatlng] = useState<L.LatLng | null>(initialLatLng ?? null)

  const validate = (): boolean => {
    if (!title.trim()) { setError('Please enter a title'); return false }
    if (!locationName.trim()) { setError('Please enter a location name'); return false }
    if (!latlng) { setError('Please select a location on the map'); return false }
    setError(null)
    return true
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const paths = await Promise.all(Array.from(files).map(async (file) => {
        const path = await uploadFile(file, user!.id)
        return publicUrl(path)
      }))
      setImages(prev => [...prev, ...paths])
    } catch (err) {
      toast(errMsg(err), 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || !user) return

    try {
      if (isEdit && place) {
        await updateRow<MemoryPlace>('memory_places', 'id', place.id, place.version, {
          title: title.trim(),
          location_name: locationName.trim(),
          description: description.trim(),
          category,
          memory_date: date,
          image_paths: images,
          latitude: latlng!.lat,
          longitude: latlng!.lng,
        })
        toast('Memory updated 💕')
      } else {
        await insertRow<MemoryPlace>('memory_places', {
          title: title.trim(),
          location_name: locationName.trim(),
          description: description.trim(),
          category,
          memory_date: date,
          image_paths: images,
          latitude: latlng!.lat,
          longitude: latlng!.lng,
          created_by: user.id,
        })
        toast('Memory saved 📍')
      }
      onSave()
      onClose()
    } catch (err) {
      toast(errMsg(err), 'error')
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-night-900 shadow-2xl p-6"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-stone-100 dark:hover:bg-white/10 transition"
          >
            <X className="h-5 w-5 text-stone-500" />
          </button>

          <h2 className="font-display text-2xl text-stone-800 dark:text-stone-100 mb-1">
            {isEdit ? 'Edit Memory' : 'Save a Memory'}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
            {isEdit ? 'Update your memory location' : 'Capture a special place in your journey together'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="label">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., First coffee together"
                className="input"
                required
              />
            </div>

            {/* Location Name */}
            <div>
              <label className="label">Location Name *</label>
              <input
                type="text"
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="e.g., Blue Bottle Coffee, Portland"
                className="input"
                required
              />
            </div>

            {/* Coordinates display */}
            {latlng && (
              <div className="rounded-xl bg-blush-50 dark:bg-blush-900/20 px-4 py-2 text-xs text-stone-600 dark:text-stone-400">
                📍 {latlng.lat.toFixed(5)}, {latlng.lng.toFixed(5)}
              </div>
            )}

            {/* Category & Date row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input"
                >
                  {MEMORY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Tell the story behind this place..."
                className="input resize-none"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="label">Photos</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-blush-300 dark:border-blush-600 flex flex-col items-center justify-center cursor-pointer hover:border-blush-500 transition-colors">
                  <Upload className="h-5 w-5 text-stone-400" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && <p className="text-xs text-stone-500">Uploading...</p>}
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                {isEdit ? 'Update Memory' : 'Save Memory'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
