import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DUMMY_FAVORITE_IDS = [
  '3000000-101-1968-06103', // 함흥곰보냉면
  '3000000-101-1973-00733', // 이바구
  'blueribbon-31431',        // 세븐스도어
  'bibgourmand-132645',      // 옥돌현옥
  '3250000-101-1981-01605', // 신정식당 (부산)
  '3750000-101-1984-00024', // 삼풍가든 (경기)
]

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
      favoriteIds: DUMMY_FAVORITE_IDS,

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
    {
      name: 'best-restaurant-favorites',
      version: 1,
      migrate: (state: unknown) => {
        const s = state as { favoriteIds?: string[] }
        return {
          ...s,
          favoriteIds: (s.favoriteIds && s.favoriteIds.length > 0)
            ? s.favoriteIds
            : DUMMY_FAVORITE_IDS,
        }
      },
    }
  )
)
