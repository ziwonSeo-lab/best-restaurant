'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRestaurantStore } from '@/store/restaurant-store'
import type { Restaurant } from '@/lib/types'

interface RandomButtonProps {
  filteredRestaurants: Restaurant[]
}

export default function RandomButton({ filteredRestaurants }: RandomButtonProps) {
  const randomPick = useRestaurantStore((s) => s.randomPick)
  const mapBounds = useRestaurantStore((s) => s.mapBounds)
  const [isShaking, setIsShaking] = useState(false)

  const visibleRestaurants = useMemo(() => {
    if (!mapBounds) return filteredRestaurants
    return filteredRestaurants.filter(
      (r) =>
        r.lat >= mapBounds.south &&
        r.lat <= mapBounds.north &&
        r.lng >= mapBounds.west &&
        r.lng <= mapBounds.east
    )
  }, [filteredRestaurants, mapBounds])

  const handleClick = useCallback(() => {
    if (visibleRestaurants.length === 0 || isShaking) return
    setIsShaking(true)
    setTimeout(() => {
      randomPick(visibleRestaurants)
      setIsShaking(false)
    }, 400)
  }, [visibleRestaurants, randomPick, isShaking])

  return (
    <button
      onClick={handleClick}
      disabled={visibleRestaurants.length === 0}
      className={`
        flex-shrink-0 w-8 h-8 rounded-lg
        bg-stone-100 border border-stone-200
        flex items-center justify-center
        hover:bg-stone-200 active:bg-stone-300
        transition-colors cursor-pointer
        disabled:opacity-30 disabled:cursor-not-allowed
        ${isShaking ? 'animate-shake' : ''}
      `}
      title={`랜덤 추천 (화면 내 ${visibleRestaurants.length}곳)`}
    >
      <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    </button>
  )
}
