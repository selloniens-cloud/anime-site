import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import anilibriaV2Service from '../services/anilibriaV2Service';
import { Container, Button, LoadingSpinner } from '../styles/GlobalStyles';
import { EnhancedEpisodePlayer } from '../components/video';
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
      width: ${props => props.progress || 0}%;
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
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  border-left: 4px solid ${props => props.theme.colors.error};
`;

const BackButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-bottom: 20px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

const WatchPage = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const [episode, setEpisode] = useState(null);
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [playerSettings, setPlayerSettings] = useState(null);
  const [playerPreferences, setPlayerPreferences] = useState(null);
  const [videoProgress, setVideoProgress] = useState(null);

  // Загрузка настроек плеера
  useEffect(() => {
    const settings = getVideoSettings();
    const preferences = getPlayerPreferences();
    
    setPlayerSettings(settings);
    setPlayerPreferences(preferences);
  }, []);

  // Загрузка прогресса просмотра при смене эпизода
  useEffect(() => {
    if (episodeId) {
      const savedProgress = loadVideoProgress('episode', episodeId);
      setVideoProgress(savedProgress);
      
      if (savedProgress) {
        setProgress((savedProgress.currentTime / (savedProgress.duration || 1440)) * 100);
      }
    }
  }, [episodeId]);

  useEffect(() => {
    if (episodeId) {
      loadEpisodeData();
    }
  }, [episodeId]);

  const loadEpisodeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎬 Загрузка эпизода ${episodeId}...`);
      
      // Получаем данные эпизода
      const episodeData = await anilibriaV2Service.getEpisodeById(episodeId);
      const convertedEpisode = anilibriaV2Service.convertEpisodeToFormat(episodeData);
      
      setEpisode(convertedEpisode);
      
      // Если есть ID аниме, загружаем информацию об аниме
      if (convertedEpisode.animeId) {
        try {
          const animeData = await anilibriaV2Service.getAnimeById(convertedEpisode.animeId);
          const convertedAnime = anilibriaV2Service.convertAnimeToFormat(animeData);
          setAnime(convertedAnime);
        } catch (animeError) {
          console.warn('Не удалось загрузить информацию об аниме:', animeError);
        }
      }
      
      console.log(`✅ Эпизод загружен:`, convertedEpisode.title);
      
    } catch (err) {
      console.error('Ошибка загрузки эпизода:', err);
      setError(`Не удалось загрузить эпизод: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProgress = useCallback((progressData) => {
    const { played, playedSeconds, episode: currentEpisode } = progressData;
    
    if (currentEpisode && playedSeconds > 0) {
      const duration = currentEpisode.duration || 1440; // 24 минуты по умолчанию
      const newProgress = played * 100;
      
      setProgress(newProgress);
      
      // Сохраняем прогресс каждые 10 секунд
      const now = Date.now();
      if (!videoProgress || now - (videoProgress.lastSaved || 0) > 10000) {
        saveVideoProgress('episode', episodeId, playedSeconds, duration, newProgress);
        setVideoProgress({
          currentTime: playedSeconds,
          duration,
          progress: newProgress,
          lastSaved: now
        });
      }
    }
  }, [episodeId, videoProgress]);

  const handleEpisodeChange = (newEpisodeId) => {
    if (newEpisodeId !== episodeId) {
      navigate(`/watch/${newEpisodeId}`);
    }
  };

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
          <BackButton onClick={() => window.history.back()}>
            ← Назад
          </BackButton>
          <ErrorMessage>
            {error}
            <br />
            <button 
              onClick={loadEpisodeData}
              style={{
                marginTop: '15px',
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid currentColor',
                borderRadius: '6px',
                color: 'inherit',
                cursor: 'pointer'
              }}
            >
              Попробовать снова
            </button>
          </ErrorMessage>
        </Container>
      </WatchContainer>
    );
  }

  if (!episode) {
    return (
      <WatchContainer>
        <Container>
          <BackButton onClick={() => window.history.back()}>
            ← Назад
          </BackButton>
          <ErrorMessage>Эпизод не найден</ErrorMessage>
        </Container>
      </WatchContainer>
    );
  }

  return (
    <WatchContainer>
      <Container>
        <BackButton onClick={() => {
          if (anime) {
            navigate(`/anime/${anime.id}`);
          } else {
            window.history.back();
          }
        }}>
          ← {anime ? `Назад к "${anime.title}"` : 'Назад'}
        </BackButton>

        <VideoContainer>
          <EnhancedEpisodePlayer
            episodeId={episodeId}
            animeId={episode.animeId}
            autoPlay={playerSettings.autoPlay}
            autoNext={playerSettings.autoNext}
            onEpisodeChange={handleEpisodeChange}
            onProgress={handleProgress}
          />
        </VideoContainer>

        <VideoInfo>
          <h1>{anime ? anime.title : 'Аниме'}</h1>
          <div className="episode-info">
            Эпизод {episode.number || '?'}: {episode.title}
          </div>
          <div className="video-meta">
            {anime?.year && (
              <div className="meta-item">
                <span className="icon">📺</span>
                <span>{anime.year}</span>
              </div>
            )}
            {anime?.rating && (
              <div className="meta-item">
                <span className="icon">⭐</span>
                <span>{anime.rating}</span>
              </div>
            )}
            {anime?.status && (
              <div className="meta-item">
                <span className="icon">🎬</span>
                <span>{anime.status}</span>
              </div>
            )}
            {episode.duration && (
              <div className="meta-item">
                <span className="icon">⏱️</span>
                <span>{Math.round(episode.duration / 60)} мин</span>
              </div>
            )}
          </div>
        </VideoInfo>

        <ProgressInfo progress={progress}>
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-text">
            <span>Прогресс просмотра: {Math.round(progress)}%</span>
            <span>
              {videoProgress ? 
                `${Math.round(videoProgress.currentTime / 60)} / ${Math.round((videoProgress.duration || 1440) / 60)} мин` : 
                ''}
            </span>
          </div>
        </ProgressInfo>

        <EpisodeNavigation>
          {anime && (
            <button
              className="nav-button"
              onClick={() => navigate(`/anime/${anime.id}`)}
            >
              📋 Все эпизоды
            </button>
          )}
        </EpisodeNavigation>
      </Container>
    </WatchContainer>
  );
};

export default WatchPage;
