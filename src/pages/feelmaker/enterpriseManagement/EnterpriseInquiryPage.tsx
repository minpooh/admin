import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import Alert from '../../../components/Alert';
import '../../../styles/adminPage.css';
import { pagePath } from '../../../routes';
import type { EnterpriseInquiryAnswerStatus, EnterpriseInquiryRow } from './mock/enterpriseInquiryList.mock';
import { MOCK_ENTERPRISE_INQUIRIES } from './mock/enterpriseInquiryList.mock';

const RichTextEditor = lazy(async () => {
  const mod = await import('../../../components/RichTextEditor');
  return { default: mod.RichTextEditor };
});
const RichTextEditorFrequentReplies = lazy(async () => {
  const mod = await import('../../../components/RichTextEditor');
  return { default: mod.RichTextEditorFrequentReplies };
});
const RichTextEditorModeLabel = lazy(async () => {
  const mod = await import('../../../components/RichTextEditor');
  return { default: mod.RichTextEditorModeLabel };
});

const PAGE_SIZE = 10;

const SEARCH_SCOPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'companyName', label: '회사명' },
  { value: 'companyLoginId', label: '회사아이디' },
  { value: 'title', label: '제목' },
  { value: 'content', label: '내역' },
];

const ANSWER_STATUS_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'pending', label: '답변전' },
  { value: 'answered', label: '답변완료' },
];

type AppliedSearch = {
  dateRange: string;
  startDate: Date | null;
  endDate: Date | null;
  searchScope: string;
  keyword: string;
  answerStatus: string;
};

type AppliedChipKey = 'date' | 'keyword' | 'answerStatus';

function parseDateTime(value: string): Date {
  return new Date(value.replace(' ', 'T'));
}

function formatYmd(d: Date | null): string {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isAppliedSearchEmpty(search: AppliedSearch): boolean {
  return !search.dateRange && !search.startDate && !search.endDate && !search.keyword.trim() && !search.answerStatus;
}

function answerStatusLabel(status: string): string {
  return ANSWER_STATUS_OPTIONS.find((opt) => opt.value === status)?.label ?? '';
}

function answerStatusButtonClass(status: EnterpriseInquiryAnswerStatus): string {
  if (status === 'answered') return 'row-btn row-btn--status-secondary';
  return 'row-btn row-btn--status-warning';
}

function answerStatusText(status: EnterpriseInquiryAnswerStatus): string {
  if (status === 'answered') return '답변완료';
  return '답변전';
}

type EnterpriseInquiryReplyEntry = {
  id: string;
  authorName: string;
  createdAt: string;
  body: string;
};

type ReplyEditorState = { status: 'idle' } | { status: 'new' } | { status: 'edit'; entryId: string };

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newReplyId(): string {
  return `ent-inq-reply-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function initialRepliesFromRow(row: EnterpriseInquiryRow): EnterpriseInquiryReplyEntry[] {
  if (!row.answerContent) return [];
  return [
    {
      id: `${row.id}-seed-reply`,
      authorName: row.responderName ?? '관리자',
      createdAt: row.answeredAt ?? row.createdAt,
      body: row.answerContent,
    },
  ];
}

function ThreadBody({ body }: { body: string }) {
  const trimmed = body.trim();
  const isHtml = trimmed.startsWith('<');
  if (isHtml) {
    return (
      <div
        className="inquiry-thread-item__body inquiry-thread-item__body--rich"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    );
  }
  return <div className="inquiry-thread-item__body">{body}</div>;
}

const ENTERPRISE_INQUIRY_LIST_PATH = pagePath({
  navId: 'feelmaker',
  sectionId: 'enterpriseManagement',
  itemId: 'enterpriseInquiry',
});

function enterpriseInquiryDetailPath(id: string): string {
  return pagePath({
    navId: 'feelmaker',
    sectionId: 'enterpriseManagement',
    itemId: 'enterpriseInquiry',
    subId: id,
  });
}

function EnterpriseInquiryDetailView({
  row,
  onSyncRow,
}: {
  row: EnterpriseInquiryRow;
  onSyncRow: (next: Partial<EnterpriseInquiryRow>) => void;
}) {
  const [replyList, setReplyList] = useState<EnterpriseInquiryReplyEntry[]>(() => initialRepliesFromRow(row));
  const [replyEditor, setReplyEditor] = useState<ReplyEditorState>({ status: 'idle' });
  const [replyEditorNonce, setReplyEditorNonce] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setReplyList(initialRepliesFromRow(row));
    setReplyEditor({ status: 'idle' });
    setAlertMessage('');
  }, [row.id, row.answerContent, row.answeredAt, row.responderName, row.createdAt]);

  const openNewReplyEditor = useCallback(() => {
    setReplyEditor({ status: 'new' });
    setReplyEditorNonce((n) => n + 1);
  }, []);

  const openEditReplyEditor = useCallback((entryId: string) => {
    setReplyEditor({ status: 'edit', entryId });
    setReplyEditorNonce((n) => n + 1);
  }, []);

  const closeReplyEditor = useCallback(() => {
    setReplyEditor({ status: 'idle' });
  }, []);

  const commitReply = useCallback(
    (html: string, mode: 'new' | 'edit', editId?: string) => {
      const now = formatNow();
      setReplyList((prev) => {
        let nextReplies = prev;
        if (mode === 'new') {
          nextReplies = [
            ...prev,
            {
              id: newReplyId(),
              authorName: row.responderName ?? '관리자',
              createdAt: now,
              body: html,
            },
          ];
        } else if (editId) {
          nextReplies = prev.map((item) => (item.id === editId ? { ...item, body: html, createdAt: now } : item));
        }
        const latest = nextReplies[nextReplies.length - 1];
        if (latest) {
          onSyncRow({
            answerStatus: 'answered',
            responderName: latest.authorName,
            answeredAt: latest.createdAt,
            answerContent: latest.body,
          });
        }
        return nextReplies;
      });
      setReplyEditor({ status: 'idle' });
      setAlertMessage(mode === 'new' ? '답변이 등록되었습니다.' : '답변이 수정되었습니다.');
    },
    [onSyncRow, row.responderName],
  );

  const latestReply = replyList[replyList.length - 1];
  const showRegisterBtn = replyEditor.status !== 'new';

  return (
    <div className="admin-list-page admin-list-page--inquiry">
      <div className="admin-detail-header">
        <Link to={ENTERPRISE_INQUIRY_LIST_PATH} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">엔터프라이즈문의 상세</h1>
      </div>

      <section className="admin-list-box">
        <p className="admin-detail-id">{row.id}</p>
        <h2 className="admin-detail-title">{row.title}</h2>
        <dl className="admin-detail-meta">
          <div className="admin-detail-meta__row">
            <dt>작성일</dt>
            <dd>{row.createdAt}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>작성사</dt>
            <dd>{row.companyName}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>회사아이디</dt>
            <dd>{row.companyLoginId}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>답변 여부</dt>
            <dd>
              <button type="button" className={answerStatusButtonClass(latestReply ? 'answered' : 'pending')}>
                {answerStatusText(latestReply ? 'answered' : 'pending')}
              </button>
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>답변자</dt>
            <dd>{latestReply?.authorName ?? '-'}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>답변일</dt>
            <dd>{latestReply?.createdAt ?? '-'}</dd>
          </div>
        </dl>
      </section>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col">
          <h3 className="admin-detail-section-title">문의 내용</h3>
          <div className="admin-detail-body">{row.content}</div>
        </section>

        <section className="admin-list-box inquiry-thread-section inquiry-reply-section admin-two-col__col">
          <div className="inquiry-reply-section__head">
            <h3 className="admin-detail-section-title inquiry-reply-section__title">답변 내역</h3>
            {showRegisterBtn && (
              <button
                type="button"
                className="filter-btn filter-btn--primary inquiry-reply-section__open-btn"
                onClick={openNewReplyEditor}
              >
                답변 등록
              </button>
            )}
          </div>
          <p className="inquiry-thread-hint">관리자가 등록한 답변만 표시됩니다.</p>

          {replyEditor.status === 'new' && (
            <Suspense fallback={<p className="inquiry-thread-empty">에디터 로딩 중...</p>}>
              <RichTextEditor
                key={`ent-new-${replyEditorNonce}`}
                initialBody=""
                renderTop={({ insertPlainText }) => (
                  <>
                    <RichTextEditorModeLabel variant="new" />
                    <RichTextEditorFrequentReplies onInsert={insertPlainText} />
                  </>
                )}
                onCancel={closeReplyEditor}
                onSave={(html) => commitReply(html, 'new')}
                onEmpty={() => setAlertMessage('답변 내용을 입력해주세요.')}
              />
            </Suspense>
          )}

          {replyList.length === 0 ? (
            <p className="inquiry-thread-empty">등록된 답변이 없습니다.</p>
          ) : (
            <ul className="inquiry-thread-list">
              {replyList.map((item) => {
                const isEditingThis = replyEditor.status === 'edit' && replyEditor.entryId === item.id;
                return (
                  <li key={item.id} className="inquiry-thread-item inquiry-thread-item--admin">
                    <div className="inquiry-thread-item__head">
                      <span className="inquiry-thread-item__author">{item.authorName}</span>
                      <span className="inquiry-thread-item__badge">관리자</span>
                      <span className="inquiry-thread-item__head-actions">
                        <span className="inquiry-thread-item__date">{item.createdAt}</span>
                        {!isEditingThis && (
                          <button
                            type="button"
                            className="inquiry-thread-item__edit-btn"
                            onClick={() => openEditReplyEditor(item.id)}
                            aria-label={`답변 수정 (${item.createdAt})`}
                          >
                            <Pencil size={16} strokeWidth={2} aria-hidden />
                          </button>
                        )}
                      </span>
                    </div>
                    {isEditingThis ? (
                      <div className="reply-editor-wrap--inline">
                        <Suspense fallback={<p className="inquiry-thread-empty">에디터 로딩 중...</p>}>
                          <RichTextEditor
                            key={`ent-edit-${item.id}-${replyEditorNonce}`}
                            initialBody={item.body}
                            renderTop={({ insertPlainText }) => (
                              <>
                                <RichTextEditorModeLabel variant="edit" />
                                <RichTextEditorFrequentReplies onInsert={insertPlainText} />
                              </>
                            )}
                            onCancel={closeReplyEditor}
                            onSave={(html) => commitReply(html, 'edit', item.id)}
                            onEmpty={() => setAlertMessage('답변 수정 내용을 입력해주세요.')}
                          />
                        </Suspense>
                      </div>
                    ) : (
                      <ThreadBody body={item.body} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}

export default function EnterpriseInquiryPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [dateRange, setDateRange] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searchScope, setSearchScope] = useState('');
  const [keyword, setKeyword] = useState('');
  const [answerStatus, setAnswerStatus] = useState('');
  const [rows, setRows] = useState<EnterpriseInquiryRow[]>(() => [...MOCK_ENTERPRISE_INQUIRIES]);
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;
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

    return rows.filter((row) => {
      const createdAt = parseDateTime(row.createdAt);
      if (startBoundary && createdAt < startBoundary) return false;
      if (endBoundary && createdAt > endBoundary) return false;

      if (keywordTrim) {
        if (appliedSearch.searchScope === 'companyName' && !row.companyName.toLowerCase().includes(keywordTrim)) return false;
        if (appliedSearch.searchScope === 'companyLoginId' && !row.companyLoginId.toLowerCase().includes(keywordTrim)) return false;
        if (appliedSearch.searchScope === 'title' && !row.title.toLowerCase().includes(keywordTrim)) return false;
        if (appliedSearch.searchScope === 'content' && !row.content.toLowerCase().includes(keywordTrim)) return false;
        if (!appliedSearch.searchScope) {
          if (
            !row.companyName.toLowerCase().includes(keywordTrim) &&
            !row.companyLoginId.toLowerCase().includes(keywordTrim) &&
            !row.title.toLowerCase().includes(keywordTrim) &&
            !row.content.toLowerCase().includes(keywordTrim)
          ) {
            return false;
          }
        }
      }

      if (appliedSearch.answerStatus && row.answerStatus !== appliedSearch.answerStatus) return false;
      return true;
    });
  }, [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: AppliedSearch = { dateRange, startDate, endDate, searchScope, keyword, answerStatus };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const appliedChips: Array<{ key: AppliedChipKey; label: string }> = useMemo(() => {
    if (!appliedSearch) return [];
    const chips: Array<{ key: AppliedChipKey; label: string }> = [];
    if (appliedSearch.startDate || appliedSearch.endDate) {
      const start = formatYmd(appliedSearch.startDate);
      const end = formatYmd(appliedSearch.endDate);
      chips.push({ key: 'date', label: `작성일: ${start}${start && end ? ' ~ ' : ''}${end}` });
    } else if (appliedSearch.dateRange) {
      chips.push({ key: 'date', label: `작성일: ${appliedSearch.dateRange}` });
    }
    if (appliedSearch.keyword.trim()) {
      const scopeLabel = SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }
    if (appliedSearch.answerStatus) {
      chips.push({ key: 'answerStatus', label: `답변여부: ${answerStatusLabel(appliedSearch.answerStatus)}` });
    }
    return chips;
  }, [appliedSearch]);

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
    }
    if (key === 'keyword') {
      setSearchScope('');
      setKeyword('');
      next.searchScope = '';
      next.keyword = '';
    }
    if (key === 'answerStatus') {
      setAnswerStatus('');
      next.answerStatus = '';
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  if (subId) {
    const detailRow = rows.find((row) => row.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page admin-list-page--inquiry">
          <div className="admin-detail-header">
            <Link to={ENTERPRISE_INQUIRY_LIST_PATH} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">엔터프라이즈문의 상세</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">문의를 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }
    return (
      <EnterpriseInquiryDetailView
        row={detailRow}
        onSyncRow={(next) => {
          setRows((prev) => prev.map((item) => (item.id === detailRow.id ? { ...item, ...next } : item)));
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">엔터프라이즈문의</h1>

      <section className="admin-list-box" aria-label="검색 결과 요약">
        <p className="admin-list-result">총0개의 게시물이 있습니다. 미답변건은 0개입니다.</p>
      </section>

      <section className="admin-list-box" aria-label="문의 검색 필터">
        <div className="filter-top-row admin-filter-row--equal-4">
          <div className="filter-section">
            <span className="filter-label">작성일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="작성일 프리셋"
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
                  if (next === '당일') {
                    setStartDate(start);
                    setEndDate(end);
                    return;
                  }
                  if (next === '3일') start.setDate(start.getDate() - 2);
                  if (next === '1주') start.setDate(start.getDate() - 6);
                  if (next === '2주') start.setDate(start.getDate() - 13);
                  if (next === '1개월') start.setDate(start.getDate() - 29);
                  if (next === '3개월') start.setDate(start.getDate() - 89);
                  if (next === '6개월') start.setDate(start.getDate() - 179);
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
                  { value: '3개월', label: '3개월' },
                  { value: '6개월', label: '6개월' },
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
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={searchScope}
                onChange={setSearchScope}
                options={SEARCH_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="문의 검색"
              />
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">답변여부</span>
            <ListSelect ariaLabel="답변여부" value={answerStatus} onChange={setAnswerStatus} options={ANSWER_STATUS_OPTIONS} />
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="문의 내역 목록">
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
          <table className="admin-table admin-table--enterprise-inquiries">
            <thead>
              <tr>
                <th>작성일</th>
                <th>제목</th>
                <th>답변여부</th>
                <th>작성사</th>
                <th>답변자</th>
                <th>답변일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.createdAt}</td>
                  <td className="admin-table-col-title">
                    <Link to={enterpriseInquiryDetailPath(row.id)} className="admin-link admin-table-title-link">
                      {row.title}
                    </Link>
                  </td>
                  <td>
                    <button type="button" className={answerStatusButtonClass(row.answerStatus)}>
                      {answerStatusText(row.answerStatus)}
                    </button>
                  </td>
                  <td>{row.companyName}</td>
                  <td>{row.responderName ?? '-'}</td>
                  <td>{row.answeredAt ?? '-'}</td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
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
              <button type="button" onClick={() => setCurrentPage((p) => jumpPageBack(p))} disabled={currentPage <= 1} aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}>
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => jumpPageForward(p, totalPages))}
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
