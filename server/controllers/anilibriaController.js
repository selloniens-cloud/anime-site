const anilibriaService = require('../services/anilibriaService');
const { HTTP_STATUS } = require('../../shared/constants/constants');

/**
 * Получить популярные аниме из AniLibria
 */
const getPopular = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    
    const data = await anilibriaService.getPopular({
      limit: parseInt(limit),
      page: parseInt(page)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: data.list || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.pagination?.total || data.list?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching popular anime from AniLibria:', error);
    
    // Возвращаем тестовые данные при ошибке API
    const mockData = [
      {
        id: 9919,
        names: {
          ru: "Девочки-бабочки",
          en: "Butterfly Girls",
          alternative: "Chou Shoujo"
        },
        description: "История о девочках, которые превращаются в бабочек и сражаются со злом.",
        type: { string: "TV", episodes: 24 },
        status: { string: "В работе" },
        genres: ["Магия", "Школа", "Драма"],
        year: 2025,
        season: { string: "лето" },
        posters: {
          small: { url: "https://www.anilibria.tv/storage/releases/posters/9919/small.jpg" },
          medium: { url: "https://www.anilibria.tv/storage/releases/posters/9919/medium.jpg" },
          original: { url: "https://www.anilibria.tv/storage/releases/posters/9919/original.jpg" }
        },
        player: {
          episodes: { last: 17 },
          list: {
            "1": {
              name: "Первая встреча",
              preview: "/storage/releases/episodes/previews/9919/1/preview.jpg",
              hls: {
                fhd: "/videos/media/ts/9919/1/1080/video.m3u8",
                hd: "/videos/media/ts/9919/1/720/video.m3u8",
                sd: "/videos/media/ts/9919/1/480/video.m3u8"
              }
            }
          }
        },
        blocked: { copyrights: false, geoip: false }
      },
      {
        id: 9988,
        names: {
          ru: "Труська, Чулко и пресвятой Подвяз 2",
          en: "New Panty & Stocking with Garterbelt",
          alternative: null
        },
        description: "Продолжение приключений двух падших ангелов в Датэн-сити.",
        type: { string: "TV", episodes: 13 },
        status: { string: "В работе" },
        genres: ["Комедия", "Пародия", "Фэнтези", "Экшен"],
        year: 2025,
        season: { string: "лето" },
        posters: {
          small: { url: "https://www.anilibria.tv/storage/releases/posters/9988/small.jpg" },
          medium: { url: "https://www.anilibria.tv/storage/releases/posters/9988/medium.jpg" },
          original: { url: "https://www.anilibria.tv/storage/releases/posters/9988/original.jpg" }
        },
        player: {
          episodes: { last: 4 },
          list: {
            "1": {
              name: "Возвращение",
              preview: "/storage/releases/episodes/previews/9988/1/preview.jpg",
              hls: {
                fhd: "/videos/media/ts/9988/1/1080/video.m3u8",
                hd: "/videos/media/ts/9988/1/720/video.m3u8",
                sd: "/videos/media/ts/9988/1/480/video.m3u8"
              }
            }
          }
        },
        blocked: { copyrights: false, geoip: false }
      }
    ];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: mockData.slice(0, parseInt(req.query.limit || 12)),
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 12),
        total: mockData.length
      }
    });
  }
};

/**
 * Получить последние обновления из AniLibria
 */
const getUpdates = async (req, res) => {
  try {
    const { limit = 12, page = 1 } = req.query;
    
    const data = await anilibriaService.getUpdates({
      limit: parseInt(limit),
      page: parseInt(page)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: data.list || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.pagination?.total || data.list?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching updates from AniLibria:', error);
    
    // Возвращаем тестовые данные при ошибке API
    const mockData = [
      {
        id: 10027,
        names: {
          ru: "Сведённые кукушкой 2",
          en: "Kakkou no Iinazuke Season 2",
          alternative: null
        },
        description: "Продолжение романтической комедии о перепутанных в роддоме детях.",
        type: { string: "TV", episodes: 12 },
        status: { string: "В работе" },
        genres: ["Комедия", "Романтика"],
        year: 2025,
        season: { string: "лето" },
        posters: {
          small: { url: "https://www.anilibria.tv/storage/releases/posters/10027/small.jpg" },
          medium: { url: "https://www.anilibria.tv/storage/releases/posters/10027/medium.jpg" },
          original: { url: "https://www.anilibria.tv/storage/releases/posters/10027/original.jpg" }
        },
        player: {
          episodes: { last: 4 },
          list: {
            "1": {
              name: "Кто был первой любовью Умино?",
              preview: "/storage/releases/episodes/previews/10027/1/preview.jpg",
              hls: {
                fhd: "/videos/media/ts/10027/1/1080/video.m3u8",
                hd: "/videos/media/ts/10027/1/720/video.m3u8",
                sd: "/videos/media/ts/10027/1/480/video.m3u8"
              }
            }
          }
        },
        blocked: { copyrights: false, geoip: false }
      },
      {
        id: 9984,
        names: {
          ru: "Я переродился торговым автоматом и скитаюсь по лабиринту 2",
          en: "Jidou Hanbaiki ni Umarekawatta Ore wa Meikyuu wo Samayou 2nd Season",
          alternative: null
        },
        description: "Продолжение приключений торгового автомата в фэнтезийном мире.",
        type: { string: "TV", episodes: null },
        status: { string: "В работе" },
        genres: ["Исекай", "Комедия", "Фэнтези"],
        year: 2025,
        season: { string: "лето" },
        posters: {
          small: { url: "https://www.anilibria.tv/storage/releases/posters/9984/small.jpg" },
          medium: { url: "https://www.anilibria.tv/storage/releases/posters/9984/medium.jpg" },
          original: { url: "https://www.anilibria.tv/storage/releases/posters/9984/original.jpg" }
        },
        player: {
          episodes: { last: 5 },
          list: {
            "1": {
              name: "План охотников",
              preview: "/storage/releases/episodes/previews/9984/1/preview.jpg",
              hls: {
                fhd: "/videos/media/ts/9984/1/1080/video.m3u8",
                hd: "/videos/media/ts/9984/1/720/video.m3u8",
                sd: "/videos/media/ts/9984/1/480/video.m3u8"
              }
            }
          }
        },
        blocked: { copyrights: false, geoip: false }
      }
    ];

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: mockData.slice(0, parseInt(req.query.limit || 12)),
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 12),
        total: mockData.length
      }
    });
  }
};

/**
 * Поиск аниме в AniLibria
 */
const search = async (req, res) => {
  try {
    const {
      search: query,
      limit = 20,
      page = 1,
      year,
      season,
      genres,
      type
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Поисковый запрос должен содержать минимум 2 символа'
        }
      });
    }

    const data = await anilibriaService.search({
      search: query.trim(),
      limit: parseInt(limit),
      page: parseInt(page),
      year: year ? parseInt(year) : undefined,
      season,
      genres: genres ? genres.split(',') : undefined,
      type
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: data.list || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: data.pagination?.total || data.list?.length || 0
      }
    });
  } catch (error) {
    console.error('Error searching anime in AniLibria:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Ошибка при поиске аниме',
        details: error.message
      }
    });
  }
};

/**
 * Fallback поиск аниме с расширенными возможностями
 */
const searchFallback = async (req, res) => {
  try {
    const {
      query,
      limit = 20,
      page = 1,
      year,
      season,
      genres,
      type
    } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'Поисковый запрос обязателен'
        }
      });
    }

    // Используем метод searchWithFallback для более надежного поиска
    const result = await anilibriaService.searchWithFallback(
      query.trim(),
      parseInt(limit)
    );

    // Если результат пустой, используем mock данные
    if (!result.data || result.data.length === 0) {
      const mockSearchResults = [
        {
          id: 9988,
          names: {
            ru: "Труська, Чулко и пресвятой Подвяз 2",
            en: "New Panty & Stocking with Garterbelt",
            alternative: null
          },
          description: "Продолжение приключений двух падших ангелов в Датэн-сити.",
          type: { string: "TV", episodes: 13 },
          status: { string: "В работе" },
          genres: ["Комедия", "Пародия", "Фэнтези", "Экшен"],
          year: 2025,
          season: { string: "лето" },
          posters: {
            small: { url: "https://www.anilibria.tv/storage/releases/posters/9988/small.jpg" },
            medium: { url: "https://www.anilibria.tv/storage/releases/posters/9988/medium.jpg" },
            original: { url: "https://www.anilibria.tv/storage/releases/posters/9988/original.jpg" }
          },
          player: {
            episodes: { last: 4 },
            list: {
              "1": {
                name: "Возвращение",
                preview: "/storage/releases/episodes/previews/9988/1/preview.jpg",
                hls: {
                  fhd: "/videos/media/ts/9988/1/1080/video.m3u8",
                  hd: "/videos/media/ts/9988/1/720/video.m3u8",
                  sd: "/videos/media/ts/9988/1/480/video.m3u8"
                }
              }
            }
          },
          blocked: { copyrights: false, geoip: false }
        }
      ].filter(anime =>
        anime.names.ru.toLowerCase().includes(query.toLowerCase()) ||
        anime.names.en.toLowerCase().includes(query.toLowerCase())
      );

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        data: mockSearchResults,
        source: 'mock',
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: mockSearchResults.length
        }
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.data || [],
      source: result.source,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total || 0
      }
    });
  } catch (error) {
    console.error('Error in fallback search:', error);
    
    // Возвращаем mock данные при полном отказе API
    const mockSearchResults = [
      {
        id: 9988,
        names: {
          ru: "Труська, Чулко и пресвятой Подвяз 2",
          en: "New Panty & Stocking with Garterbelt",
          alternative: null
        },
        description: "Продолжение приключений двух падших ангелов в Датэн-сити.",
        type: { string: "TV", episodes: 13 },
        status: { string: "В работе" },
        genres: ["Комедия", "Пародия", "Фэнтези", "Экшен"],
        year: 2025,
        season: { string: "лето" },
        posters: {
          small: { url: "https://www.anilibria.tv/storage/releases/posters/9988/small.jpg" },
          medium: { url: "https://www.anilibria.tv/storage/releases/posters/9988/medium.jpg" },
          original: { url: "https://www.anilibria.tv/storage/releases/posters/9988/original.jpg" }
        },
        player: {
          episodes: { last: 4 },
          list: {
            "1": {
              name: "Возвращение",
              preview: "/storage/releases/episodes/previews/9988/1/preview.jpg",
              hls: {
                fhd: "/videos/media/ts/9988/1/1080/video.m3u8",
                hd: "/videos/media/ts/9988/1/720/video.m3u8",
                sd: "/videos/media/ts/9988/1/480/video.m3u8"
              }
            }
          }
        },
        blocked: { copyrights: false, geoip: false }
      }
    ].filter(anime =>
      anime.names.ru.toLowerCase().includes(query.toLowerCase()) ||
      anime.names.en.toLowerCase().includes(query.toLowerCase())
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: mockSearchResults,
      source: 'mock',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockSearchResults.length
      }
    });
  }
};

/**
 * Получить информацию об аниме по ID
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: {
          message: 'ID аниме обязателен'
        }
      });
    }

    const data = await anilibriaService.getById(id);

    if (!data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: {
          message: 'Аниме не найдено'
        }
      });
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching anime by ID from AniLibria:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Ошибка при получении информации об аниме',
        details: error.message
      }
    });
  }
};

/**
 * Получить случайное аниме
 */
const getRandom = async (req, res) => {
  try {
    const { limit = 1 } = req.query;
    
    const data = await anilibriaService.getRandom({
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: Array.isArray(data) ? data : [data]
    });
  } catch (error) {
    console.error('Error fetching random anime from AniLibria:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Ошибка при получении случайного аниме',
        details: error.message
      }
    });
  }
};

/**
 * Получить жанры
 */
const getGenres = async (req, res) => {
  try {
    const data = await anilibriaService.getGenres();

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching genres from AniLibria:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Ошибка при получении жанров',
        details: error.message
      }
    });
  }
};

/**
 * Получить расписание
 */
const getSchedule = async (req, res) => {
  try {
    const { days } = req.query;
    
    const data = await anilibriaService.getSchedule({
      days: days ? days.split(',') : undefined
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching schedule from AniLibria:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Ошибка при получении расписания',
        details: error.message
      }
    });
  }
};

/**
 * Получить информацию о YouTube канале
 */
const getYouTube = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const data = await anilibriaService.getYouTube({
      limit: parseInt(limit)
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error fetching YouTube data from AniLibria:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Ошибка при получении данных YouTube',
        details: error.message
      }
    });
  }
};

module.exports = {
  getPopular,
  getUpdates,
  search,
  searchFallback,
  getById,
  getRandom,
  getGenres,
  getSchedule,
  getYouTube
};