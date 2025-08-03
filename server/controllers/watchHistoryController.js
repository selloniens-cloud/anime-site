const WatchHistory = require('../models/WatchHistory');
const Anime = require('../models/Anime');
const { createError } = require('../utils/errorUtils');
const { validationResult } = require('express-validator');

const watchHistoryController = {
  // GET /api/watch-history - Получение истории просмотра
  getWatchHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { 
        animeId, 
        status, 
        dateFrom, 
        dateTo,
        limit = 50, 
        page = 1,
        sort = '-lastWatchedAt'
      } = req.query;
      
      const skip = (page - 1) * parseInt(limit);
      const options = {
        animeId,
        status,
        dateFrom,
        dateTo,
        limit: parseInt(limit),
        skip,
        sort: sort === '-lastWatchedAt' ? { lastWatchedAt: -1 } :
              sort === '-startedAt' ? { startedAt: -1 } :
              sort === 'episodeNumber' ? { episodeNumber: 1 } :
              { lastWatchedAt: -1 }
      };
      
      const history = await WatchHistory.getUserHistory(userId, options);
      
      // Подсчет общего количества
      const countQuery = { userId };
      if (animeId) countQuery.animeId = animeId;
      if (status) countQuery.status = status;
      if (dateFrom || dateTo) {
        countQuery.lastWatchedAt = {};
        if (dateFrom) countQuery.lastWatchedAt.$gte = new Date(dateFrom);
        if (dateTo) countQuery.lastWatchedAt.$lte = new Date(dateTo);
      }
      
      const total = await WatchHistory.countDocuments(countQuery);
      
      res.json({
        success: true,
        data: history,
        pagination: {
          total,
          page: parseInt(page),
          perPage: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/watch-history - Создание/обновление записи просмотра
  addWatchHistory: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError('Ошибки валидации', 400, errors.array()));
      }
      
      const userId = req.user.id;
      const {
        animeId,
        episodeId,
        episodeNumber,
        episodeTitle,
        watchedTime = 0,
        totalTime,
        quality = '720p',
        audioLanguage = 'japanese',
        subtitleLanguage = 'russian',
        device = 'unknown',
        sessionId
      } = req.body;
      
      // Проверяем существование аниме
      const anime = await Anime.findById(animeId);
      if (!anime) {
        return next(createError('Аниме не найдено', 404));
      }
      
      // Ищем существующую запись
      let watchHistory = await WatchHistory.findOne({ userId, animeId, episodeId });
      
      if (watchHistory) {
        // Обновляем существующую запись
        watchHistory.watchedTime = Math.max(watchHistory.watchedTime, watchedTime);
        watchHistory.quality = quality;
        watchHistory.audioLanguage = audioLanguage;
        watchHistory.subtitleLanguage = subtitleLanguage;
        watchHistory.device = device;
        if (sessionId) watchHistory.sessionId = sessionId;
        
        // Обновляем статус на основе прогресса
        if (watchHistory.progressPercent >= 90) {
          watchHistory.status = 'completed';
        } else if (watchHistory.progressPercent > 5) {
          watchHistory.status = 'watching';
        }
        
        await watchHistory.save();
      } else {
        // Создаем новую запись
        const historyData = {
          userId,
          animeId,
          episodeId,
          episodeNumber,
          episodeTitle,
          watchedTime,
          totalTime,
          quality,
          audioLanguage,
          subtitleLanguage,
          device,
          sessionId,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          status: watchedTime > 0 ? 'started' : 'started'
        };
        
        watchHistory = new WatchHistory(historyData);
        await watchHistory.save();
      }
      
      await watchHistory.populate('anime', 'title images episodes year');
      
      res.status(watchHistory.isNew ? 201 : 200).json({
        success: true,
        message: watchHistory.isNew ? 'Запись истории создана' : 'Запись истории обновлена',
        data: watchHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/watch-history/:id/progress - Обновление прогресса
  updateProgress: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError('Ошибки валидации', 400, errors.array()));
      }
      
      const userId = req.user.id;
      const { id } = req.params;
      const { watchedTime, status } = req.body;
      
      const watchHistory = await WatchHistory.findOne({ _id: id, userId });
      if (!watchHistory) {
        return next(createError('Запись истории не найдена', 404));
      }
      
      await watchHistory.updateProgress(watchedTime, status);
      await watchHistory.populate('anime', 'title images episodes');
      
      res.json({
        success: true,
        message: 'Прогресс обновлен',
        data: watchHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/watch-history/recent - Недавно просмотренные
  getRecentlyWatched: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;
      
      const history = await WatchHistory.getRecentlyWatched(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/watch-history/continue - Продолжить просмотр
  getContinueWatching: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
      
      const history = await WatchHistory.getContinueWatching(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/watch-history/stats - Статистика просмотра
  getWatchStats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const stats = await WatchHistory.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/watch-history/pattern - Паттерн просмотра
  getWatchingPattern: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { days = 30 } = req.query;
      
      const pattern = await WatchHistory.getWatchingPattern(userId, parseInt(days));
      
      res.json({
        success: true,
        data: pattern
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/watch-history/:id/rating - Установка рейтинга эпизода
  setEpisodeRating: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
        return next(createError('Рейтинг должен быть целым числом от 1 до 10', 400));
      }
      
      const watchHistory = await WatchHistory.findOne({ _id: id, userId });
      if (!watchHistory) {
        return next(createError('Запись истории не найдена', 404));
      }
      
      await watchHistory.setRating(rating);
      await watchHistory.populate('anime', 'title images');
      
      res.json({
        success: true,
        message: 'Рейтинг установлен',
        data: watchHistory
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/watch-history/:id/pause - Регистрация паузы
  registerPause: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const watchHistory = await WatchHistory.findOne({ _id: id, userId });
      if (!watchHistory) {
        return next(createError('Запись истории не найдена', 404));
      }
      
      await watchHistory.addPause();
      
      res.json({
        success: true,
        message: 'Пауза зарегистрирована'
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/watch-history/:id/seek - Регистрация перемотки
  registerSeek: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const watchHistory = await WatchHistory.findOne({ _id: id, userId });
      if (!watchHistory) {
        return next(createError('Запись истории не найдена', 404));
      }
      
      await watchHistory.addSeek();
      
      res.json({
        success: true,
        message: 'Перемотка зарегистрирована'
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/watch-history/anime/:animeId - История просмотра конкретного аниме
  getAnimeHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { animeId } = req.params;
      const { limit = 50, page = 1 } = req.query;
      
      const skip = (page - 1) * parseInt(limit);
      const options = {
        animeId,
        limit: parseInt(limit),
        skip,
        sort: { episodeNumber: 1 }
      };
      
      const history = await WatchHistory.getUserHistory(userId, options);
      
      const total = await WatchHistory.countDocuments({ userId, animeId });
      
      res.json({
        success: true,
        data: history,
        pagination: {
          total,
          page: parseInt(page),
          perPage: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/watch-history/:id - Удаление записи истории
  deleteHistoryEntry: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const watchHistory = await WatchHistory.findOneAndDelete({ _id: id, userId });
      if (!watchHistory) {
        return next(createError('Запись истории не найдена', 404));
      }
      
      res.json({
        success: true,
        message: 'Запись истории удалена'
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/watch-history/clear - Очистка истории
  clearHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { animeId, olderThan } = req.body;
      
      const deleteQuery = { userId };
      
      if (animeId) {
        deleteQuery.animeId = animeId;
      }
      
      if (olderThan) {
        deleteQuery.lastWatchedAt = { $lt: new Date(olderThan) };
      }
      
      const result = await WatchHistory.deleteMany(deleteQuery);
      
      res.json({
        success: true,
        message: `Удалено записей истории: ${result.deletedCount}`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/watch-history/export - Экспорт истории
  exportHistory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const history = await WatchHistory.find({ userId })
        .populate('anime', 'title images episodes year')
        .sort({ lastWatchedAt: -1 });
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        totalEntries: history.length,
        history: history.map(entry => ({
          anime: {
            title: entry.anime.title,
            year: entry.anime.year,
            episodes: entry.anime.episodes
          },
          episodeNumber: entry.episodeNumber,
          episodeTitle: entry.episodeTitle,
          watchedTime: entry.watchedTime,
          totalTime: entry.totalTime,
          progressPercent: entry.progressPercent,
          status: entry.status,
          quality: entry.quality,
          rating: entry.rating,
          startedAt: entry.startedAt,
          lastWatchedAt: entry.lastWatchedAt,
          completedAt: entry.completedAt
        }))
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=watch-history-export.json');
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = watchHistoryController;