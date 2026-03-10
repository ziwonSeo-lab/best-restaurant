'use client'

import { useMemo, useRef, useState } from 'react'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { useReportedStore } from '@/store/reported-store'

export default function FilterPanel() {
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)
  const selectedFoodType = useRestaurantStore((s) => s.foodTypeFilter)
  const selectedSource = useRestaurantStore((s) => s.sourceFilter)
  const setFoodType = useRestaurantStore((s) => s.setFoodTypeFilter)
  const setSource = useRestaurantStore((s) => s.setSourceFilter)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const exportFavorites = useFavoritesStore((s) => s.exportFavorites)
  const importFavorites = useFavoritesStore((s) => s.importFavorites)
  const showFavoritesOnly = useRestaurantStore((s) => s.showFavoritesOnly)
  const setShowFavoritesOnly = useRestaurantStore((s) => s.setShowFavoritesOnly)
  const recentOnly = useRestaurantStore((s) => s.recentOnly)
  const toggleRecentOnly = useRestaurantStore((s) => s.toggleRecentOnly)
  const hideReported = useRestaurantStore((s) => s.hideReported)
  const toggleHideReported = useRestaurantStore((s) => s.toggleHideReported)
  const reportedIds = useReportedStore((s) => s.reportedIds)

  const [showFoodTypes, setShowFoodTypes] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const ids = JSON.parse(ev.target?.result as string)
        if (Array.isArray(ids)) importFavorites(ids)
      } catch { /* invalid JSON */ }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

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
        {selectedSource === 'model' && (
          <button
            onClick={toggleRecentOnly}
            className={`
              flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium
              transition-all duration-200
              ${
                recentOnly
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }
            `}
          >
            {recentOnly ? '최근 지정 ✓' : '최근 지정'}
          </button>
        )}
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
        {showFavoritesOnly && favoriteIds.length > 0 && (
          <button
            onClick={exportFavorites}
            title="즐겨찾기 내보내기"
            className="flex-shrink-0 px-2.5 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            ↓
          </button>
        )}
        {showFavoritesOnly && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="즐겨찾기 가져오기"
              className="flex-shrink-0 px-2.5 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              ↑
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </>
        )}
        {reportedIds.length > 0 && (
          <button
            onClick={toggleHideReported}
            title={hideReported ? '신고 식당 표시' : '신고 식당 숨기기'}
            className={`
              flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${
                hideReported
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }
            `}
          >
            {hideReported ? `연동안됨 숨김 (${reportedIds.length})` : `연동안됨 ${reportedIds.length}`}
          </button>
        )}
        {foodTypes.length > 0 && (
          <button
            onClick={() => {
              if (showFoodTypes) setFoodType('')
              setShowFoodTypes(!showFoodTypes)
            }}
            className={`
              flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${showFoodTypes || selectedFoodType
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
          >
            {showFoodTypes ? '종류 ✕' : selectedFoodType ? `종류: ${selectedFoodType}` : '종류 +'}
          </button>
        )}
      </div>

      {/* 음식유형 필터 (펼침) */}
      {showFoodTypes && foodTypes.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-0.5 px-1">
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
        </div>
      )}
    </div>
  )
}
