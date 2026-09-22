import {
  getTokenMakerPurchaseHistory,
  MOCK_TOKEN_MAKER_ORDERS,
  type TokenMakerOrderItem,
  type TokenMakerPaymentMethod,
  type TokenMakerPurchaseRecord,
} from './mock/tokenMaker.mock';
import {
  getTokenStorePurchaseHistory,
  MOCK_TOKEN_STORE_ORDERS,
  type TokenStoreOrderItem,
  type TokenStorePurchaseRecord,
} from './mock/tokenStore.mock';

export type TokenPurchaseChannel = '필메' | '스팜';

export type TokenPurchaseProfile = {
  kind: 'maker' | 'store';
  name: string;
  userId: string;
  phone: string;
  tokenBalance: number;
};

export type TokenPurchaseHistoryItem = {
  channel: TokenPurchaseChannel;
  orderNo: string;
  orderedAt: string;
  settledAt: string;
  productOption: string;
  tokenAmount: number;
  amount: number;
  paymentMethod: string;
  status: string;
  counted: boolean;
};

export type TokenPurchaseSummary = {
  makerCount: number;
  storeCount: number;
  totalCount: number;
  makerAmount: number;
  storeAmount: number;
  totalAmount: number;
  makerTokens: number;
  storeTokens: number;
  totalTokens: number;
  excludedCount: number;
};

const EXCLUDED_STATUSES = new Set([
  '취소',
  '실패',
  '결제전',
  '미충전',
  '취소회수',
  '주문이상',
  '미충전+토큰미적재',
]);

function isCountedStatus(status: string) {
  return !EXCLUDED_STATUSES.has(status);
}

export function formatPurchaseCountLabel(count: number) {
  return count <= 0 ? '첫구매' : `누적${count}회`;
}

function formatMakerPaymentMethod(method: TokenMakerPaymentMethod) {
  if (method.startsWith('카드')) return '신용카드';
  if (method.startsWith('카카오')) return '카카오페이';
  if (method.includes('계좌')) return '실시간계좌이체';
  return method;
}

function mapMakerRecord(record: TokenMakerPurchaseRecord): TokenPurchaseHistoryItem {
  return {
    channel: '필메',
    orderNo: record.orderNo,
    orderedAt: record.orderedAt,
    settledAt: record.paidAt ?? '-',
    productOption: record.productName,
    tokenAmount: record.chargeTokenAmount,
    amount: record.amount,
    paymentMethod: formatMakerPaymentMethod(record.paymentMethod),
    status: record.paymentStatus,
    counted: isCountedStatus(record.paymentStatus),
  };
}

function mapStoreRecord(record: TokenStorePurchaseRecord): TokenPurchaseHistoryItem {
  return {
    channel: '스팜',
    orderNo: record.orderNo,
    orderedAt: record.orderedAt,
    settledAt: record.completedAt ?? '-',
    productOption: record.optionName,
    tokenAmount: record.tokenAmount,
    amount: record.amount,
    paymentMethod: record.paymentMethod,
    status: record.chargeStatus,
    counted: isCountedStatus(record.chargeStatus),
  };
}

function findMakerOrderByPhone(phone: string, fallback?: TokenMakerOrderItem) {
  return MOCK_TOKEN_MAKER_ORDERS.find((item) => item.customerPhone === phone) ?? fallback ?? null;
}

function findStoreOrderByPhone(phone: string, fallback?: TokenStoreOrderItem) {
  return MOCK_TOKEN_STORE_ORDERS.find((item) => item.buyerPhone === phone) ?? fallback ?? null;
}

export function getPurchaseSummary(items: TokenPurchaseHistoryItem[]): TokenPurchaseSummary {
  const makerItems = items.filter((item) => item.channel === '필메' && item.counted);
  const storeItems = items.filter((item) => item.channel === '스팜' && item.counted);

  return {
    makerCount: makerItems.length,
    storeCount: storeItems.length,
    totalCount: makerItems.length + storeItems.length,
    makerAmount: makerItems.reduce((sum, item) => sum + item.amount, 0),
    storeAmount: storeItems.reduce((sum, item) => sum + item.amount, 0),
    totalAmount: makerItems.reduce((sum, item) => sum + item.amount, 0) + storeItems.reduce((sum, item) => sum + item.amount, 0),
    makerTokens: makerItems.reduce((sum, item) => sum + item.tokenAmount, 0),
    storeTokens: storeItems.reduce((sum, item) => sum + item.tokenAmount, 0),
    totalTokens: makerItems.reduce((sum, item) => sum + item.tokenAmount, 0) + storeItems.reduce((sum, item) => sum + item.tokenAmount, 0),
    excludedCount: items.filter((item) => !item.counted).length,
  };
}

export function getPurchaseStatusClassName(status: string) {
  if (status === '결제완료' || status === '충전완료') return 'text-success';
  if (status === '취소' || status === '실패' || status === '취소회수' || status === '주문이상') return 'text-danger';
  return 'text-warning';
}

type TokenPurchaseModalData = {
  profile: TokenPurchaseProfile;
  items: TokenPurchaseHistoryItem[];
  summary: TokenPurchaseSummary;
};

export function getTokenPurchaseModalDataFromMaker(order: TokenMakerOrderItem): TokenPurchaseModalData {
  const storeOrder = findStoreOrderByPhone(order.customerPhone);
  const items = [
    ...getTokenMakerPurchaseHistory(order).map(mapMakerRecord),
    ...(storeOrder ? getTokenStorePurchaseHistory(storeOrder).map(mapStoreRecord) : []),
  ].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));

  return {
    profile: {
      kind: 'maker' as const,
      name: order.customerName,
      userId: order.customerId,
      phone: order.customerPhone,
      tokenBalance: order.tokenBalance,
    },
    items,
    summary: getPurchaseSummary(items),
  };
}

export function getTokenPurchaseModalDataFromStore(order: TokenStoreOrderItem): TokenPurchaseModalData {
  const makerOrder = findMakerOrderByPhone(order.buyerPhone);
  const items = [
    ...(makerOrder ? getTokenMakerPurchaseHistory(makerOrder).map(mapMakerRecord) : []),
    ...getTokenStorePurchaseHistory(order).map(mapStoreRecord),
  ].sort((a, b) => b.orderedAt.localeCompare(a.orderedAt));

  return {
    profile: {
      kind: 'store' as const,
      name: order.chargeAccountName,
      userId: order.buyerId,
      phone: order.buyerPhone,
      tokenBalance: makerOrder?.tokenBalance ?? 0,
    },
    items,
    summary: getPurchaseSummary(items),
  };
}
