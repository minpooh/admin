import { useParams } from 'react-router-dom';

export default function DashboardPage() {
  const { navId, sectionId, itemId, subId } = useParams<{
    navId?: string;
    sectionId?: string;
    itemId?: string;
    subId?: string;
  }>();

  if (!navId) {
    return (
      <div className="dashboard-page">
        <h2>대시보드</h2>
        <p>왼쪽 메뉴에서 항목을 선택하세요.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <h2>
        {navId}
        {sectionId && ` / ${sectionId}`}
        {itemId && ` / ${itemId}`}
        {subId && ` / ${decodeURIComponent(subId)}`}
      </h2>
      <p>해당 페이지 컴포넌트가 여기에 렌더링됩니다.</p>
    </div>
  );
}
