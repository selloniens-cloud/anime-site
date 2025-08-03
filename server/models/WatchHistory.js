const mongoose = require('mongoose');

const watchHistorySchema = new mongoose.Schema({
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
  
  // ID эпизода (может быть строкой для AniLiberty)
  episodeId: {
    type: String,
    required: [true, 'ID эпизода обязателен'],
    index: true
  },
  
  // Номер эпизода
  episodeNumber: {
    type: Number,
    required: [true, 'Номер эпизода обязателен'],
    min: [1, 'Номер эпизода должен быть больше 0']
  },
  
  // Название эпизода
  episodeTitle: {
    type: String,
    trim: true
  },
  
  // Прогресс просмотра в секундах
  watchedTime: {
    type: Number,
    default: 0,
    min: [0, 'Время просмотра не может быть отрицательным']
  },
  
  // Общая длительность эпизода в секундах
  totalTime: {
    type: Number,
    required: [true, 'Общая длительность обязательна'],
    min: [1, 'Длительность должна быть больше 0']
  },
  
  // Процент просмотра
  progressPercent: {
    type: Number,
    default: 0,
    min: [0, 'Процент не может быть меньше 0'],
    max: [100, 'Процент не может быть больше 100']
  },
  
  // Статус просмотра
  status: {
    type: String,
    enum: ['started', 'watching', 'paused', 'completed', 'skipped'],
    default: 'started',
    index: true
  },
  
  // Качество видео при просмотре
  quality: {
    type: String,
    enum: ['360p', '480p', '720p', '1080p', '1440p', '2160p'],
    default: '720p'
  },
  
  // Язык озвучки/субтитров
  audioLanguage: {
    type: String,
    default: 'japanese'
  },
  
  subtitleLanguage: {
    type: String,
    default: 'russian'
  },
  
  // Устройство просмотра
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'tv', 'unknown'],
    default: 'unknown'
  },
  
  // Браузер
  userAgent: {
    type: String,
    maxlength: [500, 'User Agent не должен превышать 500 символов']
  },
  
  // IP адрес (для аналитики)
  ipAddress: {
    type: String,
    select: false // По умолчанию не включать в запросы
  },
  
  // Сессия просмотра (для группировки)
  sessionId: {
    type: String,
    index: true
  },
  
  // Дата начала просмотра
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Дата последнего обновления
  lastWatchedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Дата завершения просмотра (если статус completed)
  completedAt: {
    type: Date
  },
  
  // Рейтинг эпизода (1-10)
  rating: {
    type: Number,
    min: [1, 'Рейтинг должен быть от 1 до 10'],
    max: [10, 'Рейтинг должен быть от 1 до 10']
  },
  
  // Заметки к просмотру
  notes: {
    type: String,
    maxlength: [1000, 'Заметки не должны превышать 1000 символов'],
    trim: true
  },
  
  // Количество пауз во время просмотра
  pauseCount: {
    type: Number,
    default: 0,
    min: [0, 'Количество пауз не может быть отрицательным']
  },
  
  // Время в паузе (в секундах)
  pausedTime: {
    type: Number,
    default: 0,
    min: [0, 'Время в паузе не может быть отрицательным']
  },
  
  // Количество перемоток
  seekCount: {
    type: Number,
    default: 0,
    min: [0, 'Количество перемоток не может быть отрицательным']
  },
  
  // Скорость воспроизведения
  playbackRate: {
    type: Number,
    default: 1.0,
    min: [0.25, 'Минимальная скорость 0.25x'],
    max: [3.0, 'Максимальная скорость 3.0x']
  },
  
  // Приватность записи
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Составной уникальный индекс для предотвращения дублей
watchHistorySchema.index({ userId: 1, animeId: 1, episodeId: 1 }, { unique: true });

// Дополнительные индексы для оптимизации запросов
watchHistorySchema.index({ userId: 1, lastWatchedAt: -1 });
watchHistorySchema.index({ userId: 1, status: 1 });
watchHistorySchema.index({ userId: 1, animeId: 1, episodeNumber: 1 });
watchHistorySchema.index({ sessionId: 1 });
watchHistorySchema.index({ startedAt: -1 });
watchHistorySchema.index({ progressPercent: -1 });

// TTL индекс для автоматического удаления старых записей (365 дней)
watchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Виртуальные поля
watchHistorySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

watchHistorySchema.virtual('anime', {
  ref: 'Anime',
  localField: 'animeId',
  foreignField: '_id',
  justOne: true
});

watchHistorySchema.virtual('isCompleted').get(function() {
  return this.status === 'completed' || this.progressPercent >= 90;
});

watchHistorySchema.virtual('remainingTime').get(function() {
  return Math.max(0, this.totalTime - this.watchedTime);
});

watchHistorySchema.virtual('watchDuration').get(function() {
  if (!this.completedAt) return null;
  return Math.round((this.completedAt - this.startedAt) / 1000); // в секундах
});

// Middleware для автоматического обновления прогресса
watchHistorySchema.pre('save', function(next) {
  // Вычисляем процент прогресса
  if (this.watchedTime && this.totalTime) {
    this.progressPercent = Math.min(100, Math.round((this.watchedTime / this.totalTime) * 100));
  }
  
  // Обновляем lastWatchedAt при изменении прогресса
  if (this.isModified('watchedTime') || this.isModified('status')) {
    this.lastWatchedAt = new Date();
  }
  
  // Автоматически устанавливаем completedAt при завершении
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Статические методы
watchHistorySchema.statics.getUserHistory = function(userId, options = {}) {
  const query = { userId };
  
  if (options.animeId) {
    query.animeId = options.animeId;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.dateFrom || options.dateTo) {
    query.lastWatchedAt = {};
    if (options.dateFrom) query.lastWatchedAt.$gte = new Date(options.dateFrom);
    if (options.dateTo) query.lastWatchedAt.$lte = new Date(options.dateTo);
  }
  
  return this.find(query)
    .populate('anime', 'title images episodes year genres rating')
    .sort(options.sort || { lastWatchedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

watchHistorySchema.statics.getRecentlyWatched = function(userId, limit = 20) {
  return this.find({ 
    userId, 
    status: { $in: ['watching', 'completed'] } 
  })
    .populate('anime', 'title images episodes year')
    .sort({ lastWatchedAt: -1 })
    .limit(limit);
};

watchHistorySchema.statics.getContinueWatching = function(userId, limit = 10) {
  return this.find({
    userId,
    status: { $in: ['started', 'watching', 'paused'] },
    progressPercent: { $gt: 5, $lt: 90 }
  })
    .populate('anime', 'title images episodes')
    .sort({ lastWatchedAt: -1 })
    .limit(limit);
};

watchHistorySchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalEpisodes: { $sum: 1 },
        completedEpisodes: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
        },
        totalWatchTime: { $sum: '$watchedTime' },
        totalPauseTime: { $sum: '$pausedTime' },
        avgProgress: { $avg: '$progressPercent' },
        avgRating: { $avg: '$rating' },
        totalPauses: { $sum: '$pauseCount' },
        totalSeeks: { $sum: '$seekCount' }
      }
    }
  ]);
  
  const result = stats[0] || {
    totalEpisodes: 0,
    completedEpisodes: 0,
    totalWatchTime: 0,
    totalPauseTime: 0,
    avgProgress: 0,
    avgRating: 0,
    totalPauses: 0,
    totalSeeks: 0
  };
  
  // Добавляем вычисляемые поля
  result.completionRate = result.totalEpisodes > 0 
    ? Math.round((result.completedEpisodes / result.totalEpisodes) * 100) 
    : 0;
    
  result.avgSessionDuration = result.totalEpisodes > 0
    ? Math.round(result.totalWatchTime / result.totalEpisodes)
    : 0;
  
  return result;
};

watchHistorySchema.statics.getWatchingPattern = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    { 
      $match: { 
        userId: mongoose.Types.ObjectId(userId),
        lastWatchedAt: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: { 
          hour: { $hour: '$lastWatchedAt' },
          dayOfWeek: { $dayOfWeek: '$lastWatchedAt' }
        },
        count: { $sum: 1 },
        totalTime: { $sum: '$watchedTime' }
      }
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } }
  ]);
};

// Методы экземпляра
watchHistorySchema.methods.updateProgress = function(watchedTime, status) {
  this.watchedTime = Math.max(0, watchedTime);
  
  if (status) {
    this.status = status;
  }
  
  // Автоматически завершаем если просмотрено больше 90%
  if (this.progressPercent >= 90 && this.status !== 'completed') {
    this.status = 'completed';
  }
  
  return this.save();
};

watchHistorySchema.methods.addPause = function() {
  this.pauseCount += 1;
  return this.save();
};

watchHistorySchema.methods.addSeek = function() {
  this.seekCount += 1;
  return this.save();
};

watchHistorySchema.methods.setRating = function(rating) {
  if (rating < 1 || rating > 10 || !Number.isInteger(rating)) {
    throw new Error('Рейтинг должен быть целым числом от 1 до 10');
  }
  
  this.rating = rating;
  return this.save();
};

module.exports = mongoose.model('WatchHistory', watchHistorySchema);