import { HiDevicePhoneMobile, HiSquares2X2, HiUsers, HiVideoCamera } from 'react-icons/hi2';
import type { IconType } from 'react-icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminHomePage.css';

type WeeklyStat = {
  week: string;
  sales: number;
  members: number;
};

type HomeMenuCard = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  path: string;
  icon: IconType;
  weeklyStats: WeeklyStat[];
  showChart?: boolean;
  loginHistory?: { user: string; at: string; ip: string }[];
};

type ChartPoint = { x: number; y: number };

const CHART_WIDTH = 240;
const CHART_HEIGHT = 200;
const CHART_PADDING = 12;

function getChartPoints(values: number[], width: number, height: number, padding = CHART_PADDING): ChartPoint[] {
  if (values.length === 0) return [];

  if (values.length === 1) {
    const x = width / 2;
    const y = height / 2;
    return [{ x, y }];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values.map((value, index) => {
    const x = padding + (innerWidth * index) / (values.length - 1);
    const y = padding + innerHeight - ((value - min) / range) * innerHeight;
    return { x, y };
  });
}

function pointsToPath(points: ChartPoint[]) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function getAxisTicks(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mid = Math.round((max + min) / 2);
  return [max, mid, min];
}

function formatMonthDay(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getRecentWeeklyRanges(weeks = 5) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: weeks }, (_, index) => {
    const offset = weeks - 1 - index;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - offset * 7);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    return `${formatMonthDay(startDate)}~${formatMonthDay(endDate)}`;
  });
}

const RECENT_WEEK_LABELS = getRecentWeeklyRanges(5);

function buildWeeklyStats(sales: number[], members: number[]): WeeklyStat[] {
  return RECENT_WEEK_LABELS.map((week, index) => ({
    week,
    sales: sales[index] ?? sales[sales.length - 1] ?? 0,
    members: members[index] ?? members[members.length - 1] ?? 0,
  }));
}

const HOME_MENU_CARDS: HomeMenuCard[] = [
  {
    title: '필메이커',
    subtitle: '영상/보정',
    buttonLabel: '필메이커 이동',
    path: '/feelmaker',
    icon: HiVideoCamera,
    weeklyStats: buildWeeklyStats([34, 38, 44, 41, 52], [13, 14, 17, 16, 22]),
  },
  {
    title: '필프레임',
    subtitle: '액자',
    buttonLabel: '필프레임 이동',
    path: '/feelframe',
    icon: HiSquares2X2,
    weeklyStats: buildWeeklyStats([14, 16, 21, 24, 26], [7, 8, 11, 13, 14]),
  },
  {
    title: '필카드',
    subtitle: '모바일초대장',
    buttonLabel: '필카드 이동',
    path: '/feelmotion',
    icon: HiDevicePhoneMobile,
    weeklyStats: buildWeeklyStats([10, 12, 18, 20, 28], [8, 9, 14, 15, 19]),
  },
  {
    title: '관리자관리',
    subtitle: '권한/운영 설정',
    buttonLabel: '관리자관리 이동',
    path: '/admins',
    icon: HiUsers,
    weeklyStats: buildWeeklyStats([7, 8, 10, 12, 14], [4, 4, 5, 6, 7]),
    showChart: false,
    loginHistory: [
      { user: 'admin01', at: '04/14 10:32', ip: '121.167.***.***' },
      { user: 'manager02', at: '04/14 09:18', ip: '211.36.***.***' },
      { user: 'operator03', at: '04/13 18:44', ip: '59.10.***.***' },
      { user: 'admin01', at: '04/13 08:27', ip: '121.167.***.***' },
    ],
  },
];

export default function AdminHomePage() {
  const navigate = useNavigate();
  const [hoveredByCard, setHoveredByCard] = useState<Record<string, number | null>>({});
  const handleCardMove = (path: string) => navigate(path);

  return (
    <div className="admin-home">
      <div className="admin-home-header">
        <h2>FEEL 관리자</h2>
        <p>아래 영역에서 서비스를 선택해 주세요.</p>
      </div>
      <section className="admin-home-grid" aria-label="서비스 선택 메뉴">
        {HOME_MENU_CARDS.map((card) => {
          const Icon = card.icon;
          const salesValues = card.weeklyStats.map((item) => item.sales);
          const membersValues = card.weeklyStats.map((item) => item.members);
          const salesTicks = getAxisTicks(salesValues);
          const memberTicks = getAxisTicks(membersValues);
          const salesPoints = getChartPoints(salesValues, CHART_WIDTH, CHART_HEIGHT);
          const membersPoints = getChartPoints(membersValues, CHART_WIDTH, CHART_HEIGHT);
          const hoveredIndex = hoveredByCard[card.path] ?? null;
          const hoveredStat = hoveredIndex !== null ? card.weeklyStats[hoveredIndex] : null;

          return (
            <article
              key={card.path}
              className="admin-home-card"
              role="button"
              tabIndex={0}
              onClick={() => handleCardMove(card.path)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleCardMove(card.path);
                }
              }}
            >
              <div className="admin-home-card-icon-wrap" aria-hidden>
                <Icon className="admin-home-card-icon" />
              </div>
              <h3>{card.title}</h3>
              <p>{card.subtitle}</p>
              {card.showChart !== false && (
                <div className="admin-home-chart-wrap" aria-label={`${card.title} 주별 매출 및 회원수`}>
                  <div className="admin-home-chart-legend">
                    <span className="legend-item legend-item--sales">매출</span>
                    <span className="legend-item legend-item--members">회원수</span>
                  </div>
                  <div
                    className="admin-home-chart-panel"
                    onMouseLeave={() => setHoveredByCard((prev) => ({ ...prev, [card.path]: null }))}
                  >
                    <div className="chart-axis chart-axis--left" aria-hidden>
                      {salesTicks.map((tick) => (
                        <span key={`${card.path}-sales-${tick}`}>{tick}만</span>
                      ))}
                    </div>
                    <div className="admin-home-chart-canvas">
                      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="admin-home-chart" role="img" aria-label="주별 추이 그래프">
                        <path d={pointsToPath(salesPoints)} className="chart-line chart-line--sales" />
                        <path d={pointsToPath(membersPoints)} className="chart-line chart-line--members" />
                        {hoveredIndex !== null && salesPoints[hoveredIndex] && membersPoints[hoveredIndex] && (
                          <>
                            <line
                              x1={salesPoints[hoveredIndex].x}
                              y1={CHART_PADDING}
                              x2={salesPoints[hoveredIndex].x}
                              y2={CHART_HEIGHT - CHART_PADDING}
                              className="chart-hover-guide"
                            />
                            <circle
                              cx={salesPoints[hoveredIndex].x}
                              cy={salesPoints[hoveredIndex].y}
                              r="3.5"
                              className="chart-point chart-point--sales"
                            />
                            <circle
                              cx={membersPoints[hoveredIndex].x}
                              cy={membersPoints[hoveredIndex].y}
                              r="3.5"
                              className="chart-point chart-point--members"
                            />
                          </>
                        )}
                        {salesPoints.map((point, index) => {
                          const left =
                            index === 0 ? 0 : (salesPoints[index - 1].x + point.x) / 2;
                          const right =
                            index === salesPoints.length - 1
                              ? CHART_WIDTH
                              : (point.x + salesPoints[index + 1].x) / 2;
                          return (
                            <rect
                              key={`${card.path}-hit-${card.weeklyStats[index].week}`}
                              className="chart-hit-area"
                              x={left}
                              y={0}
                              width={right - left}
                              height={CHART_HEIGHT}
                              onMouseEnter={() =>
                                setHoveredByCard((prev) => ({ ...prev, [card.path]: index }))
                              }
                            />
                          );
                        })}
                      </svg>
                      {hoveredStat && hoveredIndex !== null && salesPoints[hoveredIndex] && (
                        <div
                          className="admin-home-chart-tooltip"
                          style={{ left: `${(salesPoints[hoveredIndex].x / CHART_WIDTH) * 100}%` }}
                        >
                          {`${hoveredStat.week} · 매출 ${hoveredStat.sales}만 / 회원수 ${hoveredStat.members}명`}
                        </div>
                      )}
                    </div>
                    <div className="chart-axis chart-axis--right" aria-hidden>
                      {memberTicks.map((tick) => (
                        <span key={`${card.path}-members-${tick}`}>{tick}명</span>
                      ))}
                    </div>
                  </div>
                  <div className="admin-home-chart-weeks">
                    {card.weeklyStats.map((item) => (
                      <span key={`${card.path}-${item.week}`}>{item.week}</span>
                    ))}
                  </div>
                </div>
              )}
              {card.showChart === false && card.loginHistory && (
                <div className="admin-home-login-history" aria-label="최근 관리자 로그인 이력">
                  <strong className="admin-home-login-history-title">최근 로그인 이력</strong>
                  <ul>
                    {card.loginHistory.map((item) => (
                      <li key={`${item.user}-${item.at}-${item.ip}`}>
                        <span>{item.user}</span>
                        <span>{item.at}</span>
                        <span>{item.ip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                className="admin-home-card-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  handleCardMove(card.path);
                }}
              >
                {card.buttonLabel}
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
