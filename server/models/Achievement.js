const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  icon: {
    type: String,
    required: true,
    default: '🏆'
  },
  
  category: {
    type: String,
    enum: ['watching', 'social', 'exploration', 'time', 'special'],
    required: true
  },
  
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  
  criteria: {
    type: {
      type: String,
      enum: ['count', 'streak', 'diversity', 'time', 'rating', 'custom'],
      required: true
    },
    target: {
      type: Number,
      required: function() {
        return ['count', 'streak', 'time', 'rating'].includes(this.criteria.type);
      }
    },
    field: {
      type: String,
      required: function() {
        return this.criteria.type !== 'custom';
      }
    },
    customCheck: {
      type: String, // Функция для кастомной проверки
      required: function() {
        return this.criteria.type === 'custom';
      }
    }
  },
  
  rewards: {
    points: {
      type: Number,
      default: 10
    },
    badge: {
      type: String,
      default: null
    },
    title: {
      type: String,
      default: null
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isSecret: {
    type: Boolean,
    default: false
  },
  
  unlockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальные поля
achievementSchema.virtual('unlockedCount').get(function() {
  return this.unlockedBy ? this.unlockedBy.length : 0;
});

achievementSchema.virtual('rarityColor').get(function() {
  const colors = {
    common: '#6c757d',
    rare: '#007bff',
    epic: '#6f42c1',
    legendary: '#fd7e14',
    mythic: '#e83e8c'
  };
  return colors[this.rarity] || colors.common;
});

// Индексы
achievementSchema.index({ name: 1 });
achievementSchema.index({ category: 1 });
achievementSchema.index({ rarity: 1 });
achievementSchema.index({ isActive: 1 });

// Статические методы
achievementSchema.statics.getByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ rarity: 1, createdAt: 1 });
};

achievementSchema.statics.checkUserAchievements = async function(userId, userStats) {
  const achievements = await this.find({ 
    isActive: true,
    unlockedBy: { $ne: userId }
  });
  
  const unlockedAchievements = [];
  
  for (const achievement of achievements) {
    const isUnlocked = await achievement.checkCriteria(userId, userStats);
    if (isUnlocked) {
      achievement.unlockedBy.push(userId);
      await achievement.save();
      unlockedAchievements.push(achievement);
    }
  }
  
  return unlockedAchievements;
};

// Методы экземпляра
achievementSchema.methods.checkCriteria = async function(userId, userStats) {
  const User = require('./User');
  const WatchList = require('./WatchList');
  
  switch (this.criteria.type) {
    case 'count':
      return userStats[this.criteria.field] >= this.criteria.target;
      
    case 'streak':
      // Проверка серии просмотров
      const watchHistory = await WatchList.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(this.criteria.target);
      return watchHistory.length >= this.criteria.target;
      
    case 'diversity':
      // Проверка разнообразия (жанры, студии и т.д.)
      const uniqueGenres = await WatchList.aggregate([
        { $match: { userId: mongoose.Types.ObjectId(userId) } },
        { $lookup: { from: 'animes', localField: 'animeId', foreignField: '_id', as: 'anime' } },
        { $unwind: '$anime' },
        { $unwind: '$anime.genres' },
        { $group: { _id: '$anime.genres' } },
        { $count: 'uniqueGenres' }
      ]);
      const genreCount = uniqueGenres[0]?.uniqueGenres || 0;
      return genreCount >= this.criteria.target;
      
    case 'time':
      return userStats.totalMinutes >= this.criteria.target;
      
    case 'rating':
      return userStats.averageRating >= this.criteria.target;
      
    case 'custom':
      // Кастомная логика проверки
      try {
        const checkFunction = new Function('userId', 'userStats', this.criteria.customCheck);
        return await checkFunction(userId, userStats);
      } catch (error) {
        console.error('Custom achievement check error:', error);
        return false;
      }
      
    default:
      return false;
  }
};

achievementSchema.methods.unlock = async function(userId) {
  if (!this.unlockedBy.includes(userId)) {
    this.unlockedBy.push(userId);
    await this.save();
    
    // Обновляем очки пользователя
    const User = require('./User');
    await User.findByIdAndUpdate(userId, {
      $inc: { 'statistics.achievementPoints': this.rewards.points }
    });
    
    return true;
  }
  return false;
};

module.exports = mongoose.model('Achievement', achievementSchema);