export const TOKEN_STORE_CHARGE_STATUSES = [
  '충전완료',
  '미충전',
  '취소회수',
  '주문이상',
  '미충전+토큰미적재',
] as const;

export type TokenStoreChargeStatus = (typeof TOKEN_STORE_CHARGE_STATUSES)[number];

export type TokenStorePurchaseRecord = {
  orderNo: string;
  orderedAt: string;
  completedAt: string | null;
  optionName: string;
  tokenAmount: number;
  amount: number;
  chargeStatus: TokenStoreChargeStatus;
  paymentMethod: string;
};

const TOKEN_STORE_PACKS = [
  { optionName: '토큰 100개', tokenAmount: 100, amount: 11000 },
  { optionName: '토큰 300개', tokenAmount: 300, amount: 33000 },
  { optionName: '토큰 500개', tokenAmount: 500, amount: 55000 },
  { optionName: '프리미엄 충전팩', tokenAmount: 1000, amount: 99000 },
] as const;

function shiftDateTime(source: string, daysAgo: number) {
  const [datePart, timePart = '12:00:00'] = source.split(' ');
  const date = new Date(`${datePart}T${timePart}`);
  date.setDate(date.getDate() - daysAgo);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export function getTokenStorePurchaseHistory(order: TokenStoreOrderItem): TokenStorePurchaseRecord[] {
  const current: TokenStorePurchaseRecord = {
    orderNo: order.orderNo,
    orderedAt: order.orderedAt,
    completedAt: order.completedAt,
    optionName: order.optionName,
    tokenAmount: order.tokenAmount,
    amount: order.amount,
    chargeStatus: order.chargeStatus,
    paymentMethod: '스마트스토어',
  };
  const total = order.purchaseCount <= 0 ? 1 : order.purchaseCount;
  if (total <= 1) return [current];

  const previous = Array.from({ length: total - 1 }, (_, index) => {
    const pack = TOKEN_STORE_PACKS[index % TOKEN_STORE_PACKS.length];
    const orderedAt = shiftDateTime(order.orderedAt, (index + 1) * 16);
    return {
      orderNo: String(Math.max(1, Number(order.orderNo) - (index + 1) * 13)),
      orderedAt,
      completedAt: orderedAt,
      optionName: pack.optionName,
      tokenAmount: pack.tokenAmount,
      amount: pack.amount,
      chargeStatus: '충전완료' as const,
      paymentMethod: '스마트스토어',
    };
  });

  return [current, ...previous];
}

export type TokenStoreOrderItem = {
  id: string;
  orderNo: string;
  orderId: string;
  orderedAt: string;
  collectedAt: string;
  buyerId: string;
  buyerPhone: string;
  purchaseCount: number;
  optionName: string;
  tokenAmount: number;
  amount: number;
  chargeStatus: TokenStoreChargeStatus;
  completedAt: string | null;
  chargeAccountName: string;
  chargeAccountId: string;
  chargeAccountPhone: string;
};

export const MOCK_TOKEN_STORE_ORDERS: TokenStoreOrderItem[] = [
  {
    id: 'ts-1',
    orderNo: '890412',
    orderId: '2026091510000001',
    orderedAt: '2026-09-15 10:22:18',
    collectedAt: '2026-09-15 10:24:02',
    buyerId: 'minjeong123',
    buyerPhone: '010-1111-2222',
    purchaseCount: 3,
    optionName: '토큰 300개',
    tokenAmount: 300,
    amount: 33000,
    chargeStatus: '충전완료',
    completedAt: '2026-09-15 10:31:44',
    chargeAccountName: '이민정',
    chargeAccountId: 'feelai_mj',
    chargeAccountPhone: '010-1111-2222',
  },
  {
    id: 'ts-2',
    orderNo: '890411',
    orderId: '2026091410000042',
    orderedAt: '2026-09-14 16:08:41',
    collectedAt: '2026-09-14 16:10:05',
    buyerId: 'kimcs',
    buyerPhone: '010-1234-5678',
    purchaseCount: 0,
    optionName: '토큰 100개',
    tokenAmount: 100,
    amount: 11000,
    chargeStatus: '미충전',
    completedAt: null,
    chargeAccountName: '김철수',
    chargeAccountId: 'feelai_cs',
    chargeAccountPhone: '010-1234-5678',
  },
  {
    id: 'ts-3',
    orderNo: '890410',
    orderId: '2026091310000088',
    orderedAt: '2026-09-13 09:41:12',
    collectedAt: '2026-09-13 09:43:30',
    buyerId: 'parkyh',
    buyerPhone: '010-9876-5432',
    purchaseCount: 6,
    optionName: '프리미엄 충전팩',
    tokenAmount: 1000,
    amount: 99000,
    chargeStatus: '충전완료',
    completedAt: '2026-09-13 09:50:18',
    chargeAccountName: '박영희',
    chargeAccountId: 'feelai_yh',
    chargeAccountPhone: '010-9876-5432',
  },
  {
    id: 'ts-4',
    orderNo: '890409',
    orderId: '2026091210000033',
    orderedAt: '2026-09-12 13:15:09',
    collectedAt: '2026-09-12 13:16:44',
    buyerId: 'leejw',
    buyerPhone: '010-2222-3333',
    purchaseCount: 1,
    optionName: '토큰 500개',
    tokenAmount: 500,
    amount: 55000,
    chargeStatus: '미충전+토큰미적재',
    completedAt: null,
    chargeAccountName: '이지원',
    chargeAccountId: 'feelai_jw',
    chargeAccountPhone: '010-2222-3333',
  },
  {
    id: 'ts-5',
    orderNo: '890408',
    orderId: '2026091110000071',
    orderedAt: '2026-09-11 18:02:55',
    collectedAt: '2026-09-11 18:04:21',
    buyerId: 'choi_ss',
    buyerPhone: '010-4444-5555',
    purchaseCount: 0,
    optionName: '토큰 100개',
    tokenAmount: 100,
    amount: 11000,
    chargeStatus: '취소회수',
    completedAt: null,
    chargeAccountName: '최수아',
    chargeAccountId: 'feelai_sa',
    chargeAccountPhone: '010-4444-5555',
  },
  {
    id: 'ts-6',
    orderNo: '890407',
    orderId: '2026091010000019',
    orderedAt: '2026-09-10 11:27:03',
    collectedAt: '2026-09-10 11:29:40',
    buyerId: 'junghoon',
    buyerPhone: '010-6666-7777',
    purchaseCount: 2,
    optionName: '이벤트 토큰팩',
    tokenAmount: 200,
    amount: 0,
    chargeStatus: '주문이상',
    completedAt: null,
    chargeAccountName: '정훈',
    chargeAccountId: 'feelai_jh',
    chargeAccountPhone: '010-6666-7777',
  },
  {
    id: 'ts-7',
    orderNo: '890406',
    orderId: '2026090910000055',
    orderedAt: '2026-09-09 08:50:22',
    collectedAt: '2026-09-09 08:51:16',
    buyerId: 'yuna88',
    buyerPhone: '010-8888-9999',
    purchaseCount: 4,
    optionName: '토큰 300개',
    tokenAmount: 300,
    amount: 33000,
    chargeStatus: '충전완료',
    completedAt: '2026-09-09 09:02:11',
    chargeAccountName: '김유나',
    chargeAccountId: 'feelai_yn',
    chargeAccountPhone: '010-8888-9999',
  },
  {
    id: 'ts-8',
    orderNo: '890405',
    orderId: '2026090810000027',
    orderedAt: '2026-09-08 20:14:37',
    collectedAt: '2026-09-08 20:16:02',
    buyerId: 'hanbyul',
    buyerPhone: '010-1010-2020',
    purchaseCount: 0,
    optionName: '스탠다드 충전',
    tokenAmount: 150,
    amount: 16500,
    chargeStatus: '미충전',
    completedAt: null,
    chargeAccountName: '한별',
    chargeAccountId: 'feelai_hb',
    chargeAccountPhone: '010-1010-2020',
  },
  {
    id: 'ts-9',
    orderNo: '890404',
    orderId: '2026090510000090',
    orderedAt: '2026-09-05 14:33:48',
    collectedAt: '2026-09-05 14:35:09',
    buyerId: 'soyeon12',
    buyerPhone: '010-3030-4040',
    purchaseCount: 5,
    optionName: '토큰 500개',
    tokenAmount: 500,
    amount: 55000,
    chargeStatus: '충전완료',
    completedAt: '2026-09-05 14:41:27',
    chargeAccountName: '박소연',
    chargeAccountId: 'feelai_sy',
    chargeAccountPhone: '010-3030-4040',
  },
  {
    id: 'ts-10',
    orderNo: '890403',
    orderId: '2026090110000064',
    orderedAt: '2026-09-01 12:09:15',
    collectedAt: '2026-09-01 12:11:33',
    buyerId: 'dohyun',
    buyerPhone: '010-5050-6060',
    purchaseCount: 1,
    optionName: '토큰 100개',
    tokenAmount: 100,
    amount: 11000,
    chargeStatus: '미충전+토큰미적재',
    completedAt: null,
    chargeAccountName: '이도현',
    chargeAccountId: 'feelai_dh',
    chargeAccountPhone: '010-5050-6060',
  },
  {
    id: 'ts-11',
    orderNo: '890402',
    orderId: '2026082510000012',
    orderedAt: '2026-08-25 17:44:29',
    collectedAt: '2026-08-25 17:46:01',
    buyerId: 'nari_k',
    buyerPhone: '010-7070-8080',
    purchaseCount: 2,
    optionName: '프리미엄 충전팩',
    tokenAmount: 1000,
    amount: 99000,
    chargeStatus: '취소회수',
    completedAt: null,
    chargeAccountName: '김나리',
    chargeAccountId: 'feelai_nr',
    chargeAccountPhone: '010-7070-8080',
  },
  {
    id: 'ts-12',
    orderNo: '890401',
    orderId: '2026081810000077',
    orderedAt: '2026-08-18 09:18:06',
    collectedAt: '2026-08-18 09:19:51',
    buyerId: 'shj321',
    buyerPhone: '010-5656-7373',
    purchaseCount: 0,
    optionName: '토큰 300개',
    tokenAmount: 300,
    amount: 33000,
    chargeStatus: '충전완료',
    completedAt: '2026-08-18 09:26:40',
    chargeAccountName: '서현진',
    chargeAccountId: 'feelai_hj',
    chargeAccountPhone: '010-5656-7373',
  },
];
