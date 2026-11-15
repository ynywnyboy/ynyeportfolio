import type { OpeningKind } from './appearance'
export type { OpeningKind }

export interface OpeningOptionInfo {
  id: OpeningKind
  label: string
  emoji: string
  category: 'Interactive' | 'Modern' | 'Classic'
  description: string
}

export const OPENING_OPTIONS: OpeningOptionInfo[] = [
  // Classic / Default
  { id: 'door', label: 'Magic Door', emoji: '🚪', category: 'Classic', description: 'The original magical door that swings open to reveal your world.' },
  { id: 'disabled', label: 'Disabled (No Intro)', emoji: '🚫', category: 'Classic', description: 'Skip the intro entirely and open directly to the home page.' },

  // Interactive Openings
  { id: 'envelope', label: 'Love Envelope', emoji: '💌', category: 'Interactive', description: 'An elegant love letter envelope slides in, opens, and unfolds.' },
  { id: 'gift', label: 'Gift Box', emoji: '🎁', category: 'Interactive', description: 'A ribbon unties and the gift box pops open with confetti.' },
  { id: 'book', label: 'Story Book', emoji: '📖', category: 'Interactive', description: 'A fairytale storybook opens up, revealing your memories like chapters.' },
  { id: 'polaroid', label: 'Polaroid Photo', emoji: '📷', category: 'Interactive', description: 'A vintage photo develops from a blank frame and expands into view.' },
  { id: 'curtain', label: 'Stage Curtains', emoji: '🎭', category: 'Interactive', description: 'Velvet curtains smoothly part to reveal your little world.' },
  { id: 'window', label: 'Cozy Window', emoji: '🪟', category: 'Interactive', description: 'A window opens overlooking a romantic starry view into the site.' },

  // Modern Animations
  { id: 'liquid-glass', label: 'Liquid Glass', emoji: '🫧', category: 'Modern', description: 'A bubbly refractive glass lens expands across the screen.' },
  { id: 'dreamy-fade', label: 'Dreamy Fade', emoji: '✨', category: 'Modern', description: 'Soft glowing lights, gentle blur, and an ethereal fade-in.' },
  { id: 'cinematic', label: 'Cinematic Zoom', emoji: '🎬', category: 'Modern', description: 'A smooth, dramatic depth zoom with subtle motion parallax.' },
  { id: 'particle', label: 'Particle Vortex', emoji: '🌟', category: 'Modern', description: 'Floating stardust and golden particles gather and crystallize.' },
  { id: 'bubble-pop', label: 'Bubble Pop', emoji: '🫧', category: 'Modern', description: 'Playful floating bubbles expand and gently dissolve into the page.' },
  { id: 'sliding-panels', label: 'Sliding Panels', emoji: '🚪', category: 'Modern', description: 'Sleek geometric panels slide apart in opposite directions.' },
  { id: 'heart', label: 'Heart Formation', emoji: '💗', category: 'Modern', description: 'Small floating hearts converge and burst open to reveal your world.' },
]
