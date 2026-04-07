/** 파트너 변경 모달 옵션 — `OrderVideoPage`의 `PARTNER_CHANNELS`와 동일 */
export const PARTNER_CHANNELS = [
  'feelmaker',
  'feelmotioncard',
  'baruncompany',
  'barunsonmall',
  'bhandscard',
  'deardeer',
  'premierpaper',
  'thecard',
  'hallchuu',
  'bom',
  'NAVER_STORE',
] as const;

export type CustomerMember = {
  id: string;
  /** 가입일 (주문일 컬럼과 동일하게 한 줄 표시) */
  joinDate: string;
  /** 예식일 (최초제작일 컬럼과 동일하게 한 줄 표시) */
  weddingDate: string;
  purchaseChannel: string;
  partner: string;
  name: string;
  loginId: string;
  email: string;
  orderCount: number;
  draftCount: number;
  phone: string;
  reserve: string;
  feelPoint: string;
  marketingConsent: 'agree' | 'disagree';
  /** 가입 경로(상단 요약 카드 집계용) */
  signupChannel: 'general' | 'kakao' | 'naver';
};

export const MOCK_CUSTOMER_MEMBERS: CustomerMember[] = [
  {
    id: '1',
    joinDate: '2026-01-10 11:20:00',
    weddingDate: '2026-05-20 12:00:00',
    purchaseChannel: '필메이커',
    partner: 'feelmaker',
    name: '홍길동',
    loginId: 'hong01',
    email: 'hong01@example.com',
    orderCount: 3,
    draftCount: 1,
    phone: '010-1111-2222',
    reserve: '12,000',
    feelPoint: '450',
    marketingConsent: 'agree',
    signupChannel: 'general',
  },
  {
    id: '2',
    joinDate: '2026-02-03 09:15:22',
    weddingDate: '2026-09-07 18:00:00',
    purchaseChannel: '스토어팜',
    partner: 'feelmotioncard',
    name: '김민지',
    loginId: 'minji_k',
    email: 'minji.k@example.com',
    orderCount: 0,
    draftCount: 0,
    phone: '010-2345-6789',
    reserve: '0',
    feelPoint: '120',
    marketingConsent: 'disagree',
    signupChannel: 'kakao',
  },
  {
    id: '3',
    joinDate: '2025-12-01 16:40:00',
    weddingDate: '2026-04-12 11:30:00',
    purchaseChannel: '필메이커',
    partner: 'thecard',
    name: '이서준',
    email: 'sj.lee@example.com',
    loginId: 'sjlee88',
    orderCount: 12,
    draftCount: 4,
    phone: '010-9998-7766',
    reserve: '58,500',
    feelPoint: '2,100',
    marketingConsent: 'agree',
    signupChannel: 'naver',
  },
  {
    id: '4',
    joinDate: '2026-03-05 08:00:11',
    weddingDate: '2026-11-01 00:00:00',
    purchaseChannel: '필메이커',
    partner: 'NAVER_STORE',
    name: '박나연',
    loginId: 'nayeonp',
    email: 'ny.park@example.com',
    orderCount: 1,
    draftCount: 0,
    phone: '010-3000-4000',
    reserve: '3,200',
    feelPoint: '0',
    marketingConsent: 'disagree',
    signupChannel: 'naver',
  },
  {
    id: '5',
    joinDate: '2025-08-22 13:25:44',
    weddingDate: '2027-02-14 15:00:00',
    purchaseChannel: '스토어팜',
    partner: 'bhandscard',
    name: '최유진',
    loginId: 'yujinchoi',
    email: 'yj.choi@example.com',
    orderCount: 7,
    draftCount: 2,
    phone: '010-7777-8888',
    reserve: '900',
    feelPoint: '340',
    marketingConsent: 'agree',
    signupChannel: 'general',
  },
];
