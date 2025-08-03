const axios = require('axios');

class AnilibertyService {
  constructor() {
    this.baseURL = process.env.ANILIBERTY_API_BASE || 'https://aniliberty.top/api/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'User-Agent': 'AnimeHub/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Настройка интерцепторов для обработки ошибок
    this.client.interceptors.response.use(
      response => response,
      async error => {
        console.error('AniLiberty API Error:', error.message);
        
        // Логирование для отладки
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Получение популярных аниме
   * @param {number} limit - количество результатов (по умолчанию 10)
   * @returns {Promise<Object>} - список популярных аниме
   */
  async getPopularAnime(limit = 10) {
    try {
      const response = await this.client.get('/releases', {
        params: {
          perPage: limit,
          orderBy: 'popularity',
          sort: 'desc'
        }
      });
      
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error fetching popular anime from AniLiberty:', error);
      return this.handleError('Ошибка получения популярных аниме от AniLiberty API');
    }
  }

  /**
   * Получение новых эпизодов
   * @param {number} limit - количество результатов (по умолчанию 15)
   * @returns {Promise<Object>} - список новых эпизодов
   */
  async getNewEpisodes(limit = 15) {
    try {
      const response = await this.client.get('/releases', {
        params: {
          perPage: limit,
          orderBy: 'updated_at',
          sort: 'desc'
        }
      });
      
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error fetching new episodes from AniLiberty:', error);
      return this.handleError('Ошибка получения новых эпизодов от AniLiberty API');
    }
  }

  /**
   * Получение информации о конкретном аниме
   * @param {number} id - ID аниме
   * @returns {Promise<Object>} - детали аниме
   */
  async getAnimeDetails(id) {
    try {
      const response = await this.client.get(`/releases/${id}`);
      
      return {
        success: true,
        data: response.data || null
      };
    } catch (error) {
      console.error(`Error fetching anime details ${id} from AniLiberty:`, error);
      return this.handleError('Ошибка получения деталей аниме от AniLiberty API');
    }
  }

  /**
   * Получение данных эпизода
   * @param {number} episodeId - ID эпизода
   * @returns {Promise<Object>} - данные эпизода включая видео и субтитры
   */
  async getEpisodeData(episodeId) {
    try {
      const response = await this.client.get(`/episodes/${episodeId}`);
      
      return {
        success: true,
        data: response.data || null
      };
    } catch (error) {
      console.error(`Error fetching episode data ${episodeId} from AniLiberty:`, error);
      return this.handleError('Ошибка получения данных эпизода от AniLiberty API');
    }
  }

  /**
   * Поиск аниме
   * @param {string} query - поисковый запрос
   * @param {number} limit - количество результатов
   * @returns {Promise<Object>} - результаты поиска
   */
  async searchAnime(query, limit = 20) {
    try {
      const response = await this.client.get('/search', {
        params: {
          query: query,
          perPage: limit
        }
      });
      
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error searching anime in AniLiberty:', error);
      return this.handleError('Ошибка поиска в AniLiberty API');
    }
  }

  /**
   * Получение жанров
   * @returns {Promise<Object>} - список жанров
   */
  async getGenres() {
    try {
      const response = await this.client.get('/genres');
      
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching genres from AniLiberty:', error);
      return this.handleError('Ошибка получения жанров от AniLiberty API');
    }
  }

  /**
   * Получение каталога аниме с фильтрацией
   * @param {Object} params - параметры фильтрации
   * @returns {Promise<Object>} - каталог аниме
   */
  async getCatalog(params = {}) {
    try {
      const {
        page = 1,
        perPage = 20,
        genres,
        year,
        season,
        status,
        type,
        orderBy = 'updated_at',
        sort = 'desc'
      } = params;

      const queryParams = {
        page,
        perPage,
        orderBy,
        sort
      };

      if (genres && genres.length > 0) {
        queryParams.genres = Array.isArray(genres) ? genres.join(',') : genres;
      }
      if (year) queryParams.year = year;
      if (season) queryParams.season = season;
      if (status) queryParams.status = status;
      if (type) queryParams.type = type;

      const response = await this.client.get('/catalog', { params: queryParams });
      
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error fetching catalog from AniLiberty:', error);
      return this.handleError('Ошибка получения каталога от AniLiberty API');
    }
  }

  /**
   * Получение расписания релизов
   * @returns {Promise<Object>} - расписание релизов
   */
  async getSchedule() {
    try {
      const response = await this.client.get('/schedule');
      
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching schedule from AniLiberty:', error);
      return this.handleError('Ошибка получения расписания от AniLiberty API');
    }
  }

  /**
   * Конвертация данных AniLiberty в формат нашей модели
   * @param {Object} anilibertyData - данные от AniLiberty
   * @returns {Object} - конвертированные данные
   */
  convertToAnimeModel(anilibertyData) {
    try {
      const {
        id,
        title,
        description,
        type,
        status,
        genres,
        year,
        season,
        poster,
        episodes,
        updated_at,
        rating
      } = anilibertyData;

      return {
        // Внешние идентификаторы
        anilibertyId: id,
        
        // Основная информация
        title: {
          english: title?.en || '',
          japanese: title?.jp || '',
          romaji: title?.romaji || '',
          synonyms: title?.synonyms || []
        },
        
        synopsis: description || '',
        
        // Классификация
        type: type || 'TV',
        status: status || 'Unknown',
        
        // Временные характеристики
        episodes: episodes?.total || 0,
        
        // Даты
        year: year || new Date().getFullYear(),
        season: season || 'Unknown',
        
        // Жанры
        genres: genres || [],
        
        // Изображения
        images: {
          poster: {
            small: poster?.small || null,
            medium: poster?.medium || null,
            large: poster?.large || null
          }
        },
        
        // Рейтинг
        rating: {
          average: rating?.average || 0,
          count: rating?.count || 0
        },
        
        // Метаданные
        source: 'aniliberty',
        lastSynced: new Date(),
        updated_at: updated_at ? new Date(updated_at) : new Date(),
        
        // Кеширование
        cached: true,
        approved: true,
        isActive: true
      };
    } catch (error) {
      console.error('Error converting AniLiberty data:', error);
      throw new Error('Ошибка конвертации данных AniLiberty');
    }
  }

  /**
   * Обработка ошибок
   * @param {string} message - сообщение об ошибке
   * @returns {Object} - объект ошибки
   */
  handleError(message) {
    return {
      success: false,
      error: message,
      data: []
    };
  }

  /**
   * Проверка статуса API
   * @returns {Promise<Object>} - статус API
   */
  async checkStatus() {
    try {
      const response = await this.client.get('/status');
      
      return {
        success: true,
        data: response.data || { status: 'unknown' }
      };
    } catch (error) {
      console.error('Error checking AniLiberty API status:', error);
      return this.handleError('Ошибка проверки статуса AniLiberty API');
    }
  }
}

module.exports = new AnilibertyService();