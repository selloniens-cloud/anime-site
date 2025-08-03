import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Container } from '../styles/GlobalStyles';
import SearchBar from '../components/common/SearchBar';
import FilterPanel from '../components/common/FilterPanel';
import PopularSection from '../components/sections/PopularSection';
import NewEpisodesSection from '../components/sections/NewEpisodesSection';
import NewAnimeSection from '../components/sections/NewAnimeSection';
import AnimeCard from '../components/anime/AnimeCard';
import anilibriaV2Service from '../services/anilibriaV2Service';

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

const SearchGrid = styled.div`
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

const HomePage = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    status: '',
    rating: '',
  });

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchQuery('');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError(null);
      setSearchQuery(query);

      console.log(`🔍 Поиск аниме: "${query}"`);
      
      const response = await anilibriaV2Service.searchAnime(query, {
        perPage: 20,
        page: 1,
        ...filters
      });

      let results = [];
      
      if (response?.data && Array.isArray(response.data)) {
        results = response.data.map(anime => 
          anilibriaV2Service.convertAnimeToFormat(anime)
        );
      } else if (response && Array.isArray(response)) {
        results = response.map(anime => 
          anilibriaV2Service.convertAnimeToFormat(anime)
        );
      }

      setSearchResults(results);
      console.log(`✅ Найдено ${results.length} результатов поиска`);

    } catch (err) {
      console.error('Ошибка поиска:', err);
      setSearchError('Ошибка поиска. Попробуйте изменить запрос.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);

    if (searchQuery) {
      await handleSearch(searchQuery);
    }
  };

  const handleAnimeClick = (anime) => {
    console.log('Клик по аниме:', anime);
    navigate(`/anime/${anime.id}`);
  };

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
              Результаты поиска "{searchQuery}"
            </SectionTitle>

            <FilterSection>
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
            </FilterSection>

            {searchLoading && (
              <LoadingContainer>
                <div>Поиск...</div>
              </LoadingContainer>
            )}

            {searchError && (
              <ErrorMessage>
                {searchError}
                <br />
                <button 
                  onClick={() => handleSearch(searchQuery)}
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
                  Повторить поиск
                </button>
              </ErrorMessage>
            )}

            {searchResults.length > 0 && !searchLoading && (
              <SearchGrid>
                {searchResults.map((anime, index) => (
                  <AnimeCard 
                    key={anime.id || index} 
                    anime={anime} 
                    onClick={() => handleAnimeClick(anime)}
                  />
                ))}
              </SearchGrid>
            )}

            {searchResults.length === 0 && !searchLoading && !searchError && (
              <ErrorMessage>
                По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.
              </ErrorMessage>
            )}
          </Section>
        )}

        {!searchQuery && (
          <>
            <PopularSection 
              limit={12}
              onAnimeClick={handleAnimeClick}
            />
            
            <NewEpisodesSection 
              limit={10}
            />
            
            <NewAnimeSection 
              limit={12}
              onAnimeClick={handleAnimeClick}
            />
          </>
        )}
      </Container>
    </HomeContainer>
  );
};

export default HomePage;
