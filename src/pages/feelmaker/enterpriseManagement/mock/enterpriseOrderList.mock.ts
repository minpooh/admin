import { MOCK_ENTERPRISE_LIST } from './enterpriseList.mock';

export type EnterpriseOrderPaymentStatus = 'paid' | 'unpaid' | 'pending';

export type EnterpriseOrderRow = {
  id: string;
  /** 표시용 4자리 번호 */
  displayNo: string;
  /** YYYY-MM-DD HH:mm:ss */
  orderedAt: string;
  companyName: string;
  amount: number;
  depositorName: string;
  paymentMethod: string;  
  paymentStatus: EnterpriseOrderPaymentStatus;
  couponKind: string;
  couponCount: number;
};

const COUPON_KINDS = [
  '사진보정',
  '식전영상',
  '영상편지',
  '성장영상',
  '감사영상',
  '초대영상',
  '행사영상',
  '오프닝영상',
] as const;

const DEPOSITORS = [
  '김민수',
  '이영희',
  '박준호',
  '최서연',
  '정다은',
  '한지훈',
  '오수진',
  '윤태양',
  '강하늘',
  '임도현',
  '서유리',
  '조민재',
  '홍길동',
  '장미래',
  '배수아',
];

const PAYMENT_METHODS = [
  '무통장 입금',
  'PG결제',
  '카드결제',
  '계좌이체',
  '휴대폰결제',
  '계좌이체',
];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatOrderedAt(base: Date, offsetHours: number): string {
  const d = new Date(base.getTime() - offsetHours * 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function pickPaymentStatus(i: number): EnterpriseOrderPaymentStatus {
  if (i % 11 === 0) return 'unpaid';
  if (i % 9 === 0) return 'pending';
  return 'paid';
}

/** 엔터프라이즈 주문 목록 더미 (기업 목록 업체명 순환) */
export const MOCK_ENTERPRISE_ORDERS: EnterpriseOrderRow[] = (() => {
  const base = new Date();
  const n = 28;
  return Array.from({ length: n }, (_, i) => {
    const ent = MOCK_ENTERPRISE_LIST[i % MOCK_ENTERPRISE_LIST.length]!;
    const displayNum = ((i + 1) * 317 + 100) % 10000;
    const displayNo = String(displayNum).padStart(4, '0');
    const amount = 320_000 + ((i * 47_713) % 4_200_000);
    const couponKind = COUPON_KINDS[i % COUPON_KINDS.length]!;
    const couponCount = 1 + (i % 5);
    return {
      id: `ent-ord-${String(i + 1).padStart(3, '0')}`,
      displayNo,
      orderedAt: formatOrderedAt(base, i * 17 + (i % 5)),
      companyName: ent.companyName,
      amount,
      depositorName: DEPOSITORS[i % DEPOSITORS.length]!,
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length]!,
      paymentStatus: pickPaymentStatus(i),
      couponKind,
      couponCount,
    };
  });
})();
