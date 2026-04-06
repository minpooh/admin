export type NoticeRow = {
  id: string;
  /** 상단 고정 */
  pinned: boolean;
  title: string;
  createdAt: string;
  createdBy: string;
  content: string;
};

export const NOTICE_ROWS_MOCK: NoticeRow[] = [
  {
    id: 'notice-1',
    pinned: true,
    title: '필메이커 서비스 점검 안내',
    createdAt: '2026-03-20',
    createdBy: '관리자',
    content:
      '안녕하세요. 시스템 안정화를 위한 점검이 예정되어 있습니다.\n자세한 일정은 추후 공지드리겠습니다.',
  },
  {
    id: 'notice-2',
    pinned: false,
    title: '개인정보 처리방침 개정 안내',
    createdAt: '2026-03-25',
    createdBy: '관리자A',
    content: '개인정보 처리방침이 개정되었습니다.\n홈페이지 하단에서 전문을 확인하실 수 있습니다.',
  },
  {
    id: 'notice-3',
    pinned: false,
    title: '내부 검토용 초안 공지',
    createdAt: '2026-04-01',
    createdBy: '관리자B',
    content: '내부 검토용 테스트 공지입니다.',
  },
];
