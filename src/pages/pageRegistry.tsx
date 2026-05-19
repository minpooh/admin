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


// 필메이커 페이지 시작 --------------------------------------------------------------
import FeelmakerDashboardPage from './feelmaker/DashboardPage.tsx';
registerPage('feelmaker', FeelmakerDashboardPage);

// 주문관리
import FeelmakerOrderVideoPage from './feelmaker/orderManagement/OrderVideoPage';
import FeelmakerOrderVideoTestPage from './feelmaker/orderManagement/OrderVideoTestPage';
import FeelmakerOrderInviPage from './feelmaker/orderManagement/OrderInviPage.tsx';
import FeelmakerOrderEditPage from './feelmaker/orderManagement/OrderEditPage.tsx';
import FeelmakerOrderEditStorePage from './feelmaker/orderManagement/OrderEditStorePage.tsx';
import FeelmakerOrderEditSamplePage from './feelmaker/orderManagement/OrderEditSamplePage.tsx';
import FeelmakerOrderVideoMixPage from './feelmaker/orderManagement/OrderVideoMixPage.tsx';
registerPage('feelmaker/orderManagement/orderVideo', FeelmakerOrderVideoPage);
registerPage('feelmaker/orderManagement/orderTestVideo', FeelmakerOrderVideoTestPage);
registerPage('feelmaker/orderManagement/orderInvi', FeelmakerOrderInviPage);
registerPage('feelmaker/orderManagement/orderEditPage', FeelmakerOrderEditPage);
registerPage('feelmaker/orderManagement/orderEditStorePage', FeelmakerOrderEditStorePage);
registerPage('feelmaker/orderManagement/orderEditSamplePage', FeelmakerOrderEditSamplePage);
registerPage('feelmaker/orderManagement/orderVideoMixPage', FeelmakerOrderVideoMixPage);

// 크롤링
import StorefarmVideoPage from './feelmaker/crawlingManagement/StorefarmVideoPage';
import StorefarmCardPage from './feelmaker/crawlingManagement/StorefarmCardPage';
import StorefarmMotionPage from './feelmaker/crawlingManagement/StorefarmMotionPage';
registerPage('feelmaker/crawlingManagement/storefarmMaker', StorefarmVideoPage);
registerPage('feelmaker/crawlingManagement/storefarmCard', StorefarmCardPage);
registerPage('feelmaker/crawlingManagement/storefarmMotion', StorefarmMotionPage);

// 오류관리
import StorefarmErrorPage from './feelmaker/errorManagement/StorefarmErrorPage';
import OrderErrorPage from './feelmaker/errorManagement/OrderErrorPage';
import DelayErrorPage from './feelmaker/errorManagement/DelayErrorPage';
registerPage('feelmaker/errorManagement/storefarmError', StorefarmErrorPage);
registerPage('feelmaker/errorManagement/orderError', OrderErrorPage);
registerPage('feelmaker/errorManagement/delayError', DelayErrorPage);

// 문의/후기관리
import InquiryPage from './feelmaker/reviewManagement/InquiryPage';
import FaqPage from './feelmaker/reviewManagement/FaqPage';
import ReviewPage from './feelmaker/reviewManagement/ReviewPage';
registerPage('feelmaker/reviewManagement/inquiry', InquiryPage);
registerPage('feelmaker/reviewManagement/faq', FaqPage);
registerPage('feelmaker/reviewManagement/review', ReviewPage);

// 고객관리
import CustomerListPage from './feelmaker/customerManagement/CustomerListPage';
import CouponListPage from './feelmaker/customerManagement/CouponListPage';
import GroupListPage from './feelmaker/customerManagement/GroupListPage';
registerPage('feelmaker/customerManagement/customerList', CustomerListPage);
registerPage('feelmaker/customerManagement/couponList', CouponListPage);
registerPage('feelmaker/customerManagement/groupList', GroupListPage);

// 상품관리 (필메이커)
import ProductListPage from './feelmaker/productManagement/ProductListPage';
import RenderingPcPage from './feelmaker/productManagement/RenderingPcPage';
registerPage('feelmaker/productManagement/productList', ProductListPage);
registerPage('feelmaker/productManagement/renderingPc', RenderingPcPage);

// 홈페이지관리
import BannerPage from './feelmaker/homepageManagement/BannerPage';
import PopupPage from './feelmaker/homepageManagement/PopupPage';
import EventPage from './feelmaker/homepageManagement/EventPage';
import NoticePage from './feelmaker/homepageManagement/NoticePage';
registerPage('feelmaker/homepageManagement/bannerList', BannerPage);
registerPage('feelmaker/homepageManagement/popupList', PopupPage);
registerPage('feelmaker/homepageManagement/eventList', EventPage);
registerPage('feelmaker/homepageManagement/noticeList', NoticePage);

// 엔터프라이즈관리
import EnterpriseListPage from './feelmaker/enterpriseManagement/EnterpriseListPage';
import EnterpriseOrderListPage from './feelmaker/enterpriseManagement/EnterpriseOrderListPage';
import EnterpriseInvoicePage from './feelmaker/enterpriseManagement/EnterpriseInvoicePage';
registerPage('feelmaker/enterpriseManagement/enterpriseList', EnterpriseListPage);
registerPage('feelmaker/enterpriseManagement/enterpriseOrderList', EnterpriseOrderListPage);
registerPage('feelmaker/enterpriseManagement/enterpriseInvoice', EnterpriseInvoicePage);

// 크리에이터관리
import CreatorListPage from './feelmaker/creatorManagement/CreatorListPage';
import CreatorInvoicePage from './feelmaker/creatorManagement/CreatorInvoicePage';
import CreatorTemplatePage from './feelmaker/creatorManagement/CreatorTemplatePage';
import CreatorBoardPage from './feelmaker/creatorManagement/CreatorBoardPage';
registerPage('feelmaker/creatorManagement/creatorList', CreatorListPage);
registerPage('feelmaker/creatorManagement/creatorInvoice', CreatorInvoicePage);
registerPage('feelmaker/creatorManagement/creatorTemplate', CreatorTemplatePage);
registerPage('feelmaker/creatorManagement/creatorBoard', CreatorBoardPage);

// 마케팅관리
import EditorListPage from './feelmaker/marketingManagement/EditorListPage';
registerPage('feelmaker/marketingManagement/editorList', EditorListPage);


// 필메이커 페이지 끝 --------------------------------------------------------------


// 필프레임 페이지 시작 --------------------------------------------------------------
import FeelframeDashboardPage from './feelframe/DashboardPage';
registerPage('feelframe', FeelframeDashboardPage);

// 주문관리
import FeelframeOrderListPage from './feelframe/orderManagement/OrderListPage';
import FeelframeOrderCancelPage from './feelframe/orderManagement/OrderCancelPage';
import FeelframeOrderExchangePage from './feelframe/orderManagement/OrderExchangePage';
registerPage('feelframe/orderManagement/orderList', FeelframeOrderListPage);
registerPage('feelframe/orderManagement/orderCancel', FeelframeOrderCancelPage);
registerPage('feelframe/orderManagement/orderExchange', FeelframeOrderExchangePage);

// 업로드관리
import FeelframeUploadFramePage from './feelframe/uploadManagement/UploadFramePage';
import FeelframeUploadPhotoPage from './feelframe/uploadManagement/UploadPhotoPage';
import FeelframeUploadLPPage from './feelframe/uploadManagement/UploadLPPage';
import FeelframeUploadReuploadPage from './feelframe/uploadManagement/UploadReuploadPage';
registerPage('feelframe/uploadManagement/uploadFrame', FeelframeUploadFramePage);
registerPage('feelframe/uploadManagement/uploadPhoto', FeelframeUploadPhotoPage);
registerPage('feelframe/uploadManagement/uploadLP', FeelframeUploadLPPage);
registerPage('feelframe/uploadManagement/uploadReupload', FeelframeUploadReuploadPage);

// 배송관리
import FeelframeDeliveryOrderPage from './feelframe/deliveryManagement/DeliveryOrderPage';
import FeelframeDeliveryListPage from './feelframe/deliveryManagement/DeliveryListPage';
import FeelframeDeliveryLPListPage from './feelframe/deliveryManagement/DeliveryLPListPage';
registerPage('feelframe/deliveryManagement/deliveryOrder', FeelframeDeliveryOrderPage);
registerPage('feelframe/deliveryManagement/deliveryList', FeelframeDeliveryListPage);
registerPage('feelframe/deliveryManagement/deliveryLPList', FeelframeDeliveryLPListPage);

// 상품관리 (필프레임)
import FeelframeProductListPage from './feelframe/productManagement/ProductListPage';
import FeelframePersonalPaymentPage from './feelframe/productManagement/PersonalPaymentPage';
import FeelframeOptionManagementPage from './feelframe/productManagement/OptionManagementPage';
registerPage('feelframe/productManagement/productList', FeelframeProductListPage);
registerPage('feelframe/productManagement/personalPayment', FeelframePersonalPaymentPage);
registerPage('feelframe/productManagement/optionManagement', FeelframeOptionManagementPage);

// 할인판매관리
import FeelframeGroupListPage from './feelframe/salesManagement/GroupListPage';
import FeelframeCouponListPage from './feelframe/salesManagement/CouponListPage';
import FeelframeInfluencerListPage from './feelframe/salesManagement/InfluencerListPage';
registerPage('feelframe/salesManagement/groupList', FeelframeGroupListPage);
registerPage('feelframe/salesManagement/couponList', FeelframeCouponListPage);
registerPage('feelframe/salesManagement/influencerList', FeelframeInfluencerListPage);

// 회원관리
import FeelframeCustomerListPage from './feelframe/customerManagement/CustomerListPage';
registerPage('feelframe/customerManagement/customerList', FeelframeCustomerListPage);

// 홈페이지관리
import FeelframeBannerPage from './feelframe/homepageManagement/BannerPage';
import FeelframePopupPage from './feelframe/homepageManagement/PopupPage';
import FeelframeEventPage from './feelframe/homepageManagement/EventPage';
import FeelframeNoticePage from './feelframe/homepageManagement/NoticePage';
registerPage('feelframe/homepageManagement/bannerList', FeelframeBannerPage);
registerPage('feelframe/homepageManagement/popupList', FeelframePopupPage);
registerPage('feelframe/homepageManagement/eventList', FeelframeEventPage);
registerPage('feelframe/homepageManagement/noticeList', FeelframeNoticePage);

// 문의관리
import FeelframeQuestionPage from './feelframe/questionManagement/QuestionPage';
import FeelframeCompanyQuestionPage from './feelframe/questionManagement/CompanyQuestionPage';
import FeelframeFaqPage from './feelframe/questionManagement/FaqPage';
import FeelframeChatbotPage from './feelframe/questionManagement/ChatbotPage';
registerPage('feelframe/questionManagement/question', FeelframeQuestionPage);
registerPage('feelframe/questionManagement/companyQuestion', FeelframeCompanyQuestionPage);
registerPage('feelframe/questionManagement/faq', FeelframeFaqPage);
registerPage('feelframe/questionManagement/chatbot', FeelframeChatbotPage);
// 필프레임 페이지 끝 --------------------------------------------------------------