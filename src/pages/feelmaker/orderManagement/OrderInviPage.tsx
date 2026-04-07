import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mail, Pencil, QrCode, RefreshCw, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import {
  MOCK_INVITE_ORDERS,
  type InviteOrder,
  type InviteType,
  type PaymentStatus,
} from './mock/orderInvi.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

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

type AppliedSearch = {
  startDate: Date | null;
  endDate: Date | null;
  detailOrderStartDate: Date | null;
  detailOrderEndDate: Date | null;
  detailWeddingStartDate: Date | null;
  detailWeddingEndDate: Date | null;
  conditionType: '이름' | '아이디' | '주문번호';
  keyword: string;
  skinType: string;
  optionStatus: string;
  urlStatus: string;
  paymentStatus: '' | PaymentStatus;
};

type PaymentFilterValue = '' | PaymentStatus;
type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};
type AppliedChipKey =
  | 'date'
  | 'detailOrderDate'
  | 'detailWeddingDate'
  | 'keyword'
  | 'skinType'
  | 'optionStatus'
  | 'urlStatus'
  | 'paymentStatus';

const SKIN_TYPE_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'pro_mode', label: 'pro_mode' },
  { value: 'Fall in love', label: 'Fall in love' },
  { value: 'Wedding day', label: 'Wedding day' },
  { value: 'Promise', label: 'Promise' },
  { value: 'Everything', label: 'Everything' },
  { value: 'love_motion', label: 'love_motion' },
  { value: 'lovely_day', label: 'lovely_day' },
  { value: 'fairy', label: 'fairy' },
  { value: 'fairy_t', label: 'fairy_t' },
  { value: 'littlestar', label: 'littlestar' },
  { value: 'littlestar_t', label: 'littlestar_t' },
  { value: 'flower', label: 'flower' },
  { value: 'flower_t', label: 'flower_t' },
  { value: 'party', label: 'party' },
  { value: 'party_t', label: 'party_t' },
  { value: 'pure', label: 'pure' },
  { value: 'pure_t', label: 'pure_t' },
  { value: 'sunshine', label: 'sunshine' },
  { value: 'sunshine_t', label: 'sunshine_t' },
] as const;

const OPTION_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: '사용', label: '사용' },
  { value: '미사용', label: '미사용' },
] as const;

const URL_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: '입력전', label: '입력전' },
  { value: '입력완료', label: '입력완료' },
] as const;

const INVITE_TYPE_LABEL: Record<InviteType, string> = {
  wedding: '웨딩청첩장',
  baby: '돌잔치초대장',
};

function normalizeTypeBySubId(subId?: string): InviteType | undefined {
  if (subId === 'wedding') return 'wedding';
  if (subId === 'baby') return 'baby';
  return undefined;
}

function parseOrderDate(orderDate: string): Date {
  return new Date(orderDate.replace(/\/$/, '').trim().slice(0, 19));
}

function isInAppliedRange(orderDate: string, startDate: Date | null, endDate: Date | null): boolean {
  if (!startDate && !endDate) return true;
  const value = parseOrderDate(orderDate).getTime();
  const start = startDate
    ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime()
    : Number.NEGATIVE_INFINITY;
  const end = endDate
    ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).getTime()
    : Number.POSITIVE_INFINITY;
  return value >= start && value <= end;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

function getExpireDateByWeddingDate(weddingDate: string): Date {
  const base = parseOrderDate(weddingDate);
  const expiry = new Date(base);
  expiry.setDate(expiry.getDate() + 30);
  return expiry;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isExpireImminent(expiry: Date, thresholdDays = 3): boolean {
  if (Number.isNaN(expiry.getTime())) return false;
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = expiry.getTime() - startOfToday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= thresholdDays;
}

export default function OrderInviPage() {
  const { subId } = useParams<{ subId?: string }>();
  const routeType = normalizeTypeBySubId(subId);

  const [filterExpanded, setFilterExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [detailOrderDateRange, setDetailOrderDateRange] = useState<string>('');
  const [detailOrderStartDate, setDetailOrderStartDate] = useState<Date | null>(null);
  const [detailOrderEndDate, setDetailOrderEndDate] = useState<Date | null>(null);
  const [detailOrderStartDateOpen, setDetailOrderStartDateOpen] = useState(false);
  const [detailOrderEndDateOpen, setDetailOrderEndDateOpen] = useState(false);
  const [detailWeddingDateRange, setDetailWeddingDateRange] = useState<string>('');
  const [detailWeddingStartDate, setDetailWeddingStartDate] = useState<Date | null>(null);
  const [detailWeddingEndDate, setDetailWeddingEndDate] = useState<Date | null>(null);
  const [detailWeddingStartDateOpen, setDetailWeddingStartDateOpen] = useState(false);
  const [detailWeddingEndDateOpen, setDetailWeddingEndDateOpen] = useState(false);
  const [selectedSkinType, setSelectedSkinType] = useState('');
  const [selectedOptionStatus, setSelectedOptionStatus] = useState('');
  const [selectedUrlStatus, setSelectedUrlStatus] = useState('');
  const [conditionType, setConditionType] = useState<'이름' | '아이디' | '주문번호'>('이름');
  const [keyword, setKeyword] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentFilterValue>('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [orders, setOrders] = useState<InviteOrder[]>(() => [...MOCK_INVITE_ORDERS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [smsModalOrderId, setSmsModalOrderId] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [smsHistoryByOrderId, setSmsHistoryByOrderId] = useState<Record<string, string[]>>({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const phoneMessagesRef = useRef<HTMLDivElement | null>(null);

  const baseOrders = useMemo(
    () =>
      routeType
        ? orders.filter((order) => order.inviteType === routeType)
        : orders,
    [orders, routeType]
  );

  const filteredOrders = useMemo(() => {
    if (!appliedSearch) return baseOrders;
    const q = appliedSearch.keyword.trim().toLowerCase();
    return baseOrders.filter((order) => {
      if (!isInAppliedRange(order.orderDate, appliedSearch.startDate, appliedSearch.endDate))
        return false;
      if (
        !isInAppliedRange(
          order.orderDate,
          appliedSearch.detailOrderStartDate,
          appliedSearch.detailOrderEndDate
        )
      )
        return false;
      if (
        !isInAppliedRange(
          order.weddingDate,
          appliedSearch.detailWeddingStartDate,
          appliedSearch.detailWeddingEndDate
        )
      )
        return false;
      if (appliedSearch.paymentStatus && order.paymentStatus !== appliedSearch.paymentStatus)
        return false;
      if (appliedSearch.skinType && order.skinType !== appliedSearch.skinType) return false;
      if (appliedSearch.optionStatus && order.optionStatus !== appliedSearch.optionStatus) return false;
      if (appliedSearch.urlStatus && order.urlStatus !== appliedSearch.urlStatus) return false;
      if (!q) return true;
      if (appliedSearch.conditionType === '이름') return order.customerName.toLowerCase().includes(q);
      if (appliedSearch.conditionType === '아이디') return order.customerId.toLowerCase().includes(q);
      return order.orderNo.toLowerCase().includes(q);
    });
  }, [appliedSearch, baseOrders]);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [currentPage, filteredOrders]);

  const handleSearch = () => {
    setAppliedSearch({
      startDate,
      endDate,
      detailOrderStartDate,
      detailOrderEndDate,
      detailWeddingStartDate,
      detailWeddingEndDate,
      conditionType,
      keyword,
      skinType: selectedSkinType,
      optionStatus: selectedOptionStatus,
      urlStatus: selectedUrlStatus,
      paymentStatus: selectedPayment,
    });
  };

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];

    if (appliedSearch.startDate || appliedSearch.endDate) {
      chips.push({
        key: 'date',
        label: `제작일: ${appliedSearch.startDate ? formatDateLabel(appliedSearch.startDate) : '~'} ~ ${appliedSearch.endDate ? formatDateLabel(appliedSearch.endDate) : '~'}`,
      });
    }
    if (appliedSearch.detailOrderStartDate || appliedSearch.detailOrderEndDate) {
      chips.push({
        key: 'detailOrderDate',
        label: `주문일: ${appliedSearch.detailOrderStartDate ? formatDateLabel(appliedSearch.detailOrderStartDate) : '~'} ~ ${appliedSearch.detailOrderEndDate ? formatDateLabel(appliedSearch.detailOrderEndDate) : '~'}`,
      });
    }
    if (appliedSearch.detailWeddingStartDate || appliedSearch.detailWeddingEndDate) {
      chips.push({
        key: 'detailWeddingDate',
        label: `예식일: ${appliedSearch.detailWeddingStartDate ? formatDateLabel(appliedSearch.detailWeddingStartDate) : '~'} ~ ${appliedSearch.detailWeddingEndDate ? formatDateLabel(appliedSearch.detailWeddingEndDate) : '~'}`,
      });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `${appliedSearch.conditionType}: ${appliedSearch.keyword.trim()}`,
      });
    }
    if (appliedSearch.skinType) chips.push({ key: 'skinType', label: `스킨타입: ${appliedSearch.skinType}` });
    if (appliedSearch.optionStatus)
      chips.push({ key: 'optionStatus', label: `옵션: ${appliedSearch.optionStatus}` });
    if (appliedSearch.urlStatus) chips.push({ key: 'urlStatus', label: `URL: ${appliedSearch.urlStatus}` });
    if (appliedSearch.paymentStatus)
      chips.push({ key: 'paymentStatus', label: `결제상태: ${appliedSearch.paymentStatus}` });

    return chips;
  }, [appliedSearch]);

  const clearAppliedFilter = (key: AppliedChipKey) => {
    switch (key) {
      case 'date':
        setDateRange('');
        setStartDate(null);
        setEndDate(null);
        setAppliedSearch((prev) =>
          prev ? { ...prev, startDate: null, endDate: null } : prev
        );
        break;
      case 'detailOrderDate':
        setDetailOrderDateRange('');
        setDetailOrderStartDate(null);
        setDetailOrderEndDate(null);
        setAppliedSearch((prev) =>
          prev ? { ...prev, detailOrderStartDate: null, detailOrderEndDate: null } : prev
        );
        break;
      case 'detailWeddingDate':
        setDetailWeddingDateRange('');
        setDetailWeddingStartDate(null);
        setDetailWeddingEndDate(null);
        setAppliedSearch((prev) =>
          prev ? { ...prev, detailWeddingStartDate: null, detailWeddingEndDate: null } : prev
        );
        break;
      case 'keyword':
        setKeyword('');
        setAppliedSearch((prev) => (prev ? { ...prev, keyword: '' } : prev));
        break;
      case 'skinType':
        setSelectedSkinType('');
        setAppliedSearch((prev) => (prev ? { ...prev, skinType: '' } : prev));
        break;
      case 'optionStatus':
        setSelectedOptionStatus('');
        setAppliedSearch((prev) => (prev ? { ...prev, optionStatus: '' } : prev));
        break;
      case 'urlStatus':
        setSelectedUrlStatus('');
        setAppliedSearch((prev) => (prev ? { ...prev, urlStatus: '' } : prev));
        break;
      case 'paymentStatus':
        setSelectedPayment('');
        setAppliedSearch((prev) => (prev ? { ...prev, paymentStatus: '' } : prev));
        break;
      default:
        break;
    }
  };

  const closeSmsModal = () => setSmsModalOrderId(null);
  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };
  const handleDeleteOrder = (orderId: string) => {
    setConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSmsHistoryByOrderId((prev) => {
          const next = { ...prev };
          delete next[orderId];
          return next;
        });
        if (smsModalOrderId === orderId) setSmsModalOrderId(null);
      },
    });
  };
  const smsHistoryLen = smsModalOrderId ? (smsHistoryByOrderId[smsModalOrderId]?.length ?? 0) : 0;

  const getUtf8Bytes = (text: string) => new TextEncoder().encode(text).length;
  const trimToMaxBytes = (text: string, maxBytes: number) => {
    if (getUtf8Bytes(text) <= maxBytes) return text;
    let out = '';
    for (const ch of text) {
      const next = out + ch;
      if (getUtf8Bytes(next) > maxBytes) break;
      out = next;
    }
    return out;
  };

  useEffect(() => {
    if (!smsModalOrderId) return;
    const el = phoneMessagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [smsModalOrderId, smsHistoryLen, smsText]);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [appliedSearch, routeType]);

  useEffect(() => {
    if (currentPage > totalPages) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [currentPage, totalPages]);

  const title = routeType ? `${INVITE_TYPE_LABEL[routeType]} 목록` : '모바일초대장 목록';

  return (
    <div className="admin-list-page admin-list-page--invi">
      <h1 className="page-title">{title}</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">총 {filteredOrders.length}개의 모바일초대장 주문이 검색되었습니다.</p>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">제작일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="제작일 프리셋"
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
                  ...DATE_RANGES.map((r) => ({ value: r, label: r })),
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
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">조건검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="조건검색 타입"
                className="listselect--condition-type"
                value={conditionType}
                onChange={(next) => setConditionType(next as '이름' | '아이디' | '주문번호')}
                options={[
                  { value: '이름', label: '이름' },
                  { value: '아이디', label: '아이디' },
                  { value: '주문번호', label: '주문번호' },
                ]}
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
            <span className="filter-label">주문일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="상세 주문일 프리셋"
                className="listselect--date-range"
                value={detailOrderDateRange}
                onChange={(next) => {
                  if (!next) {
                    setDetailOrderDateRange('');
                    setDetailOrderStartDate(null);
                    setDetailOrderEndDate(null);
                    return;
                  }
                  setDetailOrderDateRange(next);
                  const { start, end } = getDateRangeByPreset(next);
                  setDetailOrderStartDate(start);
                  setDetailOrderEndDate(end);
                }}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((r) => ({ value: r, label: r })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={detailOrderStartDate}
                  onChange={(date: Date | null) => {
                    setDetailOrderStartDate(date);
                    setDetailOrderStartDateOpen(false);
                    setDetailOrderDateRange('');
                  }}
                  onCalendarOpen={() => setDetailOrderStartDateOpen(true)}
                  onCalendarClose={() => setDetailOrderStartDateOpen(false)}
                  onInputClick={() => setDetailOrderStartDateOpen(true)}
                  open={detailOrderStartDateOpen}
                  onClickOutside={() => setDetailOrderStartDateOpen(false)}
                  selectsStart
                  startDate={detailOrderStartDate}
                  endDate={detailOrderEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!detailOrderStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={detailOrderEndDate}
                  onChange={(date: Date | null) => {
                    setDetailOrderEndDate(date);
                    setDetailOrderEndDateOpen(false);
                    setDetailOrderDateRange('');
                  }}
                  onCalendarOpen={() => setDetailOrderEndDateOpen(true)}
                  onCalendarClose={() => setDetailOrderEndDateOpen(false)}
                  onInputClick={() => setDetailOrderEndDateOpen(true)}
                  open={detailOrderEndDateOpen}
                  onClickOutside={() => setDetailOrderEndDateOpen(false)}
                  selectsEnd
                  startDate={detailOrderStartDate}
                  endDate={detailOrderEndDate}
                  minDate={detailOrderStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!detailOrderEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">예식일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="상세 예식일 프리셋"
                className="listselect--date-range"
                value={detailWeddingDateRange}
                onChange={(next) => {
                  if (!next) {
                    setDetailWeddingDateRange('');
                    setDetailWeddingStartDate(null);
                    setDetailWeddingEndDate(null);
                    return;
                  }
                  setDetailWeddingDateRange(next);
                  const { start, end } = getDateRangeByPreset(next);
                  setDetailWeddingStartDate(start);
                  setDetailWeddingEndDate(end);
                }}
                options={[
                  { value: '', label: '미선택' },
                  ...DATE_RANGES.map((r) => ({ value: r, label: r })),
                ]}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={detailWeddingStartDate}
                  onChange={(date: Date | null) => {
                    setDetailWeddingStartDate(date);
                    setDetailWeddingStartDateOpen(false);
                    setDetailWeddingDateRange('');
                  }}
                  onCalendarOpen={() => setDetailWeddingStartDateOpen(true)}
                  onCalendarClose={() => setDetailWeddingStartDateOpen(false)}
                  onInputClick={() => setDetailWeddingStartDateOpen(true)}
                  open={detailWeddingStartDateOpen}
                  onClickOutside={() => setDetailWeddingStartDateOpen(false)}
                  selectsStart
                  startDate={detailWeddingStartDate}
                  endDate={detailWeddingEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!detailWeddingStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={detailWeddingEndDate}
                  onChange={(date: Date | null) => {
                    setDetailWeddingEndDate(date);
                    setDetailWeddingEndDateOpen(false);
                    setDetailWeddingDateRange('');
                  }}
                  onCalendarOpen={() => setDetailWeddingEndDateOpen(true)}
                  onCalendarClose={() => setDetailWeddingEndDateOpen(false)}
                  onInputClick={() => setDetailWeddingEndDateOpen(true)}
                  open={detailWeddingEndDateOpen}
                  onClickOutside={() => setDetailWeddingEndDateOpen(false)}
                  selectsEnd
                  startDate={detailWeddingStartDate}
                  endDate={detailWeddingEndDate}
                  minDate={detailWeddingStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!detailWeddingEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">옵션</span>
            <ListSelect
              ariaLabel="옵션"
              value={selectedPayment}
              onChange={(next) => setSelectedPayment(next as PaymentFilterValue)}
              options={[
                { value: '', label: '전체보기' },
                { value: '사용완료(평생소장중)', label: '사용완료(평생소장중)' },
                { value: '미사용', label: '미사용' },
                { value: '추가없음', label: '추가없음' },
              ]}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">스킨타입</span>
            <ListSelect
              ariaLabel="스킨타입"
              value={selectedSkinType}
              onChange={setSelectedSkinType}
              options={[...SKIN_TYPE_OPTIONS]}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">옵션</span>
            <ListSelect
              ariaLabel="옵션"
              value={selectedOptionStatus}
              onChange={setSelectedOptionStatus}
              options={[...OPTION_STATUS_OPTIONS]}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">URL</span>
            <ListSelect
              ariaLabel="URL"
              value={selectedUrlStatus}
              onChange={setSelectedUrlStatus}
              options={[...URL_STATUS_OPTIONS]}
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
                <th>사용현황</th>
                <th>이름</th>
                <th>아이디</th>
                <th>전화번호</th>
                <th>제작일</th>
                <th>주문일</th>
                <th>예식일/만료일</th>
                <th>옵션</th>
                <th className="col-center">에디터</th>
                <th className="col-center">QR코드</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const computedExpireDate = getExpireDateByWeddingDate(order.weddingDate);
                const computedExpireDateText = formatDateOnly(computedExpireDate);
                const isNearExpire =
                  order.paymentStatus !== '사용완료(평생소장중)' &&
                  isExpireImminent(computedExpireDate);
                return (
                <tr key={order.id}>
                  <td>
                    <div className="product-name-with-public">
                      <div className="cell-block cell-block--channels">
                        <span className="cell-line">
                          <span className="list-label">스킨</span>{' '}
                          <span
                            className={`badge-square order-invi-badge order-invi-badge--inline ${
                              order.inviteType === 'wedding'
                                ? 'badge-square--open'
                                : 'badge-square--private'
                            } ${order.inviteType === 'baby' ? 'order-invi-badge--baby' : ''}`}
                            aria-label={order.inviteType === 'wedding' ? '웨딩 초대장' : '베이비 초대장'}
                          >
                            {order.inviteType === 'wedding' ? 'w' : 'b'}
                          </span>{' '}
                          <span className="list-value">{order.skinType}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">URL</span> <span className="list-value">{order.url}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.customerId}</td>
                  <td>
                    <div className="phone-with-sms">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact"
                        aria-label="문자 발송"
                        title="문자 발송"
                        onClick={() => {
                          setSmsModalOrderId(order.id);
                          setSmsText('');
                        }}
                      >
                        <Mail size={12} aria-hidden="true" />
                      </button>
                      <span className="phone-with-sms__number">{order.customerPhone}</span>
                    </div>
                  </td>
                  <td>{order.weddingDate}</td>
                  <td>
                    <div className="phone-with-sms">
                      {order.paymentStatus === '사용완료(평생소장중)' ? (
                        <button
                          type="button"
                          className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact"
                          aria-label="워터마크 제거 복구"
                          title="워터마크 제거 복구"
                          onClick={() =>
                            setConfirmDialog({
                              message: '워터마크 제거 복구 처리하시겠습니까?',
                              confirmText: '복구',
                              onConfirm: () => {
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id
                                      ? {
                                          ...o,
                                          paymentStatus: '미사용',
                                          optionStatus: '미사용',
                                          orderDate: '',
                                        }
                                      : o
                                  )
                                );
                              },
                            })
                          }
                        >
                          <RefreshCw size={12} aria-hidden="true" />
                        </button>
                      ) : null}
                      <span className="phone-with-sms__number">{order.orderDate}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cell-line">
                      {order.weddingDate.slice(0, 10)} /{' '}
                      <span
                        className={isNearExpire ? 'cell-line--danger' : ''}
                      >
                        {order.paymentStatus === '사용완료(평생소장중)'
                          ? '평생소장'
                          : computedExpireDateText}
                      </span>
                    </span>
                  </td>
                  <td>
                    <div className="phone-with-sms">
                      {order.paymentStatus === '사용완료(평생소장중)' ? (
                        <button
                          type="button"
                          className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact"
                          aria-label="옵션 복구"
                          title="옵션 복구"
                          onClick={() =>
                            setConfirmDialog({
                              message: '옵션 적용 복구 처리하시겠습니까?',
                              confirmText: '복구',
                              onConfirm: () => {
                                setOrders((prev) =>
                                  prev.map((o) =>
                                    o.id === order.id
                                      ? {
                                          ...o,
                                          paymentStatus: '미사용',
                                          optionStatus: '미사용',
                                        }
                                      : o
                                  )
                                );
                              },
                            })
                          }
                        >
                          <RefreshCw size={12} aria-hidden="true" />
                        </button>
                      ) : null}
                      <span className="phone-with-sms__number">{order.paymentStatus}</span>
                    </div>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--tone-primary"
                      aria-label="에디터"
                      title="에디터"
                    >
                      <Pencil size={16} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--tone-purple"
                      aria-label="QR코드"
                      title="QR코드"
                    >
                      <QrCode size={16} aria-hidden="true" />
                    </button>
                  </td>
                  <td className="col-center">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      aria-label="주문 삭제"
                      title="Delete"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
                );
              })}
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : null}
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

      {smsModalOrderId && (() => {
        const order = baseOrders.find((o) => o.id === smsModalOrderId);
        if (!order) return null;
        const byteCount = getUtf8Bytes(smsText);
        const history = smsHistoryByOrderId[order.id] ?? [];

        return (
          <Modal open onClose={closeSmsModal} ariaLabel="문자 발송" variant="sms">
            <Modal.Header>
              <Modal.Title>문자 발송</Modal.Title>
              <Modal.Close />
            </Modal.Header>

            <Modal.Body>
              <div className="sms-modal__content">
                <div className="sms-modal__preview" aria-label="휴대폰 미리보기">
                  <div className="phone-mock">
                    <div className="phone-mock__bezel">
                      <div className="phone-mock__notch" aria-hidden="true" />
                      <div className="phone-mock__screen">
                        <div className="phone-mock__top">
                          <div className="phone-mock__to">To: {order.customerName}</div>
                          <div className="phone-mock__to-sub">{order.customerPhone}</div>
                        </div>
                        <div className="phone-mock__messages" ref={phoneMessagesRef}>
                          {history.map((m, idx) => (
                            <div
                              key={`${order.id}-sms-${idx}`}
                              className="phone-mock__bubble phone-mock__bubble--history"
                            >
                              {m}
                            </div>
                          ))}
                          <div
                            className={`phone-mock__bubble phone-mock__bubble--draft ${
                              smsText.trim() ? '' : 'is-empty'
                            }`}
                          >
                            {smsText.trim() ? smsText : '메시지를 입력하면 이곳에 미리보기가 표시됩니다.'}
                          </div>
                        </div>
                        <div className="phone-mock__composer">
                          <textarea
                            id="sms-text"
                            className="phone-mock__textarea"
                            value={smsText}
                            onChange={(e) => setSmsText(trimToMaxBytes(e.target.value, 80))}
                            placeholder="내용을 입력하세요. (최대 80byte)"
                            rows={2}
                          />
                          <div className={`phone-mock__counter ${byteCount > 80 ? 'is-over' : ''}`}>
                            {byteCount}/80byte
                          </div>
                        </div>
                        <div className="phone-mock__home-indicator" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <button
                type="button"
                className="sms-modal__btn sms-modal__btn--ghost"
                onClick={() => closeSmsModal()}
              >
                닫기
              </button>
              <button
                type="button"
                className="sms-modal__btn sms-modal__btn--primary"
                onClick={() => {
                  if (!smsText.trim()) {
                    window.alert('문자내용을 입력해주세요.');
                    return;
                  }
                  setSmsHistoryByOrderId((prev) => ({
                    ...prev,
                    [order.id]: [...(prev[order.id] ?? []), smsText.trim()],
                  }));
                  window.alert('문자 발송(목업)');
                  closeSmsModal();
                }}
              >
                발송
              </button>
            </Modal.Footer>
          </Modal>
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
