import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import { RichTextEditor } from '../../../components/RichTextEditor';
import '../../../styles/adminListPage.css';
import '../orderManagement/OrderListPage.css';
import './NoticePage.css';
import type { NoticeRow } from './mock/notice.mock';
import { noticeListPath } from './noticePaths';

type NoticeDetailPageProps = {
  row: NoticeRow;
  onSave: (next: NoticeRow) => void;
  isCreate?: boolean;
  onCancelCreate?: () => void;
};

export default function NoticeDetailPage({
  row,
  onSave,
  isCreate = false,
  onCancelCreate,
}: NoticeDetailPageProps) {
  const [isEditing, setIsEditing] = useState(() => Boolean(isCreate));
  const [draftTitle, setDraftTitle] = useState(() => row.title);
  const [draftContent, setDraftContent] = useState(() => row.content);
  const [draftPinned, setDraftPinned] = useState(() => row.pinned);
  const [draftCreatedBy, setDraftCreatedBy] = useState(() => row.createdBy);

  const beginEdit = () => {
    setDraftTitle(row.title);
    setDraftContent(row.content);
    setDraftPinned(row.pinned);
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
        <Link to={noticeListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{isCreate ? '공지 등록' : '공지사항 상세'}</h1>
      </div>

      <section className="admin-list-box">
        <p className="admin-detail-id">{isCreate ? '신규 등록' : row.id}</p>
        {isEditing ? (
          <div className="admin-detail-title-edit">
            <ListSelect
              ariaLabel="상단고정"
              className="admin-detail-title-edit__select"
              value={draftPinned ? 'pinned' : 'normal'}
              onChange={(next) => setDraftPinned(next === 'pinned')}
              options={[
                { value: 'pinned', label: '고정' },
                { value: 'normal', label: '미고정' },
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
              className={`notice-pinned-badge ${row.pinned ? 'notice-pinned-badge--on' : 'notice-pinned-badge--off'}`}
            >
              {row.pinned ? '고정' : '미고정'}
            </span>
            <span className="admin-detail-title-row__text">{row.title}</span>
          </h2>
        )}
        <dl className={`admin-detail-meta${isEditing ? ' admin-detail-meta--aligned' : ''}`}>
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
              const titleTrim = draftTitle.trim();
              const authorTrim = draftCreatedBy.trim();
              onSave({
                ...row,
                title: titleTrim || '새 공지',
                content: html,
                pinned: draftPinned,
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
