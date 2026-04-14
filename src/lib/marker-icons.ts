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
    default:
      return { bg: '#16a34a', border: '#15803d', icon: '🏅' }
  }
}

export interface NaverIconSpec {
  content: string
  size: { width: number; height: number }
  anchor: { x: number; y: number }
}

export function createMarkerIcon(
  restaurant: Restaurant,
  isFavorite: boolean,
  isSelected = false,
): NaverIconSpec {
  const style = getStyle(restaurant.source)
  const bg = isSelected ? '#ec4899' : style.bg
  const border = isSelected ? '#db2777' : style.border
  const { icon } = style
  const size = isSelected ? 34 : 28

  const heartBadge = isFavorite
    ? `<div style="
        position:absolute; top:-4px; right:-4px;
        width:14px; height:14px;
        background:#ef4444; border:2px solid white;
        border-radius:50%;
        display:flex; align-items:center; justify-content:center;
        font-size:8px; line-height:1;
      ">♥</div>`
    : ''

  const content = `<div style="
      position: relative;
      width: ${size}px; height: ${size}px;
      background: ${bg};
      border: 2.5px solid ${border};
      border-radius: 50% 50% 50% 0;
      transform: translate(-50%, -100%) rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      margin-left: ${size / 2}px;
      margin-top: ${size}px;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 14px;
        line-height: 1;
      ">${icon}</span>
      ${heartBadge}
    </div>`

  return {
    content,
    size: { width: size, height: size },
    anchor: { x: size / 2, y: size },
  }
}
