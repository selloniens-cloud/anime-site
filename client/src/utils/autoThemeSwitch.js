/**
 * Утилиты для автоматического переключения темы по времени
 */

import React from 'react';
import { getVideoSettingsDB, saveVideoSettingsDB } from './indexedDBProgress';

const DEFAULT_SCHEDULE = {
  lightStart: '06:00', // Светлая тема с 6:00
  darkStart: '20:00',  // Темная тема с 20:00
  enabled: false,
};

/**
 * Получение текущего времени в формате HH:MM
 */
const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Конвертация времени в минуты с начала дня
 */
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Определение какая тема должна быть активна в данное время
 */
export const getThemeForTime = (schedule = DEFAULT_SCHEDULE) => {
  const currentTime = getCurrentTime();
  const currentMinutes = timeToMinutes(currentTime);
  const lightStartMinutes = timeToMinutes(schedule.lightStart);
  const darkStartMinutes = timeToMinutes(schedule.darkStart);

  // Если темная тема начинается раньше светлой (например, 20:00 - 06:00)
  if (darkStartMinutes > lightStartMinutes) {
    if (currentMinutes >= lightStartMinutes && currentMinutes < darkStartMinutes) {
      return 'light';
    } else {
      return 'dark';
    }
  }
  // Если светлая тема начинается раньше темной (например, 06:00 - 20:00)
  else {
    if (currentMinutes >= darkStartMinutes && currentMinutes < lightStartMinutes) {
      return 'dark';
    } else {
      return 'light';
    }
  }
};

/**
 * Загрузка настроек автопереключения темы
 */
export const getAutoThemeSettings = async () => {
  try {
    const settings = await getVideoSettingsDB();
    return {
      ...DEFAULT_SCHEDULE,
      ...settings.autoTheme,
    };
  } catch (error) {
    console.error('Ошибка загрузки настроек автотемы:', error);
    return DEFAULT_SCHEDULE;
  }
};

/**
 * Сохранение настроек автопереключения темы
 */
export const saveAutoThemeSettings = async (newSettings) => {
  try {
    const currentSettings = await getVideoSettingsDB();
    await saveVideoSettingsDB({
      ...currentSettings,
      autoTheme: {
        ...DEFAULT_SCHEDULE,
        ...currentSettings.autoTheme,
        ...newSettings,
      },
    });
    return true;
  } catch (error) {
    console.error('Ошибка сохранения настроек автотемы:', error);
    return false;
  }
};

/**
 * Инициализация автопереключения темы
 */
export const initAutoThemeSwitch = (onThemeChange) => {
  let intervalId = null;
  let currentTheme = null;

  const checkAndSwitchTheme = async () => {
    try {
      const settings = await getAutoThemeSettings();

      if (!settings.enabled) {
        return;
      }

      const requiredTheme = getThemeForTime(settings);

      if (currentTheme !== requiredTheme) {
        currentTheme = requiredTheme;
        onThemeChange?.(requiredTheme);

        console.log(`Автопереключение темы: ${requiredTheme} в ${getCurrentTime()}`);
      }
    } catch (error) {
      console.error('Ошибка автопереключения темы:', error);
    }
  };

  const startAutoSwitch = () => {
    // Проверяем сразу при инициализации
    checkAndSwitchTheme();

    // Затем проверяем каждую минуту
    intervalId = setInterval(checkAndSwitchTheme, 60000);
  };

  const stopAutoSwitch = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const updateSettings = async (newSettings) => {
    await saveAutoThemeSettings(newSettings);

    if (newSettings.enabled) {
      stopAutoSwitch();
      startAutoSwitch();
    } else {
      stopAutoSwitch();
    }
  };

  // Автоматический запуск
  (async () => {
    const settings = await getAutoThemeSettings();
    if (settings.enabled) {
      startAutoSwitch();
    }
  })();

  return {
    start: startAutoSwitch,
    stop: stopAutoSwitch,
    updateSettings,
    getCurrentTheme: () => currentTheme,
    checkNow: checkAndSwitchTheme,
  };
};

/**
 * Хук для React компонентов
 */
export const useAutoThemeSwitch = (onThemeChange) => {
  const autoSwitchRef = React.useRef(null);

  React.useEffect(() => {
    autoSwitchRef.current = initAutoThemeSwitch(onThemeChange);

    return () => {
      if (autoSwitchRef.current) {
        autoSwitchRef.current.stop();
      }
    };
  }, [onThemeChange]);

  return {
    updateSettings: (settings) => autoSwitchRef.current?.updateSettings(settings),
    checkNow: () => autoSwitchRef.current?.checkNow(),
    getCurrentTheme: () => autoSwitchRef.current?.getCurrentTheme(),
  };
};

/**
 * Предустановленные расписания
 */
export const THEME_PRESETS = {
  standard: {
    name: 'Стандартное',
    lightStart: '06:00',
    darkStart: '20:00',
  },
  earlyBird: {
    name: 'Ранняя пташка',
    lightStart: '05:30',
    darkStart: '19:00',
  },
  nightOwl: {
    name: 'Сова',
    lightStart: '08:00',
    darkStart: '22:00',
  },
  workday: {
    name: 'Рабочий день',
    lightStart: '07:00',
    darkStart: '18:00',
  },
  student: {
    name: 'Студенческое',
    lightStart: '09:00',
    darkStart: '23:00',
  },
};

/**
 * Расчет времени до следующего переключения темы
 */
export const getTimeUntilNextSwitch = (schedule = DEFAULT_SCHEDULE) => {
  const currentMinutes = timeToMinutes(getCurrentTime());
  const lightStartMinutes = timeToMinutes(schedule.lightStart);
  const darkStartMinutes = timeToMinutes(schedule.darkStart);

  const minutesInDay = 24 * 60;
  let nextSwitchMinutes;
  let nextTheme;

  if (darkStartMinutes > lightStartMinutes) {
    // Обычный случай: свет днем, темнота ночью
    if (currentMinutes < lightStartMinutes) {
      nextSwitchMinutes = lightStartMinutes;
      nextTheme = 'light';
    } else if (currentMinutes < darkStartMinutes) {
      nextSwitchMinutes = darkStartMinutes;
      nextTheme = 'dark';
    } else {
      nextSwitchMinutes = lightStartMinutes + minutesInDay;
      nextTheme = 'light';
    }
  } else {
    // Инвертированный случай
    if (currentMinutes < darkStartMinutes) {
      nextSwitchMinutes = darkStartMinutes;
      nextTheme = 'dark';
    } else if (currentMinutes < lightStartMinutes) {
      nextSwitchMinutes = lightStartMinutes;
      nextTheme = 'light';
    } else {
      nextSwitchMinutes = darkStartMinutes + minutesInDay;
      nextTheme = 'dark';
    }
  }

  const minutesUntilSwitch = nextSwitchMinutes > currentMinutes ?
    nextSwitchMinutes - currentMinutes :
    nextSwitchMinutes + minutesInDay - currentMinutes;

  const hours = Math.floor(minutesUntilSwitch / 60);
  const minutes = minutesUntilSwitch % 60;

  return {
    hours,
    minutes,
    totalMinutes: minutesUntilSwitch,
    nextTheme,
    nextSwitchTime: `${Math.floor(nextSwitchMinutes / 60).toString().padStart(2, '0')}:${(nextSwitchMinutes % 60).toString().padStart(2, '0')}`,
  };
};

/**
 * Валидация времени
 */
export const isValidTime = (timeString) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(timeString);
};

/**
 * Проверка на корректность расписания
 */
export const validateSchedule = (schedule) => {
  const errors = [];

  if (!isValidTime(schedule.lightStart)) {
    errors.push('Некорректное время начала светлой темы');
  }

  if (!isValidTime(schedule.darkStart)) {
    errors.push('Некорректное время начала темной темы');
  }

  if (schedule.lightStart === schedule.darkStart) {
    errors.push('Время переключения тем не может быть одинаковым');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export default {
  getThemeForTime,
  getAutoThemeSettings,
  saveAutoThemeSettings,
  initAutoThemeSwitch,
  useAutoThemeSwitch,
  THEME_PRESETS,
  getTimeUntilNextSwitch,
  isValidTime,
  validateSchedule,
};
