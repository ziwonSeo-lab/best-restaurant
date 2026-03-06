# 맛집 지도 (Best Restaurant Map)

전국 모범식당 + 블루리본 맛집을 지도에서 한눈에 확인하는 웹 서비스

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 맛집 지도 (Best Restaurant Map) |
| 버전 | 0.1.0 |
| 목적 | 전국 모범음식점 + 블루리본 맛집 데이터를 지도 기반으로 통합 제공 |
| 대상 사용자 | 맛집을 찾는 일반 사용자 (모바일 우선) |
| 배포 형태 | 웹앱 (PWA 지원) |

---

## 2. 기술 스택

### 프론트엔드

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 16.1.6 | React 프레임워크 (App Router) |
| React | 19.2.3 | UI 라이브러리 |
| TypeScript | 5.x | 정적 타입 |
| Tailwind CSS | 4.x | 유틸리티 기반 스타일링 |
| Zustand | 5.0.11 | 클라이언트 상태 관리 |
| Leaflet | 1.9.4 | 지도 렌더링 (OpenStreetMap 타일) |
| leaflet.markercluster | 1.5.3 | 마커 클러스터링 (성능 최적화) |

### 데이터 빌드 (빌드 타임 전용)

| 기술 | 용도 |
|------|------|
| PapaParse | CSV 파싱 (모범식당 데이터) |
| xlsx | Excel 파싱 |
| iconv-lite | CP949 → UTF-8 인코딩 변환 |
| tsx | TypeScript 스크립트 실행 |

### 외부 API

| API | 용도 | 사용 시점 |
|-----|------|-----------|
| V-WORLD (국토교통부) | 주소 → 좌표 지오코딩 | 빌드 타임 |
| OpenStreetMap | 지도 타일 서빙 | 런타임 |
| bluer.co.kr API | 블루리본 식당 데이터 | 빌드 타임 |
| localdata.go.kr | 모범식당 CSV 원본 | 빌드 타임 |

### 데이터베이스

- **없음** — 정적 JSON 파일 기반 (빌드 타임 생성, `public/data/`)
- 런타임 DB 의존성 없이 순수 프론트엔드로 동작
- 데이터 갱신은 빌드 스크립트 재실행으로 수행

---

## 3. 아키텍처

### 전체 구조

```
[빌드 타임]                              [런타임]

localdata.go.kr ──→ build-data.ts ──┐
                                    ├──→ public/data/*.json ──→ 브라우저
bluer.co.kr ──────→ build-blueribbon│                           (fetch)
                    -data.ts ───────┘

V-WORLD API ──────→ 지오코딩 (빌드 중)    OpenStreetMap ──→ 지도 타일
```

### 데이터 흐름

```
1. 빌드 스크립트 → 외부 데이터 수집 + 지오코딩 → JSON 파일 생성
2. 브라우저 로드 → JSON fetch → Zustand store 저장
3. 사용자 필터/검색 → useFilteredRestaurants hook → 지도 마커 갱신
4. GPS 위치 → 반경 필터 → 거리순 정렬
```

### 상태 관리 (Zustand)

```
restaurant-store.ts
├── 데이터 상태
│   ├── allRestaurants: Restaurant[]     // 전체 식당 목록
│   ├── availableRegions: string[]       // 데이터가 있는 지역
│   ├── isLoading: boolean
│   └── error: string | null
├── 필터 상태
│   ├── region: string                   // 선택된 지역
│   ├── foodTypeFilter: string           // 음식 유형 필터
│   ├── sourceFilter: 'model' | 'blueribbon' | ''
│   └── searchQuery: string              // 검색어
├── 선택 상태
│   └── selectedRestaurant: Restaurant | null
├── GPS 상태
│   ├── userLocation: { lat, lng } | null
│   ├── isLocating: boolean
│   ├── locationError: string | null
│   └── radiusFilter: number | null      // 반경 (미터)
└── 액션
    ├── loadRestaurants(region)           // 데이터 로드
    ├── checkAvailableRegions()           // 사용 가능 지역 확인
    ├── requestLocation()                 // GPS 위치 요청
    └── set*(...)                         // 각 상태 세터
```

---

## 4. 프로젝트 구조

```
best_restorent/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                #   루트 레이아웃 (메타데이터, PWA)
│   │   ├── page.tsx                  #   메인 페이지 (오케스트레이션)
│   │   ├── globals.css               #   전역 스타일 (Tailwind + 커스텀)
│   │   ├── favicon.ico               #   파비콘
│   │   └── api/
│   │       ├── restaurants/route.ts  #   식당 데이터 API
│   │       └── geocode/route.ts      #   지오코딩 프록시 API
│   │
│   ├── components/                   # UI 컴포넌트
│   │   ├── NaverMap.tsx              #   Leaflet 지도 (마커, 클러스터, GPS)
│   │   ├── FilterPanel.tsx           #   소스/음식유형 필터
│   │   ├── SearchBar.tsx             #   디바운스 검색바
│   │   ├── RegionSelector.tsx        #   지역 선택 드롭다운
│   │   ├── NearbyFilter.tsx          #   GPS 반경 필터 (500m~5km)
│   │   └── RestaurantCard.tsx        #   식당 상세 하단 시트
│   │
│   ├── store/                        # 상태 관리
│   │   └── restaurant-store.ts       #   Zustand 스토어
│   │
│   ├── hooks/                        # 커스텀 훅
│   │   └── use-filtered-restaurants.ts  # 필터링 + 거리 정렬
│   │
│   ├── lib/                          # 유틸리티
│   │   ├── types.ts                  #   타입 정의
│   │   ├── regions.ts                #   17개 지역 설정
│   │   ├── geo-utils.ts              #   Haversine 거리 계산
│   │   ├── csv-parser.ts             #   CSV 파싱 (빌드 타임)
│   │   └── geocoder.ts               #   V-WORLD 지오코딩 (빌드 타임)
│   │
│   └── scripts/                      # 데이터 빌드 스크립트
│       ├── build-data.ts             #   모범식당 데이터 빌드
│       └── build-blueribbon-data.ts  #   블루리본 데이터 빌드
│
├── public/
│   ├── data/                         # 정적 JSON 데이터
│   │   ├── seoul.json                #   모범식당 (지역별)
│   │   ├── blueribbon-seoul.json     #   블루리본 (지역별)
│   │   └── ... (17개 지역)
│   ├── manifest.json                 # PWA 매니페스트
│   ├── icon-192.png                  # PWA 아이콘
│   └── icon-512.png                  # PWA 아이콘
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env                              # VWORLD_API_KEY
└── docs/
    └── PROJECT.md                    # 이 문서
```

---

## 5. 데이터 모델

### Restaurant (핵심 타입)

```typescript
type RestaurantSource = 'model' | 'blueribbon'
type RibbonType = 'RIBBON_ONE' | 'RIBBON_TWO' | 'RIBBON_THREE'

interface Restaurant {
  id: string              // 고유 ID (예: "blueribbon-12345")
  name: string            // 식당명
  address: string         // 도로명 주소
  jibunAddress: string    // 지번 주소
  phone: string           // 전화번호
  foodType: string        // 음식 유형 (한식, 일식 등)
  mainFood: string        // 주된 음식 종류
  designatedDate: string  // 모범식당 지정일
  lat: number             // 위도
  lng: number             // 경도
  region: string          // 지역명
  source: RestaurantSource  // 데이터 출처
  ribbonType?: RibbonType   // 블루리본 등급 (1~3)
  review?: string           // 블루리본 리뷰 코멘트
}
```

### 지역 설정 (17개 지역)

| 키 | 지역명 | 중심 좌표 |
|----|--------|-----------|
| seoul | 서울특별시 | 37.5665, 126.978 |
| busan | 부산광역시 | 35.1796, 129.0756 |
| daegu | 대구광역시 | 35.8714, 128.6014 |
| incheon | 인천광역시 | 37.4563, 126.7052 |
| gwangju | 광주광역시 | 35.1595, 126.8526 |
| daejeon | 대전광역시 | 36.3504, 127.3845 |
| ulsan | 울산광역시 | 35.5384, 129.3114 |
| sejong | 세종특별자치시 | 36.48, 127.2589 |
| gyeonggi | 경기도 | 37.4138, 127.5183 |
| gangwon | 강원특별자치도 | 37.8228, 128.1555 |
| chungbuk | 충청북도 | 36.6357, 127.4912 |
| chungnam | 충청남도 | 36.5184, 126.8 |
| jeonbuk | 전북특별자치도 | 35.7175, 127.153 |
| jeonnam | 전라남도 | 34.8679, 126.991 |
| gyeongbuk | 경상북도 | 36.4919, 128.8889 |
| gyeongnam | 경상남도 | 35.4606, 128.2132 |
| jeju | 제주특별자치도 | 33.4996, 126.5312 |

---

## 6. 데이터 소스별 상세

### 모범식당 (source: 'model')

- **출처**: localdata.go.kr 공공데이터
- **형식**: CSV (CP949 인코딩)
- **수집 방법**: `npm run build-data -- {region}`
- **지오코딩**: V-WORLD API로 주소 → 좌표 변환
- **마커 색상**: 초록색 (#2ecc71)
- **특이사항**: 영업중인 식당만 필터링, 지정일 정보 포함

### 블루리본 (source: 'blueribbon')

- **출처**: bluer.co.kr API
- **형식**: REST API (Spring HATEOAS)
- **수집 방법**: `npm run build-blueribbon -- {region|all}`
- **인증**: JSESSIONID + X-CSRF-TOKEN 자동 획득
- **API 엔드포인트**: `GET /api/v1/restaurants?ribbonType={type}&page={n}&size=100`
- **리본 등급**: RIBBON_ONE (1개), RIBBON_TWO (2개), RIBBON_THREE (3개)
- **마커 색상**: 파란색 (#3498db)
- **특이사항**: 폐업 식당 제외, 리뷰 코멘트 포함
- **전국 데이터**: 총 2,629건 (2026.03 기준)

---

## 7. 주요 기능

### 7-1. 지도 뷰

- OpenStreetMap 타일 기반 Leaflet 지도
- 마커 클러스터링 (60px 반경, 줌 17에서 클러스터 해제)
- 소스별 마커 색상 구분 (초록 = 모범, 파랑 = 블루리본)
- 마커 클릭 시 팝업 (식당 정보 + 네이버지도 링크 + 전화)
- 줌 컨트롤 (우측 상단)

### 7-2. 검색 & 필터

- **검색**: 식당명, 주소, 음식 종류로 300ms 디바운스 검색
- **소스 필터**: 전체 / 모범식당 / 블루리본 (카운트 표시)
- **음식유형 필터**: 선택된 소스 기준 동적 생성 (빈도순 정렬)
- **지역 선택**: 17개 지역 드롭다운 (데이터 없는 지역 비활성화)

### 7-3. GPS 내 주변

- 브라우저 Geolocation API로 현재 위치 획득
- 반경 선택: 500m / 1km / 3km / 5km
- Haversine 공식으로 거리 계산
- 반경 내 식당만 표시 + 거리순 정렬
- 지도에 현재 위치 마커 표시 (파란 점 + pulse 애니메이션)

### 7-4. 식당 상세 (하단 시트)

- 마커 클릭 시 하단에서 슬라이드업 애니메이션
- 소스 뱃지 + 리본 이모지 (블루리본)
- 주소, 전화번호 (터치로 전화 가능)
- 모범식당: 지정일 표시 / 블루리본: 리뷰 코멘트 표시
- 외부 링크: 네이버지도 (좌표 기반 검색), 카카오맵

### 7-5. PWA

- manifest.json 으로 홈 화면 추가 지원
- standalone 모드 (브라우저 UI 숨김)
- Safe area 지원 (노치 대응)

---

## 8. 빌드 & 실행

### 개발 환경 설정

```bash
# 1. 패키지 설치
npm install

# 2. 환경변수 설정 (.env)
VWORLD_API_KEY=your_api_key_here

# 3. 데이터 빌드 (최초 1회)
npm run build-blueribbon -- all    # 블루리본 전체 지역
npm run build-data -- seoul        # 모범식당 (지역별)

# 4. 개발 서버
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### 데이터 갱신

```bash
# 블루리본: 전체 지역 재빌드
npm run build-blueribbon -- all

# 모범식당: 특정 지역 재빌드
npm run build-data -- seoul
npm run build-data -- busan
```

---

## 9. 환경 변수

| 변수 | 필수 | 용도 | 사용 시점 |
|------|------|------|-----------|
| `VWORLD_API_KEY` | 빌드 시 | V-WORLD 지오코딩 API 키 | build-data 스크립트 |

> API 키 발급: https://www.vworld.kr/dev/v4dv_2ddevelop.do

---

## 10. 향후 고도화 계획

| Phase | 내용 | 상태 |
|-------|------|------|
| 1-1 | Zustand 상태관리 리팩토링 | ✅ 완료 |
| 1-2 | 즐겨찾기 + 최근 본 식당 | 미착수 |
| 1-3 | GPS 기반 주변 맛집 | ✅ 완료 |
| 1-4 | 리스트 뷰 (지도/목록 토글) | 미착수 |
| 1-5 | 데스크톱 레이아웃 | 미착수 |
| 2-1 | 빌드 스크립트 공통화 (어댑터 패턴) | 미착수 |
| 2-2 | 데이터 소스 레지스트리 | 미착수 |
| 2-3 | 네이버/카카오 평점 보강 | 미착수 |
| 3-1 | SEO 동적 라우팅 | 미착수 |
| 3-2 | API Route + React Query | 미착수 |
| 3-3 | 에러 바운더리 + 접근성 | 미착수 |
| 3-4 | PWA 오프라인 지원 | 미착수 |
| 3-5 | 성능 최적화 | 미착수 |
| 4-1 | 식당 공유 (딥링크) | 미착수 |
| 4-2 | 사용자 리뷰/평점 (Supabase) | 미착수 |
| 4-3 | 맛집 코스 추천 | 미착수 |
| 5-1 | GitHub Actions CI/CD | 미착수 |

> 상세 계획: `.claude/plans/melodic-percolating-horizon.md`
