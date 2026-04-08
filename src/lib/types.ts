export type RestaurantSource = 'model' | 'blueribbon' | 'bibgourmand' | 'yeskidszone' | 'goodprice'
export type RibbonType = 'RIBBON_ONE' | 'RIBBON_TWO' | 'RIBBON_THREE'

export interface Restaurant {
  id: string
  name: string
  address: string
  jibunAddress: string
  phone: string
  foodType: string
  mainFood: string
  designatedDate: string
  lat: number
  lng: number
  region: string
  source: RestaurantSource
  ribbonType?: RibbonType
  review?: string
  priceCategoryLabel?: string
  michelinDesc?: string
  michelinUrl?: string
  kidsZoneInfo?: string
  strollerFriendly?: boolean
  goodpriceMenus?: { name: string; price: string }[]
}

export interface RawRestaurantCSV {
  개방자치단체코드: string
  관리번호: string
  인허가번호: string
  영업상태명: string
  폐업일자: string
  데이터갱신구분: string
  업소명: string
  도로명주소: string
  소재지주소: string
  영업상태코드: string
  전화번호: string
  신청일자: string
  지정일자: string
  지정취소일자: string
  지정취소사유: string
  불가일자: string
  불가사유: string
  음식의유형: string
  주된음식종류: string
  재지정일자: string
  데이터갱신시점: string
  최종수정시점: string
}

export interface RegionInfo {
  code: string
  name: string
  center: { lat: number; lng: number }
}
