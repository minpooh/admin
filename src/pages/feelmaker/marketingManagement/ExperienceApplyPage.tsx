import { useMemo, useState, type FormEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import '../../../styles/adminPage.css';

const LOOKUP_RESULT = {
  url: 'https://feelcard.co.kr/dX6YHOfJdU',
  idx: '371307',
  skinType: 'v3',
};

function extractCardId(raw: string): string {
  const value = raw.trim();
  if (!value) return '';

  const queryMatch = value.match(/[?&]c_id=([^&#\s]+)/i);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]);
    } catch {
      return queryMatch[1];
    }
  }

  if (value.includes('/')) {
    try {
      const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
      const fromQuery = url.searchParams.get('c_id');
      if (fromQuery) return fromQuery;
      const segments = url.pathname.split('/').filter(Boolean);
      return segments.at(-1) ?? value;
    } catch {
      const path = value.split('?')[0] ?? value;
      const segments = path.split('/').filter(Boolean);
      return segments.at(-1) ?? value;
    }
  }

  return value;
}

export default function ExperienceApplyPage() {
  const [query, setQuery] = useState('https://feelcard.co.kr/dX6YHOfJdU');
  const [showResult, setShowResult] = useState(false);
  const cardId = useMemo(() => extractCardId(query), [query]);

  const handleLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowResult(query.trim().length > 0);
  };

  return (
    <div className="admin-list-page">
      <h1 className="page-title">체험단 적용</h1>
      <p className="admin-detail-id">
        관리자: minjeongdev · 필카드 주소를 넣으면 스킨 v3 전환 + 워터마크 제거 + 평생소장을 한 번에 겁니다.
        <br/>
        구매권(주문)은 차감하지 않습니다.
      </p>

      <section className="admin-list-box" aria-label="필카드 주소 조회">
        <form onSubmit={handleLookup}>
          <label className="filter-label" htmlFor="experience-card-query">
            필카드 주소 · URL(card_id) · 모청 idx
          </label>
          <div className="admin-search-field">
            <input
              id="experience-card-query"
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowResult(false);
              }}
              aria-label="필카드 주소 · URL(card_id) · 모청 idx"
            />
            <button type="submit" className="filter-btn filter-btn--primary">
              조회
            </button>
          </div>
          <p className="admin-detail-notice text-muted">
            전체 주소를 그대로 붙여넣어도 되고 주소 뒷부분만 넣어도 돼요. ?c_id= 붙은 주소도 인식합니다.
            <br />
            숫자만 넣으면 card_id + 모청 idx 양쪽에서 찾습니다.
            {cardId ? (
              <>
                <br />
                추출한 card_id: {cardId}
              </>
            ) : null}
          </p>
        </form>
      </section>

      {showResult ? (
        <section className="admin-list-box" aria-label="조회 결과">
          <dl className="admin-detail-meta">
            <div className="admin-detail-meta__row">
              <dt>URL</dt>
              <dd>
                <a
                  className="admin-link cell-line--with-action"
                  href={LOOKUP_RESULT.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {LOOKUP_RESULT.url}
                  <ExternalLink size={14} aria-hidden />
                </a>
                {' · idx '}
                {LOOKUP_RESULT.idx}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>스킨타입</dt>
              <dd>{LOOKUP_RESULT.skinType}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>현재 상태</dt>
              <dd>
                <span className="badge-square badge-square--inline badge-square--no-transition badge-square--primary">
                  스킨 v3
                </span>
                <span className="badge-square badge-square--inline badge-square--no-transition badge-square--gray">
                  워터마크 있음
                </span>
                <span className="badge-square badge-square--inline badge-square--no-transition badge-square--no-margin badge-square--gray">
                  평생소장 미적용
                </span>
              </dd>
            </div>
          </dl>
          <div className="admin-list-add-row">
            <button type="button" className="filter-btn filter-btn--primary">
              v3 전환 + 워터마크 제거 + 평생소장 적용
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
