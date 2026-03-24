import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  HiFilm,
  HiSquares2X2,
  HiPhoto,
  HiUsers,
  HiCog6Tooth,
  HiChevronLeft,
  HiChevronRight,
  HiMagnifyingGlass,
  HiUser,
} from 'react-icons/hi2';
import type { FeelMakerSectionId } from './sidebarFeelMakerConfig';
import {
  FEELMAKER_SECTION_IDS,
  FEELMAKER_SECTION_CONFIG,
} from './sidebarFeelMakerConfig';
import type { FeelFrameSectionId } from './sidebarFeelFrameConfig';
import {
  FEELFRAME_SECTION_IDS,
  FEELFRAME_SECTION_CONFIG,
} from './sidebarFeelFrameConfig';
import { pagePath, isItemActive, type NavId } from '../routes';
import './Sidebar.css';
import logo from '../assets/FEEL_logo.png';

/** feelmaker / feelframe 패널에서 공통으로 쓰는 섹션 ID 타입 */
type SectionId = FeelMakerSectionId | FeelFrameSectionId;

const SIDEBAR_NAV: { id: NavId; icon: IconType; label: string }[] = [
  { id: 'feelmaker', icon: HiFilm, label: 'Maker' },
  { id: 'feelframe', icon: HiSquares2X2, label: 'Frame' },
  { id: 'feelmotion', icon: HiPhoto, label: 'Motion' },
  { id: 'admins', icon: HiUsers, label: 'Admins' },
];

const PANEL_TITLES: Record<NavId, string> = {
  feelmaker: '필메이커',
  feelframe: '필프레임',
  feelmotion: '필모션',
  admins: '관리자 관리',
};

/** 패널별 섹션 설정 (sectionIds + sectionConfig). 없으면 해당 패널은 섹션 리스트 없음 */
const PANEL_SECTIONS_CONFIG: Partial<
  Record<NavId, { sectionIds: SectionId[]; sectionConfig: typeof FEELMAKER_SECTION_CONFIG }>
> = {
  feelmaker: { sectionIds: FEELMAKER_SECTION_IDS, sectionConfig: FEELMAKER_SECTION_CONFIG },
  feelframe: { sectionIds: FEELFRAME_SECTION_IDS, sectionConfig: FEELFRAME_SECTION_CONFIG },
};

function LogoIcon() {
  return (
    <img src={logo} alt="FEEL logo" style={{ width: '80%', height: '80%' }} />
  );
}

type PanelSectionProps = {
  id: string;
  title: string;
  icon: IconType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

function PanelSection({ id, title, icon: Icon, isOpen, onToggle, children }: PanelSectionProps) {
  const accordionId = `accordion-${id}`;
  return (
    <section className="panel-section">
      <button
        type="button"
        className="panel-section-header"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={accordionId}
      >
        <Icon size={16} className="panel-section-title-icon" aria-hidden />
        <span className="panel-section-title">{title}</span>
        <HiChevronRight
          size={14}
          className={`panel-section-chevron ${isOpen ? 'open' : ''}`}
          aria-hidden
        />
      </button>
      <div id={accordionId} className={`panel-section-content ${isOpen ? 'open' : ''}`} role="region">
        {children}
      </div>
    </section>
  );
}

const INITIAL_OPEN_SECTIONS: Record<SectionId, boolean> = {
  orderManagement: false,
  crawling: false,
  customerManagement: false,
  reviewManagement: false,
  errorManagement: false,
  productManagement: false,
  homepageManagement: false,
  enterpriseManagement: false,
  creatorManagement: false,
  uploadManagement: false,
  deliveryManagement: false,
  salesManagement: false,
  questionManagement: false,
};

export default function Sidebar() {
  const navigate = useNavigate();
  const { navId: paramNavId, sectionId: paramSectionId, itemId: paramItemId, subId: paramSubId } = useParams<{
    navId?: string;
    sectionId?: string;
    itemId?: string;
    subId?: string;
  }>();

  const activeNavId: NavId = (paramNavId as NavId) || 'feelmaker';
  const currentParams = {
    navId: activeNavId,
    sectionId: paramSectionId,
    itemId: paramItemId,
    subId: paramSubId,
  };

  const [openSections, setOpenSections] = useState<Record<SectionId, boolean>>(INITIAL_OPEN_SECTIONS);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const togglePanel = () => setIsPanelOpen((prev) => !prev);

  const currentPanelConfig = PANEL_SECTIONS_CONFIG[activeNavId];
  const collapsedSectionList = currentPanelConfig?.sectionConfig ?? [];

  useEffect(() => {
    if (paramSectionId) {
      setOpenSections((prev) => ({ ...prev, [paramSectionId as SectionId]: true }));
    }
  }, [paramSectionId]);

  useEffect(() => {
    if (!paramSectionId || !paramItemId) return;
    const subItemKeyPrefix =
      currentPanelConfig?.sectionConfig.find((s) => s.id === paramSectionId)?.subItemKeyPrefix ??
      paramSectionId;
    const parentItemId =
      paramSectionId === 'orderManagement' && paramItemId === 'orderTestVideo'
        ? 'orderVideo'
        : paramItemId;
    setExpandedItem(`${subItemKeyPrefix}-${parentItemId}`);
  }, [paramSectionId, paramItemId, currentPanelConfig?.sectionConfig]);

  const toggleSection = (id: SectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNavClick = (navId: NavId) => {
    navigate(pagePath({ navId }));
  };

  const handlePanelItemClick = (sectionId: string, itemId: string) => {
    navigate(pagePath({ navId: activeNavId, sectionId, itemId }));
  };

  const handleSubItemClick = (sectionId: string, parentItemId: string, targetSubId: string) => {
    // 모바일초대장만 subId 기반 라우팅 사용
    if (sectionId === 'orderManagement' && parentItemId === 'orderInvi') {
      navigate(pagePath({ navId: activeNavId, sectionId, itemId: parentItemId, subId: targetSubId }));
      return;
    }

    // 그 외 메뉴(예: 영상)는 기존처럼 itemId 전환
    navigate(pagePath({ navId: activeNavId, sectionId, itemId: targetSubId }));
  };

  return (
    <div className={`sidebar ${!isPanelOpen ? 'panel-collapsed' : ''}`} data-name="Container">
      {/* Left icon bar */}
      <aside className="sidebar-icon-bar">
        <div className="sidebar-logo">
          <LogoIcon />
        </div>
        <nav className="sidebar-nav">
          {SIDEBAR_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-item ${activeNavId === item.id ? 'active' : ''}`}
              aria-label={item.label}
              aria-current={activeNavId === item.id ? 'true' : undefined}
              onClick={() => handleNavClick(item.id)}
            >
              <item.icon size={16} />
              <span className="sidebar-nav-item-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="sidebar-nav-item" aria-label="Settings">
            <HiCog6Tooth size={16} />
          </button>
          <button type="button" className="sidebar-user" aria-label="User">
            <HiUser size={16} />
          </button>
        </div>
      </aside>

      {/* Right nav panel */}
      <div className={`sidebar-panel ${!isPanelOpen ? 'sidebar-panel--collapsed' : ''}`} aria-hidden={!isPanelOpen}>
        <header className="panel-header">
          <h1 className="panel-title">{PANEL_TITLES[activeNavId]}</h1>
          <button
            type="button"
            className="panel-back"
            onClick={togglePanel}
            aria-label={isPanelOpen ? '사이드바 접기' : '사이드바 펼치기'}
            aria-expanded={isPanelOpen}
          >
            {isPanelOpen ? <HiChevronLeft size={16} /> : <HiChevronRight size={16} />}
          </button>
        </header>

        <div className="panel-search">
          <HiMagnifyingGlass size={16} className="panel-search-icon" />
          <input
            type="search"
            placeholder="메뉴 이름으로 검색..."
            className="panel-search-input"
            aria-label="메뉴 이름으로 검색"
          />
        </div>

        {/* 접혔을 때만 보이는 섹션 아이콘 */}
        <div className={`panel-section-icons ${!isPanelOpen ? 'panel-section-icons--visible' : ''}`} aria-hidden={isPanelOpen}>
          {collapsedSectionList.map(({ id, title, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className="panel-section-icon-btn"
              onClick={() => !isPanelOpen && togglePanel()}
              aria-label={title}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="panel-sections">
          {currentPanelConfig?.sectionIds.map((sectionId) => {
            const section = currentPanelConfig.sectionConfig.find((s) => s.id === sectionId);
            if (!section?.items) return null;
            const subItemKeyPrefix = section.subItemKeyPrefix ?? section.id;
            return (
              <PanelSection
                key={sectionId}
                id={sectionId}
                title={section.title}
                icon={section.icon}
                isOpen={openSections[sectionId]}
                onToggle={() => toggleSection(sectionId)}
              >
                <ul className="panel-list">
                  {section.items.map((item) => {
                    const isOrderVideoGroup =
                      sectionId === 'orderManagement' &&
                      item.id === 'orderVideo' &&
                      (paramItemId === 'orderVideo' || paramItemId === 'orderTestVideo');
                    const itemActive =
                      isOrderVideoGroup ||
                      isItemActive(currentParams, activeNavId, sectionId, item.id);
                    const itemKey = `${subItemKeyPrefix}-${item.id}`;
                    const isExpanded = expandedItem === itemKey || isOrderVideoGroup;
                    return (
                      <li key={item.id}>
                        {section.expandable ? (
                          <div className="panel-item-wrapper">
                            <button
                              type="button"
                              className={`panel-item ${itemActive && !paramSubId ? 'active' : ''}`}
                              onClick={() => {
                                handlePanelItemClick(sectionId, item.id);
                                if (item.subItems) {
                                  setExpandedItem((prev) => (prev === itemKey ? null : itemKey));
                                }
                              }}
                            >
                              <item.icon size={16} />
                              <span>{item.label}</span>
                              {item.subItems && (
                                <HiChevronRight
                                  size={14}
                                  className={`panel-item-chevron ${isExpanded ? 'open' : ''}`}
                                />
                              )}
                            </button>
                            {isExpanded && item.subItems && (
                              <ul className="panel-sublist">
                                {item.subItems.map((sub) => {
                                  const resolvedSubId = sub.id ?? sub.label;
                                  const isOrderInviSubRoute =
                                    sectionId === 'orderManagement' && item.id === 'orderInvi';
                                  const subActive = isOrderInviSubRoute
                                    ? paramSectionId === sectionId &&
                                      paramItemId === item.id &&
                                      paramSubId === resolvedSubId
                                    : !paramSubId &&
                                      paramSectionId === sectionId &&
                                      paramItemId === resolvedSubId;
                                  return (
                                    <li key={resolvedSubId}>
                                      <button
                                        type="button"
                                        className={`panel-subitem ${subActive ? 'active' : ''}`}
                                        onClick={() =>
                                          handleSubItemClick(sectionId, item.id, resolvedSubId)
                                        }
                                      >
                                        {sub.label}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        ) : (
                          <div>
                            <button
                              type="button"
                              className={`panel-item ${itemActive ? 'active' : ''}`}
                              onClick={() => handlePanelItemClick(sectionId, item.id)}
                            >
                              <item.icon size={14} />
                              <span>{item.label}</span>
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </PanelSection>
            );
          })}
        </div>
      </div>
    </div>
  );
}
