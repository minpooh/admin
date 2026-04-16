import { useState } from 'react';
import {
  HiArchiveBox,
  HiCalendarDays,
  HiMegaphone,
  HiShoppingCart,
  HiTag,
  HiTruck,
  HiUserGroup,
  HiUserPlus,
  HiUsers,
} from 'react-icons/hi2';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import '../../styles/dashboardCommon.css';
import '../../styles/adminListPage.css';
import './DashboardPage.css';

const CARD_DATA = {
  memberCount: 18068,
  orderCount: 19332,
  uploadCount: 22488,
  shippingCount: 21064,
  groupBuyCount: 8,
};

const CARD_COMPARE = {
  memberCount: 4.1,
  orderCount: 2.5,
  uploadCount: 6.2,
  shippingCount: -1.3,
  groupBuyCount: 14.6,
};

const DAILY_SALES: { label: string; 매출: number }[] = [
  { label: '4/9', 매출: 132 },
  { label: '4/10', 매출: 175 },
  { label: '4/11', 매출: 148 },
  { label: '4/12', 매출: 221 },
  { label: '4/13', 매출: 196 },
  { label: '4/14', 매출: 243 },
  { label: '4/15', 매출: 287 },
];

const MONTHLY_SALES: { label: string; 매출: number }[] = [
  { label: '10월', 매출: 380 },
  { label: '11월', 매출: 460 },
  { label: '12월', 매출: 590 },
  { label: '1월', 매출: 620 },
  { label: '2월', 매출: 710 },
  { label: '3월', 매출: 760 },
  { label: '4월', 매출: 287 },
];

const QUICK_MENUS = [
  { key: 'product', label: '상품관리', icon: HiArchiveBox, tone: 'feelframe-dashboard-quick-menu-icon--blue' },
  { key: 'event', label: '이벤트관리', icon: HiTag, tone: 'feelframe-dashboard-quick-menu-icon--yellow' },
  { key: 'coupon', label: '쿠폰관리', icon: HiMegaphone, tone: 'feelframe-dashboard-quick-menu-icon--pink' },
  { key: 'banner', label: '배너관리', icon: HiCalendarDays, tone: 'feelframe-dashboard-quick-menu-icon--green' },
  { key: 'popup', label: '팝업관리', icon: HiArchiveBox, tone: 'feelframe-dashboard-quick-menu-icon--gray' },
];

const VISITOR_SCHEDULE: { name: string; time: string }[] = [];

const ORDER_LIST = [
  {
    type: '액자',
    orderNo: '2026041515000524112',
    customer: '은수지',
    product: '사이닝 실버 아크릴 프레임세트',
    orderedAt: '2026-04-15 15:00:04',
    status: '업로드 전',
  },
  {
    type: '액자',
    orderNo: '2026041514275524111',
    customer: '베이나',
    product: '1+1 사이닝 실버 마크로 액자 [20X30 INCH]',
    orderedAt: '2026-04-15 14:27:54',
    status: '고객업로드',
  },
  {
    type: '액자',
    orderNo: '2026041514122824110',
    customer: '이하연',
    product: '사이닝 실버 아크릴 액자',
    orderedAt: '2026-04-15 14:12:28',
    status: '고객업로드',
  },
  {
    type: '액자',
    orderNo: '202604151345524109',
    customer: '문지수',
    product: '심플 무드 액자 패밀리용',
    orderedAt: '2026-04-15 13:41:55',
    status: '업로드 전',
  },
  {
    type: '액자',
    orderNo: '2026041513035524107',
    customer: '박시영',
    product: 'L액자 포토테이블 세트(직접영상 무핑크모드 무료증정)',
    orderedAt: '2026-04-15 13:03:55',
    status: '업로드 전',
  },
];

const INQUIRIES = [
  { type: '시안 / 수정문의', content: '제작은 요청상태인가요?', manager: '박찬서', status: '답변완료' },
  { type: '배송 / 제작문의', content: '결혼 사진만 가능할까요?', manager: '허예진', status: '답변완료' },
  { type: '배송 / 제작문의', content: '배송일 문의드립니다.', manager: '장성주', status: '답변완료' },
  { type: '기타문의', content: '상품 후기 일정', manager: '손하준', status: '답변완료' },
  { type: '시안 / 수정문의', content: '파일 업로드는', manager: '문희수', status: '답변완료' },
];

function formatCount(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

export default function FeelframeDashboardPage() {
  const [salesView, setSalesView] = useState<'daily' | 'monthly'>('daily');

  return (
    <div className="dashboard-page admin-list-page feelframe-dashboard-page">
      <section className="dashboard-cards dashboard-cards--cols-5">
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">회원수</span>
            <strong className="dashboard-card-value">{formatCount(CARD_DATA.memberCount)}명</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.memberCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.memberCount >= 0 ? '+' : ''}
              {CARD_COMPARE.memberCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--sales" aria-hidden>
            <HiUsers size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">주문 건</span>
            <strong className="dashboard-card-value">{formatCount(CARD_DATA.orderCount)}건</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.orderCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.orderCount >= 0 ? '+' : ''}
              {CARD_COMPARE.orderCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--orders" aria-hidden>
            <HiShoppingCart size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">업로드 건</span>
            <strong className="dashboard-card-value">{formatCount(CARD_DATA.uploadCount)}건</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.uploadCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.uploadCount >= 0 ? '+' : ''}
              {CARD_COMPARE.uploadCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--members" aria-hidden>
            <HiUserPlus size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">배송 건</span>
            <strong className="dashboard-card-value">{formatCount(CARD_DATA.shippingCount)}건</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.shippingCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.shippingCount >= 0 ? '+' : ''}
              {CARD_COMPARE.shippingCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--videos" aria-hidden>
            <HiTruck size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">공동구매</span>
            <strong className="dashboard-card-value">{CARD_DATA.groupBuyCount}팀</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.groupBuyCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.groupBuyCount >= 0 ? '+' : ''}
              {CARD_COMPARE.groupBuyCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--orders" aria-hidden>
            <HiUserGroup size={24} />
          </span>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">매출 현황</h3>
          <div className="dashboard-tabs">
            <button
              type="button"
              className={salesView === 'daily' ? 'active' : ''}
              onClick={() => setSalesView('daily')}
            >
              일별
            </button>
            <button
              type="button"
              className={salesView === 'monthly' ? 'active' : ''}
              onClick={() => setSalesView('monthly')}
            >
              월별
            </button>
          </div>
        </div>
        <div className="dashboard-chart">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={salesView === 'daily' ? DAILY_SALES : MONTHLY_SALES}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v}만`} />
              <Tooltip formatter={(value) => [`${Number(value)}만 원`, '매출']} />
              <Area type="monotone" dataKey="매출" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="admin-list-box feelframe-dashboard-quick-menu">
        <ul className="feelframe-dashboard-quick-menu-list">
          {QUICK_MENUS.map((menu) => {
            const Icon = menu.icon;
            return (
              <li key={menu.key} className="feelframe-dashboard-quick-menu-item">
                <span className={`feelframe-dashboard-quick-menu-icon ${menu.tone}`}>
                  <Icon size={14} />
                </span>
                <span className="feelframe-dashboard-quick-menu-label">{menu.label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="feelframe-dashboard-grid">
        <section className="admin-list-box feelframe-dashboard-orders">
          <div className="feelframe-dashboard-section-header">
            <h3 className="dashboard-section-title">주문목록</h3>
            <button type="button" className="feelframe-dashboard-link">
              더보기 +
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table feelframe-dashboard-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>주문번호</th>
                  <th>고객정보</th>
                  <th>주문정보</th>
                  <th>주문일</th>
                  <th>진행상황</th>
                </tr>
              </thead>
              <tbody>
                {ORDER_LIST.map((row) => (
                  <tr key={row.orderNo}>
                    <td>{row.type}</td>
                    <td>{row.orderNo}</td>
                    <td>{row.customer}</td>
                    <td className="feelframe-dashboard-table__product">{row.product}</td>
                    <td>{row.orderedAt}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="feelframe-dashboard-side-stack">
          <section className="admin-list-box feelframe-dashboard-visitors">
            <div className="feelframe-dashboard-section-header">
              <h3 className="dashboard-section-title">오늘 방문손님 예정자 (2026/04/15일 기준)</h3>
              <button type="button" className="feelframe-dashboard-link">
                더보기 +
              </button>
            </div>
            {VISITOR_SCHEDULE.length > 0 ? (
              <table className="admin-table feelframe-dashboard-table feelframe-dashboard-table--compact">
                <thead>
                  <tr>
                    <th>성함</th>
                    <th>방문시간</th>
                  </tr>
                </thead>
                <tbody>
                  {VISITOR_SCHEDULE.map((row) => (
                    <tr key={`${row.name}-${row.time}`}>
                      <td>{row.name}</td>
                      <td>{row.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="feelframe-dashboard-empty">당일 방문손님 고객님이 없습니다.</p>
            )}
          </section>

          <section className="admin-list-box feelframe-dashboard-inquiry">
            <div className="feelframe-dashboard-section-header">
              <h3 className="dashboard-section-title">문의내역</h3>
              <button type="button" className="feelframe-dashboard-link">
                더보기 +
              </button>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table feelframe-dashboard-table feelframe-dashboard-table--compact">
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>내용</th>
                    <th>작성자</th>
                    <th>진행상황</th>
                  </tr>
                </thead>
                <tbody>
                  {INQUIRIES.map((row, index) => (
                    <tr key={`${row.manager}-${index}`}>
                      <td>{row.type}</td>
                      <td>{row.content}</td>
                      <td>{row.manager}</td>
                      <td>
                        <button type="button" className="admin-link feelframe-dashboard-answer-link">
                          {row.status}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
