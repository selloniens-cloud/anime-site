const Favorites = require('../models/Favorites');
const Anime = require('../models/Anime');
const { createError } = require('../utils/errorUtils');
const { validationResult } = require('express-validator');

const favoritesController = {
  // GET /api/favorites - Получение избранного пользователя
  getFavorites: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { category, limit = 50, page = 1, sort = '-createdAt' } = req.query;
      
      const skip = (page - 1) * parseInt(limit);
      const options = {
        category,
        limit: parseInt(limit),
        skip,
        sort: sort === '-createdAt' ? { createdAt: -1 } : 
              sort === '-priority' ? { priority: -1, createdAt: -1 } :
              sort === 'title' ? { 'anime.title.english': 1 } :
              { createdAt: -1 }
      };
      
      const favorites = await Favorites.getUserFavorites(userId, options);
      
      const total = await Favorites.countDocuments({ 
        userId, 
        ...(category && { category }) 
      });
      
      res.json({
        success: true,
        data: favorites,
        pagination: {
          total,
          page: parseInt(page),
          perPage: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/favorites/:animeId - Добавление аниме в избранное
  addToFavorites: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError('Ошибки валидации', 400, errors.array()));
      }
      
      const userId = req.user.id;
      const { animeId } = req.params;
      const { 
        category = 'favorite', 
        tags = [], 
        note = '', 
        priority = 5,
        reminderDate 
      } = req.body;
      
      // Проверяем существование аниме
      const anime = await Anime.findById(animeId);
      if (!anime) {
        return next(createError('Аниме не найдено', 404));
      }
      
      // Проверяем, не добавлено ли уже
      const existingFavorite = await Favorites.findOne({ userId, animeId });
      if (existingFavorite) {
        // Обновляем существующую запись
        existingFavorite.category = category;
        existingFavorite.tags = tags;
        existingFavorite.note = note;
        existingFavorite.priority = priority;
        if (reminderDate) {
          existingFavorite.reminderDate = reminderDate;
          existingFavorite.reminderActive = true;
        }
        
        await existingFavorite.save();
        await existingFavorite.populate('anime', 'title images rating episodes status year genres');
        
        return res.json({
          success: true,
          message: 'Избранное обновлено',
          data: existingFavorite
        });
      }
      
      // Создаем новую запись
      const favoriteData = {
        userId,
        animeId,
        category,
        tags,
        note,
        priority,
        source: 'manual'
      };
      
      if (reminderDate) {
        favoriteData.reminderDate = reminderDate;
        favoriteData.reminderActive = true;
      }
      
      const favorite = new Favorites(favoriteData);
      await favorite.save();
      await favorite.populate('anime', 'title images rating episodes status year genres');
      
      res.status(201).json({
        success: true,
        message: 'Аниме добавлено в избранное',
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/favorites/:id - Обновление записи избранного
  updateFavorite: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(createError('Ошибки валидации', 400, errors.array()));
      }
      
      const userId = req.user.id;
      const { id } = req.params;
      const updateData = req.body;
      
      const favorite = await Favorites.findOne({ _id: id, userId });
      if (!favorite) {
        return next(createError('Запись в избранном не найдена', 404));
      }
      
      // Обновляем поля
      Object.keys(updateData).forEach(key => {
        if (favorite.schema.paths[key] && key !== '_id' && key !== 'userId') {
          favorite[key] = updateData[key];
        }
      });
      
      await favorite.save();
      await favorite.populate('anime', 'title images rating episodes status year genres');
      
      res.json({
        success: true,
        message: 'Избранное обновлено',
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/favorites/:id - Удаление из избранного
  removeFromFavorites: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const favorite = await Favorites.findOneAndDelete({ _id: id, userId });
      if (!favorite) {
        return next(createError('Запись в избранном не найдена', 404));
      }
      
      res.json({
        success: true,
        message: 'Аниме удалено из избранного'
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/favorites/anime/:animeId - Удаление аниме из избранного по ID аниме
  removeAnimeFromFavorites: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { animeId } = req.params;
      
      const favorite = await Favorites.findOneAndDelete({ userId, animeId });
      if (!favorite) {
        return next(createError('Аниме не найдено в избранном', 404));
      }
      
      res.json({
        success: true,
        message: 'Аниме удалено из избранного'
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/favorites/check/:animeId - Проверка, есть ли аниме в избранном
  checkFavorite: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { animeId } = req.params;
      
      const favorite = await Favorites.checkIfFavorite(userId, animeId);
      
      res.json({
        success: true,
        data: {
          isFavorite: !!favorite,
          favorite: favorite || null
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/favorites/stats - Статистика избранного
  getFavoritesStats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const stats = await Favorites.getUserStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/favorites/categories - Получение избранного по категориям
  getFavoritesByCategory: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { category } = req.params;
      const { limit = 20, page = 1 } = req.query;
      
      const skip = (page - 1) * parseInt(limit);
      const options = {
        limit: parseInt(limit),
        skip,
        sort: { priority: -1, createdAt: -1 }
      };
      
      const favorites = await Favorites.getFavoritesByCategory(userId, category, options);
      
      const total = await Favorites.countDocuments({ userId, category });
      
      res.json({
        success: true,
        data: favorites,
        pagination: {
          total,
          page: parseInt(page),
          perPage: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/favorites/:id/tags - Добавление тега
  addTag: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { tag } = req.body;
      
      if (!tag || typeof tag !== 'string' || tag.trim().length === 0) {
        return next(createError('Некорректный тег', 400));
      }
      
      const favorite = await Favorites.findOne({ _id: id, userId });
      if (!favorite) {
        return next(createError('Запись в избранном не найдена', 404));
      }
      
      await favorite.addTag(tag.trim());
      await favorite.populate('anime', 'title images rating');
      
      res.json({
        success: true,
        message: 'Тег добавлен',
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/favorites/:id/tags/:tag - Удаление тега
  removeTag: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id, tag } = req.params;
      
      const favorite = await Favorites.findOne({ _id: id, userId });
      if (!favorite) {
        return next(createError('Запись в избранном не найдена', 404));
      }
      
      await favorite.removeTag(tag);
      await favorite.populate('anime', 'title images rating');
      
      res.json({
        success: true,
        message: 'Тег удален',
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/favorites/:id/reminder - Установка напоминания
  setReminder: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { reminderDate } = req.body;
      
      if (!reminderDate || new Date(reminderDate) <= new Date()) {
        return next(createError('Дата напоминания должна быть в будущем', 400));
      }
      
      const favorite = await Favorites.findOne({ _id: id, userId });
      if (!favorite) {
        return next(createError('Запись в избранном не найдена', 404));
      }
      
      await favorite.setReminder(new Date(reminderDate));
      await favorite.populate('anime', 'title images rating');
      
      res.json({
        success: true,
        message: 'Напоминание установлено',
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/favorites/:id/reminder - Отмена напоминания
  cancelReminder: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const favorite = await Favorites.findOne({ _id: id, userId });
      if (!favorite) {
        return next(createError('Запись в избранном не найдена', 404));
      }
      
      await favorite.cancelReminder();
      await favorite.populate('anime', 'title images rating');
      
      res.json({
        success: true,
        message: 'Напоминание отменено',
        data: favorite
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/favorites/export - Экспорт избранного
  exportFavorites: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const favorites = await Favorites.find({ userId })
        .populate('anime', 'title images rating episodes year genres')
        .sort({ createdAt: -1 });
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        totalItems: favorites.length,
        favorites: favorites.map(fav => ({
          anime: {
            title: fav.anime.title,
            year: fav.anime.year,
            episodes: fav.anime.episodes,
            genres: fav.anime.genres,
            rating: fav.anime.rating
          },
          category: fav.category,
          priority: fav.priority,
          tags: fav.tags,
          note: fav.note,
          addedAt: fav.createdAt,
          reminderDate: fav.reminderDate
        }))
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=favorites-export.json');
      res.json(exportData);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = favoritesController;