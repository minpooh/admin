import type { IconType } from 'react-icons';
import {
  HiShoppingCart,
  HiNoSymbol,
  HiArrowPath,
  HiPhoto,
  HiSquares2X2,
  HiPencil,
  HiCircleStack,
  HiDocumentText,
  HiTruck,
  HiCheckCircle,
  HiArchiveBox,
  HiCube,
  HiTag,
  HiHashtag,
  HiRectangleGroup,
  HiArrowsPointingOut,
  HiCake,
  HiMegaphone,
  HiQuestionMarkCircle,
  HiClipboardDocumentList,
  HiStar,
  HiUser,
  HiTicket,
  HiHandRaised,
  HiUserCircle,
  HiPercentBadge,
  HiChatBubbleLeftRight,
  HiChatBubbleBottomCenterText,
  HiShoppingBag,
  HiHome,
  HiBriefcase,
} from 'react-icons/hi2';

export const ORDER_MANAGEMENT = [
  { id: 'orderList', icon: HiShoppingCart, label: '주문' },
  { id: 'orderCancel', icon: HiNoSymbol, label: '취소' },
  { id: 'orderExchange', icon: HiArrowPath, label: '교환/반품' },
];

export const UPLOAD_MANAGEMENT = [
  { id: 'uploadFrame', icon: HiSquares2X2, label: '액자업로드' },
  { id: 'uploadPhoto', icon: HiPencil, label: '보정업로드' },
  { id: 'uploadLP', icon: HiCircleStack, label: 'LP업로드' },
  { id: 'uploadReupload', icon: HiDocumentText, label: '재수정요청' },
];

export const DELIVERY_MANAGEMENT = [
  { id: 'deliveryOrder', icon: HiCheckCircle, label: '발주 리스트' },
  { id: 'deliveryList', icon: HiArchiveBox, label: '배송 리스트' },
  { id: 'deliveryLPList', icon: HiCircleStack, label: 'LP배송 리스트' },
];

export const PRODUCT_MANAGEMENT = [
  { id: 'productList', icon: HiCube, label: '상품 리스트' },
  { id: 'productCategory', icon: HiTag, label: '카테고리 관리' },
  { id: 'productTag', icon: HiHashtag, label: '태그 관리' },
];

export const SALES_MANAGEMENT = [
  { id: 'groupList', icon: HiUserCircle, label: '공동구매 리스트' },
  { id: 'couponList', icon: HiTicket, label: '쿠폰 리스트' },
  { id: 'influencerList', icon: HiHandRaised, label: '인플루언서 리스트' },
];

export const CUSTOMER_MANAGEMENT = [
  { id: 'customerList', icon: HiUser, label: '회원 리스트' },
];

export const HOMEPAGE_MANAGEMENT = [
  { id: 'bannerList', icon: HiRectangleGroup, label: '배너 리스트' },
  { id: 'popupList', icon: HiArrowsPointingOut, label: '팝업 리스트' },
  { id: 'eventList', icon: HiCake, label: '이벤트 리스트' },
  { id: 'noticeList', icon: HiMegaphone, label: '공지 리스트' },
];

export const QUESTION_MANAGEMENT = [
  { id: 'question', icon: HiChatBubbleLeftRight, label: '1:1 문의' },
  { id: 'companyQuestion', icon: HiBriefcase, label: '기업문의' },
  { id: 'faq', icon: HiClipboardDocumentList, label: 'FAQ' },
  { id: 'chatbot', icon: HiChatBubbleBottomCenterText, label: '챗봇관리' },
];

export const REVIEW_MANAGEMENT = [
  { id: 'review', icon: HiStar, label: '리뷰 관리' },
];

export type FeelFrameSectionId =
  | 'orderManagement'
  | 'uploadManagement'
  | 'deliveryManagement'
  | 'productManagement'
  | 'salesManagement'
  | 'customerManagement'
  | 'homepageManagement'
  | 'questionManagement'
  | 'reviewManagement';

export type FeelFrameSectionConfigItem = {
  id: string;
  title: string;
  icon: IconType;
  /** 있으면 feelframe 패널에서 아코디언 + 리스트로 표시 */
  items?: { id: string; icon: IconType; label: string; active?: boolean; subItems?: { label: string }[] }[];
  expandable?: boolean;
  subItemKeyPrefix?: string;
};

/** feelframe 패널에 실제로 표시할 섹션 ID (순서) */
export const FEELFRAME_SECTION_IDS: FeelFrameSectionId[] = [
  'orderManagement',
  'uploadManagement',
  'deliveryManagement',
  'productManagement',
  'salesManagement',
  'customerManagement',
  'homepageManagement',
  'questionManagement',
  'reviewManagement',
];

export const FEELFRAME_SECTION_CONFIG: FeelFrameSectionConfigItem[] = [
  { id: 'orderManagement', title: '주문관리', icon: HiShoppingBag, items: ORDER_MANAGEMENT, expandable: true, subItemKeyPrefix: 'page' },
  { id: 'uploadManagement', title: '업로드관리', icon: HiPhoto, items: UPLOAD_MANAGEMENT, expandable: true, subItemKeyPrefix: 'report' },
  { id: 'deliveryManagement', title: '배송관리', icon: HiTruck, items: DELIVERY_MANAGEMENT, expandable: true },
  { id: 'productManagement', title: '상품관리', icon: HiArchiveBox, items: PRODUCT_MANAGEMENT, expandable: false },
  { id: 'salesManagement', title: '할인판매관리', icon: HiPercentBadge, items: SALES_MANAGEMENT, expandable: true },
  { id: 'customerManagement', title: '회원관리', icon: HiUser, items: CUSTOMER_MANAGEMENT, expandable: true },
  { id: 'homepageManagement', title: '홈페이지관리', icon: HiHome, items: HOMEPAGE_MANAGEMENT, expandable: true },
  { id: 'questionManagement', title: '문의관리', icon: HiQuestionMarkCircle, items: QUESTION_MANAGEMENT, expandable: false },
  { id: 'reviewManagement', title: '리뷰관리', icon: HiStar, items: REVIEW_MANAGEMENT, expandable: true },
];
