import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Alert from '../../../components/Alert';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminPage.css';
import { creatorDetailPath, creatorTemplateDetailPath, creatorTemplatePath } from './creatorPaths';

const APPROVAL_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'APPROVED', label: 'APPROVED' },
  { value: 'REJECTED', label: 'REJECTED' },
];

const TEMPLATE_REVIEW_EDIT_OPTIONS = APPROVAL_STATUS_OPTIONS.filter((o) => o.value !== '');

const SEARCH_SCOPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'creatorLoginId', label: '크리에이터 ID' },
  { value: 'title', label: '제목' },
];

type TemplateApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

type CreatorTemplateRow = {
  id: string;
  creatorId: string;
  creatorLoginId: string;
  creatorName: string;
  title: string;
  price: number;
  description: string;
  /** 상세 화면 설명(여러 줄) */
  descriptionDetail: string;
  serverFileName: string;
  fileSizeBytes: number;
  fileSha256: string;
  uploadedAt: string;
  lastModifiedAt: string;
  approvalStatus: TemplateApprovalStatus;
  registeredAt: string;
};

const ITEMS_PER_PAGE = 10;

const TITLES = [
  '미니멀 인테리어 프레임',
  '감성 카페 메뉴판',
  '봄 시즌 프로모션',
  '브랜드 로고 키트',
  '세일 배너 세트',
  '제품 상세 레이아웃',
];

function approvalButtonClass(status: TemplateApprovalStatus): string {
  if (status === 'APPROVED') return 'row-btn row-btn--status-primary';
  if (status === 'REJECTED') return 'row-btn row-btn--status-danger';
  return 'row-btn row-btn--status-warning';
}

const MOCK_TEMPLATES: CreatorTemplateRow[] = Array.from({ length: 28 }, (_, i) => {
  const no = i + 1;
  const approvalStatus: TemplateApprovalStatus =
    i % 9 === 0 ? 'REJECTED' : i % 4 === 0 ? 'PENDING' : 'APPROVED';
  const m = String(((i + 2) % 12) + 1).padStart(2, '0');
  const d = String(((i * 3) % 27) + 1).padStart(2, '0');
  const creatorNo = (no % 31) + 1;
  const fileSha256 = Array.from({ length: 64 }, (_, j) =>
    ((no * 7919 + i * 17 + j * 31) % 16).toString(16)
  ).join('');
  const fileUid = fileSha256.slice(0, 8);
  const titleBase = TITLES[i % TITLES.length];
  return {
    id: `tpl-${String(no).padStart(4, '0')}`,
    creatorId: `creator-${String(creatorNo).padStart(3, '0')}`,
    creatorLoginId: `creator_${String(creatorNo).padStart(3, '0')}`,
    creatorName: `크리에이터${creatorNo}`,
    title: no === 1 ? 'Dear You : 부모님 영상편지' : `${titleBase} #${no}`,
    price: no === 1 ? 30000 : 9900 + ((i * 17391) % 890000),
    description: `템플릿 설명: ${titleBase}용 편집 가능한 레이어 구성입니다.`,
    descriptionDetail: [
      '사용 폰트 : Gowun-Batang-master (눈누 무료폰트)',
      '플러그인 : 사용안함',
      '포함 리소스 : 이미지, 영상 소스, 음향효과... pixabay, unsplash, pexels 무료이미지, 음원 사용',
    ].join('\n'),
    serverFileName: `aepx_20260313_163418_${fileUid}.zip`,
    fileSizeBytes: 3993642 + ((i * 173911) % 8000000),
    fileSha256,
    uploadedAt: `2026-03-10 16:21:${String(10 + (i % 49)).padStart(2, '0')}`,
    lastModifiedAt: `2026-03-24 18:01:${String(3 + (i % 56)).padStart(2, '0')}`,
    approvalStatus,
    registeredAt: `2026-${m}-${d}`,
  };
});

type AppliedSearch = {
  approvalStatus: string;
  searchScope: string;
  keyword: string;
};

type ChipKey = 'approvalStatus' | 'keyword';

type CreatorTemplateDetailViewProps = {
  row: CreatorTemplateRow;
  onSaveReview: (status: TemplateApprovalStatus) => void;
};

function CreatorTemplateDetailView({ row, onSaveReview }: CreatorTemplateDetailViewProps) {
  const [reviewEdit, setReviewEdit] = useState<TemplateApprovalStatus>(row.approvalStatus);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setReviewEdit(row.approvalStatus);
  }, [row.id, row.approvalStatus]);

  const handleSaveReview = () => {
    onSaveReview(reviewEdit);
    setAlertMessage('상태변경되었습니다.');
  };

  return (
    <div className="admin-list-page admin-template-detail-page">
      <div className="admin-detail-header">
        <Link to={creatorTemplatePath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">템플릿 상세</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col" aria-label="템플릿 정보">
          <h2 className="admin-detail-section-title">템플릿 정보</h2>
          <div className="admin-template-detail-fields">
            <div className="admin-template-detail-field">
              <span className="filter-label">제목</span>
              <div className="admin-template-detail-value">{row.title}</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">가격</span>
              <div className="admin-template-detail-value">{row.price.toLocaleString()} 원</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">설명</span>
              <textarea
                readOnly
                className="admin-template-detail-readonly-textarea"
                value={row.descriptionDetail}
                aria-label="템플릿 설명"
              />
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">서버 파일명</span>
              <div className="admin-template-detail-value admin-template-detail-value--mono">{row.serverFileName}</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">파일 크기</span>
              <div className="admin-template-detail-value">{row.fileSizeBytes.toLocaleString()} byte</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">파일 SHA-256</span>
              <div className="admin-template-detail-value admin-template-detail-value--mono">{row.fileSha256}</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">업로드 일시</span>
              <div className="admin-template-detail-value">{row.uploadedAt}</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">마지막 수정</span>
              <div className="admin-template-detail-value">{row.lastModifiedAt}</div>
            </div>
            <div className="admin-template-detail-field">
              <span className="filter-label">파일 다운로드</span>
              <button type="button" className="filter-btn filter-btn--outline">
                ZIP 다운로드 (검수용)
              </button>
              <p className="admin-template-detail-hint">
                ※ 실제 다운로드 스크립트 경로/파라미터는 운영 중인 aepx 다운로드 로직에 맞게 조정하세요.
              </p>
            </div>
          </div>
        </section>

        <div className="admin-two-col__col admin-template-detail__right-stack">
          <section className="admin-list-box" aria-label="크리에이터 정보">
            <h2 className="admin-detail-section-title">크리에이터 정보</h2>
            <dl className="admin-detail-meta">
              <div className="admin-detail-meta__row">
                <dt>이름</dt>
                <dd>
                  <Link to={creatorDetailPath(row.creatorId)} className="admin-link">
                    {row.creatorName}
                  </Link>
                </dd>
              </div>
              <div className="admin-detail-meta__row">
                <dt>크리에이터 ID</dt>
                <dd>{row.creatorLoginId}</dd>
              </div>
            </dl>
          </section>

          <section className="admin-list-box" aria-label="검수상태 관리">
            <h2 className="admin-detail-section-title">검수상태 관리</h2>
            <div className="admin-template-detail-fields">
              <div className="admin-template-detail-field">
                <span className="filter-label">현재 상태</span>
                <div>
                  <span className={approvalButtonClass(row.approvalStatus)}>{row.approvalStatus}</span>
                </div>
              </div>
              <div className="admin-template-detail-field admin-template-detail-field--review-with-save">
                <span className="filter-label">변경할 상태</span>
                <div className="admin-template-detail__review-row">
                  <ListSelect
                    ariaLabel="변경할 검수 상태"
                    value={reviewEdit}
                    onChange={(next) => {
                      if (next === 'PENDING' || next === 'APPROVED' || next === 'REJECTED') setReviewEdit(next);
                    }}
                    options={TEMPLATE_REVIEW_EDIT_OPTIONS}
                  />
                  <button type="button" className="filter-btn filter-btn--primary" onClick={handleSaveReview}>
                    저장
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}

export default function CreatorTemplatePage() {
  const { subId } = useParams<{ subId?: string }>();
  const [rows, setRows] = useState<CreatorTemplateRow[]>(() => [...MOCK_TEMPLATES]);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [searchScope, setSearchScope] = useState('');
  const [keyword, setKeyword] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearch = () => {
    const next: AppliedSearch = { approvalStatus, searchScope, keyword };
    const isEmpty = !next.approvalStatus && !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
    setCurrentPage(1);
  };

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [] as Array<{ key: ChipKey; label: string }>;
    const chips: Array<{ key: ChipKey; label: string }> = [];
    if (appliedSearch.approvalStatus) {
      chips.push({ key: 'approvalStatus', label: `승인상태: ${appliedSearch.approvalStatus}` });
    }
    if (appliedSearch.keyword.trim()) {
      const scopeLabel =
        SEARCH_SCOPE_OPTIONS.find((o) => o.value === appliedSearch.searchScope)?.label ?? '전체';
      chips.push({ key: 'keyword', label: `검색: ${scopeLabel} ${appliedSearch.keyword}` });
    }
    return chips;
  }, [appliedSearch]);

  const clearAppliedFilter = (key: ChipKey) => {
    if (!appliedSearch) return;
    const next = { ...appliedSearch };
    if (key === 'approvalStatus') {
      setApprovalStatus('');
      next.approvalStatus = '';
    } else {
      setSearchScope('');
      setKeyword('');
      next.searchScope = '';
      next.keyword = '';
    }
    const isEmpty = !next.approvalStatus && !next.keyword.trim();
    setAppliedSearch(isEmpty ? null : next);
    setCurrentPage(1);
  };

  const filteredRows = useMemo(() => {
    if (!appliedSearch) return rows;
    const kw = appliedSearch.keyword.trim().toLowerCase();
    return rows.filter((row) => {
      if (appliedSearch.approvalStatus && row.approvalStatus !== appliedSearch.approvalStatus) return false;
      if (kw) {
        if (appliedSearch.searchScope === 'creatorLoginId')
          return row.creatorLoginId.toLowerCase().includes(kw);
        if (appliedSearch.searchScope === 'title') return row.title.toLowerCase().includes(kw);
        return (
          row.creatorLoginId.toLowerCase().includes(kw) || row.title.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [rows, appliedSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearch]);

  if (subId) {
    const detailRow = rows.find((row) => row.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={creatorTemplatePath} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">템플릿 상세</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">템플릿을 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }
    return (
      <CreatorTemplateDetailView
        row={detailRow}
        onSaveReview={(next) => {
          setRows((prev) => prev.map((r) => (r.id === detailRow.id ? { ...r, approvalStatus: next } : r)));
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <h1 className="page-title">템플릿 관리</h1>

      <section className="admin-list-box" aria-label="템플릿 검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">승인상태</span>
            <ListSelect
              ariaLabel="승인상태"
              value={approvalStatus}
              onChange={setApprovalStatus}
              options={APPROVAL_STATUS_OPTIONS}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">조건검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="조건검색"
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
                aria-label="템플릿 검색어"
              />
            </div>
          </div>

          <div className="filter-section filter-section--search-btn">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="템플릿 목록">
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
          <table className="admin-table admin-table--creator-template">
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>제목</th>
                <th>가격</th>
                <th>설명</th>
                <th>상태</th>
                <th>등록일</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>
                    <Link to={creatorDetailPath(row.creatorId)} className="admin-link">
                      {row.creatorName}
                    </Link>
                  </td>
                  <td>
                    <Link
                      to={creatorTemplateDetailPath(row.id)}
                      className="admin-link admin-table-title-link"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td>{row.price.toLocaleString()}원</td>
                  <td className="admin-table-cell--desc">{row.description}</td>
                  <td>
                    <span className={approvalButtonClass(row.approvalStatus)}>{row.approvalStatus}</span>
                  </td>
                  <td>{row.registeredAt}</td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
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
        </div>
      </section>
    </div>
  );
}
