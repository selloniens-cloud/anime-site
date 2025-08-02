import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { animeService } from '../services/animeService';
import { Container, Button, LoadingSpinner } from '../styles/GlobalStyles';

const AnimeContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
  background: ${props => props.theme.colors.background};
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
`;

const AnimePage = () => {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnime();
  }, [id]);

  const loadAnime = async () => {
    try {
      setLoading(true);
      const response = await animeService.getAnimeById(id);
      setAnime(response.data);
    } catch (err) {
      setError('Аниме не найдено');
    } finally {
      setLoading(false);
    }
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
          <ErrorMessage>{error}</ErrorMessage>
        </Container>
      </AnimeContainer>
    );
  }

  return (
    <AnimeContainer>
      <Container>
        <h1>{anime?.title || 'Загрузка...'}</h1>
        <p>Страница аниме в разработке</p>
        <Button onClick={() => window.history.back()}>
          Назад
        </Button>
      </Container>
    </AnimeContainer>
  );
};

export default AnimePage;
