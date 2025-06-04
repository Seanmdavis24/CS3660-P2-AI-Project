export const DEFAULT_STYLES = [
  { 
    id: 'cartoon', 
    name: 'Cartoon', 
    emoji: '🎨', 
    description: 'Bright, animated style',
    color: 'from-yellow-400 to-orange-400'
  },
  { 
    id: 'anime', 
    name: 'Anime', 
    emoji: '🌸', 
    description: 'Japanese animation style',
    color: 'from-pink-400 to-purple-400'
  },
  { 
    id: 'watercolor', 
    name: 'Watercolor', 
    emoji: '🎭', 
    description: 'Soft, flowing brushstrokes',
    color: 'from-blue-400 to-cyan-400'
  },
  { 
    id: 'oil', 
    name: 'Oil Painting', 
    emoji: '🖼️', 
    description: 'Rich, textured painting',
    color: 'from-amber-400 to-red-400'
  },
  { 
    id: 'sketch', 
    name: 'Pencil Sketch', 
    emoji: '✏️', 
    description: 'Hand-drawn appearance',
    color: 'from-gray-400 to-slate-400'
  },
  { 
    id: 'vintage', 
    name: 'Vintage', 
    emoji: '📸', 
    description: 'Classic film aesthetic',
    color: 'from-amber-400 to-yellow-400'
  }
];

export const STYLE_PRESETS = {
  cartoon: {
    strength: 85,
    saturation: 1.2,
    contrast: 1.1
  },
  anime: {
    strength: 90,
    saturation: 1.3,
    contrast: 1.15
  },
  watercolor: {
    strength: 75,
    saturation: 0.9,
    contrast: 0.95
  },
  oil: {
    strength: 80,
    saturation: 1.1,
    contrast: 1.05
  },
  sketch: {
    strength: 70,
    saturation: 0.3,
    contrast: 1.2
  },
  vintage: {
    strength: 65,
    saturation: 0.8,
    contrast: 1.1
  }
};