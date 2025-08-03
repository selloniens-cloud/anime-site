const express = require('express');
const router = express.Router();
const watchHistoryController = require('../controllers/watchHistoryController');
const { authenticate } = require('../middleware/auth');
const { validate, validateParams, paramSchemas } = require('../middleware/validation');
const { body } = require('express-validator');

// Схемы валидации для истории просмотра
const watchHistorySchemas = {
  addWatchHistory: [
    body('animeId')
      .notEmpty()
      .isMongoId()
      .withMessage('Некорректный ID аниме'),
    body('episodeId')
      .notEmpty()
      .isString()
      .withMessage('ID эпизода обязателен'),
    body('episodeNumber')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Номер эпизода должен быть положительным числом'),
    body('episodeTitle')
      .optional()
      .isString()
      .trim()
      .withMessage('Название эпизода должно быть строкой'),
    body('watchedTime')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Время просмотра не может быть отрицательным'),
    body('totalTime')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Общая длительность должна быть положительным числом'),
    body('quality')
      .optional()
      .isIn(['360p', '480p', '720p', '1080p', '1440p', '2160p'])
      .withMessage('Некорректное качество видео'),
    body('audioLanguage')
      .optional()
      .isString()
      .withMessage('Язык озвучки должен быть строкой'),
    body('subtitleLanguage')
      .optional()
      .isString()
      .withMessage('Язык субтитров должен быть строкой'),
    body('device')
      .optional()
      .isIn(['desktop', 'mobile', 'tablet', 'tv', 'unknown'])
      .withMessage('Некорректный тип устройства'),
    body('sessionId')
      .optional()
      .isString()
      .withMessage('ID сессии должен быть строкой')
  ],
  
  updateProgress: [
    body('watchedTime')
      .notEmpty()
      .isInt({ min: 0 })
      .withMessage('Время просмотра должно быть положительным числом'),
    body('status')
      .optional()
      .isIn(['started', 'watching', 'paused', 'completed', 'skipped'])
      .withMessage('Некорректный статус просмотра')
  ],
  
  setRating: [
    body('rating')
      .notEmpty()
      .isInt({ min: 1, max: 10 })
      .withMessage('Рейтинг должен быть числом от 1 до 10')
  ],
  
  clearHistory: [
    body('animeId')
      .optional()
      .isMongoId()
      .withMessage('Некорректный ID аниме'),
    body('olderThan')
      .optional()
      .isISO8601()
      .withMessage('Дата должна быть в формате ISO 8601')
  ]
};

// GET /api/watch-history - Получение истории просмотра
router.get('/', authenticate, watchHistoryController.getWatchHistory);

// POST /api/watch-history - Создание/обновление записи просмотра
router.post('/',
  authenticate,
  validate(watchHistorySchemas.addWatchHistory),
  watchHistoryController.addWatchHistory
);

// PUT /api/watch-history/:id/progress - Обновление прогресса
router.put('/:id/progress',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(watchHistorySchemas.updateProgress),
  watchHistoryController.updateProgress
);

// GET /api/watch-history/recent - Недавно просмотренные
router.get('/recent', authenticate, watchHistoryController.getRecentlyWatched);

// GET /api/watch-history/continue - Продолжить просмотр
router.get('/continue', authenticate, watchHistoryController.getContinueWatching);

// GET /api/watch-history/stats - Статистика просмотра
router.get('/stats', authenticate, watchHistoryController.getWatchStats);

// GET /api/watch-history/pattern - Паттерн просмотра
router.get('/pattern', authenticate, watchHistoryController.getWatchingPattern);

// POST /api/watch-history/:id/rating - Установка рейтинга эпизода
router.post('/:id/rating',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(watchHistorySchemas.setRating),
  watchHistoryController.setEpisodeRating
);

// POST /api/watch-history/:id/pause - Регистрация паузы
router.post('/:id/pause',
  authenticate,
  validateParams(paramSchemas.objectId),
  watchHistoryController.registerPause
);

// POST /api/watch-history/:id/seek - Регистрация перемотки
router.post('/:id/seek',
  authenticate,
  validateParams(paramSchemas.objectId),
  watchHistoryController.registerSeek
);

// GET /api/watch-history/anime/:animeId - История просмотра конкретного аниме
router.get('/anime/:animeId',
  authenticate,
  validateParams(paramSchemas.objectId),
  watchHistoryController.getAnimeHistory
);

// DELETE /api/watch-history/:id - Удаление записи истории
router.delete('/:id',
  authenticate,
  validateParams(paramSchemas.objectId),
  watchHistoryController.deleteHistoryEntry
);

// DELETE /api/watch-history/clear - Очистка истории
router.delete('/clear',
  authenticate,
  validate(watchHistorySchemas.clearHistory),
  watchHistoryController.clearHistory
);

// GET /api/watch-history/export - Экспорт истории
router.get('/export', authenticate, watchHistoryController.exportHistory);

module.exports = router;