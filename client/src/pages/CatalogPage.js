import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { animeService } from '../services/animeService';
import anilibriaService from '../services/anilibriaService';
import jikanService from '../services/jikanService'; // Добавляем импорт
import { Container, Grid, LoadingSpinner } from '../styles/GlobalStyles';
import AnimeCard from '../components/anime/AnimeCard';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';

const CatalogContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
  background: ${props => props.theme.colors.background};
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.1rem;
  margin-bottom: 32px;
`;

const FiltersSection = styled.div`
  margin-bottom: 40px;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ResultsCount = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.9rem;
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

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${props => props.theme.colors.textSecondary};
`;

const fallbackAnime = [
  {
    _id: 'mock1',
    title: { ru: 'Девочки-бабочки', en: 'Butterfly Girls' },
    description: 'История о девочках, которые превращаются в бабочек и сражаются со злом.',
    poster: 'https://www.anilibria.tv/storage/releases/posters/9919/medium.jpg',
    year: 2025,
    status: 'В работе',
    genres: ['Магия', 'Школа', 'Драма'],
    episodes: 24,
    rating: 8.1,
  },
  {
    _id: 'mock2',
    title: { ru: 'Труська, Чулко и пресвятой Подвяз 2', en: 'New Panty & Stocking with Garterbelt' },
    description: 'Продолжение приключений двух падших ангелов в Датэн-сити.',
    poster: 'https://www.anilibria.tv/storage/releases/posters/9988/medium.jpg',
    year: 2025,
    status: 'В работе',
    genres: ['Комедия', 'Пародия', 'Фэнтези', 'Экшен'],
    episodes: 13,
    rating: 7.9,
  }
];

const CatalogPage = ({ filter }) => {
  const [animeList, setAnimeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    genre: [],
    year: '',
    status: '',
    rating: '',
    sortBy: 'rating',
    sortOrder: 'desc',
  });
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadAnime();
    // eslint-disable-next-line
  }, [filter, filters]);

  const loadAnime = async () => {
    try {
      setLoading(true);
      setError(null);
      let list = [];
      let count = 0;

      // Пробуем загрузить из локальной базы
      try {
        const response = await animeService.getAnimeList({
          ...filters,
          search: searchQuery,
          limit: 50,
        });
        list = (response?.data?.anime) || [];
        count = response?.data?.pagination?.totalItems || 0;
      } catch (e) {
        console.warn('Local DB error:', e);
      }

      // Если локальная база пуста - пробуем AniLibria
      if (!list.length) {
        try {
          const anilibriaResult = await anilibriaService.getPopular(50);
          if (anilibriaResult?.success && anilibriaResult.data?.data) {
            list = anilibriaResult.data.data.map(title => 
              anilibriaService.formatAnimeData(title)
            );
            count = list.length;
          }
        } catch (e) {
          console.warn('AniLibria error:', e);
        }
      }

      // Если и AniLibria не сработала - берем данные из Jikan
      if (!list.length) {
        try {
          const jikanResult = await jikanService.getPopularAnime(50);
          if (jikanResult.success) {
            list = jikanResult.data;
            count = list.length;
          }
        } catch (e) {
          console.warn('Jikan error:', e);
        }
      }

      // В крайнем случае используем fallback
      if (!list.length) {
        list = fallbackAnime;
        count = fallbackAnime.length;
      }

      setAnimeList(list);
      setTotalCount(count);
      setError(null);
    } catch (err) {
      console.error('Catalog error:', err);
      setAnimeList(fallbackAnime);
      setTotalCount(fallbackAnime.length);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!filter) {
      try {
        setLoading(true);
        setError(null);
        const response = await animeService.searchAnime(query, {
          ...filters,
          search: query,
          limit: 50,
        });
        let list = (response && response.data) ? response.data : [];
        let count = response?.total || (response && response.data ? response.data.length : 0);

        // Если поиск по локальной базе ничего не дал — ищем в AniLibria
        if (!list || list.length === 0) {
          try {
            const anilibriaResult = await anilibriaService.searchWithFallback(query, { limit: 50 });
            if (anilibriaResult?.success && anilibriaResult.data) {
              list = Array.isArray(anilibriaResult.data)
                ? anilibriaResult.data.map(title => anilibriaService.formatAnimeData(title))
                : [];
              count = list.length;
            }
          } catch (e) {
            // fallback не удался
          }
        }

        // Если всё равно пусто — показываем fallback-аниме
        if (!list || list.length === 0) {
          list = fallbackAnime;
          count = fallbackAnime.length;
          setError(null);
        }

        setAnimeList(list);
        setTotalCount(count);
      } catch (err) {
        setAnimeList(fallbackAnime);
        setTotalCount(fallbackAnime.length);
        setError(null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getPageTitle = () => {
    switch (filter) {
    case 'popular':
      return 'Популярные аниме';
    case 'latest':
      return 'Новые аниме';
    default:
      return 'Каталог аниме';
    }
  };

  const getPageSubtitle = () => {
    switch (filter) {
    case 'popular':
      return 'Самые популярные и высокорейтинговые аниме';
    case 'latest':
      return 'Последние добавленные аниме';
    default:
      return 'Найдите аниме по своему вкусу';
    }
  };

  if (error) {
    return (
      <CatalogContainer>
        <Container>
          <ErrorMessage>{error}</ErrorMessage>
        </Container>
      </CatalogContainer>
    );
  }

  return (
    <CatalogContainer>
      <Container>
        <Header>
          <Title>{getPageTitle()}</Title>
          <Subtitle>{getPageSubtitle()}</Subtitle>
          {!filter && <SearchBar onSearch={handleSearch} />}
        </Header>

        {!filter && (
          <FiltersSection>
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </FiltersSection>
        )}

        <ResultsHeader>
          <ResultsCount>
            {loading ? 'Загрузка...' : `Найдено: ${totalCount} аниме`}
          </ResultsCount>
        </ResultsHeader>

        {loading ? (
          <LoadingContainer>
            <LoadingSpinner size="48px" />
          </LoadingContainer>
        ) : animeList.length > 0 ? (
          <Grid>
            {animeList.map((anime) => (
              <AnimeCard key={anime._id} anime={anime} />
            ))}
          </Grid>
        ) : (
          <EmptyState>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
          </EmptyState>
        )}
      </Container>
    </CatalogContainer>
  );
};

export default CatalogPage;
