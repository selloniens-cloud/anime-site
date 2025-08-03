import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import anilibriaV2Service from '../../services/anilibriaV2Service';
import { LoadingSpinner } from '../../styles/GlobalStyles';

const SectionContainer = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 30px;
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const EpisodeGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const EpisodeCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px ${props => props.theme.colors.shadow};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px ${props => props.theme.colors.shadowMedium};
  }
`;

const EpisodeImage = styled.div`
  position: relative;
  width: 100%;
  height: 180px;
  background: ${props => props.theme.colors.gradientPrimary};
  overflow: hidden;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  &:hover img {
    transform: scale(1.05);
  }
`;

const PlayButton = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
  
  ${EpisodeCard}:hover & {
    opacity: 1;
  }
  
  &::before {
    content: '▶️';
  }
`;

const EpisodeBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const EpisodeContent = styled.div`
  padding: 16px;
`;

const AnimeTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EpisodeTitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const EpisodeMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.8rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const WatchButton = styled(Link)`
  display: block;
  width: 100%;
  padding: 10px;
  background: ${props => props.theme.colors.primary};
  color: white;
  text-align: center;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryDark || props.theme.colors.primary};
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
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

const EmptyState = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  padding: 60px 20px;
  
  .icon {
    font-size: 3rem;
    margin-bottom: 20px;
    display: block;
  }
  
  h3 {
    font-size: 1.3rem;
    margin-bottom: 10px;
    color: ${props => props.theme.colors.text};
  }
`;

const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Только что';
  if (diffInHours < 24) return `${diffInHours} ч. назад`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} дн. назад`;
  
  return date.toLocaleDateString('ru-RU');
};

const NewEpisodesSection = ({ 
  limit = 10, 
  showTitle = true, 
  title = "🆕 Новые эпизоды"
}) => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewEpisodes();
  }, [limit]);

  const loadNewEpisodes = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Загрузка новых эпизодов...');
      
      const response = await anilibriaV2Service.getNewEpisodes({
        perPage: limit,
        page: 1
      });

      let episodesList = [];
      
      if (response?.data && Array.isArray(response.data)) {
        episodesList = response.data;
      } else if (response && Array.isArray(response)) {
        episodesList = response;
      }

      setEpisodes(episodesList);
      console.log(`✅ Загружено ${episodesList.length} новых эпизодов`);

    } catch (err) {
      console.error('Ошибка загрузки новых эпизодов:', err);
      setError('Не удалось загрузить новые эпизоды. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadNewEpisodes();
  };

  if (loading) {
    return (
      <SectionContainer>
        {showTitle && <SectionTitle>{title}</SectionTitle>}
        <LoadingContainer>
          <LoadingSpinner size="48px" />
        </LoadingContainer>
      </SectionContainer>
    );
  }

  if (error) {
    return (
      <SectionContainer>
        {showTitle && <SectionTitle>{title}</SectionTitle>}
        <ErrorMessage>
          {error}
          <br />
          <button 
            onClick={handleRetry}
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
      </SectionContainer>
    );
  }

  if (episodes.length === 0) {
    return (
      <SectionContainer>
        {showTitle && <SectionTitle>{title}</SectionTitle>}
        <EmptyState>
          <span className="icon">📺</span>
          <h3>Новые эпизоды недоступны</h3>
          <p>Попробуйте обновить страницу или вернитесь позже</p>
        </EmptyState>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      {showTitle && <SectionTitle>{title}</SectionTitle>}
      <EpisodeGrid
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {episodes.map((episode, index) => {
          const animeTitle = episode.name?.main || episode.title || 'Без названия';
          const episodeTitle = episode.name || `Эпизод ${episode.ordinal || episode.number || index + 1}`;
          const posterUrl = anilibriaV2Service.getOptimizedImageUrl(episode.poster);
          
          return (
            <motion.div
              key={episode.id || index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <EpisodeCard>
                <EpisodeImage>
                  {posterUrl ? (
                    <img 
                      src={posterUrl} 
                      alt={animeTitle}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem'
                    }}>
                      🎭
                    </div>
                  )}
                  
                  <EpisodeBadge>
                    Эп. {episode.ordinal || episode.number || index + 1}
                  </EpisodeBadge>
                  
                  <PlayButton />
                </EpisodeImage>

                <EpisodeContent>
                  <AnimeTitle>{animeTitle}</AnimeTitle>
                  <EpisodeTitle>{episodeTitle}</EpisodeTitle>
                  
                  <EpisodeMeta>
                    <span>{formatDate(episode.updated_at || episode.created_at)}</span>
                    <span>
                      {episode.duration ? `${Math.round(episode.duration / 60)} мин` : '~24 мин'}
                    </span>
                  </EpisodeMeta>
                  
                  <WatchButton to={`/anime/${episode.id}`}>
                    Смотреть аниме
                  </WatchButton>
                </EpisodeContent>
              </EpisodeCard>
            </motion.div>
          );
        })}
      </EpisodeGrid>
    </SectionContainer>
  );
};

export default NewEpisodesSection;