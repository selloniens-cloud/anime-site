const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
  // Внешние идентификаторы
  malId: {
    type: Number,
    unique: true,
    sparse: true,
    index: true
  },
  
  anilistId: {
    type: Number,
    sparse: true,
    index: true
  },
  
  kitsuId: {
    type: Number,
    sparse: true,
    index: true
  },
  
  aniLibriaId: {
    type: Number,
    sparse: true,
    index: true
  },
  
  // Основная информация
  title: {
    english: {
      type: String,
      trim: true
    },
    japanese: {
      type: String,
      trim: true
    },
    romaji: {
      type: String,
      trim: true
    },
    synonyms: [{
      type: String,
      trim: true
    }]
  },
  
  synopsis: {
    type: String,
    trim: true,
    maxlength: [5000, 'Описание не должно превышать 5000 символов']
  },
  
  // Классификация
  type: {
    type: String,
    enum: ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'],
    default: 'TV'
  },
  
  status: {
    type: String,
    enum: ['Finished Airing', 'Currently Airing', 'Not yet aired'],
    default: 'Finished Airing'
  },
  
  // Временные характеристики
  episodes: {
    type: Number,
    min: [1, 'Количество эпизодов должно быть больше 0'],
    default: 1
  },
  
  duration: {
    type: Number, // в минутах
    min: [1, 'Длительность должна быть больше 0']
  },
  
  // Даты
  aired: {
    from: Date,
    to: Date
  },
  
  year: {
    type: Number,
    min: [1900, 'Год должен быть больше 1900'],
    max: [new Date().getFullYear() + 5, 'Год не может быть слишком далеко в будущем'],
    index: true
  },
  
  season: {
    type: String,
    enum: ['Winter', 'Spring', 'Summer', 'Fall'],
    index: true
  },
  
  // Жанры и темы
  genres: [{
    type: String,
    trim: true,
    index: true
  }],
  
  themes: [{
    type: String,
    trim: true
  }],
  
  demographics: [{
    type: String,
    enum: ['Shounen', 'Shoujo', 'Seinen', 'Josei', 'Kids'],
    index: true
  }],
  
  // Рейтинги
  rating: {
    score: {
      type: Number,
      min: [0, 'Рейтинг не может быть меньше 0'],
      max: [10, 'Рейтинг не может быть больше 10'],
      default: 0,
      index: true
    },
    scoredBy: {
      type: Number,
      default: 0
    }
  },
  
  popularity: {
    type: Number,
    default: 0,
    index: true
  },
  
  rank: {
    type: Number,
    index: true
  },
  
  // Возрастной рейтинг
  ageRating: {
    type: String,
    enum: ['G', 'PG', 'PG-13', 'R', 'R+', 'Rx'],
    default: 'PG-13'
  },
  
  // Изображения
  images: {
    poster: {
      small: String,
      medium: String,
      large: String
    },
    banner: String,
    screenshots: [{
      small: String,
      medium: String,
      large: String
    }]
  },
  
  // Видео контент
  videos: [{
    episode: {
      type: Number,
      required: true
    },
    title: String,
    sources: [{
      quality: {
        type: String,
        enum: ['360p', '480p', '720p', '1080p', '1440p', '2160p'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      player: {
        type: String,
        enum: ['html5', 'videojs', 'plyr'],
        default: 'html5'
      }
    }],
    subtitles: [{
      language: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      },
      format: {
        type: String,
        enum: ['srt', 'vtt', 'ass'],
        default: 'srt'
      }
    }],
    thumbnail: String,
    duration: Number // в секундах
  }],
  
  // Производство
  studios: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    malId: Number
  }],
  
  producers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    malId: Number
  }],
  
  licensors: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    malId: Number
  }],
  
  // Связанные аниме
  relations: [{
    type: {
      type: String,
      enum: ['Sequel', 'Prequel', 'Alternative setting', 'Alternative version', 
             'Side story', 'Parent story', 'Summary', 'Full story', 'Spin-off', 'Other'],
      required: true
    },
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true
    }
  }],
  
  // Рекомендации
  recommendations: [{
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Anime',
      required: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  
  // Статистика просмотров
  statistics: {
    watching: {
      type: Number,
      default: 0
    },
    completed: {
      type: Number,
      default: 0
    },
    onHold: {
      type: Number,
      default: 0
    },
    dropped: {
      type: Number,
      default: 0
    },
    planToWatch: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    }
  },
  
  // Кеширование и синхронизация
  cached: {
    type: Boolean,
    default: false
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastSynced: {
    mal: Date,
    anilist: Date,
    kitsu: Date,
    anilibria: Date
  },
  
  // Модерация
  approved: {
    type: Boolean,
    default: false
  },
  
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  approvedAt: Date,
  
  // Метаданные
  source: {
    type: String,
    enum: ['mal', 'anilist', 'kitsu', 'anilibria', 'manual'],
    default: 'mal'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальные поля
animeSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'animeId'
});

animeSchema.virtual('watchListEntries', {
  ref: 'WatchList',
  localField: '_id',
  foreignField: 'animeId'
});

animeSchema.virtual('averageRating').get(function() {
  return this.rating.score || 0;
});

animeSchema.virtual('totalEpisodes').get(function() {
  return this.episodes || 0;
});

animeSchema.virtual('isCompleted').get(function() {
  return this.status === 'Finished Airing';
});

// Индексы для оптимизации поиска
animeSchema.index({ 'title.english': 'text', 'title.japanese': 'text', 'title.romaji': 'text', 'title.synonyms': 'text' });
animeSchema.index({ genres: 1 });
animeSchema.index({ year: -1 });
animeSchema.index({ 'rating.score': -1 });
animeSchema.index({ popularity: -1 });
animeSchema.index({ status: 1 });
animeSchema.index({ type: 1 });
animeSchema.index({ season: 1, year: 1 });
animeSchema.index({ createdAt: -1 });
animeSchema.index({ lastUpdated: -1 });

// Составные индексы для сложных запросов
animeSchema.index({ genres: 1, year: -1, 'rating.score': -1 });
animeSchema.index({ status: 1, type: 1, 'rating.score': -1 });

// Middleware для обновления lastUpdated
animeSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = new Date();
  }
  next();
});

// Статические методы
animeSchema.statics.findByExternalId = function(source, id) {
  const query = {};
  query[`${source}Id`] = id;
  return this.findOne(query);
};

animeSchema.statics.findByAniLibriaId = function(id) {
  return this.findOne({ aniLibriaId: id });
};

animeSchema.statics.searchByTitle = function(query, options = {}) {
  const searchQuery = {
    $or: [
      { 'title.english': { $regex: query, $options: 'i' } },
      { 'title.japanese': { $regex: query, $options: 'i' } },
      { 'title.romaji': { $regex: query, $options: 'i' } },
      { 'title.synonyms': { $regex: query, $options: 'i' } }
    ],
    isActive: true
  };
  
  return this.find(searchQuery)
    .sort(options.sort || { 'rating.score': -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

animeSchema.statics.getPopular = function(limit = 20) {
  return this.find({ isActive: true, approved: true })
    .sort({ popularity: -1, 'rating.score': -1 })
    .limit(limit);
};

animeSchema.statics.getTopRated = function(limit = 20) {
  return this.find({ 
    isActive: true, 
    approved: true,
    'rating.scoredBy': { $gte: 100 } // Минимум 100 оценок
  })
    .sort({ 'rating.score': -1 })
    .limit(limit);
};

animeSchema.statics.getRecent = function(limit = 20) {
  return this.find({ isActive: true, approved: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Методы экземпляра
animeSchema.methods.updateStatistics = async function() {
  const WatchList = mongoose.model('WatchList');
  
  const stats = await WatchList.aggregate([
    { $match: { animeId: this._id } },
    { $group: {
      _id: '$status',
      count: { $sum: 1 }
    }}
  ]);
  
  // Сброс статистики
  this.statistics = {
    watching: 0,
    completed: 0,
    onHold: 0,
    dropped: 0,
    planToWatch: 0,
    totalViews: 0
  };
  
  // Обновление статистики
  stats.forEach(stat => {
    if (this.statistics.hasOwnProperty(stat._id)) {
      this.statistics[stat._id] = stat.count;
    }
  });
  
  this.statistics.totalViews = stats.reduce((total, stat) => total + stat.count, 0);
  
  await this.save();
};

animeSchema.methods.needsSync = function(source, hours = 24) {
  if (!this.lastSynced || !this.lastSynced[source]) return true;
  
  const lastSync = new Date(this.lastSynced[source]);
  const now = new Date();
  const diffHours = (now - lastSync) / (1000 * 60 * 60);
  
  return diffHours >= hours;
};

module.exports = mongoose.model('Anime', animeSchema);