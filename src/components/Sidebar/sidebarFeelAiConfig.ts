import type { IconType } from 'react-icons';
import { 
    HiBuildingStorefront,
    HiCurrencyDollar,
    HiCircleStack,
    HiComputerDesktop,
    HiSparkles,
    HiPencilSquare,
    HiPhoto,
    HiFilm,
    HiPlayCircle,
    HiServer,
    HiCpuChip,
    HiQuestionMarkCircle,
    HiChatBubbleLeftRight,
    HiExclamationTriangle
} from "react-icons/hi2";

export type FeelAiSectionId = 'tokenManagement' | 'workHistoryManagement' | 'inquiryManagement' | 'pcManagement';

export type FeelAiSectionConfigItem = {
    id: string;
    title: string;
    icon: IconType;
    items: { id: string; icon: IconType; label: string; active?: boolean; subItems?: { label: string }[] }[];
    expandable: boolean;
    subItemKeyPrefix?: string;
};

export const TOKEN_MANAGEMENT = [
    { id: 'tokenMaker', icon: HiSparkles, label: '메이커 토큰' },
    { id: 'tokenStore', icon: HiBuildingStorefront, label: '스토어 토큰' },
    { id: 'tokenPrice', icon: HiCurrencyDollar, label: '토큰단가 설정' },
];

export const WORK_HISTORY_MANAGEMENT = [
    { id: 'workHistoryIntro', icon: HiFilm, label: '인트로 작업내역' },
    { id: 'workHistoryRetouch', icon: HiPhoto, label: '사진보정 작업내역' },
    { id: 'workHistoryPhoto', icon: HiPlayCircle, label: '모션포토 작업내역' },
];

export const INQUIRY_MANAGEMENT = [
    { id: 'inquiry', icon: HiChatBubbleLeftRight, label: '1:1 문의' },
    { id: 'aiErrorCheck', icon: HiExclamationTriangle, label: 'AI 오류확인' },
];

export const PC_MANAGEMENT = [
    { id: 'motionPhotoServer', icon: HiServer, label: '모션포토 서버 현황' },
    { id: 'introWan22', icon: HiCpuChip, label: '인트로 wan 2.2 제작 현황' },
];

export const FEELAI_SECTION_CONFIG: FeelAiSectionConfigItem[] = [
    { id: 'tokenManagement', title: '토큰 관리', icon: HiCircleStack, items: TOKEN_MANAGEMENT, expandable: true, subItemKeyPrefix: 'page' },
    { id: 'workHistoryManagement', title: '작업내역 관리', icon: HiPencilSquare, items: WORK_HISTORY_MANAGEMENT, expandable: true, subItemKeyPrefix: 'page' },
    { id: 'inquiryManagement', title: '문의 관리', icon: HiQuestionMarkCircle, items: INQUIRY_MANAGEMENT, expandable: true, subItemKeyPrefix: 'page' },
    { id: 'pcManagement', title: 'PC 관리', icon: HiComputerDesktop, items: PC_MANAGEMENT, expandable: true, subItemKeyPrefix: 'page' },
];

export const FEELAI_SECTION_IDS: FeelAiSectionId[] = [
    'tokenManagement',
    'workHistoryManagement',
    'inquiryManagement',
    'pcManagement',
];