import { useParams } from 'react-router-dom';
import '../../../styles/adminPage.css';
import './SocialReviewPage.css';
import SocialReviewDetailPage from './SocialReviewDetailPage';

export default function SocialReviewPage() {
  const { subId } = useParams<{ subId?: string }>();

  if (subId) return <SocialReviewDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--feelframe-social-review">
      <h1 className="page-title">소셜리뷰관리</h1>
    </div>
  );
}
