import type { IconType } from 'react-icons';
import {
  HiVideoCamera,
  HiDevicePhoneMobile,
  HiPencil,
  HiPlay,
  HiBuildingStorefront,
  HiCircleStack,
  HiClock,
  HiQuestionMarkCircle,
  HiChatBubbleLeftRight,
  HiClipboardDocumentList,
  HiStar,
  HiUser,
  HiTicket,
  HiHandRaised,
  HiCube,
  HiTag,
  HiHashtag,
  HiRectangleGroup,
  HiArrowsPointingOut,
  HiCake,
  HiMegaphone,
  HiChartBar,
  HiDocumentText,
  HiListBullet,
  HiPresentationChartLine,
  HiShoppingBag,
  HiGlobeAlt,
  HiNoSymbol,
  HiUserCircle,
  HiArchiveBox,
  HiHome,
  HiBriefcase,
} from 'react-icons/hi2';

export const ORDER_MANAGEMENT = [
  {
    id: 'orderVideo',
    icon: HiVideoCamera,
    label: '영상',
    subItems: [
      { id: 'orderVideo', label: '구매영상' },
      { id: 'orderTestVideo', label: '체험영상' },
    ],
  },
  {
    id: 'orderInvi',
    icon: HiDevicePhoneMobile,
    label: '모바일초대장',
    subItems: [
      { id: 'wedding', label: '웨딩청첩장' },
      { id: 'baby', label: '돌잔치초대장' },
    ],
  },
  {
    id: 'orderPhoto',
    icon: HiPencil,
    label: '보정',
    subItems: [
      { id: 'orderEditPage', label: '필메이커' },
      { id: 'orderEditStorePage', label: '스팜 필모션' },
      { id: 'orderEditSamplePage', label: '스팜 샘플' },
    ],
  },
  { id: 'orderVideoMixPage', icon: HiPlay, label: '비디오믹스' },
];

export const CRAWLING = [
  { id: 'storefarmMaker', icon: HiVideoCamera, label: '스팜 영상' },
  { id: 'storefarmCard', icon: HiDevicePhoneMobile, label: '스팜 모청' },
  { id: 'storefarmMotion', icon: HiPencil, label: '스팜 보정' },
];

export const ERROR_MANAGEMENT = [
  { id: 'storefarmError', icon: HiBuildingStorefront, label: '스팜 오류(필요한지 확인)' },
  { id: 'orderError', icon: HiCircleStack, label: '주문 오류' },
  { id: 'delayError', icon: HiClock, label: '제작 지연' },
];

export const REVIEW_MANAGEMENT = [
  { id: 'inquiry', icon: HiChatBubbleLeftRight, label: '1:1 문의' },
  { id: 'faq', icon: HiClipboardDocumentList, label: 'FAQ' },
  { id: 'review', icon: HiStar, label: '리뷰 관리' },
];

export const CUSTOMER_MANAGEMENT = [
  { id: 'customerList', icon: HiUser, label: '회원 리스트' },
  { id: 'couponList', icon: HiTicket, label: '쿠폰 리스트' },
  { id: 'groupList', icon: HiHandRaised, label: '공동구매 리스트' },
];

export const PRODUCT_MANAGEMENT = [
  { id: 'productList', icon: HiCube, label: '상품 리스트' },
  { id: 'productCategory', icon: HiTag, label: '카테고리 관리' },
  { id: 'productTag', icon: HiHashtag, label: '태그 관리' },
];

export const HOMEPAGE_MANAGEMENT = [
  { id: 'bannerList', icon: HiRectangleGroup, label: '배너 관리' },
  { id: 'popupList', icon: HiArrowsPointingOut, label: '팝업 관리' },
  { id: 'eventList', icon: HiCake, label: '이벤트 관리' },
  { id: 'noticeList', icon: HiMegaphone, label: '공지 관리' },
];

export const ENTERPRISE_MANAGEMENT = [
  { id: 'enterpriseList', icon: HiChartBar, label: '기업 리스트' },
  { id: 'enterpriseInvoice', icon: HiDocumentText, label: '세금 계산서' },
  { id: 'enterpriseInquiry', icon: HiQuestionMarkCircle, label: '기업 문의' },
];

export const CREATOR_MANAGEMENT = [
  { id: 'creatorList', icon: HiPresentationChartLine, label: '크리에이터 리스트' },
  { id: 'creatorInvoice', icon: HiDocumentText, label: '정산 관리' },
  { id: 'creatorTemplate', icon: HiVideoCamera, label: '템플릿 관리' },
  { id: 'creatorBoard', icon: HiListBullet, label: '게시판 관리' },
];

export type FeelMakerSectionId =
  | 'orderManagement'
  | 'crawling'
  | 'customerManagement'
  | 'reviewManagement'
  | 'errorManagement'
  | 'productManagement'
  | 'homepageManagement'
  | 'enterpriseManagement'
  | 'creatorManagement';

export type FeelMakerSectionConfigItem = {
  id: string;
  title: string;
  icon: IconType;
  /** 있으면 feelmaker 패널에서 아코디언 + 리스트로 표시 */
  items?: { id: string; icon: IconType; label: string; active?: boolean; subItems?: { id?: string; label: string }[] }[];
  expandable?: boolean;
  subItemKeyPrefix?: string;
};

/** feelmaker 패널에 실제로 표시할 섹션 ID (순서) */
export const FEELMAKER_SECTION_IDS: FeelMakerSectionId[] = [
  'orderManagement',
  'crawling',
  'errorManagement',
  'reviewManagement',
  'customerManagement',
  'productManagement',
  'homepageManagement',
  'enterpriseManagement',
  'creatorManagement',
];

export const FEELMAKER_SECTION_CONFIG: FeelMakerSectionConfigItem[] = [
  { id: 'orderManagement', title: '주문관리', icon: HiShoppingBag, items: ORDER_MANAGEMENT, expandable: true, subItemKeyPrefix: 'page' },
  { id: 'crawling', title: '크롤링', icon: HiGlobeAlt, items: CRAWLING, expandable: true, subItemKeyPrefix: 'report' },
  { id: 'errorManagement', title: '오류관리', icon: HiNoSymbol, items: ERROR_MANAGEMENT, expandable: true },
  { id: 'reviewManagement', title: '문의/후기관리', icon: HiQuestionMarkCircle, items: REVIEW_MANAGEMENT, expandable: false },
  { id: 'customerManagement', title: '고객관리', icon: HiUserCircle, items: CUSTOMER_MANAGEMENT, expandable: true },
  { id: 'productManagement', title: '상품관리', icon: HiArchiveBox, items: PRODUCT_MANAGEMENT, expandable: true },
  { id: 'homepageManagement', title: '홈페이지관리', icon: HiHome, items: HOMEPAGE_MANAGEMENT, expandable: true },
  { id: 'enterpriseManagement', title: '엔터프라이즈관리', icon: HiBriefcase, items: ENTERPRISE_MANAGEMENT, expandable: true },
  { id: 'creatorManagement', title: '크리에이터관리', icon: HiUserCircle, items: CREATOR_MANAGEMENT, expandable: true },
];
