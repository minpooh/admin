import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Pencil } from 'lucide-react';
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';
import './InquiryPage.css';
import './ReviewPage.css';
import { pagePath } from '../../../routes';
import Alert from '../../../components/Alert';
import { InquiryAnswerStatusCell } from './InquiryAnswerStatusCell';
import { RichTextEditor, RichTextEditorFrequentReplies, RichTextEditorModeLabel } from '../../../components/RichTextEditor';
import type { ReviewDetailData, ReviewThreadEntry } from './mock/review.mock';
import { getProductReviewStats, getReviewById } from './mock/review.mock';

const LIST_PATH = pagePath({
  navId: 'feelmaker',
  sectionId: 'reviewManagement',
  itemId: 'review',
});

const PRODUCT_LIST_PATH = pagePath({
  navId: 'feelmaker',
  sectionId: 'productManagement',
  itemId: 'productList',
});

const DEFAULT_ADMIN_NAME = '관리자';

type ReplyEditorState = { status: 'idle' } | { status: 'new' } | { status: 'edit'; entryId: string };

function sortThreadByDate(entries: ReviewThreadEntry[]) {
  return [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newThreadId(): string {
  return `rth-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, idx) =>
    idx < rating ? <FaStar key={`detail-star-fill-${idx}`} aria-hidden /> : <FaRegStar key={`detail-star-empty-${idx}`} aria-hidden />
  );
}

function renderAverageStars(average: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const idx = i + 1;
    if (average >= idx) return <FaStar key={`avg-star-${i}`} aria-hidden />;
    if (average >= idx - 0.5) return <FaStarHalfAlt key={`avg-half-${i}`} aria-hidden />;
    return <FaRegStar key={`avg-empty-${i}`} aria-hidden />;
  });
}

function cloneDetail(subId: string | undefined): ReviewDetailData | undefined {
  if (!subId) return undefined;
  const next = getReviewById(subId);
  return next ? { ...next, thread: [...next.thread] } : undefined;
}

export default function ReviewDetailPage() {
  const { subId } = useParams<{ subId: string }>();
  const [localDetail, setLocalDetail] = useState<ReviewDetailData | undefined>(() => cloneDetail(subId));
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

  const productId = localDetail?.productId;

  const productReviewStats = useMemo(() => {
    if (!productId) return { average: 0, count: 0 };
    return getProductReviewStats(productId);
  }, [productId]);

  const productPageTo = useMemo(() => {
    if (!productId) return PRODUCT_LIST_PATH;
    return `${PRODUCT_LIST_PATH}?productId=${encodeURIComponent(productId)}`;
  }, [productId]);

  const adminReplies = useMemo(
    () =>
      localDetail ? sortThreadByDate(localDetail.thread.filter((t) => t.role === 'admin')) : [],
    [localDetail]
  );

  const userComments = useMemo(
    () =>
      localDetail ? sortThreadByDate(localDetail.thread.filter((t) => t.role === 'user')) : [],
    [localDetail]
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
      let thread: ReviewThreadEntry[];
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
          <h1 className="page-title">리뷰 관리</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">리뷰를 찾을 수 없습니다.</p>
          <p className="admin-detail-notice">
            <Link to={LIST_PATH}>목록으로 돌아가기</Link>
          </p>
        </section>
      </div>
    );
  }

  const detail = localDetail;

  const showRegisterBtn = replyEditor.status !== 'new';

  return (
    <div className="admin-list-page admin-list-page--inquiry">
      <div className="admin-detail-header">
        <Link to={LIST_PATH} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">리뷰 상세</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col review-detail-meta-col">
          <p className="admin-detail-id">{detail.id}</p>
          <h2 className="admin-detail-title">{detail.title}</h2>
          <dl className="admin-detail-meta">
            <div className="admin-detail-meta__row">
              <dt>작성일</dt>
              <dd>{detail.createdAt}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>별점</dt>
              <dd>
                <span className="review-rating-stars review-rating-stars--detail" aria-label={`${detail.rating}점`}>
                  {renderStars(detail.rating)}
                </span>{' '}
                ({detail.rating}.0)
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>작성자</dt>
              <dd>{detail.authorName}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>이메일</dt>
              <dd>{detail.email}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>카테고리</dt>
              <dd>{detail.category}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>답변 여부</dt>
              <dd>
                <InquiryAnswerStatusCell answeredAt={detail.answeredAt} />
              </dd>
            </div>
            {detail.answeredAt && (
              <>
                <div className="admin-detail-meta__row">
                  <dt>답변일</dt>
                  <dd>{detail.answeredAt}</dd>
                </div>
                <div className="admin-detail-meta__row">
                  <dt>답변자</dt>
                  <dd>{detail.answeredBy ?? '—'}</dd>
                </div>
              </>
            )}
          </dl>
        </section>

        <section className="admin-list-box admin-two-col__col review-detail-meta-col review-detail-product-section">
          <h3 className="admin-detail-section-title">상품 정보</h3>
          <div className="review-detail-product-row">
            <div className="review-detail-product-thumb">
              <img src={detail.productImageUrl} alt={`${detail.productName} 대표 이미지`} loading="lazy" />
            </div>
            <div className="review-detail-product-meta-wrap">
              <dl className="admin-detail-meta review-detail-product-meta">
                <div className="admin-detail-meta__row">
                  <dt>상품 ID</dt>
                  <dd>{detail.productId}</dd>
                </div>
                <div className="admin-detail-meta__row">
                  <dt>상품명</dt>
                  <dd>{detail.productName}</dd>
                </div>
                <div className="admin-detail-meta__row">
                  <dt>상품 카테고리</dt>
                  <dd>{detail.productCategory}</dd>
                </div>
                <div className="admin-detail-meta__row">
                  <dt>판매가</dt>
                  <dd>{detail.productPrice}</dd>
                </div>
                <div className="admin-detail-meta__row">
                  <dt>리뷰 평균 별점</dt>
                  <dd>
                    {productReviewStats.count > 0 ? (
                      <span className="review-product-avg" aria-label={`평균 ${productReviewStats.average.toFixed(2)}점, ${productReviewStats.count}건`}>
                        <span className="review-product-avg__stars review-rating-stars review-rating-stars--detail">
                          {renderAverageStars(productReviewStats.average)}
                        </span>
                        <span className="review-product-avg__num">{productReviewStats.average.toFixed(2)}</span>
                        <span className="review-product-avg__count">({productReviewStats.count}건)</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
          <div className="review-detail-product-actions">
            <Link to={productPageTo} className="review-detail-product-link">
              상품 바로가기
              <span className="review-detail-product-link__icon" aria-hidden>
                <ArrowRight size={16} strokeWidth={2} />
              </span>
            </Link>
          </div>
        </section>
      </div>

      <section className="admin-list-box">
        <h3 className="admin-detail-section-title">리뷰 내용</h3>
        <div className="admin-detail-body">{detail.content}</div>
      </section>

      <div className="admin-two-col">
        <section className="admin-list-box inquiry-thread-section inquiry-reply-section admin-two-col__col">
          <div className="inquiry-reply-section__head">
            <h3 className="admin-detail-section-title inquiry-reply-section__title">관리자 답변</h3>
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
          <h3 className="admin-detail-section-title">작성자 코멘트</h3>
          <p className="inquiry-thread-hint">작성자(회원)가 등록한 코멘트가 표시됩니다.</p>
          {userComments.length === 0 ? (
            <p className="inquiry-thread-empty">등록된 코멘트가 없습니다.</p>
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
