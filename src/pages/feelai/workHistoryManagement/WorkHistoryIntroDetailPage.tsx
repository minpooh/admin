import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Circle, CircleCheck, MoreHorizontal, Pause, Play, Volume2 } from 'lucide-react';
import Confirm from '../../../components/Confirm';
import Modal from '../../../components/Modal';
import '../../../styles/adminPage.css';
import '../../feelmaker/orderManagement/OrderListPage.css';
import './WorkHistoryIntroPage.css';
import {
  getWorkHistoryIntroDetailById,
  type WorkHistoryIntroAudioClip,
  type WorkHistoryIntroSceneAssetStatus,
  type WorkHistoryIntroStatus,
  type WorkHistoryIntroTimelineClip,
} from './mock/workHistoryIntro.mock';
import { workHistoryIntroListPath } from './workHistoryIntroPaths';

function getStatusClasses(status: WorkHistoryIntroStatus) {
  if (status === '완료') {
    return { rowBtn: 'row-btn--status-secondary', progress: 'progress-status--secondary' };
  }
  if (status === '생성중') {
    return { rowBtn: 'row-btn--status-blue', progress: 'progress-status--blue' };
  }
  if (status === '오류') {
    return { rowBtn: 'row-btn--status-danger', progress: 'progress-status--danger' };
  }
  return { rowBtn: 'row-btn--status-warning', progress: 'progress-status--warning' };
}

function ratioClassName(ratio: string) {
  return ratio.replace(':', '-');
}

function sceneStatusBadgeClass(status: WorkHistoryIntroSceneAssetStatus) {
  if (status === '완료') {
    return 'badge-square badge-square--inline badge-square--secondary badge-square--no-transition badge-square--no-margin';
  }
  if (status === '생성중') {
    return 'badge-square badge-square--inline badge-square--open badge-square--no-transition badge-square--no-margin';
  }
  if (status === '실패') {
    return 'badge-square badge-square--inline badge-square--danger badge-square--no-transition badge-square--no-margin';
  }
  return 'badge-square badge-square--inline badge-square--gray badge-square--no-transition badge-square--no-margin';
}

function sceneStatusLabel(kind: '이미지' | '영상', status: WorkHistoryIntroSceneAssetStatus) {
  if (status === '완료') return `${kind} 완료`;
  if (status === '생성중') return `${kind} 생성중`;
  if (status === '실패') return `${kind} 실패`;
  return `${kind} 대기`;
}

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatTimelineSpeed(speed: number) {
  return `${speed % 1 === 0 ? speed.toFixed(0) : speed.toFixed(1)}x`;
}

let activeIntroAudio: HTMLAudioElement | null = null;

function IntroAudioPlayer({
  clip,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: {
  clip: WorkHistoryIntroAudioClip;
  menuOpen: boolean;
  onToggleMenu: (anchor: HTMLButtonElement) => void;
  onCloseMenu: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      setPlaying(false);
      if (activeIntroAudio === audio) activeIntroAudio = null;
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      if (activeIntroAudio === audio) activeIntroAudio = null;
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      if (activeIntroAudio && activeIntroAudio !== audio) {
        activeIntroAudio.pause();
      }
      activeIntroAudio = audio;
      try {
        await audio.play();
      } catch {
        setPlaying(false);
        if (activeIntroAudio === audio) activeIntroAudio = null;
      }
    } else {
      audio.pause();
      if (activeIntroAudio === audio) activeIntroAudio = null;
    }
  };

  return (
    <div className="intro-audio-player">
      <audio ref={audioRef} preload="metadata" src={clip.audioUrl} />
      <button type="button" className="intro-audio-player__play" onClick={togglePlay} aria-label={playing ? '일시정지' : '재생'}>
        {playing ? (
          <Pause size={14} fill="currentColor" strokeWidth={0} aria-hidden />
        ) : (
          <Play size={14} fill="currentColor" strokeWidth={0} aria-hidden />
        )}
      </button>
      <span className="intro-audio-player__time">
        <span className="intro-audio-player__time-current">{formatAudioTime(currentTime)}</span>
        <span className="intro-audio-player__time-sep"> / </span>
        <span className="intro-audio-player__time-duration">{formatAudioTime(duration)}</span>
      </span>
      <input
        type="range"
        className="intro-audio-player__seek"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || 0)}
        aria-label="재생 위치"
        onChange={(e) => {
          const next = Number(e.target.value);
          const audio = audioRef.current;
          if (audio) audio.currentTime = next;
          setCurrentTime(next);
        }}
      />
      <div className="intro-audio-volume">
        <button type="button" className="intro-audio-volume__btn" aria-label="볼륨">
          <Volume2 size={15} fill="currentColor" strokeWidth={2} aria-hidden />
        </button>
        <div className="intro-audio-volume__panel">
          <input
            type="range"
            className="intro-audio-volume__slider"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            aria-label="볼륨 조절"
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
      </div>
      <div className="row-options intro-audio-player__more">
        <button
          type="button"
          className="row-options__trigger"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="더보기"
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen) onCloseMenu();
            else onToggleMenu(e.currentTarget);
          }}
        >
          <MoreHorizontal size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default function WorkHistoryIntroDetailPage() {
  const { subId } = useParams<{ subId: string }>();
  const navigate = useNavigate();
  const item = getWorkHistoryIntroDetailById(subId);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [openAudioMenuId, setOpenAudioMenuId] = useState<string | null>(null);
  const [audioMenuPos, setAudioMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [previewClip, setPreviewClip] = useState<WorkHistoryIntroTimelineClip | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!openAudioMenuId) return;
    const close = () => {
      setOpenAudioMenuId(null);
      setAudioMenuPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [openAudioMenuId]);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (!previewClip || !video) return;

    const startAt = previewClip.useStartSec;
    const endAt = previewClip.useEndSec;
    video.playbackRate = previewClip.speed;

    const syncStart = () => {
      video.currentTime = startAt;
      void video.play().catch(() => undefined);
    };
    const onTimeUpdate = () => {
      if (video.currentTime >= endAt) {
        video.pause();
        video.currentTime = startAt;
      }
    };

    if (video.readyState >= 1) syncStart();
    else video.addEventListener('loadedmetadata', syncStart, { once: true });
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', syncStart);
      video.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [previewClip]);

  if (!item) {
    return (
      <div className="admin-list-page admin-list-page--work-history-intro">
        <div className="admin-detail-header">
          <Link to={workHistoryIntroListPath} className="admin-detail-back">
            ← 목록
          </Link>
          <h1 className="page-title">인트로 작업 상세</h1>
        </div>
        <section className="admin-list-box">
          <p className="admin-list-result">작업내역을 찾을 수 없습니다.</p>
          <p className="admin-detail-notice">
            <Link to={workHistoryIntroListPath}>목록으로 돌아가기</Link>
          </p>
        </section>
      </div>
    );
  }

  const statusClasses = getStatusClasses(item.status);
  const doneStepCount = item.pipelineSteps.filter((step) => step.done).length;
  const hasFinalVideo = Boolean(item.finalVideoUrl);

  const openFinalVideo = () => {
    if (!item.finalVideoUrl) return;
    window.open(item.finalVideoUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="admin-list-page admin-list-page--work-history-intro">
      <div className="admin-detail-header">
        <Link to={workHistoryIntroListPath} className="admin-detail-back">
          ← 목록
        </Link>
        <h1 className="page-title">인트로 작업 상세</h1>
      </div>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col" aria-label="기본 정보">
          <div className="intro-detail-section-head">
            <h3 className="admin-detail-section-title">기본 정보</h3>
            <div className="intro-detail-section-head__actions">
              <button
                type="button"
                className="filter-btn filter-btn--outline"
                onClick={() => window.alert('산출물 전체 다운로드(ZIP) 목업')}
              >
                전체 영상 다운로드
              </button>
              <button
                type="button"
                className="filter-btn intro-detail-btn--danger"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                작업 삭제
              </button>
            </div>
          </div>
          <dl className="admin-detail-meta">
            <div className="admin-detail-meta__row">
              <dt>작업 ID</dt>
              <dd>
                <span className="intro-detail-id-row">
                  <span>{item.workId}</span>
                  <button type="button" className="row-btn row-btn--default" onClick={() => window.alert('에디터(목업)')}>
                    에디터 열기
                  </button>
                </span>
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>고객</dt>
              <dd>
                {item.customerName} ({item.customerId}) · {item.customerPhone}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>상태</dt>
              <dd>
                <span className={['row-btn', statusClasses.rowBtn].join(' ')}>
                  <span className={['progress-status', statusClasses.progress].join(' ')}>
                    <span className="progress-status__dot" aria-hidden="true" />
                    <span className="progress-status__text">{item.status}</span>
                  </span>
                </span>
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>카테고리 / 스타일</dt>
              <dd>
                {item.category} / {item.style}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>씬 / 비율 / 전환</dt>
              <dd>
                {item.sceneCount}씬 · {item.ratio} · {item.transition}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>진행 단계</dt>
              <dd>STEP {item.step}</dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>등록 / 수정</dt>
              <dd>
                {item.registeredAt} / {item.updatedAt}
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>사용 토큰</dt>
              <dd>
                <span className="text-warning">{item.usedTokens.toLocaleString('ko-KR')} tk</span>
              </dd>
            </div>
            <div className="admin-detail-meta__row">
              <dt>API 실비용</dt>
              <dd>${item.apiCostUsd}</dd>
            </div>
            {item.failReason && (
              <div className="admin-detail-meta__row">
                <dt>오류 사유</dt>
                <dd className="text-danger">{item.failReason}</dd>
              </div>
            )}
          </dl>

          <div className="intro-detail-pipeline">
            <p className="intro-detail-pipeline__head">
              진행 상황 {doneStepCount}/{item.pipelineSteps.length} 단계 완료
            </p>
            <ul className="intro-detail-pipeline__list">
              {item.pipelineSteps.map((step) => (
                <li
                  key={step.key}
                  className={['intro-detail-pipeline-step', step.done ? '' : 'intro-detail-pipeline-step--pending']
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="intro-detail-pipeline-step__icon" aria-hidden="true">
                    {step.done ? <CircleCheck size={16} strokeWidth={2.25} /> : <Circle size={16} strokeWidth={2} />}
                  </span>
                  <span className="intro-detail-pipeline-step__text">
                    <span className="intro-detail-pipeline-step__label">{step.label}</span>
                    <span className="intro-detail-pipeline-step__value">{step.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="admin-list-box admin-two-col__col intro-detail-video-section" aria-label="최종 렌더 영상">
          <h3 className="admin-detail-section-title">최종 렌더 영상</h3>
          {hasFinalVideo ? (
            <>
              <div className={`intro-detail-video-wrap intro-detail-video-wrap--${ratioClassName(item.ratio)}`}>
                <video
                  className="intro-detail-video"
                  controls
                  preload="metadata"
                  poster={item.finalVideoPosterUrl ?? item.thumbnailUrl}
                  src={item.finalVideoUrl ?? undefined}
                >
                  브라우저가 video 태그를 지원하지 않습니다.
                </video>
              </div>
              <div className="intro-detail-video-actions">
                <button type="button" className="filter-btn filter-btn--primary" onClick={openFinalVideo}>
                  새 창에서 열기 / 다운로드
                </button>
              </div>
            </>
          ) : (
            <p className="inquiry-thread-empty">최종 렌더 영상이 없습니다.</p>
          )}
        </section>
      </div>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col" aria-label="원본 사진 · 인물 지정">
          <h3 className="admin-detail-section-title">
            원본 사진 · 인물 지정 {item.cast.personCount}명
          </h3>
          {item.cast.mode === 'group' ? (
            <div className="intro-cast-group">
              <div className="intro-cast-group__frame">
                <img src={item.cast.imageUrl} alt="원본 사진" className="intro-cast-group__image" />
                {item.cast.boxes.map((box) => (
                  <div
                    key={box.id}
                    className="intro-cast-box"
                    style={{
                      top: `${box.top}%`,
                      left: `${box.left}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  >
                    <span className="intro-cast-box__label">{box.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="intro-cast-separate">
              {item.cast.people.map((person) => (
                <article key={person.id} className="intro-cast-person-card">
                  <header className="intro-cast-person-card__head">{person.label}</header>
                  <div className="intro-cast-person-card__media">
                    <img src={person.imageUrl} alt={person.label} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-list-box admin-two-col__col" aria-label="스타일 변환">
          <h3 className="admin-detail-section-title">
            스타일 변환 선택: {item.styleConversions.find((s) => s.selected)?.style ?? item.style}
          </h3>
          <div className="intro-style-list">
            {item.styleConversions.map((conversion) => (
              <div
                key={conversion.style}
                className={['intro-style-panel', conversion.selected ? 'intro-style-panel--selected' : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="intro-style-panel__head">
                  <span className="intro-style-panel__name">{conversion.style}</span>
                  {conversion.selected ? (
                    <span className="intro-style-panel__selected">선택됨</span>
                  ) : null}
                </div>
                <div className="intro-style-panel__people">
                  {conversion.people.map((person) => (
                    <figure key={person.id} className="intro-style-person">
                      <div className="intro-style-person__thumb">
                        <img src={person.imageUrl} alt={`${conversion.style} ${person.label}`} />
                      </div>
                      <figcaption className="intro-style-person__label">{person.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="admin-list-box" aria-label="씬별 제작내용">
        <h3 className="admin-detail-section-title">씬별 제작내용 ({item.scenes.length})</h3>
        <div className="intro-scenes-scroll">
          {item.scenes.map((scene) => (
            <article key={scene.id} className="intro-scene-card">
              <header className="intro-scene-card__head">
                <div className="intro-scene-card__title">
                  <span className="intro-scene-card__index" aria-hidden="true">
                    {scene.index}
                  </span>
                  <span>씬 {scene.index}</span>
                </div>
                <div className="intro-scene-card__badges">
                  <span className={sceneStatusBadgeClass(scene.imageStatus)}>
                    {sceneStatusLabel('이미지', scene.imageStatus)}
                  </span>
                  <span className={sceneStatusBadgeClass(scene.videoStatus)}>
                    {sceneStatusLabel('영상', scene.videoStatus)}
                  </span>
                </div>
              </header>

              <div className="intro-scene-card__body">
                <div className="intro-scene-block">
                  <p className="intro-scene-block__label">씬 이미지</p>
                  <div className="intro-scene-block__media">
                    {scene.imageUrl ? (
                      <img src={scene.imageUrl} alt={`씬 ${scene.index} 이미지`} />
                    ) : (
                      <p className="intro-scene-block__empty">이미지 없음</p>
                    )}
                  </div>
                </div>

                <div className="intro-scene-block">
                  <p className="intro-scene-block__label">씬 영상</p>
                  <div className="intro-scene-block__media">
                    {scene.videoUrl ? (
                      <video
                        className="intro-scene-block__video"
                        controls
                        preload="metadata"
                        poster={scene.imageUrl ?? undefined}
                        src={scene.videoUrl}
                      >
                        브라우저가 video 태그를 지원하지 않습니다.
                      </video>
                    ) : (
                      <p className="intro-scene-block__empty">영상 없음</p>
                    )}
                  </div>
                </div>

                <div className="intro-scene-side">
                  <div className="intro-scene-block intro-scene-block--story">
                    <p className="intro-scene-block__label">장면 스토리</p>
                    <div className="intro-scene-story">{scene.story}</div>
                  </div>
                  <div className="intro-scene-block intro-scene-block--subtitle">
                    <p className="intro-scene-block__label">자막</p>
                    <div className="intro-scene-subtitle">{scene.subtitle ?? '자막 없음'}</div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col" aria-label="배경음 (BGM)">
          <h3 className="admin-detail-section-title">
            배경음 (BGM)
            <span className="intro-audio-title-meta">
              모드 {item.bgm.mode} · 볼륨 {item.bgm.volume} · 무드 {item.bgm.mood}
            </span>
          </h3>
          {item.bgm.clips.length === 0 ? (
            <p className="inquiry-thread-empty">배경음 생성 기록 없음</p>
          ) : (
            <div className="intro-audio-scroll">
              <div className="intro-audio-list">
                {item.bgm.clips.map((clip) => (
                  <article
                    key={clip.id}
                    className={['intro-audio-card', clip.isFinal ? 'intro-audio-card--final' : '']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <IntroAudioPlayer
                      clip={clip}
                      menuOpen={openAudioMenuId === clip.id}
                      onCloseMenu={() => {
                        setOpenAudioMenuId(null);
                        setAudioMenuPos(null);
                      }}
                      onToggleMenu={(anchor) => {
                        const r = anchor.getBoundingClientRect();
                        setAudioMenuPos({
                          top: r.bottom + 6,
                          right: window.innerWidth - r.right,
                        });
                        setOpenAudioMenuId(clip.id);
                      }}
                    />
                    <p
                      className={[
                        'intro-audio-card__meta',
                        clip.isFinal ? 'intro-audio-card__meta--final' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {clip.isFinal ? <span className="intro-audio-card__final-label">최종사용</span> : null}
                      {clip.label} · {clip.createdAt}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="admin-list-box admin-two-col__col" aria-label="나레이션 (TTS)">
          <h3 className="admin-detail-section-title">
            나레이션 (TTS)
            <span className="intro-audio-title-meta">
              화자 {item.narration.speaker} · 볼륨 {item.narration.volume}
            </span>
          </h3>
          {item.narration.clips.length === 0 ? (
            <p className="inquiry-thread-empty">나레이션 생성 기록 없음</p>
          ) : (
            <div className="intro-audio-scroll">
              <div className="intro-audio-list">
                {item.narration.clips.map((clip) => (
                  <article key={clip.id} className="intro-audio-card">
                    <IntroAudioPlayer
                      clip={clip}
                      menuOpen={openAudioMenuId === clip.id}
                      onCloseMenu={() => {
                        setOpenAudioMenuId(null);
                        setAudioMenuPos(null);
                      }}
                      onToggleMenu={(anchor) => {
                        const r = anchor.getBoundingClientRect();
                        setAudioMenuPos({
                          top: r.bottom + 6,
                          right: window.innerWidth - r.right,
                        });
                        setOpenAudioMenuId(clip.id);
                      }}
                    />
                    <p className="intro-audio-card__meta">
                      {clip.label} · {clip.createdAt}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="admin-list-box" aria-label="타임라인 설정">
        <h3 className="admin-detail-section-title">타임라인 설정 ({item.timeline.length})</h3>
        <div className="admin-table-wrap admin-table-wrap--candidate-scroll">
          <table className="admin-table admin-table--fluid">
            <thead>
              <tr>
                <th className="col-center">씬</th>
                <th className="col-center">썸네일</th>
                <th>총 영상 시간</th>
                <th>사용구간</th>
                <th>속도</th>
                <th>장면전환 효과 (앞/뒤)</th>
                <th>영상</th>
              </tr>
            </thead>
            <tbody>
              {item.timeline.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-table-empty-cell">
                    최종 렌더링된 씬 타임라인 없음
                  </td>
                </tr>
              ) : (
                item.timeline.map((clip) => (
                  <tr key={clip.id}>
                    <td className="col-center">
                      <span className="cell-line">씬 {clip.sceneIndex}</span>
                    </td>
                    <td className="col-center">
                      {clip.thumbnailUrl ? (
                        <img
                          src={clip.thumbnailUrl}
                          alt={`씬 ${clip.sceneIndex} 썸네일`}
                          className="admin-product-thumb admin-product-thumb--sm"
                        />
                      ) : (
                        <span className="cell-line">-</span>
                      )}
                    </td>
                    <td>
                      <span className="cell-line">{formatAudioTime(clip.totalDurationSec)}</span>
                    </td>
                    <td>
                      <span className="cell-line">
                        {formatAudioTime(clip.useStartSec)}~{formatAudioTime(clip.useEndSec)}
                      </span>
                    </td>
                    <td>
                      <span className="cell-line">{formatTimelineSpeed(clip.speed)}</span>
                    </td>
                    <td>
                      <div className="cell-block">
                        <span className="cell-line">
                          <span className="list-label">앞</span>{' '}
                          <span className="list-value">{clip.transitionIn}</span>
                        </span>
                        <span className="cell-line">
                          <span className="list-label">뒤</span>{' '}
                          <span className="list-value">{clip.transitionOut}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-link"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewClip(clip);
                        }}
                      >
                        {clip.videoName}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-two-col">
        <section className="admin-list-box admin-two-col__col" aria-label="토큰 · 비용">
          <h3 className="admin-detail-section-title">토큰 · 비용</h3>
          <div className="admin-contract-meta-inline" aria-label="토큰 · 비용 요약">
            <div className="admin-contract-meta-inline__row">
              <div className="admin-contract-meta-inline__item">
                <span className="admin-contract-meta-inline__label">고객 사용 토큰</span>
                <span className="admin-contract-meta-inline__value text-warning">
                  {item.usedTokens.toLocaleString('ko-KR')} tk
                </span>
              </div>
              <div className="admin-contract-meta-inline__item">
                <span className="admin-contract-meta-inline__label">API 실 비용</span>
                <span className="admin-contract-meta-inline__value">
                  <span className="amount-red">{item.apiCost.toLocaleString('ko-KR')}원</span>
                  <span> (${item.apiCostUsd})</span>
                </span>
              </div>
            </div>
          </div>

          <h3 className="admin-stat-heading">토큰 사용내역</h3>
          <div className="admin-table-wrap admin-table-wrap--candidate-scroll">
            <table className="admin-table admin-table--fluid">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>단계</th>
                  <th>토큰</th>
                </tr>
              </thead>
              <tbody>
                {item.tokenUsages.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="admin-table-empty-cell">
                      토큰 사용내역 없음
                    </td>
                  </tr>
                ) : (
                  item.tokenUsages.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="cell-line">{row.occurredAt}</span>
                      </td>
                      <td>
                        <span className="cell-line">{row.step}</span>
                      </td>
                      <td>
                        <span className="cell-line text-warning">{row.tokens.toLocaleString('ko-KR')} tk</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h3 className="admin-stat-heading">API 비용 내역</h3>
          <div className="admin-table-wrap admin-table-wrap--candidate-scroll">
            <table className="admin-table admin-table--fluid">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>기능/모델</th>
                  <th>비용</th>
                </tr>
              </thead>
              <tbody>
                {item.apiCostEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="admin-table-empty-cell">
                      API 비용 내역 없음
                    </td>
                  </tr>
                ) : (
                  item.apiCostEntries.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="cell-line">{row.occurredAt}</span>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line">
                            <span className="list-label">기능</span>{' '}
                            <span className="list-value">{row.feature}</span>
                          </span>
                          <span className="cell-line">
                            <span className="list-label">모델</span>{' '}
                            <span className="list-value">{row.model}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-block">
                          <span className="cell-line amount-red">{row.costKrw.toLocaleString('ko-KR')}원</span>
                          <span className="cell-line">${row.costUsd}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-list-box admin-two-col__col" aria-label="실패한 단계">
          <h3 className="admin-detail-section-title">
            실패한 단계
            {item.failures.length > 0 ? ` (${item.failures.length})` : ''}
          </h3>
          {item.failures.length === 0 ? (
            <p className="inquiry-thread-empty">실패한 단계 없음</p>
          ) : (
            <>
              <dl className="admin-detail-meta">
                <div className="admin-detail-meta__row">
                  <dt>실패 건수</dt>
                  <dd>
                    <span className="text-danger">{item.failures.length}건</span>
                  </dd>
                </div>
              </dl>
              <h3 className="admin-stat-heading">실패 내역</h3>
              <div className="admin-table-wrap admin-table-wrap--candidate-scroll">
                <table className="admin-table admin-table--fluid">
                  <thead>
                    <tr>
                      <th>시간</th>
                      <th>단계</th>
                      <th>사유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.failures.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className="cell-line">{row.occurredAt}</span>
                        </td>
                        <td>
                          <span className="cell-line">{row.step}</span>
                        </td>
                        <td>
                          <span className="cell-line cell-line--danger">{row.reason}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>

      {openAudioMenuId &&
        audioMenuPos &&
        createPortal(
          <div
            className="row-options__menu-portal"
            role="menu"
            style={{
              position: 'fixed',
              top: audioMenuPos.top,
              right: audioMenuPos.right,
              zIndex: 10000,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => {
                window.alert('오디오 다운로드(목업)');
                setOpenAudioMenuId(null);
                setAudioMenuPos(null);
              }}
            >
              다운로드
            </button>
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => {
                window.alert('최종사용 지정(목업)');
                setOpenAudioMenuId(null);
                setAudioMenuPos(null);
              }}
            >
              최종사용 지정
            </button>
            <button
              type="button"
              className="row-options__item"
              role="menuitem"
              onClick={() => {
                window.alert('오디오 삭제(목업)');
                setOpenAudioMenuId(null);
                setAudioMenuPos(null);
              }}
            >
              삭제
            </button>
          </div>,
          document.body
        )}

      {previewClip ? (
        <Modal
          open
          onClose={() => setPreviewClip(null)}
          ariaLabel={`${previewClip.videoName} 미리보기`}
          variant="option"
          panelClassName="option-modal__panel--wide intro-timeline-preview-modal"
        >
          <Modal.Header>
            <Modal.Title>{previewClip.videoName}</Modal.Title>
            <Modal.Close />
          </Modal.Header>
          <Modal.Body>
            <div className="intro-timeline-preview">
              <video
                key={previewClip.id}
                ref={previewVideoRef}
                className="intro-timeline-preview__video"
                src={previewClip.videoUrl}
                poster={previewClip.thumbnailUrl ?? undefined}
                controls
                playsInline
              />
              <p className="intro-timeline-preview__meta">
                씬 {previewClip.sceneIndex} · 사용구간 {formatAudioTime(previewClip.useStartSec)}~
                {formatAudioTime(previewClip.useEndSec)} · {formatTimelineSpeed(previewClip.speed)}
              </p>
            </div>
          </Modal.Body>
        </Modal>
      ) : null}

      <Confirm
        open={deleteConfirmOpen}
        title="작업 삭제"
        message="이 작업을 삭제할까요? 목업에서는 목록으로 돌아갑니다."
        confirmText="삭제"
        danger
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          navigate(workHistoryIntroListPath);
        }}
      />
    </div>
  );
}
