import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../../../components/Alert';
import '../../../styles/adminPage.css';
import type {
  FeelframeQuestionAttachment,
  FeelframeQuestionDetailData,
  FeelframeQuestionThreadEntry,
} from './mock/question.mock';
import { getFeelframeQuestionDetailById } from './mock/question.mock';
import { questionListPath } from './questionPaths';

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

function sortThreadByDate(entries: FeelframeQuestionThreadEntry[]) {
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

const DEFAULT_ADMIN_NAME = '관리자';

function downloadQuestionAttachment(file: FeelframeQuestionAttachment) {
  if (file.url && file.url !== '#') {
    const anchor = document.createElement('a');
    anchor.href = file.url;
    anchor.download = file.fileName;
    anchor.rel = 'noopener noreferrer';
    anchor.click();
    return;
  }
  const blob = new Blob([`[목업] ${file.fileName}`], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ReplyEditorState = { status: 'idle' } | { status: 'new' } | { status: 'edit'; entryId: string };

function cloneDetail(subId: string | undefined): FeelframeQuestionDetailData | undefined {
  if (!subId) return undefined;
  const next = getFeelframeQuestionDetailById(subId);
  return next
    ? { ...next, thread: [...next.thread], attachments: [...next.attachments] }
    : undefined;
}

export default function QuestionDetailPage() {
  const { subId } = useParams<{ subId?: string }>();
  const [localDetail, setLocalDetail] = useState<FeelframeQuestionDetailData | undefined>(() =>
    cloneDetail(subId),
  );
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

  const adminReplies = useMemo(
    () => (localDetail ? sortThreadByDate(localDetail.thread) : []),
    [localDetail],
  );

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
      let thread: FeelframeQuestionThreadEntry[];
      if (mode === 'new') {
        thread = [
          ...prev.thread,
          {
            id: newThreadId(),
            role: 'admin',
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
      const hasAdmin = thread.length > 0;
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
          <Link to={questionListPath} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">1:1 문의</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">문의를 찾을 수 없습니다.</p>
          <p className="admin-detail-notice">
            <Link to={questionListPath}>목록으로 돌아가기</Link>
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
        <Link to={questionListPath} className="admin-detail-back">
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
            <dt>아이디</dt>
            <dd>{row.memberId}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>카테고리</dt>
            <dd>{row.category}</dd>
          </div>
          <div className="admin-detail-meta__row">
            <dt>답변 여부</dt>
            <dd>
              <div className="cell-block">
                <span className="cell-line">
                  <span
                    className={[
                      'admin-status-pill',
                      row.answeredAt !== null
                        ? 'admin-status-pill--답변완료'
                        : 'admin-status-pill--미답변',
                    ].join(' ')}
                  >
                    {row.answeredAt !== null ? '답변완료' : '미답변'}
                  </span>
                </span>
              </div>
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

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col">
          <h3 className="admin-detail-section-title">문의 내용</h3>
          <div className="inquiry-attachments-box">
            <div className="inquiry-attachments-box__head">
              <p className="inquiry-attachments-box__title">첨부파일</p>
              {row.attachments.length === 0 ? null : (
                <p className="inquiry-attachments-box__hint">클릭시 다운로드 됩니다.</p>
              )}
            </div>
            {row.attachments.length === 0 ? (
              <p className="inquiry-attachments-box__empty">첨부된 파일이 없습니다.</p>
            ) : (
              <ul className="inquiry-attachments-box__list">
                {row.attachments.map((file) => (
                  <li key={file.id}>
                    <button
                      type="button"
                      className="inquiry-file-attachment"
                      title={`${file.fileName} 다운로드`}
                      onClick={() => downloadQuestionAttachment(file)}
                    >
                      <span className="inquiry-file-attachment__name">{file.fileName}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
          </Suspense>
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
                      <Suspense fallback={<p className="inquiry-thread-empty">에디터 로딩 중...</p>}>
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
