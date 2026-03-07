# 맛집 지도 (Best Restaurant Map)

전국 모범음식점 + 블루리본 + 빕구르망 맛집을 지도에서 한눈에 확인하는 웹앱

## 접속 주소

**https://ziwonseo-lab.github.io/best-restaurant/**

## 로컬 실행

```bash
# 패키지 설치
npm install

# 개발 서버 (http://localhost:3000)
npm run dev

# 프로덕션 빌드 (정적 export → out/ 디렉토리)
npm run build
```

## 데이터 빌드

데이터 JSON 파일은 이미 `public/data/`에 포함되어 있어 별도 빌드 없이 바로 실행 가능합니다.
데이터를 갱신하려면 아래 스크립트를 실행합니다.

```bash
# .env 파일에 VWORLD_API_KEY 설정 필요 (모범식당 지오코딩용)
# 발급: https://www.vworld.kr

# 모범식당 (지역별)
npm run build-data -- seoul
npm run build-data -- busan

# 블루리본 (전체 또는 지역별)
npm run build-blueribbon -- all

# 빕구르망
npm run build-bibgourmand
```

## 배포

GitHub Pages로 자동 배포됩니다.
- `main` 브랜치에 push → GitHub Actions → 정적 빌드 → Pages 배포
- 워크플로우: `.github/workflows/deploy.yml`

## 기술 스택

| 기술 | 용도 |
|------|------|
| Next.js 16 (App Router) | React 프레임워크, 정적 export |
| Leaflet + OpenStreetMap | 지도 렌더링 |
| Zustand | 클라이언트 상태 관리 |
| Tailwind CSS 4 | 스타일링 |
| GitHub Actions + Pages | CI/CD + 호스팅 |

## 주요 기능

- 지역별 맛집 지도 (17개 시도)
- 카테고리 필터: 모범식당 / 블루리본 / 빕구르망
- 음식 종류 상세 필터 (한식, 일식, 중식 등)
- 식당명/주소/음식 검색
- GPS 내 위치 + 반경 필터 (500m ~ 5km)
- 즐겨찾기 (브라우저 localStorage)
- 네이버지도 연동 (좌표 기반 검색)
- PWA 지원 (홈 화면 추가)
