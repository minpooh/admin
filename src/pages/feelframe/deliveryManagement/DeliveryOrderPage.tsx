import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_DELIVERY_ORDER_LIST,
  type FeelframeDeliveryOrderMemoEntry,
  type FeelframeDeliveryOrderRow,
  type FeelframeDeliveryOrderStatus,
} from './mock/deliveryOrder.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;
const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '이메일', label: '이메일' },
  { value: '전화번호', label: '전화번호' },
  { value: '주문번호', label: '주문번호' },
  { value: '상품명', label: '상품명' },
] as const;
const CURRENT_LOGIN_AUTHOR = '관리자';
const ITEMS_PER_PAGE = 10;

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

function getNextDeliveryOrderStatus(status: FeelframeDeliveryOrderStatus): FeelframeDeliveryOrderStatus {
  return status === '발주전' ? '발주완료' : '발주전';
}

function getDeliveryOrderStatusButtonClassName(status: FeelframeDeliveryOrderStatus) {
  if (status === '발주완료') return 'row-btn row-btn--status-secondary';
  return 'row-btn row-btn--status-warning';
}

function getDeliveryOrderProgressClassName(status: FeelframeDeliveryOrderStatus) {
  if (status === '발주완료') return 'progress-status progress-status--secondary';
  return 'progress-status progress-status--warning';
}

type AppliedChipKey = 'date' | 'keyword';

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmdToDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

type AppliedSearch = {
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];
  keyword: string;
};

function isAppliedSearchEmpty(s: AppliedSearch): boolean {
  return !s.startDate && !s.endDate && !s.keyword.trim();
}

function applyFilters(rows: FeelframeDeliveryOrderRow[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    if (search.startDate || search.endDate) {
      const ordered = new Date(row.orderedAt.replace(' ', 'T'));
      if (Number.isNaN(ordered.getTime())) return false;
      if (search.startDate) {
        const start = new Date(search.startDate);
        start.setHours(0, 0, 0, 0);
        if (ordered < start) return false;
      }
      if (search.endDate) {
        const end = new Date(search.endDate);
        end.setHours(23, 59, 59, 999);
        if (ordered > end) return false;
      }
    }

    if (keyword) {
      const allMap = {
        이름: row.customerName,
        이메일: row.customerEmail,
        전화번호: row.customerPhone,
        주문번호: row.orderNo,
        상품명: row.productInfo,
      } as const;

      if (search.detailSearchType === '전체') {
        const haystack = Object.values(allMap).join(' ').toLowerCase();
        if (!haystack.includes(keyword)) return false;
      } else {
        const target = allMap[search.detailSearchType].toLowerCase();
        if (!target.includes(keyword)) return false;
      }
    }

    return true;
  });
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

function formatDateTimeNow() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export default function FeelframeDeliveryOrderPage() {
  const [rows, setRows] = useState<FeelframeDeliveryOrderRow[]>(() => [...MOCK_FEELFRAME_DELIVERY_ORDER_LIST]);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [detailSearchType, setDetailSearchType] = useState<(typeof DETAIL_SEARCH_OPTIONS)[number]['value']>('전체');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [memoModalRowId, setMemoModalRowId] = useState<string | null>(null);
  const [memoTooltipRowId, setMemoTooltipRowId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [memoInput, setMemoInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [expectedDateEditingRowId, setExpectedDateEditingRowId] = useState<string | null>(null);
  const [expectedDateDraft, setExpectedDateDraft] = useState<Date | null>(null);

  const filteredRows = useMemo(() => applyFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!expectedDateEditingRowId) return;
    const row = rows.find((r) => r.id === expectedDateEditingRowId);
    if (!row || row.orderStatus !== '발주완료') {
      setExpectedDateEditingRowId(null);
      setExpectedDateDraft(null);
    }
  }, [rows, expectedDateEditingRowId]);

  const closeConfirmDialog = () => setConfirmDialog(null);

  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const openOrderStatusChangeConfirm = (rowId: string) => {
    setConfirmDialog({
      message: '상태를 변경하시겠습니까?',
      onConfirm: () => {
        setRows((prev) =>
          prev.map((row) => {
            if (row.id !== rowId) return row;
            const nextStatus = getNextDeliveryOrderStatus(row.orderStatus);
            let nextExpected = row.expectedOrderAt;
            if (nextStatus === '발주전') nextExpected = null;
            else if (nextStatus === '발주완료' && row.orderStatus === '발주전') nextExpected = null;
            // eslint-disable-next-line no-console
            console.log('[DeliveryOrder] API: PATCH orderStatus', {
              rowId,
              orderStatus: nextStatus,
              expectedOrderAt: nextExpected,
            });
            return { ...row, orderStatus: nextStatus, expectedOrderAt: nextExpected };
          })
        );
      },
    });
  };

  const openExpectedDateEditor = (row: FeelframeDeliveryOrderRow) => {
    setExpectedDateEditingRowId(row.id);
    setExpectedDateDraft(parseYmdToDate(row.expectedOrderAt) ?? new Date());
  };

  const cancelExpectedDateEditor = () => {
    setExpectedDateEditingRowId(null);
    setExpectedDateDraft(null);
  };

  const saveExpectedOrderDate = (rowId: string) => {
    if (!expectedDateDraft) return;
    const ymd = formatYmd(expectedDateDraft);
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, expectedOrderAt: ymd } : row))
    );
    // eslint-disable-next-line no-console
    console.log('[DeliveryOrder] API: PATCH expectedOrderAt', { rowId, expectedOrderAt: ymd });
    cancelExpectedDateEditor();
  };

  const handleSearch = () => {
    const hasFilter = startDate || endDate || keyword.trim();
    if (!hasFilter) {
      setAppliedSearch(null);
      setCurrentPage(1);
      return;
    }
    setAppliedSearch({
      startDate,
      endDate,
      detailSearchType,
      keyword,
    });
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
        next.startDate = null;
        next.endDate = null;
        break;
      case 'keyword':
        setKeyword('');
        setDetailSearchType('전체');
        next.keyword = '';
        next.detailSearchType = '전체';
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
      const s = formatYmd(appliedSearch.startDate);
      const e = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `기간: ${s}${s && e ? ' ~ ' : ''}${e}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    return chips;
  }, [appliedSearch]);

  const updateMemoTooltipPosition = () => {
    const anchorElement = memoTooltipAnchorRef.current;
    if (!anchorElement) return;
    const rect = anchorElement.getBoundingClientRect();
    const viewportMargin = 12;
    setMemoTooltipPosition({
      top: rect.bottom + 8,
      right: Math.max(viewportMargin, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!memoTooltipRowId) return;
    updateMemoTooltipPosition();
    window.addEventListener('scroll', updateMemoTooltipPosition, true);
    window.addEventListener('resize', updateMemoTooltipPosition);
    return () => {
      window.removeEventListener('scroll', updateMemoTooltipPosition, true);
      window.removeEventListener('resize', updateMemoTooltipPosition);
    };
  }, [memoTooltipRowId]);

  const showMemoTooltip = (rowId: string, triggerElement: HTMLElement) => {
    memoTooltipAnchorRef.current = triggerElement;
    setMemoTooltipRowId(rowId);
  };

  const hideMemoTooltip = () => {
    setMemoTooltipRowId(null);
    setMemoTooltipPosition(null);
    memoTooltipAnchorRef.current = null;
  };

  const closeMemoModal = () => {
    setMemoModalRowId(null);
    setMemoInput('');
  };

  const openMemoModal = (rowId: string) => {
    setMemoModalRowId(rowId);
    setMemoInput('');
  };

  const addMemo = (rowId: string) => {
    const content = memoInput.trim();
    if (!content) return;

    const nextMemo: FeelframeDeliveryOrderMemoEntry = {
      id: `memo-${Date.now()}`,
      author: CURRENT_LOGIN_AUTHOR,
      content,
      createdAt: formatDateTimeNow(),
    };

    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, memo: [...row.memo, nextMemo] } : row
      )
    );
    setMemoInput('');
  };

  const deleteMemo = (rowId: string, memoId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, memo: row.memo.filter((memo) => memo.id !== memoId) } : row
      )
    );
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">발주관리</h1>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row admin-filter-row--equal-3">
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
                <span className="range-sep">~</span>
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
              <input type="text" placeholder="검색어 입력" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="발주관리 목록">
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
          <table className="admin-table">
            <thead>
              <tr>
                <th>주문일</th>
                <th>주문번호</th>
                <th>주문자정보</th>
                <th>상품명/옵션</th>
                <th className="col-center">수량</th>
                <th className="col-center">배송</th>
                <th className="col-center">구매금액</th>
                <th className="col-center">메모</th>
                <th className="col-center">발주현황</th>
                <th>발주예상일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.orderedAt}</td>
                    <td>{row.orderNo}</td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.customerName}</span>
                        <span className="cell-line">{row.customerPhone}</span>
                      </div>
                    </td>
                    <td>{row.productInfo}</td>
                    <td className="col-center">{row.quantity}</td>
                    <td className="col-center">
                      <span className="badge-square badge-square--inline badge-square--no-transition badge-square--private" aria-hidden="true">{row.shipping}</span>
                    </td>
                    <td className="col-center">{row.paymentAmount.toLocaleString()}원</td>
                    <td className="col-center">
                      <div
                        className="admin-memo-trigger"
                        onMouseEnter={(e) => {
                          if (row.memo.length === 0) return;
                          showMemoTooltip(row.id, e.currentTarget);
                        }}
                        onMouseLeave={hideMemoTooltip}
                        onFocus={(e) => {
                          if (row.memo.length === 0) return;
                          showMemoTooltip(row.id, e.currentTarget);
                        }}
                        onBlur={hideMemoTooltip}
                      >
                        <button
                          type="button"
                          className={`row-btn ${row.memo.length > 0 ? 'row-btn--blue' : 'row-btn--default'}`}
                          onClick={() => openMemoModal(row.id)}
                        >
                          {row.memo.length > 0 ? '메모 확인' : '메모 작성'}
                        </button>
                      </div>
                    </td>
                    <td className="col-center">
                      <div className="cell-block">
                        <button
                          type="button"
                          className={getDeliveryOrderStatusButtonClassName(row.orderStatus)}
                          onClick={() => openOrderStatusChangeConfirm(row.id)}
                        >
                          <span className={getDeliveryOrderProgressClassName(row.orderStatus)}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{row.orderStatus}</span>
                          </span>
                        </button>
                      </div>
                    </td>
                    <td>
                      {row.orderStatus === '발주전' && <span className="cell-line">—</span>}
                      {row.orderStatus === '발주완료' &&
                        (expectedDateEditingRowId === row.id ? (
                          <div className="cell-block cell-block--inline-field">
                            <div className="date-range-wrap">
                              <div className="date-range-pickers">
                                <DatePicker
                                  selected={expectedDateDraft}
                                  onChange={(date: Date | null) => setExpectedDateDraft(date)}
                                  placeholderText="날짜 선택"
                                  dateFormat="yyyy-MM-dd"
                                  locale={ko}
                                  className="date-picker-input input--table"
                                  showMonthDropdown
                                  showYearDropdown
                                  dropdownMode="scroll"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              className="row-btn row-btn--default"
                              onClick={cancelExpectedDateEditor}
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              className="row-btn row-btn--primary"
                              onClick={() => saveExpectedOrderDate(row.id)}
                              disabled={!expectedDateDraft}
                            >
                              확인
                            </button>
                          </div>
                        ) : (
                          <div className="cell-block cell-block--inline-field">
                            {row.expectedOrderAt ? <span className="cell-line">{row.expectedOrderAt}</span> : null}
                            <button
                              type="button"
                              className={`row-btn ${row.expectedOrderAt ? 'row-btn--blue' : 'row-btn--default'}`}
                              onClick={() => openExpectedDateEditor(row)}
                            >
                              {row.expectedOrderAt ? '날짜 변경' : '날짜 입력'}
                            </button>
                          </div>
                        ))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button type="button" onClick={() => setCurrentPage((p) => jumpPageBack(p))} disabled={currentPage <= 1} aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}>
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
              {getVisiblePageNumbers(totalPages, currentPage).map((page) => (
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
              <button type="button" onClick={() => setCurrentPage((p) => jumpPageForward(p, totalPages))} disabled={currentPage >= totalPages} aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}>
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {memoModalRowId && (() => {
        const row = rows.find((item) => item.id === memoModalRowId);
        if (!row) return null;

        return (
          <Modal open onClose={closeMemoModal} ariaLabel="메모 관리" variant="option">
            <Modal.Header>
              <Modal.Title>메모 관리</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="admin-modal-field-grid">
                <div className="admin-modal-field-row admin-memo-modal__field-row">
                  <span className="admin-modal-field-label">메모내용</span>
                  <textarea
                    className="admin-modal-field-control admin-memo-modal__textarea"
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    placeholder="메모를 입력해주세요."
                    rows={3}
                  />
                </div>
              </div>

              <div className="admin-memo-history">
                <p className="admin-memo-history__title">지난 메모</p>
                {row.memo.length === 0 ? (
                  <p className="admin-memo-history__empty">등록된 메모가 없습니다.</p>
                ) : (
                  <ul className="admin-memo-history__list">
                    {[...row.memo].reverse().map((memo) => (
                      <li key={memo.id} className="admin-memo-history__item">
                        <div className="admin-memo-history__meta">
                          <span>{memo.author}</span>
                          <span>{memo.createdAt}</span>
                        </div>
                        <p className="admin-memo-history__content">{memo.content}</p>
                        <div className="admin-memo-history__actions">
                          <button
                            type="button"
                            className="row-btn row-btn--red"
                            onClick={() => deleteMemo(row.id, memo.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeMemoModal}>
                닫기
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => addMemo(row.id)}
              >
                메모 저장
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {memoTooltipRowId && memoTooltipPosition && (() => {
        const row = rows.find((item) => item.id === memoTooltipRowId);
        if (!row || row.memo.length === 0) return null;

        return createPortal(
          <div
            className="admin-memo-floating-tooltip"
            role="tooltip"
            style={{ top: memoTooltipPosition.top, right: memoTooltipPosition.right }}
          >
            <ul className="admin-memo-history__list">
              {[...row.memo].reverse().map((memo) => (
                <li key={memo.id} className="admin-memo-history__item">
                  <div className="admin-memo-history__meta">
                    <span>{memo.author}</span>
                    <span>{memo.createdAt}</span>
                  </div>
                  <p className="admin-memo-history__content">{memo.content}</p>
                </li>
              ))}
            </ul>
          </div>,
          document.body
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
