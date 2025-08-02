const axios = require('axios');
const { promisify } = require('util');
const redis = require('../config/redis');
const { createError } = require('../utils/errors');
const { metrics } = require('../utils/metrics');

const CACHE_TTL = 3600; // 1 час
const get = promisify(redis.get).bind(redis);
const set = promisify(redis.set).bind(redis);

const ANICLI_API_URL = process.env.ANICLI_API_URL || 'http://anicli_api:8000';

exports.getVideoStream = async (req, res) => {
  const { anime_id, episode, quality = 'auto' } = req.query;
  const userId = req.user?.id;

  try {
    metrics.videoRequests.inc({ anime_id, quality });

    // Проверяем права доступа
    if (!await checkVideoAccess(userId, anime_id)) {
      throw createError(403, 'Нет доступа к видео');
    }

    const response = await axios.get(`${ANICLI_API_URL}/get-anime-video`, {
      params: { anime_id, episode, quality },
      responseType: 'stream',
      timeout: 30000
    });

    // Добавляем заголовки для стриминга
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Length', response.headers['content-length']);
    res.setHeader('Accept-Ranges', 'bytes');

    response.data.pipe(res);
  } catch (error) {
    console.error('Video streaming error:', error);
    metrics.videoErrors.inc({ anime_id, error: error.code });
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Ошибка получения видео'
    });
  }
};

exports.getAvailableQualities = async (req, res) => {
  const { anime_id, episode } = req.query;
  const cacheKey = `qualities:${anime_id}:${episode}`;

  try {
    // Проверяем кэш
    const cached = await get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const response = await axios.get(`${ANICLI_API_URL}/get-qualities`, {
      params: { anime_id, episode }
    });

    // Кэшируем результат
    await set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);

    res.json(response.data);
  } catch (error) {
    console.error('Get qualities error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Ошибка получения качеств видео'
    });
  }
};

exports.checkVideoAvailability = async (req, res) => {
  const { anime_id, episode } = req.query;
  const cacheKey = `video-availability:${anime_id}:${episode}`;

  try {
    // Проверяем кэш
    const cached = await get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const response = await axios.get(`${ANICLI_API_URL}/check-availability`, {
      params: { anime_id, episode }
    });

    // Кэшируем результат
    await set(cacheKey, JSON.stringify(response.data), 'EX', CACHE_TTL);

    res.json(response.data);
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Ошибка проверки доступности видео'
    });
  }
};

exports.getVideoHandler = async (req, res) => {
  const { anime_id, episode } = req.query;

  try {
    // Запрос к Python-микросервису
    const response = await axios.get('http://anicli_api:8000/video', {
      params: { anime_id, episode },
      responseType: 'stream'
    });

    // Пересылка видео потока
    response.data.pipe(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Ошибка получения видео'
    });
  }
};

// Вспомогательные функции
async function checkVideoAccess(userId, animeId) {
  // Здесь реализуйте проверку прав доступа к видео
  // Например, проверка подписки, возрастных ограничений и т.д.
  return true; // Заглушка
}
