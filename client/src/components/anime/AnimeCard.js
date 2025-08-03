import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { animeService } from '../../services/animeService';
import { videoService } from '../../services/videoService';
import toast from 'react-hot-toast';
import animePlaceholder from '../../assets/images/anime-placeholder.svg';

const CardContainer = styled(motion.div)`
  background: ${props => props.theme.colors.surface};
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px ${props => props.theme.colors.shadow};
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px ${props => props.theme.colors.shadowMedium};
  }
`;

const ImageContainer = styled.div`
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
`;

const AnimeImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  ${CardContainer}:hover & {
    transform: scale(1.05);
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${props => props.theme.colors.gradientPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  background-image: url(${animePlaceholder});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 12px;
  left: 12px;
  background: ${props => {
    switch (props.status) {
    case 'ongoing': return props.theme.colors.success;
    case 'completed': return props.theme.colors.info;
    case 'upcoming': return props.theme.colors.warning;
    default: return props.theme.colors.textSecondary;
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const RatingBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ActionButtons = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
  
  ${CardContainer}:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const ActionButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: ${props => props.theme.colors.text};
  
  &:hover {
    background: white;
    transform: scale(1.1);
  }
  
  &.active {
    background: ${props => props.theme.colors.primary};
    color: white;
  }
`;

const CardContent = styled.div`
  padding: 16px;
`;

const Title = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
  line-height: 1.4;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const Year = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const Episodes = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const Genres = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const GenreTag = styled.span`
  background: ${props => props.theme.colors.surfaceSecondary};
  color: ${props => props.theme.colors.textSecondary};
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ViewButton = styled(Link)`
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
    background: ${props => props.theme.colors.primaryDark};
  }
`;

const WatchButton = styled.button`
  display: block;
  width: 100%;
  padding: 10px;
  background: ${props => props.theme.colors.primary};
  color: white;
  text-align: center;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.primaryDark};
  }
`;

const getStatusText = (status) => {
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
    case 'ongoing':
    case 'в работе':
      return 'Онгоинг';
    case 'completed':
    case 'завершен':
    case 'завершён':
      return 'Завершён';
    case 'upcoming':
    case 'анонс':
      return 'Анонс';
    default: return status;
    }
  }
  return 'Неизвестно';
};

// Утилита для получения заголовка аниме
const getAnimeTitle = (anime) => {
  if (typeof anime.title === 'string') return anime.title;
  
  // Структура AniLibria API
  if (anime.names?.ru) return anime.names.ru;
  if (anime.names?.en) return anime.names.en;
  if (anime.names?.alternative) return anime.names.alternative;
  
  // Структура нашей модели
  if (anime.title?.ru) return anime.title.ru;
  if (anime.title?.en) return anime.title.en;
  if (anime.title?.romaji) return anime.title.romaji;
  if (anime.title?.english) return anime.title.english;
  if (anime.title?.japanese) return anime.title.japanese;
  
  return 'Без названия';
};

// Утилита для получения постера
const getAnimePoster = (anime) => {
  // Прямая ссылка на постер
  if (typeof anime.poster === 'string' && anime.poster) return anime.poster;
  
  // Структура AniLibria API - исправляем URL
  if (anime.posters?.medium?.url) {
    const url = anime.posters.medium.url;
    // Проверяем если URL уже абсолютный
    return url.startsWith('http') ? url : `https://www.anilibria.tv${url}`;
  }
  if (anime.posters?.small?.url) {
    const url = anime.posters.small.url;
    return url.startsWith('http') ? url : `https://www.anilibria.tv${url}`;
  }
  if (anime.posters?.original?.url) {
    const url = anime.posters.original.url;
    return url.startsWith('http') ? url : `https://www.anilibria.tv${url}`;
  }
  
  // Структура нашей модели
  if (anime.images?.poster?.medium) return anime.images.poster.medium;
  if (anime.images?.poster?.small) return anime.images.poster.small;
  if (anime.images?.poster?.large) return anime.images.poster.large;
  
  // MyAnimeList структура
  if (anime.images?.jpg?.large_image_url) return anime.images.jpg.large_image_url;
  if (anime.images?.jpg?.image_url) return anime.images.jpg.image_url;
  
  return null;
};

// Утилита для получения рейтинга
const getAnimeRating = (anime) => {
  if (anime.rating) {
    if (typeof anime.rating === 'number') {
      return anime.rating;
    }
    if (anime.rating.score) {
      return anime.rating.score;
    }
  }
  return null;
};

// Утилита для получения ID аниме
const getAnimeId = (anime) => {
  return anime._id || anime.id || `fallback_${Math.random()}`;
};

const AnimeCard = ({ anime }) => {
  const [isFavorite, setIsFavorite] = useState(anime.isFavorite || false);
  const [isInWatchlist, setIsInWatchlist] = useState(anime.isInWatchlist || false);
  const [imageError, setImageError] = useState(false);
  const { isAuthenticated } = useAuth();

  const animeId = getAnimeId(anime);
  const title = getAnimeTitle(anime);
  const poster = getAnimePoster(anime);
  const rating = getAnimeRating(anime);

  const handleImageError = (e) => {
    console.log('Image failed to load:', poster);
    setImageError(true);
    // Не скрываем изображение сразу, а заменяем на fallback
    e.target.src = '/no-image.svg';
  };

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Войдите в аккаунт для добавления в избранное');
      return;
    }

    try {
      await animeService.toggleFavorite(animeId);
      setIsFavorite(!isFavorite);
      toast.success(isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное');
    } catch (error) {
      toast.error('Ошибка при добавлении в избранное');
    }
  };

  const handleWatchlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Войдите в аккаунт для добавления в список');
      return;
    }

    try {
      // Здесь будет вызов API для добавления в watchlist
      setIsInWatchlist(!isInWatchlist);
      toast.success(isInWatchlist ? 'Удалено из списка' : 'Добавлено в список');
    } catch (error) {
      toast.error('Ошибка при добавлении в список');
    }
  };

  // Функция для обработки просмотра видео согласно спецификации
  const handleWatch = async () => {
    try {
      const videoData = await videoService.getVideoStream(animeId, 1);
      // Логика открытия плеера с полученным видео
      console.log('Video data received:', videoData);
      // Здесь можно добавить навигацию к плееру или открытие модального окна
    } catch (error) {
      toast.error('Ошибка загрузки видео');
    }
  };

  return (
    <CardContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <ImageContainer>
        {poster && !imageError ? (
          <AnimeImage
            src={poster}
            alt={title}
            onError={handleImageError}
          />
        ) : (
          <ImagePlaceholder>
            <img 
              src="/no-image.svg" 
              alt="Изображение не найдено"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </ImagePlaceholder>
        )}

        {anime.status && (
          <StatusBadge status={anime.status}>
            {getStatusText(anime.status)}
          </StatusBadge>
        )}

        {rating && (
          <RatingBadge>
            ⭐ {rating.toFixed(1)}
          </RatingBadge>
        )}

        <ActionButtons>
          <ActionButton
            className={isFavorite ? 'active' : ''}
            onClick={handleFavoriteToggle}
            title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
          >
            {isFavorite ? '❤️' : '🤍'}
          </ActionButton>

          <ActionButton
            className={isInWatchlist ? 'active' : ''}
            onClick={handleWatchlistToggle}
            title={isInWatchlist ? 'Удалить из списка' : 'Добавить в список'}
          >
            {isInWatchlist ? '📋' : '📝'}
          </ActionButton>
        </ActionButtons>
      </ImageContainer>

      <CardContent>
        <Title>{title}</Title>

        {anime.description && (
          <Description>{anime.description}</Description>
        )}

        <MetaInfo>
          {anime.year && <Year>{anime.year}</Year>}
          {anime.episodes && (
            <Episodes>
              {anime.episodes} эп.
            </Episodes>
          )}
        </MetaInfo>

        {anime.genres && anime.genres.length > 0 && (
          <Genres>
            {anime.genres.slice(0, 3).map((genre, index) => (
              <GenreTag key={index}>{genre}</GenreTag>
            ))}
            {anime.genres.length > 3 && (
              <GenreTag>+{anime.genres.length - 3}</GenreTag>
            )}
          </Genres>
        )}

        <WatchButton onClick={handleWatch}>
          Смотреть
        </WatchButton>
      </CardContent>
    </CardContainer>
  );
};

export default AnimeCard;
