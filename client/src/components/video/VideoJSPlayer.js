import { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  
  .video-js {
    width: 100%;
    height: 100%;
    font-family: ${props => props.theme?.typography?.fontFamily || 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'};
  }

  .video-js .vjs-big-play-button {
    background-color: rgba(0, 0, 0, 0.7);
    border: 2px solid ${props => props.theme?.colors?.primary || '#FF6B6B'};
    border-radius: 50%;
    width: 80px;
    height: 80px;
    line-height: 76px;
    font-size: 32px;
    left: 50%;
    top: 50%;
    margin-left: -40px;
    margin-top: -40px;
    transition: all 0.3s ease;
  }

  .video-js .vjs-big-play-button:hover {
    background-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    transform: scale(1.1);
  }

  .video-js .vjs-control-bar {
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
    height: 60px;
    padding: 0 15px;
  }

  .video-js .vjs-progress-control {
    height: 6px;
    top: -3px;
  }

  .video-js .vjs-progress-holder {
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.3);
  }

  .video-js .vjs-play-progress {
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    border-radius: 3px;
  }

  .video-js .vjs-load-progress {
    background: rgba(255, 255, 255, 0.5);
    border-radius: 3px;
  }

  .video-js .vjs-volume-panel {
    width: auto;
  }

  .video-js .vjs-volume-control {
    width: 80px;
    margin-right: 10px;
  }

  .video-js .vjs-volume-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  .video-js .vjs-volume-level {
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    border-radius: 2px;
  }

  .video-js .vjs-button > .vjs-icon-placeholder:before {
    font-size: 18px;
  }

  .video-js .vjs-time-control {
    font-family: monospace;
    font-size: 14px;
    line-height: 60px;
    padding: 0 8px;
  }

  .video-js .vjs-remaining-time {
    display: none;
  }

  .video-js .vjs-fullscreen-control {
    order: 10;
  }

  /* Качество видео селектор */
  .vjs-quality-selector {
    .vjs-menu-button-popup .vjs-menu {
      left: -50px;
    }
    
    .vjs-menu-item {
      padding: 8px 15px;
      font-size: 14px;
      
      &:hover {
        background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
      }
      
      &.vjs-selected {
        background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
        color: white;
      }
    }
  }

  /* Скорость воспроизведения */
  .vjs-playback-rate-menu-button {
    .vjs-menu {
      left: -30px;
    }
  }

  /* Субтитры */
  .vjs-subtitles-button,
  .vjs-captions-button {
    .vjs-menu {
      left: -40px;
    }
  }

  /* Адаптивность */
  @media (max-width: 768px) {
    .video-js .vjs-control-bar {
      height: 50px;
      padding: 0 10px;
    }

    .video-js .vjs-big-play-button {
      width: 60px;
      height: 60px;
      line-height: 56px;
      font-size: 24px;
      margin-left: -30px;
      margin-top: -30px;
    }

    .video-js .vjs-time-control {
      font-size: 12px;
      line-height: 50px;
      padding: 0 5px;
    }

    .video-js .vjs-volume-control {
      width: 60px;
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

const VideoJSPlayer = ({
  src,
  poster,
  onTimeUpdate,
  onProgress,
  onPlay,
  onPause,
  onEnded,
  onError,
  onQualityChange,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',
  qualities = [],
  subtitles = [],
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],
  fluid = true,
  responsive = true,
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Инициализация Video.js плеера
    if (videoRef.current && !playerRef.current) {
      const videoElement = videoRef.current;

      const options = {
        controls: true,
        fluid,
        responsive,
        preload,
        autoplay: autoPlay,
        muted,
        loop,
        poster,
        playbackRates,
        plugins: {
          // Плагин для выбора качества (встроенный в Video.js)
        },
        html5: {
          vhs: {
            // Настройки для HLS
            enableLowInitialPlaylist: true,
            smoothQualityChange: true,
            overrideNative: true,
          },
        },
      };

      playerRef.current = videojs(videoElement, options);

      // Обработчики событий
      playerRef.current.ready(() => {
        setIsReady(true);
        console.log('Video.js плеер готов');

        // Установка источника видео
        if (src) {
          if (Array.isArray(src)) {
            playerRef.current.src(src);
          } else {
            playerRef.current.src({ src, type: getVideoType(src) });
          }
        }

        // Добавление субтитров
        if (subtitles && subtitles.length > 0) {
          subtitles.forEach((subtitle, index) => {
            playerRef.current.addRemoteTextTrack({
              kind: 'subtitles',
              src: subtitle.src,
              srclang: subtitle.lang,
              label: subtitle.label,
              default: index === 0,
            });
          });
        }

        // Настройка качества видео
        if (qualities && qualities.length > 0) {
          setupQualitySelector();
        }
      });

      // События плеера
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
        const currentTime = playerRef.current.currentTime();
        onTimeUpdate?.(currentTime);
      });

      playerRef.current.on('progress', () => {
        const buffered = playerRef.current.buffered();
        if (buffered.length > 0) {
          const bufferedEnd = buffered.end(buffered.length - 1);
          const duration = playerRef.current.duration();
          const bufferedPercent = (bufferedEnd / duration) * 100;
          onProgress?.(bufferedPercent);
        }
      });

      playerRef.current.on('error', (e) => {
        const error = playerRef.current.error();
        const errorMessage = getErrorMessage(error);
        setError(errorMessage);
        onError?.(errorMessage);
      });

      // Горячие клавиши
      playerRef.current.on('keydown', (e) => {
        handleKeyDown(e);
      });
    }

    return () => {
      // Очистка при размонтировании
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Обновление источника видео
  useEffect(() => {
    if (playerRef.current && isReady && src) {
      if (Array.isArray(src)) {
        playerRef.current.src(src);
      } else {
        playerRef.current.src({ src, type: getVideoType(src) });
      }
    }
  }, [src, isReady]);

  // Определение типа видео по расширению
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

  // Настройка селектора качества
  const setupQualitySelector = () => {
    if (!playerRef.current) return;

    const qualityLevels = playerRef.current.qualityLevels();

    // Создание кнопки выбора качества
    const QualityMenuButton = videojs.getComponent('MenuButton');
    const QualityMenuItem = videojs.getComponent('MenuItem');

    class QualityOption extends QualityMenuItem {
      constructor(player, options) {
        const label = options.label || `${options.height}p`;
        super(player, Object.assign(options, { label }));
        this.quality = options.quality;
      }

      handleClick() {
        const qualityLevels = this.player().qualityLevels();

        // Отключить все уровни качества
        for (let i = 0; i < qualityLevels.length; i++) {
          qualityLevels[i].enabled = false;
        }

        // Включить выбранный уровень
        if (this.quality !== 'auto') {
          this.quality.enabled = true;
        } else {
          // Автоматический выбор качества
          for (let i = 0; i < qualityLevels.length; i++) {
            qualityLevels[i].enabled = true;
          }
        }

        onQualityChange?.(this.quality);
      }
    }

    class QualitySelector extends QualityMenuButton {
      constructor(player, options) {
        super(player, options);
        this.controlText('Качество');
      }

      createItems() {
        const items = [];

        // Автоматическое качество
        items.push(new QualityOption(this.player(), {
          label: 'Авто',
          quality: 'auto',
        }));

        // Доступные качества
        qualities.forEach(quality => {
          items.push(new QualityOption(this.player(), {
            label: `${quality.height}p`,
            quality,
          }));
        });

        return items;
      }
    }

    // Регистрация компонента
    videojs.registerComponent('QualitySelector', QualitySelector);

    // Добавление кнопки в панель управления
    playerRef.current.getChild('controlBar').addChild('QualitySelector', {}, 7);
  };

  // Обработка горячих клавиш
  const handleKeyDown = (e) => {
    if (!playerRef.current) return;

    switch (e.which) {
    case 32: // Пробел - воспроизведение/пауза
      e.preventDefault();
      if (playerRef.current.paused()) {
        playerRef.current.play();
      } else {
        playerRef.current.pause();
      }
      break;
    case 37: { // Стрелка влево - перемотка назад
      e.preventDefault();
      const currentTime = playerRef.current.currentTime();
      playerRef.current.currentTime(Math.max(0, currentTime - 10));
      break;
    }
    case 39: { // Стрелка вправо - перемотка вперед
      e.preventDefault();
      const duration = playerRef.current.duration();
      const newTime = playerRef.current.currentTime() + 10;
      playerRef.current.currentTime(Math.min(duration, newTime));
      break;
    }
    case 38: { // Стрелка вверх - увеличить громкость
      e.preventDefault();
      const currentVolume = playerRef.current.volume();
      playerRef.current.volume(Math.min(1, currentVolume + 0.1));
      break;
    }
    case 40: { // Стрелка вниз - уменьшить громкость
      e.preventDefault();
      const volume = playerRef.current.volume();
      playerRef.current.volume(Math.max(0, volume - 0.1));
      break;
    }
    case 77: // M - отключить/включить звук
      e.preventDefault();
      playerRef.current.muted(!playerRef.current.muted());
      break;
    case 70: // F - полноэкранный режим
      e.preventDefault();
      if (playerRef.current.isFullscreen()) {
        playerRef.current.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
      break;
    default:
      // Цифры 0-9 для перехода к определенному времени
      if (e.which >= 48 && e.which <= 57) {
        e.preventDefault();
        const percent = (e.which - 48) / 10;
        const duration = playerRef.current.duration();
        playerRef.current.currentTime(duration * percent);
      }
      break;
    }
  };

  // Получение сообщения об ошибке
  const getErrorMessage = (error) => {
    if (!error) return 'Неизвестная ошибка';

    switch (error.code) {
    case 1:
      return 'Воспроизведение прервано пользователем';
    case 2:
      return 'Ошибка сети при загрузке видео';
    case 3:
      return 'Ошибка декодирования видео';
    case 4:
      return 'Неподдерживаемый формат видео';
    default:
      return error.message || 'Ошибка воспроизведения видео';
    }
  };

  // Методы управления плеером
  const play = () => playerRef.current?.play();
  const pause = () => playerRef.current?.pause();
  const seek = (time) => playerRef.current?.currentTime(time);
  const setVolume = (volume) => playerRef.current?.volume(volume);
  const mute = () => playerRef.current?.muted(true);
  const unmute = () => playerRef.current?.muted(false);

  // Экспорт методов для внешнего использования
  useEffect(() => {
    if (playerRef.current && isReady) {
      // Добавляем методы к ref для внешнего доступа
      playerRef.current.customMethods = {
        play,
        pause,
        seek,
        setVolume,
        mute,
        unmute,
      };
    }
  }, [isReady]);

  return (
    <PlayerContainer>
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          data-setup="{}"
        >
          <track kind="captions" srcLang="ru" label="Русские субтитры" default />
        </video>
      </div>

      {error && (
        <ErrorMessage>
          <div>{error}</div>
          <button onClick={() => {
            setError(null);
            playerRef.current?.load();
          }}>
            Попробовать снова
          </button>
        </ErrorMessage>
      )}
    </PlayerContainer>
  );
};

export default VideoJSPlayer;
