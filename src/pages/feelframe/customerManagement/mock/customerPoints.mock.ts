export type FeelframeCustomerPointRow = {
  id: string;
  /** 포인트 내역의 회원 id (FeelframeCustomerRow.id 와 매핑) */
  customerId: string;
  /** 일시 (YYYY-MM-DD HH:mm:ss) */
  date: string;
  /** 적립/사용 사유 */
  description: string;
  /** 적립 또는 차감 금액 (양수=적립, 음수=사용/만료) */
  amount: number;
  /** 처리 후 잔액 */
  balance: number;
};

export const MOCK_FEELFRAME_CUSTOMER_POINTS: FeelframeCustomerPointRow[] = [
  // fc-001 (현재 잔액 12,000)
  {
    id: 'pt-001',
    customerId: 'fc-001',
    date: '2026-01-10 11:20:00',
    description: '신규 가입 적립',
    amount: 5000,
    balance: 5000,
  },
  {
    id: 'pt-002',
    customerId: 'fc-001',
    date: '2026-01-15 11:00:00',
    description: '주문 적립 (웨딩 액자 A4)',
    amount: 3000,
    balance: 8000,
  },
  {
    id: 'pt-003',
    customerId: 'fc-001',
    date: '2026-02-18 14:30:00',
    description: '주문 적립 (캔버스 액자)',
    amount: 2000,
    balance: 10000,
  },
  {
    id: 'pt-004',
    customerId: 'fc-001',
    date: '2026-04-05 20:00:00',
    description: '리뷰 작성 보너스',
    amount: 2000,
    balance: 12000,
  },
  // fc-002 (현재 잔액 3,500)
  {
    id: 'pt-005',
    customerId: 'fc-002',
    date: '2026-02-03 09:20:00',
    description: '카카오 가입 적립',
    amount: 3000,
    balance: 3000,
  },
  {
    id: 'pt-006',
    customerId: 'fc-002',
    date: '2026-02-10 11:30:00',
    description: '주문 적립',
    amount: 500,
    balance: 3500,
  },
  // fc-004 (현재 잔액 8,200)
  {
    id: 'pt-007',
    customerId: 'fc-004',
    date: '2026-03-18 14:10:00',
    description: '신규 가입 적립',
    amount: 5000,
    balance: 5000,
  },
  {
    id: 'pt-008',
    customerId: 'fc-004',
    date: '2026-03-25 09:30:00',
    description: '주문 적립 (웨딩 액자 A3)',
    amount: 4000,
    balance: 9000,
  },
  {
    id: 'pt-009',
    customerId: 'fc-004',
    date: '2026-04-30 12:00:00',
    description: '적립금 사용 (보정 시안)',
    amount: -800,
    balance: 8200,
  },
  // fc-005 (현재 잔액 1,500)
  {
    id: 'pt-010',
    customerId: 'fc-005',
    date: '2026-04-02 09:00:00',
    description: '카카오 가입 적립',
    amount: 1500,
    balance: 1500,
  },
  // fc-006 (현재 잔액 4,400)
  {
    id: 'pt-011',
    customerId: 'fc-006',
    date: '2026-04-21 19:35:00',
    description: '신규 가입 적립',
    amount: 3000,
    balance: 3000,
  },
  {
    id: 'pt-012',
    customerId: 'fc-006',
    date: '2026-04-28 13:20:00',
    description: '주문 적립',
    amount: 1500,
    balance: 4500,
  },
  {
    id: 'pt-013',
    customerId: 'fc-006',
    date: '2026-05-10 21:30:00',
    description: '쿠폰 등록 보너스',
    amount: -100,
    balance: 4400,
  },
];
