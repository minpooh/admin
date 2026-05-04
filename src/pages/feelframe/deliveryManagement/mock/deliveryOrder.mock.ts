/** 필프레임 · 배송관리 · 발주관리 목록 더미 데이터 */
export type FeelframeDeliveryOrderStatus = '발주전' | '발주완료';

export type FeelframeDeliveryOrderMemoEntry = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type FeelframeDeliveryOrderRow = {
  id: string;
  orderedAt: string;
  orderNo: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productInfo: string;
  quantity: number;
  shipping: string;
  paymentAmount: number;
  memo: FeelframeDeliveryOrderMemoEntry[];
  orderStatus: FeelframeDeliveryOrderStatus;
  /** 발주예상일 (미입력·발주전 등은 null — DB 미저장) */
  expectedOrderAt: string | null;
};

export const MOCK_FEELFRAME_DELIVERY_ORDER_LIST: FeelframeDeliveryOrderRow[] = [
  {
    id: 'fd-order-1',
    orderedAt: '2026-04-30 11:12:08',
    orderNo: '20260430-00071011',
    customerName: '민수정',
    customerEmail: 'minsujung91@email.com',
    customerPhone: '010-2234-8899',
    productInfo: '아크릴 액자 20x30 + 보정 1건',
    quantity: 2,
    shipping: 'CJ대한통운',
    paymentAmount: 189000,
    memo: [{ id: 'fd-order-1-memo-1', author: '관리자', content: '긴급', createdAt: '2026-04-30 11:14:21' }],
    orderStatus: '발주전',
    expectedOrderAt: null,
  },
  {
    id: 'fd-order-2',
    orderedAt: '2026-04-30 10:47:53',
    orderNo: '20260430-00071010',
    customerName: '유나',
    customerEmail: 'yuna.wed@example.com',
    customerPhone: '010-5123-9012',
    productInfo: '실버 프레임 액자 단품',
    quantity: 1,
    shipping: '한진택배',
    paymentAmount: 79000,
    memo: [],
    orderStatus: '발주완료',
    expectedOrderAt: '2026-04-30',
  },
  {
    id: 'fd-order-3',
    orderedAt: '2026-04-30 10:12:11',
    orderNo: '20260430-00071009',
    customerName: '이혜연',
    customerEmail: 'hyeyeon.lee@sample.co.kr',
    customerPhone: '010-9934-2210',
    productInfo: '포토테이블 세트 + 액자',
    quantity: 3,
    shipping: '롯데택배',
    paymentAmount: 252000,
    memo: [{ id: 'fd-order-3-memo-1', author: '관리자', content: '보정 대기', createdAt: '2026-04-30 10:15:19' }],
    orderStatus: '발주완료',
    expectedOrderAt: '2026-05-02',
  },
  {
    id: 'fd-order-4',
    orderedAt: '2026-04-29 18:05:27',
    orderNo: '20260429-00070998',
    customerName: '김소연',
    customerEmail: 'soyeon.k@example.com',
    customerPhone: '010-4412-7788',
    productInfo: '프리미엄 액자 + 보정 2건',
    quantity: 4,
    shipping: '우체국택배',
    paymentAmount: 312000,
    memo: [],
    orderStatus: '발주전',
    expectedOrderAt: null,
  },
  {
    id: 'fd-order-5',
    orderedAt: '2026-04-29 15:41:06',
    orderNo: '20260429-00070990',
    customerName: '정예린',
    customerEmail: 'jane.wedday@mail.com',
    customerPhone: '010-7721-9934',
    productInfo: '원목 액자 30x40 + 보정 1건',
    quantity: 1,
    shipping: '방문수령',
    paymentAmount: 109000,
    memo: [{ id: 'fd-order-5-memo-1', author: '관리자', content: '픽업예정', createdAt: '2026-04-29 15:45:08' }],
    orderStatus: '발주완료',
    expectedOrderAt: null,
  },
  {
    id: 'fd-order-6',
    orderedAt: '2026-04-28 13:08:44',
    orderNo: '20260428-00070961',
    customerName: '강하늘',
    customerEmail: 'dear.haneul@example.com',
    customerPhone: '010-2911-6007',
    productInfo: '프레임 액자 + 감사보드',
    quantity: 2,
    shipping: '경동택배',
    paymentAmount: 149000,
    memo: [],
    orderStatus: '발주완료',
    expectedOrderAt: '2026-05-03',
  },
];
