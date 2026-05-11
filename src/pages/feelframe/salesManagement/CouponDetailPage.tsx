import { Link } from 'react-router-dom';
import '../../../styles/adminPage.css';

type Props = {
  couponName: string | null;
  listPath: string;
};

export default function CouponDetailPage({ couponName, listPath }: Props) {
  return (
    <div className="admin-list-page">
      <div className="admin-detail-header">
        <Link to={listPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">{couponName ?? '쿠폰 상세'}</h1>
      </div>
      <section className="admin-list-box">
        <p className="admin-list-result">{couponName ? '쿠폰 상세 정보' : '쿠폰을 찾을 수 없습니다.'}</p>
      </section>
    </div>
  );
}
