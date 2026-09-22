import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleDollarSign, Image, Images, Users } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './WorkHistoryRetouchPage.css';
import {
  MOCK_WORK_HISTORY_RETOUCH_ITEMS,
  type WorkHistoryRetouchItem,
} from './mock/workHistoryRetouch.mock';
import WorkHistoryRetouchDetailPage from './WorkHistoryRetouchDetailPage';
import { workHistoryRetouchDetailPath } from './workHistoryRetouchPaths';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '계정 아이디', label: '계정 아이디' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
};

type AppliedChipKey = 'date' | 'keyword';

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

function formatYmd(date: Date | null) {
  if (!date) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return !search.dateRange && search.startDate == null && search.endDate == null && !search.keyword.trim();
}

function parseDateTime(value: string): Date {
  const dateStr = value.replace(/\/$/, '').trim().slice(0, 19);
  return new Date(dateStr.replace(' ', 'T'));
}

function isInCustomDateRange(dateValue: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const date = parseDateTime(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  if (start) {
    const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (date < rangeStart) return false;
  }
  if (end) {
    const rangeEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    if (date > rangeEnd) return false;
  }
  return true;
}

function applyFilters(items: WorkHistoryRetouchItem[], applied: AppliedSearch | null): WorkHistoryRetouchItem[] {
  if (!applied) return items;
  return items.filter((item) => {
    if (!isInCustomDateRange(item.lastActivityAt, applied.startDate, applied.endDate)) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const matchAccountId = item.accountId.toLowerCase().includes(keyword);
    if (applied.conditionType === '계정 아이디') return matchAccountId;
    return matchAccountId;
  });
}

function formatActivityCountLabel(count: number) {
  return `${count.toLocaleString('ko-KR')}회`;
}

function getActivityCountClassName(count: number) {
  return count <= 0 ? 'row-btn--gray' : 'row-btn--primary';
}

function DatePickerFooter({ onToday, onClose }: { onToday: () => void; onClose: () => void }) {
  return (
    <div className="react-datepicker-custom-footer">
      <button type="button" className="datepicker-footer-btn datepicker-footer-btn--today" onClick={onToday}>
        오늘
      </button>
      <button type="button" className="datepicker-footer-btn datepicker-footer-btn--close" onClick={onClose}>
        닫기
      </button>
    </div>
  );
}

export default function WorkHistoryRetouchPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const items = MOCK_WORK_HISTORY_RETOUCH_ITEMS;
  const filteredItems = useMemo(() => applyFilters(items, appliedSearch), [items, appliedSearch]);
  const summarySourceHint = appliedSearch ? '현재 검색 기준' : '총 누적';
  const filteredSummary = useMemo(() => {
    const accountIds = new Set<string>();
    let photoCount = 0;
    let retouchCount = 0;
    let usedTokens = 0;
    let apiCost = 0;

    for (const item of filteredItems) {
      accountIds.add(item.accountId);
      photoCount += item.photoCount;
      retouchCount += item.savedRetouchCount;
      usedTokens += item.usedTokens;
      apiCost += item.apiCost;
    }

    return {
      accountCount: accountIds.size,
      photoCount,
      retouchCount,
      usedTokens,
      apiCost,
    };
  }, [filteredItems]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
    };
    setAppliedSearch(isAppliedSearchEmpty(nextAppliedSearch) ? null : nextAppliedSearch);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: AppliedSearch = { ...appliedSearch };

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
        setConditionType('전체');
        next.keyword = '';
        next.conditionType = '전체';
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
      chips.push({
        key: 'date',
        label: `사용일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `사용일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    return chips;
  }, [appliedSearch]);

  if (subId) return <WorkHistoryRetouchDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--work-history-retouch">
      <h1 className="page-title">사진보정 작업내역</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="사진보정 작업내역 요약">
        <div className="admin-stat-cards admin-stat-cards--4">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <Users size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">사용계정</p>
            <p className="admin-stat-value">
              {filteredSummary.accountCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">개</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <Image size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">등록된 사진 수</p>
            <p className="admin-stat-value">
              {filteredSummary.photoCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">장</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Images size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">저장된 보정수</p>
            <p className="admin-stat-value">
              {filteredSummary.retouchCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--gray" aria-hidden>
              <CircleDollarSign size={20} strokeWidth={2} />
            </div>
            <div className="admin-stat-card__dual">
              <div>
                <p className="admin-stat-label">사용 토큰</p>
                <p className="admin-stat-value">
                  {filteredSummary.usedTokens.toLocaleString('ko-KR')}
                  <span className="admin-stat-value__suffix">토큰</span>
                </p>
              </div>
              <div>
                <p className="admin-stat-label">API 비용</p>
                <p className="admin-stat-value">
                  {filteredSummary.apiCost.toLocaleString('ko-KR')}
                  <span className="admin-stat-value__suffix">원</span>
                </p>
              </div>
            </div>
            <p className="admin-stat-hint">{summarySourceHint}</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row admin-filter-row--no-detail">
          <div className="filter-section">
            <span className="filter-label">사용일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="사용일 프리셋"
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
                    setStartDateOpen(false);
                    setDateRange('');
                  }}
                  onCalendarOpen={() => setStartDateOpen(true)}
                  onCalendarClose={() => setStartDateOpen(false)}
                  onInputClick={() => setStartDateOpen(true)}
                  open={startDateOpen}
                  onClickOutside={() => setStartDateOpen(false)}
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
                  calendarContainer={({ className, children }) => (
                    <div className={`${className ?? ''} admin-list-datepicker-container`.trim()}>
                      {children}
                      <DatePickerFooter onToday={() => setStartDate(new Date())} onClose={() => setStartDateOpen(false)} />
                    </div>
                  )}
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => {
                    setEndDate(date);
                    setEndDateOpen(false);
                    setDateRange('');
                  }}
                  onCalendarOpen={() => setEndDateOpen(true)}
                  onCalendarClose={() => setEndDateOpen(false)}
                  onInputClick={() => setEndDateOpen(true)}
                  open={endDateOpen}
                  onClickOutside={() => setEndDateOpen(false)}
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
                  calendarContainer={({ className, children }) => (
                    <div className={`${className ?? ''} admin-list-datepicker-container`.trim()}>
                      {children}
                      <DatePickerFooter onToday={() => setEndDate(new Date())} onClose={() => setEndDateOpen(false)} />
                    </div>
                  )}
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
                onChange={(next) => setConditionType(next as DetailSearchScope)}
                options={[...DETAIL_SEARCH_SCOPE_OPTIONS]}
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

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="사진보정 작업내역 리스트">
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
                <th>계정</th>
                <th className="col-center">등록사진</th>
                <th className="col-center">사진열기</th>
                <th className="col-center">저장된 보정</th>
                <th>사용토큰</th>
                <th>API 비용추정</th>
                <th>최근활동</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={workHistoryRetouchDetailPath(item.id)} className="admin-link cell-line">
                      {item.accountId}
                    </Link>
                  </td>
                  <td className="col-center">
                    <span className="list-value">{item.photoCount.toLocaleString('ko-KR')}장</span>
                  </td>
                  <td className="col-center">
                    <button type="button" className={['row-btn', getActivityCountClassName(item.photoOpenCount)].join(' ')}>
                      {formatActivityCountLabel(item.photoOpenCount)}
                    </button>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className={['row-btn', getActivityCountClassName(item.savedRetouchCount)].join(' ')}
                    >
                      {formatActivityCountLabel(item.savedRetouchCount)}
                    </button>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="badge-square badge-square--inline badge-square--warning badge-square--no-transition badge-square--no-margin">
                        {item.usedTokens.toLocaleString('ko-KR')}토큰
                      </span>
                      <span className="cell-line cell-line--token-split">
                        <span>
                          <span className="list-label">차감</span>
                          <span className="list-value">{item.deductedTokens.toLocaleString('ko-KR')}</span>
                        </span>
                        <span>
                          <span className="list-label">반환</span>
                          <span className="list-value">{item.returnedTokens.toLocaleString('ko-KR')}</span>
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="amount-red">{item.apiCost.toLocaleString('ko-KR')}원</span>
                  </td>
                  <td>
                    <span className="cell-line">{item.lastActivityAt}</span>
                  </td>
                </tr>
              ))}
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-table-empty-cell">
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
              <button
                type="button"
                onClick={() => setCurrentPage((page) => jumpPageBack(page))}
                disabled={currentPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => jumpPageForward(page, totalPages))}
                disabled={currentPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
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
