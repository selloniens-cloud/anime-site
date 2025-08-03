const Favorites = require('../models/Favorites');
const WatchHistory = require('../models/WatchHistory');
const WatchList = require('../models/WatchList');
const Anime = require('../models/Anime');
const { createError } = require('../utils/errorUtils');

const recommendationsController = {
  // GET /api/recommendations - Получение персональных рекомендаций
  getRecommendations: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit = 20, algorithm = 'hybrid' } = req.query;
      
      let recommendations = [];
      
      switch (algorithm) {
        case 'genre-based':
          recommendations = await getGenreBasedRecommendations(userId, parseInt(limit));
          break;
        case 'collaborative':
          recommendations = await getCollaborativeRecommendations(userId, parseInt(limit));
          break;
        case 'content-based':
          recommendations = await getContentBasedRecommendations(userId, parseInt(limit));
          break;
        case 'hybrid':
        default:
          recommendations = await getHybridRecommendations(userId, parseInt(limit));
          break;
      }
      
      res.json({
        success: true,
        data: recommendations,
        algorithm,
        message: `Найдено ${recommendations.length} рекомендаций`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/similar/:animeId - Похожие аниме
  getSimilarAnime: async (req, res, next) => {
    try {
      const { animeId } = req.params;
      const { limit = 10 } = req.query;
      
      const targetAnime = await Anime.findById(animeId);
      if (!targetAnime) {
        return next(createError('Аниме не найдено', 404));
      }
      
      const similar = await findSimilarAnime(targetAnime, parseInt(limit));
      
      res.json({
        success: true,
        data: similar,
        message: `Найдено ${similar.length} похожих аниме`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/trending - Трендовые рекомендации
  getTrendingRecommendations: async (req, res, next) => {
    try {
      const { limit = 20, period = '7d' } = req.query;
      
      const trending = await getTrendingAnime(parseInt(limit), period);
      
      res.json({
        success: true,
        data: trending,
        period,
        message: `Найдено ${trending.length} трендовых аниме`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/based-on-favorites - Рекомендации на основе избранного
  getBasedOnFavorites: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit = 15 } = req.query;
      
      const recommendations = await getRecommendationsFromFavorites(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: recommendations,
        message: `Найдено ${recommendations.length} рекомендаций на основе избранного`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/continue-watching - Продолжить просмотр
  getContinueWatching: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { limit = 10 } = req.query;
      
      const continueWatching = await WatchHistory.getContinueWatching(userId, parseInt(limit));
      
      res.json({
        success: true,
        data: continueWatching,
        message: `Найдено ${continueWatching.length} аниме для продолжения просмотра`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/seasonal - Сезонные рекомендации
  getSeasonalRecommendations: async (req, res, next) => {
    try {
      const { season, year, limit = 20 } = req.query;
      const currentDate = new Date();
      const currentYear = year || currentDate.getFullYear();
      const currentSeason = season || getCurrentSeason();
      
      const seasonal = await Anime.find({
        season: currentSeason,
        year: currentYear,
        isActive: true,
        approved: true
      })
        .sort({ 'rating.score': -1, popularity: -1 })
        .limit(parseInt(limit))
        .select('title images rating episodes year season genres status');
      
      res.json({
        success: true,
        data: seasonal,
        season: currentSeason,
        year: currentYear,
        message: `Найдено ${seasonal.length} аниме сезона ${currentSeason} ${currentYear}`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/by-genre/:genre - Рекомендации по жанру
  getByGenre: async (req, res, next) => {
    try {
      const { genre } = req.params;
      const { limit = 20, minRating = 7.0 } = req.query;
      
      const byGenre = await Anime.find({
        genres: { $in: [genre] },
        'rating.score': { $gte: parseFloat(minRating) },
        isActive: true,
        approved: true
      })
        .sort({ 'rating.score': -1, popularity: -1 })
        .limit(parseInt(limit))
        .select('title images rating episodes year genres status');
      
      res.json({
        success: true,
        data: byGenre,
        genre,
        message: `Найдено ${byGenre.length} аниме в жанре ${genre}`
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/recommendations/hidden-gems - Скрытые жемчужины
  getHiddenGems: async (req, res, next) => {
    try {
      const { limit = 15, maxPopularity = 10000 } = req.query;
      
      const hiddenGems = await Anime.find({
        'rating.score': { $gte: 8.0 },
        'rating.scoredBy': { $gte: 100 },
        popularity: { $lte: parseInt(maxPopularity) },
        isActive: true,
        approved: true
      })
        .sort({ 'rating.score': -1 })
        .limit(parseInt(limit))
        .select('title images rating episodes year genres status popularity');
      
      res.json({
        success: true,
        data: hiddenGems,
        message: `Найдено ${hiddenGems.length} скрытых жемчужин`
      });
    } catch (error) {
      next(error);
    }
  }
};

// Вспомогательные функции для алгоритмов рекомендаций

// Рекомендации на основе жанров
async function getGenreBasedRecommendations(userId, limit) {
  try {
    // Получаем топ-жанры пользователя из избранного и просмотренного
    const userGenres = await getUserTopGenres(userId);
    
    if (userGenres.length === 0) {
      // Если у пользователя нет истории, возвращаем популярные
      return await Anime.getPopular(limit);
    }
    
    // Ищем аниме с похожими жанрами
    const recommendations = await Anime.find({
      genres: { $in: userGenres },
      isActive: true,
      approved: true
    })
      .sort({ 'rating.score': -1, popularity: -1 })
      .limit(limit)
      .select('title images rating episodes year genres status');
    
    return recommendations;
  } catch (error) {
    console.error('Ошибка в getGenreBasedRecommendations:', error);
    return [];
  }
}

// Коллаборативная фильтрация
async function getCollaborativeRecommendations(userId, limit) {
  try {
    // Находим пользователей с похожими вкусами
    const similarUsers = await findSimilarUsers(userId);
    
    if (similarUsers.length === 0) {
      return await getGenreBasedRecommendations(userId, limit);
    }
    
    // Получаем аниме, которые нравятся похожим пользователям
    const recommendations = await Anime.aggregate([
      {
        $lookup: {
          from: 'watchlists',
          localField: '_id',
          foreignField: 'animeId',
          as: 'watchEntries'
        }
      },
      {
        $match: {
          'watchEntries.userId': { $in: similarUsers },
          'watchEntries.rating': { $gte: 8 },
          isActive: true,
          approved: true
        }
      },
      {
        $addFields: {
          avgRatingFromSimilar: { $avg: '$watchEntries.rating' }
        }
      },
      { $sort: { avgRatingFromSimilar: -1, 'rating.score': -1 } },
      { $limit: limit },
      {
        $project: {
          title: 1,
          images: 1,
          rating: 1,
          episodes: 1,
          year: 1,
          genres: 1,
          status: 1
        }
      }
    ]);
    
    return recommendations;
  } catch (error) {
    console.error('Ошибка в getCollaborativeRecommendations:', error);
    return [];
  }
}

// Контентные рекомендации
async function getContentBasedRecommendations(userId, limit) {
  try {
    // Получаем профиль предпочтений пользователя
    const userProfile = await getUserContentProfile(userId);
    
    if (!userProfile) {
      return await getGenreBasedRecommendations(userId, limit);
    }
    
    // Ищем аниме на основе профиля
    const recommendations = await Anime.find({
      $and: [
        { genres: { $in: userProfile.preferredGenres } },
        { year: { $gte: userProfile.preferredYearRange.min } },
        { 'rating.score': { $gte: userProfile.minRating } },
        { isActive: true },
        { approved: true }
      ]
    })
      .sort({ 'rating.score': -1 })
      .limit(limit)
      .select('title images rating episodes year genres status');
    
    return recommendations;
  } catch (error) {
    console.error('Ошибка в getContentBasedRecommendations:', error);
    return [];
  }
}

// Гибридный алгоритм
async function getHybridRecommendations(userId, limit) {
  try {
    const genreRecs = await getGenreBasedRecommendations(userId, Math.ceil(limit * 0.4));
    const collabRecs = await getCollaborativeRecommendations(userId, Math.ceil(limit * 0.3));
    const contentRecs = await getContentBasedRecommendations(userId, Math.ceil(limit * 0.3));
    
    // Объединяем и убираем дубликаты
    const combined = [...genreRecs, ...collabRecs, ...contentRecs];
    const unique = combined.filter((anime, index, self) => 
      index === self.findIndex(a => a._id.toString() === anime._id.toString())
    );
    
    return unique.slice(0, limit);
  } catch (error) {
    console.error('Ошибка в getHybridRecommendations:', error);
    return [];
  }
}

// Получение топ-жанров пользователя
async function getUserTopGenres(userId, topN = 5) {
  try {
    const userFavorites = await Favorites.find({ userId }).populate('anime', 'genres');
    const userWatchlist = await WatchList.find({ 
      userId, 
      rating: { $gte: 8 } 
    }).populate('anime', 'genres');
    
    const allGenres = [];
    userFavorites.forEach(fav => {
      if (fav.anime && fav.anime.genres) {
        allGenres.push(...fav.anime.genres);
      }
    });
    userWatchlist.forEach(watch => {
      if (watch.anime && watch.anime.genres) {
        allGenres.push(...watch.anime.genres);
      }
    });
    
    // Подсчитываем частоту жанров
    const genreCount = {};
    allGenres.forEach(genre => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    
    // Возвращаем топ-N жанров
    return Object.keys(genreCount)
      .sort((a, b) => genreCount[b] - genreCount[a])
      .slice(0, topN);
  } catch (error) {
    console.error('Ошибка в getUserTopGenres:', error);
    return [];
  }
}

// Поиск похожих пользователей
async function findSimilarUsers(userId, limit = 10) {
  try {
    // Простая реализация: пользователи с похожими высокими оценками
    const userHighRatings = await WatchList.find({ 
      userId, 
      rating: { $gte: 8 } 
    }).select('animeId');
    
    const userAnimeIds = userHighRatings.map(w => w.animeId);
    
    if (userAnimeIds.length === 0) return [];
    
    // Находим пользователей с похожими высокими оценками
    const similarUsers = await WatchList.aggregate([
      {
        $match: {
          animeId: { $in: userAnimeIds },
          rating: { $gte: 8 },
          userId: { $ne: userId }
        }
      },
      {
        $group: {
          _id: '$userId',
          commonAnime: { $sum: 1 }
        }
      },
      { $match: { commonAnime: { $gte: 3 } } },
      { $sort: { commonAnime: -1 } },
      { $limit: limit }
    ]);
    
    return similarUsers.map(u => u._id);
  } catch (error) {
    console.error('Ошибка в findSimilarUsers:', error);
    return [];
  }
}

// Поиск похожих аниме
async function findSimilarAnime(targetAnime, limit) {
  try {
    const similarAnime = await Anime.find({
      $and: [
        { _id: { $ne: targetAnime._id } },
        { genres: { $in: targetAnime.genres } },
        { isActive: true },
        { approved: true }
      ]
    })
      .sort({ 'rating.score': -1 })
      .limit(limit)
      .select('title images rating episodes year genres status');
    
    return similarAnime;
  } catch (error) {
    console.error('Ошибка в findSimilarAnime:', error);
    return [];
  }
}

// Получение трендовых аниме
async function getTrendingAnime(limit, period) {
  try {
    const daysAgo = period === '1d' ? 1 : period === '7d' ? 7 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    // Считаем популярность по недавней активности
    const trending = await WatchHistory.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$animeId',
          recentViews: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $lookup: {
          from: 'animes',
          localField: '_id',
          foreignField: '_id',
          as: 'anime'
        }
      },
      { $unwind: '$anime' },
      {
        $match: {
          'anime.isActive': true,
          'anime.approved': true
        }
      },
      {
        $project: {
          anime: {
            title: '$anime.title',
            images: '$anime.images',
            rating: '$anime.rating',
            episodes: '$anime.episodes',
            year: '$anime.year',
            genres: '$anime.genres',
            status: '$anime.status'
          },
          trendScore: { $multiply: ['$recentViews', { $size: '$uniqueUsers' }] }
        }
      },
      { $sort: { trendScore: -1 } },
      { $limit: limit }
    ]);
    
    return trending.map(t => t.anime);
  } catch (error) {
    console.error('Ошибка в getTrendingAnime:', error);
    return [];
  }
}

// Текущий сезон
function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 12 || month <= 2) return 'Winter';
  if (month >= 3 && month <= 5) return 'Spring';
  if (month >= 6 && month <= 8) return 'Summer';
  return 'Fall';
}

// Рекомендации на основе избранного
async function getRecommendationsFromFavorites(userId, limit) {
  try {
    const favorites = await Favorites.find({ userId }).populate('anime', 'genres year');
    
    if (favorites.length === 0) {
      return await Anime.getPopular(limit);
    }
    
    const favoriteGenres = [];
    favorites.forEach(fav => {
      if (fav.anime && fav.anime.genres) {
        favoriteGenres.push(...fav.anime.genres);
      }
    });
    
    const recommendations = await Anime.find({
      genres: { $in: favoriteGenres },
      _id: { $nin: favorites.map(f => f.animeId) },
      isActive: true,
      approved: true
    })
      .sort({ 'rating.score': -1 })
      .limit(limit)
      .select('title images rating episodes year genres status');
    
    return recommendations;
  } catch (error) {
    console.error('Ошибка в getRecommendationsFromFavorites:', error);
    return [];
  }
}

// Профиль контентных предпочтений пользователя
async function getUserContentProfile(userId) {
  try {
    const userFavorites = await Favorites.find({ userId }).populate('anime');
    const userWatchlist = await WatchList.find({ 
      userId, 
      rating: { $gte: 7 } 
    }).populate('anime');
    
    if (userFavorites.length === 0 && userWatchlist.length === 0) {
      return null;
    }
    
    const allAnime = [...userFavorites.map(f => f.anime), ...userWatchlist.map(w => w.anime)];
    const genres = allAnime.flatMap(a => a.genres || []);
    const years = allAnime.map(a => a.year).filter(y => y);
    const ratings = allAnime.map(a => a.rating?.score).filter(r => r);
    
    const genreCount = {};
    genres.forEach(g => genreCount[g] = (genreCount[g] || 0) + 1);
    
    return {
      preferredGenres: Object.keys(genreCount)
        .sort((a, b) => genreCount[b] - genreCount[a])
        .slice(0, 5),
      preferredYearRange: {
        min: Math.min(...years) || 2000,
        max: Math.max(...years) || new Date().getFullYear()
      },
      minRating: ratings.length > 0 ? Math.min(...ratings) - 1 : 6.0
    };
  } catch (error) {
    console.error('Ошибка в getUserContentProfile:', error);
    return null;
  }
}

module.exports = recommendationsController;