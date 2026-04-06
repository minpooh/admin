import '../../../styles/adminListPage.css';

export default function OrderErrorPage() {
  return (
    <div className="admin-list-page">
      <h1 className="page-title">주문 완료 오류</h1>

      <section className="admin-list-box admin-list-box--table" aria-label="주문 완료 오류 리스트">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>에디터정보</th>
                <th>상품정보</th>
                <th>주문일/최초제작일</th>
                <th>고객정보</th>
                <th>완료</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
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
