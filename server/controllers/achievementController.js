const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const WatchList = require('../models/WatchList');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants/constants');

class AchievementController {
  // Получение всех достижений для пользователя
  async getUserAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { category, completed, page = 1, limit = 20 } = req.query;

      const options = {};
      if (category) options.category = category;
      if (completed !== undefined) options.completed = completed === 'true';

      const userAchievements = await UserAchievement.getUserAchievements(userId, options);
      
      // Получаем статистику
      const stats = await UserAchievement.getUserStats(userId);
      const progressByCategory = await UserAchievement.getProgressByCategory(userId);

      res.json({
        success: true,
        data: {
          achievements: userAchievements,
          statistics: stats,
          progressByCategory,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: userAchievements.length
          }
        }
      });

    } catch (error) {
      console.error('Get user achievements error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение недавно разблокированных достижений
  async getRecentUnlocks(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 5 } = req.query;

      const recentUnlocks = await UserAchievement.getRecentUnlocks(userId, parseInt(limit));

      res.json({
        success: true,
        data: {
          recentUnlocks
        }
      });

    } catch (error) {
      console.error('Get recent unlocks error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Проверка прогресса достижений для пользователя
  async checkAchievements(req, res) {
    try {
      const userId = req.user.id;

      // Получаем статистику пользователя
      const user = await User.findById(userId);
      const watchStats = await WatchList.getUserStats(userId);
      
      const userStats = {
        ...user.statistics.toObject(),
        ...watchStats
      };

      // Проверяем достижения
      const newAchievements = await Achievement.checkUserAchievements(userId, userStats);

      // Обновляем прогресс для всех активных достижений
      const activeAchievements = await Achievement.find({ isActive: true });
      const progressUpdates = [];

      for (const achievement of activeAchievements) {
        const userAchievement = await UserAchievement.findOne({
          userId,
          achievementId: achievement._id
        });

        if (!userAchievement || !userAchievement.isCompleted) {
          const progress = await this.calculateProgress(achievement, userId, userStats);
          
          if (progress !== null) {
            await UserAchievement.findOneAndUpdate(
              { userId, achievementId: achievement._id },
              {
                $set: {
                  'progress.current': progress,
                  'progress.target': achievement.criteria.target || 1,
                  'metadata.points': achievement.rewards.points
                }
              },
              { upsert: true, new: true }
            );
            
            progressUpdates.push({
              achievement: achievement.name,
              progress,
              target: achievement.criteria.target || 1
            });
          }
        }
      }

      res.json({
        success: true,
        data: {
          newAchievements,
          progressUpdates,
          userStats
        },
        message: newAchievements.length > 0 ? 
          `Разблокировано новых достижений: ${newAchievements.length}` : 
          'Прогресс обновлен'
      });

    } catch (error) {
      console.error('Check achievements error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение всех доступных достижений (каталог)
  async getAllAchievements(req, res) {
    try {
      const { category, rarity, showSecret = false } = req.query;
      const userId = req.user.id;

      const filter = { isActive: true };
      if (category) filter.category = category;
      if (rarity) filter.rarity = rarity;
      if (showSecret !== 'true') filter.isSecret = false;

      const achievements = await Achievement.find(filter)
        .sort({ category: 1, rarity: 1, createdAt: 1 });

      // Получаем прогресс пользователя для каждого достижения
      const userAchievements = await UserAchievement.find({
        userId,
        achievementId: { $in: achievements.map(a => a._id) }
      });

      const userAchievementMap = {};
      userAchievements.forEach(ua => {
        userAchievementMap[ua.achievementId.toString()] = ua;
      });

      const achievementsWithProgress = achievements.map(achievement => {
        const userProgress = userAchievementMap[achievement._id.toString()];
        return {
          ...achievement.toObject(),
          userProgress: userProgress || {
            progress: { current: 0, target: achievement.criteria.target || 1, percentage: 0 },
            isCompleted: false
          }
        };
      });

      // Группируем по категориям
      const categorizedAchievements = {};
      achievementsWithProgress.forEach(achievement => {
        if (!categorizedAchievements[achievement.category]) {
          categorizedAchievements[achievement.category] = [];
        }
        categorizedAchievements[achievement.category].push(achievement);
      });

      res.json({
        success: true,
        data: {
          achievements: achievementsWithProgress,
          categorized: categorizedAchievements,
          categories: Object.keys(categorizedAchievements)
        }
      });

    } catch (error) {
      console.error('Get all achievements error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Обновление прогресса достижения
  async updateProgress(req, res) {
    try {
      const { achievementName, increment = 1, metadata = {} } = req.body;
      const userId = req.user.id;

      const userAchievement = await UserAchievement.updateProgress(
        userId, 
        achievementName, 
        increment, 
        metadata
      );

      if (!userAchievement) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Достижение не найдено'
          }
        });
      }

      let message = 'Прогресс обновлен';
      if (userAchievement.isCompleted) {
        message = `Достижение "${userAchievement.achievementId.title}" разблокировано!`;
      }

      res.json({
        success: true,
        data: {
          userAchievement
        },
        message
      });

    } catch (error) {
      console.error('Update progress error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Скрыть/показать достижение
  async toggleAchievementVisibility(req, res) {
    try {
      const { achievementId } = req.params;
      const { isDisplayed } = req.body;
      const userId = req.user.id;

      const userAchievement = await UserAchievement.findOneAndUpdate(
        { userId, achievementId },
        { isDisplayed },
        { new: true }
      ).populate('achievementId');

      if (!userAchievement) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Достижение пользователя не найдено'
          }
        });
      }

      res.json({
        success: true,
        data: {
          userAchievement
        },
        message: `Достижение ${isDisplayed ? 'показано' : 'скрыто'}`
      });

    } catch (error) {
      console.error('Toggle achievement visibility error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение топа пользователей по достижениям
  async getLeaderboard(req, res) {
    try {
      const { category, limit = 20 } = req.query;

      let matchStage = {};
      if (category) {
        const categoryAchievements = await Achievement.find({ 
          category, 
          isActive: true 
        }).select('_id');
        matchStage.achievementId = { 
          $in: categoryAchievements.map(a => a._id) 
        };
      }

      const leaderboard = await UserAchievement.aggregate([
        { $match: { isCompleted: true, ...matchStage } },
        {
          $lookup: {
            from: 'achievements',
            localField: 'achievementId',
            foreignField: '_id',
            as: 'achievement'
          }
        },
        { $unwind: '$achievement' },
        {
          $group: {
            _id: '$userId',
            totalPoints: { 
              $sum: '$achievement.rewards.points' 
            },
            completedAchievements: { $sum: 1 },
            lastUnlock: { $max: '$unlockedAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            userId: '$_id',
            username: '$user.username',
            avatar: '$user.avatar',
            totalPoints: 1,
            completedAchievements: 1,
            lastUnlock: 1
          }
        },
        { $sort: { totalPoints: -1, completedAchievements: -1 } },
        { $limit: parseInt(limit) }
      ]);

      res.json({
        success: true,
        data: {
          leaderboard,
          category: category || 'all'
        }
      });

    } catch (error) {
      console.error('Get leaderboard error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Вспомогательный метод для расчета прогресса
  async calculateProgress(achievement, userId, userStats) {
    const { type, target, field } = achievement.criteria;

    switch (type) {
      case 'count':
        return Math.min(userStats[field] || 0, target);
      
      case 'streak': {
        const recentWatches = await WatchList.find({ userId })
          .sort({ updatedAt: -1 })
          .limit(target);
        return recentWatches.length;
      }
      
      case 'diversity': {
        const uniqueGenres = await WatchList.aggregate([
          { $match: { userId: mongoose.Types.ObjectId(userId) } },
          { $lookup: { from: 'animes', localField: 'animeId', foreignField: '_id', as: 'anime' } },
          { $unwind: '$anime' },
          { $unwind: '$anime.genres' },
          { $group: { _id: '$anime.genres' } },
          { $count: 'uniqueGenres' }
        ]);
        return Math.min(uniqueGenres[0]?.uniqueGenres || 0, target);
      }
      
      case 'time':
        return Math.min(userStats[field] || 0, target);
      
      case 'rating':
        return userStats[field] >= target ? target : userStats[field] || 0;
      
      default:
        return null;
    }
  }
}

module.exports = new AchievementController();