import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import Confirm from '../../../components/Confirm';
import type { FeelframeGroupRow } from './mock/groupList.mock';

type Props = {
  row: FeelframeGroupRow | null;
  listPath: string;
};

const REGISTRATION_STATUS_OPTIONS = ['전체', '등록전', '등록완료'] as const;
const DETAIL_SEARCH_OPTIONS = [
  { value: '전체', label: '전체' },
  { value: '이름', label: '이름' },
  { value: '전화번호', label: '전화번호' },
] as const;
const USAGE_STATUS_OPTIONS = ['전체', '사용전', '사용완료'] as const;
const CUSTOMER_CHECK_OPTIONS = ['전체', '실고객', '관리자'] as const;

type DetailSearchType = (typeof DETAIL_SEARCH_OPTIONS)[number]['value'];

type ParticipantRow = {
  id: string;
  name: string;
  isMember: boolean;
  phone: string;
  joinedAt: string;
  couponCode: string;
  couponIssued: '발급전' | '발급완료';
  couponSent: boolean;
  joinPath: '고객참여' | '관리자추가';
  registrationStatus: '등록전' | '등록완료';
  usageStatus: '사용전' | '사용완료';
  customerCheck: '실고객' | '관리자';
  memo: ParticipantMemoEntry[];
};

type ParticipantMemoEntry = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

type AppliedSearch = {
  registrationStatus: (typeof REGISTRATION_STATUS_OPTIONS)[number];
  detailSearchType: DetailSearchType;
  keyword: string;
  usageStatus: (typeof USAGE_STATUS_OPTIONS)[number];
  customerCheck: (typeof CUSTOMER_CHECK_OPTIONS)[number];
};

const MOCK_PARTICIPANTS: ParticipantRow[] = [
  {
    id: 'participant-001',
    name: '김민지',
    isMember: true,
    phone: '010-1234-5678',
    joinedAt: '2026-05-01 09:12:33',
    couponCode: 'CP-1745941-001',
    couponIssued: '발급완료',
    couponSent: true,
    joinPath: '고객참여',
    registrationStatus: '등록완료',
    usageStatus: '사용전',
    customerCheck: '실고객',
    memo: [{ id: 'participant-001-memo-1', author: '관리자', content: '대표 참여자', createdAt: '2026-05-01 09:30:12' }],
  },
  {
    id: 'participant-002',
    name: '이서연',
    isMember: true,
    phone: '010-2345-6789',
    joinedAt: '2026-05-01 10:28:04',
    couponCode: 'CP-1745941-002',
    couponIssued: '발급완료',
    couponSent: false,
    joinPath: '고객참여',
    registrationStatus: '등록완료',
    usageStatus: '사용완료',
    customerCheck: '실고객',
    memo: [],
  },
  {
    id: 'participant-003',
    name: '박지훈',
    isMember: false,
    phone: '010-3456-7890',
    joinedAt: '2026-05-02 14:05:19',
    couponCode: '',
    couponIssued: '발급전',
    couponSent: false,
    joinPath: '관리자추가',
    registrationStatus: '등록전',
    usageStatus: '사용전',
    customerCheck: '관리자',
    memo: [{ id: 'participant-003-memo-1', author: '관리자', content: '전화 접수', createdAt: '2026-05-02 14:10:26' }],
  },
  {
    id: 'participant-004',
    name: '최유진',
    isMember: true,
    phone: '010-4567-8901',
    joinedAt: '2026-05-03 16:41:52',
    couponCode: 'CP-1745941-004',
    couponIssued: '발급완료',
    couponSent: false,
    joinPath: '고객참여',
    registrationStatus: '등록완료',
    usageStatus: '사용전',
    customerCheck: '실고객',
    memo: [],
  },
  {
    id: 'participant-005',
    name: '정다은',
    isMember: false,
    phone: '010-5678-9012',
    joinedAt: '2026-05-04 11:22:47',
    couponCode: '',
    couponIssued: '발급전',
    couponSent: false,
    joinPath: '관리자추가',
    registrationStatus: '등록전',
    usageStatus: '사용전',
    customerCheck: '관리자',
    memo: [{ id: 'participant-005-memo-1', author: '관리자', content: '추가 확인 필요', createdAt: '2026-05-04 11:30:05' }],
  },
];

const CURRENT_LOGIN_AUTHOR = '관리자';

function isAppliedSearchEmpty(search: AppliedSearch) {
  return (
    search.registrationStatus === '전체' &&
    !search.keyword.trim() &&
    search.usageStatus === '전체' &&
    search.customerCheck === '전체'
  );
}

function applyParticipantFilters(rows: ParticipantRow[], search: AppliedSearch | null) {
  if (!search) return rows;

  const keyword = search.keyword.trim().toLowerCase();
  return rows.filter((participant) => {
    if (search.registrationStatus !== '전체' && participant.registrationStatus !== search.registrationStatus) return false;
    if (search.usageStatus !== '전체' && participant.usageStatus !== search.usageStatus) return false;
    if (search.customerCheck !== '전체' && participant.customerCheck !== search.customerCheck) return false;

    if (keyword) {
      const target =
        search.detailSearchType === '이름'
          ? participant.name
          : search.detailSearchType === '전화번호'
            ? participant.phone
            : `${participant.name} ${participant.phone}`;
      if (!target.toLowerCase().includes(keyword)) return false;
    }

    return true;
  });
}

function getRegistrationClassName(status: ParticipantRow['registrationStatus']) {
  return `row-btn ${status === '등록완료' ? 'row-btn--status-secondary' : 'row-btn--status-warning'}`;
}

function getUsageClassName(status: ParticipantRow['usageStatus']) {
  return `row-btn ${status === '사용완료' ? 'row-btn--status-secondary' : 'row-btn--status-warning'}`;
}

function formatDateTimeNow() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export default function GroupDetailPage({ row, listPath }: Props) {
  const [participants, setParticipants] = useState<ParticipantRow[]>(() => [...MOCK_PARTICIPANTS]);
  const [registrationStatus, setRegistrationStatus] = useState<(typeof REGISTRATION_STATUS_OPTIONS)[number]>('전체');
  const [detailSearchType, setDetailSearchType] = useState<DetailSearchType>('전체');
  const [keyword, setKeyword] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [usageStatus, setUsageStatus] = useState<(typeof USAGE_STATUS_OPTIONS)[number]>('전체');
  const [customerCheck, setCustomerCheck] = useState<(typeof CUSTOMER_CHECK_OPTIONS)[number]>('전체');
  const [appliedSearch, setAppliedSearch] = useState<AppliedSearch | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [sendTargetId, setSendTargetId] = useState<string | null>(null);
  const [memoModalParticipantId, setMemoModalParticipantId] = useState<string | null>(null);
  const [memoTooltipParticipantId, setMemoTooltipParticipantId] = useState<string | null>(null);
  const [memoTooltipPosition, setMemoTooltipPosition] = useState<{ top: number; right: number } | null>(null);
  const memoTooltipAnchorRef = useRef<HTMLElement | null>(null);
  const [memoInput, setMemoInput] = useState('');

  const filteredParticipants = useMemo(
    () => applyParticipantFilters(participants, appliedSearch),
    [participants, appliedSearch]
  );
  const deleteTarget = useMemo(
    () => participants.find((participant) => participant.id === deleteTargetId) ?? null,
    [participants, deleteTargetId]
  );
  const sendTarget = useMemo(
    () => participants.find((participant) => participant.id === sendTargetId) ?? null,
    [participants, sendTargetId]
  );
  const memoTarget = useMemo(
    () => participants.find((participant) => participant.id === memoModalParticipantId) ?? null,
    [participants, memoModalParticipantId]
  );

  const handleSearch = () => {
    const next: AppliedSearch = {
      registrationStatus,
      detailSearchType,
      keyword,
      usageStatus,
      customerCheck,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const handleDelete = () => {
    if (!deleteTargetId) return;
    setParticipants((prev) => prev.filter((participant) => participant.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const updateCouponCode = (participantId: string, couponCode: string) => {
    setParticipants((prev) =>
      prev.map((participant) => (participant.id === participantId ? { ...participant, couponCode } : participant))
    );
  };

  const issueCoupon = (participantId: string) => {
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === participantId ? { ...participant, couponIssued: '발급완료' } : participant
      )
    );
  };

  const sendCoupon = () => {
    if (!sendTargetId) return;
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === sendTargetId ? { ...participant, couponSent: true } : participant
      )
    );
    setSendTargetId(null);
  };

  const updateMemoTooltipPosition = () => {
    const anchorElement = memoTooltipAnchorRef.current;
    if (!anchorElement) return;
    const rect = anchorElement.getBoundingClientRect();
    const viewportMargin = 12;
    setMemoTooltipPosition({
      top: rect.bottom + 8,
      right: Math.max(viewportMargin, window.innerWidth - rect.right),
    });
  };

  useLayoutEffect(() => {
    if (!memoTooltipParticipantId) return;
    updateMemoTooltipPosition();
    window.addEventListener('scroll', updateMemoTooltipPosition, true);
    window.addEventListener('resize', updateMemoTooltipPosition);
    return () => {
      window.removeEventListener('scroll', updateMemoTooltipPosition, true);
      window.removeEventListener('resize', updateMemoTooltipPosition);
    };
  }, [memoTooltipParticipantId]);

  const showMemoTooltip = (participantId: string, triggerElement: HTMLElement) => {
    memoTooltipAnchorRef.current = triggerElement;
    setMemoTooltipParticipantId(participantId);
  };

  const hideMemoTooltip = () => {
    setMemoTooltipParticipantId(null);
    setMemoTooltipPosition(null);
    memoTooltipAnchorRef.current = null;
  };

  const openMemoModal = (participantId: string) => {
    setMemoModalParticipantId(participantId);
    setMemoInput('');
  };

  const closeMemoModal = () => {
    setMemoModalParticipantId(null);
    setMemoInput('');
  };

  const addMemo = (participantId: string) => {
    const content = memoInput.trim();
    if (!content) return;

    const nextMemo: ParticipantMemoEntry = {
      id: `participant-memo-${Date.now()}`,
      author: CURRENT_LOGIN_AUTHOR,
      content,
      createdAt: formatDateTimeNow(),
    };

    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === participantId ? { ...participant, memo: [...participant.memo, nextMemo] } : participant
      )
    );
    setMemoInput('');
  };

  const deleteMemo = (participantId: string, memoId: string) => {
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.id === participantId
          ? { ...participant, memo: participant.memo.filter((memo) => memo.id !== memoId) }
          : participant
      )
    );
  };

  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{row ? row.groupName : '공동구매 그룹을 찾을 수 없습니다.'}</h1>
      </div>

      <section className="admin-list-box admin-list-box--filter" aria-label="공동구매 참여 고객 검색 필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">등록여부</span>
            <ListSelect
              ariaLabel="등록여부"
              value={registrationStatus}
              onChange={(next) => setRegistrationStatus(next as (typeof REGISTRATION_STATUS_OPTIONS)[number])}
              options={REGISTRATION_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={detailSearchType}
                onChange={(next) => setDetailSearchType(next as DetailSearchType)}
                options={[...DETAIL_SEARCH_OPTIONS]}
              />
              <input
                type="text"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="참여 고객 상세검색어"
              />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
            <button
              type="button"
              className={`detail-search-toggle ${filterExpanded ? 'is-open' : ''}`}
              onClick={() => setFilterExpanded((prev) => !prev)}
            >
              <span className="detail-search-toggle__text">상세검색</span>
              <svg
                className="detail-search-toggle__icon"
                aria-hidden="true"
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="none"
              >
                <path
                  d="M4.5 6.75L8 10.25L11.5 6.75"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className={`filter-detail ${filterExpanded ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">사용여부</span>
            <ListSelect
              ariaLabel="사용여부"
              value={usageStatus}
              onChange={(next) => setUsageStatus(next as (typeof USAGE_STATUS_OPTIONS)[number])}
              options={USAGE_STATUS_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">고객체크</span>
            <ListSelect
              ariaLabel="고객체크"
              value={customerCheck}
              onChange={(next) => setCustomerCheck(next as (typeof CUSTOMER_CHECK_OPTIONS)[number])}
              options={CUSTOMER_CHECK_OPTIONS.map((option) => ({ value: option, label: option }))}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box">
        <p className="admin-list-result">총 참여인원 {filteredParticipants.length.toLocaleString()}명</p>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="공동구매 참여 고객 목록">
        <div className="admin-table-wrap">
          <table className="admin-table admin-table--min-w-1024">
            <thead>
              <tr>
                <th>고객정보</th>
                <th>전화번호</th>
                <th>참여일</th>
                <th>쿠폰발급</th>
                <th className="col-center">참여경로</th>
                <th className="col-center">등록여부</th>
                <th className="col-center">사용여부</th>
                <th className="col-center">메모</th>
                <th className="col-center">삭제</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-table-empty-cell">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((participant) => (
                  <tr key={participant.id}>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">{participant.name}</span>
                        <span className="cell-line admin-list-muted">
                          {participant.isMember ? '가입자' : '미가입자'}
                        </span>
                      </div>
                    </td>
                    <td>{participant.phone}</td>
                    <td>{participant.joinedAt}</td>
                    <td>
                      {participant.couponIssued === '발급완료' ? (
                        <div className="cell-block cell-block--inline-field">
                          <span className="cell-line">{participant.couponCode || '-'}</span>
                          <button
                            type="button"
                            className={`row-btn ${participant.couponSent ? 'row-btn--blue' : 'row-btn--default'}`}
                            onClick={() => {
                              if (!participant.couponSent) setSendTargetId(participant.id);
                            }}
                          >
                            {participant.couponSent ? '전송완료' : '전송'}
                          </button>
                        </div>
                      ) : (
                        <div className="cell-block cell-block--inline-field">
                          <div className="date-range-wrap">
                            <input
                              type="text"
                              className="input--table"
                              value={participant.couponCode}
                              onChange={(e) => updateCouponCode(participant.id, e.target.value)}
                              placeholder="쿠폰번호 입력"
                              aria-label={`${participant.name} 쿠폰번호`}
                            />
                          </div>
                          <button type="button" className="row-btn row-btn--default" onClick={() => issueCoupon(participant.id)}>
                            쿠폰 발급
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="col-center">{participant.joinPath}</td>
                    <td className="col-center">
                      <span
                        className={
                          participant.couponIssued === '발급전'
                            ? 'row-btn row-btn--status-danger'
                            : getRegistrationClassName(participant.registrationStatus)
                        }
                      >
                        {participant.couponIssued === '발급전' ? '발급전' : participant.registrationStatus}
                      </span>
                    </td>
                    <td className="col-center">
                      <span
                        className={
                          participant.couponIssued === '발급전'
                            ? 'row-btn row-btn--status-danger'
                            : getUsageClassName(participant.usageStatus)
                        }
                      >
                        {participant.couponIssued === '발급전' ? '발급전' : participant.usageStatus}
                      </span>
                    </td>
                    <td className="col-center">
                      <div
                        className="admin-memo-trigger"
                        onMouseEnter={(e) => {
                          if (participant.memo.length === 0) return;
                          showMemoTooltip(participant.id, e.currentTarget);
                        }}
                        onMouseLeave={hideMemoTooltip}
                        onFocus={(e) => {
                          if (participant.memo.length === 0) return;
                          showMemoTooltip(participant.id, e.currentTarget);
                        }}
                        onBlur={hideMemoTooltip}
                      >
                        <button
                          type="button"
                          className={`row-btn ${participant.memo.length > 0 ? 'row-btn--blue' : 'row-btn--default'}`}
                          onClick={() => openMemoModal(participant.id)}
                        >
                          {participant.memo.length > 0 ? '메모 확인' : '메모 작성'}
                        </button>
                      </div>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-btn row-btn--red"
                        onClick={() => setDeleteTargetId(participant.id)}
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

      {memoTarget && (
        <Modal open onClose={closeMemoModal} ariaLabel="메모" variant="option">
          <Modal.Header>
            <Modal.Title>메모</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="admin-modal-field-grid">
              <div className="admin-modal-field-row">
                <span className="admin-modal-field-label">고객명</span>
                <span className="admin-modal-field-value">{memoTarget.name}</span>
              </div>
              <div className="admin-modal-field-row admin-memo-modal__field-row">
                <span className="admin-modal-field-label">메모내용</span>
                <textarea
                  className="admin-modal-field-control admin-memo-modal__textarea"
                  value={memoInput}
                  onChange={(e) => setMemoInput(e.target.value)}
                  placeholder="메모를 입력해주세요."
                  rows={3}
                />
              </div>
            </div>

            <div className="admin-memo-history">
              <p className="admin-memo-history__title">지난 메모</p>
              {memoTarget.memo.length === 0 ? (
                <p className="admin-memo-history__empty">등록된 메모가 없습니다.</p>
              ) : (
                <ul className="admin-memo-history__list">
                  {[...memoTarget.memo].reverse().map((memo) => (
                    <li key={memo.id} className="admin-memo-history__item">
                      <div className="admin-memo-history__meta">
                        <span>{memo.author}</span>
                        <span>{memo.createdAt}</span>
                      </div>
                      <p className="admin-memo-history__content">{memo.content}</p>
                      <div className="admin-memo-history__actions">
                        <button
                          type="button"
                          className="row-btn row-btn--red"
                          onClick={() => deleteMemo(memoTarget.id, memo.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeMemoModal}>
              닫기
            </button>
            <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={() => addMemo(memoTarget.id)}>
              메모 저장
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {memoTooltipParticipantId && memoTooltipPosition && (() => {
        const participant = participants.find((item) => item.id === memoTooltipParticipantId);
        if (!participant || participant.memo.length === 0) return null;

        return createPortal(
          <div
            className="admin-memo-floating-tooltip"
            role="tooltip"
            style={{ top: memoTooltipPosition.top, right: memoTooltipPosition.right }}
          >
            <ul className="admin-memo-history__list">
              {[...participant.memo].reverse().map((memo) => (
                <li key={memo.id} className="admin-memo-history__item">
                  <div className="admin-memo-history__meta">
                    <span>{memo.author}</span>
                    <span>{memo.createdAt}</span>
                  </div>
                  <p className="admin-memo-history__content">{memo.content}</p>
                </li>
              ))}
            </ul>
          </div>,
          document.body
        );
      })()}

      <Confirm
        open={Boolean(deleteTarget)}
        title="참여 고객 삭제"
        message={deleteTarget ? `${deleteTarget.name} 고객을 삭제하시겠습니까?` : ''}
        confirmText="삭제"
        cancelText="취소"
        danger
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleDelete}
      />

      <Confirm
        open={Boolean(sendTarget)}
        title="쿠폰 전송"
        message="전송하시겠습니까?"
        confirmText="전송"
        cancelText="취소"
        onClose={() => setSendTargetId(null)}
        onConfirm={sendCoupon}
      />
    </div>
  );
}
