# SPEC-UI-001 구현 계획

## 작업 분해

### Task 1: 날짜 유틸리티 생성
- 파일: `src/lib/date-utils.ts` (신규)
- 내용:
  - `parseDesignatedDate(dateStr: string): Date | null` - YYYYMMDD 문자열을 Date로 변환
  - `formatDesignatedDate(dateStr: string): string` - "2024년 7월" 형식으로 포맷팅
  - `isOlderThanYears(dateStr: string, years: number): boolean` - 경과 연수 판단
- 의존성: 없음

### Task 2: RestaurantCard 경고 표시
- 파일: `src/components/RestaurantCard.tsx` (수정)
- 내용:
  - designatedDate 포맷팅 적용 (raw → 읽기 쉬운 형식)
  - 5년 이상 경과 시 경고 배너 표시
  - 경고 배너에 네이버지도 검색 링크 포함
  - designatedDate 없거나 파싱 불가 시 "지정일 정보 없음" 표시
- 의존성: Task 1
- Reference: 기존 RestaurantCard의 모범식당 뱃지 렌더링 패턴 활용

### Task 3: 상태 저장소에 필터 추가
- 파일: `src/store/restaurant-store.ts` (수정)
- 내용:
  - `recentOnly: boolean` 상태 추가
  - `toggleRecentOnly()` 액션 추가
- 의존성: 없음

### Task 4: 필터링 로직 추가
- 파일: `src/hooks/use-filtered-restaurants.ts` (수정)
- 내용:
  - recentOnly 필터 조건 추가 (5년 이내 지정 모범식당만 표시)
  - 기존 필터 체인에 삽입 (source 필터 이후)
- 의존성: Task 1, Task 3

### Task 5: FilterPanel UI 추가
- 파일: `src/components/FilterPanel.tsx` (수정)
- 내용:
  - 소스 필터가 "모범식당"일 때 "최근 지정" 토글 버튼 표시
  - 기존 필터 UI 스타일과 일관성 유지
- 의존성: Task 3

## 실행 순서

```
Task 1 (date-utils) → Task 2 (RestaurantCard)
                    → Task 3 (store) → Task 4 (filter hook)
                                     → Task 5 (FilterPanel)
```

## 기술 결정

| 항목 | 결정 | 근거 |
|------|------|------|
| 날짜 라이브러리 | 네이티브 Date API | 추가 의존성 불필요, 간단한 연산만 필요 |
| 경고 기준 | 5년 | docs/PLAN.md 명시 |
| 네이버지도 URL | `https://map.naver.com/p/search/{식당명} {주소}` | 기존 프로젝트의 네이버지도 연동 패턴 활용 |

## 리스크

| 리스크 | 영향 | 완화 |
|--------|------|------|
| designatedDate 빈값 | 경고 미표시 | null 체크로 안전하게 처리 |
| 날짜 파싱 실패 | 잘못된 경고 | 유효성 검증 후 fallback 처리 |
