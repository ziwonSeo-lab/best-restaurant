import type { Restaurant } from './types'

interface MarkerStyle {
  bg: string
  border: string
  icon: string
}

function getStyle(source: string): MarkerStyle {
  switch (source) {
    case 'blueribbon':
      return { bg: '#2563eb', border: '#1d4ed8', icon: '🎗️' }
    case 'bibgourmand':
      return { bg: '#db2777', border: '#be185d', icon: '🌸' }
    case 'yeskidszone':
      return { bg: '#7c3aed', border: '#6d28d9', icon: '👶' }
    case 'goodprice':
      return { bg: '#ea580c', border: '#c2410c', icon: '💰' }
    default:
      return { bg: '#16a34a', border: '#15803d', icon: '🏅' }
  }
}

export function getMarkerStyle(restaurant: Restaurant, isSelected = false) {
  const style = getStyle(restaurant.source)
  return {
    bg: isSelected ? '#ec4899' : style.bg,
    border: isSelected ? '#db2777' : style.border,
    icon: style.icon,
  }
}
