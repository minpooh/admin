import { MOCK_GROUP_BUY_ROWS } from './groupBuyList.mock';

/** 공동구매 쿠폰 사용 여부 (목업) */
export type GroupBuyCouponUsage = 'used' | 'unused';

export type GroupBuyParticipantDetail = {
  id: string;
  name: string;
  phone: string;
  /** 참여 일시 */
  joinDate: string;
  couponNumber: string;
  couponUsage: GroupBuyCouponUsage;
  purchaseProduct: string;
};

const NAME_POOL = [
  '김민수',
  '이서연',
  '박준호',
  '최유진',
  '정하은',
  '한동욱',
  '오지훈',
  '윤채원',
  '강나래',
  '임도현',
];

const PRODUCT_POOL = [
  '스튜디오 패키지 A',
  '필름·앨범 세트',
  '모바일청첩장 프리미엄',
  '액자 16R',
  'DVD 본편+메이킹',
  '초대장 디자인 패키지',
];

function buildParticipantsForGroup(groupId: string, count: number): GroupBuyParticipantDetail[] {
  const list: GroupBuyParticipantDetail[] = [];
  for (let i = 0; i < count; i++) {
    const n = i + 1;
    const seed = Number(groupId) * 1000 + n;
    const couponUsage: GroupBuyCouponUsage = seed % 3 === 0 ? 'unused' : 'used';
    const phoneMid = String(2000 + (seed % 8000)).padStart(4, '0');
    const phoneEnd = String(3000 + (seed % 7000)).padStart(4, '0');
    list.push({
      id: `g${groupId}-p${n}`,
      name: `${NAME_POOL[i % NAME_POOL.length]} (${n})`,
      phone: `010-${phoneMid}-${phoneEnd}`,
      joinDate: `2026-${String((seed % 9) + 1).padStart(2, '0')}-${String((seed % 27) + 1).padStart(2, '0')} ${String(9 + (seed % 10)).padStart(2, '0')}:${String((seed * 7) % 60).padStart(2, '0')}`,
      couponNumber: `GB-${groupId}-${String(n).padStart(4, '0')}`,
      couponUsage,
      purchaseProduct: PRODUCT_POOL[seed % PRODUCT_POOL.length],
    });
  }
  return list;
}

function buildAll(): Record<string, GroupBuyParticipantDetail[]> {
  const m: Record<string, GroupBuyParticipantDetail[]> = {};
  for (const row of MOCK_GROUP_BUY_ROWS) {
    m[row.id] = buildParticipantsForGroup(row.id, row.participantCount);
  }
  return m;
}

export const MOCK_GROUP_BUY_PARTICIPANTS_BY_ID: Record<string, GroupBuyParticipantDetail[]> = buildAll();

export function getGroupBuyParticipants(groupId: string): GroupBuyParticipantDetail[] {
  return MOCK_GROUP_BUY_PARTICIPANTS_BY_ID[groupId] ?? [];
}

export function summarizeCouponUsage(participants: GroupBuyParticipantDetail[]) {
  const total = participants.length;
  const used = participants.filter((p) => p.couponUsage === 'used').length;
  return { total, used, unused: total - used };
}
