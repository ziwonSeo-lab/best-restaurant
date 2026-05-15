import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const DUMMY_FAVORITE_IDS = [
  '3000000-101-1968-06103', // 함흥곰보냉면 (서울)
  '3000000-101-1973-00733', // 이바구 (서울)
  'blueribbon-31431',        // 세븐스도어 (서울)
  'bibgourmand-132645',      // 옥돌현옥 (서울)
  '3250000-101-1981-01605', // 신정식당 (부산)
  '3750000-101-1984-00024', // 삼풍가든 (경기)
  '3490000-101-1974-00009', // 삼강옥 (인천)
  '5030000-101-1990-00072', // 포항감자탕 (경북)
  '5310000-101-1989-00043', // 백두숯불갈비 (경남)
  '4800000-101-1987-00011', // 독천식당 (전남)
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
      version: 2,
      migrate: (state: unknown) => {
        const s = state as { favoriteIds?: string[] }
        // v2: 더미 즐겨찾기 확장 — 기존 더미(6개 이하)는 새 세트로 교체
        const hasDummy = !s.favoriteIds || s.favoriteIds.length <= 6
        return {
          ...s,
          favoriteIds: hasDummy ? DUMMY_FAVORITE_IDS : s.favoriteIds,
        }
      },
    }
  )
)
