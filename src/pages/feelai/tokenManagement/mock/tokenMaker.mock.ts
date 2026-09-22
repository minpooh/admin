export const TOKEN_MAKER_PAYMENT_STATUSES = ['결제완료', '결제전', '실패', '취소'] as const;
export type TokenMakerPaymentStatus = (typeof TOKEN_MAKER_PAYMENT_STATUSES)[number];

export const TOKEN_MAKER_PAYMENT_METHODS = [
  '카드결제(NICE)',
  '카카오페이(포트원)',
  '실시간계좌이체(포트원)',
] as const;
export type TokenMakerPaymentMethod = (typeof TOKEN_MAKER_PAYMENT_METHODS)[number];

export const TOKEN_MAKER_CHARGE_GRADES = [
  'Lite (9,900원 / 300tk)',
  'Plus (29,000원 / 1,000tk)',
  'Pro (49,000원 / 1,800tk)',
  'Max (99,000원 / 4,000tk)',
] as const;
export type TokenMakerChargeGrade = (typeof TOKEN_MAKER_CHARGE_GRADES)[number];

export const TOKEN_MAKER_TOKEN_ACCRUAL_STATUSES = ['적립완료', '미적립', '적립취소'] as const;
export type TokenMakerTokenAccrualStatus = (typeof TOKEN_MAKER_TOKEN_ACCRUAL_STATUSES)[number];

export type TokenMakerMemoEntry = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type TokenMakerOrderItem = {
  id: string;
  orderNo: string;
  orderedAt: string;
  paidAt: string | null;
  customerName: string;
  customerId: string;
  customerPhone: string;
  tokenBalance: number;
  purchaseCount: number;
  chargeGrade: TokenMakerChargeGrade;
  chargeTokenAmount: number;
  productName: string;
  paymentStatus: TokenMakerPaymentStatus;
  paymentMethod: TokenMakerPaymentMethod;
  depositor: string;
  purchasePath: string;
  pgTransactionNo: string;
  amount: number;
  tokenAccrualStatus: TokenMakerTokenAccrualStatus;
  workId: string;
  memo: TokenMakerMemoEntry[];
};

export function getChargeGradeShortName(grade: TokenMakerChargeGrade) {
  return grade.split(' ')[0];
}

export type TokenMakerPurchaseRecord = {
  orderNo: string;
  orderedAt: string;
  paidAt: string | null;
  productName: string;
  chargeGrade: TokenMakerChargeGrade;
  chargeTokenAmount: number;
  paymentStatus: TokenMakerPaymentStatus;
  paymentMethod: TokenMakerPaymentMethod;
  amount: number;
};

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

function getChargeGradeMeta(grade: TokenMakerChargeGrade) {
  const amountMatch = grade.match(/([\d,]+)원/);
  const tokenMatch = grade.match(/([\d,]+)tk/);
  return {
    amount: amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : 0,
    token: tokenMatch ? Number(tokenMatch[1].replace(/,/g, '')) : 0,
  };
}

export function getTokenMakerPurchaseHistory(order: TokenMakerOrderItem): TokenMakerPurchaseRecord[] {
  const current: TokenMakerPurchaseRecord = {
    orderNo: order.orderNo,
    orderedAt: order.orderedAt,
    paidAt: order.paidAt,
    productName: `AI 토큰 ${getChargeGradeShortName(order.chargeGrade)} (${getChargeGradeShortName(order.chargeGrade).toLowerCase()})`,
    chargeGrade: order.chargeGrade,
    chargeTokenAmount: order.chargeTokenAmount,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    amount: order.amount,
  };
  const total = order.purchaseCount <= 0 ? 1 : order.purchaseCount;
  if (total <= 1) return [current];

  const previous = Array.from({ length: total - 1 }, (_, index) => {
    const grade = TOKEN_MAKER_CHARGE_GRADES[index % TOKEN_MAKER_CHARGE_GRADES.length];
    const meta = getChargeGradeMeta(grade);
    const shortName = getChargeGradeShortName(grade);
    const orderedAt = shiftDateTime(order.orderedAt, (index + 1) * 21);
    return {
      orderNo: String(Math.max(1, Number(order.orderNo) - (index + 1) * 17)),
      orderedAt,
      paidAt: orderedAt,
      productName: `AI 토큰 ${shortName} (${shortName.toLowerCase()})`,
      chargeGrade: grade,
      chargeTokenAmount: meta.token,
      paymentStatus: '결제완료' as const,
      paymentMethod: TOKEN_MAKER_PAYMENT_METHODS[index % TOKEN_MAKER_PAYMENT_METHODS.length],
      amount: meta.amount,
    };
  });

  return [current, ...previous];
}

export const MOCK_TOKEN_MAKER_ORDERS: TokenMakerOrderItem[] = [
  {
    id: 'tm-1',
    orderNo: '910284',
    orderedAt: '2026-09-15 11:08:22',
    paidAt: '2026-09-15 11:08:40',
    customerName: '이민정',
    customerId: 'feelai_mj',
    customerPhone: '010-1111-2222',
    tokenBalance: 1420,
    purchaseCount: 3,
    chargeGrade: 'Plus (29,000원 / 1,000tk)',
    chargeTokenAmount: 1000,
    productName: 'FeelAI Plus 충전',
    paymentStatus: '결제완료',
    paymentMethod: '카드결제(NICE)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'NICE2026091511084011',
    amount: 29000,
    tokenAccrualStatus: '적립완료',
    workId: '6f00dc2b',
    memo: [
      {
        id: 'tm-1-memo-1',
        author: '관리자',
        content: '플러스 충전 확인. 잔액 반영 완료.',
        createdAt: '2026-09-15 11:12:04',
      },
    ],
  },
  {
    id: 'tm-2',
    orderNo: '910283',
    orderedAt: '2026-09-14 16:41:09',
    paidAt: null,
    customerName: '김철수',
    customerId: 'feelai_cs',
    customerPhone: '010-1234-5678',
    tokenBalance: 80,
    purchaseCount: 0,
    chargeGrade: 'Lite (9,900원 / 300tk)',
    chargeTokenAmount: 300,
    productName: 'FeelAI Lite 충전',
    paymentStatus: '결제전',
    paymentMethod: '실시간계좌이체(포트원)',
    depositor: '김철수',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'PORT2026091416410902',
    amount: 9900,
    tokenAccrualStatus: '미적립',
    workId: 'a31c9e74',
    memo: [],
  },
  {
    id: 'tm-3',
    orderNo: '910282',
    orderedAt: '2026-09-13 09:22:51',
    paidAt: '2026-09-13 09:23:18',
    customerName: '박영희',
    customerId: 'feelai_yh',
    customerPhone: '010-9876-5432',
    tokenBalance: 5600,
    purchaseCount: 8,
    chargeGrade: 'Max (99,000원 / 4,000tk)',
    chargeTokenAmount: 4000,
    productName: 'FeelAI Max 충전',
    paymentStatus: '결제완료',
    paymentMethod: '카카오페이(포트원)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'KAKAO2026091309231803',
    amount: 99000,
    tokenAccrualStatus: '적립완료',
    workId: 'c8b12f0e',
    memo: [
      {
        id: 'tm-3-memo-1',
        author: '관리자',
        content: '맥스 패키지 대량 충전.',
        createdAt: '2026-09-13 09:30:11',
      },
      {
        id: 'tm-3-memo-2',
        author: '관리자',
        content: '고객 요청으로 작업아이디 재확인.',
        createdAt: '2026-09-13 10:02:44',
      },
    ],
  },
  {
    id: 'tm-4',
    orderNo: '910281',
    orderedAt: '2026-09-12 13:55:04',
    paidAt: null,
    customerName: '이지원',
    customerId: 'feelai_jw',
    customerPhone: '010-2222-3333',
    tokenBalance: 210,
    purchaseCount: 1,
    chargeGrade: 'Pro (49,000원 / 1,800tk)',
    chargeTokenAmount: 1800,
    productName: 'FeelAI Pro 충전',
    paymentStatus: '실패',
    paymentMethod: '카드결제(NICE)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'NICE2026091213550404',
    amount: 49000,
    tokenAccrualStatus: '미적립',
    workId: '4d77a91c',
    memo: [],
  },
  {
    id: 'tm-5',
    orderNo: '910280',
    orderedAt: '2026-09-11 18:16:33',
    paidAt: '2026-09-11 18:16:50',
    customerName: '최수아',
    customerId: 'feelai_sa',
    customerPhone: '010-4444-5555',
    tokenBalance: 0,
    purchaseCount: 0,
    chargeGrade: 'Lite (9,900원 / 300tk)',
    chargeTokenAmount: 300,
    productName: 'FeelAI Lite 충전',
    paymentStatus: '취소',
    paymentMethod: '카카오페이(포트원)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'KAKAO2026091118165005',
    amount: 9900,
    tokenAccrualStatus: '적립취소',
    workId: 'e2a06b5d',
    memo: [
      {
        id: 'tm-5-memo-1',
        author: '관리자',
        content: '고객 취소 요청으로 토큰 회수.',
        createdAt: '2026-09-11 18:40:12',
      },
    ],
  },
  {
    id: 'tm-6',
    orderNo: '910279',
    orderedAt: '2026-09-10 11:04:17',
    paidAt: '2026-09-10 11:04:39',
    customerName: '정훈',
    customerId: 'feelai_jh',
    customerPhone: '010-6666-7777',
    tokenBalance: 980,
    purchaseCount: 4,
    chargeGrade: 'Plus (29,000원 / 1,000tk)',
    chargeTokenAmount: 1000,
    productName: 'FeelAI Plus 충전',
    paymentStatus: '결제완료',
    paymentMethod: '실시간계좌이체(포트원)',
    depositor: '정훈',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'PORT2026091011043906',
    amount: 29000,
    tokenAccrualStatus: '적립완료',
    workId: '91f3c048',
    memo: [],
  },
  {
    id: 'tm-7',
    orderNo: '910278',
    orderedAt: '2026-09-09 08:47:28',
    paidAt: null,
    customerName: '김유나',
    customerId: 'feelai_yn',
    customerPhone: '010-8888-9999',
    tokenBalance: 340,
    purchaseCount: 0,
    chargeGrade: 'Lite (9,900원 / 300tk)',
    chargeTokenAmount: 300,
    productName: 'FeelAI Lite 충전',
    paymentStatus: '결제전',
    paymentMethod: '카드결제(NICE)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'NICE2026090908472807',
    amount: 9900,
    tokenAccrualStatus: '미적립',
    workId: 'b7e45a12',
    memo: [],
  },
  {
    id: 'tm-8',
    orderNo: '910277',
    orderedAt: '2026-09-08 20:21:06',
    paidAt: '2026-09-08 20:21:29',
    customerName: '한별',
    customerId: 'feelai_hb',
    customerPhone: '010-1010-2020',
    tokenBalance: 2210,
    purchaseCount: 2,
    chargeGrade: 'Pro (49,000원 / 1,800tk)',
    chargeTokenAmount: 1800,
    productName: 'FeelAI Pro 충전',
    paymentStatus: '결제완료',
    paymentMethod: '카카오페이(포트원)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'KAKAO2026090820212908',
    amount: 49000,
    tokenAccrualStatus: '적립완료',
    workId: '0c9d8f63',
    memo: [],
  },
  {
    id: 'tm-9',
    orderNo: '910276',
    orderedAt: '2026-09-05 14:11:42',
    paidAt: null,
    customerName: '박소연',
    customerId: 'feelai_sy',
    customerPhone: '010-3030-4040',
    tokenBalance: 150,
    purchaseCount: 0,
    chargeGrade: 'Max (99,000원 / 4,000tk)',
    chargeTokenAmount: 4000,
    productName: 'FeelAI Max 충전',
    paymentStatus: '실패',
    paymentMethod: '실시간계좌이체(포트원)',
    depositor: '박소연',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'PORT2026090514114209',
    amount: 99000,
    tokenAccrualStatus: '미적립',
    workId: '5a18e7d4',
    memo: [
      {
        id: 'tm-9-memo-1',
        author: '관리자',
        content: '계좌이체 실패. 재결제 안내 예정.',
        createdAt: '2026-09-05 14:20:33',
      },
    ],
  },
  {
    id: 'tm-10',
    orderNo: '910275',
    orderedAt: '2026-09-01 12:36:55',
    paidAt: '2026-09-01 12:37:14',
    customerName: '이도현',
    customerId: 'feelai_dh',
    customerPhone: '010-5050-6060',
    tokenBalance: 760,
    purchaseCount: 5,
    chargeGrade: 'Plus (29,000원 / 1,000tk)',
    chargeTokenAmount: 1000,
    productName: 'FeelAI Plus 충전',
    paymentStatus: '결제완료',
    paymentMethod: '카드결제(NICE)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'NICE2026090112371410',
    amount: 29000,
    tokenAccrualStatus: '적립완료',
    workId: 'd4b20c97',
    memo: [],
  },
  {
    id: 'tm-11',
    orderNo: '910274',
    orderedAt: '2026-08-25 17:02:11',
    paidAt: '2026-08-25 17:02:38',
    customerName: '김나리',
    customerId: 'feelai_nr',
    customerPhone: '010-7070-8080',
    tokenBalance: 4300,
    purchaseCount: 1,
    chargeGrade: 'Pro (49,000원 / 1,800tk)',
    chargeTokenAmount: 1800,
    productName: 'FeelAI Pro 충전',
    paymentStatus: '취소',
    paymentMethod: '카카오페이(포트원)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'KAKAO2026082517023811',
    amount: 49000,
    tokenAccrualStatus: '적립취소',
    workId: '3e6f1a80',
    memo: [],
  },
  {
    id: 'tm-12',
    orderNo: '910273',
    orderedAt: '2026-08-18 09:28:47',
    paidAt: '2026-08-18 09:29:05',
    customerName: '서현진',
    customerId: 'feelai_hj',
    customerPhone: '010-5656-7373',
    tokenBalance: 300,
    purchaseCount: 0,
    chargeGrade: 'Lite (9,900원 / 300tk)',
    chargeTokenAmount: 300,
    productName: 'FeelAI Lite 충전',
    paymentStatus: '결제완료',
    paymentMethod: '카드결제(NICE)',
    depositor: '',
    purchasePath: 'FeelAI 메이커',
    pgTransactionNo: 'NICE2026081809290512',
    amount: 9900,
    tokenAccrualStatus: '적립완료',
    workId: '8a2c5e19',
    memo: [],
  },
];
