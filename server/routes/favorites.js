const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { authenticate } = require('../middleware/auth');
const { validate, validateParams, paramSchemas } = require('../middleware/validation');
const { body } = require('express-validator');

// Схемы валидации для избранного
const favoriteSchemas = {
  addToFavorites: [
    body('category')
      .optional()
      .isIn(['favorite', 'bookmark', 'interesting', 'recommended'])
      .withMessage('Категория должна быть одной из: favorite, bookmark, interesting, recommended'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Теги должны быть массивом'),
    body('tags.*')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Каждый тег должен быть строкой не длиннее 50 символов'),
    body('note')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Заметка не должна превышать 1000 символов'),
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Приоритет должен быть числом от 1 до 10'),
    body('reminderDate')
      .optional()
      .isISO8601()
      .withMessage('Дата напоминания должна быть в формате ISO 8601')
      .custom(value => {
        if (value && new Date(value) <= new Date()) {
          throw new Error('Дата напоминания должна быть в будущем');
        }
        return true;
      })
  ],
  
  updateFavorite: [
    body('category')
      .optional()
      .isIn(['favorite', 'bookmark', 'interesting', 'recommended'])
      .withMessage('Категория должна быть одной из: favorite, bookmark, interesting, recommended'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Теги должны быть массивом'),
    body('note')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Заметка не должна превышать 1000 символов'),
    body('priority')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Приоритет должен быть числом от 1 до 10')
  ],
  
  addTag: [
    body('tag')
      .notEmpty()
      .isString()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Тег должен быть строкой от 1 до 50 символов')
  ],
  
  setReminder: [
    body('reminderDate')
      .notEmpty()
      .isISO8601()
      .withMessage('Дата напоминания должна быть в формате ISO 8601')
      .custom(value => {
        if (new Date(value) <= new Date()) {
          throw new Error('Дата напоминания должна быть в будущем');
        }
        return true;
      })
  ]
};

// GET /api/favorites - Получение избранного пользователя
router.get('/', authenticate, favoritesController.getFavorites);

// POST /api/favorites/:animeId - Добавление аниме в избранное
router.post('/:animeId',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(favoriteSchemas.addToFavorites),
  favoritesController.addToFavorites
);

// PUT /api/favorites/:id - Обновление записи избранного
router.put('/:id',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(favoriteSchemas.updateFavorite),
  favoritesController.updateFavorite
);

// DELETE /api/favorites/:id - Удаление из избранного по ID записи
router.delete('/:id',
  authenticate,
  validateParams(paramSchemas.objectId),
  favoritesController.removeFromFavorites
);

// DELETE /api/favorites/anime/:animeId - Удаление аниме из избранного по ID аниме
router.delete('/anime/:animeId',
  authenticate,
  validateParams(paramSchemas.objectId),
  favoritesController.removeAnimeFromFavorites
);

// GET /api/favorites/check/:animeId - Проверка, есть ли аниме в избранном
router.get('/check/:animeId',
  authenticate,
  validateParams(paramSchemas.objectId),
  favoritesController.checkFavorite
);

// GET /api/favorites/stats - Статистика избранного
router.get('/stats', authenticate, favoritesController.getFavoritesStats);

// GET /api/favorites/categories/:category - Получение избранного по категории
router.get('/categories/:category',
  authenticate,
  favoritesController.getFavoritesByCategory
);

// POST /api/favorites/:id/tags - Добавление тега
router.post('/:id/tags',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(favoriteSchemas.addTag),
  favoritesController.addTag
);

// DELETE /api/favorites/:id/tags/:tag - Удаление тега
router.delete('/:id/tags/:tag',
  authenticate,
  validateParams(paramSchemas.objectId),
  favoritesController.removeTag
);

// POST /api/favorites/:id/reminder - Установка напоминания
router.post('/:id/reminder',
  authenticate,
  validateParams(paramSchemas.objectId),
  validate(favoriteSchemas.setReminder),
  favoritesController.setReminder
);

// DELETE /api/favorites/:id/reminder - Отмена напоминания
router.delete('/:id/reminder',
  authenticate,
  validateParams(paramSchemas.objectId),
  favoritesController.cancelReminder
);

// GET /api/favorites/export - Экспорт избранного
router.get('/export', authenticate, favoritesController.exportFavorites);

module.exports = router;