import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Modal from '../../../components/Modal';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './WorkHistoryRetouchPage.css';
import {
  getWorkHistoryRetouchApiUsagesByAccountId,
  getWorkHistoryRetouchItemById,
  getWorkHistoryRetouchPhotosByAccountId,
  type WorkHistoryRetouchPhoto,
} from './mock/workHistoryRetouch.mock';
import { workHistoryRetouchListPath } from './workHistoryRetouchPaths';

function getHistoryStatusBadgeClass(status: '처리완료' | '실패') {
  return status === '실패'
    ? 'badge-square badge-square--inline badge-square--danger badge-square--no-transition badge-square--no-margin'
    : 'badge-square badge-square--inline badge-square--open badge-square--no-transition badge-square--no-margin';
}

const SAVED_BADGE_CLASS =
  'badge-square badge-square--inline badge-square--secondary badge-square--no-transition badge-square--no-margin';

const ITEMS_PER_PAGE = 10;

export default function WorkHistoryRetouchDetailPage() {
  const { subId } = useParams<{ subId: string }>();
  const item = getWorkHistoryRetouchItemById(subId);
  const [selectedPhoto, setSelectedPhoto] = useState<WorkHistoryRetouchPhoto | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const photos = useMemo(() => getWorkHistoryRetouchPhotosByAccountId(item?.accountId), [item?.accountId]);
  const apiUsages = useMemo(() => getWorkHistoryRetouchApiUsagesByAccountId(item?.accountId), [item?.accountId]);

  const totalPages = Math.max(1, Math.ceil(apiUsages.length / ITEMS_PER_PAGE));
  const paginatedUsages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return apiUsages.slice(start, start + ITEMS_PER_PAGE);
  }, [apiUsages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [item?.accountId]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const selectedHistory = selectedPhoto?.history.find((historyItem) => historyItem.id === selectedHistoryId) ?? selectedPhoto?.history.at(-1);
  const afterImageUrl = selectedHistory?.resultImageUrl ?? selectedPhoto?.afterImageUrl;

  const openPhotoModal = (photo: WorkHistoryRetouchPhoto) => {
    setSelectedPhoto(photo);
    setSelectedHistoryId(photo.history.at(-1)?.id ?? null);
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setSelectedHistoryId(null);
  };

  if (!item) {
    return (
      <div className="admin-list-page admin-list-page--work-history-retouch">
        <div className="admin-detail-header">
          <Link to={workHistoryRetouchListPath} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">사진보정 작업 상세</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">작업내역을 찾을 수 없습니다.</p>
          <p className="admin-detail-notice">
            <Link to={workHistoryRetouchListPath}>목록으로 돌아가기</Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-list-page admin-list-page--work-history-retouch">
      <div className="admin-detail-header">
        <Link to={workHistoryRetouchListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">사진보정 작업 상세 ({item.accountId})</h1>
      </div>

      <section className="admin-list-box" aria-label="등록된 사진">
        {photos.length > 0 ? (
          <div className="admin-stat-cards admin-stat-cards--6 admin-product-pick-grid">
            {photos.map((photo) => (
              <button
                key={photo.id}
                type="button"
                className="admin-stat-card admin-stat-card--auto admin-product-pick-card"
                aria-label={`${photo.fileName} 작업내역 보기`}
                onClick={() => openPhotoModal(photo)}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt=""
                  className="admin-product-thumb admin-product-thumb--fluid"
                  loading="lazy"
                />
                <div className="admin-product-pick-card__body">
                  <p className="admin-stat-card__desc admin-product-pick-card__name">{photo.fileName}</p>
                  <p className="admin-stat-hint">
                    {photo.sizeLabel} · {photo.widthPx.toLocaleString('ko-KR')} × {photo.heightPx.toLocaleString('ko-KR')}px
                  </p>
                  <p className="admin-stat-hint">
                    <span>
                      <span className="list-label">저장수</span>
                      <span className="list-value">{photo.saveCount.toLocaleString('ko-KR')}</span>
                    </span>
                    <span>
                      <span className="list-label">AI요청수</span>
                      <span className="list-value">{photo.aiRequestCount.toLocaleString('ko-KR')}</span>
                    </span>
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="admin-list-result">등록된 사진이 없습니다.</p>
        )}
      </section>

      <h2 className="admin-stat-heading">API 사용내역</h2>
      <section className="admin-list-box admin-list-box--table" aria-label="API 사용내역">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>시간</th>
                <th>기능/모델</th>
                <th>입력/출력토큰</th>
                <th>API 비용추정</th>
                <th>근거</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsages.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="cell-line">{row.occurredAt}</span>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">
                        <span className="list-label">기능</span>
                        <span className="list-value">{row.feature}</span>
                      </span>
                      <span className="cell-line">
                        <span className="list-label">모델</span>
                        <span className="list-value">{row.model}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="cell-block">
                      <span className="cell-line">
                        <span className="list-label">입력</span>
                        <span className="list-value">{row.inputTokens.toLocaleString('ko-KR')}</span>
                      </span>
                      <span className="cell-line">
                        <span className="list-label">출력</span>
                        <span className="list-value">{row.outputTokens.toLocaleString('ko-KR')}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="amount-red">{row.apiCost.toLocaleString('ko-KR')}원</span>
                  </td>
                  <td>
                    <span className="cell-line">{row.basis}</span>
                  </td>
                </tr>
              ))}
              {paginatedUsages.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table-empty-cell">
                    사용내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => jumpPageBack(page))}
                disabled={currentPage <= 1}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
              >
                &laquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
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
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage >= totalPages}
                aria-label="다음 페이지"
              >
                &rsaquo;
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => jumpPageForward(page, totalPages))}
                disabled={currentPage >= totalPages}
                aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {selectedPhoto && (
        <Modal
          open
          onClose={closePhotoModal}
          ariaLabel={`${selectedPhoto.fileName} 작업내역`}
          variant="option"
          panelClassName="option-modal__panel--wide retouch-work-modal"
        >
          <Modal.Header>
            <Modal.Title>{selectedPhoto.fileName}</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="retouch-work-modal__compare">
              <div className="retouch-work-modal__compare-item">
                <p className="list-label">전</p>
                <div className="retouch-work-modal__compare-frame">
                  <img
                    src={selectedPhoto.beforeImageUrl}
                    alt={`${selectedPhoto.fileName} 보정 전`}
                    className="admin-product-thumb"
                    data-kind="before"
                  />
                </div>
              </div>
              <div className="retouch-work-modal__compare-item">
                <p className="list-label">후</p>
                <div className="retouch-work-modal__compare-frame">
                  <img
                    src={afterImageUrl ?? selectedPhoto.afterImageUrl}
                    alt={`${selectedPhoto.fileName} 보정 후`}
                    className="admin-product-thumb"
                    data-kind="after"
                  />
                </div>
              </div>
            </div>

            <h3 className="admin-stat-heading">작업히스토리</h3>
            <div className="admin-table-wrap">
              <table className="admin-table admin-table--fluid">
                <thead>
                  <tr>
                    <th>시간</th>
                    <th>작업</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPhoto.history.map((historyItem) => (
                    <tr
                      key={historyItem.id}
                      className={historyItem.id === selectedHistory?.id ? 'is-selected' : undefined}
                      onClick={() => setSelectedHistoryId(historyItem.id)}
                    >
                      <td>
                        <span className="cell-line">{historyItem.occurredAt}</span>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{historyItem.action}</span>
                          {historyItem.prompt && (
                            <span className="cell-line retouch-work-modal__prompt">
                              <span className="list-label">프롬프트</span>
                              <span className="list-value">{historyItem.prompt}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="cell-block retouch-work-modal__status">
                          <span className={getHistoryStatusBadgeClass(historyItem.status)}>{historyItem.status}</span>
                          {historyItem.saved && <span className={SAVED_BADGE_CLASS}>저장</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
