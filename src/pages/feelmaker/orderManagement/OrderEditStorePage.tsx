import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, MoreHorizontal, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Alert from '../../../components/Alert';
import Confirm from '../../../components/Confirm';
import ListRowCopyButton from '../../../components/ListRowCopyButton';
import Toast from '../../../components/Toast';
import { CUSTOMER_INFO_COPIED_ALERT_MESSAGE } from '../../../utils/customerInfoClipboard';
import { MOCK_STORE_EDIT_ORDERS, type StoreEditOrderItem } from './mock/orderEditStore.mock';

function formatStoreEditRowCopy(order: StoreEditOrderItem): string {
  return [
    `이름: ${order.customerName}`,
    `아이디: ${order.customerId}`,
    `전화번호: ${order.customerPhone}`,
    `주문번호: ${order.orderNo}`,
  ].join('\n');
}

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

type AppliedSearch = {
  uploadDateRange: string;
  uploadStartDate: Date | null;
  uploadEndDate: Date | null;
  requestDateRange: string;
  requestStartDate: Date | null;
  requestEndDate: Date | null;
  conditionType: '이름' | '아이디' | '전화번호' | '스팜주문번호';
  keyword: string;
  workStatus: string;
  urgentPhotoEdit: string;
};
type AppliedChipKey = 'uploadDate' | 'requestDate' | 'keyword' | 'workStatus' | 'urgentPhotoEdit';
type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

const MANAGERS = ['담당자1', '담당자2', '담당자3'] as const;

function parseOrderDate(orderDate: string): Date {
  const dateStr = orderDate.replace(/\/$/, '').trim().slice(0, 19);
  return new Date(dateStr);
}

function normalizeProgress(progress: string): '보정진행중' | '관리자업로드' | '재수정진행중' | '확정' {
  if (progress === '보정진행중' || progress === '관리자업로드' || progress === '재수정진행중' || progress === '확정') {
    return progress;
  }
  if (progress === '작업전' || progress === '작업중') return '보정진행중';
  if (progress === '작업완료') return '관리자업로드';
  if (progress === '재수정대기중' || progress === '재수정작업중') return '재수정진행중';
  return '보정진행중';
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

function getProgressVariantClass(progress: string): string {
  if (progress === '보정진행중') return 'progress-status--danger';
  if (progress === '관리자업로드') return 'progress-status--secondary';
  if (progress === '재수정진행중') return 'progress-status--warning';
  if (progress === '확정') return 'progress-status--primary';
  return 'progress-status--warning';
}

function getPhotoMenuItemsByProgress(progress: string): string[] {
  if (progress === '관리자업로드' || progress === '확정') return ['사진등록', '원본다운로드', '관리자사진다운로드'];
  if (progress === '재수정진행중') {
    return ['사진등록', '원본다운로드', '관리자사진다운로드', '재수정요청다운로드'];
  }
  return ['사진등록', '원본다운로드'];
}

function getPaymentRowVariant(paymentStatus: string): { rowBtnClass: string; dotClass: string } {
  const paidStatuses = ['결제완료', '쿠폰사용', '무통장입금', 'PG결제'];
  if (paymentStatus === '결제취소') {
    return { rowBtnClass: 'row-btn--status-danger', dotClass: 'progress-status--danger' };
  }
  if (paidStatuses.includes(paymentStatus)) {
    return { rowBtnClass: 'row-btn--status-secondary', dotClass: 'progress-status--secondary' };
  }
  return { rowBtnClass: 'row-btn--status-warning', dotClass: 'progress-status--warning' };
}

function getCorrectionStrengthBadgeClass(strength: StoreEditOrderItem['correctionStrength']): string {
  if (strength === '강') return 'badge-square--strength-strong';
  if (strength === '중') return 'badge-square--strength-medium';
  if (strength === '약') return 'badge-square--strength-weak';
  return 'badge-square--strength-designer';
}

function applyFilters(orders: StoreEditOrderItem[], applied: AppliedSearch | null): StoreEditOrderItem[] {
  if (!applied) return orders;
  const keywordTrim = applied.keyword.trim().toLowerCase();
  return orders.filter((order) => {
    const useUploadCustomRange = applied.uploadStartDate != null || applied.uploadEndDate != null;
    if (useUploadCustomRange) {
      if (!isInCustomDateRange(order.uploadDate, applied.uploadStartDate, applied.uploadEndDate)) return false;
    } else if (!isInPresetDateRange(order.uploadDate, applied.uploadDateRange)) {
      return false;
    }

    const useRequestCustomRange = applied.requestStartDate != null || applied.requestEndDate != null;
    const requestDate = order.revisionRequestDate;
    if (useRequestCustomRange) {
      if (!requestDate) return false;
      if (!isInCustomDateRange(requestDate, applied.requestStartDate, applied.requestEndDate)) return false;
    } else if (applied.requestDateRange) {
      if (!requestDate) return false;
      if (!isInPresetDateRange(requestDate, applied.requestDateRange)) return false;
    }

    if (keywordTrim) {
      if (applied.conditionType === '이름' && !order.customerName.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '아이디' && !order.customerId.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '전화번호' && !order.customerPhone.toLowerCase().includes(keywordTrim))
        return false;
      if (applied.conditionType === '스팜주문번호' && !order.orderNo.toLowerCase().includes(keywordTrim))
        return false;
    }
    if (applied.workStatus) {
      const normalizedProgress = normalizeProgress(order.progress);
      if (normalizedProgress !== applied.workStatus) return false;
    }
    if (applied.urgentPhotoEdit === '신청' && !order.urgentAdded) return false;
    if (applied.urgentPhotoEdit === '미신청' && order.urgentAdded) return false;
    return true;
  });
}

export default function OrderEditStorePage() {
  const [orders, setOrders] = useState<StoreEditOrderItem[]>(() => MOCK_STORE_EDIT_ORDERS);
  const [filterExpanded, setFilterExpanded] = useState(false);

  const [uploadDateRange, setUploadDateRange] = useState('');
  const [uploadStartDate, setUploadStartDate] = useState<Date | null>(null);
  const [uploadEndDate, setUploadEndDate] = useState<Date | null>(null);

  const [requestDateRange, setRequestDateRange] = useState('');
  const [requestStartDate, setRequestStartDate] = useState<Date | null>(null);
  const [requestEndDate, setRequestEndDate] = useState<Date | null>(null);

  const [conditionType, setConditionType] = useState<'이름' | '아이디' | '전화번호' | '스팜주문번호'>('이름');
  const [keyword, setKeyword] = useState('');
  const [workStatus, setWorkStatus] = useState('');
  const [urgentPhotoEdit, setUrgentPhotoEdit] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);

  const filteredOrders = useMemo(() => applyFilters(orders, appliedSearch), [orders, appliedSearch]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

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

  const handleSearch = () => {
    setAppliedSearch({
      uploadDateRange,
      uploadStartDate,
      uploadEndDate,
      requestDateRange,
      requestStartDate,
      requestEndDate,
      conditionType,
      keyword,
      workStatus,
      urgentPhotoEdit,
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isAppliedSearchEmpty = (s: AppliedSearch | null) => {
    if (!s) return true;
    return (
      !s.uploadDateRange &&
      s.uploadStartDate == null &&
      s.uploadEndDate == null &&
      !s.requestDateRange &&
      s.requestStartDate == null &&
      s.requestEndDate == null &&
      !s.keyword.trim() &&
      !s.workStatus &&
      !s.urgentPhotoEdit
    );
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next: AppliedSearch = { ...appliedSearch };
    switch (key) {
      case 'uploadDate':
        setUploadDateRange('');
        setUploadStartDate(null);
        setUploadEndDate(null);
        next.uploadDateRange = '';
        next.uploadStartDate = null;
        next.uploadEndDate = null;
        break;
      case 'requestDate':
        setRequestDateRange('');
        setRequestStartDate(null);
        setRequestEndDate(null);
        next.requestDateRange = '';
        next.requestStartDate = null;
        next.requestEndDate = null;
        break;
      case 'keyword':
        setKeyword('');
        next.keyword = '';
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

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = (() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.uploadStartDate || appliedSearch.uploadEndDate) {
      const start = formatYmd(appliedSearch.uploadStartDate);
      const end = formatYmd(appliedSearch.uploadEndDate);
      chips.push({
        key: 'uploadDate',
        label: `업로드일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.uploadDateRange) {
      chips.push({ key: 'uploadDate', label: `업로드일: ${appliedSearch.uploadDateRange}` });
    }
    if (appliedSearch.requestStartDate || appliedSearch.requestEndDate) {
      const start = formatYmd(appliedSearch.requestStartDate);
      const end = formatYmd(appliedSearch.requestEndDate);
      chips.push({
        key: 'requestDate',
        label: `재수정요청일: ${start}${start && end ? ' ~ ' : ''}${end}`,
      });
    } else if (appliedSearch.requestDateRange) {
      chips.push({ key: 'requestDate', label: `재수정요청일: ${appliedSearch.requestDateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.workStatus) {
      chips.push({ key: 'workStatus', label: `제작현황: ${appliedSearch.workStatus}` });
    }
    if (appliedSearch.urgentPhotoEdit) {
      chips.push({ key: 'urgentPhotoEdit', label: `긴급사진보정: ${appliedSearch.urgentPhotoEdit}` });
    }
    return chips;
  })();

  const [openPhotoOrderId, setOpenPhotoOrderId] = useState<string | null>(null);
  const [photoDropdownPos, setPhotoDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const photoDropdownAnchorRef = useRef<HTMLButtonElement | null>(null);
  const portalPhotoOrder = useMemo(
    () => (openPhotoOrderId ? orders.find((o) => o.id === openPhotoOrderId) ?? null : null),
    [openPhotoOrderId, orders]
  );

  useLayoutEffect(() => {
    if (!openPhotoOrderId || !photoDropdownAnchorRef.current) return;
    const update = () => {
      const r = photoDropdownAnchorRef.current?.getBoundingClientRect();
      if (!r) return;
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
    if (!openPhotoOrderId) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.row-options') || target.closest('.row-options__menu-portal')) return;
      setOpenPhotoOrderId(null);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [openPhotoOrderId]);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [copyInfoAlertOpen, setCopyInfoAlertOpen] = useState(false);
  const [paymentModalOrderId, setPaymentModalOrderId] = useState<string | null>(null);
  const [managerModalOrderId, setManagerModalOrderId] = useState<string | null>(null);
  const [changedManager, setChangedManager] = useState<(typeof MANAGERS)[number]>('담당자1');
  const [toastMessage, setToastMessage] = useState('');

  const closeManagerModal = () => setManagerModalOrderId(null);
  const closePaymentModal = () => setPaymentModalOrderId(null);
  const confirmManagerChange = (orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, manager: changedManager } : o)));
    setToastMessage('담당자가 변경되었습니다.');
    closeManagerModal();
  };

  const handleDeleteOrder = (orderId: string) => {
    setConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      danger: true,
      onConfirm: () => setOrders((prev) => prev.filter((o) => o.id !== orderId)),
    });
  };

  const handleSampleDownload = (order: StoreEditOrderItem) => {
    if (!order.sampleNo) return;
    const content = [
      `주문번호: ${order.orderNo}`,
      `샘플번호: ${order.sampleNo}`,
      `작업자: ${order.worker ?? '-'}`,
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${order.sampleNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-list-page admin-list-page--edit-store">
      <h1 className="page-title">스토어팜 보정 주문 목록</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">총 {filteredOrders.length}개의 스토어팜 보정 주문이 검색되었습니다.</p>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">업로드일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="업로드일 프리셋"
                className="listselect--date-range"
                value={uploadDateRange}
                onChange={(next) => {
                  if (!next) {
                    setUploadDateRange('');
                    setUploadStartDate(null);
                    setUploadEndDate(null);
                    return;
                  }
                  setUploadDateRange(next);
                }}
                options={[{ value: '', label: '미선택' }, ...DATE_RANGES.map((r) => ({ value: r, label: r }))]}
              />
              <div className="date-range-pickers">
                <DatePicker selected={uploadStartDate} onChange={setUploadStartDate} placeholderText="시작일" dateFormat="yyyy-MM-dd" locale={ko} className="date-picker-input" isClearable={!!uploadStartDate} showMonthDropdown showYearDropdown dropdownMode="scroll" />
                <span className="date-sep">~</span>
                <DatePicker selected={uploadEndDate} onChange={setUploadEndDate} placeholderText="종료일" dateFormat="yyyy-MM-dd" locale={ko} className="date-picker-input" isClearable={!!uploadEndDate} showMonthDropdown showYearDropdown dropdownMode="scroll" minDate={uploadStartDate ?? undefined} />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">조건검색</span>
            <div className="admin-search-field">
              <ListSelect ariaLabel="조건검색 타입" className="listselect--condition-type" value={conditionType} onChange={(next) => setConditionType(next as '이름' | '아이디' | '전화번호' | '스팜주문번호')} options={[{ value: '이름', label: '이름' }, { value: '아이디', label: '아이디' }, { value: '전화번호', label: '전화번호' }, { value: '스팜주문번호', label: '스팜주문번호' }]} />
              <input type="text" placeholder="검색어 입력" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>검색</button>
            <button type="button" className={`detail-search-toggle ${filterExpanded ? 'is-open' : ''}`} onClick={() => setFilterExpanded((v) => !v)}>
              <span className="detail-search-toggle__text">상세검색</span>
            </button>
          </div>
        </div>

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">재수정요청일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="재수정요청일 프리셋"
                className="listselect--date-range"
                value={requestDateRange}
                onChange={(next) => {
                  if (!next) {
                    setRequestDateRange('');
                    setRequestStartDate(null);
                    setRequestEndDate(null);
                    return;
                  }
                  setRequestDateRange(next);
                }}
                options={[{ value: '', label: '미선택' }, ...DATE_RANGES.map((r) => ({ value: r, label: r }))]}
              />
              <div className="date-range-pickers">
                <DatePicker selected={requestStartDate} onChange={setRequestStartDate} placeholderText="시작일" dateFormat="yyyy-MM-dd" locale={ko} className="date-picker-input" isClearable={!!requestStartDate} showMonthDropdown showYearDropdown dropdownMode="scroll" />
                <span className="date-sep">~</span>
                <DatePicker selected={requestEndDate} onChange={setRequestEndDate} placeholderText="종료일" dateFormat="yyyy-MM-dd" locale={ko} className="date-picker-input" isClearable={!!requestEndDate} showMonthDropdown showYearDropdown dropdownMode="scroll" minDate={requestStartDate ?? undefined} />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">제작현황</span>
            <ListSelect ariaLabel="제작현황" value={workStatus} onChange={setWorkStatus} options={[{ value: '', label: '전체보기' }, { value: '보정진행중', label: '보정진행중' }, { value: '관리자업로드', label: '관리자업로드' }, { value: '재수정진행중', label: '재수정진행중' }, { value: '확정', label: '확정' }]} />
          </div>

          <div className="filter-section">
            <span className="filter-label">긴급사진보정</span>
            <ListSelect ariaLabel="긴급사진보정" value={urgentPhotoEdit} onChange={setUrgentPhotoEdit} options={[{ value: '', label: '전체보기' }, { value: '신청', label: '신청' }, { value: '미신청', label: '미신청' }]} />
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
                <th className="col-center">복사</th>
                <th>NO</th>
                <th>주문번호</th>
                <th>진행현황</th>
                <th>상품정보</th>
                <th className="col-center">긴급보정</th>
                <th className="col-center">고객정보</th>
                <th>결제현황</th>
                <th>사진</th>
                <th>샘플여부</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id}>
                  {(() => {
                    const paymentVariant = getPaymentRowVariant(order.paymentStatus);
                    return (
                      <>
                  <td className="col-center">
                    <ListRowCopyButton
                      text={formatStoreEditRowCopy(order)}
                      onCopied={() => setCopyInfoAlertOpen(true)}
                      ariaLabel="이름·아이디·전화번호·주문번호 복사"
                    />
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">{order.no}</span>
                      <span className="cell-line">{order.noSub}</span>
                    </div>
                  </td>
                  <td>{order.orderNo}</td>
                  <td>
                    <div className={['progress-status', getProgressVariantClass(normalizeProgress(order.progress))].join(' ')}>
                      <span className="progress-status__dot" aria-hidden="true" />
                      <span className="progress-status__text">{normalizeProgress(order.progress)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">
                        <span
                          className={[
                            'badge-square',
                            'badge-square--inline',
                            'badge-square--no-transition',
                            getCorrectionStrengthBadgeClass(order.correctionStrength),
                          ].join(' ')}
                        >
                          {order.correctionStrength}
                        </span>
                        {order.productName}
                      </span>
                      <span className="cell-line">
                        {'담당자: '}
                        <button
                          type="button"
                          className="admin-link"
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
                  <td className="col-center">{order.urgentAdded ? <span className="cell-line--danger">추가</span> : '없음'}</td>
                  <td className="col-center">
                    <div className="admin-cell-triple">
                      <span className="cell-line">{order.customerName}</span>
                      <span className="cell-line">{order.customerId}</span>
                      <span className="cell-line">{order.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={['row-btn', paymentVariant.rowBtnClass].join(' ')}
                      onClick={() => setPaymentModalOrderId(order.id)}
                    >
                      <span className={['progress-status', paymentVariant.dotClass].join(' ')}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{order.paymentStatus}</span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <div className="row-options">
                      <button
                        type="button"
                        className="row-options__trigger"
                        aria-haspopup="menu"
                        aria-expanded={openPhotoOrderId === order.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (openPhotoOrderId === order.id) {
                            setOpenPhotoOrderId(null);
                            setPhotoDropdownPos(null);
                            return;
                          }
                          photoDropdownAnchorRef.current = e.currentTarget;
                          const r = e.currentTarget.getBoundingClientRect();
                          setPhotoDropdownPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                          setOpenPhotoOrderId(order.id);
                        }}
                      >
                        <MoreHorizontal size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                  <td>
                    {order.sampleNo ? (
                      <div className="cell-block">
                        <span className="cell-line cell-line--with-action">
                          <span>샘플번호: {order.sampleNo}</span>
                          {normalizeProgress(order.progress) === '관리자업로드' && (
                            <button
                              type="button"
                              className="row-icon-btn row-icon-btn--tone-primary row-icon-btn--inline-sm"
                              aria-label="샘플 다운로드"
                              onClick={() => handleSampleDownload(order)}
                            >
                              <Download size={12} aria-hidden="true" />
                            </button>
                          )}
                        </span>
                        <span className="cell-line">{order.sampleWorkStatus === '작업전' ? '작업전' : `작업자: ${order.worker ?? '-'}`}</span>
                      </div>
                    ) : (
                      ''
                    )}
                  </td>
                  <td>
                    <button type="button" className="row-icon-btn row-icon-btn--danger" aria-label="삭제" onClick={() => handleDeleteOrder(order.id)}>
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '20px' }}>검색 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage <= 1} aria-label="첫 페이지">&laquo;</button>
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} aria-label="이전 페이지">&lsaquo;</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} type="button" className={currentPage === page ? 'active' : ''} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} aria-label="다음 페이지">&rsaquo;</button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} aria-label="마지막 페이지">&raquo;</button>
            </div>
          </div>
        </div>
      </section>

      {portalPhotoOrder && photoDropdownPos
        ? createPortal(
            <div className="row-options__menu-portal" role="menu" style={{ position: 'fixed', top: photoDropdownPos.top, right: photoDropdownPos.right, zIndex: 10000 }}>
              {getPhotoMenuItemsByProgress(normalizeProgress(portalPhotoOrder.progress)).map((item) => (
                <button key={`${portalPhotoOrder.id}-${item}`} type="button" className="row-options__item" role="menuitem" onClick={() => setOpenPhotoOrderId(null)}>
                  {item}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}

      {paymentModalOrderId && (() => {
        const order = orders.find((o) => o.id === paymentModalOrderId);
        if (!order) return null;
        const isUnpaid = order.paymentStatus === '결제전';
        const isCanceled = order.paymentStatus === '결제취소';
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
              </div>
            </Modal.Body>
            <Modal.Footer>
              {!isUnpaid && !isCanceled && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--danger"
                  onClick={() => {
                    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: '결제취소' } : o)));
                    closePaymentModal();
                  }}
                >
                  결제취소
                </button>
              )}
              {isUnpaid && (
                <button
                  type="button"
                  className="option-modal__btn option-modal__btn--primary"
                  onClick={() => {
                    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, paymentStatus: '결제완료' } : o)));
                    closePaymentModal();
                  }}
                >
                  결제완료 처리
                </button>
              )}
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closePaymentModal}>
                닫기
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

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
                  <ListSelect
                    ariaLabel="변경 담당자"
                    className="listselect--modal"
                    value={changedManager}
                    onChange={(next) => setChangedManager(next as (typeof MANAGERS)[number])}
                    options={MANAGERS.map((m) => ({ value: m, label: m }))}
                  />
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeManagerModal}>
                닫기
              </button>
              <button
                type="button"
                className="option-modal__btn option-modal__btn--primary"
                onClick={() => confirmManagerChange(order.id)}
              >
                변경 저장
              </button>
            </Modal.Footer>
          </Modal>
        );
      })()}

      <Alert
        open={copyInfoAlertOpen}
        message={CUSTOMER_INFO_COPIED_ALERT_MESSAGE}
        onClose={() => setCopyInfoAlertOpen(false)}
      />

      <Confirm
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        danger={confirmDialog?.danger}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (!confirmDialog) return;
          confirmDialog.onConfirm();
          setConfirmDialog(null);
        }}
      />
      <Toast
        open={Boolean(toastMessage)}
        message={toastMessage}
        variant="success"
        onClose={() => setToastMessage('')}
      />
    </div>
  );
}
