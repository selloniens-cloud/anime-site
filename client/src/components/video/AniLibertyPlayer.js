import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Hls from 'hls.js';
import { useHotkeys } from 'react-hotkeys-hook';
import { LoadingSpinner } from '../../styles/GlobalStyles';
import {
  saveVideoProgress,
  loadVideoProgress,
  getVideoSettings,
  saveVideoSettings,
} from '../../utils/videoProgress';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  cursor: ${props => props.showCursor ? 'default' : 'none'};
  transition: cursor 0.3s ease;

  @media (max-width: 768px) {
    border-radius: 0;
  }
`;

const VideoElement = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  outline: none;
  background: #000;
`;

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  padding: 20px;
  transform: translateY(${props => props.visible ? '0' : '100%'});
  transition: transform 0.3s ease;
  z-index: 100;
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin-bottom: 15px;
  cursor: pointer;
  position: relative;

  &:hover {
    height: 8px;
  }
`;

const BufferBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  width: ${props => props.buffered}%;
  transition: width 0.1s ease;
`;

const ProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${props => props.theme.colors.primary};
  border-radius: 3px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`;

const ProgressThumb = styled.div`
  position: absolute;
  top: 50%;
  right: -6px;
  width: 12px;
  height: 12px;
  background: ${props => props.theme.colors.primary};
  border-radius: 50%;
  transform: translateY(-50%);
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
`;

const ControlsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    font-size: 20px;
    min-width: 35px;
    height: 35px;
    padding: 6px;
  }
`;

const TimeDisplay = styled.span`
  font-size: 14px;
  font-family: 'Courier New', monospace;
  min-width: 110px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 12px;
    min-width: 90px;
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const Select = styled.select`
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  outline: none;
  min-width: 80px;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${props => props.theme.colors.primary};
  }

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }

  option {
    background: #333;
    color: white;
  }

  @media (max-width: 768px) {
    padding: 4px 8px;
    font-size: 11px;
    min-width: 70px;
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 5px;
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    background: ${props => props.theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: ${props => props.theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    width: 60px;
  }
`;

const TopControls = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 101;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const InfoBadge = styled.div`
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
`;

const QualityBadge = styled(InfoBadge)`
  background: rgba(${props => props.theme.colors.primary.replace('#', '')}, 0.8);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: white;
  z-index: 200;
  background: rgba(0, 0, 0, 0.8);
  padding: 30px;
  border-radius: 10px;

  span {
    font-size: 16px;
    text-align: center;
  }
`;

const ErrorOverlay = styled(LoadingOverlay)`
  background: rgba(220, 53, 69, 0.9);
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  button {
    margin-top: 15px;
    background: white;
    color: #dc3545;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      background: #f8f9fa;
    }
  }
`;

const CenterPlayButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: none;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  font-size: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.visible ? 1 : 0};
  transition: all 0.3s ease;
  z-index: 150;

  &:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translate(-50%, -50%) scale(1.1);
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 24px;
  }
`;

const AniLibertyPlayer = ({
  animeId,
  episodeId,
  autoPlay = false,
  onProgress,
  onTimeUpdate,
  onPlay,
  onPause,
  onEnded,
  onError,
  onEpisodeChange,
  onQualityChange,
  className,
  style,
}) => {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);

  // Состояния плеера
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния UI
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCenterPlay, setShowCenterPlay] = useState(!autoPlay);
  const [progressHover, setProgressHover] = useState(false);

  // Данные видео
  const [videoData, setVideoData] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [currentVoice, setCurrentVoice] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);

  // Загрузка настроек при монтировании
  useEffect(() => {
    const settings = getVideoSettings();
    setVolume(settings.volume);
    setIsMuted(settings.muted);
    setCurrentQuality(settings.quality);
    setSubtitlesEnabled(settings.subtitles !== 'off');
  }, []);

  // Загрузка видеоданных
  useEffect(() => {
    if (animeId && episodeId) {
      loadVideoData();
    }
  }, [animeId, episodeId, currentQuality, currentVoice]);

  // Скрытие контролов
  const hideControlsAfterDelay = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
        setShowCursor(false);
      }
    }, 3000);
  }, [isPlaying]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    setShowCursor(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  // Загрузка видео данных
  const loadVideoData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/video/video?anime_id=${animeId}&episode=${episodeId}&quality=${currentQuality}&voice=${currentVoice}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Ошибка получения видео');
      }

      setVideoData(data);

      // Получаем доступные качества
      const qualitiesResponse = await fetch(
        `/api/video/qualities?anime_id=${animeId}&episode=${episodeId}`,
      );

      if (qualitiesResponse.ok) {
        const qualitiesData = await qualitiesResponse.json();
        if (qualitiesData.success && qualitiesData.qualities) {
          const qualities = Object.entries(qualitiesData.qualities)
            .filter(([_, url]) => url)
            .map(([quality, url]) => ({ quality, url }));
          setAvailableQualities(qualities);
        }
      }

      // Инициализируем HLS
      if (data.videoUrl) {
        initializeHLS(data.videoUrl);
      }

    } catch (err) {
      console.error('Error loading video:', err);
      setError(err.message);
      onError?.(err.message);
    }
  };

  // Инициализация HLS
  const initializeHLS = (videoUrl) => {
    if (!videoRef.current) return;

    // Очищаем предыдущий HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const video = videoRef.current;

    // Проверяем поддержку HLS
    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          startLevel: -1, // auto quality
          capLevelToPlayerSize: true,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
          setIsLoading(false);

          if (autoPlay) {
            playVideo();
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const level = hls.levels[data.level];
          if (level) {
            const quality = `${level.height}p`;
            setCurrentQuality(quality);
            onQualityChange?.(quality);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            setError(`Ошибка HLS: ${data.details}`);
          }
        });

        hlsRef.current = hls;

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Нативная поддержка HLS (Safari)
        video.src = videoUrl;
        setIsLoading(false);
      } else {
        setError('HLS не поддерживается в вашем браузере');
      }
    } else {
      // Обычное видео
      video.src = videoUrl;
      setIsLoading(false);
    }
  };

  // Управление воспроизведением
  const playVideo = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.play();
      setIsPlaying(true);
      setShowCenterPlay(false);
      hideControlsAfterDelay();
      onPlay?.();
    } catch (err) {
      console.error('Play error:', err);
      setError('Не удалось воспроизвести видео');
    }
  }, [hideControlsAfterDelay, onPlay]);

  const pauseVideo = useCallback(() => {
    if (!videoRef.current) return;

    videoRef.current.pause();
    setIsPlaying(false);
    setShowCenterPlay(true);
    setControlsVisible(true);
    onPause?.();
  }, [onPause]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  }, [isPlaying, playVideo, pauseVideo]);

  // Обработчики видео событий
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current);

      // Сохраняем прогресс
      if (animeId && episodeId && current > 0 && duration > 0) {
        const progress = (current / duration) * 100;
        saveVideoProgress(animeId, episodeId, current, duration, progress);
        onProgress?.({ currentTime: current, duration, progress });
      }
    };

    const handleLoadedMetadata = () => {
      const dur = video.duration;
      setDuration(dur);

      // Восстанавливаем позицию просмотра
      if (animeId && episodeId) {
        const savedProgress = loadVideoProgress(animeId, episodeId);
        if (savedProgress && savedProgress.currentTime > 10) {
          video.currentTime = savedProgress.currentTime;
        }
      }
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
        setBuffered(Math.min(bufferedPercent, 100));
      }
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);

      // Сохраняем настройки
      saveVideoSettings({ volume: video.volume, muted: video.muted });
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowCenterPlay(true);
      setControlsVisible(true);
      onEnded?.();
    };

    const handleError = (e) => {
      console.error('Video error:', e);
      setError('Ошибка воспроизведения видео');
      setIsLoading(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [animeId, episodeId, duration, onTimeUpdate, onProgress, onEnded]);

  // Seek функционал
  const seekTo = useCallback((time) => {
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = Math.max(0, Math.min(time, duration));
    }
  }, [duration]);

  const handleProgressClick = useCallback((e) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const time = percent * duration;
    seekTo(time);
  }, [duration, seekTo]);

  // Управление громкостью
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume === 0) {
        videoRef.current.muted = true;
      } else if (isMuted) {
        videoRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  }, []);

  // Полноэкранный режим
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  // Отслеживание полноэкранного режима
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
  }, { enableOnFormTags: false });

  useHotkeys('left', () => seekTo(currentTime - 10));
  useHotkeys('right', () => seekTo(currentTime + 10));

  useHotkeys('up', () => {
    const newVolume = Math.min(1, volume + 0.1);
    if (videoRef.current) videoRef.current.volume = newVolume;
  });

  useHotkeys('down', () => {
    const newVolume = Math.max(0, volume - 0.1);
    if (videoRef.current) videoRef.current.volume = newVolume;
  });

  useHotkeys('m', toggleMute);
  useHotkeys('f', toggleFullscreen);

  // Цифры для быстрого перехода
  useHotkeys(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], (e) => {
    const percent = parseInt(e.key) / 10;
    seekTo(duration * percent);
  });

  // Смена качества
  const handleQualityChange = useCallback((e) => {
    const newQuality = e.target.value;
    setCurrentQuality(newQuality);
    saveVideoSettings({ quality: newQuality });
  }, []);

  // Форматирование времени
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  if (!animeId || !episodeId) {
    return (
      <PlayerContainer className={className} style={style}>
        <ErrorOverlay>
          <h3>Нет данных для воспроизведения</h3>
          <span>Не указан ID аниме или эпизода</span>
        </ErrorOverlay>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer
      ref={containerRef}
      className={className}
      style={style}
      showCursor={showCursor}
      onMouseMove={showControls}
      onMouseLeave={() => !isPlaying || setControlsVisible(false)}
      onClick={togglePlay}
    >
      <VideoElement
        ref={videoRef}
        playsInline
        crossOrigin="anonymous"
        preload="metadata"
      />

      {/* Центральная кнопка воспроизведения */}
      <CenterPlayButton
        visible={showCenterPlay && !isLoading && !error}
        onClick={(e) => {
          e.stopPropagation();
          playVideo();
        }}
      >
        ▶
      </CenterPlayButton>

      {/* Верхние контролы */}
      <TopControls visible={controlsVisible}>
        <InfoBadge>
          {videoData?.episode?.title || `Эпизод ${episodeId}`}
        </InfoBadge>

        <QualityBadge>
          {currentQuality === 'auto' ? 'AUTO' : currentQuality.toUpperCase()}
        </QualityBadge>
      </TopControls>

      {/* Загрузка */}
      {isLoading && (
        <LoadingOverlay>
          <LoadingSpinner size="48px" />
          <span>Загрузка видео...</span>
        </LoadingOverlay>
      )}

      {/* Ошибка */}
      {error && (
        <ErrorOverlay>
          <h3>Ошибка воспроизведения</h3>
          <span>{error}</span>
          <button onClick={loadVideoData}>
            Попробовать снова
          </button>
        </ErrorOverlay>
      )}

      {/* Нижние контролы */}
      <ControlsOverlay visible={controlsVisible && !isLoading && !error}>
        {/* Progress Bar */}
        <ProgressContainer
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseEnter={() => setProgressHover(true)}
          onMouseLeave={() => setProgressHover(false)}
        >
          <BufferBar buffered={buffered} />
          <ProgressBar progress={(currentTime / duration) * 100} />
          <ProgressThumb visible={progressHover} />
        </ProgressContainer>

        {/* Controls */}
        <ControlsBar>
          <ControlButton onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶'}
          </ControlButton>

          <TimeDisplay>
            {formatTime(currentTime)} / {formatTime(duration)}
          </TimeDisplay>

          {/* Volume Control */}
          <VolumeContainer>
            <ControlButton onClick={toggleMute}>
              {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </ControlButton>
            <VolumeSlider
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
            />
          </VolumeContainer>

          <Spacer />

          {/* Quality Selector */}
          {availableQualities.length > 0 && (
            <SelectContainer>
              <Select
                value={currentQuality}
                onChange={handleQualityChange}
              >
                <option value="auto">AUTO</option>
                {availableQualities.map(({ quality }) => (
                  <option key={quality} value={quality}>
                    {quality.toUpperCase()}
                  </option>
                ))}
              </Select>
            </SelectContainer>
          )}

          {/* Voice Selector */}
          {availableVoices.length > 0 && (
            <SelectContainer>
              <Select
                value={currentVoice}
                onChange={(e) => setCurrentVoice(parseInt(e.target.value))}
              >
                {availableVoices.map((voice, index) => (
                  <option key={index} value={index}>
                    {voice.name || `Озвучка ${index + 1}`}
                  </option>
                ))}
              </Select>
            </SelectContainer>
          )}

          {/* Subtitles Toggle */}
          <ControlButton
            onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
            style={{ fontSize: '16px' }}
          >
            {subtitlesEnabled ? '🔤' : '💬'}
          </ControlButton>

          {/* Fullscreen */}
          <ControlButton onClick={toggleFullscreen}>
            {isFullscreen ? '⛶' : '⛶'}
          </ControlButton>
        </ControlsBar>
      </ControlsOverlay>
    </PlayerContainer>
  );
};

export default AniLibertyPlayer;
