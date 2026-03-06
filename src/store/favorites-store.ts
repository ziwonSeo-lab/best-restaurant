import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  clearAll: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favoriteIds: [],

      toggleFavorite: (id) => {
        const { favoriteIds } = get()
        const next = favoriteIds.includes(id)
          ? favoriteIds.filter((fid) => fid !== id)
          : [...favoriteIds, id]
        set({ favoriteIds: next })
      },

      isFavorite: (id) => get().favoriteIds.includes(id),

      clearAll: () => set({ favoriteIds: [] }),
    }),
    { name: 'best-restaurant-favorites' }
  )
)
