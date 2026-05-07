/** 단일 뱃지: EVENT / NEW / BEST (최대 2개까지 `badges` 배열로 조합) */
export type FeelframeProductBadgeKind = 'event' | 'new' | 'best';

export type FeelframeProductListRow = {
  id: string;
  /** 뱃지 0~2개 (화면에서는 최대 2개만 표시) */
  badges: FeelframeProductBadgeKind[];
  /** DB 저장값: 진열여부 (T/F) */
  displayYn: 'T' | 'F';
  /** DB 저장값: 품절여부 (T/F) */
  soldOutYn: 'T' | 'F';
  /** 빈 문자열·공백만이면 목록에는 「해당없음」으로 표시 */
  supplier: string;
  productType: string;
  category: string;
  name: string;
  listPrice: number;
  salePrice: number;
  optionSummary: string;
  /** 배송 설정 라벨 (예: 무료배송, 착불) */
  deliveryLabel: string;
  /** 함께 구매 추천상품 ID 목록 */
  recommendedProductIds: string[];
  /** 상품 상세·목록 조회수 */
  viewCount: number;
  /** 판매 건수 */
  saleCount: number;
};

/** 공급사 미입력·공백일 때 목록·상세 표시 문구 */
export const FEELFRAME_PRODUCT_SUPPLIER_EMPTY_LABEL = '해당없음';

export function formatFeelframeProductSupplier(supplier: string): string {
  return supplier.trim() ? supplier.trim() : FEELFRAME_PRODUCT_SUPPLIER_EMPTY_LABEL;
}

export const MOCK_FEELFRAME_PRODUCT_LIST: FeelframeProductListRow[] = [
  {
    id: 'ff-prod-001',
    badges: ['new'],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '필프레임',
    productType: '액자',
    category: '웨딩',
    name: '메탈 프레임 12R',
    listPrice: 89000,
    salePrice: 79000,
    optionSummary: '색상 3 / 사이즈 2',
    deliveryLabel: '무료배송',
    recommendedProductIds: ['ff-prod-004', 'ff-prod-010'],
    viewCount: 3842,
    saleCount: 126,
  },
  {
    id: 'ff-prod-002',
    badges: ['best'],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '스튜디오A',
    productType: '액자',
    category: '돌잔치',
    name: '우드 프레임 클래식',
    listPrice: 120000,
    salePrice: 108000,
    optionSummary: '색상 2',
    deliveryLabel: '무료배송',
    recommendedProductIds: [],
    viewCount: 2156,
    saleCount: 88,
  },
  {
    id: 'ff-prod-003',
    badges: ['event'],
    displayYn: 'F',
    soldOutYn: 'T',
    supplier: '필프레임',
    productType: '액자',
    category: '가족',
    name: '미니 포토액자 세트',
    listPrice: 45000,
    salePrice: 35000,
    optionSummary: '구성 4',
    deliveryLabel: '착불',
    recommendedProductIds: ['ff-prod-012'],
    viewCount: 902,
    saleCount: 41,
  },
  {
    id: 'ff-prod-004',
    badges: ['event', 'new'],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '공급사B',
    productType: '인화',
    category: '웨딩',
    name: '대형 인화 패키지',
    listPrice: 28000,
    salePrice: 25000,
    optionSummary: '매트 유무',
    deliveryLabel: '무료배송',
    recommendedProductIds: ['ff-prod-001'],
    viewCount: 1673,
    saleCount: 203,
  },
  {
    id: 'ff-prod-005',
    badges: ['event', 'best'],
    displayYn: 'T',
    soldOutYn: 'T',
    supplier: '필프레임',
    productType: '액자',
    category: '이벤트',
    name: '한정판 골드 라인',
    listPrice: 150000,
    salePrice: 150000,
    optionSummary: '한 옵션',
    deliveryLabel: '무료배송',
    recommendedProductIds: ['ff-prod-003', 'ff-prod-007'],
    viewCount: 4521,
    saleCount: 312,
  },
  {
    id: 'ff-prod-006',
    badges: ['new'],
    displayYn: 'F',
    soldOutYn: 'F',
    supplier: '스튜디오A',
    productType: '패키지',
    category: '웨딩',
    name: '촬영+액자 패키지',
    listPrice: 450000,
    salePrice: 399000,
    optionSummary: '촬영일 / 액자타입',
    deliveryLabel: '착불',
    recommendedProductIds: ['ff-prod-001', 'ff-prod-008'],
    viewCount: 6230,
    saleCount: 54,
  },
  {
    id: 'ff-prod-007',
    badges: [],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '',
    productType: '액자',
    category: '베이비',
    name: '아크릴 탁상용',
    listPrice: 32000,
    salePrice: 29000,
    optionSummary: '',
    deliveryLabel: '무료배송',
    recommendedProductIds: [],
    viewCount: 445,
    saleCount: 19,
  },
  {
    id: 'ff-prod-008',
    badges: ['best'],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '필프레임',
    productType: '액자',
    category: '돌잔치',
    name: '원목 원형 액자',
    listPrice: 68000,
    salePrice: 62000,
    optionSummary: '각인 옵션',
    deliveryLabel: '무료배송',
    recommendedProductIds: [],
    viewCount: 2891,
    saleCount: 147,
  },
  {
    id: 'ff-prod-009',
    badges: [],
    displayYn: 'F',
    soldOutYn: 'F',
    supplier: '',
    productType: '인화',
    category: '가족',
    name: '4x6 인화 100매',
    listPrice: 18000,
    salePrice: 15000,
    optionSummary: '',
    deliveryLabel: '착불',
    recommendedProductIds: ['ff-prod-003'],
    viewCount: 118,
    saleCount: 6,
  },
  {
    id: 'ff-prod-010',
    badges: ['new', 'best'],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '필프레임',
    productType: '액자',
    category: '웨딩',
    name: '슬림 메탈 8R',
    listPrice: 72000,
    salePrice: 59000,
    optionSummary: '색상 4',
    deliveryLabel: '무료배송',
    recommendedProductIds: ['ff-prod-001', 'ff-prod-004', 'ff-prod-008'],
    viewCount: 5012,
    saleCount: 401,
  },
  {
    id: 'ff-prod-011',
    badges: [],
    displayYn: 'T',
    soldOutYn: 'F',
    supplier: '스튜디오A',
    productType: '액자',
    category: '웨딩',
    name: '캔버스 랩',
    listPrice: 95000,
    salePrice: 88000,
    optionSummary: '',
    deliveryLabel: '무료배송',
    recommendedProductIds: [],
    viewCount: 734,
    saleCount: 52,
  },
  {
    id: 'ff-prod-012',
    badges: ['event'],
    displayYn: 'T',
    soldOutYn: 'T',
    supplier: '공급사C',
    productType: '패키지',
    category: '이벤트',
    name: '기념품 세트 A',
    listPrice: 55000,
    salePrice: 55000,
    optionSummary: '수량 단계',
    deliveryLabel: '착불',
    recommendedProductIds: ['ff-prod-005'],
    viewCount: 1567,
    saleCount: 98,
  },
];
