import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import Alert from '../../../components/Alert';
import Confirm from '../../../components/Confirm';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import './SocialReviewPage.css';
import type { SocialReviewEntry, SocialReviewSnsType } from './mock/socialReview.mock';
import {
  getDefaultSocialReviewThumbnail,
  getSocialReviewEntriesByProductId,
  getSocialReviewProductById,
  SOCIAL_REVIEW_SNS_OPTIONS,
} from './mock/socialReview.mock';
import { socialReviewListPath } from './socialReviewPaths';

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newEntryId(): string {
  return `sr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function cloneEntries(productId: string | undefined): SocialReviewEntry[] {
  if (!productId) return [];
  return getSocialReviewEntriesByProductId(productId);
}

export default function SocialReviewDetailPage() {
  const { subId } = useParams<{ subId?: string }>();
  const product = subId ? getSocialReviewProductById(subId) : undefined;

  const [entries, setEntries] = useState<SocialReviewEntry[]>(() => cloneEntries(subId));
  const [snsType, setSnsType] = useState<SocialReviewSnsType>('네이버블로그');
  const [urlInput, setUrlInput] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [exposeTargetId, setExposeTargetId] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setEntries(cloneEntries(subId));
      setSnsType('네이버블로그');
      setUrlInput('');
      setAlertMessage('');
      setDeleteTargetId(null);
      setExposeTargetId(null);
    });
  }, [subId]);

  const totalCount = entries.length;
  const exposedCount = useMemo(() => entries.filter((entry) => entry.exposed).length, [entries]);

  const snsCounts = useMemo(() => {
    const counts: Record<SocialReviewSnsType, number> = {
      네이버블로그: 0,
      네이버카페: 0,
      인스타그램: 0,
      유튜브: 0,
    };
    for (const entry of entries) {
      counts[entry.sns] += 1;
    }
    return counts;
  }, [entries]);

  const deleteTarget = useMemo(
    () => entries.find((entry) => entry.id === deleteTargetId) ?? null,
    [entries, deleteTargetId],
  );

  const exposeTarget = useMemo(
    () => entries.find((entry) => entry.id === exposeTargetId) ?? null,
    [entries, exposeTargetId],
  );

  const handleAddEntry = useCallback(() => {
    const url = urlInput.trim();
    if (!url) {
      setAlertMessage('URL을 입력해주세요.');
      return;
    }
    if (!subId) return;

    const next: SocialReviewEntry = {
      id: newEntryId(),
      productId: subId,
      sns: snsType,
      url,
      imageUrl: getDefaultSocialReviewThumbnail(snsType),
      viewCount: 0,
      exposed: true,
      createdAt: formatNow(),
    };

    setEntries((prev) => [next, ...prev]);
    setUrlInput('');
    setAlertMessage('소셜리뷰가 추가되었습니다.');
  }, [snsType, subId, urlInput]);

  const confirmToggleExposed = useCallback(() => {
    if (!exposeTargetId) return;
    setEntries((prev) =>
      prev.map((entry) => (entry.id === exposeTargetId ? { ...entry, exposed: !entry.exposed } : entry)),
    );
    setExposeTargetId(null);
  }, [exposeTargetId]);

  const confirmDelete = useCallback(() => {
    if (!deleteTargetId) return;
    setEntries((prev) => prev.filter((entry) => entry.id !== deleteTargetId));
    setDeleteTargetId(null);
    setAlertMessage('소셜리뷰가 삭제되었습니다.');
  }, [deleteTargetId]);

  if (!product) {
    return (
      <div className="admin-list-page admin-list-page--feelframe-social-review">
        <div className="admin-detail-header">
          <Link to={socialReviewListPath} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">소셜리뷰 상세</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">상품을 찾을 수 없습니다.</p>
          <p className="admin-detail-notice">
            <Link to={socialReviewListPath}>목록으로 돌아가기</Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-list-page admin-list-page--feelframe-social-review">
      <div className="admin-detail-header">
        <Link to={socialReviewListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">소셜리뷰 상세</h1>
      </div>

      <section className="admin-list-box" aria-label="상품 및 소셜리뷰 요약">
        <div className="admin-product-summary">
          <div className="admin-product-summary__thumb-wrap" aria-hidden="true">
            <img
              className="admin-product-thumb"
              src={product.imageUrl}
              alt={`${product.name} 썸네일`}
              loading="lazy"
            />
          </div>
          <div className="admin-product-summary__meta">
            <dl className="admin-detail-meta">
              <div className="admin-detail-meta__row">
                <dt>상품명</dt>
                <dd>{product.name}</dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>등록된 소셜리뷰</dt>
                <dd>{totalCount.toLocaleString()}건</dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>노출중인 소셜리뷰</dt>
                <dd>{exposedCount.toLocaleString()}건</dd>
              </div>
            </dl>
          </div>
        </div>

        <section className="admin-stat-cards-wrap admin-stat-section social-review-sns-stats" aria-label="SNS별 건수">
          <h3 className="admin-stat-heading">SNS별 건수</h3>
          <div className="admin-stat-cards admin-stat-cards--4">
            {SOCIAL_REVIEW_SNS_OPTIONS.map((option, index) => {
              const iconTone = (['primary', 'warning', 'success', 'gray'] as const)[index] ?? 'primary';
              return (
                <div key={option.value} className="admin-stat-card">
                  <div className={`admin-stat-card__icon admin-stat-card__icon--${iconTone}`} aria-hidden>
                    <Share2 size={20} strokeWidth={2} />
                  </div>
                  <p className="admin-stat-label">{option.label}</p>
                  <p className="admin-stat-value">{snsCounts[option.value].toLocaleString()}</p>
                  <p className="admin-stat-hint">등록 건수</p>
                </div>
              );
            })}
          </div>
        </section>

        <h3 className="admin-detail-section-title">소셜리뷰 추가</h3>
        <div className="filter-top-row social-review-add-row">
          <div className="filter-section">
            <span className="filter-label">SNS</span>
            <ListSelect
              ariaLabel="SNS 선택"
              value={snsType}
              onChange={(next) => setSnsType(next as SocialReviewSnsType)}
              options={SOCIAL_REVIEW_SNS_OPTIONS}
            />
          </div>
          <div className="filter-section">
            <span className="filter-label">URL</span>
            <div className="admin-search-field">
              <input
                type="url"
                placeholder="URL 입력"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                aria-label="소셜리뷰 URL"
              />
            </div>
          </div>
          <div className="filter-section">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleAddEntry}>
              추가
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="소셜리뷰 목록">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--min-w-800">
            <thead>
              <tr>
                <th scope="col" className="col-center">
                  이미지
                </th>
                <th scope="col" className="col-center">
                  조회수
                </th>
                <th scope="col">SNS</th>
                <th scope="col" className="col-center">
                  상세페이지
                </th>
                <th scope="col">등록일</th>
                <th scope="col" className="col-center">
                  바로가기
                </th>
                <th scope="col" className="col-center">
                  삭제
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty-cell">
                    등록된 소셜리뷰가 없습니다.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="col-center">
                      <img
                        src={entry.imageUrl}
                        alt=""
                        className="admin-product-thumb admin-product-thumb--sm"
                        loading="lazy"
                      />
                    </td>
                    <td className="col-center">
                      <span className="cell-line">{entry.viewCount.toLocaleString()}</span>
                    </td>
                    <td>{entry.sns}</td>
                    <td className="col-center">
                      <button
                        type="button"
                        className={`row-btn ${entry.exposed ? 'row-btn--primary' : 'row-btn--gray'}`}
                        onClick={() => setExposeTargetId(entry.id)}
                      >
                        {entry.exposed ? '노출중' : '미노출'}
                      </button>
                    </td>
                    <td>{entry.createdAt}</td>
                    <td className="col-center">
                      <a
                        href={entry.url}
                        className="admin-link admin-table-title-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={entry.url}
                      >
                        바로가기
                      </a>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--red"
                        onClick={() => setDeleteTargetId(entry.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Confirm
        open={Boolean(exposeTarget)}
        title="노출 상태 변경"
        message={
          exposeTarget
            ? exposeTarget.exposed
              ? `${exposeTarget.sns} 소셜리뷰를 미노출로 변경하시겠습니까?`
              : `${exposeTarget.sns} 소셜리뷰를 노출중으로 변경하시겠습니까?`
            : ''
        }
        confirmText="확인"
        cancelText="취소"
        onClose={() => setExposeTargetId(null)}
        onConfirm={confirmToggleExposed}
      />

      <Confirm
        open={Boolean(deleteTarget)}
        title="소셜리뷰 삭제"
        message={deleteTarget ? `${deleteTarget.sns} 소셜리뷰를 삭제할까요?` : ''}
        confirmText="삭제"
        cancelText="취소"
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />

      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
