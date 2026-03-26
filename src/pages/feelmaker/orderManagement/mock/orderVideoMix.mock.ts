export type VideoMixStatus = '병합대기' | '병합중' | '병합완료' | '병합실패';

export type VideoMixItem = {
  id: string;
  createdAt: string;
  customerName: string;
  customerId: string;
  customerPhone: string;
  status: VideoMixStatus;
  failReason: string;
  video1Url?: string;
  video2Url?: string;
  mergedVideoUrl?: string;
};

export const MOCK_VIDEO_MIX_ORDERS: VideoMixItem[] = [
  {
    id: 'vm-1001',
    createdAt: '2026-03-26 10:12:00',
    customerName: '김민지',
    customerId: 'minji01',
    customerPhone: '010-1234-9876',
    status: '병합실패',
    failReason: 'ffmpeg concat fail:',
    video1Url: 'https://example.com/video/vm-1001-1.mp4',
    video2Url: 'https://example.com/video/vm-1001-2.mp4',
    mergedVideoUrl: 'https://example.com/video/vm-1001-merged.mp4',
  },
  {
    id: 'vm-1002',
    createdAt: '2026-03-26 09:48:00',
    customerName: '박서준',
    customerId: 'sjpark',
    customerPhone: '010-2222-3333',
    status: '병합중',
    failReason: '',
    video1Url: 'https://example.com/video/vm-1002-1.mp4',
    video2Url: 'https://example.com/video/vm-1002-2.mp4',
  },
  {
    id: 'vm-1003',
    createdAt: '2026-03-25 18:31:00',
    customerName: '이소라',
    customerId: 'sora_lee',
    customerPhone: '010-8989-3434',
    status: '병합실패',
    failReason: '영상 코덱이 지원되지 않습니다.',
    video1Url: 'https://example.com/video/vm-1003-1.mov',
    video2Url: 'https://example.com/video/vm-1003-2.mp4',
  },
  {
    id: 'vm-1004',
    createdAt: '2026-03-25 17:05:00',
    customerName: '정유나',
    customerId: 'yuna77',
    customerPhone: '010-4411-7799',
    status: '병합대기',
    failReason: '',
  },
  {
    id: 'vm-1005',
    createdAt: '2026-03-25 16:14:00',
    customerName: '최도훈',
    customerId: 'dohoon_c',
    customerPhone: '010-7373-2929',
    status: '병합완료',
    failReason: '',
    video1Url: 'https://example.com/video/vm-1005-1.mp4',
    video2Url: 'https://example.com/video/vm-1005-2.mp4',
    mergedVideoUrl: 'https://example.com/video/vm-1005-merged.mp4',
  },
  {
    id: 'vm-1006',
    createdAt: '2026-03-25 14:42:00',
    customerName: '한가영',
    customerId: 'gyoung_h',
    customerPhone: '010-5656-1111',
    status: '병합실패',
    failReason: '업로드 파일 길이가 3초 미만입니다.',
    video1Url: 'https://example.com/video/vm-1006-1.mp4',
  },
  {
    id: 'vm-1007',
    createdAt: '2026-03-24 20:20:00',
    customerName: '오세훈',
    customerId: 'ohsehoon',
    customerPhone: '010-9191-7272',
    status: '병합중',
    failReason: '',
    video1Url: 'https://example.com/video/vm-1007-1.mp4',
    video2Url: 'https://example.com/video/vm-1007-2.mp4',
  },
  {
    id: 'vm-1008',
    createdAt: '2026-03-24 11:03:00',
    customerName: '신하은',
    customerId: 'haeun_shin',
    customerPhone: '010-4545-7878',
    status: '병합완료',
    failReason: '',
    video1Url: 'https://example.com/video/vm-1008-1.mp4',
    video2Url: 'https://example.com/video/vm-1008-2.mp4',
    mergedVideoUrl: 'https://example.com/video/vm-1008-merged.mp4',
  },
  {
    id: 'vm-1009',
    createdAt: '2026-03-24 09:26:00',
    customerName: '윤지호',
    customerId: 'jho_yoon',
    customerPhone: '010-3000-2020',
    status: '병합대기',
    failReason: '',
    video1Url: 'https://example.com/video/vm-1009-1.mp4',
  },
  {
    id: 'vm-1010',
    createdAt: '2026-03-23 15:55:00',
    customerName: '임수빈',
    customerId: 'subinlim',
    customerPhone: '010-8484-6363',
    status: '병합실패',
    failReason: '영상 해상도가 서로 달라 병합할 수 없습니다.',
    video1Url: 'https://example.com/video/vm-1010-1.mp4',
    video2Url: 'https://example.com/video/vm-1010-2.mp4',
  },
];
