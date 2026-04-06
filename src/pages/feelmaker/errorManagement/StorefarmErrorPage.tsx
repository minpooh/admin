import { useState } from 'react';
import ListSelect from '../../../components/ListSelect';
import '../../../styles/adminListPage.css';

const SEARCH_CONDITION_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'editor', label: '에디터 정보' },
  { value: 'customer', label: '고객정보' },
];

export default function StorefarmErrorPage() {
  const [searchCondition, setSearchCondition] = useState('all');
  const [keyword, setKeyword] = useState('');

  return (
    <div className="admin-list-page">
      <h1 className="page-title">스토어팜 오류</h1>

      <section className="admin-list-box" aria-label="스토어팜 오류 검색 필터">
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
              aria-label="스토어팜 오류 검색어"
            />
            <button type="button" className="filter-btn filter-btn--primary">
              검색
            </button>
          </div>
        </div>
      </section>

      <section className="admin-list-box admin-list-box--table" aria-label="스토어팜 오류 리스트">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>에디터 정보</th>
                <th>최초제작일</th>
                <th>고객정보</th>
                <th>주문 추가</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '20px' }}>
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
