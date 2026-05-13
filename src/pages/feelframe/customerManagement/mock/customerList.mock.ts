export type FeelframeCustomerSns = 'general' | 'kakao' | 'naver';

export type FeelframeCustomerRow = {
  id: string;
  /** 가입일 (YYYY-MM-DD HH:mm:ss) */
  joinDate: string;
  /** 예식일 (YYYY-MM-DD) */
  weddingDate: string;
  /** 가입 경로 */
  sns: FeelframeCustomerSns;
  /** 로그인 아이디 */
  loginId: string;
  /** 이름 */
  name: string;
  /** 전화번호 */
  phone: string;
  /** 이메일 */
  email: string;
  /** 포인트 잔액 */
  points: number;
  /** 누적 주문건수 */
  orderCount: number;
  /** 보유 쿠폰 수 */
  couponCount: number;
  /** 마케팅 동의 여부 */
  marketingConsent: 'agree' | 'disagree';
  /** 반려동물 여부 */
  hasPet: 'yes' | 'no';
  /** 첫 주문일자 (없으면 '-') */
  firstOrderDate: string;
};

export const SNS_LABELS: Record<FeelframeCustomerSns, string> = {
  general: '일반',
  kakao: '카카오',
  naver: '네이버',
};

export const MOCK_FEELFRAME_CUSTOMER_LIST: FeelframeCustomerRow[] = [
  {
    id: 'fc-001',
    joinDate: '2026-01-10 11:20:00',
    weddingDate: '2026-05-20',
    sns: 'general',
    loginId: 'hong01',
    name: '홍길동',
    phone: '010-1111-2222',
    email: 'hong01@example.com',
    points: 12000,
    orderCount: 3,
    couponCount: 2,
    marketingConsent: 'agree',
    hasPet: 'yes',
    firstOrderDate: '2026-01-15',
  },
  {
    id: 'fc-002',
    joinDate: '2026-02-03 09:15:22',
    weddingDate: '2026-09-07',
    sns: 'kakao',
    loginId: 'minji_k',
    name: '김민지',
    phone: '010-2345-6789',
    email: 'minji.k@example.com',
    points: 3500,
    orderCount: 1,
    couponCount: 1,
    marketingConsent: 'disagree',
    hasPet: 'no',
    firstOrderDate: '2026-02-10',
  },
  {
    id: 'fc-003',
    joinDate: '2025-12-01 16:40:00',
    weddingDate: '2026-04-12',
    sns: 'naver',
    loginId: 'sj_lee',
    name: '이서준',
    phone: '010-3456-7890',
    email: 'sj.lee@example.com',
    points: 0,
    orderCount: 0,
    couponCount: 0,
    marketingConsent: 'agree',
    hasPet: 'no',
    firstOrderDate: '-',
  },
  {
    id: 'fc-004',
    joinDate: '2026-03-18 14:05:00',
    weddingDate: '2026-10-04',
    sns: 'general',
    loginId: 'park_jh',
    name: '박지훈',
    phone: '010-4567-8901',
    email: 'park.jh@example.com',
    points: 8200,
    orderCount: 2,
    couponCount: 3,
    marketingConsent: 'agree',
    hasPet: 'yes',
    firstOrderDate: '2026-03-25',
  },
  {
    id: 'fc-005',
    joinDate: '2026-04-02 08:55:11',
    weddingDate: '2026-11-15',
    sns: 'kakao',
    loginId: 'yein_s',
    name: '신예인',
    phone: '010-5678-9012',
    email: 'yein.shin@example.com',
    points: 1500,
    orderCount: 0,
    couponCount: 1,
    marketingConsent: 'disagree',
    hasPet: 'no',
    firstOrderDate: '-',
  },
  {
    id: 'fc-006',
    joinDate: '2026-04-21 19:30:00',
    weddingDate: '2026-07-26',
    sns: 'naver',
    loginId: 'doyun_c',
    name: '최도윤',
    phone: '010-6789-0123',
    email: 'doyun.choi@example.com',
    points: 4400,
    orderCount: 4,
    couponCount: 2,
    marketingConsent: 'agree',
    hasPet: 'yes',
    firstOrderDate: '2026-04-28',
  },
];
