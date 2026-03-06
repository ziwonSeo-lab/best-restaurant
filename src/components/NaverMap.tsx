'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { Restaurant } from '@/lib/types'
import { createMarkerIcon } from '@/lib/marker-icons'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'

interface LeafletMapProps {
  restaurants: Restaurant[]
  center: { lat: number; lng: number }
  onMarkerClick?: (restaurant: Restaurant) => void
}

function createLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'location-marker',
    html: `<div style="
      width: 16px; height: 16px;
      background-color: #4285f4;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(66,133,244,0.3), 0 2px 6px rgba(0,0,0,0.3);
      animation: pulse 2s infinite;
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function getSourceBadgeHtml(restaurant: Restaurant): string {
  if (restaurant.source === 'blueribbon') {
    const ribbonCount =
      restaurant.ribbonType === 'RIBBON_THREE' ? 3 :
      restaurant.ribbonType === 'RIBBON_TWO' ? 2 : 1
    const ribbons = '🎀'.repeat(ribbonCount)
    return `<span style="font-size: 11px; padding: 1px 6px; background: #ebf5fb; color: #2980b9; border-radius: 8px;">블루리본 ${ribbons}</span>`
  }
  if (restaurant.source === 'bibgourmand') {
    return `<span style="font-size: 11px; padding: 1px 6px; background: #fdf2f8; color: #be185d; border-radius: 8px;">빕 구르망 🌸</span>`
  }
  return `<span style="font-size: 11px; padding: 1px 6px; background: #eafaf1; color: #27ae60; border-radius: 8px;">모범식당</span>`
}

export default function LeafletMap({
  restaurants,
  center,
  onMarkerClick,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersLayerRef = useRef<L.LayerGroup | null>(null)
  const locationMarkerRef = useRef<L.Marker | null>(null)

  // Store에서 위치 상태 읽기
  const userLocation = useRestaurantStore((s) => s.userLocation)
  const isLocating = useRestaurantStore((s) => s.isLocating)
  const radiusFilter = useRestaurantStore((s) => s.radiusFilter)
  const requestLocation = useRestaurantStore((s) => s.requestLocation)
  const setRadiusFilter = useRestaurantStore((s) => s.setRadiusFilter)
  const clearLocation = useRestaurantStore((s) => s.clearLocation)
  const setMapBounds = useRestaurantStore((s) => s.setMapBounds)
  const selectedRestaurant = useRestaurantStore((s) => s.selectedRestaurant)
  const favoriteIds = useFavoritesStore((s) => s.favoriteIds)

  const [showRadiusPopup, setShowRadiusPopup] = useState(false)

  // 맵 초기화
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [center.lat, center.lng],
      zoom: 12,
      minZoom: 7,
      maxZoom: 19,
      zoomControl: false,
    })

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      detectRetina: true,
    }).addTo(map)

    // 타일 로딩 실패 시 자동 재시도
    tileLayer.on('tileerror', (e: any) => {
      const tile = e.tile
      const src = tile.src
      if (!tile._retryCount) tile._retryCount = 0
      if (tile._retryCount < 3) {
        tile._retryCount++
        setTimeout(() => { tile.src = src }, 1000 * tile._retryCount)
      }
    })

    L.control.zoom({ position: 'topright' }).addTo(map)

    markersLayerRef.current = (L as any).markerClusterGroup({
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      disableClusteringAtZoom: 17,
      chunkedLoading: true,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount()
        let size: string, className: string
        if (count < 20) {
          size = '36px'; className = 'cluster-small'
        } else if (count < 100) {
          size = '42px'; className = 'cluster-medium'
        } else {
          size = '48px'; className = 'cluster-large'
        }
        return L.divIcon({
          html: `<div style="
            width: ${size}; height: ${size};
            display: flex; align-items: center; justify-content: center;
            background: rgba(59,130,246,0.85);
            color: white; font-size: 13px; font-weight: 700;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${count}</div>`,
          className: className,
          iconSize: L.point(parseInt(size), parseInt(size)),
        })
      },
    }).addTo(map)
    mapRef.current = map

    // 지도 이동/줌 시 bounds 업데이트
    const updateBounds = () => {
      try {
        const bounds = map.getBounds()
        setMapBounds({
          south: bounds.getSouth(),
          north: bounds.getNorth(),
          west: bounds.getWest(),
          east: bounds.getEast(),
        })
      } catch {
        // 맵 컨테이너가 아직 준비되지 않은 경우 무시
      }
    }
    map.on('moveend', updateBounds)
    map.on('zoomend', updateBounds)

    // 모바일: 탭 복귀/화면 전환 시 타일 재렌더링
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize({ animate: false })
        }, 100)
      }
    }

    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize({ animate: false })
      }
    }

    // 모바일 페이지 복원 (bfcache)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize({ animate: false })
        }, 200)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('pageshow', handlePageShow)

    // 맵 준비 완료 후 크기 보정 + 초기 bounds 설정
    map.whenReady(() => {
      setTimeout(() => {
        map.invalidateSize({ animate: false })
        updateBounds()
      }, 100)
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.removeEventListener('pageshow', handlePageShow)
      map.remove()
      mapRef.current = null
      markersLayerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 센터 변경 시 이동
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.setView([center.lat, center.lng], 12, { animate: true })
  }, [center])

  // 마커 업데이트
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return

    markersLayerRef.current.clearLayers()

    const favoriteSet = new Set(favoriteIds)

    const selectedId = selectedRestaurant?.id || null

    restaurants
      .filter((r) => r.lat && r.lng)
      .forEach((restaurant) => {
        const isFav = favoriteSet.has(restaurant.id)
        const isSelected = restaurant.id === selectedId
        const marker = L.marker([restaurant.lat, restaurant.lng], {
          icon: createMarkerIcon(restaurant, isFav, isSelected),
          zIndexOffset: isSelected ? 1000 : isFav ? 500 : 0,
        })

        const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(restaurant.name)}?c=${restaurant.lng},${restaurant.lat},17,0,0,0,dh&lat=${restaurant.lat}&lng=${restaurant.lng}`

        const reviewHtml = restaurant.source === 'blueribbon' && restaurant.review
          ? `<div style="font-size: 12px; color: #555; margin-top: 6px; padding: 6px 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db; font-style: italic;">"${restaurant.review}"</div>`
          : ''

        const michelinDescHtml = restaurant.source === 'bibgourmand' && restaurant.michelinDesc
          ? `<div style="font-size: 12px; color: #555; margin-top: 6px; padding: 6px 8px; background: #fdf2f8; border-radius: 6px; border-left: 3px solid #be185d; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${restaurant.michelinDesc}</div>`
          : ''

        const priceLabelHtml = restaurant.source === 'bibgourmand' && restaurant.priceCategoryLabel
          ? `<span style="font-size: 11px; padding: 1px 6px; background: #fef9c3; color: #854d0e; border-radius: 8px;">💰 ${restaurant.priceCategoryLabel}</span>`
          : ''

        const michelinLinkHtml = restaurant.source === 'bibgourmand' && restaurant.michelinUrl
          ? `<a href="${restaurant.michelinUrl}" target="_blank" rel="noopener noreferrer"
               style="display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 12px; background:#c4122e; color:white; font-size:12px; font-weight:600; border-radius:6px; text-decoration:none;">
              🌸 미쉐린
            </a>`
          : ''

        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; min-width: 200px; max-width: 260px;">
            <div style="font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">
              ${restaurant.name}
            </div>
            <div style="font-size: 12px; color: #666; margin-bottom: 3px;">
              ${restaurant.address || restaurant.jibunAddress}
            </div>
            ${restaurant.phone ? `<div style="font-size: 12px; color: #666; margin-bottom: 3px;"><a href="tel:${restaurant.phone}" style="color: #0066cc;">${restaurant.phone}</a></div>` : ''}
            <div style="display: flex; gap: 4px; margin-top: 6px; flex-wrap: wrap;">
              ${getSourceBadgeHtml(restaurant)}
              ${priceLabelHtml}
              ${restaurant.foodType ? `<span style="font-size: 11px; padding: 1px 6px; background: #f0f7ff; color: #0066cc; border-radius: 8px;">${restaurant.foodType}</span>` : ''}
              ${restaurant.mainFood ? `<span style="font-size: 11px; padding: 1px 6px; background: #fff7f0; color: #cc6600; border-radius: 8px;">${restaurant.mainFood}</span>` : ''}
            </div>
            ${reviewHtml}
            ${michelinDescHtml}
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <a href="${naverMapUrl}" target="_blank" rel="noopener noreferrer"
                 style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 0; background:#03C75A; color:white; font-size:12px; font-weight:600; border-radius:6px; text-decoration:none;">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"/></svg>
                네이버지도
              </a>
              ${restaurant.phone ? `<a href="tel:${restaurant.phone}" style="display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 12px; background:#3B82F6; color:white; font-size:12px; font-weight:600; border-radius:6px; text-decoration:none;">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="white"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
                전화
              </a>` : ''}
              ${michelinLinkHtml}
            </div>
          </div>
        `

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          closeButton: true,
        })

        marker.on('click', () => {
          onMarkerClick?.(restaurant)
        })

        markersLayerRef.current!.addLayer(marker)
      })
  }, [restaurants, onMarkerClick, favoriteIds, selectedRestaurant])

  // GPS 위치 마커 업데이트 + 지도 이동
  useEffect(() => {
    if (!mapRef.current) return

    if (locationMarkerRef.current) {
      locationMarkerRef.current.remove()
      locationMarkerRef.current = null
    }

    if (userLocation) {
      locationMarkerRef.current = L.marker(
        [userLocation.lat, userLocation.lng],
        { icon: createLocationIcon(), zIndexOffset: 1000 }
      )
        .addTo(mapRef.current)
        .bindPopup('<div style="font-size: 13px; font-weight: 600;">내 위치</div>')

      mapRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true })
    }
  }, [userLocation])

  // 선택된 식당으로 지도 이동 (하단 카드 높이를 고려해 약간 위로 보정)
  useEffect(() => {
    if (!mapRef.current || !selectedRestaurant) return
    if (!selectedRestaurant.lat || !selectedRestaurant.lng) return

    const map = mapRef.current
    const targetLatLng = L.latLng(selectedRestaurant.lat, selectedRestaurant.lng)
    const targetPoint = map.latLngToContainerPoint(targetLatLng)
    const mapSize = map.getSize()
    // 하단 카드(~200px)를 고려해 중심을 위로 보정
    const offsetY = mapSize.y * 0.15
    const adjustedPoint = L.point(targetPoint.x, targetPoint.y + offsetY)
    const adjustedCenter = map.containerPointToLatLng(adjustedPoint)

    map.setView(
      [adjustedCenter.lat, adjustedCenter.lng],
      Math.max(map.getZoom(), 14),
      { animate: true }
    )
  }, [selectedRestaurant])

  return (
    <div className="relative w-full h-full" style={{ isolation: 'isolate' }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* GPS 위치 버튼 + 반경 선택 팝업 */}
      <div className="absolute bottom-24 right-3 z-[1000] flex flex-col items-end gap-2">
        {/* 반경 선택 팝업 */}
        {showRadiusPopup && userLocation && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-2 flex flex-col gap-1 min-w-[80px]">
            {[
              { label: '500m', value: 500 },
              { label: '1km', value: 1000 },
              { label: '3km', value: 3000 },
              { label: '5km', value: 5000 },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => {
                  setRadiusFilter(radiusFilter === value ? null : value)
                  setShowRadiusPopup(false)
                }}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium text-center
                  transition-all duration-150
                  ${radiusFilter === value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {label}
              </button>
            ))}
            {radiusFilter && (
              <button
                onClick={() => {
                  clearLocation()
                  setShowRadiusPopup(false)
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 text-center"
              >
                해제
              </button>
            )}
          </div>
        )}

        {/* GPS 버튼 */}
        <button
          onClick={() => {
            if (userLocation) {
              setShowRadiusPopup(!showRadiusPopup)
              if (mapRef.current) {
                mapRef.current.setView([userLocation.lat, userLocation.lng], 15, { animate: true })
              }
            } else {
              requestLocation()
            }
          }}
          disabled={isLocating}
          className={`
            w-10 h-10 rounded-full
            shadow-lg border
            flex items-center justify-center
            hover:bg-gray-50 active:bg-gray-100
            transition-colors
            disabled:opacity-50
            ${radiusFilter ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}
          `}
          title="내 위치"
        >
          {isLocating ? (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className={`w-5 h-5 ${userLocation ? 'text-blue-500' : 'text-gray-600'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
