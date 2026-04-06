export type EventRow = {
  id: string;
  exposed: boolean;
  title: string;
  period: string;
  createdAt: string;
  createdBy: string;
  content: string;
};

export const EVENT_ROWS_MOCK: EventRow[] = [
  {
    id: 'event-1',
    exposed: true,
    title: '봄맞이 포토북 할인 이벤트',
    period: '2026-04-01 ~ 2026-04-30',
    createdAt: '2026-03-29',
    createdBy: '관리자A',
    content:
      '봄 시즌을 맞아 포토북 할인 이벤트를 진행합니다.\n이벤트 기간 내 주문 시 할인 혜택이 적용됩니다.',
  },
  {
    id: 'event-2',
    exposed: false,
    title: '성장영상 첫 구매 쿠폰 프로모션',
    period: '2026-04-05 ~ 2026-05-05',
    createdAt: '2026-04-01',
    createdBy: '관리자B',
    content:
      '성장영상 첫 구매 고객 대상 쿠폰 프로모션입니다.\n쿠폰 사용 조건은 이벤트 상세 안내를 참고해주세요.',
  },
  {
    id: 'event-3',
    exposed: true,
    title: '영상편지 SNS 공유 이벤트',
    period: '2026-04-10 ~ 2026-04-24',
    createdAt: '2026-04-07',
    createdBy: '관리자',
    content:
      '영상편지를 SNS에 공유하면 추첨을 통해 경품을 제공합니다.\n참여 방법: 필메이커 공식 계정 태그 후 업로드.',
  },
  {
    id: 'event-4',
    exposed: false,
    title: '식전영상 얼리버드 이벤트',
    period: '2026-04-15 ~ 2026-05-15',
    createdAt: '2026-04-12',
    createdBy: '운영자',
    content:
      '식전영상 얼리버드 이벤트입니다.\n기간 내 신청 고객에게 추가 템플릿 혜택을 제공합니다.',
  },
  {
    id: 'event-5',
    exposed: true,
    title: '신규 회원 웰컴 쿠폰',
    period: '2026-04-01 ~ 2026-06-30',
    createdAt: '2026-03-25',
    createdBy: '관리자A',
    content: '신규 가입 회원에게 웰컴 쿠폰을 지급합니다.\n앱에서 쿠폰함을 확인해주세요.',
  },
  {
    id: 'event-6',
    exposed: true,
    title: '가정의 달 패키지 특가',
    period: '2026-05-01 ~ 2026-05-31',
    createdAt: '2026-04-02',
    createdBy: '관리자',
    content: '가정의 달을 맞아 성장영상·포토북 패키지 할인을 진행합니다.',
  },
  {
    id: 'event-7',
    exposed: false,
    title: '친구 추천 적립금 이벤트',
    period: '2026-04-20 ~ 2026-05-20',
    createdAt: '2026-04-05',
    createdBy: '관리자B',
    content: '친구를 초대하면 추천인·피추천인 모두에게 적립금을 드립니다.',
  },
  {
    id: 'event-8',
    exposed: true,
    title: '앱 전용 럭키드로우',
    period: '2026-04-08 ~ 2026-04-22',
    createdAt: '2026-04-06',
    createdBy: '운영자',
    content: '앱에서 이벤트 응모 시 추첨 경품을 제공합니다.',
  },
  {
    id: 'event-9',
    exposed: true,
    title: '템플릿 무료 업그레이드',
    period: '2026-04-12 ~ 2026-04-28',
    createdAt: '2026-04-08',
    createdBy: '관리자',
    content: '선택 템플릿을 한 단계 상위 등급으로 무료 업그레이드해 드립니다.',
  },
  {
    id: 'event-10',
    exposed: false,
    title: '리뷰 작성 포인트 적립',
    period: '2026-04-01 ~ 2026-12-31',
    createdAt: '2026-03-30',
    createdBy: '관리자A',
    content: '구매 후 리뷰를 작성하면 포인트를 적립해 드립니다.',
  },
  {
    id: 'event-11',
    exposed: true,
    title: 'DVD·USB 번들 할인',
    period: '2026-04-18 ~ 2026-05-18',
    createdAt: '2026-04-10',
    createdBy: '관리자B',
    content: '영상 제작과 함께 DVD·USB를 함께 주문 시 번들 할인이 적용됩니다.',
  },
  {
    id: 'event-12',
    exposed: true,
    title: '주말 한정 플래시 세일',
    period: '2026-04-19 ~ 2026-04-20',
    createdAt: '2026-04-11',
    createdBy: '운영자',
    content: '주말 48시간 한정으로 일부 상품 추가 할인이 적용됩니다.',
  },
];
