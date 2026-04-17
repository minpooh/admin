import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import {
  MOCK_FEELFRAME_UPLOAD_PHOTO_LIST,
  type FeelframeUploadPhotoCorrectionIntensity,
  type FeelframeUploadPhotoMemoEntry,
  type FeelframeUploadPhotoProgress,
  type FeelframeUploadPhotoRow,
} from './mock/uploadPhoto.mock';

const CURRENT_LOGIN_AUTHOR = '관리자';
const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;
const PROGRESS_FILTER_OPTIONS = [
  '전체',
  '고객업로드',
  '관리자업로드',
  '수정요청',
  '시안확정',
] as const;

const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '이메일', label: '이메일' },
  { value: '전화번호', label: '전화번호' },
  { value: '주문번호', label: '주문번호' },
] as const;

const MANAGER_OPTIONS = [
  { value: '', label: '담당자 선택' },
  { value: '박채은', label: '박채은' },
  { value: '손하준', label: '손하준' },
  { value: '문희수', label: '문희수' },
  { value: '허예진', label: '허예진' },
  { value: '정유진', label: '정유진' },
];

type DetailSearchType = (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];

const ITEMS_PER_PAGE = 10;

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  detailSearchType: DetailSearchType;
  keyword: string;
  progressStatus: string;
};

type AppliedChipKey = 'date' | 'keyword' | 'progress';

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

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return (
    !search.dateRange &&
    search.startDate == null &&
    search.endDate == null &&
    !search.keyword.trim() &&
    search.progressStatus === '전체'
  );
}

function applyFilters(rows: FeelframeUploadPhotoRow[], search: AppliedSearch | null) {
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
      const fieldMap: Record<Exclude<DetailSearchType, '전체'>, string> = {
        이름: row.customerName.toLowerCase(),
        이메일: row.customerEmail.toLowerCase(),
        전화번호: row.customerPhone.toLowerCase(),
        주문번호: row.orderNo.toLowerCase(),
      };
      if (search.detailSearchType === '전체') {
        const haystack = Object.values(fieldMap).join(' ');
        if (!haystack.includes(keyword)) return false;
      } else {
        if (!fieldMap[search.detailSearchType].includes(keyword)) return false;
      }
    }

    if (search.progressStatus !== '전체' && row.progressStatus !== search.progressStatus) return false;
    return true;
  });
}

function getProgressClassName(status: FeelframeUploadPhotoProgress) {
  if (status === '수정요청') return 'progress-status progress-status--danger';
  if (status === '고객업로드') return 'progress-status progress-status--warning';
  if (status === '관리자업로드') return 'progress-status progress-status--blue';
  return 'progress-status progress-status--secondary';
}

function getCorrectionIntensityLabel(intensity: FeelframeUploadPhotoCorrectionIntensity) {
  if (intensity === '강함') return '강';
  if (intensity === '보통') return '중';
  if (intensity === '약함') return '약';
  return '디자이너 임의';
}

function getCorrectionIntensityBadgeClass(label: string) {
  if (label === '강') return 'badge-square badge-square--inline badge-square--no-transition badge-square--strength-strong';
  if (label === '중') return 'badge-square badge-square--inline badge-square--no-transition badge-square--strength-medium';
  if (label === '약') return 'badge-square badge-square--inline badge-square--no-transition badge-square--strength-weak';
  if (label === '디자이너 임의') return 'badge-square badge-square--inline badge-square--no-transition badge-square--strength-designer';
  return '';
}

export default function FeelframeUploadPhotoPage() {
  const [rows, setRows] = useState<FeelframeUploadPhotoRow[]>(() => [...MOCK_FEELFRAME_UPLOAD_PHOTO_LIST]);
  const [dateRange, setDateRange] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [detailSearchType, setDetailSearchType] = useState<DetailSearchType>('전체');
  const [progressStatus, setProgressStatus] = useState('전체');
  const [keyword, setKeyword] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkManager, setBulkManager] = useState('');
  const [memoModalRowId, setMemoModalRowId] = useState<string | null>(null);
  const [memoTooltipRowId, setMemoTooltipRowId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [memoInput, setMemoInput] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const filteredRows = useMemo(() => applyFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const pageIds = paginatedRows.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected, paginatedRows]);

  const selectedCount = selectedIds.size;

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

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

    const nextMemo: FeelframeUploadPhotoMemoEntry = {
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
        row.id === rowId
          ? { ...row, memo: row.memo.filter((memo) => memo.id !== memoId) }
          : row
      )
    );
  };

  const handleSearch = () => {
    const next: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      detailSearchType,
      keyword,
      progressStatus,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
    setSelectedIds(new Set());
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
        setDetailSearchType('전체');
        next.keyword = '';
        next.detailSearchType = '전체';
        break;
      case 'progress':
        setProgressStatus('전체');
        next.progressStatus = '전체';
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const s = formatYmd(appliedSearch.startDate);
      const e = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `기간: ${s}${s && e ? ' ~ ' : ''}${e}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `기간: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.progressStatus !== '전체') {
      chips.push({ key: 'progress', label: `진행현황: ${appliedSearch.progressStatus}` });
    }
    return chips;
  }, [appliedSearch]);

  const handleAssignManager = () => {
    if (selectedIds.size === 0) return;
    const manager = bulkManager.trim();
    if (!manager) {
      window.alert('담당자를 선택해 주세요.');
      return;
    }
    setRows((prev) => prev.map((row) => (selectedIds.has(row.id) ? { ...row, manager } : row)));
    setSelectedIds(new Set());
    setBulkManager('');
  };

  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleDelete = (id: string) => {
    setConfirmDialog({
      title: '보정 업로드 항목 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setRows((prev) => prev.filter((row) => row.id !== id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">보정 업로드</h1>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row admin-filter-row--equal-4">
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
            <div className="filter-label">상세검색</div>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next as DetailSearchType)}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">진행현황</span>
            <ListSelect
              ariaLabel="진행현황"
              value={progressStatus}
              onChange={setProgressStatus}
              options={PROGRESS_FILTER_OPTIONS.map((o) => ({ value: o, label: o }))}
            />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="보정 업로드 목록">
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

        {selectedCount > 0 && (
          <div className="admin-settlement-bulk" aria-live="polite">
            <div className="admin-settlement-bulk__bar">
              <p className="admin-settlement-bulk__summary">
                선택 <strong>{selectedCount}</strong>건
              </p>
              <span style={{ flex: '0 0 auto', fontSize: '0.8125rem', color: '#374151', whiteSpace: 'nowrap' }}>담당자지정</span>
              <div style={{ flex: '0 0 160px', minWidth: 140 }}>
                <ListSelect ariaLabel="담당자 지정" value={bulkManager} onChange={setBulkManager} options={MANAGER_OPTIONS} />
              </div>
              <button type="button" className="filter-btn filter-btn--primary" onClick={handleAssignManager}>
                지정
              </button>
            </div>
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--feelframe-upload-photo">
            <thead>
              <tr>
                <th scope="col" className="admin-table-col-checkbox">
                  <label className="admin-table-checkbox-label">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      className="admin-checkbox"
                      checked={allPageSelected}
                      onChange={togglePage}
                      aria-label="현재 페이지 전체 선택"
                    />
                  </label>
                </th>
                <th>주문번호</th>
                <th>담당자</th>
                <th>상품정보</th>
                <th>고객정보</th>
                <th className="col-center">장수</th>
                <th className="col-center">보정강도</th>
                <th className="col-center">진행현황</th>
                <th className="col-center">최초이미지</th>
                <th className="col-center">업로드</th>
                <th className="col-center">메모</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-table-col-checkbox">
                      <label className="admin-table-checkbox-label">
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`${row.orderNo} 행 선택`}
                        />
                      </label>
                    </td>
                    <td>{row.orderNo}</td>
                    <td>{row.manager}</td>
                    <td>{row.productInfo}</td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.customerName}</span>
                        <span className="cell-line">{row.customerEmail}</span>
                        <span className="cell-line">{row.customerPhone}</span>
                      </div>
                    </td>
                    <td className="col-center">{row.photoCount}</td>
                    <td className="col-center">
                      {(() => {
                        const intensityLabel = getCorrectionIntensityLabel(row.correctionIntensity);
                        return <span className={getCorrectionIntensityBadgeClass(intensityLabel)}>{intensityLabel}</span>;
                      })()}
                    </td>
                    <td className="col-center">
                      <span className={getProgressClassName(row.progressStatus)}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{row.progressStatus}</span>
                      </span>
                      {row.progressStatus === '시안확정' && row.confirmedAt && (
                        <div>{row.confirmedAt}</div>
                      )}
                    </td>
                    <td className="col-center">
                      <button type="button" className="row-btn row-btn--primary" aria-label={`${row.orderNo} 최초이미지 다운로드`}>
                        다운로드
                      </button>
                    </td>
                    <td className="col-center">
                      <button type="button" className="row-btn row-btn--secondary">
                        업로드
                      </button>
                    </td>
                    <td className="col-center">
                      <div
                        className="admin-memo-trigger"
                        onMouseEnter={(e) => { if (row.memo.length === 0) return; showMemoTooltip(row.id, e.currentTarget); }}
                        onMouseLeave={hideMemoTooltip}
                        onFocus={(e) => { if (row.memo.length === 0) return; showMemoTooltip(row.id, e.currentTarget); }}
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
                      <button type="button" className="row-btn row-btn--red" onClick={() => handleDelete(row.id)}>
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '20px' }}>
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
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} aria-label="마지막 페이지">
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
