# 기술 스택

## 핵심 기술

| 계층 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router, Static Export) | 16.1.6 |
| UI 라이브러리 | React | 19.2.3 |
| 스타일링 | Tailwind CSS | 4 |
| 상태 관리 | Zustand | 5.0.11 |
| 지도 | Leaflet + OpenStreetMap | 1.9.4 |
| 클러스터링 | leaflet.markercluster | 1.5.3 |
| 언어 | TypeScript | 5 |
| 린팅 | ESLint | 9 |

## 데이터 처리

| 라이브러리 | 용도 |
|-----------|------|
| xlsx | Excel 파일 파싱 (모범식당 데이터) |
| papaparse | CSV 파싱 |
| iconv-lite | 문자 인코딩 변환 (EUC-KR → UTF-8) |
| tsx | TypeScript 스크립트 실행 |

## 외부 API

| API | 용도 | 사용 시점 |
|-----|------|----------|
| VWorld (국토교통부) | 주소 → 위경도 지오코딩 | 빌드 타임 전용 |
| OpenStreetMap | 지도 타일 | 런타임 |
| 네이버 지도 | 상세 위치 외부 링크 | 런타임 |

## 빌드 및 배포

| 항목 | 설정 |
|------|------|
| 빌드 출력 | Static Export (`output: 'export'`) |
| 기본 경로 | `/best-restaurant` |
| CI/CD | GitHub Actions |
| 호스팅 | GitHub Pages |
| Node.js | 20 |
| 이미지 최적화 | 비활성화 (`unoptimized: true`) |

## 개발 환경

```bash
npm run dev          # 로컬 개발 서버
npm run build        # 정적 빌드 (./out/)
npm run build-data   # 모범식당 데이터 재빌드
npm run build-blueribbon  # 블루리본 데이터 재빌드
npm run build-bibgourmand # 빕 구르망 데이터 재빌드
```

## 아키텍처 패턴

- **Static Export**: 서버 없이 GitHub Pages에서 정적 호스팅
- **Client-Side Rendering**: 모든 필터링/상태 관리 클라이언트에서 처리
- **Region-Based Data Loading**: 지역별 JSON 파일 분리로 초기 로딩 최적화
- **Zustand Store**: 단일 중앙 상태 저장소로 필터, 위치, 데이터 관리
- **PWA**: 모바일 홈 화면 설치 지원

## 환경 변수

| 변수 | 용도 | 필수 여부 |
|------|------|----------|
| `VWORLD_API_KEY` | VWorld 지오코딩 API 키 | 빌드 스크립트 실행 시만 필요 |
| `NEXT_PUBLIC_BASE_PATH` | GitHub Pages 경로 | 빌드 시 자동 설정 |
