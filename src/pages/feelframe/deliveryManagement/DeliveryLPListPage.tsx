import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import {
  getVisiblePageNumbers,
  jumpPageBack,
  jumpPageForward,
  PAGINATION_JUMP_PAGES,
} from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_LP_DELIVERY_LIST,
  type FeelframeDeliveryLpListRow,
} from './mock/deliveryLpList.mock';
import type { FeelframeDeliveryOrderMemoEntry } from './mock/deliveryOrder.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const LP_PROGRESS_OPTIONS = ['전체', '배송전', '배송중', '수령완료'] as const;

const LP_DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '이메일', label: '이메일' },
  { value: '전화번호', label: '전화번호' },
  { value: '주문번호', label: '주문번호' },
  { value: '상품명', label: '상품명' },
] as const;

type LpDetailType = (typeof LP_DETAIL_SEARCH_OPTIONS)[number]['value'];

const CURRENT_LOGIN_AUTHOR = '관리자';
const ITEMS_PER_PAGE = 10;

type AppliedLpSearch = {
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: LpDetailType;
  keyword: string;
  progress: (typeof LP_PROGRESS_OPTIONS)[number];
};

type AppliedChipKey = 'date' | 'keyword' | 'progress';

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

function isAppliedLpSearchEmpty(s: AppliedLpSearch): boolean {
  return !s.startDate && !s.endDate && !s.keyword.trim() && s.progress === '전체';
}

function applyLpFilters(rows: FeelframeDeliveryLpListRow[], search: AppliedLpSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();

  return rows.filter((row) => {
    if (search.progress !== '전체' && row.lpStatus !== search.progress) {
      return false;
    }

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
      const fieldMap = {
        이름: row.customerName,
        이메일: row.customerEmail,
        전화번호: row.customerPhone,
        주문번호: row.orderNo,
        상품명: row.productName,
      } as const;

      if (search.detailSearchType === '전체') {
        const haystack = [
          row.customerName,
          row.customerEmail,
          row.customerPhone,
          row.orderNo,
          row.productName,
          row.optionLabel,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      } else {
        const target = fieldMap[search.detailSearchType].toLowerCase();
        if (!target.includes(keyword)) return false;
      }
    }

    return true;
  });
}

export default function FeelframeDeliveryLPListPage() {
  const [rows, setRows] = useState<FeelframeDeliveryLpListRow[]>(() => [...MOCK_FEELFRAME_LP_DELIVERY_LIST]);
  const [lpDateRange, setLpDateRange] = useState('');
  const [lpStartDate, setLpStartDate] = useState<Date | null>(null);
  const [lpEndDate, setLpEndDate] = useState<Date | null>(null);
  const [lpProgress, setLpProgress] = useState<(typeof LP_PROGRESS_OPTIONS)[number]>('전체');
  const [lpDetailType, setLpDetailType] = useState<LpDetailType>('전체');
  const [lpKeyword, setLpKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedLpSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [memoModalRowId, setMemoModalRowId] = useState<string | null>(null);
  const [memoTooltipRowId, setMemoTooltipRowId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [memoInput, setMemoInput] = useState('');

  const filteredRows = useMemo(() => applyLpFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleLpListSearch = () => {
    const hasFilter = lpStartDate || lpEndDate || lpKeyword.trim() || lpProgress !== '전체';

    if (!hasFilter) {
      setAppliedSearch(null);
      setCurrentPage(1);
      return;
    }

    setAppliedSearch({
      startDate: lpStartDate,
      endDate: lpEndDate,
      detailSearchType: lpDetailType,
      keyword: lpKeyword,
      progress: lpProgress,
    });
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    switch (key) {
      case 'date':
        setLpDateRange('');
        setLpStartDate(null);
        setLpEndDate(null);
        next.startDate = null;
        next.endDate = null;
        break;
      case 'keyword':
        setLpKeyword('');
        setLpDetailType('전체');
        next.keyword = '';
        next.detailSearchType = '전체';
        break;
      case 'progress':
        setLpProgress('전체');
        next.progress = '전체';
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedLpSearchEmpty(next) ? null : next);
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
    if (appliedSearch.progress !== '전체') {
      chips.push({ key: 'progress', label: `진행현황: ${appliedSearch.progress}` });
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
      prev.map((row) => (row.id === rowId ? { ...row, memo: [...row.memo, nextMemo] } : row))
    );
    setMemoInput('');
  };

  const deleteMemo = (rowId: string, memoId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId ? { ...row, memo: row.memo.filter((m) => m.id !== memoId) } : row
      )
    );
  };

  const confirmReceipt = (rowId: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? { ...row, receiptConfirmed: true, lpStatus: '수령완료' as const }
          : row
      )
    );
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">LP 배송관리</h1>

      <section className="admin-list-box" aria-label="LP 배송 검색 필터">
        <div className="filter-top-row admin-filter-row--equal-4">
          <div className="filter-section">
            <span className="filter-label">기간</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="기간 프리셋"
                className="listselect--date-range"
                value={lpDateRange}
                onChange={(next) => {
                  if (!next) {
                    setLpDateRange('');
                    setLpStartDate(null);
                    setLpEndDate(null);
                    return;
                  }
                  setLpDateRange(next);
                  const { start, end } = getDateRangeByPreset(next);
                  setLpStartDate(start);
                  setLpEndDate(end);
                }}
                options={[{ value: '', label: '미선택' }, ...DATE_RANGES.map((range) => ({ value: range, label: range }))]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={lpStartDate}
                  onChange={(date: Date | null) => {
                    setLpStartDate(date);
                    setLpDateRange('');
                  }}
                  selectsStart
                  startDate={lpStartDate}
                  endDate={lpEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!lpStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={lpEndDate}
                  onChange={(date: Date | null) => {
                    setLpEndDate(date);
                    setLpDateRange('');
                  }}
                  selectsEnd
                  startDate={lpStartDate}
                  endDate={lpEndDate}
                  minDate={lpStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!lpEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">진행현황</span>
            <ListSelect
              ariaLabel="진행현황"
              value={lpProgress}
              onChange={(next) => setLpProgress(next as (typeof LP_PROGRESS_OPTIONS)[number])}
              options={LP_PROGRESS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={lpDetailType}
                onChange={(next) => setLpDetailType(next as LpDetailType)}
                options={[...LP_DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={lpKeyword}
                onChange={(e) => setLpKeyword(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleLpListSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="LP 배송 목록">
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
          <table className="admin-table admin-table--feelframe-lp-delivery">
            <thead>
              <tr>
                <th className="col-center">메모</th>
                <th>주문일</th>
                <th>주문번호</th>
                <th>고객정보</th>
                <th>상품명/옵션</th>
                <th className="col-center">수량</th>
                <th>배송현황</th>
                <th className="col-center">수령확인</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
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
                    <td>{row.orderedAt}</td>
                    <td>{row.orderNo}</td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.customerName}</span>
                        <span className="cell-line">{row.customerPhone}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.productName}</span>
                        <span className="cell-line admin-list-muted">{row.optionLabel}</span>
                      </div>
                    </td>
                    <td className="col-center">{row.quantity}</td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.carrier || '—'}</span>
                        <span className="cell-line">{row.trackingNo ?? '—'}</span>
                      </div>
                    </td>
                    <td className="col-center">
                      {row.receiptConfirmed ? (
                        <span className="row-btn row-btn--green" aria-label="수령 완료">
                          수령완료
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="row-btn row-btn--primary"
                          onClick={() => confirmReceipt(row.id)}
                        >
                          확인
                        </button>
                      )}
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
              <button
                type="button"
                onClick={() => setCurrentPage((p) => jumpPageBack(p))}
                disabled={currentPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
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
                <button
                  key={page}
                  type="button"
                  className={currentPage === page ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
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
              <button
                type="button"
                onClick={() => setCurrentPage((p) => jumpPageForward(p, totalPages))}
                disabled={currentPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {memoModalRowId &&
        (() => {
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

      {memoTooltipRowId &&
        memoTooltipPosition &&
        (() => {
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
    </div>
  );
}
