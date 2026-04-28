/**
 * 식품안심업소 빌드 스크립트
 * xlsx 파일을 읽어 지역별 safefood-{region}.json 생성
 * - 기존 지역 데이터(model/goodprice 등)와 주소 매칭으로 좌표 재사용
 * - 미매칭 업소만 Nominatim 지오코딩
 */
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import * as XLSX from 'xlsx'
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

interface SafeFoodRow {
  name: string
  address: string
  grade: string
  certNo: string
  designatedDate: string
}

function matchRegion(address: string): string | null {
  for (const [regionKey, patterns] of Object.entries(REGION_ADDRESS_MAP)) {
    if (patterns.some((p) => address.startsWith(p))) return regionKey
  }
  return null
}

// 주소 정규화: 괄호 제거, 연속 공백 단일화
function normalizeAddress(addr: string): string {
  return addr.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim()
}

// 주소의 앞 3개 토큰(시도+시군구+도로명)만 추출해서 빠른 매칭에 사용
function addressKey(addr: string): string {
  const cleaned = normalizeAddress(addr)
  const parts = cleaned.split(' ')
  return parts.slice(0, 3).join(' ')
}

// 이름 정규화: 공백·특수문자 제거 후 소문자
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[\s()（）\[\]·.]/g, '')
}

// 기존 지역 데이터를 불러와 주소키 → 좌표 맵 구성
function buildCoordCache(regionKey: string): Map<string, { lat: number; lng: number }> {
  const cache = new Map<string, { lat: number; lng: number }>()
  const sources = ['', 'blueribbon-', 'bibgourmand-', 'yeskidszone-', 'goodprice-']
  for (const prefix of sources) {
    const path = join(DATA_DIR, `${prefix}${regionKey}.json`)
    if (!existsSync(path)) continue
    try {
      const data: Restaurant[] = JSON.parse(readFileSync(path, 'utf-8'))
      for (const r of data) {
        if (!r.lat || !r.lng) continue
        const key = addressKey(r.address || r.jibunAddress || '')
        if (key && !cache.has(key)) cache.set(key, { lat: r.lat, lng: r.lng })
        // 이름 기반 키도 추가 (폴백)
        const nKey = `name:${normalizeName(r.name)}`
        if (!cache.has(nKey)) cache.set(nKey, { lat: r.lat, lng: r.lng })
      }
    } catch { /* skip */ }
  }
  return cache
}

async function nominatimQuery(query: string, retries = 3): Promise<{ lat: number; lng: number } | null> {
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
        console.log(`\n  Rate limited (${res.status}), ${waitSec}초 대기...`)
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
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 30000))
    }
  }
  return null
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const clean = normalizeAddress(address)
  // 전략 1: 전체 주소
  const r1 = await nominatimQuery(clean)
  if (r1) return r1
  await new Promise((r) => setTimeout(r, 1100))

  // 전략 2: 건물번호 제외 (도로명까지만)
  const parts = clean.split(' ')
  const roadIdx = parts.findIndex((p) => /[로길]$/.test(p) || /로\d|길\d/.test(p))
  if (roadIdx > 0) {
    const r2 = await nominatimQuery(parts.slice(0, roadIdx + 1).join(' '))
    if (r2) return r2
    await new Promise((r) => setTimeout(r, 1100))
  }

  return null
}

function readXlsx(filePath: string): SafeFoodRow[] {
  const wb = XLSX.readFile(filePath)
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, { header: 1 })

  // 헤더 행 찾기 ('연번' 셀이 있는 행)
  let headerIdx = -1
  for (let i = 0; i < rawRows.length; i++) {
    if (rawRows[i][0] === '연번') { headerIdx = i; break }
  }
  if (headerIdx < 0) throw new Error('헤더 행을 찾을 수 없습니다.')

  const rows: SafeFoodRow[] = []
  for (let i = headerIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i]
    if (row[0] == null) continue
    const name = String(row[1] || '').trim()
    const address = String(row[2] || '').trim()
    const grade = String(row[3] || '').trim()
    const certNo = String(row[4] || '').trim()
    const designatedDate = String(row[5] || '').trim()
    if (!name || !address) continue
    rows.push({ name, address, grade, certNo, designatedDate })
  }
  return rows
}

async function buildRegionData(
  regionKey: string,
  allRows: SafeFoodRow[]
): Promise<void> {
  const regionName = REGION_NAMES[regionKey]
  const outputPath = join(DATA_DIR, `safefood-${regionKey}.json`)

  const regionRows = allRows.filter((r) => matchRegion(r.address) === regionKey)
  if (regionRows.length === 0) {
    console.log(`${regionName}: 데이터 없음, 스킵`)
    return
  }

  console.log(`\n=== ${regionName} 식품안심업소 빌드 시작 (${regionRows.length}건) ===`)

  // 기존 geocoding 캐시 (자체 파일)
  let selfCache = new Map<string, Restaurant>()
  if (existsSync(outputPath)) {
    try {
      const existing: Restaurant[] = JSON.parse(readFileSync(outputPath, 'utf-8'))
      selfCache = new Map(existing.map((r) => [r.id, r]))
      console.log(`  기존 캐시: ${selfCache.size}건 재사용`)
    } catch { /* skip */ }
  }

  // 기존 타 소스 데이터에서 좌표 캐시 구성
  const coordCache = buildCoordCache(regionKey)
  console.log(`  타 소스 좌표 캐시: ${coordCache.size}건`)

  const restaurants: Restaurant[] = []
  let fromCoordCache = 0
  let fromSelfCache = 0
  let geocodedCount = 0
  let failedCount = 0

  for (let i = 0; i < regionRows.length; i++) {
    const row = regionRows[i]
    const id = `safefood-${regionKey}-${row.certNo || i}`

    // 1) 자체 캐시 (이전 실행 결과)
    const selfCached = selfCache.get(id)
    if (selfCached?.lat && selfCached?.lng) {
      restaurants.push({
        ...selfCached,
        safeFoodGrade: row.grade,
        safeFoodCertNo: row.certNo,
        designatedDate: row.designatedDate,
      })
      fromSelfCache++
      continue
    }

    // 2) 기존 타 소스 좌표 재사용 (주소 매칭)
    const addrKey = addressKey(row.address)
    const nameKey = `name:${normalizeName(row.name)}`
    const cached = coordCache.get(addrKey) ?? coordCache.get(nameKey)
    if (cached) {
      restaurants.push({
        id,
        name: row.name,
        address: row.address,
        jibunAddress: '',
        phone: '',
        foodType: '',
        mainFood: '',
        designatedDate: row.designatedDate,
        lat: cached.lat,
        lng: cached.lng,
        region: regionName,
        source: 'safefood',
        safeFoodGrade: row.grade,
        safeFoodCertNo: row.certNo,
      })
      fromCoordCache++
      continue
    }

    // 3) Nominatim 지오코딩
    const coords = await geocode(row.address)
    if (coords) {
      restaurants.push({
        id,
        name: row.name,
        address: row.address,
        jibunAddress: '',
        phone: '',
        foodType: '',
        mainFood: '',
        designatedDate: row.designatedDate,
        lat: coords.lat,
        lng: coords.lng,
        region: regionName,
        source: 'safefood',
        safeFoodGrade: row.grade,
        safeFoodCertNo: row.certNo,
      })
      geocodedCount++
    } else {
      failedCount++
    }

    if ((i + 1) % 50 === 0 || i === regionRows.length - 1) {
      const pct = (((i + 1) / regionRows.length) * 100).toFixed(1)
      process.stdout.write(
        `\r  ${i + 1}/${regionRows.length} (${pct}%) | 캐시: ${fromCoordCache} | 자체캐시: ${fromSelfCache} | geocoded: ${geocodedCount} | 실패: ${failedCount}`
      )
    }

    // 200건마다 중간 저장
    if ((i + 1) % 200 === 0 && restaurants.length > 0) {
      writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
    }

    await new Promise((r) => setTimeout(r, 1200))
  }

  console.log('')
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
  console.log(`=== 완료: ${restaurants.length}건 저장 → safefood-${regionKey}.json ===`)
  console.log(`   캐시재사용: ${fromCoordCache}, 자체캐시: ${fromSelfCache}, geocoded: ${geocodedCount}, 실패: ${failedCount}`)
}

// CLI: npx tsx src/scripts/build-safefood-data.ts [region|all] [--file path/to/xlsx]
const args = process.argv.slice(2)
const fileArgIdx = args.indexOf('--file')
const xlsxPath = fileArgIdx !== -1
  ? args[fileArgIdx + 1]
  : join(process.cwd(), '★식품안심업소_지정현황(26.04.06기준).xlsx')
const regionArg = args.find(
  (a, i) => a !== '--file' && (fileArgIdx === -1 || i !== fileArgIdx + 1)
) ?? 'all'

async function main() {
  if (!existsSync(xlsxPath)) {
    console.error(`파일을 찾을 수 없습니다: ${xlsxPath}`)
    process.exit(1)
  }

  console.log(`XLSX 로드: ${xlsxPath}`)
  const allRows = readXlsx(xlsxPath)
  console.log(`전체 데이터: ${allRows.length}건`)

  const regions = regionArg === 'all' ? Object.keys(REGION_NAMES) : [regionArg]
  for (const region of regions) {
    await buildRegionData(region, allRows)
  }
}

main().catch(console.error)
