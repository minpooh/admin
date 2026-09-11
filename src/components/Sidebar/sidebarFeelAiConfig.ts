import type { IconType } from 'react-icons';
import { HiSparkles } from "react-icons/hi2";

export type FeelAiSectionId = 'aiManagement';

export type FeelAiSectionConfigItem = {
    id: string;
    title: string;
    icon: IconType;
    items: { id: string; icon: IconType; label: string; active?: boolean; subItems?: { label: string }[] }[];
    expandable: boolean;
    subItemKeyPrefix?: string;
};
export const FEELAI_SECTION_CONFIG: FeelAiSectionConfigItem[] = [
    { id: 'aiManagement', title: 'AI 관리', icon: HiSparkles, items: [], expandable: true, subItemKeyPrefix: 'page' },
];

export const FEELAI_SECTION_IDS: FeelAiSectionId[] = ['aiManagement'];