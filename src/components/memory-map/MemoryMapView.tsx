import { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { motion, AnimatePresence } from 'motion/react'
import { MapPin, Plus } from 'lucide-react'
import { useTable, insertRow } from '../../lib/data'
import { uploadFile, publicUrl } from '../../lib/storage'
import { BUCKET } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { MemoryMarker, MapClickHandler } from './MemoryMarker'
import { MemoryForm } from './MemoryForm'
import { MemoryDetails } from './MemoryDetails'
import { MemorySidebar } from './MemorySidebar'
import { type MemoryPlace } from '../../lib/types'
import '../../index.css'

// Import leaflet CSS
import 'leaflet/dist/leaflet.css'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

export default function MemoryMapView() {
  const { user, isMember } = useAuth()
  const toast = useToast()
  const mapRef = useRef<L.Map | null>(null)

  // Load all memory places using existing useTable hook
  const { rows: places, loading, error, reload } = useTable<MemoryPlace>('memory_places', 'id', {
    orderBy: 'memory_date',
    ascending: false,
    enabled: isMember,
  })

  // State
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'closed' | 'add' | 'edit'>('closed')
  const [editingPlace, setEditingPlace] = useState<MemoryPlace | null>(null)
  const [detailsPlace, setDetailsPlace] = useState<MemoryPlace | null>(null)
  const [addingLatLng, setAddingLatLng] = useState<L.LatLng | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Fit map to show all markers
  const fitBounds = useCallback(() => {
    if (!mapRef.current || places.length === 0) return
    const group = L.featureGroup(places.map(p => L.marker([p.latitude, p.longitude])))
    mapRef.current.fitBounds(group.getBounds().pad(0.1))
  }, [places])

  useEffect(() => {
    setTimeout(fitBounds, 300)
  }, [fitBounds, places.length])

  const handleSelect = useCallback((placeId: string) => {
    const place = places.find(p => p.id === placeId)
    if (place) {
      setSelectedId(placeId)
      setDetailsPlace(place)
      // Fly to marker
      if (mapRef.current) {
        mapRef.current.flyTo([place.latitude, place.longitude], 14, { duration: 0.8 })
      }
    }
  }, [places])

  const handleMapClick = useCallback((latlng: L.LatLng) => {
    setAddingLatLng(latlng)
    setFormMode('add')
    setEditingPlace(null)
  }, [])

  const handleEdit = useCallback((place: MemoryPlace) => {
    setEditingPlace(place)
    setAddingLatLng(L.latLng(place.latitude, place.longitude))
    setFormMode('edit')
    setDetailsPlace(null)
  }, [])

  const handleDelete = useCallback(() => {
    setSelectedId(null)
    setDetailsPlace(null)
    setTimeout(reload, 100)
  }, [reload])

  const handleSave = useCallback(() => {
    setTimeout(reload, 100)
  }, [reload])

  // Build connection line between chronologically ordered places
  const sortedPlaces = [...places].sort((a, b) =>
    new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
  )
  const journeyLine = sortedPlaces.length > 1
    ? sortedPlaces.map(p => [p.latitude, p.longitude] as [number, number])
    : []

  if (!isMember) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <MapPin className="h-12 w-12 text-blush-300 mb-4" />
        <h2 className="font-display text-2xl text-stone-800 dark:text-stone-100">Memory Map</h2>
        <p className="mt-2 text-stone-500 dark:text-stone-400 max-w-md">
          Sign in to explore and save your special places together.
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-[1000] btn-ghost px-3 py-2 text-sm"
      >
        {sidebarOpen ? 'Close List' : 'Memories'}
      </button>

      {/* Sidebar overlay on mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="lg:hidden fixed inset-0 z-[999] bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'fixed inset-y-0 left-0 z-[1001] w-full lg:w-auto lg:relative lg:inset-auto lg:z-auto' : 'hidden lg:flex'}
        flex-shrink-0
      `}>
        <MemorySidebar
          places={places}
          selectedId={selectedId}
          onSelect={(place) => {
            handleSelect(place.id)
            setSidebarOpen(false)
          }}
          onAdd={() => {
            setFormMode('add')
            setEditingPlace(null)
            setSidebarOpen(false)
          }}
        />
      </div>

      {/* Map area */}
      <div className="flex-1 relative h-[60vh] lg:h-screen">
        <MapContainer
          ref={mapRef}
          center={[37.7749, -122.4194]} // Default to SF
          zoom={12}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution={TILE_ATTR}
            url={TILE_URL}
          />

          {/* Connection line */}
          {journeyLine.length > 1 && (
            <Polyline
              positions={journeyLine}
              color="rgb(var(--blush-400))"
              weight={2}
              dashArray="8, 12"
              opacity={0.6}
            />
          )}

          {/* Markers */}
          {places.map(place => (
            <MemoryMarker
              key={place.id}
              place={place}
              isSelected={selectedId === place.id}
              onSelect={handleSelect}
              onClick={() => setDetailsPlace(place)}
            />
          ))}

          {/* Click handler for adding */}
          <MapClickHandler
            onMapClick={handleMapClick}
            isActive={formMode === 'add' || (formMode === 'closed' && !selectedId)}
          />

          {/* Zoom control positioned bottom-right */}
          <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2">
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="btn-ghost p-2"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="btn-ghost p-2"
            >
              <span className="text-lg leading-none">−</span>
            </button>
          </div>
        </MapContainer>

        {/* Floating add button */}
        <button
          onClick={() => {
            setFormMode('add')
            setEditingPlace(null)
            setAddingLatLng(null)
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] btn-primary px-6 py-3 shadow-lg"
        >
          <MapPin className="h-4 w-4" />
          Add Memory
        </button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {(formMode === 'add' || formMode === 'edit') && (
          <MemoryForm
            place={editingPlace}
            initialLatLng={addingLatLng}
            onClose={() => setFormMode('closed')}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>

      {/* Details modal */}
      <AnimatePresence>
        {detailsPlace && (
          <MemoryDetails
            place={detailsPlace}
            onClose={() => setDetailsPlace(null)}
            onEdit={() => handleEdit(detailsPlace)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <div className="absolute top-4 right-4 z-[400] bg-white/90 dark:bg-night-800/90 px-4 py-2 rounded-full text-sm text-stone-600 dark:text-stone-300">
          Loading memories...
        </div>
      )}
    </div>
  )
}
