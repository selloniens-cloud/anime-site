const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants/constants');

// Middleware для проверки JWT токена
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Получаем токен из заголовка Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Проверяем наличие токена
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_TOKEN
        }
      });
    }

    try {
      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Получаем пользователя из базы данных
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.USER_NOT_FOUND
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

      // Добавляем пользователя в объект запроса
      req.user = user;
      next();

    } catch (error) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.INVALID_TOKEN
        }
      });
    }

  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.SERVER_ERROR
      }
    });
  }
};

// Middleware для проверки ролей пользователя
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.ACCESS_DENIED
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          message: 'Недостаточно прав для выполнения этого действия'
        }
      });
    }

    next();
  };
};

// Middleware для опциональной аутентификации (не обязательная)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Получаем токен из заголовка Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Если токена нет, продолжаем без аутентификации
    if (!token) {
      req.user = null;
      return next();
    }

    try {
      // Верифицируем токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Получаем пользователя из базы данных
      const user = await User.findById(decoded.id).select('-password');

      if (user && user.isUserActive()) {
        req.user = user;
      } else {
        req.user = null;
      }

    } catch (error) {
      // Если токен невалидный, просто продолжаем без пользователя
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

// Middleware для проверки владельца ресурса
const checkOwnership = (resourceModel, resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Ресурс не найден'
          }
        });
      }

      // Проверяем, является ли пользователь владельцем ресурса
      const isOwner = resource.userId && resource.userId.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      const isModerator = req.user.role === 'moderator';

      if (!isOwner && !isAdmin && !isModerator) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.ACCESS_DENIED
          }
        });
      }

      // Добавляем ресурс в объект запроса
      req.resource = resource;
      req.isOwner = isOwner;
      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  };
};

// Middleware для проверки самого себя или админа
const checkSelfOrAdmin = (userIdParam = 'userId') => {
  return (req, res, next) => {
    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (targetUserId !== currentUserId && !isAdmin) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.ACCESS_DENIED
        }
      });
    }

    next();
  };
};

// Utility функция для генерации JWT токена
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Utility функция для генерации refresh токена
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
  checkSelfOrAdmin,
  generateToken,
  generateRefreshToken
};