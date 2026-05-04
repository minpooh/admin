import type { FeelframeDeliveryOrderMemoEntry } from './deliveryOrder.mock';

/** 필프레임 · 배송관리 · 배송 리스트 공통 더미 (택배/방문 구분) */
export type FeelframeDeliveryListChannel = 'courier' | 'pickup';

export type FeelframeDeliveryShippingStatus = '배송전' | '배송중';

export type FeelframePickupProductionStatus = '발주완료' | '입고완료' | '입고전';

export type FeelframePickupVisitStatus = '방문전' | '수령완료';

export type FeelframeDeliveryListRow = {
  id: string;
  channel: FeelframeDeliveryListChannel;
  memo: FeelframeDeliveryOrderMemoEntry[];
  paymentMethod: string;
  orderNo: string;
  unitNo: string;
  ordererName: string;
  ordererPhone: string;
  productName: string;
  optionLabel: string;
  /** 택배만 사용; 방문수령은 빈 문자열 */
  carrier: string;
  /** 택배만 사용; 방문수령은 null */
  shippingStatus: FeelframeDeliveryShippingStatus | null;
  postalCode: string;
  addressLine: string;
  recipientName: string;
  recipientPhone: string;
  deliveryMessage: string | null;
  /** 방문수령 행만 사용 */
  productionStatus?: FeelframePickupProductionStatus | null;
  orderPlacedAt?: string | null;
  stockInAt?: string | null;
  visitStatus?: FeelframePickupVisitStatus | null;
  visitSchedule?: string;
  pickupReceivedAt?: string | null;
};

export const MOCK_FEELFRAME_DELIVERY_LIST: FeelframeDeliveryListRow[] = [
  {
    id: 'dl-c-1',
    channel: 'courier',
    memo: [
      { id: 'dl-c-1-m1', author: '관리자', content: '출고 전 연락', createdAt: '2026-04-30 11:20:00' },
    ],
    paymentMethod: '카드결제',
    orderNo: '20260430-00071011',
    unitNo: 'U-10001',
    ordererName: '민수정',
    ordererPhone: '010-2234-8899',
    productName: '아크릴 액자 20x30',
    optionLabel: '보정 1건 / 무광',
    carrier: 'CJ대한통운',
    shippingStatus: '배송전',
    postalCode: '04524',
    addressLine: '서울특별시 중구 세종대로 110',
    recipientName: '민수정',
    recipientPhone: '010-2234-8899',
    deliveryMessage: null,
  },
  {
    id: 'dl-c-2',
    channel: 'courier',
    memo: [],
    paymentMethod: '무통장입금',
    orderNo: '20260430-00071010',
    unitNo: 'U-10002',
    ordererName: '유나',
    ordererPhone: '010-5123-9012',
    productName: '실버 프레임 액자 단품',
    optionLabel: '사이즈 S / 화이트',
    carrier: '우체국',
    shippingStatus: '배송중',
    postalCode: '13487',
    addressLine: '경기도 성남시 분당구 판교로 256',
    recipientName: '유나',
    recipientPhone: '010-5123-9012',
    deliveryMessage: '부재 시 경비실',
  },
  {
    id: 'dl-c-3',
    channel: 'courier',
    memo: [],
    paymentMethod: '카카오페이',
    orderNo: '20260429-00070998',
    unitNo: 'U-10003',
    ordererName: '김소연',
    ordererPhone: '010-4412-7788',
    productName: '포토테이블 세트 + 액자',
    optionLabel: '세트 A / 골드 액자',
    carrier: 'CJ대한통운',
    shippingStatus: '배송전',
    postalCode: '03142',
    addressLine: '서울특별시 종로구 인사동길 12',
    recipientName: '이수령',
    recipientPhone: '010-2000-3000',
    deliveryMessage: null,
  },
  {
    id: 'dl-p-1',
    channel: 'pickup',
    memo: [],
    paymentMethod: '실시간계좌이체',
    orderNo: '20260428-00070950',
    unitNo: 'U-20001',
    ordererName: '박지연',
    ordererPhone: '010-9000-1122',
    productName: 'LP 액자 패키지',
    optionLabel: '방문 수령',
    carrier: '',
    shippingStatus: null,
    postalCode: '',
    addressLine: '',
    recipientName: '박지연',
    recipientPhone: '010-9000-1122',
    deliveryMessage: null,
    productionStatus: '입고전',
    orderPlacedAt: null,
    stockInAt: null,
    visitStatus: '방문전',
    visitSchedule: '2026-05-10 (금) 14:00',
    pickupReceivedAt: null,
  },
  {
    id: 'dl-p-2',
    channel: 'pickup',
    memo: [{ id: 'dl-p-2-m1', author: '관리자', content: '토요일 방문', createdAt: '2026-04-27 15:00:00' }],
    paymentMethod: '무통장입금',
    orderNo: '20260427-00070940',
    unitNo: 'U-20002',
    ordererName: '최은혜',
    ordererPhone: '010-3344-5566',
    productName: '원목 액자',
    optionLabel: '면접 수령',
    carrier: '',
    shippingStatus: null,
    postalCode: '',
    addressLine: '',
    recipientName: '최은혜',
    recipientPhone: '010-3344-5566',
    deliveryMessage: null,
    productionStatus: '발주완료',
    orderPlacedAt: '2026-04-25',
    stockInAt: null,
    visitStatus: '방문전',
    visitSchedule: '2026-05-03 (토) 11:00',
    pickupReceivedAt: null,
  },
  {
    id: 'dl-p-3',
    channel: 'pickup',
    memo: [],
    paymentMethod: '카드결제',
    orderNo: '20260426-00070920',
    unitNo: 'U-20003',
    ordererName: '한도윤',
    ordererPhone: '010-7788-9900',
    productName: '메탈 프레임 세트',
    optionLabel: '대형 / 블랙',
    carrier: '',
    shippingStatus: null,
    postalCode: '',
    addressLine: '',
    recipientName: '한도윤',
    recipientPhone: '010-7788-9900',
    deliveryMessage: null,
    productionStatus: '입고완료',
    orderPlacedAt: '2026-04-18',
    stockInAt: '2026-04-22',
    visitStatus: '수령완료',
    visitSchedule: '2026-04-28 (월) 15:30',
    pickupReceivedAt: '2026-04-28 15:30:00',
  },
];
