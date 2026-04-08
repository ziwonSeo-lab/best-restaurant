'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { APIProvider, Map, useMap, useApiIsLoaded, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import type { Restaurant } from '@/lib/types'
import { useRestaurantStore } from '@/store/restaurant-store'
import { useFavoritesStore } from '@/store/favorites-store'

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || ''

interface GoogleMapViewProps {
  restaurants: Restaurant[]
  center: { lat: number; lng: number }
  onMarkerClick?: (restaurant: Restaurant) => void
}

function getMarkerColor(source: string, isSelected: boolean): string {
  if (isSelected) return '#ec4899'
  switch (source) {
    case 'blueribbon': return '#2563eb'
    case 'bibgourmand': return '#db2777'
    case 'yeskidszone': return '#7c3aed'
    default: return '#16a34a'
  }
}

function getMarkerIcon(source: string): string {
  switch (source) {
    case 'blueribbon': return '🎗️'
    case 'bibgourmand': return '🌸'
    case 'yeskidszone': return '👶'
    default: return '🏅'
  }
}

function getSourceBadge(restaurant: Restaurant): { label: string; bg: string; text: string } {
  switch (restaurant.source) {
    case 'blueribbon': {
      const count = restaurant.ribbonType === 'RIBBON_THREE' ? 3 : restaurant.ribbonType === 'RIBBON_TWO' ? 2 : 1
      return { label: `블루리본 ${'🎀'.repeat(count)}`, bg: '#ebf5fb', text: '#2980b9' }
    }
    case 'bibgourmand':
      return { label: '빕 구르망 🌸', bg: '#fdf2f8', text: '#be185d' }
    case 'yeskidszone':
      return { label: '유모차OK 👶', bg: '#f5f3ff', text: '#7c3aed' }
    default:
      return { label: '모범식당', bg: '#eafaf1', text: '#27ae60' }
  }
}

function createMarkerElement(restaurant: Restaurant, isFavorite: boolean, isSelected: boolean): HTMLElement {
  const color = getMarkerColor(restaurant.source, isSelected)
  const icon = getMarkerIcon(restaurant.source)
  const size = isSelected ? 36 : 30

  const container = document.createElement('div')
  container.style.cssText = `position:relative; cursor:pointer;`

  const pin = document.createElement('div')
  pin.style.cssText = `
    width:${size}px; height:${size}px;
    background:${color};
    border:2.5px solid ${isSelected ? '#db2777' : color};
    border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
    display:flex; align-items:center; justify-content:center;
    transition:transform 0.15s;
  `

  const iconSpan = document.createElement('span')
  iconSpan.style.cssText = `transform:rotate(45deg); font-size:14px; line-height:1;`
  iconSpan.textContent = icon
  pin.appendChild(iconSpan)

  if (isFavorite) {
    const heart = document.createElement('div')
    heart.style.cssText = `
      position:absolute; top:-4px; right:-4px;
      width:14px; height:14px;
      background:#ef4444; border:2px solid white;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:8px; line-height:1; color:white;
    `
    heart.textContent = '♥'
    container.appendChild(heart)
  }

  container.appendChild(pin)
  return container
}

function MapContent({ restaurants, center, onMarkerClick }: GoogleMapViewProps) {
  const map = useMap()
  const apiIsLoaded = useApiIsLoaded()
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const [infoTarget, setInfoTarget] = useState<{ restaurant: Restaurant; position: google.maps.LatLng } | null>(null)

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

  // Update bounds on map move
  const handleBoundsChanged = useCallback(() => {
    if (!map) return
    const bounds = map.getBounds()
    if (bounds) {
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      setMapBounds({
        south: sw.lat(),
        north: ne.lat(),
        west: sw.lng(),
        east: ne.lng(),
      })
    }
  }, [map, setMapBounds])

  // Center map when center prop changes
  useEffect(() => {
    if (!map) return
    map.panTo(center)
    map.setZoom(12)
  }, [map, center])

  // Create markers and clusterer
  useEffect(() => {
    if (!map || !apiIsLoaded || !google.maps.marker?.AdvancedMarkerElement) return

    // Clear old markers
    markersRef.current.forEach((m) => { m.map = null })
    markersRef.current = []
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
    }

    const favoriteSet = new Set(favoriteIds)
    const selectedId = selectedRestaurant?.id || null
    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = []

    for (const restaurant of restaurants) {
      if (!restaurant.lat || !restaurant.lng) continue

      const isFav = favoriteSet.has(restaurant.id)
      const isSelected = restaurant.id === selectedId

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: restaurant.lat, lng: restaurant.lng },
        content: createMarkerElement(restaurant, isFav, isSelected),
        zIndex: isSelected ? 1000 : isFav ? 500 : 0,
      })

      marker.addListener('click', () => {
        onMarkerClick?.(restaurant)
        setInfoTarget({
          restaurant,
          position: new google.maps.LatLng(restaurant.lat, restaurant.lng),
        })
      })

      newMarkers.push(marker)
    }

    markersRef.current = newMarkers

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: newMarkers,
        renderer: {
          render: ({ count, position }) => {
            const size = count < 20 ? 36 : count < 100 ? 42 : 48
            const el = document.createElement('div')
            el.style.cssText = `
              width:${size}px; height:${size}px;
              display:flex; align-items:center; justify-content:center;
              background:rgba(59,130,246,0.85);
              color:white; font-size:13px; font-weight:700;
              border-radius:50%;
              border:3px solid rgba(255,255,255,0.9);
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
            `
            el.textContent = String(count)
            return new google.maps.marker.AdvancedMarkerElement({
              position,
              content: el,
            })
          },
        },
      })
    } else {
      clustererRef.current.clearMarkers()
      clustererRef.current.addMarkers(newMarkers)
    }

    return () => {
      newMarkers.forEach((m) => { m.map = null })
    }
  }, [map, apiIsLoaded, restaurants, favoriteIds, selectedRestaurant, onMarkerClick])

  // Pan to selected restaurant
  useEffect(() => {
    if (!map || !selectedRestaurant?.lat || !selectedRestaurant?.lng) return
    map.panTo({ lat: selectedRestaurant.lat, lng: selectedRestaurant.lng })
    if (map.getZoom()! < 14) map.setZoom(14)
  }, [map, selectedRestaurant])

  // Pan to user location
  useEffect(() => {
    if (!map || !userLocation) return
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng })
    map.setZoom(15)
  }, [map, userLocation])

  const getShortAddress = (r: Restaurant): string => {
    const addr = r.address || r.jibunAddress || ''
    const parts = addr.split(/\s+/)
    const gu = parts.find((p) => /[구군]$/.test(p)) || parts[1] || ''
    const parenMatch = addr.match(/\(([^)]*[동면읍리])/)
    const dong = parenMatch?.[1] || (r.jibunAddress || '').split(/\s+/).find((p) => /[동면읍리]$/.test(p)) || ''
    return dong ? gu + ' ' + dong : gu
  }

  return (
    <>
      <Map
        defaultCenter={center}
        defaultZoom={12}
        mapId={MAP_ID || undefined}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        streetViewControl={false}
        fullscreenControl={false}
        mapTypeControl={false}
        onBoundsChanged={handleBoundsChanged}
        style={{ width: '100%', height: '100%' }}
      />

      {/* GPS user location marker */}
      {userLocation && (
        <AdvancedMarker position={{ lat: userLocation.lat, lng: userLocation.lng }} zIndex={1000}>
          <div style={{
            width: 16, height: 16,
            backgroundColor: '#4285f4',
            border: '3px solid white',
            borderRadius: '50%',
            boxShadow: '0 0 0 2px rgba(66,133,244,0.3), 0 2px 6px rgba(0,0,0,0.3)',
            animation: 'pulse 2s infinite',
          }} />
        </AdvancedMarker>
      )}

      {/* Info window */}
      {infoTarget && (
        <InfoWindow
          position={infoTarget.position}
          onCloseClick={() => setInfoTarget(null)}
        >
          <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", lineHeight: 1.5, minWidth: 200, maxWidth: 260 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>
              {infoTarget.restaurant.name}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>
              {infoTarget.restaurant.address || infoTarget.restaurant.jibunAddress}
            </div>
            {infoTarget.restaurant.phone && (
              <div style={{ fontSize: 12, color: '#666', marginBottom: 3 }}>
                <a href={`tel:${infoTarget.restaurant.phone}`} style={{ color: '#0066cc' }}>{infoTarget.restaurant.phone}</a>
              </div>
            )}
            <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
              {(() => {
                const badge = getSourceBadge(infoTarget.restaurant)
                return <span style={{ fontSize: 11, padding: '1px 6px', background: badge.bg, color: badge.text, borderRadius: 8 }}>{badge.label}</span>
              })()}
              {infoTarget.restaurant.foodType && (
                <span style={{ fontSize: 11, padding: '1px 6px', background: '#f0f7ff', color: '#0066cc', borderRadius: 8 }}>{infoTarget.restaurant.foodType}</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <a
                href={`https://map.naver.com/p/search/${encodeURIComponent(infoTarget.restaurant.name + ' ' + getShortAddress(infoTarget.restaurant))}?c=${infoTarget.restaurant.lng},${infoTarget.restaurant.lat},17,0,0,0,dh`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '6px 0', background: '#03C75A', color: 'white', fontSize: 12, fontWeight: 600, borderRadius: 6, textDecoration: 'none' }}
              >
                네이버지도
              </a>
            </div>
          </div>
        </InfoWindow>
      )}

      {/* GPS button + radius popup */}
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
    </>
  )
}

export default function GoogleMapView(props: GoogleMapViewProps) {
  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={API_KEY} libraries={['marker']}>
        <MapContent {...props} />
      </APIProvider>
    </div>
  )
}
