// Основной универсальный компонент
export { default as VideoPlayer, PLAYER_TYPES, useVideoPlayer } from './VideoPlayer';

// Новые компоненты для AniLiberty
export { default as AniLibertyPlayer } from './AniLibertyPlayer';
export { default as EnhancedAniLibertyPlayer } from './EnhancedAniLibertyPlayer';
export { default as EnhancedEpisodePlayer } from './EnhancedEpisodePlayer';
export { default as SubtitleManager } from './SubtitleManager';
export { default as VoiceSelector } from './VoiceSelector';
export { default as QualityController } from './QualityController';

// Отдельные плееры для прямого использования
export { default as HTML5Player } from './HTML5Player';
export { default as VideoJSPlayer } from './VideoJSPlayer';
export { default as PlyrPlayer } from './PlyrPlayer';
export { default as HLSPlayer } from './HLSPlayer';
export { default as DashPlayer } from './DashPlayer';

// Старый плеер эпизодов (для обратной совместимости)
export { default as EpisodeVideoPlayer } from './EpisodeVideoPlayer';

// Утилиты для работы с видео
export const VideoUtils = {
  // Определение типа видео по URL
  getVideoType: (url) => {
    if (!url) return 'unknown';

    const extension = url.split('.').pop()?.toLowerCase() || '';

    switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'ogv':
    case 'ogg':
      return 'video/ogg';
    case 'm3u8':
      return 'application/vnd.apple.mpegurl';
    case 'mpd':
      return 'application/dash+xml';
    default:
      return 'video/mp4';
    }
  },

  // Проверка поддержки формата браузером
  canPlayType: (type) => {
    const video = document.createElement('video');
    return video.canPlayType(type) !== '';
  },

  // Проверка поддержки MSE
  supportsMSE: () => {
    return 'MediaSource' in window;
  },

  // Проверка поддержки HLS
  supportsHLS: () => {
    const video = document.createElement('video');
    return video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
           VideoUtils.supportsMSE();
  },

  // Проверка поддержки DASH
  supportsDASH: () => {
    return VideoUtils.supportsMSE();
  },

  // Форматирование времени
  formatTime: (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },

  // Форматирование размера файла
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  },

  // Форматирование битрейта
  formatBitrate: (bitrate) => {
    if (bitrate > 1000000) {
      return `${(bitrate / 1000000).toFixed(1)}M`;
    } else if (bitrate > 1000) {
      return `${Math.round(bitrate / 1000)}k`;
    }
    return `${bitrate}`;
  },

  // Получение качества видео из URL или объекта
  getVideoQuality: (source) => {
    if (typeof source === 'string') {
      const match = source.match(/(\d+)p/);
      return match ? parseInt(match[1]) : null;
    }

    if (typeof source === 'object' && source.height) {
      return source.height;
    }

    return null;
  },

  // Создание источников для разных качеств
  createQualitySources: (baseUrl, qualities = [720, 480, 360]) => {
    return qualities.map(quality => ({
      src: baseUrl.replace(/(\.\w+)$/, `_${quality}p$1`),
      height: quality,
      label: `${quality}p`,
      type: VideoUtils.getVideoType(baseUrl),
    }));
  },

  // Проверка является ли видео Live стримом
  isLiveStream: (url) => {
    return url.includes('live') || url.includes('stream') || url.includes('.m3u8');
  },

  // Получение превью кадра из видео
  getVideoThumbnail: (videoElement, time = 0) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const video = videoElement.cloneNode();
      video.currentTime = time;

      video.addEventListener('loadeddata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(URL.createObjectURL(blob));
          } else {
            reject(new Error('Не удалось создать превью'));
          }
        });
      });

      video.addEventListener('error', reject);
      video.load();
    });
  },

  // Определение типа озвучки
  getVoiceType: (voice) => {
    if (!voice) return 'unknown';
    
    if (voice.language === 'ja' || voice.original) return 'original';
    if (voice.type === 'dub') return 'dub';
    if (voice.type === 'sub') return 'sub';
    
    return 'dub';
  },

  // Получение иконки для типа озвучки
  getVoiceIcon: (voice) => {
    const type = VideoUtils.getVoiceType(voice);
    
    switch (type) {
      case 'original':
        return '🎌';
      case 'dub':
        return voice.language === 'ru' ? '🇷🇺' : '🎭';
      case 'sub':
        return '📝';
      default:
        return '🎵';
    }
  },

  // Парсинг WebVTT субтитров
  parseWebVTT: (vttText) => {
    const lines = vttText.split('\n');
    const cues = [];
    let currentCue = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Пропускаем заголовок WEBVTT
      if (line.startsWith('WEBVTT') || line === '') {
        continue;
      }

      // Проверяем временные метки
      const timeMatch = line.match(/^(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{2}:)?(\d{2}):(\d{2})\.(\d{3})$/);
      
      if (timeMatch) {
        // Создаем новую реплику
        currentCue = {
          start: VideoUtils.parseVTTTime(timeMatch[0].split(' --> ')[0]),
          end: VideoUtils.parseVTTTime(timeMatch[0].split(' --> ')[1]),
          text: ''
        };
        continue;
      }

      // Если есть текущая реплика и строка не пустая
      if (currentCue && line) {
        if (currentCue.text) {
          currentCue.text += '\n' + line;
        } else {
          currentCue.text = line;
        }
      }

      // Если следующая строка пустая или мы достигли конца, сохраняем реплику
      if (currentCue && (i === lines.length - 1 || lines[i + 1].trim() === '')) {
        cues.push(currentCue);
        currentCue = null;
      }
    }

    return cues;
  },

  // Парсинг времени WebVTT
  parseVTTTime: (timeString) => {
    const parts = timeString.split(':');
    let seconds = 0;

    if (parts.length === 3) {
      // HH:MM:SS.mmm
      seconds += parseInt(parts[0]) * 3600;
      seconds += parseInt(parts[1]) * 60;
      seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS.mmm
      seconds += parseInt(parts[0]) * 60;
      seconds += parseFloat(parts[1]);
    }

    return seconds;
  }
};

// Константы для настроек плееров
export const PlayerDefaults = {
  // Стандартные скорости воспроизведения
  PLAYBACK_RATES: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],

  // Стандартные качества видео
  VIDEO_QUALITIES: [
    { height: 2160, label: '4K', bitrate: 15000000 },
    { height: 1440, label: '1440p', bitrate: 8000000 },
    { height: 1080, label: '1080p', bitrate: 5000000 },
    { height: 720, label: '720p', bitrate: 2500000 },
    { height: 480, label: '480p', bitrate: 1000000 },
    { height: 360, label: '360p', bitrate: 500000 },
    { height: 240, label: '240p', bitrate: 250000 },
  ],

  // Настройки HLS по умолчанию
  HLS_CONFIG: {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 90,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    liveSyncDurationCount: 3,
  },

  // Настройки DASH по умолчанию
  DASH_CONFIG: {
    stableBufferTime: 12,
    bufferTimeAtTopQuality: 30,
    bufferTimeAtTopQualityLongForm: 60,
    longFormContentDurationThreshold: 600,
  },

  // Горячие клавиши
  HOTKEYS: {
    PLAY_PAUSE: 'space',
    SEEK_BACKWARD: 'left',
    SEEK_FORWARD: 'right',
    VOLUME_UP: 'up',
    VOLUME_DOWN: 'down',
    MUTE: 'm',
    FULLSCREEN: 'f',
    SUBTITLES: 'c',
    SUBTITLE_SETTINGS: 'ctrl+s',
    NEXT_EPISODE: 'ctrl+n',
    PREV_EPISODE: 'ctrl+p',
    SEEK_TO_PERCENT: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  },

  // Настройки субтитров по умолчанию
  SUBTITLE_SETTINGS: {
    fontSize: '18px',
    mobileFontSize: '16px',
    fontFamily: 'Arial, sans-serif',
    fontWeight: '500',
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.8)',
    position: 'bottom',
    offset: 80
  }
};

// Типы событий плеера
export const PlayerEvents = {
  // Основные события
  PLAY: 'play',
  PAUSE: 'pause',
  ENDED: 'ended',
  TIME_UPDATE: 'timeupdate',
  PROGRESS: 'progress',

  // События загрузки
  LOAD_START: 'loadstart',
  LOAD_END: 'loadend',
  CAN_PLAY: 'canplay',
  CAN_PLAY_THROUGH: 'canplaythrough',

  // События ошибок
  ERROR: 'error',
  STALLED: 'stalled',
  WAITING: 'waiting',

  // События качества
  QUALITY_CHANGE: 'qualitychange',
  BITRATE_CHANGE: 'bitratechange',

  // События озвучки
  VOICE_CHANGE: 'voicechange',
  VOICES_LOADED: 'voicesloaded',

  // События субтитров
  SUBTITLE_CHANGE: 'subtitlechange',
  SUBTITLES_LOADED: 'subtitlesloaded',

  // События плеера
  PLAYER_CHANGE: 'playerchange',
  FULLSCREEN_CHANGE: 'fullscreenchange',
  VOLUME_CHANGE: 'volumechange',
};

// Коды ошибок
export const PlayerErrors = {
  ABORTED: 1,
  NETWORK: 2,
  DECODE: 3,
  SRC_NOT_SUPPORTED: 4,

  // Кастомные ошибки
  PLAYER_NOT_SUPPORTED: 100,
  MANIFEST_LOAD_ERROR: 101,
  SEGMENT_LOAD_ERROR: 102,
  DRM_ERROR: 103,
  SUBTITLE_LOAD_ERROR: 104,
  VOICE_LOAD_ERROR: 105,
  API_ERROR: 106,
};