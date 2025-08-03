const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants/constants');
const crypto = require('crypto');

class AuthController {
  // Регистрация нового пользователя
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      // Проверяем, существует ли пользователь
      const existingUser = await User.findByEmailOrUsername(email);
      if (existingUser) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Пользователь с таким email или именем уже существует'
          }
        });
      }

      // Создаем нового пользователя
      const user = new User({
        username,
        email,
        password
      });

      // Создаем токен верификации email
      const verificationToken = user.createEmailVerificationToken();
      await user.save();

      // Генерируем JWT токены
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Сохраняем refresh токен в базе (можно использовать отдельную коллекцию)
      user.refreshToken = refreshToken;
      await user.save();

      // Отправляем email верификации (заглушка)
      // await emailService.sendVerificationEmail(user.email, verificationToken);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: 'Пользователь успешно зарегистрирован'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Вход в систему
  async login(req, res) {
    try {
      console.log('🔍 LOGIN DEBUG - Request body:', req.body);
      console.log('🔍 LOGIN DEBUG - Request headers:', req.headers);
      
      const { email, password } = req.body;
      console.log('🔍 LOGIN DEBUG - Extracted email:', email);
      console.log('🔍 LOGIN DEBUG - Password provided:', !!password);

      // Находим пользователя по email или username
      const user = await User.findByEmailOrUsername(email);
      console.log('🔍 LOGIN DEBUG - User found:', !!user);
      if (user) {
        console.log('🔍 LOGIN DEBUG - User details:', {
          id: user._id,
          username: user.username,
          email: user.email,
          isActive: user.isActive
        });
      }
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: 'Неверные учетные данные'
          }
        });
      }

      // Проверяем пароль
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: 'Неверные учетные данные'
          }
        });
      }

      // Проверяем активность пользователя
      if (!user.isUserActive()) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'Аккаунт заблокирован или неактивен'
          }
        });
      }

      // Генерируем новые токены
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Обновляем refresh токен и время последнего входа
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified,
            preferences: user.preferences
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: 'Успешный вход в систему'
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Обновление токена
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: 'Refresh токен не предоставлен'
          }
        });
      }

      // Находим пользователя с данным refresh токеном
      const user = await User.findOne({ refreshToken });
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: 'Недействительный refresh токен'
          }
        });
      }

      // Проверяем активность пользователя
      if (!user.isUserActive()) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'Аккаунт заблокирован или неактивен'
          }
        });
      }

      // Генерируем новые токены
      const newAccessToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);

      // Обновляем refresh токен
      user.refreshToken = newRefreshToken;
      await user.save();

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Выход из системы
  async logout(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (user) {
        // Удаляем refresh токен
        user.refreshToken = undefined;
        await user.save();
      }

      res.json({
        success: true,
        message: 'Успешный выход из системы'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение текущего пользователя
  async getMe(req, res) {
    try {
      const user = await User.findById(req.user.id)
        .populate('watchLists')
        .select('-password -refreshToken');

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.USER_NOT_FOUND
          }
        });
      }

      res.json({
        success: true,
        data: {
          user
        }
      });

    } catch (error) {
      console.error('Get me error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Забыли пароль
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Не раскрываем, существует ли пользователь
        return res.json({
          success: true,
          message: 'Если пользователь с таким email существует, инструкции отправлены на почту'
        });
      }

      // Создаем токен сброса пароля
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // Отправляем email с инструкциями (заглушка)
      // await emailService.sendPasswordResetEmail(user.email, resetToken);

      res.json({
        success: true,
        message: 'Если пользователь с таким email существует, инструкции отправлены на почту'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Сброс пароля
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      // Хешируем токен для поиска
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Находим пользователя с действующим токеном
      const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Недействительный или истекший токен'
          }
        });
      }

      // Обновляем пароль
      user.password = password;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Генерируем новые токены
      const accessToken = generateToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      user.refreshToken = refreshToken;
      await user.save();

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: 'Пароль успешно изменен'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Верификация email
  async verifyEmail(req, res) {
    try {
      const { token } = req.params;

      // Хешируем токен для поиска
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Находим пользователя с действующим токеном
      const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Недействительный или истекший токен верификации'
          }
        });
      }

      // Подтверждаем email
      user.isEmailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Email успешно подтвержден'
      });

    } catch (error) {
      console.error('Verify email error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }
}

module.exports = new AuthController();