import { useEffect, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import ListSelect from '../../../components/ListSelect';
import { MOCK_ORDERS } from '../orderManagement/mock/orderVideo.mock';
import '../../../styles/adminPage.css';

const CATEGORY_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'wedding_intro', label: '식전영상' },
  { value: 'video_letter', label: '영상편지' },
  { value: 'growth_video', label: '성장영상' },
  { value: 'thanks_video', label: '감사영상' },
  { value: 'invite_video', label: '초대영상' },
  { value: 'event_video', label: '행사영상' },
  { value: 'opening_video', label: '오프닝영상' },
];

const PRODUCTION_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'attempted', label: '제작시도' },
  { value: 'completed', label: '제작완료' },
  { value: 'not_started', label: '미제작' },
];

const ORDER_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'draft', label: '시안' },
  { value: 'hq', label: '고화질' },
];

const GUEST_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'matched', label: '해당' },
  { value: 'unmatched', label: '미해당' },
];

const SIGNUP_CHANNEL_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: 'feelmaker', label: 'feelmaker' },
  { value: 'feelmotioncard', label: 'feelmotioncard' },
  { value: 'baruncompany', label: 'baruncompany' },
  { value: 'barunsonmall', label: 'barunsonmall' },
  { value: 'bhandscard', label: 'bhandscard' },
  { value: 'deardeer', label: 'deardeer' },
  { value: 'premierpaper', label: 'premierpaper' },
  { value: 'thecard', label: 'thecard' },
  { value: 'hallchuu', label: 'hallchuu' },
  { value: 'bom', label: 'bom' },
  { value: 'NAVER_STORE', label: 'NAVER_STORE' },
];

const PURCHASE_CHANNEL_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '필메이커', label: '필메이커' },
  { value: '스토어팜', label: '스토어팜' },
];

const DETAIL_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'orderNo', label: '주문번호' },
  { value: 'buyer', label: '주문자명' },
  { value: 'editor', label: '에디터명' },
];

const DATE_PRESET_OPTIONS = [
  { value: '', label: '미선택' },
  { value: 'today', label: '당일' },
  { value: '3days', label: '3일' },
  { value: '1week', label: '1주' },
  { value: '2weeks', label: '2주' },
  { value: '1month', label: '1개월' },
];

type EditorListRow = {
  id: string;
  no: string;
  purchaseChannel: string;
  signupChannel: string;
  loginId: string;
  productName: string;
  orderStatus: string;
  firstProductionDate: string;
  productionDate: string;
  orderDate: string;
};

type AppliedSearch = {
  draftDatePreset: string;
  draftStartDate: Date | null;
  draftEndDate: Date | null;
  orderDatePreset: string;
  orderStartDate: Date | null;
  orderEndDate: Date | null;
  detailScope: string;
  detailKeyword: string;
  category: string;
  productionStatus: string;
  orderStatus: string;
  guestStatus: string;
  signupChannel: string;
  purchaseChannel: string;
};

type AppliedChipKey =
  | 'draftDate'
  | 'orderDate'
  | 'detail'
  | 'category'
  | 'productionStatus'
  | 'orderStatus'
  | 'guestStatus'
  | 'signupChannel'
  | 'purchaseChannel';

function formatYmd(d: Date | null): string {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateLike(value: string): Date {
  return new Date(value.trim().replace(' ', 'T'));
}

function toDateOnlyTime(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isInCustomRange(value: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const day = toDateOnlyTime(parseDateLike(value));
  if (start && day < toDateOnlyTime(start)) return false;
  if (end && day > toDateOnlyTime(end)) return false;
  return true;
}

function isInPresetRange(value: string, preset: string): boolean {
  if (!preset) return true;
  const day = parseDateLike(value);
  const now = new Date();
  const diffDays = (toDateOnlyTime(now) - toDateOnlyTime(day)) / (1000 * 60 * 60 * 24);
  switch (preset) {
    case 'today':
      return diffDays === 0;
    case '3days':
      return diffDays >= 0 && diffDays <= 3;
    case '1week':
      return diffDays >= 0 && diffDays <= 7;
    case '2weeks':
      return diffDays >= 0 && diffDays <= 14;
    case '1month':
      return diffDays >= 0 && diffDays <= 30;
    default:
      return true;
  }
}

function getCategoryLabel(value: string): string {
  return CATEGORY_OPTIONS.find((opt) => opt.value === value)?.label ?? '';
}

function isAppliedSearchEmpty(s: AppliedSearch): boolean {
  return (
    !s.draftDatePreset &&
    !s.draftStartDate &&
    !s.draftEndDate &&
    !s.orderDatePreset &&
    !s.orderStartDate &&
    !s.orderEndDate &&
    !s.detailKeyword.trim() &&
    !s.category &&
    !s.productionStatus &&
    !s.orderStatus &&
    !s.guestStatus &&
    s.signupChannel === '전체' &&
    s.purchaseChannel === '전체'
  );
}

export default function EditorListPage() {
  const [draftDatePreset, setDraftDatePreset] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(null);
  const [orderDatePreset, setOrderDatePreset] = useState('');
  const [orderStartDate, setOrderStartDate] = useState<Date | null>(null);
  const [orderEndDate, setOrderEndDate] = useState<Date | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailScope, setDetailScope] = useState('all');
  const [detailKeyword, setDetailKeyword] = useState('');

  const [category, setCategory] = useState('');
  const [productionStatus, setProductionStatus] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [guestStatus, setGuestStatus] = useState('');
  const [signupChannel, setSignupChannel] = useState('전체');
  const [purchaseChannel, setPurchaseChannel] = useState('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const allRows: EditorListRow[] = MOCK_ORDERS.map((order) => ({
    id: order.id,
    no: `${order.no} ${order.noSub}`,
    purchaseChannel: order.purchaseChannel,
    signupChannel: order.partner,
    loginId: order.customerId,
    productName: order.productName,
    orderStatus: order.paymentStatus,
    firstProductionDate: order.firstProductionDate,
    productionDate: '-',
    orderDate: order.orderDate,
  }));

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return allRows;
    return allRows.filter((row) => {
      const useDraftCustom = appliedSearch.draftStartDate || appliedSearch.draftEndDate;
      if (useDraftCustom) {
        if (!isInCustomRange(row.firstProductionDate, appliedSearch.draftStartDate, appliedSearch.draftEndDate))
          return false;
      } else if (!isInPresetRange(row.firstProductionDate, appliedSearch.draftDatePreset)) {
        return false;
      }

      const useOrderCustom = appliedSearch.orderStartDate || appliedSearch.orderEndDate;
      if (useOrderCustom) {
        if (!isInCustomRange(row.orderDate, appliedSearch.orderStartDate, appliedSearch.orderEndDate)) return false;
      } else if (!isInPresetRange(row.orderDate, appliedSearch.orderDatePreset)) {
        return false;
      }

      const keyword = appliedSearch.detailKeyword.trim().toLowerCase();
      if (keyword) {
        if (appliedSearch.detailScope === 'orderNo' && !row.no.toLowerCase().includes(keyword)) return false;
        if (appliedSearch.detailScope === 'buyer' && !row.loginId.toLowerCase().includes(keyword)) return false;
        if (appliedSearch.detailScope === 'editor' && !row.productName.toLowerCase().includes(keyword)) return false;
        if (
          appliedSearch.detailScope === 'all' &&
          !row.no.toLowerCase().includes(keyword) &&
          !row.loginId.toLowerCase().includes(keyword) &&
          !row.productName.toLowerCase().includes(keyword)
        )
          return false;
      }

      if (appliedSearch.category) {
        const categoryLabel = getCategoryLabel(appliedSearch.category);
        if (categoryLabel && !row.productName.includes(categoryLabel) && row.productName !== categoryLabel) {
          if (!row.productName && categoryLabel) return false;
        }
      }

      if (appliedSearch.productionStatus === 'completed' && row.orderStatus !== '결제완료') return false;
      if (appliedSearch.productionStatus === 'not_started' && row.orderStatus !== '결제전') return false;
      if (appliedSearch.orderStatus === 'draft' && row.orderStatus !== '결제전') return false;
      if (appliedSearch.orderStatus === 'hq' && row.orderStatus !== '결제완료') return false;
      if (appliedSearch.guestStatus === 'matched' && !!row.signupChannel.trim()) return false;
      if (appliedSearch.guestStatus === 'unmatched' && !row.signupChannel.trim()) return false;
      if (appliedSearch.signupChannel !== '전체' && row.signupChannel !== appliedSearch.signupChannel) return false;
      if (appliedSearch.purchaseChannel !== '전체' && row.purchaseChannel !== appliedSearch.purchaseChannel) return false;
      return true;
    });
  }, [allRows, appliedSearch]);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  const summaryStats = useMemo(() => {
    const draftInflow = filteredRows.filter((row) => row.orderStatus === '결제완료').length;
    const draftAttempt = filteredRows.filter((row) => row.orderStatus !== '결제전').length;
    const draftCompleted = filteredRows.filter((row) => row.orderStatus === '결제완료').length;
    const today = formatYmd(new Date());
    const hqTodayConversion = filteredRows.filter(
      (row) => row.orderStatus === '결제완료' && row.orderDate.slice(0, 10) === today
    ).length;
    const hqTotalConversion = filteredRows.filter((row) => row.orderStatus === '결제완료').length;
    const draftNotProducedPurchase = filteredRows.filter(
      (row) => row.orderStatus === '결제완료' && row.productionDate === '-'
    ).length;

    return {
      draftInflow,
      draftAttempt,
      draftCompleted,
      hqTodayConversion,
      hqTotalConversion,
      draftNotProducedPurchase,
    };
  }, [filteredRows]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedSearch = {
      draftDatePreset,
      draftStartDate,
      draftEndDate,
      orderDatePreset,
      orderStartDate,
      orderEndDate,
      detailScope,
      detailKeyword,
      category,
      productionStatus,
      orderStatus,
      guestStatus,
      signupChannel,
      purchaseChannel,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [] as Array<{ key: AppliedChipKey; label: string }>;
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.draftStartDate || appliedSearch.draftEndDate) {
      chips.push({
        key: 'draftDate',
        label: `시안제작일: ${formatYmd(appliedSearch.draftStartDate)}${
          appliedSearch.draftStartDate && appliedSearch.draftEndDate ? ' ~ ' : ''
        }${formatYmd(appliedSearch.draftEndDate)}`,
      });
    } else if (appliedSearch.draftDatePreset) {
      const label = DATE_PRESET_OPTIONS.find((o) => o.value === appliedSearch.draftDatePreset)?.label;
      chips.push({ key: 'draftDate', label: `시안제작일: ${label}` });
    }
    if (appliedSearch.orderStartDate || appliedSearch.orderEndDate) {
      chips.push({
        key: 'orderDate',
        label: `주문일: ${formatYmd(appliedSearch.orderStartDate)}${
          appliedSearch.orderStartDate && appliedSearch.orderEndDate ? ' ~ ' : ''
        }${formatYmd(appliedSearch.orderEndDate)}`,
      });
    } else if (appliedSearch.orderDatePreset) {
      const label = DATE_PRESET_OPTIONS.find((o) => o.value === appliedSearch.orderDatePreset)?.label;
      chips.push({ key: 'orderDate', label: `주문일: ${label}` });
    }
    if (appliedSearch.detailKeyword.trim()) chips.push({ key: 'detail', label: `상세검색: ${appliedSearch.detailKeyword}` });
    if (appliedSearch.category) chips.push({ key: 'category', label: `카테고리별: ${getCategoryLabel(appliedSearch.category)}` });
    if (appliedSearch.productionStatus)
      chips.push({
        key: 'productionStatus',
        label: `제작현황: ${PRODUCTION_STATUS_OPTIONS.find((o) => o.value === appliedSearch.productionStatus)?.label}`,
      });
    if (appliedSearch.orderStatus)
      chips.push({
        key: 'orderStatus',
        label: `주문현황: ${ORDER_STATUS_OPTIONS.find((o) => o.value === appliedSearch.orderStatus)?.label}`,
      });
    if (appliedSearch.guestStatus)
      chips.push({
        key: 'guestStatus',
        label: `게스트여부: ${GUEST_OPTIONS.find((o) => o.value === appliedSearch.guestStatus)?.label}`,
      });
    if (appliedSearch.signupChannel !== '전체') chips.push({ key: 'signupChannel', label: `가입채널: ${appliedSearch.signupChannel}` });
    if (appliedSearch.purchaseChannel !== '전체')
      chips.push({ key: 'purchaseChannel', label: `구매채널: ${appliedSearch.purchaseChannel}` });
    return chips;
  }, [appliedSearch]);

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'draftDate') {
      next.draftDatePreset = '';
      next.draftStartDate = null;
      next.draftEndDate = null;
      setDraftDatePreset('');
      setDraftStartDate(null);
      setDraftEndDate(null);
    }
    if (key === 'orderDate') {
      next.orderDatePreset = '';
      next.orderStartDate = null;
      next.orderEndDate = null;
      setOrderDatePreset('');
      setOrderStartDate(null);
      setOrderEndDate(null);
    }
    if (key === 'detail') {
      next.detailKeyword = '';
      setDetailKeyword('');
    }
    if (key === 'category') {
      next.category = '';
      setCategory('');
    }
    if (key === 'productionStatus') {
      next.productionStatus = '';
      setProductionStatus('');
    }
    if (key === 'orderStatus') {
      next.orderStatus = '';
      setOrderStatus('');
    }
    if (key === 'guestStatus') {
      next.guestStatus = '';
      setGuestStatus('');
    }
    if (key === 'signupChannel') {
      next.signupChannel = '전체';
      setSignupChannel('전체');
    }
    if (key === 'purchaseChannel') {
      next.purchaseChannel = '전체';
      setPurchaseChannel('전체');
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">에디터 리스트</h1>

      <section className="admin-stat-section" aria-label="에디터 제작 지표">
        <div className="admin-stat-cards admin-stat-cards--6">
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">시안제작중 유입</p>
            <p className="admin-stat-value">{summaryStats.draftInflow}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">시안제작-시도</p>
            <p className="admin-stat-value">{summaryStats.draftAttempt}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">시안제작-완료</p>
            <p className="admin-stat-value">{summaryStats.draftCompleted}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">고화질 당일 전환</p>
            <p className="admin-stat-value">{summaryStats.hqTodayConversion}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">고화질 총 전환</p>
            <p className="admin-stat-value">{summaryStats.hqTotalConversion}</p>
          </div>
          <div className="admin-stat-card admin-stat-card--auto">
            <p className="admin-stat-label">시안 미제작 구매</p>
            <p className="admin-stat-value">{summaryStats.draftNotProducedPurchase}</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색 결과">
        <p className="admin-list-result">검색 결과 {filteredRows.length}건</p>
      </section>

      <section className="admin-list-box" aria-label="검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">시안제작일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="시안제작일 프리셋"
                className="listselect--date-range"
                value={draftDatePreset}
                onChange={setDraftDatePreset}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={draftStartDate}
                  onChange={(date: Date | null) => setDraftStartDate(date)}
                  selectsStart
                  startDate={draftStartDate}
                  endDate={draftEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!draftStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={draftEndDate}
                  onChange={(date: Date | null) => setDraftEndDate(date)}
                  selectsEnd
                  startDate={draftStartDate}
                  endDate={draftEndDate}
                  minDate={draftStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!draftEndDate}
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
                value={detailScope}
                onChange={setDetailScope}
                options={DETAIL_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={detailKeyword}
                onChange={(e) => setDetailKeyword(e.target.value)}
                aria-label="상세검색어"
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
              onClick={() => setDetailOpen((prev) => !prev)}
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
            <span className="filter-label">주문일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="주문일 프리셋"
                className="listselect--date-range"
                value={orderDatePreset}
                onChange={setOrderDatePreset}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={orderStartDate}
                  onChange={(date: Date | null) => setOrderStartDate(date)}
                  selectsStart
                  startDate={orderStartDate}
                  endDate={orderEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!orderStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={orderEndDate}
                  onChange={(date: Date | null) => setOrderEndDate(date)}
                  selectsEnd
                  startDate={orderStartDate}
                  endDate={orderEndDate}
                  minDate={orderStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!orderEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">카테고리별</span>
            <ListSelect ariaLabel="카테고리별" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
          </div>

          <div className="filter-section">
            <span className="filter-label">제작현황</span>
            <ListSelect
              ariaLabel="제작현황"
              value={productionStatus}
              onChange={setProductionStatus}
              options={PRODUCTION_STATUS_OPTIONS}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">주문현황</span>
            <ListSelect ariaLabel="주문현황" value={orderStatus} onChange={setOrderStatus} options={ORDER_STATUS_OPTIONS} />
          </div>

          {/* <div className="filter-section">
            <span className="filter-label">게스트여부</span>
            <ListSelect ariaLabel="게스트여부" value={guestStatus} onChange={setGuestStatus} options={GUEST_OPTIONS} />
          </div> */}

          <div className="filter-section">
            <span className="filter-label">가입채널</span>
            <ListSelect
              ariaLabel="가입채널"
              value={signupChannel}
              onChange={setSignupChannel}
              options={SIGNUP_CHANNEL_OPTIONS}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">구매채널</span>
            <ListSelect
              ariaLabel="구매채널"
              value={purchaseChannel}
              onChange={setPurchaseChannel}
              options={PURCHASE_CHANNEL_OPTIONS}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="검색 리스트">
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
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th>NO</th>
                <th>구매채널/가입채널</th>
                <th>아이디</th>
                <th>제작상품</th>
                <th>주문현황</th>
                <th>최초제작날짜</th>
                <th>제작날짜</th>
                <th>주문날짜</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-table-empty-cell">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.no}</td>
                    <td>
                      <div className="cell-block cell-block--channels">
                        <span className="cell-line">
                          <span className="list-label">구매</span>{' '}
                          <span className="list-value">{row.purchaseChannel}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">가입</span>{' '}
                          <span className="list-value">{row.signupChannel}</span>
                        </span>
                      </div>
                    </td>
                    <td>{row.loginId}</td>
                    <td>{row.productName}</td>
                    <td>{row.orderStatus}</td>
                    <td>{row.firstProductionDate}</td>
                    <td>{row.productionDate}</td>
                    <td>{row.orderDate}</td>
                  </tr>
                ))
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
