const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateQuery, validateParams, querySchemas, paramSchemas } = require('../middleware/validation');
const animeController = require('../controllers/animeController');

// GET /api/anime - Список аниме с фильтрацией
router.get('/',
  validateQuery(querySchemas.animeSearch),
  animeController.getAnimeList
);

// GET /api/anime/popular - Популярное аниме
router.get('/popular', animeController.getPopularAnime);

// GET /api/anime/top-rated - Топ рейтинговое аниме
router.get('/top-rated', animeController.getTopRatedAnime);

// GET /api/anime/recent - Недавно добавленное аниме
router.get('/recent', animeController.getRecentAnime);

// GET /api/anime/latest - Алиас для recent
router.get('/latest', animeController.getRecentAnime);

// GET /api/anime/search - Поиск аниме
router.get('/search',
  validateQuery(querySchemas.animeSearch),
  animeController.searchAnime
);

// GET /api/anime/genres - Список жанров
router.get('/genres', animeController.getGenres);

// GET /api/anime/:id - Детали аниме
router.get('/:id',
  optionalAuth,
  validateParams(paramSchemas.objectId),
  animeController.getAnimeDetails
);

// GET /api/anime/:id/episodes - Эпизоды аниме
router.get('/:id/episodes',
  validateParams(paramSchemas.objectId),
  animeController.getAnimeEpisodes
);

// GET /api/anime/:id/episodes/:episodeId - Конкретный эпизод
router.get('/:id/episodes/:episodeId',
  validateParams(paramSchemas.animeEpisode),
  animeController.getEpisodeById
);

// GET /api/anime/:id/related - Связанное аниме
router.get('/:id/related',
  validateParams(paramSchemas.objectId),
  animeController.getRelatedAnime
);

// GET /api/anime/:id/recommendations - Рекомендации
router.get('/:id/recommendations',
  validateParams(paramSchemas.objectId),
  animeController.getRecommendations
);

// POST /api/anime/:id/rate - Оценить аниме
router.post('/:id/rate',
  authenticate,
  validateParams(paramSchemas.objectId),
  animeController.rateAnime
);

// Импорт популярных аниме из AniLibria (только для админов)
router.post('/import/anilibria', authenticate, animeController.importFromAnilibria);

// --- Новые маршруты для Shikimori и Anicli ---
// Получить аниме из Shikimori по ID
router.get('/shikimori/:id', require('../controllers/shikimoriController').getAnimeById);

// Поиск аниме через Shikimori
router.get('/shikimori', require('../controllers/shikimoriController').searchAnime);

// Получить ссылку на видео через Anicli API (проксирование)
router.get('/anicli/video', require('../controllers/anicliController').getAnimeVideo);

module.exports = router;