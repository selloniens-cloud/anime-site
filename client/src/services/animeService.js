import api from './api';

export const animeService = {
  // Получение списка аниме с фильтрацией и пагинацией
  async getAnimeList(params = {}) {
    try {
      const response = await api.get('/api/anime', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения списка аниме');
    }
  },

  // Получение аниме по ID
  async getAnimeById(id) {
    try {
      const response = await api.get(`/api/anime/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения аниме');
    }
  },

  // Поиск аниме
  async searchAnime(query, filters = {}) {
    try {
      const params = { search: query, ...filters };
      const response = await api.get('/api/anime/search', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка поиска аниме');
    }
  },

  // Получение популярных аниме
  async getPopularAnime(limit = 10) {
    try {
      const response = await api.get('/api/anime/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения популярных аниме');
    }
  },

  // Получение новых аниме
  async getLatestAnime(limit = 10) {
    try {
      const response = await api.get('/api/anime/latest', { params: { limit } });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения новых аниме');
    }
  },

  // Получение рекомендаций
  async getRecommendations(userId, limit = 10) {
    try {
      const response = await api.get('/api/anime/recommendations', {
        params: { userId, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения рекомендаций');
    }
  },

  // Получение жанров
  async getGenres() {
    try {
      const response = await api.get('/api/anime/genres');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения жанров');
    }
  },

  // Получение эпизодов аниме
  async getAnimeEpisodes(animeId) {
    try {
      const response = await api.get(`/api/anime/${animeId}/episodes`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения эпизодов');
    }
  },

  // Получение эпизода по ID
  async getEpisodeById(animeId, episodeId) {
    try {
      const response = await api.get(`/api/anime/${animeId}/episodes/${episodeId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения эпизода');
    }
  },

  // Оценка аниме
  async rateAnime(animeId, rating) {
    try {
      const response = await api.post(`/api/anime/${animeId}/rate`, { rating });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка оценки аниме');
    }
  },

  // Добавление в избранное
  async toggleFavorite(animeId) {
    try {
      const response = await api.post(`/api/anime/${animeId}/favorite`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка добавления в избранное');
    }
  },

  // Отметка просмотра эпизода
  async markEpisodeWatched(animeId, episodeId) {
    try {
      const response = await api.post(`/api/anime/${animeId}/episodes/${episodeId}/watched`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка отметки просмотра');
    }
  },

  // Получение статистики просмотра
  async getWatchStats(animeId) {
    try {
      const response = await api.get(`/api/anime/${animeId}/stats`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения статистики');
    }
  },

  // Создание аниме (для админов)
  async createAnime(animeData) {
    try {
      const response = await api.post('/api/anime', animeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка создания аниме');
    }
  },

  // Обновление аниме (для админов)
  async updateAnime(id, animeData) {
    try {
      const response = await api.put(`/api/anime/${id}`, animeData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка обновления аниме');
    }
  },

  // Удаление аниме (для админов)
  async deleteAnime(id) {
    try {
      const response = await api.delete(`/api/anime/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка удаления аниме');
    }
  },

  // Загрузка постера
  async uploadPoster(animeId, formData) {
    try {
      const response = await api.post(`/api/anime/${animeId}/poster`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка загрузки постера');
    }
  },
};
