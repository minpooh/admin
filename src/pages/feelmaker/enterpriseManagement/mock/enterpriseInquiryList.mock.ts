import { MOCK_ENTERPRISE_LIST } from './enterpriseList.mock';

export type EnterpriseInquiryAnswerStatus = 'pending' | 'answered';

export type EnterpriseInquiryRow = {
  id: string;
  createdAt: string;
  title: string;
  content: string;
  answerStatus: EnterpriseInquiryAnswerStatus;
  companyName: string;
  companyLoginId: string;
  responderName: string | null;
  answeredAt: string | null;
  answerContent: string | null;
};

const INQUIRY_TITLES = [
  '정산 기준 문의',
  '견적서 요청',
  '세금계산서 재발행 요청',
  '계정 권한 추가 문의',
  '주문 내역 다운로드 오류',
  '템플릿 업로드 제한 문의',
  '프로모션 코드 적용 문의',
  '서비스 이용 계약서 요청',
] as const;

const INQUIRY_CONTENTS = [
  '월 단위 정산 기준과 지급 예정일 확인 부탁드립니다.',
  '대량 제작 건으로 견적서를 받을 수 있을지 문의드립니다.',
  '지난달 발행분 세금계산서 재발행이 필요합니다.',
  '팀원 계정에 관리자 권한 추가가 가능한지 확인 부탁드립니다.',
  '주문 내역 CSV 다운로드 시 에러가 발생합니다.',
  '업로드 가능한 파일 크기 및 형식 제한을 알고 싶습니다.',
  '기업 전용 프로모션 코드 적용 방식이 궁금합니다.',
  '서비스 이용 계약서 샘플 전달 가능한지 문의드립니다.',
] as const;

const ANSWER_CONTENTS = [
  '안녕하세요. 요청 주신 정산 기준은 월말 마감 후 익월 10영업일 이내 지급입니다.',
  '견적서는 담당 매니저가 확인 후 영업일 기준 1일 내 메일로 전달드립니다.',
  '재발행 요청 확인되었습니다. 사업자등록증 확인 후 순차 발행하겠습니다.',
  '관리자 권한은 보안 정책상 대표 계정 승인 후 적용 가능합니다.',
  '오류 로그 확인 후 다운로드 경로를 복구했으며, 다시 시도 부탁드립니다.',
] as const;

const RESPONDERS = ['김운영', '박담당', '최매니저', '정지원', '이관리'] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateTime(base: Date, offsetHours: number): string {
  const d = new Date(base.getTime() - offsetHours * 60 * 60 * 1000);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export const MOCK_ENTERPRISE_INQUIRIES: EnterpriseInquiryRow[] = (() => {
  const base = new Date();
  const total = 32;
  return Array.from({ length: total }, (_, i) => {
    const enterprise = MOCK_ENTERPRISE_LIST[i % MOCK_ENTERPRISE_LIST.length]!;
    const isAnswered = i % 4 !== 0;
    const createdAt = formatDateTime(base, i * 11 + (i % 3));
    const answeredAt = isAnswered ? formatDateTime(base, i * 9) : null;
    const title = `${INQUIRY_TITLES[i % INQUIRY_TITLES.length]} #${i + 1}`;
    return {
      id: `ent-inq-${String(i + 1).padStart(3, '0')}`,
      createdAt,
      title,
      content: INQUIRY_CONTENTS[i % INQUIRY_CONTENTS.length]!,
      answerStatus: isAnswered ? 'answered' : 'pending',
      companyName: enterprise.companyName,
      companyLoginId: enterprise.loginId,
      responderName: isAnswered ? RESPONDERS[i % RESPONDERS.length]! : null,
      answeredAt,
      answerContent: isAnswered ? ANSWER_CONTENTS[i % ANSWER_CONTENTS.length]! : null,
    };
  });
})();
