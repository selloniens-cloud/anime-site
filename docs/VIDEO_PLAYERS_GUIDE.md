# Руководство по интеграции медиаплееров для аниме-сайта

## Обзор

Данное руководство описывает интеграцию различных типов медиаплееров для воспроизведения аниме контента с поддержкой современных форматов и технологий стриминга.

## Поддерживаемые плееры

### 1. HTML5 Video Player
**Описание**: Нативный HTML5 плеер браузера
**Форматы**: MP4, WebM, OGV
**Преимущества**: 
- Нативная поддержка браузерами
- Минимальный размер
- Быстрая загрузка

**Недостатки**:
- Ограниченная кастомизация
- Различия в UI между браузерами

### 2. Video.js
**Описание**: Популярный HTML5 видеоплеер с расширенными возможностями
**Форматы**: MP4, WebM, HLS, DASH (с плагинами)
**Преимущества**:
- Богатая экосистема плагинов
- Кроссбраузерная совместимость
- Адаптивный дизайн
- Поддержка субтитров

**Зависимости**:
```json
{
  "video.js": "^8.0.4",
  "videojs-contrib-quality-levels": "^2.0.9",
  "videojs-http-source-selector": "^1.1.6"
}
```

### 3. Plyr
**Описание**: Современный, легкий и настраиваемый медиаплеер
**Форматы**: MP4, WebM, HLS, DASH
**Преимущества**:
- Современный дизайн
- Легкий вес
- Отличная производительность
- Поддержка горячих клавиш

**Зависимости**:
```json
{
  "plyr": "^3.7.8"
}
```

### 4. HLS.js
**Описание**: JavaScript библиотека для воспроизведения HLS потоков
**Форматы**: HLS (.m3u8)
**Преимущества**:
- Адаптивное качество
- Низкая задержка
- Поддержка Live стриминга

**Зависимости**:
```json
{
  "hls.js": "^1.4.12"
}
```

### 5. Dash.js
**Описание**: Эталонная реализация MPEG-DASH плеера
**Форматы**: DASH (.mpd)
**Преимущества**:
- Высокое качество адаптивного стриминга
- Поддержка DRM
- Оптимизация для больших файлов

**Зависимости**:
```json
{
  "dashjs": "^4.7.2"
}
```

## Архитектура системы

```
VideoPlayer (Универсальный компонент)
├── HTML5Player (Базовый плеер)
├── VideoJSPlayer (Расширенный плеер)
├── PlyrPlayer (Современный плеер)
├── HLSPlayer (HLS стриминг)
└── DashPlayer (DASH стриминг)
```

## Определение типа контента

Система автоматически определяет оптимальный плеер на основе:

1. **Расширения файла**:
   - `.mp4`, `.webm` → HTML5/Video.js/Plyr
   - `.m3u8` → HLS.js
   - `.mpd` → Dash.js

2. **MIME типа**:
   - `video/mp4` → HTML5 плеер
   - `application/vnd.apple.mpegurl` → HLS плеер
   - `application/dash+xml` → DASH плеер

3. **Возможностей браузера**:
   - Проверка поддержки MSE (Media Source Extensions)
   - Проверка поддержки конкретных кодеков

## Fallback стратегия

```javascript
const playerPriority = [
  'hls',     // Приоритет для HLS
  'dash',    // DASH для высокого качества
  'videojs', // Video.js для расширенных функций
  'plyr',    // Plyr для современного UI
  'html5'    // HTML5 как последний fallback
];
```

## Конфигурация плееров

### HTML5 Player
```javascript
const html5Config = {
  controls: true,
  preload: 'metadata',
  crossOrigin: 'anonymous',
  playsinline: true
};
```

### Video.js Configuration
```javascript
const videojsConfig = {
  fluid: true,
  responsive: true,
  controls: true,
  preload: 'auto',
  plugins: {
    qualityLevels: {},
    httpSourceSelector: {
      default: 'auto'
    }
  }
};
```

### Plyr Configuration
```javascript
const plyrConfig = {
  controls: [
    'play-large', 'play', 'progress', 'current-time',
    'mute', 'volume', 'settings', 'fullscreen'
  ],
  settings: ['quality', 'speed', 'loop'],
  quality: {
    default: 'auto',
    options: [1080, 720, 480, 360, 'auto']
  },
  speed: {
    selected: 1,
    options: [0.5, 0.75, 1, 1.25, 1.5, 2]
  }
};
```

### HLS.js Configuration
```javascript
const hlsConfig = {
  debug: false,
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 600
};
```

### Dash.js Configuration
```javascript
const dashConfig = {
  streaming: {
    stableBufferTime: 12,
    bufferTimeAtTopQuality: 30,
    bufferTimeAtTopQualityLongForm: 60,
    longFormContentDurationThreshold: 600
  }
};
```

## Поддерживаемые функции

### Основные функции
- ✅ Воспроизведение/Пауза
- ✅ Перемотка
- ✅ Регулировка громкости
- ✅ Полноэкранный режим
- ✅ Скорость воспроизведения

### Расширенные функции
- ✅ Субтитры и дорожки
- ✅ Выбор качества
- ✅ Горячие клавиши
- ✅ Сохранение прогресса
- ✅ Миниатюры превью
- ✅ Адаптивное качество

### Горячие клавиши
| Клавиша | Действие |
|---------|----------|
| Space | Воспроизведение/Пауза |
| ← → | Перемотка ±10 сек |
| ↑ ↓ | Громкость ±10% |
| F | Полный экран |
| M | Отключить звук |
| 0-9 | Переход к % видео |

## Оптимизация производительности

### Ленивая загрузка
```javascript
const loadPlayer = async (type) => {
  switch (type) {
    case 'videojs':
      return await import('./players/VideoJSPlayer');
    case 'plyr':
      return await import('./players/PlyrPlayer');
    case 'hls':
      return await import('./players/HLSPlayer');
    case 'dash':
      return await import('./players/DashPlayer');
    default:
      return await import('./players/HTML5Player');
  }
};
```

### Предзагрузка
- `metadata` - для быстрого отображения информации
- `auto` - для важного контента
- `none` - для экономии трафика

### Буферизация
- Адаптивная буферизация на основе скорости соединения
- Предварительная загрузка следующего эпизода
- Очистка буфера при переключении качества

## Обработка ошибок

### Типы ошибок
1. **Сетевые ошибки** - проблемы с загрузкой
2. **Ошибки декодирования** - неподдерживаемый формат
3. **Ошибки DRM** - проблемы с защищенным контентом
4. **Ошибки плеера** - внутренние ошибки плеера

### Стратегия восстановления
```javascript
const errorRecovery = {
  networkError: () => retry(3),
  decodeError: () => switchPlayer(),
  drmError: () => showDRMMessage(),
  playerError: () => fallbackToHTML5()
};
```

## Аналитика и метрики

### Отслеживаемые события
- Начало воспроизведения
- Завершение просмотра
- Переключение качества
- Ошибки воспроизведения
- Время буферизации

### Метрики производительности
- Время до первого кадра
- Количество ребуферизаций
- Средняя скорость загрузки
- Использование CPU/памяти

## Безопасность

### CORS настройки
```javascript
const corsConfig = {
  crossOrigin: 'anonymous',
  withCredentials: false
};
```

### CSP заголовки
```
Content-Security-Policy: 
  media-src 'self' https://*.example.com;
  connect-src 'self' https://*.example.com;
```

### DRM поддержка
- Widevine (Chrome, Firefox)
- PlayReady (Edge, IE)
- FairPlay (Safari)

## Тестирование

### Браузеры
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Устройства
- ✅ Desktop (Windows, macOS, Linux)
- ✅ Mobile (iOS, Android)
- ✅ Smart TV (WebOS, Tizen)

### Форматы
- ✅ MP4 (H.264, H.265)
- ✅ WebM (VP8, VP9, AV1)
- ✅ HLS (различные профили)
- ✅ DASH (различные адаптации)

## Troubleshooting

### Частые проблемы

**Проблема**: Видео не воспроизводится
**Решение**: 
1. Проверить поддержку формата браузером
2. Проверить CORS заголовки
3. Попробовать другой плеер

**Проблема**: Низкое качество видео
**Решение**:
1. Проверить доступные качества
2. Настроить адаптивную битрейт
3. Проверить скорость соединения

**Проблема**: Частые буферизации
**Решение**:
1. Увеличить размер буфера
2. Снизить качество видео
3. Оптимизировать сетевые настройки

## Следующие шаги

1. Реализация базовых компонентов плееров
2. Создание универсального VideoPlayer
3. Интеграция с WatchPage
4. Добавление аналитики
5. Тестирование на различных устройствах