const Anime = require('../models/Anime');
const WatchList = require('../models/WatchList');
const Comment = require('../models/Comment');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants/constants');
const mongoose = require('mongoose');
const anilibriaService = require('../services/anilibriaService');

class AnimeController {
  // Получение списка аниме с фильтрацией и пагинацией
  async getAnimeList(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        genres,
        year,
        status,
        type,
        sort = 'rating.score',
        sortBy = 'rating.score',
        order = 'desc',
        sortOrder = 'desc',
        search
      } = req.query;

      // Построение фильтра - упрощенная версия для тестирования
      const filter = {};

      if (genres) {
        const genreArray = Array.isArray(genres) ? genres : [genres];
        filter.genres = { $in: genreArray };
      }

      if (year) {
        filter.year = parseInt(year);
      }

      if (status) {
        filter.status = status;
      }

      if (type) {
        filter.type = type;
      }

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { titleEn: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Построение сортировки - упрощенная версия
      const finalSortBy = 'rating'; // упрощено
      const finalSortOrder = sortOrder || order;
      const sortOrderValue = finalSortOrder === 'desc' ? -1 : 1;
      const sortObj = {};
      sortObj[finalSortBy] = sortOrderValue;

      // Выполнение запроса
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const [anime, total] = await Promise.all([
        Anime.find(filter)
          .select('title titleEn poster rating episodes status type year genres description videoUrl')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        Anime.countDocuments(filter)
      ]);

      // Fallback на AniLibria если база пуста
      if ((!anime || anime.length === 0) && !search) {
        try {
          const anilibriaResult = await anilibriaService.getPopular({ items_per_page: parseInt(limit), page: parseInt(page) });
          const list = anilibriaResult.list || [];
          return res.json({
            success: true,
            data: {
              anime: list.map(anilibriaService.convertToAnimeModel),
              pagination: {
                currentPage: parseInt(page),
                totalPages: 1,
                totalItems: list.length,
                itemsPerPage: parseInt(limit),
                hasNextPage: false,
                hasPrevPage: false
              }
            }
          });
        } catch (e) {
          // Если и AniLibria не доступен — возвращаем ошибку
        }
      }

      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          anime,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Get anime list error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение популярного аниме
  async getPopularAnime(req, res) {
    try {
      const { limit = 50 } = req.query;

      const anime = await Anime.getPopular(parseInt(limit));

      res.json({
        success: true,
        data: {
          anime
        }
      });

    } catch (error) {
      console.error('Get popular anime error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение топ рейтингового аниме
  async getTopRatedAnime(req, res) {
    try {
      const { limit = 50 } = req.query;

      const anime = await Anime.getTopRated(parseInt(limit));

      res.json({
        success: true,
        data: {
          anime
        }
      });

    } catch (error) {
      console.error('Get top rated anime error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение недавно добавленного аниме
  async getRecentAnime(req, res) {
    try {
      const { limit = 50 } = req.query;

      const anime = await Anime.getRecent(parseInt(limit));

      res.json({
        success: true,
        data: {
          anime
        }
      });

    } catch (error) {
      console.error('Get recent anime error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Поиск аниме
  async searchAnime(req, res) {
    try {
      const { q, limit = 20, page = 1 } = req.query;

      if (!q || q.trim().length < 2) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Поисковый запрос должен содержать минимум 2 символа'
          }
        });
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const anime = await Anime.searchByTitle(q.trim(), {
        limit: parseInt(limit),
        skip
      });

      res.json({
        success: true,
        data: {
          anime,
          query: q.trim()
        }
      });

    } catch (error) {
      console.error('Search anime error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение деталей аниме
  async getAnimeDetails(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      const anime = await Anime.findById(id)
        .populate('relations.animeId', 'title images rating')
        .populate('recommendations.animeId', 'title images rating');

      if (!anime || !anime.isActive || !anime.approved) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Получаем статистику пользователя для этого аниме (если авторизован)
      let userStats = null;
      if (req.user) {
        userStats = await WatchList.findUserEntry(req.user.id, id);
      }

      // Получаем количество комментариев
      const commentsCount = await Comment.countDocuments({
        animeId: id,
        status: 'approved'
      });

      res.json({
        success: true,
        data: {
          anime,
          userStats,
          commentsCount
        }
      });

    } catch (error) {
      console.error('Get anime details error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение эпизода по ID
  async getEpisodeById(req, res) {
    try {
      const { id, episodeId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      const anime = await Anime.findById(id)
        .select('title videos episodes')
        .where({ isActive: true, approved: true });

      if (!anime) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Находим эпизод
      const episode = anime.videos.find(video => video.episode === parseInt(episodeId));

      if (!episode) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Эпизод не найден'
          }
        });
      }

      res.json({
        success: true,
        data: {
          animeTitle: anime.title,
          totalEpisodes: anime.episodes,
          episode: {
            number: episode.episode,
            title: episode.title,
            duration: episode.duration,
            thumbnail: episode.thumbnail,
            videoUrl: episode.sources?.[0]?.url,
            sources: episode.sources,
            subtitles: episode.subtitles
          }
        }
      });

    } catch (error) {
      console.error('Get episode by ID error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение эпизодов аниме
  async getAnimeEpisodes(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      const anime = await Anime.findById(id)
        .select('title videos episodes')
        .where({ isActive: true, approved: true });

      if (!anime) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Сортируем эпизоды по номеру
      const episodes = anime.videos.sort((a, b) => a.episode - b.episode);

      res.json({
        success: true,
        data: {
          animeTitle: anime.title,
          totalEpisodes: anime.episodes,
          availableEpisodes: episodes.length,
          episodes: episodes.map(episode => ({
            episode: episode.episode,
            title: episode.title,
            thumbnail: episode.thumbnail,
            duration: episode.duration,
            hasVideo: episode.sources && episode.sources.length > 0,
            hasSubtitles: episode.subtitles && episode.subtitles.length > 0
          }))
        }
      });

    } catch (error) {
      console.error('Get anime episodes error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение связанного аниме
  async getRelatedAnime(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      const anime = await Anime.findById(id)
        .select('relations')
        .populate('relations.animeId', 'title images rating episodes status type')
        .where({ isActive: true, approved: true });

      if (!anime) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Фильтруем только активные и одобренные связанные аниме
      const relatedAnime = anime.relations.filter(relation => 
        relation.animeId && relation.animeId.isActive && relation.animeId.approved
      );

      res.json({
        success: true,
        data: {
          relatedAnime
        }
      });

    } catch (error) {
      console.error('Get related anime error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение рекомендаций
  async getRecommendations(req, res) {
    try {
      const { id } = req.params;
      const { limit = 10 } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      const anime = await Anime.findById(id)
        .select('recommendations genres')
        .populate('recommendations.animeId', 'title images rating episodes status type')
        .where({ isActive: true, approved: true });

      if (!anime) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Получаем рекомендации из базы
      let recommendations = anime.recommendations
        .filter(rec => rec.animeId && rec.animeId.isActive && rec.animeId.approved)
        .sort((a, b) => b.votes - a.votes)
        .slice(0, parseInt(limit));

      // Если рекомендаций мало, добавляем похожие по жанрам
      if (recommendations.length < parseInt(limit) && anime.genres.length > 0) {
        const additionalCount = parseInt(limit) - recommendations.length;
        const existingIds = [id, ...recommendations.map(r => r.animeId._id)];

        const similarAnime = await Anime.find({
          _id: { $nin: existingIds },
          genres: { $in: anime.genres },
          isActive: true,
          approved: true
        })
        .select('title images rating episodes status type')
        .sort({ 'rating.score': -1 })
        .limit(additionalCount);

        // Добавляем похожие аниме как рекомендации
        const additionalRecs = similarAnime.map(similar => ({
          animeId: similar,
          votes: 0,
          type: 'similar'
        }));

        recommendations = [...recommendations, ...additionalRecs];
      }

      res.json({
        success: true,
        data: {
          recommendations
        }
      });

    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Оценка аниме пользователем
  async rateAnime(req, res) {
    try {
      const { id } = req.params;
      const { rating } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      if (!rating || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Рейтинг должен быть целым числом от 1 до 10'
          }
        });
      }

      // Проверяем существование аниме
      const anime = await Anime.findById(id).where({ isActive: true, approved: true });
      if (!anime) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Обновляем или создаем запись в списке просмотра
      let watchListEntry = await WatchList.findOne({ userId, animeId: id });
      
      if (watchListEntry) {
        watchListEntry.rating = rating;
        await watchListEntry.save();
      } else {
        watchListEntry = new WatchList({
          userId,
          animeId: id,
          status: 'planToWatch',
          rating
        });
        await watchListEntry.save();
      }

      // Обновляем статистику аниме
      await anime.updateStatistics();

      res.json({
        success: true,
        data: {
          rating,
          watchListEntry
        },
        message: 'Оценка успешно сохранена'
      });

    } catch (error) {
      console.error('Rate anime error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение жанров
  async getGenres(req, res) {
    try {
      const genres = await Anime.distinct('genres', { 
        isActive: true, 
        approved: true 
      });

      // Подсчитываем количество аниме для каждого жанра
      const genresWithCount = await Promise.all(
        genres.map(async (genre) => {
          const count = await Anime.countDocuments({
            genres: genre,
            isActive: true,
            approved: true
          });
          return { name: genre, count };
        })
      );

      // Сортируем по популярности
      genresWithCount.sort((a, b) => b.count - a.count);

      res.json({
        success: true,
        data: {
          genres: genresWithCount
        }
      });

    } catch (error) {
      console.error('Get genres error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Импорт популярных аниме из AniLibria
  async importFromAnilibria(req, res) {
    try {
      const { limit = 50 } = req.query;
      const imported = await anilibriaService.importPopularAnime(Number(limit));
      res.json({ success: true, imported });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AnimeController();