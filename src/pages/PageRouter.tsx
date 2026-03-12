import { useParams } from 'react-router-dom';
import { getPageKey, getPage } from './pageRegistry';
import FallbackPage from './FallbackPage';

export default function PageRouter() {
  const { navId, sectionId, itemId, subId } = useParams<{
    navId?: string;
    sectionId?: string;
    itemId?: string;
    subId?: string;
  }>();

  const pageKey = getPageKey(navId, sectionId, itemId, subId);
  const PageComponent = pageKey ? getPage(pageKey) : undefined;

  if (PageComponent) {
    return <PageComponent />;
  }

  return (
    <FallbackPage
      pageKey={pageKey || undefined}
      navId={navId}
      sectionId={sectionId}
      itemId={itemId}
      subId={subId}
    />
  );
}
