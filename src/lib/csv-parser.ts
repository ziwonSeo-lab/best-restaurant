import iconv from 'iconv-lite'
import Papa from 'papaparse'
import type { RawRestaurantCSV } from './types'

const BASE_URL =
  'https://file.localdata.go.kr/file/download/excellent_restaurant_info/info'

export async function downloadAndParseCSV(
  orgCode: string
): Promise<RawRestaurantCSV[]> {
  const url = `${BASE_URL}?orgCode=${orgCode}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`CSV 다운로드 실패: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const text = iconv.decode(buffer, 'cp949')

  const result = Papa.parse<RawRestaurantCSV>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  })

  if (result.errors.length > 0) {
    console.warn('CSV 파싱 경고:', result.errors.slice(0, 5))
  }

  return result.data
}

export function filterActiveRestaurants(
  data: RawRestaurantCSV[]
): RawRestaurantCSV[] {
  return data.filter((row) => {
    const status = row.영업상태명?.trim()
    return status === '영업' || status === '정상'
  })
}
