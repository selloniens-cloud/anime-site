import { useEffect, useRef, useCallback } from 'react';

/**
 * Расширенный хук для обработки горячих клавиш видеоплеера
 * Поддерживает все клавиши из технического задания
 */
const useVideoHotkeys = ({
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMute,
  onFullscreen,
  onSubtitlesToggle,
  onSubtitleSettings,
  onNextEpisode,
  onPrevEpisode,
  onSeekToPercent,
  onQualityToggle,
  onVoiceToggle,
  onSpeedChange,
  enabled = true,
  seekStep = 10,
  volumeStep = 0.1,
  enableOnFormTags = false
}) => {
  const pressedKeys = useRef(new Set());
  const lastKeyTime = useRef(0);
  const repeatTimeout = useRef(null);

  const isFormElement = useCallback((element) => {
    const tagName = element.tagName.toLowerCase();
    return ['input', 'textarea', 'select', 'button'].includes(tagName) ||
           element.contentEditable === 'true';
  }, []);

  const shouldIgnoreEvent = useCallback((event) => {
    if (!enabled) return true;
    if (!enableOnFormTags && isFormElement(event.target)) return true;
    if (event.ctrlKey && !['n', 'p', 's'].includes(event.key)) return true;
    if (event.altKey || event.metaKey) return true;
    
    return false;
  }, [enabled, enableOnFormTags, isFormElement]);

  const handleKeyDown = useCallback((event) => {
    if (shouldIgnoreEvent(event)) return;

    const key = event.key.toLowerCase();
    const code = event.code.toLowerCase();
    const now = Date.now();
    
    // Предотвращаем повторное срабатывание для некоторых клавиш
    if (pressedKeys.current.has(key) && now - lastKeyTime.current < 150) {
      return;
    }

    pressedKeys.current.add(key);
    lastKeyTime.current = now;

    // Обработка комбинаций клавиш
    if (event.ctrlKey) {
      switch (key) {
        case 'n':
          event.preventDefault();
          onNextEpisode?.();
          break;
        case 'p':
          event.preventDefault();
          onPrevEpisode?.();
          break;
        case 's':
          event.preventDefault();
          onSubtitleSettings?.();
          break;
      }
      return;
    }

    // Обработка одиночных клавиш
    switch (key) {
      case ' ':
      case 'spacebar':
        event.preventDefault();
        onPlayPause?.();
        break;

      case 'arrowleft':
      case 'left':
        event.preventDefault();
        onSeek?.(-seekStep);
        break;

      case 'arrowright':
      case 'right':
        event.preventDefault();
        onSeek?.(seekStep);
        break;

      case 'arrowup':
      case 'up':
        event.preventDefault();
        onVolumeChange?.(volumeStep);
        break;

      case 'arrowdown':
      case 'down':
        event.preventDefault();
        onVolumeChange?.(-volumeStep);
        break;

      case 'm':
        event.preventDefault();
        onMute?.();
        break;

      case 'f':
        event.preventDefault();
        onFullscreen?.();
        break;

      case 'c':
        event.preventDefault();
        onSubtitlesToggle?.();
        break;

      case 'q':
        event.preventDefault();
        onQualityToggle?.();
        break;

      case 'v':
        event.preventDefault();
        onVoiceToggle?.();
        break;

      // Быстрый переход по процентам (0-9)
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        const percent = parseInt(key) / 10;
        onSeekToPercent?.(percent);
        break;

      // Изменение скорости воспроизведения
      case ',':
      case '<':
        event.preventDefault();
        onSpeedChange?.(-0.25);
        break;

      case '.':
      case '>':
        event.preventDefault();
        onSpeedChange?.(0.25);
        break;

      // Дополнительные горячие клавиши
      case 'j':
        event.preventDefault();
        onSeek?.(-10);
        break;

      case 'l':
        event.preventDefault();
        onSeek?.(10);
        break;

      case 'k':
        event.preventDefault();
        onPlayPause?.();
        break;

      case 'home':
        event.preventDefault();
        onSeekToPercent?.(0);
        break;

      case 'end':
        event.preventDefault();
        onSeekToPercent?.(1);
        break;

      case 'escape':
        event.preventDefault();
        // Выход из полноэкранного режима
        if (document.fullscreenElement) {
          onFullscreen?.();
        }
        break;
    }
  }, [
    shouldIgnoreEvent,
    onPlayPause,
    onSeek,
    onVolumeChange,
    onMute,
    onFullscreen,
    onSubtitlesToggle,
    onSubtitleSettings,
    onNextEpisode,
    onPrevEpisode,
    onSeekToPercent,
    onQualityToggle,
    onVoiceToggle,
    onSpeedChange,
    seekStep,
    volumeStep
  ]);

  const handleKeyUp = useCallback((event) => {
    const key = event.key.toLowerCase();
    pressedKeys.current.delete(key);
    
    // Очищаем таймер повтора
    if (repeatTimeout.current) {
      clearTimeout(repeatTimeout.current);
      repeatTimeout.current = null;
    }
  }, []);

  // Очистка при потере фокуса
  const handleBlur = useCallback(() => {
    pressedKeys.current.clear();
    if (repeatTimeout.current) {
      clearTimeout(repeatTimeout.current);
      repeatTimeout.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleBlur);
      
      if (repeatTimeout.current) {
        clearTimeout(repeatTimeout.current);
      }
    };
  }, [enabled, handleKeyDown, handleKeyUp, handleBlur]);

  // Функции для программного управления
  const simulateKeyPress = useCallback((key) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true });
    handleKeyDown(event);
  }, [handleKeyDown]);

  return {
    simulateKeyPress,
    isKeyPressed: (key) => pressedKeys.current.has(key.toLowerCase()),
    pressedKeys: Array.from(pressedKeys.current)
  };
};

/**
 * Хук для отображения подсказок по горячим клавишам
 */
export const useHotkeyTooltips = () => {
  const hotkeys = [
    { key: 'Space', description: 'Воспроизведение/Пауза' },
    { key: '←/→', description: 'Перемотка на 10 сек' },
    { key: '↑/↓', description: 'Громкость' },
    { key: 'M', description: 'Отключить звук' },
    { key: 'F', description: 'Полный экран' },
    { key: 'C', description: 'Субтитры' },
    { key: 'Q', description: 'Качество' },
    { key: 'V', description: 'Озвучка' },
    { key: '0-9', description: 'Переход по %' },
    { key: 'J/L', description: 'Перемотка на 10 сек' },
    { key: 'K', description: 'Воспроизведение/Пауза' },
    { key: ',/.', description: 'Скорость воспроизведения' },
    { key: 'Ctrl+N', description: 'Следующий эпизод' },
    { key: 'Ctrl+P', description: 'Предыдущий эпизод' },
    { key: 'Ctrl+S', description: 'Настройки субтитров' },
    { key: 'Home/End', description: 'Начало/Конец' },
    { key: 'Esc', description: 'Выход из полного экрана' }
  ];

  return hotkeys;
};

export default useVideoHotkeys;