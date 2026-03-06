import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import XLSX from 'xlsx'
import { geocodeAddress } from '../lib/geocoder'
import type { Restaurant } from '../lib/types'

const DATA_DIR = join(process.cwd(), 'public', 'data')
const XLSX_URL =
  'https://www.localdata.go.kr/datafile/etc/LOCALDATA_ALL_12_03_01_E.xlsx'

// 지역별 주소 매칭 패턴
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

interface ExcelRow {
  번호: string
  관리번호: string
  업소명: string
  도로명주소: string
  소재지주소: string
  영업상태명: string
  지정일자: string
  음식의유형: string
  주된음식종류: string
  전화번호: string
  [key: string]: string
}

function matchRegion(address: string): string | null {
  for (const [regionKey, patterns] of Object.entries(REGION_ADDRESS_MAP)) {
    if (patterns.some((p) => address.startsWith(p))) {
      return regionKey
    }
  }
  return null
}

async function loadExcel(localPath?: string): Promise<ExcelRow[]> {
  if (localPath && existsSync(localPath)) {
    console.log(`로컬 엑셀 파일 로드: ${localPath}`)
    const workbook = XLSX.readFile(localPath)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<ExcelRow>(sheet)
    console.log(`로드 완료: ${data.length}건`)
    return data
  }

  console.log('엑셀 파일 다운로드 중...')

  const response = await fetch(XLSX_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Referer:
        'https://www.localdata.go.kr/lif/lifeMFoodMapDataView.do?menuNo=40002',
    },
  })

  if (!response.ok) {
    throw new Error(`엑셀 다운로드 실패: ${response.status}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  console.log(`다운로드 완료: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`)

  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json<ExcelRow>(sheet)
}

async function buildRegionData(
  regionKey: string,
  allData: ExcelRow[]
): Promise<void> {
  const regionName = REGION_NAMES[regionKey]
  if (!regionName) {
    console.error(`알 수 없는 지역: ${regionKey}`)
    return
  }

  const outputPath = join(DATA_DIR, `${regionKey}.json`)

  const apiKey = process.env.VWORLD_API_KEY
  if (!apiKey) {
    console.error('VWORLD_API_KEY가 설정되지 않았습니다.')
    process.exit(1)
  }

  console.log(`\n=== ${regionName} 데이터 빌드 시작 ===`)

  // 1. 영업중 + 해당 지역 필터링
  const regionData = allData.filter((row) => {
    if (row.영업상태명 !== '영업') return false
    const addr = (row.도로명주소 || row.소재지주소 || '').trim()
    return matchRegion(addr) === regionKey
  })

  console.log(`영업중 데이터: ${regionData.length}건`)

  // 2. 기존 데이터 로드 (이어서 geocoding)
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

  // 3. Geocoding
  console.log('Geocoding 시작...')
  const restaurants: Restaurant[] = []
  let geocodedCount = 0
  let cachedCount = 0
  let failedCount = 0

  for (let i = 0; i < regionData.length; i++) {
    const row = regionData[i]
    const id = (row.관리번호 || `${regionKey}-${i}`).trim()

    // 기존 좌표 재사용
    const existing = existingMap.get(id)
    if (existing?.lat && existing?.lng) {
      restaurants.push({
        ...existing,
        name: (row.업소명 || existing.name).trim(),
        address: (row.도로명주소 || existing.address).trim(),
        jibunAddress: (row.소재지주소 || existing.jibunAddress).trim(),
        phone: (row.전화번호 || existing.phone).trim(),
        foodType: (row.음식의유형 || existing.foodType).trim(),
        mainFood: (row.주된음식종류 || existing.mainFood).trim(),
        designatedDate: (row.지정일자 || existing.designatedDate).trim(),
        source: 'model',
      })
      cachedCount++
      continue
    }

    const address = (row.도로명주소 || row.소재지주소 || '').trim()
    if (!address) {
      failedCount++
      continue
    }

    const coords = await geocodeAddress(address, apiKey)

    if (coords) {
      restaurants.push({
        id,
        name: (row.업소명 || '').trim(),
        address: (row.도로명주소 || '').trim(),
        jibunAddress: (row.소재지주소 || '').trim(),
        phone: (row.전화번호 || '').trim(),
        foodType: (row.음식의유형 || '').trim(),
        mainFood: (row.주된음식종류 || '').trim(),
        designatedDate: (row.지정일자 || '').trim(),
        lat: coords.lat,
        lng: coords.lng,
        region: regionName,
        source: 'model',
      })
      geocodedCount++
    } else {
      failedCount++
    }

    // Progress
    if ((i + 1) % 50 === 0 || i === regionData.length - 1) {
      const pct = (((i + 1) / regionData.length) * 100).toFixed(1)
      process.stdout.write(
        `\r  ${i + 1}/${regionData.length} (${pct}%) | geocoded: ${geocodedCount} | 캐시: ${cachedCount} | 실패: ${failedCount}`
      )
    }

    // Rate limit 방지
    await new Promise((r) => setTimeout(r, 50))
  }

  console.log('')

  // 4. 저장
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')

  console.log(`=== 완료: ${restaurants.length}건 저장 → ${outputPath} ===`)
}

// CLI: node build-data.ts [region|all] [--file path/to/file.xlsx]
const args = process.argv.slice(2)
const fileArgIdx = args.indexOf('--file')
const localFilePath = fileArgIdx !== -1 ? args[fileArgIdx + 1] : undefined
const regionArg = args.find((a, i) => a !== '--file' && (fileArgIdx === -1 || i !== fileArgIdx + 1)) || 'seoul'

async function main() {
  const allData = await loadExcel(localFilePath)
  console.log(`전체 데이터: ${allData.length}건`)

  const regions =
    regionArg === 'all' ? Object.keys(REGION_NAMES) : [regionArg]

  for (const region of regions) {
    await buildRegionData(region, allData)
  }
}

main().catch(console.error)
