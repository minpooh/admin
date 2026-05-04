import type { FeelframeDeliveryOrderMemoEntry } from './deliveryOrder.mock';

export type FeelframeLpDeliveryProgress = '배송전' | '배송중' | '수령완료';

/** LP 배송관리 목록 행 */
export type FeelframeDeliveryLpListRow = {
  id: string;
  memo: FeelframeDeliveryOrderMemoEntry[];
  orderedAt: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  productName: string;
  optionLabel: string;
  quantity: number;
  carrier: string;
  /** 없으면 배송전 등 미입력 */
  trackingNo: string | null;
  lpStatus: FeelframeLpDeliveryProgress;
  receiptConfirmed: boolean;
};

export const MOCK_FEELFRAME_LP_DELIVERY_LIST: FeelframeDeliveryLpListRow[] = [
  {
    id: 'lp-1',
    memo: [{ id: 'lp-1-m1', author: '관리자', content: '송장 등록 대기', createdAt: '2026-04-30 09:10:00' }],
    orderedAt: '2026-04-30 14:22:11',
    orderNo: '20260430-00081001',
    customerName: '민수정',
    customerPhone: '010-2234-8899',
    customerEmail: 'minsu@email.com',
    productName: 'LP 패키지 액자 세트',
    optionLabel: '대형 / 무광',
    quantity: 1,
    carrier: 'CJ대한통운',
    trackingNo: null,
    lpStatus: '배송전',
    receiptConfirmed: false,
  },
  {
    id: 'lp-2',
    memo: [],
    orderedAt: '2026-04-29 11:05:33',
    orderNo: '20260429-00080988',
    customerName: '유나',
    customerPhone: '010-5123-9012',
    customerEmail: 'yuna@email.com',
    productName: '실버 프레임 LP 전용',
    optionLabel: '사이즈 M',
    quantity: 2,
    carrier: '우체국',
    trackingNo: '11928374628374',
    lpStatus: '배송중',
    receiptConfirmed: false,
  },
  {
    id: 'lp-3',
    memo: [],
    orderedAt: '2026-04-28 16:40:00',
    orderNo: '20260428-00080950',
    customerName: '김소연',
    customerPhone: '010-4412-7788',
    customerEmail: 'soyeon@email.com',
    productName: '포토 LP 바인더',
    optionLabel: '내지 추가',
    quantity: 1,
    carrier: 'CJ대한통운',
    trackingNo: '33901122334455',
    lpStatus: '수령완료',
    receiptConfirmed: true,
  },
  {
    id: 'lp-4',
    memo: [{ id: 'lp-4-m1', author: '관리자', content: '고객 요청: 부재 시 문 앞', createdAt: '2026-04-27 10:00:00' }],
    orderedAt: '2026-04-27 09:15:22',
    orderNo: '20260427-00080890',
    customerName: '박지연',
    customerPhone: '010-9000-1122',
    customerEmail: 'parkjy@email.com',
    productName: 'LP 액자 패키지',
    optionLabel: '방문 수령 예약',
    quantity: 3,
    carrier: '한진택배',
    trackingNo: '55881200446677',
    lpStatus: '배송중',
    receiptConfirmed: false,
  },
];
