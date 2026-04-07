import { useCallback, useState } from 'react';
import Confirm from '../../../components/Confirm';
import CrawlingListTemplate, {
  type CrawlingAppliedSearch,
  type CrawlingColumnDef,
} from './CrawlingListTemplate';
import {
  MOCK_STOREFARM_VIDEO_ROWS,
  VIDEO_SEARCH_SCOPE_OPTIONS,
  type StorefarmVideoRow,
} from './mock/storefarmCrawling.mock';

function getVideoRowDate(row: StorefarmVideoRow) {
  return new Date(row.orderDate.replace(' ', 'T'));
}

function matchVideoKeyword(row: StorefarmVideoRow, scope: string, keywordTrim: string) {
  if (!keywordTrim) return true;
  const haystack = [
    row.name,
    row.userId,
    row.phone,
    row.paymentStatus,
    row.orderProduct,
    row.makerService,
  ]
    .join(' ')
    .toLowerCase();
  if (scope === 'all') return haystack.includes(keywordTrim);
  const field: Record<string, string> = {
    name: row.name,
    userId: row.userId,
    phone: row.phone,
    paymentStatus: row.paymentStatus,
    orderProduct: row.orderProduct,
    makerService: row.makerService,
  };
  const val = field[scope];
  return val ? val.toLowerCase().includes(keywordTrim) : haystack.includes(keywordTrim);
}

type PaymentConfirmState = {
  rowId: string;
  message: string;
};

export default function StorefarmVideoPage() {
  const [rows, setRows] = useState<StorefarmVideoRow[]>(() => [...MOCK_STOREFARM_VIDEO_ROWS]);
  const [paymentConfirm, setPaymentConfirm] = useState<PaymentConfirmState | null>(null);

  const handlePaymentToggle = (row: StorefarmVideoRow) => {
    const isPaid = row.paymentStatus === '결제완료';
    setPaymentConfirm({
      rowId: row.id,
      message: isPaid ? '결제를 취소하시겠습니까?' : '결제완료 처리 하시겠습니까?',
    });
  };

  const closePaymentConfirm = () => setPaymentConfirm(null);

  const confirmPaymentToggle = () => {
    if (!paymentConfirm) return;
    setRows((prev) =>
      prev.map((item) =>
        item.id === paymentConfirm.rowId
          ? {
              ...item,
              paymentStatus: item.paymentStatus === '결제완료' ? '미결제' : '결제완료',
            }
          : item
      )
    );
    setPaymentConfirm(null);
  };

  const videoColumns: CrawlingColumnDef<StorefarmVideoRow>[] = [
    { header: '주문일', render: (r) => r.orderDate },
    { header: '이름', render: (r) => r.name },
    { header: '아이디', render: (r) => r.userId },
    { header: '전화번호', render: (r) => r.phone },
    {
      header: '결제현황',
      render: (r) => {
        const isPaid = r.paymentStatus === '결제완료';
        return (
          <button
            type="button"
            className={['row-btn', isPaid ? 'row-btn--status-secondary' : 'row-btn--status-warning'].join(' ')}
            onClick={() => handlePaymentToggle(r)}
          >
            <span className={['progress-status', isPaid ? 'progress-status--secondary' : 'progress-status--warning'].join(' ')}>
              <span className="progress-status__dot" aria-hidden="true" />
              <span className="progress-status__text">{r.paymentStatus}</span>
            </span>
          </button>
        );
      },
    },
    { header: '주문상품', render: (r) => <span className="admin-table-col-title">{r.orderProduct}</span> },
    { header: '메이커서비스', render: (r) => r.makerService },
  ];

  const applyVideoDetailFilters = useCallback((row: StorefarmVideoRow, applied: CrawlingAppliedSearch) => {
    if (applied.paymentStatusDetail && applied.paymentStatusDetail !== 'all') {
      if (row.paymentStatus !== applied.paymentStatusDetail) return false;
    }
    if (applied.makerServiceDetail && applied.makerServiceDetail !== 'all') {
      if (row.makerService !== applied.makerServiceDetail) return false;
    }
    return true;
  }, []);

  return (
    <>
      <CrawlingListTemplate<StorefarmVideoRow>
        pageTitle="스팜 영상"
        initialRows={rows}
        dateLabel="주문일"
        dateChipPrefix="주문일"
        searchScopeOptions={VIDEO_SEARCH_SCOPE_OPTIONS}
        getRowDate={getVideoRowDate}
        matchKeyword={matchVideoKeyword}
        columns={videoColumns}
        tableClassName="admin-table--crawling-video"
        enableDetailSearch
        applyDetailFilters={applyVideoDetailFilters}
      />

      <Confirm
        open={!!paymentConfirm}
        title="결제현황"
        message={paymentConfirm?.message ?? ''}
        onClose={closePaymentConfirm}
        onConfirm={confirmPaymentToggle}
      />
    </>
  );
}
