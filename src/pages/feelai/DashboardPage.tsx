import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCircleStack,
  HiComputerDesktop,
  HiCurrencyDollar,
  HiPencilSquare,
} from 'react-icons/hi2';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { pagePath } from '../../routes';
import { FEELAI_SECTION_CONFIG } from '../../components/Sidebar/sidebarFeelAiConfig';
import '../../styles/dashboardCommon.css';
import '../../styles/adminPage.css';
import './DashboardPage.css';
import {
  getChargeGradeShortName,
  MOCK_TOKEN_MAKER_ORDERS,
  type TokenMakerPaymentStatus,
} from './tokenManagement/mock/tokenMaker.mock';
import { MOCK_TOKEN_STORE_ORDERS, type TokenStoreChargeStatus } from './tokenManagement/mock/tokenStore.mock';
import { MOCK_WORK_HISTORY_INTRO_ITEMS, type WorkHistoryIntroStatus } from './workHistoryManagement/mock/workHistoryIntro.mock';
import { MOCK_WORK_HISTORY_RETOUCH_ITEMS } from './workHistoryManagement/mock/workHistoryRetouch.mock';
import { MOCK_WORK_HISTORY_PHOTO_ITEMS, type WorkHistoryPhotoStatus } from './workHistoryManagement/mock/workHistoryPhoto.mock';
import { MOCK_MOTION_PHOTO_SERVER_ITEMS, type MotionPhotoServerStatus } from './pcManagement/mock/motionPhotoServer.mock';
import { MOCK_INTRO_WAN22_ITEMS, type IntroWan22Status } from './pcManagement/mock/introWan22.mock';

const CARD_COMPARE = {
  sales: 8.4,
  orders: 3.2,
  works: -2.1,
  servers: 12.0,
};

const QUICK_MENU_TONES = [
  'feelai-dashboard-quick-menu-icon--yellow',
  'feelai-dashboard-quick-menu-icon--blue',
  'feelai-dashboard-quick-menu-icon--green',
  'feelai-dashboard-quick-menu-icon--purple',
  'feelai-dashboard-quick-menu-icon--pink',
  'feelai-dashboard-quick-menu-icon--indigo',
  'feelai-dashboard-quick-menu-icon--gray',
  'feelai-dashboard-quick-menu-icon--teal',
] as const;

const QUICK_MENUS = FEELAI_SECTION_CONFIG.flatMap((section) =>
  section.items.map((item) => ({
    key: `${section.id}-${item.id}`,
    label: item.label,
    icon: item.icon,
    path: pagePath({ navId: 'feelai', sectionId: section.id, itemId: item.id }),
  }))
);

const WORK_STYLES = ['지브리', '픽사', '디즈니', '치비', '원본'] as const;
type WorkStyle = (typeof WORK_STYLES)[number];

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function dayLabel(value: string) {
  return `${Number(value.slice(5, 7))}/${Number(value.slice(8, 10))}`;
}

function monthLabel(value: string) {
  return `${Number(value.slice(5, 7))}월`;
}

function isPaidMaker(status: TokenMakerPaymentStatus) {
  return status === '결제완료';
}

function isPaidStore(status: TokenStoreChargeStatus) {
  return status === '충전완료';
}

function makerStatusClass(status: TokenMakerPaymentStatus) {
  if (status === '결제완료') return 'row-btn--status-secondary';
  if (status === '실패' || status === '취소') return 'row-btn--status-danger';
  return 'row-btn--status-warning';
}

function storeStatusClass(status: TokenStoreChargeStatus) {
  if (status === '충전완료') return 'row-btn--status-secondary';
  if (status === '취소회수' || status === '주문이상') return 'row-btn--status-danger';
  return 'row-btn--status-warning';
}

function introStatusClass(status: WorkHistoryIntroStatus) {
  if (status === '완료') return 'row-btn--status-secondary';
  if (status === '생성중') return 'row-btn--status-blue';
  if (status === '오류') return 'row-btn--status-danger';
  return 'row-btn--status-warning';
}

function photoStatusClass(status: WorkHistoryPhotoStatus) {
  if (status === '생성완료') return 'row-btn--status-secondary';
  if (status === '생성중') return 'row-btn--status-blue';
  return 'row-btn--status-danger';
}

function motionStatusClass(status: MotionPhotoServerStatus) {
  if (status === '완료') return 'row-btn--status-secondary';
  if (status === '작업중') return 'row-btn--status-blue';
  return 'row-btn--status-warning';
}

function wanStatusClass(status: IntroWan22Status) {
  if (status === '완료') return 'row-btn--status-secondary';
  if (status === '생성중') return 'row-btn--status-blue';
  if (status === '실패') return 'row-btn--status-danger';
  return 'row-btn--status-warning';
}

function isIntroInProgress(status: WorkHistoryIntroStatus) {
  return status === '생성중' || status === '제작중';
}

function isServerBusy(status: string) {
  return status === '작업중' || status === '생성중' || status === '대기중' || status === '대기';
}

function emptyStyleCounts(): Record<WorkStyle, number> {
  return { 지브리: 0, 픽사: 0, 디즈니: 0, 치비: 0, 원본: 0 };
}

export default function FeelaiDashboardPage() {
  const [salesView, setSalesView] = useState<'daily' | 'monthly'>('daily');

  const paidMakerOrders = useMemo(
    () => MOCK_TOKEN_MAKER_ORDERS.filter((order) => isPaidMaker(order.paymentStatus)),
    []
  );
  const paidStoreOrders = useMemo(
    () => MOCK_TOKEN_STORE_ORDERS.filter((order) => isPaidStore(order.chargeStatus)),
    []
  );

  const tokenSalesTotal = useMemo(() => {
    const maker = paidMakerOrders.reduce((sum, order) => sum + order.amount, 0);
    const store = paidStoreOrders.reduce((sum, order) => sum + order.amount, 0);
    return maker + store;
  }, [paidMakerOrders, paidStoreOrders]);

  const tokenOrderCount = MOCK_TOKEN_MAKER_ORDERS.length + MOCK_TOKEN_STORE_ORDERS.length;
  const workCount =
    MOCK_WORK_HISTORY_INTRO_ITEMS.length +
    MOCK_WORK_HISTORY_RETOUCH_ITEMS.length +
    MOCK_WORK_HISTORY_PHOTO_ITEMS.length;
  const inProgressWorkCount =
    MOCK_WORK_HISTORY_INTRO_ITEMS.filter((item) => isIntroInProgress(item.status)).length +
    MOCK_WORK_HISTORY_PHOTO_ITEMS.filter((item) => item.status === '생성중').length;
  const busyServerCount =
    MOCK_MOTION_PHOTO_SERVER_ITEMS.filter((item) => isServerBusy(item.status)).length +
    MOCK_INTRO_WAN22_ITEMS.filter((item) => isServerBusy(item.status)).length;

  const dailySales = useMemo(() => {
    const map = new Map<string, { 필메: number; 스팜: number }>();
    paidMakerOrders.forEach((order) => {
      const key = order.orderedAt.slice(0, 10);
      const current = map.get(key) ?? { 필메: 0, 스팜: 0 };
      current.필메 += order.amount;
      map.set(key, current);
    });
    paidStoreOrders.forEach((order) => {
      const key = order.orderedAt.slice(0, 10);
      const current = map.get(key) ?? { 필메: 0, 스팜: 0 };
      current.스팜 += order.amount;
      map.set(key, current);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, value]) => ({
        label: dayLabel(date),
        필메: Math.round(value.필메 / 10000),
        스팜: Math.round(value.스팜 / 10000),
      }));
  }, [paidMakerOrders, paidStoreOrders]);

  const monthlySales = useMemo(() => {
    const map = new Map<string, { 필메: number; 스팜: number }>();
    paidMakerOrders.forEach((order) => {
      const key = order.orderedAt.slice(0, 7);
      const current = map.get(key) ?? { 필메: 0, 스팜: 0 };
      current.필메 += order.amount;
      map.set(key, current);
    });
    paidStoreOrders.forEach((order) => {
      const key = order.orderedAt.slice(0, 7);
      const current = map.get(key) ?? { 필메: 0, 스팜: 0 };
      current.스팜 += order.amount;
      map.set(key, current);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        label: monthLabel(`${date}-01`),
        필메: Math.round(value.필메 / 10000),
        스팜: Math.round(value.스팜 / 10000),
      }));
  }, [paidMakerOrders, paidStoreOrders]);

  const workVolumeByStyle = useMemo(() => {
    const introCounts = emptyStyleCounts();
    const photoCounts = emptyStyleCounts();
    MOCK_WORK_HISTORY_INTRO_ITEMS.forEach((item) => {
      introCounts[item.style] += 1;
    });
    MOCK_WORK_HISTORY_PHOTO_ITEMS.forEach((item) => {
      photoCounts[item.style] += 1;
    });
    return WORK_STYLES.map((style) => ({
      name: style,
      인트로: introCounts[style],
      모션포토: photoCounts[style],
    }));
  }, []);

  const recentTokenOrders = useMemo(() => {
    const makerRows = MOCK_TOKEN_MAKER_ORDERS.map((order) => ({
      id: `maker-${order.id}`,
      channel: '필메' as const,
      orderNo: order.orderNo,
      customer: order.customerName,
      product: getChargeGradeShortName(order.chargeGrade),
      amount: order.amount,
      status: order.paymentStatus,
      statusClass: makerStatusClass(order.paymentStatus),
      at: order.orderedAt,
    }));
    const storeRows = MOCK_TOKEN_STORE_ORDERS.map((order) => ({
      id: `store-${order.id}`,
      channel: '스팜' as const,
      orderNo: order.orderNo,
      customer: order.chargeAccountName,
      product: order.optionName,
      amount: order.amount,
      status: order.chargeStatus,
      statusClass: storeStatusClass(order.chargeStatus),
      at: order.orderedAt,
    }));
    return [...makerRows, ...storeRows].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  }, []);

  const recentWorks = useMemo(() => {
    const introRows = MOCK_WORK_HISTORY_INTRO_ITEMS.map((item) => ({
      id: `intro-${item.id}`,
      type: '인트로',
      workNo: item.workId,
      customer: item.customerName,
      status: item.status,
      statusClass: introStatusClass(item.status),
      at: item.registeredAt,
    }));
    const retouchRows = MOCK_WORK_HISTORY_RETOUCH_ITEMS.map((item) => ({
      id: `retouch-${item.id}`,
      type: '사진보정',
      workNo: item.accountId,
      customer: item.accountId,
      status: `${item.savedRetouchCount}/${item.photoCount}장`,
      statusClass: 'row-btn--status-secondary',
      at: item.lastActivityAt,
    }));
    const photoRows = MOCK_WORK_HISTORY_PHOTO_ITEMS.map((item) => ({
      id: `photo-${item.id}`,
      type: '모션포토',
      workNo: item.orderNo,
      customer: item.customerName,
      status: item.status,
      statusClass: photoStatusClass(item.status),
      at: item.createdAt,
    }));
    return [...introRows, ...retouchRows, ...photoRows].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
  }, []);

  const serverJobs = useMemo(() => {
    const motionRows = MOCK_MOTION_PHOTO_SERVER_ITEMS.map((item) => ({
      id: `mps-${item.id}`,
      type: '모션포토',
      workNo: item.taskId,
      account: item.accountId,
      status: item.status,
      statusClass: motionStatusClass(item.status),
      progress: item.progress,
      at: item.requestedAt,
      busy: isServerBusy(item.status),
    }));
    const wanRows = MOCK_INTRO_WAN22_ITEMS.map((item) => ({
      id: `wan-${item.id}`,
      type: 'wan 2.2',
      workNo: item.workNo,
      account: item.customerId,
      status: item.status,
      statusClass: wanStatusClass(item.status),
      progress: item.progress,
      at: item.producedAt,
      busy: isServerBusy(item.status),
    }));
    return [...motionRows, ...wanRows]
      .sort((a, b) => Number(b.busy) - Number(a.busy) || b.at.localeCompare(a.at))
      .slice(0, 6);
  }, []);

  return (
    <div className="dashboard-page feelai-dashboard-page">
      <section className="dashboard-cards">
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">토큰 매출</span>
            <strong className="dashboard-card-value">{formatCurrency(tokenSalesTotal)}</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.sales >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.sales >= 0 ? '+' : ''}
              {CARD_COMPARE.sales}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--sales" aria-hidden>
            <HiCurrencyDollar size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">토큰 주문</span>
            <strong className="dashboard-card-value">{formatCount(tokenOrderCount)}건</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.orders >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.orders >= 0 ? '+' : ''}
              {CARD_COMPARE.orders}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--orders" aria-hidden>
            <HiCircleStack size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">작업내역</span>
            <strong className="dashboard-card-value">{formatCount(workCount)}건</strong>
            <span className="dashboard-card-compare">진행중 {formatCount(inProgressWorkCount)}건</span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--members" aria-hidden>
            <HiPencilSquare size={24} />
          </span>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <span className="dashboard-card-label">서버 작업중</span>
            <strong className="dashboard-card-value">{formatCount(busyServerCount)}건</strong>
            <span className={`dashboard-card-compare ${CARD_COMPARE.servers >= 0 ? 'up' : 'down'}`}>
              전일 대비 {CARD_COMPARE.servers >= 0 ? '+' : ''}
              {CARD_COMPARE.servers}%
            </span>
          </div>
          <span className="dashboard-card-icon dashboard-card-icon--videos" aria-hidden>
            <HiComputerDesktop size={24} />
          </span>
        </div>
      </section>

      <section className="admin-list-box feelai-dashboard-quick-menu">
        <ul className="feelai-dashboard-quick-menu-list">
          {QUICK_MENUS.map((menu, index) => {
            const Icon = menu.icon;
            return (
              <li key={menu.key}>
                <Link to={menu.path} className="feelai-dashboard-quick-menu-item">
                  <span className={`feelai-dashboard-quick-menu-icon ${QUICK_MENU_TONES[index % QUICK_MENU_TONES.length]}`}>
                    <Icon size={14} />
                  </span>
                  <span className="feelai-dashboard-quick-menu-label">{menu.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="dashboard-charts-row">
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">토큰 매출 현황</h3>
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
              <AreaChart data={salesView === 'daily' ? dailySales : monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}만`} />
                <Tooltip formatter={(value) => [`${Number(value)}만 원`]} />
                <Legend />
                <Area type="monotone" dataKey="필메" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                <Area type="monotone" dataKey="스팜" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="dashboard-section">
          <h3 className="dashboard-section-title">작업내역 현황</h3>
          <div className="dashboard-chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={workVolumeByStyle}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                barCategoryGap="32%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="인트로" fill="#818cf8" maxBarSize={18} radius={[4, 4, 0, 0]} />
                <Bar dataKey="모션포토" fill="#4f46e5" maxBarSize={18} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="dashboard-grid-2">
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">최근 토큰 주문</h3>
            <Link
              to={pagePath({ navId: 'feelai', sectionId: 'tokenManagement', itemId: 'tokenMaker' })}
              className="feelai-dashboard-link"
            >
              더보기 +
            </Link>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>채널</th>
                  <th>주문번호</th>
                  <th>고객</th>
                  <th>상품</th>
                  <th>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentTokenOrders.map((row) => (
                  <tr key={row.id}>
                    <td>{row.channel}</td>
                    <td>{row.orderNo}</td>
                    <td>{row.customer}</td>
                    <td>{row.product}</td>
                    <td>{formatCurrency(row.amount)}</td>
                    <td>
                      <span className={`row-btn ${row.statusClass}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h3 className="dashboard-section-title">최근 작업내역</h3>
            <Link
              to={pagePath({ navId: 'feelai', sectionId: 'workHistoryManagement', itemId: 'workHistoryIntro' })}
              className="feelai-dashboard-link"
            >
              더보기 +
            </Link>
          </div>
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>구분</th>
                  <th>작업번호</th>
                  <th>고객</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentWorks.map((row) => (
                  <tr key={row.id}>
                    <td>{row.type}</td>
                    <td>{row.workNo}</td>
                    <td>{row.customer}</td>
                    <td>
                      <span className={`row-btn ${row.statusClass}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h3 className="dashboard-section-title">PC 서버 현황</h3>
          <Link
            to={pagePath({ navId: 'feelai', sectionId: 'pcManagement', itemId: 'motionPhotoServer' })}
            className="feelai-dashboard-link"
          >
            더보기 +
          </Link>
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>작업번호</th>
                <th>계정</th>
                <th>상태</th>
                <th>진행률</th>
                <th>요청/제작</th>
              </tr>
            </thead>
            <tbody>
              {serverJobs.map((row) => (
                <tr key={row.id}>
                  <td>{row.type}</td>
                  <td>{row.workNo}</td>
                  <td>{row.account}</td>
                  <td>
                    <span className={`row-btn ${row.statusClass}`}>{row.status}</span>
                  </td>
                  <td>{row.progress}%</td>
                  <td>{row.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
