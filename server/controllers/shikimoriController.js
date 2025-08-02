const axios = require('axios');

const SHIKIMORI_API = 'https://shikimori.one/api';
const USER_AGENT = 'AnimeSite/1.0 (https://github.com/your-org/anime-site)';

exports.getAnimeById = async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${SHIKIMORI_API}/animes/${id}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка получения аниме из Shikimori', details: error.message });
  }
};

exports.searchAnime = async (req, res) => {
  try {
    const { search } = req.query;
    if (!search || search.length < 2) {
      return res.status(400).json({ success: false, error: 'Необходимо указать поисковый запрос (минимум 2 символа)' });
    }
    const response = await axios.get(`${SHIKIMORI_API}/animes`, {
      params: { search },
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    res.json({ success: true, data: response.data });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Ошибка поиска аниме в Shikimori', details: error.message });
  }
};
