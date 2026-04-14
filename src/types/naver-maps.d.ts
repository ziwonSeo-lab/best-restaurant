// 네이버 지도 Dynamic Map v3 타입 선언
// 공식 문서: https://navermaps.github.io/maps.js.ncp/docs/

export {}

declare global {
  interface Window {
    naver: typeof naver
  }

  namespace naver.maps {
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
      destinationPoint(angle: number, meter: number): LatLng
    }

    class LatLngBounds {
      constructor(sw: LatLng, ne: LatLng)
      getSW(): LatLng
      getNE(): LatLng
      extend(latlng: LatLng): LatLngBounds
    }

    class Point {
      constructor(x: number, y: number)
      x: number
      y: number
    }

    class Size {
      constructor(width: number, height: number)
      width: number
      height: number
    }

    interface MapOptions {
      center?: LatLng | { lat: number; lng: number }
      zoom?: number
      minZoom?: number
      maxZoom?: number
      zoomControl?: boolean
      mapDataControl?: boolean
      scaleControl?: boolean
      logoControl?: boolean
      mapTypeControl?: boolean
      draggable?: boolean
      pinchZoom?: boolean
      scrollWheel?: boolean
      keyboardShortcuts?: boolean
      disableDoubleClickZoom?: boolean
      disableDoubleTapZoom?: boolean
      disableKineticPan?: boolean
      tileTransition?: boolean
      zoomControlOptions?: { position?: Position }
    }

    enum Position {
      TOP_LEFT,
      TOP_CENTER,
      TOP_RIGHT,
      LEFT_CENTER,
      CENTER,
      RIGHT_CENTER,
      BOTTOM_LEFT,
      BOTTOM_CENTER,
      BOTTOM_RIGHT,
    }

    class Map {
      constructor(element: HTMLElement | string, options?: MapOptions)
      setCenter(latlng: LatLng | { lat: number; lng: number }): void
      setZoom(zoom: number, useEffect?: boolean): void
      getZoom(): number
      getCenter(): LatLng
      getBounds(): LatLngBounds
      panTo(latlng: LatLng, options?: { duration?: number }): void
      panBy(offset: Point): void
      destroy(): void
      refresh(noEffect?: boolean): void
      getSize(): Size
      getProjection(): {
        fromCoordToOffset(latlng: LatLng): Point
        fromOffsetToCoord(point: Point): LatLng
      }
    }

    interface MarkerOptions {
      position: LatLng | { lat: number; lng: number }
      map?: Map | null
      icon?: string | HtmlIcon | SymbolIcon | ImageIcon
      title?: string
      zIndex?: number
      clickable?: boolean
      visible?: boolean
    }

    interface HtmlIcon {
      content: string
      size?: Size
      anchor?: Point
      origin?: Point
    }

    interface ImageIcon {
      url: string
      size?: Size
      anchor?: Point
      origin?: Point
    }

    interface SymbolIcon {
      path: unknown
      style?: string
      radius?: number
      fillColor?: string
      fillOpacity?: number
      strokeColor?: string
      strokeOpacity?: number
      strokeWeight?: number
    }

    class Marker {
      constructor(options: MarkerOptions)
      setMap(map: Map | null): void
      getMap(): Map | null
      setPosition(position: LatLng | { lat: number; lng: number }): void
      getPosition(): LatLng
      setIcon(icon: string | HtmlIcon | SymbolIcon | ImageIcon): void
      setZIndex(zIndex: number): void
    }

    interface InfoWindowOptions {
      content: string | HTMLElement
      maxWidth?: number
      anchorSize?: Size
      anchorSkew?: boolean
      anchorColor?: string
      pixelOffset?: Point
      backgroundColor?: string
      borderColor?: string
      borderWidth?: number
      disableAnchor?: boolean
      disableAutoPan?: boolean
    }

    class InfoWindow {
      constructor(options: InfoWindowOptions)
      open(map: Map, anchor?: Marker | LatLng): void
      close(): void
      getMap(): Map | null
      setContent(content: string | HTMLElement): void
    }

    namespace Event {
      function addListener(
        target: unknown,
        eventName: string,
        listener: (e?: unknown) => void,
      ): MapEventListener
      function removeListener(listener: MapEventListener | MapEventListener[]): void
    }

    interface MapEventListener {
      eventName: string
      listener: (e?: unknown) => void
      target: unknown
    }
  }

  // 네이버 공식 예제 MarkerClustering 라이브러리
  interface MarkerClusteringOptions {
    map: naver.maps.Map
    markers: naver.maps.Marker[]
    disableClickZoom?: boolean
    minClusterSize?: number
    maxZoom?: number
    gridSize?: number
    icons?: naver.maps.HtmlIcon[]
    indexGenerator?: number[] | ((count: number) => number)
    stylingFunction?: (clusterMarker: naver.maps.Marker, count: number) => void
  }

  class MarkerClustering {
    constructor(options: MarkerClusteringOptions)
    setMap(map: naver.maps.Map | null): void
    getMap(): naver.maps.Map | null
    setMarkers(markers: naver.maps.Marker[]): void
    getMarkers(): naver.maps.Marker[]
  }
}
