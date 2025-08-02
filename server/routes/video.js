const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { videoLimiter } = require('../middleware/rateLimiter');
const videoController = require('../controllers/videoController');

// Получение видео потока
router.get('/video',
  optionalAuth,
  videoLimiter,
  videoController.getVideoStream
);

// Получение доступных качеств
router.get('/qualities',
  optionalAuth,
  videoController.getAvailableQualities
);

// Проверка доступности видео
router.get('/video/check',
  optionalAuth,
  videoController.checkVideoAvailability
);

module.exports = router;
