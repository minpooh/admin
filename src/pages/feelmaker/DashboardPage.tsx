import { useState } from 'react';
import { HiBanknotes, HiShoppingCart, HiUserPlus, HiFilm } from 'react-icons/hi2';
import './DashboardPage.css';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// 목업 데이터
const CARD_DATA = {
  todaySales: 2845000,
  orderCount: 127,
  newMembers: 43,
  soldVideoCount: 89,
};

// 전일 대비 (목업): 양수 = 증가, 음수 = 감소
const CARD_COMPARE = {
  todaySales: 5.2,
  orderCount: -3.1,
  newMembers: 12.4,
  soldVideoCount: 8.7,
};

const DAILY_SALES: { label: string; 매출: number }[] = [
  { label: '3/6', 매출: 120 },
  { label: '3/7', 매출: 180 },
  { label: '3/8', 매출: 150 },
  { label: '3/9', 매출: 220 },
  { label: '3/10', 매출: 190 },
  { label: '3/11', 매출: 260 },
  { label: '3/12', 매출: 284 },
];

const MONTHLY_SALES: { label: string; 매출: number }[] = [
  { label: '9월', 매출: 420 },
  { label: '10월', 매출: 580 },
  { label: '11월', 매출: 620 },
  { label: '12월', 매출: 710 },
  { label: '1월', 매출: 650 },
  { label: '2월', 매출: 780 },
  { label: '3월', 매출: 284 },
];

const VIDEO_SALES = [
  { name: '3/6', 체험영상: 28, 구매영상: 17 },
  { name: '3/7', 체험영상: 35, 구매영상: 27 },
  { name: '3/8', 체험영상: 32, 구매영상: 26 },
  { name: '3/9', 체험영상: 41, 구매영상: 30 },
  { name: '3/10', 체험영상: 38, 구매영상: 27 },
  { name: '3/11', 체험영상: 48, 구매영상: 34 },
  { name: '3/12', 체험영상: 52, 구매영상: 75 },
];

const RECENT_ORDERS = [
  { id: 'ORD-2024-0127', product: '웨딩 영상 패키지', amount: 189000, date: '2024-03-12 14:32' },
  { id: 'ORD-2024-0126', product: '체험영상 1편', amount: 29000, date: '2024-03-12 13:15' },
  { id: 'ORD-2024-0125', product: '구매영상 3편', amount: 87000, date: '2024-03-12 11:48' },
  { id: 'ORD-2024-0124', product: '모바일 청첩장', amount: 45000, date: '2024-03-12 10:22' },
  { id: 'ORD-2024-0123', product: '웨딩 영상 패키지', amount: 189000, date: '2024-03-12 09:05' },
];

const POPULAR_VIDEOS = [
  { rank: 1, title: '클래식 웨딩 메인', count: 342 },
  { rank: 2, title: '감성 로맨스', count: 298 },
  { rank: 3, title: '미니멀 모던', count: 256 },
  { rank: 4, title: '네추럴 데이', count: 221 },
  { rank: 5, title: '빈티지 필름', count: 198 },
  { rank: 6, title: '러블리 페스티벌', count: 176 },
  { rank: 7, title: '시네마틱 드라마', count: 154 },
  { rank: 8, title: '스튜디오 심플', count: 142 },
  { rank: 9, title: '아웃도어 웨딩', count: 128 },
  { rank: 10, title: '가든 파티', count: 115 },
];

const CREATOR_PERFORMANCE = [
  { name: '크리에이터 A', 주문: 42, 매출: 1260000, 정산률: 98 },
  { name: '크리에이터 B', 주문: 38, 매출: 1140000, 정산률: 95 },
  { name: '크리에이터 C', 주문: 31, 매출: 930000, 정산률: 100 },
  { name: '크리에이터 D', 주문: 28, 매출: 840000, 정산률: 92 },
  { name: '크리에이터 E', 주문: 24, 매출: 720000, 정산률: 97 },
];

const ENTERPRISE_STATUS = [
  { company: 'A기업', 계약: '프리미엄', 주문: 15, 매출: 4500000 },
  { company: 'B기업', 계약: '스탠다드', 주문: 8, 매출: 2400000 },
  { company: 'C기업', 계약: '베이직', 주문: 5, 매출: 1500000 },
];

function formatCurrency(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n) + '원';
}

export default function DashboardPage() {
  const [salesView, setSalesView] = useState<'daily' | 'monthly'>('daily');

  return (
    <div className="dashboard-page">
      {/* 상단 카드 4개: 왼쪽 텍스트, 오른쪽 아이콘 */}
      <section className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">오늘 매출</span>
            <strong className="dashboard-card-value">{formatCurrency(CARD_DATA.todaySales)}</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.todaySales >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.todaySales >= 0 ? '+' : ''}{CARD_COMPARE.todaySales}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--sales" aria-hidden>
            <HiBanknotes size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">주문 수</span>
            <strong className="dashboard-card-value">{CARD_DATA.orderCount}건</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.orderCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.orderCount >= 0 ? '+' : ''}{CARD_COMPARE.orderCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--orders" aria-hidden>
            <HiShoppingCart size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">신규 회원 수</span>
            <strong className="dashboard-card-value">{CARD_DATA.newMembers}명</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.newMembers >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.newMembers >= 0 ? '+' : ''}{CARD_COMPARE.newMembers}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--members" aria-hidden>
            <HiUserPlus size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">판매된 영상 수</span>
            <strong className="dashboard-card-value">{CARD_DATA.soldVideoCount}편</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.soldVideoCount >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.soldVideoCount >= 0 ? '+' : ''}{CARD_COMPARE.soldVideoCount}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--videos" aria-hidden>
            <HiFilm size={24} />
          </span>
        </div>
      </section>

      {/* 매출 현황 + 영상 구매 수 그래프 (50% each, 반응형 시 세로 배치) */}
      <div className="dashboard-charts-row">
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

        <section className="dashboard-section">
          <h3 className="dashboard-section-title">영상 업로드 현황</h3>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={VIDEO_SALES} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="체험영상" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="구매영상" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* 2열: 최근 주문 + 인기영상 Top10 */}
      <div className="dashboard-grid-2">
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">최근 주문 목록</h3>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>주문번호</th>
                  <th>상품</th>
                  <th>금액</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.product}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">인기 영상 Top 10</h3>
          <ul className="dashboard-list">
            {POPULAR_VIDEOS.map((item) => (
              <li key={item.rank} className="dashboard-list-item">
                <span className="dashboard-list-rank">{item.rank}</span>
                <span className="dashboard-list-title">{item.title}</span>
                <span className="dashboard-list-value">{item.count}회</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* 2열: 크리에이터 성과 + 엔터프라이즈 현황 */}
      <div className="dashboard-grid-2">
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">크리에이터 성과</h3>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>크리에이터</th>
                  <th>주문</th>
                  <th>매출</th>
                  <th>정산률</th>
                </tr>
              </thead>
              <tbody>
                {CREATOR_PERFORMANCE.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.주문}건</td>
                    <td>{formatCurrency(row.매출)}</td>
                    <td>{row.정산률}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="dashboard-section">
          <h3 className="dashboard-section-title">엔터프라이즈 현황</h3>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>기업</th>
                  <th>계약</th>
                  <th>주문</th>
                  <th>매출</th>
                </tr>
              </thead>
              <tbody>
                {ENTERPRISE_STATUS.map((row) => (
                  <tr key={row.company}>
                    <td>{row.company}</td>
                    <td>{row.계약}</td>
                    <td>{row.주문}건</td>
                    <td>{formatCurrency(row.매출)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
