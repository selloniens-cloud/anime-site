const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Имя пользователя обязательно'],
    unique: true,
    trim: true,
    minlength: [3, 'Имя пользователя должно содержать минимум 3 символа'],
    maxlength: [20, 'Имя пользователя не должно превышать 20 символов'],
    match: [/^[a-zA-Z0-9_]+$/, 'Имя пользователя может содержать только буквы, цифры и подчеркивания']
  },
  
  email: {
    type: String,
    required: [true, 'Email обязателен'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Пожалуйста, введите корректный email'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Пароль обязателен'],
    minlength: [8, 'Пароль должен содержать минимум 8 символов'],
    select: false // По умолчанию не включать пароль в запросы
  },
  
  avatar: {
    type: String,
    default: null // Будет генерироваться автоматически
  },
  
  bio: {
    type: String,
    maxlength: [500, 'Биография не должна превышать 500 символов'],
    trim: true
  },
  
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    language: {
      type: String,
      enum: ['ru', 'en'],
      default: 'ru'
    },
    emailNotifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: true
    }
  },
  
  statistics: {
    totalWatched: {
      type: Number,
      default: 0
    },
    totalEpisodes: {
      type: Number,
      default: 0
    },
    totalMinutes: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    }
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  lastLogin: {
    type: Date,
    default: Date.now
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  bannedUntil: Date,
  banReason: String,
  
  // Refresh токен для аутентификации
  refreshToken: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Виртуальные поля
userSchema.virtual('watchLists', {
  ref: 'WatchList',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'userId'
});

// Индексы для оптимизации запросов
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// Middleware для хеширования пароля перед сохранением
userSchema.pre('save', async function(next) {
  // Хешировать пароль только если он был изменен
  if (!this.isModified('password')) return next();
  
  try {
    // Хеширование пароля с солью
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware для обновления lastLogin при каждом сохранении
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('lastLogin')) {
    this.lastLogin = new Date();
  }
  next();
});

// Метод для сравнения паролей
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Ошибка при сравнении паролей');
  }
};

// Метод для создания токена сброса пароля
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 минут
  
  return resetToken;
};

// Метод для создания токена верификации email
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = require('crypto').randomBytes(32).toString('hex');
  
  this.emailVerificationToken = require('crypto')
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
  
  return verificationToken;
};

// Метод для проверки активности пользователя
userSchema.methods.isUserActive = function() {
  if (!this.isActive) return false;
  if (this.bannedUntil && this.bannedUntil > Date.now()) return false;
  return true;
};

// Метод для получения публичного профиля
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  
  // Удаляем приватные поля
  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.email; // Email показываем только владельцу
  
  return userObject;
};

// Метод для генерации аватара из первой буквы никнейма
userSchema.methods.generateDefaultAvatar = function() {
  const firstLetter = this.username ? this.username.charAt(0).toUpperCase() : 'U';
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  const colorIndex = this.username ? this.username.charCodeAt(0) % colors.length : 0;
  const backgroundColor = colors[colorIndex];
  
  return `https://ui-avatars.com/api/?name=${firstLetter}&background=${backgroundColor.slice(1)}&color=fff&size=200&bold=true`;
};

// Метод для получения аватара (сгенерированного или загруженного)
userSchema.methods.getAvatarUrl = function() {
  if (this.avatar && !this.avatar.includes('ui-avatars.com')) {
    // Возвращаем загруженный аватар
    return this.avatar.startsWith('http') ? this.avatar : `/uploads/avatars/${this.avatar}`;
  }
  // Возвращаем сгенерированный аватар
  return this.generateDefaultAvatar();
};

// Статический метод для поиска пользователя по email или username
userSchema.statics.findByEmailOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier }
    ]
  }).select('+password');
};

// Статический метод для проверки уникальности username
userSchema.statics.isUsernameUnique = async function(username, excludeId = null) {
  const query = { username: username };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existingUser = await this.findOne(query);
  return !existingUser;
};

module.exports = mongoose.model('User', userSchema);