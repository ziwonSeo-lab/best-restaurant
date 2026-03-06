import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Restaurant } from '../lib/types'

const DATA_DIR = join(process.cwd(), 'public', 'data')

const ALGOLIA_APP_ID = '8NVHRD7ONV'
const ALGOLIA_SEARCH_KEY = '3222e669cf890dc73fa5f38241117ba5'
const ALGOLIA_URL = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/*/queries`

const CITY_REGION_MAP: Record<string, string> = {
  Seoul: 'seoul',
  Busan: 'busan',
  Daegu: 'daegu',
  Incheon: 'incheon',
  Gwangju: 'gwangju',
  Daejeon: 'daejeon',
  Ulsan: 'ulsan',
  Sejong: 'sejong',
  Jeju: 'jeju',
}

interface AlgoliaHit {
  objectID: string
  name: string
  street: string
  phone: string
  cuisines: { label: string }[]
  price_category: { label: string } | null
  main_desc: string
  url: string
  city: { name: string } | null
  _geoloc: { lat: number; lng: number }
  region: { name: string } | null
}

interface AlgoliaResponse {
  results: {
    hits: AlgoliaHit[]
    nbHits: number
  }[]
}

function mapCityToRegion(cityName: string): string | null {
  return CITY_REGION_MAP[cityName] || null
}

function toRestaurant(hit: AlgoliaHit, regionKey: string): Restaurant {
  const cuisineLabel = hit.cuisines?.[0]?.label || ''

  return {
    id: `bibgourmand-${hit.objectID}`,
    name: hit.name || '',
    address: hit.street || '',
    jibunAddress: '',
    phone: hit.phone || '',
    foodType: cuisineLabel,
    mainFood: '',
    designatedDate: '',
    lat: hit._geoloc.lat,
    lng: hit._geoloc.lng,
    region: regionKey,
    source: 'bibgourmand',
    priceCategoryLabel: hit.price_category?.label || '',
    michelinDesc: hit.main_desc || '',
    michelinUrl: hit.url ? `https://guide.michelin.com${hit.url}` : '',
  }
}

async function fetchBibGourmand(): Promise<AlgoliaHit[]> {
  console.log('미쉐린 빕 구르망 데이터 조회 중...')

  const body = {
    requests: [
      {
        indexName: 'prod-restaurants-ko',
        params: '',
        facetFilters: [
          ['distinction.slug:bib-gourmand'],
          ['country.cname:south-korea'],
        ],
        hitsPerPage: 200,
      },
    ],
  }

  const res = await fetch(ALGOLIA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Algolia-Application-Id': ALGOLIA_APP_ID,
      'X-Algolia-API-Key': ALGOLIA_SEARCH_KEY,
      Referer: 'https://guide.michelin.com/',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Algolia API 요청 실패: ${res.status} ${text.slice(0, 200)}`)
  }

  const data: AlgoliaResponse = await res.json()
  const hits = data.results?.[0]?.hits || []
  const totalHits = data.results?.[0]?.nbHits || 0

  console.log(`총 ${totalHits}건 조회, ${hits.length}건 수신`)
  return hits
}

async function main() {
  const regionArg = process.argv[2] || 'all'

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  const hits = await fetchBibGourmand()

  // 지역별 분류
  const regionMap = new Map<string, Restaurant[]>()
  let unmappedCount = 0

  for (const hit of hits) {
    const cityName = hit.city?.name || ''
    const regionKey = mapCityToRegion(cityName)

    if (!regionKey) {
      unmappedCount++
      console.warn(`  도시 매핑 실패: "${cityName}" (${hit.name})`)
      continue
    }

    if (!regionMap.has(regionKey)) {
      regionMap.set(regionKey, [])
    }
    regionMap.get(regionKey)!.push(toRestaurant(hit, regionKey))
  }

  if (unmappedCount > 0) {
    console.log(`도시 매핑 실패: ${unmappedCount}건`)
  }

  // 저장
  const targetRegions =
    regionArg === 'all'
      ? Array.from(regionMap.keys())
      : [regionArg]

  for (const regionKey of targetRegions) {
    const restaurants = regionMap.get(regionKey) || []
    const outputPath = join(DATA_DIR, `bibgourmand-${regionKey}.json`)
    writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
    console.log(`${regionKey}: ${restaurants.length}건 → ${outputPath}`)
  }

  console.log('\n=== 지역별 통계 ===')
  for (const [key, restaurants] of regionMap.entries()) {
    console.log(`  ${key}: ${restaurants.length}건`)
  }
  console.log(`  합계: ${hits.length - unmappedCount}건`)
}

main().catch(console.error)
