'use client'

import type { Restaurant } from '@/lib/types'
import { useFavoritesStore } from '@/store/favorites-store'

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

  return (
    <div className="bg-white rounded-t-2xl shadow-lg border-t border-gray-100 animate-slide-up">
      {/* 핸들 바 */}
      <div className="flex justify-center pt-3 pb-2">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      <div className="px-4 pb-4 pb-safe">
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
              <a
                href={`tel:${restaurant.phone}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {restaurant.phone}
              </a>
            </div>
          )}

          {/* 모범식당: 지정일 / 블루리본: 리뷰 / 빕 구르망: 설명 */}
          {!isBlueRibbon && !isBibGourmand && restaurant.designatedDate && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 flex-shrink-0">🏅</span>
              <span className="text-sm text-gray-500">
                모범음식점 지정일: {restaurant.designatedDate}
              </span>
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
          <a
            href={`https://map.kakao.com/?q=${encodeURIComponent(restaurant.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex items-center justify-center gap-1.5
              px-4 py-2.5 rounded-lg
              bg-[#FEE500] text-[#3C1E1E] text-sm font-medium
              hover:bg-[#fdd800] active:bg-[#f5d000] transition-colors
            "
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                clipRule="evenodd"
              />
            </svg>
            카카오맵
          </a>
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="
                flex items-center justify-center gap-1.5
                px-4 py-2.5 rounded-lg
                bg-blue-500 text-white text-sm font-medium
                hover:bg-blue-600 active:bg-blue-700 transition-colors
              "
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              전화
            </a>
          )}
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
        </div>
      </div>
    </div>
  )
}
