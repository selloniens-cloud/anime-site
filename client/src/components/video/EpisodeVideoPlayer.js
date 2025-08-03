import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import styled from 'styled-components';
import { LoadingSpinner } from '../../styles/GlobalStyles';
import anilibriaV2Service from '../../services/anilibriaV2Service';

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
  }
`;

const PlayerWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const EpisodeSelector = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const EpisodeDropdown = styled.select`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }
  
  option {
    background: #333;
    color: white;
  }
`;

const QualitySelector = styled.select`
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  
  &:focus {
    border-color: ${props => props.theme?.colors?.primary || '#FF6B6B'};
  }
  
  option {
    background: #333;
    color: white;
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
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  max-width: 400px;
  z-index: 100;

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

    &:hover {
      opacity: 0.9;
    }
  }
`;

const ProgressInfo = styled.div`
  position: absolute;
  bottom: 60px;
  left: 20px;
  right: 20px;
  color: white;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 100;

  ${PlayerContainer}:hover & {
    opacity: 1;
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 8px;
    
    .progress-fill {
      height: 100%;
      background: ${props => props.theme?.colors?.primary || '#FF6B6B'};
      transition: width 0.3s ease;
      width: ${props => props.progress || 0}%;
    }
  }

  .time-info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    opacity: 0.8;
  }
`;

const EpisodeVideoPlayer = ({
  episodeId,
  animeId,
  autoPlay = false,
  onEpisodeChange,
  onProgress: onProgressCallback,
}) => {
  const [episode, setEpisode] = useState(null);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [qualities, setQualities] = useState([]);
  const [selectedQuality, setSelectedQuality] = useState('720');
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef(null);

  useEffect(() => {
    if (episodeId) {
      loadEpisode();
    }
  }, [episodeId]);

  useEffect(() => {
    if (animeId) {
      loadAllEpisodes();
    }
  }, [animeId]);

  const loadEpisode = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🎬 Загрузка эпизода ${episodeId}...`);

      const episodeData = await anilibriaV2Service.getEpisodeById(episodeId);
      const convertedEpisode = anilibriaV2Service.convertEpisodeToFormat(episodeData);

      setEpisode(convertedEpisode);

      // Получаем доступные качества
      const availableQualities = anilibriaV2Service.getAvailableQualities(episodeData);
      setQualities(availableQualities);

      // Устанавливаем видео URL
      const videoUrl = anilibriaV2Service.getVideoUrl(episodeData, selectedQuality);
      setVideoUrl(videoUrl);

      console.log('✅ Эпизод загружен:', {
        title: convertedEpisode.title,
        videoUrl,
        qualities: availableQualities.length,
      });

    } catch (err) {
      console.error('Ошибка загрузки эпизода:', err);
      setError(`Не удалось загрузить эпизод: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAllEpisodes = async () => {
    try {
      console.log(`📝 Загрузка списка эпизодов для аниме ${animeId}...`);

      const episodesData = await anilibriaV2Service.getAnimeEpisodes(animeId);

      if (Array.isArray(episodesData)) {
        const convertedEpisodes = episodesData.map(ep =>
          anilibriaV2Service.convertEpisodeToFormat(ep),
        );
        setAllEpisodes(convertedEpisodes);
        console.log(`✅ Загружено ${convertedEpisodes.length} эпизодов`);
      }

    } catch (err) {
      console.warn('Не удалось загрузить список эпизодов:', err);
    }
  };

  const handleQualityChange = (quality) => {
    if (episode) {
      setSelectedQuality(quality);

      // Находим URL для выбранного качества
      const qualityItem = qualities.find(q => q.label === quality);
      if (qualityItem) {
        setVideoUrl(qualityItem.src);
        console.log(`🎥 Изменено качество на ${quality}: ${qualityItem.src}`);
      }
    }
  };

  const handleEpisodeChange = (newEpisodeId) => {
    if (newEpisodeId !== episodeId) {
      onEpisodeChange?.(newEpisodeId);
    }
  };

  const handleProgress = (progressData) => {
    const { played, playedSeconds, loaded, loadedSeconds } = progressData;
    setProgress(played * 100);
    setCurrentTime(playedSeconds);

    onProgressCallback?.({
      played,
      playedSeconds,
      loaded,
      loadedSeconds,
      episodeId,
      episode,
    });
  };

  const handleDuration = (duration) => {
    setDuration(duration);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <PlayerContainer>
        <LoadingContainer>
          <LoadingSpinner size="48px" />
          <span>Загрузка эпизода...</span>
        </LoadingContainer>
      </PlayerContainer>
    );
  }

  if (error) {
    return (
      <PlayerContainer>
        <ErrorMessage>
          <h3>Ошибка загрузки</h3>
          <p>{error}</p>
          <button onClick={loadEpisode}>
            Попробовать еще раз
          </button>
        </ErrorMessage>
      </PlayerContainer>
    );
  }

  if (!videoUrl) {
    return (
      <PlayerContainer>
        <ErrorMessage>
          <h3>Видео недоступно</h3>
          <p>Для данного эпизода видео не найдено</p>
          <button onClick={loadEpisode}>
            Обновить
          </button>
        </ErrorMessage>
      </PlayerContainer>
    );
  }

  return (
    <PlayerContainer>
      {/* Селекторы эпизодов и качества */}
      <EpisodeSelector>
        {allEpisodes.length > 0 && (
          <EpisodeDropdown
            value={episodeId || ''}
            onChange={(e) => handleEpisodeChange(e.target.value)}
          >
            {allEpisodes.map((ep) => (
              <option key={ep.id} value={ep.id}>
                Эпизод {ep.number}: {ep.title}
              </option>
            ))}
          </EpisodeDropdown>
        )}

        {qualities.length > 1 && (
          <QualitySelector
            value={selectedQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
          >
            {qualities.map((quality) => (
              <option key={quality.label} value={quality.label}>
                {quality.label}
              </option>
            ))}
          </QualitySelector>
        )}
      </EpisodeSelector>

      {/* Плеер */}
      <PlayerWrapper>
        <ReactPlayer
          ref={playerRef}
          url={videoUrl}
          width="100%"
          height="100%"
          playing={autoPlay}
          controls={true}
          onProgress={handleProgress}
          onDuration={handleDuration}
          config={{
            file: {
              attributes: {
                crossOrigin: 'anonymous',
              },
              hlsOptions: {
                enableWorker: true,
                lowLatencyMode: false,
                backBufferLength: 90,
                maxBufferLength: 30,
              },
            },
          }}
        />
      </PlayerWrapper>

      {/* Информация о прогрессе */}
      <ProgressInfo progress={progress}>
        <div className="progress-bar">
          <div className="progress-fill" />
        </div>
        <div className="time-info">
          <span>{formatTime(currentTime)}</span>
          <span>{episode?.title}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </ProgressInfo>
    </PlayerContainer>
  );
};

export default EpisodeVideoPlayer;
