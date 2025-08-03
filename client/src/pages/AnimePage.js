import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import anilibriaV2Service from '../services/anilibriaV2Service';
import { Container, Button, LoadingSpinner } from '../styles/GlobalStyles';

const AnimeContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
  background: ${props => props.theme.colors.background};
`;

const AnimeHeader = styled.div`
  display: flex;
  gap: 40px;
  margin-bottom: 60px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 30px;
  }
`;

const PosterContainer = styled.div`
  flex-shrink: 0;
  width: 300px;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }
`;

const Poster = styled.img`
  width: 100%;
  height: 420px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
`;

const PosterPlaceholder = styled.div`
  width: 100%;
  height: 420px;
  background: ${props => props.theme.colors.gradientPrimary};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  color: white;
`;

const AnimeInfo = styled.div`
  flex: 1;
`;

const AnimeTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: ${props => props.theme.colors.text};
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const AnimeSubtitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 500;
  margin-bottom: 20px;
  color: ${props => props.theme.colors.textSecondary};
  opacity: 0.8;
`;

const MetaInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const MetaItem = styled.div`
  .label {
    font-size: 0.9rem;
    color: ${props => props.theme.colors.textSecondary};
    margin-bottom: 5px;
    font-weight: 500;
  }
  
  .value {
    font-size: 1.1rem;
    color: ${props => props.theme.colors.text};
    font-weight: 600;
  }
`;

const GenresContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
`;

const GenreTag = styled.span`
  background: ${props => props.theme.colors.primary};
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
`;

const Description = styled.p`
  font-size: 1.1rem;
  line-height: 1.6;
  color: ${props => props.theme.colors.text};
  margin-bottom: 30px;
  text-align: justify;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 50px;
`;

const WatchButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: ${props => props.theme.colors.primary};
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryDark || props.theme.colors.primary};
    transform: translateY(-2px);
  }
  
  &::before {
    content: '▶️';
    font-size: 1.2rem;
  }
`;

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  background: transparent;
  color: ${props => props.theme.colors.text};
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

const EpisodesSection = styled.div`
  margin-bottom: 50px;
`;

const SectionTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 25px;
  color: ${props => props.theme.colors.text};
`;

const EpisodesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
`;

const EpisodeCard = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px ${props => props.theme.colors.shadow};
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px ${props => props.theme.colors.shadowMedium};
  }
`;

const EpisodeImage = styled.div`
  position: relative;
  width: 100%;
  height: 160px;
  background: ${props => props.theme.colors.gradientPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EpisodeInfo = styled.div`
  padding: 16px;
`;

const EpisodeTitle = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
  line-height: 1.3;
`;

const EpisodeNumber = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
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

const BackButton = styled(Button)`
  margin-bottom: 30px;
  background: transparent;
  color: ${props => props.theme.colors.text};
  border: 1px solid ${props => props.theme.colors.border};
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    color: ${props => props.theme.colors.primary};
  }
`;

const AnimePage = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      loadAnime();
    }
  }, [id]);

  const loadAnime = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🎬 Загрузка аниме ${id}...`);

      // Загружаем информацию об аниме
      const animeData = await anilibriaV2Service.getAnimeById(id);
      const convertedAnime = anilibriaV2Service.convertAnimeToFormat(animeData);

      setAnime(convertedAnime);
      console.log('✅ Аниме загружено:', convertedAnime.title);

      // Загружаем эпизоды
      loadEpisodes(id);

    } catch (err) {
      console.error('Ошибка загрузки аниме:', err);
      setError(`Не удалось загрузить информацию об аниме: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadEpisodes = async (animeId) => {
    try {
      setEpisodesLoading(true);

      console.log(`📺 Загрузка эпизодов для аниме ${animeId}...`);

      const episodesData = await anilibriaV2Service.getAnimeEpisodes(animeId);

      if (Array.isArray(episodesData)) {
        const convertedEpisodes = episodesData.map(ep =>
          anilibriaV2Service.convertEpisodeToFormat(ep),
        );
        setEpisodes(convertedEpisodes);
        console.log(`✅ Загружено ${convertedEpisodes.length} эпизодов`);
      }

    } catch (err) {
      console.warn('Не удалось загрузить эпизоды:', err);
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  };

  const handleEpisodeClick = (episode) => {
    // Переходим к просмотру конкретного эпизода
    window.location.href = `/watch/${episode.id}`;
  };

  if (loading) {
    return (
      <AnimeContainer>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="48px" />
          </LoadingContainer>
        </Container>
      </AnimeContainer>
    );
  }

  if (error) {
    return (
      <AnimeContainer>
        <Container>
          <BackButton onClick={() => window.history.back()}>
            ← Назад
          </BackButton>
          <ErrorMessage>
            {error}
            <br />
            <button
              onClick={loadAnime}
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
        </Container>
      </AnimeContainer>
    );
  }

  if (!anime) {
    return (
      <AnimeContainer>
        <Container>
          <BackButton onClick={() => window.history.back()}>
            ← Назад
          </BackButton>
          <ErrorMessage>Аниме не найдено</ErrorMessage>
        </Container>
      </AnimeContainer>
    );
  }

  const firstEpisode = episodes.length > 0 ? episodes[0] : null;

  return (
    <AnimeContainer>
      <Container>
        <BackButton onClick={() => window.history.back()}>
          ← Назад к каталогу
        </BackButton>

        <AnimeHeader>
          <PosterContainer>
            {anime.poster ? (
              <Poster
                src={anime.poster}
                alt={anime.title}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <PosterPlaceholder>🎭</PosterPlaceholder>
            )}
            <PosterPlaceholder style={{display: 'none'}}>🎭</PosterPlaceholder>
          </PosterContainer>

          <AnimeInfo>
            <AnimeTitle>{anime.title}</AnimeTitle>
            {anime.titleEnglish && (
              <AnimeSubtitle>{anime.titleEnglish}</AnimeSubtitle>
            )}

            <MetaInfo>
              <MetaItem>
                <div className="label">Год выхода</div>
                <div className="value">{anime.year || 'Неизвестно'}</div>
              </MetaItem>
              <MetaItem>
                <div className="label">Статус</div>
                <div className="value">{anime.status || 'Неизвестно'}</div>
              </MetaItem>
              <MetaItem>
                <div className="label">Количество серий</div>
                <div className="value">{anime.episodes || episodes.length || 'Неизвестно'}</div>
              </MetaItem>
              <MetaItem>
                <div className="label">Тип</div>
                <div className="value">{anime.type || 'Неизвестно'}</div>
              </MetaItem>
              {anime.rating && (
                <MetaItem>
                  <div className="label">Рейтинг</div>
                  <div className="value">⭐ {anime.rating}</div>
                </MetaItem>
              )}
              {anime.duration && (
                <MetaItem>
                  <div className="label">Длительность серии</div>
                  <div className="value">~{anime.duration} мин</div>
                </MetaItem>
              )}
            </MetaInfo>

            {anime.genres && anime.genres.length > 0 && (
              <GenresContainer>
                {anime.genres.map((genre, index) => (
                  <GenreTag key={index}>{genre}</GenreTag>
                ))}
              </GenresContainer>
            )}

            {anime.description && (
              <Description>{anime.description}</Description>
            )}

            <ActionButtons>
              {firstEpisode ? (
                <WatchButton to={`/watch/${firstEpisode.id}`}>
                  Смотреть
                </WatchButton>
              ) : (
                <SecondaryButton disabled>
                  Эпизоды недоступны
                </SecondaryButton>
              )}

              <SecondaryButton>
                ❤️ В избранное
              </SecondaryButton>

              <SecondaryButton>
                📝 В планы
              </SecondaryButton>
            </ActionButtons>
          </AnimeInfo>
        </AnimeHeader>

        {/* Секция эпизодов */}
        <EpisodesSection>
          <SectionTitle>
            Эпизоды {episodesLoading && '(загрузка...)'}
          </SectionTitle>

          {episodesLoading ? (
            <LoadingContainer>
              <LoadingSpinner size="32px" />
            </LoadingContainer>
          ) : episodes.length > 0 ? (
            <EpisodesGrid>
              {episodes.map((episode, index) => (
                <EpisodeCard
                  key={episode.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => handleEpisodeClick(episode)}
                  whileHover={{ y: -4 }}
                  whileTap={{ y: 0 }}
                >
                  <EpisodeImage>
                    <EpisodeNumber>
                      Эп. {episode.number || index + 1}
                    </EpisodeNumber>
                    {episode.preview ? (
                      <img
                        src={episode.preview}
                        alt={episode.title}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span>🎬</span>
                    )}
                  </EpisodeImage>

                  <EpisodeInfo>
                    <EpisodeTitle>
                      {episode.title || `Эпизод ${episode.number || index + 1}`}
                    </EpisodeTitle>
                    {episode.duration && (
                      <div style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)',
                        marginTop: '5px',
                      }}>
                        {Math.round(episode.duration / 60)} мин
                      </div>
                    )}
                  </EpisodeInfo>
                </EpisodeCard>
              ))}
            </EpisodesGrid>
          ) : (
            <ErrorMessage>
              Эпизоды для этого аниме пока недоступны
            </ErrorMessage>
          )}
        </EpisodesSection>
      </Container>
    </AnimeContainer>
  );
};

export default AnimePage;
