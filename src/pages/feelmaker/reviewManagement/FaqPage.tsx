import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import {
  CreditCard,
  UserRound,
  RotateCcw,
  PencilRuler,
  Truck,
  Smartphone,
  ChevronDown,
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
import Alert from '../../../components/alert';
import Confirm from '../../../components/confirm';
import '../../../styles/adminListPage.css';
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
  { id: 'payment', label: '주문/결제', iconKey: 'creditCard' },
  { id: 'member', label: '회원관련', iconKey: 'userRound' },
  { id: 'cancel', label: '취소/환불', iconKey: 'rotateCcw' },
  { id: 'draft', label: '시안/수정', iconKey: 'pencilRuler' },
  { id: 'delivery', label: '배송/제작', iconKey: 'truck' },
  { id: 'mobile', label: '모바일초대장', iconKey: 'smartphone' },
];

const INITIAL_FAQ_BY_CATEGORY: Record<CategoryId, FaqItem[]> = {
  payment: [
    {
      id: 'payment-1',
      question: '결제는 어떤 방법을 지원하나요?',
      answer: '카드 결제와 간편결제를 지원합니다. 자세한 지원 수단은 결제 단계에서 확인할 수 있습니다.',
    },
    {
      id: 'payment-2',
      question: '주문 후 결제수단 변경이 가능한가요?',
      answer: '결제 완료 후에는 결제수단 직접 변경이 어렵습니다. 고객센터로 문의해 주세요.',
    },
  ],
  member: [
    {
      id: 'member-1',
      question: '회원정보는 어디서 수정하나요?',
      answer: '마이페이지 > 회원정보 메뉴에서 이름, 연락처, 비밀번호를 수정할 수 있습니다.',
    },
    {
      id: 'member-2',
      question: '비밀번호를 잊어버렸어요.',
      answer: '로그인 화면의 비밀번호 찾기 기능을 통해 재설정 링크를 받을 수 있습니다.',
    },
  ],
  cancel: [
    {
      id: 'cancel-1',
      question: '취소/환불은 언제까지 가능한가요?',
      answer: '제작이 시작되기 전까지는 취소 요청이 가능하며, 이후에는 진행 단계에 따라 달라질 수 있습니다.',
    },
    {
      id: 'cancel-2',
      question: '환불 금액은 어떻게 산정되나요?',
      answer: '결제 수단, 쿠폰 사용 여부, 제작 진행 상태를 기준으로 환불 금액이 계산됩니다.',
    },
  ],
  draft: [
    {
      id: 'draft-1',
      question: '시안 수정은 몇 회까지 가능한가요?',
      answer: '상품마다 기본 수정 횟수가 다르며, 초과 시 추가 비용이 발생할 수 있습니다.',
    },
    {
      id: 'draft-2',
      question: '수정 요청은 어디에서 남기나요?',
      answer: '주문 상세 페이지의 수정 요청 영역에서 원하는 내용을 남길 수 있습니다.',
    },
  ],
  delivery: [
    {
      id: 'delivery-1',
      question: '제작 기간은 얼마나 걸리나요?',
      answer: '상품 유형에 따라 다르며, 일반적으로 결제 후 3~7일 내 제작이 완료됩니다.',
    },
    {
      id: 'delivery-2',
      question: '배송 상태는 어디서 확인하나요?',
      answer: '마이페이지 주문내역에서 송장번호와 배송 진행 상태를 확인할 수 있습니다.',
    },
  ],
  mobile: [
    {
      id: 'mobile-1',
      question: '모바일초대장 링크 수정이 가능한가요?',
      answer: '발송 전에는 수정 가능하며, 발송 후에는 일부 항목만 제한적으로 수정할 수 있습니다.',
    },
    {
      id: 'mobile-2',
      question: '모바일초대장 배경음악을 바꿀 수 있나요?',
      answer: '제공되는 템플릿 옵션 내에서 배경음악 변경이 가능합니다.',
    },
  ],
};

export default function FaqPage() {
  const [categories, setCategories] = useState<CategoryConfig[]>(() => [...INITIAL_CATEGORIES]);
  const [activeCategoryId, setActiveCategoryId] = useState<CategoryId>('payment');
  const [faqByCategory, setFaqByCategory] = useState<Record<CategoryId, FaqItem[]>>(() => ({
    ...INITIAL_FAQ_BY_CATEGORY,
  }));
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
    () => faqByCategory[activeCategoryId] ?? [],
    [faqByCategory, activeCategoryId]
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
    queueMicrotask(() => {
      setIsCategorySwitching(true);
    });
    const timer = window.setTimeout(() => setIsCategorySwitching(false), 240);
    return () => window.clearTimeout(timer);
  }, [activeCategoryId]);

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
          [activeCategoryId]: [...prev[activeCategoryId], { id: editingFaqId, question, answer }],
        };
      }

      return {
        ...prev,
        [activeCategoryId]: prev[activeCategoryId].map((item) =>
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
      [categoryId]: prev[categoryId].filter((item) => item.id !== faqId),
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
    setFaqByCategory((prev) => ({ ...prev, [newId]: [] }));
    setActiveCategoryId(newId);
    handleStartCategoryEdit(newCategory);
    setOpenFaqIds([]);
    handleCancelEdit();
  };

  const handleDeleteCategoryConfirm = () => {
    if (!deleteTargetCategoryId) return;
    const targetId = deleteTargetCategoryId;

    setCategories((prev) => prev.filter((category) => category.id !== targetId));
    setFaqByCategory((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
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
    <div className="admin-list-page admin-list-page--faq">
      <h1 className="page-title">FAQ관리</h1>

      <section className="admin-list-box faq-layout">
        <aside className="faq-category-column" aria-label="FAQ 카테고리">
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
                        setOpenFaqIds([]);
                        handleCancelEdit();
                        handleCancelCategoryEdit();
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
          <button type="button" className="faq-category-add-btn" onClick={handleAddCategory}>
            <Plus size={14} aria-hidden="true" />
            카테고리 추가
          </button>
        </aside>

        <div className="faq-content-column">
          <ul className={`faq-accordion-list ${isCategorySwitching ? 'is-switching' : ''}`}>
            {displayFaqItems.length === 0 && <p className="faq-empty">등록된 FAQ가 없습니다.</p>}
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
                      aria-label="FAQ 삭제"
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
      </section>

      <Confirm
        open={Boolean(deleteTargetFaq)}
        title="FAQ 삭제"
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
