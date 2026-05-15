import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface VisitEntry {
  restaurantId: string
  name: string
  address: string
  region: string
  visitedAt: string
  note?: string
}

export interface WishlistEntry {
  restaurantId: string
  name: string
  address: string
  region: string
  addedAt: string
}

export interface ReviewEntry {
  restaurantId: string
  name: string
  address: string
  region: string
  rating: number
  text: string
  createdAt: string
  updatedAt: string
}

interface MyRestaurantsState {
  visits: VisitEntry[]
  wishlist: WishlistEntry[]
  reviews: ReviewEntry[]

  // 가본식당
  addVisit: (entry: Omit<VisitEntry, 'visitedAt'>) => void
  removeVisit: (restaurantId: string) => void
  isVisited: (restaurantId: string) => boolean

  // 가볼식당
  addWishlist: (entry: Omit<WishlistEntry, 'addedAt'>) => void
  removeWishlist: (restaurantId: string) => void
  isWishlisted: (restaurantId: string) => boolean

  // 리뷰
  upsertReview: (entry: Omit<ReviewEntry, 'createdAt' | 'updatedAt'> & { createdAt?: string }) => void
  removeReview: (restaurantId: string) => void
  getReview: (restaurantId: string) => ReviewEntry | undefined
}

export const useMyRestaurantsStore = create<MyRestaurantsState>()(
  persist(
    (set, get) => ({
      visits: [],
      wishlist: [],
      reviews: [],

      addVisit: (entry) => {
        const { visits } = get()
        if (visits.some((v) => v.restaurantId === entry.restaurantId)) return
        set({ visits: [{ ...entry, visitedAt: new Date().toISOString() }, ...visits] })
      },

      removeVisit: (restaurantId) => {
        set({ visits: get().visits.filter((v) => v.restaurantId !== restaurantId) })
      },

      isVisited: (restaurantId) => get().visits.some((v) => v.restaurantId === restaurantId),

      addWishlist: (entry) => {
        const { wishlist } = get()
        if (wishlist.some((w) => w.restaurantId === entry.restaurantId)) return
        set({ wishlist: [{ ...entry, addedAt: new Date().toISOString() }, ...wishlist] })
      },

      removeWishlist: (restaurantId) => {
        set({ wishlist: get().wishlist.filter((w) => w.restaurantId !== restaurantId) })
      },

      isWishlisted: (restaurantId) => get().wishlist.some((w) => w.restaurantId === restaurantId),

      upsertReview: (entry) => {
        const { reviews } = get()
        const now = new Date().toISOString()
        const existing = reviews.find((r) => r.restaurantId === entry.restaurantId)
        if (existing) {
          set({
            reviews: reviews.map((r) =>
              r.restaurantId === entry.restaurantId
                ? { ...entry, createdAt: r.createdAt, updatedAt: now }
                : r
            ),
          })
        } else {
          set({ reviews: [{ ...entry, createdAt: now, updatedAt: now }, ...reviews] })
        }
      },

      removeReview: (restaurantId) => {
        set({ reviews: get().reviews.filter((r) => r.restaurantId !== restaurantId) })
      },

      getReview: (restaurantId) => get().reviews.find((r) => r.restaurantId === restaurantId),
    }),
    { name: 'best-restaurant-my' }
  )
)
