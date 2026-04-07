import { useEffect, useMemo, useState, type ReactNode } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';

export type CrawlingAppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: string;
  keyword: string;
  /** 상세검색: 결제현황 (페이지별 옵션 정의) */
  paymentStatusDetail?: string;
  /** 상세검색: 메이커서비스/옵션 등 (페이지별 라벨 정의) */
  makerServiceDetail?: string;
  /** 상세검색: 카테고리별 (선택 페이지만 사용) */
  categoryDetail?: string;
};

type AppliedChipKey = 'date' | 'keyword' | 'paymentDetail' | 'makerDetail' | 'categoryDetail';
type DetailOption = { value: string; label: string };

const ITEMS_PER_PAGE = 10;

function formatYmd(d: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isAppliedSearchEmpty(s: CrawlingAppliedSearch, detailSearchEnabled: boolean) {
  const noDate = !s.dateRange && s.startDate == null && s.endDate == null;
  const noKeyword = !s.keyword.trim();
  if (!detailSearchEnabled) return noDate && noKeyword;
  const noDetail =
    (!s.paymentStatusDetail || s.paymentStatusDetail === 'all') &&
    (!s.makerServiceDetail || s.makerServiceDetail === 'all') &&
    (!s.categoryDetail || s.categoryDetail === 'all');
  return noDate && noKeyword && noDetail;
}

export type CrawlingColumnDef<T> = {
  header: string;
  render: (row: T) => ReactNode;
  /** th·td 공통 (예: adminListPage.css 의 col-center) */
  columnClassName?: string;
};

export type CrawlingListTemplateProps<T extends { id: string }> = {
  pageTitle: string;
  initialRows: T[];
  /** 필터 영역 날짜 라벨 (예: 주문일, 크롤일시) */
  dateLabel: string;
  /** 적용 필터 칩에 쓰는 접두어 */
  dateChipPrefix: string;
  searchScopeOptions: { value: string; label: string }[];
  getRowDate: (row: T) => Date;
  matchKeyword: (row: T, scope: string, keywordTrim: string) => boolean;
  columns: CrawlingColumnDef<T>[];
  /** 테이블에 추가 클래스 (크롤링 목록 전용 컬럼 너비 등) */
  tableClassName?: string;
  /** 상세검색(토글·결제·메이커서비스 등) — 스팜 영상 등 */
  enableDetailSearch?: boolean;
  /** 상세검색 조건을 행에 적용 (applied 에 paymentStatusDetail / makerServiceDetail 포함) */
  applyDetailFilters?: (row: T, applied: CrawlingAppliedSearch) => boolean;
  detailPaymentLabel?: string;
  detailPaymentOptions?: DetailOption[];
  detailSecondaryLabel?: string;
  detailSecondaryOptions?: DetailOption[];
  showCategoryDetail?: boolean;
  detailCategoryLabel?: string;
  detailCategoryOptions?: DetailOption[];
};

export default function CrawlingListTemplate<T extends { id: string }>({
  pageTitle,
  initialRows,
  dateLabel,
  dateChipPrefix,
  searchScopeOptions,
  getRowDate,
  matchKeyword,
  columns,
  tableClassName,
  enableDetailSearch = false,
  applyDetailFilters,
  detailPaymentLabel = '결제현황',
  detailPaymentOptions = [
    { value: 'all', label: '전체' },
    { value: '결제완료', label: '결제완료' },
    { value: '미결제', label: '미결제' },
  ],
  detailSecondaryLabel = '메이커서비스',
  detailSecondaryOptions = [
    { value: 'all', label: '전체' },
    { value: '추가', label: '추가' },
    { value: '미추가', label: '미추가' },
  ],
  showCategoryDetail = false,
  detailCategoryLabel = '카테고리별',
  detailCategoryOptions = [{ value: 'all', label: '전체' }],
}: CrawlingListTemplateProps<T>) {
  const [rows, setRows] = useState<T[]>(() => [...initialRows]);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState(searchScopeOptions[0]?.value ?? 'all');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<CrawlingAppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [detailPaymentStatus, setDetailPaymentStatus] = useState('all');
  const [detailMakerService, setDetailMakerService] = useState('all');
  const [detailCategory, setDetailCategory] = useState('all');

  useEffect(() => {
    setRows([...initialRows]);
  }, [initialRows]);

  useEffect(() => {
    if (!appliedSearch && enableDetailSearch) {
      setDetailPaymentStatus('all');
      setDetailMakerService('all');
      setDetailCategory('all');
    }
  }, [appliedSearch, enableDetailSearch]);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;

    const keywordTrim = appliedSearch.keyword.trim().toLowerCase();
    const startBoundary = appliedSearch.startDate
      ? new Date(
          appliedSearch.startDate.getFullYear(),
          appliedSearch.startDate.getMonth(),
          appliedSearch.startDate.getDate(),
          0,
          0,
          0,
          0
        )
      : null;
    const endBoundary = appliedSearch.endDate
      ? new Date(
          appliedSearch.endDate.getFullYear(),
          appliedSearch.endDate.getMonth(),
          appliedSearch.endDate.getDate(),
          23,
          59,
          59,
          999
        )
      : null;

    return rows.filter((row) => {
      const createdAt = getRowDate(row);
      if (startBoundary && createdAt < startBoundary) return false;
      if (endBoundary && createdAt > endBoundary) return false;

      if (!startBoundary && !endBoundary && appliedSearch.dateRange) {
        const now = new Date();
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (appliedSearch.dateRange === '당일' && createdAt.toDateString() !== now.toDateString()) return false;
        if (appliedSearch.dateRange === '3일' && !(diffDays >= 0 && diffDays < 3)) return false;
        if (appliedSearch.dateRange === '1주' && !(diffDays >= 0 && diffDays < 7)) return false;
        if (appliedSearch.dateRange === '2주' && !(diffDays >= 0 && diffDays < 14)) return false;
        if (appliedSearch.dateRange === '1개월' && !(diffDays >= 0 && diffDays < 30)) return false;
      }

      if (!matchKeyword(row, appliedSearch.searchScope, keywordTrim)) return false;

      if (enableDetailSearch && applyDetailFilters && !applyDetailFilters(row, appliedSearch)) return false;

      return true;
    });
  }, [rows, appliedSearch, getRowDate, matchKeyword, enableDetailSearch, applyDetailFilters]);

  const resultCount = filteredRows.length;
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

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `${dateChipPrefix}: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `${dateChipPrefix}: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      const scopeLabel =
        searchScopeOptions.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }
    if (enableDetailSearch) {
      if (appliedSearch.paymentStatusDetail && appliedSearch.paymentStatusDetail !== 'all') {
        chips.push({
          key: 'paymentDetail',
          label: `${detailPaymentLabel}: ${appliedSearch.paymentStatusDetail}`,
        });
      }
      if (appliedSearch.makerServiceDetail && appliedSearch.makerServiceDetail !== 'all') {
        chips.push({
          key: 'makerDetail',
          label: `${detailSecondaryLabel}: ${appliedSearch.makerServiceDetail}`,
        });
      }
      if (showCategoryDetail && appliedSearch.categoryDetail && appliedSearch.categoryDetail !== 'all') {
        chips.push({
          key: 'categoryDetail',
          label: `${detailCategoryLabel}: ${appliedSearch.categoryDetail}`,
        });
      }
    }
    return chips;
  }, [appliedSearch, dateChipPrefix, searchScopeOptions, enableDetailSearch, detailPaymentLabel, detailSecondaryLabel, showCategoryDetail, detailCategoryLabel]);

  const handleSearch = () => {
    const next: CrawlingAppliedSearch = {
      dateRange,
      startDate,
      endDate,
      searchScope,
      keyword,
      ...(enableDetailSearch
        ? {
            paymentStatusDetail: detailPaymentStatus,
            makerServiceDetail: detailMakerService,
            categoryDetail: detailCategory,
          }
        : {}),
    };
    setAppliedSearch(isAppliedSearchEmpty(next, enableDetailSearch) ? null : next);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: CrawlingAppliedSearch = { ...appliedSearch };
    if (key === 'date') {
      setDateRange('');
      setStartDate(null);
      setEndDate(null);
      next.dateRange = '';
      next.startDate = null;
      next.endDate = null;
    } else if (key === 'keyword') {
      setKeyword('');
      next.keyword = '';
    } else if (key === 'paymentDetail') {
      setDetailPaymentStatus('all');
      next.paymentStatusDetail = 'all';
    } else if (key === 'makerDetail') {
      setDetailMakerService('all');
      next.makerServiceDetail = 'all';
    } else if (key === 'categoryDetail') {
      setDetailCategory('all');
      next.categoryDetail = 'all';
    }
    setAppliedSearch(isAppliedSearchEmpty(next, enableDetailSearch) ? null : next);
  };

  const colCount = columns.length;

  return (
    <div className="admin-list-page">
      <h1 className="page-title">{pageTitle}</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">검색 결과 {resultCount}건</p>
      </section>

      <section className="admin-list-box">
        <div
          className={
            enableDetailSearch ? 'filter-top-row' : 'filter-top-row admin-filter-row--no-detail'
          }
        >
          <div className="filter-section">
            <span className="filter-label">{dateLabel}</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel={`${dateLabel} 프리셋`}
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
                  const today = new Date();
                  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const start = new Date(end);
                  if (next === '당일') {
                    setStartDate(start);
                    setEndDate(end);
                    return;
                  }
                  if (next === '3일') start.setDate(start.getDate() - 2);
                  if (next === '1주') start.setDate(start.getDate() - 6);
                  if (next === '2주') start.setDate(start.getDate() - 13);
                  if (next === '1개월') start.setDate(start.getDate() - 29);
                  setStartDate(start);
                  setEndDate(end);
                }}
                options={[
                  { value: '', label: '미선택' },
                  { value: '당일', label: '당일' },
                  { value: '3일', label: '3일' },
                  { value: '1주', label: '1주' },
                  { value: '2주', label: '2주' },
                  { value: '1개월', label: '1개월' },
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
                  maxDate={new Date()}
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
                  maxDate={new Date()}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">조건검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="검색 조건"
                className="listselect--condition-type"
                value={searchScope}
                onChange={setSearchScope}
                options={searchScopeOptions}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label={`${pageTitle} 검색`}
              />
            </div>
          </div>

          {enableDetailSearch ? (
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
          ) : (
            <div className="filter-section filter-section--search-btn">
              <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
                검색
              </button>
            </div>
          )}
        </div>

        {enableDetailSearch && (
          <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
            <div className="filter-section">
              <span className="filter-label">{detailPaymentLabel}</span>
              <ListSelect
                ariaLabel={detailPaymentLabel}
                className="listselect--condition-type"
                value={detailPaymentStatus}
                onChange={(next) => setDetailPaymentStatus(next || 'all')}
                options={detailPaymentOptions}
              />
            </div>
            <div className="filter-section">
              <span className="filter-label">{detailSecondaryLabel}</span>
              <ListSelect
                ariaLabel={detailSecondaryLabel}
                className="listselect--condition-type"
                value={detailMakerService}
                onChange={(next) => setDetailMakerService(next || 'all')}
                options={detailSecondaryOptions}
              />
            </div>
            {showCategoryDetail && (
              <div className="filter-section">
                <span className="filter-label">{detailCategoryLabel}</span>
                <ListSelect
                  ariaLabel={detailCategoryLabel}
                  className="listselect--condition-type"
                  value={detailCategory}
                  onChange={(next) => setDetailCategory(next || 'all')}
                  options={detailCategoryOptions}
                />
              </div>
            )}
          </div>
        )}
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label={`${pageTitle} 목록`}>
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
          <table className={['admin-table', tableClassName].filter(Boolean).join(' ')}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={`h-${i}`} className={col.columnClassName}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((col, i) => (
                    <td key={`${row.id}-${i}`} className={col.columnClassName}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={colCount} style={{ textAlign: 'center', padding: '20px' }}>
                    데이터가 없습니다.
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
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                aria-label="마지막 페이지"
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
