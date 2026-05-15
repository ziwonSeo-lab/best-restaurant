'use client'

import { useState } from 'react'
import { useMyRestaurantsStore } from '@/store/my-restaurants-store'
import { useFavoritesStore } from '@/store/favorites-store'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useTabStore } from '@/store/tab-store'

type SubTab = 'reviews' | 'visited' | 'favorites' | 'wishlist'

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'reviews', label: '내 리뷰' },
  { id: 'visited', label: '가봤어' },
  { id: 'favorites', label: '내식당' },
  { id: 'wishlist', label: '가볼꺼야' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < rating ? 'text-amber-400' : 'text-stone-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function MapLinkButton({ restaurantId, name }: { restaurantId: string; name: string }) {
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)
  const setSelectedRestaurant = useRestaurantStore((s) => s.setSelectedRestaurant)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  const restaurant = allRestaurants.find((r) => r.id === restaurantId)

  const handleClick = () => {
    if (restaurant) {
      setSelectedRestaurant(restaurant)
      setActiveTab('map')
    }
  }

  if (!restaurant) return null

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-stone-500 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors flex-shrink-0"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
      지도
    </button>
  )
}

export default function MyRestaurantsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('reviews')

  const { visits, wishlist, reviews, removeVisit, removeWishlist, removeReview } =
    useMyRestaurantsStore()
  const { favoriteIds, toggleFavorite } = useFavoritesStore()
  const allRestaurants = useRestaurantStore((s) => s.allRestaurants)
  const setSelectedRestaurant = useRestaurantStore((s) => s.setSelectedRestaurant)
  const setActiveTab = useTabStore((s) => s.setActiveTab)

  const favoriteRestaurants = favoriteIds
    .map((id) => allRestaurants.find((r) => r.id === id))
    .filter(Boolean)

  return (
    <div className="h-full flex flex-col bg-stone-50">
      {/* Sub-tabs */}
      <div className="flex-shrink-0 bg-white border-b border-stone-200/60 px-3">
        <div className="flex gap-0">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative px-3 py-3 text-[12px] font-medium transition-colors ${
                activeSubTab === tab.id ? 'text-stone-800' : 'text-stone-400'
              }`}
            >
              {tab.label}
              {activeSubTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-800 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'reviews' && (
          <div>
            {reviews.length === 0 ? (
              <EmptyState icon="✍️" message="아직 남긴 리뷰가 없어요" />
            ) : (
              <ul className="divide-y divide-stone-100">
                {reviews.map((r) => (
                  <li key={r.restaurantId} className="px-4 py-3 bg-white mb-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-stone-800 truncate">{r.name}</p>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">{r.address}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <StarRating rating={r.rating} />
                          <span className="text-[11px] text-stone-400">{formatDate(r.updatedAt)}</span>
                        </div>
                        {r.text && (
                          <p className="text-[12px] text-stone-600 mt-1.5 leading-relaxed">{r.text}</p>
                        )}
                        <div className="mt-2">
                          <MapLinkButton restaurantId={r.restaurantId} name={r.name} />
                        </div>
                      </div>
                      <button
                        onClick={() => removeReview(r.restaurantId)}
                        className="flex-shrink-0 p-1.5 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeSubTab === 'visited' && (
          <div>
            {visits.length === 0 ? (
              <EmptyState icon="📍" message="아직 기록한 방문 식당이 없어요" />
            ) : (
              <ul className="divide-y divide-stone-100">
                {visits.map((v) => (
                  <li key={v.restaurantId} className="px-4 py-3 bg-white mb-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-stone-800 truncate">{v.name}</p>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">{v.address}</p>
                        {v.note && (
                          <p className="text-[12px] text-stone-600 mt-1">{v.note}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-stone-400">방문: {formatDate(v.visitedAt)}</span>
                          <MapLinkButton restaurantId={v.restaurantId} name={v.name} />
                        </div>
                      </div>
                      <button
                        onClick={() => removeVisit(v.restaurantId)}
                        className="flex-shrink-0 p-1.5 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeSubTab === 'favorites' && (
          <div>
            {favoriteRestaurants.length === 0 ? (
              <EmptyState icon="❤️" message="내식당에 추가된 식당이 없어요" subMessage="지도에서 식당을 눌러 즐겨찾기에 추가해보세요" />
            ) : (
              <ul className="divide-y divide-stone-100">
                {favoriteRestaurants.map((r) => {
                  if (!r) return null
                  return (
                    <li key={r.id} className="px-4 py-3 bg-white mb-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => {
                            setSelectedRestaurant(r)
                            setActiveTab('map')
                          }}
                        >
                          <p className="text-[13px] font-semibold text-stone-800 truncate">{r.name}</p>
                          <p className="text-[11px] text-stone-400 truncate mt-0.5">{r.address}</p>
                        </button>
                        <button
                          onClick={() => toggleFavorite(r.id)}
                          className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}

        {activeSubTab === 'wishlist' && (
          <div>
            {wishlist.length === 0 ? (
              <EmptyState icon="🎯" message="가볼꺼야 목록이 비었어요" subMessage="지도에서 식당을 눌러 추가해보세요" />
            ) : (
              <ul className="divide-y divide-stone-100">
                {wishlist.map((w) => (
                  <li key={w.restaurantId} className="px-4 py-3 bg-white mb-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-stone-800 truncate">{w.name}</p>
                        <p className="text-[11px] text-stone-400 truncate mt-0.5">{w.address}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-stone-400">추가: {formatDate(w.addedAt)}</span>
                          <MapLinkButton restaurantId={w.restaurantId} name={w.name} />
                        </div>
                      </div>
                      <button
                        onClick={() => removeWishlist(w.restaurantId)}
                        className="flex-shrink-0 p-1.5 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({
  icon,
  message,
  subMessage,
}: {
  icon: string
  message: string
  subMessage?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-[13px] font-medium text-stone-500">{message}</p>
      {subMessage && <p className="text-[11px] text-stone-400 mt-1">{subMessage}</p>}
    </div>
  )
}
