import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './OrderListPage.css';
import ListSelect from '../../../components/ListSelect';
import Confirm from '../../../components/confirm';
import Alert from '../../../components/alert';
import { MOCK_SAMPLE_EDIT_ORDERS, type SampleEditItem } from './mock/orderEditSample.mock';

const DATE_RANGES = ['당일', '3일', '1주', '2주', '1개월', '3개월', '6개월'] as const;

type ConditionType = '이름' | '아이디' | '주문번호';
type AppliedSearch = {
  requestDateRange: string;
  requestStartDate: Date | null;
  requestEndDate: Date | null;
  conditionType: ConditionType;
  keyword: string;
  workStatus: string;
  reviewStatus: string;
};

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
};

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

function getStrengthBadgeClass(strength: SampleEditItem['correctionStrength']): string {
  if (strength === '강') return 'badge-square--strength-strong';
  if (strength === '중') return 'badge-square--strength-medium';
  if (strength === '약') return 'badge-square--strength-weak';
  return 'badge-square--strength-designer';
}

function getProgressByWorkStatus(workStatus: SampleEditItem['workStatus']): '작업중' | '작업완료' | '작업전' {
  if (workStatus === '고객업로드') return '작업중';
  if (workStatus === '관리자업로드' || workStatus === '원본업로드') return '작업완료';
  return '작업전';
}

function getProgressVariantClass(progress: string): string {
  if (progress === '작업전') return 'progress-status--primary';
  if (progress === '작업중') return 'progress-status--danger';
  if (progress === '작업완료') return 'progress-status--secondary';
  if (progress === '재수정대기중') return 'progress-status--warning';
  if (progress === '재수정작업중') return 'progress-status--danger';
  return 'progress-status--warning';
}

function getPhotoMenuItemsByProgress(progress: string): string[] {
  if (progress === '작업완료') return ['사진등록', '원본다운로드', '관리자사진다운로드'];
  if (progress === '재수정대기중' || progress === '재수정작업중') {
    return ['사진등록', '원본다운로드', '관리자사진다운로드', '재수정요청다운로드'];
  }
  return ['사진등록', '원본다운로드'];
}

function applyFilters(rows: SampleEditItem[], applied: AppliedSearch | null): SampleEditItem[] {
  if (!applied) return rows;
  const keywordTrim = applied.keyword.trim().toLowerCase();
  return rows.filter((row) => {
    const useCustomRange = applied.requestStartDate != null || applied.requestEndDate != null;
    if (useCustomRange) {
      if (!isInCustomDateRange(row.requestDate, applied.requestStartDate, applied.requestEndDate)) return false;
    } else if (!isInPresetDateRange(row.requestDate, applied.requestDateRange)) {
      return false;
    }

    if (keywordTrim) {
      if (applied.conditionType === '이름' && !row.customerName.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '아이디' && !row.customerId.toLowerCase().includes(keywordTrim)) return false;
      if (applied.conditionType === '주문번호' && !row.orderNo.toLowerCase().includes(keywordTrim)) return false;
    }
    if (applied.workStatus && row.workStatus !== applied.workStatus) return false;
    if (applied.reviewStatus && row.reviewStatus !== applied.reviewStatus) return false;
    return true;
  });
}

export default function OrderEditSamplePage() {
  const [rows, setRows] = useState<SampleEditItem[]>(() => MOCK_SAMPLE_EDIT_ORDERS);
  const [filterExpanded, setFilterExpanded] = useState(false);

  const [requestDateRange, setRequestDateRange] = useState('');
  const [requestStartDate, setRequestStartDate] = useState<Date | null>(null);
  const [requestEndDate, setRequestEndDate] = useState<Date | null>(null);

  const [conditionType, setConditionType] = useState<ConditionType>('이름');
  const [keyword, setKeyword] = useState('');

  const [workStatus, setWorkStatus] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [openPhotoOrderId, setOpenPhotoOrderId] = useState<string | null>(null);
  const [photoDropdownPos, setPhotoDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const photoDropdownAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const filteredRows = useMemo(() => applyFilters(rows, appliedSearch), [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);
  const portalPhotoRow = useMemo(
    () => (openPhotoOrderId ? rows.find((row) => row.id === openPhotoOrderId) ?? null : null),
    [openPhotoOrderId, rows]
  );

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

  const handleSearch = () => {
    setAppliedSearch({
      requestDateRange,
      requestStartDate,
      requestEndDate,
      conditionType,
      keyword,
      workStatus,
      reviewStatus,
    });
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteOrder = (orderId: string) => {
    setConfirmDialog({
      title: '주문 삭제',
      message: '삭제 하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      danger: true,
      onConfirm: () => {
        setRows((prev) => prev.filter((row) => row.id !== orderId));
      },
    });
  };

  return (
    <div className="admin-list-page admin-list-page--edit-sample">
      <h1 className="page-title">샘플 보정 목록</h1>

      <section className="admin-list-box">
        <p className="admin-list-result">총 {filteredRows.length}개의 샘플 보정이 검색되었습니다.</p>
      </section>

      <section className="admin-list-box">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">요청일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="요청일 프리셋"
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
                <DatePicker
                  selected={requestStartDate}
                  onChange={setRequestStartDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!requestStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={requestEndDate}
                  onChange={setRequestEndDate}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!requestEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  minDate={requestStartDate ?? undefined}
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
                onChange={(next) => setConditionType(next as ConditionType)}
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
            </button>
          </div>
        </div>

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
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
                { value: '원본업로드', label: '원본업로드' },
              ]}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">후기작성</span>
            <ListSelect
              ariaLabel="후기작성"
              value={reviewStatus}
              onChange={setReviewStatus}
              options={[
                { value: '', label: '전체보기' },
                { value: '작성', label: '작성' },
                { value: '미작성', label: '미작성' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>진행현황</th>
                <th>이름</th>
                <th>전화번호</th>
                <th>요청일</th>
                <th className="col-center">보정강도</th>
                <th className="col-center">사진</th>
                <th className="col-center">후기</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const progress = getProgressByWorkStatus(row.workStatus);
                return (
                  <tr key={row.id}>
                    <td>{row.no}</td>
                    <td>
                      <div className={['progress-status', getProgressVariantClass(progress)].join(' ')}>
                        <span className="progress-status__dot" aria-hidden="true" />
                        <span className="progress-status__text">{progress}</span>
                      </div>
                    </td>
                    <td>{row.customerName}</td>
                    <td>{row.customerPhone}</td>
                    <td>{row.requestDate}</td>
                    <td className="col-center">
                      <span
                        className={[
                          'badge-square',
                          'badge-square--inline',
                          'badge-square--no-transition',
                          getStrengthBadgeClass(row.correctionStrength),
                        ].join(' ')}
                      >
                        {row.correctionStrength}
                      </span>
                    </td>
                    <td className="col-center">
                      <div className="row-options">
                        <button
                          type="button"
                          className="row-options__trigger"
                          aria-haspopup="menu"
                          aria-expanded={openPhotoOrderId === row.id}
                          aria-label="사진 옵션"
                          onClick={(e) => {
                            e.stopPropagation();
                            const closing = openPhotoOrderId === row.id;
                            if (closing) {
                              setOpenPhotoOrderId(null);
                              setPhotoDropdownPos(null);
                              return;
                            }
                            photoDropdownAnchorRef.current = e.currentTarget;
                            const r = e.currentTarget.getBoundingClientRect();
                            setPhotoDropdownPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
                            setOpenPhotoOrderId(row.id);
                          }}
                        >
                          <MoreHorizontal size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td className="col-center">
                      {row.reviewUrl ? (
                        <div className="cell-line--with-action">
                          <button
                            type="button"
                            className="row-icon-btn row-icon-btn--tone-primary"
                            aria-label="후기 확인하기"
                            onClick={() => openExternal(row.reviewUrl as string)}
                          >
                            <ExternalLink size={18} aria-hidden="true" />
                          </button>
                          {row.originalDeliveryUrl ? (
                            <button
                              type="button"
                              className="row-icon-btn row-icon-btn--tone-purple"
                              aria-label="원본 전달하기"
                              onClick={() => {
                                setAlertMessage('원본이 전달되었습니다.');
                              }}
                            >
                              <Send size={18} aria-hidden="true" />
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        ''
                      )}
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--danger"
                        aria-label="삭제"
                        onClick={() => handleDeleteOrder(row.id)}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      </section>
      {portalPhotoRow && photoDropdownPos
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
              {getPhotoMenuItemsByProgress(getProgressByWorkStatus(portalPhotoRow.workStatus)).map((item) => (
                <button
                  key={`${portalPhotoRow.id}-${item}`}
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
      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
