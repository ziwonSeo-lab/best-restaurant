import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HistoryState {
  searches: string[]
  addSearch: (query: string) => void
  removeSearch: (query: string) => void
  clearAll: () => void
}

const MAX_HISTORY = 20

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      searches: [],

      addSearch: (query) => {
        const trimmed = query.trim()
        if (!trimmed) return
        const { searches } = get()
        const filtered = searches.filter((s) => s !== trimmed)
        set({ searches: [trimmed, ...filtered].slice(0, MAX_HISTORY) })
      },

      removeSearch: (query) => {
        set({ searches: get().searches.filter((s) => s !== query) })
      },

      clearAll: () => set({ searches: [] }),
    }),
    { name: 'best-restaurant-history' }
  )
)
