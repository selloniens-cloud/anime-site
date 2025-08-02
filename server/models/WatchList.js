const mongoose = require('mongoose');

const watchListSchema = new mongoose.Schema({
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
  
  status: {
    type: String,
    enum: ['watching', 'completed', 'planToWatch', 'dropped', 'onHold'],
    required: [true, 'Статус просмотра обязателен'],
    index: true
  },
  
  // Прогресс просмотра
  progress: {
    episodesWatched: {
      type: Number,
      default: 0,
      min: [0, 'Количество просмотренных эпизодов не может быть отрицательным']
    },
    currentEpisode: {
      type: Number,
      default: 1,
      min: [1, 'Номер текущего эпизода должен быть больше 0']
    },
    timeWatched: {
      type: Number, // в минутах
      default: 0,
      min: [0, 'Время просмотра не может быть отрицательным']
    }
  },
  
  // Пользовательская оценка
  rating: {
    type: Number,
    min: [1, 'Рейтинг должен быть от 1 до 10'],
    max: [10, 'Рейтинг должен быть от 1 до 10'],
    validate: {
      validator: function(v) {
        return v === null || v === undefined || (Number.isInteger(v) && v >= 1 && v <= 10);
      },
      message: 'Рейтинг должен быть целым числом от 1 до 10'
    }
  },
  
  // Даты
  startDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v <= new Date();
      },
      message: 'Дата начала не может быть в будущем'
    }
  },
  
  finishDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || !this.startDate || v >= this.startDate;
      },
      message: 'Дата окончания не может быть раньше даты начала'
    }
  },
  
  // Заметки пользователя
  notes: {
    type: String,
    maxlength: [1000, 'Заметки не должны превышать 1000 символов'],
    trim: true
  },
  
  // Приоритет (для планируемых к просмотру)
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Количество пересмотров
  rewatchCount: {
    type: Number,
    default: 0,
    min: [0, 'Количество пересмотров не может быть отрицательным']
  },
  
  // Значение пересмотра (насколько хочется пересмотреть)
  rewatchValue: {
    type: String,
    enum: ['very low', 'low', 'medium', 'high', 'very high'],
    default: 'medium'
  },
  
  // Теги пользователя
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Тег не должен превышать 50 символов']
  }],
  
  // Приватность записи
  isPrivate: {
    type: Boolean,
    default: false
  },
  
  // Последнее обновление прогресса
  lastWatched: {
    type: Date,
    default: Date.now
  },
  
  // Источник добавления
  source: {
    type: String,
    enum: ['manual', 'import', 'recommendation'],
    default: 'manual'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Составной уникальный индекс
watchListSchema.index({ userId: 1, animeId: 1 }, { unique: true });

// Дополнительные индексы для оптимизации запросов
watchListSchema.index({ userId: 1, status: 1 });
watchListSchema.index({ userId: 1, rating: -1 });
watchListSchema.index({ userId: 1, lastWatched: -1 });
watchListSchema.index({ animeId: 1, status: 1 });
watchListSchema.index({ createdAt: -1 });

// Виртуальные поля
watchListSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

watchListSchema.virtual('anime', {
  ref: 'Anime',
  localField: 'animeId',
  foreignField: '_id',
  justOne: true
});

watchListSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

watchListSchema.virtual('isWatching').get(function() {
  return this.status === 'watching';
});

watchListSchema.virtual('progressPercentage').get(function() {
  if (!this.anime || !this.anime.episodes) return 0;
  return Math.round((this.progress.episodesWatched / this.anime.episodes) * 100);
});

// Middleware для автоматического обновления дат
watchListSchema.pre('save', function(next) {
  const now = new Date();
  
  // Автоматически устанавливаем дату начала при первом сохранении
  if (this.isNew && this.status === 'watching' && !this.startDate) {
    this.startDate = now;
  }
  
  // Автоматически устанавливаем дату окончания при завершении
  if (this.isModified('status') && this.status === 'completed' && !this.finishDate) {
    this.finishDate = now;
  }
  
  // Обновляем lastWatched при изменении прогресса
  if (this.isModified('progress.episodesWatched') || this.isModified('progress.currentEpisode')) {
    this.lastWatched = now;
  }
  
  next();
});

// Middleware для обновления статистики аниме после изменений
watchListSchema.post('save', async function(doc) {
  try {
    const Anime = mongoose.model('Anime');
    const anime = await Anime.findById(doc.animeId);
    if (anime) {
      await anime.updateStatistics();
    }
  } catch (error) {
    console.error('Ошибка при обновлении статистики аниме:', error);
  }
});

watchListSchema.post('remove', async function(doc) {
  try {
    const Anime = mongoose.model('Anime');
    const anime = await Anime.findById(doc.animeId);
    if (anime) {
      await anime.updateStatistics();
    }
  } catch (error) {
    console.error('Ошибка при обновлении статистики аниме:', error);
  }
});

// Статические методы
watchListSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalEpisodes: { $sum: '$progress.episodesWatched' },
        totalTime: { $sum: '$progress.timeWatched' },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);
  
  const result = {
    watching: { count: 0, totalEpisodes: 0, totalTime: 0 },
    completed: { count: 0, totalEpisodes: 0, totalTime: 0, averageRating: 0 },
    planToWatch: { count: 0, totalEpisodes: 0, totalTime: 0 },
    dropped: { count: 0, totalEpisodes: 0, totalTime: 0 },
    onHold: { count: 0, totalEpisodes: 0, totalTime: 0 },
    total: { count: 0, totalEpisodes: 0, totalTime: 0 }
  };
  
  stats.forEach(stat => {
    if (result[stat._id]) {
      result[stat._id] = {
        count: stat.count,
        totalEpisodes: stat.totalEpisodes || 0,
        totalTime: stat.totalTime || 0,
        averageRating: stat.averageRating || 0
      };
    }
  });
  
  // Подсчет общей статистики
  Object.keys(result).forEach(key => {
    if (key !== 'total') {
      result.total.count += result[key].count;
      result.total.totalEpisodes += result[key].totalEpisodes;
      result.total.totalTime += result[key].totalTime;
    }
  });
  
  return result;
};

watchListSchema.statics.findByUserAndStatus = function(userId, status, options = {}) {
  const query = { userId, status };
  
  return this.find(query)
    .populate('anime', 'title images rating episodes status')
    .sort(options.sort || { lastWatched: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

watchListSchema.statics.findUserEntry = function(userId, animeId) {
  return this.findOne({ userId, animeId }).populate('anime', 'title images episodes');
};

// Методы экземпляра
watchListSchema.methods.updateProgress = function(episodesWatched, timeWatched) {
  this.progress.episodesWatched = episodesWatched;
  this.progress.timeWatched = (this.progress.timeWatched || 0) + (timeWatched || 0);
  this.lastWatched = new Date();
  
  // Автоматически меняем статус на завершенный, если просмотрены все эпизоды
  if (this.anime && this.anime.episodes && episodesWatched >= this.anime.episodes) {
    this.status = 'completed';
    if (!this.finishDate) {
      this.finishDate = new Date();
    }
  }
  
  return this.save();
};

watchListSchema.methods.setRating = function(rating) {
  if (rating < 1 || rating > 10 || !Number.isInteger(rating)) {
    throw new Error('Рейтинг должен быть целым числом от 1 до 10');
  }
  
  this.rating = rating;
  return this.save();
};

watchListSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return Promise.resolve(this);
};

watchListSchema.methods.removeTag = function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  return this.save();
};

module.exports = mongoose.model('WatchList', watchListSchema);