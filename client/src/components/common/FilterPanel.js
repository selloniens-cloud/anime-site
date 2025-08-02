import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { animeService } from '../../services/animeService';
import { Button } from '../../styles/GlobalStyles';

const FilterContainer = styled.div`
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  width: 100%;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
`;

const FilterTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const ToggleButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.primary};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.surfaceSecondary};
  }
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const FilterContent = styled(motion.div)`
  @media (max-width: 768px) {
    overflow: hidden;
  }
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const Select = styled.select`
  padding: 10px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
  
  option {
    background: ${props => props.theme.colors.surface};
    color: ${props => props.theme.colors.text};
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const CheckboxItem = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: ${props => props.checked ? props.theme.colors.primary : props.theme.colors.surfaceSecondary};
  color: ${props => props.checked ? 'white' : props.theme.colors.text};
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  
  &:hover {
    background: ${props => props.checked ? props.theme.colors.primaryDark : props.theme.colors.border};
  }
  
  input {
    display: none;
  }
`;

const RangeGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
`;

const RangeInput = styled.input`
  flex: 1;
  padding: 8px 10px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const RangeSeparator = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 500;
`;

const FilterActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  
  @media (max-width: 768px) {
    justify-content: stretch;
    
    button {
      flex: 1;
    }
  }
`;

const FilterPanel = ({ filters, onFilterChange }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [genres, setGenres] = useState([]);
  const [localFilters, setLocalFilters] = useState({
    genre: [],
    year: '',
    yearFrom: '',
    yearTo: '',
    status: '',
    rating: '',
    ratingFrom: '',
    ratingTo: '',
    episodes: '',
    episodesFrom: '',
    episodesTo: '',
    sortBy: 'rating',
    sortOrder: 'desc',
    ...filters,
  });

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const response = await animeService.getGenres();
      setGenres(response.data || []);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleGenreToggle = (genre) => {
    const currentGenres = localFilters.genre || [];
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];

    handleFilterChange('genre', newGenres);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const resetFilters = () => {
    const resetFilters = {
      genre: [],
      year: '',
      yearFrom: '',
      yearTo: '',
      status: '',
      rating: '',
      ratingFrom: '',
      ratingTo: '',
      episodes: '',
      episodesFrom: '',
      episodesTo: '',
      sortBy: 'rating',
      sortOrder: 'desc',
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1960 + 1 }, (_, i) => currentYear - i);

  return (
    <FilterContainer>
      <FilterHeader>
        <FilterTitle>Фильтры</FilterTitle>
        <ToggleButton onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Скрыть' : 'Показать'}
        </ToggleButton>
      </FilterHeader>

      <AnimatePresence>
        {isExpanded && (
          <FilterContent
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FilterGrid>
              <FilterGroup>
                <FilterLabel>Статус</FilterLabel>
                <Select
                  value={localFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Все</option>
                  <option value="ongoing">Онгоинг</option>
                  <option value="completed">Завершён</option>
                  <option value="upcoming">Анонс</option>
                </Select>
              </FilterGroup>

              <FilterGroup>
                <FilterLabel>Год</FilterLabel>
                <Select
                  value={localFilters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <option value="">Любой</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </FilterGroup>

              <FilterGroup>
                <FilterLabel>Сортировка</FilterLabel>
                <Select
                  value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                >
                  <option value="rating-desc">По рейтингу ↓</option>
                  <option value="rating-asc">По рейтингу ↑</option>
                  <option value="year-desc">По году ↓</option>
                  <option value="year-asc">По году ↑</option>
                  <option value="title-asc">По названию ↑</option>
                  <option value="title-desc">По названию ↓</option>
                  <option value="episodes-desc">По эпизодам ↓</option>
                  <option value="episodes-asc">По эпизодам ↑</option>
                </Select>
              </FilterGroup>
            </FilterGrid>

            <FilterGroup>
              <FilterLabel>Рейтинг</FilterLabel>
              <RangeGroup>
                <RangeInput
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="От"
                  value={localFilters.ratingFrom}
                  onChange={(e) => handleFilterChange('ratingFrom', e.target.value)}
                />
                <RangeSeparator>—</RangeSeparator>
                <RangeInput
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="До"
                  value={localFilters.ratingTo}
                  onChange={(e) => handleFilterChange('ratingTo', e.target.value)}
                />
              </RangeGroup>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>Количество эпизодов</FilterLabel>
              <RangeGroup>
                <RangeInput
                  type="number"
                  min="1"
                  placeholder="От"
                  value={localFilters.episodesFrom}
                  onChange={(e) => handleFilterChange('episodesFrom', e.target.value)}
                />
                <RangeSeparator>—</RangeSeparator>
                <RangeInput
                  type="number"
                  min="1"
                  placeholder="До"
                  value={localFilters.episodesTo}
                  onChange={(e) => handleFilterChange('episodesTo', e.target.value)}
                />
              </RangeGroup>
            </FilterGroup>

            {genres.length > 0 && (
              <FilterGroup>
                <FilterLabel>Жанры</FilterLabel>
                <CheckboxGroup>
                  {genres.map((genre) => (
                    <CheckboxItem
                      key={genre}
                      checked={localFilters.genre?.includes(genre)}
                    >
                      <input
                        type="checkbox"
                        checked={localFilters.genre?.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                      />
                      {genre}
                    </CheckboxItem>
                  ))}
                </CheckboxGroup>
              </FilterGroup>
            )}

            <FilterActions>
              <Button variant="outline" onClick={resetFilters}>
                Сбросить
              </Button>
              <Button onClick={applyFilters}>
                Применить
              </Button>
            </FilterActions>
          </FilterContent>
        )}
      </AnimatePresence>
    </FilterContainer>
  );
};

export default FilterPanel;
