import axios from 'axios';

// Базовый URL для AniLiberty API v1
const ANILIBERTY_API_BASE = 'https://aniliberty.top/api/v1';

// Создаем отдельный instance axios для AniLiberty API
const anilibriaV2Api = axios.create({
  baseURL: ANILIBERTY_API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Обработчик ошибок
anilibriaV2Api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('AniLiberty API Error:', error);
    if (error.response?.data?.errors) {
      throw new Error(Object.values(error.response.data.errors).flat().join(', '));
    }
    throw new Error(error.message || 'Ошибка при обращении к AniLiberty API');
  }
);

export const anilibriaV2Service = {
  // Получить популярные аниме (используем latest как популярные)
  async getPopularAnime(params = {}) {
    try {
      const { perPage = 10, page = 1 } = params;
      const response = await anilibriaV2Api.get('/anime/releases/latest', {
        params: { limit: perPage }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(`Ошибка получения популярных аниме: ${error.message}`);
    }
  },

  // Получить новые эпизоды (через latest releases)
  async getNewEpisodes(params = {}) {
    try {
      const { perPage = 10, page = 1 } = params;
      const response = await anilibriaV2Api.get('/anime/releases/latest', {
        params: { limit: perPage }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(`Ошибка получения новых эпизодов: ${error.message}`);
    }
  },

  // Получить новые аниме (используем latest)
  async getNewAnime(params = {}) {
    try {
      const { perPage = 10, page = 1 } = params;
      const response = await anilibriaV2Api.get('/anime/releases/latest', {
        params: { limit: perPage }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(`Ошибка получения новых аниме: ${error.message}`);
    }
  },

  // Получить информацию об аниме по ID
  async getAnimeById(id) {
    try {
      const response = await anilibriaV2Api.get(`/anime/releases/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения аниме ${id}: ${error.message}`);
    }
  },

  // Получить эпизоды аниме по ID
  async getAnimeEpisodes(id) {
    try {
      const response = await anilibriaV2Api.get(`/anime/releases/${id}`, {
        params: { include: 'episodes' }
      });
      return response.data?.episodes || [];
    } catch (error) {
      throw new Error(`Ошибка получения эпизодов аниме ${id}: ${error.message}`);
    }
  },

  // Получить конкретный эпизод по episodeId
  async getEpisodeById(episodeId) {
    try {
      const response = await anilibriaV2Api.get(`/anime/releases/episodes/${episodeId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Ошибка получения эпизода ${episodeId}: ${error.message}`);
    }
  },

  // Поиск аниме по названию
  async searchAnime(query, params = {}) {
    try {
      const { perPage = 20, page = 1, ...filters } = params;
      const response = await anilibriaV2Api.get('/app/search/releases', {
        params: {
          search: query,
          limit: perPage,
          page,
          ...filters
        }
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error(`Ошибка поиска аниме: ${error.message}`);
    }
  },

  // УСТАРЕВШИЕ МЕТОДЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
  // Получить последние релизы (для обратной совместимости)
  async getLatestReleases(limit = 50) {
    try {
      return await this.getNewEpisodes({ perPage: limit });
    } catch (error) {
      throw new Error(`Ошибка получения последних релизов: ${error.message}`);
    }
  },

  // Получить случайные релизы (fallback к популярным)
  async getRandomReleases(limit = 10) {
    try {
      return await this.getPopularAnime({ perPage: limit });
    } catch (error) {
      throw new Error(`Ошибка получения случайных релизов: ${error.message}`);
    }
  },

  // Вспомогательные методы для работы с видео

  // Получить URL видео для эпизода в указанном качестве
  getVideoUrl(episode, quality = '720') {
    if (!episode) return null;

    // Новая структура API - поддержка react-player
    if (episode.video_url) return episode.video_url;
    
    const qualityMap = {
      '1080': episode.hls_1080 || episode.video_1080,
      '720': episode.hls_720 || episode.video_720,
      '480': episode.hls_480 || episode.video_480,
    };

    // Возвращаем запрошенное качество или fallback к доступному
    return qualityMap[quality] || 
           episode.hls_1080 || episode.video_1080 ||
           episode.hls_720 || episode.video_720 ||
           episode.hls_480 || episode.video_480 ||
           null;
  },

  // Получить все доступные качества для эпизода
  getAvailableQualities(episode) {
    if (!episode) return [];

    const qualities = [];
    if (episode.hls_1080 || episode.video_1080) {
      qualities.push({ 
        height: 1080, 
        src: episode.hls_1080 || episode.video_1080, 
        label: '1080p' 
      });
    }
    if (episode.hls_720 || episode.video_720) {
      qualities.push({ 
        height: 720, 
        src: episode.hls_720 || episode.video_720, 
        label: '720p' 
      });
    }
    if (episode.hls_480 || episode.video_480) {
      qualities.push({ 
        height: 480, 
        src: episode.hls_480 || episode.video_480, 
        label: '480p' 
      });
    }

    return qualities;
  },

  // Конвертировать данные аниме в унифицированный формат
  convertAnimeToFormat(anime) {
    if (!anime) return null;

    return {
      id: anime.id,
      title: anime.name?.main || anime.title || 'Без названия',
      titleEnglish: anime.name?.english || anime.title_english,
      titleAlternative: anime.name?.alternative || anime.title_alternative,
      alias: anime.alias,
      year: anime.year,
      type: anime.type?.description || anime.type?.value || anime.type,
      status: this.getStatusText(anime),
      poster: this.getOptimizedImageUrl(anime.poster),
      description: anime.description,
      episodes: anime.episodes_total || anime.episodes,
      genres: this.getGenres(anime.genres),
      rating: anime.rating || anime.average_rating,
      ageRating: anime.age_rating?.label || anime.age_rating,
      season: anime.season?.description || anime.season,
      duration: anime.average_duration_of_episode || anime.duration,
      // Дополнительные поля
      publishDay: anime.publish_day?.description,
      isOngoing: anime.is_ongoing,
      isInProduction: anime.is_in_production,
      favorites: anime.added_in_users_favorites,
      fresh_at: anime.fresh_at,
      updated_at: anime.updated_at,
    };
  },

  // Конвертировать данные эпизода в унифицированный формат
  convertEpisodeToFormat(episode) {
    if (!episode) return null;

    return {
      id: episode.id,
      number: episode.ordinal || episode.number,
      title: episode.name || episode.title || `Эпизод ${episode.ordinal || episode.number}`,
      titleEnglish: episode.name_english || episode.title_english,
      duration: episode.duration,
      sortOrder: episode.sort_order || episode.number,
      preview: this.getOptimizedImageUrl(episode.preview),
      
      // Видео URL'ы
      videoUrl: this.getVideoUrl(episode, '720'),
      videoUrls: {
        '480': episode.hls_480 || episode.video_480,
        '720': episode.hls_720 || episode.video_720,
        '1080': episode.hls_1080 || episode.video_1080,
      },

      // Тайм-коды для скипа опенинга/эндинга
      opening: episode.opening,
      ending: episode.ending,

      // Внешние плееры
      rutubeId: episode.rutube_id,
      youtubeId: episode.youtube_id,

      updated_at: episode.updated_at,
      animeId: episode.anime_id || episode.release_id,
    };
  },

  // Получить статус аниме
  getStatusText(anime) {
    if (anime.is_ongoing) return 'Онгоинг';
    if (anime.status) {
      if (typeof anime.status === 'string') return anime.status;
      if (anime.status.description) return anime.status.description;
    }
    return 'Завершён';
  },

  // Получить жанры
  getGenres(genres) {
    if (!genres) return [];
    if (Array.isArray(genres)) {
      return genres.map(genre => 
        typeof genre === 'string' ? genre : genre.name || genre.title
      );
    }
    return [];
  },

  // Получить оптимизированный URL изображения
  getOptimizedImageUrl(imageObject) {
    if (!imageObject) return null;
    
    // Если это уже готовый URL
    if (typeof imageObject === 'string') {
      return imageObject.startsWith('http') ? imageObject : `https://aniliberty.top${imageObject}`;
    }
    
    // Приоритет: optimized > preview > src > thumbnail
    if (imageObject.optimized?.preview) {
      return `https://aniliberty.top${imageObject.optimized.preview}`;
    }
    if (imageObject.preview) {
      return `https://aniliberty.top${imageObject.preview}`;
    }
    if (imageObject.src) {
      return `https://aniliberty.top${imageObject.src}`;
    }
    if (imageObject.thumbnail) {
      return `https://aniliberty.top${imageObject.thumbnail}`;
    }
    
    return null;
  },

  // МЕТОДЫ ДЛЯ ОБРАТНОЙ СОВМЕСТИМОСТИ
  
  // Получить релиз (для старого кода)
  async getRelease(idOrAlias, include = '') {
    try {
      return await this.getAnimeById(idOrAlias);
    } catch (error) {
      throw new Error(`Ошибка получения релиза ${idOrAlias}: ${error.message}`);
    }
  },

  // Получить релиз с эпизодами (для старого кода)
  async getReleaseWithEpisodes(idOrAlias) {
    try {
      const [anime, episodes] = await Promise.all([
        this.getAnimeById(idOrAlias),
        this.getAnimeEpisodes(idOrAlias)
      ]);
      
      return {
        ...anime,
        episodes: episodes
      };
    } catch (error) {
      throw new Error(`Ошибка получения релиза с эпизодами ${idOrAlias}: ${error.message}`);
    }
  },

  // Конвертация для старого кода
  convertReleaseToAnimeFormat(release) {
    return this.convertAnimeToFormat(release);
  },

  // Получить эпизод по ID аниме и номеру эпизода (для старого кода)
  async getEpisodeByAnimeAndNumber(animeId, episodeNumber) {
    try {
      const episodes = await this.getAnimeEpisodes(animeId);
      
      if (!episodes || !Array.isArray(episodes)) {
        throw new Error('Эпизоды не найдены');
      }

      // Ищем эпизод по номеру
      const episode = episodes.find(ep => 
        ep.ordinal === parseFloat(episodeNumber) || 
        ep.number === parseInt(episodeNumber) ||
        ep.sort_order === parseInt(episodeNumber)
      );

      if (!episode) {
        throw new Error(`Эпизод ${episodeNumber} не найден`);
      }

      return this.convertEpisodeToFormat(episode);
    } catch (error) {
      throw new Error(`Ошибка получения эпизода ${episodeNumber} для аниме ${animeId}: ${error.message}`);
    }
  },

  // Получить видео для эпизода (обновленный метод)
  async getEpisodeVideo(episodeId, quality = '720') {
    try {
      const episode = await this.getEpisodeById(episodeId);

      if (!episode) {
        throw new Error('Эпизод не найден');
      }

      const videoUrl = this.getVideoUrl(episode, quality);

      if (!videoUrl) {
        throw new Error('Видео URL не найден');
      }

      return {
        url: videoUrl,
        qualities: this.getAvailableQualities(episode),
        type: videoUrl.includes('.m3u8') ? 'hls' : 'video',
        episode: this.convertEpisodeToFormat(episode),
        success: true
      };
    } catch (error) {
      throw new Error(`Ошибка получения видео для эпизода ${episodeId}: ${error.message}`);
    }
  },
};

export default anilibriaV2Service;