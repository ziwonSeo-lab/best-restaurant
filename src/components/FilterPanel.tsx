'use client'

import { useMemo, useState } from 'react'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'

export default function FilterPanel() {
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)
  const selectedFoodType = useRestaurantStore((s) => s.foodTypeFilter)
  const selectedSource = useRestaurantStore((s) => s.sourceFilter)
  const setFoodType = useRestaurantStore((s) => s.setFoodTypeFilter)
  const setSource = useRestaurantStore((s) => s.setSourceFilter)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const showFavoritesOnly = useRestaurantStore((s) => s.showFavoritesOnly)
  const setShowFavoritesOnly = useRestaurantStore((s) => s.setShowFavoritesOnly)

  const [showFoodTypes, setShowFoodTypes] = useState(false)

  const sourceCounts = useMemo(() => {
    let model = 0
    let blueribbon = 0
    let bibgourmand = 0
    for (const r of allRestaurants) {
      if (r.source === 'blueribbon') blueribbon++
      else if (r.source === 'bibgourmand') bibgourmand++
      else model++
    }
    return { model, blueribbon, bibgourmand, total: allRestaurants.length }
  }, [allRestaurants])

  const sourceFilteredRestaurants = useMemo(() => {
    if (!selectedSource) return allRestaurants
    return allRestaurants.filter((r) => r.source === selectedSource)
  }, [allRestaurants, selectedSource])

  const foodTypes = useMemo(() => {
    const counts = new Map<string, number>()
    sourceFilteredRestaurants.forEach((r) => {
      const type = r.foodType || '기타'
      counts.set(type, (counts.get(type) || 0) + 1)
    })
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count }))
  }, [sourceFilteredRestaurants])

  return (
    <div className="space-y-2">
      {/* 소스 필터 */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 px-1">
        <button
          onClick={() => { setSource(''); setShowFavoritesOnly(false) }}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              selectedSource === ''
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }
          `}
        >
          전체 ({sourceCounts.total})
        </button>
        <button
          onClick={() => { setSource(selectedSource === 'model' ? '' : 'model'); setShowFavoritesOnly(false) }}
          title="지자체가 위생·서비스 우수 업소로 지정한 모범음식점"
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              selectedSource === 'model'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }
          `}
        >
          🏅 모범식당 ({sourceCounts.model})
        </button>
        <button
          onClick={() => { setSource(selectedSource === 'blueribbon' ? '' : 'blueribbon'); setShowFavoritesOnly(false) }}
          title="블루리본 서베이 선정, 전문가 평가 기반 맛집 가이드"
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              selectedSource === 'blueribbon'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }
          `}
        >
          🎀 블루리본 ({sourceCounts.blueribbon})
        </button>
        <button
          onClick={() => { setSource(selectedSource === 'bibgourmand' ? '' : 'bibgourmand'); setShowFavoritesOnly(false) }}
          title="미쉐린 빕 구르망, 합리적 가격에 훌륭한 음식을 제공하는 식당"
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              selectedSource === 'bibgourmand'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
            }
          `}
        >
          🌸 빕구르망 ({sourceCounts.bibgourmand})
        </button>
        <button
          onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSource('') }}
          className={`
            flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              showFavoritesOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }
          `}
        >
          ⭐ 즐겨찾기 ({favoriteIds.length})
        </button>
      </div>

      {/* 음식유형 토글 + 필터 */}
      {foodTypes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 px-1 items-center">
          <button
            onClick={() => {
              if (showFoodTypes) {
                setFoodType('')
              }
              setShowFoodTypes(!showFoodTypes)
            }}
            className={`
              flex-shrink-0 w-7 h-7 rounded-full text-sm font-medium
              flex items-center justify-center
              transition-all duration-200
              ${showFoodTypes
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
            title="음식 종류 필터"
          >
            {showFoodTypes ? '−' : '+'}
          </button>
          {showFoodTypes && (
            <>
              <button
                onClick={() => setFoodType('')}
                className={`
                  flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-200
                  ${
                    selectedFoodType === ''
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                전체 ({sourceFilteredRestaurants.length})
              </button>
              {foodTypes.map(({ type, count }) => (
                <button
                  key={type}
                  onClick={() => setFoodType(type === selectedFoodType ? '' : type)}
                  className={`
                    flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-200
                    ${
                      selectedFoodType === type
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                >
                  {type} ({count})
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
