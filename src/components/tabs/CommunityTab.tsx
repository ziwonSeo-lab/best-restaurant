'use client'

import { useState, useRef } from 'react'
import { useCommunityStore, type Post } from '@/store/community-store'
import { useRestaurantStore } from '@/store/restaurant-store'
import { REGIONS } from '@/lib/regions'

type CommunityView = 'list' | 'write' | 'detail'

const ALL_REGIONS = [
  { code: 'all', name: '전체' },
  ...Object.entries(REGIONS)
    .filter(([code]) => code !== 'all')
    .map(([code, info]) => ({ code, name: info.name })),
]

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

interface WriteFormProps {
  onCancel: () => void
  onSuccess: (id: string) => void
}

function WriteForm({ onCancel, onSuccess }: WriteFormProps) {
  const [postType, setPostType] = useState<'general' | 'recommend'>('general')
  const [region, setRegion] = useState('all')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [restaurantQuery, setRestaurantQuery] = useState('')
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>()
  const [selectedRestaurantName, setSelectedRestaurantName] = useState('')
  const [selectedRestaurantAddress, setSelectedRestaurantAddress] = useState('')

  const addPost = useCommunityStore((s) => s.addPost)
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)

  const restaurantResults = restaurantQuery.length >= 2
    ? allRestaurants
        .filter((r) => r.name.includes(restaurantQuery))
        .slice(0, 8)
    : []

  const handleSubmit = () => {
    if (!title.trim() || !content.trim() || !authorName.trim()) return
    const id = addPost({
      region,
      type: postType,
      title: title.trim(),
      content: content.trim(),
      authorName: authorName.trim(),
      restaurantId: selectedRestaurantId,
      restaurantName: selectedRestaurantName || undefined,
      restaurantAddress: selectedRestaurantAddress || undefined,
    })
    onSuccess(id)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50">
      <div className="bg-white px-4 py-3 border-b border-stone-100">
        <div className="flex gap-2 mb-3">
          {(['general', 'recommend'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPostType(t)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                postType === t
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-500'
              }`}
            >
              {t === 'general' ? '일반' : '추천식당'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">닉네임</label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="닉네임을 입력해주세요"
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">지역</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50"
            >
              {ALL_REGIONS.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>

          {postType === 'recommend' && (
            <div className="relative">
              <label className="block text-[11px] font-medium text-stone-500 mb-1">추천 식당</label>
              {selectedRestaurantId ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-200">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-teal-800 truncate">{selectedRestaurantName}</p>
                    <p className="text-[11px] text-teal-600 truncate">{selectedRestaurantAddress}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRestaurantId(undefined)
                      setSelectedRestaurantName('')
                      setSelectedRestaurantAddress('')
                      setRestaurantQuery('')
                    }}
                    className="text-teal-400 hover:text-teal-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={restaurantQuery}
                    onChange={(e) => setRestaurantQuery(e.target.value)}
                    placeholder="식당 이름으로 검색"
                    className="w-full text-[13px] px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50"
                  />
                  {restaurantResults.length > 0 && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
                      {restaurantResults.map((r) => (
                        <li key={r.id}>
                          <button
                            className="w-full px-3 py-2 text-left hover:bg-stone-50"
                            onClick={() => {
                              setSelectedRestaurantId(r.id)
                              setSelectedRestaurantName(r.name)
                              setSelectedRestaurantAddress(r.address)
                              setRestaurantQuery('')
                            }}
                          >
                            <p className="text-[12px] font-medium text-stone-800">{r.name}</p>
                            <p className="text-[11px] text-stone-400 truncate">{r.address}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력해주세요"
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-stone-500 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력해주세요"
              rows={5}
              className="w-full text-[13px] px-3 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 py-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-stone-100 text-stone-600"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || !authorName.trim()}
          className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-stone-800 text-white disabled:opacity-40"
        >
          등록
        </button>
      </div>
    </div>
  )
}

interface PostDetailProps {
  postId: string
  onBack: () => void
}

function PostDetail({ postId, onBack }: PostDetailProps) {
  const post = useCommunityStore((s) => s.posts.find((p) => p.id === postId))
  const { toggleLike, addComment, deleteComment, deletePost, sessionId } = useCommunityStore()
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  if (!post) return null

  const isLiked = post.likedBy.includes(sessionId)

  const handleAddComment = () => {
    if (!commentText.trim() || !commentAuthor.trim()) return
    addComment(post.id, commentText.trim(), commentAuthor.trim())
    setCommentText('')
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white border-b border-stone-100">
        <button onClick={onBack} className="p-1 -ml-1 text-stone-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-[14px] font-semibold text-stone-800 flex-1 truncate">{post.title}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white px-4 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
              post.type === 'recommend'
                ? 'bg-teal-100 text-teal-700'
                : 'bg-stone-100 text-stone-500'
            }`}>
              {post.type === 'recommend' ? '추천식당' : '일반'}
            </span>
            <span className="text-[11px] text-stone-400">{REGIONS[post.region]?.name ?? '전체'}</span>
          </div>

          {post.restaurantName && (
            <div className="mb-3 p-3 bg-teal-50 rounded-lg border border-teal-100">
              <p className="text-[12px] font-semibold text-teal-800">{post.restaurantName}</p>
              {post.restaurantAddress && (
                <p className="text-[11px] text-teal-600 mt-0.5">{post.restaurantAddress}</p>
              )}
            </div>
          )}

          <p className="text-[13px] text-stone-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
            <span className="text-[11px] text-stone-400">{post.authorName} · {formatRelative(post.createdAt)}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1 text-[12px] transition-colors ${
                  isLiked ? 'text-red-500' : 'text-stone-400'
                }`}
              >
                <svg className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                <span>{post.likedBy.length}</span>
              </button>
              <span className="text-[12px] text-stone-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                </svg>
                {post.comments.length}
              </span>
              <button
                onClick={() => { deletePost(post.id); onBack() }}
                className="text-[12px] text-stone-300 hover:text-red-400 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>

        {/* 댓글 목록 */}
        <div>
          {post.comments.map((c) => (
            <div key={c.id} className="px-4 py-3 bg-white border-b border-stone-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[11px] font-semibold text-stone-600 mr-2">{c.authorName}</span>
                  <span className="text-[11px] text-stone-400">{formatRelative(c.createdAt)}</span>
                  <p className="text-[12px] text-stone-700 mt-1 leading-relaxed">{c.content}</p>
                </div>
                <button
                  onClick={() => deleteComment(post.id, c.id)}
                  className="flex-shrink-0 p-1 text-stone-300 hover:text-red-400 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 댓글 입력 */}
      <div className="flex-shrink-0 bg-white border-t border-stone-200/60 px-3 py-2">
        <div className="flex gap-2 mb-1.5">
          <input
            value={commentAuthor}
            onChange={(e) => setCommentAuthor(e.target.value)}
            placeholder="닉네임"
            className="w-20 text-[12px] px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50 flex-shrink-0"
          />
          <textarea
            ref={inputRef}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="댓글을 입력해주세요"
            rows={1}
            className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 bg-stone-50 resize-none"
          />
          <button
            onClick={handleAddComment}
            disabled={!commentText.trim() || !commentAuthor.trim()}
            className="flex-shrink-0 px-3 py-1.5 bg-stone-800 text-white rounded-lg text-[12px] font-medium disabled:opacity-40"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  )
}

interface PostListProps {
  onWrite: () => void
  onOpenPost: (id: string) => void
}

function PostList({ onWrite, onOpenPost }: PostListProps) {
  const [regionFilter, setRegionFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'recommend' | 'general'>('all')
  const posts = useCommunityStore((s) => s.posts)
  const { toggleLike, sessionId } = useCommunityStore()

  const filtered = posts.filter((p) => {
    if (regionFilter !== 'all' && p.region !== regionFilter) return false
    if (typeFilter !== 'all' && p.type !== typeFilter) return false
    return true
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 필터 */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 px-3 py-2 space-y-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {(['all', 'recommend', 'general'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                typeFilter === t ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {t === 'all' ? '전체글' : t === 'recommend' ? '추천식당' : '일반'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {ALL_REGIONS.slice(0, 10).map((r) => (
            <button
              key={r.code}
              onClick={() => setRegionFilter(r.code)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                regionFilter === r.code ? 'bg-stone-700 text-white' : 'bg-stone-100 text-stone-500'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <span className="text-4xl mb-3">💬</span>
            <p className="text-[13px] font-medium text-stone-500">아직 게시글이 없어요</p>
            <p className="text-[11px] text-stone-400 mt-1">첫 번째 글을 작성해보세요</p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filtered.map((post) => {
              const isLiked = post.likedBy.includes(sessionId)
              return (
                <li key={post.id} className="bg-white">
                  <button
                    className="w-full px-4 py-3 text-left"
                    onClick={() => onOpenPost(post.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            post.type === 'recommend'
                              ? 'bg-teal-100 text-teal-700'
                              : 'bg-stone-100 text-stone-500'
                          }`}>
                            {post.type === 'recommend' ? '추천' : '일반'}
                          </span>
                          {post.region !== 'all' && (
                            <span className="text-[10px] text-stone-400">{REGIONS[post.region]?.name}</span>
                          )}
                        </div>
                        <p className="text-[13px] font-semibold text-stone-800 truncate">{post.title}</p>
                        {post.restaurantName && (
                          <p className="text-[11px] text-teal-600 mt-0.5 truncate">🍽 {post.restaurantName}</p>
                        )}
                        <p className="text-[12px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">{post.content}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] text-stone-400">{post.authorName} · {formatRelative(post.createdAt)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleLike(post.id) }}
                          className={`flex items-center gap-0.5 text-[11px] ${isLiked ? 'text-red-500' : 'text-stone-400'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                          </svg>
                          {post.likedBy.length}
                        </button>
                        <span className="flex items-center gap-0.5 text-[11px] text-stone-400">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
                          </svg>
                          {post.comments.length}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* 글쓰기 버튼 */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-stone-100">
        <button
          onClick={onWrite}
          className="w-full py-2.5 bg-stone-800 text-white rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          글 작성하기
        </button>
      </div>
    </div>
  )
}

export default function CommunityTab() {
  const [view, setView] = useState<CommunityView>('list')
  const [openPostId, setOpenPostId] = useState<string | null>(null)

  if (view === 'write') {
    return (
      <div className="h-full flex flex-col bg-stone-50">
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-white border-b border-stone-100">
          <button onClick={() => setView('list')} className="p-1 -ml-1 text-stone-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <span className="text-[14px] font-semibold text-stone-800">글 작성</span>
        </div>
        <WriteForm
          onCancel={() => setView('list')}
          onSuccess={(id) => {
            setOpenPostId(id)
            setView('detail')
          }}
        />
      </div>
    )
  }

  if (view === 'detail' && openPostId) {
    return (
      <div className="h-full flex flex-col bg-stone-50">
        <PostDetail postId={openPostId} onBack={() => setView('list')} />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-stone-50">
      <PostList
        onWrite={() => setView('write')}
        onOpenPost={(id) => {
          setOpenPostId(id)
          setView('detail')
        }}
      />
    </div>
  )
}
