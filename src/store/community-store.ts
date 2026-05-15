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
      posts: [],
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
    { name: 'best-restaurant-community' }
  )
)
