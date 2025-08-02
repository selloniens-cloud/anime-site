import { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import dashjs from 'dashjs';
import { useHotkeys } from 'react-hotkeys-hook';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  padding: 20px;
  transform: translateY(${props => props.visible ? '0' : '100%'});
  transition: transform 0.3s ease;
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
`;

const PlayButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const ProgressContainer = styled.div`
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
`;

const ProgressBar = styled.div`
  height: 100%;
  background: ${props => props.theme.colors.primary};
  border-radius: 3px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`;

const BufferBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  width: ${props => props.buffered}%;
`;

const TimeDisplay = styled.span`
  font-size: 14px;
  font-family: monospace;
  min-width: 100px;
`;

const QualitySelector = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  option {
    background: #333;
    color: white;
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const VolumeButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: ${props => props.theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: ${props => props.theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
`;

const FullscreenButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const LoadingSpinner = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid ${props => props.theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
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
`;

const QualityBadge = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const BitrateInfo = styled.div`
  position: absolute;
  top: 50px;
  right: 15px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  opacity: ${props => props.visible ? 0.8 : 0};
  transition: opacity 0.3s ease;
`;

const DashPlayer = ({
  src,
  poster,
  onTimeUpdate,
  onProgress,
  onPlay,
  onPause,
  onEnded,
  onError,
  onQualityChange,
  onBitrateChange,
  autoPlay = false,
  muted = false,
  loop = false,
  preload = 'metadata',
  enableABR = true,
  stableBufferTime = 12,
  bufferTimeAtTopQuality = 30,
  bufferTimeAtTopQualityLongForm = 60,
  longFormContentDurationThreshold = 600,
  maxBitrate = null,
  minBitrate = null,
}) => {
  const videoRef = useRef(null);
  const dashRef = useRef(null);
  const containerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentBitrate, setCurrentBitrate] = useState(0);
  const [networkInfo, setNetworkInfo] = useState({});

  // Скрытие контролов через 3 секунды бездействия
  const hideControlsTimeout = useRef(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current);
    }
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current && src) {
      initializeDash();
    }

    return () => {
      if (dashRef.current) {
        dashRef.current.destroy();
        dashRef.current = null;
      }
    };
  }, [src]);

  const initializeDash = () => {
    // Создание DASH плеера
    dashRef.current = dashjs.MediaPlayer().create();

    // Конфигурация DASH
    const settings = {
      streaming: {
        stableBufferTime,
        bufferTimeAtTopQuality,
        bufferTimeAtTopQualityLongForm,
        longFormContentDurationThreshold,
        bufferPruningInterval: 30,
        bufferToKeep: 20,
        jumpGaps: true,
        jumpLargeGaps: true,
        smallGapLimit: 1.5,
        fastSwitchEnabled: true,
        abr: {
          autoSwitchBitrate: {
            video: enableABR,
            audio: true,
          },
          initialBitrate: {
            video: -1,
            audio: -1,
          },
          maxBitrate: {
            video: maxBitrate || -1,
            audio: -1,
          },
          minBitrate: {
            video: minBitrate || -1,
            audio: -1,
          },
          limitBitrateByPortal: true,
          usePixelRatioInLimitBitrateByPortal: false,
          maxRepresentationRatio: 1,
          bandwidthSafetyFactor: 0.9,
          useDeadTimeLatency: true,
          throughputRule: {
            active: true,
          },
          bolaRule: {
            active: true,
          },
          insufficientBufferRule: {
            active: true,
          },
          switchHistoryRule: {
            active: true,
          },
          droppedFramesRule: {
            active: true,
          },
          abandonRequestsRule: {
            active: true,
          },
        },
        cmcd: {
          enabled: false,
        },
        delay: {
          liveDelayFragmentCount: 4,
          liveDelay: null,
          useSuggestedPresentationDelay: true,
        },
        protection: {
          keepProtectionMediaKeys: false,
          ignoreEmeEncryptedEvent: false,
          detectPlayreadyMessageFormat: true,
        },
      },
      debug: {
        logLevel: process.env.NODE_ENV === 'development' ?
          dashjs.Debug.LOG_LEVEL_DEBUG : dashjs.Debug.LOG_LEVEL_ERROR,
      },
    };

    dashRef.current.updateSettings(settings);

    // События DASH плеера
    dashRef.current.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      console.log('DASH: Поток инициализирован');

      // Получение доступных качеств
      const bitrateInfoList = dashRef.current.getBitrateInfoListFor('video');
      if (bitrateInfoList && bitrateInfoList.length > 0) {
        const qualities = bitrateInfoList.map((bitrate, index) => ({
          index,
          height: bitrate.height,
          width: bitrate.width,
          bitrate: bitrate.bitrate,
          label: `${bitrate.height}p (${Math.round(bitrate.bitrate / 1000)}k)`,
        }));

        setAvailableQualities([
          { index: -1, label: 'Авто', height: 'auto' },
          ...qualities,
        ]);
      }
    });

    dashRef.current.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_REQUESTED, (e) => {
      const quality = e.newQuality;
      const bitrateInfo = dashRef.current.getBitrateInfoListFor('video')[quality];

      if (bitrateInfo) {
        setCurrentQuality(`${bitrateInfo.height}p`);
        setCurrentBitrate(bitrateInfo.bitrate);
        onQualityChange?.(quality, bitrateInfo);
      }
    });

    dashRef.current.on(dashjs.MediaPlayer.events.QUALITY_CHANGE_RENDERED, (e) => {
      const quality = e.newQuality;
      const bitrateInfo = dashRef.current.getBitrateInfoListFor('video')[quality];

      if (bitrateInfo) {
        onBitrateChange?.(bitrateInfo.bitrate, bitrateInfo);
      }
    });

    dashRef.current.on(dashjs.MediaPlayer.events.METRIC_CHANGED, (e) => {
      if (e.metric === 'HttpList') {
        // Обновление сетевой информации
        const httpRequests = dashRef.current.getMetricsFor('video').HttpList;
        if (httpRequests && httpRequests.length > 0) {
          const lastRequest = httpRequests[httpRequests.length - 1];
          setNetworkInfo({
            downloadTime: lastRequest.tresponse - lastRequest.trequest,
            bytesLoaded: lastRequest.bytesLoaded,
            bytesTotal: lastRequest.bytesTotal,
          });
        }
      }
    });

    dashRef.current.on(dashjs.MediaPlayer.events.BUFFER_LOADED, (e) => {
      // Обновление информации о буферизации
      const bufferedRange = dashRef.current.getBufferLength('video');
      const duration = dashRef.current.duration();
      if (duration > 0) {
        const bufferedPercent = (bufferedRange / duration) * 100;
        setBuffered(bufferedPercent);
      }
    });

    dashRef.current.on(dashjs.MediaPlayer.events.ERROR, (e) => {
      console.error('DASH Error:', e.error);

      let errorMessage = 'Ошибка DASH плеера';

      switch (e.error.code) {
      case dashjs.MediaPlayer.errors.MANIFEST_LOADER_PARSING_FAILURE_ERROR_CODE:
        errorMessage = 'Ошибка загрузки манифеста DASH';
        break;
      case dashjs.MediaPlayer.errors.MANIFEST_LOADER_LOADING_FAILURE_ERROR_CODE:
        errorMessage = 'Не удалось загрузить манифест DASH';
        break;
      case dashjs.MediaPlayer.errors.XLINK_LOADER_LOADING_FAILURE_ERROR_CODE:
        errorMessage = 'Ошибка загрузки XLink';
        break;
      case dashjs.MediaPlayer.errors.SEGMENT_BASE_LOADER_ERROR_CODE:
        errorMessage = 'Ошибка загрузки сегмента';
        break;
      case dashjs.MediaPlayer.errors.TIME_SYNC_FAILED_ERROR_CODE:
        errorMessage = 'Ошибка синхронизации времени';
        break;
      case dashjs.MediaPlayer.errors.FRAGMENT_LOADER_LOADING_FAILURE_ERROR_CODE:
        errorMessage = 'Ошибка загрузки фрагмента';
        break;
      case dashjs.MediaPlayer.errors.FRAGMENT_LOADER_NULL_REQUEST_ERROR_CODE:
        errorMessage = 'Пустой запрос фрагмента';
        break;
      case dashjs.MediaPlayer.errors.URL_RESOLUTION_FAILED_GENERIC_ERROR_CODE:
        errorMessage = 'Ошибка разрешения URL';
        break;
      case dashjs.MediaPlayer.errors.APPEND_ERROR_CODE:
        errorMessage = 'Ошибка добавления данных в буфер';
        break;
      case dashjs.MediaPlayer.errors.REMOVE_ERROR_CODE:
        errorMessage = 'Ошибка удаления данных из буфера';
        break;
      case dashjs.MediaPlayer.errors.DATA_UPDATE_FAILED_ERROR_CODE:
        errorMessage = 'Ошибка обновления данных';
        break;
      case dashjs.MediaPlayer.errors.CAPABILITY_MEDIASOURCE_ERROR_CODE:
        errorMessage = 'MediaSource не поддерживается';
        break;
      case dashjs.MediaPlayer.errors.CAPABILITY_MEDIAKEYS_ERROR_CODE:
        errorMessage = 'MediaKeys не поддерживается';
        break;
      case dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_MANIFEST_CODE:
        errorMessage = 'Ошибка скачивания манифеста';
        break;
      case dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_SIDX_CODE:
        errorMessage = 'Ошибка скачивания SIDX';
        break;
      case dashjs.MediaPlayer.errors.DOWNLOAD_ERROR_ID_CONTENT_CODE:
        errorMessage = 'Ошибка скачивания контента';
        break;
      default:
        errorMessage = e.error.message || 'Неизвестная ошибка DASH';
      }

      setError(errorMessage);
      onError?.(errorMessage);
    });

    // Инициализация плеера
    dashRef.current.initialize(videoRef.current, src, autoPlay);

    setupVideoEvents();
  };

  const setupVideoEvents = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    video.addEventListener('loadstart', () => setIsLoading(true));
    video.addEventListener('canplay', () => setIsLoading(false));
    video.addEventListener('loadedmetadata', () => {
      setDuration(video.duration);
    });

    video.addEventListener('timeupdate', () => {
      const current = video.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current);
    });

    video.addEventListener('progress', () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / duration) * 100;
        setBuffered(bufferedPercent);
        onProgress?.(bufferedPercent);
      }
    });

    video.addEventListener('play', () => {
      setIsPlaying(true);
      onPlay?.();
    });

    video.addEventListener('pause', () => {
      setIsPlaying(false);
      onPause?.();
    });

    video.addEventListener('ended', () => {
      setIsPlaying(false);
      onEnded?.();
    });

    video.addEventListener('error', (e) => {
      const errorMsg = 'Ошибка воспроизведения DASH видео';
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
    });
  };

  // Управление воспроизведением
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPlaying]);

  // Перемотка
  const seek = useCallback((time) => {
    if (dashRef.current) {
      dashRef.current.seek(time);
    }
  }, []);

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    seek(time);
  };

  // Управление качеством
  const handleQualityChange = (e) => {
    const selectedIndex = parseInt(e.target.value);

    if (dashRef.current) {
      if (selectedIndex === -1) {
        dashRef.current.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: { video: true },
            },
          },
        });
        setCurrentQuality('auto');
      } else {
        dashRef.current.updateSettings({
          streaming: {
            abr: {
              autoSwitchBitrate: { video: false },
            },
          },
        });
        dashRef.current.setQualityFor('video', selectedIndex);

        const bitrateInfo = dashRef.current.getBitrateInfoListFor('video')[selectedIndex];
        if (bitrateInfo) {
          setCurrentQuality(`${bitrateInfo.height}p`);
        }
      }

      onQualityChange?.(selectedIndex);
    }
  };

  // Управление громкостью
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
  };

  // Полноэкранный режим
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Отслеживание изменений полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Горячие клавиши
  useHotkeys('space', (e) => {
    e.preventDefault();
    togglePlay();
  }, { enableOnFormTags: true });

  useHotkeys('left', () => seek(Math.max(0, currentTime - 10)));
  useHotkeys('right', () => seek(Math.min(duration, currentTime + 10)));
  useHotkeys('up', () => {
    const newVolume = Math.min(1, volume + 0.1);
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
  });
  useHotkeys('down', () => {
    const newVolume = Math.max(0, volume - 0.1);
    setVolume(newVolume);
    if (videoRef.current) videoRef.current.volume = newVolume;
  });
  useHotkeys('m', toggleMute);
  useHotkeys('f', toggleFullscreen);

  // Форматирование времени
  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Форматирование битрейта
  const formatBitrate = (bitrate) => {
    if (bitrate > 1000000) {
      return `${(bitrate / 1000000).toFixed(1)}M`;
    } else if (bitrate > 1000) {
      return `${Math.round(bitrate / 1000)}k`;
    }
    return `${bitrate}`;
  };

  return (
    <PlayerContainer
      ref={containerRef}
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
    >
      <VideoElement
        ref={videoRef}
        poster={poster}
        muted={muted}
        loop={loop}
        preload={preload}
        onClick={togglePlay}
        playsInline
        crossOrigin="anonymous"
      />

      <QualityBadge visible={controlsVisible}>
        {currentQuality}
      </QualityBadge>

      <BitrateInfo visible={controlsVisible && currentBitrate > 0}>
        {formatBitrate(currentBitrate)}bps
      </BitrateInfo>

      {isLoading && <LoadingSpinner />}

      {error && (
        <ErrorMessage>
          <div>{error}</div>
          <button onClick={() => {
            setError(null);
            if (dashRef.current) {
              dashRef.current.reset();
              dashRef.current.attachSource(src);
            }
          }}>
            Попробовать снова
          </button>
        </ErrorMessage>
      )}

      <ControlsOverlay visible={controlsVisible}>
        <ControlsBar>
          <PlayButton onClick={togglePlay}>
            {isPlaying ? '⏸️' : '▶️'}
          </PlayButton>

          <ProgressContainer onClick={handleProgressClick}>
            <BufferBar buffered={buffered} />
            <ProgressBar progress={(currentTime / duration) * 100} />
          </ProgressContainer>

          <TimeDisplay>
            {formatTime(currentTime)} / {formatTime(duration)}
          </TimeDisplay>

          <QualitySelector
            value={dashRef.current?.getQualityFor?.('video') ?? -1}
            onChange={handleQualityChange}
          >
            {availableQualities.map(quality => (
              <option key={quality.index} value={quality.index}>
                {quality.label}
              </option>
            ))}
          </QualitySelector>

          <VolumeContainer>
            <VolumeButton onClick={toggleMute}>
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </VolumeButton>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
            />
          </VolumeContainer>

          <FullscreenButton onClick={toggleFullscreen}>
            {isFullscreen ? '⛶' : '⛶'}
          </FullscreenButton>
        </ControlsBar>
      </ControlsOverlay>
    </PlayerContainer>
  );
};

export default DashPlayer;
