import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import '../orderManagement/OrderListPage.css';
import './InquiryPage.css';
import { pagePath } from '../../../routes';
import { InquiryAnswerStatusCell } from './InquiryAnswerStatusCell';
import { RichTextEditor, RichTextEditorFrequentReplies, RichTextEditorModeLabel } from '../../../components/RichTextEditor';
import Alert from '../../../components/alert';
import type { InquiryDetailData, InquiryThreadEntry } from './mock/inquiry.mock';
import { getInquiryById } from './mock/inquiry.mock';

function sortThreadByDate(entries: InquiryThreadEntry[]) {
  return [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newThreadId(): string {
  return `th-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

const LIST_PATH = pagePath({
  navId: 'feelmaker',
  sectionId: 'reviewManagement',
  itemId: 'inquiry',
});

const DEFAULT_ADMIN_NAME = '관리자';

type ReplyEditorState = { status: 'idle' } | { status: 'new' } | { status: 'edit'; entryId: string };

function cloneDetail(subId: string | undefined): InquiryDetailData | undefined {
  if (!subId) return undefined;
  const next = getInquiryById(subId);
  return next ? { ...next, thread: [...next.thread] } : undefined;
}

export default function InquiryDetailPage() {
  const { subId } = useParams<{ subId: string }>();
  const [localDetail, setLocalDetail] = useState<InquiryDetailData | undefined>(() => cloneDetail(subId));
  const [replyEditor, setReplyEditor] = useState<ReplyEditorState>({ status: 'idle' });
  const [replyEditorNonce, setReplyEditorNonce] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    queueMicrotask(() => {
      setLocalDetail(cloneDetail(subId));
      setReplyEditor({ status: 'idle' });
      setAlertMessage('');
    });
  }, [subId]);

  const adminSorted = useMemo(
    () => (localDetail ? sortThreadByDate(localDetail.thread.filter((t) => t.role === 'admin')) : []),
    [localDetail],
  );

  const userComments = localDetail ? sortThreadByDate(localDetail.thread.filter((t) => t.role === 'user')) : [];
  const adminReplies = adminSorted;

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

  const commitReply = useCallback((html: string, mode: 'new' | 'edit', editId?: string) => {
    setLocalDetail((prev) => {
      if (!prev) return prev;
      let thread: InquiryThreadEntry[];
      if (mode === 'new') {
        thread = [
          ...prev.thread,
          {
            id: newThreadId(),
            role: 'admin' as const,
            authorName: prev.answeredBy ?? DEFAULT_ADMIN_NAME,
            createdAt: formatNow(),
            body: html,
          },
        ];
      } else if (editId) {
        thread = prev.thread.map((t) => (t.id === editId ? { ...t, body: html } : t));
      } else {
        return prev;
      }
      const hasAdmin = thread.some((t) => t.role === 'admin');
      return {
        ...prev,
        thread,
        answeredAt: hasAdmin ? formatNow() : prev.answeredAt,
        answeredBy: hasAdmin ? prev.answeredBy ?? DEFAULT_ADMIN_NAME : prev.answeredBy,
      };
    });
    setReplyEditor({ status: 'idle' });

    if (mode === 'new') {
      setAlertMessage('답변이 등록되었습니다.');
    } else {
      setAlertMessage('답변이 수정되었습니다.');
    }
  }, []);

  if (!localDetail) {
    return (
      <div className="admin-list-page admin-list-page--inquiry">
        <div className="admin-detail-header">
          <Link to={LIST_PATH} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">1:1 문의</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">문의를 찾을 수 없습니다.</p>
          <p className="admin-detail-notice">
            <Link to={LIST_PATH}>목록으로 돌아가기</Link>
          </p>
        </section>
      </div>
    );
  }

  const row = localDetail;
  const showRegisterBtn = replyEditor.status !== 'new';

  return (
    <div className="admin-list-page admin-list-page--inquiry">
      <div className="admin-detail-header">
        <Link to={LIST_PATH} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">1:1 문의 상세</h1>
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
            <dt>작성자</dt>
            <dd>{row.authorName}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>이메일</dt>
            <dd>{row.email}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>카테고리</dt>
            <dd>{row.category}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>답변 여부</dt>
            <dd>
              <InquiryAnswerStatusCell answeredAt={row.answeredAt} />
            </dd>
          </div>
          {row.answeredAt && (
            <>
              <div className="admin-detail-meta__row">
                <dt>답변일</dt>
                <dd>{row.answeredAt}</dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>답변자</dt>
                <dd>{row.answeredBy ?? '—'}</dd>
              </div>
            </>
          )}
        </dl>
      </section>

      <section className="admin-list-box">
        <h3 className="admin-detail-section-title">문의 내용</h3>
        <div className="admin-detail-body">{row.content}</div>
      </section>

      <div className="admin-two-col">

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
            <RichTextEditor
              key={`new-${replyEditorNonce}`}
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
          )}

          {adminReplies.length === 0 ? (
            <p className="inquiry-thread-empty">등록된 답변이 없습니다.</p>
          ) : (
            <ul className="inquiry-thread-list">
              {adminReplies.map((item) => {
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
                        <RichTextEditor
                          key={`edit-${item.id}-${replyEditorNonce}`}
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

        <section className="admin-list-box inquiry-thread-section admin-two-col__col">
          <h3 className="admin-detail-section-title">댓글 내역</h3>
          <p className="inquiry-thread-hint">작성자(회원)가 등록한 댓글이 표시됩니다.</p>
          {userComments.length === 0 ? (
            <p className="inquiry-thread-empty">등록된 댓글이 없습니다.</p>
          ) : (
            <ul className="inquiry-thread-list">
              {userComments.map((item) => (
                <li key={item.id} className="inquiry-thread-item inquiry-thread-item--user">
                  <div className="inquiry-thread-item__head">
                    <span className="inquiry-thread-item__author">{item.authorName}</span>
                    <span className="inquiry-thread-item__date">{item.createdAt}</span>
                  </div>
                  <ThreadBody body={item.body} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
