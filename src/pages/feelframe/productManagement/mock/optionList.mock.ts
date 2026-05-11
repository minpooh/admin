/**
 * 필프레임 · 상품관리 · 옵션관리
 * 상품 데이터의 옵션 셀(옵션 요약)에 사용되는 마스터 옵션 정의 목록.
 * `productList.mock.ts`의 `optionSummary` (예: "색상 3 / 사이즈 2") 와 짝을 이룸.
 */
export type FeelframeOptionRow = {
  id: string;
  /** 옵션명 (상품 옵션의 라벨, 예: 색상 / 사이즈) */
  name: string;
  /** 관리자 안내용 옵션 설명 */
  description: string;
  /** 옵션 항목 값 목록 (예: ["블랙", "화이트", "골드"]) */
  items: string[];
  /** 옵션 등록일 (정렬·표기용) */
  createdAt: string;
};

export const MOCK_FEELFRAME_OPTION_LIST: FeelframeOptionRow[] = [
  {
    id: 'ff-opt-001',
    name: '색상',
    description: '액자 프레임의 기본 색상 옵션입니다.',
    items: ['블랙', '화이트', '골드', '실버', '우드'],
    createdAt: '2026-03-04',
  },
  {
    id: 'ff-opt-002',
    name: '사이즈',
    description: '인화·액자 공통 규격 사이즈 옵션입니다.',
    items: ['8R', '12R', '16R', '20R'],
    createdAt: '2026-03-04',
  },
  {
    id: 'ff-opt-003',
    name: '구성',
    description: '세트 상품 구성 수량 옵션입니다.',
    items: ['단품', '2종세트', '3종세트', '4종세트'],
    createdAt: '2026-03-05',
  },
  {
    id: 'ff-opt-004',
    name: '매트 유무',
    description: '액자 매트지 포함 여부 옵션입니다.',
    items: ['있음', '없음'],
    createdAt: '2026-03-05',
  },
  {
    id: 'ff-opt-005',
    name: '액자타입',
    description: '액자 본체의 재질 타입 옵션입니다.',
    items: ['메탈', '우드', '아크릴'],
    createdAt: '2026-03-08',
  },
  {
    id: 'ff-opt-006',
    name: '각인',
    description: '제품 각인(레터링) 옵션입니다.',
    items: ['없음', '이름', '날짜', '메시지'],
    createdAt: '2026-03-12',
  },
  {
    id: 'ff-opt-007',
    name: '수량 단계',
    description: '대량 주문 수량 단계 옵션입니다.',
    items: ['1개', '5개', '10개', '20개'],
    createdAt: '2026-03-15',
  },
  {
    id: 'ff-opt-008',
    name: '촬영일',
    description: '촬영 패키지 상품의 희망 촬영 요일 옵션입니다.',
    items: ['평일', '주말'],
    createdAt: '2026-03-18',
  },
  {
    id: 'ff-opt-009',
    name: '포장 옵션',
    description: '선물 포장 추가 여부 옵션입니다.',
    items: ['미포장', '기본 포장', '프리미엄 포장'],
    createdAt: '2026-03-22',
  },
  {
    id: 'ff-opt-010',
    name: '인화 매수',
    description: '인화 상품 매수 단계 옵션입니다.',
    items: ['50매', '100매', '200매'],
    createdAt: '2026-03-26',
  },
  {
    id: 'ff-opt-011',
    name: '프레임 두께',
    description: '액자 테두리 두께 옵션입니다.',
    items: ['슬림', '베이직', '와이드'],
    createdAt: '2026-04-01',
  },
  {
    id: 'ff-opt-012',
    name: '배송 옵션',
    description: '배송 방식 추가 옵션입니다.',
    items: ['일반배송', '새벽배송', '방문수령'],
    createdAt: '2026-04-05',
  },
];
