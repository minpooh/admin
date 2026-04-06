import { useState } from 'react';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminListPage.css';

const SEARCH_CONDITION_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'customer', label: '고객정보' },
  { value: 'editor', label: '에디터' },
];

export default function DelayErrorPage() {
  const [searchCondition, setSearchCondition] = useState('all');
  const [keyword, setKeyword] = useState('');

  return (
    <div className="admin-list-page">
      <h1 className="page-title">제작지연 오류</h1>

      <section className="admin-list-box" aria-label="제작지연 오류 검색 필터">
        <div className="filter-section" style={{ width: '100%', maxWidth: 680, marginBottom: 0 }}>
          <span className="filter-label">조건검색</span>
          <div className="admin-search-field">
            <ListSelect
              ariaLabel="검색 조건"
              className="listselect--condition-type"
              value={searchCondition}
              onChange={setSearchCondition}
              options={SEARCH_CONDITION_OPTIONS}
            />
            <input
              type="search"
              placeholder="검색어 입력"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="제작지연 오류 검색어"
            />
            <button type="button" className="filter-btn filter-btn--primary">
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="제작지연 오류 리스트">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NO</th>
                <th>고객정보</th>
                <th>체험상품</th>
                <th>진행현황</th>
                <th>최근제작날짜</th>
                <th>에디터</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                  데이터가 없습니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
