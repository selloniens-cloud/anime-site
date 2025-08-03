const AnimeLiberty = require('../models/AnimeLiberty');
const anilibertyService = require('../services/anilibertyService');

class AnilibertyController {
  /**
   * Получение популярных аниме
   */
  async getPopularAnime(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      
      // Сначала пытаемся получить из локальной базы данных
      console.log('Fetching popular anime from cache...');
      const cachedAnime = await AnimeLiberty.getPopular(limit);
      console.log('Cached anime count:', cachedAnime ? cachedAnime.length : 0);
      
      if (cachedAnime && cachedAnime.length > 0) {
        return res.json({
          success: true,
          data: cachedAnime,
          source: 'cache',
          pagination: {
            total: cachedAnime.length,
            page: 1,
            perPage: limit
          }
        });
      }
      
      // Если кеша нет, пытаемся получить от AniLiberty API
      console.log('Fetching from AniLiberty API...');
      const result = await anilibertyService.getPopularAnime(limit);
      console.log('API result:', result);
      
      if (result.success && result.data && result.data.length > 0) {
        // Сохраняем в кеш
        const savedAnime = await this.cacheAnimeList(result.data);
        
        return res.json({
          success: true,
          data: savedAnime,
          source: 'api',
          pagination: result.pagination
        });
      }
      
      // Возвращаем пустой массив, если данных нет
      return res.json({
        success: true,
        data: [],
        source: 'empty',
        message: 'Нет доступных данных',
        pagination: {
          total: 0,
          page: 1,
          perPage: limit
        }
      });
      
    } catch (error) {
      console.error('Error in getPopularAnime:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка получения популярных аниме'
      });
    }
  }
  
  /**
   * Получение новых эпизодов
   */
  async getNewEpisodes(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 15;
      
      // Сначала пытаемся получить из локальной базы данных
      const cachedAnime = await AnimeLiberty.getNewEpisodes(limit);
      
      if (cachedAnime && cachedAnime.length > 0) {
        return res.json({
          success: true,
          data: cachedAnime,
          source: 'cache',
          pagination: {
            total: cachedAnime.length,
            page: 1,
            perPage: limit
          }
        });
      }
      
      // Если кеша нет, пытаемся получить от AniLiberty API
      const result = await anilibertyService.getNewEpisodes(limit);
      
      if (result.success && result.data.length > 0) {
        // Сохраняем в кеш
        const savedAnime = await this.cacheAnimeList(result.data);
        
        return res.json({
          success: true,
          data: savedAnime,
          source: 'api',
          pagination: result.pagination
        });
      }
      
      // Возвращаем ошибку если не удалось получить данные
      return res.status(500).json({
        success: false,
        error: result.error || 'Не удалось получить новые эпизоды',
        message: 'Попробуйте позже'
      });
      
    } catch (error) {
      console.error('Error in getNewEpisodes:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка получения новых эпизодов'
      });
    }
  }
  
  /**
   * Получение деталей аниме
   */
  async getAnimeDetails(req, res) {
    try {
      const { id } = req.params;
      const anilibertyId = parseInt(id);
      
      if (!anilibertyId || isNaN(anilibertyId)) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный ID аниме',
          message: 'ID аниме должен быть числом'
        });
      }
      
      // Сначала ищем в локальной базе данных
      let anime = await AnimeLiberty.findByAnilibertyId(anilibertyId);
      
      if (anime) {
        return res.json({
          success: true,
          data: anime,
          source: 'cache'
        });
      }
      
      // Если не найдено в кеше, запрашиваем у AniLiberty API
      const result = await anilibertyService.getAnimeDetails(anilibertyId);
      
      if (result.success && result.data) {
        // Конвертируем и сохраняем в кеш
        const convertedData = anilibertyService.convertToAnimeModel(result.data);
        anime = new AnimeLiberty(convertedData);
        await anime.save();
        
        return res.json({
          success: true,
          data: anime,
          source: 'api'
        });
      }
      
      return res.status(404).json({
        success: false,
        error: result.error || 'Аниме не найдено',
        message: 'Аниме с указанным ID не существует'
      });
      
    } catch (error) {
      console.error('Error in getAnimeDetails:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка получения деталей аниме'
      });
    }
  }
  
  /**
   * Получение данных эпизода
   */
  async getEpisodeData(req, res) {
    try {
      const { id } = req.params;
      const episodeId = parseInt(id);
      
      if (!episodeId || isNaN(episodeId)) {
        return res.status(400).json({
          success: false,
          error: 'Некорректный ID эпизода',
          message: 'ID эпизода должен быть числом'
        });
      }
      
      // Запрашиваем данные эпизода у AniLiberty API
      const result = await anilibertyService.getEpisodeData(episodeId);
      
      if (result.success && result.data) {
        return res.json({
          success: true,
          data: result.data
        });
      }
      
      return res.status(404).json({
        success: false,
        error: result.error || 'Эпизод не найден',
        message: 'Эпизод с указанным ID не существует'
      });
      
    } catch (error) {
      console.error('Error in getEpisodeData:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка получения данных эпизода'
      });
    }
  }
  
  /**
   * Поиск аниме
   */
  async searchAnime(req, res) {
    try {
      const { query, limit } = req.query;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Поисковый запрос не может быть пустым',
          message: 'Введите название аниме для поиска'
        });
      }
      
      const searchLimit = parseInt(limit) || 20;
      
      // Сначала ищем в локальной базе данных
      const cachedResults = await AnimeLiberty.searchByTitle(query.trim(), { limit: searchLimit });
      
      if (cachedResults && cachedResults.length > 0) {
        return res.json({
          success: true,
          data: cachedResults,
          source: 'cache',
          pagination: {
            total: cachedResults.length,
            page: 1,
            perPage: searchLimit
          }
        });
      }
      
      // Если в кеше ничего не найдено, ищем через API
      const result = await anilibertyService.searchAnime(query.trim(), searchLimit);
      
      if (result.success && result.data.length > 0) {
        // Сохраняем результаты в кеш
        const savedAnime = await this.cacheAnimeList(result.data);
        
        return res.json({
          success: true,
          data: savedAnime,
          source: 'api',
          pagination: result.pagination
        });
      }
      
      return res.json({
        success: true,
        data: [],
        message: 'По вашему запросу ничего не найдено',
        pagination: {
          total: 0,
          page: 1,
          perPage: searchLimit
        }
      });
      
    } catch (error) {
      console.error('Error in searchAnime:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка поиска аниме'
      });
    }
  }
  
  /**
   * Получение каталога аниме
   */
  async getCatalog(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        genres,
        year,
        season,
        status,
        type,
        orderBy = 'updated_at',
        sort = 'desc'
      } = req.query;
      
      const options = {
        page: parseInt(page),
        perPage: parseInt(limit),
        sort: { [orderBy]: sort === 'asc' ? 1 : -1 }
      };
      
      if (genres) {
        options.genres = genres.split(',').map(g => g.trim()).filter(Boolean);
      }
      if (year) options.year = parseInt(year);
      if (season) options.season = season;
      if (status) options.status = status;
      if (type) options.type = type;
      
      // Получаем из локальной базы данных
      const catalogAnime = await AnimeLiberty.getCatalog(options);
      
      // Подсчитываем общее количество для пагинации
      const totalQuery = { isActive: true, approved: true };
      if (options.genres) totalQuery.genres = { $in: options.genres };
      if (options.year) totalQuery.year = options.year;
      if (options.season) totalQuery.season = options.season;
      if (options.status) totalQuery.status = options.status;
      if (options.type) totalQuery.type = options.type;
      
      const total = await AnimeLiberty.countDocuments(totalQuery);
      
      return res.json({
        success: true,
        data: catalogAnime,
        source: 'cache',
        pagination: {
          total,
          page: parseInt(page),
          perPage: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
      
    } catch (error) {
      console.error('Error in getCatalog:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка получения каталога'
      });
    }
  }
  
  /**
   * Получение жанров
   */
  async getGenres(req, res) {
    try {
      // Сначала пытаемся получить уникальные жанры из локальной базы
      const localGenres = await AnimeLiberty.distinct('genres', { isActive: true });
      
      if (localGenres && localGenres.length > 0) {
        return res.json({
          success: true,
          data: localGenres.sort(),
          source: 'cache'
        });
      }
      
      // Если локальных жанров нет, запрашиваем у API
      const result = await anilibertyService.getGenres();
      
      if (result.success) {
        return res.json({
          success: true,
          data: result.data,
          source: 'api'
        });
      }
      
      return res.status(500).json({
        success: false,
        error: result.error || 'Не удалось получить жанры',
        message: 'Попробуйте позже'
      });
      
    } catch (error) {
      console.error('Error in getGenres:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка получения жанров'
      });
    }
  }
  
  /**
   * Вспомогательный метод для кеширования списка аниме
   */
  async cacheAnimeList(animeList) {
    const savedAnime = [];
    
    for (const animeData of animeList) {
      try {
        const convertedData = anilibertyService.convertToAnimeModel(animeData);
        
        // Проверяем, существует ли уже такое аниме
        let existingAnime = await AnimeLiberty.findByAnilibertyId(convertedData.anilibertyId);
        
        if (existingAnime) {
          // Обновляем существующее аниме
          Object.assign(existingAnime, convertedData);
          existingAnime.lastSynced = new Date();
          await existingAnime.save();
          savedAnime.push(existingAnime);
        } else {
          // Создаем новое аниме
          const newAnime = new AnimeLiberty(convertedData);
          await newAnime.save();
          savedAnime.push(newAnime);
        }
      } catch (error) {
        console.error('Error caching anime:', error);
        // Пропускаем проблемные записи, но продолжаем обработку
      }
    }
    
    return savedAnime;
  }
  
  /**
   * Синхронизация данных с AniLiberty API
   */
  async syncWithAPI(req, res) {
    try {
      const { type = 'popular', limit = 50 } = req.query;
      
      let result;
      
      switch (type) {
        case 'popular':
          result = await anilibertyService.getPopularAnime(parseInt(limit));
          break;
        case 'new-episodes':
          result = await anilibertyService.getNewEpisodes(parseInt(limit));
          break;
        default:
          return res.status(400).json({
            success: false,
            error: 'Неподдерживаемый тип синхронизации',
            message: 'Доступные типы: popular, new-episodes'
          });
      }
      
      if (result.success && result.data.length > 0) {
        const syncedAnime = await this.cacheAnimeList(result.data);
        
        return res.json({
          success: true,
          message: `Синхронизировано ${syncedAnime.length} аниме`,
          data: {
            synced: syncedAnime.length,
            type: type
          }
        });
      }
      
      return res.status(500).json({
        success: false,
        error: result.error || 'Ошибка синхронизации',
        message: 'Не удалось синхронизировать данные'
      });
      
    } catch (error) {
      console.error('Error in syncWithAPI:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера',
        message: 'Ошибка синхронизации с API'
      });
    }
  }
}

module.exports = new AnilibertyController();