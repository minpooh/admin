import { MOCK_ENTERPRISE_LIST } from './enterpriseList.mock';

export type EnterpriseInvoiceRow = {
  id: string;
  displayNo: string;
  enterpriseId: string;
  applicantName: string;
  phone: string;
  email: string;
  appliedAt: string;
  issuedAt: string | null;
  companyName: string;
  amount: number;
  businessNo: string;
};

const APPLICANTS = [
  '김민수',
  '이영희',
  '박준호',
  '최서연',
  '정다은',
  '한지훈',
  '오수진',
  '윤태양',
  '강하늘',
  '임도현',
] as const;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function formatYmdHms(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function makeBusinessNo(i: number): string {
  const a = String(100 + (i % 900)).padStart(3, '0');
  const b = String(10 + ((i * 3) % 90)).padStart(2, '0');
  const c = String(10000 + ((i * 97) % 90000)).padStart(5, '0');
  return `${a}-${b}-${c}`;
}

export const MOCK_ENTERPRISE_INVOICES: EnterpriseInvoiceRow[] = (() => {
  const base = new Date();
  const n = 36;
  return Array.from({ length: n }, (_, i) => {
    const ent = MOCK_ENTERPRISE_LIST[i % MOCK_ENTERPRISE_LIST.length]!;
    const applicant = APPLICANTS[i % APPLICANTS.length]!;
    const applied = new Date(base.getTime() - (i * 11 + (i % 4)) * 60 * 60 * 1000);
    const issued = new Date(applied.getTime() + (1 + (i % 4)) * 24 * 60 * 60 * 1000);
    const isIssued = i % 7 !== 0;
    const no = String((((i + 1) * 271 + 31) % 10000)).padStart(4, '0');
    return {
      id: `ent-inv-${String(i + 1).padStart(3, '0')}`,
      displayNo: no,
      enterpriseId: ent.id,
      applicantName: applicant,
      phone: `010-${String(1000 + ((i * 37) % 9000)).padStart(4, '0')}-${String(1000 + ((i * 71) % 9000)).padStart(4, '0')}`,
      email: `invoice${String(i + 1).padStart(2, '0')}@example.com`,
      appliedAt: formatYmdHms(applied),
      issuedAt: isIssued ? formatYmdHms(issued) : null,
      companyName: ent.companyName,
      amount: 180000 + ((i * 52431) % 2600000),
      businessNo: makeBusinessNo(i + 1),
    };
  });
})();
