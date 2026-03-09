import { useMemo } from 'react'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { haversineDistance } from '@/lib/geo-utils'
import { isOlderThanYears } from '@/lib/date-utils'

export function useFilteredRestaurants() {
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)
  const sourceFilter = useRestaurantStore((s) => s.sourceFilter)
  const foodTypeFilter = useRestaurantStore((s) => s.foodTypeFilter)
  const searchQuery = useRestaurantStore((s) => s.searchQuery)
  const userLocation = useRestaurantStore((s) => s.userLocation)
  const radiusFilter = useRestaurantStore((s) => s.radiusFilter)
  const showFavoritesOnly = useRestaurantStore((s) => s.showFavoritesOnly)
  const recentOnly = useRestaurantStore((s) => s.recentOnly)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)

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
      const lower = searchQuery.toLowerCase()
      data = data.filter(
        (r) =>
          r.name.toLowerCase().includes(lower) ||
          r.address.toLowerCase().includes(lower) ||
          r.mainFood.toLowerCase().includes(lower)
      )
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
  }, [allRestaurants, sourceFilter, foodTypeFilter, searchQuery, userLocation, radiusFilter, showFavoritesOnly, recentOnly, favoriteIds])
}
