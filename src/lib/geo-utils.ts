function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Haversine 거리 계산 (미터 단위) */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/** 거리를 읽기 쉬운 문자열로 변환 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}
