const express = require('express');
const router = express.Router();
const anilibriaController = require('../controllers/anilibriaController');
const auth = require('../middleware/auth');

// Получить популярные аниме
router.get('/popular', anilibriaController.getPopular);

// Получить последние обновления
router.get('/updates', anilibriaController.getUpdates);

// Поиск аниме
router.get('/search', anilibriaController.search);

// Fallback поиск аниме
router.get('/search/fallback', anilibriaController.searchFallback);

// Получить случайное аниме
router.get('/random', anilibriaController.getRandom);

// Получить жанры
router.get('/genres', anilibriaController.getGenres);

// Получить расписание
router.get('/schedule', anilibriaController.getSchedule);

// Получить YouTube данные
router.get('/youtube', anilibriaController.getYouTube);

// Получить аниме по ID
router.get('/:id', anilibriaController.getById);

module.exports = router;