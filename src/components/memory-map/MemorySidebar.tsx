import { useState } from 'react'
import { MapPin, Search, Filter, X } from 'lucide-react'
import { MEMORY_CATEGORIES, type MemoryPlace, type MemoryCategory } from '../../lib/types'

interface Props {
  places: MemoryPlace[]
  selectedId: string | null
  onSelect: (place: MemoryPlace) => void
  onAdd: () => void
}

export function MemorySidebar({ places, selectedId, onSelect, onAdd }: Props) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const [showFilters, setShowFilters] = useState(false)

  const filtered = places
    .filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
          !p.location_name.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'date') return new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime()
      return a.title.localeCompare(b.title)
    })

  const todayMemories = places.filter(p => p.memory_date === new Date().toISOString().split('T')[0])

  return (
    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col h-full bg-white/90 dark:bg-night-900/90 backdrop-blur border-r border-blush-100 dark:border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-blush-100 dark:border-white/10">
        <h2 className="font-display text-xl text-stone-800 dark:text-stone-100">Our Journey 🗺️</h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
          {places.length} place{places.length !== 1 ? 's' : ''} captured
        </p>
      </div>

      {/* Search & Filters */}
      <div className="p-4 space-y-3 border-b border-blush-100 dark:border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-blush-200 dark:border-white/10 bg-white/70 dark:bg-night-800/70 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blush-400"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              showFilters
                ? 'bg-blush-500 text-white'
                : 'bg-blush-50 dark:bg-white/10 text-stone-600 dark:text-stone-300'
            }`}
          >
            <Filter className="h-3 w-3" />
            Filters
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'date' | 'name')}
            className="ml-auto text-xs px-2 py-1.5 rounded-full bg-blush-50 dark:bg-white/10 text-stone-600 dark:text-stone-300 border-0 focus:outline-none"
          >
            <option value="date">Newest first</option>
            <option value="name">A-Z</option>
          </select>
        </div>
        {showFilters && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            <button
              onClick={() => setCategoryFilter('All')}
              className={`px-2.5 py-1 rounded-full text-xs transition ${
                categoryFilter === 'All'
                  ? 'bg-blush-500 text-white'
                  : 'bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300'
              }`}
            >
              All
            </button>
            {MEMORY_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-full text-xs transition ${
                  categoryFilter === cat
                    ? 'bg-blush-500 text-white'
                    : 'bg-stone-100 dark:bg-white/10 text-stone-600 dark:text-stone-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {todayMemories.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-wider text-blush-500 mb-2">Today's Memories</p>
            {todayMemories.map(place => (
              <MemoryItem
                key={place.id}
                place={place}
                isSelected={selectedId === place.id}
                onClick={() => onSelect(place)}
              />
            ))}
          </div>
        )}

        <p className="text-xs font-medium uppercase tracking-wider text-stone-400 mb-2">All Places</p>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-stone-400 dark:text-stone-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No memories found</p>
            <p className="text-xs mt-1">Click "Add Memory" to save your first!</p>
          </div>
        ) : (
          filtered.map(place => (
            <MemoryItem
              key={place.id}
              place={place}
              isSelected={selectedId === place.id}
              onClick={() => onSelect(place)}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <div className="p-4 border-t border-blush-100 dark:border-white/10">
        <button
          onClick={onAdd}
          className="w-full btn-primary py-3"
        >
          <MapPin className="h-4 w-4" />
          Add Memory
        </button>
      </div>
    </div>
  )
}

function MemoryItem({ place, isSelected, onClick }: { place: MemoryPlace; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition ${
        isSelected
          ? 'bg-blush-100 dark:bg-blush-900/30 ring-2 ring-blush-400'
          : 'hover:bg-stone-50 dark:hover:bg-white/5'
      }`}
    >
      <div className="flex items-start gap-3">
        {place.image_paths[0] ? (
          <img
            src={place.image_paths[0]}
            alt=""
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-blush-100 dark:bg-blush-900/30 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-blush-400" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-stone-800 dark:text-stone-100 truncate">{place.title}</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{place.location_name}</p>
          <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
            {new Date(place.memory_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </button>
  )
}
