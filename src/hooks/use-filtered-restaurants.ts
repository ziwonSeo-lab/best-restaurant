import { useMemo } from 'react'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { useReportedStore } from '@/store/reported-store'
import { haversineDistance } from '@/lib/geo-utils'
import { isOlderThanYears } from '@/lib/date-utils'
import { isChosungQuery, matchChosung } from '@/lib/korean-utils'

export function useFilteredRestaurants() {
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)
  const sourceFilter = useRestaurantStore((s) => s.sourceFilter)
  const foodTypeFilter = useRestaurantStore((s) => s.foodTypeFilter)
  const searchQuery = useRestaurantStore((s) => s.searchQuery)
  const userLocation = useRestaurantStore((s) => s.userLocation)
  const radiusFilter = useRestaurantStore((s) => s.radiusFilter)
  const showFavoritesOnly = useRestaurantStore((s) => s.showFavoritesOnly)
  const recentOnly = useRestaurantStore((s) => s.recentOnly)
  const hideReported = useRestaurantStore((s) => s.hideReported)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)
  const reportedIds = useReportedStore((s) => s.reportedIds)

  return useMemo(() => {
    let data = allRestaurants

    if (showFavoritesOnly) {
      data = data.filter((r) => favoriteIds.includes(r.id))
    }

    if (sourceFilter) {
      data = data.filter((r) => r.source === sourceFilter)
    }

    if (recentOnly) {
      data = data.filter((r) => {
        if (r.source !== 'model') return true
        return r.designatedDate ? !isOlderThanYears(r.designatedDate, 5) : false
      })
    }

    if (foodTypeFilter) {
      data = data.filter(
        (r) => r.foodType === foodTypeFilter || r.mainFood === foodTypeFilter
      )
    }

    if (searchQuery) {
      if (isChosungQuery(searchQuery)) {
        data = data.filter(
          (r) =>
            matchChosung(r.name, searchQuery) ||
            matchChosung(r.mainFood, searchQuery)
        )
      } else {
        const lower = searchQuery.toLowerCase()
        data = data.filter(
          (r) =>
            r.name.toLowerCase().includes(lower) ||
            r.address.toLowerCase().includes(lower) ||
            r.mainFood.toLowerCase().includes(lower)
        )
      }
    }

    if (hideReported && reportedIds.length > 0) {
      data = data.filter((r) => !reportedIds.includes(r.id))
    }

    // 반경 필터 + 거리순 정렬
    if (userLocation && radiusFilter) {
      data = data
        .map((r) => ({
          restaurant: r,
          distance: haversineDistance(
            userLocation.lat, userLocation.lng,
            r.lat, r.lng
          ),
        }))
        .filter((item) => item.distance <= radiusFilter)
        .sort((a, b) => a.distance - b.distance)
        .map((item) => item.restaurant)
    }

    return data
  }, [allRestaurants, sourceFilter, foodTypeFilter, searchQuery, userLocation, radiusFilter, showFavoritesOnly, recentOnly, hideReported, favoriteIds, reportedIds])
}
