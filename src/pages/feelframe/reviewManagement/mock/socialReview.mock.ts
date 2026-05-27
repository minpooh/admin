/** 필프레임 · 리뷰관리 · 소셜리뷰 목록·상세 목업 */

export type SocialReviewProduct = {
  id: string;
  name: string;
  imageUrl: string;
};

export type SocialReviewSnsType = '네이버블로그' | '네이버카페' | '인스타그램' | '유튜브';

export type SocialReviewEntry = {
  id: string;
  productId: string;
  sns: SocialReviewSnsType;
  url: string;
  imageUrl: string;
  viewCount: number;
  exposed: boolean;
  createdAt: string;
};

const FRAME_IMAGE = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=480&h=480&q=80`;

export const SOCIAL_REVIEW_SNS_OPTIONS: { value: SocialReviewSnsType; label: string }[] = [
  { value: '네이버블로그', label: '네이버블로그' },
  { value: '네이버카페', label: '네이버카페' },
  { value: '인스타그램', label: '인스타그램' },
  { value: '유튜브', label: '유튜브' },
];

export const MOCK_SOCIAL_REVIEW_PRODUCTS: SocialReviewProduct[] = [
  {
    id: 'ff-prod-001',
    name: '메탈 프레임 12R',
    imageUrl: FRAME_IMAGE('photo-1583847268964-b28dc8f51f92'),
  },
  {
    id: 'ff-prod-002',
    name: '우드 프레임 클래식',
    imageUrl: FRAME_IMAGE('photo-1549490349-8643362247b5'),
  },
  {
    id: 'ff-prod-003',
    name: '미니 포토액자 세트',
    imageUrl: FRAME_IMAGE('photo-1513694203232-719a280e022f'),
  },
  {
    id: 'ff-prod-004',
    name: '대형 인화 패키지',
    imageUrl: FRAME_IMAGE('photo-1616486338812-3dadae4b4ace'),
  },
  {
    id: 'ff-prod-005',
    name: '한정판 골드 라인',
    imageUrl: FRAME_IMAGE('photo-1560185007-cde436f6a4d0'),
  },
  {
    id: 'ff-prod-006',
    name: '촬영+액자 패키지',
    imageUrl: FRAME_IMAGE('photo-1513519245088-0e12902e5a38'),
  },
  {
    id: 'ff-prod-007',
    name: '아크릴 탁상용',
    imageUrl: FRAME_IMAGE('photo-1615529328331-f8917597711f'),
  },
  {
    id: 'ff-prod-008',
    name: '원목 원형 액자',
    imageUrl: FRAME_IMAGE('photo-1586023492125-27b2c045efd7'),
  },
  {
    id: 'ff-prod-009',
    name: '포토카드 패키지',
    imageUrl: FRAME_IMAGE('photo-1600210492486-724fe5c67fb0'),
  },
];

const MOCK_SOCIAL_REVIEW_ENTRIES: SocialReviewEntry[] = [
  {
    id: 'sr-001-1',
    productId: 'ff-prod-001',
    sns: '네이버블로그',
    url: 'https://blog.naver.com/example/223456789012',
    imageUrl: FRAME_IMAGE('photo-1549490349-8643362247b5'),
    viewCount: 1284,
    exposed: true,
    createdAt: '2026-05-10 14:22',
  },
  {
    id: 'sr-001-2',
    productId: 'ff-prod-001',
    sns: '인스타그램',
    url: 'https://www.instagram.com/p/example001/',
    imageUrl: FRAME_IMAGE('photo-1513694203232-719a280e022f'),
    viewCount: 3420,
    exposed: true,
    createdAt: '2026-05-08 09:15',
  },
  {
    id: 'sr-001-3',
    productId: 'ff-prod-001',
    sns: '유튜브',
    url: 'https://www.youtube.com/watch?v=example001',
    imageUrl: FRAME_IMAGE('photo-1616486338812-3dadae4b4ace'),
    viewCount: 8920,
    exposed: false,
    createdAt: '2026-05-05 18:40',
  },
  {
    id: 'sr-001-4',
    productId: 'ff-prod-001',
    sns: '네이버카페',
    url: 'https://cafe.naver.com/example/12345',
    imageUrl: FRAME_IMAGE('photo-1560185007-cde436f6a4d0'),
    viewCount: 756,
    exposed: true,
    createdAt: '2026-05-02 11:08',
  },
  {
    id: 'sr-002-1',
    productId: 'ff-prod-002',
    sns: '네이버블로그',
    url: 'https://blog.naver.com/example/223456789013',
    imageUrl: FRAME_IMAGE('photo-1513519245088-0e12902e5a38'),
    viewCount: 980,
    exposed: true,
    createdAt: '2026-05-09 16:33',
  },
  {
    id: 'sr-002-2',
    productId: 'ff-prod-002',
    sns: '네이버카페',
    url: 'https://cafe.naver.com/example/12346',
    imageUrl: FRAME_IMAGE('photo-1615529328331-f8917597711f'),
    viewCount: 412,
    exposed: false,
    createdAt: '2026-05-07 10:20',
  },
  {
    id: 'sr-003-1',
    productId: 'ff-prod-003',
    sns: '인스타그램',
    url: 'https://www.instagram.com/p/example003/',
    imageUrl: FRAME_IMAGE('photo-1586023492125-27b2c045efd7'),
    viewCount: 2150,
    exposed: true,
    createdAt: '2026-05-11 08:55',
  },
  {
    id: 'sr-004-1',
    productId: 'ff-prod-004',
    sns: '유튜브',
    url: 'https://www.youtube.com/watch?v=example004',
    imageUrl: FRAME_IMAGE('photo-1600210492486-724fe5c67fb0'),
    viewCount: 5630,
    exposed: true,
    createdAt: '2026-05-06 20:12',
  },
];

export function getSocialReviewProductById(id: string): SocialReviewProduct | undefined {
  return MOCK_SOCIAL_REVIEW_PRODUCTS.find((product) => product.id === id);
}

export function getSocialReviewEntriesByProductId(productId: string): SocialReviewEntry[] {
  return MOCK_SOCIAL_REVIEW_ENTRIES.filter((entry) => entry.productId === productId).map((entry) => ({ ...entry }));
}

export function getDefaultSocialReviewThumbnail(sns: SocialReviewSnsType): string {
  const map: Record<SocialReviewSnsType, string> = {
    네이버블로그: FRAME_IMAGE('photo-1583847268964-b28dc8f51f92'),
    네이버카페: FRAME_IMAGE('photo-1549490349-8643362247b5'),
    인스타그램: FRAME_IMAGE('photo-1513694203232-719a280e022f'),
    유튜브: FRAME_IMAGE('photo-1616486338812-3dadae4b4ace'),
  };
  return map[sns];
}
