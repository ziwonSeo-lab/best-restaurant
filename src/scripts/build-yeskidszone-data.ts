import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs'
import { join } from 'path'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require('playwright')

type PlaywrightPage = any

interface Restaurant {
  id: string; name: string; address: string; jibunAddress: string
  phone: string; foodType: string; mainFood: string; designatedDate: string
  lat: number; lng: number; region: string; source: string
  kidsZoneInfo?: string; strollerFriendly?: boolean
}

async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://api.vworld.kr/req/address?service=address&request=getcoord&version=2.0&crs=epsg:4326&refine=true&simple=false&format=json&type=ROAD&key=${apiKey}&address=${encodeURIComponent(address)}`
    const res = await fetch(url)
    const data = await res.json()
    if (data?.response?.status === 'OK' && data?.response?.result?.point) {
      const point = data.response.result.point
      return { lat: parseFloat(point.y), lng: parseFloat(point.x) }
    }
    const url2 = url.replace('type=ROAD', 'type=PARCEL')
    const res2 = await fetch(url2)
    const data2 = await res2.json()
    if (data2?.response?.status === 'OK' && data2?.response?.result?.point) {
      const point = data2.response.result.point
      return { lat: parseFloat(point.y), lng: parseFloat(point.x) }
    }
    return null
  } catch {
    return null
  }
}

const DATA_DIR = join(process.cwd(), 'public', 'data')
const TARGET_URL = 'https://yestravel.co.kr/location'

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

/** Raw data extracted from the page for a single location */
interface ScrapedLocation {
  name: string
  address: string
  phone: string
  description: string
  kidsZoneInfo: string
  foodType: string
  regionButton: string
}

/**
 * Match an address string to a region key.
 * Returns null if no region matches.
 */
function matchRegion(address: string): string | null {
  for (const [regionKey, patterns] of Object.entries(REGION_ADDRESS_MAP)) {
    if (patterns.some((p) => address.startsWith(p))) {
      return regionKey
    }
  }
  return null
}

/**
 * Infer region key from Korean region button label text.
 * Falls back to address-based matching.
 */
function inferRegionFromButton(buttonLabel: string): string | null {
  const labelMap: Record<string, string> = {
    '서울': 'seoul',
    '서울특별시': 'seoul',
    '부산': 'busan',
    '부산광역시': 'busan',
    '대구': 'daegu',
    '대구광역시': 'daegu',
    '인천': 'incheon',
    '인천광역시': 'incheon',
    '광주': 'gwangju',
    '광주광역시': 'gwangju',
    '대전': 'daejeon',
    '대전광역시': 'daejeon',
    '울산': 'ulsan',
    '울산광역시': 'ulsan',
    '세종': 'sejong',
    '세종특별자치시': 'sejong',
    '경기': 'gyeonggi',
    '경기도': 'gyeonggi',
    '강원': 'gangwon',
    '강원도': 'gangwon',
    '강원특별자치도': 'gangwon',
    '충북': 'chungbuk',
    '충청북도': 'chungbuk',
    '충남': 'chungnam',
    '충청남도': 'chungnam',
    '전북': 'jeonbuk',
    '전라북도': 'jeonbuk',
    '전북특별자치도': 'jeonbuk',
    '전남': 'jeonnam',
    '전라남도': 'jeonnam',
    '경북': 'gyeongbuk',
    '경상북도': 'gyeongbuk',
    '경남': 'gyeongnam',
    '경상남도': 'gyeongnam',
    '제주': 'jeju',
    '제주도': 'jeju',
    '제주특별자치도': 'jeju',
  }

  const trimmed = buttonLabel.trim()
  return labelMap[trimmed] || null
}

/**
 * Sleep for the given milliseconds. Used for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Scrape all locations from yestravel.co.kr/location using Playwright.
 * The site loads content dynamically when region buttons are clicked.
 */
async function scrapeLocations(): Promise<ScrapedLocation[]> {
  console.log('Playwright 브라우저 시작...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  })
  const page = await context.newPage()

  const allLocations: ScrapedLocation[] = []

  try {
    console.log(`페이지 로드: ${TARGET_URL}`)
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for the page to be interactive
    await page.waitForTimeout(2000)

    // Find region/area buttons - these trigger dynamic content loading
    // Common patterns: tabs, buttons, or links that filter by region
    const regionButtons = await page.$$('button, a, [role="tab"], .tab, .region-btn, .area-btn, .location-tab, [data-region], .filter-btn, .category-btn')

    if (regionButtons.length === 0) {
      console.log('지역 버튼을 찾을 수 없습니다. 페이지 전체 컨텐츠를 파싱합니다.')
      const locations = await extractLocationsFromPage(page, '전체')
      allLocations.push(...locations)
    } else {
      // Collect button texts first to identify which are region buttons
      const buttonInfos: { index: number; text: string }[] = []
      for (let i = 0; i < regionButtons.length; i++) {
        const text = (await regionButtons[i].textContent())?.trim() || ''
        const regionKey = inferRegionFromButton(text)
        if (regionKey) {
          buttonInfos.push({ index: i, text })
        }
      }

      if (buttonInfos.length === 0) {
        // No region-specific buttons found, try to extract all visible locations
        console.log('지역별 버튼이 감지되지 않았습니다. 전체 리스트를 수집합니다.')

        // Try clicking any visible tab/filter buttons to load all data
        const allButtons = await page.$$('button, a[href="#"], .tab-item, .nav-link, .filter-item')
        for (const btn of allButtons) {
          const text = (await btn.textContent())?.trim() || ''
          if (text && text.length < 20) {
            try {
              await btn.click()
              await page.waitForTimeout(1500)
              const locations = await extractLocationsFromPage(page, text)
              allLocations.push(...locations)
            } catch {
              // Button click failed, skip
            }
          }
        }

        // Also extract whatever is currently visible
        if (allLocations.length === 0) {
          const locations = await extractLocationsFromPage(page, '전체')
          allLocations.push(...locations)
        }
      } else {
        console.log(`${buttonInfos.length}개 지역 버튼 발견: ${buttonInfos.map((b) => b.text).join(', ')}`)

        for (const { index, text } of buttonInfos) {
          console.log(`\n지역 "${text}" 클릭...`)
          try {
            // Re-query buttons in case DOM changed
            const buttons = await page.$$('button, a, [role="tab"], .tab, .region-btn, .area-btn, .location-tab, [data-region], .filter-btn, .category-btn')
            if (index < buttons.length) {
              await buttons[index].click()
            } else {
              // Try finding by text
              await page.click(`text="${text}"`)
            }

            // Wait for dynamic content to load
            await page.waitForTimeout(2000)
            await page.waitForLoadState('networkidle').catch(() => {})

            // Scroll to load lazy content
            await autoScroll(page)

            const locations = await extractLocationsFromPage(page, text)
            console.log(`  "${text}": ${locations.length}건 수집`)
            allLocations.push(...locations)
          } catch (err) {
            console.error(`  "${text}" 클릭/파싱 실패:`, err)
          }
        }
      }
    }

    // If we still have nothing, try a broader extraction approach
    if (allLocations.length === 0) {
      console.log('\n대체 추출 전략 시도...')
      const locations = await extractLocationsBroadly(page)
      allLocations.push(...locations)
    }
  } finally {
    await browser.close()
    console.log('\n브라우저 종료')
  }

  // Deduplicate by name + address
  const seen = new Set<string>()
  const deduplicated = allLocations.filter((loc) => {
    const key = `${loc.name}|${loc.address}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  console.log(`\n총 수집: ${allLocations.length}건, 중복 제거 후: ${deduplicated.length}건`)
  return deduplicated
}

/**
 * Auto-scroll the page to trigger lazy-loaded content.
 */
async function autoScroll(page: PlaywrightPage): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0
      const distance = 400
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight
        window.scrollBy(0, distance)
        totalHeight += distance
        if (totalHeight >= scrollHeight) {
          clearInterval(timer)
          resolve()
        }
      }, 200)
      // Safety timeout
      setTimeout(() => {
        clearInterval(timer)
        resolve()
      }, 10000)
    })
  })
  await page.waitForTimeout(1000)
}

/**
 * Extract location data from the currently visible page content.
 * Tries multiple selector strategies for robustness.
 */
async function extractLocationsFromPage(
  page: PlaywrightPage,
  regionLabel: string
): Promise<ScrapedLocation[]> {
  return await page.evaluate((label: string) => {
    const locations: ScrapedLocation[] = []

    // Strategy 1: Look for card/list item patterns
    const cardSelectors = [
      '.location-item',
      '.store-item',
      '.shop-item',
      '.place-item',
      '.card',
      '.list-item',
      '.item',
      '[class*="location"]',
      '[class*="store"]',
      '[class*="shop"]',
      '[class*="place"]',
      '[class*="restaurant"]',
      'article',
      '.result-item',
    ]

    let cards: Element[] = []
    for (const selector of cardSelectors) {
      const found = Array.from(document.querySelectorAll(selector))
      if (found.length > 0 && found.length < 500) {
        cards = found
        break
      }
    }

    if (cards.length > 0) {
      for (const card of cards) {
        const nameEl =
          card.querySelector('h2, h3, h4, .name, .title, [class*="name"], [class*="title"], strong') as HTMLElement | null
        const addressEl =
          card.querySelector('.address, .addr, [class*="address"], [class*="addr"], .location') as HTMLElement | null
        const phoneEl =
          card.querySelector('.phone, .tel, [class*="phone"], [class*="tel"], a[href^="tel:"]') as HTMLElement | null
        const descEl =
          card.querySelector('.desc, .description, .info, [class*="desc"], [class*="info"], p') as HTMLElement | null

        const name = nameEl?.textContent?.trim() || ''
        const address = addressEl?.textContent?.trim() || ''

        if (name && name.length > 1) {
          locations.push({
            name,
            address,
            phone: phoneEl?.textContent?.trim().replace(/[^\d-]/g, '') || '',
            description: descEl?.textContent?.trim() || '',
            kidsZoneInfo: '',
            foodType: '',
            regionButton: label,
          })
        }
      }
    }

    // Strategy 2: Look for table rows
    if (locations.length === 0) {
      const rows = Array.from(document.querySelectorAll('table tbody tr, table tr'))
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td'))
        if (cells.length >= 2) {
          const name = cells[0]?.textContent?.trim() || cells[1]?.textContent?.trim() || ''
          const address = cells.find((c) => {
            const text = c.textContent || ''
            return text.includes('시') || text.includes('도') || text.includes('구') || text.includes('로')
          })?.textContent?.trim() || ''

          if (name && name.length > 1) {
            locations.push({
              name,
              address,
              phone: cells.find((c) => /\d{2,3}-\d{3,4}-\d{4}/.test(c.textContent || ''))?.textContent?.trim().replace(/[^\d-]/g, '') || '',
              description: '',
              kidsZoneInfo: '',
              foodType: '',
              regionButton: label,
            })
          }
        }
      }
    }

    // Strategy 3: Look for any repeating structure with names and addresses
    if (locations.length === 0) {
      const allElements = Array.from(document.querySelectorAll('*'))
      const namePattern = /[가-힣]{2,20}(점|식당|카페|베이커리|레스토랑|키친|하우스)/
      const addressPattern = /[가-힣]+(시|도|구|군)\s+[가-힣]+(구|군|읍|면)?\s*[가-힣]*(로|길|동)\s*\d*/

      for (const el of allElements) {
        const text = (el as HTMLElement).textContent?.trim() || ''
        if (text.length > 5 && text.length < 200) {
          const nameMatch = text.match(namePattern)
          const addrMatch = text.match(addressPattern)
          if (nameMatch && addrMatch) {
            locations.push({
              name: nameMatch[0],
              address: addrMatch[0],
              phone: '',
              description: text,
              kidsZoneInfo: '',
              foodType: '',
              regionButton: label,
            })
          }
        }
      }
    }

    return locations
  }, regionLabel)
}

/**
 * Broad extraction: get all text content and parse structured data.
 */
async function extractLocationsBroadly(
  page: PlaywrightPage
): Promise<ScrapedLocation[]> {
  return await page.evaluate(() => {
    const locations: ScrapedLocation[] = []
    const bodyText = document.body.innerText || ''

    // Try to find structured blocks with restaurant info
    const blocks = bodyText.split(/\n{2,}/)
    const addressPattern = /([가-힣]+(특별시|광역시|특별자치시|특별자치도|도))\s+[가-힣]+(시|구|군)/
    const phonePattern = /(\d{2,3}-\d{3,4}-\d{4})/

    for (const block of blocks) {
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) continue

      const addrLine = lines.find((l) => addressPattern.test(l))
      if (!addrLine) continue

      const nameLine = lines[0]
      const phoneLine = lines.find((l) => phonePattern.test(l))

      if (nameLine && nameLine.length > 1 && nameLine.length < 50) {
        locations.push({
          name: nameLine,
          address: addrLine,
          phone: phoneLine?.match(phonePattern)?.[1] || '',
          description: lines.slice(1).join(' '),
          kidsZoneInfo: '',
          foodType: '',
          regionButton: '전체',
        })
      }
    }

    return locations
  })
}

/**
 * Convert scraped data to the Restaurant interface with geocoding.
 */
async function processLocations(
  locations: ScrapedLocation[],
  apiKey: string
): Promise<Map<string, Restaurant[]>> {
  const regionMap = new Map<string, Restaurant[]>()

  // Load existing data for geocode cache
  const existingCache = new Map<string, { lat: number; lng: number }>()
  for (const regionKey of Object.keys(REGION_ADDRESS_MAP)) {
    const filePath = join(DATA_DIR, `yeskidszone-${regionKey}.json`)
    if (existsSync(filePath)) {
      try {
        const existing: Restaurant[] = JSON.parse(readFileSync(filePath, 'utf-8'))
        for (const r of existing) {
          if (r.lat && r.lng) {
            existingCache.set(`${r.name}|${r.address}`, { lat: r.lat, lng: r.lng })
          }
        }
      } catch {
        // ignore
      }
    }
  }
  if (existingCache.size > 0) {
    console.log(`기존 geocoding 캐시: ${existingCache.size}건 로드`)
  }

  let geocodedCount = 0
  let cachedCount = 0
  let failedCount = 0
  let skippedCount = 0

  console.log(`\nGeocoding 시작 (${locations.length}건)...`)

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i]
    const address = loc.address.trim()

    if (!address) {
      skippedCount++
      continue
    }

    // Determine region from address or button label
    let regionKey = matchRegion(address)
    if (!regionKey) {
      regionKey = inferRegionFromButton(loc.regionButton)
    }
    if (!regionKey) {
      skippedCount++
      continue
    }

    // Check geocode cache
    const cacheKey = `${loc.name}|${address}`
    const cached = existingCache.get(cacheKey)

    let lat: number
    let lng: number

    if (cached) {
      lat = cached.lat
      lng = cached.lng
      cachedCount++
    } else {
      const coords = await geocodeAddress(address, apiKey)
      if (coords) {
        lat = coords.lat
        lng = coords.lng
        geocodedCount++
      } else {
        failedCount++
        continue
      }

      // Rate limit for VWorld API
      await sleep(100)
    }

    const id = `yeskidszone-${regionKey}-${i}`

    const restaurant: Restaurant = {
      id,
      name: loc.name,
      address,
      jibunAddress: '',
      phone: loc.phone,
      foodType: loc.foodType,
      mainFood: '',
      designatedDate: '',
      lat,
      lng,
      region: regionKey,
      source: 'yeskidszone',
      kidsZoneInfo: loc.kidsZoneInfo || loc.description || '',
      strollerFriendly: undefined,
    }

    if (!regionMap.has(regionKey)) {
      regionMap.set(regionKey, [])
    }
    regionMap.get(regionKey)!.push(restaurant)

    // Progress
    if ((i + 1) % 20 === 0 || i === locations.length - 1) {
      const pct = (((i + 1) / locations.length) * 100).toFixed(1)
      process.stdout.write(
        `\r  ${i + 1}/${locations.length} (${pct}%) | geocoded: ${geocodedCount} | 캐시: ${cachedCount} | 실패: ${failedCount} | 스킵: ${skippedCount}`
      )
    }
  }

  console.log('')
  return regionMap
}

async function main() {
  const regionArg = process.argv[2] || 'all'

  const apiKey = process.env.VWORLD_API_KEY
  if (!apiKey) {
    console.error('VWORLD_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.')
    process.exit(1)
  }

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true })
  }

  // Step 1: Scrape locations
  const locations = await scrapeLocations()

  if (locations.length === 0) {
    console.error('수집된 데이터가 없습니다. 사이트 구조가 변경되었을 수 있습니다.')
    process.exit(1)
  }

  // Step 2: Geocode and group by region
  const regionMap = await processLocations(locations, apiKey)

  // Step 3: Save JSON files per region
  const targetRegions =
    regionArg === 'all'
      ? Object.keys(REGION_ADDRESS_MAP)
      : [regionArg]

  for (const regionKey of targetRegions) {
    const restaurants = regionMap.get(regionKey) || []
    if (restaurants.length === 0 && regionArg !== 'all') {
      console.log(`${regionKey}: 데이터 없음`)
      continue
    }
    const outputPath = join(DATA_DIR, `yeskidszone-${regionKey}.json`)
    writeFileSync(outputPath, JSON.stringify(restaurants), 'utf-8')
    console.log(`${regionKey}: ${restaurants.length}건 → ${outputPath}`)
  }

  // Summary
  console.log('\n=== 지역별 통계 ===')
  let total = 0
  for (const [key, restaurants] of Array.from(regionMap.entries())) {
    console.log(`  ${key}: ${restaurants.length}건`)
    total += restaurants.length
  }
  console.log(`  합계: ${total}건`)
}

main().catch((err) => {
  console.error('스크립트 실패:', err)
  process.exit(1)
})
