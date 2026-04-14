'use client'

import { useEffect, useRef, useState } from 'react'
import type { Restaurant } from '@/lib/types'
import { createMarkerIcon } from '@/lib/marker-icons'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'

interface NaverMapProps {
  restaurants: Restaurant[]
  center: { lat: number; lng: number }
  onMarkerClick?: (restaurant: Restaurant) => void
}

function createLocationIconContent(): string {
  return `<div style="
    width: 16px; height: 16px;
    background-color: #4285f4;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px rgba(66,133,244,0.3), 0 2px 6px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
    transform: translate(-50%, -50%);
    margin-left: 8px;
    margin-top: 8px;
  "></div>`
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
  if (restaurant.source === 'goodprice') {
    return `<span style="font-size: 11px; padding: 1px 6px; background: #fef3c7; color: #b45309; border-radius: 8px;">착한가격 💰</span>`
  }
  return `<span style="font-size: 11px; padding: 1px 6px; background: #eafaf1; color: #27ae60; border-radius: 8px;">모범식당</span>`
}

function buildPopupContent(restaurant: Restaurant): string {
  const addr = restaurant.address || restaurant.jibunAddress || ''
  const addrParts = addr.split(/\s+/)
  const gu = addrParts.find((p) => /[구군]$/.test(p)) || addrParts[1] || ''
  const parenMatch = addr.match(/\(([^)]*[동면읍리])/)
  const dong =
    parenMatch?.[1] ||
    (restaurant.jibunAddress || '').split(/\s+/).find((p) => /[동면읍리]$/.test(p)) ||
    ''
  const shortAddr = dong ? gu + ' ' + dong : gu
  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(
    restaurant.name + ' ' + shortAddr,
  )}?c=${restaurant.lng},${restaurant.lat},17,0,0,0,dh`

  const reviewHtml =
    restaurant.source === 'blueribbon' && restaurant.review
      ? `<div style="font-size: 12px; color: #555; margin-top: 6px; padding: 6px 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #3498db; font-style: italic;">"${restaurant.review}"</div>`
      : ''

  const michelinDescHtml =
    restaurant.source === 'bibgourmand' && restaurant.michelinDesc
      ? `<div style="font-size: 12px; color: #555; margin-top: 6px; padding: 6px 8px; background: #fdf2f8; border-radius: 6px; border-left: 3px solid #be185d; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">${restaurant.michelinDesc}</div>`
      : ''

  const priceLabelHtml =
    restaurant.source === 'bibgourmand' && restaurant.priceCategoryLabel
      ? `<span style="font-size: 11px; padding: 1px 6px; background: #fef9c3; color: #854d0e; border-radius: 8px;">💰 ${restaurant.priceCategoryLabel}</span>`
      : ''

  const michelinLinkHtml =
    restaurant.source === 'bibgourmand' && restaurant.michelinUrl
      ? `<a href="${restaurant.michelinUrl}" target="_blank" rel="noopener noreferrer"
           style="display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 12px; background:#c4122e; color:white; font-size:12px; font-weight:600; border-radius:6px; text-decoration:none;">
          🌸 미쉐린
        </a>`
      : ''

  return `
    <div style="position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; min-width: 200px; max-width: 260px; padding: 12px; padding-right: 32px;">
      <button type="button" data-close-infowindow="true" aria-label="닫기"
        style="position:absolute; top:6px; right:6px; width:24px; height:24px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; border-radius:50%; color:#6b7280; font-size:18px; line-height:1; padding:0;"
        onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='transparent'">×</button>
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
}

function buildClusterIcons(): naver.maps.HtmlIcon[] {
  const sizes: Array<[number, string]> = [
    [36, 'cluster-small'],
    [42, 'cluster-medium'],
    [48, 'cluster-large'],
    [54, 'cluster-xlarge'],
    [60, 'cluster-xxlarge'],
  ]
  return sizes.map(([px, cls]) => ({
    content: `<div class="${cls}" style="
      cursor: pointer;
      width: ${px}px; height: ${px}px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(59,130,246,0.85);
      color: white; font-size: 13px; font-weight: 700;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.9);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    size: new window.naver.maps.Size(px, px),
    anchor: new window.naver.maps.Point(px / 2, px / 2),
  }))
}

export default function NaverMapComponent({
  restaurants,
  center,
  onMarkerClick,
}: NaverMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<naver.maps.Map | null>(null)
  const markersRef = useRef<naver.maps.Marker[]>([])
  const clusteringRef = useRef<MarkerClustering | null>(null)
  const infoWindowRef = useRef<naver.maps.InfoWindow | null>(null)
  const locationMarkerRef = useRef<naver.maps.Marker | null>(null)
  const [sdkReady, setSdkReady] = useState(false)

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

  // SDK 준비 대기
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.naver?.maps && typeof MarkerClustering !== 'undefined') {
      setSdkReady(true)
      return
    }
    const timer = setInterval(() => {
      if (window.naver?.maps && typeof MarkerClustering !== 'undefined') {
        setSdkReady(true)
        clearInterval(timer)
      }
    }, 100)
    return () => clearInterval(timer)
  }, [])

  // 맵 초기화
  useEffect(() => {
    if (!sdkReady || !mapContainerRef.current || mapRef.current) return

    const map = new window.naver.maps.Map(mapContainerRef.current, {
      center: new window.naver.maps.LatLng(center.lat, center.lng),
      zoom: 12,
      minZoom: 7,
      maxZoom: 19,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
      mapDataControl: false,
      scaleControl: false,
      logoControl: true,
    })
    mapRef.current = map

    infoWindowRef.current = new window.naver.maps.InfoWindow({
      content: '',
      maxWidth: 280,
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      anchorSize: new window.naver.maps.Size(12, 12),
      pixelOffset: new window.naver.maps.Point(0, -8),
    })

    const updateBounds = () => {
      try {
        const bounds = map.getBounds()
        const sw = bounds.getSW()
        const ne = bounds.getNE()
        setMapBounds({
          south: sw.lat(),
          north: ne.lat(),
          west: sw.lng(),
          east: ne.lng(),
        })
      } catch {
        // no-op
      }
    }
    const boundsListener = window.naver.maps.Event.addListener(map, 'bounds_changed', updateBounds)

    // 맵 클릭 시 인포윈도우 닫기
    const mapClickListener = window.naver.maps.Event.addListener(map, 'click', () => {
      infoWindowRef.current?.close()
    })

    // 인포윈도우 내 X 버튼 닫기 (이벤트 위임)
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-close-infowindow]')) {
        infoWindowRef.current?.close()
      }
    }
    document.addEventListener('click', handleDocumentClick)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mapRef.current) {
        setTimeout(() => mapRef.current?.refresh(true), 100)
      }
    }
    const handleResize = () => mapRef.current?.refresh(true)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && mapRef.current) {
        setTimeout(() => mapRef.current?.refresh(true), 200)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('pageshow', handlePageShow)

    setTimeout(updateBounds, 100)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.removeEventListener('pageshow', handlePageShow)
      window.naver.maps.Event.removeListener(boundsListener)
      window.naver.maps.Event.removeListener(mapClickListener)
      document.removeEventListener('click', handleDocumentClick)
      clusteringRef.current?.setMap(null)
      map.destroy()
      mapRef.current = null
      clusteringRef.current = null
      infoWindowRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady])

  // 센터 변경 시 이동
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.panTo(new window.naver.maps.LatLng(center.lat, center.lng))
    mapRef.current.setZoom(12, true)
  }, [center])

  // 마커 업데이트
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    clusteringRef.current?.setMap(null)
    clusteringRef.current = null

    const favoriteSet = new Set(favoriteIds)
    const selectedId = selectedRestaurant?.id || null

    const newMarkers = restaurants
      .filter((r) => r.lat && r.lng)
      .map((restaurant) => {
        const isFav = favoriteSet.has(restaurant.id)
        const isSelected = restaurant.id === selectedId
        const iconSpec = createMarkerIcon(restaurant, isFav, isSelected)

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(restaurant.lat, restaurant.lng),
          icon: {
            content: iconSpec.content,
            size: new window.naver.maps.Size(iconSpec.size.width, iconSpec.size.height),
            anchor: new window.naver.maps.Point(iconSpec.anchor.x, iconSpec.anchor.y),
          },
          zIndex: isSelected ? 1000 : isFav ? 500 : 100,
        })

        window.naver.maps.Event.addListener(marker, 'click', () => {
          if (infoWindowRef.current && mapRef.current) {
            infoWindowRef.current.setContent(buildPopupContent(restaurant))
            infoWindowRef.current.open(mapRef.current, marker)
          }
          onMarkerClick?.(restaurant)
        })

        return marker
      })

    markersRef.current = newMarkers

    clusteringRef.current = new MarkerClustering({
      map: mapRef.current,
      markers: newMarkers,
      disableClickZoom: false,
      minClusterSize: 2,
      maxZoom: 16,
      gridSize: 120,
      icons: buildClusterIcons(),
      indexGenerator: [10, 50, 100, 500, 1000],
      stylingFunction: (clusterMarker, count) => {
        const markerWithElement = clusterMarker as unknown as {
          getElement?: () => HTMLElement
        }
        const el = markerWithElement.getElement?.()
        const target = el?.querySelector('div:first-child') as HTMLElement | null
        if (target) target.textContent = String(count)
      },
    })
  }, [restaurants, onMarkerClick, favoriteIds, selectedRestaurant, sdkReady])

  // GPS 위치 마커 업데이트
  useEffect(() => {
    if (!sdkReady || !mapRef.current) return

    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null)
      locationMarkerRef.current = null
    }

    if (userLocation) {
      locationMarkerRef.current = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
        map: mapRef.current,
        icon: {
          content: createLocationIconContent(),
          size: new window.naver.maps.Size(16, 16),
          anchor: new window.naver.maps.Point(8, 8),
        },
        zIndex: 2000,
      })

      mapRef.current.panTo(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng))
      mapRef.current.setZoom(15, true)
    }
  }, [userLocation, sdkReady])

  // 선택된 식당으로 지도 이동
  useEffect(() => {
    if (!sdkReady || !mapRef.current || !selectedRestaurant) return
    if (!selectedRestaurant.lat || !selectedRestaurant.lng) return

    const map = mapRef.current
    const target = new window.naver.maps.LatLng(selectedRestaurant.lat, selectedRestaurant.lng)
    const proj = map.getProjection()
    const targetPoint = proj.fromCoordToOffset(target)
    const mapSize = map.getSize()
    const offsetY = mapSize.height * 0.15
    const adjustedPoint = new window.naver.maps.Point(targetPoint.x, targetPoint.y + offsetY)
    const adjustedCenter = proj.fromOffsetToCoord(adjustedPoint)

    map.setZoom(Math.max(map.getZoom(), 14), true)
    map.panTo(adjustedCenter)
  }, [selectedRestaurant, sdkReady])

  return (
    <div className="relative w-full h-full" style={{ isolation: 'isolate' }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* GPS 위치 버튼 + 반경 선택 팝업 */}
      <div className="absolute bottom-24 right-3 z-[1000] flex flex-col items-end gap-2">
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

        <button
          onClick={() => {
            if (userLocation) {
              setShowRadiusPopup(!showRadiusPopup)
              if (mapRef.current) {
                mapRef.current.panTo(
                  new window.naver.maps.LatLng(userLocation.lat, userLocation.lng),
                )
                mapRef.current.setZoom(15, true)
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
