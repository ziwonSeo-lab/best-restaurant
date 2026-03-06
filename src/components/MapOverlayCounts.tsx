'use client'

import { useMemo, useState } from 'react'
import type { Restaurant, RestaurantSource } from '@/lib/types'
import { useRestaurantStore } from '@/store/restaurant-store'

interface MapOverlayCountsProps {
  restaurants: Restaurant[]
  onSelect: (restaurant: Restaurant) => void
}

interface SourceInfo {
  key: RestaurantSource
  icon: string
  label: string
  bg: string
  text: string
  activeBg: string
}

const SOURCES: SourceInfo[] = [
  { key: 'model', icon: '🏅', label: '모범식당', bg: 'bg-emerald-500', text: 'text-white', activeBg: 'bg-emerald-600' },
  { key: 'blueribbon', icon: '🎗️', label: '블루리본', bg: 'bg-blue-500', text: 'text-white', activeBg: 'bg-blue-600' },
  { key: 'bibgourmand', icon: '🌸', label: '빕구르망', bg: 'bg-pink-500', text: 'text-white', activeBg: 'bg-pink-600' },
]

export default function MapOverlayCounts({ restaurants, onSelect }: MapOverlayCountsProps) {
  const mapBounds = useRestaurantStore((s) => s.mapBounds)
  const [expandedSource, setExpandedSource] = useState<RestaurantSource | null>(null)

  const visibleRestaurants = useMemo(() => {
    if (!mapBounds) return restaurants
    return restaurants.filter(
      (r) =>
        r.lat >= mapBounds.south &&
        r.lat <= mapBounds.north &&
        r.lng >= mapBounds.west &&
        r.lng <= mapBounds.east
    )
  }, [restaurants, mapBounds])

  const counts = useMemo(() => {
    const map: Record<string, number> = { model: 0, blueribbon: 0, bibgourmand: 0 }
    for (const r of visibleRestaurants) {
      map[r.source] = (map[r.source] || 0) + 1
    }
    return map
  }, [visibleRestaurants])

  const expandedList = useMemo(() => {
    if (!expandedSource) return []
    return visibleRestaurants.filter((r) => r.source === expandedSource)
  }, [visibleRestaurants, expandedSource])

  const totalVisible = visibleRestaurants.length
  if (totalVisible === 0) return null

  const handleSelect = (r: Restaurant) => {
    setExpandedSource(null)
    onSelect(r)
  }

  return (
    <div className="absolute top-3 left-3 z-[1000] flex flex-col items-start gap-1.5">
      {/* 카테고리별 카운트 - 가로 배치 */}
      <div className="flex gap-1.5">
        {SOURCES.map((src) => {
          const count = counts[src.key] || 0
          if (count === 0) return null
          const isExpanded = expandedSource === src.key

          return (
            <button
              key={src.key}
              onClick={() => setExpandedSource(isExpanded ? null : src.key)}
              className={`
                flex items-center gap-1.5
                px-2.5 py-1.5 rounded-lg
                text-xs font-semibold shadow-md
                transition-all duration-150
                ${isExpanded ? src.activeBg : src.bg} ${src.text}
                hover:scale-105 active:scale-95
              `}
            >
              <span>{src.icon}</span>
              <span>{count}</span>
            </button>
          )
        })}
      </div>

      {/* 펼친 리스트 */}
      {expandedSource && expandedList.length > 0 && (
        <div className="
          bg-white rounded-xl shadow-xl border border-gray-200
          w-56 max-h-72 overflow-y-auto
        ">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              {SOURCES.find((s) => s.key === expandedSource)?.icon}{' '}
              {SOURCES.find((s) => s.key === expandedSource)?.label}
              <span className="ml-1 text-gray-400 font-normal">({expandedList.length})</span>
            </span>
            <button
              onClick={() => setExpandedSource(null)}
              className="text-gray-400 hover:text-gray-600 text-sm leading-none"
            >
              ✕
            </button>
          </div>
          <ul className="py-1">
            {expandedList.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => handleSelect(r)}
                  className="
                    w-full text-left px-3 py-2
                    hover:bg-gray-50 active:bg-gray-100
                    transition-colors
                  "
                >
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {r.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {r.foodType || r.mainFood || (r.address ? r.address.split(' ').slice(0, 3).join(' ') : '')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
