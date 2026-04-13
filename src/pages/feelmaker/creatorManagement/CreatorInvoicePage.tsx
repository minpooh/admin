import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import '../orderManagement/OrderListPage.css';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'PAID', label: 'PAID' },
  { value: 'CANCELLED', label: 'CANCELLED' },
];

const SEARCH_SCOPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'loginId', label: '크리에이터 아이디' },
  { value: 'name', label: '이름' },
];

type SettlementStatus = 'PENDING' | 'PAID' | 'CANCELLED';

type CreatorSettlementInvoiceRow = {
  id: string;
  creatorLoginId: string;
  creatorName: string;
  bankName: string;
  accountNumber: string;
  orderNo: string;
  amount: number;
  status: SettlementStatus;
  requestedAt: string;
  depositedAt: string;
  memo: string;
};

const ITEMS_PER_PAGE = 10;

const BANKS = ['국민', '신한', '우리', '하나', '농협', '카카오뱅크', '토스뱅크'];

function statusButtonClass(s: SettlementStatus): string {
  if (s === 'PAID') return 'row-btn row-btn--status-secondary';
  if (s === 'CANCELLED') return 'row-btn row-btn--status-danger';
  return 'row-btn row-btn--status-warning';
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 요청일·입금일(PAID) 더미: `yyyy-MM-dd HH:mm:ss` */
const MOCK_CREATOR_SETTLEMENTS: CreatorSettlementInvoiceRow[] = Array.from({ length: 47 }, (_, i) => {
  const no = i + 1;
  const month = pad2(((i + 3) % 12) + 1);
  const day = pad2(((i * 5) % 27) + 1);
  const depDay = pad2(Math.min(28, ((i * 5) % 27) + 2));
  const reqHour = 8 + (i % 14);
  const reqMin = (i * 7) % 60;
  const reqSec = (i * 11) % 60;
  const depHour = 10 + (i % 12);
  const depMin = (i * 13) % 60;
  const depSec = (i * 17) % 60;
  const status: SettlementStatus = i % 8 === 0 ? 'CANCELLED' : i % 4 === 0 ? 'PENDING' : 'PAID';
  return {
    id: `cs-inv-${String(no).padStart(4, '0')}`,
    creatorLoginId: `creator_${String((no % 37) + 1).padStart(3, '0')}`,
    creatorName: `크리에이터${(no % 37) + 1}`,
    bankName: BANKS[i % BANKS.length],
    accountNumber: `${String(100 + (i * 17) % 900)}-${String(12 + (i % 80)).padStart(2, '0')}-${String(100000 + (i * 991) % 900000)}`,
    orderNo: `ORD-${String(880000 + no * 113).padStart(6, '0')}`,
    amount: 120000 + ((i * 234567) % 4800000),
    status,
    requestedAt: `2026-${month}-${day} ${pad2(reqHour)}:${pad2(reqMin)}:${pad2(reqSec)}`,
    depositedAt: status === 'PAID' ? `2026-${month}-${depDay} ${pad2(depHour)}:${pad2(depMin)}:${pad2(depSec)}` : '-',
    memo: i % 5 === 0 ? '확인 완료' : i % 7 === 0 ? '재요청 예정' : '',
  };
});

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  searchScope: string;
  keyword: string;
};

type ChipKey = 'date' | 'status' | 'keyword';

function formatYmdHms(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export default function CreatorInvoicePage() {
  const [rows, setRows] = useState<CreatorSettlementInvoiceRow[]>(() => [...MOCK_CREATOR_SETTLEMENTS]);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [status, setStatus] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [depositMemoInput, setDepositMemoInput] = useState('');
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const selectedSummary = useMemo(() => {
    if (selectedIds.size === 0) return { count: 0, totalAmount: 0 };
    let totalAmount = 0;
    for (const row of rows) {
      if (selectedIds.has(row.id)) totalAmount += row.amount;
    }
    return { count: selectedIds.size, totalAmount };
  }, [rows, selectedIds]);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;

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

    const kw = appliedSearch.keyword.trim().toLowerCase();

    return rows.filter((row) => {
      const requested = new Date(row.requestedAt.replace(' ', 'T'));
      if (startBoundary && requested < startBoundary) return false;
      if (endBoundary && requested > endBoundary) return false;
      if (appliedSearch.status && row.status !== appliedSearch.status) return false;
      if (kw) {
        if (appliedSearch.searchScope === 'loginId' && !row.creatorLoginId.toLowerCase().includes(kw)) return false;
        if (appliedSearch.searchScope === 'name' && !row.creatorName.toLowerCase().includes(kw)) return false;
        if (!appliedSearch.searchScope) {
          if (
            !row.creatorLoginId.toLowerCase().includes(kw) &&
            !row.creatorName.toLowerCase().includes(kw)
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  const pageIds = paginatedRows.map((r) => r.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  useEffect(() => {
    const el = headerCheckboxRef.current;
    if (el) el.indeterminate = somePageSelected && !allPageSelected;
  }, [somePageSelected, allPageSelected, paginatedRows]);

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

  const handleBulkDepositComplete = () => {
    if (selectedIds.size === 0) return;
    const nowStr = formatYmdHms(new Date());
    const memoTrim = depositMemoInput.trim();
    setRows((prev) =>
      prev.map((row) => {
        if (!selectedIds.has(row.id)) return row;
        const nextMemo = memoTrim || row.memo || '입금완료 처리';
        return {
          ...row,
          status: 'PAID' as SettlementStatus,
          depositedAt: nowStr,
          memo: nextMemo,
        };
      })
    );
    setSelectedIds(new Set());
    setDepositMemoInput('');
  };

  const handleBulkHoldReject = () => {
    if (selectedIds.size === 0) return;
    const reason = rejectReasonInput.trim();
    if (!reason) {
      window.alert('보류/반려 사유를 입력해 주세요.');
      return;
    }
    setRows((prev) =>
      prev.map((row) => {
        if (!selectedIds.has(row.id)) return row;
        return {
          ...row,
          status: 'CANCELLED' as SettlementStatus,
          depositedAt: '-',
          memo: reason,
        };
      })
    );
    setSelectedIds(new Set());
    setRejectReasonInput('');
  };

  const handleSearch = () => {
    const next: AppliedSearch = { dateRange, startDate, endDate, status, searchScope, keyword };
    const isEmpty =
      !next.dateRange &&
      !next.startDate &&
      !next.endDate &&
      !next.status &&
      !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [] as Array<{ key: ChipKey; label: string }>;
    const chips: Array<{ key: ChipKey; label: string }> = [];
    const formatYmd = (d: Date | null) => {
      if (!d) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const s = formatYmd(appliedSearch.startDate);
      const e = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `요청일: ${s}${s && e ? ' ~ ' : ''}${e}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `요청일: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.status) chips.push({ key: 'status', label: `상태: ${appliedSearch.status}` });
    if (appliedSearch.keyword.trim()) {
      const scopeLabel = SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }
    return chips;
  }, [appliedSearch]);

  const clearAppliedFilter = (key: ChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'date') {
      setDateRange('');
      setStartDate(null);
      setEndDate(null);
      next.dateRange = '';
      next.startDate = null;
      next.endDate = null;
    } else if (key === 'status') {
      setStatus('');
      next.status = '';
    } else {
      setSearchScope('');
      setKeyword('');
      next.searchScope = '';
      next.keyword = '';
    }
    const isEmpty =
      !next.dateRange &&
      !next.startDate &&
      !next.endDate &&
      !next.status &&
      !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">크리에이터 정산</h1>

      <section className="admin-list-box" aria-label="크리에이터 정산 검색 필터">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">요청일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="요청일 프리셋"
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
                ariaLabel="조건검색"
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
                aria-label="크리에이터 정산 검색어"
              />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">상태</span>
            <ListSelect ariaLabel="상태" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="크리에이터 정산 목록">
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

        {selectedSummary.count > 0 && (
          <div className="admin-settlement-bulk" aria-live="polite">
            <div className="admin-settlement-bulk__bar">
              <p className="admin-settlement-bulk__summary">
                선택 <strong>{selectedSummary.count}</strong>건 · 총 정산 금액{' '}
                <strong>{selectedSummary.totalAmount.toLocaleString()}원</strong>
              </p>
              <button
                type="button"
                className="filter-btn filter-btn--primary"
                onClick={handleBulkDepositComplete}
              >
                입금완료 처리
              </button>
              <input
                type="text"
                className="admin-settlement-bulk__input"
                placeholder="입금메모 (선택)"
                value={depositMemoInput}
                onChange={(e) => setDepositMemoInput(e.target.value)}
                aria-label="입금메모"
              />
              <button type="button" className="filter-btn filter-btn--outline" onClick={handleBulkHoldReject}>
                보류/반려처리
              </button>
              <input
                type="text"
                className="admin-settlement-bulk__input"
                placeholder="보류/반려 사유 (필수)"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                aria-label="보류 반려 사유"
                required
              />
            </div>
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table admin-table--creator-settlement-invoice">
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
                <th>크리에이터 ID</th>
                <th>이름</th>
                <th>은행/계좌</th>
                <th>주문번호</th>
                <th>금액</th>
                <th>상태</th>
                <th>요청일</th>
                <th>입금일</th>
                <th>메모</th>
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
                        aria-label={`${row.creatorLoginId} 행 선택`}
                      />
                    </label>
                  </td>
                  <td>{row.creatorLoginId}</td>
                  <td>{row.creatorName}</td>
                  <td>
                    <span className="cell-line">{row.bankName}</span> <span className="cell-line">{row.accountNumber}</span>
                  </td>
                  <td>{row.orderNo}</td>
                  <td>{row.amount.toLocaleString()}원</td>
                  <td>
                    <span className={statusButtonClass(row.status)}>{row.status}</span>
                  </td>
                  <td>{row.requestedAt}</td>
                  <td>{row.depositedAt}</td>
                  <td className="admin-table-cell--memo">{row.memo || ''}</td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '20px' }}>
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
