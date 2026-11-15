export interface Versioned {
  version: number
  updated_at: string
}

export interface Settings extends Versioned {
  id: number
  name_one: string
  name_two: string
  anniversary: string
  welcome_message: string
  featured_photo_path: string | null
  is_public: boolean
  theme: { accent: string; mode: 'light' | 'dark' | 'system'; particles: boolean; appearance?: unknown; saved?: unknown; id_card_path?: string | null; lanyard_color?: string; swing_intensity?: number; resting_rotation?: number }
  excluded_album_ids: string[]
}

export interface CustomField {
  label: string
  value: string
}

export interface Bio extends Versioned {
  slot: 1 | 2
  nickname: string
  full_name: string
  birthday: string | null
  avatar_path: string | null
  bio: string
  personality: string
  hobbies: string[]
  favorite_music: string
  favorite_food: string
  favorite_memories: string
  custom_fields: CustomField[]
}

export interface Album extends Versioned {
  id: string
  name: string
  description: string
  category: string
  cover_media_id: string | null
  exclude_from_random: boolean
  created_at: string
}

export interface Media extends Versioned {
  id: string
  album_id: string | null
  kind: 'image' | 'video'
  storage_path: string
  caption: string
  description: string
  taken_at: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

export interface TimelineEvent extends Versioned {
  id: string
  title: string
  event_date: string
  description: string
  photo_paths: string[]
  video_path: string | null
  decoration: string
  position: number
  created_at: string
}

export interface Track extends Versioned {
  id: string
  title: string
  artist: string
  source_kind: 'file' | 'url' | 'embed'
  audio_path: string | null
  audio_url: string | null
  embed_url: string | null
  artwork_path: string | null
  position: number
  created_at: string
}

export const BUCKET_CATEGORIES = [
  'Travel',
  'Dates',
  'Food',
  'Adventures',
  'Celebrations',
  'Personal Goals',
  'Future Dreams',
] as const
export type BucketCategory = (typeof BUCKET_CATEGORIES)[number]

export interface BucketItem extends Versioned {
  id: string
  title: string
  description: string
  category: BucketCategory
  target_date: string | null
  cover_path: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
}

export interface Letter extends Versioned {
  id: string
  author_id: string
  title: string
  audience: 'self' | 'partner' | 'both'
  status: 'draft' | 'sealed'
  unlock_at: string | null
  sealed_at: string | null
  created_at: string
}

export interface LetterBody {
  letter_id: string
  body: string
  photo_paths: string[]
}

/* ---- Memory Map ---- */
export const MEMORY_CATEGORIES = [
  'First Meeting',
  'First Date',
  'Restaurants',
  'Travel',
  'Adventures',
  'Special Moments',
  'Favorite Places',
  'Other',
] as const
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number]

export interface MemoryPlace extends Versioned {
  id: string
  title: string
  description: string
  location_name: string
  latitude: number
  longitude: number
  category: string
  memory_date: string
  image_paths: string[]
  created_by: string
  created_at: string
}

export interface Member {
  user_id: string
  email: string
  slot: 1 | 2
}

/* ---- Spin the Love Wheel ---- */
export interface WheelSet extends Versioned {
  id: string
  name: string
  emoji: string
  position: number
  created_at: string
}

export interface WheelOption extends Versioned {
  id: string
  wheel_id: string
  category: string
  label: string
  emoji: string
  enabled: boolean
  position: number
  created_at: string
}

export type WheelStatus = 'spun' | 'done' | 'skipped'

export interface WheelSpin extends Versioned {
  id: string
  wheel_id: string | null
  wheel_name: string
  option_id: string | null
  label: string
  emoji: string
  category: string
  status: WheelStatus
  spun_by: string | null
  created_at: string
}
