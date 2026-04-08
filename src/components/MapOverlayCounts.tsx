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
  label: string
  bg: string
  activeBg: string
}

const SOURCES: SourceInfo[] = [
  { key: 'model', label: '모범', bg: 'bg-emerald-600', activeBg: 'bg-emerald-700' },
  { key: 'blueribbon', label: '블루리본', bg: 'bg-blue-600', activeBg: 'bg-blue-700' },
  { key: 'bibgourmand', label: '빕구르망', bg: 'bg-rose-600', activeBg: 'bg-rose-700' },
  { key: 'yeskidszone', label: '유모차', bg: 'bg-violet-600', activeBg: 'bg-violet-700' },
  { key: 'goodprice', label: '착한가격', bg: 'bg-orange-600', activeBg: 'bg-orange-700' },
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
    const map: Record<string, number> = { model: 0, blueribbon: 0, bibgourmand: 0, yeskidszone: 0, goodprice: 0 }
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
      {/* 카테고리별 카운트 */}
      <div className="flex gap-1">
        {SOURCES.map((src) => {
          const count = counts[src.key] || 0
          if (count === 0) return null
          const isExpanded = expandedSource === src.key

          return (
            <button
              key={src.key}
              onClick={() => setExpandedSource(isExpanded ? null : src.key)}
              className={`
                flex items-center gap-1
                px-2 py-1 rounded-md
                text-[11px] font-semibold text-white
                shadow-sm
                transition-colors duration-150
                cursor-pointer
                ${isExpanded ? src.activeBg : src.bg}
              `}
            >
              <span>{src.label}</span>
              <span className="tabular-nums">{count}</span>
            </button>
          )
        })}
      </div>

      {/* 펼친 리스트 */}
      {expandedSource && expandedList.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg border border-stone-200 w-56 max-h-72 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-stone-100 px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">
              {SOURCES.find((s) => s.key === expandedSource)?.label}
              <span className="ml-1 text-stone-400 font-normal">({expandedList.length})</span>
            </span>
            <button
              onClick={() => setExpandedSource(null)}
              className="text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ul className="py-1">
            {expandedList.map((r) => (
              <li key={r.id}>
                <button
                  onClick={() => handleSelect(r)}
                  className="
                    w-full text-left px-3 py-2
                    hover:bg-stone-50 active:bg-stone-100
                    transition-colors cursor-pointer
                  "
                >
                  <div className="text-sm font-medium text-stone-800 truncate">
                    {r.name}
                  </div>
                  <div className="text-xs text-stone-400 truncate">
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
