import { useMemo, useState } from 'react';
import { getVisiblePageNumbers, jumpPageBack, jumpPageForward, PAGINATION_JUMP_PAGES } from '../../../utils/pagination';
import { Download, Plus } from 'lucide-react';
import Modal, { ModalInput } from '../../../components/Modal';
import ListRowCopyButton from '../../../components/ListRowCopyButton';
import Confirm from '../../../components/Confirm';
import '../../../styles/adminPage.css';

const TABS = [
  { id: 'influencer' as const, label: '인플루언서관리' },
  { id: 'settlement' as const, label: '정산관리' },
];

const ITEMS_PER_PAGE = 10;

type TabId = (typeof TABS)[number]['id'];

type InfluencerRow = {
  id: string;
  name: string;
  nickname: string;
  userId: string;
  phone: string;
  email: string;
  personalHash: string;
  companyHash: string;
  instagram: string;
  salesProductNos: string[];
  settlementInfo: {
    bank: string;
    accountHolder: string;
    accountNo: string;
  };
  contractInfo: {
    contractStatus: '계약서 작성전' | '계약서 작성완료';
    settlementContractStatus: '정산계약서 작성전' | '정산계약서 작성완료';
  };
  contractPaymentType: '유료' | '무료';
};

type InfluencerProductRow = {
  productNo: string;
  type: string;
  productType: string;
  imageUrl: string;
  productName: string;
  productPrice: number;
  salePrice: number;
};

type AddInfluencerForm = {
  userId: string;
  password: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
  personalHash: string;
  companyHash: string;
  settlementMethod: '개인' | '사업자';
  siteLink: string;
  settlementBank: string;
  settlementAccountHolder: string;
  settlementPhone: string;
  representativePhotoName: string;
};

const PRODUCT_THUMBNAIL_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='80' height='80' rx='10' fill='%23f3f4f6'/><rect x='14' y='18' width='52' height='44' rx='6' fill='%23d1d5db'/><circle cx='30' cy='34' r='6' fill='%239ca3af'/><path d='M20 56l17-17 10 10 7-7 12 14z' fill='%239ca3af'/></svg>";

const ALL_PRODUCTS: InfluencerProductRow[] = [
  {
    productNo: 'FF-PD-10001',
    type: '필프레임',
    productType: '액자',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '메탈 프레임 12R',
    productPrice: 89000,
    salePrice: 79000,
  },
  {
    productNo: 'FF-PD-10002',
    type: '필프레임',
    productType: '액자',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '우드 프레임 클래식',
    productPrice: 76000,
    salePrice: 69000,
  },
  {
    productNo: 'FF-PD-10003',
    type: '필프레임',
    productType: '인화',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '대형 인화 패키지',
    productPrice: 59000,
    salePrice: 52000,
  },
  {
    productNo: 'FF-PD-10004',
    type: '필프레임',
    productType: '액자',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '미니 포토액자 세트',
    productPrice: 42000,
    salePrice: 36000,
  },
  {
    productNo: 'FF-PD-10005',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10006',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10007',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10008',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10009',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
  {
    productNo: 'FF-PD-10010',
    type: '필프레임',
    productType: '굿즈',
    imageUrl: PRODUCT_THUMBNAIL_FALLBACK,
    productName: '포토카드 패키지',
    productPrice: 29000,
    salePrice: 24000,
  },
];

const MOCK_INFLUENCERS: InfluencerRow[] = [
  {
    id: 'influencer-001',
    name: '김민지',
    nickname: '민지프레임',
    userId: 'minji_frame',
    phone: '010-1234-5678',
    email: 'minji@example.com',
    personalHash: '#minji_frame',
    companyHash: '#feelframe_minji',
    instagram: '@minji_frame',
    salesProductNos: ['FF-PD-10001', 'FF-PD-10002'],
    settlementInfo: {
      bank: '국민은행',
      accountHolder: '김민지',
      accountNo: '123456-01-123456',
    },
    contractInfo: {
      contractStatus: '계약서 작성완료',
      settlementContractStatus: '정산계약서 작성완료',
    },
    contractPaymentType: '유료',
  },
  {
    id: 'influencer-002',
    name: '이서연',
    nickname: '서연픽',
    userId: 'seoyeon_pic',
    phone: '010-2345-6789',
    email: 'seoyeon@example.com',
    personalHash: '#seoyeon_photo',
    companyHash: '#feelframe_seoyeon',
    instagram: '@seoyeon_pic',
    salesProductNos: ['FF-PD-10003'],
    settlementInfo: {
      bank: '신한은행',
      accountHolder: '이서연',
      accountNo: '110-123-456789',
    },
    contractInfo: {
      contractStatus: '계약서 작성완료',
      settlementContractStatus: '정산계약서 작성전',
    },
    contractPaymentType: '무료',
  },
  {
    id: 'influencer-003',
    name: '박지훈',
    nickname: '지훈스튜디오',
    userId: 'jihun_studio',
    phone: '010-3456-7890',
    email: 'jihun@example.com',
    personalHash: '#jihun_studio',
    companyHash: '#feelframe_jihun',
    instagram: '@jihun_studio',
    salesProductNos: ['FF-PD-10004', 'FF-PD-10005'],
    settlementInfo: {
      bank: '우리은행',
      accountHolder: '박지훈',
      accountNo: '1002-123-456789',
    },
    contractInfo: {
      contractStatus: '계약서 작성전',
      settlementContractStatus: '정산계약서 작성전',
    },
    contractPaymentType: '무료',
  },
  {
    id: 'influencer-004',
    name: '최유진',
    nickname: '유진데일리',
    userId: 'yujin_daily',
    phone: '010-4567-8901',
    email: 'yujin@example.com',
    personalHash: '#daily_yujin',
    companyHash: '#feelframe_yujin',
    instagram: '@yujin_daily',
    salesProductNos: ['FF-PD-10001'],
    settlementInfo: {
      bank: '하나은행',
      accountHolder: '최유진',
      accountNo: '456-910123-45607',
    },
    contractInfo: {
      contractStatus: '계약서 작성완료',
      settlementContractStatus: '정산계약서 작성완료',
    },
    contractPaymentType: '유료',
  },
  {
    id: 'influencer-005',
    name: '정다은',
    nickname: '다은홈',
    userId: 'daeun_home',
    phone: '010-5678-9012',
    email: 'daeun@example.com',
    personalHash: '#daeun_home',
    companyHash: '#feelframe_daeun',
    instagram: '@daeun_home',
    salesProductNos: ['FF-PD-10002'],
    settlementInfo: {
      bank: '카카오뱅크',
      accountHolder: '정다은',
      accountNo: '3333-12-1234567',
    },
    contractInfo: {
      contractStatus: '계약서 작성전',
      settlementContractStatus: '정산계약서 작성완료',
    },
    contractPaymentType: '무료',
  },
];

type ConfirmDialogState = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
};

function createInfluencerHash(seed: string, fallback: string) {
  const normalized = seed.trim().replace(/\s+/g, '_');
  return `#${normalized || fallback}`;
}

function createEmptyAddInfluencerForm(): AddInfluencerForm {
  return {
    userId: '',
    password: '',
    name: '',
    nickname: '',
    phone: '',
    email: '',
    personalHash: createInfluencerHash('', 'personal_auto'),
    companyHash: createInfluencerHash('', 'feelframe_auto'),
    settlementMethod: '개인',
    siteLink: '',
    settlementBank: '',
    settlementAccountHolder: '',
    settlementPhone: '',
    representativePhotoName: '',
  };
}

function createAddInfluencerFormFromRow(row: InfluencerRow): AddInfluencerForm {
  return {
    userId: row.userId === '-' ? '' : row.userId,
    password: '',
    name: row.name === '-' ? '' : row.name,
    nickname: row.nickname === '-' ? '' : row.nickname,
    phone: row.phone === '-' ? '' : row.phone,
    email: row.email === '-' ? '' : row.email,
    personalHash: row.personalHash,
    companyHash: row.companyHash,
    settlementMethod: '개인',
    siteLink: row.instagram === '-' ? '' : row.instagram,
    settlementBank: row.settlementInfo.bank === '-' ? '' : row.settlementInfo.bank,
    settlementAccountHolder: row.settlementInfo.accountHolder === '-' ? '' : row.settlementInfo.accountHolder,
    settlementPhone: row.settlementInfo.accountNo === '-' ? '' : row.settlementInfo.accountNo,
    representativePhotoName: '',
  };
}

function getContractClassName(status: InfluencerRow['contractInfo']['contractStatus'] | InfluencerRow['contractInfo']['settlementContractStatus']) {
  return `row-btn ${status.endsWith('작성완료') ? 'row-btn--status-secondary' : 'row-btn--status-warning'}`;
}

function getContractAddress(row: InfluencerRow, type: 'contract' | 'settlement') {
  return `/feelframe/salesManagement/influencerList/${row.id}/${type}`;
}

export default function InfluencerListPage() {
  const [activeTab, setActiveTab] = useState<TabId>('influencer');
  const [rows, setRows] = useState<InfluencerRow[]>(() => [...MOCK_INFLUENCERS]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productModalInfluencerId, setProductModalInfluencerId] = useState<string | null>(null);
  const [selectedProductNos, setSelectedProductNos] = useState<Set<string>>(() => new Set());
  const [addInfluencerModalOpen, setAddInfluencerModalOpen] = useState(false);
  const [editingInfluencerId, setEditingInfluencerId] = useState<string | null>(null);
  const [addInfluencerForm, setAddInfluencerForm] = useState<AddInfluencerForm>(() => createEmptyAddInfluencerForm());
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const displayPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = useMemo(() => {
    const start = (displayPage - 1) * ITEMS_PER_PAGE;
    return rows.slice(start, start + ITEMS_PER_PAGE);
  }, [rows, displayPage]);
  const productModalInfluencer = useMemo(
    () => rows.find((row) => row.id === productModalInfluencerId) ?? null,
    [rows, productModalInfluencerId]
  );

  const openAddInfluencerModal = () => {
    setEditingInfluencerId(null);
    setAddInfluencerForm(createEmptyAddInfluencerForm());
    setAddInfluencerModalOpen(true);
  };

  const openEditInfluencerModal = (row: InfluencerRow) => {
    setEditingInfluencerId(row.id);
    setAddInfluencerForm(createAddInfluencerFormFromRow(row));
    setAddInfluencerModalOpen(true);
  };

  const closeAddInfluencerModal = () => {
    setAddInfluencerModalOpen(false);
    setEditingInfluencerId(null);
  };

  const updateAddInfluencerForm = <K extends keyof AddInfluencerForm>(key: K, value: AddInfluencerForm[K]) => {
    setAddInfluencerForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'userId') {
        const seed = String(value);
        next.personalHash = createInfluencerHash(seed, 'personal_auto');
        next.companyHash = createInfluencerHash(`feelframe_${seed}`, 'feelframe_auto');
      }
      return next;
    });
  };

  const handleAddInfluencerSubmit = () => {
    setRows((prev) => {
      if (editingInfluencerId) {
        return prev.map((row) =>
          row.id === editingInfluencerId
            ? {
                ...row,
                name: addInfluencerForm.name || '-',
                nickname: addInfluencerForm.nickname || '-',
                userId: addInfluencerForm.userId || '-',
                phone: addInfluencerForm.phone || addInfluencerForm.settlementPhone || '-',
                email: addInfluencerForm.email || '-',
                personalHash: addInfluencerForm.personalHash,
                companyHash: addInfluencerForm.companyHash,
                instagram: addInfluencerForm.siteLink || '-',
                settlementInfo: {
                  bank: addInfluencerForm.settlementBank || '-',
                  accountHolder: addInfluencerForm.settlementAccountHolder || '-',
                  accountNo: addInfluencerForm.settlementPhone || '-',
                },
              }
            : row
        );
      }

      return [
        {
          id: `influencer-${Date.now()}`,
          name: addInfluencerForm.name || '-',
          nickname: addInfluencerForm.nickname || '-',
          userId: addInfluencerForm.userId || '-',
          phone: addInfluencerForm.phone || addInfluencerForm.settlementPhone || '-',
          email: addInfluencerForm.email || '-',
          personalHash: addInfluencerForm.personalHash,
          companyHash: addInfluencerForm.companyHash,
          instagram: addInfluencerForm.siteLink || '-',
          salesProductNos: [],
          settlementInfo: {
            bank: addInfluencerForm.settlementBank || '-',
            accountHolder: addInfluencerForm.settlementAccountHolder || '-',
            accountNo: addInfluencerForm.settlementPhone || '-',
          },
          contractInfo: {
            contractStatus: '계약서 작성전',
            settlementContractStatus: '정산계약서 작성전',
          },
          contractPaymentType: '무료',
        },
        ...prev,
      ];
    });
    setCurrentPage(1);
    closeAddInfluencerModal();
  };

  const openProductModal = (row: InfluencerRow) => {
    setProductModalInfluencerId(row.id);
    setSelectedProductNos(new Set(row.salesProductNos));
  };

  const closeProductModal = () => {
    setProductModalInfluencerId(null);
    setSelectedProductNos(new Set());
  };

  const toggleProduct = (productNo: string) => {
    setSelectedProductNos((prev) => {
      const next = new Set(prev);
      if (next.has(productNo)) next.delete(productNo);
      else next.add(productNo);
      return next;
    });
  };

  const toggleAllProducts = () => {
    setSelectedProductNos((prev) =>
      prev.size === ALL_PRODUCTS.length ? new Set() : new Set(ALL_PRODUCTS.map((product) => product.productNo))
    );
  };

  const saveProductModal = () => {
    if (!productModalInfluencer) return;
    setRows((prev) =>
      prev.map((row) =>
        row.id === productModalInfluencer.id ? { ...row, salesProductNos: Array.from(selectedProductNos) } : row
      )
    );
    closeProductModal();
  };

  const closeConfirmDialog = () => setConfirmDialog(null);

  const handleConfirmDialogConfirm = () => {
    if (!confirmDialog) return;
    confirmDialog.onConfirm();
    closeConfirmDialog();
  };

  const openContractPaymentSwitchConfirm = (row: InfluencerRow) => {
    setConfirmDialog({
      title: '계약 전환',
      message: '전환하시겠습니까?',
      confirmText: '전환',
      cancelText: '취소',
      onConfirm: () => {
        setRows((prev) =>
          prev.map((item) =>
            item.id === row.id
              ? { ...item, contractPaymentType: item.contractPaymentType === '유료' ? '무료' : '유료' }
              : item
          )
        );
      },
    });
  };

  const handleDelete = (id: string) => {
    setRows((prev) => prev.filter((row) => row.id !== id));
    setCurrentPage(1);
  };

  return (
    <div className="admin-list-page">
      <div className="admin-list-page-header">
        <h1 className="page-title">인플루언서관리</h1>
        <div className="admin-list-page-header__actions">
          <button type="button" className="admin-list-add-btn" onClick={openAddInfluencerModal} aria-label="인플루언서 추가">
            <Plus size={18} aria-hidden="true" />
            인플루언서 추가
          </button>
        </div>
      </div>

      <nav className="admin-tabs" aria-label="인플루언서 관리 탭">
        <div className="admin-tabs__list" role="tablist">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                className={`admin-tabs__tab${isActive ? ' admin-tabs__tab--active' : ''}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === 'influencer' ? (
        <section className="admin-list-box admin-list-box--table" aria-label="인플루언서 목록">
          <div className="admin-table-wrap">
            <table className="admin-table admin-table--min-w-1024">
              <thead>
                <tr>
                  <th className="col-center">이름</th>
                  <th>닉네임</th>
                  <th>아이디</th>
                  <th>전화번호</th>
                  <th>메일주소</th>
                  <th>개인해시</th>
                  <th>사이트링크</th>
                  <th className="col-center">판매상품</th>
                  <th className="col-center">정산정보</th>
                  <th className="col-center">계약정보</th>
                  <th className="col-center">수정</th>
                  <th className="col-center">삭제</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="admin-table-empty-cell">
                      데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr key={row.id}>
                      <td className="col-center">
                        <div className="cell-block">
                          <span className="cell-line">{row.name}</span>
                          <span className="cell-line cell-line--with-action">
                            <span className={row.contractPaymentType === '유료' ? 'text-color-blue' : 'text-danger'}>
                              {row.contractPaymentType}
                            </span>
                            <button
                              type="button"
                              className="row-btn row-btn--default"
                              onClick={() => openContractPaymentSwitchConfirm(row)}
                            >
                              전환
                            </button>
                          </span>
                        </div>
                      </td>
                      <td>{row.nickname}</td>
                      <td>{row.userId}</td>
                      <td>{row.phone}</td>
                      <td>{row.email}</td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line cell-line--with-action">
                            <span className="list-label">개인</span>
                            <span>{row.personalHash}</span>
                            <ListRowCopyButton text={row.personalHash} onCopied={() => undefined} ariaLabel="개인해시 복사" />
                          </span>
                          <span className="cell-line cell-line--with-action">
                            <span className="list-label">자사</span>
                            <span>{row.companyHash}</span>
                            <ListRowCopyButton text={row.companyHash} onCopied={() => undefined} ariaLabel="자사해시 복사" />
                          </span>
                        </div>
                      </td>
                      <td>{row.instagram}</td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--default" onClick={() => openProductModal(row)}>
                          상품관리
                        </button>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">{row.settlementInfo.bank}</span>
                          <span className="cell-line">{row.settlementInfo.accountHolder}</span>
                          <span className="cell-line admin-list-muted">{row.settlementInfo.accountNo}</span>
                        </div>
                      </td>
                      <td className="col-center">
                        <div className="cell-block">
                          <span className="cell-line cell-line--with-action">
                            <span className={getContractClassName(row.contractInfo.contractStatus)}>
                              {row.contractInfo.contractStatus}
                            </span>
                            <ListRowCopyButton
                              text={getContractAddress(row, 'contract')}
                              ariaLabel="계약서 주소 복사"
                            />
                            {row.contractInfo.contractStatus === '계약서 작성완료' && (
                              <>
                                <button
                                  type="button"
                                  className="row-icon-btn row-icon-btn--tone-primary row-icon-btn--inline-sm"
                                  aria-label="계약서 다운로드"
                                >
                                  <Download size={12} aria-hidden="true" />
                                </button>
                                <button type="button" className="row-btn row-btn--default">
                                  신분증
                                </button>
                              </>
                            )}
                          </span>
                          <span className="cell-line cell-line--with-action">
                            <span className={getContractClassName(row.contractInfo.settlementContractStatus)}>
                              {row.contractInfo.settlementContractStatus}
                            </span>
                            <ListRowCopyButton
                              text={getContractAddress(row, 'settlement')}
                              ariaLabel="정산계약서 주소 복사"
                            />
                            {row.contractInfo.settlementContractStatus === '정산계약서 작성완료' && (
                              <button
                                type="button"
                                className="row-icon-btn row-icon-btn--tone-primary row-icon-btn--inline-sm"
                                aria-label="정산계약서 다운로드"
                              >
                                <Download size={12} aria-hidden="true" />
                              </button>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--primary" onClick={() => openEditInfluencerModal(row)}>
                          수정
                        </button>
                      </td>
                      <td className="col-center">
                        <button type="button" className="row-btn row-btn--red" onClick={() => handleDelete(row.id)}>
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="admin-list-table-footer">
            <div className="admin-table-pagination">
              <div className="pagination-inner">
                <button
                  type="button"
                  onClick={() => setCurrentPage(jumpPageBack(displayPage))}
                  disabled={displayPage <= 1}
                  aria-label={`${PAGINATION_JUMP_PAGES}페이지 이전`}
                >
                  &laquo;
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, displayPage - 1))}
                  disabled={displayPage <= 1}
                  aria-label="이전 페이지"
                >
                  &lsaquo;
                </button>
                {getVisiblePageNumbers(totalPages, displayPage).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={displayPage === page ? 'active' : ''}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.min(totalPages, displayPage + 1))}
                  disabled={displayPage >= totalPages}
                  aria-label="다음 페이지"
                >
                  &rsaquo;
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(jumpPageForward(displayPage, totalPages))}
                  disabled={displayPage >= totalPages}
                  aria-label={`${PAGINATION_JUMP_PAGES}페이지 다음`}
                >
                  &raquo;
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="admin-list-box" aria-label="정산관리">
          <p className="admin-list-result">정산관리 목록은 준비중입니다.</p>
        </section>
      )}

      <Modal
        open={addInfluencerModalOpen}
        onClose={closeAddInfluencerModal}
        ariaLabel={editingInfluencerId ? '인플루언서 수정' : '인플루언서 추가'}
        variant="option"
      >
        <Modal.Header>
          <Modal.Title>{editingInfluencerId ? '인플루언서 수정' : '인플루언서 추가'}</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-field-grid">
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-id">
                아이디
              </label>
              <ModalInput
                id="influencer-add-id"
                type="text"
                value={addInfluencerForm.userId}
                onChange={(e) => updateAddInfluencerForm('userId', e.target.value)}
                placeholder="아이디 입력"
                autoComplete="username"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-password">
                비밀번호
              </label>
              <ModalInput
                id="influencer-add-password"
                type="password"
                value={addInfluencerForm.password}
                onChange={(e) => updateAddInfluencerForm('password', e.target.value)}
                placeholder="비밀번호 입력"
                autoComplete="new-password"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-name">
                이름
              </label>
              <ModalInput
                id="influencer-add-name"
                type="text"
                value={addInfluencerForm.name}
                onChange={(e) => updateAddInfluencerForm('name', e.target.value)}
                placeholder="이름 입력"
                autoComplete="name"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-nickname">
                닉네임
              </label>
              <ModalInput
                id="influencer-add-nickname"
                type="text"
                value={addInfluencerForm.nickname}
                onChange={(e) => updateAddInfluencerForm('nickname', e.target.value)}
                placeholder="닉네임 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-phone">
                전화번호
              </label>
              <ModalInput
                id="influencer-add-phone"
                type="tel"
                value={addInfluencerForm.phone}
                onChange={(e) => updateAddInfluencerForm('phone', e.target.value)}
                placeholder="전화번호 입력"
                autoComplete="tel"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-email">
                이메일
              </label>
              <ModalInput
                id="influencer-add-email"
                type="email"
                value={addInfluencerForm.email}
                onChange={(e) => updateAddInfluencerForm('email', e.target.value)}
                placeholder="이메일 입력"
                autoComplete="email"
              />
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">개인해시</span>
              <ModalInput type="text" value={addInfluencerForm.personalHash} aria-label="개인해시" readOnly />
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">자사해시</span>
              <ModalInput type="text" value={addInfluencerForm.companyHash} aria-label="자사해시" readOnly />
            </div>
            <div className="admin-modal-field-row">
              <span className="admin-modal-field-label">정산방식</span>
              <div className="option-modal__inline-controls">
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={addInfluencerForm.settlementMethod === '개인'}
                    onChange={() => updateAddInfluencerForm('settlementMethod', '개인')}
                  />
                  개인
                </label>
                <label className="admin-checkbox-label">
                  <input
                    type="checkbox"
                    className="admin-checkbox"
                    checked={addInfluencerForm.settlementMethod === '사업자'}
                    onChange={() => updateAddInfluencerForm('settlementMethod', '사업자')}
                  />
                  사업자
                </label>
              </div>
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-site-link">
                사이트링크
              </label>
              <ModalInput
                id="influencer-add-site-link"
                type="url"
                value={addInfluencerForm.siteLink}
                onChange={(e) => updateAddInfluencerForm('siteLink', e.target.value)}
                placeholder="사이트 링크 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-bank">
                정산정보 - 은행
              </label>
              <ModalInput
                id="influencer-add-bank"
                type="text"
                value={addInfluencerForm.settlementBank}
                onChange={(e) => updateAddInfluencerForm('settlementBank', e.target.value)}
                placeholder="은행 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-account-holder">
                정산정보 - 예금주
              </label>
              <ModalInput
                id="influencer-add-account-holder"
                type="text"
                value={addInfluencerForm.settlementAccountHolder}
                onChange={(e) => updateAddInfluencerForm('settlementAccountHolder', e.target.value)}
                placeholder="예금주 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-settlement-phone">
                정산정보 - 전화번호
              </label>
              <ModalInput
                id="influencer-add-settlement-phone"
                type="tel"
                value={addInfluencerForm.settlementPhone}
                onChange={(e) => updateAddInfluencerForm('settlementPhone', e.target.value)}
                placeholder="전화번호 입력"
              />
            </div>
            <div className="admin-modal-field-row">
              <label className="admin-modal-field-label" htmlFor="influencer-add-photo">
                대표사진
              </label>
              <ModalInput
                id="influencer-add-photo"
                type="file"
                accept="image/*"
                onChange={(e) => updateAddInfluencerForm('representativePhotoName', e.target.files?.[0]?.name ?? '')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeAddInfluencerModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={handleAddInfluencerSubmit}>
            {editingInfluencerId ? '저장' : '등록'}
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
        open={Boolean(productModalInfluencer)}
        onClose={closeProductModal}
        ariaLabel="판매상품 관리"
        variant="option"
        panelClassName="option-modal__panel--wide"
      >
        <Modal.Header>
          <Modal.Title>판매상품 관리</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="admin-modal-table-wrap">
            <table className="admin-modal-table">
              <thead>
                <tr>
                  <th className="col-center">
                    <input
                      type="checkbox"
                      className="admin-checkbox"
                      checked={selectedProductNos.size === ALL_PRODUCTS.length}
                      onChange={toggleAllProducts}
                      aria-label="전체 상품 선택"
                    />
                  </th>
                  <th>타입</th>
                  <th>상품타입</th>
                  <th>상품이미지</th>
                  <th>상품명</th>
                  <th>상품가</th>
                  <th>판매가</th>
                </tr>
              </thead>
              <tbody>
                {ALL_PRODUCTS.map((product) => (
                  <tr key={product.productNo}>
                    <td className="col-center">
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={selectedProductNos.has(product.productNo)}
                        onChange={() => toggleProduct(product.productNo)}
                        aria-label={`${product.productName} 선택`}
                      />
                    </td>
                    <td>{product.type}</td>
                    <td>{product.productType}</td>
                    <td>
                      <img
                        src={product.imageUrl}
                        alt={`${product.productName} 이미지`}
                        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }}
                      />
                    </td>
                    <td>{product.productName}</td>
                    <td>{product.productPrice.toLocaleString()}원</td>
                    <td>{product.salePrice.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="option-modal__btn option-modal__btn--ghost" onClick={closeProductModal}>
            닫기
          </button>
          <button type="button" className="option-modal__btn option-modal__btn--primary" onClick={saveProductModal}>
            저장
          </button>
        </Modal.Footer>
      </Modal>

      <Confirm
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message ?? ''}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        onClose={closeConfirmDialog}
        onConfirm={handleConfirmDialogConfirm}
      />
    </div>
  );
}
