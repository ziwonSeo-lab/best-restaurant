import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
const GITHUB_REPO = 'ziwonSeo-lab/best-restaurant'

interface ReportedState {
  /** 사용자가 로컬에서 신고한 ID */
  localReportedIds: string[]
  /** 관리자가 확인한 공유 신고 목록 (서버에서 로드) */
  sharedReportedIds: string[]
  toggleReport: (id: string, restaurantName?: string) => void
  isReported: (id: string) => boolean
  loadSharedReported: () => Promise<void>
  clearLocal: () => void
}

export const useReportedStore = create<ReportedState>()(
  persist(
    (set, get) => ({
      localReportedIds: [],
      sharedReportedIds: [],

      toggleReport: (id, restaurantName) => {
        const { localReportedIds } = get()
        const isRemoving = localReportedIds.includes(id)
        const next = isRemoving
          ? localReportedIds.filter((rid) => rid !== id)
          : [...localReportedIds, id]
        set({ localReportedIds: next })

        // 신고 추가 시 GitHub Issue 링크 열기
        if (!isRemoving) {
          const title = encodeURIComponent(`[연동안됨] ${restaurantName || id}`)
          const body = encodeURIComponent(
            `### 식당 정보\n- **이름**: ${restaurantName || '(알 수 없음)'}\n- **ID**: ${id}\n\n### 사유\n폐업, 상호변경 등으로 네이버지도 연동이 안 됩니다.\n`
          )
          window.open(
            `https://github.com/${GITHUB_REPO}/issues/new?title=${title}&body=${body}&labels=연동안됨`,
            '_blank'
          )
        }
      },

      isReported: (id) => {
        const { localReportedIds, sharedReportedIds } = get()
        return localReportedIds.includes(id) || sharedReportedIds.includes(id)
      },

      loadSharedReported: async () => {
        try {
          const res = await fetch(`${BASE_PATH}/data/reported.json`)
          if (res.ok) {
            const ids = await res.json()
            if (Array.isArray(ids)) {
              set({ sharedReportedIds: ids })
            }
          }
        } catch {
          // 파일이 없거나 네트워크 오류 시 무시
        }
      },

      clearLocal: () => set({ localReportedIds: [] }),
    }),
    {
      name: 'best-restaurant-reported',
      partialize: (state) => ({ localReportedIds: state.localReportedIds }),
    }
  )
)
