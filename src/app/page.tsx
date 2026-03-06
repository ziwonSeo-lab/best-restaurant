'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFilteredRestaurants } from '@/hooks/use-filtered-restaurants'
import { REGIONS, DEFAULT_REGION } from '@/lib/regions'
import FilterPanel from '@/components/FilterPanel'
import SearchBar from '@/components/SearchBar'
import RestaurantCard from '@/components/RestaurantCard'
import RandomButton from '@/components/RandomButton'
import MapOverlayCounts from '@/components/MapOverlayCounts'

const LeafletMap = dynamic(() => import('@/components/NaverMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-sm text-gray-500">지도 로딩 중...</p>
      </div>
    </div>
  ),
})

export default function HomePage() {
  const region = useRestaurantStore((s) => s.region)
  const isLoading = useRestaurantStore((s) => s.isLoading)
  const error = useRestaurantStore((s) => s.error)
  const selectedRestaurant = useRestaurantStore((s) => s.selectedRestaurant)
  const setSelectedRestaurant = useRestaurantStore((s) => s.setSelectedRestaurant)
  const loadRestaurants = useRestaurantStore((s) => s.loadRestaurants)
  const checkAvailableRegions = useRestaurantStore((s) => s.checkAvailableRegions)

  const filteredRestaurants = useFilteredRestaurants()

  useEffect(() => {
    checkAvailableRegions()
  }, [checkAvailableRegions])

  useEffect(() => {
    loadRestaurants(region)
  }, [region, loadRestaurants])

  const mapCenter = REGIONS[region]?.center || REGIONS[DEFAULT_REGION].center

  return (
    <div className="h-dvh flex flex-col bg-gray-50">
      {/* 상단 컨트롤 영역 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 pt-safe">
        <div className="px-3 pt-1.5 pb-1.5">
          {/* 헤더: 맛집지도 + 랜덤 + 검색 */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-bold text-gray-900 flex-shrink-0">
              맛집 지도
            </h1>
            <RandomButton filteredRestaurants={filteredRestaurants} />
            <div className="flex-1 min-w-0">
              <SearchBar />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {filteredRestaurants.length}곳
            </span>
          </div>

          {/* 필터 */}
          <div className="mt-1">
            <FilterPanel />
          </div>
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">데이터 로딩 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 px-6">
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm text-gray-600 mb-2">{error}</p>
              <p className="text-xs text-gray-400">
                build-data, build-blueribbon, build-bibgourmand 스크립트를 실행하여 데이터를 준비해주세요.
              </p>
              <code className="block mt-2 text-xs bg-gray-200 rounded px-3 py-2 text-gray-700">
                npm run build-data -- {region}
              </code>
              <code className="block mt-1 text-xs bg-gray-200 rounded px-3 py-2 text-gray-700">
                npm run build-blueribbon -- {region}
              </code>
              <code className="block mt-1 text-xs bg-gray-200 rounded px-3 py-2 text-gray-700">
                npm run build-bibgourmand
              </code>
            </div>
          </div>
        ) : (
          <>
            <LeafletMap
              restaurants={filteredRestaurants}
              center={mapCenter}
              onMarkerClick={setSelectedRestaurant}
            />
            <MapOverlayCounts
              restaurants={filteredRestaurants}
              onSelect={setSelectedRestaurant}
            />
          </>
        )}

        {/* 선택된 식당 카드 */}
        {selectedRestaurant && (
          <div className="absolute bottom-0 left-0 right-0 z-[1001]">
            <RestaurantCard
              restaurant={selectedRestaurant}
              onClose={() => setSelectedRestaurant(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
