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

function ago(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

const DUMMY_VISITS: VisitEntry[] = [
  { restaurantId: '3000000-101-1967-03256', name: '남대문막내횟집', address: '서울특별시 종로구 우정국로 4-1 (관철동)', region: '서울특별시', visitedAt: ago(3), note: '신선도 최고, 광어 세트 추천' },
  { restaurantId: '3000000-101-1968-06103', name: '함흥곰보냉면', address: '서울특별시 종로구 창경궁로 109', region: '서울특별시', visitedAt: ago(10) },
  { restaurantId: 'blueribbon-909', name: '팔선', address: '서울특별시 중구 동호로 249', region: '서울특별시', visitedAt: ago(21), note: '특별한 날에 딱 맞는 곳' },
  { restaurantId: '3250000-101-1979-02040', name: '물꽁식당', address: '부산광역시 중구 흑교로59번길 3 (보수동2가)', region: '부산광역시', visitedAt: ago(35) },
  { restaurantId: '3420000-101-1987-00003', name: '올라오니', address: '대구광역시 동구 팔공산로185길 60 (용수동)', region: '대구광역시', visitedAt: ago(50), note: '팔공산 등산 후 산채정식' },
  { restaurantId: '4181000-101-1972-00001', name: '샘밭막국수', address: '강원특별자치도 춘천시 신북읍 신샘밭로 644', region: '강원특별자치도', visitedAt: ago(62) },
  { restaurantId: 'bibgourmand-132645', name: '옥돌현옥', address: '송파구 오금로 36길 26-1', region: '서울특별시', visitedAt: ago(75), note: '갈비찜 강추. 미쉐린 받을만해요' },
  { restaurantId: '6510000-101-1976-00070', name: '도두', address: '제주특별자치도 제주시 도두3길 48 (도두일동)', region: '제주특별자치도', visitedAt: ago(90) },
  { restaurantId: '3490000-101-1962-00001', name: '진흥각', address: '인천광역시 중구 신포로23번길 20, 1,2,3층 (중앙동4가)', region: '인천광역시', visitedAt: ago(105), note: '인천 차이나타운 옆 오래된 중화요리 맛집' },
  { restaurantId: '3640000-101-1971-00001', name: '한밭식당', address: '대전광역시 동구 태전로 3 (중동)', region: '대전광역시', visitedAt: ago(118) },
  { restaurantId: '5310000-101-1976-00048', name: '육거리곰탕', address: '경상남도 진주시 망경로 303 (강남동)', region: '경상남도', visitedAt: ago(130), note: '진주 곰탕 원조집. 진한 국물이 일품' },
  { restaurantId: '4800000-101-1982-00002', name: '영란횟집', address: '전라남도 목포시 번화로 42-1 (만호동)', region: '전라남도', visitedAt: ago(145) },
]

const DUMMY_WISHLIST: WishlistEntry[] = [
  { restaurantId: 'blueribbon-31431', name: '세븐스도어', address: '서울특별시 강남구 학동로97길 41', region: '서울특별시', addedAt: ago(5) },
  { restaurantId: 'bibgourmand-132644', name: '곰탕랩', address: '강남구 테헤란로 517, 현대백화점 10층', region: '서울특별시', addedAt: ago(8) },
  { restaurantId: 'blueribbon-34659', name: '팔레트', address: '부산광역시 해운대구 달맞이길65번길 154', region: '부산광역시', addedAt: ago(12) },
  { restaurantId: '4651000-101-1967-00003', name: '삼백집', address: '전북특별자치도 전주시 완산구 전주객사2길 22 (고사동)', region: '전북특별자치도', addedAt: ago(18) },
  { restaurantId: '3750000-101-1984-00024', name: '삼풍가든', address: '경기도 수원시 장안구 서부로 2388 (이목동)', region: '경기도', addedAt: ago(23) },
  { restaurantId: 'blueribbon-28185', name: '트웰브키친', address: '대구광역시 수성구 무학로11길 10', region: '대구광역시', addedAt: ago(30) },
  { restaurantId: '6510000-101-1976-00123', name: '원조소라횟집', address: '제주특별자치도 제주시 서부두길 18-2, 1~3층 (건입동)', region: '제주특별자치도', addedAt: ago(40) },
  { restaurantId: '3590000-101-1969-00002', name: '신성', address: '광주광역시 동구 충장로 101-17 (충장로1가)', region: '광주광역시', addedAt: ago(48) },
  { restaurantId: 'blueribbon-4378', name: '강천매운탕', address: '경기도 여주시 강천면 강천리길 85', region: '경기도', addedAt: ago(55) },
  { restaurantId: '3690000-101-1985-00017', name: '궁중삼계탕', address: '울산광역시 중구 먹자거리 6 (성남동)', region: '울산광역시', addedAt: ago(63) },
  { restaurantId: '4390000-101-1982-00039', name: '영화식당', address: '충청북도 충주시 수안보면 물탕1길 11', region: '충청북도', addedAt: ago(70) },
]

const DUMMY_REVIEWS: ReviewEntry[] = [
  { restaurantId: '3000000-101-1967-03256', name: '남대문막내횟집', address: '서울특별시 종로구 우정국로 4-1 (관철동)', region: '서울특별시', rating: 5, text: '광어·우럭 세트가 신선도 최고. 서울에서 이 정도면 대만족!', createdAt: ago(3), updatedAt: ago(3) },
  { restaurantId: 'blueribbon-909', name: '팔선', address: '서울특별시 중구 동호로 249', region: '서울특별시', rating: 4, text: '한식 파인다이닝인데 코스 구성이 탄탄해요. 가격 대비 납득 가능.', createdAt: ago(21), updatedAt: ago(21) },
  { restaurantId: '3420000-101-1987-00003', name: '올라오니', address: '대구광역시 동구 팔공산로185길 60 (용수동)', region: '대구광역시', rating: 4, text: '팔공산 등산 후 산채 정식. 나물 향이 진짜 달라요.', createdAt: ago(50), updatedAt: ago(50) },
  { restaurantId: '4181000-101-1972-00001', name: '샘밭막국수', address: '강원특별자치도 춘천시 신북읍 신샘밭로 644', region: '강원특별자치도', rating: 5, text: '춘천 막국수 원조답게 메밀향이 진해요. 다른 막국수가 아쉬워졌어요.', createdAt: ago(62), updatedAt: ago(62) },
  { restaurantId: 'bibgourmand-132645', name: '옥돌현옥', address: '송파구 오금로 36길 26-1', region: '서울특별시', rating: 5, text: '미쉐린 선정이 괜한 게 아니에요. 갈비찜 감동적. 다시 꼭 올게요.', createdAt: ago(75), updatedAt: ago(75) },
  { restaurantId: '6510000-101-1976-00070', name: '도두', address: '제주특별자치도 제주시 도두3길 48 (도두일동)', region: '제주특별자치도', rating: 3, text: '신선한 건 맞는데 가격이 조금 아쉬워요.', createdAt: ago(90), updatedAt: ago(90) },
]

const DUMMY_FAVORITES: string[] = [
  '3000000-101-1968-06103', // 함흥곰보냉면
  '3000000-101-1973-00733', // 이바구
  'blueribbon-31431',        // 세븐스도어
  'bibgourmand-132645',      // 옥돌현옥
  '3250000-101-1981-01605', // 신정식당 (부산)
  '3750000-101-1984-00024', // 삼풍가든 (경기)
]

interface MyRestaurantsState {
  visits: VisitEntry[]
  wishlist: WishlistEntry[]
  reviews: ReviewEntry[]
  // 즐겨찾기는 favorites-store에서 관리하나, 더미 시드용으로 여기서 초기 제공
  seedFavorites: string[]

  addVisit: (entry: Omit<VisitEntry, 'visitedAt'>) => void
  removeVisit: (restaurantId: string) => void
  isVisited: (restaurantId: string) => boolean

  addWishlist: (entry: Omit<WishlistEntry, 'addedAt'>) => void
  removeWishlist: (restaurantId: string) => void
  isWishlisted: (restaurantId: string) => boolean

  upsertReview: (entry: Omit<ReviewEntry, 'createdAt' | 'updatedAt'> & { createdAt?: string }) => void
  removeReview: (restaurantId: string) => void
  getReview: (restaurantId: string) => ReviewEntry | undefined
}

export const useMyRestaurantsStore = create<MyRestaurantsState>()(
  persist(
    (set, get) => ({
      visits: DUMMY_VISITS,
      wishlist: DUMMY_WISHLIST,
      reviews: DUMMY_REVIEWS,
      seedFavorites: DUMMY_FAVORITES,

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
    {
      name: 'best-restaurant-my',
      version: 2,
      migrate: (state: unknown) => {
        const s = state as Partial<MyRestaurantsState>
        // v2: 더미 데이터 확장 — 기존 더미(8개 이하)는 새 세트로 교체
        const hasDummyVisits = !s.visits || s.visits.length <= 8
        const hasDummyWishlist = !s.wishlist || s.wishlist.length <= 7
        return {
          ...s,
          visits: hasDummyVisits ? DUMMY_VISITS : s.visits,
          wishlist: hasDummyWishlist ? DUMMY_WISHLIST : s.wishlist,
          reviews: (s.reviews && s.reviews.length > 0) ? s.reviews : DUMMY_REVIEWS,
          seedFavorites: s.seedFavorites ?? DUMMY_FAVORITES,
        }
      },
    }
  )
)
