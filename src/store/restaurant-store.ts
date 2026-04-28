import { create } from 'zustand'
import type { Restaurant, RestaurantSource } from '@/lib/types'
import { REGIONS, DEFAULT_REGION } from '@/lib/regions'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

interface RestaurantState {
  allRestaurants: Restaurant[]
  availableRegions: string[]
  isLoading: boolean
  error: string | null

  region: string
  foodTypeFilter: string
  sourceFilter: RestaurantSource | ''
  searchQuery: string

  selectedRestaurant: Restaurant | null

  // 즐겨찾기 필터
  showFavoritesOnly: boolean

  // 최근 지정 필터 (모범식당 5년 이내)
  recentOnly: boolean

  // 신고된 식당 숨기기
  hideReported: boolean

  // 지도 뷰포트 영역
  mapBounds: { south: number; north: number; west: number; east: number } | null

  // GPS 위치
  userLocation: { lat: number; lng: number } | null
  isLocating: boolean
  locationError: string | null
  radiusFilter: number | null // meters (null = 비활성)

  setRegion: (region: string) => void
  setFoodTypeFilter: (foodType: string) => void
  setSourceFilter: (source: RestaurantSource | '') => void
  setSearchQuery: (query: string) => void
  setSelectedRestaurant: (restaurant: Restaurant | null) => void
  setShowFavoritesOnly: (show: boolean) => void
  toggleRecentOnly: () => void
  toggleHideReported: () => void
  loadRestaurants: (region: string) => Promise<void>
  checkAvailableRegions: () => Promise<void>

  // 지도 뷰포트
  setMapBounds: (bounds: { south: number; north: number; west: number; east: number }) => void

  // GPS 액션
  requestLocation: () => void
  setRadiusFilter: (radius: number | null) => void
  clearLocation: () => void

  // 랜덤 추천
  randomPick: (filtered: Restaurant[]) => void
}

export const useRestaurantStore = create<RestaurantState>((set) => ({
  allRestaurants: [],
  availableRegions: [],
  isLoading: true,
  error: null,

  region: DEFAULT_REGION,
  foodTypeFilter: '',
  sourceFilter: '',
  searchQuery: '',

  selectedRestaurant: null,

  showFavoritesOnly: false,

  recentOnly: false,
  hideReported: false,

  mapBounds: null,

  userLocation: null,
  isLocating: false,
  locationError: null,
  radiusFilter: null,

  setRegion: (region) =>
    set({
      region,
      foodTypeFilter: '',
      sourceFilter: '',
      searchQuery: '',
      selectedRestaurant: null,
    }),

  setFoodTypeFilter: (foodTypeFilter) => set({ foodTypeFilter }),

  setSourceFilter: (sourceFilter) =>
    set({ sourceFilter, foodTypeFilter: '', selectedRestaurant: null, recentOnly: false }),

  setSearchQuery: (searchQuery) => set({ searchQuery, selectedRestaurant: null }),

  setSelectedRestaurant: (selectedRestaurant) => set({ selectedRestaurant }),

  setShowFavoritesOnly: (showFavoritesOnly) => set({ showFavoritesOnly }),

  toggleRecentOnly: () => set((state) => ({ recentOnly: !state.recentOnly })),
  toggleHideReported: () => set((state) => ({ hideReported: !state.hideReported })),

  loadRestaurants: async (region) => {
    set({ isLoading: true, error: null })

    try {
      const regionKeys = region === 'all'
        ? Object.keys(REGIONS).filter((k) => k !== 'all')
        : [region]

      const loadForRegion = async (key: string): Promise<Restaurant[]> => {
        const [modelRes, blueribbonRes, bibgourmandRes, yeskidszoneRes, goodpriceRes] = await Promise.allSettled([
          fetch(`${BASE_PATH}/data/${key}.json`),
          fetch(`${BASE_PATH}/data/blueribbon-${key}.json`),
          fetch(`${BASE_PATH}/data/bibgourmand-${key}.json`),
          fetch(`${BASE_PATH}/data/yeskidszone-${key}.json`),
          fetch(`${BASE_PATH}/data/goodprice-${key}.json`),
        ])

        const result: Restaurant[] = []

        if (modelRes.status === 'fulfilled' && modelRes.value.ok) {
          const data: Restaurant[] = await modelRes.value.json()
          result.push(...data.map((r) => ({ ...r, source: (r.source || 'model') as RestaurantSource })))
        }
        if (blueribbonRes.status === 'fulfilled' && blueribbonRes.value.ok) {
          const data: Restaurant[] = await blueribbonRes.value.json()
          result.push(...data.map((r) => ({ ...r, source: (r.source || 'blueribbon') as RestaurantSource })))
        }
        if (bibgourmandRes.status === 'fulfilled' && bibgourmandRes.value.ok) {
          const data: Restaurant[] = await bibgourmandRes.value.json()
          result.push(...data.map((r) => ({ ...r, source: (r.source || 'bibgourmand') as RestaurantSource })))
        }
        if (yeskidszoneRes.status === 'fulfilled' && yeskidszoneRes.value.ok) {
          const data: Restaurant[] = await yeskidszoneRes.value.json()
          result.push(...data.map((r) => ({ ...r, source: (r.source || 'yeskidszone') as RestaurantSource })))
        }
        if (goodpriceRes.status === 'fulfilled' && goodpriceRes.value.ok) {
          const data: Restaurant[] = await goodpriceRes.value.json()
          result.push(...data.map((r) => ({ ...r, source: (r.source || 'goodprice') as RestaurantSource })))
        }

        return result
      }

      const regionResults = await Promise.allSettled(regionKeys.map(loadForRegion))
      const restaurants: Restaurant[] = []
      for (const r of regionResults) {
        if (r.status === 'fulfilled') restaurants.push(...r.value)
      }

      if (restaurants.length === 0) {
        set({
          error: `${REGIONS[region]?.name || region} 데이터가 아직 준비되지 않았습니다.`,
          allRestaurants: [],
          isLoading: false,
        })
        return
      }

      set({ allRestaurants: restaurants, isLoading: false })
    } catch {
      set({
        error: '데이터를 불러오는 중 오류가 발생했습니다.',
        allRestaurants: [],
        isLoading: false,
      })
    }
  },

  checkAvailableRegions: async () => {
    const keys = Object.keys(REGIONS).filter((k) => k !== 'all')
    const available: string[] = ['all'] // 전국은 항상 사용 가능

    // 순차적으로 체크하여 dev 서버 과부하 방지
    const dataFiles = ['', 'blueribbon-', 'goodprice-']
    for (const key of keys) {
      try {
        let found = false
        for (const prefix of dataFiles) {
          const res = await fetch(`${BASE_PATH}/data/${prefix}${key}.json`, { method: 'HEAD' }).catch(() => null)
          if (res?.ok) {
            found = true
            break
          }
        }
        if (found) {
          available.push(key)
        }
      } catch {
        // skip
      }
    }

    set({ availableRegions: available })
  },

  setMapBounds: (mapBounds) => set({ mapBounds }),

  requestLocation: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({ locationError: '이 브라우저에서는 위치 서비스를 지원하지 않습니다.' })
      return
    }

    set({ isLocating: true, locationError: null })

    navigator.geolocation.getCurrentPosition(
      (position) => {
        set({
          userLocation: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          isLocating: false,
        })
      },
      (error) => {
        let msg = '위치를 가져올 수 없습니다.'
        if (error.code === error.PERMISSION_DENIED) msg = '위치 권한이 거부되었습니다.'
        else if (error.code === error.POSITION_UNAVAILABLE) msg = '위치 정보를 사용할 수 없습니다.'
        else if (error.code === error.TIMEOUT) msg = '위치 요청 시간이 초과되었습니다.'
        set({ isLocating: false, locationError: msg })
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  },

  setRadiusFilter: (radiusFilter) => set({ radiusFilter }),

  clearLocation: () =>
    set({ userLocation: null, radiusFilter: null, locationError: null }),

  randomPick: (filtered) => {
    if (filtered.length === 0) return
    const idx = Math.floor(Math.random() * filtered.length)
    set({ selectedRestaurant: filtered[idx] })
  },
}))
