const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { authenticate } = require('../middleware/auth');
const { validate, validateParams, achievementSchemas, paramSchemas } = require('../middleware/validation');

// GET /api/achievements/user - Получение достижений пользователя
router.get('/user', authenticate, achievementController.getUserAchievements);

// GET /api/achievements/user/recent - Недавно разблокированные достижения
router.get('/user/recent', authenticate, achievementController.getRecentUnlocks);

// POST /api/achievements/check - Проверка и обновление прогресса достижений
router.post('/check', authenticate, achievementController.checkAchievements);

// GET /api/achievements/catalog - Каталог всех доступных достижений
router.get('/catalog', authenticate, achievementController.getAllAchievements);

// POST /api/achievements/progress - Обновление прогресса достижения
router.post('/progress', 
  authenticate,
  validate(achievementSchemas.updateProgress),
  achievementController.updateProgress
);

// PUT /api/achievements/:achievementId/visibility - Изменение видимости достижения
router.put('/:achievementId/visibility',
  authenticate,
  validateParams(paramSchemas.achievementId),
  validate(achievementSchemas.toggleVisibility),
  achievementController.toggleAchievementVisibility
);

// GET /api/achievements/leaderboard - Топ пользователей по достижениям
router.get('/leaderboard', authenticate, achievementController.getLeaderboard);

module.exports = router;