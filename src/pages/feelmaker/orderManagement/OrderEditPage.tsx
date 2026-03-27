import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MoreHorizontal, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import ListSelect from './components/ListSelect';
import Modal from '../../../components/modal';
import Confirm from '../../../components/confirm';
import Alert from '../../../components/alert';
import Toast from '../../../components/toast';
import { MOCK_ORDERS, type OrderItem } from './mock/orderEdit.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;
const MANAGERS = ['담당자1', '담당자2', '담당자3'] as const;

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  conditionType: '이름' | '아이디' | '주문번호';
  keyword: string;
  paymentStatus: string;
  workStatus: string;
  urgentPhotoEdit: string;
};

type OptionModalType = 'personAdd' | 'urgentEdit' | 'artworkAlbumEdit';

const OPTION_LABEL: Record<OptionModalType, string> = {
  personAdd: '인물추가',
  urgentEdit: '긴급보정',
  artworkAlbumEdit: '아트웍화보보정',
};

function getPhotoMenuItemsByProgress(progress: string): string[] {
  if (progress === '작업완료') {
    return ['사진등록', '원본다운로드', '관리자사진다운로드'];
  }
  if (progress === '재수정대기중' || progress === '재수정작업중') {
    return ['사진등록', '원본다운로드', '관리자사진다운로드', '재수정요청다운로드'];
  }
  return ['사진등록', '원본다운로드'];
}

function getProgressVariantClass(progress: string): string {
  if (progress === '작업전') return 'progress-status--primary';
  if (progress === '작업중') return 'progress-status--danger';
  if (progress === '작업완료') return 'progress-status--secondary';
  if (progress === '재수정대기중') return 'progress-status--warning';
  if (progress === '재수정작업중') return 'progress-status--danger';
  return 'progress-status--warning';
}

function getPaymentRowVariant(paymentStatus: string): { rowBtnClass: string; dotClass: string } {
  const paidStatuses = ['결제완료', '쿠폰사용', '무통장입금', 'PG결제'];
  if (paymentStatus === '주문취소') {
    return { rowBtnClass: 'row-btn--status-danger', dotClass: 'progress-status--danger' };
  }
  if (paidStatuses.includes(paymentStatus)) {
    return { rowBtnClass: 'row-btn--status-secondary', dotClass: 'progress-status--secondary' };
  }
  return { rowBtnClass: 'row-btn--status-warning', dotClass: 'progress-status--warning' };
}

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

function getUtf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

function trimToMaxBytes(text: string, maxBytes: number): string {
  if (getUtf8Bytes(text) <= maxBytes) return text;
  let out = '';
  for (const ch of text) {
    const next = out + ch;
    if (getUtf8Bytes(next) > maxBytes) break;
    out = next;
  }
  return out;
}

function applyFilters(orders: OrderItem[], applied: AppliedSearch | null): OrderItem[] {
  if (!applied) return orders;

  const keywordTrim = applied.keyword.trim().toLowerCase();
  return orders.filter((order) => {
    const useCustomRange = applied.startDate != null || applied.endDate != null;
    if (useCustomRange) {
      if (!isInCustomDateRange(order.orderDate, applied.startDate, applied.endDate)) return false;
    } else if (!isInPresetDateRange(order.orderDate, applied.dateRange)) {
      return false;
    }

    if (keywordTrim) {
      if (applied.conditionType === '이름' && !order.customerName.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '아이디' && !order.customerId.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '주문번호' && !order.no.toLowerCase().includes(keywordTrim)) return false;
    }

    if (applied.paymentStatus && order.paymentStatus !== applied.paymentStatus) return false;

    if (applied.workStatus) {
      if (applied.workStatus === '고객업로드') {
        if (!['작업전', '작업중'].includes(order.progress)) return false;
      } else if (applied.workStatus === '관리자업로드') {
        if (order.progress !== '작업완료') return false;
      } else if (applied.workStatus === '재수정업로드') {
        if (!['재수정대기중', '재수정작업중'].includes(order.progress)) return false;
      }
    }

    if (applied.urgentPhotoEdit) {
      const urgentAdded = !!order.urgentAdded;
      if (applied.urgentPhotoEdit === '신청' && !urgentAdded) return false;
      if (applied.urgentPhotoEdit === '미신청' && urgentAdded) return false;
    }

    return true;
  });
}

export default function OrderEditPage() {
  const [filterExpanded, setFilterExpanded] = useState(false);

  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const [conditionType, setConditionType] = useState<'이름' | '아이디' | '주문번호'>('이름');
  const [keyword, setKeyword] = useState('');

  const [paymentStatus, setPaymentStatus] = useState('');
  const [workStatus, setWorkStatus] = useState('');
  const [urgentPhotoEdit, setUrgentPhotoEdit] = useState('');

  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);

  const [orders, setOrders] = useState<OrderItem[]>(() => MOCK_ORDERS);

  const filteredOrders = useMemo(() => applyFilters(orders, appliedSearch), [orders, appliedSearch]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSearch = () => {
    setAppliedSearch({
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      paymentStatus,
      workStatus,
      urgentPhotoEdit,
    });
  };

  // -------- options dropdown + modal --------
  const [openOptionsOrderId, setOpenOptionsOrderId] = useState<string | null>(null);
  const [rowDropdownPos, setRowDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const rowDropdownAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [openPhotoOrderId, setOpenPhotoOrderId] = useState<string | null>(null);
  const [photoDropdownPos, setPhotoDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const photoDropdownAnchorRef = useRef<HTMLButtonElement | null>(null);

  const portalOptionsOrder = useMemo(
    () => (openOptionsOrderId ? orders.find((o) => o.id === openOptionsOrderId) ?? null : null),
    [openOptionsOrderId, orders]
  );

  const [optionModal, setOptionModal] = useState<{ orderId: string; type: OptionModalType } | null>(null);
  const closeOptionModal = () => setOptionModal(null);

  const OPTION_MODAL_KEY_MAP: Record<OptionModalType, 'personAdded' | 'urgentAdded' | 'artworkPhotoAdded'> = {
    personAdd: 'personAdded',
    urgentEdit: 'urgentAdded',
    artworkAlbumEdit: 'artworkPhotoAdded',
  };

  const handleOptionMenuClick = (orderId: string, type: OptionModalType) => {
    setOptionModal({ orderId, type });
    setOpenOptionsOrderId(null);
  };

  const confirmOptionAdd = (
    orderId: string,
    modalKey: 'personAdded' | 'urgentAdded' | 'artworkPhotoAdded'
  ) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, [modalKey]: true } : o)));
    setOptionModal(null);
  };

  useLayoutEffect(() => {
    if (!openOptionsOrderId || !rowDropdownAnchorRef.current) return;
    const update = () => {
      const el = rowDropdownAnchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRowDropdownPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openOptionsOrderId]);

  const portalPhotoOrder = useMemo(
    () => (openPhotoOrderId ? orders.find((o) => o.id === openPhotoOrderId) ?? null : null),
    [openPhotoOrderId, orders]
  );

  useLayoutEffect(() => {
    if (!openPhotoOrderId || !photoDropdownAnchorRef.current) return;
    const update = () => {
      const el = photoDropdownAnchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPhotoDropdownPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [openPhotoOrderId]);

  useEffect(() => {
    if (!openOptionsOrderId && !openPhotoOrderId) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.row-options') || target.closest('.row-options__menu-portal')) return;
      setOpenOptionsOrderId(null);
      setOpenPhotoOrderId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenOptionsOrderId(null);
        setOpenPhotoOrderId(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openOptionsOrderId, openPhotoOrderId]);

  // -------- sms modal --------
  const [smsModalOrderId, setSmsModalOrderId] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [smsHistoryByOrderId, setSmsHistoryByOrderId] = useState<Record<string, string[]>>({});
  const phoneMessagesRef = useRef<HTMLDivElement | null>(null);
  const smsHistoryLen = smsModalOrderId ? smsHistoryByOrderId[smsModalOrderId]?.length ?? 0 : 0;

  const closeSmsModal = () => setSmsModalOrderId(null);

  useEffect(() => {
    if (!smsModalOrderId) return;
    const el = phoneMessagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [smsModalOrderId, smsHistoryLen, smsText]);

  // -------- payment modal --------
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const closePaymentModal = () => setPaymentModalOrderId(null);

  // -------- manager modal --------
  const [managerModalOrderId, setManagerModalOrderId] = useState<string | null>(null);
  const [changedManager, setChangedManager] = useState<(typeof MANAGERS)[number]>('담당자1');
  const [toastMessage, setToastMessage] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const closeManagerModal = () => setManagerModalOrderId(null);
  const confirmManagerChange = (orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, manager: changedManager } : o)));
    setToastMessage('담당자가 변경되었습니다.');
    closeManagerModal();
  };

  // -------- amount change modal --------
  const [amountChangeModalOrderId, setAmountChangeModalOrderId] = useState<string | null>(null);
  const [changedAmount, setChangedAmount] = useState<string>('');
  const closeAmountChangeModal = () => {
    setAmountChangeModalOrderId(null);
    setChangedAmount('');
  };

  const confirmAmountChange = (orderId: string) => {
    const nextAmount = Number(changedAmount);
    if (!Number.isFinite(nextAmount) || nextAmount < 0) {
      setAlertMessage('변경 금액을 올바르게 입력해주세요.');
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, amount: nextAmount } : o)));
    closeAmountChangeModal();
  };

  // -------- delete confirm --------
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const openConfirmDialog = (config: ConfirmDialogState) => setConfirmDialog(config);
  const closeConfirmDialog = () => setConfirmDialog(null);
  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    setConfirmDialog(null);
  };

  const handleDeleteOrder = (orderId: string) => {
    openConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (smsModalOrderId === orderId) setSmsModalOrderId(null);
        if (paymentModalOrderId === orderId) setPaymentModalOrderId(null);
        if (amountChangeModalOrderId === orderId) setAmountChangeModalOrderId(null);
      },
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  type AppliedChipKey = 'date' | 'keyword' | 'paymentStatus' | 'workStatus' | 'urgentPhotoEdit';

  const isAppliedSearchEmpty = (s: AppliedSearch | null) => {
    if (!s) return true;
    return (
      !s.dateRange &&
      s.startDate == null &&
      s.endDate == null &&
      !s.keyword.trim() &&
      !s.paymentStatus &&
      !s.workStatus &&
      !s.urgentPhotoEdit
    );
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
        next.keyword = '';
        break;
      case 'paymentStatus':
        setPaymentStatus('');
        next.paymentStatus = '';
        break;
      case 'workStatus':
        setWorkStatus('');
        next.workStatus = '';
        break;
      case 'urgentPhotoEdit':
        setUrgentPhotoEdit('');
        next.urgentPhotoEdit = '';
        break;
      default:
        break;
    }

    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];

    const chips: Array<{ key: AppliedChipKey; label: string }> = [];

    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({
        key: 'date',
        label: `주문일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `주문일: ${appliedSearch.dateRange}` });
    }

    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }

    if (appliedSearch.paymentStatus) {
      chips.push({ key: 'paymentStatus', label: `결제현황: ${appliedSearch.paymentStatus}` });
    }
    if (appliedSearch.workStatus) {
      chips.push({ key: 'workStatus', label: `제작현황: ${appliedSearch.workStatus}` });
    }
    if (appliedSearch.urgentPhotoEdit) {
      chips.push({
        key: 'urgentPhotoEdit',
        label: `긴급사진보정: ${appliedSearch.urgentPhotoEdit}`,
      });
    }

    return chips;
  }, [appliedSearch]);

  return (
    <div className="order-list-page order-list-page--edit">
      <h1 className="page-title">보정 주문 목록</h1>

      <section className="order-list-box">
        <p className="order-list-result">총 {filteredOrders.length}개의 보정 주문이 검색되었습니다.</p>
      </section>

      <section className="order-list-box">
        <div className="filter-top-row">
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
                  const { start, end } = (() => {
                    const today = new Date();
                    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const start = new Date(end);
                    switch (next) {
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
                  })();
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
            <div className="condition-search-wrap">
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
              <svg className="detail-search-toggle__icon" aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
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
            <span className="filter-label">결제현황</span>
            <ListSelect
              ariaLabel="결제현황"
              value={paymentStatus}
              onChange={setPaymentStatus}
              options={[
                { value: '', label: '전체보기' },
                { value: '결제전', label: '결제전' },
                { value: '결제완료', label: '결제완료' },
                { value: '주문취소', label: '주문취소' },
                { value: '쿠폰사용', label: '쿠폰사용' },
                { value: '무통장입금', label: '무통장입금' },
                { value: 'PG결제', label: 'PG결제' },
              ]}
            />
          </div>

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
                { value: '재수정업로드', label: '재수정업로드' },
              ]}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">김급사진보정</span>
            <ListSelect
              ariaLabel="김급사진보정"
              value={urgentPhotoEdit}
              onChange={setUrgentPhotoEdit}
              options={[
                { value: '', label: '전체보기' },
                { value: '신청', label: '신청' },
                { value: '미신청', label: '미신청' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="order-list-box order-list-box--table">
        {appliedChips.length > 0 && (
          <section className="applied-filters">
            <div className="applied-filters__left">
              <div className="applied-filters__list">
                {appliedChips.map((chip) => (
                  <div key={chip.key} className="applied-chip">
                    <span className="applied-chip__text">{chip.label}</span>
                    <button
                      type="button"
                      className="applied-chip__x"
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

        <div className="order-table-wrap">
          <table className="order-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>긴급보정</th>
                <th>진행현황</th>
                <th>상품정보</th>
                <th>이름</th>
                <th>아이디</th>
                <th>전화번호</th>
                <th>결제현황</th>
                <th>결제금액</th>
                <th>옵션</th>
                <th>사진</th>
                <th>참고사진</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const paymentVariant = getPaymentRowVariant(order.paymentStatus);
                const progressVariantClass = getProgressVariantClass(order.progress);

                return (
                  <tr key={order.id}>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{order.no}</span>
                        <span className="cell-line">{order.noSub}</span>
                      </div>
                    </td>

                    <td>{order.urgentAdded ? '추가' : '없음'}</td>

                    <td>
                      <div className={['progress-status', progressVariantClass].join(' ')}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{order.progress}</span>
                      </div>
                    </td>

                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{order.productName}</span>
                        <span className="cell-line">
                          {'담당자: '}
                          <button
                            type="button"
                            className="channel-partner-btn"
                            onClick={() => {
                              setManagerModalOrderId(order.id);
                              setChangedManager(order.manager);
                            }}
                          >
                            {order.manager}
                          </button>
                        </span>
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

                    <td>
                      <div className="cell-block">
                        <button type="button" className={['row-btn', paymentVariant.rowBtnClass].join(' ')} onClick={() => setPaymentModalOrderId(order.id)}>
                          <span className={['progress-status', paymentVariant.dotClass].join(' ')}>
                            <span className="progress-status__dot" aria-hidden="true" />
                            <span className="progress-status__text">{order.paymentStatus}</span>
                          </span>
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="cell-block cell-block--amount-inline">
                        <span className="cell-line amount-red">{order.amount.toLocaleString()}원</span>
                        <button
                          type="button"
                          className="row-btn row-btn--blue"
                          onClick={() => {
                            setAmountChangeModalOrderId(order.id);
                            setChangedAmount(String(order.amount));
                          }}
                        >
                          금액 변경
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="row-options">
                        <button
                          type="button"
                          className="row-options__trigger"
                          aria-haspopup="menu"
                          aria-expanded={openOptionsOrderId === order.id}
                          aria-label="옵션"
                          onClick={(e) => {
                            e.stopPropagation();
                            const closing = openOptionsOrderId === order.id;
                            if (closing) {
                              setOpenOptionsOrderId(null);
                              rowDropdownAnchorRef.current = null;
                              setRowDropdownPos(null);
                              return;
                            }

                            rowDropdownAnchorRef.current = e.currentTarget;
                            const r = e.currentTarget.getBoundingClientRect();
                            setRowDropdownPos({
                              top: r.bottom + 6,
                              right: window.innerWidth - r.right,
                            });
                            setOpenPhotoOrderId(null);
                            photoDropdownAnchorRef.current = null;
                            setPhotoDropdownPos(null);
                            setOpenOptionsOrderId(order.id);
                          }}
                        >
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>

                    <td>
                      <div className="row-options">
                        <button
                          type="button"
                          className="row-options__trigger"
                          aria-haspopup="menu"
                          aria-expanded={openPhotoOrderId === order.id}
                          aria-label="사진 항목"
                          onClick={(e) => {
                            e.stopPropagation();
                            const closing = openPhotoOrderId === order.id;
                            if (closing) {
                              setOpenPhotoOrderId(null);
                              photoDropdownAnchorRef.current = null;
                              setPhotoDropdownPos(null);
                              return;
                            }

                            photoDropdownAnchorRef.current = e.currentTarget;
                            const r = e.currentTarget.getBoundingClientRect();
                            setPhotoDropdownPos({
                              top: r.bottom + 6,
                              right: window.innerWidth - r.right,
                            });
                            setOpenOptionsOrderId(null);
                            rowDropdownAnchorRef.current = null;
                            setRowDropdownPos(null);
                            setOpenPhotoOrderId(order.id);
                          }}
                        >
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td>{order.referencePhotoAdded ? '업로드완료' : '미업로드'}</td>

                    <td>
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

              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '20px' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="order-table-pagination">
          <div className="pagination-inner">
            <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} aria-label="첫 페이지">
              &laquo;
            </button>
            <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="이전 페이지">
              &lsaquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button key={page} type="button" className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            ))}
            <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="다음 페이지">
              &rsaquo;
            </button>
            <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} aria-label="마지막 페이지">
              &raquo;
            </button>
          </div>
        </div>
      </section>

      {/* options portal */}
      {portalOptionsOrder && rowDropdownPos
        ? createPortal(
            <div
              className="row-options__menu-portal"
              role="menu"
              style={{
                position: 'fixed',
                top: rowDropdownPos.top,
                right: rowDropdownPos.right,
                zIndex: 10000,
              }}
            >
              <button type="button" className="row-options__item" role="menuitem" onClick={() => handleOptionMenuClick(portalOptionsOrder.id, 'personAdd')}>
                인물추가 {portalOptionsOrder.personAdded ? '현황보기' : '추가'}
              </button>
              <button type="button" className="row-options__item" role="menuitem" onClick={() => handleOptionMenuClick(portalOptionsOrder.id, 'urgentEdit')}>
                긴급보정 {portalOptionsOrder.urgentAdded ? '현황보기' : '추가'}
              </button>
              <button
                type="button"
                className="row-options__item"
                role="menuitem"
                onClick={() => handleOptionMenuClick(portalOptionsOrder.id, 'artworkAlbumEdit')}
              >
                아트웍화보보정 {portalOptionsOrder.artworkPhotoAdded ? '현황보기' : '추가'}
              </button>
            </div>,
            document.body
          )
        : null}

      {/* photo menu portal */}
      {portalPhotoOrder && photoDropdownPos
        ? createPortal(
            <div
              className="row-options__menu-portal"
              role="menu"
              style={{
                position: 'fixed',
                top: photoDropdownPos.top,
                right: photoDropdownPos.right,
                zIndex: 10000,
              }}
            >
              {getPhotoMenuItemsByProgress(portalPhotoOrder.progress).map((item) => (
                <button
                  key={`${portalPhotoOrder.id}-${item}`}
                  type="button"
                  className="row-options__item"
                  role="menuitem"
                  onClick={() => setOpenPhotoOrderId(null)}
                >
                  {item}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      {/* option modal */}
      {optionModal && (() => {
        const order = orders.find((o) => o.id === optionModal.orderId);
        if (!order) return null;

        const modalKey = OPTION_MODAL_KEY_MAP[optionModal.type];
        const label = OPTION_LABEL[optionModal.type];
        const isAdded = Boolean(order[modalKey]);

        return (
          <Modal
            open
            onClose={closeOptionModal}
            ariaLabel={`${label} ${isAdded ? '현황보기' : '추가'}`}
            variant="option"
          >
            <Modal.Header>
              <Modal.Title>
                {label} {isAdded ? '현황보기' : '추가'}
              </Modal.Title>
              <Modal.Close />
            </Modal.Header>

            <Modal.Body>
              {!isAdded ? (
                <>
                  <div className="option-modal__desc">
                    주문 <strong>{order.no}</strong> ({order.noSub})에 <strong>{label}</strong> 옵션을 추가할까요?
                  </div>
                  <div className="option-modal__hint">추가 후에는 “현황보기”로 전환됩니다.</div>
                </>
              ) : (
                <>
                  <div className="option-modal__desc">
                    주문 <strong>{order.no}</strong> ({order.noSub})에 <strong>{label}</strong> 옵션이 이미 추가되어 있습니다.
                  </div>
                  <div className="option-modal__hint">(목업) 여기에서 옵션 상세/상태 정보를 보여주면 됩니다.</div>
                  <div className="option-modal__status-grid">
                    <div className="option-modal__status-row">
                      <span className="option-modal__status-label">상태</span>
                      <span className="option-modal__status-value">추가됨</span>
                    </div>
                    <div className="option-modal__status-row">
                      <span className="option-modal__status-label">등록일</span>
                      <span className="option-modal__status-value">{order.orderDate.slice(0, 10)}</span>
                    </div>
                  </div>
                </>
              )}
            </Modal.Body>

            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeOptionModal}>
                닫기
              </button>
              {!isAdded && (
                <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => confirmOptionAdd(order.id, modalKey)}>
                  {label} 추가
                </button>
              )}
            </Modal.Footer>
          </Modal>
        );
      })()}

      {/* sms modal */}
      {smsModalOrderId && (() => {
        const order = orders.find((o) => o.id === smsModalOrderId);
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
                            <div key={`${order.id}-sms-${idx}`} className="phone-mock__bubble phone-mock__bubble--history">
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
              <button type="button" className="sms-modal__btn sms-modal__btn--ghost" onClick={closeSmsModal}>
                닫기
              </button>
              <button
                type="button"
                className="sms-modal__btn sms-modal__btn--primary"
                onClick={() => {
                  if (!smsText.trim()) {
                    setAlertMessage('문자내용을 입력해주세요.');
                    return;
                  }
                  setSmsHistoryByOrderId((prev) => ({
                    ...prev,
                    [order.id]: [...(prev[order.id] ?? []), smsText.trim()],
                  }));
                  setAlertMessage('문자 발송(목업)');
                  closeSmsModal();
                }}
              >
                발송
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {/* payment modal */}
      {paymentModalOrderId && (() => {
        const order = orders.find((o) => o.id === paymentModalOrderId);
        if (!order) return null;

        const isUnpaid = order.paymentStatus === '결제전';
        const isCanceled = order.paymentStatus === '주문취소';

        return (
          <Modal open onClose={closePaymentModal} ariaLabel="결제 상태" variant="option">
            <Modal.Header>
              <Modal.Title>결제 상태</Modal.Title>
              <Modal.Close />
            </Modal.Header>

            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">결제상태</span>
                  <span className="option-modal__status-value">{order.paymentStatus}</span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">결제수단</span>
                  <span className="option-modal__status-value">
                    {order.paymentMethod}
                    {order.depositor ? ` (입금자명: ${order.depositor})` : ''}
                  </span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">구매경로</span>
                  <span className="option-modal__status-value">{order.purchasePath}</span>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--danger"
                onClick={() => {
                  setOrders((prev) =>
                    prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: '주문취소' } : o))
                  );
                  closePaymentModal();
                }}
              >
                주문취소
              </button>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closePaymentModal}>
                닫기
              </button>
              {isUnpaid && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => {
                    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: '결제완료' } : o)));
                    closePaymentModal();
                  }}
                >
                  입금 확인
                </button>
              )}
              {isCanceled && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => {
                    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: '결제완료' } : o)));
                    closePaymentModal();
                  }}
                >
                  결제처리
                </button>
              )}
            </Modal.Footer>
          </Modal>
        );
      })()}

      {/* manager modal */}
      {managerModalOrderId && (() => {
        const order = orders.find((o) => o.id === managerModalOrderId);
        if (!order) return null;

        return (
          <Modal open onClose={closeManagerModal} ariaLabel="담당자 변경" variant="option">
            <Modal.Header>
              <Modal.Title>담당자변경</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">현재 담당자</span>
                  <span className="option-modal__status-value">{order.manager}</span>
                </div>
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">변경 담당자</span>
                  <select
                    className="option-modal__partner-select"
                    value={changedManager}
                    onChange={(e) => setChangedManager(e.target.value as (typeof MANAGERS)[number])}
                  >
                    {MANAGERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeManagerModal}>
                닫기
              </button>
              <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => confirmManagerChange(order.id)}>
                변경 저장
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      {/* amount change modal */}
      {amountChangeModalOrderId && (() => {
        const order = orders.find((o) => o.id === amountChangeModalOrderId);
        if (!order) return null;

        return (
          <Modal open onClose={closeAmountChangeModal} ariaLabel="금액 변경" variant="option">
            <Modal.Header>
              <Modal.Title>금액변경</Modal.Title>
              <Modal.Close />
            </Modal.Header>
            <Modal.Body>
              <div className="option-modal__status-grid">
                <div className="option-modal__status-row">
                  <span className="option-modal__status-label">현재금액</span>
                  <span className="option-modal__status-value">{order.amount.toLocaleString()}원</span>
                </div>
                <div className="option-modal__status-row">
                  <label className="option-modal__status-label" htmlFor="changed-amount">
                    변경 금액
                  </label>
                  <input
                    id="changed-amount"
                    className="option-modal__amount-input"
                    type="number"
                    min={0}
                    step={100}
                    value={changedAmount}
                    onChange={(e) => setChangedAmount(e.target.value)}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeAmountChangeModal}>
                닫기
              </button>
              <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => confirmAmountChange(order.id)}>
                변경
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
      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
      <Toast
        open={Boolean(toastMessage)}
        message={toastMessage}
        variant="success"
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
