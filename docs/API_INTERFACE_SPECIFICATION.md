# API Interface Specification - Python Service Integration

## Обзор API интерфейсов

### Маршрутизация запросов
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Nginx Proxy    │    │   Services      │
│     :3000       │◄──►│      :80        │◄──►│                 │
└─────────────────┘    └─────────────────┘    │ Node.js  :5000  │
                                │              │ Python   :8000  │
                                │              └─────────────────┘
                                ▼
                       ┌─────────────────┐
                       │  Route Decision │
                       └─────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            /api/anilibria/v2/*     /api/* (default)
            → Python Service        → Node.js Service
```

## REST API Endpoints

### Python Service Endpoints (`/api/anilibria/v2/`)

#### 1. Получение данных о тайтлах
```http
GET /api/anilibria/v2/titles
```
**Параметры:**
- `page` (int): Номер страницы (по умолчанию: 1)
- `limit` (int): Количество элементов (по умолчанию: 20, макс: 100)
- `search` (string): Поисковый запрос
- `year` (int): Год выпуска
- `season` (string): Сезон (winter, spring, summer, autumn)
- `genres` (array): Массив жанров
- `status` (string): Статус (ongoing, completed, announced)
- `sort` (string): Сортировка (id, year, rating, updated)
- `order` (string): Порядок (asc, desc)

**Ответ:**
```json
{
  "success": true,
  "data": [
    {
      "id": 9919,
      "names": {
        "ru": "Девочки-бабочки",
        "en": "Butterfly Girls",
        "alternative": "Chou Shoujo"
      },
      "description": "История о девочках...",
      "type": "TV",
      "status": "ongoing",
      "genres": ["Магия", "Школа", "Драма"],
      "year": 2025,
      "season": "summer",
      "episodes": {
        "total": 24,
        "current": 17
      },
      "poster": {
        "small": "https://anilibria.tv/storage/releases/posters/9919/small.jpg",
        "medium": "https://anilibria.tv/storage/releases/posters/9919/medium.jpg",
        "large": "https://anilibria.tv/storage/releases/posters/9919/original.jpg"
      },
      "player": {
        "episodes": {
          "1": {
            "name": "Первая встреча",
            "preview": "https://anilibria.tv/storage/releases/episodes/previews/9919/1/preview.jpg",
            "sources": [
              {
                "quality": "1080p",
                "url": "https://anilibria.tv/videos/media/ts/9919/1/1080/video.m3u8",
                "type": "hls"
              }
            ]
          }
        }
      },
      "updated_at": "2025-08-01T15:30:00Z",
      "blocked": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  },
  "meta": {
    "source": "anilibria",
    "cached": true,
    "cache_expires": "2025-08-01T16:30:00Z"
  }
}
```

#### 2. Получение конкретного тайтла
```http
GET /api/anilibria/v2/titles/{id}
```

#### 3. Поиск тайтлов
```http
GET /api/anilibria/v2/search
```
**Параметры:**
- `q` (string, required): Поисковый запрос
- `limit` (int): Количество результатов
- `fuzzy` (boolean): Нечеткий поиск

#### 4. Получение обновлений
```http
GET /api/anilibria/v2/updates
```

#### 5. Получение популярных тайтлов
```http
GET /api/anilibria/v2/popular
```

#### 6. Получение случайного тайтла
```http
GET /api/anilibria/v2/random
```

#### 7. Получение расписания
```http
GET /api/anilibria/v2/schedule
```

#### 8. Получение жанров
```http
GET /api/anilibria/v2/genres
```

#### 9. Health Check
```http
GET /api/anilibria/v2/health
```
**Ответ:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "anilibria_api": {
    "status": "connected",
    "response_time": 150
  },
  "database": {
    "status": "connected",
    "response_time": 5
  },
  "cache": {
    "status": "connected",
    "hit_rate": 0.85
  },
  "uptime": 3600,
  "timestamp": "2025-08-01T15:30:00Z"
}
```

## WebSocket API

### Python WebSocket Server (`/api/anilibria/v2/ws`)

#### Подключение
```javascript
const ws = new WebSocket('ws://localhost/api/anilibria/v2/ws');
```

#### События от клиента к серверу

##### 1. Аутентификация
```json
{
  "type": "auth",
  "data": {
    "token": "jwt_token_here"
  }
}
```

##### 2. Подписка на обновления тайтла
```json
{
  "type": "subscribe_title",
  "data": {
    "title_id": 9919
  }
}
```

##### 3. Отписка от обновлений тайтла
```json
{
  "type": "unsubscribe_title",
  "data": {
    "title_id": 9919
  }
}
```

##### 4. Подписка на глобальные обновления
```json
{
  "type": "subscribe_updates",
  "data": {
    "types": ["new_episode", "new_title", "status_change"]
  }
}
```

#### События от сервера к клиенту

##### 1. Новый эпизод
```json
{
  "type": "new_episode",
  "data": {
    "title_id": 9919,
    "episode": 18,
    "title": "Девочки-бабочки",
    "episode_name": "Финальная битва",
    "poster": "https://anilibria.tv/storage/releases/posters/9919/medium.jpg",
    "timestamp": "2025-08-01T15:30:00Z"
  }
}
```

##### 2. Новый тайтл
```json
{
  "type": "new_title",
  "data": {
    "title_id": 10001,
    "title": "Новое аниме",
    "poster": "https://anilibria.tv/storage/releases/posters/10001/medium.jpg",
    "genres": ["Экшен", "Приключения"],
    "timestamp": "2025-08-01T15:30:00Z"
  }
}
```

##### 3. Изменение статуса тайтла
```json
{
  "type": "status_change",
  "data": {
    "title_id": 9919,
    "old_status": "ongoing",
    "new_status": "completed",
    "timestamp": "2025-08-01T15:30:00Z"
  }
}
```

##### 4. Ошибка
```json
{
  "type": "error",
  "data": {
    "code": "AUTH_FAILED",
    "message": "Неверный токен аутентификации"
  }
}
```

## Inter-Service Communication

### Node.js → Python Service

#### 1. Внутренний API для синхронизации
```http
POST /internal/sync/title
Authorization: Bearer internal_service_token
Content-Type: application/json

{
  "title_id": 9919,
  "force": false
}
```

#### 2. Получение статистики кеша
```http
GET /internal/cache/stats
Authorization: Bearer internal_service_token
```

#### 3. Очистка кеша
```http
DELETE /internal/cache/clear
Authorization: Bearer internal_service_token

{
  "pattern": "titles:*",
  "confirm": true
}
```

### Python → Node.js Service

#### 1. Уведомление о новых данных
```http
POST /internal/anilibria/notify
Authorization: Bearer internal_service_token
Content-Type: application/json

{
  "type": "new_episode",
  "title_id": 9919,
  "episode": 18,
  "timestamp": "2025-08-01T15:30:00Z"
}
```

#### 2. Валидация пользователя
```http
GET /internal/users/validate/{user_id}
Authorization: Bearer internal_service_token
```

## Модели данных

### Pydantic модели для Python сервиса

```python
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class TitleNames(BaseModel):
    ru: str
    en: Optional[str] = None
    alternative: Optional[str] = None

class EpisodeSource(BaseModel):
    quality: str  # "1080p", "720p", "480p"
    url: str
    type: str = "hls"  # "hls", "mp4"

class Episode(BaseModel):
    number: int
    name: str
    preview: Optional[str] = None
    sources: List[EpisodeSource]
    duration: Optional[int] = None  # в секундах

class Poster(BaseModel):
    small: Optional[str] = None
    medium: Optional[str] = None
    large: Optional[str] = None

class Title(BaseModel):
    id: int
    names: TitleNames
    description: str
    type: str  # "TV", "Movie", "OVA", "ONA", "Special"
    status: str  # "ongoing", "completed", "announced"
    genres: List[str]
    year: int
    season: str  # "winter", "spring", "summer", "autumn"
    episodes: Dict[str, Episode]
    poster: Poster
    rating: Optional[float] = None
    updated_at: datetime
    blocked: bool = False

class SearchRequest(BaseModel):
    q: str = Field(..., min_length=2, max_length=100)
    limit: int = Field(20, ge=1, le=100)
    fuzzy: bool = False

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]

class SubscriptionRequest(BaseModel):
    title_id: int

class UpdateNotification(BaseModel):
    type: str  # "new_episode", "new_title", "status_change"
    title_id: int
    data: Dict[str, Any]
    timestamp: datetime
```

## Обработка ошибок

### Стандартные коды ошибок
- `400` - Bad Request (неверные параметры)
- `401` - Unauthorized (не авторизован)
- `403` - Forbidden (нет доступа)
- `404` - Not Found (ресурс не найден)
- `429` - Too Many Requests (превышен лимит запросов)
- `500` - Internal Server Error (внутренняя ошибка)
- `502` - Bad Gateway (ошибка внешнего API)
- `503` - Service Unavailable (сервис недоступен)

### Формат ответа с ошибкой
```json
{
  "success": false,
  "error": {
    "code": "TITLE_NOT_FOUND",
    "message": "Тайтл с указанным ID не найден",
    "details": {
      "title_id": 9999,
      "searched_sources": ["cache", "api", "database"]
    }
  },
  "timestamp": "2025-08-01T15:30:00Z",
  "request_id": "req_123456789"
}
```

## Аутентификация и авторизация

### JWT Token Validation
Python сервис будет валидировать JWT токены, выданные Node.js сервисом:

```python
import jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def validate_token(token: str = Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials, 
            JWT_SECRET, 
            algorithms=["HS256"]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
```

### Rate Limiting
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/anilibria/v2/titles")
@limiter.limit("100/minute")
async def get_titles(request: Request):
    # endpoint logic
    pass
```

## Кеширование

### Стратегия кеширования
1. **L1 Cache**: In-memory кеш (TTL: 5 минут)
2. **L2 Cache**: Redis кеш (TTL: 30 минут)
3. **L3 Cache**: Database кеш (TTL: 24 часа)

### Ключи кеширования
```python
CACHE_KEYS = {
    "title": "anilibria:title:{id}",
    "titles_page": "anilibria:titles:page:{page}:limit:{limit}:filters:{hash}",
    "search": "anilibria:search:{query}:limit:{limit}",
    "popular": "anilibria:popular:limit:{limit}",
    "updates": "anilibria:updates:limit:{limit}",
    "schedule": "anilibria:schedule",
    "genres": "anilibria:genres"
}
```

## Мониторинг и метрики

### Prometheus метрики
```python
from prometheus_client import Counter, Histogram, Gauge

# Счетчики запросов
REQUEST_COUNT = Counter(
    'anilibria_requests_total',
    'Total requests to AniLibria service',
    ['method', 'endpoint', 'status']
)

# Время ответа
REQUEST_DURATION = Histogram(
    'anilibria_request_duration_seconds',
    'Request duration in seconds',
    ['method', 'endpoint']
)

# Активные WebSocket соединения
WEBSOCKET_CONNECTIONS = Gauge(
    'anilibria_websocket_connections',
    'Active WebSocket connections'
)

# Cache hit rate
CACHE_HIT_RATE = Gauge(
    'anilibria_cache_hit_rate',
    'Cache hit rate',
    ['cache_level']
)
```

## Совместимость с существующим API

### Версионирование
- **v1** (`/api/anilibria/*`): Существующий Node.js API
- **v2** (`/api/anilibria/v2/*`): Новый Python API

### Миграционная стратегия
1. **Фаза 1**: Параллельная работа обеих версий
2. **Фаза 2**: Постепенный перевод клиентов на v2
3. **Фаза 3**: Deprecation v1 API
4. **Фаза 4**: Полное отключение v1

### Fallback механизм
```python
async def get_title_with_fallback(title_id: int):
    try:
        # Попытка получить из Python сервиса
        return await python_service.get_title(title_id)
    except Exception as e:
        logger.warning(f"Python service failed: {e}")
        # Fallback на Node.js сервис
        return await nodejs_service.get_title(title_id)