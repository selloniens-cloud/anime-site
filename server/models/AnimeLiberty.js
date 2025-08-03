const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
  // AniLiberty идентификатор
  anilibertyId: {
    type: Number,
    unique: true,
    required: true,
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
  
  // Даты
  year: {
    type: Number,
    min: [1900, 'Год должен быть больше 1900'],
    max: [new Date().getFullYear() + 5, 'Год не может быть слишком далеко в будущем'],
    index: true
  },
  
  season: {
    type: String,
    default: 'Unknown'
  },
  
  // Жанры
  genres: [{
    type: String,
    trim: true,
    index: true
  }],
  
  // Рейтинг
  rating: {
    average: {
      type: Number,
      min: [0, 'Рейтинг не может быть меньше 0'],
      max: [10, 'Рейтинг не может быть больше 10'],
      default: 0,
      index: true
    },
    count: {
      type: Number,
      default: 0
    }
  },
  
  // Изображения
  images: {
    poster: {
      small: String,
      medium: String,
      large: String
    }
  },
  
  // Видео контент для эпизодов
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
      format: {
        type: String,
        enum: ['hls', 'mp4', 'webm'],
        default: 'hls'
      }
    }],
    subtitles: [{
      lang: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }],
    thumbnail: String,
    updated_at: Date
  }],
  
  // Метаданные
  source: {
    type: String,
    default: 'aniliberty'
  },
  
  lastSynced: {
    type: Date,
    default: Date.now
  },
  
  updated_at: {
    type: Date,
    index: true
  },
  
  // Кеширование
  cached: {
    type: Boolean,
    default: true
  },
  
  approved: {
    type: Boolean,
    default: true
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

// Индексы для оптимизации поиска
animeSchema.index({ 'title.english': 'text', 'title.japanese': 'text', 'title.romaji': 'text', 'title.synonyms': 'text' });
animeSchema.index({ genres: 1 });
animeSchema.index({ year: -1 });
animeSchema.index({ 'rating.average': -1 });
animeSchema.index({ status: 1 });
animeSchema.index({ type: 1 });
animeSchema.index({ createdAt: -1 });
animeSchema.index({ lastSynced: -1 });
animeSchema.index({ updated_at: -1 });

// Составные индексы для сложных запросов
animeSchema.index({ genres: 1, year: -1, 'rating.average': -1 });
animeSchema.index({ status: 1, type: 1, 'rating.average': -1 });

// Middleware для обновления lastSynced
animeSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastSynced = new Date();
  }
  next();
});

// Статические методы
animeSchema.statics.findByAnilibertyId = function(id) {
  return this.findOne({ anilibertyId: id });
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
    .sort(options.sort || { 'rating.average': -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

animeSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true, approved: true })
    .sort({ 'rating.average': -1, createdAt: -1 })
    .limit(limit);
};

animeSchema.statics.getNewEpisodes = function(limit = 15) {
  return this.find({ isActive: true, approved: true })
    .sort({ updated_at: -1, lastSynced: -1 })
    .limit(limit);
};

animeSchema.statics.getCatalog = function(options = {}) {
  const {
    page = 1,
    perPage = 20,
    genres,
    year,
    season,
    status,
    type,
    sort = { updated_at: -1 }
  } = options;
  
  const query = { isActive: true, approved: true };
  
  if (genres && genres.length > 0) {
    query.genres = { $in: Array.isArray(genres) ? genres : [genres] };
  }
  if (year) query.year = year;
  if (season) query.season = season;
  if (status) query.status = status;
  if (type) query.type = type;
  
  const skip = (page - 1) * perPage;
  
  return this.find(query)
    .sort(sort)
    .limit(perPage)
    .skip(skip);
};

// Методы экземпляра
animeSchema.methods.getEpisodeById = function(episodeNumber) {
  return this.videos.find(video => video.episode === parseInt(episodeNumber));
};

animeSchema.methods.addOrUpdateEpisode = function(episodeData) {
  const existingIndex = this.videos.findIndex(video => video.episode === episodeData.episode);
  
  if (existingIndex !== -1) {
    this.videos[existingIndex] = { ...this.videos[existingIndex].toObject(), ...episodeData };
  } else {
    this.videos.push(episodeData);
  }
  
  this.videos.sort((a, b) => a.episode - b.episode);
};

module.exports = mongoose.model('AnimeLiberty', animeSchema);