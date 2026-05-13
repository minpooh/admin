export type FeelframeCustomerCouponStatus = '사용전' | '사용완료';

export type FeelframeCustomerCouponRow = {
  id: string;
  /** 쿠폰 내역의 회원 id (FeelframeCustomerRow.id 와 매핑) */
  customerId: string;
  /** 쿠폰 이름 */
  couponName: string;
  /** 만료일 (YYYY-MM-DD) */
  expiresAt: string;
  /** 사용 현황 */
  status: FeelframeCustomerCouponStatus;
  /** 등록일 (YYYY-MM-DD) */
  registeredAt: string;
};

export const MOCK_FEELFRAME_CUSTOMER_COUPONS: FeelframeCustomerCouponRow[] = [
  // fc-001 (couponCount: 2)
  {
    id: 'cp-001',
    customerId: 'fc-001',
    couponName: '신규 가입 5% 할인',
    expiresAt: '2026-04-30',
    status: '사용완료',
    registeredAt: '2026-01-10',
  },
  {
    id: 'cp-002',
    customerId: 'fc-001',
    couponName: '봄맞이 무료배송 쿠폰',
    expiresAt: '2026-06-30',
    status: '사용전',
    registeredAt: '2026-03-21',
  },
  // fc-002 (couponCount: 1)
  {
    id: 'cp-003',
    customerId: 'fc-002',
    couponName: '카카오 친구 5,000원 쿠폰',
    expiresAt: '2026-05-31',
    status: '사용전',
    registeredAt: '2026-02-03',
  },
  // fc-004 (couponCount: 3)
  {
    id: 'cp-004',
    customerId: 'fc-004',
    couponName: '신규 가입 5% 할인',
    expiresAt: '2026-06-18',
    status: '사용완료',
    registeredAt: '2026-03-18',
  },
  {
    id: 'cp-005',
    customerId: 'fc-004',
    couponName: '리뷰 작성 3,000원 쿠폰',
    expiresAt: '2026-07-20',
    status: '사용전',
    registeredAt: '2026-04-02',
  },
  {
    id: 'cp-006',
    customerId: 'fc-004',
    couponName: '주말 한정 10% 할인',
    expiresAt: '2026-04-25',
    status: '사용완료',
    registeredAt: '2026-04-12',
  },
  // fc-005 (couponCount: 1)
  {
    id: 'cp-007',
    customerId: 'fc-005',
    couponName: '카카오 친구 5,000원 쿠폰',
    expiresAt: '2026-07-31',
    status: '사용전',
    registeredAt: '2026-04-02',
  },
  // fc-006 (couponCount: 2)
  {
    id: 'cp-008',
    customerId: 'fc-006',
    couponName: '네이버 친구 3,000원 쿠폰',
    expiresAt: '2026-07-31',
    status: '사용완료',
    registeredAt: '2026-04-21',
  },
  {
    id: 'cp-009',
    customerId: 'fc-006',
    couponName: '봄맞이 무료배송 쿠폰',
    expiresAt: '2026-06-30',
    status: '사용전',
    registeredAt: '2026-05-02',
  },
];
