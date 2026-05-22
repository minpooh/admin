import { Link } from 'react-router-dom';
import '../../../styles/adminPage.css';
import { socialReviewListPath } from './socialReviewPaths';

export default function SocialReviewDetailPage() {
  return (
    <div className="admin-list-page admin-list-page--feelframe-social-review">
      <div className="admin-detail-header">
        <Link to={socialReviewListPath} className="admin-detail-back">
          목록으로
        </Link>
        <h1 className="page-title">소셜리뷰 상세</h1>
      </div>
    </div>
  );
}
