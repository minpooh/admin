import { useEffect, useMemo, useRef, useState } from 'react';
import DatePicker from 'react-datepicker';
import { ko } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Mail, MessageCircle, Newspaper, QrCode, UserCircle, Users } from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Modal from '../../../components/Modal';
import '../../../styles/adminPage.css';
import './CustomerListPage.css';
import {
  MOCK_CUSTOMER_MEMBERS,
  PARTNER_CHANNELS,
  type CustomerMember,
} from './mock/customerList.mock';

const DATE_PRESET_OPTIONS = [
  { value: '', label: '미선택' },
  { value: '당일', label: '당일' },
  { value: '3일', label: '3일' },
  { value: '1주', label: '1주' },
  { value: '2주', label: '2주' },
  { value: '1개월', label: '1개월' },
  { value: '3개월', label: '3개월' },
  { value: '6개월', label: '6개월' },
];

const DETAIL_SEARCH_SCOPE_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'name', label: '이름' },
  { value: 'id', label: '아이디' },
  { value: 'phone', label: '전화번호' },
  { value: 'email', label: '이메일' },
];

const COMPANY_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'feelmaker', label: 'feelmaker' },
  { value: 'feelmotioncard', label: 'feelmotioncard' },
  { value: 'baruncompany', label: 'baruncompany' },
  { value: 'barunsonmall', label: 'barunsonmall' },
  { value: 'bhandscard', label: 'bhandscard' },
  { value: 'deardeer', label: 'deardeer' },
  { value: 'premierpaper', label: 'premierpaper' },
  { value: 'thecard', label: 'thecard' },
  { value: 'NAVER_STORE', label: 'NAVER_STORE' },
  { value: 'bom', label: 'bom' },
];

const MARKETING_CONSENT_OPTIONS = [
  { value: '', label: '전체보기' },
  { value: 'agree', label: '동의' },
  { value: 'disagree', label: '미동의' },
];

type CustomerAppliedSearch = {
  joinDateRange: string;
  joinStartDate: Date | null;
  joinEndDate: Date | null;
  weddingDateRange: string;
  weddingStartDate: Date | null;
  weddingEndDate: Date | null;
  searchScope: string;
  keyword: string;
  company: string;
  marketingConsent: string;
};

type CustomerChipKey = 'joinDate' | 'weddingDate' | 'keyword' | 'company' | 'marketing';

function formatYmd(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseMemberDate(s: string): Date {
  return new Date(s.trim().replace(' ', 'T'));
}

function dayBoundary(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isInCustomDateRange(dateStr: string, start: Date | null, end: Date | null): boolean {
  if (!start && !end) return true;
  const day = dayBoundary(parseMemberDate(dateStr));
  if (start && day < dayBoundary(start)) return false;
  if (end && day > dayBoundary(end)) return false;
  return true;
}

function isInPresetRange(dateStr: string, preset: string): boolean {
  const created = parseMemberDate(dateStr);
  const now = new Date();
  const sameDay =
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  switch (preset) {
    case '당일':
      return sameDay;
    case '3일':
      return diffDays >= 0 && diffDays <= 3;
    case '1주':
      return diffDays >= 0 && diffDays <= 7;
    case '2주':
      return diffDays >= 0 && diffDays <= 14;
    case '1개월':
      return diffDays >= 0 && diffDays <= 30;
    default:
      return true;
  }
}

function isAppliedSearchEmpty(s: CustomerAppliedSearch): boolean {
  const noJoin = !s.joinDateRange && !s.joinStartDate && !s.joinEndDate;
  const noWed = !s.weddingDateRange && !s.weddingStartDate && !s.weddingEndDate;
  const noKw = !s.keyword.trim();
  const noCompany = !s.company;
  const noMkt = !s.marketingConsent;
  return noJoin && noWed && noKw && noCompany && noMkt;
}

function applyCustomerFilters(members: CustomerMember[], applied: CustomerAppliedSearch | null): CustomerMember[] {
  if (!applied) return members;

  return members.filter((m) => {
    const useJoinCustom = applied.joinStartDate != null || applied.joinEndDate != null;
    if (useJoinCustom) {
      if (!isInCustomDateRange(m.joinDate, applied.joinStartDate, applied.joinEndDate)) return false;
    } else if (applied.joinDateRange) {
      if (!isInPresetRange(m.joinDate, applied.joinDateRange)) return false;
    }

    const useWedCustom = applied.weddingStartDate != null || applied.weddingEndDate != null;
    if (useWedCustom) {
      if (!isInCustomDateRange(m.weddingDate, applied.weddingStartDate, applied.weddingEndDate)) return false;
    } else if (applied.weddingDateRange) {
      if (!isInPresetRange(m.weddingDate, applied.weddingDateRange)) return false;
    }

    const kw = applied.keyword.trim().toLowerCase();
    const normalizedKw = kw.replace(/[^0-9]/g, '');
    if (kw) {
      const scope = applied.searchScope;
      if (scope === 'all') {
        if (
          !m.name.toLowerCase().includes(kw) &&
          !m.loginId.toLowerCase().includes(kw) &&
          !m.phone.toLowerCase().includes(kw) &&
          !m.email.toLowerCase().includes(kw)
        ) {
          return false;
        }
      } else if (scope === 'name') {
        if (!m.name.toLowerCase().includes(kw)) return false;
      } else if (scope === 'id') {
        if (!m.loginId.toLowerCase().includes(kw)) return false;
      } else if (scope === 'phone') {
        const normalizedPhone = m.phone.replace(/[^0-9]/g, '');
        if (!normalizedKw || !normalizedPhone.includes(normalizedKw)) return false;
      } else if (scope === 'email') {
        if (!m.email.toLowerCase().includes(kw)) return false;
      }
    }

    if (applied.company && m.partner !== applied.company) return false;

    if (applied.marketingConsent === 'agree' && m.marketingConsent !== 'agree') return false;
    if (applied.marketingConsent === 'disagree' && m.marketingConsent !== 'disagree') return false;

    return true;
  });
}

function getUtf8Bytes(text: string) {
  return new TextEncoder().encode(text).length;
}

function trimToMaxBytes(text: string, maxBytes: number) {
  if (getUtf8Bytes(text) <= maxBytes) return text;
  let out = '';
  for (const ch of text) {
    const next = out + ch;
    if (getUtf8Bytes(next) > maxBytes) break;
    out = next;
  }
  return out;
}

function applyDatePreset(next: string, setStart: (d: Date | null) => void, setEnd: (d: Date | null) => void) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  if (next === '당일') {
    setStart(start);
    setEnd(end);
    return;
  }
  if (next === '3일') start.setDate(start.getDate() - 2);
  if (next === '1주') start.setDate(start.getDate() - 6);
  if (next === '2주') start.setDate(start.getDate() - 13);
  if (next === '1개월') start.setDate(start.getDate() - 29);
  if (next === '3개월') start.setDate(start.getDate() - 89);
  if (next === '6개월') start.setDate(start.getDate() - 179);
  setStart(start);
  setEnd(end);
}

export default function CustomerListPage() {
  const [joinDateRange, setJoinDateRange] = useState('');
  const [joinStartDate, setJoinStartDate] = useState<Date | null>(null);
  const [joinEndDate, setJoinEndDate] = useState<Date | null>(null);

  const [weddingDateRange, setWeddingDateRange] = useState('');
  const [weddingStartDate, setWeddingStartDate] = useState<Date | null>(null);
  const [weddingEndDate, setWeddingEndDate] = useState<Date | null>(null);

  const [searchScope, setSearchScope] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [company, setCompany] = useState('');
  const [marketingConsent, setMarketingConsent] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  const [members, setMembers] = useState<CustomerMember[]>(() => [...MOCK_CUSTOMER_MEMBERS]);
  const [appliedSearch, setAppliedSearch] = useState<CustomerAppliedSearch | null>(null);

  const memberStats = useMemo(() => {
    const total = members.length;
    const general = members.filter((m) => m.signupChannel === 'general').length;
    const kakao = members.filter((m) => m.signupChannel === 'kakao').length;
    const naver = members.filter((m) => m.signupChannel === 'naver').length;
    return { total, general, kakao, naver };
  }, [members]);

  const filteredMembers = useMemo(
    () => applyCustomerFilters(members, appliedSearch),
    [members, appliedSearch]
  );

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / ITEMS_PER_PAGE));
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const appliedChips = useMemo(() => {
    if (!appliedSearch) return [];
    const a = appliedSearch;
    const chips: { key: CustomerChipKey; label: string }[] = [];

    if (a.joinStartDate || a.joinEndDate) {
      const s = formatYmd(a.joinStartDate);
      const e = formatYmd(a.joinEndDate);
      chips.push({ key: 'joinDate', label: `가입일: ${s}${s && e ? ' ~ ' : ''}${e}` });
    } else if (a.joinDateRange) {
      chips.push({ key: 'joinDate', label: `가입일: ${a.joinDateRange}` });
    }

    if (a.weddingStartDate || a.weddingEndDate) {
      const s = formatYmd(a.weddingStartDate);
      const e = formatYmd(a.weddingEndDate);
      chips.push({ key: 'weddingDate', label: `예식일: ${s}${s && e ? ' ~ ' : ''}${e}` });
    } else if (a.weddingDateRange) {
      chips.push({ key: 'weddingDate', label: `예식일: ${a.weddingDateRange}` });
    }

    if (a.keyword.trim()) {
      const scopeLabel = DETAIL_SEARCH_SCOPE_OPTIONS.find((o) => o.value === a.searchScope)?.label ?? '';
      chips.push({ key: 'keyword', label: `상세검색: ${scopeLabel} ${a.keyword.trim()}` });
    }

    if (a.company) {
      const label = COMPANY_OPTIONS.find((o) => o.value === a.company)?.label ?? a.company;
      chips.push({ key: 'company', label: `업체: ${label}` });
    }

    if (a.marketingConsent) {
      const label =
        a.marketingConsent === 'agree' ? '동의' : a.marketingConsent === 'disagree' ? '미동의' : a.marketingConsent;
      chips.push({ key: 'marketing', label: `마케팅동의: ${label}` });
    }

    return chips;
  }, [appliedSearch]);

  const handleSearch = () => {
    const next: CustomerAppliedSearch = {
      joinDateRange,
      joinStartDate,
      joinEndDate,
      weddingDateRange,
      weddingStartDate,
      weddingEndDate,
      searchScope,
      keyword,
      company,
      marketingConsent,
    };
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const clearAppliedFilter = (key: CustomerChipKey) => {
    if (!appliedSearch) return;
    const next: CustomerAppliedSearch = { ...appliedSearch };
    switch (key) {
      case 'joinDate':
        next.joinDateRange = '';
        next.joinStartDate = null;
        next.joinEndDate = null;
        setJoinDateRange('');
        setJoinStartDate(null);
        setJoinEndDate(null);
        break;
      case 'weddingDate':
        next.weddingDateRange = '';
        next.weddingStartDate = null;
        next.weddingEndDate = null;
        setWeddingDateRange('');
        setWeddingStartDate(null);
        setWeddingEndDate(null);
        break;
      case 'keyword':
        next.keyword = '';
        next.searchScope = 'all';
        setKeyword('');
        setSearchScope('all');
        break;
      case 'company':
        next.company = '';
        setCompany('');
        break;
      case 'marketing':
        next.marketingConsent = '';
        setMarketingConsent('');
        break;
      default:
        break;
    }
    setAppliedSearch(isAppliedSearchEmpty(next) ? null : next);
  };

  const [smsModalMemberId, setSmsModalMemberId] = useState<string | null>(null);
  const [smsText, setSmsText] = useState('');
  const [smsHistoryByMemberId, setSmsHistoryByMemberId] = useState<Record<string, string[]>>({});
  const phoneMessagesRef = useRef<HTMLDivElement | null>(null);

  const [partnerModalMemberId, setPartnerModalMemberId] = useState<string | null>(null);
  const [changedPartner, setChangedPartner] = useState('');

  const smsHistoryLen = smsModalMemberId ? (smsHistoryByMemberId[smsModalMemberId]?.length ?? 0) : 0;

  const closeSmsModal = () => setSmsModalMemberId(null);
  const closePartnerModal = () => setPartnerModalMemberId(null);

  const confirmPartnerChange = (memberId: string) => {
    if (!changedPartner.trim()) {
      window.alert('변경 파트너사를 선택해주세요.');
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, partner: changedPartner } : m)));
    closePartnerModal();
  };

  useEffect(() => {
    if (!smsModalMemberId) return;
    const el = phoneMessagesRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [smsModalMemberId, smsHistoryLen, smsText]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      queueMicrotask(() => {
        setCurrentPage(totalPages);
      });
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    queueMicrotask(() => {
      setCurrentPage(1);
    });
  }, [appliedSearch]);

  return (
    <div className="admin-list-page admin-list-page--customer-list">
      <h1 className="page-title">회원 목록</h1>

      <section className="customer-stat-cards-wrap admin-stat-section" aria-label="요약 카드">
        <div className="admin-stat-cards admin-stat-cards--4">
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--gray" aria-hidden>
              <Users size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">전체회원수</p>
            <p className="admin-stat-value">{memberStats.total}</p>
            <p className="admin-stat-hint">전체 회원 기준</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--primary" aria-hidden>
              <UserCircle size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">일반가입자</p>
            <p className="admin-stat-value">{memberStats.general}</p>
            <p className="admin-stat-hint">일반 가입 경로</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--warning" aria-hidden>
              <MessageCircle size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">카카오 가입자</p>
            <p className="admin-stat-value">{memberStats.kakao}</p>
            <p className="admin-stat-hint">카카오 연동</p>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-card__icon admin-stat-card__icon--success" aria-hidden>
              <Newspaper size={20} strokeWidth={2} />
            </div>
            <p className="admin-stat-label">네이버 가입자</p>
            <p className="admin-stat-value">{memberStats.naver}</p>
            <p className="admin-stat-hint">네이버 연동</p>
          </div>
        </div>
      </section>

      <section className="admin-list-box" aria-label="검색·필터">
        <div className="filter-top-row">
          <div className="filter-section">
            <span className="filter-label">가입일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="가입일 프리셋"
                className="listselect--date-range"
                value={joinDateRange}
                onChange={(next) => {
                  if (!next) {
                    setJoinDateRange('');
                    setJoinStartDate(null);
                    setJoinEndDate(null);
                    return;
                  }
                  setJoinDateRange(next);
                  applyDatePreset(next, setJoinStartDate, setJoinEndDate);
                }}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={joinStartDate}
                  onChange={(date: Date | null) => {
                    setJoinStartDate(date);
                    setJoinDateRange('');
                  }}
                  selectsStart
                  startDate={joinStartDate}
                  endDate={joinEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!joinStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={joinEndDate}
                  onChange={(date: Date | null) => {
                    setJoinEndDate(date);
                    setJoinDateRange('');
                  }}
                  selectsEnd
                  startDate={joinStartDate}
                  endDate={joinEndDate}
                  minDate={joinStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!joinEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                  maxDate={new Date()}
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">상세검색</span>
            <div className="admin-search-field">
              <ListSelect
                ariaLabel="상세검색 조건"
                className="listselect--condition-type"
                value={searchScope}
                onChange={setSearchScope}
                options={DETAIL_SEARCH_SCOPE_OPTIONS}
              />
              <input
                type="search"
                placeholder="검색어 입력"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="회원 상세검색"
              />
            </div>
          </div>

          <div className="filter-top-actions">
            <button type="button" className="filter-btn filter-btn--primary" onClick={handleSearch}>
              검색
            </button>
            <button
              type="button"
              className={`detail-search-toggle ${detailOpen ? 'is-open' : ''}`}
              onClick={() => setDetailOpen((v) => !v)}
              aria-expanded={detailOpen}
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

        <div className={`filter-detail ${detailOpen ? 'filter-detail--expanded' : ''}`}>
          <div className="filter-section">
            <span className="filter-label">예식일</span>
            <div className="date-range-wrap">
              <ListSelect
                ariaLabel="예식일 프리셋"
                className="listselect--date-range"
                value={weddingDateRange}
                onChange={(next) => {
                  if (!next) {
                    setWeddingDateRange('');
                    setWeddingStartDate(null);
                    setWeddingEndDate(null);
                    return;
                  }
                  setWeddingDateRange(next);
                  applyDatePreset(next, setWeddingStartDate, setWeddingEndDate);
                }}
                options={DATE_PRESET_OPTIONS}
              />
              <div className="date-range-pickers">
                <DatePicker
                  selected={weddingStartDate}
                  onChange={(date: Date | null) => {
                    setWeddingStartDate(date);
                    setWeddingDateRange('');
                  }}
                  selectsStart
                  startDate={weddingStartDate}
                  endDate={weddingEndDate}
                  placeholderText="시작일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!weddingStartDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
                <span className="date-sep">~</span>
                <DatePicker
                  selected={weddingEndDate}
                  onChange={(date: Date | null) => {
                    setWeddingEndDate(date);
                    setWeddingDateRange('');
                  }}
                  selectsEnd
                  startDate={weddingStartDate}
                  endDate={weddingEndDate}
                  minDate={weddingStartDate ?? undefined}
                  placeholderText="종료일"
                  dateFormat="yyyy-MM-dd"
                  locale={ko}
                  className="date-picker-input"
                  isClearable={!!weddingEndDate}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="scroll"
                />
              </div>
            </div>
          </div>

          <div className="filter-section">
            <span className="filter-label">업체선택</span>
            <ListSelect
              ariaLabel="업체선택"
              value={company}
              onChange={setCompany}
              options={COMPANY_OPTIONS}
            />
          </div>

          <div className="filter-section">
            <span className="filter-label">마케팅동의</span>
            <ListSelect
              ariaLabel="마케팅동의"
              value={marketingConsent}
              onChange={setMarketingConsent}
              options={MARKETING_CONSENT_OPTIONS}
            />
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="회원 리스트">
        {appliedChips.length > 0 && (
          <section className="admin-applied-filters">
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
          <table className="admin-table">
            <thead>
              <tr>
                <th>가입일/예식일</th>
                <th>가입경로</th>
                <th>이름</th>
                <th>아이디</th>
                <th>이메일</th>
                <th>주문횟수</th>
                <th>연락처</th>
                <th>적립금</th>
                <th>필포인트</th>
                <th>전환</th>
                <th className="col-center">모청QR</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="admin-table-empty-cell">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="cell-block cell-block--dates">
                        <span className="cell-line">{row.joinDate}</span>
                        <span className="cell-line">{row.weddingDate}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cell-block cell-block--channels">
                        <span className="cell-line">
                          <span className="list-label">경로</span> <span className="list-value">{row.signupPath}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">가입</span>
                          <button
                            type="button"
                            className="admin-link list-value"
                            onClick={() => {
                              setPartnerModalMemberId(row.id);
                              setChangedPartner(row.partner);
                            }}
                          >
                            {row.partner}
                          </button>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-line">{row.name}</span>
                    </td>
                    <td>
                      <span className="cell-line">{row.loginId}</span>
                    </td>
                    <td>
                      <span className="cell-line">{row.email}</span>
                    </td>
                    <td>
                      <div className="cell-block cell-block--dates">
                        <span className="cell-line">주문 {row.orderCount}건</span>
                        <span className="cell-line">시안 {row.draftCount}건</span>
                      </div>
                    </td>
                    <td>
                      <div className="phone-with-sms">
                        <button
                          type="button"
                          className="row-icon-btn row-icon-btn--tone-secondary row-icon-btn--compact"
                          aria-label="문자 발송"
                          title="문자 발송"
                          onClick={() => {
                            setSmsModalMemberId(row.id);
                            setSmsText('');
                          }}
                        >
                          <Mail size={12} aria-hidden="true" />
                        </button>
                        <span className="phone-with-sms__number">{row.phone}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cell-line">{row.reserve}</span>
                    </td>
                    <td>
                      <span className="cell-line">{row.feelPoint}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="row-btn row-btn--blue"
                        onClick={() => window.alert('일반회원 전환(목업)')}
                      >
                        일반회원전환
                      </button>
                    </td>
                    <td className="col-center">
                      <button
                        type="button"
                        className="row-icon-btn row-icon-btn--tone-purple"
                        aria-label="QR코드"
                        title="QR코드"
                        onClick={() => window.alert('모청 QR(목업)')}
                      >
                        <QrCode size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="admin-list-table-footer">
          <div className="admin-table-pagination">
            <div className="pagination-inner">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                aria-label="첫 페이지"
              >
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

      {smsModalMemberId &&
        (() => {
          const member = members.find((m) => m.id === smsModalMemberId);
          if (!member) return null;
          const byteCount = getUtf8Bytes(smsText);
          const history = smsHistoryByMemberId[member.id] ?? [];

          return (
            <Modal open onClose={closeSmsModal} ariaLabel="문자 발송" variant="sms">
              <Modal.Header>
                <Modal.Title>문자 발송</Modal.Title>
                <Modal.Close />
              </Modal.Header>

              <Modal.Body>
                <div className="sms-modal__content">
                  <div className="sms-modal__preview" aria-label="휴대폰 미리보기">
                    <div className="phone-mock">
                      <div className="phone-mock__bezel">
                        <div className="phone-mock__notch" aria-hidden="true" />
                        <div className="phone-mock__screen">
                          <div className="phone-mock__top">
                            <div className="phone-mock__to">To: {member.name}</div>
                            <div className="phone-mock__to-sub">{member.phone}</div>
                          </div>
                          <div className="phone-mock__messages" ref={phoneMessagesRef}>
                            {history.map((m, idx) => (
                              <div
                                key={`${member.id}-sms-${idx}`}
                                className="phone-mock__bubble phone-mock__bubble--history"
                              >
                                {m}
                              </div>
                            ))}
                            <div
                              className={`phone-mock__bubble phone-mock__bubble--draft ${smsText.trim() ? '' : 'is-empty'}`}
                            >
                              {smsText.trim() ? smsText : '메시지를 입력하면 이곳에 미리보기가 표시됩니다.'}
                            </div>
                          </div>
                          <div className="phone-mock__composer">
                            <textarea
                              id="customer-sms-text"
                              className="phone-mock__textarea"
                              value={smsText}
                              onChange={(e) => setSmsText(trimToMaxBytes(e.target.value, 80))}
                              placeholder="내용을 입력하세요. (최대 80byte)"
                              rows={2}
                            />
                            <div className={`phone-mock__counter ${byteCount > 80 ? 'is-over' : ''}`}>
                              {byteCount}/80byte
                            </div>
                          </div>
                          <div className="phone-mock__home-indicator" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <button type="button" className="sms-modal__btn sms-modal__btn--ghost" onClick={() => closeSmsModal()}>
                  닫기
                </button>
                <button
                  type="button"
                  className="sms-modal__btn sms-modal__btn--primary"
                  onClick={() => {
                    if (!smsText.trim()) {
                      window.alert('문자내용을 입력해주세요.');
                      return;
                    }
                    setSmsHistoryByMemberId((prev) => ({
                      ...prev,
                      [member.id]: [...(prev[member.id] ?? []), smsText.trim()],
                    }));
                    window.alert('문자 발송(목업)');
                    closeSmsModal();
                  }}
                >
                  발송
                </button>
              </Modal.Footer>
            </Modal>
          );
        })()}

      {partnerModalMemberId &&
        (() => {
          const member = members.find((m) => m.id === partnerModalMemberId);
          if (!member) return null;
          return (
            <Modal open onClose={closePartnerModal} ariaLabel="파트너 변경" variant="option">
              <Modal.Header>
                <Modal.Title>파트너 변경</Modal.Title>
                <Modal.Close />
              </Modal.Header>
              <Modal.Body>
                <div className="admin-modal-field-grid">
                  <div className="admin-modal-field-row">
                    <span className="admin-modal-field-label">현재 파트너사</span>
                    <span className="admin-modal-field-value">{member.partner}</span>
                  </div>
                  <div className="admin-modal-field-row">
                    <span className="admin-modal-field-label">변경 파트너사</span>
                    <ListSelect
                      ariaLabel="변경 파트너사"
                      className="listselect--modal"
                      value={changedPartner}
                      onChange={setChangedPartner}
                      options={PARTNER_CHANNELS.map((c) => ({ value: c, label: c }))}
                    />
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button type="button" className="admin-modal__btn admin-modal__btn--ghost" onClick={closePartnerModal}>
                  닫기
                </button>
                <button
                  type="button"
                  className="admin-modal__btn admin-modal__btn--primary"
                  onClick={() => confirmPartnerChange(member.id)}
                >
                  변경 저장
                </button>
              </Modal.Footer>
            </Modal>
          );
        })()}
    </div>
  );
}
