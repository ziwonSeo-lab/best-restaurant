'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useReportedStore } from '@/store/reported-store'
import { useFilteredRestaurants } from '@/hooks/use-filtered-restaurants'
import { REGIONS, DEFAULT_REGION } from '@/lib/regions'
import FilterPanel from '@/components/FilterPanel'
import SearchBar from '@/components/SearchBar'
import RestaurantCard from '@/components/RestaurantCard'
import RandomButton from '@/components/RandomButton'
import MapOverlayCounts from '@/components/MapOverlayCounts'
import BottomNav, { type TabType } from '@/components/BottomNav'
import CommunityTab from '@/components/tabs/CommunityTab'
import MyRestaurantsTab from '@/components/tabs/MyRestaurantsTab'

const LeafletMap = dynamic(() => import('@/components/NaverMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-stone-50">
      <div className="text-center">
        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-stone-400 tracking-tight">지도 불러오는 중</p>
      </div>
    </div>
  ),
})

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('map')

  const region = useRestaurantStore((s) => s.region)
  const isLoading = useRestaurantStore((s) => s.isLoading)
  const error = useRestaurantStore((s) => s.error)
  const selectedRestaurant = useRestaurantStore((s) => s.selectedRestaurant)
  const setSelectedRestaurant = useRestaurantStore((s) => s.setSelectedRestaurant)
  const loadRestaurants = useRestaurantStore((s) => s.loadRestaurants)
  const checkAvailableRegions = useRestaurantStore((s) => s.checkAvailableRegions)
  const loadSharedReported = useReportedStore((s) => s.loadSharedReported)

  const filteredRestaurants = useFilteredRestaurants()

  useEffect(() => {
    loadSharedReported()
  }, [loadSharedReported])

  useEffect(() => {
    loadRestaurants(region).then(() => {
      checkAvailableRegions()
    })
  }, [region, loadRestaurants, checkAvailableRegions])

  const mapCenter = REGIONS[region]?.center || REGIONS[DEFAULT_REGION].center
  const mapZoom = REGIONS[region]?.zoom ?? 12

  return (
    <div className="h-dvh flex flex-col bg-stone-50">
      {/* 지도 탭 헤더 - 지도 탭일 때만 표시 */}
      {activeTab === 'map' && (
        <header className="flex-shrink-0 bg-white border-b border-stone-200/60 pt-safe">
          <div className="px-3 pt-2.5 pb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <h1 className="text-[15px] font-bold tracking-tight text-stone-800 flex-shrink-0">
                맛집 지도
              </h1>
              <RandomButton filteredRestaurants={filteredRestaurants} />
              <div className="flex-1 min-w-0">
                <SearchBar />
              </div>
              <span className="text-[11px] tabular-nums text-stone-400 flex-shrink-0 font-medium">
                {filteredRestaurants.length}곳
              </span>
            </div>
            <FilterPanel />
          </div>
        </header>
      )}

      {/* 커뮤니티 탭 헤더 */}
      {activeTab === 'community' && (
        <header className="flex-shrink-0 bg-white border-b border-stone-200/60 pt-safe">
          <div className="px-4 pt-3 pb-3">
            <h1 className="text-[15px] font-bold tracking-tight text-stone-800">커뮤니티</h1>
          </div>
        </header>
      )}

      {/* 내 식당 탭 헤더 */}
      {activeTab === 'my' && (
        <header className="flex-shrink-0 bg-white border-b border-stone-200/60 pt-safe">
          <div className="px-4 pt-3 pb-3">
            <h1 className="text-[15px] font-bold tracking-tight text-stone-800">내 식당</h1>
          </div>
        </header>
      )}

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-hidden relative">
        {/* 지도 탭 - 항상 마운트, 탭이 달라질 때 숨김 처리 */}
        <div className={`absolute inset-0 ${activeTab === 'map' ? '' : 'invisible pointer-events-none'}`}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50">
              <div className="text-center">
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-stone-400 tracking-tight">데이터 불러오는 중</p>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-50 px-6">
              <div className="text-center max-w-sm">
                <p className="text-sm text-stone-500 mb-2">{error}</p>
                <p className="text-xs text-stone-400">
                  데이터 스크립트를 실행하여 준비해주세요.
                </p>
                <code className="block mt-2 text-xs bg-stone-100 rounded-lg px-3 py-2 text-stone-600 font-mono">
                  npm run build-data -- {region}
                </code>
              </div>
            </div>
          ) : (
            <>
              <LeafletMap
                restaurants={filteredRestaurants}
                center={mapCenter}
                zoom={mapZoom}
                onMarkerClick={setSelectedRestaurant}
              />
              <MapOverlayCounts
                restaurants={filteredRestaurants}
                onSelect={setSelectedRestaurant}
              />
            </>
          )}

          {selectedRestaurant && (
            <div className="absolute bottom-0 left-0 right-0 z-[1001]">
              <RestaurantCard
                restaurant={selectedRestaurant}
                onClose={() => setSelectedRestaurant(null)}
              />
            </div>
          )}
        </div>

        {/* 커뮤니티 탭 */}
        {activeTab === 'community' && (
          <div className="absolute inset-0">
            <CommunityTab />
          </div>
        )}

        {/* 내 식당 탭 */}
        {activeTab === 'my' && (
          <div className="absolute inset-0">
            <MyRestaurantsTab />
          </div>
        )}
      </div>

      {/* 하단 탭 네비게이션 */}
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}
