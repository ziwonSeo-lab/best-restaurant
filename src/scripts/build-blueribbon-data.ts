import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Restaurant, RibbonType } from '../lib/types'

const DATA_DIR = join(process.cwd(), 'public', 'data')
const BASE_URL = 'https://www.bluer.co.kr'

const REGION_ADDRESS_MAP: Record<string, string[]> = {
  seoul: ['서울특별시', '서울시', '서울'],
  busan: ['부산광역시', '부산시', '부산'],
  daegu: ['대구광역시', '대구시', '대구'],
  incheon: ['인천광역시', '인천시', '인천'],
  gwangju: ['광주광역시', '광주시', '광주'],
  daejeon: ['대전광역시', '대전시', '대전'],
  ulsan: ['울산광역시', '울산시', '울산'],
  sejong: ['세종특별자치시', '세종시', '세종'],
  gyeonggi: ['경기도', '경기'],
  gangwon: ['강원특별자치도', '강원도', '강원'],
  chungbuk: ['충청북도', '충북'],
  chungnam: ['충청남도', '충남'],
  jeonbuk: ['전북특별자치도', '전라북도', '전북'],
  jeonnam: ['전라남도', '전남'],
  gyeongbuk: ['경상북도', '경북'],
  gyeongnam: ['경상남도', '경남'],
  jeju: ['제주특별자치도', '제주도', '제주'],
}

// API ribbonType 파라미터 값 → 내부 RibbonType 매핑
const RIBBON_TYPES: { param: string; type: RibbonType }[] = [
  { param: 'RIBBON_THREE', type: 'RIBBON_THREE' },
  { param: 'RIBBON_TWO', type: 'RIBBON_TWO' },
  { param: 'RIBBON_ONE', type: 'RIBBON_ONE' },
]

// API 응답 타입 (Spring HATEOAS)
interface ApiRestaurant {
  id: number
  headerInfo: {
    nameKR: string
    ribbonType: string
  }
  defaultInfo: {
    phone: string
  }
  juso: {
    roadAddrPart1: string
    jibunAddr: string
    siNm: string
    sggNm: string
    emdNm: string
  } | null
  gps: {
    latitude: number
    longitude: number
  } | null
  review: {
    reviewSimple: string
  } | null
  foodTypes: string[]
  etcInfo: {
    close: boolean
  }
}

interface ApiResponse {
  _embedded?: {
    restaurants: ApiRestaurant[]
  }
  page: {
    size: number
    totalElements: number
    totalPages: number
    number: number
  }
}

function matchRegion(siNm: string): string | null {
  for (const [regionKey, patterns] of Object.entries(REGION_ADDRESS_MAP)) {
    if (patterns.some((p) => siNm.startsWith(p))) {
      return regionKey
    }
  }
  return null
}

async function getSession(): Promise<{ cookie: string; csrfToken: string }> {
  console.log('세션 및 CSRF 토큰 획득 중...')

  const mainRes = await fetch(BASE_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  })

  if (!mainRes.ok) {
    throw new Error(`메인 페이지 요청 실패: ${mainRes.status}`)
  }

  const setCookies = mainRes.headers.getSetCookie?.() || []
  const sessionCookie = setCookies
    .map((c) => c.split(';')[0])
    .filter((c) => c.startsWith('JSESSIONID='))
    .join('; ')

  if (!sessionCookie) {
    throw new Error('JSESSIONID 쿠키를 획득할 수 없습니다.')
  }

  const html = await mainRes.text()
  const csrfMatch = html.match(/name="_csrf"\s+content="([^"]+)"/)
  const csrfToken = csrfMatch?.[1] || ''

  console.log(`세션 획득 완료 (CSRF: ${csrfToken ? '있음' : '없음'})`)
  return { cookie: sessionCookie, csrfToken }
}

async function fetchRibbonType(
  ribbonParam: string,
  session: { cookie: string; csrfToken: string }
): Promise<ApiRestaurant[]> {
  const items: ApiRestaurant[] = []
  let page = 0
  let totalPages = 1

  console.log(`\n리본 타입 ${ribbonParam} 크롤링 시작...`)

  while (page < totalPages) {
    const url = `${BASE_URL}/api/v1/restaurants?ribbonType=${ribbonParam}&page=${page}&size=100&sort=updatedDate,desc`

    const headers: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      Cookie: session.cookie,
      Referer: `${BASE_URL}/restaurant/search`,
      'X-Requested-With': 'XMLHttpRequest',
    }

    if (session.csrfToken) {
      headers['X-CSRF-TOKEN'] = session.csrfToken
    }

    const res = await fetch(url, { headers })

    if (!res.ok) {
      console.error(`\nAPI 요청 실패 (page=${page}): ${res.status}`)
      const body = await res.text().catch(() => '')
      console.error(`  응답: ${body.slice(0, 200)}`)
      break
    }

    const data: ApiResponse = await res.json()
    const restaurants = data._embedded?.restaurants || []
    items.push(...restaurants)
    totalPages = data.page.totalPages

    process.stdout.write(
      `\r  page ${page + 1}/${totalPages} | 누적: ${items.length}/${data.page.totalElements}`
    )

    page++
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\n  ${ribbonParam}: ${items.length}건 수집 완료`)
  return items
}

function toRestaurant(item: ApiRestaurant, ribbonType: RibbonType): Restaurant | null {
  if (!item.gps?.latitude || !item.gps?.longitude) return null
  if (item.etcInfo?.close) return null // 폐업 제외

  const siNm = item.juso?.siNm || ''
  if (!matchRegion(siNm)) return null

  return {
    id: `blueribbon-${item.id}`,
    name: item.headerInfo?.nameKR || '',
    address: item.juso?.roadAddrPart1 || '',
    jibunAddress: item.juso?.jibunAddr || '',
    phone: item.defaultInfo?.phone || '',
    foodType: item.foodTypes?.[0] || '',
    mainFood: '',
    designatedDate: '',
    lat: item.gps.latitude,
    lng: item.gps.longitude,
    region: siNm,
    source: 'blueribbon',
    ribbonType,
    review: item.review?.reviewSimple || '',
  }
}

async function main() {
  const regionArg = process.argv[2] || 'seoul'
  const targetRegions =
    regionArg === 'all' ? Object.keys(REGION_ADDRESS_MAP) : [regionArg]

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  const session = await getSession()

  // 전체 리본 타입 크롤링
  const allRestaurants: { item: ApiRestaurant; ribbonType: RibbonType }[] = []

  for (const { param, type } of RIBBON_TYPES) {
    const items = await fetchRibbonType(param, session)
    allRestaurants.push(...items.map((item) => ({ item, ribbonType: type })))
  }

  console.log(`\n전체 수집: ${allRestaurants.length}건`)

  // 지역별 분류
  const regionMap = new Map<string, Restaurant[]>()
  let skippedCount = 0

  for (const { item, ribbonType } of allRestaurants) {
    const restaurant = toRestaurant(item, ribbonType)
    if (!restaurant) {
      skippedCount++
      continue
    }

    const siNm = item.juso?.siNm || ''
    const regionKey = matchRegion(siNm)
    if (!regionKey) continue

    if (!regionMap.has(regionKey)) {
      regionMap.set(regionKey, [])
    }
    regionMap.get(regionKey)!.push(restaurant)
  }

  console.log(`GPS 없음/폐업/지역 매칭 실패: ${skippedCount}건`)

  // 대상 지역만 저장
  for (const regionKey of targetRegions) {
    const restaurants = regionMap.get(regionKey) || []
    const outputPath = join(DATA_DIR, `blueribbon-${regionKey}.json`)
    writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
    console.log(`${regionKey}: ${restaurants.length}건 → ${outputPath}`)
  }

  console.log('\n=== 지역별 통계 ===')
  for (const [key, restaurants] of regionMap.entries()) {
    if (targetRegions.includes(key) || regionArg === 'all') {
      console.log(`  ${key}: ${restaurants.length}건`)
    }
  }
}

main().catch(console.error)
