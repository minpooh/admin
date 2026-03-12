type FallbackPageProps = {
  pageKey?: string;
  navId?: string;
  sectionId?: string;
  itemId?: string;
  subId?: string;
};

export default function FallbackPage({ pageKey, navId, sectionId, itemId, subId }: FallbackPageProps) {
  if (!navId) {
    return (
      <div className="page">
        <h2>대시보드</h2>
        <p>왼쪽 메뉴에서 항목을 선택하세요.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>
        {navId}
        {sectionId && ` / ${sectionId}`}
        {itemId && ` / ${itemId}`}
        {subId && ` / ${decodeURIComponent(subId)}`}
      </h2>
      <p>이 페이지는 아직 준비 중입니다. {pageKey && `(라우트: ${pageKey})`}</p>
    </div>
  );
}
