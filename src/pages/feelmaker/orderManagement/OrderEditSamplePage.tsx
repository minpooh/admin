import { useEffect, useMemo, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import { Download, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import Alert from '../../../components/Alert';
import { MOCK_SAMPLE_EDIT_ORDERS, type SampleEditItem } from './mock/orderEditSample.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;
const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '아이디', label: '아이디' },
  { value: '전화번호', label: '전화번호' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

type ConditionType = DetailSearchScope;
type AppliedSearch = {
  requestDateRange: string;
  requestStartDate: Date | null;
  requestEndDate: Date | null;
  conditionType: ConditionType;
  keyword: string;
  workStatus: string;
  reviewStatus: string;
};
type AppliedChipKey = 'requestDate' | 'keyword' | 'workStatus' | 'reviewStatus';

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

function parseOrderDate(orderDate: string): Date {
  const dateStr = orderDate.replace(/\/$/, '').trim().slice(0, 19);
  return new Date(dateStr);
}

function isInCustomDateRange(orderDate: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const d = parseOrderDate(orderDate);
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  if (start) {
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
    if (dayStart < s) return false;
  }
  if (end) {
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
    if (dayStart > e) return false;
  }
  return true;
}

function isInPresetDateRange(orderDate: string, dateRange: string): boolean {
  if (!dateRange) return true;
  const date = parseOrderDate(orderDate);
  const now = new Date();
  const sameDay = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (dateRange) {
    case '당일':
      return sameDay;
    case '3일':
      return diffDays >= 0 && diffDays < 3;
    case '1주':
      return diffDays >= 0 && diffDays < 7;
    case '2주':
      return diffDays >= 0 && diffDays < 14;
    case '1개월':
      return diffDays >= 0 && diffDays < 30;
    case '3개월':
      return diffDays >= 0 && diffDays < 90;
    case '6개월':
      return diffDays >= 0 && diffDays < 180;
    default:
      return true;
  }
}

function getStrengthBadgeClass(strength: SampleEditItem['correctionStrength']): string {
  if (strength === '강') return 'badge-square--danger';
  if (strength === '중') return 'badge-square--warning';
  if (strength === '약') return 'badge-square--secondary';
  return 'badge-square--gray';
}

function getProgressVariantClass(progress: string): string {
  if (progress === '고객업로드') return 'progress-status--danger';
  if (progress === '관리자업로드') return 'progress-status--secondary';
  if (progress === '원본업로드') return 'progress-status--blue';
  if (progress === '재수정대기중') return 'progress-status--warning';
  if (progress === '재수정작업중') return 'progress-status--danger';
  return 'progress-status--warning';
}

function getPhotoMenuItemsByProgress(progress: string): string[] {
  if (progress === '관리자업로드' || progress === '원본업로드')
    return ['사진등록', '원본다운로드', '관리자사진다운로드'];
  if (progress === '재수정대기중' || progress === '재수정작업중') {
    return ['사진등록', '원본다운로드', '관리자사진다운로드', '재수정요청다운로드'];
  }
  return ['사진등록', '원본다운로드'];
}

function renderPhotoActionLabel(item: string) {
  if (!item.endsWith('다운로드')) return item;
  const prefix = item.replace(/다운로드$/, '');
  return (
    <span className="row-btn--text-icon__label">
      {prefix}
      <Download size={12} aria-hidden="true" />
    </span>
  );
}

function applyFilters(rows: SampleEditItem[], applied: AppliedSearch | null): SampleEditItem[] {
  if (!applied) return rows;
  const keywordTrim = applied.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    const useCustomRange = applied.requestStartDate != null || applied.requestEndDate != null;
    if (useCustomRange) {
      if (!isInCustomDateRange(row.requestDate, applied.requestStartDate, applied.requestEndDate)) return false;
    } else if (!isInPresetDateRange(row.requestDate, applied.requestDateRange)) {
      return false;
    }

    if (keywordTrim) {
      if (applied.conditionType === '전체') {
        const matchesAny =
          row.customerName.toLowerCase().includes(keywordTrim) ||
          row.customerId.toLowerCase().includes(keywordTrim) ||
          row.customerPhone.toLowerCase().includes(keywordTrim);
        if (!matchesAny) return false;
      }
      if (applied.conditionType === '이름' && !row.customerName.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '아이디' && !row.customerId.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '전화번호' && !row.customerPhone.toLowerCase().includes(keywordTrim)) return false;
    }
    if (applied.workStatus && row.workStatus !== applied.workStatus) return false;
    if (applied.reviewStatus && row.reviewStatus !== applied.reviewStatus) return false;
    return true;
  });
}

export default function OrderEditSamplePage() {
  const [rows, setRows] = useState<SampleEditItem[]>(() => MOCK_SAMPLE_EDIT_ORDERS);
  const [filterExpanded, setFilterExpanded] = useState(false);

  const [requestDateRange, setRequestDateRange] = useState('');
  const [requestStartDate, setRequestStartDate] = useState<Date | null>(null);
  const [requestEndDate, setRequestEndDate] = useState<Date | null>(null);

  const [conditionType, setConditionType] = useState<ConditionType>('전체');
  const [keyword, setKeyword] = useState('');

  const [workStatus, setWorkStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const filteredRows = useMemo(() => applyFilters(rows, appliedSearch), [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);
  useEffect(() => {
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [appliedSearch]);
  useEffect(() => {
    if (currentPage > totalPages) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [currentPage, totalPages]);
  const handleSearch = () => {
    setAppliedSearch({
      requestDateRange,
      requestStartDate,
      requestEndDate,
      conditionType,
      keyword,
      workStatus,
      reviewStatus,
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isAppliedSearchEmpty = (s: AppliedSearch | null) => {
    if (!s) return true;
    return (
      !s.requestDateRange &&
      s.requestStartDate == null &&
      s.requestEndDate == null &&
      !s.keyword.trim() &&
      !s.workStatus &&
      !s.reviewStatus
    );
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: AppliedSearch = { ...appliedSearch };
    switch (key) {
      case 'requestDate':
        setRequestDateRange('');
        setRequestStartDate(null);
        setRequestEndDate(null);
        next.requestDateRange = '';
        next.requestStartDate = null;
        next.requestEndDate = null;
        break;
      case 'keyword':
        setKeyword('');
        next.keyword = '';
        break;
      case 'workStatus':
        setWorkStatus('');
        next.workStatus = '';
        break;
      case 'reviewStatus':
        setReviewStatus('');
        next.reviewStatus = '';
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = (() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.requestStartDate || appliedSearch.requestEndDate) {
      const start = formatYmd(appliedSearch.requestStartDate);
      const end = formatYmd(appliedSearch.requestEndDate);
      chips.push({
        key: 'requestDate',
        label: `요청일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.requestDateRange) {
      chips.push({ key: 'requestDate', label: `요청일: ${appliedSearch.requestDateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.workStatus) {
      chips.push({ key: 'workStatus', label: `제작현황: ${appliedSearch.workStatus}` });
    }
    if (appliedSearch.reviewStatus) {
      chips.push({ key: 'reviewStatus', label: `후기작성: ${appliedSearch.reviewStatus}` });
    }
    return chips;
  })();

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteOrder = (orderId: string) => {
    setConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      danger: true,
      onConfirm: () => {
        setRows((prev) => prev.filter((row) => row.id !== orderId));
      },
    });
  };

  return (
    <div className="admin-list-page admin-list-page--edit-sample">
      <h1 className="page-title">샘플 보정 목록</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">총 {filteredRows.length}개의 샘플 보정이 검색되었습니다.</p>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">요청일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="요청일 프리셋"
                className="listselect--date-range"
                value={requestDateRange}
                onChange={(next) => {
                  if (!next) {
                    setRequestDateRange('');
                    setRequestStartDate(null);
                    setRequestEndDate(null);
                    return;
                  }
                  setRequestDateRange(next);
                }}
                options={[{ value: '', label: '미선택' }, ...DATE_RANGES.map((r) => ({ value: r, label: r }))]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={requestStartDate}
                  onChange={setRequestStartDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!requestStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={requestEndDate}
                  onChange={setRequestEndDate}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!requestEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  minDate={requestStartDate ?? undefined}
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
                value={conditionType}
                onChange={(next) => setConditionType(next as ConditionType)}
                options={[...DETAIL_SEARCH_SCOPE_OPTIONS]}
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
              onClick={() => setFilterExpanded((v) => !v)}
            >
              <span className="detail-search-toggle__text">상세검색</span>
            </button>
          </div>
        </div>

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">제작현황</span>
            <ListSelect
              ariaLabel="제작현황"
              value={workStatus}
              onChange={setWorkStatus}
              options={[
                { value: '', label: '전체보기' },
                { value: '고객업로드', label: '고객업로드' },
                { value: '관리자업로드', label: '관리자업로드' },
                { value: '원본업로드', label: '원본업로드' },
              ]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">후기작성</span>
            <ListSelect
              ariaLabel="후기작성"
              value={reviewStatus}
              onChange={setReviewStatus}
              options={[
                { value: '', label: '전체보기' },
                { value: '작성', label: '작성' },
                { value: '미작성', label: '미작성' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table">
        {appliedChips.length > 0 && (
          <section className="admin-applied-filters">
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
                <th>NO</th>
                <th>진행현황</th>
                <th>이름</th>
                <th>전화번호</th>
                <th>요청일</th>
                <th className="col-center">보정강도</th>
                <th>사진</th>
                <th className="col-center">후기</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const progress = row.workStatus;
                return (
                  <tr key={row.id}>
                    <td>{row.no}</td>
                    <td>
                      <div className={['progress-status', getProgressVariantClass(progress)].join(' ')}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{progress}</span>
                      </div>
                    </td>
                    <td>{row.customerName}</td>
                    <td>{row.customerPhone}</td>
                    <td>{row.requestDate}</td>
                    <td className="col-center">
                      <span
                        className={[
                          'badge-square',
                          'badge-square--inline',
                          'badge-square--no-transition',
                          getStrengthBadgeClass(row.correctionStrength),
                        ].join(' ')}
                      >
                        {row.correctionStrength}
                      </span>
                    </td>
                    <td>
                      <div className="cell-line--with-action">
                        {getPhotoMenuItemsByProgress(row.workStatus).map((item) => (
                          <button
                            key={`${row.id}-${item}`}
                            type="button"
                            className={['row-btn', 'row-btn--text-icon', item === '사진등록' ? 'row-btn--blue' : 'row-btn--default'].join(' ')}
                          >
                            {renderPhotoActionLabel(item)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="col-center">
                      {row.reviewUrl ? (
                        <div className="cell-line--with-action">
                          <button
                            type="button"
                            className="row-btn row-btn--blue"
                            onClick={() => openExternal(row.reviewUrl as string)}
                          >
                            후기
                          </button>
                          {row.originalDeliveryUrl ? (
                            <button
                              type="button"
                              className="row-btn row-btn--secondary"
                              onClick={() => {
                                setAlertMessage('원본이 전달되었습니다.');
                              }}
                            >
                              원본전달
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        ''
                      )}
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--danger"
                        aria-label="삭제"
                        onClick={() => handleDeleteOrder(row.id)}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
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
      <Confirm
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        danger={confirmDialog?.danger}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (!confirmDialog) return;
          confirmDialog.onConfirm();
          setConfirmDialog(null);
        }}
      />
      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
