# 프로젝트 구조

## 디렉토리 트리

```
best_restorent/
├── .github/workflows/         # CI/CD (GitHub Actions)
│   └── deploy.yml             # GitHub Pages 배포 워크플로우
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # 루트 레이아웃 (PWA, 타이틀, 스타일)
│   │   ├── page.tsx           # 메인 페이지 (지도 + 필터)
│   │   ├── globals.css        # 전역 스타일
│   │   └── favicon.ico
│   ├── components/            # React 컴포넌트 (7개)
│   │   ├── FilterPanel.tsx    # 카테고리/음식 종류 필터
│   │   ├── NaverMap.tsx       # Leaflet 지도 + 마커
│   │   ├── SearchBar.tsx      # 텍스트 검색
│   │   ├── RestaurantCard.tsx # 식당 상세 카드
│   │   ├── RegionSelector.tsx # 지역 선택 드롭다운
│   │   ├── RandomButton.tsx   # 랜덤 추천 버튼
│   │   └── MapOverlayCounts.tsx # 식당 수 오버레이
│   ├── hooks/
│   │   └── use-filtered-restaurants.ts  # 필터링 로직 훅
│   ├── lib/                   # 유틸리티 및 타입
│   │   ├── types.ts           # TypeScript 인터페이스
│   │   ├── regions.ts         # 17개 지역 데이터
│   │   ├── marker-icons.ts    # Leaflet 마커 아이콘
│   │   ├── geocoder.ts        # VWorld API 지오코딩
│   │   ├── geo-utils.ts       # 거리 계산
│   │   └── csv-parser.ts      # CSV 파싱
│   ├── store/                 # Zustand 상태 저장소
│   │   ├── restaurant-store.ts # 메인 앱 상태
│   │   ├── favorites-store.ts  # 즐겨찾기
│   │   └── history-store.ts    # 검색 히스토리
│   └── scripts/               # 데이터 빌드 스크립트
│       ├── build-data.ts      # 모범식당 데이터 빌드
│       ├── build-blueribbon-data.ts  # 블루리본 데이터 빌드
│       └── build-bibgourmand-data.ts # 빕 구르망 데이터 빌드
├── public/
│   ├── data/                  # 사전 빌드된 JSON 데이터
│   │   ├── seoul.json         # 지역별 모범식당 데이터
│   │   ├── blueribbon-*.json  # 블루리본 데이터
│   │   └── bibgourmand-*.json # 빕 구르망 데이터
│   ├── manifest.json          # PWA 매니페스트
│   └── icon-*.png             # PWA 아이콘
├── next.config.ts             # Next.js 설정 (Static Export)
├── tsconfig.json              # TypeScript 설정
├── package.json               # 패키지 의존성
└── eslint.config.mjs          # ESLint 설정
```

## 핵심 모듈 역할

| 모듈 | 역할 |
|------|------|
| `src/app/page.tsx` | 메인 엔트리, 전체 레이아웃 구성 |
| `src/store/restaurant-store.ts` | 중앙 상태 관리 (필터, 위치, 데이터) |
| `src/components/NaverMap.tsx` | Leaflet 지도 렌더링, 마커 클러스터링 |
| `src/components/FilterPanel.tsx` | 소스/음식 종류 필터 UI |
| `src/hooks/use-filtered-restaurants.ts` | 필터링 비즈니스 로직 |
| `src/scripts/build-data.ts` | 정부 데이터 → JSON 변환 파이프라인 |

## 데이터 파이프라인

```
원시 데이터 (Excel/웹) → build 스크립트 → VWorld 지오코딩 → public/data/*.json → 앱에서 소비
```
