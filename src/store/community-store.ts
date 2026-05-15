import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PostComment {
  id: string
  content: string
  authorName: string
  createdAt: string
}

export interface Post {
  id: string
  region: string
  type: 'recommend' | 'general'
  title: string
  content: string
  authorName: string
  createdAt: string
  restaurantId?: string
  restaurantName?: string
  restaurantAddress?: string
  likedBy: string[]
  comments: PostComment[]
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// 더미 데이터: 앱 최초 실행 시 표시되는 샘플 게시글
const DUMMY_POSTS: Post[] = [
  {
    id: 'dummy-1',
    region: 'seoul',
    type: 'recommend',
    title: '광화문 근처 직장인 점심 추천',
    content: '광화문 쪽에서 일하는데 점심 때마다 어디 갈지 고민이었거든요. 여기 갔다가 완전 반해버렸어요. 오래된 모범식당인데 가격도 착하고 양도 넉넉해요. 특히 된장찌개가 진짜 집밥 느낌이라 자주 찾게 됩니다.',
    authorName: '광화문직장인',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
    restaurantName: '청목',
    restaurantAddress: '서울특별시 종로구 사직로8길 24',
    likedBy: ['session-a', 'session-b', 'session-c'],
    comments: [
      {
        id: 'dc-1-1',
        content: '저도 여기 자주 가요! 갈비탕도 추천합니다 👍',
        authorName: '종로맛집러',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 'dc-1-2',
        content: '된장찌개 맛집으로 유명한 곳이죠. 오래됐는데 여전히 맛있어요',
        authorName: '서울토박이',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: 'dummy-2',
    region: 'busan',
    type: 'recommend',
    title: '해운대 근처 회 먹으러 갔다가 찾은 보석 같은 곳',
    content: '부산 여행 갔다가 해운대 말고 조용한 데서 먹고 싶어서 찾아봤어요. 블루리본에도 나와있고 현지인들이 많이 찾는 곳인데 관광지 가격이 아니라 너무 좋았어요. 물회가 진짜 시원하고 신선해서 감동받았습니다.',
    authorName: '부산여행자',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18시간 전
    restaurantName: '할매집',
    restaurantAddress: '부산광역시 해운대구 중동1로 55',
    likedBy: ['session-a', 'session-d'],
    comments: [
      {
        id: 'dc-2-1',
        content: '부산 사람인데 저도 여기 좋아해요! 아는 사람만 아는 맛집이었는데 이제 많이 알려지겠네요 😄',
        authorName: '해운대토박이',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 15).toISOString(),
      },
    ],
  },
  {
    id: 'dummy-3',
    region: 'all',
    type: 'general',
    title: '모범식당 인증 기준이 뭔가요?',
    content: '지도 보다가 궁금해서요. 모범식당이랑 착한가격업소가 뭐가 다른 건지 잘 모르겠어요. 둘 다 정부에서 인증해주는 건가요? 그리고 인증 기준이 어떻게 되는지 아시는 분 있나요?',
    authorName: '호기심많은유저',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
    likedBy: ['session-b', 'session-e', 'session-f'],
    comments: [
      {
        id: 'dc-3-1',
        content: '모범식당은 시·도지사가 지정하는 거고요, 위생 상태, 서비스, 음식 품질 등을 종합 평가해요. 착한가격업소는 물가 안정 차원에서 저렴하게 판매하는 업소 위주로 지정합니다!',
        authorName: '식품업계종사자',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      },
      {
        id: 'dc-3-2',
        content: '감사합니다! 그럼 블루리본은 민간 평가인 거죠?',
        authorName: '호기심많은유저',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
      {
        id: 'dc-3-3',
        content: '맞아요. 블루리본은 민간 맛집 가이드고, 빕구르망은 미쉐린 가이드에서 선정한 거예요 😊',
        authorName: '식품업계종사자',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19).toISOString(),
      },
    ],
  },
  {
    id: 'dummy-4',
    region: 'gyeonggi',
    type: 'recommend',
    title: '수원 왕갈비 원조 찾아 헤매다가 드디어 발견',
    content: '수원 갈비 유명하다는 건 알았는데 어디가 진짜 원조인지 몰라서 여러 군데 다녔어요. 여기가 진짜 오래된 집이고 갈비 두께가 남다르더라고요. 숯불에 직접 구워주시는데 연기 냄새 배는 게 좀 아쉽지만 맛은 최고입니다.',
    authorName: '갈비덕후',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5일 전
    restaurantName: '화춘옥',
    restaurantAddress: '경기도 수원시 팔달구 정조로 618',
    likedBy: ['session-a', 'session-c', 'session-g', 'session-h'],
    comments: [
      {
        id: 'dc-4-1',
        content: '수원 갈비 진짜 맛있죠. 거기 양념갈비는 꼭 드셔야 해요!',
        authorName: '수원시민',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: 'dummy-5',
    region: 'seoul',
    type: 'general',
    title: '혼밥하기 좋은 모범식당 추천해주세요',
    content: '혼자 다니는 편인데 모범식당이나 착한가격업소 중에 혼밥하기 편한 곳 있으면 알려주세요. 카운터석이나 혼자 앉기 좋은 구조면 더 좋고요. 강남이나 홍대 쪽이면 더 좋겠습니다!',
    authorName: '혼밥러',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2일 전
    likedBy: ['session-b'],
    comments: [
      {
        id: 'dc-5-1',
        content: '홍대 쪽 순댓국 집들은 대부분 혼밥 가능해요. 카운터석 있는 곳들 많더라고요 😊',
        authorName: '혼밥고수',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 45).toISOString(),
      },
      {
        id: 'dc-5-2',
        content: '저는 국밥류 파는 모범식당은 혼자 가도 어색하지 않았어요. 테이블 간격도 넓고 직원분들도 친절하시더라고요',
        authorName: '서울직장인',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
      },
    ],
  },
  {
    id: 'dummy-6',
    region: 'daegu',
    type: 'recommend',
    title: '대구 막창 성지에서 찾은 숨은 고수',
    content: '대구 여행에서 막창 먹으러 안지랑 골목 갔다가 줄 서기 싫어서 골목 안쪽으로 들어갔는데 여기가 진짜 대박이에요. 사장님이 직접 구워주시고 된장에 찍어 먹는 스타일인데 막창 특유의 잡내가 전혀 없어요.',
    authorName: '대구여행객',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3일 전
    likedBy: ['session-d', 'session-e'],
    comments: [],
  },
  {
    id: 'dummy-7',
    region: 'jeju',
    type: 'general',
    title: '제주 여행 맛집 공유해요',
    content: '이번 주말 제주 여행 가는데 모범식당이나 블루리본 위주로 미리 찜해뒀어요. 그런데 혹시 제주 현지인 분들이 자주 가는 숨은 맛집도 있나요? 관광지 식당은 이미 많이 알려져서 좀 다른 곳 가보고 싶어요.',
    authorName: '제주여행준비중',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4일 전
    likedBy: ['session-f', 'session-g'],
    comments: [
      {
        id: 'dc-7-1',
        content: '제주 토박이인데요! 성읍민속마을 근처 흑돼지 구이 집들은 관광객보다 현지인이 많아요. 고기도 더 두껍고 저렴합니다',
        authorName: '제주도민',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 90).toISOString(),
      },
      {
        id: 'dc-7-2',
        content: '제주 서쪽 한림 쪽 국수 집들도 강추예요. 멸치 육수가 진짜 제주 스타일이라 다르더라고요',
        authorName: '제주자주감',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
      },
    ],
  },
]

interface CommunityState {
  posts: Post[]
  sessionId: string

  addPost: (data: Omit<Post, 'id' | 'createdAt' | 'likedBy' | 'comments'>) => string
  deletePost: (id: string) => void
  toggleLike: (postId: string) => void
  addComment: (postId: string, content: string, authorName: string) => void
  deleteComment: (postId: string, commentId: string) => void
}

export const useCommunityStore = create<CommunityState>()(
  persist(
    (set, get) => ({
      posts: DUMMY_POSTS,
      sessionId: generateId(),

      addPost: (data) => {
        const id = generateId()
        const post: Post = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          likedBy: [],
          comments: [],
        }
        set({ posts: [post, ...get().posts] })
        return id
      },

      deletePost: (id) => {
        set({ posts: get().posts.filter((p) => p.id !== id) })
      },

      toggleLike: (postId) => {
        const { posts, sessionId } = get()
        set({
          posts: posts.map((p) => {
            if (p.id !== postId) return p
            const liked = p.likedBy.includes(sessionId)
            return {
              ...p,
              likedBy: liked
                ? p.likedBy.filter((id) => id !== sessionId)
                : [...p.likedBy, sessionId],
            }
          }),
        })
      },

      addComment: (postId, content, authorName) => {
        const { posts } = get()
        const comment: PostComment = {
          id: generateId(),
          content,
          authorName,
          createdAt: new Date().toISOString(),
        }
        set({
          posts: posts.map((p) =>
            p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
          ),
        })
      },

      deleteComment: (postId, commentId) => {
        const { posts } = get()
        set({
          posts: posts.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
              : p
          ),
        })
      },
    }),
    {
      name: 'best-restaurant-community',
      version: 1,
      migrate: (state: unknown) => {
        // v0 → v1: 더미 데이터 시딩
        const s = state as { posts?: Post[]; sessionId?: string }
        if (!s.posts || s.posts.length === 0) {
          return { ...s, posts: DUMMY_POSTS }
        }
        return s
      },
    }
  )
)
