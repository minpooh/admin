import { formatFeelframeProductSupplier } from './productList.mock';

export type FeelframePersonalPaymentRow = {
  id: string;
  /** 목록 공급사 표시 */
  supplier: string;
  /** 목록 카테고리 표시 */
  category: string;
  name: string;
  paymentAmount: number;
  deliveryLabel: string;
  manufacturer: string;
  manufacturerUnitPrice: string;
  photoUploadEnabled: boolean;
  categoryMain: string;
  categorySub: string;
  deliveryEnabled: boolean;
};

export { formatFeelframeProductSupplier };

export const MOCK_FEELFRAME_PERSONAL_PAYMENT_LIST: FeelframePersonalPaymentRow[] = [
  {
    id: 'ff-pp-001',
    supplier: '필프레임',
    category: '이벤트액자 · 생일',
    name: '메탈 프레임 12R 개인결제',
    paymentAmount: 79000,
    deliveryLabel: '배송',
    manufacturer: '아트데코',
    manufacturerUnitPrice: '액자 12R 19,000원',
    photoUploadEnabled: true,
    categoryMain: '이벤트액자',
    categorySub: '생일',
    deliveryEnabled: true,
  },
  {
    id: 'ff-pp-002',
    supplier: '스튜디오A',
    category: '우드액자 · 내추럴',
    name: '우드 프레임 클래식 개인결제',
    paymentAmount: 108000,
    deliveryLabel: '배송',
    manufacturer: '아트룩스',
    manufacturerUnitPrice: '액자 8R 14,000원',
    photoUploadEnabled: false,
    categoryMain: '우드액자',
    categorySub: '내추럴',
    deliveryEnabled: true,
  },
  {
    id: 'ff-pp-003',
    supplier: '필프레임',
    category: '아크릴액자 · 투명',
    name: '미니 포토액자 세트 개인결제',
    paymentAmount: 45000,
    deliveryLabel: '미배송',
    manufacturer: '해당없음',
    manufacturerUnitPrice: '캔버스 10x10 22,000원',
    photoUploadEnabled: true,
    categoryMain: '아크릴액자',
    categorySub: '투명',
    deliveryEnabled: false,
  },
  {
    id: 'ff-pp-004',
    supplier: '',
    category: '디자인액자 · 모던',
    name: '아크릴 프레임 8R 개인결제',
    paymentAmount: 52000,
    deliveryLabel: '배송',
    manufacturer: '아트데코',
    manufacturerUnitPrice: '액자 8R 14,000원',
    photoUploadEnabled: false,
    categoryMain: '디자인액자',
    categorySub: '모던',
    deliveryEnabled: true,
  },
  {
    id: 'ff-pp-005',
    supplier: '필프레임',
    category: '이벤트액자 · 기념일',
    name: '캔버스 액자 20R 개인결제',
    paymentAmount: 135000,
    deliveryLabel: '배송',
    manufacturer: '아트룩스',
    manufacturerUnitPrice: '패키지 기본 35,000원',
    photoUploadEnabled: true,
    categoryMain: '이벤트액자',
    categorySub: '기념일',
    deliveryEnabled: true,
  },
  {
    id: 'ff-pp-006',
    supplier: '스튜디오B',
    category: '원판액자 · LP원형',
    name: '원목 액자 프리미엄 개인결제',
    paymentAmount: 98000,
    deliveryLabel: '배송',
    manufacturer: '아트데코',
    manufacturerUnitPrice: '액자 12R 19,000원',
    photoUploadEnabled: false,
    categoryMain: '원판액자',
    categorySub: 'LP원형',
    deliveryEnabled: true,
  },
  {
    id: 'ff-pp-007',
    supplier: '필프레임',
    category: '포토테이블 · 3구 세트',
    name: '3컷 포토액자 개인결제',
    paymentAmount: 38000,
    deliveryLabel: '미배송',
    manufacturer: '해당없음',
    manufacturerUnitPrice: '캔버스 10x10 22,000원',
    photoUploadEnabled: true,
    categoryMain: '포토테이블',
    categorySub: '3구 세트',
    deliveryEnabled: false,
  },
  {
    id: 'ff-pp-008',
    supplier: '스튜디오A',
    category: '디자인액자 · 프리미엄',
    name: 'LED 액자 10R 개인결제',
    paymentAmount: 112000,
    deliveryLabel: '배송',
    manufacturer: '아트룩스',
    manufacturerUnitPrice: '패키지 기본 35,000원',
    photoUploadEnabled: false,
    categoryMain: '디자인액자',
    categorySub: '프리미엄',
    deliveryEnabled: true,
  },
];

export function formatPersonalPaymentCategory(main: string, sub: string): string {
  if (!sub || sub === '해당없음') return main;
  return `${main} · ${sub}`;
}
