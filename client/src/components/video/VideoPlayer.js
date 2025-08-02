import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { LoadingSpinner } from '../../styles/GlobalStyles';

// Ленивая загрузка плееров для оптимизации
const HTML5Player = lazy(() => import('./HTML5Player'));
const VideoJSPlayer = lazy(() => import('./VideoJSPlayer'));
const PlyrPlayer = lazy(() => import('./PlyrPlayer'));
const HLSPlayer = lazy(() => import('./HLSPlayer'));
const DashPlayer = lazy(() => import('./DashPlayer'));

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: 300px;

  @media (max-width: 768px) {
    min-height: 200px;
  }
`;

const PlayerSelector = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const PlayerButton = styled.button`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid ${props => props.active ? (props.theme?.colors?.primary || '#FF6B6B') : 'rgba(255, 255, 255, 0.3)'};
  color: ${props => props.active ? (props.theme?.colors?.primary || '#FF6B6B') : 'white'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }
`;

const ErrorFallback = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  max-width: 400px;

  h3 {
    margin-bottom: 10px;
    color: ${props => props.theme?.colors?.error || '#E74C3C'};
  }

  p {
    margin-bottom: 15px;
    font-size: 14px;
    opacity: 0.9;
  }

  button {
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin: 0 5px;

    &:hover {
      opacity: 0.9;
    }
  }
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: white;

  span {
    font-size: 14px;
    opacity: 0.8;
  }
`;

// Типы плееров и их приоритеты
const PLAYER_TYPES = {
  HTML5: 'html5',
  VIDEOJS: 'videojs',
  PLYR: 'plyr',
  HLS: 'hls',
  DASH: 'dash',
};

const PLAYER_PRIORITY = {
  [PLAYER_TYPES.HLS]: 5,
  [PLAYER_TYPES.DASH]: 4,
  [PLAYER_TYPES.VIDEOJS]: 3,
  [PLAYER_TYPES.PLYR]: 2,
  [PLAYER_TYPES.HTML5]: 1,
};

const VideoPlayer = ({
  src,
  poster,
  title = 'Видео',

  // Настройки воспроизведения
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',

  // Предпочтения плеера
  preferredPlayer = 'auto',
  enablePlayerSelector = process.env.NODE_ENV === 'development',
  fallbackPlayers = ['videojs', 'plyr', 'html5'],

  // Качество и субтитры
  qualities = [],
  subtitles = [],
  playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2],

  // Настройки стриминга
  hlsConfig = {},
  dashConfig = {},

  // Обработчики событий
  onTimeUpdate,
  onProgress,
  onPlay,
  onPause,
  onEnded,
  onError,
  onPlayerChange,
  onQualityChange,
  onLoadStart,
  onLoadEnd,

  // Дополнительные настройки
  className,
  style,
  ...otherProps
}) => {
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [playerSelectorVisible, setPlayerSelectorVisible] = useState(false);
  const [supportedPlayers, setSupportedPlayers] = useState([]);

  // Определение типа контента и оптимального плеера
  const contentInfo = useMemo(() => {
    if (!src) return { type: 'unknown', format: 'unknown' };

    const url = typeof src === 'string' ? src : src.src || '';
    const extension = url.split('.').pop()?.toLowerCase() || '';
    const mimeType = typeof src === 'object' ? src.type : '';

    // Определение типа контента
    let type = 'video';
    let format = extension;

    if (extension === 'm3u8' || mimeType?.includes('mpegurl')) {
      type = 'hls';
      format = 'hls';
    } else if (extension === 'mpd' || mimeType?.includes('dash')) {
      type = 'dash';
      format = 'dash';
    } else if (['mp4', 'webm', 'ogv'].includes(extension)) {
      type = 'video';
      format = extension;
    }

    return { type, format, url, extension };
  }, [src]);

  // Проверка поддержки различных плееров
  const checkPlayerSupport = useCallback(() => {
    const supported = [];

    // HTML5 всегда поддерживается
    supported.push(PLAYER_TYPES.HTML5);

    // Video.js поддерживается если есть MSE
    if (window.MediaSource) {
      supported.push(PLAYER_TYPES.VIDEOJS);
    }

    // Plyr поддерживается всегда
    supported.push(PLAYER_TYPES.PLYR);

    // HLS поддерживается если есть MSE или нативная поддержка
    if (window.MediaSource ||
        document.createElement('video').canPlayType('application/vnd.apple.mpegurl')) {
      supported.push(PLAYER_TYPES.HLS);
    }

    // DASH поддерживается если есть MSE
    if (window.MediaSource) {
      supported.push(PLAYER_TYPES.DASH);
    }

    setSupportedPlayers(supported);
    return supported;
  }, []);

  // Выбор оптимального плеера
  const selectOptimalPlayer = useCallback(() => {
    const supported = checkPlayerSupport();

    // Если указан конкретный плеер и он поддерживается
    if (preferredPlayer !== 'auto' && supported.includes(preferredPlayer)) {
      return preferredPlayer;
    }

    // Автоматический выбор на основе типа контента
    switch (contentInfo.type) {
    case 'hls': {
      if (supported.includes(PLAYER_TYPES.HLS)) return PLAYER_TYPES.HLS;
      if (supported.includes(PLAYER_TYPES.VIDEOJS)) return PLAYER_TYPES.VIDEOJS;
      break;
    }

    case 'dash': {
      if (supported.includes(PLAYER_TYPES.DASH)) return PLAYER_TYPES.DASH;
      if (supported.includes(PLAYER_TYPES.VIDEOJS)) return PLAYER_TYPES.VIDEOJS;
      break;
    }

    case 'video':
    default: {
      // Выбор лучшего плеера для обычного видео
      const availablePlayers = supported.filter(player =>
        [PLAYER_TYPES.VIDEOJS, PLAYER_TYPES.PLYR, PLAYER_TYPES.HTML5].includes(player),
      );

      if (availablePlayers.length > 0) {
        // Сортировка по приоритету
        availablePlayers.sort((a, b) => PLAYER_PRIORITY[b] - PLAYER_PRIORITY[a]);
        return availablePlayers[0];
      }
      break;
    }
    }

    // Fallback к HTML5
    return PLAYER_TYPES.HTML5;
  }, [contentInfo, preferredPlayer, checkPlayerSupport]);

  // Инициализация плеера
  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setError(null);

      const optimalPlayer = selectOptimalPlayer();
      setCurrentPlayer(optimalPlayer);

      onPlayerChange?.(optimalPlayer);

      // Имитация загрузки для демонстрации
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [src, selectOptimalPlayer, onPlayerChange]);

  // Обработка ошибок с автоматическим fallback
  const handlePlayerError = useCallback((errorMessage) => {
    console.error(`Ошибка плеера ${currentPlayer}:`, errorMessage);

    setError(errorMessage);

    // Попытка переключения на fallback плеер
    if (retryCount < fallbackPlayers.length) {
      const nextPlayer = fallbackPlayers[retryCount];

      if (supportedPlayers.includes(nextPlayer) && nextPlayer !== currentPlayer) {
        console.log(`Переключение на fallback плеер: ${nextPlayer}`);

        setTimeout(() => {
          setCurrentPlayer(nextPlayer);
          setError(null);
          setRetryCount(prev => prev + 1);
          onPlayerChange?.(nextPlayer);
        }, 1000);
      }
    }

    onError?.(errorMessage);
  }, [currentPlayer, retryCount, fallbackPlayers, supportedPlayers, onPlayerChange, onError]);

  // Ручное переключение плеера
  const switchPlayer = useCallback((playerType) => {
    if (supportedPlayers.includes(playerType) && playerType !== currentPlayer) {
      setCurrentPlayer(playerType);
      setError(null);
      setRetryCount(0);
      onPlayerChange?.(playerType);
    }
  }, [supportedPlayers, currentPlayer, onPlayerChange]);

  // Повтор с текущим плеером
  const retryCurrentPlayer = useCallback(() => {
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  // Переключение на следующий доступный плеер
  const tryNextPlayer = useCallback(() => {
    const currentIndex = supportedPlayers.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % supportedPlayers.length;
    const nextPlayer = supportedPlayers[nextIndex];

    switchPlayer(nextPlayer);
  }, [supportedPlayers, currentPlayer, switchPlayer]);

  // Обработчики событий плеера
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  // Рендер текущего плеера
  const renderPlayer = () => {
    if (!currentPlayer || !src) return null;

    const commonProps = {
      src,
      poster,
      autoPlay,
      muted,
      loop,
      preload,
      qualities,
      subtitles,
      playbackRates,
      onTimeUpdate,
      onProgress,
      onPlay,
      onPause,
      onEnded,
      onError: handlePlayerError,
      onQualityChange,
      onLoadStart: handleLoadStart,
      onLoadEnd: handleLoadEnd,
      ...otherProps,
    };

    switch (currentPlayer) {
    case PLAYER_TYPES.HTML5:
      return <HTML5Player {...commonProps} />;

    case PLAYER_TYPES.VIDEOJS:
      return <VideoJSPlayer {...commonProps} />;

    case PLAYER_TYPES.PLYR:
      return <PlyrPlayer {...commonProps} />;

    case PLAYER_TYPES.HLS:
      return <HLSPlayer {...commonProps} {...hlsConfig} />;

    case PLAYER_TYPES.DASH:
      return <DashPlayer {...commonProps} {...dashConfig} />;

    default:
      return <HTML5Player {...commonProps} />;
    }
  };

  if (!src) {
    return (
      <PlayerContainer className={className} style={style}>
        <ErrorFallback>
          <h3>Нет источника видео</h3>
          <p>Источник видео не указан</p>
        </ErrorFallback>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer
      className={className}
      style={style}
      onMouseEnter={() => enablePlayerSelector && setPlayerSelectorVisible(true)}
      onMouseLeave={() => enablePlayerSelector && setPlayerSelectorVisible(false)}
    >
      {/* Селектор плеера для разработки */}
      {enablePlayerSelector && (
        <PlayerSelector visible={playerSelectorVisible}>
          {supportedPlayers.map(playerType => (
            <PlayerButton
              key={playerType}
              active={playerType === currentPlayer}
              onClick={() => switchPlayer(playerType)}
              title={`Переключить на ${playerType}`}
            >
              {playerType.toUpperCase()}
            </PlayerButton>
          ))}
        </PlayerSelector>
      )}

      {/* Загрузка */}
      {isLoading && (
        <LoadingContainer>
          <LoadingSpinner size="48px" />
          <span>Загрузка плеера {currentPlayer}...</span>
        </LoadingContainer>
      )}

      {/* Ошибка */}
      {error && !isLoading && (
        <ErrorFallback>
          <h3>Ошибка воспроизведения</h3>
          <p>{error}</p>
          <p>Плеер: {currentPlayer?.toUpperCase()}</p>
          <div>
            <button onClick={retryCurrentPlayer}>
              Повторить
            </button>
            {supportedPlayers.length > 1 && (
              <button onClick={tryNextPlayer}>
                Другой плеер
              </button>
            )}
          </div>
        </ErrorFallback>
      )}

      {/* Плеер */}
      {!error && (
        <Suspense fallback={
          <LoadingContainer>
            <LoadingSpinner size="48px" />
            <span>Загрузка компонента плеера...</span>
          </LoadingContainer>
        }>
          {renderPlayer()}
        </Suspense>
      )}
    </PlayerContainer>
  );
};

export default VideoPlayer;

// Экспорт типов плееров для внешнего использования
export { PLAYER_TYPES };

// Хук для использования VideoPlayer с дополнительными возможностями
export const useVideoPlayer = (initialConfig = {}) => {
  const [config, setConfig] = useState(initialConfig);
  const [playerState, setPlayerState] = useState({
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    volume: 1,
    quality: 'auto',
    player: null,
  });

  const updateConfig = useCallback((newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const updatePlayerState = useCallback((newState) => {
    setPlayerState(prev => ({ ...prev, ...newState }));
  }, []);

  return {
    config,
    playerState,
    updateConfig,
    updatePlayerState,
    // Готовые обработчики событий
    handlers: {
      onTimeUpdate: (time) => updatePlayerState({ currentTime: time }),
      onPlay: () => updatePlayerState({ isPlaying: true }),
      onPause: () => updatePlayerState({ isPlaying: false }),
      onQualityChange: (quality) => updatePlayerState({ quality }),
      onPlayerChange: (player) => updatePlayerState({ player }),
    },
  };
};
