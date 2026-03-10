import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favoriteIds: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  clearAll: () => void
  exportFavorites: () => void
  importFavorites: (ids: string[]) => void
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

      exportFavorites: () => {
        const { favoriteIds } = get()
        const blob = new Blob([JSON.stringify(favoriteIds)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'favorites.json'
        a.click()
        URL.revokeObjectURL(url)
      },

      importFavorites: (ids) => set((state) => ({
        favoriteIds: [...new Set([...state.favoriteIds, ...ids])]
      })),
    }),
    { name: 'best-restaurant-favorites' }
  )
)
