import { useCallback, useState } from 'react';
import Confirm from '../../../components/Confirm';
import CrawlingListTemplate, {
  type CrawlingAppliedSearch,
  type CrawlingColumnDef,
} from './CrawlingListTemplate';
import {
  MOCK_STOREFARM_CARD_ROWS,
  CARD_SEARCH_SCOPE_OPTIONS,
  type StorefarmCardRow,
} from './mock/storefarmCrawling.mock';

type ConfirmDialogState = {
  message: string;
  onConfirm: () => void;
};

function getInvitationAlias(urlOrDash: string) {
  if (!urlOrDash || urlOrDash === '—') return '—';
  try {
    const parsed = new URL(urlOrDash);
    const segments = parsed.pathname.split('/').filter(Boolean);
    return segments[segments.length - 1] || urlOrDash;
  } catch {
    // 이미 슬러그만 들어온 경우 그대로 사용
    return urlOrDash;
  }
}

function getCardRowDate(row: StorefarmCardRow) {
  return new Date(row.orderDate.replace(' ', 'T'));
}

function matchCardKeyword(row: StorefarmCardRow, scope: string, keywordTrim: string) {
  if (!keywordTrim) return true;
  const haystack = [
    row.category,
    row.name,
    row.userId,
    row.phone,
    row.paymentStatus,
    row.signupStatus,
    row.activeInvitation,
    getInvitationAlias(row.activeInvitation),
    row.option,
  ]
    .join(' ')
    .toLowerCase();
  if (scope === 'all') return haystack.includes(keywordTrim);
  const field: Record<string, string> = {
    category: row.category,
    name: row.name,
    userId: row.userId,
    phone: row.phone,
    paymentStatus: row.paymentStatus,
    signupStatus: row.signupStatus,
    activeInvitation: row.activeInvitation,
    activeInvitationAlias: getInvitationAlias(row.activeInvitation),
    option: row.option,
  };
  const val = field[scope];
  return val ? val.toLowerCase().includes(keywordTrim) : haystack.includes(keywordTrim);
}

const cardColumns: CrawlingColumnDef<StorefarmCardRow>[] = [
  { header: '주문일', render: (r) => r.orderDate },
  { header: '이름', render: (r) => r.name },
  { header: '아이디', render: (r) => r.userId },
  { header: '전화번호', render: (r) => r.phone },
  { header: '가입상태', render: (r) => r.signupStatus },
  {
    header: '사용중청첩장',
    render: (r) =>
      r.activeInvitation === '—' ? (
        <span className="admin-list-muted">—</span>
      ) : (
        <a className="admin-link admin-table-title-link" href={r.activeInvitation} target="_blank" rel="noreferrer">
          {getInvitationAlias(r.activeInvitation)}
        </a>
      ),
  },
  { header: '옵션', render: (r) => r.option },
  {
    header: '취소',
    render: () => null,
  },
];

export default function StorefarmCardPage() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const openConfirmDialog = (config: ConfirmDialogState) => setConfirmDialog(config);
  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const applyCardDetailFilters = useCallback((row: StorefarmCardRow, applied: CrawlingAppliedSearch) => {
    if (applied.categoryDetail && applied.categoryDetail !== 'all' && row.category !== applied.categoryDetail) {
      return false;
    }
    if (applied.paymentStatusDetail && applied.paymentStatusDetail !== 'all' && row.paymentStatus !== applied.paymentStatusDetail) {
      return false;
    }
    if (applied.makerServiceDetail && applied.makerServiceDetail !== 'all' && row.option !== applied.makerServiceDetail) {
      return false;
    }
    return true;
  }, []);

  const columnsWithCancel: CrawlingColumnDef<StorefarmCardRow>[] = [
    ...cardColumns.slice(0, -1),
    {
      header: '취소',
      render: (r) => (
        <button
          type="button"
          className="row-btn row-btn--red"
          onClick={() =>
            openConfirmDialog({
              message: `주문 ${r.id} 건을 취소 처리할까요?`,
              onConfirm: () => {
                /* 목업: API 연동 시 삭제/상태 변경 */
              },
            })
          }
        >
          취소
        </button>
      ),
    },
  ];

  return (
    <>
      <CrawlingListTemplate<StorefarmCardRow>
        pageTitle="스팜 모청"
        initialRows={MOCK_STOREFARM_CARD_ROWS}
        dateLabel="주문일"
        dateChipPrefix="주문일"
        searchScopeOptions={CARD_SEARCH_SCOPE_OPTIONS}
        getRowDate={getCardRowDate}
        matchKeyword={matchCardKeyword}
        columns={columnsWithCancel}
        tableClassName="admin-table--crawling-card"
        enableDetailSearch
        applyDetailFilters={applyCardDetailFilters}
        showCategoryDetail
        detailCategoryLabel="카테고리별"
        detailCategoryOptions={[
          { value: 'all', label: '전체' },
          { value: '웨딩', label: '웨딩' },
          { value: '돌잔치', label: '돌잔치' },
        ]}
        detailPaymentLabel="결제현황"
        detailPaymentOptions={[
          { value: 'all', label: '전체' },
          { value: '결제완료', label: '결제완료' },
          { value: '미결제', label: '미결제' },
        ]}
        detailSecondaryLabel="옵션"
        detailSecondaryOptions={[
          { value: 'all', label: '전체' },
          { value: '선택', label: '선택' },
          { value: '미선택', label: '미선택' },
        ]}
      />

      <Confirm
        open={!!confirmDialog}
        title="주문 취소"
        message={confirmDialog?.message ?? ''}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
        confirmText="확인"
        cancelText="취소"
      />
    </>
  );
}
