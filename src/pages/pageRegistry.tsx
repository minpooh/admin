import type { ComponentType } from 'react';

/** 라우트 키: navId 또는 navId/sectionId/itemId 또는 navId/sectionId/itemId/subId */
export function getPageKey(
  navId: string | undefined,
  sectionId?: string,
  itemId?: string,
  subId?: string
): string {
  const parts = [navId, sectionId, itemId, subId].filter((p): p is string => !!p);
  return parts.join('/');
}

export type PageComponent = ComponentType;

/** 라우트 키 → 페이지 컴포넌트. 새 페이지 추가 시 여기에 등록 */
const registry: Record<string, PageComponent> = {};

export function registerPage(key: string, component: PageComponent) {
  registry[key] = component;
}

export function getPage(key: string): PageComponent | undefined {
  return registry[key];
}

// ——— 페이지 등록 ———
// 새 페이지 추가 방법:
// 1. pages/{navId}/{sectionId}/{ItemId}Page.tsx 파일 생성
// 2. 아래에 import 추가 후 registerPage('navId/sectionId/itemId', 컴포넌트) 호출


import FeelmakerDashboardPage from './feelmaker/DashboardPage.tsx';
registerPage('feelmaker', FeelmakerDashboardPage);

import FeelmakerOrderVideoPage from './feelmaker/orderManagement/OrderVideoPage';
import FeelmakerOrderVideoTestPage from './feelmaker/orderManagement/OrderVideoTestPage';
import FeelmakerOrderInviPage from './feelmaker/orderManagement/OrderInviPage.tsx';
import FeelmakerOrderEditPage from './feelmaker/orderManagement/OrderEditPage.tsx';
import FeelmakerOrderEditStorePage from './feelmaker/orderManagement/OrderEditStorePage.tsx';
import FeelmakerOrderEditSamplePage from './feelmaker/orderManagement/OrderEditSamplePage.tsx';
import FeelmakerOrderVideoMixPage from './feelmaker/orderManagement/OrderVideoMixPage.tsx';

import BannerPage from './feelmaker/homepageManagement/BannerPage';
import PopupPage from './feelmaker/homepageManagement/PopupPage';
import EventPage from './feelmaker/homepageManagement/EventPage';
import NoticePage from './feelmaker/homepageManagement/NoticePage';

registerPage('feelmaker/orderManagement/orderVideo', FeelmakerOrderVideoPage);
registerPage('feelmaker/orderManagement/orderTestVideo', FeelmakerOrderVideoTestPage);
registerPage('feelmaker/orderManagement/orderInvi', FeelmakerOrderInviPage);
registerPage('feelmaker/orderManagement/orderEditPage', FeelmakerOrderEditPage);
registerPage('feelmaker/orderManagement/orderEditStorePage', FeelmakerOrderEditStorePage);
registerPage('feelmaker/orderManagement/orderEditSamplePage', FeelmakerOrderEditSamplePage);
registerPage('feelmaker/orderManagement/orderVideoMixPage', FeelmakerOrderVideoMixPage);

registerPage('feelmaker/homepageManagement/bannerList', BannerPage);
registerPage('feelmaker/homepageManagement/popupList', PopupPage);
registerPage('feelmaker/homepageManagement/eventList', EventPage);
registerPage('feelmaker/homepageManagement/noticeList', NoticePage);

import InquiryPage from './feelmaker/reviewManagement/InquiryPage';
import FaqPage from './feelmaker/reviewManagement/FaqPage';
import ReviewPage from './feelmaker/reviewManagement/ReviewPage';
registerPage('feelmaker/reviewManagement/inquiry', InquiryPage);
registerPage('feelmaker/reviewManagement/faq', FaqPage);
registerPage('feelmaker/reviewManagement/review', ReviewPage);

import StorefarmVideoPage from './feelmaker/crawlingManagement/StorefarmVideoPage';
import StorefarmCardPage from './feelmaker/crawlingManagement/StorefarmCardPage';
import StorefarmMotionPage from './feelmaker/crawlingManagement/StorefarmMotionPage';
registerPage('feelmaker/crawlingManagement/storefarmMaker', StorefarmVideoPage);
registerPage('feelmaker/crawlingManagement/storefarmCard', StorefarmCardPage);
registerPage('feelmaker/crawlingManagement/storefarmMotion', StorefarmMotionPage);

import StorefarmErrorPage from './feelmaker/errorManagement/StorefarmErrorPage';
import OrderErrorPage from './feelmaker/errorManagement/OrderErrorPage';
import DelayErrorPage from './feelmaker/errorManagement/DelayErrorPage';
registerPage('feelmaker/errorManagement/storefarmError', StorefarmErrorPage);
registerPage('feelmaker/errorManagement/orderError', OrderErrorPage);
registerPage('feelmaker/errorManagement/delayError', DelayErrorPage);

import CustomerListPage from './feelmaker/customerManagement/CustomerListPage';
import CouponListPage from './feelmaker/customerManagement/CouponListPage';
import GroupListPage from './feelmaker/customerManagement/GroupListPage';
registerPage('feelmaker/customerManagement/customerList', CustomerListPage);
registerPage('feelmaker/customerManagement/couponList', CouponListPage);
registerPage('feelmaker/customerManagement/groupList', GroupListPage);

import ProductListPage from './feelmaker/productManagement/ProductListPage';
import RenderingPcPage from './feelmaker/productManagement/RenderingPcPage';
import DesignerManagementPage from './feelmaker/productManagement/DesignerManagementPage';
import EditorListPage from './feelmaker/marketingManagement/EditorListPage';
registerPage('feelmaker/productManagement/productList', ProductListPage);
registerPage('feelmaker/productManagement/renderingPc', RenderingPcPage);
registerPage('feelmaker/productManagement/designerManagement', DesignerManagementPage);
registerPage('feelmaker/marketingManagement/editorList', EditorListPage);
registerPage('feelframe/productManagement/renderingPc', RenderingPcPage);
registerPage('feelframe/productManagement/designerManagement', DesignerManagementPage);

import FeelframeUploadFramePage from './feelframe/uploadManagement/UploadFramePage';
registerPage('feelframe/uploadManagement/uploadFrame', FeelframeUploadFramePage);
