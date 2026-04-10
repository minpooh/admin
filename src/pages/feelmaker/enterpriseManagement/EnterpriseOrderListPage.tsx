import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import type { EnterpriseOrderRow } from './mock/enterpriseOrderList.mock';
import { MOCK_ENTERPRISE_ORDERS } from './mock/enterpriseOrderList.mock';

const SEARCH_SCOPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'companyName', label: '업체명' },
  { value: 'depositorName', label: '입금자명' },
];

const COUPON_TYPE_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'photo_edit', label: '사진보정' },
  { value: 'pre_dinner_video', label: '식전영상' },
  { value: 'video_letter', label: '영상편지' },
  { value: 'growth_video', label: '성장영상' },
  { value: 'thanks_video', label: '감사영상' },
  { value: 'invite_video', label: '초대영상' },
  { value: 'event_video', label: '행사영상' },
  { value: 'opening_video', label: '오프닝영상' },
];

const PAGE_SIZE = 10;

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: string;
  keyword: string;
  couponType: string;
};

type AppliedChipKey = 'date' | 'keyword' | 'couponType';

function parseOrderDate(orderDateTime: string): Date {
  return new Date(orderDateTime.replace(' ', 'T'));
}

function formatYmd(d: Date | null): string {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isAppliedSearchEmpty(s: AppliedSearch): boolean {
  const noDate = !s.dateRange && s.startDate == null && s.endDate == null;
  const noKeyword = !s.keyword.trim();
  const noCoupon = !s.couponType;
  return noDate && noKeyword && noCoupon;
}

function couponLabelByValue(value: string): string {
  return COUPON_TYPE_OPTIONS.find((opt) => opt.value === value)?.label ?? '';
}

function paymentStatusButtonClass(status: EnterpriseOrderRow['paymentStatus']): string {
  if (status === 'paid') return 'row-btn row-btn--status-secondary';
  if (status === 'unpaid') return 'row-btn row-btn--status-danger';
  return 'row-btn row-btn--status-warning';
}

function paymentProgressClass(status: EnterpriseOrderRow['paymentStatus']): string {
  if (status === 'paid') return 'progress-status progress-status--secondary';
  if (status === 'unpaid') return 'progress-status progress-status--danger';
  return 'progress-status progress-status--warning';
}

function paymentStatusLabel(status: EnterpriseOrderRow['paymentStatus']): string {
  if (status === 'paid') return '결제완료';
  if (status === 'unpaid') return '미결제';
  return '입금대기';
}

export default function EnterpriseOrderListPage() {
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('');
  const [keyword, setKeyword] = useState('');
  const [couponType, setCouponType] = useState('');
  const [orderRows] = useState<EnterpriseOrderRow[]>(() => [...MOCK_ENTERPRISE_ORDERS]);
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return orderRows;

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

    return orderRows.filter((row) => {
      const orderedAt = parseOrderDate(row.orderedAt);
      if (startBoundary && orderedAt < startBoundary) return false;
      if (endBoundary && orderedAt > endBoundary) return false;

      if (keywordTrim) {
        if (appliedSearch.searchScope === 'companyName' && !row.companyName.toLowerCase().includes(keywordTrim)) {
          return false;
        }
        if (
          appliedSearch.searchScope === 'depositorName' &&
          !row.depositorName.toLowerCase().includes(keywordTrim)
        ) {
          return false;
        }
        if (!appliedSearch.searchScope) {
          if (
            !row.companyName.toLowerCase().includes(keywordTrim) &&
            !row.depositorName.toLowerCase().includes(keywordTrim)
          ) {
            return false;
          }
        }
      }

      if (appliedSearch.couponType) {
        const couponLabel = couponLabelByValue(appliedSearch.couponType);
        if (couponLabel && row.couponKind !== couponLabel) return false;
      }

      return true;
    });
  }, [orderRows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      searchScope,
      keyword,
      couponType,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const activeRows = appliedSearch ? filteredRows : orderRows;
  const totalOrders = activeRows.length;
  const unpaidCount = activeRows.filter((row) => row.paymentStatus === 'unpaid').length;
  const paidAmount = activeRows
    .filter((row) => row.paymentStatus === 'paid')
    .reduce((acc, row) => acc + row.amount, 0);

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];

    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `주문일: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `주문일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      const scopeLabel = SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }

    if (appliedSearch.couponType) {
      chips.push({ key: 'couponType', label: `쿠폰종류: ${couponLabelByValue(appliedSearch.couponType)}` });
    }

    return chips;
  }, [appliedSearch]);

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: AppliedSearch = { ...appliedSearch };
    if (key === 'date') {
      setDateRange('');
      setStartDate(null);
      setEndDate(null);
      next.dateRange = '';
      next.startDate = null;
      next.endDate = null;
    } else if (key === 'keyword') {
      setSearchScope('');
      setKeyword('');
      next.searchScope = '';
      next.keyword = '';
    } else if (key === 'couponType') {
      setCouponType('');
      next.couponType = '';
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">주문 목록</h1>

      <section className="admin-list-box" aria-label="검색 결과 요약">
        <p className="admin-list-result">
          총 {totalOrders.toLocaleString()}개의 주문이 검색되었습니다. 미결제건은 {unpaidCount}건 이며 결제완료 값은{' '}
          {paidAmount.toLocaleString()}원 입니다.
        </p>
      </section>

      <section className="admin-list-box" aria-label="검색 조건">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">주문일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="주문일 프리셋"
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
                  if (next === '3개월') start.setDate(start.getDate() - 89);
                  if (next === '6개월') start.setDate(start.getDate() - 179);
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
                  { value: '3개월', label: '3개월' },
                  { value: '6개월', label: '6개월' },
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
                options={SEARCH_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="주문 검색"
              />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">쿠폰종류</span>
            <ListSelect
              ariaLabel="쿠폰 종류"
              value={couponType}
              onChange={setCouponType}
              options={COUPON_TYPE_OPTIONS}
            />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="주문 목록 테이블">
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
          <table className="admin-table admin-table--enterprise-orders">
            <thead>
              <tr>
                <th>NO</th>
                <th>주문일</th>
                <th>업체명</th>
                <th>금액</th>
                <th>계좌</th>
                <th>결제현황</th>
                <th>쿠폰</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.displayNo}</td>
                  <td>{row.orderedAt}</td>
                  <td className="admin-table-col-title">{row.companyName}</td>
                  <td>{row.amount.toLocaleString()}원</td>
                  <td>
                    <button type="button" className={paymentStatusButtonClass(row.paymentStatus)}>
                      <span className={paymentProgressClass(row.paymentStatus)}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{paymentStatusLabel(row.paymentStatus)}</span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{row.paymentMethod}</span>
                      <span className="cell-line">입금자명: {row.depositorName}</span>
                    </div>
                    </td>
                  <td>
                    {row.couponKind}({row.couponCount})
                  </td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
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
