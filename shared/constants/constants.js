// HTTP статус коды
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Сообщения об ошибках
const ERROR_MESSAGES = {
  SERVER_ERROR: 'Внутренняя ошибка сервера',
  INVALID_TOKEN: 'Недействительный токен',
  ACCESS_DENIED: 'Доступ запрещен',
  USER_NOT_FOUND: 'Пользователь не найден',
  INVALID_CREDENTIALS: 'Неверные учетные данные',
  VALIDATION_ERROR: 'Ошибка валидации данных',
  RESOURCE_NOT_FOUND: 'Ресурс не найден',
  DUPLICATE_RESOURCE: 'Ресурс уже существует',
  RATE_LIMIT_EXCEEDED: 'Превышен лимит запросов',
  // Дополнительные сообщения для совместимости
  EMAIL_ALREADY_EXISTS: 'Пользователь с таким email уже существует',
  USERNAME_ALREADY_EXISTS: 'Пользователь с таким именем уже существует',
  TOKEN_EXPIRED: 'Токен истек',
  FILE_TOO_LARGE: 'Файл слишком большой',
  INVALID_FILE_TYPE: 'Недопустимый тип файла'
};

// Лимиты и ограничения
const LIMITS = {
  // Пользователи
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  BIO_MAX_LENGTH: 500,
  
  // Комментарии
  COMMENT_MAX_LENGTH: 2000,
  REPORT_DESCRIPTION_MAX_LENGTH: 500,
  
  // Заметки
  NOTES_MAX_LENGTH: 1000,
  
  // Рейтинги
  MIN_RATING: 1,
  MAX_RATING: 10,
  
  // Пагинация
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Файлы
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  
  // Поиск
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100
};

// Регулярные выражения
const REGEX = {
  USERNAME: /^[a-zA-Z0-9_]+$/,
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d).+$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  OBJECT_ID: /^[0-9a-fA-F]{24}$/
};

// Статусы аниме
const ANIME_STATUS = {
  FINISHED_AIRING: 'Finished Airing',
  CURRENTLY_AIRING: 'Currently Airing',
  NOT_YET_AIRED: 'Not yet aired'
};

// Типы аниме
const ANIME_TYPES = {
  TV: 'TV',
  MOVIE: 'Movie',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'Special',
  MUSIC: 'Music'
};

// Статусы просмотра
const WATCH_STATUS = {
  WATCHING: 'watching',
  COMPLETED: 'completed',
  PLAN_TO_WATCH: 'planToWatch',
  DROPPED: 'dropped',
  ON_HOLD: 'onHold'
};

// Роли пользователей
const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Статусы комментариев
const COMMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN: 'hidden'
};

// Причины жалоб
const REPORT_REASONS = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  HARASSMENT: 'harassment',
  SPOILER: 'spoiler',
  OTHER: 'other'
};

// Приоритеты
const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Темы оформления
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Языки
const LANGUAGES = {
  RU: 'ru',
  EN: 'en'
};

// Качество видео
const VIDEO_QUALITIES = {
  '360P': '360p',
  '480P': '480p',
  '720P': '720p',
  '1080P': '1080p',
  '1440P': '1440p',
  '2160P': '2160p'
};

// Форматы субтитров
const SUBTITLE_FORMATS = {
  SRT: 'srt',
  VTT: 'vtt',
  ASS: 'ass'
};

// События для логирования
const LOG_EVENTS = {
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  ANIME_VIEWED: 'anime_viewed',
  COMMENT_CREATED: 'comment_created',
  WATCHLIST_UPDATED: 'watchlist_updated',
  ADMIN_ACTION: 'admin_action',
  SECURITY_ALERT: 'security_alert'
};

// Типы уведомлений
const NOTIFICATION_TYPES = {
  NEW_EPISODE: 'new_episode',
  COMMENT_REPLY: 'comment_reply',
  SYSTEM: 'system',
  SECURITY: 'security'
};

module.exports = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  LIMITS,
  REGEX,
  ANIME_STATUS,
  ANIME_TYPES,
  WATCH_STATUS,
  USER_ROLES,
  COMMENT_STATUS,
  REPORT_REASONS,
  PRIORITIES,
  THEMES,
  LANGUAGES,
  VIDEO_QUALITIES,
  SUBTITLE_FORMATS,
  LOG_EVENTS,
  NOTIFICATION_TYPES
};