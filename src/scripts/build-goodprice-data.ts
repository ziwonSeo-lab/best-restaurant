import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Restaurant } from '../lib/types'

const DATA_DIR = join(process.cwd(), 'public', 'data')

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

const REGION_NAMES: Record<string, string> = {
  seoul: '서울특별시',
  busan: '부산광역시',
  daegu: '대구광역시',
  incheon: '인천광역시',
  gwangju: '광주광역시',
  daejeon: '대전광역시',
  ulsan: '울산광역시',
  sejong: '세종특별자치시',
  gyeonggi: '경기도',
  gangwon: '강원특별자치도',
  chungbuk: '충청북도',
  chungnam: '충청남도',
  jeonbuk: '전북특별자치도',
  jeonnam: '전라남도',
  gyeongbuk: '경상북도',
  gyeongnam: '경상남도',
  jeju: '제주특별자치도',
}

// 붙어있는 한국 주소를 공백으로 분리
// "서울특별시종로구대학로5길5(연건동)" → "서울특별시 종로구 대학로5길 5"
function splitKoreanAddress(addr: string): string {
  if (addr.includes(' ')) return addr

  const base = addr.replace(/\(.*\)$/, '').trim()

  // 시도 분리
  const sidoMatch = base.match(
    /^(.*?(?:특별시|광역시|특별자치시|특별자치도|도))(.*)/
  )
  if (!sidoMatch) return base

  const [, sido, afterSido] = sidoMatch

  // 시군구 분리 (중첩 시+구 처리: 수원시팔달구 → 수원시 팔달구)
  const sigunguMatch = afterSido.match(
    /^(.*?[시군].*?구|.*?[시군구])(.*)/
  )
  if (!sigunguMatch) return `${sido} ${afterSido}`

  let [, sigungu, afterSigungu] = sigunguMatch

  // 중첩 시+구인 경우 내부에도 공백 추가
  sigungu = sigungu.replace(/([시])(?=[가-힣])/, '$1 ')

  // 도로명 + 건물번호 분리
  // 도로명: 한글 + (숫자+번길|숫자+길|대로|로|길) → 마지막 대로/로/길로 끝나는 부분
  // 예: 대학로5길, 테헤란로108길, 해운대로570번길, 동숭길, 팔달로
  const roadMatch = afterSigungu.match(
    /^(.*(?:대로|번길|길|로))(\d+.*)$/
  )
  if (roadMatch) {
    const [, road, num] = roadMatch
    return `${sido} ${sigungu} ${road} ${num}`
  }

  return `${sido} ${sigungu} ${afterSigungu}`
}

// 음식 관련 업종만 필터 (비요식업, 미용, 세탁, 숙박 등 제외)
const NON_FOOD_PATTERNS = [
  '비요식', '미용', '이용', '세탁', '숙박', '개인서비스', '피부',
]

async function geocodeWithNominatim(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      countrycodes: 'kr',
      limit: '1',
    })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'BestRestaurantApp/1.0' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data?.[0]?.lat && data?.[0]?.lon) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

interface GoodPriceRow {
  sido: string
  sigun: string
  induty: string
  name: string
  phone: string
  address: string
  menus: { name: string; price: string }[]
}

function normalizeFoodType(induty: string): string {
  if (induty.startsWith('한식')) return '한식'
  if (induty.startsWith('중식')) return '중식'
  if (induty.startsWith('일식')) return '일식'
  if (induty.startsWith('양식')) return '양식'
  if (induty.includes('커피') || induty.includes('디저트')) return '카페/디저트'
  if (induty.includes('요식')) return '기타'
  return induty
}

function isFoodBusiness(induty: string): boolean {
  return !NON_FOOD_PATTERNS.some((p) => induty.includes(p))
}

function matchRegion(sido: string): string | null {
  for (const [regionKey, patterns] of Object.entries(REGION_ADDRESS_MAP)) {
    if (patterns.some((p) => sido.startsWith(p))) {
      return regionKey
    }
  }
  return null
}

function parseCSV(buffer: Buffer): GoodPriceRow[] {
  // CP949 디코딩
  const decoder = new TextDecoder('euc-kr')
  const text = decoder.decode(buffer)
  const lines = text.split(/\r?\n/).filter((l) => l.trim())

  // 헤더 스킵
  const rows: GoodPriceRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 8) continue

    const sido = (cols[0] || '').trim()
    const sigun = (cols[1] || '').trim()
    const induty = (cols[2] || '').trim()
    const name = (cols[3] || '').trim()
    const phone = (cols[4] || '').trim()
    const address = (cols[5] || '').trim()

    if (!name || !address || !induty) continue
    if (!isFoodBusiness(induty)) continue

    const menus: { name: string; price: string }[] = []
    for (let m = 0; m < 4; m++) {
      const menuName = (cols[6 + m * 2] || '').trim()
      const menuPrice = (cols[7 + m * 2] || '').trim()
      if (menuName && menuPrice) {
        menus.push({ name: menuName, price: menuPrice })
      }
    }

    rows.push({ sido, sigun, induty, name, phone, address, menus })
  }

  return rows
}

async function buildRegionData(
  regionKey: string,
  allData: GoodPriceRow[]
): Promise<void> {
  const regionName = REGION_NAMES[regionKey]
  if (!regionName) {
    console.error(`알 수 없는 지역: ${regionKey}`)
    return
  }

  const outputPath = join(DATA_DIR, `goodprice-${regionKey}.json`)

  console.log(`\n=== ${regionName} 착한가격업소 빌드 시작 ===`)

  const regionData = allData.filter((row) => matchRegion(row.sido) === regionKey)
  console.log(`음식점 데이터: ${regionData.length}건`)

  // 기존 데이터 로드 (geocoding 캐시)
  let existingMap = new Map<string, Restaurant>()
  if (existsSync(outputPath)) {
    try {
      const existing: Restaurant[] = JSON.parse(
        readFileSync(outputPath, 'utf-8')
      )
      existingMap = new Map(existing.map((r) => [r.id, r]))
      console.log(`기존 geocoding 데이터: ${existingMap.size}건 재사용`)
    } catch {
      // ignore
    }
  }

  console.log('Geocoding 시작...')
  const restaurants: Restaurant[] = []
  let geocodedCount = 0
  let cachedCount = 0
  let failedCount = 0

  for (let i = 0; i < regionData.length; i++) {
    const row = regionData[i]
    const id = `goodprice-${regionKey}-${i}`

    // ID 기반 캐시 (주소+이름 기반 캐시로 보완)
    const cacheKey = `goodprice-${row.name}-${row.address}`
    const existing = existingMap.get(id) ||
      Array.from(existingMap.values()).find(
        (r) => r.name === row.name && r.address === row.address
      )

    if (existing?.lat && existing?.lng) {
      restaurants.push({
        ...existing,
        id,
        name: row.name,
        address: row.address,
        jibunAddress: '',
        phone: row.phone,
        foodType: normalizeFoodType(row.induty),
        mainFood: row.menus[0]?.name || '',
        designatedDate: '',
        source: 'goodprice',
        goodpriceMenus: row.menus,
      })
      cachedCount++
      continue
    }

    if (!row.address) {
      failedCount++
      continue
    }

    // CSV 주소에 공백이 없으므로 구조적으로 분리
    const cleanAddress = splitKoreanAddress(row.address)

    const coords = await geocodeWithNominatim(cleanAddress)

    if (coords) {
      restaurants.push({
        id,
        name: row.name,
        address: row.address,
        jibunAddress: '',
        phone: row.phone,
        foodType: normalizeFoodType(row.induty),
        mainFood: row.menus[0]?.name || '',
        designatedDate: '',
        lat: coords.lat,
        lng: coords.lng,
        region: regionName,
        source: 'goodprice',
        goodpriceMenus: row.menus,
      })
      geocodedCount++
    } else {
      failedCount++
    }

    if ((i + 1) % 50 === 0 || i === regionData.length - 1) {
      const pct = (((i + 1) / regionData.length) * 100).toFixed(1)
      process.stdout.write(
        `\r  ${i + 1}/${regionData.length} (${pct}%) | geocoded: ${geocodedCount} | 캐시: ${cachedCount} | 실패: ${failedCount}`
      )
    }

    // Nominatim rate limit: 1 req/sec
    await new Promise((r) => setTimeout(r, 1100))
  }

  console.log('')

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
  console.log(`=== 완료: ${restaurants.length}건 저장 → ${outputPath} ===`)
}

// CLI: npx tsx src/scripts/build-goodprice-data.ts [region|all] [--file path/to/csv]
const args = process.argv.slice(2)
const fileArgIdx = args.indexOf('--file')
const csvPath = fileArgIdx !== -1
  ? args[fileArgIdx + 1]
  : join(process.cwd(), 'goodprice_250930.csv')
const regionArg = args.find(
  (a, i) => a !== '--file' && (fileArgIdx === -1 || i !== fileArgIdx + 1)
) || 'seoul'

async function main() {
  if (!existsSync(csvPath)) {
    console.error(`CSV 파일을 찾을 수 없습니다: ${csvPath}`)
    process.exit(1)
  }

  console.log(`CSV 파일 로드: ${csvPath}`)
  const buffer = readFileSync(csvPath)
  const allData = parseCSV(buffer)
  console.log(`전체 음식점 데이터: ${allData.length}건`)

  const regions =
    regionArg === 'all' ? Object.keys(REGION_NAMES) : [regionArg]

  for (const region of regions) {
    await buildRegionData(region, allData)
  }
}

main().catch(console.error)
