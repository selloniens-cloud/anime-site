import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  .plyr {
    width: 100%;
    height: 100%;
  }

  .plyr__video-wrapper {
    background: #000;
    border-radius: 8px;
    overflow: hidden;
  }

  .plyr--video {
    background: #000;
  }

  .plyr__poster {
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  /* Кастомизация элементов управления */
  .plyr__control--overlaid {
    background: ${props => props.theme.colors.primary};
    border: 3px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    color: white;
    padding: 18px 22px 18px 28px;
    transition: all 0.3s ease;

    &:hover {
      background: ${props => props.theme.colors.primaryDark || props.theme.colors.primary};
      transform: scale(1.1);
    }
  }

  .plyr__controls {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    border-radius: 0 0 8px 8px;
    padding: 20px;
  }

  .plyr__control {
    color: white;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: ${props => props.theme.colors.primary};
    }

    &[aria-pressed="true"] {
      background: ${props => props.theme.colors.primary};
      color: white;
    }
  }

  .plyr__control svg {
    width: 18px;
    height: 18px;
  }

  .plyr__progress {
    input[type="range"] {
      color: ${props => props.theme.colors.primary};
    }

    input[type="range"]::-webkit-slider-thumb {
      background: ${props => props.theme.colors.primary};
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    input[type="range"]::-moz-range-thumb {
      background: ${props => props.theme.colors.primary};
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  }

  .plyr__progress__buffer {
    background: rgba(255, 255, 255, 0.4);
  }

  .plyr__volume {
    input[type="range"] {
      color: ${props => props.theme.colors.primary};
    }

    input[type="range"]::-webkit-slider-thumb {
      background: ${props => props.theme.colors.primary};
    }

    input[type="range"]::-moz-range-thumb {
      background: ${props => props.theme.colors.primary};
    }
  }

  .plyr__time {
    color: rgba(255, 255, 255, 0.9);
    font-family: monospace;
    font-size: 14px;
  }

  .plyr__menu {
    background: rgba(0, 0, 0, 0.9);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }

  .plyr__menu__container {
    background: transparent;
  }

  .plyr__menu__container [role="menu"] {
    background: transparent;
  }

  .plyr__menu__container [role="menuitem"] {
    color: white;
    padding: 12px 20px;
    transition: all 0.2s ease;

    &:hover,
    &[aria-checked="true"] {
      background: ${props => props.theme.colors.primary};
      color: white;
    }
  }

  .plyr__tooltip {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    padding: 6px 10px;
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .plyr__controls {
      padding: 15px;
    }

    .plyr__control--overlaid {
      padding: 15px 18px 15px 22px;
    }

    .plyr__control svg {
      width: 16px;
      height: 16px;
    }

    .plyr__time {
      font-size: 12px;
    }

    /* Скрыть некоторые элементы на мобильных */
    .plyr__control[data-plyr="pip"],
    .plyr__control[data-plyr="airplay"] {
      display: none;
    }
  }

  /* Полноэкранный режим */
  &.plyr--fullscreen-active {
    .plyr__video-wrapper {
      border-radius: 0;
    }

    .plyr__controls {
      border-radius: 0;
    }
  }

  /* Состояние загрузки */
  .plyr--loading .plyr__control--overlaid {
    display: none;
  }

  /* Кастомные стили для качества */
  .plyr__menu--quality {
    .plyr__menu__container [role="menuitem"] {
      display: flex;
      align-items: center;
      justify-content: space-between;

      &::after {
        content: attr(data-quality);
        font-size: 11px;
        opacity: 0.7;
        margin-left: 10px;
      }
    }
  }
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  z-index: 1000;
`;

const PlyrPlayer = ({
  src,
  poster,
  onTimeUpdate,
  onProgress,
  onPlay,
  onPause,
  onEnded,
  onError,
  onQualityChange,
  onSpeedChange,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',
  qualities = [],
  subtitles = [],
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  controls = [
    'play-large',
    'play',
    'progress',
    'current-time',
    'mute',
    'volume',
    'settings',
    'pip',
    'airplay',
    'fullscreen',
  ],
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      // Конфигурация Plyr
      const config = {
        controls,
        autoplay: autoPlay,
        muted,
        loop: {
          active: loop,
        },
        speed: {
          selected: 1,
          options: playbackRates,
        },
        quality: {
          default: 'auto',
          options: qualities.length > 0 ?
            ['auto', ...qualities.map(q => q.height)] :
            ['auto'],
        },
        captions: {
          active: subtitles.length > 0,
          language: subtitles.length > 0 ? subtitles[0].lang : 'auto',
          update: true,
        },
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: true,
        },
        keyboard: {
          focused: true,
          global: false,
        },
        tooltips: {
          controls: true,
          seek: true,
        },
        storage: {
          enabled: true,
          key: 'plyr-anime-player',
        },
        settings: ['captions', 'quality', 'speed', 'loop'],
        i18n: {
          restart: 'Перезапустить',
          rewind: 'Перемотать назад на {seektime}с',
          play: 'Воспроизвести',
          pause: 'Пауза',
          fastForward: 'Перемотать вперед на {seektime}с',
          seek: 'Перейти к {currentTime} из {duration}',
          seekLabel: '{currentTime} из {duration}',
          played: 'Воспроизведено',
          buffered: 'Буферизовано',
          currentTime: 'Текущее время',
          duration: 'Продолжительность',
          volume: 'Громкость',
          mute: 'Отключить звук',
          unmute: 'Включить звук',
          enableCaptions: 'Включить субтитры',
          disableCaptions: 'Отключить субтитры',
          download: 'Скачать',
          enterFullscreen: 'Полноэкранный режим',
          exitFullscreen: 'Выйти из полноэкранного режима',
          frameTitle: 'Плеер для {title}',
          captions: 'Субтитры',
          settings: 'Настройки',
          pip: 'Картинка в картинке',
          menuBack: 'Назад к предыдущему меню',
          speed: 'Скорость',
          normal: 'Обычная',
          quality: 'Качество',
          loop: 'Повтор',
          start: 'Начало',
          end: 'Конец',
          all: 'Все',
          reset: 'Сбросить',
          disabled: 'Отключено',
          enabled: 'Включено',
          advertisement: 'Реклама',
          qualityBadge: {
            2160: '4K',
            1440: 'HD',
            1080: 'HD',
            720: 'HD',
            576: 'SD',
            480: 'SD',
          },
        },
      };

      // Инициализация плеера
      playerRef.current = new Plyr(videoRef.current, config);

      // Обработчики событий
      playerRef.current.on('ready', () => {
        setIsReady(true);
        console.log('Plyr плеер готов');

        // Установка источника видео
        if (src) {
          setSources();
        }

        // Добавление субтитров
        if (subtitles && subtitles.length > 0) {
          addSubtitles();
        }
      });

      playerRef.current.on('play', () => {
        onPlay?.();
      });

      playerRef.current.on('pause', () => {
        onPause?.();
      });

      playerRef.current.on('ended', () => {
        onEnded?.();
      });

      playerRef.current.on('timeupdate', () => {
        const currentTime = playerRef.current.currentTime;
        onTimeUpdate?.(currentTime);
      });

      playerRef.current.on('progress', () => {
        const buffered = playerRef.current.buffered;
        const duration = playerRef.current.duration;
        if (buffered && duration) {
          const bufferedPercent = (buffered / duration) * 100;
          onProgress?.(bufferedPercent);
        }
      });

      playerRef.current.on('error', (event) => {
        const errorMessage = 'Ошибка воспроизведения видео';
        setError(errorMessage);
        onError?.(errorMessage);
      });

      playerRef.current.on('qualitychange', (event) => {
        const quality = event.detail.quality;
        onQualityChange?.(quality);
      });

      playerRef.current.on('ratechange', () => {
        const speed = playerRef.current.speed;
        onSpeedChange?.(speed);
      });

      // Кастомные горячие клавиши
      playerRef.current.on('keydown', (event) => {
        handleKeyDown(event);
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  // Установка источников видео
  const setSources = () => {
    if (!playerRef.current || !src) return;

    let sources = [];

    if (Array.isArray(src)) {
      sources = src;
    } else if (typeof src === 'string') {
      sources = [{
        src,
        type: getVideoType(src),
        size: getVideoSize(src),
      }];
    }

    // Добавление качеств если они есть
    if (qualities && qualities.length > 0) {
      sources = qualities.map(quality => ({
        src: quality.src,
        type: getVideoType(quality.src),
        size: quality.height,
      }));
    }

    playerRef.current.source = {
      type: 'video',
      title: 'Аниме видео',
      poster,
      sources,
      tracks: subtitles ? subtitles.map(sub => ({
        kind: 'captions',
        label: sub.label,
        srclang: sub.lang,
        src: sub.src,
        default: sub.default || false,
      })) : [],
    };
  };

  // Добавление субтитров
  const addSubtitles = () => {
    if (!playerRef.current || !subtitles) return;

    subtitles.forEach(subtitle => {
      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = subtitle.label;
      track.srclang = subtitle.lang;
      track.src = subtitle.src;
      track.default = subtitle.default || false;

      videoRef.current.appendChild(track);
    });
  };

  // Определение типа видео
  const getVideoType = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogv':
      return 'video/ogg';
    case 'm3u8':
      return 'application/vnd.apple.mpegurl';
    case 'mpd':
      return 'application/dash+xml';
    default:
      return 'video/mp4';
    }
  };

  // Определение размера видео из URL (если есть)
  const getVideoSize = (url) => {
    const match = url.match(/(\d+)p/);
    return match ? parseInt(match[1]) : 720;
  };

  // Обработка горячих клавиш
  const handleKeyDown = (event) => {
    if (!playerRef.current) return;

    const { key, keyCode } = event.detail.plyr;

    switch (keyCode) {
    case 32: // Пробел
      event.preventDefault();
      playerRef.current.togglePlay();
      break;
    case 37: // Стрелка влево
      event.preventDefault();
      playerRef.current.rewind(10);
      break;
    case 39: // Стрелка вправо
      event.preventDefault();
      playerRef.current.forward(10);
      break;
    case 38: // Стрелка вверх
      event.preventDefault();
      playerRef.current.increaseVolume(0.1);
      break;
    case 40: // Стрелка вниз
      event.preventDefault();
      playerRef.current.decreaseVolume(0.1);
      break;
    case 77: // M
      event.preventDefault();
      playerRef.current.toggleMute();
      break;
    case 70: // F
      event.preventDefault();
      playerRef.current.fullscreen.toggle();
      break;
    default:
      // Цифры 0-9 для перехода к определенному времени
      if (keyCode >= 48 && keyCode <= 57) {
        event.preventDefault();
        const percent = (keyCode - 48) / 10;
        const time = playerRef.current.duration * percent;
        playerRef.current.currentTime = time;
      }
      break;
    }
  };

  // Обновление источника при изменении src
  useEffect(() => {
    if (playerRef.current && isReady && src) {
      setSources();
    }
  }, [src, isReady]);

  // Методы управления плеером
  const play = () => playerRef.current?.play();
  const pause = () => playerRef.current?.pause();
  const seek = (time) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time;
    }
  };
  const setVolume = (volume) => {
    if (playerRef.current) {
      playerRef.current.volume = volume;
    }
  };
  const mute = () => {
    if (playerRef.current) {
      playerRef.current.muted = true;
    }
  };
  const unmute = () => {
    if (playerRef.current) {
      playerRef.current.muted = false;
    }
  };

  return (
    <PlayerContainer className={playerRef.current?.fullscreen?.active ? 'plyr--fullscreen-active' : ''}>
      <video
        ref={videoRef}
        poster={poster}
        preload={preload}
        crossOrigin="anonymous"
        playsInline
      >
        <track kind="captions" srcLang="ru" label="Русские субтитры" default />
      </video>

      {error && (
        <ErrorMessage>
          <div>{error}</div>
          <button onClick={() => {
            setError(null);
            playerRef.current?.restart();
          }}>
            Попробовать снова
          </button>
        </ErrorMessage>
      )}
    </PlayerContainer>
  );
};

export default PlyrPlayer;
