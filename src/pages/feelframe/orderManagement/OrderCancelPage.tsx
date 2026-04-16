import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_ORDER_LIST,
  type FeelframeOrderListItem,
} from './mock/orderList.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;
const DETAIL_SEARCH_OPTIONS = [
  { value: '이름', label: '이름' },
  { value: '아이디', label: '아이디' },
  { value: '전화번호', label: '전화번호' },
  { value: '주문번호', label: '주문번호' },
] as const;
const CANCEL_STATUS_OPTIONS = ['전체', '취소접수', '취소완료', '반려'] as const;
const PAYMENT_METHOD_OPTIONS = ['전체', '무통장입금', '카드결제', '카카오페이', '네이버페이', '실시간계좌이체'] as const;

type FeelframeOrderCancelStatus = '취소접수' | '취소완료' | '반려';
type FeelframeOrderCancelItem = {
  id: string;
  requestedAt: string;
  orderNo: string;
  orderInfo: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  cancelReason: string;
  paymentNo: string;
  cancelStatus: FeelframeOrderCancelStatus;
  rejectInfo: string;
  bankInfo: string;
  manager: string;
  paymentMethod: (typeof PAYMENT_METHOD_OPTIONS)[number];
};

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];
  keyword: string;
  cancelStatus: string;
  paymentMethod: string;
};

type AppliedChipKey = 'date' | 'keyword' | 'cancelStatus' | 'paymentMethod';

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getDateRangeByPreset(preset: string): { start: Date; end: Date } {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);

  switch (preset) {
    case '당일':
      break;
    case '3일':
      start.setDate(start.getDate() - 2);
      break;
    case '1주':
      start.setDate(start.getDate() - 6);
      break;
    case '2주':
      start.setDate(start.getDate() - 13);
      break;
    case '1개월':
      start.setDate(start.getDate() - 29);
      break;
    case '3개월':
      start.setDate(start.getDate() - 89);
      break;
    case '6개월':
      start.setDate(start.getDate() - 179);
      break;
    default:
      break;
  }

  return { start, end };
}

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return (
    !search.dateRange &&
    search.startDate == null &&
    search.endDate == null &&
    !search.keyword.trim() &&
    search.cancelStatus === '전체' &&
    search.paymentMethod === '전체'
  );
}

function mapOrderToCancelRow(order: FeelframeOrderListItem): FeelframeOrderCancelItem | null {
  if (order.paymentStatus !== '결제취소' && order.paymentStatus !== '환불완료') return null;
  const latestMemo = [...order.memoEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const requestedAt = order.cancelRequestedAt || latestMemo?.createdAt || order.orderedAt;
  const cancelReason = order.cancelReason || latestMemo?.content || '고객 요청 취소';
  const paymentNo = order.paymentNo || order.cashReceiptNo || order.orderNo;
  const bankInfo =
    order.cancelBankInfo ||
    (order.paymentMethod === '무통장입금' && order.depositor ? `무통장입금 (${order.depositor})` : '-');
  const isRejectedCancel = Boolean(order.cancelRejectInfo && order.cancelRejectInfo !== '-');

  return {
    id: order.id,
    requestedAt,
    orderNo: order.orderNo,
    orderInfo: order.orderInfo,
    customerName: order.customerName,
    customerId: order.customerId,
    customerPhone: order.customerPhone,
    cancelReason,
    paymentNo,
    cancelStatus: order.paymentStatus === '환불완료' ? '취소완료' : isRejectedCancel ? '반려' : '취소접수',
    rejectInfo: order.cancelRejectInfo || '-',
    bankInfo,
    manager: order.manager,
    paymentMethod:
      PAYMENT_METHOD_OPTIONS.includes(order.paymentMethod as (typeof PAYMENT_METHOD_OPTIONS)[number])
        ? (order.paymentMethod as (typeof PAYMENT_METHOD_OPTIONS)[number])
        : '전체',
  };
}

function getInitialCancelRows() {
  return MOCK_FEELFRAME_ORDER_LIST.map(mapOrderToCancelRow).filter((row): row is FeelframeOrderCancelItem => row != null);
}

function applyFilters(rows: FeelframeOrderCancelItem[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    if (search.startDate || search.endDate) {
      const requestedDate = new Date(row.requestedAt);
      if (Number.isNaN(requestedDate.getTime())) return false;
      if (search.startDate) {
        const start = new Date(search.startDate);
        start.setHours(0, 0, 0, 0);
        if (requestedDate < start) return false;
      }
      if (search.endDate) {
        const end = new Date(search.endDate);
        end.setHours(23, 59, 59, 999);
        if (requestedDate > end) return false;
      }
    }

    if (keyword) {
      const fieldMap: Record<(typeof DETAIL_SEARCH_OPTIONS)[number]['value'], string> = {
        이름: row.customerName.toLowerCase(),
        아이디: row.customerId.toLowerCase(),
        전화번호: row.customerPhone.toLowerCase(),
        주문번호: row.orderNo.toLowerCase(),
      };
      if (!fieldMap[search.detailSearchType].includes(keyword)) return false;
    }

    if (search.cancelStatus !== '전체' && row.cancelStatus !== search.cancelStatus) return false;
    if (search.paymentMethod !== '전체' && row.paymentMethod !== search.paymentMethod) return false;
    return true;
  });
}

export default function FeelframeOrderCancelPage() {
  const [rows, setRows] = useState<FeelframeOrderCancelItem[]>(() => getInitialCancelRows());
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [detailSearchType, setDetailSearchType] = useState<(typeof DETAIL_SEARCH_OPTIONS)[number]['value']>('이름');
  const [keyword, setKeyword] = useState('');
  const [cancelStatus, setCancelStatus] = useState('전체');
  const [paymentMethod, setPaymentMethod] = useState('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const ITEMS_PER_PAGE = 10;

  const filteredRows = useMemo(() => applyFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      detailSearchType,
      keyword,
      cancelStatus,
      paymentMethod,
    };
    setAppliedSearch(isAppliedSearchEmpty(nextAppliedSearch) ? null : nextAppliedSearch);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    switch (key) {
      case 'date':
        setDateRange('');
        setStartDate(null);
        setEndDate(null);
        next.dateRange = '';
        next.startDate = null;
        next.endDate = null;
        break;
      case 'keyword':
        setKeyword('');
        setDetailSearchType('이름');
        next.keyword = '';
        next.detailSearchType = '이름';
        break;
      case 'cancelStatus':
        setCancelStatus('전체');
        next.cancelStatus = '전체';
        break;
      case 'paymentMethod':
        setPaymentMethod('전체');
        next.paymentMethod = '전체';
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `기간: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `기간: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.cancelStatus !== '전체') {
      chips.push({ key: 'cancelStatus', label: `취소현황: ${appliedSearch.cancelStatus}` });
    }
    if (appliedSearch.paymentMethod !== '전체') {
      chips.push({ key: 'paymentMethod', label: `결제수단: ${appliedSearch.paymentMethod}` });
    }
    return chips;
  }, [appliedSearch]);

  const closeConfirmDialog = () => setConfirmDialog(null);
  const closeCancelModal = () => setCancelModalOrderId(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      title: '취소신청 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setRows((prev) => prev.filter((row) => row.id !== id));
      },
    });
  };

  const getCancelStatusButtonClassName = (status: FeelframeOrderCancelItem['cancelStatus']) => {
    if (status === '취소완료') return 'row-btn row-btn--status-secondary';
    if (status === '반려') return 'row-btn row-btn--status-danger';
    return 'row-btn row-btn--status-warning';
  };

  const getCancelStatusProgressClassName = (status: FeelframeOrderCancelItem['cancelStatus']) => {
    if (status === '취소완료') return 'progress-status progress-status--secondary';
    if (status === '반려') return 'progress-status progress-status--danger';
    return 'progress-status progress-status--warning';
  };

  const approveCancel = (orderId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === orderId
          ? { ...row, cancelStatus: '취소완료', rejectInfo: '-' }
          : row
      )
    );
    setCancelModalOrderId(null);
  };

  const rejectCancel = (orderId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === orderId
          ? { ...row, cancelStatus: '반려', rejectInfo: row.rejectInfo === '-' ? '관리자 반려 처리' : row.rejectInfo }
          : row
      )
    );
    setCancelModalOrderId(null);
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">취소신청 관리</h1>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">기간</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="기간 프리셋"
                className="listselect--date-range"
                value={dateRange}
                onChange={(next) => {
                  if (!next) {
                    setDateRange('');
                    setStartDate(null);
                    setEndDate(null);
                    return;
                  }
                  setDateRange(next);
                  const { start, end } = getDateRangeByPreset(next);
                  setStartDate(start);
                  setEndDate(end);
                }}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => {
                    setStartDate(date);
                    setDateRange('');
                  }}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!startDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    setEndDate(date);
                    setDateRange('');
                  }}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!endDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next as (typeof DETAIL_SEARCH_OPTIONS)[number]['value'])}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
            <button
              type="button"
              className={`detail-search-toggle ${filterExpanded ? 'is-open' : ''}`}
              onClick={() => setFilterExpanded((prev) => !prev)}
            >
              <span className="detail-search-toggle__text">상세검색</span>
              <svg
                className="detail-search-toggle__icon"
                aria-hidden="true"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
              >
                <path
                  d="M4.5 6.75L8 10.25L11.5 6.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">취소현황</span>
            <ListSelect
              ariaLabel="취소현황"
              value={cancelStatus}
              onChange={setCancelStatus}
              options={CANCEL_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">결제수단</span>
            <ListSelect
              ariaLabel="결제수단"
              value={paymentMethod}
              onChange={setPaymentMethod}
              options={PAYMENT_METHOD_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="취소신청 리스트">
        {appliedChips.length > 0 && (
          <section className="admin-applied-filters" aria-label="적용된 검색 조건">
            <div className="admin-applied-filters__left">
              <div className="admin-applied-filters__list">
                {appliedChips.map((chip) => (
                  <div key={chip.key} className="admin-filter-chip">
                    <span className="admin-filter-chip__text">{chip.label}</span>
                    <button
                      type="button"
                      className="admin-filter-chip__x"
                      aria-label={`${chip.label} 해제`}
                      onClick={() => clearAppliedFilter(chip.key)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>주문정보</th>
                <th>고객정보</th>
                <th>결제정보</th>
                <th>취소현황</th>
                <th>반려정보</th>
                <th>계좌정보</th>
                <th>담당자</th>
                <th>상세정보</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.orderNo}</td>
                  <td>{row.orderInfo}</td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{row.customerName}</span>
                      <span className="cell-line">{row.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{row.paymentMethod}</span>
                      <span className="cell-line">{row.paymentNo}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={getCancelStatusButtonClassName(row.cancelStatus)}
                      onClick={() => setCancelModalOrderId(row.id)}
                    >
                      <span className={getCancelStatusProgressClassName(row.cancelStatus)}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{row.cancelStatus}</span>
                      </span>
                    </button>
                  </td>
                  <td>{row.rejectInfo}</td>
                  <td>{row.bankInfo}</td>
                  <td>{row.manager}</td>
                  <td>
                    <button type="button" className="admin-link">
                      상세보기
                    </button>
                  </td>
                  <td>
                    <button type="button" className="row-btn row-btn--red" onClick={() => handleDelete(row.id)}>
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} aria-label="첫 페이지">
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} type="button" className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} aria-label="마지막 페이지">
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {cancelModalOrderId && (() => {
        const row = rows.find((item) => item.id === cancelModalOrderId);
        if (!row) return null;

        return (
          <Modal open onClose={closeCancelModal} ariaLabel="취소현황" variant="option">
            <Modal.Header>
              <Modal.Title>취소현황</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">취소사유</span>
                  <span className="option-modal__status-value">{row.cancelReason}</span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">신청일자</span>
                  <span className="option-modal__status-value">{row.requestedAt}</span>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeCancelModal}>
                닫기
              </button>
              {row.cancelStatus === '취소접수' && (
                <>
                  <button type="button" className="option-modal__btn option-modal__btn--danger" onClick={() => rejectCancel(row.id)}>
                    반려
                  </button>
                  <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => approveCancel(row.id)}>
                    취소승인
                  </button>
                </>
              )}
              {row.cancelStatus === '반려' && (
                <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => approveCancel(row.id)}>
                  취소승인
                </button>
              )}
            </Modal.Footer>
          </Modal>
        );
      })()}

      <Confirm
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        danger={confirmDialog?.danger}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
      />
    </div>
  );
}
