'use client'

import type { Restaurant } from '@/lib/types'
import { useFavoritesStore } from '@/store/favorites-store'
import { useReportedStore } from '@/store/reported-store'
import { formatDesignatedDate, isOlderThanYears } from '@/lib/date-utils'

interface RestaurantCardProps {
  restaurant: Restaurant
  onClose: () => void
}

function getRibbonDisplay(restaurant: Restaurant): string {
  if (restaurant.source !== 'blueribbon') return ''
  const count =
    restaurant.ribbonType === 'RIBBON_THREE' ? 3 :
    restaurant.ribbonType === 'RIBBON_TWO' ? 2 : 1
  return '🎀'.repeat(count)
}

export default function RestaurantCard({
  restaurant,
  onClose,
}: RestaurantCardProps) {
  const isBlueRibbon = restaurant.source === 'blueribbon'
  const isBibGourmand = restaurant.source === 'bibgourmand'
  const isFavorite = useFavoritesStore((s) => s.isFavorite(restaurant.id))
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite)
  const isReported = useReportedStore((s) => s.isReported(restaurant.id))
  const toggleReport = useReportedStore((s) => s.toggleReport)

  return (
    <div className={`rounded-t-2xl shadow-lg border-t border-gray-100 animate-slide-up ${isReported ? 'bg-gray-50' : 'bg-white'}`}>
      {/* 핸들 바 */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="px-4 pb-4 pb-safe">
        {/* 신고 배너 */}
        {isReported && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
            <p className="text-xs text-red-600">
              ⚠️ 네이버지도 연동이 안 되는 식당입니다 (폐업·상호변경 등)
            </p>
            <button
              onClick={() => toggleReport(restaurant.id)}
              className="text-xs text-red-500 underline flex-shrink-0 ml-2"
            >
              신고 취소
            </button>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {restaurant.name}
              </h3>
              <button
                onClick={() => toggleFavorite(restaurant.id)}
                className="flex-shrink-0 text-xl transition-transform active:scale-125"
                aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
            </div>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {/* 소스 뱃지 */}
              {isBlueRibbon ? (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md">
                  블루리본 {getRibbonDisplay(restaurant)}
                </span>
              ) : isBibGourmand ? (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-pink-50 text-pink-700 rounded-md">
                  빕 구르망 🌸
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-md">
                  모범식당
                </span>
              )}
              {restaurant.foodType && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-md">
                  {restaurant.foodType}
                </span>
              )}
              {restaurant.mainFood && (
                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-orange-50 text-orange-600 rounded-md">
                  {restaurant.mainFood}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-0.5 flex-shrink-0">📍</span>
            <span className="text-sm text-gray-600">
              {restaurant.address || restaurant.jibunAddress}
            </span>
          </div>

          {restaurant.phone && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 flex-shrink-0">📞</span>
              <span className="text-sm text-gray-600">{restaurant.phone}</span>
            </div>
          )}

          {/* 모범식당: 지정일 / 블루리본: 리뷰 / 빕 구르망: 설명 */}
          {!isBlueRibbon && !isBibGourmand && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 flex-shrink-0">🏅</span>
              <span className="text-sm text-gray-500">
                모범음식점 지정일: {formatDesignatedDate(restaurant.designatedDate || '')}
              </span>
            </div>
          )}

          {/* 5년 이상 경과 경고 배너 */}
          {!isBlueRibbon && !isBibGourmand && restaurant.designatedDate && isOlderThanYears(restaurant.designatedDate, 5) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <p className="text-xs text-amber-700">
                ⚠️ 지정일이 5년 이상 경과하여 상호 변경 가능성이 있습니다.{' '}
                <a
                  href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  네이버지도에서 최신 정보 확인
                </a>
              </p>
            </div>
          )}

          {isBlueRibbon && restaurant.review && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 flex-shrink-0 mt-0.5">💬</span>
              <span className="text-sm text-gray-600 italic">
                &ldquo;{restaurant.review}&rdquo;
              </span>
            </div>
          )}

          {isBibGourmand && restaurant.priceCategoryLabel && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 flex-shrink-0">💰</span>
              <span className="text-sm text-gray-500">
                {restaurant.priceCategoryLabel}
              </span>
            </div>
          )}

          {isBibGourmand && restaurant.michelinDesc && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 flex-shrink-0 mt-0.5">📖</span>
              <span className="text-sm text-gray-600 line-clamp-3">
                {restaurant.michelinDesc}
              </span>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mt-4">
          <a
            href={`https://map.naver.com/p/search/${encodeURIComponent(restaurant.name)}?c=${restaurant.lng},${restaurant.lat},17,0,0,0,dh`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex-1 flex items-center justify-center gap-1.5
              px-4 py-2.5 rounded-lg
              bg-[#03C75A] text-white text-sm font-medium
              hover:bg-[#02b351] active:bg-[#029a46] transition-colors
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
                bg-[#c4122e] text-white text-sm font-medium
                hover:bg-[#a8101f] active:bg-[#8f0e1a] transition-colors
              "
            >
              🌸 미쉐린
            </a>
          )}
          {!isReported && (
            <button
              onClick={() => toggleReport(restaurant.id)}
              className="
                flex items-center justify-center gap-1.5
                px-3 py-2.5 rounded-lg
                bg-gray-100 text-gray-500 text-sm font-medium
                hover:bg-red-50 hover:text-red-500 active:bg-red-100 transition-colors
              "
            >
              ⚠️ 연동안됨
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
