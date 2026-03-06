interface GeocodeResult {
  lat: number
  lng: number
}

// VWORLD 국토교통부 Geocoding API
// 발급: https://www.vworld.kr → 로그인 → 오픈API → 인증키 발급
const VWORLD_GEOCODE_URL = 'https://api.vworld.kr/req/address'

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function geocodeAddress(
  address: string,
  apiKey: string
): Promise<GeocodeResult | null> {
  if (!address || address.trim() === '') return null

  try {
    const params = new URLSearchParams({
      service: 'address',
      request: 'getcoord',
      version: '2.0',
      crs: 'epsg:4326',
      address: address,
      refine: 'true',
      simple: 'false',
      format: 'json',
      type: 'ROAD',
      key: apiKey,
    })

    const response = await fetch(`${VWORLD_GEOCODE_URL}?${params}`)

    if (!response.ok) {
      console.warn(`Geocoding 실패 (${response.status}): ${address}`)
      return null
    }

    const data = await response.json()

    if (
      data.response?.status === 'OK' &&
      data.response?.result?.point
    ) {
      return {
        lat: parseFloat(data.response.result.point.y),
        lng: parseFloat(data.response.result.point.x),
      }
    }

    // 도로명 주소 실패 시 지번 주소로 재시도
    if (data.response?.status !== 'OK') {
      const paramsJibun = new URLSearchParams({
        service: 'address',
        request: 'getcoord',
        version: '2.0',
        crs: 'epsg:4326',
        address: address,
        refine: 'true',
        simple: 'false',
        format: 'json',
        type: 'PARCEL',
        key: apiKey,
      })

      const res2 = await fetch(`${VWORLD_GEOCODE_URL}?${paramsJibun}`)
      if (res2.ok) {
        const data2 = await res2.json()
        if (
          data2.response?.status === 'OK' &&
          data2.response?.result?.point
        ) {
          return {
            lat: parseFloat(data2.response.result.point.y),
            lng: parseFloat(data2.response.result.point.x),
          }
        }
      }
    }

    return null
  } catch (error) {
    console.warn(`Geocoding 에러: ${address}`, error)
    return null
  }
}

export async function batchGeocode(
  addresses: string[],
  apiKey: string,
  options: {
    delayMs?: number
    onProgress?: (done: number, total: number) => void
  } = {}
): Promise<(GeocodeResult | null)[]> {
  const { delayMs = 100, onProgress } = options
  const results: (GeocodeResult | null)[] = []

  for (let i = 0; i < addresses.length; i++) {
    const result = await geocodeAddress(addresses[i], apiKey)
    results.push(result)

    if (onProgress) {
      onProgress(i + 1, addresses.length)
    }

    if (i < addresses.length - 1) {
      await sleep(delayMs)
    }
  }

  return results
}
