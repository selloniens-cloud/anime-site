/**
 * Утилиты для сохранения и загрузки прогресса просмотра видео
 */

const STORAGE_KEYS = {
  PROGRESS: 'video_progress',
  SETTINGS: 'video_settings',
  PLAYER_PREFERENCES: 'player_preferences',
};

/**
 * Сохранение прогресса просмотра
 * @param {string} animeId - ID аниме
 * @param {string} episodeId - ID эпизода
 * @param {number} currentTime - Текущее время просмотра в секундах
 * @param {number} duration - Общая длительность видео в секундах
 * @param {number} watchedPercent - Процент просмотра
 * @param {Object} metadata - Дополнительные данные (качество, озвучка, субтитры)
 */
export const saveVideoProgress = (animeId, episodeId, currentTime, duration, watchedPercent, metadata = {}) => {
  try {
    const progressData = getVideoProgress();
    const key = `${animeId}_${episodeId}`;

    progressData[key] = {
      animeId,
      episodeId,
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration),
      watchedPercent: Math.round(watchedPercent),
      lastWatched: new Date().toISOString(),
      completed: watchedPercent >= 90, // Считаем завершенным при 90%+
      quality: metadata.quality || 'auto',
      voice: metadata.voice || 0,
      subtitles: metadata.subtitles || false,
      version: 2, // Версия формата данных
    };

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));

    // Также сохраняем в отдельный ключ для быстрого доступа
    localStorage.setItem(`progress_${key}`, JSON.stringify(progressData[key]));

    return true;
  } catch (error) {
    // console.error('Ошибка сохранения прогресса:', error);
    return false;
  }
};

/**
 * Загрузка прогресса просмотра
 * @param {string} animeId - ID аниме
 * @param {string} episodeId - ID эпизода
 * @returns {Object|null} Данные прогресса или null
 */
export const loadVideoProgress = (animeId, episodeId) => {
  try {
    const key = `${animeId}_${episodeId}`;

    // Сначала пробуем быстрый доступ
    const quickAccess = localStorage.getItem(`progress_${key}`);
    if (quickAccess) {
      return JSON.parse(quickAccess);
    }

    // Если нет, ищем в общем хранилище
    const progressData = getVideoProgress();
    return progressData[key] || null;
  } catch (error) {
    // console.error('Ошибка загрузки прогресса:', error);
    return null;
  }
};

/**
 * Получение всех данных прогресса
 * @returns {Object} Объект с данными прогресса
 */
export const getVideoProgress = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    // console.error('Ошибка получения данных прогресса:', error);
    return {};
  }
};

/**
 * Получение прогресса для всех эпизодов аниме
 * @param {string} animeId - ID аниме
 * @returns {Object} Объект с прогрессом эпизодов
 */
export const getAnimeProgress = (animeId) => {
  try {
    const allProgress = getVideoProgress();
    const animeProgress = {};

    Object.keys(allProgress).forEach(key => {
      if (key.startsWith(`${animeId}_`)) {
        const episodeId = key.replace(`${animeId}_`, '');
        animeProgress[episodeId] = allProgress[key];
      }
    });

    return animeProgress;
  } catch (error) {
    // console.error('Ошибка получения прогресса аниме:', error);
    return {};
  }
};

/**
 * Удаление прогресса просмотра
 * @param {string} animeId - ID аниме
 * @param {string} episodeId - ID эпизода (опционально)
 */
export const removeVideoProgress = (animeId, episodeId = null) => {
  try {
    const progressData = getVideoProgress();

    if (episodeId) {
      // Удаляем конкретный эпизод
      const key = `${animeId}_${episodeId}`;
      delete progressData[key];
      localStorage.removeItem(`progress_${key}`);
    } else {
      // Удаляем все эпизоды аниме
      Object.keys(progressData).forEach(key => {
        if (key.startsWith(`${animeId}_`)) {
          delete progressData[key];
          localStorage.removeItem(`progress_${key}`);
        }
      });
    }

    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progressData));
    return true;
  } catch (error) {
    // console.error('Ошибка удаления прогресса:', error);
    return false;
  }
};

/**
 * Получение настроек видеоплеера
 * @returns {Object} Настройки плеера
 */
export const getVideoSettings = () => {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const defaultSettings = {
      volume: 1.0,
      muted: false,
      quality: 'auto',
      autoplay: false,
      autoNext: false,
      subtitles: 'off', // 'off', 'ru', 'en', 'ja'
      subtitleSettings: {
        fontSize: '18px',
        fontFamily: 'Arial, sans-serif',
        color: '#ffffff',
        background: 'rgba(0, 0, 0, 0.8)',
        position: 'bottom',
        offset: 80,
      },
      voice: 0, // Индекс выбранной озвучки
      playerType: 'aniliberty', // 'aniliberty', 'videojs', 'plyr', 'html5'
      theme: 'dark', // 'dark', 'light', 'auto'
      hotkeysEnabled: true,
      version: 2, // Версия настроек
    };

    if (!settings) {
      return defaultSettings;
    }

    const parsed = JSON.parse(settings);

    // Миграция старых настроек
    if (!parsed.version || parsed.version < 2) {
      const migrated = { ...defaultSettings, ...parsed, version: 2 };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(migrated));
      return migrated;
    }

    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.warn('Ошибка чтения настроек видеоплеера:', error);
    return {
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
      version: 2,
    };
  }
};

/**
 * Сохранение настроек видеоплеера
 * @param {Object} newSettings - Новые настройки
 * @returns {boolean} Успешность сохранения
 */
export const saveVideoSettings = (newSettings) => {
  try {
    const currentSettings = getVideoSettings();
    const updatedSettings = {
      ...currentSettings,
      ...newSettings,
      lastUpdated: new Date().toISOString(),
      version: 2,
    };

    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

    // Уведомляем другие вкладки об изменении настроек
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('videoSettingsChanged', {
        detail: updatedSettings,
      }));
    }

    return true;
  } catch (error) {
    console.error('Ошибка сохранения настроек:', error);
    return false;
  }
};

/**
 * Сброс настроек видеоплеера к дефолтным
 * @returns {boolean} Успешность сброса
 */
export const resetVideoSettings = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    return true;
  } catch (error) {
    console.error('Ошибка сброса настроек:', error);
    return false;
  }
};

/**
 * Получение настроек субтитров
 * @returns {Object} Настройки субтитров
 */
export const getSubtitleSettings = () => {
  const settings = getVideoSettings();
  return settings.subtitleSettings || {};
};

/**
 * Сохранение настроек субтитров
 * @param {Object} subtitleSettings - Новые настройки субтитров
 * @returns {boolean} Успешность сохранения
 */
export const saveSubtitleSettings = (subtitleSettings) => {
  const currentSettings = getVideoSettings();
  return saveVideoSettings({
    subtitleSettings: {
      ...currentSettings.subtitleSettings,
      ...subtitleSettings,
    },
  });
};

/**
 * Получение последней выбранной озвучки для аниме
 * @param {string} animeId - ID аниме
 * @returns {number} Индекс озвучки
 */
export const getLastVoiceForAnime = (animeId) => {
  try {
    const voiceData = localStorage.getItem(`voice_${animeId}`);
    return voiceData ? parseInt(JSON.parse(voiceData)) : 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Сохранение выбранной озвучки для аниме
 * @param {string} animeId - ID аниме
 * @param {number} voiceIndex - Индекс озвучки
 * @returns {boolean} Успешность сохранения
 */
export const saveLastVoiceForAnime = (animeId, voiceIndex) => {
  try {
    localStorage.setItem(`voice_${animeId}`, JSON.stringify(voiceIndex));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Получение последнего выбранного качества для аниме
 * @param {string} animeId - ID аниме
 * @returns {string} Качество видео
 */
export const getLastQualityForAnime = (animeId) => {
  try {
    const qualityData = localStorage.getItem(`quality_${animeId}`);
    return qualityData ? JSON.parse(qualityData) : 'auto';
  } catch (error) {
    return 'auto';
  }
};

/**
 * Сохранение выбранного качества для аниме
 * @param {string} animeId - ID аниме
 * @param {string} quality - Качество видео
 * @returns {boolean} Успешность сохранения
 */
export const saveLastQualityForAnime = (animeId, quality) => {
  try {
    localStorage.setItem(`quality_${animeId}`, JSON.stringify(quality));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Сохранение предпочтений плеера
 * @param {Object} preferences - Предпочтения плеера
 */
export const savePlayerPreferences = (preferences) => {
  try {
    const currentPrefs = getPlayerPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };

    localStorage.setItem(STORAGE_KEYS.PLAYER_PREFERENCES, JSON.stringify(updatedPrefs));
    return true;
  } catch (error) {
    // console.error('Ошибка сохранения предпочтений плеера:', error);
    return false;
  }
};

/**
 * Загрузка предпочтений плеера
 * @returns {Object} Предпочтения плеера
 */
export const getPlayerPreferences = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLAYER_PREFERENCES);
    const defaultPreferences = {
      preferredPlayer: 'auto',
      fallbackPlayers: ['videojs', 'plyr', 'html5'],
      enablePlayerSelector: false,
      theme: 'dark',
      controlsTimeout: 3000,
      seekStep: 10,
      volumeStep: 0.1,
    };

    return data ? { ...defaultPreferences, ...JSON.parse(data) } : defaultPreferences;
  } catch (error) {
    // console.error('Ошибка загрузки предпочтений плеера:', error);
    return {
      preferredPlayer: 'auto',
      fallbackPlayers: ['videojs', 'plyr', 'html5'],
      enablePlayerSelector: false,
      theme: 'dark',
      controlsTimeout: 3000,
      seekStep: 10,
      volumeStep: 0.1,
    };
  }
};

/**
 * Очистка всех данных видеоплеера
 */
export const clearAllVideoData = () => {
  try {
    // Удаляем основные ключи
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PLAYER_PREFERENCES);

    // Удаляем все ключи прогресса
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('progress_')) {
        localStorage.removeItem(key);
      }
    });

    return true;
  } catch (error) {
    // console.error('Ошибка очистки данных:', error);
    return false;
  }
};

/**
 * Получение статистики просмотра
 * @returns {Object} Статистика просмотра
 */
export const getWatchingStats = () => {
  try {
    const progressData = getVideoProgress();
    const stats = {
      totalEpisodes: 0,
      completedEpisodes: 0,
      totalWatchTime: 0,
      averageWatchPercent: 0,
      lastWatched: null,
      mostWatchedAnime: null,
    };

    const animeStats = {};
    let totalPercent = 0;

    Object.values(progressData).forEach(progress => {
      stats.totalEpisodes++;
      stats.totalWatchTime += progress.currentTime;
      totalPercent += progress.watchedPercent;

      if (progress.completed) {
        stats.completedEpisodes++;
      }

      if (!stats.lastWatched || new Date(progress.lastWatched) > new Date(stats.lastWatched)) {
        stats.lastWatched = progress.lastWatched;
      }

      // Статистика по аниме
      if (!animeStats[progress.animeId]) {
        animeStats[progress.animeId] = { episodes: 0, watchTime: 0 };
      }
      animeStats[progress.animeId].episodes++;
      animeStats[progress.animeId].watchTime += progress.currentTime;
    });

    if (stats.totalEpisodes > 0) {
      stats.averageWatchPercent = Math.round(totalPercent / stats.totalEpisodes);

      // Находим самое просматриваемое аниме
      let maxWatchTime = 0;
      Object.entries(animeStats).forEach(([animeId, data]) => {
        if (data.watchTime > maxWatchTime) {
          maxWatchTime = data.watchTime;
          stats.mostWatchedAnime = animeId;
        }
      });
    }

    return stats;
  } catch (error) {
    // console.error('Ошибка получения статистики:', error);
    return {
      totalEpisodes: 0,
      completedEpisodes: 0,
      totalWatchTime: 0,
      averageWatchPercent: 0,
      lastWatched: null,
      mostWatchedAnime: null,
    };
  }
};

/**
 * Экспорт данных для резервного копирования
 * @returns {Object} Все данные видеоплеера
 */
export const exportVideoData = () => {
  try {
    return {
      progress: getVideoProgress(),
      settings: getVideoSettings(),
      preferences: getPlayerPreferences(),
      stats: getWatchingStats(),
      exportDate: new Date().toISOString(),
    };
  } catch (error) {
    // console.error('Ошибка экспорта данных:', error);
    return null;
  }
};

/**
 * Импорт данных из резервной копии
 * @param {Object} data - Данные для импорта
 * @returns {boolean} Успешность импорта
 */
export const importVideoData = (data) => {
  try {
    if (data.progress) {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(data.progress));
    }

    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }

    if (data.preferences) {
      localStorage.setItem(STORAGE_KEYS.PLAYER_PREFERENCES, JSON.stringify(data.preferences));
    }

    return true;
  } catch (error) {
    // console.error('Ошибка импорта данных:', error);
    return false;
  }
};
