import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Cpu, Download } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/Confirm';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './MotionPhotoServerPage.css';
import {
  MOCK_MOTION_PHOTO_SERVER_ITEMS,
  MOTION_PHOTO_SERVER_CHANNELS,
  type MotionPhotoServerItem,
  type MotionPhotoServerStatus,
} from './mock/motionPhotoServer.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '아이디', label: '아이디' },
  { value: '주문번호', label: '주문번호' },
] as const;
type DetailSearchScope = (typeof DETAIL_SEARCH_SCOPE_OPTIONS)[number]['value'];

const STATUS_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '완료', label: '완료' },
  { value: '대기중', label: '대기중' },
] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number]['value'];

const CHANNEL_OPTIONS = [
  { value: '전체', label: '전체' },
  ...MOTION_PHOTO_SERVER_CHANNELS.map((channel) => ({ value: channel, label: channel })),
] as const;
type ChannelFilter = (typeof CHANNEL_OPTIONS)[number]['value'];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: DetailSearchScope;
  keyword: string;
  status: StatusFilter;
  channel: ChannelFilter;
};

type AppliedChipKey = 'date' | 'keyword' | 'status' | 'channel';

type ConfirmDialogState = {
  message: string;
  danger?: boolean;
  onConfirm: () => void;
};

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
  return (
    !search.dateRange &&
    search.startDate == null &&
    search.endDate == null &&
    !search.keyword.trim() &&
    search.status === '전체' &&
    search.channel === '전체'
  );
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

function applyFilters(items: MotionPhotoServerItem[], applied: AppliedSearch | null): MotionPhotoServerItem[] {
  if (!applied) return items;
  return items.filter((item) => {
    if (!isInCustomDateRange(item.requestedAt, applied.startDate, applied.endDate)) return false;
    if (applied.status !== '전체' && item.status !== applied.status) return false;
    if (applied.channel !== '전체' && item.channel !== applied.channel) return false;

    const keyword = applied.keyword.trim().toLowerCase();
    if (!keyword) return true;

    const matchId = item.accountId.toLowerCase().includes(keyword);
    const matchTaskId = item.taskId.toLowerCase().includes(keyword);

    switch (applied.conditionType) {
      case '아이디':
        return matchId;
      case '주문번호':
        return matchTaskId;
      default:
        return matchId || matchTaskId;
    }
  });
}

function getStatusClasses(status: MotionPhotoServerStatus) {
  if (status === '완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '작업중') {
    return { rowBtn: 'row-btn--status-blue', progress: 'progress-status--blue' };
  }
  return { rowBtn: 'row-btn--status-warning', progress: 'progress-status--warning' };
}

function formatElapsedSeconds(startedAtMs: number, nowMs: number) {
  const elapsed = Math.max(0, (nowMs - startedAtMs) / 1000);
  return `${elapsed.toFixed(2)}초 경과`;
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

export default function MotionPhotoServerPage() {
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [conditionType, setConditionType] = useState<DetailSearchScope>('전체');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('전체');
  const [channel, setChannel] = useState<ChannelFilter>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const [items, setItems] = useState(() => [...MOCK_MOTION_PHOTO_SERVER_ITEMS]);
  const runningItems = useMemo(() => items.filter((item) => item.status === '작업중'), [items]);
  const queuedItems = useMemo(() => items.filter((item) => item.status === '대기중'), [items]);
  const completedCount = useMemo(() => items.filter((item) => item.status === '완료').length, [items]);
  const runningEstimate = runningItems[0]?.estimatedSeconds ?? null;

  const filteredItems = useMemo(() => applyFilters(items, appliedSearch), [items, appliedSearch]);

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

  useEffect(() => {
    if (runningItems.length === 0) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [runningItems.length]);

  const handleSearch = () => {
    const nextAppliedSearch: AppliedSearch = {
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      status,
      channel,
    };
    setAppliedSearch(isAppliedSearchEmpty(nextAppliedSearch) ? null : nextAppliedSearch);
    setCurrentPage(1);
  };

  const requestAdminTrialToggle = (item: MotionPhotoServerItem) => {
    setConfirmDialog({
      message: item.isAdminTrial
        ? `${item.accountId}의 관리자(체험단) 처리를 해제할까요?`
        : `${item.accountId}를 관리자(체험단)로 처리할까요?`,
      onConfirm: () => {
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? { ...row, isAdminTrial: !row.isAdminTrial } : row))
        );
      },
    });
  };

  const requestBlockedToggle = (item: MotionPhotoServerItem) => {
    setConfirmDialog({
      message: item.isBlocked
        ? `${item.accountId}의 차단을 해제할까요?`
        : `${item.accountId}를 차단 처리할까요?`,
      danger: !item.isBlocked,
      onConfirm: () => {
        setItems((prev) => prev.map((row) => (row.id === item.id ? { ...row, isBlocked: !row.isBlocked } : row)));
      },
    });
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
      case 'status':
        setStatus('전체');
        next.status = '전체';
        break;
      case 'channel':
        setChannel('전체');
        next.channel = '전체';
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
        label: `요청일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `요청일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.status !== '전체') {
      chips.push({ key: 'status', label: `제작현황: ${appliedSearch.status}` });
    }
    if (appliedSearch.channel !== '전체') {
      chips.push({ key: 'channel', label: `채널: ${appliedSearch.channel}` });
    }

    return chips;
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--motion-photo-server">
      <h1 className="page-title">모션포토 서버 현황</h1>

      <section className="admin-stat-cards-wrap admin-stat-section" aria-label="모션포토 서버 작업 현황">
        <div className="admin-stat-cards admin-stat-cards--motion-photo-server">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <Cpu size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">작업중</p>
            <p className="admin-stat-value">
              {runningItems.length.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            {runningItems.length === 0 ? (
              <p className="admin-stat-empty">작업 중인 작업 없음</p>
            ) : (
              <ul className="admin-stat-rank-list" aria-label="작업중 상세">
                {runningItems.map((item) => {
                  const statusClasses = getStatusClasses(item.status);
                  return (
                    <li key={item.id} className="admin-stat-running-item">
                      <div className="admin-stat-rank-row">
                        <span className="admin-stat-rank-name">
                          GPU #{item.gpuIndex ?? 0} · {item.taskId}
                        </span>
                        <span className={['row-btn', statusClasses.rowBtn].join(' ')}>
                          <span className={['progress-status', statusClasses.progress].join(' ')}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{item.status}</span>
                          </span>
                        </span>
                      </div>
                      <p className="admin-stat-hint">
                        {item.startedAtMs != null ? formatElapsedSeconds(item.startedAtMs, nowMs) : ''}
                        {runningEstimate != null ? ` · 예상 ${runningEstimate}초` : ''}
                      </p>
                      <div className="admin-progress-row">
                        <div
                          className="admin-progress-bar"
                          role="progressbar"
                          aria-label={`${item.taskId} 진행률 ${item.progress}%`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={item.progress}
                        >
                          <div className="admin-progress-bar__fill" style={{ width: `${item.progress}%` }} />
                        </div>
                        <span className="list-value">{item.progress}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <Clock size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">대기중</p>
            <p className="admin-stat-value">
              {queuedItems.length.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
            {queuedItems.length === 0 ? (
              <p className="admin-stat-empty">대기 중인 작업 없음</p>
            ) : (
              <ul className="admin-stat-rank-list" aria-label="대기중 목록">
                {queuedItems.map((item, index) => (
                  <li key={item.id} className="admin-stat-rank-row">
                    <span className="admin-stat-rank-name">
                      {index + 1}. {item.taskId}
                    </span>
                    <span className="admin-stat-rank-count">{item.requestedAt}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <CheckCircle2 size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">완료됨</p>
            <p className="admin-stat-value">
              {completedCount.toLocaleString('ko-KR')}
              <span className="admin-stat-value__suffix">건</span>
            </p>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row">
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
        </div>

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">제작현황</span>
            <ListSelect
              ariaLabel="제작현황"
              value={status}
              onChange={(next) => setStatus(next as StatusFilter)}
              options={[...STATUS_OPTIONS]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">채널</span>
            <ListSelect
              ariaLabel="채널"
              value={channel}
              onChange={(next) => setChannel(next as ChannelFilter)}
              options={[...CHANNEL_OPTIONS]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="모션포토 서버 작업 리스트">
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
                <th>채널</th>
                <th>taskID</th>
                <th>아이디</th>
                <th>요청일</th>
                <th className="col-center">진행현황</th>
                <th className="col-center">요청이미지</th>
                <th className="col-center">다운로드</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item) => {
                const statusClasses = getStatusClasses(item.status);
                return (
                  <tr key={item.id}>
                    <td>
                      <span className="cell-line">{item.channel}</span>
                    </td>
                    <td>
                      <span className="cell-line">{item.taskId}</span>
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{item.accountId}</span>
                        <span className="cell-line account-action-badges">
                          <button
                            type="button"
                            className={[
                              'badge-square',
                              'badge-square--inline',
                              item.isAdminTrial ? 'badge-square--warning' : 'badge-square--gray',
                            ].join(' ')}
                            aria-pressed={item.isAdminTrial}
                            onClick={() => requestAdminTrialToggle(item)}
                          >
                            관리자(체험단)처리
                          </button>
                          <button
                            type="button"
                            className={[
                              'badge-square',
                              'badge-square--inline',
                              item.isBlocked ? 'badge-square--danger' : 'badge-square--gray',
                            ].join(' ')}
                            aria-pressed={item.isBlocked}
                            onClick={() => requestBlockedToggle(item)}
                          >
                            차단처리
                          </button>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-line">{item.requestedAt}</span>
                    </td>
                    <td className="col-center">
                      <span className={['row-btn', statusClasses.rowBtn].join(' ')}>
                        <span className={['progress-status', statusClasses.progress].join(' ')}>
                          <span className="progress-status__dot" aria-hidden="true" />
                          <span className="progress-status__text">{item.status}</span>
                        </span>
                      </span>
                    </td>
                    <td className="col-center">
                      {item.requestImageUrl ? (
                        <button
                          type="button"
                          className="request-image-btn"
                          aria-label={`${item.taskId} 요청이미지 보기`}
                          onClick={() => window.open(item.requestImageUrl!, '_blank', 'noopener,noreferrer')}
                        >
                          <img
                            src={item.requestImageUrl}
                            alt=""
                            className="admin-product-thumb admin-product-thumb--sm"
                          />
                        </button>
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                    <td className="col-center">
                      {item.downloadUrl ? (
                        <button
                          type="button"
                          className="row-btn row-btn--default"
                          aria-label={`${item.taskId} 다운로드`}
                          onClick={() => window.open(item.downloadUrl!, '_blank', 'noopener,noreferrer')}
                        >
                          <Download size={14} aria-hidden />
                          다운로드
                        </button>
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
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
                  className={page === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`${page}페이지`}
                  aria-current={page === currentPage ? 'page' : undefined}
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

      <Confirm
        open={confirmDialog != null}
        message={confirmDialog?.message ?? ''}
        danger={confirmDialog?.danger}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          confirmDialog?.onConfirm();
          setConfirmDialog(null);
        }}
      />
    </div>
  );
}
