const axios = require('axios');

const ANICLI_API_URL = process.env.ANICLI_API_URL || 'http://localhost:8000';

exports.getAnimeVideo = async (req, res) => {
  try {
    const { anime_id, episode } = req.query;
    if (!anime_id || !episode) {
      return res.status(400).json({ error: 'anime_id и episode обязательны' });
    }
    const response = await axios.get(`${ANICLI_API_URL}/get-anime-video`, {
      params: { anime_id, episode }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения видео через Anicli API', details: error.message });
  }
};
