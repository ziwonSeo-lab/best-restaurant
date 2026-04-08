---
id: SPEC-UI-001
version: "1.0.0"
status: approved
created: 2026-03-09
updated: 2026-03-09
author: MoAI
priority: medium
---

## HISTORY

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-03-09 | 최초 작성 |

---

# SPEC-UI-001: 모범음식점 상호 변경 대응

## 1. 개요

모범음식점 지정일이 오래된 경우 상호가 바뀌었거나 폐업했을 가능성이 있다. 모범음식점 지정은 잘 취소되지 않아 데이터가 오래된 채 유지되는 문제를 해결하기 위해, 사용자에게 시각적 경고와 필터링 기능을 제공한다.

## 2. 요구사항 (EARS Format)

### 2.1 Ubiquitous Requirements

- REQ-U-001: 시스템은 모범식당의 `designatedDate` 필드를 사람이 읽기 쉬운 형식(YYYY년 M월)으로 표시해야 한다.

### 2.2 Event-Driven Requirements

- REQ-E-001: 사용자가 모범식당 카드를 볼 때, 지정일이 현재로부터 5년 이상 경과한 경우, "상호 변경 가능 - 최신 정보는 네이버지도에서 확인하세요" 경고 문구를 표시해야 한다.
- REQ-E-002: 사용자가 경고 문구의 네이버지도 링크를 클릭하면, 해당 식당명+주소로 네이버지도 검색 페이지를 새 탭에서 열어야 한다.

### 2.3 State-Driven Requirements

- REQ-S-001: "최근 지정" 필터가 활성화된 상태에서는, 지정일이 5년 이내인 모범식당만 표시해야 한다.
- REQ-S-002: "최근 지정" 필터는 소스 필터가 "모범식당"일 때만 표시되어야 한다.

### 2.4 Unwanted Behavior Requirements

- REQ-W-001: 블루리본 또는 빕 구르망 식당에는 지정일 경고 기능이 적용되지 않아야 한다.
- REQ-W-002: `designatedDate`가 빈 문자열이거나 파싱 불가능한 경우, 경고 문구를 표시하지 않고 "지정일 정보 없음"으로 표시해야 한다.

### 2.5 Optional Features

- REQ-O-001: 지정일 기준으로 식당 목록을 정렬하는 옵션(최근순/오래된순)을 제공할 수 있다.

## 3. 영향 범위

| 파일 | 변경 유형 |
|------|----------|
| `src/components/RestaurantCard.tsx` | 수정 - 경고 문구 추가, 날짜 포맷팅 |
| `src/hooks/use-filtered-restaurants.ts` | 수정 - 최근 지정 필터 로직 추가 |
| `src/components/FilterPanel.tsx` | 수정 - 최근 지정 필터 UI 추가 |
| `src/store/restaurant-store.ts` | 수정 - recentOnly 필터 상태 추가 |
| `src/lib/date-utils.ts` | 신규 - 날짜 파싱/비교 유틸리티 |

## 4. 제약사항

- 외부 라이브러리 추가 없이 네이티브 Date API 사용
- 정적 Export 호환성 유지 (SSR 불가)
- 모바일 반응형 레이아웃 유지
