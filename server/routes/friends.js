const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const { authenticate } = require('../middleware/auth');
const { validate, validateParams, friendshipSchemas, paramSchemas } = require('../middleware/validation');

// GET /api/friends - Получение списка друзей
router.get('/', authenticate, friendshipController.getFriends);

// GET /api/friends/requests - Получение запросов в друзья
router.get('/requests', authenticate, friendshipController.getPendingRequests);

// POST /api/friends/request - Отправка запроса в друзья
router.post('/request',
  authenticate,
  validate(friendshipSchemas.sendRequest),
  friendshipController.sendFriendRequest
);

// POST /api/friends/accept - Принятие запроса в друзья
router.post('/accept',
  authenticate,
  validate(friendshipSchemas.respondToRequest),
  friendshipController.acceptFriendRequest
);

// POST /api/friends/reject - Отклонение запроса в друзья
router.post('/reject',
  authenticate,
  validate(friendshipSchemas.respondToRequest),
  friendshipController.rejectFriendRequest
);

// DELETE /api/friends/:friendId - Удаление из друзей
router.delete('/:friendId',
  authenticate,
  validateParams(paramSchemas.userId),
  friendshipController.removeFriend
);

// POST /api/friends/block - Блокировка пользователя
router.post('/block',
  authenticate,
  validate(friendshipSchemas.blockUser),
  friendshipController.blockUser
);

// GET /api/friends/search - Поиск пользователей
router.get('/search', authenticate, friendshipController.searchUsers);

// GET /api/friends/recommendations - Рекомендации друзей
router.get('/recommendations', authenticate, friendshipController.getFriendRecommendations);

// GET /api/friends/status/:targetUserId - Статус дружбы с пользователем
router.get('/status/:targetUserId',
  authenticate,
  validateParams(paramSchemas.userId),
  friendshipController.getFriendshipStatus
);

module.exports = router;