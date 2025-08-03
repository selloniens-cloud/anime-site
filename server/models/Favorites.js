const mongoose = require('mongoose');

const favoritesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'ID пользователя обязателен'],
    index: true
  },
  
  animeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anime', 
    required: [true, 'ID аниме обязателен'],
    index: true
  },
  
  // Категории избранного
  category: {
    type: String,
    enum: ['favorite', 'bookmark', 'interesting', 'recommended'],
    default: 'favorite',
    index: true
  },
  
  // Персональные теги
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Тег не должен превышать 50 символов']
  }],
  
  // Персональная заметка
  note: {
    type: String,
    maxlength: [1000, 'Заметка не должна превышать 1000 символов'],
    trim: true
  },
  
  // Приоритет в избранном
  priority: {
    type: Number,
    min: [1, 'Приоритет должен быть от 1 до 10'],
    max: [10, 'Приоритет должен быть от 1 до 10'],
    default: 5
  },
  
  // Приватность записи
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // Источник добавления
  source: {
    type: String,
    enum: ['manual', 'recommendation', 'trending', 'similar'],
    default: 'manual'
  },
  
  // Напоминание о просмотре
  reminderDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Дата напоминания должна быть в будущем'
    }
  },
  
  // Активность напоминания
  reminderActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Составной уникальный индекс
favoritesSchema.index({ userId: 1, animeId: 1 }, { unique: true });

// Дополнительные индексы для оптимизации
favoritesSchema.index({ userId: 1, category: 1 });
favoritesSchema.index({ userId: 1, priority: -1 });
favoritesSchema.index({ userId: 1, createdAt: -1 });
favoritesSchema.index({ animeId: 1 });
favoritesSchema.index({ reminderDate: 1, reminderActive: 1 });

// Виртуальные поля
favoritesSchema.virtual('user', {
  ref: 'User',
  localField: 'userId', 
  foreignField: '_id',
  justOne: true
});

favoritesSchema.virtual('anime', {
  ref: 'Anime',
  localField: 'animeId',
  foreignField: '_id',
  justOne: true
});

// Статические методы
favoritesSchema.statics.getUserFavorites = function(userId, options = {}) {
  const query = { userId };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query)
    .populate('anime', 'title images rating episodes status year genres')
    .sort(options.sort || { priority: -1, createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

favoritesSchema.statics.getFavoritesByCategory = function(userId, category, options = {}) {
  return this.find({ userId, category })
    .populate('anime', 'title images rating episodes status year genres')
    .sort(options.sort || { priority: -1, createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

favoritesSchema.statics.checkIfFavorite = function(userId, animeId) {
  return this.findOne({ userId, animeId }).select('category priority createdAt');
};

favoritesSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPriority: { $avg: '$priority' }
      }
    }
  ]);
  
  const result = {
    favorite: { count: 0, avgPriority: 0 },
    bookmark: { count: 0, avgPriority: 0 },
    interesting: { count: 0, avgPriority: 0 },
    recommended: { count: 0, avgPriority: 0 },
    total: { count: 0, avgPriority: 0 }
  };
  
  let totalCount = 0;
  let totalPriority = 0;
  
  stats.forEach(stat => {
    if (result[stat._id]) {
      result[stat._id] = {
        count: stat.count,
        avgPriority: Math.round(stat.avgPriority * 10) / 10
      };
      totalCount += stat.count;
      totalPriority += stat.avgPriority * stat.count;
    }
  });
  
  result.total = {
    count: totalCount,
    avgPriority: totalCount > 0 ? Math.round((totalPriority / totalCount) * 10) / 10 : 0
  };
  
  return result;
};

favoritesSchema.statics.getActiveReminders = function() {
  return this.find({
    reminderActive: true,
    reminderDate: { $lte: new Date() }
  }).populate('user anime');
};

// Методы экземпляра
favoritesSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

favoritesSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

favoritesSchema.methods.setReminder = function(date) {
  this.reminderDate = date;
  this.reminderActive = true;
  return this.save();
};

favoritesSchema.methods.cancelReminder = function() {
  this.reminderActive = false;
  return this.save();
};

module.exports = mongoose.model('Favorites', favoritesSchema);