const axios = require('axios');
const Anime = require('../models/Anime');

class AnilibriaService {
  constructor() {
    // Используем актуальный API AniLibria
    this.baseURL = 'https://api.anilibria.tv/v3';
    this.fallbackURL = 'https://anilibria.tv/api/v3';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'User-Agent': 'AnimeHub/1.0.0',
        'Accept': 'application/json'
      }
    });

    // Настройка интерцепторов для обработки ошибок и fallback
    this.client.interceptors.response.use(
      response => response,
      async error => {
        console.error('AniLibria API Error:', error.message);
        
        // Попробуем fallback URL если основной не работает
        if (error.config && !error.config._retry && this.baseURL !== this.fallbackURL) {
          error.config._retry = true;
          error.config.baseURL = this.fallbackURL;
          console.log('Trying fallback AniLibria API...');
          return this.client.request(error.config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Получение списка тайтлов с фильтрацией
   */
  async getTitles(params = {}) {
    try {
      const {
        page = 1,
        items_per_page = 20,
        search,
        year,
        season,
        genres,
        type,
        status,
        sort = 'id',
        order = 'desc'
      } = params;

      const queryParams = {
        page,
        items_per_page,
        sort_by: sort,
        order_by: order
      };

      if (search) queryParams.search = search;
      if (year) queryParams.year = year;
      if (season) queryParams.season = season;
      if (genres) queryParams.genres = Array.isArray(genres) ? genres.join(',') : genres;
      if (type) queryParams.type = type;
      if (status) queryParams.status = status;

      const response = await this.client.get('/title/updates', { params: queryParams });
      
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error fetching titles from AniLibria:', error);
      throw new Error('Ошибка получения данных от AniLibria API');
    }
  }

  /**
   * Получение информации о конкретном тайтле
   */
  async getTitleById(id) {
    try {
      const response = await this.client.get(`/title`, { params: { id } });
      return response.data;
    } catch (error) {
      console.error(`Error fetching title ${id} from AniLibria:`, error);
      throw new Error('Ошибка получения тайтла от AniLibria API');
    }
  }

  /**
   * Поиск тайтлов
   */
  async searchTitles(query, limit = 20) {
    try {
      const response = await this.client.get('/title/search', {
        params: {
          search: query,
          items_per_page: limit
        }
      });
      return {
        data: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error searching titles in AniLibria:', error);
      throw new Error('Ошибка поиска в AniLibria API');
    }
  }

  /**
   * Получение обновлений (новых релизов)
   */
  async getUpdates(params = {}) {
    try {
      const { items_per_page = 20, page = 1 } = params;
      const response = await this.client.get('/title/updates', {
        params: {
          items_per_page,
          page
        }
      });
      
      // Возвращаем структуру с list вместо data
      return {
        list: response.data?.data || [],
        pagination: response.data?.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error fetching updates from AniLibria:', error);
      throw new Error('Ошибка получения обновлений от AniLibria API');
    }
  }

  /**
   * Получение случайного тайтла
   */
  async getRandomTitle() {
    try {
      const response = await this.client.get('/title/random');
      return response.data;
    } catch (error) {
      console.error('Error fetching random title from AniLibria:', error);
      throw new Error('Ошибка получения случайного тайтла от AniLibria API');
    }
  }

  /**
   * Получение жанров
   */
  async getGenres() {
    try {
      const response = await this.client.get('/genres');
      return response.data;
    } catch (error) {
      console.error('Error fetching genres from AniLibria:', error);
      throw new Error('Ошибка получения жанров от AniLibria API');
    }
  }

  /**
   * Получение популярных тайтлов
   */
  async getPopular(params = {}) {
    try {
      const { items_per_page = 20, page = 1 } = params;
      const result = await this.getTitles({
        page,
        items_per_page,
        sort_by: 'id',
        order_by: 'desc'
      });
      
      // Возвращаем структуру с list вместо data
      return {
        list: result.data || [],
        pagination: result.pagination || { total: 0 }
      };
    } catch (error) {
      console.error('Error fetching popular titles from AniLibria:', error);
      throw new Error('Ошибка получения популярных тайтлов от AniLibria API');
    }
  }

  /**
   * Получение тайтла по коду
   */
  async getTitleByCode(code) {
    try {
      const response = await this.client.get(`/title?code=${code}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching title by code ${code} from AniLibria:`, error);
      throw new Error('Ошибка получения тайтла по коду от AniLibria API');
    }
  }

  /**
   * Получение расписания
   */
  async getSchedule(params = {}) {
    try {
      const { days } = params;
      const queryParams = {};
      if (days) queryParams.days = Array.isArray(days) ? days.join(',') : days;
      
      const response = await this.client.get('/title/schedule', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching schedule from AniLibria:', error);
      throw new Error('Ошибка получения расписания от AniLibria API');
    }
  }

  /**
   * Поиск аниме
   */
  async search(params = {}) {
    try {
      const {
        search: query,
        items_per_page = 20,
        page = 1,
        year,
        season,
        genres,
        type
      } = params;

      const searchParams = {
        page,
        items_per_page
      };

      if (query) searchParams.search = query;
      if (year) searchParams.year = year;
      if (season) searchParams.season = season;
      if (genres) searchParams.genres = Array.isArray(genres) ? genres.join(',') : genres;
      if (type) searchParams.type = type;

      return await this.searchTitles(query, items_per_page);
    } catch (error) {
      console.error('Error searching in AniLibria:', error);
      throw new Error('Ошибка поиска в AniLibria API');
    }
  }

  /**
   * Получение случайных тайтлов
   */
  async getRandom(params = {}) {
    try {
      const { limit = 1 } = params;
      const promises = [];
      for (let i = 0; i < limit; i++) {
        promises.push(this.getRandomTitle());
      }
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error fetching random titles from AniLibria:', error);
      throw new Error('Ошибка получения случайных тайтлов от AniLibria API');
    }
  }

  /**
   * Получение YouTube данных
   */
  async getYouTube(params = {}) {
    try {
      const { limit = 5 } = params;
      const response = await this.client.get('/youtube', {
        params: { items_per_page: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching YouTube data from AniLibria:', error);
      throw new Error('Ошибка получения YouTube данных от AniLibria API');
    }
  }

  /**
   * Получение тайтла по ID (алиас для совместимости)
   */
  async getById(id) {
    return await this.getTitleById(id);
  }

  /**
   * Конвертация данных AniLibria в формат нашей модели
   */
  convertToAnimeModel(anilibriaData) {
    try {
      const {
        id,
        names,
        description,
        type,
        status,
        genres,
        year,
        season,
        posters,
        player,
        torrents,
        updated,
        last_change,
        blocked,
        team
      } = anilibriaData;

      // Определяем статус
      let animeStatus = 'Finished Airing';
      if (status?.string) {
        switch (status.string.toLowerCase()) {
          case 'в работе':
          case 'ongoing':
            animeStatus = 'Currently Airing';
            break;
          case 'завершен':
          case 'completed':
            animeStatus = 'Finished Airing';
            break;
          case 'анонс':
          case 'announced':
            animeStatus = 'Not yet aired';
            break;
        }
      }

      // Определяем тип
      let animeType = 'TV';
      if (type?.string) {
        switch (type.string.toLowerCase()) {
          case 'tv сериал':
          case 'tv':
            animeType = 'TV';
            break;
          case 'фильм':
          case 'movie':
            animeType = 'Movie';
            break;
          case 'ova':
            animeType = 'OVA';
            break;
          case 'ona':
            animeType = 'ONA';
            break;
          case 'спешл':
          case 'special':
            animeType = 'Special';
            break;
        }
      }

      // Формируем объект аниме
      const animeData = {
        // Внешние идентификаторы
        aniLibriaId: id,
        
        // Основная информация
        title: {
          english: names?.en || '',
          japanese: names?.ru || '',
          romaji: names?.alternative || '',
          synonyms: names?.alternative ? [names.alternative] : []
        },
        
        synopsis: description || '',
        
        // Классификация
        type: animeType,
        status: animeStatus,
        
        // Временные характеристики
        episodes: player?.episodes?.last || type?.episodes || 1,
        
        // Даты
        year: year || new Date().getFullYear(),
        season: season?.string || 'Unknown',
        
        // Жанры
        genres: genres || [],
        
        // Изображения
        images: {
          poster: {
            small: posters?.small?.url ? `https://www.anilibria.tv${posters.small.url}` : null,
            medium: posters?.medium?.url ? `https://www.anilibria.tv${posters.medium.url}` : null,
            large: posters?.original?.url ? `https://www.anilibria.tv${posters.original.url}` : null
          }
        },
        
        // Видео контент
        videos: this.convertPlayerData(player),
        
        // Метаданные
        source: 'anilibria',
        lastSynced: {
          anilibria: new Date()
        },
        
        // Кеширование
        cached: true,
        approved: true,
        isActive: !blocked?.copyrights && !blocked?.geoip
      };

      return animeData;
    } catch (error) {
      console.error('Error converting AniLibria data:', error);
      throw new Error('Ошибка конвертации данных AniLibria');
    }
  }

  /**
   * Конвертация данных плеера
   */
  convertPlayerData(player) {
    if (!player || !player.list) return [];

    return Object.entries(player.list).map(([episodeNum, episodeData]) => {
      const episode = {
        episode: parseInt(episodeNum),
        title: episodeData.name || `Эпизод ${episodeNum}`,
        sources: [],
        subtitles: [],
        thumbnail: episodeData.preview ? `https://www.anilibria.tv${episodeData.preview}` : null
      };

      // Добавляем источники видео
      if (episodeData.hls) {
        Object.entries(episodeData.hls).forEach(([quality, url]) => {
          episode.sources.push({
            quality: quality === 'fhd' ? '1080p' : quality === 'hd' ? '720p' : '480p',
            url: `https://www.anilibria.tv${url}`,
            player: 'hls'
          });
        });
      }

      return episode;
    });
  }

  /**
   * Синхронизация аниме с AniLibria
   */
  async syncAnime(anilibriaId) {
    try {
      const anilibriaData = await this.getTitleById(anilibriaId);
      const animeData = this.convertToAnimeModel(anilibriaData);

      // Проверяем, существует ли уже такое аниме
      let anime = await Anime.findOne({ aniLibriaId: anilibriaId });

      if (anime) {
        // Обновляем существующее аниме
        Object.assign(anime, animeData);
        anime.lastUpdated = new Date();
        await anime.save();
      } else {
        // Создаем новое аниме
        anime = new Anime(animeData);
        await anime.save();
      }

      return anime;
    } catch (error) {
      console.error(`Error syncing anime ${anilibriaId}:`, error);
      throw error;
    }
  }

  /**
   * Массовая синхронизация популярных тайтлов
   */
  async syncPopularTitles(limit = 50) {
    try {
      const titles = await this.getTitles({
        items_per_page: limit,
        sort_by: 'id',
        order_by: 'desc'
      });

      const syncPromises = titles.data?.map(title => 
        this.syncAnime(title.id).catch(error => {
          console.error(`Failed to sync title ${title.id}:`, error);
          return null;
        })
      ) || [];

      const results = await Promise.allSettled(syncPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;

      console.log(`Synced ${successful} out of ${titles.data?.length || 0} titles`);
      return { successful, total: titles.data?.length || 0 };
    } catch (error) {
      console.error('Error in bulk sync:', error);
      throw error;
    }
  }

  /**
   * Поиск с fallback на локальные данные
   */
  async searchWithFallback(query, limit = 20) {
    try {
      // Сначала пытаемся найти в AniLibria
      const anilibriaResults = await this.searchTitles(query, limit);
      
      if (anilibriaResults.data && anilibriaResults.data.length > 0) {
        // Конвертируем результаты
        const convertedResults = anilibriaResults.data.map(title => 
          this.convertToAnimeModel(title)
        );
        
        return {
          source: 'anilibria',
          data: convertedResults,
          total: anilibriaResults.pagination?.total || convertedResults.length
        };
      }
    } catch (error) {
      console.warn('AniLibria search failed, falling back to local data:', error);
    }

    // Fallback на локальные данные
    try {
      const localResults = await Anime.searchByTitle(query, { limit });
      return {
        source: 'local',
        data: localResults,
        total: localResults.length
      };
    } catch (error) {
      console.error('Local search also failed:', error);
      return {
        source: 'none',
        data: [],
        total: 0
      };
    }
  }

  /**
   * Массовый импорт популярных аниме из AniLibria
   */
  async importPopularAnime(limit = 50) {
    const url = 'https://api.anilibria.tv/v3/title/search';
    const params = {
      limit,
      order: 'popularity',
      filter: ['id', 'names', 'description', 'genres', 'year', 'type', 'status', 'posters', 'player'],
    };
    const response = await axios.get(url, { params });
    const titles = response.data.list || [];
    let imported = 0;
    for (const title of titles) {
      const exists = await Anime.findOne({ aniLibriaId: title.id });
      if (!exists) {
        await Anime.create({
          aniLibriaId: title.id,
          title: {
            english: title.names?.en || '',
            japanese: '',
            romaji: '',
            synonyms: [title.names?.ru || '', title.names?.alternative || ''].filter(Boolean),
          },
          synopsis: title.description || '',
          type: title.type?.string || 'TV',
          status: title.status?.string || 'Finished Airing',
          year: title.year,
          genres: title.genres || [],
          images: {
            poster: {
              medium: title.posters?.medium?.url
                ? `https://www.anilibria.tv${title.posters.medium.url}`
                : undefined,
            },
          },
          isActive: true,
          approved: true,
        });
        imported++;
      }
    }
    return imported;
  }
}

module.exports = new AnilibriaService();