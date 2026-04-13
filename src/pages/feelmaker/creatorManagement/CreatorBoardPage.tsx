import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Alert from '../../../components/Alert';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';
import {
  BOARD_NEW_SUB_ID,
  creatorBoardEditPath,
  creatorBoardNewPath,
  creatorBoardPath,
} from './creatorPaths';

type BoardCategory = 'GUIDE' | 'FAQ' | 'NOTICE';
type BoardStatus = 'EXPOSED' | 'HIDDEN';

const CATEGORY_LABEL: Record<BoardCategory, string> = {
  GUIDE: '가이드',
  FAQ: 'FAQ',
  NOTICE: '공지',
};

const STATUS_LABEL: Record<BoardStatus, string> = {
  EXPOSED: '노출',
  HIDDEN: '미노출',
};

const CATEGORY_OPTIONS = (
  ['GUIDE', 'FAQ', 'NOTICE'] as const
).map((value) => ({ value, label: CATEGORY_LABEL[value] }));

/** 목록 상단 구분 탭 (공통 .admin-tabs) */
const BOARD_CATEGORY_TABS: Array<{ id: 'all' | BoardCategory; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'GUIDE', label: CATEGORY_LABEL.GUIDE },
  { id: 'FAQ', label: CATEGORY_LABEL.FAQ },
  { id: 'NOTICE', label: CATEGORY_LABEL.NOTICE },
];

const ITEMS_PER_PAGE = 10;

type BoardPostRow = {
  id: string;
  category: BoardCategory;
  title: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  status: BoardStatus;
  content: string;
  /** 비밀글 여부 */
  isSecret: boolean;
  /** 비밀글 비밀번호(isSecret일 때 사용) */
  secretPassword: string;
};

function statusButtonClass(s: BoardStatus): string {
  if (s === 'EXPOSED') return 'row-btn row-btn--status-primary';
  return 'row-btn row-btn--status-secondary';
}

function boardNextSequentialId(existing: BoardPostRow[]): string {
  const maxNo = existing.reduce((max, r) => {
    const m = /^board-(\d+)$/.exec(r.id);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  return `board-${String(maxNo + 1).padStart(4, '0')}`;
}

function blankBoardPost(category: BoardCategory): BoardPostRow {
  return {
    id: BOARD_NEW_SUB_ID,
    category,
    title: '',
    authorName: '',
    createdAt: '',
    viewCount: 0,
    status: 'EXPOSED',
    content: '',
    isSecret: false,
    secretPassword: '',
  };
}

const MOCK_BOARD_POSTS: BoardPostRow[] = Array.from({ length: 32 }, (_, i) => {
  const no = i + 1;
  const cat: BoardCategory = i % 3 === 0 ? 'NOTICE' : i % 3 === 1 ? 'FAQ' : 'GUIDE';
  const m = String(((i + 1) % 12) + 1).padStart(2, '0');
  const d = String(((i * 2) % 27) + 1).padStart(2, '0');
  return {
    id: `board-${String(no).padStart(4, '0')}`,
    category: cat,
    title: `${CATEGORY_LABEL[cat]} 안내 #${no}`,
    authorName: `관리자${(no % 5) + 1}`,
    createdAt: `2026-${m}-${d}`,
    viewCount: 120 + ((i * 173) % 9800),
    status: i % 7 === 0 ? 'HIDDEN' : 'EXPOSED',
    content: `게시글 본문 더미입니다.\n\n항목 ${no}에 대한 설명 텍스트입니다.`,
    isSecret: i % 5 === 0,
    secretPassword: i % 5 === 0 ? `pw${String(no).padStart(4, '0')}` : '',
  };
});

type CreatorBoardEditViewProps = {
  row: BoardPostRow;
  /** true면 제목이 «게시글 등록», 저장 후 신규 행 추가 흐름에 맞춤 */
  isCreate?: boolean;
  onSave: (
    next: Pick<
      BoardPostRow,
      'category' | 'title' | 'content' | 'status' | 'isSecret' | 'secretPassword' | 'authorName'
    >
  ) => void;
};

function CreatorBoardEditView({ row, isCreate = false, onSave }: CreatorBoardEditViewProps) {
  const navigate = useNavigate();
  const [category, setCategory] = useState<BoardCategory>(row.category);
  const [title, setTitle] = useState(row.title);
  const [content, setContent] = useState(row.content);
  const [status, setStatus] = useState<BoardStatus>(row.status);
  const [isSecret, setIsSecret] = useState(row.isSecret);
  const [secretPassword, setSecretPassword] = useState(row.secretPassword);
  const [authorName, setAuthorName] = useState(row.authorName);
  const [pendingExposure, setPendingExposure] = useState<BoardStatus | null>(null);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    setCategory(row.category);
    setTitle(row.title);
    setContent(row.content);
    setStatus(row.status);
    setIsSecret(row.isSecret);
    setSecretPassword(row.secretPassword);
    setAuthorName(row.authorName);
  }, [row.id, row.category, row.title, row.content, row.status, row.isSecret, row.secretPassword, row.authorName]);

  const handleSave = () => {
    const t = title.trim();
    if (!t) {
      window.alert('제목을 입력해 주세요.');
      return;
    }
    const authorTrim = authorName.trim();
    if (!authorTrim) {
      window.alert('작성자를 입력해 주세요.');
      return;
    }
    if (isSecret && !secretPassword.trim()) {
      window.alert('비밀글 비밀번호를 입력해 주세요.');
      return;
    }
    onSave({
      category,
      title: t,
      content,
      status,
      isSecret,
      secretPassword: isSecret ? secretPassword : '',
      authorName: authorTrim,
    });
    setAlertMessage('저장되었습니다.');
  };

  return (
    <div className="admin-list-page admin-board-edit-page">
      <div className="admin-detail-header">
        <Link to={creatorBoardPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{isCreate ? '게시글 등록' : '게시글 수정'}</h1>
      </div>

      <section className="admin-list-box" aria-label={isCreate ? '게시글 등록' : '게시글 수정'}>
        <div className="admin-template-detail-fields">
          <div className="admin-template-detail-field">
            <span className="filter-label">구분</span>
            <ListSelect
              ariaLabel="구분"
              value={category}
              onChange={(next) => {
                if (next === 'GUIDE' || next === 'FAQ' || next === 'NOTICE') setCategory(next);
              }}
              options={CATEGORY_OPTIONS}
            />
          </div>
          <div className="admin-template-detail-field">
            <span className="filter-label">제목</span>
            <input
              type="text"
              className="admin-template-detail-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="제목"
            />
          </div>
          <div className="admin-template-detail-field">
            <span className="filter-label">내용</span>
            <textarea
              className="admin-template-detail-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              aria-label="내용"
            />
          </div>
          <div className="admin-template-detail-field">
            <span className="filter-label">공개설정</span>
            <ListSelect
              ariaLabel="공개설정"
              value={status}
              onChange={(next) => {
                if (next !== 'EXPOSED' && next !== 'HIDDEN') return;
                if (next === status) return;
                setPendingExposure(next);
              }}
              options={[
                { value: 'EXPOSED', label: STATUS_LABEL.EXPOSED },
                { value: 'HIDDEN', label: STATUS_LABEL.HIDDEN },
              ]}
            />
          </div>
          <div className="admin-template-detail-field">
            <span className="filter-label">비밀글 옵션</span>
            <div className="admin-board-secret-row">
              <label className="admin-board-secret-label">
                <input
                  type="checkbox"
                  className="admin-checkbox"
                  checked={isSecret}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsSecret(checked);
                    if (!checked) setSecretPassword('');
                  }}
                  aria-label="비밀글"
                />
                <span>비밀글</span>
              </label>
              {isSecret && (
                <input
                  type="password"
                  className="admin-template-detail-input admin-board-secret-password-input"
                  value={secretPassword}
                  onChange={(e) => setSecretPassword(e.target.value)}
                  placeholder="비밀번호"
                  autoComplete="new-password"
                  aria-label="비밀글 비밀번호"
                />
              )}
            </div>
          </div>
          <div className="admin-template-detail-field">
            <span className="filter-label">작성자</span>
            <input
              type="text"
              className="admin-template-detail-input"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              aria-label="작성자"
            />
          </div>
          <div className="admin-template-detail-field admin-template-detail-field--actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSave}>
              저장
            </button>
            <button type="button" className="filter-btn filter-btn--outline" onClick={() => navigate(creatorBoardPath)}>
              취소
            </button>
          </div>
        </div>
      </section>

      <Confirm
        open={pendingExposure !== null}
        title="확인"
        message={
          pendingExposure === 'EXPOSED'
            ? '노출 하시겠습니까?'
            : pendingExposure === 'HIDDEN'
              ? '미노출 하시겠습니까?'
              : ''
        }
        confirmText="확인"
        cancelText="취소"
        onClose={() => setPendingExposure(null)}
        onConfirm={() => {
          if (pendingExposure) setStatus(pendingExposure);
          setPendingExposure(null);
        }}
      />

      <Alert
        open={Boolean(alertMessage)}
        message={alertMessage}
        onClose={() => {
          setAlertMessage('');
          navigate(creatorBoardPath);
        }}
      />
    </div>
  );
}

export default function CreatorBoardPage() {
  const { subId } = useParams<{ subId?: string }>();
  const navigate = useNavigate();
  const [rows, setRows] = useState<BoardPostRow[]>(() => [...MOCK_BOARD_POSTS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | BoardCategory>('all');
  const [exposureConfirm, setExposureConfirm] = useState<{ id: string; next: BoardStatus } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  const tabFilteredRows = useMemo(() => {
    if (activeCategoryTab === 'all') return rows;
    return rows.filter((r) => r.category === activeCategoryTab);
  }, [rows, activeCategoryTab]);

  const totalPages = Math.max(1, Math.ceil(tabFilteredRows.length / ITEMS_PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tabFilteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [tabFilteredRows, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategoryTab]);

  if (subId) {
    if (subId === BOARD_NEW_SUB_ID) {
      const defaultCategory: BoardCategory = activeCategoryTab === 'all' ? 'NOTICE' : activeCategoryTab;
      return (
        <CreatorBoardEditView
          key={BOARD_NEW_SUB_ID}
          isCreate
          row={blankBoardPost(defaultCategory)}
          onSave={(next) => {
            setRows((prev) => {
              const id = boardNextSequentialId(prev);
              const t = new Date();
              const createdAt = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(
                t.getDate()
              ).padStart(2, '0')}`;
              const newRow: BoardPostRow = {
                id,
                createdAt,
                viewCount: 0,
                ...next,
              };
              return [newRow, ...prev];
            });
          }}
        />
      );
    }

    const detailRow = rows.find((r) => r.id === subId);
    if (!detailRow) {
      return (
        <div className="admin-list-page">
          <div className="admin-detail-header">
            <Link to={creatorBoardPath} className="admin-detail-back">
              ← 목록
            </Link>
            <h1 className="page-title">게시글 수정</h1>
          </div>
          <section className="admin-list-box">
            <p className="admin-list-result">게시글을 찾을 수 없습니다.</p>
          </section>
        </div>
      );
    }
    return (
      <CreatorBoardEditView
        row={detailRow}
        onSave={(next) => {
          setRows((prev) =>
            prev.map((r) => (r.id === detailRow.id ? { ...r, ...next } : r))
          );
        }}
      />
    );
  }

  return (
    <div className="admin-list-page">
      <div className="admin-list-page-header">
        <h1 className="page-title">크리에이터 게시판 관리</h1>
        <button
          type="button"
          className="admin-list-add-btn"
          onClick={() => navigate(creatorBoardNewPath())}
          aria-label="글 추가"
        >
          <Plus size={18} aria-hidden="true" />
          글추가
        </button>
      </div>

      <nav className="admin-tabs" aria-label="게시판 구분">
        <div className="admin-tabs__list" role="tablist">
          {BOARD_CATEGORY_TABS.map((tab) => {
            const isActive = activeCategoryTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`creator-board-tab-${tab.id}`}
                className={`admin-tabs__tab${isActive ? ' admin-tabs__tab--active' : ''}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveCategoryTab(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="admin-list-box admin-list-box--table" aria-label="크리에이터 게시판 목록">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--creator-board">
            <thead>
              <tr>
                <th>구분</th>
                <th>ID</th>
                <th>제목</th>
                <th>작성자</th>
                <th>작성일</th>
                <th>조회수</th>
                <th>노출</th>
                <th>삭제</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => (
                <tr key={row.id}>
                  <td>{CATEGORY_LABEL[row.category]}</td>
                  <td className="admin-template-detail-value--mono">{row.id}</td>
                  <td>
                    <Link to={creatorBoardEditPath(row.id)} className="admin-link">
                      {row.title}
                    </Link>
                  </td>
                  <td>{row.authorName}</td>
                  <td>{row.createdAt}</td>
                  <td>{row.viewCount.toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className={statusButtonClass(row.status)}
                      onClick={() =>
                        setExposureConfirm({
                          id: row.id,
                          next: row.status === 'EXPOSED' ? 'HIDDEN' : 'EXPOSED',
                        })
                      }
                      aria-label={`노출: ${STATUS_LABEL[row.status]}. 클릭 시 ${
                        row.status === 'EXPOSED' ? '미노출' : '노출'
                      }로 변경`}
                    >
                      {STATUS_LABEL[row.status]}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="row-btn row-btn--status-danger"
                      onClick={() => setDeleteConfirm({ id: row.id, title: row.title })}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {!paginatedRows.length && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '20px' }}>
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

      <Confirm
        open={exposureConfirm !== null}
        title="확인"
        message={
          exposureConfirm?.next === 'EXPOSED'
            ? '노출 하시겠습니까?'
            : exposureConfirm?.next === 'HIDDEN'
              ? '미노출 하시겠습니까?'
              : ''
        }
        confirmText="확인"
        cancelText="취소"
        onClose={() => setExposureConfirm(null)}
        onConfirm={() => {
          if (!exposureConfirm) return;
          setRows((prev) =>
            prev.map((r) => (r.id === exposureConfirm.id ? { ...r, status: exposureConfirm.next } : r))
          );
          setExposureConfirm(null);
        }}
      />

      <Confirm
        open={deleteConfirm !== null}
        title="확인"
        message={
          deleteConfirm ? (
            <>
              「<strong>{deleteConfirm.title}</strong>」을(를) 삭제하시겠습니까?
            </>
          ) : (
            ''
          )
        }
        confirmText="삭제"
        cancelText="취소"
        danger
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (!deleteConfirm) return;
          const id = deleteConfirm.id;
          setRows((prev) => prev.filter((r) => r.id !== id));
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}
