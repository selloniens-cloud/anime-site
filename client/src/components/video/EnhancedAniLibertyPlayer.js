import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Hls from 'hls.js';
import { LoadingSpinner } from '../../styles/GlobalStyles';
import useVideoHotkeys, { useHotkeyTooltips } from '../../hooks/useHotkeys';
import QualityController from './QualityController';
import VoiceSelector from './VoiceSelector';
import SubtitleManager from './SubtitleManager';
import {
  saveVideoProgressDB,
  loadVideoProgressDB,
  getVideoSettingsDB,
  saveVideoSettingsDB,
  migrateFromLocalStorage,
  isIndexedDBSupported,
} from '../../utils/indexedDBProgress';

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
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.7) 50%,
    rgba(0, 0, 0, 0) 100%
  );
  padding: 25px;
  transform: translateY(${props => props.visible ? '0' : '100%'});
  transition: transform 0.3s ease;
  z-index: 100;
`;

const ProgressContainer = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin-bottom: 20px;
  cursor: pointer;
  position: relative;
  transition: height 0.2s ease;

  &:hover {
    height: 10px;
  }
`;

const BufferBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 4px;
  width: ${props => props.buffered}%;
  transition: width 0.1s ease;
`;

const ProgressBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${props => props.theme.colors.primary};
  border-radius: 4px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
  box-shadow: 0 0 8px ${props => props.theme.colors.primary}66;
`;

const ProgressThumb = styled.div`
  position: absolute;
  top: 50%;
  right: -8px;
  width: 16px;
  height: 16px;
  background: ${props => props.theme.colors.primary};
  border-radius: 50%;
  transform: translateY(-50%);
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const ControlsBar = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
  color: white;

  @media (max-width: 768px) {
    gap: 15px;
    grid-template-columns: auto 1fr;
  }
`;

const LeftControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const RightControls = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  @media (max-width: 768px) {
    gap: 10px;
    grid-column: 1 / -1;
    justify-content: center;
    margin-top: 10px;
  }
`;

const CenterControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const ControlButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.15);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    font-size: 18px;
    min-width: 40px;
    height: 40px;
    padding: 8px;
  }
`;

const PlayButton = styled(ControlButton)`
  font-size: 24px;
  background: ${props => props.theme.colors.primary};
  border-radius: 50%;
  width: 56px;
  height: 56px;

  &:hover {
    background: ${props => props.theme.colors.primary}dd;
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    font-size: 20px;
    width: 48px;
    height: 48px;
  }
`;

const TimeDisplay = styled.div`
  font-size: 15px;
  font-family: 'Courier New', monospace;
  min-width: 130px;
  text-align: center;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 13px;
    min-width: 110px;
  }
`;

const VolumeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 120px;

  @media (max-width: 768px) {
    min-width: 100px;
    gap: 8px;
  }
`;

const VolumeSlider = styled.input`
  width: 80px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: ${props => props.theme.colors.primary};
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
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
  align-items: flex-start;
  z-index: 101;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const EpisodeInfo = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  max-width: 300px;
  backdrop-filter: blur(10px);
`;

const PlayerStatus = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
`;

const StatusBadge = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  backdrop-filter: blur(10px);
`;

const QualityBadge = styled(StatusBadge)`
  background: rgba(${props => props.theme.colors.primary.replace('#', '')}, 0.9);
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: white;
  z-index: 200;
  background: rgba(0, 0, 0, 0.8);
  padding: 40px;
  border-radius: 12px;
  backdrop-filter: blur(10px);

  span {
    font-size: 16px;
    text-align: center;
    opacity: 0.9;
  }
`;

const ErrorOverlay = styled(LoadingOverlay)`
  background: rgba(220, 53, 69, 0.9);
  
  h3 {
    margin: 0 0 15px 0;
    font-size: 20px;
  }

  p {
    margin: 0 0 20px 0;
    opacity: 0.9;
    text-align: center;
    line-height: 1.4;
  }

  button {
    background: white;
    color: #dc3545;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    margin: 0 8px;
    transition: all 0.2s ease;

    &:hover {
      background: #f8f9fa;
      transform: translateY(-1px);
    }
  }
`;

const CenterPlayButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border: none;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 50%;
  font-size: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.visible ? 1 : 0};
  transition: all 0.3s ease;
  z-index: 150;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(0, 0, 0, 0.95);
    transform: translate(-50%, -50%) scale(1.1);
  }

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    font-size: 32px;
  }
`;

const HotkeyTooltip = styled.div`
  position: absolute;
  bottom: 120px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 15px;
  border-radius: 8px;
  font-size: 12px;
  max-width: 250px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  z-index: 150;
  backdrop-filter: blur(10px);

  h4 {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: ${props => props.theme.colors.primary};
  }

  .hotkey-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    
    .key {
      font-weight: bold;
      color: ${props => props.theme.colors.primary};
    }
  }
`;

const EnhancedAniLibertyPlayer = ({
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
  const saveProgressTimeoutRef = useRef(null);

  // Состояния плеера
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Состояния UI
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCenterPlay, setShowCenterPlay] = useState(!autoPlay);
  const [progressHover, setProgressHover] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);

  // Данные видео
  const [videoData, setVideoData] = useState(null);
  const [availableQualities, setAvailableQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [currentVoice, setCurrentVoice] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [currentBitrate, setCurrentBitrate] = useState(0);
  const [networkSpeed, setNetworkSpeed] = useState(0);

  // Настройки из IndexedDB
  const [settings, setSettings] = useState(null);

  const hotkeys = useHotkeyTooltips();

  // Загрузка настроек при монтировании
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // Миграция с localStorage если нужно
        if (isIndexedDBSupported()) {
          const hasLocalData = localStorage.getItem('video_settings');
          if (hasLocalData) {
            console.log('Выполняем миграцию с localStorage...');
            await migrateFromLocalStorage();
          }
        }

        const loadedSettings = await getVideoSettingsDB();
        setSettings(loadedSettings);
        setVolume(loadedSettings.volume);
        setIsMuted(loadedSettings.muted);
        setCurrentQuality(loadedSettings.quality);
        setSubtitlesEnabled(loadedSettings.subtitles !== 'off');
        setPlaybackRate(loadedSettings.playbackRate || 1);
      } catch (error) {
        console.error('Ошибка инициализации настроек:', error);
      }
    };

    initializeSettings();
  }, []);

  // Загрузка видеоданных
  useEffect(() => {
    if (animeId && episodeId) {
      loadVideoData();
    }
  }, [animeId, episodeId, currentQuality, currentVoice]);

  // Автосохранение прогресса
  useEffect(() => {
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }

    if (animeId && episodeId && currentTime > 0 && duration > 0) {
      saveProgressTimeoutRef.current = setTimeout(async () => {
        const progress = (currentTime / duration) * 100;
        const metadata = {
          quality: currentQuality,
          voice: currentVoice,
          subtitles: subtitlesEnabled,
          playerType: 'aniliberty',
        };

        await saveVideoProgressDB(animeId, episodeId, currentTime, duration, progress, metadata);
        onProgress?.({ currentTime, duration, progress });
      }, 2000); // Сохраняем каждые 2 секунды
    }

    return () => {
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
    };
  }, [animeId, episodeId, currentTime, duration, currentQuality, currentVoice, subtitlesEnabled, onProgress]);

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
            .map(([quality, url]) => ({
              label: quality,
              height: parseInt(quality.replace('p', '')),
              bitrate: getBitrateForQuality(quality),
              url,
            }));
          setAvailableQualities(qualities);
        }
      }

      // Получаем озвучки
      if (data.voices && data.voices.length > 0) {
        setAvailableVoices(data.voices);
      }

      // Получаем субтитры
      if (data.subtitles && data.subtitles.length > 0) {
        setSubtitleTracks(data.subtitles);
      }

      // Инициализируем HLS
      if (data.videoUrl) {
        await initializeHLS(data.videoUrl);
      }

    } catch (err) {
      console.error('Error loading video:', err);
      setError(err.message);
      onError?.(err.message);
    }
  };

  const getBitrateForQuality = (quality) => {
    const qualityMap = {
      '2160p': 15000000,
      '1440p': 8000000,
      '1080p': 5000000,
      '720p': 2500000,
      '480p': 1000000,
      '360p': 500000,
      '240p': 250000,
    };
    return qualityMap[quality] || 1000000;
  };

  // Инициализация HLS
  const initializeHLS = async (videoUrl) => {
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
          debug: false,
        });

        hls.loadSource(videoUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('HLS manifest parsed');
          setIsLoading(false);

          // Восстанавливаем позицию просмотра
          restoreVideoPosition();

          if (autoPlay) {
            playVideo();
          }
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const level = hls.levels[data.level];
          if (level) {
            const quality = `${level.height}p`;
            setCurrentQuality(quality);
            setCurrentBitrate(level.bitrate);
            onQualityChange?.(quality);
          }
        });

        hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
          // Оцениваем скорость сети
          if (data.frag && data.frag.duration && data.stats) {
            const loadTime = data.stats.tfirst - data.stats.trequest;
            const speed = (data.frag.loaded * 8) / (loadTime / 1000); // bps
            setNetworkSpeed(speed);
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
        restoreVideoPosition();
      } else {
        setError('HLS не поддерживается в вашем браузере');
      }
    } else {
      // Обычное видео
      video.src = videoUrl;
      setIsLoading(false);
      restoreVideoPosition();
    }
  };

  // Восстановление позиции просмотра
  const restoreVideoPosition = async () => {
    if (!animeId || !episodeId || !videoRef.current) return;

    try {
      const savedProgress = await loadVideoProgressDB(animeId, episodeId);
      if (savedProgress && savedProgress.currentTime > 10) {
        videoRef.current.currentTime = savedProgress.currentTime;
      }
    } catch (error) {
      console.error('Ошибка восстановления позиции:', error);
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

  // Горячие клавиши
  useVideoHotkeys({
    onPlayPause: togglePlay,
    onSeek: useCallback((seconds) => {
      if (videoRef.current && duration > 0) {
        const newTime = Math.max(0, Math.min(currentTime + seconds, duration));
        videoRef.current.currentTime = newTime;
      }
    }, [currentTime, duration]),
    onVolumeChange: useCallback((delta) => {
      if (videoRef.current) {
        const newVolume = Math.max(0, Math.min(1, volume + delta));
        setVolume(newVolume);
        videoRef.current.volume = newVolume;
        if (newVolume === 0) {
          setIsMuted(true);
          videoRef.current.muted = true;
        } else if (isMuted) {
          setIsMuted(false);
          videoRef.current.muted = false;
        }
      }
    }, [volume, isMuted]),
    onMute: useCallback(() => {
      if (videoRef.current) {
        const newMuted = !isMuted;
        videoRef.current.muted = newMuted;
        setIsMuted(newMuted);
      }
    }, [isMuted]),
    onFullscreen: useCallback(() => {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    }, []),
    onSubtitlesToggle: useCallback(() => {
      setSubtitlesEnabled(!subtitlesEnabled);
    }, [subtitlesEnabled]),
    onSubtitleSettings: useCallback(() => {
      setShowSubtitleSettings(!showSubtitleSettings);
    }, [showSubtitleSettings]),
    onNextEpisode: useCallback(() => {
      onEpisodeChange?.(1);
    }, [onEpisodeChange]),
    onPrevEpisode: useCallback(() => {
      onEpisodeChange?.(-1);
    }, [onEpisodeChange]),
    onSeekToPercent: useCallback((percent) => {
      if (videoRef.current && duration > 0) {
        const newTime = duration * percent;
        videoRef.current.currentTime = newTime;
      }
    }, [duration]),
    onSpeedChange: useCallback((delta) => {
      const newRate = Math.max(0.25, Math.min(2, playbackRate + delta));
      setPlaybackRate(newRate);
      if (videoRef.current) {
        videoRef.current.playbackRate = newRate;
      }
    }, [playbackRate]),
    enabled: settings?.hotkeysEnabled !== false,
    seekStep: settings?.seekStep || 10,
    volumeStep: settings?.volumeStep || 0.1,
  });

  // Обработчики видео событий
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      onTimeUpdate?.(current);
    };

    const handleLoadedMetadata = () => {
      const dur = video.duration;
      setDuration(dur);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const bufferedPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0;
        setBuffered(Math.min(bufferedPercent, 100));
      }
    };

    const handleVolumeChange = async () => {
      setVolume(video.volume);
      setIsMuted(video.muted);

      // Сохраняем настройки
      if (settings) {
        await saveVideoSettingsDB({
          ...settings,
          volume: video.volume,
          muted: video.muted,
        });
      }
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
  }, [duration, onTimeUpdate, onEnded, settings]);

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

  // Обработчики качества и озвучки
  const handleQualityChange = useCallback((quality) => {
    setCurrentQuality(quality);
    if (settings) {
      saveVideoSettingsDB({ ...settings, quality });
    }
  }, [settings]);

  const handleVoiceChange = useCallback((voiceIndex) => {
    setCurrentVoice(voiceIndex);
    if (settings) {
      saveVideoSettingsDB({ ...settings, voice: voiceIndex });
    }
  }, [settings]);

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

  // Отслеживание полноэкранного режима
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
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
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
    };
  }, []);

  if (!animeId || !episodeId) {
    return (
      <PlayerContainer className={className} style={style}>
        <ErrorOverlay>
          <h3>Нет данных для воспроизведения</h3>
          <p>Не указан ID аниме или эпизода</p>
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

      {/* Субтитры */}
      <SubtitleManager
        currentTime={currentTime}
        subtitleTracks={subtitleTracks}
        enabled={subtitlesEnabled}
        showSettings={showSubtitleSettings}
        onSettingsToggle={() => setShowSubtitleSettings(!showSubtitleSettings)}
      />

      {/* Верхние контролы */}
      <TopControls visible={controlsVisible}>
        <EpisodeInfo>
          {videoData?.episode?.title || `Эпизод ${episodeId}`}
          {playbackRate !== 1 && <div style={{ fontSize: '12px', opacity: 0.8 }}>Скорость: {playbackRate}x</div>}
        </EpisodeInfo>

        <PlayerStatus>
          <QualityBadge>
            {currentQuality === 'auto' ? 'AUTO' : currentQuality.toUpperCase()}
          </QualityBadge>
          {currentBitrate > 0 && (
            <StatusBadge>
              {(currentBitrate / 1000000).toFixed(1)}M
            </StatusBadge>
          )}
          {networkSpeed > 0 && (
            <StatusBadge>
              {(networkSpeed / 1000000).toFixed(1)} Mbps
            </StatusBadge>
          )}
        </PlayerStatus>
      </TopControls>

      {/* Подсказки горячих клавиш */}
      <HotkeyTooltip
        visible={showHotkeys}
        onMouseEnter={() => setShowHotkeys(true)}
        onMouseLeave={() => setShowHotkeys(false)}
      >
        <h4>Горячие клавиши</h4>
        {hotkeys.slice(0, 8).map((hotkey, index) => (
          <div key={index} className="hotkey-item">
            <span className="key">{hotkey.key}</span>
            <span>{hotkey.description}</span>
          </div>
        ))}
      </HotkeyTooltip>

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
          <p>{error}</p>
          <div>
            <button onClick={loadVideoData}>
              Попробовать снова
            </button>
            <button onClick={() => setShowHotkeys(!showHotkeys)}>
              Горячие клавиши
            </button>
          </div>
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
          {/* Left Controls */}
          <LeftControls>
            <PlayButton onClick={togglePlay}>
              {isPlaying ? '⏸' : '▶'}
            </PlayButton>

            <TimeDisplay>
              {formatTime(currentTime)} / {formatTime(duration)}
            </TimeDisplay>
          </LeftControls>

          {/* Center Controls */}
          <CenterControls>
            <VolumeContainer>
              <ControlButton onClick={() => {
                if (videoRef.current) {
                  videoRef.current.muted = !videoRef.current.muted;
                }
              }}>
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
          </CenterControls>

          {/* Right Controls */}
          <RightControls>
            {/* Quality Selector */}
            <QualityController
              qualities={availableQualities}
              currentQuality={currentQuality}
              onQualityChange={handleQualityChange}
              currentBitrate={currentBitrate}
              networkSpeed={networkSpeed}
            />

            {/* Voice Selector */}
            {availableVoices.length > 0 && (
              <VoiceSelector
                voices={availableVoices}
                activeVoice={currentVoice}
                onVoiceChange={handleVoiceChange}
              />
            )}

            {/* Subtitles Toggle */}
            <ControlButton
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              title="Субтитры (C)"
            >
              {subtitlesEnabled ? '🔤' : '💬'}
            </ControlButton>

            {/* Settings */}
            <ControlButton
              onClick={() => setShowSubtitleSettings(!showSubtitleSettings)}
              title="Настройки субтитров (Ctrl+S)"
            >
              ⚙️
            </ControlButton>

            {/* Hotkeys Help */}
            <ControlButton
              onClick={() => setShowHotkeys(!showHotkeys)}
              title="Горячие клавиши"
            >
              ⌨️
            </ControlButton>

            {/* Fullscreen */}
            <ControlButton
              onClick={() => {
                if (!document.fullscreenElement) {
                  containerRef.current?.requestFullscreen?.();
                } else {
                  document.exitFullscreen?.();
                }
              }}
              title="Полный экран (F)"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </ControlButton>
          </RightControls>
        </ControlsBar>
      </ControlsOverlay>
    </PlayerContainer>
  );
};

export default EnhancedAniLibertyPlayer;
