export type GroupBuyRow = {
  id: string;
  /** 공구팀명 */
  teamName: string;
  /** 참여코드 — 6자리 숫자(문자열) */
  participationCode: string;
  /** 공구장(이름) */
  leaderName: string;
  /** 제한금액(원) — 혜택 목업, 리스트에는 미표시 */
  benefitLimitAmount: number;
  /** 5명 이상 혜택 설명 — 목업, 리스트에는 미표시 */
  benefitFrom5: number;
  /** 10명 이상 혜택 설명 — 목업, 리스트에는 미표시 */
  benefitFrom10: number;
  /** 발행 후 제한일수 — 목업, 리스트에는 미표시 */
  daysAfterIssue: number;
  /** 시작 일시 (표시용 문자열, 예: 2026-03-01 09:00) */
  startDate: string;
  /** 마감 일시 */
  endDate: string;
  participantCount: number;
  /** 마감전 | 마감 */
  progressStatus: 'before' | 'closed';
};

export const MOCK_GROUP_BUY_ROWS: GroupBuyRow[] = [
  {
    id: '1',
    teamName: '봄웨딩 스튜디오 공구',
    participationCode: '482901',
    leaderName: '김민수',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 14,
    startDate: '2026-03-01 09:00',
    endDate: '2026-03-31 23:59',
    participantCount: 12,
    progressStatus: 'before',
  },
  {
    id: '2',
    teamName: '필름 패키지 A팀',
    participationCode: '102938',
    leaderName: '이서연',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 7,
    startDate: '2026-02-15 10:00',
    endDate: '2026-02-28 18:00',
    participantCount: 24,
    progressStatus: 'closed',
  },
  {
    id: '3',
    teamName: '돌잔치 초대장 공동',
    participationCode: '771122',
    leaderName: '박준호',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 3,
    progressStatus: 'before',
  },
  {
    id: '4',
    teamName: '액자 업체 특가',
    participationCode: '009988',
    leaderName: '최유진',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 21,
    startDate: '2026-01-10 08:30',
    endDate: '2026-01-25 17:00',
    participantCount: 18,
    progressStatus: 'closed',
  },
  {
    id: '5',
    teamName: '모바일청첩장 베스트',
    participationCode: '556677',
    leaderName: '정하은',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 10,
    startDate: '2026-05-01 09:00',
    endDate: '2026-05-15 23:59',
    participantCount: 0,
    progressStatus: 'before',
  },
  {
    id: '6',
    teamName: 'DVD 패키지 공구',
    participationCode: '334455',
    leaderName: '한동욱',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 5,
    startDate: '2026-03-20 12:00',
    endDate: '2026-04-10 18:30',
    participantCount: 9,
    progressStatus: 'before',
  },
  {
    id: '7',
    teamName: '공동구매 테스트',
    participationCode: '123456',
    leaderName: '테스트',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 0,
    progressStatus: 'before', 
  },
  {
    id: '8',
    teamName: '공동구매 테스트',
    participationCode: '123456',
    leaderName: '테스트',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 0,
    progressStatus: 'before', 
  },
  {
    id: '9',
    teamName: '공동구매 테스트',
    participationCode: '123456',
    leaderName: '테스트',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 0,
    progressStatus: 'before', 
  },
  {
    id: '10',
    teamName: '공동구매 테스트',
    participationCode: '123456',
    leaderName: '테스트',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 0,
    progressStatus: 'before', 
  },
  {
    id: '11',
    teamName: '공동구매 테스트',
    participationCode: '123456',
    leaderName: '테스트',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 0,
    progressStatus: 'before', 
  },
  {
    id: '12',
    teamName: '공동구매 테스트',
    participationCode: '123456',
    leaderName: '테스트',
    benefitLimitAmount: 15000,
    benefitFrom5: 5000,
    benefitFrom10: 10000,
    daysAfterIssue: 30,
    startDate: '2026-04-01 00:00',
    endDate: '2026-04-20 23:59',
    participantCount: 0,
    progressStatus: 'before', 
  },
];
