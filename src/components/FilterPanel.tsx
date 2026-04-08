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
  const localReportedIds = useReportedStore((s) => s.localReportedIds)

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
    let yeskidszone = 0
    let goodprice = 0
    for (const r of allRestaurants) {
      if (r.source === 'blueribbon') blueribbon++
      else if (r.source === 'bibgourmand') bibgourmand++
      else if (r.source === 'yeskidszone') yeskidszone++
      else if (r.source === 'goodprice') goodprice++
      else model++
    }
    return { model, blueribbon, bibgourmand, yeskidszone, goodprice, total: allRestaurants.length }
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

  const baseBtn = 'flex-shrink-0 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 cursor-pointer'
  const baseBtnSm = 'flex-shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer'

  return (
    <div className="space-y-1.5">
      {/* 소스 필터 */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5">
        <button
          onClick={() => { setSource(''); setShowFavoritesOnly(false) }}
          className={`${baseBtn} ${
            selectedSource === '' && !showFavoritesOnly
              ? 'bg-stone-800 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          전체 {sourceCounts.total}
        </button>
        <button
          onClick={() => { setSource(selectedSource === 'model' ? '' : 'model'); setShowFavoritesOnly(false) }}
          title="지자체가 위생·서비스 우수 업소로 지정한 모범음식점"
          className={`${baseBtn} ${
            selectedSource === 'model'
              ? 'bg-emerald-600 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          모범식당 {sourceCounts.model}
        </button>
        {selectedSource === 'model' && (
          <button
            onClick={toggleRecentOnly}
            className={`${baseBtnSm} ${
              recentOnly
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {recentOnly ? '최근지정 ✓' : '최근지정'}
          </button>
        )}
        <button
          onClick={() => { setSource(selectedSource === 'blueribbon' ? '' : 'blueribbon'); setShowFavoritesOnly(false) }}
          title="블루리본 서베이 선정, 전문가 평가 기반 맛집 가이드"
          className={`${baseBtn} ${
            selectedSource === 'blueribbon'
              ? 'bg-blue-600 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          블루리본 {sourceCounts.blueribbon}
        </button>
        <button
          onClick={() => { setSource(selectedSource === 'bibgourmand' ? '' : 'bibgourmand'); setShowFavoritesOnly(false) }}
          title="미쉐린 빕 구르망, 합리적 가격에 훌륭한 음식을 제공하는 식당"
          className={`${baseBtn} ${
            selectedSource === 'bibgourmand'
              ? 'bg-rose-600 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          빕구르망 {sourceCounts.bibgourmand}
        </button>
        {sourceCounts.yeskidszone > 0 && (
          <button
            onClick={() => { setSource(selectedSource === 'yeskidszone' ? '' : 'yeskidszone'); setShowFavoritesOnly(false) }}
            title="유모차 가능 식당, Yes Kids Zone 인증"
            className={`${baseBtn} ${
              selectedSource === 'yeskidszone'
                ? 'bg-violet-600 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            유모차OK {sourceCounts.yeskidszone}
          </button>
        )}
        {sourceCounts.goodprice > 0 && (
          <button
            onClick={() => { setSource(selectedSource === 'goodprice' ? '' : 'goodprice'); setShowFavoritesOnly(false) }}
            title="정부 지정 착한가격업소, 합리적 가격의 음식점"
            className={`${baseBtn} ${
              selectedSource === 'goodprice'
                ? 'bg-orange-600 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            착한가격 {sourceCounts.goodprice}
          </button>
        )}
        <button
          onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setSource('') }}
          className={`${baseBtn} ${
            showFavoritesOnly
              ? 'bg-amber-600 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
          }`}
        >
          즐겨찾기 {favoriteIds.length}
        </button>
        {showFavoritesOnly && favoriteIds.length > 0 && (
          <button
            onClick={exportFavorites}
            title="즐겨찾기 내보내기"
            className={`${baseBtnSm} bg-stone-100 text-stone-500 hover:bg-stone-200`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
        {showFavoritesOnly && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="즐겨찾기 가져오기"
              className={`${baseBtnSm} bg-stone-100 text-stone-500 hover:bg-stone-200`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
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
        {localReportedIds.length > 0 && (
          <button
            onClick={toggleHideReported}
            title={hideReported ? '신고 식당 표시' : '신고 식당 숨기기'}
            className={`${baseBtnSm} ${
              hideReported
                ? 'bg-red-600 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {hideReported ? `숨김 ${localReportedIds.length}` : `연동안됨 ${localReportedIds.length}`}
          </button>
        )}
        {foodTypes.length > 0 && (
          <button
            onClick={() => {
              if (showFoodTypes) setFoodType('')
              setShowFoodTypes(!showFoodTypes)
            }}
            className={`${baseBtnSm} ${showFoodTypes || selectedFoodType
              ? 'bg-stone-700 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {showFoodTypes ? '종류 ✕' : selectedFoodType ? `${selectedFoodType}` : '종류 +'}
          </button>
        )}
      </div>

      {/* 음식유형 필터 (펼침) */}
      {showFoodTypes && foodTypes.length > 0 && (
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-0.5">
          <button
            onClick={() => setFoodType('')}
            className={`${baseBtnSm} ${
              selectedFoodType === ''
                ? 'bg-stone-700 text-white'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            전체 {sourceFilteredRestaurants.length}
          </button>
          {foodTypes.map(({ type, count }) => (
            <button
              key={type}
              onClick={() => setFoodType(type === selectedFoodType ? '' : type)}
              className={`${baseBtnSm} ${
                selectedFoodType === type
                  ? 'bg-stone-700 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {type} {count}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
