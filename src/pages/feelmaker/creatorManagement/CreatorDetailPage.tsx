import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Modal, { ModalDatePicker } from '../../../components/Modal';
import PdfPreviewSection from '../../../components/PdfPreviewSection/PdfPreviewSection';
import '../../../styles/adminPage.css';
import { creatorListPath } from './creatorPaths';

export type CreatorDetailRow = {
  id: string;
  loginId: string;
  name: string;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED';
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  salesCount: number;
  totalSettlementAmount: number;
  joinedAt: string;
  lastLoginAt: string;
};

type CreatorDetailPageProps = {
  row: CreatorDetailRow;
  onSave: (next: CreatorDetailRow) => void;
};

const ACCOUNT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'SUSPENDED', label: 'SUSPENDED' },
];

const APPROVAL_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
];

const SETTLEMENT_STATUS_FILTER_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PAID', label: 'PAID' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

function ymdToTime(value: string): number {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1).getTime();
}

export default function CreatorDetailPage({ row, onSave }: CreatorDetailPageProps) {
  const [name, setName] = useState(row.name);
  const [phone, setPhone] = useState(row.phone);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountStatus, setAccountStatus] = useState<CreatorDetailRow['status']>(row.status);
  const [approvalStatus, setApprovalStatus] = useState<CreatorDetailRow['approvalStatus']>(row.approvalStatus);
  const [visibleSettlementCount] = useState(10);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementStatusFilter, setSettlementStatusFilter] = useState('');
  const [settlementStartDate, setSettlementStartDate] = useState<Date | null>(null);
  const [settlementEndDate, setSettlementEndDate] = useState<Date | null>(null);
  const pendingSettlementAmount = Math.max(0, Math.floor(row.totalSettlementAmount * 0.18));
  const completedSettlementAmount = row.totalSettlementAmount - pendingSettlementAmount;
  const totalSettlementRequests = Math.max(1, Math.floor(row.salesCount * 0.72));
  const recentSettlements = Array.from({ length: 14 }, (_, i) => {
    const no = i + 1;
    const requestedMonth = String(((i + 2) % 12) + 1).padStart(2, '0');
    const requestedDay = String(((i * 3) % 27) + 1).padStart(2, '0');
    const depositedDay = String(Math.min(28, ((i * 3) % 27) + 3)).padStart(2, '0');
    const status = i % 7 === 0 ? 'CANCELLED' : i % 3 === 0 ? 'PENDING' : 'PAID';
    return {
      id: `SET-${row.id.replace('creator-', '').toUpperCase()}-${String(no).padStart(3, '0')}`,
      orderId: `ORD-${String(9400 + i * 13).padStart(6, '0')}`,
      amount: Math.max(15000, Math.floor(row.totalSettlementAmount / 24) + i * 12000),
      status,
      requestedAt: `2026-${requestedMonth}-${requestedDay}`,
      depositedAt: status === 'PAID' ? `2026-${requestedMonth}-${depositedDay}` : '-',
    };
  });
  const visibleSettlements = recentSettlements.slice(0, visibleSettlementCount);
  const filteredSettlementsInModal = recentSettlements.filter((item) => {
    if (settlementStatusFilter && item.status !== settlementStatusFilter) return false;
    const requestedAtTime = ymdToTime(item.requestedAt);
    if (settlementStartDate && requestedAtTime < settlementStartDate.getTime()) return false;
    if (settlementEndDate && requestedAtTime > settlementEndDate.getTime()) return false;
    return true;
  });
  const contractRequestedAt = row.joinedAt;
  const contractStatus = approvalStatus === 'APPROVED' ? '완료' : approvalStatus === 'REJECTED' ? '반려' : '진행중';
  const contractSigned = approvalStatus === 'APPROVED' ? '완료' : '미완료';
  const contractSigner = name.trim() || row.name;
  const identityVerified = accountStatus === 'ACTIVE' ? '완료' : '대기';

  const contractPdfUrl = useMemo(() => {
    const pdfText = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Count 1 /Kids [3 0 R] >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 203 >>
stream
BT
/F1 18 Tf
50 790 Td
(Creator Contract) Tj
/F1 12 Tf
0 -34 Td
(Creator ID: ${row.loginId}) Tj
0 -20 Td
(Name: ${contractSigner}) Tj
0 -20 Td
(Status: ${contractStatus}) Tj
0 -20 Td
(Requested At: ${contractRequestedAt}) Tj
0 -20 Td
(Signed: ${contractSigned}) Tj
0 -20 Td
(Verified: ${identityVerified}) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000063 00000 n 
0000000122 00000 n 
0000000248 00000 n 
0000000318 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
652
%%EOF`;

    const blob = new Blob([pdfText], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }, [row.loginId, contractSigner, contractStatus, contractRequestedAt, contractSigned, identityVerified]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(contractPdfUrl);
    };
  }, [contractPdfUrl]);
  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      window.alert('이름과 휴대폰번호를 입력해주세요.');
      return;
    }

    onSave({
      ...row,
      name: trimmedName,
      phone: trimmedPhone,
      status: accountStatus,
      approvalStatus,
    });
  };

  const handleDownloadPdf = () => {
    const a = document.createElement('a');
    a.href = contractPdfUrl;
    a.download = `creator-contract-${row.loginId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={creatorListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">크리에이터 상세</h1>
      </div>

      <div className="admin-detail-two-column">
        <section className="admin-list-box admin-box-w-half">
          <p className="admin-detail-id">{row.id}</p>
          <h2 className="admin-detail-title">{row.name}</h2>
          <dl className="admin-detail-meta admin-detail-meta--aligned">
            <div className="admin-detail-meta__row">
              <dt>아이디</dt>
              <dd>{row.loginId}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>이메일</dt>
              <dd>{row.email}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>이름</dt>
              <dd>
                <input
                  type="text"
                  className="admin-inline-input admin-detail-author-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름"
                  aria-label="이름"
                />
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>전화번호</dt>
              <dd>
                <input
                  type="text"
                  className="admin-inline-input admin-detail-author-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="휴대폰번호"
                  aria-label="휴대폰번호"
                />
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>은행명</dt>
              <dd>
                <input
                  type="text"
                  className="admin-inline-input admin-detail-author-input"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="은행명"
                  aria-label="은행명"
                />
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>계좌번호</dt>
              <dd>
                <input
                  type="text"
                  className="admin-inline-input admin-detail-author-input"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="계좌번호"
                  aria-label="계좌번호"
                />
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>계정상태</dt>
              <dd>
                <ListSelect
                  ariaLabel="계정상태"
                  value={accountStatus}
                  onChange={(value) => setAccountStatus(value as CreatorDetailRow['status'])}
                  options={ACCOUNT_STATUS_OPTIONS}
                />
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>승인상태</dt>
              <dd>
                <ListSelect
                  ariaLabel="승인상태"
                  value={approvalStatus}
                  onChange={(value) => setApprovalStatus(value as CreatorDetailRow['approvalStatus'])}
                  options={APPROVAL_STATUS_OPTIONS}
                />
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>가입일</dt>
              <dd>{row.joinedAt}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>최근 로그인</dt>
              <dd>{row.lastLoginAt}</dd>
            </div>
          </dl>
          <div className="admin-list-add-row">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSave}>
              저장
            </button>
          </div>
        </section>

        <section className="admin-list-box admin-box-w-half">
          <h3 className="admin-detail-section-title">정산현황</h3>
          <dl className="admin-detail-meta admin-detail-meta--settlement-summary">
            <div className="admin-detail-meta__row">
              <dt>총 정산 요청 건수</dt>
              <dd>{totalSettlementRequests.toLocaleString()}건</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>누적 정산 완료</dt>
              <dd>{completedSettlementAmount.toLocaleString()}원</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>현재 PENDING 금액</dt>
              <dd>{pendingSettlementAmount.toLocaleString()}원</dd>
            </div>
          </dl>

          <div className="filter-row filter-row--spread admin-settlement-history-head">
            <h4 className="admin-detail-section-title">최근 정산 내역</h4>
            <button
              type="button"
              className="filter-btn filter-btn--outline"
              onClick={() => setIsSettlementModalOpen(true)}
            >
              전체보기
            </button>
          </div>
          <div className="admin-table-wrap admin-settlement-table-wrap">
            <table className="admin-table admin-table--creator-settlement-history">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>주문 ID</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th>요청일</th>
                  <th>입금일</th>
                </tr>
              </thead>
              <tbody>
                {visibleSettlements.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.orderId}</td>
                    <td>{item.amount.toLocaleString()}원</td>
                    <td>
                      <span
                        className={
                          item.status === 'PAID'
                            ? 'row-btn row-btn--status-secondary'
                            : item.status === 'CANCELLED'
                              ? 'row-btn row-btn--status-danger'
                              : 'row-btn row-btn--status-warning'
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.requestedAt}</td>
                    <td>{item.depositedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="admin-list-box" aria-label="계약서 정보">
        <div className="filter-row filter-row--spread admin-detail-preview-head">
          <h3 className="admin-detail-section-title">계약서 정보</h3>
          <button type="button" className="filter-btn filter-btn--primary" onClick={handleDownloadPdf}>
            PDF 저장하기
          </button>
        </div>
        <div className="admin-contract-meta-inline" role="list" aria-label="계약서 정보 항목">
          <div className="admin-contract-meta-inline__row" role="listitem">
            <div className="admin-contract-meta-inline__item">
              <span className="admin-contract-meta-inline__label">계약 버전</span>
              <span className="admin-contract-meta-inline__value">v1.0</span>
            </div>
            <div className="admin-contract-meta-inline__item">
              <span className="admin-contract-meta-inline__label">상태</span>
              <span className="admin-contract-meta-inline__value">{contractStatus}</span>
            </div>
            <div className="admin-contract-meta-inline__item">
              <span className="admin-contract-meta-inline__label">요청일</span>
              <span className="admin-contract-meta-inline__value">{contractRequestedAt}</span>
            </div>
          </div>
          <div className="admin-contract-meta-inline__row" role="listitem">
            <div className="admin-contract-meta-inline__item">
              <span className="admin-contract-meta-inline__label">서명완료여부</span>
              <span className="admin-contract-meta-inline__value">{contractSigned}</span>
            </div>
            <div className="admin-contract-meta-inline__item">
              <span className="admin-contract-meta-inline__label">서명자</span>
              <span className="admin-contract-meta-inline__value">{contractSigner}</span>
            </div>
            <div className="admin-contract-meta-inline__item">
              <span className="admin-contract-meta-inline__label">본인확인</span>
              <span className="admin-contract-meta-inline__value">{identityVerified}</span>
            </div>
          </div>
        </div>

        <PdfPreviewSection pdfUrl={contractPdfUrl} iframeTitle="계약서 PDF 미리보기" />
      </section>

      <Modal
        open={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        ariaLabel="최근 정산 내역"
        variant="option"
        panelClassName="option-modal__panel--wide"
      >
        <Modal.Header>
          <Modal.Title>전체 정산 내역</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-settlement-filter">
            <div className="filter-top-row admin-modal-settlement-filter__row">
              <div className="filter-section">
                <span className="filter-label">상태</span>
                <ListSelect
                  ariaLabel="정산 상태 필터"
                  value={settlementStatusFilter}
                  onChange={setSettlementStatusFilter}
                  options={SETTLEMENT_STATUS_FILTER_OPTIONS}
                />
              </div>
              <div className="filter-section">
                <span className="filter-label">요청일</span>
                <div className="date-range-wrap">
                  <div className="date-range-pickers">
                    <ModalDatePicker
                      modalOpen={isSettlementModalOpen}
                      selected={settlementStartDate}
                      onChange={(date: Date | null) => setSettlementStartDate(date)}
                      placeholderText="시작일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      inputClassName="date-picker-input"
                      isClearable={!!settlementStartDate}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                    />
                    <span className="date-sep">~</span>
                    <ModalDatePicker
                      modalOpen={isSettlementModalOpen}
                      selected={settlementEndDate}
                      onChange={(date: Date | null) => setSettlementEndDate(date)}
                      placeholderText="종료일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      inputClassName="date-picker-input"
                      isClearable={!!settlementEndDate}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                      minDate={settlementStartDate ?? undefined}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="admin-modal-table-wrap">
            <table className="admin-modal-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>주문 ID</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th>요청일</th>
                  <th>입금일</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettlementsInModal.map((item) => (
                  <tr key={`${item.id}-modal`}>
                    <td>{item.id}</td>
                    <td>{item.orderId}</td>
                    <td>{item.amount.toLocaleString()}원</td>
                    <td>
                      <span
                        className={
                          item.status === 'PAID'
                            ? 'row-btn row-btn--status-secondary'
                            : item.status === 'CANCELLED'
                              ? 'row-btn row-btn--status-danger'
                              : 'row-btn row-btn--status-warning'
                        }
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.requestedAt}</td>
                    <td>{item.depositedAt}</td>
                  </tr>
                ))}
                {!filteredSettlementsInModal.length && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '16px' }}>
                      데이터가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
