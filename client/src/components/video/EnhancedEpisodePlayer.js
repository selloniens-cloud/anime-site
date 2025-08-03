import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import AniLibertyPlayer from './AniLibertyPlayer';
import SubtitleManager from './SubtitleManager';
import { LoadingSpinner } from '../../styles/GlobalStyles';
import anilibriaV2Service from '../../services/anilibriaV2Service';
import {
  saveVideoProgress,
  loadVideoProgress,
  getVideoSettings,
  saveVideoSettings
} from '../../utils/videoProgress';

const PlayerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;

  @media (max-width: 768px) {
    min-height: 250px;
    border-radius: 0;
  }
`;

const OverlayControls = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  align-items: center;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ControlButton = styled.button`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
  
  &.active {
    background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }
`;

const EpisodeSelector = styled.select`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  min-width: 150px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }
  
  option {
    background: #333;
    color: white;
    padding: 5px;
  }

  @media (max-width: 768px) {
    min-width: 120px;
    padding: 6px 10px;
    font-size: 11px;
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
  z-index: 100;

  span {
    font-size: 16px;
    opacity: 0.9;
  }
`;

const ErrorMessage = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  text-align: center;
  padding: 30px;
  background: rgba(220, 53, 69, 0.9);
  border-radius: 10px;
  max-width: 400px;
  z-index: 100;

  h3 {
    margin-bottom: 15px;
    color: white;
    font-size: 18px;
  }

  p {
    margin-bottom: 20px;
    font-size: 14px;
    opacity: 0.9;
    line-height: 1.5;
  }

  .error-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }

  button {
    background: white;
    color: #dc3545;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    font-size: 13px;
    transition: all 0.2s ease;

    &:hover {
      background: #f8f9fa;
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

const ProgressIndicator = styled.div`
  position: absolute;
  bottom: -4px;
  left: 0;
  height: 4px;
  background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  width: ${props => props.progress || 0}%;
  transition: width 0.3s ease;
  z-index: 50;
`;

const NotificationToast = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  z-index: 300;
  opacity: ${props => props.visible ? 1 : 0};
  transition: all 0.3s ease;
  pointer-events: none;
  
  &.success {
    background: rgba(40, 167, 69, 0.9);
  }
  
  &.error {
    background: rgba(220, 53, 69, 0.9);
  }
`;

const EnhancedEpisodePlayer = ({
  episodeId,
  animeId,
  autoPlay = false,
  autoNext = false,
  onEpisodeChange,
  onProgress: onProgressCallback,
  onPlay,
  onPause,
  onEnded,
  onError: onErrorCallback,
  className,
  style
}) => {
  const [episode, setEpisode] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  
  // Состояние субтитров
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleTracks, setSubtitleTracks] = useState([]);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  
  // Состояние уведомлений
  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  
  // Прогресс просмотра
  const [savedProgress, setSavedProgress] = useState(null);
  
  const playerRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Загрузка данных эпизода
  useEffect(() => {
    if (episodeId) {
      loadEpisodeData();
    }
  }, [episodeId]);

  // Загрузка всех эпизодов аниме
  useEffect(() => {
    if (animeId) {
      loadAllEpisodes();
    }
  }, [animeId]);

  // Загрузка сохраненного прогресса
  useEffect(() => {
    if (animeId && episodeId) {
      const saved = loadVideoProgress(animeId, episodeId);
      setSavedProgress(saved);
      
      if (saved) {
        setProgress((saved.currentTime / (saved.duration || 1)) * 100);
      }
    }
  }, [animeId, episodeId]);

  // Скрытие контролов
  const hideControlsAfterDelay = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    hideControlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 4000);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  // Показ уведомлений
  const showNotification = useCallback((message, type = 'info', duration = 3000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ visible: true, message, type });

    notificationTimeoutRef.current = setTimeout(() => {
      setNotification({ visible: false, message: '', type: 'info' });
    }, duration);
  }, []);

  const loadEpisodeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎬 Загрузка эпизода ${episodeId}...`);
      
      const episodeData = await anilibriaV2Service.getEpisodeById(episodeId);
      const convertedEpisode = anilibriaV2Service.convertEpisodeToFormat(episodeData);
      
      setEpisode(convertedEpisode);
      
      // Загружаем субтитры если они есть
      await loadSubtitles(episodeData);
      
      console.log(`✅ Эпизод загружен:`, convertedEpisode.title);
      
    } catch (err) {
      console.error('Ошибка загрузки эпизода:', err);
      setError(`Не удалось загрузить эпизод: ${err.message}`);
      showNotification('Ошибка загрузки эпизода', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllEpisodes = async () => {
    try {
      console.log(`📝 Загрузка списка эпизодов для аниме ${animeId}...`);
      
      const episodesData = await anilibriaV2Service.getAnimeEpisodes(animeId);
      
      if (Array.isArray(episodesData)) {
        const convertedEpisodes = episodesData
          .map(ep => anilibriaV2Service.convertEpisodeToFormat(ep))
          .sort((a, b) => (a.number || 0) - (b.number || 0));
        
        setAllEpisodes(convertedEpisodes);
        console.log(`✅ Загружено ${convertedEpisodes.length} эпизодов`);
      }
      
    } catch (err) {
      console.warn('Не удалось загрузить список эпизодов:', err);
    }
  };

  const loadSubtitles = async (episodeData) => {
    try {
      // Проверяем наличие субтитров в данных эпизода
      const tracks = [];
      
      // Русские субтитры
      if (episodeData.subtitles?.ru) {
        tracks.push({
          src: episodeData.subtitles.ru,
          label: 'Русские субтитры',
          language: 'ru',
          default: true
        });
      }
      
      // Английские субтитры
      if (episodeData.subtitles?.en) {
        tracks.push({
          src: episodeData.subtitles.en,
          label: 'English subtitles',
          language: 'en'
        });
      }
      
      // Можно добавить другие языки
      if (episodeData.subtitles?.ja) {
        tracks.push({
          src: episodeData.subtitles.ja,
          label: '日本語字幕',
          language: 'ja'
        });
      }

      setSubtitleTracks(tracks);
      
      // Автоматически включаем субтитры если есть настройка
      const settings = getVideoSettings();
      if (settings.subtitles !== 'off' && tracks.length > 0) {
        setSubtitlesEnabled(true);
      }
      
    } catch (err) {
      console.warn('Ошибка загрузки субтитров:', err);
    }
  };

  const handleEpisodeChange = useCallback((newEpisodeId) => {
    if (newEpisodeId !== episodeId) {
      showNotification('Переключение эпизода...', 'info');
      onEpisodeChange?.(newEpisodeId);
    }
  }, [episodeId, onEpisodeChange, showNotification]);

  const handleProgress = useCallback((progressData) => {
    const { currentTime, duration, progress: progressPercent } = progressData;
    
    setProgress(progressPercent);
    
    // Сохраняем прогресс
    if (animeId && episodeId && currentTime > 0 && duration > 0) {
      saveVideoProgress(animeId, episodeId, currentTime, duration, progressPercent);
    }
    
    onProgressCallback?.({
      ...progressData,
      animeId,
      episodeId,
      episode
    });
  }, [animeId, episodeId, episode, onProgressCallback]);

  const handleEnded = useCallback(() => {
    if (autoNext && allEpisodes.length > 0) {
      const currentIndex = allEpisodes.findIndex(ep => ep.id === episodeId);
      if (currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
        const nextEpisode = allEpisodes[currentIndex + 1];
        showNotification(`Переход к эпизоду ${nextEpisode.number}`, 'success');
        setTimeout(() => {
          handleEpisodeChange(nextEpisode.id);
        }, 2000);
        return;
      }
    }
    
    showNotification('Эпизод завершен', 'success');
    onEnded?.();
  }, [autoNext, allEpisodes, episodeId, handleEpisodeChange, onEnded, showNotification]);

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
    showNotification('Ошибка воспроизведения', 'error');
    onErrorCallback?.(errorMessage);
  }, [onErrorCallback, showNotification]);

  const toggleSubtitles = useCallback(() => {
    const newState = !subtitlesEnabled;
    setSubtitlesEnabled(newState);
    
    // Сохраняем настройку
    saveVideoSettings({ subtitles: newState ? 'on' : 'off' });
    
    showNotification(
      `Субтитры ${newState ? 'включены' : 'отключены'}`,
      'success',
      2000
    );
  }, [subtitlesEnabled, showNotification]);

  const toggleSubtitleSettings = useCallback(() => {
    setShowSubtitleSettings(!showSubtitleSettings);
  }, [showSubtitleSettings]);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          toggleSubtitles();
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleSubtitleSettings();
          }
          break;
        case 'n':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Переход к следующему эпизоду
            const currentIndex = allEpisodes.findIndex(ep => ep.id === episodeId);
            if (currentIndex >= 0 && currentIndex < allEpisodes.length - 1) {
              handleEpisodeChange(allEpisodes[currentIndex + 1].id);
            }
          }
          break;
        case 'p':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            // Переход к предыдущему эпизоду
            const currentIndex = allEpisodes.findIndex(ep => ep.id === episodeId);
            if (currentIndex > 0) {
              handleEpisodeChange(allEpisodes[currentIndex - 1].id);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [subtitlesEnabled, allEpisodes, episodeId, toggleSubtitles, toggleSubtitleSettings, handleEpisodeChange]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <PlayerContainer className={className} style={style}>
        <LoadingContainer>
          <LoadingSpinner size="48px" />
          <span>Загрузка эпизода...</span>
        </LoadingContainer>
      </PlayerContainer>
    );
  }

  if (error) {
    return (
      <PlayerContainer className={className} style={style}>
        <ErrorMessage>
          <h3>Ошибка загрузки</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={loadEpisodeData}>
              Повторить попытку
            </button>
            <button onClick={() => window.location.reload()}>
              Перезагрузить страницу
            </button>
          </div>
        </ErrorMessage>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer
      className={className}
      style={style}
      onMouseMove={showControls}
      onMouseEnter={showControls}
    >
      {/* Основной плеер */}
      <AniLibertyPlayer
        ref={playerRef}
        animeId={animeId}
        episodeId={episodeId}
        autoPlay={autoPlay}
        onProgress={handleProgress}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Субтитры */}
      <SubtitleManager
        currentTime={progress}
        subtitleTracks={subtitleTracks}
        enabled={subtitlesEnabled}
        showSettings={showSubtitleSettings}
      />

      {/* Индикатор прогресса */}
      <ProgressIndicator progress={progress} />

      {/* Контролы эпизодов и настроек */}
      <OverlayControls visible={controlsVisible}>
        {/* Селектор эпизодов */}
        {allEpisodes.length > 0 && (
          <EpisodeSelector
            value={episodeId || ''}
            onChange={(e) => handleEpisodeChange(e.target.value)}
          >
            {allEpisodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                Эп. {ep.number}: {ep.title}
              </option>
            ))}
          </EpisodeSelector>
        )}
        
        {/* Управление субтитрами */}
        {subtitleTracks.length > 0 && (
          <>
            <ControlButton
              className={subtitlesEnabled ? 'active' : ''}
              onClick={toggleSubtitles}
              title="Переключить субтитры (C)"
            >
              SUB
            </ControlButton>
            
            <ControlButton
              className={showSubtitleSettings ? 'active' : ''}
              onClick={toggleSubtitleSettings}
              title="Настройки субтитров (Ctrl+S)"
            >
              ⚙
            </ControlButton>
          </>
        )}
      </OverlayControls>

      {/* Уведомления */}
      <NotificationToast
        visible={notification.visible}
        className={notification.type}
      >
        {notification.message}
      </NotificationToast>
    </PlayerContainer>
  );
};

export default EnhancedEpisodePlayer;