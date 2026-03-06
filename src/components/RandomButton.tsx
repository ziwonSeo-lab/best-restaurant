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
    }, 500)
  }, [visibleRestaurants, randomPick, isShaking])

  return (
    <button
      onClick={handleClick}
      disabled={visibleRestaurants.length === 0}
      className={`
        flex-shrink-0 w-8 h-8 rounded-lg
        bg-amber-50 border border-amber-200
        flex items-center justify-center
        hover:bg-amber-100 active:bg-amber-200
        transition-colors
        disabled:opacity-40 disabled:cursor-not-allowed
        ${isShaking ? 'animate-shake' : ''}
      `}
      title={`랜덤 추천 (화면 내 ${visibleRestaurants.length}곳)`}
    >
      <span className="text-base">🎲</span>
    </button>
  )
}
