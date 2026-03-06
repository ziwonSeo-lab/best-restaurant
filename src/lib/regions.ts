import type { RegionInfo } from './types'

export const REGIONS: Record<string, RegionInfo> = {
  seoul: {
    code: '6110000_ALL',
    name: '서울특별시',
    center: { lat: 37.5665, lng: 126.978 },
  },
  busan: {
    code: '6260000_ALL',
    name: '부산광역시',
    center: { lat: 35.1796, lng: 129.0756 },
  },
  daegu: {
    code: '6270000_ALL',
    name: '대구광역시',
    center: { lat: 35.8714, lng: 128.6014 },
  },
  incheon: {
    code: '6280000_ALL',
    name: '인천광역시',
    center: { lat: 37.4563, lng: 126.7052 },
  },
  gwangju: {
    code: '6290000_ALL',
    name: '광주광역시',
    center: { lat: 35.1595, lng: 126.8526 },
  },
  daejeon: {
    code: '6300000_ALL',
    name: '대전광역시',
    center: { lat: 36.3504, lng: 127.3845 },
  },
  ulsan: {
    code: '6310000_ALL',
    name: '울산광역시',
    center: { lat: 35.5384, lng: 129.3114 },
  },
  sejong: {
    code: '5690000_ALL',
    name: '세종특별자치시',
    center: { lat: 36.48, lng: 127.2589 },
  },
  gyeonggi: {
    code: '6410000_ALL',
    name: '경기도',
    center: { lat: 37.4138, lng: 127.5183 },
  },
  gangwon: {
    code: '6530000_ALL',
    name: '강원특별자치도',
    center: { lat: 37.8228, lng: 128.1555 },
  },
  chungbuk: {
    code: '6430000_ALL',
    name: '충청북도',
    center: { lat: 36.6357, lng: 127.4912 },
  },
  chungnam: {
    code: '6440000_ALL',
    name: '충청남도',
    center: { lat: 36.5184, lng: 126.8 },
  },
  jeonbuk: {
    code: '6540000_ALL',
    name: '전북특별자치도',
    center: { lat: 35.7175, lng: 127.153 },
  },
  jeonnam: {
    code: '6460000_ALL',
    name: '전라남도',
    center: { lat: 34.8679, lng: 126.991 },
  },
  gyeongbuk: {
    code: '6470000_ALL',
    name: '경상북도',
    center: { lat: 36.4919, lng: 128.8889 },
  },
  gyeongnam: {
    code: '6480000_ALL',
    name: '경상남도',
    center: { lat: 35.4606, lng: 128.2132 },
  },
  jeju: {
    code: '6500000_ALL',
    name: '제주특별자치도',
    center: { lat: 33.4996, lng: 126.5312 },
  },
}

export const REGION_KEYS = Object.keys(REGIONS)
export const DEFAULT_REGION = 'seoul'
