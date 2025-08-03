const express = require('express');
const router = express.Router();
const recommendationsController = require('../controllers/recommendationsController');
const { authenticate } = require('../middleware/auth');
const { validateParams, paramSchemas } = require('../middleware/validation');

// GET /api/recommendations - Получение персональных рекомендаций
router.get('/', authenticate, recommendationsController.getRecommendations);

// GET /api/recommendations/similar/:animeId - Похожие аниме
router.get('/similar/:animeId',
  validateParams(paramSchemas.objectId),
  recommendationsController.getSimilarAnime
);

// GET /api/recommendations/trending - Трендовые рекомендации
router.get('/trending', recommendationsController.getTrendingRecommendations);

// GET /api/recommendations/based-on-favorites - Рекомендации на основе избранного
router.get('/based-on-favorites', authenticate, recommendationsController.getBasedOnFavorites);

// GET /api/recommendations/continue-watching - Продолжить просмотр
router.get('/continue-watching', authenticate, recommendationsController.getContinueWatching);

// GET /api/recommendations/seasonal - Сезонные рекомендации
router.get('/seasonal', recommendationsController.getSeasonalRecommendations);

// GET /api/recommendations/by-genre/:genre - Рекомендации по жанру
router.get('/by-genre/:genre', recommendationsController.getByGenre);

// GET /api/recommendations/hidden-gems - Скрытые жемчужины
router.get('/hidden-gems', recommendationsController.getHiddenGems);

module.exports = router;