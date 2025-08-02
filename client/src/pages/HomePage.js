import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { animeService } from '../services/animeService';
import anilibriaService from '../services/anilibriaService';
import { Container, Grid, Button, LoadingSpinner } from '../styles/GlobalStyles';
import AnimeCard from '../components/anime/AnimeCard';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';

const HomeContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
`;

const HeroSection = styled.section`
  background: ${props => props.theme.colors.gradientPrimary};
  color: white;
  padding: 80px 0;
  text-align: center;
  margin-bottom: 60px;
`;

const HeroTitle = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto 40px;
`;

const Section = styled.section`
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 30px;
  color: ${props => props.theme.colors.text};
`;

const FilterSection = styled.div`
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
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
`;

const HomePage = () => {
  const [popularAnime, setPopularAnime] = useState([]);
  const [latestAnime, setLatestAnime] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    status: '',
    rating: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Сначала пытаемся загрузить данные из AniLibria
      const [popularResult, updatesResult] = await Promise.all([
        anilibriaService.getPopular(12).catch(() => null),
        anilibriaService.getUpdates(12).catch(() => null),
      ]);

      let popular = [];
      let latest = [];

      // Если данные из AniLibria получены успешно
      if (popularResult?.success && popularResult.data?.data) {
        popular = popularResult.data.data.map(title => anilibriaService.formatAnimeData(title));
      }

      if (updatesResult?.success && updatesResult.data?.data) {
        latest = updatesResult.data.data.map(title => anilibriaService.formatAnimeData(title));
      }

      // Fallback на локальные данные если AniLibria недоступен или пусто
      if (popular.length === 0 || latest.length === 0) {
        console.log('Fallback to local data');
        const [localPopular, localLatest] = await Promise.all([
          animeService.getPopularAnime(12).catch(() => ({ data: [] })),
          animeService.getLatestAnime(12).catch(() => ({ data: [] })),
        ]);

        if (popular.length === 0) popular = localPopular.data || [];
        if (latest.length === 0) latest = localLatest.data || [];
      }

      setPopularAnime(popular);
      setLatestAnime(latest);
    } catch (err) {
      setError('Ошибка загрузки данных. Попробуйте обновить страницу.');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuery('');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchQuery(query);

      // Сначала пытаемся искать в AniLibria
      let results = [];
      try {
        const anilibriaResults = await anilibriaService.searchWithFallback(query, { limit: 20 });
        if (anilibriaResults?.success && anilibriaResults.data) {
          results = Array.isArray(anilibriaResults.data)
            ? anilibriaResults.data.map(title => anilibriaService.formatAnimeData(title))
            : [];
        }
      } catch (anilibriaError) {
        console.log('AniLibria search failed, trying local search:', anilibriaError);
      }

      // Fallback на локальный поиск
      if (results.length === 0) {
        try {
          const localResults = await animeService.searchAnime(query, filters);
          results = localResults.data || [];
        } catch (localError) {
          setError('Ошибка поиска. Проверьте соединение с сервером.');
          results = [];
        }
      }

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);

    if (searchQuery) {
      try {
        setSearchLoading(true);

        // Применяем фильтры к поиску в AniLibria
        let results = [];
        try {
          const searchParams = {
            limit: 20,
            ...newFilters,
          };

          const anilibriaResults = await anilibriaService.searchWithFallback(searchQuery, searchParams);
          if (anilibriaResults?.success && anilibriaResults.data) {
            results = Array.isArray(anilibriaResults.data)
              ? anilibriaResults.data.map(title => anilibriaService.formatAnimeData(title))
              : [];
          }
        } catch (anilibriaError) {
          console.log('AniLibria filtered search failed, trying local search:', anilibriaError);
        }

        // Fallback на локальный поиск с фильтрами
        if (results.length === 0) {
          const localResults = await animeService.searchAnime(searchQuery, newFilters);
          results = localResults.data || [];
        }

        setSearchResults(results);
      } catch (err) {
        console.error('Filter error:', err);
      } finally {
        setSearchLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <HomeContainer>
        <Container>
          <LoadingContainer>
            <LoadingSpinner size="48px" />
          </LoadingContainer>
        </Container>
      </HomeContainer>
    );
  }

  if (error) {
    return (
      <HomeContainer>
        <Container>
          <ErrorMessage>
            {error}
            <br />
            <Button onClick={loadInitialData} style={{ marginTop: '20px' }}>
              Попробовать снова
            </Button>
          </ErrorMessage>
        </Container>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <HeroSection>
        <Container>
          <HeroTitle>🎌 Добро пожаловать в мир аниме</HeroTitle>
          <HeroSubtitle>
            Откройте для себя тысячи аниме сериалов и фильмов.
            Смотрите, оценивайте и делитесь впечатлениями с сообществом.
          </HeroSubtitle>
          <SearchBar onSearch={handleSearch} placeholder="Поиск аниме..." />
        </Container>
      </HeroSection>

      <Container>
        {searchQuery && (
          <Section>
            <SectionTitle>
              Результаты поиска &quot;{searchQuery}&quot;
              {searchLoading && <LoadingSpinner size="24px" style={{ marginLeft: '10px' }} />}
            </SectionTitle>

            <FilterSection>
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
            </FilterSection>

            {searchResults.length > 0 ? (
              <Grid>
                {searchResults.map((anime, index) => (
                  <AnimeCard key={anime.id || anime._id || index} anime={anime} />
                ))}
              </Grid>
            ) : !searchLoading && (
              <ErrorMessage>
                По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.
              </ErrorMessage>
            )}
          </Section>
        )}

        {!searchQuery && (
          <>
            <Section>
              <SectionTitle>🔥 Популярные аниме</SectionTitle>
              {popularAnime.length > 0 ? (
                <Grid>
                  {popularAnime.map((anime, index) => (
                    <AnimeCard key={anime.id || anime._id || index} anime={anime} />
                  ))}
                </Grid>
              ) : (
                <ErrorMessage>Нет данных для отображения</ErrorMessage>
              )}
            </Section>

            <Section>
              <SectionTitle>🆕 Новые аниме</SectionTitle>
              {latestAnime.length > 0 ? (
                <Grid>
                  {latestAnime.map((anime, index) => (
                    <AnimeCard key={anime.id || anime._id || index} anime={anime} />
                  ))}
                </Grid>
              ) : (
                <ErrorMessage>Нет данных для отображения</ErrorMessage>
              )}
            </Section>
          </>
        )}
      </Container>
    </HomeContainer>
  );
};

export default HomePage;
