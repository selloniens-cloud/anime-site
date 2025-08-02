const rateLimit = require('express-rate-limit');

// Лимиты для видео запросов
const videoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов
  message: {
    error: 'Слишком много запросов на видео. Попробуйте позже.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Общий лимитер
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов
  message: {
    error: 'Слишком много запросов. Попробуйте позже.'
  },
});

module.exports = {
  videoLimiter,
  generalLimiter
};