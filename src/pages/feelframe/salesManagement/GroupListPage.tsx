import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Modal, { ModalDatePicker, ModalInput } from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import { pagePath } from '../../../routes';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import { MOCK_FEELFRAME_GROUP_LIST, type FeelframeGroupRow } from './mock/groupList.mock';
import GroupDetailPage from './GroupDetailPage';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '그룹명', label: '그룹명' },
  { value: '그룹장명', label: '그룹장명' },
  { value: '그룹코드', label: '그룹코드' },
  { value: '전화번호', label: '전화번호' },
] as const;

const CLOSE_STATUS_OPTIONS = ['전체보기', '마감전', '마감완료'] as const;
const DISPLAY_STATUS_OPTIONS = ['전체보기', '노출', '미노출'] as const;
const VOUCHER_TYPE_OPTIONS = ['전체보기', '네이버포인트', '배달의민족', '올리브영', '신세계백화점'] as const;
const VOUCHER_STATUS_OPTIONS = ['전체보기', '지급전', '인원미달', '지급완료'] as const;

type DetailSearchType = (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];

type AppliedSearch = {
  startDateRange: string;
  groupStartDate: Date | null;
  groupEndDate: Date | null;
  closeDateRange: string;
  closeStartDate: Date | null;
  closeEndDate: Date | null;
  detailSearchType: DetailSearchType;
  keyword: string;
  closeStatus: (typeof CLOSE_STATUS_OPTIONS)[number];
  displayStatus: (typeof DISPLAY_STATUS_OPTIONS)[number];
  voucherType: (typeof VOUCHER_TYPE_OPTIONS)[number];
  voucherStatus: (typeof VOUCHER_STATUS_OPTIONS)[number];
};

type AppliedChipKey =
  | 'startDate'
  | 'closeDate'
  | 'keyword'
  | 'closeStatus'
  | 'displayStatus'
  | 'voucherType'
  | 'voucherStatus';

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

type AddPeopleForm = {
  name: string;
  phone: string;
  joinedDate: string;
  joinedTime: string;
};

type AddGroupForm = {
  displayStatus: FeelframeGroupRow['displayStatus'];
  groupName: string;
  leaderName: string;
  leaderPhone: string;
  createdDate: Date | null;
  createdTime: string;
  closeDate: Date | null;
};

const ITEMS_PER_PAGE = 10;

const LIST_PATH = pagePath({
  navId: 'feelframe',
  sectionId: 'salesManagement',
  itemId: 'groupList',
});

function getDateRangeByPreset(preset: string): { start: Date; end: Date } {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);

  if (preset === '3일') start.setDate(start.getDate() - 2);
  if (preset === '1주') start.setDate(start.getDate() - 6);
  if (preset === '2주') start.setDate(start.getDate() - 13);
  if (preset === '1개월') start.setDate(start.getDate() - 29);
  if (preset === '3개월') start.setDate(start.getDate() - 89);
  if (preset === '6개월') start.setDate(start.getDate() - 179);

  return { start, end };
}

function formatYmd(d: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseYmd(value: string) {
  const [yyyy, mm, dd] = value.split('-').map(Number);
  return new Date(yyyy, mm - 1, dd);
}

function isDateInRange(value: string, start: Date | null, end: Date | null) {
  const target = parseYmd(value);
  const startBoundary = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0) : null;
  const endBoundary = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999) : null;

  if (startBoundary && target < startBoundary) return false;
  if (endBoundary && target > endBoundary) return false;
  return true;
}

function isAppliedSearchEmpty(search: AppliedSearch | null) {
  if (!search) return true;
  return (
    !search.startDateRange &&
    search.groupStartDate == null &&
    search.groupEndDate == null &&
    !search.closeDateRange &&
    search.closeStartDate == null &&
    search.closeEndDate == null &&
    !search.keyword.trim() &&
    search.closeStatus === '전체보기' &&
    search.displayStatus === '전체보기' &&
    search.voucherType === '전체보기' &&
    search.voucherStatus === '전체보기'
  );
}

function applyGroupFilters(rows: FeelframeGroupRow[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    if (!isDateInRange(row.startDate, search.groupStartDate, search.groupEndDate)) return false;
    if (!isDateInRange(row.closeDate, search.closeStartDate, search.closeEndDate)) return false;
    if (search.closeStatus !== '전체보기' && row.closeStatus !== search.closeStatus) return false;
    if (search.displayStatus !== '전체보기' && row.displayStatus !== search.displayStatus) return false;
    if (search.voucherType !== '전체보기' && row.voucherType !== search.voucherType) return false;
    if (search.voucherStatus !== '전체보기' && row.voucherStatus !== search.voucherStatus) return false;

    if (keyword) {
      const fieldMap: Record<DetailSearchType, string> = {
        전체: [row.groupName, row.leaderName, row.participationCode, row.leaderPhone].join(' '),
        그룹명: row.groupName,
        그룹장명: row.leaderName,
        그룹코드: row.participationCode,
        전화번호: row.leaderPhone,
      };
      if (!fieldMap[search.detailSearchType].toLowerCase().includes(keyword)) return false;
    }

    return true;
  });
}

function groupDetailPath(id: string) {
  return pagePath({
    navId: 'feelframe',
    sectionId: 'salesManagement',
    itemId: 'groupList',
    subId: id,
  });
}

function getCloseStatusButtonClassName(status: FeelframeGroupRow['closeStatus']) {
  return `row-btn ${status === '마감완료' ? 'row-btn--status-danger' : 'row-btn--status-secondary'}`;
}

function getCloseStatusProgressClassName(status: FeelframeGroupRow['closeStatus']) {
  return `progress-status ${status === '마감완료' ? 'progress-status--danger' : 'progress-status--secondary'}`;
}

function getTodayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTimeHms() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()].map((value) => String(value).padStart(2, '0')).join(':');
}

function createParticipationCode() {
  return String(Math.floor(1000000 + Math.random() * 9000000));
}

export default function GroupListPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [rows, setRows] = useState<FeelframeGroupRow[]>(() => [...MOCK_FEELFRAME_GROUP_LIST]);
  const [startDateRange, setStartDateRange] = useState('');
  const [groupStartDate, setGroupStartDate] = useState<Date | null>(null);
  const [groupEndDate, setGroupEndDate] = useState<Date | null>(null);
  const [detailSearchType, setDetailSearchType] = useState<DetailSearchType>('전체');
  const [keyword, setKeyword] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [closeDateRange, setCloseDateRange] = useState('');
  const [closeStartDate, setCloseStartDate] = useState<Date | null>(null);
  const [closeEndDate, setCloseEndDate] = useState<Date | null>(null);
  const [closeStatus, setCloseStatus] = useState<(typeof CLOSE_STATUS_OPTIONS)[number]>('전체보기');
  const [displayStatus, setDisplayStatus] = useState<(typeof DISPLAY_STATUS_OPTIONS)[number]>('전체보기');
  const [voucherType, setVoucherType] = useState<(typeof VOUCHER_TYPE_OPTIONS)[number]>('전체보기');
  const [voucherStatus, setVoucherStatus] = useState<(typeof VOUCHER_STATUS_OPTIONS)[number]>('전체보기');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [addGroupModalOpen, setAddGroupModalOpen] = useState(false);
  const [addPeopleModalGroupId, setAddPeopleModalGroupId] = useState<string | null>(null);
  const [voucherModalGroupId, setVoucherModalGroupId] = useState<string | null>(null);
  const [addGroupForm, setAddGroupForm] = useState<AddGroupForm>({
    displayStatus: '노출',
    groupName: '',
    leaderName: '',
    leaderPhone: '',
    createdDate: new Date(),
    createdTime: getCurrentTimeHms(),
    closeDate: null,
  });
  const [addPeopleForm, setAddPeopleForm] = useState<AddPeopleForm>({
    name: '',
    phone: '',
    joinedDate: getTodayYmd(),
    joinedTime: '',
  });

  const filteredRows = useMemo(() => applyGroupFilters(rows, appliedSearch), [rows, appliedSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, displayPage]);
  const addPeopleTarget = useMemo(
    () => rows.find((row) => row.id === addPeopleModalGroupId) ?? null,
    [rows, addPeopleModalGroupId]
  );
  const voucherTarget = useMemo(
    () => rows.find((row) => row.id === voucherModalGroupId) ?? null,
    [rows, voucherModalGroupId]
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleStartDatePresetChange = (next: string) => {
    if (!next) {
      setStartDateRange('');
      setGroupStartDate(null);
      setGroupEndDate(null);
      return;
    }

    setStartDateRange(next);
    const { start, end } = getDateRangeByPreset(next);
    setGroupStartDate(start);
    setGroupEndDate(end);
  };

  const handleCloseDatePresetChange = (next: string) => {
    if (!next) {
      setCloseDateRange('');
      setCloseStartDate(null);
      setCloseEndDate(null);
      return;
    }

    setCloseDateRange(next);
    const { start, end } = getDateRangeByPreset(next);
    setCloseStartDate(start);
    setCloseEndDate(end);
  };

  const handleSearch = () => {
    const next: AppliedSearch = {
      startDateRange,
      groupStartDate,
      groupEndDate,
      closeDateRange,
      closeStartDate,
      closeEndDate,
      detailSearchType,
      keyword,
      closeStatus,
      displayStatus,
      voucherType,
      voucherStatus,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
    setCurrentPage(1);
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };

    switch (key) {
      case 'startDate':
        setStartDateRange('');
        setGroupStartDate(null);
        setGroupEndDate(null);
        next.startDateRange = '';
        next.groupStartDate = null;
        next.groupEndDate = null;
        break;
      case 'closeDate':
        setCloseDateRange('');
        setCloseStartDate(null);
        setCloseEndDate(null);
        next.closeDateRange = '';
        next.closeStartDate = null;
        next.closeEndDate = null;
        break;
      case 'keyword':
        setKeyword('');
        setDetailSearchType('전체');
        next.keyword = '';
        next.detailSearchType = '전체';
        break;
      case 'closeStatus':
        setCloseStatus('전체보기');
        next.closeStatus = '전체보기';
        break;
      case 'displayStatus':
        setDisplayStatus('전체보기');
        next.displayStatus = '전체보기';
        break;
      case 'voucherType':
        setVoucherType('전체보기');
        next.voucherType = '전체보기';
        break;
      case 'voucherStatus':
        setVoucherStatus('전체보기');
        next.voucherStatus = '전체보기';
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

    if (appliedSearch.startDateRange || appliedSearch.groupStartDate || appliedSearch.groupEndDate) {
      chips.push({
        key: 'startDate',
        label: `시작일: ${appliedSearch.startDateRange || `${formatYmd(appliedSearch.groupStartDate) || '시작'} ~ ${formatYmd(appliedSearch.groupEndDate) || '종료'}`}`,
      });
    }
    if (appliedSearch.closeDateRange || appliedSearch.closeStartDate || appliedSearch.closeEndDate) {
      chips.push({
        key: 'closeDate',
        label: `마감일: ${appliedSearch.closeDateRange || `${formatYmd(appliedSearch.closeStartDate) || '시작'} ~ ${formatYmd(appliedSearch.closeEndDate) || '종료'}`}`,
      });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.detailSearchType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.closeStatus !== '전체보기') {
      chips.push({ key: 'closeStatus', label: `마감현황: ${appliedSearch.closeStatus}` });
    }
    if (appliedSearch.displayStatus !== '전체보기') {
      chips.push({ key: 'displayStatus', label: `사이트노출여부: ${appliedSearch.displayStatus}` });
    }
    if (appliedSearch.voucherType !== '전체보기') {
      chips.push({ key: 'voucherType', label: `상품권종류: ${appliedSearch.voucherType}` });
    }
    if (appliedSearch.voucherStatus !== '전체보기') {
      chips.push({ key: 'voucherStatus', label: `상품권지급: ${appliedSearch.voucherStatus}` });
    }

    return chips;
  }, [appliedSearch]);

  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleDelete = (row: FeelframeGroupRow) => {
    setConfirmDialog({
      title: '공동구매 그룹 삭제',
      message: `${row.groupName} 그룹을 삭제하시겠습니까?`,
      confirmText: '삭제',
      cancelText: '취소',
      danger: true,
      onConfirm: () => {
        setRows((prev) => prev.filter((item) => item.id !== row.id));
      },
    });
  };

  const handleCloseGroup = (row: FeelframeGroupRow) => {
    setConfirmDialog({
      title: '마감 처리',
      message: '마감 처리하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: () => {
        setRows((prev) =>
          prev.map((item) => (item.id === row.id ? { ...item, closeStatus: '마감완료' } : item))
        );
      },
    });
  };

  const handleToggleDisplayStatus = (row: FeelframeGroupRow) => {
    setConfirmDialog({
      message: '변경하시겠습니까?',
      confirmText: '확인',
      cancelText: '취소',
      onConfirm: () => {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? { ...item, displayStatus: item.displayStatus === '노출' ? '미노출' : '노출' }
              : item,
          ),
        );
      },
    });
  };

  const openAddGroupModal = () => {
    setAddGroupForm({
      displayStatus: '노출',
      groupName: '',
      leaderName: '',
      leaderPhone: '',
      createdDate: new Date(),
      createdTime: getCurrentTimeHms(),
      closeDate: null,
    });
    setAddGroupModalOpen(true);
  };

  const closeAddGroupModal = () => {
    setAddGroupModalOpen(false);
  };

  const handleAddGroupFormChange = <K extends keyof AddGroupForm>(key: K, value: AddGroupForm[K]) => {
    setAddGroupForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddGroupSubmit = () => {
    setRows((prev) => [
      {
        id: `group-${Date.now()}`,
        displayStatus: addGroupForm.displayStatus,
        participationCode: createParticipationCode(),
        groupName: addGroupForm.groupName || '신규 공동구매',
        leaderName: addGroupForm.leaderName || '-',
        leaderPhone: addGroupForm.leaderPhone || '-',
        startDate: formatYmd(addGroupForm.createdDate) || getTodayYmd(),
        closeDate: formatYmd(addGroupForm.closeDate) || getTodayYmd(),
        participantCount: 0,
        userCount: 0,
        closeStatus: '마감전',
        addPeopleCount: 0,
        voucherType: '네이버포인트',
        voucherStatus: '지급전',
      },
      ...prev,
    ]);
    setCurrentPage(1);
    closeAddGroupModal();
  };

  const openAddPeopleModal = (groupId: string) => {
    setAddPeopleModalGroupId(groupId);
    setAddPeopleForm({
      name: '',
      phone: '',
      joinedDate: getTodayYmd(),
      joinedTime: '',
    });
  };

  const closeAddPeopleModal = () => {
    setAddPeopleModalGroupId(null);
  };

  const closeVoucherModal = () => {
    setVoucherModalGroupId(null);
  };

  const updateVoucherStatus = (groupId: string, voucherStatus: FeelframeGroupRow['voucherStatus']) => {
    setRows((prev) => prev.map((row) => (row.id === groupId ? { ...row, voucherStatus } : row)));
    closeVoucherModal();
  };

  const handleAddPeopleFormChange = (key: keyof AddPeopleForm, value: string) => {
    setAddPeopleForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddPeopleSubmit = () => {
    if (!addPeopleModalGroupId) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === addPeopleModalGroupId
          ? {
              ...row,
              addPeopleCount: row.addPeopleCount + 1,
              participantCount: row.participantCount + 1,
              userCount: row.userCount + 1,
            }
          : row
      )
    );
    closeAddPeopleModal();
  };

  if (subId) {
    const target = rows.find((row) => row.id === subId);
    return <GroupDetailPage row={target ?? null} listPath={LIST_PATH} />;
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-page-header">
        <h1 className="page-title">공동구매 관리</h1>
        <div className="admin-list-page-header__actions">
          <button type="button" className="admin-list-add-btn" onClick={openAddGroupModal} aria-label="공동구매 추가">
            <Plus size={18} aria-hidden="true" />
            공동구매 추가
          </button>
        </div>
      </div>

      <section className="admin-list-box" aria-label="공동구매 검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">시작일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="시작일 프리셋"
                className="listselect--date-range"
                value={startDateRange}
                onChange={handleStartDatePresetChange}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={groupStartDate}
                  onChange={(date: Date | null) => {
                    setGroupStartDate(date);
                    setStartDateRange('');
                  }}
                  selectsStart
                  startDate={groupStartDate}
                  endDate={groupEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!groupStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={groupEndDate}
                  onChange={(date: Date | null) => {
                    setGroupEndDate(date);
                    setStartDateRange('');
                  }}
                  selectsEnd
                  startDate={groupStartDate}
                  endDate={groupEndDate}
                  minDate={groupStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!groupEndDate}
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
                onChange={(next) => setDetailSearchType(next as DetailSearchType)}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="공동구매 상세검색어"
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
              onClick={() => setFilterExpanded((prev) => !prev)}
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
            <span className="filter-label">마감일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="마감일 프리셋"
                className="listselect--date-range"
                value={closeDateRange}
                onChange={handleCloseDatePresetChange}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((range) => ({ value: range, label: range })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={closeStartDate}
                  onChange={(date: Date | null) => {
                    setCloseStartDate(date);
                    setCloseDateRange('');
                  }}
                  selectsStart
                  startDate={closeStartDate}
                  endDate={closeEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!closeStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={closeEndDate}
                  onChange={(date: Date | null) => {
                    setCloseEndDate(date);
                    setCloseDateRange('');
                  }}
                  selectsEnd
                  startDate={closeStartDate}
                  endDate={closeEndDate}
                  minDate={closeStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!closeEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">마감현황</span>
            <ListSelect
              ariaLabel="마감현황"
              value={closeStatus}
              onChange={(next) => setCloseStatus(next as (typeof CLOSE_STATUS_OPTIONS)[number])}
              options={CLOSE_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">사이트노출여부</span>
            <ListSelect
              ariaLabel="사이트노출여부"
              value={displayStatus}
              onChange={(next) => setDisplayStatus(next as (typeof DISPLAY_STATUS_OPTIONS)[number])}
              options={DISPLAY_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">상품권지급</span>
            <ListSelect
              ariaLabel="상품권지급"
              value={voucherStatus}
              onChange={(next) => setVoucherStatus(next as (typeof VOUCHER_STATUS_OPTIONS)[number])}
              options={VOUCHER_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">상품권종류</span>
            <ListSelect
              ariaLabel="상품권종류"
              value={voucherType}
              onChange={(next) => setVoucherType(next as (typeof VOUCHER_TYPE_OPTIONS)[number])}
              options={VOUCHER_TYPE_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="공동구매 그룹 리스트">
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
          <table className="admin-table admin-table--min-w-1024">
            <thead>
              <tr>
                <th className="col-center">노출여부</th>
                <th>참여코드</th>
                <th>공구명</th>
                <th>공구장</th>
                <th className="col-center">시작일</th>
                <th className="col-center">마감일</th>
                <th className="col-center">참여자/사용자</th>
                <th className="col-center">마감현황</th>
                <th className="col-center">인원추가</th>
                <th className="col-center">상품권 현황</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-center">
                      <button
                        type="button"
                        className={`row-btn ${row.displayStatus === '노출' ? 'row-btn--primary' : 'row-btn--gray'}`}
                        onClick={() => handleToggleDisplayStatus(row)}
                      >
                        {row.displayStatus}
                      </button>
                    </td>
                    <td>{row.participationCode}</td>
                    <td className="admin-table-col-title">
                      <Link to={groupDetailPath(row.id)} className="admin-link admin-table-title-link" title={row.groupName}>
                        {row.groupName}
                      </Link>
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{row.leaderName}</span>
                        <span className="cell-line admin-list-muted">{row.leaderPhone}</span>
                      </div>
                    </td>
                    <td className="col-center">{row.startDate}</td>
                    <td className="col-center">{row.closeDate}</td>
                    <td className="col-center">
                      <span>{row.participantCount.toLocaleString()}</span>
                      <span> / </span>
                      {row.closeStatus === '마감완료' ? (
                        <span className="text-color-blue">{row.userCount.toLocaleString()}</span>
                      ) : (
                        <span className="text-danger">마감전</span>
                      )}
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className={getCloseStatusButtonClassName(row.closeStatus)}
                        onClick={() => {
                          if (row.closeStatus === '마감전') handleCloseGroup(row);
                        }}
                      >
                        <span className={getCloseStatusProgressClassName(row.closeStatus)}>
                          <span className="progress-status__dot" aria-hidden="true" />
                          <span className="progress-status__text">
                            {row.closeStatus === '마감완료' ? '마감완료' : '마감처리'}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="col-center">
                      <button type="button" className="row-btn row-btn--default" onClick={() => openAddPeopleModal(row.id)}>
                        인원추가
                      </button>
                    </td>
                    <td className="col-center">
                      <div className="cell-block" style={{ alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`row-btn ${
                            row.voucherStatus === '지급완료'
                              ? 'row-btn--blue'
                              : row.voucherStatus === '인원미달'
                                ? 'row-btn--red'
                                : 'row-btn--default'
                          }`}
                          onClick={() => setVoucherModalGroupId(row.id)}
                        >
                          {row.voucherStatus}
                        </button>
                        <span className="cell-line">{row.voucherType}</span>
                      </div>
                    </td>
                    <td className="col-center">
                      <button type="button" className="row-btn row-btn--red" onClick={() => handleDelete(row)}>
                        삭제
                      </button>
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
                onClick={() => setCurrentPage(jumpPageBack(displayPage))}
                disabled={displayPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
                disabled={displayPage <= 1}
                aria-label="이전 페이지"
              >
                &lsaquo;
              </button>
              {getVisiblePageNumbers(totalPages, displayPage).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={displayPage === page ? 'active' : ''}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(totalPages, displayPage + 1))}
                disabled={displayPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(jumpPageForward(displayPage, totalPages))}
                disabled={displayPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      <Modal open={addGroupModalOpen} onClose={closeAddGroupModal} ariaLabel="공동구매 추가" variant="option">
        <Modal.Header>
          <Modal.Title>공동구매 추가</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">사이트 노출</span>
              <ListSelect
                ariaLabel="사이트 노출"
                className="listselect--modal"
                value={addGroupForm.displayStatus}
                onChange={(next) => handleAddGroupFormChange('displayStatus', next as AddGroupForm['displayStatus'])}
                options={[
                  { value: '노출', label: '노출' },
                  { value: '미노출', label: '미노출' },
                ]}
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-name">
                공구명
              </label>
              <ModalInput
                id="group-add-name"
                type="text"
                value={addGroupForm.groupName}
                onChange={(e) => handleAddGroupFormChange('groupName', e.target.value)}
                placeholder="공구명 입력"
                autoComplete="off"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-leader-name">
                공구장이름
              </label>
              <ModalInput
                id="group-add-leader-name"
                type="text"
                value={addGroupForm.leaderName}
                onChange={(e) => handleAddGroupFormChange('leaderName', e.target.value)}
                placeholder="공구장 이름 입력"
                autoComplete="name"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-leader-phone">
                공구장 전화번호
              </label>
              <ModalInput
                id="group-add-leader-phone"
                type="tel"
                value={addGroupForm.leaderPhone}
                onChange={(e) => handleAddGroupFormChange('leaderPhone', e.target.value)}
                placeholder="전화번호 입력"
                autoComplete="tel"
              />
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">생성일</span>
              <div className="option-modal__inline-controls option-modal__inline-controls--stacked">
                <ModalDatePicker
                  modalOpen={addGroupModalOpen}
                  selected={addGroupForm.createdDate}
                  onChange={(date) => handleAddGroupFormChange('createdDate', date)}
                  placeholderText="생성일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  isClearable={!!addGroupForm.createdDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <ModalInput
                  type="time"
                  step={1}
                  value={addGroupForm.createdTime}
                  onChange={(e) => handleAddGroupFormChange('createdTime', e.target.value)}
                  aria-label="생성 시간"
                />
              </div>
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">마감일</span>
              <ModalDatePicker
                modalOpen={addGroupModalOpen}
                selected={addGroupForm.closeDate}
                onChange={(date) => handleAddGroupFormChange('closeDate', date)}
                placeholderText="마감일"
                dateFormat="yyyy-MM-dd"
                locale={ko}
                isClearable={!!addGroupForm.closeDate}
                showMonthDropdown
                showYearDropdown
                dropdownMode="scroll"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeAddGroupModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleAddGroupSubmit}>
            등록
          </button>
        </Modal.Footer>
      </Modal>

      <Modal open={Boolean(addPeopleTarget)} onClose={closeAddPeopleModal} ariaLabel="인원추가" variant="option">
        <Modal.Header>
          <Modal.Title>인원추가</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">공구명</span>
              <span className="admin-modal-field-value">{addPeopleTarget?.groupName ?? '-'}</span>
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-people-name">
                이름
              </label>
              <ModalInput
                id="group-add-people-name"
                type="text"
                value={addPeopleForm.name}
                onChange={(e) => handleAddPeopleFormChange('name', e.target.value)}
                placeholder="이름 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-people-phone">
                연락처
              </label>
              <ModalInput
                id="group-add-people-phone"
                type="tel"
                value={addPeopleForm.phone}
                onChange={(e) => handleAddPeopleFormChange('phone', e.target.value)}
                placeholder="연락처 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-people-date">
                참여일
              </label>
              <ModalInput
                id="group-add-people-date"
                type="date"
                value={addPeopleForm.joinedDate}
                onChange={(e) => handleAddPeopleFormChange('joinedDate', e.target.value)}
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="group-add-people-time">
                참여시간
              </label>
              <ModalInput
                id="group-add-people-time"
                type="time"
                value={addPeopleForm.joinedTime}
                onChange={(e) => handleAddPeopleFormChange('joinedTime', e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeAddPeopleModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleAddPeopleSubmit}>
            추가하기
          </button>
        </Modal.Footer>
      </Modal>

      <Modal open={Boolean(voucherTarget)} onClose={closeVoucherModal} ariaLabel="상품권 현황" variant="option">
        <Modal.Header>
          <Modal.Title>상품권 현황</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">상품권종류</span>
              <span className="admin-modal-field-value">{voucherTarget?.voucherType ?? '-'}</span>
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">지급현황</span>
              <span className="admin-modal-field-value">{voucherTarget?.voucherStatus ?? '-'}</span>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeVoucherModal}>
            닫기
          </button>
          {voucherTarget?.voucherStatus === '지급전' && (
            <>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--danger"
                onClick={() => updateVoucherStatus(voucherTarget.id, '인원미달')}
              >
                인원미달
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => updateVoucherStatus(voucherTarget.id, '지급완료')}
              >
                지급완료
              </button>
            </>
          )}
          {voucherTarget?.voucherStatus === '지급완료' && (
            <button
              type="button"
              className="option-modal__btn option-modal__btn--primary"
              onClick={() => updateVoucherStatus(voucherTarget.id, '지급전')}
            >
              상태 변경
            </button>
          )}
        </Modal.Footer>
      </Modal>

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
