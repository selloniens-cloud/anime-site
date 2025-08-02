import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 16px 20px 16px 50px;
  font-size: 1rem;
  border: 2px solid ${props => props.theme.colors.border};
  border-radius: 25px;
  background: ${props => props.theme.colors.surface};
  color: ${props => props.theme.colors.text};
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.2rem;
  pointer-events: none;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: ${props => props.show ? 1 : 0};
  visibility: ${props => props.show ? 'visible' : 'hidden'};
  
  &:hover {
    background: ${props => props.theme.colors.surfaceSecondary};
    color: ${props => props.theme.colors.text};
  }
`;

const SuggestionsContainer = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 8px 32px ${props => props.theme.colors.shadow};
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  z-index: ${props => props.theme.zIndex.dropdown};
`;

const SuggestionItem = styled.div`
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => props.theme.colors.surfaceSecondary};
  }
  
  .title {
    font-weight: 500;
    color: ${props => props.theme.colors.text};
    margin-bottom: 4px;
  }
  
  .meta {
    font-size: 0.875rem;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const NoResults = styled.div`
  padding: 16px;
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  font-style: italic;
`;

const SearchBar = ({
  onSearch,
  placeholder = 'Поиск аниме...',
  showSuggestions = false,
  suggestions = [],
  onSuggestionClick,
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      if (onSearch) {
        onSearch(searchQuery);
      }
      setIsLoading(false);
    }, 300),
    [onSearch],
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim()) {
      setIsLoading(true);
      setShowSuggestionsList(showSuggestions);
      debouncedSearch(value);
    } else {
      setShowSuggestionsList(false);
      setIsLoading(false);
      if (onSearch) {
        onSearch('');
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestionsList(false);
    setIsLoading(false);
    if (onSearch) {
      onSearch('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.title);
    setShowSuggestionsList(false);
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else if (onSearch) {
      onSearch(suggestion.title);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestionsList(false);
      if (onSearch) {
        onSearch(query);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestionsList(false);
    }
  };

  const handleFocus = () => {
    if (query.trim() && showSuggestions && suggestions.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestionsList(false);
    }, 200);
  };

  return (
    <SearchContainer>
      <SearchIcon>
        {isLoading ? '⏳' : '🔍'}
      </SearchIcon>

      <SearchInput
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
      />

      <ClearButton
        show={query.length > 0}
        onClick={handleClear}
        type="button"
      >
        ✕
      </ClearButton>

      {showSuggestionsList && showSuggestions && (
        <SuggestionsContainer
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <SuggestionItem
                key={suggestion._id || index}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="title">{suggestion.title}</div>
                {suggestion.year && (
                  <div className="meta">
                    {suggestion.year} • {suggestion.genres?.join(', ')}
                  </div>
                )}
              </SuggestionItem>
            ))
          ) : (
            <NoResults>
              {isLoading ? 'Поиск...' : 'Ничего не найдено'}
            </NoResults>
          )}
        </SuggestionsContainer>
      )}
    </SearchContainer>
  );
};

export default SearchBar;
