import { useMemo } from 'react'
import { Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { MemoryPlace } from '../../lib/types'

// Heart-shaped SVG icon URL-encoded for Leaflet custom icon
const HEART_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#e8899f" stroke="white" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
const HEART_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(HEART_SVG)}`

const defaultIcon = L.divIcon({
  html: `<img src="${HEART_URL}" style="width:28px;height:28px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))" />`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

interface Props {
  place: MemoryPlace
  isSelected?: boolean
  onSelect?: (id: string) => void
  onClick?: () => void
}

export function MemoryMarker({ place, isSelected, onSelect, onClick }: Props) {
  const icon = useMemo(() => {
    if (!isSelected) return defaultIcon
    // Selected state: larger heart with pulse glow
    return L.divIcon({
      html: `<img src="${HEART_URL}" style="width:36px;height:36px;filter:drop-shadow(0 2px 8px rgba(232,137,159,0.7))" />`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    })
  }, [isSelected])

  return (
    <>
      <Marker
        position={[place.latitude, place.longitude]}
        icon={icon}
        eventHandlers={{
          click: () => {
            onSelect?.(place.id)
            onClick?.()
          },
        }}
      >
        <Popup
          offset={[0, -10]}
          minWidth={200}
          maxWidth={280}
          closeButton={false}
        >
          <MemoryPopupContent place={place} />
        </Popup>
      </Marker>
      {/* Invisible wider hit area for easier mobile tapping */}
      <Marker
        position={[place.latitude, place.longitude]}
        icon={L.icon({ iconSize: [40, 40], iconAnchor: [20, 40] } as any)}
        eventHandlers={{ click: () => {} }}
        interactive={false}
      />
    </>
  )
}

function MemoryPopupContent({ place }: { place: MemoryPlace }) {
  return (
    <div className="memory-popup min-w-[180px]">
      <p className="font-script text-blush-500 text-sm">{place.title}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{place.location_name}</p>
      {place.image_paths[0] && (
        <img
          src={place.image_paths[0]}
          alt={place.title}
          className="mt-2 w-full h-24 object-cover rounded-lg"
        />
      )}
      <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 line-clamp-2">
        {place.description}
      </p>
      <p className="text-[10px] text-stone-400 mt-1">{place.category} · {new Date(place.memory_date).toLocaleDateString()}</p>
    </div>
  )
}

// Hook to detect clicks on empty map space (for adding new memory)
export function MapClickHandler({ onMapClick, isActive }: { onMapClick: (latlng: L.LatLng) => void; isActive: boolean }) {
  useMapEvents({
    click(e) {
      if (isActive) onMapClick(e.latlng)
    },
  })
  return null
}
