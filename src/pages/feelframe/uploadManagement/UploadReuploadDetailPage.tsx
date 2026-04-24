import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import Alert from '../../../components/Alert';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { pagePath } from '../../../routes';
import '../../../styles/adminPage.css';
import './UploadReuploadDetailPage.css';
import {
  getFeelframeReuploadDetailById,
  type FeelframeReuploadDetail,
} from './mock/uploadReupload.mock';

const LIST_PATH = pagePath({
  navId: 'feelframe',
  sectionId: 'uploadManagement',
  itemId: 'uploadReupload',
});
const PRODUCT_THUMBNAIL_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><rect width='120' height='120' fill='%23f3f4f6'/><rect x='24' y='28' width='72' height='64' rx='8' fill='%23d1d5db'/><circle cx='48' cy='52' r='8' fill='%239ca3af'/><path d='M30 86l22-22 14 14 8-8 16 16z' fill='%239ca3af'/></svg>";

function formatNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function cloneDetail(subId: string | undefined): FeelframeReuploadDetail | undefined {
  if (!subId) return undefined;
  const detail = getFeelframeReuploadDetailById(subId);
  if (!detail) return undefined;
  return {
    ...detail,
    attachments: [...detail.attachments],
  };
}

export default function FeelframeUploadReuploadDetailPage() {
  const { subId } = useParams<{ subId: string }>();
  const [detail, setDetail] = useState<FeelframeReuploadDetail | undefined>(() => cloneDetail(subId));
  const [editorNonce, setEditorNonce] = useState(0);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    queueMicrotask(() => {
      setDetail(cloneDetail(subId));
      setEditorNonce((n) => n + 1);
      setAlertMessage('');
    });
  }, [subId]);

  if (!detail) {
    return (
      <div className="admin-list-page">
        <div className="admin-detail-header">
          <Link to={LIST_PATH} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">재수정요청 상세</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">요청 정보를 찾을 수 없습니다.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={LIST_PATH} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">재수정요청 상세</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col">
          <h3 className="admin-detail-section-title">요청 정보</h3>
          <dl className="admin-detail-meta">
            <div className="admin-detail-meta__row">
              <dt>작성자</dt>
              <dd>{detail.customerInfoText}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>요청일</dt>
              <dd>{detail.requestedAt}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>주문번호</dt>
              <dd>{detail.orderNo}</dd>
            </div>
          </dl>

          <h4 className="admin-detail-section-subtitle">전체요청내용</h4>
          <div className="admin-detail-body reupload-detail-request-body">{detail.requestContent}</div>

          <h4 className="admin-detail-section-subtitle">첨부파일</h4>
          <div className="cell-block cell-block--inline-file-chips">
            {detail.attachments.map((file) => (
              <span key={file.id} className="cell-line cell-line--with-action">
                <span className="cell-line-file-label">{file.fileName}</span>
                <button
                  type="button"
                  className="row-icon-btn row-icon-btn--tone-primary row-icon-btn--inline-sm"
                  aria-label={`${file.fileName} 다운로드`}
                  onClick={() => window.alert(`${file.fileName} 다운로드`)}
                >
                  <Download size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </section>

        <section className="admin-list-box admin-two-col__col">
          <h3 className="admin-detail-section-title">상품정보</h3>
          <div className="reupload-detail-product-row">
            <div className="reupload-detail-product-thumb">
              <img src={PRODUCT_THUMBNAIL_FALLBACK} alt="상품 썸네일" />
            </div>
            <div className="reupload-detail-product-meta-wrap">
              <dl className="admin-detail-meta">
                <div className="admin-detail-meta__row">
                  <dt>상품명</dt>
                  <dd>{detail.productName}</dd>
                </div>
                <div className="admin-detail-meta__row">
                  <dt>주문 옵션</dt>
                  <dd>{detail.orderOptionSummary}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      </div>

      <section className="admin-list-box">
        <div className="admin-detail-title-row reupload-detail-reply-title-row">
          <h3 className="admin-detail-section-title admin-detail-title-row__text">답변 작성</h3>
          <span
            className={[
              'admin-status-pill',
              detail.status === '답변완료' ? 'admin-status-pill--답변완료' : 'admin-status-pill--답변전',
            ].join(' ')}
          >
            {detail.status}
          </span>
        </div>
        <dl className="admin-detail-meta">
          <div className="admin-detail-meta__row">
            <dt>답변자</dt>
            <dd>{detail.answererName || '관리자'}</dd>
          </div>
          {detail.status === '답변완료' && detail.answeredAt && (
            <div className="admin-detail-meta__row">
              <dt>완료일자</dt>
              <dd>{detail.answeredAt}</dd>
            </div>
          )}
        </dl>

        <RichTextEditor
          key={`reupload-reply-${detail.id}-${editorNonce}`}
          initialBody={detail.answerContent}
          cancelLabel="초기화"
          saveLabel="작성완료"
          onCancel={() => {
            setEditorNonce((n) => n + 1);
          }}
          onSave={(html) => {
            setDetail((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                answerContent: html,
                status: '답변완료',
                answeredAt: formatNow(),
              };
            });
            setAlertMessage('답변이 등록되었습니다.');
          }}
          onEmpty={() => setAlertMessage('답변 내용을 입력해주세요.')}
        />
      </section>

      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
