// Общие константы для клиента и сервера

// Статусы аниме
export const ANIME_STATUS = {
  FINISHED_AIRING: 'Finished Airing',
  CURRENTLY_AIRING: 'Currently Airing',
  NOT_YET_AIRED: 'Not yet aired'
};

// Типы аниме
export const ANIME_TYPES = {
  TV: 'TV',
  MOVIE: 'Movie',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'Special',
  MUSIC: 'Music'
};

// Сезоны
export const SEASONS = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall'
};

// Статусы списков просмотра
export const WATCH_STATUS = {
  WATCHING: 'watching',
  COMPLETED: 'completed',
  PLAN_TO_WATCH: 'planToWatch',
  DROPPED: 'dropped',
  ON_HOLD: 'onHold'
};

// Названия статусов для отображения
export const WATCH_STATUS_LABELS = {
  [WATCH_STATUS.WATCHING]: 'Смотрю',
  [WATCH_STATUS.COMPLETED]: 'Завершено',
  [WATCH_STATUS.PLAN_TO_WATCH]: 'Планирую',
  [WATCH_STATUS.DROPPED]: 'Брошено',
  [WATCH_STATUS.ON_HOLD]: 'Отложено'
};

// Приоритеты
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const PRIORITY_LABELS = {
  [PRIORITIES.LOW]: 'Низкий',
  [PRIORITIES.MEDIUM]: 'Средний',
  [PRIORITIES.HIGH]: 'Высокий'
};

// Значения пересмотра
export const REWATCH_VALUES = {
  VERY_LOW: 'very low',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  VERY_HIGH: 'very high'
};

export const REWATCH_VALUE_LABELS = {
  [REWATCH_VALUES.VERY_LOW]: 'Очень низкое',
  [REWATCH_VALUES.LOW]: 'Низкое',
  [REWATCH_VALUES.MEDIUM]: 'Среднее',
  [REWATCH_VALUES.HIGH]: 'Высокое',
  [REWATCH_VALUES.VERY_HIGH]: 'Очень высокое'
};

// Роли пользователей
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

export const USER_ROLE_LABELS = {
  [USER_ROLES.USER]: 'Пользователь',
  [USER_ROLES.MODERATOR]: 'Модератор',
  [USER_ROLES.ADMIN]: 'Администратор'
};

// Темы оформления
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

export const THEME_LABELS = {
  [THEMES.LIGHT]: 'Светлая',
  [THEMES.DARK]: 'Темная',
  [THEMES.AUTO]: 'Автоматическая'
};

// Языки
export const LANGUAGES = {
  RU: 'ru',
  EN: 'en'
};

export const LANGUAGE_LABELS = {
  [LANGUAGES.RU]: 'Русский',
  [LANGUAGES.EN]: 'English'
};

// Статусы комментариев
export const COMMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  HIDDEN: 'hidden'
};

// Причины жалоб
export const REPORT_REASONS = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  HARASSMENT: 'harassment',
  SPOILER: 'spoiler',
  OTHER: 'other'
};

export const REPORT_REASON_LABELS = {
  [REPORT_REASONS.SPAM]: 'Спам',
  [REPORT_REASONS.INAPPROPRIATE]: 'Неподходящий контент',
  [REPORT_REASONS.HARASSMENT]: 'Домогательства',
  [REPORT_REASONS.SPOILER]: 'Спойлеры',
  [REPORT_REASONS.OTHER]: 'Другое'
};

// Теги комментариев
export const COMMENT_TAGS = {
  SPOILER: 'spoiler',
  REVIEW: 'review',
  RECOMMENDATION: 'recommendation',
  DISCUSSION: 'discussion'
};

export const COMMENT_TAG_LABELS = {
  [COMMENT_TAGS.SPOILER]: 'Спойлер',
  [COMMENT_TAGS.REVIEW]: 'Обзор',
  [COMMENT_TAGS.RECOMMENDATION]: 'Рекомендация',
  [COMMENT_TAGS.DISCUSSION]: 'Обсуждение'
};

// Возрастные рейтинги
export const AGE_RATINGS = {
  G: 'G',
  PG: 'PG',
  PG_13: 'PG-13',
  R: 'R',
  R_PLUS: 'R+',
  RX: 'Rx'
};

export const AGE_RATING_LABELS = {
  [AGE_RATINGS.G]: 'G - Для всех возрастов',
  [AGE_RATINGS.PG]: 'PG - Под родительским контролем',
  [AGE_RATINGS.PG_13]: 'PG-13 - От 13 лет',
  [AGE_RATINGS.R]: 'R - От 17 лет',
  [AGE_RATINGS.R_PLUS]: 'R+ - Жестокое содержание',
  [AGE_RATINGS.RX]: 'Rx - Хентай'
};

// Демографические группы
export const DEMOGRAPHICS = {
  SHOUNEN: 'Shounen',
  SHOUJO: 'Shoujo',
  SEINEN: 'Seinen',
  JOSEI: 'Josei',
  KIDS: 'Kids'
};

export const DEMOGRAPHIC_LABELS = {
  [DEMOGRAPHICS.SHOUNEN]: 'Сёнен',
  [DEMOGRAPHICS.SHOUJO]: 'Сёдзё',
  [DEMOGRAPHICS.SEINEN]: 'Сэйнэн',
  [DEMOGRAPHICS.JOSEI]: 'Дзёсэй',
  [DEMOGRAPHICS.KIDS]: 'Детское'
};

// Качество видео
export const VIDEO_QUALITIES = {
  '360P': '360p',
  '480P': '480p',
  '720P': '720p',
  '1080P': '1080p',
  '1440P': '1440p',
  '2160P': '2160p'
};

// Видеоплееры
export const VIDEO_PLAYERS = {
  HTML5: 'html5',
  VIDEOJS: 'videojs',
  PLYR: 'plyr'
};

export const VIDEO_PLAYER_LABELS = {
  [VIDEO_PLAYERS.HTML5]: 'HTML5 Video',
  [VIDEO_PLAYERS.VIDEOJS]: 'Video.js',
  [VIDEO_PLAYERS.PLYR]: 'Plyr'
};

// Форматы субтитров
export const SUBTITLE_FORMATS = {
  SRT: 'srt',
  VTT: 'vtt',
  ASS: 'ass'
};

// Типы отношений между аниме
export const RELATION_TYPES = {
  SEQUEL: 'Sequel',
  PREQUEL: 'Prequel',
  ALTERNATIVE_SETTING: 'Alternative setting',
  ALTERNATIVE_VERSION: 'Alternative version',
  SIDE_STORY: 'Side story',
  PARENT_STORY: 'Parent story',
  SUMMARY: 'Summary',
  FULL_STORY: 'Full story',
  SPIN_OFF: 'Spin-off',
  OTHER: 'Other'
};

export const RELATION_TYPE_LABELS = {
  [RELATION_TYPES.SEQUEL]: 'Продолжение',
  [RELATION_TYPES.PREQUEL]: 'Приквел',
  [RELATION_TYPES.ALTERNATIVE_SETTING]: 'Альтернативная вселенная',
  [RELATION_TYPES.ALTERNATIVE_VERSION]: 'Альтернативная версия',
  [RELATION_TYPES.SIDE_STORY]: 'Побочная история',
  [RELATION_TYPES.PARENT_STORY]: 'Основная история',
  [RELATION_TYPES.SUMMARY]: 'Краткое изложение',
  [RELATION_TYPES.FULL_STORY]: 'Полная история',
  [RELATION_TYPES.SPIN_OFF]: 'Спин-офф',
  [RELATION_TYPES.OTHER]: 'Другое'
};

// Источники данных
export const DATA_SOURCES = {
  MAL: 'mal',
  ANILIST: 'anilist',
  KITSU: 'kitsu',
  MANUAL: 'manual'
};

export const DATA_SOURCE_LABELS = {
  [DATA_SOURCES.MAL]: 'MyAnimeList',
  [DATA_SOURCES.ANILIST]: 'AniList',
  [DATA_SOURCES.KITSU]: 'Kitsu',
  [DATA_SOURCES.MANUAL]: 'Ручной ввод'
};

// Популярные жанры аниме
export const POPULAR_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports',
  'Supernatural', 'Thriller', 'Ecchi', 'Harem', 'Isekai',
  'Mecha', 'Military', 'Music', 'Parody', 'Psychological',
  'School', 'Space', 'Super Power', 'Vampire', 'Yaoi', 'Yuri'
];

// Лимиты и ограничения
export const LIMITS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 8,
  BIO_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 2000,
  NOTES_MAX_LENGTH: 1000,
  TAG_MAX_LENGTH: 50,
  SYNOPSIS_MAX_LENGTH: 5000,
  REPORT_DESCRIPTION_MAX_LENGTH: 500,
  
  // Пагинация
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Файлы
  MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Рейтинги
  MIN_RATING: 1,
  MAX_RATING: 10,
  
  // Временные ограничения
  COMMENT_EDIT_TIME_LIMIT: 15, // минут
  PASSWORD_RESET_EXPIRE: 10, // минут
  EMAIL_VERIFICATION_EXPIRE: 24, // часов
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 15, // минут
  RATE_LIMIT_MAX_REQUESTS: 100
};

// Регулярные выражения
export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  USERNAME: /^[a-zA-Z0-9_]+$/,
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/, // Минимум 8 символов, буквы и цифры
  URL: /^https?:\/\/.+/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};

// HTTP статус коды
export const HTTP_STATUS = {
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
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Неверные учетные данные',
  USER_NOT_FOUND: 'Пользователь не найден',
  EMAIL_ALREADY_EXISTS: 'Email уже используется',
  USERNAME_ALREADY_EXISTS: 'Имя пользователя уже занято',
  INVALID_TOKEN: 'Недействительный токен',
  TOKEN_EXPIRED: 'Токен истек',
  ACCESS_DENIED: 'Доступ запрещен',
  ANIME_NOT_FOUND: 'Аниме не найдено',
  COMMENT_NOT_FOUND: 'Комментарий не найден',
  WATCHLIST_ENTRY_NOT_FOUND: 'Запись в списке не найдена',
  INVALID_RATING: 'Неверный рейтинг',
  COMMENT_EDIT_TIME_EXPIRED: 'Время редактирования комментария истекло',
  ALREADY_REPORTED: 'Вы уже жаловались на этот контент',
  RATE_LIMIT_EXCEEDED: 'Превышен лимит запросов',
  FILE_TOO_LARGE: 'Файл слишком большой',
  INVALID_FILE_TYPE: 'Неподдерживаемый тип файла',
  SERVER_ERROR: 'Внутренняя ошибка сервера'
};

// Сообщения об успехе
export const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'Пользователь успешно зарегистрирован',
  USER_LOGGED_IN: 'Вход выполнен успешно',
  USER_LOGGED_OUT: 'Выход выполнен успешно',
  PASSWORD_UPDATED: 'Пароль успешно обновлен',
  PROFILE_UPDATED: 'Профиль успешно обновлен',
  COMMENT_CREATED: 'Комментарий добавлен',
  COMMENT_UPDATED: 'Комментарий обновлен',
  COMMENT_DELETED: 'Комментарий удален',
  WATCHLIST_UPDATED: 'Список просмотра обновлен',
  RATING_ADDED: 'Оценка добавлена',
  REPORT_SUBMITTED: 'Жалоба отправлена'
};