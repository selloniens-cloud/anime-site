import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { animeService } from '../services/animeService';
import { anicliService } from '../services/anicliService';
import { Container, Button, LoadingSpinner } from '../styles/GlobalStyles';
import { VideoPlayer } from '../components/video';
import {
  saveVideoProgress,
  loadVideoProgress,
  getVideoSettings,
  saveVideoSettings,
  getPlayerPreferences,
  savePlayerPreferences,
} from '../utils/videoProgress';

const WatchContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
  background: ${props => props.theme.colors.background};
`;

const VideoContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 40px;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const VideoInfo = styled.div`
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 0 20px;
  
  h1 {
    color: ${props => props.theme.colors.text};
    font-size: 1.8rem;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .episode-info {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.1rem;
    margin-bottom: 15px;
  }
  
  .video-meta {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    
    .meta-item {
      display: flex;
      align-items: center;
      gap: 5px;
      color: ${props => props.theme.colors.textSecondary};
      font-size: 0.9rem;
      
      .icon {
        font-size: 1rem;
      }
    }
  }
`;

const EpisodeNavigation = styled.div`
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 0 20px;
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
  
  .nav-button {
    background: ${props => props.theme.colors.primary};
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s ease;
    
    &:hover {
      background: ${props => props.theme.colors.primaryDark || props.theme.colors.primary};
      transform: translateY(-1px);
    }
    
    &:disabled {
      background: ${props => props.theme.colors.border};
      cursor: not-allowed;
      transform: none;
    }
  }
  
  .episode-selector {
    background: ${props => props.theme.colors.surface};
    border: 1px solid ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
    }
  }
`;

const ProgressInfo = styled.div`
  max-width: 1200px;
  margin: 0 auto 20px;
  padding: 0 20px;
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background: ${props => props.theme.colors.border};
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 10px;
    
    .progress-fill {
      height: 100%;
      background: ${props => props.theme.colors.primary};
      transition: width 0.3s ease;
      width: ${props => props.progress}%;
    }
  }
  
  .progress-text {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.9rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.error};
  padding: 40px;
  font-size: 1.1rem;
`;

const WatchPage = () => {
  const { animeId, episodeId } = useParams();
  const navigate = useNavigate();
  const [anime, setAnime] = useState(null);
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [playerSettings, setPlayerSettings] = useState(null);
  const [playerPreferences, setPlayerPreferences] = useState(null);
  const [videoProgress, setVideoProgress] = useState(null);
  const [lastSaveTime, setLastSaveTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);

  // Загрузка настроек и предпочтений плеера
  useEffect(() => {
    const settings = getVideoSettings();
    const preferences = getPlayerPreferences();

    setPlayerSettings(settings);
    setPlayerPreferences(preferences);
  }, []);

  // Загрузка прогресса просмотра при смене эпизода
  useEffect(() => {
    if (animeId && episodeId) {
      const savedProgress = loadVideoProgress(animeId, episodeId);
      setVideoProgress(savedProgress);

      if (savedProgress) {
        setProgress((savedProgress.currentTime / (savedProgress.duration || 1440)) * 100);
      }
    }
  }, [animeId, episodeId]);

  useEffect(() => {
    loadData();
  }, [animeId, episodeId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const animeResponse = await animeService.getAnimeById(animeId);
      setAnime(animeResponse.data);

      if (episodeId) {
        const episodeResponse = await animeService.getEpisodeById(animeId, episodeId);
        setEpisode(episodeResponse.data);

        // --- Получаем ссылку на видео через Anicli API ---
        try {
          const videoData = await anicliService.getAnimeVideo(animeId, episodeId);
          if (videoData.url) setVideoUrl(videoData.url);
        } catch (e) {
          setVideoUrl(null);
        }
      }
    } catch (err) {
      setError('Ошибка загрузки видео');
    } finally {
      setLoading(false);
    }
  };

  // Обработчики событий плеера
  const handleTimeUpdate = useCallback((currentTime) => {
    if (anime && episode && currentTime > 0) {
      const duration = episode.duration || 1440; // 24 минуты по умолчанию
      const newProgress = (currentTime / duration) * 100;
      setProgress(newProgress);

      // Сохраняем прогресс каждые 10 секунд
      const now = Date.now();
      if (now - lastSaveTime > 10000) { // 10 секунд
        saveVideoProgress(animeId, episodeId, currentTime, duration, newProgress);
        setLastSaveTime(now);
      }
    }
  }, [animeId, episodeId, anime, episode, lastSaveTime]);

  const handlePlayerError = (error) => {
    setError(`Ошибка воспроизведения: ${error}`);
  };

  const handleQualityChange = useCallback((quality) => {
    if (playerSettings) {
      const updatedSettings = { ...playerSettings, quality };
      setPlayerSettings(updatedSettings);
      saveVideoSettings({ quality });
    }
  }, [playerSettings]);

  const handlePlayerChange = useCallback((playerType) => {
    if (playerPreferences) {
      const updatedPreferences = { ...playerPreferences, preferredPlayer: playerType };
      setPlayerPreferences(updatedPreferences);
      savePlayerPreferences({ preferredPlayer: playerType });
    }
  }, [playerPreferences]);

  const handleVolumeChange = useCallback((volume) => {
    if (playerSettings) {
      const updatedSettings = { ...playerSettings, volume };
      setPlayerSettings(updatedSettings);
      saveVideoSettings({ volume });
    }
  }, [playerSettings]);

  const handlePlaybackRateChange = useCallback((playbackRate) => {
    if (playerSettings) {
      const updatedSettings = { ...playerSettings, playbackRate };
      setPlayerSettings(updatedSettings);
      saveVideoSettings({ playbackRate });
    }
  }, [playerSettings]);

  const handleProgress = (bufferedPercent) => {
    // Обработка прогресса буферизации
  };

  const handlePlay = useCallback(() => {
    // Логирование начала воспроизведения
  }, []);

  const handlePause = useCallback(() => {
    // Сохраняем прогресс при паузе
    if (anime && episode) {
      const videoElement = document.querySelector('video');
      if (videoElement && videoElement.currentTime > 0) {
        const currentTime = videoElement.currentTime;
        const duration = episode.duration || videoElement.duration || 1440;
        const watchedPercent = (currentTime / duration) * 100;

        saveVideoProgress(animeId, episodeId, currentTime, duration, watchedPercent);
      }
    }
  }, [animeId, episodeId, anime, episode]);

  const handleEnded = useCallback(() => {
    setProgress(100);

    // Отмечаем эпизод как завершенный
    if (anime && episode) {
      const duration = episode.duration || 1440;
      saveVideoProgress(animeId, episodeId, duration, duration, 100);

      // Автоматический переход к следующему эпизоду
      if (playerSettings?.autoNext && anime.episodes) {
        const currentEpisodeNum = parseInt(episodeId);
        if (currentEpisodeNum < anime.episodes) {
          const nextEpisodeId = currentEpisodeNum + 1;
          setTimeout(() => {
            navigate(`/watch/${animeId}/${nextEpisodeId}`);
          }, 3000); // Задержка 3 секунды
        }
      }
    }
  }, [animeId, episodeId, anime, episode, playerSettings, navigate]);

  if (loading || !playerSettings || !playerPreferences) {
    return (
      <WatchContainer>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="48px" />
          </LoadingContainer>
        </Container>
      </WatchContainer>
    );
  }

  if (error) {
    return (
      <WatchContainer>
        <Container>
          <ErrorMessage>{error}</ErrorMessage>
        </Container>
      </WatchContainer>
    );
  }

  return (
    <WatchContainer>
      <Container>
        <VideoContainer>
          <VideoPlayer
            src={videoUrl || episode?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
            poster={anime?.poster}
            title={`${anime?.title}${episode ? ` - ${episode.title}` : ''}`}
            // Восстановление позиции воспроизведения
            startTime={videoProgress?.currentTime || 0}
            // Настройки из localStorage
            autoPlay={playerSettings.autoPlay}
            muted={playerSettings.muted}
            volume={playerSettings.volume}
            playbackRate={playerSettings.playbackRate}
            // Предпочтения плеера
            preferredPlayer={playerPreferences.preferredPlayer}
            fallbackPlayers={playerPreferences.fallbackPlayers}
            enablePlayerSelector={playerPreferences.enablePlayerSelector}
            // Обработчики событий
            onTimeUpdate={handleTimeUpdate}
            onProgress={handleProgress}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handlePlayerError}
            onPlayerChange={handlePlayerChange}
            onQualityChange={handleQualityChange}
            onVolumeChange={handleVolumeChange}
            onPlaybackRateChange={handlePlaybackRateChange}
            // Качества и субтитры
            qualities={[
              { height: 1080, src: episode?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
              { height: 720, src: episode?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
              { height: 480, src: episode?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
            ]}
            subtitles={[
              { lang: 'ru', label: 'Русские субтитры', src: '/subtitles/ru.vtt', default: true },
              { lang: 'en', label: 'English subtitles', src: '/subtitles/en.vtt' },
            ]}
          />
        </VideoContainer>

        <VideoInfo>
          <h1>{anime?.title}</h1>
          {episode && (
            <div className="episode-info">
              Эпизод {episode.number || episodeId}: {episode.title}
            </div>
          )}
          <div className="video-meta">
            <div className="meta-item">
              <span className="icon">📺</span>
              <span>{anime?.year}</span>
            </div>
            <div className="meta-item">
              <span className="icon">⭐</span>
              <span>{anime?.rating || 'N/A'}</span>
            </div>
            <div className="meta-item">
              <span className="icon">🎬</span>
              <span>{anime?.status}</span>
            </div>
          </div>
        </VideoInfo>

        <ProgressInfo progress={progress}>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-text">
            <span>Прогресс просмотра: {Math.round(progress)}%</span>
            <span>{episode?.duration ? `${Math.round((progress / 100) * episode.duration)}/${episode.duration} мин` : ''}</span>
          </div>
        </ProgressInfo>

        <EpisodeNavigation>
          <button
            className="nav-button"
            onClick={() => window.history.back()}
          >
            ← Назад к аниме
          </button>
          <select
            className="episode-selector"
            value={episodeId}
            onChange={(e) => {
              if (e.target.value !== episodeId) {
                window.location.href = `/watch/${animeId}/${e.target.value}`;
              }
            }}
          >
            {anime?.episodes && Array.from({ length: anime.episodes }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Эпизод {i + 1}
              </option>
            ))}
          </select>
        </EpisodeNavigation>
      </Container>
    </WatchContainer>
  );
};

export default WatchPage;
