import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import Confirm from '../../../components/Confirm';
import Modal, { ModalDatePicker, ModalInput } from '../../../components/Modal';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import './GroupListPage.css';
import { MOCK_GROUP_BUY_ROWS, type GroupBuyRow } from './mock/groupBuyList.mock';
import {
  getGroupBuyParticipants,
  summarizeCouponUsage,
} from './mock/groupBuyParticipants.mock';

const DATE_PRESET_OPTIONS = [
  { value: '', label: '미선택' },
  { value: '당일', label: '당일' },
  { value: '3일', label: '3일' },
  { value: '1주', label: '1주' },
  { value: '2주', label: '2주' },
  { value: '1개월', label: '1개월' },
  { value: '3개월', label: '3개월' },
  { value: '6개월', label: '6개월' },
];

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'teamName', label: '공구팀명' },
  { value: 'code', label: '참여코드' },
  { value: 'leader', label: '공구장' },
];

const PROGRESS_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'before', label: '마감전' },
  { value: 'closed', label: '마감' },
];

const EXPOSURE_OPTIONS = [
  { value: 'visible', label: '노출' },
  { value: 'hidden', label: '미노출' },
];

const ITEMS_PER_PAGE = 10;

type GroupBuyChipKey = 'startDate' | 'endDate' | 'keyword' | 'progress';

type GroupBuyAppliedSearch = {
  startDateRange: string;
  startRangeStart: Date | null;
  startRangeEnd: Date | null;
  endDateRange: string;
  endRangeStart: Date | null;
  endRangeEnd: Date | null;
  searchScope: string;
  keyword: string;
  progressStatus: string;
};

function formatYmd(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

function parseGroupBuyDateTime(s: string): Date {
  return new Date(s.trim().replace(' ', 'T'));
}

function dayBoundary(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isInCustomDateRange(dateStr: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const day = dayBoundary(parseGroupBuyDateTime(dateStr));
  if (start && day < dayBoundary(start)) return false;
  if (end && day > dayBoundary(end)) return false;
  return true;
}

/** 프리셋에 해당하는 달력 구간 (시작날짜·마감날짜 필터용) */
function getDateRangeFromPreset(preset: string): { start: Date; end: Date } | null {
  if (!preset) return null;
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  if (preset === '당일') return { start, end };
  if (preset === '3일') {
    start.setDate(start.getDate() - 2);
    return { start, end };
  }
  if (preset === '1주') {
    start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (preset === '2주') {
    start.setDate(start.getDate() - 13);
    return { start, end };
  }
  if (preset === '1개월') {
    start.setDate(start.getDate() - 29);
    return { start, end };
  }
  return null;
}

function isGroupBuyAppliedEmpty(s: GroupBuyAppliedSearch): boolean {
  const noStart = !s.startDateRange && !s.startRangeStart && !s.startRangeEnd;
  const noEnd = !s.endDateRange && !s.endRangeStart && !s.endRangeEnd;
  const noKw = !s.keyword.trim();
  const noProg = !s.progressStatus;
  return noStart && noEnd && noKw && noProg;
}

function applyGroupBuyFilters(rows: GroupBuyRow[], applied: GroupBuyAppliedSearch | null): GroupBuyRow[] {
  if (!applied) return rows;

  return rows.filter((row) => {
    let ss = applied.startRangeStart;
    let se = applied.startRangeEnd;
    if (!ss && !se && applied.startDateRange) {
      const r = getDateRangeFromPreset(applied.startDateRange);
      if (r) {
        ss = r.start;
        se = r.end;
      }
    }
    if (ss || se) {
      if (!isInCustomDateRange(row.startDate, ss, se)) return false;
    }

    let es = applied.endRangeStart;
    let ee = applied.endRangeEnd;
    if (!es && !ee && applied.endDateRange) {
      const r = getDateRangeFromPreset(applied.endDateRange);
      if (r) {
        es = r.start;
        ee = r.end;
      }
    }
    if (es || ee) {
      if (!isInCustomDateRange(row.endDate, es, ee)) return false;
    }

    const kw = applied.keyword.trim().toLowerCase();
    if (kw) {
      const scope = applied.searchScope;
      if (scope === 'all') {
        if (
          !row.teamName.toLowerCase().includes(kw) &&
          !row.participationCode.includes(kw) &&
          !row.leaderName.toLowerCase().includes(kw)
        ) {
          return false;
        }
      } else if (scope === 'teamName') {
        if (!row.teamName.toLowerCase().includes(kw)) return false;
      } else if (scope === 'code') {
        if (!row.participationCode.includes(kw)) return false;
      } else if (scope === 'leader') {
        if (!row.leaderName.toLowerCase().includes(kw)) return false;
      }
    }

    if (applied.progressStatus === 'before' && row.progressStatus !== 'before') return false;
    if (applied.progressStatus === 'closed' && row.progressStatus !== 'closed') return false;

    return true;
  });
}

function applyDatePreset(next: string, setStart: (d: Date | null) => void, setEnd: (d: Date | null) => void) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  if (next === '당일') {
    setStart(start);
    setEnd(end);
    return;
  }
  if (next === '3일') start.setDate(start.getDate() - 2);
  if (next === '1주') start.setDate(start.getDate() - 6);
  if (next === '2주') start.setDate(start.getDate() - 13);
  if (next === '1개월') start.setDate(start.getDate() - 29);
  if (next === '3개월') start.setDate(start.getDate() - 89);
  if (next === '6개월') start.setDate(start.getDate() - 179);
  setStart(start);
  setEnd(end);
}

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

export default function GroupListPage() {
  const [rows, setRows] = useState<GroupBuyRow[]>(() => [...MOCK_GROUP_BUY_ROWS]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const openConfirmDialog = (config: ConfirmDialogState) => setConfirmDialog(config);
  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const [startDateRange, setStartDateRange] = useState('');
  const [startRangeStart, setStartRangeStart] = useState<Date | null>(null);
  const [startRangeEnd, setStartRangeEnd] = useState<Date | null>(null);

  const [endDateRange, setEndDateRange] = useState('');
  const [endRangeStart, setEndRangeStart] = useState<Date | null>(null);
  const [endRangeEnd, setEndRangeEnd] = useState<Date | null>(null);

  const [searchScope, setSearchScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  const [appliedSearch, setAppliedSearch] = useState<GroupBuyAppliedSearch | null>(null);

  const [addMemberModalRowId, setAddMemberModalRowId] = useState<string | null>(null);
  const [addMemberName, setAddMemberName] = useState('');
  const [addMemberDate, setAddMemberDate] = useState<Date | null>(null);
  const [addMemberTime, setAddMemberTime] = useState('');

  const [participantDetailGroupId, setParticipantDetailGroupId] = useState<string | null>(null);

  const [addGroupBuyModalOpen, setAddGroupBuyModalOpen] = useState(false);
  const [addGroupTeamName, setAddGroupTeamName] = useState('');
  const [addGroupLeaderName, setAddGroupLeaderName] = useState('');
  const [addGroupEndDate, setAddGroupEndDate] = useState<Date | null>(null);
  const [addGroupExposure, setAddGroupExposure] = useState('visible');

  /** 공동구매 혜택 기본값 — 혜택관리 모달에서 수정, 신규 등록 시 반영 */
  const [benefitSettings, setBenefitSettings] = useState({
    limitAmount: 15000,
    issueAmount5: 5000,
    issueAmount10: 10000,
    daysAfterIssue: 30,
  });
  const [benefitModalOpen, setBenefitModalOpen] = useState(false);
  const [benefitDraft, setBenefitDraft] = useState({
    limitAmount: '15000',
    issueAmount5: '5000',
    issueAmount10: '10000',
    daysAfterIssue: '30',
  });

  const openAddGroupBuyModal = () => {
    setAddGroupTeamName('');
    setAddGroupLeaderName('');
    setAddGroupEndDate(null);
    setAddGroupExposure('visible');
    setAddGroupBuyModalOpen(true);
  };

  const closeAddGroupBuyModal = () => {
    setAddGroupBuyModalOpen(false);
  };

  const openBenefitModal = () => {
    setBenefitDraft({
      limitAmount: String(benefitSettings.limitAmount),
      issueAmount5: String(benefitSettings.issueAmount5),
      issueAmount10: String(benefitSettings.issueAmount10),
      daysAfterIssue: String(benefitSettings.daysAfterIssue),
    });
    setBenefitModalOpen(true);
  };

  const closeBenefitModal = () => setBenefitModalOpen(false);

  const handleBenefitSave = () => {
    const parseNonNegInt = (s: string, label: string): number | null => {
      const t = s.trim();
      if (t === '') {
        window.alert(`${label}을(를) 입력해주세요.`);
        return null;
      }
      const n = Number.parseInt(t, 10);
      if (Number.isNaN(n) || n < 0) {
        window.alert(`${label}은(는) 0 이상의 정수로 입력해주세요.`);
        return null;
      }
      return n;
    };

    const limitAmount = parseNonNegInt(benefitDraft.limitAmount, '사용제한 금액');
    if (limitAmount === null) return;
    const issue5 = parseNonNegInt(benefitDraft.issueAmount5, '5명 이상 발급 금액');
    if (issue5 === null) return;
    const issue10 = parseNonNegInt(benefitDraft.issueAmount10, '10명 이상 발급 금액');
    if (issue10 === null) return;
    const days = parseNonNegInt(benefitDraft.daysAfterIssue, '쿠폰 발행 후 제한 일수');
    if (days === null) return;

    setBenefitSettings({
      limitAmount,
      issueAmount5: issue5,
      issueAmount10: issue10,
      daysAfterIssue: days,
    });
    setBenefitModalOpen(false);
  };

  const handleAddGroupBuySubmit = () => {
    const name = addGroupTeamName.trim();
    const leader = addGroupLeaderName.trim();
    if (!name) {
      window.alert('공구명을 입력해주세요.');
      return;
    }
    if (!leader) {
      window.alert('공구장을 입력해주세요.');
      return;
    }
    if (!addGroupEndDate) {
      window.alert('마감일을 선택해주세요.');
      return;
    }
    const id = `new-${Date.now()}`;
    const endYmd = formatYmd(addGroupEndDate);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const newRow: GroupBuyRow = {
      id,
      teamName: name,
      participationCode: code,
      leaderName: leader,
      benefitLimitAmount: benefitSettings.limitAmount,
      benefitFrom5: benefitSettings.issueAmount5,
      benefitFrom10: benefitSettings.issueAmount10,
      daysAfterIssue: benefitSettings.daysAfterIssue,
      startDate: `${formatYmd(new Date())} 00:00`,
      endDate: `${endYmd} 23:59`,
      participantCount: 0,
      progressStatus: 'before',
    };
    setRows((prev) => [newRow, ...prev]);
    closeAddGroupBuyModal();
  };

  const closeAddMemberModal = () => {
    setAddMemberModalRowId(null);
    setAddMemberName('');
    setAddMemberDate(null);
    setAddMemberTime('');
  };

  const openAddMemberModal = (rowId: string) => {
    setAddMemberModalRowId(rowId);
    setAddMemberName('');
    setAddMemberDate(null);
    setAddMemberTime('');
  };

  const handleAddMemberSubmit = () => {
    if (!addMemberModalRowId) return;
    const name = addMemberName.trim();
    if (!name) {
      window.alert('이름을 입력해주세요.');
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.id === addMemberModalRowId ? { ...r, participantCount: r.participantCount + 1 } : r))
    );
    closeAddMemberModal();
  };

  const addMemberTargetRow = addMemberModalRowId ? rows.find((r) => r.id === addMemberModalRowId) : undefined;

  const participantDetailRow = participantDetailGroupId
    ? rows.find((r) => r.id === participantDetailGroupId)
    : undefined;

  const participantDetailList = useMemo(() => {
    if (!participantDetailGroupId) return [];
    return getGroupBuyParticipants(participantDetailGroupId);
  }, [participantDetailGroupId]);

  const participantSummary = useMemo(
    () => summarizeCouponUsage(participantDetailList),
    [participantDetailList]
  );

  const closeParticipantDetailModal = () => setParticipantDetailGroupId(null);

  const filteredRows = useMemo(
    () => applyGroupBuyFilters(rows, appliedSearch),
    [rows, appliedSearch]
  );

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [];
    const a = appliedSearch;
    const chips: { key: GroupBuyChipKey; label: string }[] = [];

    const hasStart =
      Boolean(a.startDateRange) || a.startRangeStart != null || a.startRangeEnd != null;
    if (hasStart) {
      if (a.startRangeStart != null || a.startRangeEnd != null) {
        const s = formatYmd(a.startRangeStart);
        const e = formatYmd(a.startRangeEnd);
        chips.push({
          key: 'startDate',
          label: `시작일: ${s}${s && e ? ' ~ ' : ''}${e}`,
        });
      } else if (a.startDateRange) {
        const label = DATE_PRESET_OPTIONS.find((o) => o.value === a.startDateRange)?.label ?? a.startDateRange;
        chips.push({ key: 'startDate', label: `시작일: ${label}` });
      }
    }

    const hasEnd =
      Boolean(a.endDateRange) || a.endRangeStart != null || a.endRangeEnd != null;
    if (hasEnd) {
      if (a.endRangeStart != null || a.endRangeEnd != null) {
        const s = formatYmd(a.endRangeStart);
        const e = formatYmd(a.endRangeEnd);
        chips.push({
          key: 'endDate',
          label: `마감일: ${s}${s && e ? ' ~ ' : ''}${e}`,
        });
      } else if (a.endDateRange) {
        const label = DATE_PRESET_OPTIONS.find((o) => o.value === a.endDateRange)?.label ?? a.endDateRange;
        chips.push({ key: 'endDate', label: `마감일: ${label}` });
      }
    }

    if (a.keyword.trim()) {
      const scopeLabel = DETAIL_SEARCH_SCOPE_OPTIONS.find((o) => o.value === a.searchScope)?.label ?? '';
      chips.push({ key: 'keyword', label: `상세검색: ${scopeLabel} ${a.keyword.trim()}` });
    }

    if (a.progressStatus) {
      const label = PROGRESS_STATUS_OPTIONS.find((o) => o.value === a.progressStatus)?.label ?? a.progressStatus;
      chips.push({ key: 'progress', label: `진행현황: ${label}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: GroupBuyAppliedSearch = {
      startDateRange,
      startRangeStart,
      startRangeEnd,
      endDateRange,
      endRangeStart,
      endRangeEnd,
      searchScope,
      keyword,
      progressStatus,
    };
    setAppliedSearch(isGroupBuyAppliedEmpty(next) ? null : next);
  };

  const clearAppliedFilter = (key: GroupBuyChipKey) => {
    if (!appliedSearch) return;
    const next: GroupBuyAppliedSearch = { ...appliedSearch };
    switch (key) {
      case 'startDate':
        next.startDateRange = '';
        next.startRangeStart = null;
        next.startRangeEnd = null;
        setStartDateRange('');
        setStartRangeStart(null);
        setStartRangeEnd(null);
        break;
      case 'endDate':
        next.endDateRange = '';
        next.endRangeStart = null;
        next.endRangeEnd = null;
        setEndDateRange('');
        setEndRangeStart(null);
        setEndRangeEnd(null);
        break;
      case 'keyword':
        next.keyword = '';
        next.searchScope = 'all';
        setKeyword('');
        setSearchScope('all');
        break;
      case 'progress':
        next.progressStatus = '';
        setProgressStatus('');
        break;
      default:
        break;
    }
    setAppliedSearch(isGroupBuyAppliedEmpty(next) ? null : next);
  };

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--group-buy">
      <div className="admin-list-page-header">
        <h1 className="page-title">공동구매 관리</h1>
        <div className="admin-list-page-header__actions">
          <button
            type="button"
            className="admin-list-add-btn admin-list-add-btn--secondary"
            onClick={openBenefitModal}
            aria-label="혜택 관리"
          >
            혜택관리
          </button>
          <button
            type="button"
            className="admin-list-add-btn"
            onClick={openAddGroupBuyModal}
            aria-label="공동구매 추가"
          >
            <Plus size={18} aria-hidden="true" />
            공동구매 추가
          </button>
        </div>
      </div>

      <section className="admin-list-box" aria-label="검색·필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">시작날짜</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="시작날짜 프리셋"
                className="listselect--date-range"
                value={startDateRange}
                onChange={(next) => {
                  if (!next) {
                    setStartDateRange('');
                    setStartRangeStart(null);
                    setStartRangeEnd(null);
                    return;
                  }
                  setStartDateRange(next);
                  applyDatePreset(next, setStartRangeStart, setStartRangeEnd);
                }}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={startRangeStart}
                  onChange={(date: Date | null) => {
                    setStartRangeStart(date);
                    setStartDateRange('');
                  }}
                  selectsStart
                  startDate={startRangeStart}
                  endDate={startRangeEnd}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!startRangeStart}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={startRangeEnd}
                  onChange={(date: Date | null) => {
                    setStartRangeEnd(date);
                    setStartDateRange('');
                  }}
                  selectsEnd
                  startDate={startRangeStart}
                  endDate={startRangeEnd}
                  minDate={startRangeStart ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!startRangeEnd}
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
                value={searchScope}
                onChange={setSearchScope}
                options={DETAIL_SEARCH_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="공동구매 상세검색"
              />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
            <button
              type="button"
              className={`detail-search-toggle ${detailOpen ? 'is-open' : ''}`}
              onClick={() => setDetailOpen((v) => !v)}
              aria-expanded={detailOpen}
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

        <div className={`filter-detail ${detailOpen ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">마감날짜</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="마감날짜 프리셋"
                className="listselect--date-range"
                value={endDateRange}
                onChange={(next) => {
                  if (!next) {
                    setEndDateRange('');
                    setEndRangeStart(null);
                    setEndRangeEnd(null);
                    return;
                  }
                  setEndDateRange(next);
                  applyDatePreset(next, setEndRangeStart, setEndRangeEnd);
                }}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={endRangeStart}
                  onChange={(date: Date | null) => {
                    setEndRangeStart(date);
                    setEndDateRange('');
                  }}
                  selectsStart
                  startDate={endRangeStart}
                  endDate={endRangeEnd}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!endRangeStart}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={endRangeEnd}
                  onChange={(date: Date | null) => {
                    setEndRangeEnd(date);
                    setEndDateRange('');
                  }}
                  selectsEnd
                  startDate={endRangeStart}
                  endDate={endRangeEnd}
                  minDate={endRangeStart ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!endRangeEnd}
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
              value={progressStatus}
              onChange={setProgressStatus}
              options={PROGRESS_STATUS_OPTIONS}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="공동구매 리스트">
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
                <th>공구팀명</th>
                <th>참여코드</th>
                <th>공구장</th>
                <th>혜택 내용</th>
                <th>시작 일시</th>
                <th>마감 일시</th>
                <th>참여자</th>
                <th>진행현황</th>
                <th>인원추가</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-table-empty-cell">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="cell-line">{row.teamName}</span>
                    </td>
                    <td>
                      <span className="cell-line">{row.participationCode}</span>
                    </td>
                    <td>
                      <span className="cell-line">{row.leaderName}</span>
                    </td>
                    <td className="group-buy-table__benefit-cell" aria-label="혜택 내용">
                      <ul className="group-buy-benefit-list">
                        <li>
                          <span className="list-label">제한금액</span>
                          <span className="list-value group-buy-benefit-list__value">{formatWon(row.benefitLimitAmount)}</span>
                        </li>
                        <li>
                          <span className="list-label">5명+</span>
                          <span className="group-buy-benefit-list__value">{formatWon(row.benefitFrom5) || '-'}</span>
                        </li>
                        <li>
                          <span className="list-label">10명+</span>
                          <span className="group-buy-benefit-list__value">{formatWon(row.benefitFrom10) || '-'}</span>
                        </li>
                        <li>
                          <span className="list-label">제한일수</span>
                          <span className="list-value group-buy-benefit-list__value">{row.daysAfterIssue}일</span>
                        </li>
                      </ul>
                    </td>
                    <td>
                      <span className="cell-line">{row.startDate}</span>
                    </td>
                    <td>
                      <span className="cell-line">{row.endDate}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => setParticipantDetailGroupId(row.id)}
                        aria-label={`참여자 ${row.participantCount}명 상세`}
                      >
                        {row.participantCount}명
                      </button>
                    </td>
                    <td>
                      {row.progressStatus === 'before' ? (
                        <button
                          type="button"
                          className="row-btn row-btn--status-warning"
                          onClick={() =>
                            openConfirmDialog({
                              title: '안내',
                              message: '마감 처리하시겠습니까?',
                              confirmText: '확인',
                              cancelText: '취소',
                              onConfirm: () => {
                                setRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, progressStatus: 'closed' as const } : r
                                  )
                                );
                              },
                            })
                          }
                        >
                          진행중
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="row-btn row-btn--gray group-buy-progress-btn--closed"
                          disabled
                          aria-disabled="true"
                        >
                          마감
                        </button>
                      )}
                    </td>
                    <td>
                      {row.progressStatus === 'before' ? (
                        <button
                          type="button"
                          className="row-btn row-btn--blue"
                          onClick={() => openAddMemberModal(row.id)}
                        >
                          추가
                        </button>
                      ) : (
                        <span className="cell-line">마감</span>
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
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                aria-label="첫 페이지"
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

      {benefitModalOpen && (
        <Modal open onClose={closeBenefitModal} ariaLabel="혜택 관리" variant="option">
          <Modal.Header>
            <Modal.Title>혜택 관리</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="admin-modal-field-grid">
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">사용제한 금액</span>
                <ModalInput
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={benefitDraft.limitAmount}
                  onChange={(e) => setBenefitDraft((d) => ({ ...d, limitAmount: e.target.value }))}
                  placeholder="원 단위"
                  aria-label="사용제한 금액"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">5명 이상 발급 금액</span>
                <ModalInput
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={benefitDraft.issueAmount5}
                  onChange={(e) => setBenefitDraft((d) => ({ ...d, issueAmount5: e.target.value }))}
                  placeholder="원 단위"
                  aria-label="5명 이상 발급 금액"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">10명 이상 발급 금액</span>
                <ModalInput
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={benefitDraft.issueAmount10}
                  onChange={(e) => setBenefitDraft((d) => ({ ...d, issueAmount10: e.target.value }))}
                  placeholder="원 단위"
                  aria-label="10명 이상 발급 금액"
                />
              </div>
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">쿠폰 발행 후 제한 일수</span>
                <ModalInput
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={benefitDraft.daysAfterIssue}
                  onChange={(e) => setBenefitDraft((d) => ({ ...d, daysAfterIssue: e.target.value }))}
                  placeholder="일"
                  aria-label="쿠폰 발행 후 제한 일수"
                />
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="admin-modal__btn admin-modal__btn--ghost" onClick={closeBenefitModal}>
              닫기
            </button>
            <button type="button" className="admin-modal__btn admin-modal__btn--primary" onClick={handleBenefitSave}>
              저장
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {addGroupBuyModalOpen && (
        <Modal open onClose={closeAddGroupBuyModal} ariaLabel="공동구매 추가" variant="option">
          <Modal.Header>
            <Modal.Title>공동구매 추가</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="group-buy-add-group-modal">
              <div className="admin-modal-field-grid">
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">공구명</span>
                  <ModalInput
                    type="text"
                    value={addGroupTeamName}
                    onChange={(e) => setAddGroupTeamName(e.target.value)}
                    placeholder="공구명 입력"
                    autoComplete="off"
                    aria-label="공구명"
                  />
                </div>
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">공구장</span>
                  <ModalInput
                    type="text"
                    value={addGroupLeaderName}
                    onChange={(e) => setAddGroupLeaderName(e.target.value)}
                    placeholder="공구장 이름"
                    autoComplete="name"
                    aria-label="공구장"
                  />
                </div>
                <div className="admin-modal-field-row admin-modal-field-row--align-start">
                  <span className="admin-modal-field-label">마감일</span>
                  <ModalDatePicker
                    modalOpen={addGroupBuyModalOpen}
                    className="group-buy-add-group-modal__date-wrap"
                    selected={addGroupEndDate}
                    onChange={setAddGroupEndDate}
                    placeholderText="마감일"
                    dateFormat="yyyy-MM-dd"
                    locale={ko}
                    isClearable={!!addGroupEndDate}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="scroll"
                  />
                </div>
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">노출여부</span>
                  <ListSelect
                    ariaLabel="노출여부"
                    className="listselect--modal"
                    value={addGroupExposure}
                    onChange={setAddGroupExposure}
                    options={EXPOSURE_OPTIONS}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="admin-modal__btn admin-modal__btn--ghost" onClick={closeAddGroupBuyModal}>
              닫기
            </button>
            <button type="button" className="admin-modal__btn admin-modal__btn--primary" onClick={handleAddGroupBuySubmit}>
              등록
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {addMemberTargetRow && (
        <Modal open onClose={closeAddMemberModal} ariaLabel="인원 추가" variant="option">
          <Modal.Header>
            <Modal.Title>인원 추가</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="group-buy-add-member-modal">
              <div className="admin-modal-field-grid">
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">공구명</span>
                  <span className="admin-modal-field-value">{addMemberTargetRow.teamName}</span>
                </div>
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">참여코드</span>
                  <span className="admin-modal-field-value">{addMemberTargetRow.participationCode}</span>
                </div>
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">시작 일시</span>
                  <span className="admin-modal-field-value">{addMemberTargetRow.startDate}</span>
                </div>
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">마감 일시</span>
                  <span className="admin-modal-field-value">{addMemberTargetRow.endDate}</span>
                </div>
              </div>

              <p className="group-buy-add-member-modal__section-label">추가 인원 정보</p>
              <div className="admin-modal-field-grid">
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">이름</span>
                  <ModalInput
                    type="text"
                    value={addMemberName}
                    onChange={(e) => setAddMemberName(e.target.value)}
                    placeholder="이름 입력"
                    autoComplete="name"
                    aria-label="추가 인원 이름"
                  />
                </div>
                <div className="admin-modal-field-row admin-modal-field-row--align-start">
                  <span className="admin-modal-field-label">참여일</span>
                  <ModalDatePicker
                    modalOpen={Boolean(addMemberModalRowId)}
                    selected={addMemberDate}
                    onChange={setAddMemberDate}
                    placeholderText="참여일"
                    dateFormat="yyyy-MM-dd"
                    locale={ko}
                    isClearable={!!addMemberDate}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="scroll"
                  />
                </div>
                <div className="admin-modal-field-row">
                  <span className="admin-modal-field-label">참여시간</span>
                  <ModalInput
                    type="time"
                    value={addMemberTime}
                    onChange={(e) => setAddMemberTime(e.target.value)}
                    aria-label="참여시간"
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="admin-modal__btn admin-modal__btn--ghost" onClick={closeAddMemberModal}>
              닫기
            </button>
            <button type="button" className="admin-modal__btn admin-modal__btn--primary" onClick={handleAddMemberSubmit}>
              등록
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {participantDetailGroupId && participantDetailRow && (
        <Modal
          open
          onClose={closeParticipantDetailModal}
          ariaLabel="참여자 상세"
          variant="option"
          panelClassName="option-modal__panel--wide"
        >
          <Modal.Header>
            <Modal.Title>참여자 상세 · {participantDetailRow.teamName}</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <p className="option-modal__hint group-buy-participant-modal__lead">
              공동구매 쿠폰 사용 기준으로 사용·미사용을 집계합니다.
            </p>
            <div className="admin-modal-participant-summary">
              <span>
                총 인원<strong>{participantSummary.total}명</strong>
              </span>
              <span className="admin-modal-participant-summary__sep" aria-hidden="true" />
              <span>
                사용<strong>{participantSummary.used}명</strong>
              </span>
              <span className="admin-modal-participant-summary__sep" aria-hidden="true" />
              <span>
                미사용<strong>{participantSummary.unused}명</strong>
              </span>
            </div>
            <div className="admin-modal-table-wrap">
              {participantDetailList.length === 0 ? (
                <div className="admin-modal-table-empty">참여자가 없습니다.</div>
              ) : (
                <table className="admin-modal-table">
                  <thead>
                    <tr>
                      <th>이름</th>
                      <th>연락처</th>
                      <th>참여일</th>
                      <th>쿠폰번호</th>
                      <th>현황</th>
                      <th>쿠폰발송</th>
                      <th>취소</th>
                      <th>구매상품</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participantDetailList.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="cell-line">{p.name}</span>
                        </td>
                        <td>
                          <span className="cell-line">{p.phone}</span>
                        </td>
                        <td>
                          <span className="cell-line">{p.joinDate}</span>
                        </td>
                        <td>
                          <span className="cell-line">{p.couponNumber}</span>
                        </td>
                        <td>
                          <span
                            className={
                              p.couponUsage === 'used'
                                ? 'admin-modal-coupon-status--used'
                                : 'admin-modal-coupon-status--unused'
                            }
                          >
                            {p.couponUsage === 'used' ? '사용' : '미사용'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-modal-table__cell-actions">
                            <button
                              type="button"
                              className="row-btn row-btn--blue"
                              onClick={() => window.alert('쿠폰발송(목업)')}
                            >
                              쿠폰발송
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="admin-modal-table__cell-actions">
                            <button
                              type="button"
                              className="row-btn row-btn--gray"
                              onClick={() => window.alert('참여 취소(목업)')}
                            >
                              취소
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="cell-line">{p.purchaseProduct}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              className="admin-modal__btn admin-modal__btn--ghost"
              onClick={closeParticipantDetailModal}
            >
              닫기
            </button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
