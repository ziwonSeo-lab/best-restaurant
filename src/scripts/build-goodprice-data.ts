import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { Restaurant } from '../lib/types'

const DATA_DIR = join(process.cwd(), 'public', 'data')

// 읍면동 사전 로드 (행정동_법정동 CSV에서 생성)
const EUPMYEON_MAP_PATH = join(DATA_DIR, 'eupmyeon-map.json')
const EUPMYEON_LIST: string[] = existsSync(EUPMYEON_MAP_PATH)
  ? Object.keys(JSON.parse(readFileSync(EUPMYEON_MAP_PATH, 'utf-8')))
      .sort((a, b) => b.length - a.length) // 긴 이름 우선 매칭
  : []

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

// 파싱된 주소 구성요소
interface ParsedAddress {
  sido: string       // 시도
  sigungu: string    // 시군구
  eupmyeon: string   // 읍/면/동 (선택)
  road: string       // 도로명
  buildingNo: string // 건물번호
  full: string       // 전체 주소 문자열
}

// 건물번호에서 층/호 제거
function cleanBuildingNo(raw: string): string {
  // "3361층101호" → "336" (3자리+1층의 경우 1층 이전까지)
  // "52-2102호" → "52-21" (세자리가 아니면 뒤 2자리 제거)
  // 단, 합리적인 형태가 있어야 함
  const floorMatch = raw.match(/^(\d+(?:-\d+)?)(\d{1})(층.*)/)
  if (floorMatch) return floorMatch[1]

  const underMatch = raw.match(/^(\d+(?:-\d+)?)(지하|지층|동|B)/)
  if (underMatch) return underMatch[1]

  const numMatch = raw.match(/^(\d+(?:-\d+)?)/)
  if (numMatch) return numMatch[1]

  return raw
}

// 붙어있는 한국 주소를 공백으로 분리
// "서울특별시종로구대학로5길5(연건동)" → "서울특별시 종로구 대학로5길 5"
// "경상북도포항시남구구룡포읍구룡포길85-1" → "경상북도 포항시 남구 구룡포읍 구룡포길 85-1"
function parseKoreanAddress(addr: string): ParsedAddress {
  const base = addr.replace(/\(.*?\)/g, '').trim()

  // 이미 공백이 있는 경우 간단히 분리
  if (base.includes(' ')) {
    const parts = base.split(/\s+/)
    return {
      sido: parts[0] || '',
      sigungu: parts[1] || '',
      eupmyeon: parts.length >= 5 && /[읍면동]$/.test(parts[2]) ? parts[2] : '',
      road: parts.find((p) => /(?:로|길)$/.test(p) || /로\d|길\d/.test(p)) || '',
      buildingNo: parts[parts.length - 1] || '',
      full: base,
    }
  }

  // 시도 분리
  const sidoMatch = base.match(
    /^(.*?(?:특별시|광역시|특별자치시|특별자치도|도))(.*)/
  )
  if (!sidoMatch) {
    return { sido: '', sigungu: '', eupmyeon: '', road: '', buildingNo: '', full: base }
  }

  const [, sido, afterSido] = sidoMatch

  // 시군구 분리 (중첩 시+구: 수원시팔달구, 경기도용인시처인구)
  const sigunguMatch = afterSido.match(
    /^(.*?[시군].*?구|.*?[시군구])(.*)/
  )

  let sigungu = ''
  let afterSigungu = afterSido

  if (sigunguMatch) {
    sigungu = sigunguMatch[1].replace(/([시])(?=[가-힣])/, '$1 ')
    afterSigungu = sigunguMatch[2]
  }

  // 읍/면 분리 - 행정동 사전 기반 우선, fallback으로 정규식
  let eupmyeon = ''
  if (EUPMYEON_LIST.length > 0) {
    const found = EUPMYEON_LIST.find((em) => afterSigungu.startsWith(em))
    if (found) {
      eupmyeon = found
      afterSigungu = afterSigungu.slice(found.length)
    }
  }
  if (!eupmyeon) {
    const eupmyeonMatch = afterSigungu.match(/^([가-힣]+[읍면])(.+)/)
    if (eupmyeonMatch) {
      eupmyeon = eupmyeonMatch[1]
      afterSigungu = eupmyeonMatch[2]
    }
  }

  // 도로명 추출 - 복합 도로명 우선
  const roadPatterns: RegExp[] = [
    /^(.*?(?:대로|로)\d+[가-힣]?길)(.*)/,  // 세종대로23길, 와우산로29바길
    /^(.*?(?:대로|로)\d+번길)(.*)/,          // 해운대로570번길
    /^(.*?(?:대로|로)\d+길)(.*)/,            // 테헤란로108길
    /^(.*?(?:대로))(.*)/,                    // 강남대로
    /^(.*?[가-힣]\d+[가-힣]?길)(.*)/,        // 동숭3길, 아랫말1길
    /^(.*?[가-힣]길)(.*)/,                   // 명륜길, 중단길
    /^(.*?[가-힣]로)(.*)/,                   // 퇴계로
  ]

  let road = ''
  let afterRoad = ''
  for (const pat of roadPatterns) {
    const m = afterSigungu.match(pat)
    if (m) {
      road = m[1]
      afterRoad = m[2]
      break
    }
  }

  const sigunguPrefix = [sido, sigungu, eupmyeon].filter(Boolean).join(' ')

  if (!road) {
    return {
      sido,
      sigungu,
      eupmyeon,
      road: '',
      buildingNo: '',
      full: `${sigunguPrefix} ${afterSigungu}`.trim(),
    }
  }

  if (!afterRoad) {
    return {
      sido,
      sigungu,
      eupmyeon,
      road,
      buildingNo: '',
      full: `${sigunguPrefix} ${road}`.trim(),
    }
  }

  const buildingNo = cleanBuildingNo(afterRoad)
  const full = buildingNo
    ? `${sigunguPrefix} ${road} ${buildingNo}`
    : `${sigunguPrefix} ${road}`

  return { sido, sigungu, eupmyeon, road, buildingNo, full: full.trim() }
}

// 하위 호환성 유지
function splitKoreanAddress(addr: string): string {
  return parseKoreanAddress(addr).full
}

// 음식 관련 업종만 필터 (비요식업, 미용, 세탁, 숙박 등 제외)
const NON_FOOD_PATTERNS = [
  '비요식', '미용', '이용', '세탁', '숙박', '개인서비스', '피부',
]

// Nominatim에 한 번 호출 (rate limit 처리 포함)
async function nominatimQuery(
  query: string,
  retries = 3
): Promise<{ lat: number; lng: number } | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        countrycodes: 'kr',
        limit: '1',
      })
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { 'User-Agent': 'BestRestaurantApp/1.0 (https://github.com/ziwonSeo-lab/best_restorent)' },
      })
      if (res.status === 403 || res.status === 429) {
        const waitSec = 60 * (attempt + 1)
        console.log(`\n  Rate limited (${res.status}), ${waitSec}초 대기 후 재시도...`)
        await new Promise((r) => setTimeout(r, waitSec * 1000))
        continue
      }
      if (!res.ok) return null
      const data = await res.json()
      if (data?.[0]?.lat && data?.[0]?.lon) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      }
      return null
    } catch {
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, 30000))
        continue
      }
      return null
    }
  }
  return null
}

// 여러 검색 변형을 순차 시도하여 geocoding 성공률 향상
async function geocodeWithNominatim(
  parsed: ParsedAddress
): Promise<{ lat: number; lng: number } | null> {
  // 검색 전략: 풀주소 → 읍면제거 → 건물번호제거 → 읍면+도로만
  const variants: string[] = []

  // 1. 풀주소 (파싱된 전체)
  if (parsed.full) variants.push(parsed.full)

  // 2. 읍/면 제거한 버전 (Nominatim이 읍/면 인식 못하는 경우 많음)
  if (parsed.eupmyeon && parsed.road && parsed.buildingNo) {
    variants.push(
      [parsed.sido, parsed.sigungu, parsed.road, parsed.buildingNo]
        .filter(Boolean)
        .join(' ')
    )
  }

  // 3. 건물번호 제거 (도로명까지만)
  if (parsed.road) {
    variants.push(
      [parsed.sido, parsed.sigungu, parsed.eupmyeon, parsed.road]
        .filter(Boolean)
        .join(' ')
    )
  }

  // 4. 읍/면 + 도로명 (시군구 뒤 생략)
  if (parsed.eupmyeon && parsed.road) {
    variants.push(
      [parsed.sido, parsed.eupmyeon, parsed.road].filter(Boolean).join(' ')
    )
  }

  // 5. 시군구 + 읍면동 (도로명 실패 시 읍면동 중심좌표라도 확보)
  if (parsed.eupmyeon) {
    variants.push(
      [parsed.sido, parsed.sigungu, parsed.eupmyeon].filter(Boolean).join(' ')
    )
  }

  // 중복 제거
  const uniqueVariants = Array.from(new Set(variants))

  for (const variant of uniqueVariants) {
    const result = await nominatimQuery(variant)
    if (result) return result
    // 변형 간 짧은 대기 (rate limit 방지)
    if (uniqueVariants.length > 1) {
      await new Promise((r) => setTimeout(r, 1100))
    }
  }

  return null
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
    const parsed = parseKoreanAddress(row.address)

    const coords = await geocodeWithNominatim(parsed)

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

    // 100건마다 중간 저장
    if ((i + 1) % 100 === 0 && restaurants.length > 0) {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
      writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
    }

    // Nominatim rate limit: 1 req/sec (여유 확보)
    await new Promise((r) => setTimeout(r, 2000))
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
