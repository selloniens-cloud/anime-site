const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  
  unlockedAt: {
    type: Date,
    default: Date.now
  },
  
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  isDisplayed: {
    type: Boolean,
    default: true
  },
  
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Составной индекс для уникальности пары пользователь-достижение
userAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
userAchievementSchema.index({ userId: 1, isCompleted: 1 });
userAchievementSchema.index({ userId: 1, unlockedAt: -1 });

// Виртуальные поля
userAchievementSchema.virtual('completionPercentage').get(function() {
  return this.progress.target > 0 ? 
    Math.min(100, Math.round((this.progress.current / this.progress.target) * 100)) : 0;
});

// Middleware для автоматического обновления процента
userAchievementSchema.pre('save', function(next) {
  if (this.progress.target > 0) {
    this.progress.percentage = this.completionPercentage;
    
    if (this.progress.current >= this.progress.target && !this.isCompleted) {
      this.isCompleted = true;
      this.unlockedAt = new Date();
    }
  }
  next();
});

// Статические методы
userAchievementSchema.statics.getUserAchievements = function(userId, options = {}) {
  const query = { userId };
  
  if (options.completed !== undefined) {
    query.isCompleted = options.completed;
  }
  
  if (options.displayed !== undefined) {
    query.isDisplayed = options.displayed;
  }
  
  return this.find(query)
    .populate('achievementId')
    .sort({ unlockedAt: -1, createdAt: -1 });
};

userAchievementSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAchievements: { $sum: 1 },
        completedAchievements: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
        },
        totalPoints: {
          $sum: {
            $cond: [
              { $eq: ['$isCompleted', true] },
              { $multiply: ['$metadata.points', 1] },
              0
            ]
          }
        },
        averageProgress: { $avg: '$progress.percentage' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalAchievements: 0,
    completedAchievements: 0,
    totalPoints: 0,
    averageProgress: 0
  };
  
  result.completionRate = result.totalAchievements > 0 ?
    Math.round((result.completedAchievements / result.totalAchievements) * 100) : 0;
  
  return result;
};

userAchievementSchema.statics.updateProgress = async function(userId, achievementName, increment = 1, metadata = {}) {
  const Achievement = require('./Achievement');
  const achievement = await Achievement.findOne({ name: achievementName, isActive: true });
  
  if (!achievement) {
    return null;
  }
  
  const userAchievement = await this.findOneAndUpdate(
    { userId, achievementId: achievement._id },
    {
      $inc: { 'progress.current': increment },
      $set: { 
        'progress.target': achievement.criteria.target || 1,
        'metadata': { ...metadata, points: achievement.rewards.points }
      }
    },
    { upsert: true, new: true, runValidators: true }
  ).populate('achievementId');
  
  return userAchievement;
};

userAchievementSchema.statics.getRecentUnlocks = function(userId, limit = 5) {
  return this.find({ 
    userId, 
    isCompleted: true 
  })
  .populate('achievementId')
  .sort({ unlockedAt: -1 })
  .limit(limit);
};

userAchievementSchema.statics.getProgressByCategory = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
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
        _id: '$achievement.category',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
        },
        averageProgress: { $avg: '$progress.percentage' }
      }
    },
    {
      $project: {
        category: '$_id',
        total: 1,
        completed: 1,
        averageProgress: { $round: ['$averageProgress', 1] },
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completed', '$total'] }, 100] },
            1
          ]
        }
      }
    }
  ]);
};

// Методы экземпляра
userAchievementSchema.methods.addProgress = function(amount = 1, metadata = {}) {
  this.progress.current += amount;
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

userAchievementSchema.methods.setProgress = function(current, metadata = {}) {
  this.progress.current = current;
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

userAchievementSchema.methods.complete = function(metadata = {}) {
  this.progress.current = this.progress.target;
  this.isCompleted = true;
  this.unlockedAt = new Date();
  if (Object.keys(metadata).length > 0) {
    this.metadata = { ...this.metadata, ...metadata };
  }
  return this.save();
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);