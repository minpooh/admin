import { useCallback, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Modal from '../../../components/modal';
import CrawlingListTemplate, { type CrawlingColumnDef } from './CrawlingListTemplate';
import {
  MOCK_STOREFARM_MOTION_ROWS,
  MOTION_SEARCH_SCOPE_OPTIONS,
  type MotionPersonLines,
  type StorefarmMotionRow,
} from './mock/storefarmCrawling.mock';
import '../orderManagement/OrderListPage.css';

function flattenTriple(p: MotionPersonLines) {
  return `${p.userId} ${p.name} ${p.phone}`;
}

function TripleLines({ p }: { p: MotionPersonLines }) {
  return (
    <div className="admin-cell-triple">
      <span>{p.name}</span>
      <span>{p.userId}</span>
      <span>{p.phone}</span>
    </div>
  );
}

type StorefarmInfoLinesProps = {
  p: MotionPersonLines;
  onContactChange: () => void;
};

/** 스팜정보: 연락처 앞에 연락처 변경 */
function StorefarmInfoLines({ p, onContactChange }: StorefarmInfoLinesProps) {
  return (
    <div className="admin-cell-triple">
      <span>{p.name}</span>
      <span>{p.userId}</span>
      <div className="phone-with-sms admin-cell-triple__phone-row">
        <button
          type="button"
          className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact"
          aria-label="연락처 변경"
          title="연락처 변경"
          onClick={onContactChange}
        >
          <RefreshCw size={12} aria-hidden="true" />
        </button>
        <span className="phone-with-sms__number">{p.phone}</span>
      </div>
    </div>
  );
}

function IssueCell({ message }: { message: string }) {
  const t = message.trim();
  if (!t) return <span className="admin-cell-issue--empty">—</span>;
  return <span className="admin-cell-issue--warn">{t}</span>;
}

function getMotionRowDate(row: StorefarmMotionRow) {
  return new Date(row.orderDate.replace(' ', 'T'));
}

function createMotionMatchKeyword() {
  return (row: StorefarmMotionRow, scope: string, keywordTrim: string) => {
    if (!keywordTrim) return true;
    const haystack = [
      row.orderNumber,
      flattenTriple(row.storefarm),
      flattenTriple(row.memberById),
      row.issueIdMatch,
      flattenTriple(row.memberByContact),
      row.issueContactMatch,
      flattenTriple(row.uploadInfo),
      row.issueUpload,
    ]
      .join(' ')
      .toLowerCase();

    if (scope === 'all') return haystack.includes(keywordTrim);
    if (scope === 'orderNumber') return row.orderNumber.toLowerCase().includes(keywordTrim);
    if (scope === 'storefarm') return flattenTriple(row.storefarm).toLowerCase().includes(keywordTrim);
    if (scope === 'memberId') return flattenTriple(row.memberById).toLowerCase().includes(keywordTrim);
    if (scope === 'memberContact') return flattenTriple(row.memberByContact).toLowerCase().includes(keywordTrim);
    if (scope === 'upload') return flattenTriple(row.uploadInfo).toLowerCase().includes(keywordTrim);
    if (scope === 'issue') {
      return [row.issueIdMatch, row.issueContactMatch, row.issueUpload].join(' ').toLowerCase().includes(keywordTrim);
    }
    return haystack.includes(keywordTrim);
  };
}

export default function StorefarmMotionPage() {
  const [rows, setRows] = useState<StorefarmMotionRow[]>(() => [...MOCK_STOREFARM_MOTION_ROWS]);
  const [contactModalRowId, setContactModalRowId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState('');

  const contactModalRow = contactModalRowId ? rows.find((r) => r.id === contactModalRowId) : undefined;

  const openContactModal = useCallback((rowId: string) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    setContactDraft(row.storefarm.phone);
    setContactModalRowId(rowId);
  }, [rows]);

  const closeContactModal = () => {
    setContactModalRowId(null);
    setContactDraft('');
  };

  const saveContact = () => {
    if (!contactModalRowId) return;
    const nextPhone = contactDraft.trim();
    if (!nextPhone) return;
    setRows((prev) =>
      prev.map((r) =>
        r.id === contactModalRowId
          ? { ...r, storefarm: { ...r.storefarm, phone: nextPhone } }
          : r
      )
    );
    closeContactModal();
  };

  const matchKeyword = useMemo(() => createMotionMatchKeyword(), []);

  const motionColumns: CrawlingColumnDef<StorefarmMotionRow>[] = useMemo(
    () => [
      { header: '주문번호', render: (r) => r.orderNumber },
      {
        header: '스팜정보',
        columnClassName: 'col-center',
        render: (r) => (
          <StorefarmInfoLines p={r.storefarm} onContactChange={() => openContactModal(r.id)} />
        ),
      },
      {
        header: '회원정보매칭(아이디)',
        columnClassName: 'col-center',
        render: (r) => <TripleLines p={r.memberById} />,
      },
      {
        header: '이슈',
        columnClassName: 'col-center admin-cell-issue-col',
        render: (r) => <IssueCell message={r.issueIdMatch} />,
      },
      {
        header: '회원정보매칭(연락처)',
        columnClassName: 'col-center',
        render: (r) => <TripleLines p={r.memberByContact} />,
      },
      {
        header: '이슈',
        columnClassName: 'col-center admin-cell-issue-col',
        render: (r) => <IssueCell message={r.issueContactMatch} />,
      },
      {
        header: '업로드정보',
        columnClassName: 'col-center',
        render: (r) => <TripleLines p={r.uploadInfo} />,
      },
      {
        header: '이슈',
        columnClassName: 'col-center admin-cell-issue-col',
        render: (r) => <IssueCell message={r.issueUpload} />,
      },
    ],
    [openContactModal]
  );

  return (
    <>
      <CrawlingListTemplate<StorefarmMotionRow>
        pageTitle="스팜 보정"
        initialRows={rows}
        dateLabel="주문일"
        dateChipPrefix="주문일"
        searchScopeOptions={MOTION_SEARCH_SCOPE_OPTIONS}
        getRowDate={getMotionRowDate}
        matchKeyword={matchKeyword}
        columns={motionColumns}
        tableClassName="admin-table--crawling-motion"
      />

      {contactModalRow && (
        <Modal open onClose={closeContactModal} ariaLabel="연락처 변경" variant="option">
          <Modal.Header>
            <Modal.Title>연락처 변경</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="admin-modal-field-grid">
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">현재 연락처</span>
                <span className="admin-modal-field-value">{contactModalRow.storefarm.phone}</span>
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">변경 연락처</span>
                <input
                  id="motion-contact-new"
                  type="tel"
                  className="admin-modal-field-control"
                  value={contactDraft}
                  onChange={(e) => setContactDraft(e.target.value)}
                  placeholder="010-0000-0000"
                  autoComplete="tel"
                  aria-label="변경 연락처"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="admin-modal__btn admin-modal__btn--ghost" onClick={closeContactModal}>
              닫기
            </button>
            <button
              type="button"
              className="admin-modal__btn admin-modal__btn--primary"
              onClick={saveContact}
              disabled={!contactDraft.trim()}
            >
              변경 저장
            </button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
}
