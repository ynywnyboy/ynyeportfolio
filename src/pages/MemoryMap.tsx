import MemoryMapView from '../components/memory-map/MemoryMapView'

export default function MemoryMapPage() {
  return (
    <div className="min-h-screen">
      <div className="px-4 pt-6 pb-2 lg:px-8">
        <h1 className="font-display text-3xl text-stone-800 dark:text-stone-100">
          Our Memory Map 💞
        </h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          Map every special place you've shared together
        </p>
      </div>
      <MemoryMapView />
    </div>
  )
}
