const express = require('express');
const router = express.Router();
const watchListController = require('../controllers/watchListController');
const { authenticate } = require('../middleware/auth');
const { validate, validateParams, watchListSchemas, paramSchemas } = require('../middleware/validation');

// GET /api/watchlist - Получение списка просмотра пользователя
router.get('/', authenticate, watchListController.getWatchList);

// POST /api/watchlist/:animeId - Добавление аниме в список просмотра
router.post('/:animeId',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(watchListSchemas.addToList),
  watchListController.addToWatchList
);

// PUT /api/watchlist/:id - Обновление записи в списке просмотра
router.put('/:id',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(watchListSchemas.addToList),
  watchListController.updateWatchListEntry
);

// DELETE /api/watchlist/:id - Удаление из списка просмотра
router.delete('/:id',
  authenticate,
  validateParams(paramSchemas.objectId),
  watchListController.removeFromWatchList
);

// POST /api/watchlist/:id/progress - Обновление прогресса просмотра
router.post('/:id/progress',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(watchListSchemas.updateProgress),
  watchListController.updateProgress
);

// GET /api/watchlist/stats - Статистика списка просмотра
router.get('/stats', authenticate, watchListController.getWatchListStats);

// GET /api/watchlist/anime/:animeId - Получение записи по аниме
router.get('/anime/:animeId',
  authenticate,
  validateParams(paramSchemas.objectId),
  watchListController.getWatchListEntry
);

// POST /api/watchlist/bulk-update - Массовое обновление статуса
router.post('/bulk-update',
  authenticate,
  watchListController.bulkUpdateStatus
);

// GET /api/watchlist/export - Экспорт списка просмотра
router.get('/export', authenticate, watchListController.exportWatchList);

module.exports = router;