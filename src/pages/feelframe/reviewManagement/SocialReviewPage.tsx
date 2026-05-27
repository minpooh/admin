import { Link, useParams } from 'react-router-dom';
import '../../../styles/adminPage.css';
import './SocialReviewPage.css';
import SocialReviewDetailPage from './SocialReviewDetailPage';
import { MOCK_SOCIAL_REVIEW_PRODUCTS } from './mock/socialReview.mock';
import { socialReviewDetailPath } from './socialReviewPaths';

export default function SocialReviewPage() {
  const { subId } = useParams<{ subId?: string }>();

  if (subId) return <SocialReviewDetailPage />;

  return (
    <div className="admin-list-page admin-list-page--feelframe-social-review">
      <h1 className="page-title">소셜리뷰관리</h1>

      <section className="admin-list-box">
        <div className="admin-stat-cards admin-stat-cards--6 admin-product-pick-grid" role="list">
          {MOCK_SOCIAL_REVIEW_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              to={socialReviewDetailPath(product.id)}
              className="admin-stat-card admin-stat-card--auto admin-product-pick-card"
              role="listitem"
              aria-label={`${product.name} 소셜리뷰 관리`}
            >
              <img
                src={product.imageUrl}
                alt=""
                className="admin-product-thumb admin-product-thumb--fluid"
                loading="lazy"
              />
              <p className="admin-stat-card__desc admin-product-pick-card__name">{product.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
