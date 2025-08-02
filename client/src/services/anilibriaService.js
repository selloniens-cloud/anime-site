import api from './api';

class AnilibriaService {
  constructor() {
    this.baseURL = '/api/anilibria';
  }

  /**
   * Получение списка аниме из AniLibria с фильтрацией
   */
  async getTitles(params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/titles`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения списка аниме из AniLibria');
    }
  }

  /**
   * Получение информации о конкретном тайтле
   */
  async getTitleById(id) {
    try {
      const response = await api.get(`${this.baseURL}/titles/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения аниме из AniLibria');
    }
  }

  /**
   * Поиск аниме в AniLibria
   */
  async searchTitles(query, params = {}) {
    try {
      const searchParams = { search: query, ...params };
      const response = await api.get(`${this.baseURL}/search`, { params: searchParams });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка поиска в AniLibria');
    }
  }

  /**
   * Получение обновлений (новых релизов)
   */
  async getUpdates(limit = 20) {
    try {
      const response = await api.get(`${this.baseURL}/updates`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения обновлений из AniLibria');
    }
  }

  /**
   * Получение популярных аниме из AniLibria
   */
  async getPopular(limit = 20) {
    try {
      const response = await api.get(`${this.baseURL}/popular`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения популярных аниме из AniLibria');
    }
  }

  /**
   * Получение случайного аниме
   */
  async getRandomTitle() {
    try {
      const response = await api.get(`${this.baseURL}/random`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения случайного аниме из AniLibria');
    }
  }

  /**
   * Получение жанров из AniLibria
   */
  async getGenres() {
    try {
      const response = await api.get(`${this.baseURL}/genres`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения жанров из AniLibria');
    }
  }

  /**
   * Синхронизация аниме с AniLibria
   */
  async syncTitle(anilibriaId) {
    try {
      const response = await api.post(`${this.baseURL}/sync/${anilibriaId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка синхронизации с AniLibria');
    }
  }

  /**
   * Массовая синхронизация популярных тайтлов
   */
  async syncPopularTitles(limit = 50) {
    try {
      const response = await api.post(`${this.baseURL}/sync/popular`, {
        limit,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка массовой синхронизации с AniLibria');
    }
  }

  /**
   * Поиск с fallback на локальные данные
   */
  async searchWithFallback(query, params = {}) {
    try {
      const response = await api.get(`${this.baseURL}/search/fallback`, {
        params: { query, ...params },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка поиска с fallback');
    }
  }

  /**
   * Получение статистики синхронизации
   */
  async getSyncStats() {
    try {
      const response = await api.get(`${this.baseURL}/sync/stats`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения статистики синхронизации');
    }
  }

  /**
   * Проверка доступности AniLibria API
   */
  async checkApiStatus() {
    try {
      const response = await api.get(`${this.baseURL}/status`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        available: false,
        error: error.response?.data?.message || 'AniLibria API недоступен',
      };
    }
  }

  /**
   * Получение информации о релизе по коду
   */
  async getTitleByCode(code) {
    try {
      const response = await api.get(`${this.baseURL}/titles/code/${code}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения аниме по коду');
    }
  }

  /**
   * Получение расписания релизов
   */
  async getSchedule() {
    try {
      const response = await api.get(`${this.baseURL}/schedule`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения расписания релизов');
    }
  }

  /**
   * Получение информации о команде переводчиков
   */
  async getTeam(teamId) {
    try {
      const response = await api.get(`${this.baseURL}/team/${teamId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения информации о команде');
    }
  }

  /**
   * Получение франшизы
   */
  async getFranchise(franchiseId) {
    try {
      const response = await api.get(`${this.baseURL}/franchise/${franchiseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения франшизы');
    }
  }

  /**
   * Получение списка лет
   */
  async getYears() {
    try {
      const response = await api.get(`${this.baseURL}/years`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения списка лет');
    }
  }

  /**
   * Получение списка сезонов
   */
  async getSeasons() {
    try {
      const response = await api.get(`${this.baseURL}/seasons`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Ошибка получения списка сезонов');
    }
  }

  /**
   * Утилита для форматирования данных аниме
   */
  formatAnimeData(anilibriaData) {
    if (!anilibriaData) return null;

    return {
      id: anilibriaData.id,
      title: {
        ru: anilibriaData.names?.ru || '',
        en: anilibriaData.names?.en || '',
        alternative: anilibriaData.names?.alternative || '',
      },
      description: anilibriaData.description || '',
      poster: anilibriaData.poster?.src ? `https://www.anilibria.tv${anilibriaData.poster.src}` : null,
      year: anilibriaData.year,
      season: anilibriaData.season?.string || '',
      type: anilibriaData.type?.string || '',
      status: anilibriaData.status?.string || '',
      genres: anilibriaData.genres?.map(g => g.name) || [],
      episodes: anilibriaData.player?.episodes?.last || 0,
      rating: anilibriaData.rating || 0,
      updated: anilibriaData.updated,
      blocked: anilibriaData.blocked?.blocked || false,
      team: anilibriaData.team || {},
      player: anilibriaData.player || {},
    };
  }

  /**
   * Утилита для получения URL постера
   */
  getPosterUrl(poster) {
    if (!poster?.src) return null;

    const baseUrl = 'https://www.anilibria.tv';
    return `${baseUrl}${poster.src}`;
  }

  /**
   * Утилита для получения URL видео
   */
  getVideoUrl(player, episode, quality = '720p') {
    if (!player?.list?.[episode]?.hls) return null;

    const baseUrl = 'https://www.anilibria.tv';
    const episodeData = player.list[episode];
    const videoPath = episodeData.hls[quality.replace('p', '')] ||
                     Object.values(episodeData.hls)[0];

    return videoPath ? `${baseUrl}${videoPath}` : null;
  }

  /**
   * Утилита для проверки доступности эпизода
   */
  isEpisodeAvailable(player, episode) {
    return !!(player?.list?.[episode]?.hls &&
             Object.keys(player.list[episode].hls).length > 0);
  }

  /**
   * Утилита для получения списка доступных качеств
   */
  getAvailableQualities(player, episode) {
    if (!player?.list?.[episode]?.hls) return [];

    return Object.keys(player.list[episode].hls).map(q => `${q}p`);
  }
}

const anilibriaService = new AnilibriaService();

export default anilibriaService;
export { anilibriaService };
