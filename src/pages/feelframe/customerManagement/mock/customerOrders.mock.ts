export type FeelframeCustomerOrderStatus = '결제대기' | '결제완료' | '배송준비' | '배송중' | '배송완료' | '취소';

export type FeelframeCustomerOrderRow = {
  id: string;
  /** 주문 회원 id (FeelframeCustomerRow.id 와 매핑) */
  customerId: string;
  /** 주문번호 */
  orderNo: string;
  /** 주문일 (YYYY-MM-DD HH:mm:ss) */
  orderedAt: string;
  /** 주문 상품 정보 */
  productInfo: string;
  /** 결제금액 (원) */
  amount: number;
  /** 진행상황 */
  status: FeelframeCustomerOrderStatus;
  /** 주문수량 */
  orderQuantity: number;
};

export const MOCK_FEELFRAME_CUSTOMER_ORDERS: FeelframeCustomerOrderRow[] = [
  // fc-001 홍길동 (3건)
  {
    id: 'order-001',
    customerId: 'fc-001',
    orderNo: '20260115-0001',
    orderedAt: '2026-01-15 10:24:11',
    productInfo: '웨딩 액자 A4 / 우드',
    amount: 78000,
    status: '배송완료',
    orderQuantity: 1,
  },
  {
    id: 'order-002',
    customerId: 'fc-001',
    orderNo: '20260218-0014',
    orderedAt: '2026-02-18 14:02:03',
    productInfo: '캔버스 액자 30x40',
    amount: 52000,
    status: '배송완료',
    orderQuantity: 1,
  },
  {
    id: 'order-003',
    customerId: 'fc-001',
    orderNo: '20260405-0042',
    orderedAt: '2026-04-05 19:58:32',
    productInfo: '오리지널 보정 + LP 패키지',
    amount: 124000,
    status: '배송중',
    orderQuantity: 1,
  },
  // fc-002 김민지 (1건)
  {
    id: 'order-004',
    customerId: 'fc-002',
    orderNo: '20260210-0005',
    orderedAt: '2026-02-10 11:15:42',
    productInfo: '미니 액자 세트 (4P)',
    amount: 39000,
    status: '결제완료',
    orderQuantity: 1,
  },
  // fc-004 박지훈 (2건)
  {
    id: 'order-005',
    customerId: 'fc-004',
    orderNo: '20260325-0023',
    orderedAt: '2026-03-25 09:08:21',
    productInfo: '웨딩 액자 A3 / 블랙',
    amount: 95000,
    status: '배송완료',
    orderQuantity: 1,
  },
  {
    id: 'order-006',
    customerId: 'fc-004',
    orderNo: '20260420-0061',
    orderedAt: '2026-04-20 16:33:08',
    productInfo: '추가 보정 시안',
    amount: 18000,
    status: '배송준비',
    orderQuantity: 1,
  },
  // fc-006 최도윤 (4건)
  {
    id: 'order-007',
    customerId: 'fc-006',
    orderNo: '20260428-0008',
    orderedAt: '2026-04-28 13:11:00',
    productInfo: '웨딩 액자 50x70',
    amount: 132000,
    status: '배송완료',
    orderQuantity: 1,
  },
  {
    id: 'order-008',
    customerId: 'fc-006',
    orderNo: '20260430-0033',
    orderedAt: '2026-04-30 18:42:55',
    productInfo: 'LP 업로드 (CUSTOM)',
    amount: 56000,
    status: '배송완료',
    orderQuantity: 1,
  },
  {
    id: 'order-009',
    customerId: 'fc-006',
    orderNo: '20260506-0014',
    orderedAt: '2026-05-06 09:55:17',
    productInfo: '추가 인화 (10P)',
    amount: 21000,
    status: '결제완료',
    orderQuantity: 1,
  },
  {
    id: 'order-010',
    customerId: 'fc-006',
    orderNo: '20260510-0027',
    orderedAt: '2026-05-10 21:07:48',
    productInfo: '미니 캔버스 액자',
    amount: 28000,
    status: '결제대기',
    orderQuantity: 1,
  },
];
