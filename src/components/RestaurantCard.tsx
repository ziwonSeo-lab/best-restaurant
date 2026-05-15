'use client'

import { useState } from 'react'
import type { Restaurant } from '@/lib/types'
import { useFavoritesStore } from '@/store/favorites-store'
import { useReportedStore } from '@/store/reported-store'
import { useMyRestaurantsStore } from '@/store/my-restaurants-store'
import { formatDesignatedDate, isOlderThanYears } from '@/lib/date-utils'

function getShortAddress(restaurant: Restaurant): string {
  const addr = restaurant.address || restaurant.jibunAddress || ''
  const parts = addr.split(/\s+/)
  const gu = parts.find((p) => /[구군]$/.test(p)) || parts[1] || ''

  const parenMatch = addr.match(/\(([^)]*[동면읍리])/)
  if (parenMatch) return gu + ' ' + parenMatch[1]

  const jibun = restaurant.jibunAddress || ''
  const dong = jibun.split(/\s+/).find((p) => /[동면읍리]$/.test(p))
  if (dong) return gu + ' ' + dong

  return gu
}

interface RestaurantCardProps {
  restaurant: Restaurant
  onClose: () => void
}

function getRibbonCount(restaurant: Restaurant): number {
  if (restaurant.source !== 'blueribbon') return 0
  return restaurant.ribbonType === 'RIBBON_THREE' ? 3 :
    restaurant.ribbonType === 'RIBBON_TWO' ? 2 : 1
}

function SourceBadge({ restaurant }: { restaurant: Restaurant }) {
  const isBlueRibbon = restaurant.source === 'blueribbon'
  const isBibGourmand = restaurant.source === 'bibgourmand'
  const isYesKidsZone = restaurant.source === 'yeskidszone'

  if (isBlueRibbon) {
    const count = getRibbonCount(restaurant)
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded">
        블루리본
        {Array.from({ length: count }).map((_, i) => (
          <svg key={i} className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
    )
  }

  if (isBibGourmand) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-rose-50 text-rose-700 rounded">
        빕 구르망
      </span>
    )
  }

  if (isYesKidsZone) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-violet-50 text-violet-700 rounded">
        유모차OK
      </span>
    )
  }

  if (restaurant.source === 'goodprice') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 rounded">
        착한가격
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded">
      모범식당
    </span>
  )
}

function ReviewForm({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant
  onClose: () => void
}) {
  const { getReview, upsertReview, removeReview } = useMyRestaurantsStore()
  const existing = getReview(restaurant.id)
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [text, setText] = useState(existing?.text ?? '')

  const handleSave = () => {
    if (!rating) return
    upsertReview({
      restaurantId: restaurant.id,
      name: restaurant.name,
      address: restaurant.address || restaurant.jibunAddress || '',
      region: restaurant.region,
      rating,
      text,
    })
    onClose()
  }

  return (
    <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-stone-700">리뷰 작성</span>
        {existing && (
          <button
            onClick={() => { removeReview(restaurant.id); onClose() }}
            className="text-[11px] text-red-400"
          >
            삭제
          </button>
        )}
      </div>
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onClick={() => setRating(i + 1)}>
            <svg className={`w-6 h-6 ${i < rating ? 'text-amber-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        <span className="text-[11px] text-stone-400 ml-1">{rating > 0 ? `${rating}점` : '별점 선택'}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="한 줄 감상을 남겨보세요 (선택)"
        rows={2}
        className="w-full text-[12px] px-2.5 py-2 rounded-lg border border-stone-200 focus:outline-none focus:border-stone-400 resize-none bg-white"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={onClose} className="flex-1 py-1.5 rounded-lg text-[12px] bg-stone-100 text-stone-500">취소</button>
        <button onClick={handleSave} disabled={!rating} className="flex-1 py-1.5 rounded-lg text-[12px] bg-stone-800 text-white disabled:opacity-40">저장</button>
      </div>
    </div>
  )
}

export default function RestaurantCard({
  restaurant,
  onClose,
}: RestaurantCardProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const isBlueRibbon = restaurant.source === 'blueribbon'
  const isBibGourmand = restaurant.source === 'bibgourmand'
  const isYesKidsZone = restaurant.source === 'yeskidszone'
  const isGoodPrice = restaurant.source === 'goodprice'
  const isFavorite = useFavoritesStore((s) => s.isFavorite(restaurant.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const isReported = useReportedStore((s) => s.isReported(restaurant.id))
  const toggleReport = useReportedStore((s) => s.toggleReport)
  const { isVisited, addVisit, removeVisit, isWishlisted, addWishlist, removeWishlist, getReview } =
    useMyRestaurantsStore()
  const visited = isVisited(restaurant.id)
  const wishlisted = isWishlisted(restaurant.id)
  const hasReview = !!getReview(restaurant.id)

  return (
    <div className={`rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] border-t border-stone-200/60 animate-slide-up ${isReported ? 'bg-stone-50' : 'bg-white'}`}>
      {/* 핸들 바 */}
      <div className="flex justify-center pt-3 pb-1.5">
        <div className="w-8 h-1 bg-stone-200 rounded-full" />
      </div>

      <div className="px-4 pb-4 pb-safe">
        {/* 신고 배너 */}
        {isReported && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
            <p className="text-xs text-red-600">
              네이버지도 연동이 안 되는 식당입니다
            </p>
            <button
              onClick={() => toggleReport(restaurant.id, restaurant.name)}
              className="text-xs text-red-500 underline flex-shrink-0 ml-2 cursor-pointer"
            >
              취소
            </button>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[17px] font-bold text-stone-900 truncate leading-tight">
                {restaurant.name}
              </h3>
              <button
                onClick={() => toggleFavorite(restaurant.id)}
                className="flex-shrink-0 transition-transform active:scale-125 cursor-pointer"
                aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                <svg className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-stone-300'}`} fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            </div>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              <SourceBadge restaurant={restaurant} />
              {restaurant.foodType && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-stone-100 text-stone-600 rounded">
                  {restaurant.foodType}
                </span>
              )}
              {restaurant.mainFood && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 rounded">
                  {restaurant.mainFood}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-sm text-stone-600 leading-snug">
              {restaurant.address || restaurant.jibunAddress}
            </span>
          </div>

          {restaurant.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <a href={`tel:${restaurant.phone}`} className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
                {restaurant.phone}
              </a>
            </div>
          )}

          {/* 키즈존 정보 */}
          {isYesKidsZone && restaurant.kidsZoneInfo && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
              <span className="text-sm text-stone-600 leading-snug">
                {restaurant.kidsZoneInfo}
              </span>
            </div>
          )}

          {/* 착한가격: 메뉴/가격 */}
          {isGoodPrice && restaurant.goodpriceMenus && restaurant.goodpriceMenus.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
              <div className="space-y-1">
                {restaurant.goodpriceMenus.map((menu, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-stone-700">{menu.name}</span>
                    <span className="text-orange-700 font-medium">{Number(menu.price).toLocaleString()}원</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 모범식당: 지정일 */}
          {!isBlueRibbon && !isBibGourmand && !isYesKidsZone && !isGoodPrice && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
              <span className="text-sm text-stone-500">
                지정일 {formatDesignatedDate(restaurant.designatedDate || '')}
              </span>
            </div>
          )}

          {/* 5년 이상 경과 경고 */}
          {!isBlueRibbon && !isBibGourmand && !isYesKidsZone && !isGoodPrice && restaurant.designatedDate && isOlderThanYears(restaurant.designatedDate, 5) && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700 leading-relaxed">
                지정일 5년 이상 경과 — 상호 변경 가능성이 있습니다.{' '}
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name + ' ' + getShortAddress(restaurant))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  최신 정보 확인
                </a>
              </p>
            </div>
          )}

          {isBlueRibbon && restaurant.review && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <span className="text-sm text-stone-600 italic leading-snug">
                &ldquo;{restaurant.review}&rdquo;
              </span>
            </div>
          )}

          {isBibGourmand && restaurant.priceCategoryLabel && (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-stone-500">
                {restaurant.priceCategoryLabel}
              </span>
            </div>
          )}

          {isBibGourmand && restaurant.michelinDesc && (
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="text-sm text-stone-600 line-clamp-3 leading-snug">
                {restaurant.michelinDesc}
              </span>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-4">
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name + ' ' + getShortAddress(restaurant))}?c=${restaurant.lng},${restaurant.lat},17,0,0,0,dh`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex-1 flex items-center justify-center gap-1.5
              px-4 py-2.5 rounded-lg
              bg-[#03C75A] text-white text-sm font-medium
              hover:bg-[#02b351] active:bg-[#029a46] transition-colors
              cursor-pointer
            "
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            네이버지도
          </a>
          {isBibGourmand && restaurant.michelinUrl && (
            <a
              href={restaurant.michelinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-center gap-1.5
                px-4 py-2.5 rounded-lg
                bg-rose-600 text-white text-sm font-medium
                hover:bg-rose-700 active:bg-rose-800 transition-colors
                cursor-pointer
              "
            >
              미쉐린
            </a>
          )}
          {!isReported && (
            <button
              onClick={() => toggleReport(restaurant.id, restaurant.name)}
              className="
                flex items-center justify-center gap-1
                px-3 py-2.5 rounded-lg
                bg-stone-100 text-stone-400 text-xs font-medium
                hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors
                cursor-pointer
              "
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              연동안됨
            </button>
          )}
        </div>

        {/* 내 식당 액션 */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => visited ? removeVisit(restaurant.id) : addVisit({
              restaurantId: restaurant.id,
              name: restaurant.name,
              address: restaurant.address || restaurant.jibunAddress || '',
              region: restaurant.region,
            })}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
              visited ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {visited ? '가봤어요' : '가봤어요'}
          </button>
          <button
            onClick={() => wishlisted ? removeWishlist(restaurant.id) : addWishlist({
              restaurantId: restaurant.id,
              name: restaurant.name,
              address: restaurant.address || restaurant.jibunAddress || '',
              region: restaurant.region,
            })}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
              wishlisted ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            {wishlisted ? '가볼예정' : '가볼게요'}
          </button>
          <button
            onClick={() => setShowReviewForm((v) => !v)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${
              hasReview || showReviewForm ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            {hasReview ? '리뷰 수정' : '리뷰 쓰기'}
          </button>
        </div>

        {showReviewForm && (
          <ReviewForm restaurant={restaurant} onClose={() => setShowReviewForm(false)} />
        )}
      </div>
    </div>
  )
}
