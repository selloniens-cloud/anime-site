import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import anilibriaV2Service from '../../services/anilibriaV2Service';
import { LoadingSpinner } from '../../styles/GlobalStyles';
import AnimeCard from '../anime/AnimeCard';

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

const AnimeGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
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

const NewBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: ${props => props.theme.colors.success || '#28a745'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
  
  &::before {
    content: '✨ НОВОЕ';
  }
`;

const AnimeCardWrapper = styled.div`
  position: relative;
`;

const NewAnimeSection = ({
  limit = 10,
  showTitle = true,
  title = '✨ Недавно добавленные аниме',
  onAnimeClick,
}) => {
  const [newAnime, setNewAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadNewAnime();
  }, [limit]);

  const loadNewAnime = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Загрузка новых аниме...');

      const response = await anilibriaV2Service.getNewAnime({
        perPage: limit,
        page: 1,
      });

      let animeList = [];

      if (response?.data && Array.isArray(response.data)) {
        animeList = response.data.map(anime =>
          anilibriaV2Service.convertAnimeToFormat(anime),
        );
      } else if (response && Array.isArray(response)) {
        animeList = response.map(anime =>
          anilibriaV2Service.convertAnimeToFormat(anime),
        );
      }

      setNewAnime(animeList);
      console.log(`✅ Загружено ${animeList.length} новых аниме`);

    } catch (err) {
      console.error('Ошибка загрузки новых аниме:', err);
      setError('Не удалось загрузить новые аниме. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    loadNewAnime();
  };

  // Проверяем, является ли аниме новым (добавлено за последние 30 дней)
  const isNewAnime = (anime) => {
    if (!anime.fresh_at && !anime.updated_at) return true; // Если нет даты, считаем новым

    const animeDate = new Date(anime.fresh_at || anime.updated_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return animeDate > thirtyDaysAgo;
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
              cursor: 'pointer',
            }}
          >
            Попробовать снова
          </button>
        </ErrorMessage>
      </SectionContainer>
    );
  }

  if (newAnime.length === 0) {
    return (
      <SectionContainer>
        {showTitle && <SectionTitle>{title}</SectionTitle>}
        <EmptyState>
          <span className="icon">🆕</span>
          <h3>Новые аниме недоступны</h3>
          <p>Попробуйте обновить страницу или вернитесь позже</p>
        </EmptyState>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer>
      {showTitle && <SectionTitle>{title}</SectionTitle>}
      <AnimeGrid
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, staggerChildren: 0.1 }}
      >
        {newAnime.map((anime, index) => (
          <motion.div
            key={anime.id || index}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <AnimeCardWrapper>
              {isNewAnime(anime) && <NewBadge />}
              <AnimeCard
                anime={anime}
                onClick={() => onAnimeClick?.(anime)}
              />
            </AnimeCardWrapper>
          </motion.div>
        ))}
      </AnimeGrid>
    </SectionContainer>
  );
};

export default NewAnimeSection;
