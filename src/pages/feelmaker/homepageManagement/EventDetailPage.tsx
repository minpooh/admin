import { useState } from 'react';
import { Link } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Pencil } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import { RichTextEditor } from '../../../components/RichTextEditor';
import '../../../styles/adminPage.css';
import './EventPage.css';
import type { EventRow } from './mock/event.mock';
import { eventListPath } from './eventPaths';

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(y, mo, d, 12, 0, 0, 0);
}

function parseEventPeriod(period: string): { start: Date | null; end: Date | null } {
  const trimmed = period.trim();
  const parts = trimmed.split(/\s*~\s*/);
  if (parts.length >= 2) {
    return {
      start: parseYmd(parts[0] ?? ''),
      end: parseYmd(parts[1] ?? ''),
    };
  }
  const one = parseYmd(trimmed);
  return { start: one, end: one };
}

function formatYmd(d: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatPeriodRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatYmd(start)} ~ ${formatYmd(end)}`;
  if (start) return `${formatYmd(start)} ~ ${formatYmd(start)}`;
  if (end) return `${formatYmd(end)} ~ ${formatYmd(end)}`;
  return '';
}

type EventDetailPageProps = {
  row: EventRow;
  onSave: (next: EventRow) => void;
  /** 목록에서 추가 시: 처음부터 편집 모드, 저장 전까지 목록에 반영하지 않음 */
  isCreate?: boolean;
  onCancelCreate?: () => void;
};

export default function EventDetailPage({
  row,
  onSave,
  isCreate = false,
  onCancelCreate,
}: EventDetailPageProps) {
  const [isEditing, setIsEditing] = useState(() => Boolean(isCreate));
  const [draftTitle, setDraftTitle] = useState(() => row.title);
  const [periodStart, setPeriodStart] = useState(() => parseEventPeriod(row.period).start);
  const [periodEnd, setPeriodEnd] = useState(() => parseEventPeriod(row.period).end);
  const [draftContent, setDraftContent] = useState(() => row.content);
  const [draftExposed, setDraftExposed] = useState(() => row.exposed);
  const [draftCreatedBy, setDraftCreatedBy] = useState(() => row.createdBy);

  const beginEdit = () => {
    setDraftTitle(row.title);
    const { start, end } = parseEventPeriod(row.period);
    setPeriodStart(start);
    setPeriodEnd(end);
    setDraftContent(row.content);
    setDraftExposed(row.exposed);
    setDraftCreatedBy(row.createdBy);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleHeaderCancel = () => {
    if (isCreate) {
      onCancelCreate?.();
      return;
    }
    cancelEdit();
  };

  const previewContent = isEditing ? draftContent : row.content;
  const isRichText = previewContent.trim().startsWith('<');

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={eventListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{isCreate ? '이벤트 등록' : '이벤트 상세'}</h1>
      </div>

      <section className="admin-list-box">
        <p className="admin-detail-id">{isCreate ? '신규 등록' : row.id}</p>
        {isEditing ? (
          <div className="admin-detail-title-edit">
            <ListSelect
              ariaLabel="노출여부"
              className="admin-detail-title-edit__select"
              value={draftExposed ? 'exposed' : 'hidden'}
              onChange={(next) => setDraftExposed(next === 'exposed')}
              options={[
                { value: 'exposed', label: '노출' },
                { value: 'hidden', label: '미노출' },
              ]}
            />
            <input
              type="text"
              className="admin-inline-input admin-detail-title-edit__input"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              aria-label="제목 수정"
            />
          </div>
        ) : (
          <h2 className="admin-detail-title admin-detail-title-row">
            <span
              className={`event-exposed-badge ${row.exposed ? 'event-exposed-badge--on' : 'event-exposed-badge--off'}`}
            >
              {row.exposed ? '노출' : '미노출'}
            </span>
            <span className="admin-detail-title-row__text">{row.title}</span>
          </h2>
        )}
        <dl className={`admin-detail-meta${isEditing ? ' admin-detail-meta--aligned' : ''}`}>
          <div className="admin-detail-meta__row">
            <dt>기간</dt>
            <dd>
              {isEditing ? (
                <div className="date-range-wrap">
                  <div className="date-range-pickers">
                    <DatePicker
                      selected={periodStart}
                      onChange={(date: Date | null) => setPeriodStart(date)}
                      selectsStart
                      startDate={periodStart}
                      endDate={periodEnd}
                      placeholderText="시작일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      className="date-picker-input"
                      isClearable={!!periodStart}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                      aria-label="이벤트 시작일"
                    />
                    <span className="date-sep">~</span>
                    <DatePicker
                      selected={periodEnd}
                      onChange={(date: Date | null) => setPeriodEnd(date)}
                      selectsEnd
                      startDate={periodStart}
                      endDate={periodEnd}
                      minDate={periodStart ?? undefined}
                      placeholderText="종료일"
                      dateFormat="yyyy-MM-dd"
                      locale={ko}
                      className="date-picker-input"
                      isClearable={!!periodEnd}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="scroll"
                      aria-label="이벤트 종료일"
                    />
                  </div>
                </div>
              ) : (
                <>{row.period}</>
              )}
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>작성자</dt>
            <dd>
              {isEditing ? (
                <input
                  type="text"
                  className="admin-inline-input admin-detail-author-input"
                  value={draftCreatedBy}
                  onChange={(e) => setDraftCreatedBy(e.target.value)}
                  placeholder="작성자"
                  aria-label="작성자"
                />
              ) : (
                row.createdBy
              )}
            </dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>작성일</dt>
            <dd>{row.createdAt}</dd>
          </div>
        </dl>
      </section>

      <section className="admin-list-box">
        <div className="filter-row filter-row--spread admin-detail-preview-head">
          <h3 className="admin-detail-section-title">글 미리보기</h3>
          {!isCreate && !isEditing ? (
            <button type="button" className="filter-btn filter-btn--primary" onClick={beginEdit}>
              <Pencil size={14} aria-hidden="true" /> 수정
            </button>
          ) : (
            <button type="button" className="filter-btn filter-btn--outline" onClick={handleHeaderCancel}>
              취소
            </button>
          )}
        </div>

        {!isEditing ? (
          <div
            className="admin-detail-body"
            dangerouslySetInnerHTML={isRichText ? { __html: previewContent } : undefined}
          >
            {!isRichText ? previewContent : undefined}
          </div>
        ) : (
          <RichTextEditor
            initialBody={draftContent}
            onCancel={() => {
              if (isCreate) {
                onCancelCreate?.();
                return;
              }
              setDraftContent(row.content);
              cancelEdit();
            }}
            onSave={(html) => {
              setDraftContent(html);
              const nextPeriod = formatPeriodRange(periodStart, periodEnd) || row.period;
              const titleTrim = draftTitle.trim();
              const authorTrim = draftCreatedBy.trim();
              onSave({
                ...row,
                title: titleTrim || '새 이벤트',
                period: nextPeriod,
                content: html,
                exposed: draftExposed,
                createdBy: authorTrim || '관리자',
              });
              if (!isCreate) setIsEditing(false);
            }}
          />
        )}
      </section>
    </div>
  );
}
