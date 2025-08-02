const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
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
  
  // Содержимое комментария
  content: {
    type: String,
    required: [true, 'Содержимое комментария обязательно'],
    trim: true,
    minlength: [1, 'Комментарий не может быть пустым'],
    maxlength: [2000, 'Комментарий не должен превышать 2000 символов']
  },
  
  // Рейтинг аниме от пользователя (опционально)
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
  
  // Система лайков/дизлайков
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'dislike'],
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Ответы на комментарий
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  
  // Упоминания пользователей
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Статус модерации
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'approved',
    index: true
  },
  
  // Причина модерации
  moderationReason: {
    type: String,
    trim: true
  },
  
  // Модератор, который обработал комментарий
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  moderatedAt: Date,
  
  // Жалобы на комментарий
  reports: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'spoiler', 'other'],
      required: true
    },
    description: {
      type: String,
      maxlength: [500, 'Описание жалобы не должно превышать 500 символов']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Метки
  tags: [{
    type: String,
    enum: ['spoiler', 'review', 'recommendation', 'discussion'],
    index: true
  }],
  
  // Редактирование
  isEdited: {
    type: Boolean,
    default: false
  },
  
  editHistory: [{
    content: String,
    editedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Закрепленный комментарий
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // Эпизод, к которому относится комментарий (опционально)
  episodeNumber: {
    type: Number,
    min: [1, 'Номер эпизода должен быть больше 0']
  },
  
  // IP адрес для модерации
  ipAddress: {
    type: String,
    select: false // Не включать в обычные запросы
  },
  
  // User Agent для модерации
  userAgent: {
    type: String,
    select: false // Не включать в обычные запросы
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индексы для оптимизации запросов
commentSchema.index({ animeId: 1, createdAt: -1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, createdAt: 1 });
commentSchema.index({ status: 1, createdAt: -1 });
commentSchema.index({ isPinned: -1, createdAt: -1 });
commentSchema.index({ episodeNumber: 1, createdAt: -1 });

// Составные индексы
commentSchema.index({ animeId: 1, status: 1, createdAt: -1 });
commentSchema.index({ animeId: 1, parentId: 1, createdAt: 1 });

// Виртуальные поля
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

commentSchema.virtual('anime', {
  ref: 'Anime',
  localField: 'animeId',
  foreignField: '_id',
  justOne: true
});

commentSchema.virtual('parent', {
  ref: 'Comment',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentId'
});

// Виртуальные поля для подсчета лайков/дизлайков
commentSchema.virtual('likesCount').get(function() {
  return this.likes.filter(like => like.type === 'like').length;
});

commentSchema.virtual('dislikesCount').get(function() {
  return this.likes.filter(like => like.type === 'dislike').length;
});

commentSchema.virtual('totalLikes').get(function() {
  return this.likesCount - this.dislikesCount;
});

commentSchema.virtual('isReply').get(function() {
  return !!this.parentId;
});

commentSchema.virtual('reportsCount').get(function() {
  return this.reports.length;
});

// Middleware для валидации
commentSchema.pre('save', function(next) {
  // Проверяем, что ответ не может быть ответом на ответ (максимум 2 уровня)
  if (this.parentId && this.isNew) {
    this.constructor.findById(this.parentId)
      .then(parent => {
        if (parent && parent.parentId) {
          return next(new Error('Нельзя отвечать на ответ. Максимум 2 уровня комментариев.'));
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// Middleware для обновления истории редактирования
commentSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    // Сохраняем предыдущую версию в историю
    const previousContent = this.getUpdate ? this.getUpdate().$set?.content : this._original?.content;
    if (previousContent && previousContent !== this.content) {
      this.editHistory.push({
        content: previousContent,
        editedAt: new Date()
      });
      this.isEdited = true;
    }
  }
  next();
});

// Статические методы
commentSchema.statics.getAnimeComments = function(animeId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = -1,
    episodeNumber = null,
    includeReplies = true
  } = options;
  
  const query = {
    animeId: mongoose.Types.ObjectId(animeId),
    status: 'approved',
    parentId: null // Только родительские комментарии
  };
  
  if (episodeNumber) {
    query.episodeNumber = episodeNumber;
  }
  
  const sortObj = {};
  sortObj[sort] = order;
  
  // Сначала закрепленные, потом по сортировке
  const finalSort = { isPinned: -1, ...sortObj };
  
  let commentsQuery = this.find(query)
    .populate('userId', 'username avatar role')
    .sort(finalSort)
    .limit(limit)
    .skip((page - 1) * limit);
  
  if (includeReplies) {
    commentsQuery = commentsQuery.populate({
      path: 'replies',
      match: { status: 'approved' },
      populate: {
        path: 'userId',
        select: 'username avatar role'
      },
      options: { sort: { createdAt: 1 } }
    });
  }
  
  return commentsQuery;
};

commentSchema.statics.getUserComments = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = -1
  } = options;
  
  const sortObj = {};
  sortObj[sort] = order;
  
  return this.find({
    userId: mongoose.Types.ObjectId(userId),
    status: 'approved'
  })
    .populate('animeId', 'title images')
    .sort(sortObj)
    .limit(limit)
    .skip((page - 1) * limit);
};

commentSchema.statics.getReportedComments = function(options = {}) {
  const {
    page = 1,
    limit = 20,
    sort = 'createdAt',
    order = -1
  } = options;
  
  const sortObj = {};
  sortObj[sort] = order;
  
  return this.find({
    'reports.0': { $exists: true }, // Есть хотя бы одна жалоба
    status: { $in: ['approved', 'pending'] }
  })
    .populate('userId', 'username avatar')
    .populate('animeId', 'title')
    .sort(sortObj)
    .limit(limit)
    .skip((page - 1) * limit);
};

// Методы экземпляра
commentSchema.methods.addLike = function(userId, type = 'like') {
  // Удаляем предыдущий лайк/дизлайк от этого пользователя
  this.likes = this.likes.filter(like => !like.userId.equals(userId));
  
  // Добавляем новый
  this.likes.push({
    userId,
    type,
    createdAt: new Date()
  });
  
  return this.save();
};

commentSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => !like.userId.equals(userId));
  return this.save();
};

commentSchema.methods.getUserLike = function(userId) {
  return this.likes.find(like => like.userId.equals(userId));
};

commentSchema.methods.addReport = function(userId, reason, description = '') {
  // Проверяем, не жаловался ли уже этот пользователь
  const existingReport = this.reports.find(report => report.userId.equals(userId));
  if (existingReport) {
    throw new Error('Вы уже жаловались на этот комментарий');
  }
  
  this.reports.push({
    userId,
    reason,
    description,
    createdAt: new Date()
  });
  
  return this.save();
};

commentSchema.methods.moderate = function(moderatorId, status, reason = '') {
  this.status = status;
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  if (reason) {
    this.moderationReason = reason;
  }
  
  return this.save();
};

commentSchema.methods.pin = function() {
  this.isPinned = true;
  return this.save();
};

commentSchema.methods.unpin = function() {
  this.isPinned = false;
  return this.save();
};

commentSchema.methods.canEdit = function(userId, timeLimit = 15) {
  // Проверяем, что пользователь - автор комментария
  if (!this.userId.equals(userId)) {
    return false;
  }
  
  // Проверяем временное ограничение (в минутах)
  const now = new Date();
  const createdAt = new Date(this.createdAt);
  const diffMinutes = (now - createdAt) / (1000 * 60);
  
  return diffMinutes <= timeLimit;
};

commentSchema.methods.canDelete = function(userId, userRole = 'user') {
  // Автор может удалить свой комментарий
  if (this.userId.equals(userId)) {
    return true;
  }
  
  // Модераторы и админы могут удалять любые комментарии
  return ['moderator', 'admin'].includes(userRole);
};

module.exports = mongoose.model('Comment', commentSchema);