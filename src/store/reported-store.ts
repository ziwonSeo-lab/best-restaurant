import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ReportedState {
  reportedIds: string[]
  toggleReport: (id: string) => void
  isReported: (id: string) => boolean
  clearAll: () => void
  exportReported: () => void
  importReported: (ids: string[]) => void
}

export const useReportedStore = create<ReportedState>()(
  persist(
    (set, get) => ({
      reportedIds: [],

      toggleReport: (id) => {
        const { reportedIds } = get()
        const next = reportedIds.includes(id)
          ? reportedIds.filter((rid) => rid !== id)
          : [...reportedIds, id]
        set({ reportedIds: next })
      },

      isReported: (id) => get().reportedIds.includes(id),

      clearAll: () => set({ reportedIds: [] }),

      exportReported: () => {
        const { reportedIds } = get()
        const blob = new Blob([JSON.stringify(reportedIds)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'reported-restaurants.json'
        a.click()
        URL.revokeObjectURL(url)
      },

      importReported: (ids) => set((state) => ({
        reportedIds: [...new Set([...state.reportedIds, ...ids])]
      })),
    }),
    { name: 'best-restaurant-reported' }
  )
)
