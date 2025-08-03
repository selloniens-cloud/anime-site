const axios = require('axios');
const { promisify } = require('util');
const redis = require('../config/redis');
const { createError } = require('../utils/errors');
const { metrics } = require('../utils/metrics');

const CACHE_TTL = 3600; // 1 час
const get = promisify(redis.get).bind(redis);
const set = promisify(redis.set).bind(redis);

const ANICLI_API_URL = process.env.ANICLI_API_URL || 'http://anicli_api:8000';
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://python-service:8000';

exports.getVideoStream = async (req, res) => {
  const { anime_id, episode, quality = 'auto', voice = 0 } = req.query;
  const userId = req.user?.id;

  try {
    metrics.videoRequests.inc({ anime_id, quality });

    // Проверяем права доступа
    if (!await checkVideoAccess(userId, anime_id)) {
      throw createError(403, 'Нет доступа к видео');
    }

    // Сначала пробуем получить через Python сервис (AniLiberty)
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/video`, {
        params: { anime_id, episode, quality, voice },
        timeout: 30000
      });

      if (response.status === 200) {
        return res.json({
          success: true,
          videoUrl: response.data.url || response.data.videoUrl,
          quality: response.data.quality || quality,
          voice: response.data.voice || voice,
          source: 'aniliberty'
        });
      }
    } catch (pythonError) {
      console.log('Python service failed, trying fallback:', pythonError.message);
    }

    // Fallback к старому AniliCLI API
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

    // Пробуем Python сервис (AniLiberty)
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/qualities`, {
        params: { anime_id, episode }
      });

      if (response.status === 200 && response.data.success) {
        const result = {
          success: true,
          qualities: response.data.qualities,
          source: 'aniliberty'
        };

        // Кэшируем результат
        await set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
        return res.json(result);
      }
    } catch (pythonError) {
      console.log('Python service qualities failed, trying fallback:', pythonError.message);
    }

    // Fallback к старому API
    const response = await axios.get(`${ANICLI_API_URL}/get-qualities`, {
      params: { anime_id, episode }
    });

    const result = {
      success: true,
      qualities: response.data.qualities || response.data,
      source: 'anicli'
    };

    // Кэшируем результат
    await set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);

    res.json(result);
  } catch (error) {
    console.error('Get qualities error:', error);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Ошибка получения качеств видео'
    });
  }
};

// Новый endpoint для получения доступных озвучек
exports.getAvailableVoices = async (req, res) => {
  const { anime_id, episode } = req.query;
  const cacheKey = `voices:${anime_id}:${episode}`;

  try {
    // Проверяем кэш
    const cached = await get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Получаем данные об озвучках через AniLiberty API
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/voices`, {
        params: { anime_id, episode }
      });

      if (response.status === 200) {
        const voices = response.data.voices || [];
        const result = {
          success: true,
          voices: voices.map((voice, index) => ({
            id: voice.id || index,
            name: voice.name || `Озвучка ${index + 1}`,
            language: voice.language || 'ru',
            type: voice.type || 'dub',
            quality: voice.quality || 'medium',
            studio: voice.studio || 'Unknown',
            description: voice.description || ''
          })),
          source: 'aniliberty'
        };

        // Кэшируем результат
        await set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
        return res.json(result);
      }
    } catch (pythonError) {
      console.log('Python service voices failed:', pythonError.message);
    }

    // Fallback - возвращаем стандартные озвучки
    const fallbackVoices = [
      {
        id: 'original',
        name: 'Оригинал',
        language: 'ja',
        type: 'original',
        quality: 'high',
        studio: 'Original',
        description: 'Оригинальная японская озвучка'
      },
      {
        id: 'anilibria',
        name: 'AniLibria',
        language: 'ru',
        type: 'dub',
        quality: 'high',
        studio: 'AniLibria',
        description: 'Русская озвучка от AniLibria'
      }
    ];

    const result = {
      success: true,
      voices: fallbackVoices,
      source: 'fallback'
    };

    // Кэшируем результат
    await set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    res.json(result);

  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка получения озвучек'
    });
  }
};

// Новый endpoint для получения субтитров
exports.getSubtitles = async (req, res) => {
  const { anime_id, episode, language = 'ru' } = req.query;
  const cacheKey = `subtitles:${anime_id}:${episode}:${language}`;

  try {
    // Проверяем кэш
    const cached = await get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Получаем субтитры через AniLiberty API
    try {
      const response = await axios.get(`${PYTHON_SERVICE_URL}/subtitles`, {
        params: { anime_id, episode, language }
      });

      if (response.status === 200) {
        const result = {
          success: true,
          subtitles: response.data.subtitles || [],
          source: 'aniliberty'
        };

        // Кэшируем результат
        await set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
        return res.json(result);
      }
    } catch (pythonError) {
      console.log('Python service subtitles failed:', pythonError.message);
    }

    // Fallback - возвращаем пустой массив
    const result = {
      success: true,
      subtitles: [],
      source: 'fallback'
    };

    res.json(result);

  } catch (error) {
    console.error('Get subtitles error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка получения субтитров'
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
