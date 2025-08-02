const User = require('../models/User');
const WatchList = require('../models/WatchList');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants/constants');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class UserController {
  // Получение профиля пользователя
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
        .populate({
          path: 'watchLists',
          populate: {
            path: 'animeId',
            select: 'title images rating episodes'
          }
        });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.USER_NOT_FOUND
          }
        });
      }

      // Получаем статистику пользователя
      const stats = await WatchList.getUserStats(user._id);

      res.json({
        success: true,
        data: {
          user,
          statistics: stats
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Обновление профиля пользователя
  async updateProfile(req, res) {
    try {
      const { username, bio, preferences } = req.body;
      const userId = req.user.id;

      // Проверяем уникальность username, если он изменился
      if (username && username !== req.user.username) {
        const existingUser = await User.findOne({ 
          username, 
          _id: { $ne: userId } 
        });
        
        if (existingUser) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
              message: 'Пользователь с таким именем уже существует'
            }
          });
        }
      }

      // Обновляем профиль
      const updateData = {};
      if (username) updateData.username = username;
      if (bio !== undefined) updateData.bio = bio;
      if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -refreshToken -emailVerificationToken -passwordResetToken');

      res.json({
        success: true,
        data: {
          user
        },
        message: 'Профиль успешно обновлен'
      });

    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Ошибка валидации данных',
            details: Object.values(error.errors).map(err => err.message)
          }
        });
      }

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Смена пароля
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Получаем пользователя с паролем
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.USER_NOT_FOUND
          }
        });
      }

      // Проверяем текущий пароль
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный текущий пароль'
          }
        });
      }

      // Обновляем пароль
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Пароль успешно изменен'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Загрузка аватара
  async uploadAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Файл не предоставлен'
          }
        });
      }

      const userId = req.user.id;
      const filename = `avatar_${userId}_${Date.now()}.jpg`;
      const avatarPath = path.join('uploads', 'avatars', filename);

      // Создаем директорию если не существует
      await fs.mkdir(path.dirname(avatarPath), { recursive: true });

      // Обрабатываем изображение
      await sharp(req.file.buffer)
        .resize(200, 200)
        .jpeg({ quality: 90 })
        .toFile(avatarPath);

      // Удаляем старый аватар если он не дефолтный
      const user = await User.findById(userId);
      if (user.avatar && !user.avatar.includes('placeholder')) {
        const oldAvatarPath = user.avatar.replace('/uploads/', 'uploads/');
        try {
          await fs.unlink(oldAvatarPath);
        } catch (error) {
          console.warn('Could not delete old avatar:', error.message);
        }
      }

      // Обновляем путь к аватару в базе данных
      const avatarUrl = `/uploads/avatars/${filename}`;
      await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

      res.json({
        success: true,
        data: {
          avatarUrl
        },
        message: 'Аватар успешно загружен'
      });

    } catch (error) {
      console.error('Upload avatar error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение публичного профиля пользователя
  async getPublicProfile(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('username avatar bio createdAt statistics preferences.publicProfile');

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.USER_NOT_FOUND
          }
        });
      }

      // Проверяем, публичный ли профиль
      if (!user.preferences.publicProfile) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'Профиль пользователя приватный'
          }
        });
      }

      // Получаем публичную статистику
      const stats = await WatchList.getUserStats(userId);

      // Получаем публичные списки просмотра
      const publicWatchLists = await WatchList.find({
        userId,
        isPrivate: false
      })
      .populate('animeId', 'title images rating')
      .sort({ updatedAt: -1 })
      .limit(10);

      res.json({
        success: true,
        data: {
          user: user.getPublicProfile(),
          statistics: stats,
          recentActivity: publicWatchLists
        }
      });

    } catch (error) {
      console.error('Get public profile error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение статистики пользователя
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      
      // Проверяем права доступа
      if (userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.ACCESS_DENIED
          }
        });
      }

      const stats = await WatchList.getUserStats(userId);

      // Дополнительная статистика
      const additionalStats = await User.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'userId',
            as: 'comments'
          }
        },
        {
          $project: {
            totalComments: { $size: '$comments' },
            joinDate: '$createdAt',
            lastActivity: '$lastLogin'
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          watchingStats: stats,
          additionalStats: additionalStats[0] || {}
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Удаление аккаунта
  async deleteAccount(req, res) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      // Получаем пользователя с паролем для подтверждения
      const user = await User.findById(userId).select('+password');
      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.USER_NOT_FOUND
          }
        });
      }

      // Проверяем пароль
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный пароль'
          }
        });
      }

      // Удаляем связанные данные
      await Promise.all([
        WatchList.deleteMany({ userId }),
        // Comment.deleteMany({ userId }), // Можно оставить комментарии как анонимные
      ]);

      // Удаляем аватар если он не дефолтный
      if (user.avatar && !user.avatar.includes('placeholder')) {
        const avatarPath = user.avatar.replace('/uploads/', 'uploads/');
        try {
          await fs.unlink(avatarPath);
        } catch (error) {
          console.warn('Could not delete avatar:', error.message);
        }
      }

      // Удаляем пользователя
      await User.findByIdAndDelete(userId);

      res.json({
        success: true,
        message: 'Аккаунт успешно удален'
      });

    } catch (error) {
      console.error('Delete account error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }
}

// Конфигурация multer для загрузки аватаров
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  }
});

module.exports = {
  userController: new UserController(),
  avatarUpload
};