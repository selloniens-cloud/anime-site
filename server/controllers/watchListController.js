const WatchList = require('../models/WatchList');
const Anime = require('../models/Anime');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../../shared/constants/constants');
const mongoose = require('mongoose');

class WatchListController {
  // Получение списка просмотра пользователя
  async getWatchList(req, res) {
    try {
      const { status, page = 1, limit = 20, sort = 'lastWatched', order = 'desc' } = req.query;
      const userId = req.user.id;

      // Построение фильтра
      const filter = { userId };
      if (status) {
        filter.status = status;
      }

      // Построение сортировки
      const sortOrder = order === 'desc' ? -1 : 1;
      const sortObj = {};
      sortObj[sort] = sortOrder;

      // Выполнение запроса
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [watchList, total] = await Promise.all([
        WatchList.find(filter)
          .populate('animeId', 'title images rating episodes status type year genres')
          .sort(sortObj)
          .skip(skip)
          .limit(parseInt(limit)),
        WatchList.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        success: true,
        data: {
          watchList,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalItems: total,
            itemsPerPage: parseInt(limit),
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('Get watch list error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Добавление аниме в список просмотра
  async addToWatchList(req, res) {
    try {
      const { animeId } = req.params;
      const { status, rating, notes, priority, isPrivate } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(animeId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      // Проверяем существование аниме
      const anime = await Anime.findById(animeId).where({ isActive: true, approved: true });
      if (!anime) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Аниме не найдено'
          }
        });
      }

      // Проверяем, не добавлено ли уже аниме в список
      const existingEntry = await WatchList.findOne({ userId, animeId });
      if (existingEntry) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Аниме уже добавлено в список просмотра'
          }
        });
      }

      // Создаем новую запись
      const watchListEntry = new WatchList({
        userId,
        animeId,
        status,
        rating,
        notes,
        priority,
        isPrivate,
        startDate: status === 'watching' ? new Date() : undefined
      });

      await watchListEntry.save();

      // Заполняем данные аниме для ответа
      await watchListEntry.populate('animeId', 'title images rating episodes status type');

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: {
          watchListEntry
        },
        message: 'Аниме добавлено в список просмотра'
      });

    } catch (error) {
      console.error('Add to watch list error:', error);
      
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

  // Обновление записи в списке просмотра
  async updateWatchListEntry(req, res) {
    try {
      const { id } = req.params;
      const { status, rating, notes, priority, isPrivate } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID записи'
          }
        });
      }

      // Находим запись
      const watchListEntry = await WatchList.findOne({ _id: id, userId });
      if (!watchListEntry) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Запись не найдена'
          }
        });
      }

      // Обновляем поля
      const updateData = {};
      if (status !== undefined) {
        updateData.status = status;
        
        // Автоматически устанавливаем даты
        if (status === 'watching' && !watchListEntry.startDate) {
          updateData.startDate = new Date();
        }
        if (status === 'completed' && !watchListEntry.finishDate) {
          updateData.finishDate = new Date();
        }
      }
      
      if (rating !== undefined) updateData.rating = rating;
      if (notes !== undefined) updateData.notes = notes;
      if (priority !== undefined) updateData.priority = priority;
      if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

      const updatedEntry = await WatchList.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('animeId', 'title images rating episodes status type');

      res.json({
        success: true,
        data: {
          watchListEntry: updatedEntry
        },
        message: 'Запись успешно обновлена'
      });

    } catch (error) {
      console.error('Update watch list entry error:', error);
      
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

  // Удаление из списка просмотра
  async removeFromWatchList(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID записи'
          }
        });
      }

      // Находим и удаляем запись
      const watchListEntry = await WatchList.findOneAndDelete({ _id: id, userId });
      if (!watchListEntry) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Запись не найдена'
          }
        });
      }

      res.json({
        success: true,
        message: 'Аниме удалено из списка просмотра'
      });

    } catch (error) {
      console.error('Remove from watch list error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Обновление прогресса просмотра
  async updateProgress(req, res) {
    try {
      const { id } = req.params;
      const { episodesWatched, timeWatched } = req.body;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID записи'
          }
        });
      }

      // Находим запись
      const watchListEntry = await WatchList.findOne({ _id: id, userId })
        .populate('animeId', 'episodes');
        
      if (!watchListEntry) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Запись не найдена'
          }
        });
      }

      // Обновляем прогресс
      await watchListEntry.updateProgress(episodesWatched, timeWatched);

      res.json({
        success: true,
        data: {
          watchListEntry
        },
        message: 'Прогресс обновлен'
      });

    } catch (error) {
      console.error('Update progress error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение статистики списка просмотра
  async getWatchListStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await WatchList.getUserStats(userId);

      res.json({
        success: true,
        data: {
          statistics: stats
        }
      });

    } catch (error) {
      console.error('Get watch list stats error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Получение записи по аниме
  async getWatchListEntry(req, res) {
    try {
      const { animeId } = req.params;
      const userId = req.user.id;

      if (!mongoose.Types.ObjectId.isValid(animeId)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Неверный ID аниме'
          }
        });
      }

      const watchListEntry = await WatchList.findUserEntry(userId, animeId);

      if (!watchListEntry) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          error: {
            message: 'Запись не найдена'
          }
        });
      }

      res.json({
        success: true,
        data: {
          watchListEntry
        }
      });

    } catch (error) {
      console.error('Get watch list entry error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Массовое обновление статуса
  async bulkUpdateStatus(req, res) {
    try {
      const { entryIds, status } = req.body;
      const userId = req.user.id;

      if (!Array.isArray(entryIds) || entryIds.length === 0) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Необходимо указать ID записей'
          }
        });
      }

      // Проверяем валидность ID
      const validIds = entryIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length !== entryIds.length) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Некорректные ID записей'
          }
        });
      }

      // Обновляем записи
      const updateData = { status };
      if (status === 'watching') {
        updateData.startDate = new Date();
      } else if (status === 'completed') {
        updateData.finishDate = new Date();
      }

      const result = await WatchList.updateMany(
        { 
          _id: { $in: validIds },
          userId 
        },
        updateData
      );

      res.json({
        success: true,
        data: {
          updatedCount: result.modifiedCount
        },
        message: `Обновлено записей: ${result.modifiedCount}`
      });

    } catch (error) {
      console.error('Bulk update status error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }

  // Экспорт списка просмотра
  async exportWatchList(req, res) {
    try {
      const userId = req.user.id;
      const { format = 'json' } = req.query;

      const watchList = await WatchList.find({ userId })
        .populate('animeId', 'title episodes year genres rating')
        .sort({ updatedAt: -1 });

      if (format === 'csv') {
        // Генерируем CSV
        const csvHeader = 'Title,Status,Rating,Episodes Watched,Start Date,Finish Date,Notes\n';
        const csvRows = watchList.map(entry => {
          const anime = entry.animeId;
          return [
            `"${anime.title.english || anime.title.romaji}"`,
            entry.status,
            entry.rating || '',
            entry.progress.episodesWatched,
            entry.startDate ? entry.startDate.toISOString().split('T')[0] : '',
            entry.finishDate ? entry.finishDate.toISOString().split('T')[0] : '',
            `"${entry.notes || ''}"`
          ].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="watchlist.csv"');
        res.send(csvContent);
      } else {
        // JSON формат
        res.json({
          success: true,
          data: {
            watchList,
            exportDate: new Date().toISOString(),
            totalEntries: watchList.length
          }
        });
      }

    } catch (error) {
      console.error('Export watch list error:', error);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR
        }
      });
    }
  }
}

module.exports = new WatchListController();