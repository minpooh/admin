import { useMemo, useState } from 'react';
import '../../../styles/adminListPage.css';
import './BannerPage.css';

type MainBanner = {
  id: string;
  title: string;
  imageUrl: string;
};

const MAIN_BANNERS_MOCK: MainBanner[] = [
  {
    id: 'main-1',
    title: '메인 배너 1',
    imageUrl: 'https://dummyimage.com/1400x520/ef4444/ffffff&text=Main+Banner+1',
  },
  {
    id: 'main-2',
    title: '메인 배너 2',
    imageUrl: 'https://dummyimage.com/1400x520/3b82f6/ffffff&text=Main+Banner+2',
  },
  {
    id: 'main-3',
    title: '메인 배너 3',
    imageUrl: 'https://dummyimage.com/1400x520/10b981/ffffff&text=Main+Banner+3',
  },
];

export default function BannerPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = useMemo(() => MAIN_BANNERS_MOCK, []);
  const total = banners.length;

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const activeBanner = banners[activeIndex];

  return (
    <div className="admin-list-page">
      <h1 className="page-title">배너관리</h1>

      <section className="banner-preview-section" aria-label="메인 배너 미리보기">
        <div className="banner-preview-slider" role="region" aria-label="메인 배너 슬라이더">
          <button
            type="button"
            className="banner-preview-slider__nav banner-preview-slider__nav--prev"
            onClick={goPrev}
            aria-label="이전 슬라이드"
          >
            ‹
          </button>

          <div className="banner-preview-slider__viewport">
            <div
              className="banner-preview-slider__track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {banners.map((b) => (
                <div key={b.id} className="banner-preview-slider__slide" aria-hidden={b.id !== activeBanner.id}>
                  <img className="banner-preview-slider__img" src={b.imageUrl} alt={b.title} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="banner-preview-slider__nav banner-preview-slider__nav--next"
            onClick={goNext}
            aria-label="다음 슬라이드"
          >
            ›
          </button>
        </div>
      </section>
    </div>
  );
}

