import { useCallback, useEffect, useMemo, useState, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ComponentType } from 'react';
import {
  CreditCard,
  UserRound,
  RotateCcw,
  PencilRuler,
  Truck,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Pencil,
  Check,
  X,
  MessageCircleQuestion,
  Package,
  CircleDollarSign,
  Users,
  BadgeHelp,
  Sparkles,
  MessageSquareText,
  ShieldQuestion,
  FileQuestion,
  CircleHelp,
} from 'lucide-react';
import ListSelect from '../../../components/ListSelect';
import Alert from '../../../components/Alert';
import Confirm from '../../../components/Confirm';
import { MOCK_FEELFRAME_PRODUCT_LIST } from '../productManagement/mock/productList.mock';
import '../../../styles/adminPage.css';
import './ChatbotPage.css';
import './FaqPage.css';

type CategoryId = string;

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

type CategoryConfig = {
  id: CategoryId;
  label: string;
  iconKey: IconKey;
};

const ICON_COMPONENTS = {
  creditCard: CreditCard,
  userRound: UserRound,
  rotateCcw: RotateCcw,
  pencilRuler: PencilRuler,
  truck: Truck,
  smartphone: Smartphone,
  messageCircleQuestion: MessageCircleQuestion,
  package: Package,
  circleDollarSign: CircleDollarSign,
  users: Users,
  badgeHelp: BadgeHelp,
  sparkles: Sparkles,
  messageSquareText: MessageSquareText,
  shieldQuestion: ShieldQuestion,
  fileQuestion: FileQuestion,
  circleHelp: CircleHelp,
} as const;

type IconKey = keyof typeof ICON_COMPONENTS;

const getIconComponent = (iconKey: string): ComponentType<{ size?: number; className?: string }> =>
  ICON_COMPONENTS[iconKey as IconKey] ?? BadgeHelp;

const ICON_OPTIONS: { key: IconKey; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'creditCard', label: '결제', icon: CreditCard },
  { key: 'userRound', label: '회원', icon: UserRound },
  { key: 'rotateCcw', label: '환불', icon: RotateCcw },
  { key: 'pencilRuler', label: '수정', icon: PencilRuler },
  { key: 'truck', label: '배송', icon: Truck },
  { key: 'smartphone', label: '모바일', icon: Smartphone },
  { key: 'messageCircleQuestion', label: '문의', icon: MessageCircleQuestion },
  { key: 'package', label: '패키지', icon: Package },
  { key: 'circleDollarSign', label: '금액', icon: CircleDollarSign },
  { key: 'users', label: '고객', icon: Users },
  { key: 'badgeHelp', label: '도움', icon: BadgeHelp },
  { key: 'messageSquareText', label: '문의글', icon: MessageSquareText },
  { key: 'messageCircleQuestion', label: '문의', icon: MessageCircleQuestion },
  { key: 'shieldQuestion', label: '질문', icon: ShieldQuestion },
  { key: 'fileQuestion', label: '문서질문', icon: FileQuestion },
  { key: 'circleHelp', label: '도움말', icon: CircleHelp },
  { key: 'sparkles', label: '기타', icon: Sparkles },
];

const INITIAL_CATEGORIES: CategoryConfig[] = [
  { id: 'shipping', label: '배송문의', iconKey: 'truck' },
  { id: 'production', label: '제작문의', iconKey: 'pencilRuler' },
  { id: 'order', label: '주문문의', iconKey: 'creditCard' },
  { id: 'size', label: '사이즈문의', iconKey: 'circleHelp' },
  { id: 'product', label: '상품문의', iconKey: 'package' },
  { id: 'cancelExchange', label: '취소교환반품문의', iconKey: 'rotateCcw' },
  { id: 'member', label: '회원문의', iconKey: 'userRound' },
  { id: 'groupBuy', label: '공동구매문의', iconKey: 'users' },
  { id: 'company', label: '기업문의', iconKey: 'messageSquareText' },
  { id: 'agent', label: '상담원연결', iconKey: 'smartphone' },
  { id: 'nonStandard', label: '비규격문의', iconKey: 'sparkles' },
];

const INITIAL_CHATBOT_BY_CATEGORY: Record<CategoryId, FaqItem[]> = {
  shipping: [
    {
      id: 'shipping-1',
      question: '배송은 얼마나 걸리나요?',
      answer: '제작 완료 후 출고되며, 지역에 따라 보통 1~3일 내 수령 가능합니다. 주문 상세에서 배송 상태를 확인할 수 있습니다.',
    },
  ],
  production: [
    {
      id: 'production-1',
      question: '제작 기간은 어떻게 되나요?',
      answer: '상품·옵션에 따라 다르며, 결제 후 평균 3~7일 내 제작이 진행됩니다.',
    },
  ],
  order: [
    {
      id: 'order-1',
      question: '주문 내역은 어디서 볼 수 있나요?',
      answer: '마이페이지 > 주문내역에서 주문 상태와 결제 정보를 확인할 수 있습니다.',
    },
  ],
  size: [
    {
      id: 'size-1',
      question: '액자 사이즈는 어떻게 선택하나요?',
      answer: '상품 상세의 사이즈 가이드를 참고해 주문 시 원하는 규격을 선택해 주세요.',
    },
  ],
  product: [
    {
      id: 'product-1',
      question: '상품 구성이 궁금해요.',
      answer: '상품 상세 페이지에서 포함 구성, 옵션, 제작 범위를 확인할 수 있습니다.',
    },
  ],
  cancelExchange: [
    {
      id: 'cancelExchange-1',
      question: '취소·교환·반품은 어떻게 신청하나요?',
      answer: '마이페이지 주문내역에서 취소/교환/반품 신청이 가능하며, 제작 단계에 따라 처리 가능 여부가 달라질 수 있습니다.',
    },
  ],
  member: [
    {
      id: 'member-1',
      question: '회원가입 없이 주문할 수 있나요?',
      answer: '비회원 주문을 지원하며, 주문 조회는 주문번호와 연락처로 가능합니다.',
    },
  ],
  groupBuy: [
    {
      id: 'groupBuy-1',
      question: '공동구매 참여 방법이 궁금해요.',
      answer: '진행 중인 공동구매 페이지에서 참여 신청 후 안내된 일정에 따라 주문하면 됩니다.',
    },
  ],
  company: [
    {
      id: 'company-1',
      question: '기업 제휴 문의는 어디로 하나요?',
      answer: '기업문의 메뉴 또는 고객센터를 통해 제휴·대량 구매 문의를 접수해 주세요.',
    },
  ],
  agent: [
    {
      id: 'agent-1',
      question: '상담원과 연결하고 싶어요.',
      answer: '운영 시간 내 고객센터(전화·채팅)로 연결해 드립니다. 채팅창 하단의 상담원 연결을 눌러 주세요.',
    },
  ],
  nonStandard: [
    {
      id: 'nonStandard-1',
      question: '비규격 제작이 가능한가요?',
      answer: '일부 상품은 비규격 제작이 가능합니다. 요청 사양을 남겨 주시면 검토 후 안내드립니다.',
    },
  ],
};

const INITIAL_FRAME_RECOMMEND_CATEGORIES: CategoryConfig[] = [
  { id: 'livingRoom', label: '거실', iconKey: 'users' },
  { id: 'bedroom', label: '방안', iconKey: 'userRound' },
  { id: 'kitchen', label: '주방', iconKey: 'package' },
  { id: 'hallway', label: '복도', iconKey: 'circleHelp' },
  { id: 'entrance', label: '현관', iconKey: 'shieldQuestion' },
  { id: 'exhibition', label: '전시', iconKey: 'sparkles' },
];

const FRAME_USE_OPTIONS = ['벽걸이', '탁상용'] as const;
const FRAME_MOOD_OPTIONS = [
  '따뜻함',
  '아늑함',
  '내추럴',
  '클래식',
  '고급스러운',
  '화사한',
  '모던',
  '어두운',
  '유니크',
] as const;

const FRAME_PRODUCT_SELECT_OPTIONS = [
  { value: '', label: '상품 선택' },
  ...MOCK_FEELFRAME_PRODUCT_LIST.map((product) => ({
    value: product.id,
    label: product.name,
  })),
];

type FrameRecommendProductRow = {
  id: string;
  use: string;
  mood: string;
  productId: string;
  productName: string;
};

type FrameRecommendPaneState = {
  categories: CategoryConfig[];
  activeCategoryId: CategoryId;
  productsByCategory: Record<CategoryId, FrameRecommendProductRow[]>;
};

type FaqLayoutTabId = 'chatbot' | 'frameRecommend';
type BotTabId = FaqLayoutTabId | 'newChatbot';

const isFaqLayoutTab = (tab: BotTabId): tab is FaqLayoutTabId => tab === 'chatbot' || tab === 'frameRecommend';

type TabPaneState = {
  categories: CategoryConfig[];
  activeCategoryId: CategoryId;
  faqByCategory: Record<CategoryId, FaqItem[]>;
};

const BOT_TABS: { id: BotTabId; label: string }[] = [
  { id: 'chatbot', label: '챗봇' },
  { id: 'frameRecommend', label: '액자추천' },
  { id: 'newChatbot', label: '신형챗봇' },
];

type NewChatbotRow = {
  id: string;
  order: number;
  tag: string;
  questionType: string;
  answer: string;
  imageUrl: string;
  emotion: boolean;
  groupLeader: string;
  group: string;
  menu: string;
};

const INITIAL_NEW_CHATBOT_ROWS: NewChatbotRow[] = [
  {
    id: 'ncb-1',
    order: 1,
    tag: '배송',
    questionType: '배송은 언제 되나요?',
    answer: '제작 완료 후 1~3일 내 출고됩니다.',
    imageUrl: '',
    emotion: true,
    groupLeader: 'Y',
    group: '배송',
    menu: '배송문의',
  },
  {
    id: 'ncb-2',
    order: 2,
    tag: '주문',
    questionType: '주문 취소 방법',
    answer: '마이페이지 주문내역에서 취소 신청이 가능합니다.',
    imageUrl: '',
    emotion: false,
    groupLeader: 'N',
    group: '주문',
    menu: '주문문의',
  },
];

function renumberNewChatbotRows(input: NewChatbotRow[]): NewChatbotRow[] {
  return input.map((row, idx) => ({ ...row, order: idx + 1 }));
}

function createTabPane(
  categories: CategoryConfig[],
  activeCategoryId: CategoryId,
  faqByCategory: Record<CategoryId, FaqItem[]>,
): TabPaneState {
  return {
    categories: categories.map((category) => ({ ...category })),
    activeCategoryId,
    faqByCategory: Object.fromEntries(
      Object.entries(faqByCategory).map(([categoryId, items]) => [
        categoryId,
        items.map((item) => ({ ...item })),
      ]),
    ),
  };
}

function createInitialChatbotPane(): TabPaneState {
  return createTabPane(INITIAL_CATEGORIES, 'shipping', INITIAL_CHATBOT_BY_CATEGORY);
}

function createInitialFrameRecommendPane(): FrameRecommendPaneState {
  const categories = INITIAL_FRAME_RECOMMEND_CATEGORIES.map((category) => ({ ...category }));
  return {
    categories,
    activeCategoryId: 'livingRoom',
    productsByCategory: Object.fromEntries(categories.map((category) => [category.id, []])),
  };
}

function formatFrameLabel(value: string): string {
  return value.trim() ? value : '—';
}

export default function ChatbotPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeBotTab = useMemo<BotTabId>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'newChatbot') return 'newChatbot';
    if (tab === 'frameRecommend') return 'frameRecommend';
    return 'chatbot';
  }, [searchParams]);
  const [chatbotPane, setChatbotPane] = useState<TabPaneState>(() => createInitialChatbotPane());
  const [frameRecommendPane, setFrameRecommendPane] = useState<FrameRecommendPaneState>(() =>
    createInitialFrameRecommendPane(),
  );
  const [newChatbotRows, setNewChatbotRows] = useState<NewChatbotRow[]>(() =>
    renumberNewChatbotRows(INITIAL_NEW_CHATBOT_ROWS),
  );

  const isFrameRecommendTab = activeBotTab === 'frameRecommend';
  const categories = isFrameRecommendTab ? frameRecommendPane.categories : chatbotPane.categories;
  const activeCategoryId = isFrameRecommendTab ? frameRecommendPane.activeCategoryId : chatbotPane.activeCategoryId;
  const faqByCategory = chatbotPane.faqByCategory;
  const sortedNewChatbotRows = useMemo(() => renumberNewChatbotRows(newChatbotRows), [newChatbotRows]);
  const frameRecommendProducts = useMemo(
    () => frameRecommendPane.productsByCategory[frameRecommendPane.activeCategoryId] ?? [],
    [frameRecommendPane],
  );

  const [frameAddFormOpen, setFrameAddFormOpen] = useState(false);
  const [draftUse, setDraftUse] = useState('');
  const [draftMood, setDraftMood] = useState('');
  const [draftProductId, setDraftProductId] = useState('');

  const resetFrameAddForm = useCallback(() => {
    setFrameAddFormOpen(false);
    setDraftUse('');
    setDraftMood('');
    setDraftProductId('');
  }, []);

  const setCategories = useCallback(
    (action: SetStateAction<CategoryConfig[]>) => {
      if (isFrameRecommendTab) {
        setFrameRecommendPane((pane) => ({
          ...pane,
          categories: typeof action === 'function' ? action(pane.categories) : action,
        }));
        return;
      }
      setChatbotPane((pane) => ({
        ...pane,
        categories: typeof action === 'function' ? action(pane.categories) : action,
      }));
    },
    [isFrameRecommendTab],
  );

  const setActiveCategoryId = useCallback(
    (action: SetStateAction<CategoryId>) => {
      if (isFrameRecommendTab) {
        setFrameRecommendPane((pane) => ({
          ...pane,
          activeCategoryId: typeof action === 'function' ? action(pane.activeCategoryId) : action,
        }));
        return;
      }
      setChatbotPane((pane) => ({
        ...pane,
        activeCategoryId: typeof action === 'function' ? action(pane.activeCategoryId) : action,
      }));
    },
    [isFrameRecommendTab],
  );

  const setFaqByCategory = useCallback((action: SetStateAction<Record<CategoryId, FaqItem[]>>) => {
    setChatbotPane((pane) => ({
      ...pane,
      faqByCategory: typeof action === 'function' ? action(pane.faqByCategory) : action,
    }));
  }, []);

  const setFrameProductsByCategory = useCallback(
    (action: SetStateAction<Record<CategoryId, FrameRecommendProductRow[]>>) => {
      setFrameRecommendPane((pane) => ({
        ...pane,
        productsByCategory: typeof action === 'function' ? action(pane.productsByCategory) : action,
      }));
    },
    [],
  );

  const [openFaqIds, setOpenFaqIds] = useState<string[]>([]);
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [creatingFaqId, setCreatingFaqId] = useState<string | null>(null);
  const [isCategorySwitching, setIsCategorySwitching] = useState(false);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ categoryId: CategoryId; faqId: string } | null>(null);
  const [deleteTargetCategoryId, setDeleteTargetCategoryId] = useState<CategoryId | null>(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState('');
  const [editCategoryIconKey, setEditCategoryIconKey] = useState<IconKey>('creditCard');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);

  const activeFaqItems = useMemo(
    () => chatbotPane.faqByCategory[chatbotPane.activeCategoryId] ?? [],
    [chatbotPane],
  );
  const displayFaqItems = useMemo(() => {
    if (!creatingFaqId) return activeFaqItems;
    return [...activeFaqItems, { id: creatingFaqId, question: '', answer: '' }];
  }, [activeFaqItems, creatingFaqId]);
  const deleteTargetFaq = useMemo(() => {
    if (!deleteTarget) return null;
    const list = faqByCategory[deleteTarget.categoryId] ?? [];
    return list.find((item) => item.id === deleteTarget.faqId) ?? null;
  }, [deleteTarget, faqByCategory]);
  const deleteTargetCategory = useMemo(
    () => (deleteTargetCategoryId ? categories.find((category) => category.id === deleteTargetCategoryId) ?? null : null),
    [deleteTargetCategoryId, categories]
  );

  useEffect(() => {
    if (!isFaqLayoutTab(activeBotTab)) return;
    queueMicrotask(() => {
      setIsCategorySwitching(true);
    });
    const timer = window.setTimeout(() => setIsCategorySwitching(false), 240);
    return () => window.clearTimeout(timer);
  }, [activeCategoryId, activeBotTab]);

  useEffect(() => {
    if (!isFrameRecommendTab) return;
    resetFrameAddForm();
  }, [frameRecommendPane.activeCategoryId, isFrameRecommendTab, resetFrameAddForm]);

  const updateNewChatbotRow = (rowId: string, patch: Partial<NewChatbotRow>) => {
    setNewChatbotRows((prev) => renumberNewChatbotRows(prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))));
  };

  const moveNewChatbotRow = (rowId: string, direction: -1 | 1) => {
    setNewChatbotRows((prev) => {
      const list = renumberNewChatbotRows(prev);
      const idx = list.findIndex((row) => row.id === rowId);
      if (idx < 0) return prev;
      const nextIdx = idx + direction;
      if (nextIdx < 0 || nextIdx >= list.length) return prev;
      const next = [...list];
      const tmp = next[idx];
      next[idx] = next[nextIdx];
      next[nextIdx] = tmp;
      return renumberNewChatbotRows(next);
    });
  };

  const handleOpenFrameAddForm = () => {
    setFrameAddFormOpen(true);
    setDraftUse('');
    setDraftMood('');
    setDraftProductId('');
  };

  const handleSaveFrameProduct = () => {
    if (!draftUse) {
      setAlertMessage('상품용도를 선택해 주세요.');
      return;
    }
    if (!draftMood) {
      setAlertMessage('분위기를 선택해 주세요.');
      return;
    }
    const product = MOCK_FEELFRAME_PRODUCT_LIST.find((item) => item.id === draftProductId);
    if (!product) {
      setAlertMessage('상품을 선택해 주세요.');
      return;
    }

    const categoryId = frameRecommendPane.activeCategoryId;
    const newRow: FrameRecommendProductRow = {
      id: `frp-${Date.now()}`,
      use: draftUse,
      mood: draftMood,
      productId: product.id,
      productName: product.name,
    };

    setFrameProductsByCategory((prev) => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] ?? []), newRow],
    }));
    resetFrameAddForm();
  };

  const handleDeleteFrameProduct = (rowId: string) => {
    const categoryId = frameRecommendPane.activeCategoryId;
    setFrameProductsByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] ?? []).filter((row) => row.id !== rowId),
    }));
  };

  const handleAddNewChatbotRow = () => {
    setNewChatbotRows((prev) =>
      renumberNewChatbotRows([
        ...prev,
        {
          id: `ncb-${Date.now()}`,
          order: prev.length + 1,
          tag: '',
          questionType: '',
          answer: '',
          imageUrl: '',
          emotion: false,
          groupLeader: '',
          group: '',
          menu: '',
        },
      ]),
    );
  };

  const handleBotTabChange = (tabId: BotTabId) => {
    if (tabId === activeBotTab) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tabId === 'chatbot') {
          next.delete('tab');
        } else {
          next.set('tab', tabId);
        }
        return next;
      },
      { replace: true },
    );
    setOpenFaqIds([]);
    setEditingFaqId(null);
    setCreatingFaqId(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditingCategoryId(null);
    setIconPickerOpen(false);
    setDeleteTarget(null);
    setDeleteTargetCategoryId(null);
    resetFrameAddForm();
  };

  const handleToggleAccordion = (faqId: string) => {
    setOpenFaqIds((prev) => (prev.includes(faqId) ? prev.filter((id) => id !== faqId) : [...prev, faqId]));
  };

  const handleStartEdit = (faq: FaqItem) => {
    setCreatingFaqId(null);
    setEditingFaqId(faq.id);
    setOpenFaqIds((prev) => (prev.includes(faq.id) ? prev : [...prev, faq.id]));
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const handleCancelEdit = () => {
    if (editingFaqId && editingFaqId === creatingFaqId) {
      setCreatingFaqId(null);
    }
    setEditingFaqId(null);
    setEditQuestion('');
    setEditAnswer('');
  };

  const handleSaveEdit = () => {
    if (!editingFaqId) return;
    const question = editQuestion.trim();
    const answer = editAnswer.trim();
    if (!question) {
      setAlertMessage('질문을 입력해 주세요.');
      return;
    }
    if (!answer) {
      setAlertMessage('답변을 입력해 주세요.');
      return;
    }

    setFaqByCategory((prev) => {
      if (editingFaqId === creatingFaqId) {
        return {
          ...prev,
          [activeCategoryId]: [...(prev[activeCategoryId] ?? []), { id: editingFaqId, question, answer }],
        };
      }

      return {
        ...prev,
        [activeCategoryId]: (prev[activeCategoryId] ?? []).map((item) =>
          item.id === editingFaqId ? { ...item, question, answer } : item
        ),
      };
    });
    setCreatingFaqId(null);
    setEditingFaqId(null);
  };

  const handleStartCreate = () => {
    const newId = `${activeCategoryId}-${Date.now()}`;
    setCreatingFaqId(newId);
    setEditingFaqId(newId);
    setOpenFaqIds((prev) => (prev.includes(newId) ? prev : [...prev, newId]));
    setEditQuestion('');
    setEditAnswer('');
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    const { categoryId, faqId } = deleteTarget;
    setFaqByCategory((prev) => ({
      ...prev,
      [categoryId]: (prev[categoryId] ?? []).filter((item) => item.id !== faqId),
    }));

    setOpenFaqIds((prev) => prev.filter((id) => id !== faqId));
    if (editingFaqId === faqId) handleCancelEdit();
    setDeleteTarget(null);
  };

  const handleStartCategoryEdit = (category: CategoryConfig) => {
    setEditingCategoryId(category.id);
    setEditCategoryLabel(category.label);
    setEditCategoryIconKey(category.iconKey);
    setIconPickerOpen(false);
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategoryId) return;
    const nextLabel = editCategoryLabel.trim();
    if (!nextLabel) {
      setAlertMessage('카테고리명을 입력해 주세요.');
      return;
    }

    setCategories((prev) =>
      prev.map((category) =>
        category.id === editingCategoryId ? { ...category, label: nextLabel, iconKey: editCategoryIconKey } : category
      )
    );
    setEditingCategoryId(null);
    setIconPickerOpen(false);
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setIconPickerOpen(false);
  };

  const handleAddCategory = () => {
    const newId = `category-${Date.now()}`;
    const newCategory: CategoryConfig = {
      id: newId,
      label: '새 카테고리',
      iconKey: 'badgeHelp',
    };

    setCategories((prev) => [...prev, newCategory]);
    if (isFrameRecommendTab) {
      setFrameProductsByCategory((prev) => ({ ...prev, [newId]: [] }));
    } else {
      setFaqByCategory((prev) => ({ ...prev, [newId]: [] }));
    }
    setActiveCategoryId(newId);
    handleStartCategoryEdit(newCategory);
    setOpenFaqIds([]);
    handleCancelEdit();
  };

  const handleDeleteCategoryConfirm = () => {
    if (!deleteTargetCategoryId) return;
    const targetId = deleteTargetCategoryId;

    setCategories((prev) => prev.filter((category) => category.id !== targetId));
    if (isFrameRecommendTab) {
      setFrameProductsByCategory((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    } else {
      setFaqByCategory((prev) => {
        const next = { ...prev };
        delete next[targetId];
        return next;
      });
    }
    setOpenFaqIds([]);
    handleCancelEdit();
    handleCancelCategoryEdit();
    setDeleteTargetCategoryId(null);

    setActiveCategoryId((prev) => {
      if (prev !== targetId) return prev;
      const fallback = categories.find((category) => category.id !== targetId);
      return fallback?.id ?? '';
    });
  };

  return (
    <div className="admin-list-page admin-list-page--faq admin-list-page--chatbot">
      <h1 className="page-title">챗봇관리</h1>

      <nav className="admin-tabs" aria-label="챗봇 유형">
        <div className="admin-tabs__list" role="tablist">
          {BOT_TABS.map((tab) => {
            const isActive = activeBotTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`chatbot-type-tab-${tab.id}`}
                className={`admin-tabs__tab${isActive ? ' admin-tabs__tab--active' : ''}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleBotTabChange(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {isFaqLayoutTab(activeBotTab) ? (
        <section className="admin-list-box faq-layout">
        <aside
          className="faq-category-column"
          aria-label={activeBotTab === 'frameRecommend' ? '액자추천 카테고리' : '챗봇 카테고리'}
        >
          {categories.map((category) => {
            const Icon = getIconComponent(category.iconKey);
            const active = category.id === activeCategoryId;
            const isCategoryEditing = editingCategoryId === category.id;

            return (
              <div key={category.id} className={`faq-category-row ${isCategoryEditing ? 'is-editing' : ''}`}>
                {isCategoryEditing ? (
                  <div className="faq-category-edit-box">
                    <div className="faq-category-edit-main">
                      <button
                        type="button"
                        className="faq-category-icon-select"
                        onClick={() => setIconPickerOpen((prev) => !prev)}
                        aria-label="카테고리 아이콘 선택"
                      >
                        <Icon size={16} aria-hidden="true" />
                      </button>
                      <input
                        className="faq-category-edit-input"
                        value={editCategoryLabel}
                        onChange={(e) => setEditCategoryLabel(e.target.value)}
                        placeholder="카테고리명"
                      />
                      <div className="faq-category-edit-actions">
                        <button type="button" className="faq-category-action-btn is-save" onClick={handleSaveCategoryEdit}>
                          <Check size={14} aria-hidden="true" />
                        </button>
                        <button type="button" className="faq-category-action-btn" onClick={handleCancelCategoryEdit}>
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {iconPickerOpen && (
                      <div className="faq-icon-picker-grid">
                        {ICON_OPTIONS.map((option) => {
                          const OptionIcon = getIconComponent(option.key);
                          return (
                            <button
                              key={option.key}
                              type="button"
                              className={`faq-icon-option ${editCategoryIconKey === option.key ? 'is-active' : ''}`}
                              onClick={() => setEditCategoryIconKey(option.key)}
                              title={option.label}
                            >
                              <OptionIcon size={15} aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className={`faq-category-btn ${active ? 'is-active' : ''}`}
                      onClick={() => {
                        setActiveCategoryId(category.id);
                        if (isFrameRecommendTab) {
                          resetFrameAddForm();
                        } else {
                          setOpenFaqIds([]);
                          handleCancelEdit();
                          handleCancelCategoryEdit();
                        }
                      }}
                    >
                      <Icon size={16} className="faq-category-btn__icon" aria-hidden="true" />
                      <span>{category.label}</span>
                    </button>
                    <div className="faq-category-row-actions">
                      <button
                        type="button"
                        className="faq-category-edit-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCategoryEdit(category);
                        }}
                        aria-label={`${category.label} 카테고리 수정`}
                        title="수정"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="faq-category-delete-trigger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetCategoryId(category.id);
                        }}
                        aria-label={`${category.label} 카테고리 삭제`}
                        title="삭제"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!isFrameRecommendTab && (
            <button type="button" className="faq-category-add-btn" onClick={handleAddCategory}>
              <Plus size={14} aria-hidden="true" />
              카테고리 추가
            </button>
          )}
        </aside>

        {isFrameRecommendTab ? (
          <div className={`faq-content-column frame-recommend-content ${isCategorySwitching ? 'is-switching' : ''}`}>
            {frameAddFormOpen && (
              <div className="frame-recommend-add-form">
                <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                  <span className="admin-accordion-field__label">상품용도</span>
                  <div className="admin-accordion-check-list" role="group" aria-label="상품용도">
                    {FRAME_USE_OPTIONS.map((use) => (
                      <label key={use} className="admin-accordion-check-item">
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={draftUse === use}
                          onChange={() => setDraftUse(use)}
                        />
                        <span>{use}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="admin-accordion-check-group admin-accordion-check-group--no-top-margin">
                  <span className="admin-accordion-field__label">분위기</span>
                  <div className="admin-accordion-check-list" role="group" aria-label="분위기">
                    {FRAME_MOOD_OPTIONS.map((mood) => (
                      <label key={mood} className="admin-accordion-check-item">
                        <input
                          type="checkbox"
                          className="admin-checkbox"
                          checked={draftMood === mood}
                          onChange={() => setDraftMood(mood)}
                        />
                        <span>{mood}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="frame-recommend-add-form__field">
                  <span className="admin-accordion-field__label">상품추가</span>
                  <ListSelect
                    ariaLabel="상품추가"
                    className="listselect--modal"
                    value={draftProductId}
                    onChange={setDraftProductId}
                    options={FRAME_PRODUCT_SELECT_OPTIONS}
                  />
                </div>
                <div className="frame-recommend-add-form__actions">
                  <button type="button" className="row-btn row-btn--default" onClick={resetFrameAddForm}>
                    취소
                  </button>
                  <button type="button" className="row-btn row-btn--primary" onClick={handleSaveFrameProduct}>
                    저장
                  </button>
                </div>
              </div>
            )}

            <div className="admin-table-wrap">
              <table className="admin-table admin-table--frame-recommend">
                <thead>
                  <tr>
                    <th>용도</th>
                    <th>분위기</th>
                    <th>상품명</th>
                    <th className="col-center">삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {frameRecommendProducts.map((row) => (
                    <tr key={row.id}>
                      <td>{formatFrameLabel(row.use)}</td>
                      <td>{formatFrameLabel(row.mood)}</td>
                      <td>{row.productName}</td>
                      <td className="col-center">
                        <button
                          type="button"
                          className="row-icon-btn row-icon-btn--danger"
                          onClick={() => handleDeleteFrameProduct(row.id)}
                          aria-label={`${row.productName} 삭제`}
                          title="삭제"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!frameRecommendProducts.length && !frameAddFormOpen && (
                    <tr>
                      <td colSpan={4} className="admin-list-muted" style={{ textAlign: 'center' }}>
                        등록된 추천 상품이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="faq-add-box-btn frame-recommend-add-btn"
              onClick={handleOpenFrameAddForm}
              disabled={frameAddFormOpen}
              aria-label="추천 상품 추가"
            >
              <Plus size={20} aria-hidden="true" />
            </button>
          </div>
        ) : (
        <div className="faq-content-column">
          <ul className={`faq-accordion-list ${isCategorySwitching ? 'is-switching' : ''}`}>
            {displayFaqItems.length === 0 && <p className="faq-empty">등록된 챗봇 응답이 없습니다.</p>}
            {displayFaqItems.map((faq) => {
              const isOpen = openFaqIds.includes(faq.id);
              const isEditing = editingFaqId === faq.id;

              return (
                <li key={faq.id} className="faq-accordion-row">
                  <div className={`faq-accordion-item ${isOpen ? 'is-open' : ''}`}>
                    <div className="faq-accordion-head">
                      {isEditing ? (
                        <div className="faq-edit-head-row">
                          <input
                            className="faq-edit-input"
                            value={editQuestion}
                            onChange={(e) => setEditQuestion(e.target.value)}
                            placeholder="질문을 입력해 주세요."
                          />
                          <button
                            type="button"
                            className="faq-chevron-btn"
                            onClick={() => handleToggleAccordion(faq.id)}
                            aria-expanded={isOpen}
                            aria-label="아코디언 열기/닫기"
                          >
                            <ChevronDown size={18} className="faq-accordion-chevron" aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="faq-accordion-trigger"
                          onClick={() => handleToggleAccordion(faq.id)}
                          aria-expanded={isOpen}
                        >
                          <span className="faq-question">{faq.question}</span>
                          <ChevronDown size={18} className="faq-accordion-chevron" aria-hidden="true" />
                        </button>
                      )}
                    </div>

                    <div className={`faq-accordion-body ${isOpen ? 'is-open' : ''}`} aria-hidden={!isOpen}>
                      {isEditing ? (
                        <div className="faq-edit-body-wrap">
                          <textarea
                            className="faq-edit-textarea"
                            value={editAnswer}
                            onChange={(e) => setEditAnswer(e.target.value)}
                            rows={5}
                            placeholder="답변을 입력해 주세요."
                          />
                          <button type="button" className="faq-save-text-btn faq-save-text-btn--body" onClick={handleSaveEdit}>
                            저장
                          </button>
                        </div>
                      ) : (
                        <div className="faq-view-body-wrap">
                          <p className="faq-answer">{faq.answer}</p>
                          <button type="button" className="faq-edit-text-btn" onClick={() => handleStartEdit(faq)}>
                            수정
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="faq-actions faq-actions--outside">
                    <button
                      type="button"
                      className="row-icon-btn row-icon-btn--danger"
                      onClick={() => setDeleteTarget({ categoryId: activeCategoryId, faqId: faq.id })}
                      aria-label="챗봇 응답 삭제"
                      title="삭제"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                className="faq-add-box-btn"
                onClick={handleStartCreate}
                disabled={Boolean(creatingFaqId)}
              >
                <Plus size={20} aria-hidden="true" />
              </button>
            </li>
          </ul>
        </div>
        )}
        </section>
      ) : (
        <section className="admin-list-box">
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--new-chatbot">
              <thead>
                <tr>
                  <th className="col-center">순서</th>
                  <th>태그</th>
                  <th>질문유형</th>
                  <th>답변</th>
                  <th>이미지</th>
                  <th className="col-center">감정</th>
                  <th>그룹대장</th>
                  <th>그룹</th>
                  <th>메뉴</th>
                </tr>
              </thead>
              <tbody>
                {sortedNewChatbotRows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="col-center">
                        <div className="banner-order-cell">
                          <span className="banner-order-value">{row.order}</span>
                          <div className="banner-order-actions" aria-label="순서 정렬">
                            <button
                              type="button"
                              className="row-icon-btn row-icon-btn--compact banner-order-sort-btn"
                              aria-label="위로"
                              title="위로"
                              disabled={idx === 0}
                              onClick={() => moveNewChatbotRow(row.id, -1)}
                            >
                              <ChevronUp size={14} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="row-icon-btn row-icon-btn--compact banner-order-sort-btn"
                              aria-label="아래로"
                              title="아래로"
                              disabled={idx === sortedNewChatbotRows.length - 1}
                              onClick={() => moveNewChatbotRow(row.id, 1)}
                            >
                              <ChevronDown size={14} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input--table"
                          value={row.tag}
                          onChange={(e) => updateNewChatbotRow(row.id, { tag: e.target.value })}
                          placeholder="태그"
                        />
                      </td>
                      <td>
                        <textarea
                          className="admin-table-textarea"
                          value={row.questionType}
                          onChange={(e) => updateNewChatbotRow(row.id, { questionType: e.target.value })}
                          placeholder="질문유형"
                        />
                      </td>
                      <td>
                        <textarea
                          className="admin-table-textarea"
                          value={row.answer}
                          onChange={(e) => updateNewChatbotRow(row.id, { answer: e.target.value })}
                          placeholder="답변"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input--table"
                          value={row.imageUrl}
                          onChange={(e) => updateNewChatbotRow(row.id, { imageUrl: e.target.value })}
                          placeholder="이미지 URL"
                        />
                      </td>
                      <td className="col-center">
                        <label className="admin-table-checkbox-label">
                          <input
                            type="checkbox"
                            className="admin-checkbox"
                            checked={row.emotion}
                            onChange={(e) => updateNewChatbotRow(row.id, { emotion: e.target.checked })}
                            aria-label="감정"
                          />
                        </label>
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input--table"
                          value={row.groupLeader}
                          onChange={(e) => updateNewChatbotRow(row.id, { groupLeader: e.target.value })}
                          placeholder="그룹대장"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="input--table"
                          value={row.group}
                          onChange={(e) => updateNewChatbotRow(row.id, { group: e.target.value })}
                          placeholder="그룹"
                        />
                      </td>
                      <td>
                        <textarea
                          className="admin-table-textarea"
                          value={row.menu}
                          onChange={(e) => updateNewChatbotRow(row.id, { menu: e.target.value })}
                          placeholder="메뉴"
                        />
                      </td>
                    </tr>
                ))}
                {!sortedNewChatbotRows.length && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                      등록된 신형챗봇 항목이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="chatbot-new-list-footer">
            <button type="button" className="row-btn row-btn--primary" onClick={handleAddNewChatbotRow}>
              <Plus size={14} aria-hidden="true" />
              항목 추가
            </button>
          </div>
        </section>
      )}

      <Confirm
        open={Boolean(deleteTargetFaq)}
        title="챗봇 응답 삭제"
        message={deleteTargetFaq ? `"${deleteTargetFaq.question}" 항목을 삭제할까요?` : ''}
        confirmText="삭제"
        danger
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
      <Confirm
        open={Boolean(deleteTargetCategory)}
        title="카테고리 삭제"
        message={
          deleteTargetCategory
            ? `"${deleteTargetCategory.label}" 카테고리를 삭제할까요? 해당 카테고리의 질문 항목도 함께 삭제됩니다.`
            : ''
        }
        confirmText="삭제"
        danger
        onClose={() => setDeleteTargetCategoryId(null)}
        onConfirm={handleDeleteCategoryConfirm}
      />
      <Alert open={Boolean(alertMessage)} message={alertMessage} onClose={() => setAlertMessage('')} />
    </div>
  );
}
