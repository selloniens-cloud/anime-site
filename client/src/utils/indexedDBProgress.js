/**
 * IndexedDB утилиты для сохранения прогресса просмотра видео
 * Заменяет localStorage для более надежного хранения
 */

const DB_NAME = 'AniLibertyPlayer';
const DB_VERSION = 1;
const STORES = {
  PROGRESS: 'video_progress',
  SETTINGS: 'video_settings',
  STATS: 'watch_stats',
  HISTORY: 'watch_history',
};

let dbInstance = null;

/**
 * Инициализация IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Ошибка открытия IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Создаем хранилище прогресса
      if (!db.objectStoreNames.contains(STORES.PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.PROGRESS, { keyPath: 'id' });
        progressStore.createIndex('animeId', 'animeId', { unique: false });
        progressStore.createIndex('lastWatched', 'lastWatched', { unique: false });
        progressStore.createIndex('completed', 'completed', { unique: false });
      }

      // Создаем хранилище настроек
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        const settingsStore = db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      // Создаем хранилище статистики
      if (!db.objectStoreNames.contains(STORES.STATS)) {
        const statsStore = db.createObjectStore(STORES.STATS, { keyPath: 'id' });
        statsStore.createIndex('date', 'date', { unique: false });
      }

      // Создаем хранилище истории просмотра
      if (!db.objectStoreNames.contains(STORES.HISTORY)) {
        const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('animeId', 'animeId', { unique: false });
      }
    };
  });
};

/**
 * Выполнение транзакции с обработкой ошибок
 */
const executeTransaction = async (storeName, mode, operation) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], mode);
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error(`Ошибка транзакции ${storeName}:`, error);
    throw error;
  }
};

/**
 * Сохранение прогресса просмотра в IndexedDB
 */
export const saveVideoProgressDB = async (animeId, episodeId, currentTime, duration, watchedPercent, metadata = {}) => {
  try {
    const progressData = {
      id: `${animeId}_${episodeId}`,
      animeId,
      episodeId,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      watchedPercent: Math.round(watchedPercent),
      lastWatched: new Date().toISOString(),
      completed: watchedPercent >= 90,
      quality: metadata.quality || 'auto',
      voice: metadata.voice || 0,
      subtitles: metadata.subtitles || false,
      playerType: metadata.playerType || 'aniliberty',
      version: 3, // Версия формата IndexedDB
    };

    await executeTransaction(STORES.PROGRESS, 'readwrite', (store) => {
      return store.put(progressData);
    });

    // Сохраняем в историю просмотра
    await saveWatchHistory(animeId, episodeId, currentTime, duration);

    return true;
  } catch (error) {
    console.error('Ошибка сохранения прогресса в IndexedDB:', error);
    // Fallback к localStorage
    return saveVideoProgressFallback(animeId, episodeId, currentTime, duration, watchedPercent, metadata);
  }
};

/**
 * Загрузка прогресса просмотра из IndexedDB
 */
export const loadVideoProgressDB = async (animeId, episodeId) => {
  try {
    const id = `${animeId}_${episodeId}`;

    const result = await executeTransaction(STORES.PROGRESS, 'readonly', (store) => {
      return store.get(id);
    });

    return result || null;
  } catch (error) {
    console.error('Ошибка загрузки прогресса из IndexedDB:', error);
    // Fallback к localStorage
    return loadVideoProgressFallback(animeId, episodeId);
  }
};

/**
 * Получение всего прогресса для аниме
 */
export const getAnimeProgressDB = async (animeId) => {
  try {
    const results = await executeTransaction(STORES.PROGRESS, 'readonly', (store) => {
      const index = store.index('animeId');
      return index.getAll(animeId);
    });

    const progress = {};
    results.forEach(item => {
      progress[item.episodeId] = item;
    });

    return progress;
  } catch (error) {
    console.error('Ошибка получения прогресса аниме из IndexedDB:', error);
    return {};
  }
};

/**
 * Сохранение настроек в IndexedDB
 */
export const saveVideoSettingsDB = async (settings) => {
  try {
    const settingsData = {
      key: 'main',
      ...settings,
      lastUpdated: new Date().toISOString(),
      version: 3,
    };

    await executeTransaction(STORES.SETTINGS, 'readwrite', (store) => {
      return store.put(settingsData);
    });

    return true;
  } catch (error) {
    console.error('Ошибка сохранения настроек в IndexedDB:', error);
    return false;
  }
};

/**
 * Загрузка настроек из IndexedDB
 */
export const getVideoSettingsDB = async () => {
  try {
    const result = await executeTransaction(STORES.SETTINGS, 'readonly', (store) => {
      return store.get('main');
    });

    const defaultSettings = {
      volume: 1.0,
      muted: false,
      quality: 'auto',
      autoplay: false,
      autoNext: false,
      subtitles: 'off',
      subtitleSettings: {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        background: 'rgba(0, 0, 0, 0.8)',
        position: 'bottom',
        offset: 80,
      },
      voice: 0,
      playerType: 'aniliberty',
      theme: 'dark',
      hotkeysEnabled: true,
      autoSave: true,
      seekStep: 10,
      volumeStep: 0.1,
      version: 3,
    };

    return result ? { ...defaultSettings, ...result } : defaultSettings;
  } catch (error) {
    console.error('Ошибка загрузки настроек из IndexedDB:', error);
    return await getVideoSettingsDB();
  }
};

/**
 * Сохранение истории просмотра
 */
const saveWatchHistory = async (animeId, episodeId, currentTime, duration) => {
  try {
    const historyData = {
      animeId,
      episodeId,
      currentTime,
      duration,
      timestamp: new Date().toISOString(),
      watchDate: new Date().toDateString(),
    };

    await executeTransaction(STORES.HISTORY, 'readwrite', (store) => {
      return store.add(historyData);
    });

    // Ограничиваем историю 1000 записями
    await cleanupHistory();
  } catch (error) {
    console.error('Ошибка сохранения истории:', error);
  }
};

/**
 * Очистка старой истории
 */
const cleanupHistory = async () => {
  try {
    const results = await executeTransaction(STORES.HISTORY, 'readonly', (store) => {
      const index = store.index('timestamp');
      return index.getAll();
    });

    if (results.length > 1000) {
      // Сортируем по времени и удаляем старые записи
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const toDelete = results.slice(1000);

      await executeTransaction(STORES.HISTORY, 'readwrite', (store) => {
        toDelete.forEach(item => store.delete(item.id));
        return { success: true };
      });
    }
  } catch (error) {
    console.error('Ошибка очистки истории:', error);
  }
};

/**
 * Получение статистики просмотра
 */
export const getWatchingStatsDB = async () => {
  try {
    const progressResults = await executeTransaction(STORES.PROGRESS, 'readonly', (store) => {
      return store.getAll();
    });

    const stats = {
      totalEpisodes: progressResults.length,
      completedEpisodes: progressResults.filter(p => p.completed).length,
      totalWatchTime: progressResults.reduce((sum, p) => sum + p.currentTime, 0),
      averageWatchPercent: 0,
      lastWatched: null,
      mostWatchedAnime: null,
      watchingStreak: 0,
      favoriteQuality: 'auto',
      favoritePlayerType: 'aniliberty',
    };

    if (stats.totalEpisodes > 0) {
      const totalPercent = progressResults.reduce((sum, p) => sum + p.watchedPercent, 0);
      stats.averageWatchPercent = Math.round(totalPercent / stats.totalEpisodes);

      // Находим последний просмотренный
      const sortedByDate = progressResults.sort((a, b) =>
        new Date(b.lastWatched) - new Date(a.lastWatched),
      );
      stats.lastWatched = sortedByDate[0]?.lastWatched;

      // Статистика по аниме
      const animeStats = {};
      progressResults.forEach(progress => {
        if (!animeStats[progress.animeId]) {
          animeStats[progress.animeId] = { episodes: 0, watchTime: 0 };
        }
        animeStats[progress.animeId].episodes++;
        animeStats[progress.animeId].watchTime += progress.currentTime;
      });

      // Находим самое просматриваемое аниме
      let maxWatchTime = 0;
      Object.entries(animeStats).forEach(([animeId, data]) => {
        if (data.watchTime > maxWatchTime) {
          maxWatchTime = data.watchTime;
          stats.mostWatchedAnime = animeId;
        }
      });

      // Статистика качества и плеера
      const qualityCount = {};
      const playerCount = {};
      progressResults.forEach(p => {
        qualityCount[p.quality] = (qualityCount[p.quality] || 0) + 1;
        playerCount[p.playerType] = (playerCount[p.playerType] || 0) + 1;
      });

      stats.favoriteQuality = Object.keys(qualityCount).reduce((a, b) =>
        qualityCount[a] > qualityCount[b] ? a : b,
      );
      stats.favoritePlayerType = Object.keys(playerCount).reduce((a, b) =>
        playerCount[a] > playerCount[b] ? a : b,
      );
    }

    return stats;
  } catch (error) {
    console.error('Ошибка получения статистики из IndexedDB:', error);
    return {
      totalEpisodes: 0,
      completedEpisodes: 0,
      totalWatchTime: 0,
      averageWatchPercent: 0,
      lastWatched: null,
      mostWatchedAnime: null,
      watchingStreak: 0,
      favoriteQuality: 'auto',
      favoritePlayerType: 'aniliberty',
    };
  }
};

/**
 * Миграция данных из localStorage в IndexedDB
 */
export const migrateFromLocalStorage = async () => {
  try {
    console.log('Начинаем миграцию данных из localStorage в IndexedDB...');

    // Импортируем функции из старого модуля
    const { getVideoProgress, getVideoSettings } = await import('./videoProgress.js');

    // Миграция прогресса
    const oldProgress = getVideoProgress();
    if (Object.keys(oldProgress).length > 0) {
      console.log(`Мигрируем ${Object.keys(oldProgress).length} записей прогресса...`);

      for (const [key, progress] of Object.entries(oldProgress)) {
        const [animeId, episodeId] = key.split('_');
        if (animeId && episodeId) {
          await saveVideoProgressDB(
            animeId,
            episodeId,
            progress.currentTime,
            progress.duration,
            progress.watchedPercent,
            {
              quality: progress.quality,
              voice: progress.voice,
              subtitles: progress.subtitles,
              playerType: progress.playerType || 'aniliberty',
            },
          );
        }
      }
    }

    // Миграция настроек
    const oldSettings = getVideoSettings();
    if (oldSettings) {
      console.log('Мигрируем настройки...');
      await saveVideoSettingsDB(oldSettings);
    }

    console.log('Миграция завершена успешно!');
    return true;
  } catch (error) {
    console.error('Ошибка миграции:', error);
    return false;
  }
};

/**
 * Fallback функции для использования localStorage при ошибках IndexedDB
 */
const saveVideoProgressFallback = (animeId, episodeId, currentTime, duration, watchedPercent, metadata) => {
  try {
    const key = `progress_${animeId}_${episodeId}`;
    const data = {
      animeId,
      episodeId,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      watchedPercent: Math.round(watchedPercent),
      lastWatched: new Date().toISOString(),
      completed: watchedPercent >= 90,
      ...metadata,
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Fallback: ошибка сохранения в localStorage:', error);
    return false;
  }
};

const loadVideoProgressFallback = (animeId, episodeId) => {
  try {
    const key = `progress_${animeId}_${episodeId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Fallback: ошибка загрузки из localStorage:', error);
    return null;
  }
};

/**
 * Проверка поддержки IndexedDB
 */
export const isIndexedDBSupported = () => {
  return typeof indexedDB !== 'undefined';
};

/**
 * Экспорт всех данных из IndexedDB
 */
export const exportAllDataDB = async () => {
  try {
    const [progress, settings, stats] = await Promise.all([
      executeTransaction(STORES.PROGRESS, 'readonly', (store) => store.getAll()),
      executeTransaction(STORES.SETTINGS, 'readonly', (store) => store.getAll()),
      getWatchingStatsDB(),
    ]);

    return {
      progress,
      settings,
      stats,
      exportDate: new Date().toISOString(),
      version: 3,
      source: 'IndexedDB',
    };
  } catch (error) {
    console.error('Ошибка экспорта данных из IndexedDB:', error);
    return null;
  }
};

/**
 * Очистка всех данных из IndexedDB
 */
export const clearAllDataDB = async () => {
  try {
    await Promise.all([
      executeTransaction(STORES.PROGRESS, 'readwrite', (store) => store.clear()),
      executeTransaction(STORES.SETTINGS, 'readwrite', (store) => store.clear()),
      executeTransaction(STORES.STATS, 'readwrite', (store) => store.clear()),
      executeTransaction(STORES.HISTORY, 'readwrite', (store) => store.clear()),
    ]);

    return true;
  } catch (error) {
    console.error('Ошибка очистки данных IndexedDB:', error);
    return false;
  }
};

// Автоматическая инициализация при импорте модуля
if (isIndexedDBSupported()) {
  initDB().catch(console.error);
}
