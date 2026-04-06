import { useEffect, useMemo, useState } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import Modal from '../../../components/modal';
import Confirm from '../../../components/confirm';
import ListSelect from '../../../components/ListSelect';
import { MOCK_VIDEO_MIX_ORDERS, type VideoMixItem } from './mock/orderVideoMix.mock';

function getStatusVariantClass(status: VideoMixItem['status']) {
  if (status === '병합완료') return 'progress-status--secondary';
  if (status === '병합실패') return 'progress-status--danger';
  if (status === '병합중') return 'progress-status--warning';
  return 'progress-status--primary';
}

export default function OrderVideoMixPage() {
  const [orders, setOrders] = useState<VideoMixItem[]>(() => MOCK_VIDEO_MIX_ORDERS);
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [conditionType, setConditionType] = useState<'이름' | '아이디' | '전화번호'>('이름');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<{
    dateRange: string;
    startDate: Date | null;
    endDate: Date | null;
    conditionType: '이름' | '아이디' | '전화번호';
    keyword: string;
    status: string;
  } | null>(null);

  const [preview, setPreview] = useState<{
    orderId: string;
    type: 'video1' | 'video2' | 'merged';
  } | null>(null);
  const [deleteTargetOrderId, setDeleteTargetOrderId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const previewOrder = preview ? orders.find((o) => o.id === preview.orderId) ?? null : null;
  const previewUrl =
    preview && previewOrder
      ? preview.type === 'video1'
        ? previewOrder.video1Url
        : preview.type === 'video2'
          ? previewOrder.video2Url
          : previewOrder.mergedVideoUrl
      : null;
  const previewTitle = preview?.type === 'video1' ? '영상1 미리보기' : preview?.type === 'video2' ? '영상2 미리보기' : '병합영상 미리보기';

  const filteredOrders = useMemo(() => {
    if (!appliedSearch) return orders;

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

    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt.replace(' ', 'T'));
      if (startBoundary && createdAt < startBoundary) return false;
      if (endBoundary && createdAt > endBoundary) return false;

      if (!startBoundary && !endBoundary && appliedSearch.dateRange) {
        const now = new Date();
        const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (appliedSearch.dateRange === '당일' && createdAt.toDateString() !== now.toDateString()) return false;
        if (appliedSearch.dateRange === '3일' && !(diffDays >= 0 && diffDays < 3)) return false;
        if (appliedSearch.dateRange === '1주' && !(diffDays >= 0 && diffDays < 7)) return false;
        if (appliedSearch.dateRange === '2주' && !(diffDays >= 0 && diffDays < 14)) return false;
        if (appliedSearch.dateRange === '1개월' && !(diffDays >= 0 && diffDays < 30)) return false;
      }

      if (keywordTrim) {
        if (appliedSearch.conditionType === '이름' && !order.customerName.toLowerCase().includes(keywordTrim))
          return false;
        if (appliedSearch.conditionType === '아이디' && !order.customerId.toLowerCase().includes(keywordTrim))
          return false;
        if (appliedSearch.conditionType === '전화번호' && !order.customerPhone.toLowerCase().includes(keywordTrim))
          return false;
      }

      if (appliedSearch.status && order.status !== appliedSearch.status) return false;
      return true;
    });
  }, [orders, appliedSearch]);

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
      dateRange,
      startDate,
      endDate,
      conditionType,
      keyword,
      status,
    });
  };

  const formatYmd = (d: Date | null) => {
    if (!d) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  type AppliedChipKey = 'date' | 'keyword' | 'status';
  const isAppliedSearchEmpty = (s: typeof appliedSearch) => {
    if (!s) return true;
    return !s.dateRange && s.startDate == null && s.endDate == null && !s.keyword.trim() && !s.status;
  };

  const clearAppliedFilter = (key: AppliedChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'date') {
      setDateRange('');
      setStartDate(null);
      setEndDate(null);
      next.dateRange = '';
      next.startDate = null;
      next.endDate = null;
    } else if (key === 'keyword') {
      setKeyword('');
      next.keyword = '';
    } else if (key === 'status') {
      setStatus('');
      next.status = '';
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `제작일: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `제작일: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      chips.push({
        key: 'keyword',
        label: `검색: ${appliedSearch.conditionType} ${appliedSearch.keyword}`,
      });
    }
    if (appliedSearch.status) chips.push({ key: 'status', label: `진행상태: ${appliedSearch.status}` });
    return chips;
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--test-video admin-list-page--video-mix">
      <h1 className="page-title">비디오믹스</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">총 {filteredOrders.length}개의 비디오믹스가 존재합니다.</p>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row admin-filter-row--no-detail">
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
                  const today = new Date();
                  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const start = new Date(end);
                  if (next === '3일') start.setDate(start.getDate() - 2);
                  if (next === '1주') start.setDate(start.getDate() - 6);
                  if (next === '2주') start.setDate(start.getDate() - 13);
                  if (next === '1개월') start.setDate(start.getDate() - 29);
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
                ariaLabel="조건검색 타입"
                className="listselect--condition-type"
                value={conditionType}
                onChange={(next) => setConditionType(next as '이름' | '아이디' | '전화번호')}
                options={[
                  { value: '이름', label: '이름' },
                  { value: '아이디', label: '아이디' },
                  { value: '전화번호', label: '전화번호' },
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

          <div className="filter-section">
            <span className="filter-label">진행상태</span>
            <ListSelect
              ariaLabel="진행상태"
              value={status}
              onChange={setStatus}
              options={[
                { value: '', label: '전체' },
                { value: '병합대기', label: '병합대기' },
                { value: '병합중', label: '병합중' },
                { value: '병합완료', label: '병합완료' },
                { value: '병합실패', label: '병합실패' },
              ]}
            />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
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
                <th>제작일</th>
                <th>이름</th>
                <th>아이디</th>
                <th>전화번호</th>
                <th>진행상태</th>
                <th>실패사유</th>
                <th>영상1</th>
                <th>영상2</th>
                <th>병합영상</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.createdAt}</td>
                  <td>{order.customerName}</td>
                  <td>{order.customerId}</td>
                  <td>{order.customerPhone}</td>
                  <td>
                    <span className={['progress-status', getStatusVariantClass(order.status)].join(' ')}>
                      <span className="progress-status__dot" aria-hidden="true" />
                      <span className="progress-status__text">{order.status}</span>
                    </span>
                  </td>
                  <td>{order.failReason || '-'}</td>
                  <td>
                    {order.video1Url ? (
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-primary"
                        aria-label="영상1 보기"
                        title="영상1 보기"
                        onClick={() => setPreview({ orderId: order.id, type: 'video1' })}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {order.video2Url ? (
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-primary"
                        aria-label="영상2 보기"
                        title="영상2 보기"
                        onClick={() => setPreview({ orderId: order.id, type: 'video2' })}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    {order.mergedVideoUrl ? (
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-primary"
                        aria-label="병합영상 보기"
                        title="병합영상 보기"
                        onClick={() => setPreview({ orderId: order.id, type: 'merged' })}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      aria-label="삭제"
                      onClick={() => setDeleteTargetOrderId(order.id)}
                    >
                      <Trash2 size={18} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedOrders.length === 0 && (
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
        </div>
      </section>

      {preview && (
        <Modal open onClose={() => setPreview(null)} ariaLabel={previewTitle} variant="option">
          <Modal.Header>
            <Modal.Title>{previewTitle}</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            {previewUrl ? (
              <video
                controls
                style={{ width: '100%', borderRadius: '10px', background: 'var(--gray-900)' }}
                src={previewUrl}
              />
            ) : (
              <div className="option-modal__desc">재생 가능한 영상이 없습니다.</div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={() => setPreview(null)}>
              닫기
            </button>
          </Modal.Footer>
        </Modal>
      )}

      <Confirm
        open={Boolean(deleteTargetOrderId)}
        title="주문 삭제"
        message="삭제 하시겠습니까?"
        confirmText="삭제"
        cancelText="취소"
        danger
        onClose={() => setDeleteTargetOrderId(null)}
        onConfirm={() => {
          if (!deleteTargetOrderId) return;
          setOrders((prev) => prev.filter((v) => v.id !== deleteTargetOrderId));
          setDeleteTargetOrderId(null);
        }}
      />
    </div>
  );
}