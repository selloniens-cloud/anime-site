# Docker конфигурация для Python сервиса

## Структура Python сервиса

```
python-service/
├── Dockerfile
├── requirements.txt
├── .dockerignore
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── models/
│   ├── services/
│   ├── api/
│   ├── utils/
│   └── tasks/
├── tests/
├── scripts/
└── README.md
```

## Dockerfile для Python сервиса

```dockerfile
# Multi-stage build для оптимизации размера образа
FROM python:3.11-slim as builder

# Установка системных зависимостей для сборки
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Создание виртуального окружения
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Копирование и установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim as production

# Установка runtime зависимостей
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r appuser && useradd -r -g appuser appuser

# Копирование виртуального окружения из builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Создание рабочей директории
WORKDIR /app

# Копирование приложения
COPY --chown=appuser:appuser . .

# Создание директорий для логов и кеша
RUN mkdir -p /app/logs /app/cache && \
    chown -R appuser:appuser /app

# Переключение на непривилегированного пользователя
USER appuser

# Настройка переменных окружения
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Экспорт порта
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

## requirements.txt

```txt
# Web framework
fastapi==0.104.1
uvicorn[standard]==0.24.0

# AniLibria integration
anilibria.py==1.2.0

# Database
motor==3.3.2
pymongo==4.6.0

# Cache
aioredis==2.0.1

# HTTP client
httpx==0.25.2
aiohttp==3.9.1

# WebSocket
websockets==12.0

# Data validation
pydantic==2.5.0
pydantic-settings==2.1.0

# Authentication
PyJWT==2.8.0
cryptography==41.0.8

# Background tasks
celery==5.3.4
apscheduler==3.10.4

# Monitoring
prometheus-client==0.19.0
structlog==23.2.0

# Development
pytest==7.4.3
pytest-asyncio==0.21.1
black==23.11.0
mypy==1.7.1
flake8==6.1.0

# Production
gunicorn==21.2.0
```

## .dockerignore

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.pytest_cache/
.coverage
htmlcov/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore

# Docker
Dockerfile*
docker-compose*.yml

# Documentation
docs/
README.md
```

## Обновленный docker-compose.yml

```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:1.25-alpine
    container_name: anime-site-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      - client
      - server
      - python-service
    networks:
      - anime-site-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # React Frontend
  client:
    build: 
      context: ./client
      dockerfile: Dockerfile
      target: production
    image: anime-site-client:latest
    container_name: anime-site-client
    restart: unless-stopped
    expose:
      - "80"
    volumes:
      - client_static:/usr/share/nginx/html
    environment:
      - NODE_ENV=${NODE_ENV:-production}
    networks:
      - anime-site-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Node.js Backend API
  server:
    build: 
      context: ./server
      dockerfile: Dockerfile
      target: production
    image: anime-site-server:latest
    container_name: anime-site-server
    restart: unless-stopped
    expose:
      - "5000"
    volumes:
      - ./server/uploads:/app/uploads
      - server_logs:/app/logs
      - ./shared:/app/shared:ro
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - PORT=5000
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD:-password}@mongodb:27017/anime-site?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      - JWT_EXPIRE=${JWT_EXPIRE:-30d}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-your-refresh-token-secret-change-in-production}
      - JWT_REFRESH_EXPIRE=${JWT_REFRESH_EXPIRE:-7d}
      - CLIENT_URL=${CLIENT_URL:-http://localhost}
      - SOCKET_CORS_ORIGIN=${CLIENT_URL:-http://localhost}
      - MAX_FILE_SIZE=${MAX_FILE_SIZE:-5242880}
      - UPLOAD_PATH=/app/uploads
      - RATE_LIMIT_WINDOW=${RATE_LIMIT_WINDOW:-15}
      - RATE_LIMIT_MAX_REQUESTS=${RATE_LIMIT_MAX_REQUESTS:-100}
      # Python Service Integration
      - PYTHON_SERVICE_URL=http://python-service:8000
      - INTERNAL_JWT_SECRET=${INTERNAL_JWT_SECRET:-internal-service-secret-key}
      # External API Keys
      - MAL_CLIENT_ID=${MAL_CLIENT_ID:-}
      - MAL_CLIENT_SECRET=${MAL_CLIENT_SECRET:-}
      - ANILIST_CLIENT_ID=${ANILIST_CLIENT_ID:-}
      - ANILIST_CLIENT_SECRET=${ANILIST_CLIENT_SECRET:-}
      - KITSU_API_KEY=${KITSU_API_KEY:-}
      # Email Configuration
      - EMAIL_HOST=${EMAIL_HOST:-}
      - EMAIL_PORT=${EMAIL_PORT:-587}
      - EMAIL_USER=${EMAIL_USER:-}
      - EMAIL_PASS=${EMAIL_PASS:-}
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - anime-site-network
      - internal-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Python AniLibria Service
  python-service:
    build:
      context: ./python-service
      dockerfile: Dockerfile
      target: production
    image: anime-site-python:latest
    container_name: anime-site-python
    restart: unless-stopped
    expose:
      - "8000"
    volumes:
      - python_logs:/app/logs
      - python_cache:/app/cache
      - ./shared:/app/shared:ro
    environment:
      - ENVIRONMENT=${NODE_ENV:-production}
      - PORT=8000
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD:-password}@mongodb:27017/anime-site?authSource=admin
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
      - INTERNAL_JWT_SECRET=${INTERNAL_JWT_SECRET:-internal-service-secret-key}
      # Node.js Service Integration
      - NODEJS_SERVICE_URL=http://server:5000
      # AniLibria Configuration
      - ANILIBRIA_API_URL=https://api.anilibria.tv/v3
      - ANILIBRIA_FALLBACK_URL=https://anilibria.tv/api/v3
      - ANILIBRIA_USER_AGENT=AnimeHub-Python/1.0.0
      # Cache Configuration
      - CACHE_TTL_MEMORY=300
      - CACHE_TTL_REDIS=1800
      - CACHE_TTL_DATABASE=86400
      # WebSocket Configuration
      - WEBSOCKET_MAX_CONNECTIONS=1000
      - WEBSOCKET_PING_INTERVAL=30
      - WEBSOCKET_PING_TIMEOUT=10
      # Rate Limiting
      - RATE_LIMIT_REQUESTS_PER_MINUTE=100
      - RATE_LIMIT_BURST=20
      # Monitoring
      - PROMETHEUS_ENABLED=true
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - anime-site-network
      - internal-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # MongoDB Database
  mongodb:
    image: mongo:6.0
    container_name: anime-site-mongodb
    restart: unless-stopped
    expose:
      - "27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
      - mongodb_logs:/var/log/mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD:-password}
      MONGO_INITDB_DATABASE: anime-site
    command: mongod --logpath /var/log/mongodb/mongod.log --logappend
    networks:
      - anime-site-network
      - internal-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis Cache
  redis:
    image: redis:7.0-alpine
    container_name: anime-site-redis
    restart: unless-stopped
    expose:
      - "6379"
    volumes:
      - redis_data:/data
      - redis_logs:/var/log/redis
    command: redis-server --appendonly yes --logfile /var/log/redis/redis.log
    networks:
      - anime-site-network
      - internal-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Celery Worker для фоновых задач (опционально)
  celery-worker:
    build:
      context: ./python-service
      dockerfile: Dockerfile
      target: production
    image: anime-site-python:latest
    container_name: anime-site-celery-worker
    restart: unless-stopped
    volumes:
      - python_logs:/app/logs
      - python_cache:/app/cache
    environment:
      - ENVIRONMENT=${NODE_ENV:-production}
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD:-password}@mongodb:27017/anime-site?authSource=admin
      - REDIS_URL=redis://redis:6379
      - CELERY_BROKER_URL=redis://redis:6379/1
      - CELERY_RESULT_BACKEND=redis://redis:6379/2
    command: celery -A app.tasks.celery worker --loglevel=info
    depends_on:
      - redis
      - mongodb
      - python-service
    networks:
      - internal-network
    profiles:
      - background-tasks

  # Celery Beat для планировщика задач (опционально)
  celery-beat:
    build:
      context: ./python-service
      dockerfile: Dockerfile
      target: production
    image: anime-site-python:latest
    container_name: anime-site-celery-beat
    restart: unless-stopped
    volumes:
      - python_logs:/app/logs
      - celery_beat_data:/app/celerybeat-schedule
    environment:
      - ENVIRONMENT=${NODE_ENV:-production}
      - MONGODB_URI=mongodb://admin:${MONGO_PASSWORD:-password}@mongodb:27017/anime-site?authSource=admin
      - REDIS_URL=redis://redis:6379
      - CELERY_BROKER_URL=redis://redis:6379/1
      - CELERY_RESULT_BACKEND=redis://redis:6379/2
    command: celery -A app.tasks.celery beat --loglevel=info --schedule=/app/celerybeat-schedule/celerybeat-schedule
    depends_on:
      - redis
      - mongodb
      - python-service
    networks:
      - internal-network
    profiles:
      - background-tasks

  # Monitoring с Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: anime-site-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - anime-site-network
      - internal-network
    profiles:
      - monitoring

  # Grafana Dashboard
  grafana:
    image: grafana/grafana:latest
    container_name: anime-site-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER:-admin}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - anime-site-network
      - internal-network
    profiles:
      - monitoring

  # Jaeger для distributed tracing (опционально)
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: anime-site-jaeger
    restart: unless-stopped
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_OTLP_ENABLED=true
    networks:
      - anime-site-network
      - internal-network
    profiles:
      - tracing

# Именованные тома для персистентности данных
volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
  mongodb_logs:
    driver: local
  redis_data:
    driver: local
  redis_logs:
    driver: local
  server_logs:
    driver: local
  python_logs:
    driver: local
  python_cache:
    driver: local
  nginx_logs:
    driver: local
  client_static:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
  celery_beat_data:
    driver: local

# Сети для изоляции сервисов
networks:
  anime-site-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
  
  internal-network:
    driver: bridge
    internal: true
    ipam:
      config:
        - subnet: 172.21.0.0/16
```

## Обновленная конфигурация Nginx

```nginx
# Добавить в nginx/conf.d/default.conf

# Upstream для Python сервиса
upstream python-backend {
    server python-service:8000;
    keepalive 32;
}

# Upstream для Node.js сервиса
upstream nodejs-backend {
    server server:5000;
    keepalive 32;
}

server {
    listen 80;
    server_name localhost _;
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    # Python Service - AniLibria API v2
    location /api/anilibria/v2/ {
        # Rate limiting для API
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://python-backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Буферизация
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Python WebSocket для real-time уведомлений
    location /api/anilibria/v2/ws {
        proxy_pass http://python-backend/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket специфичные настройки
        proxy_read_timeout 86400;
    }
    
    # Node.js API routes (по умолчанию)
    location /api/ {
        # Rate limiting для API
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://nodejs-backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Буферизация
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Node.js Socket.io для существующих WebSocket соединений
    location /socket.io/ {
        proxy_pass http://nodejs-backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket специфичные настройки
        proxy_read_timeout 86400;
    }
    
    # Остальные location блоки остаются без изменений...
}
```

## Команды для развертывания

### Разработка
```bash
# Запуск всех сервисов
docker-compose up -d

# Запуск с мониторингом
docker-compose --profile monitoring up -d

# Запуск с фоновыми задачами
docker-compose --profile background-tasks up -d

# Запуск с трассировкой
docker-compose --profile tracing up -d

# Полный стек
docker-compose --profile monitoring --profile background-tasks --profile tracing up -d
```

### Продакшн
```bash
# Сборка образов
docker-compose build --no-cache

# Запуск в продакшн режиме
NODE_ENV=production docker-compose up -d

# Просмотр логов
docker-compose logs -f python-service
docker-compose logs -f server
```

### Масштабирование
```bash
# Масштабирование Python сервиса
docker-compose up -d --scale python-service=3

# Масштабирование Node.js сервиса
docker-compose up -d --scale server=2
```

## Переменные окружения

### Новые переменные для .env файла
```env
# Python Service
PYTHON_SERVICE_URL=http://python-service:8000
INTERNAL_JWT_SECRET=internal-service-secret-key-change-in-production

# AniLibria Configuration
ANILIBRIA_API_URL=https://api.anilibria.tv/v3
ANILIBRIA_FALLBACK_URL=https://anilibria.tv/api/v3

# Cache Configuration
CACHE_TTL_MEMORY=300
CACHE_TTL_REDIS=1800
CACHE_TTL_DATABASE=86400

# WebSocket Configuration
WEBSOCKET_MAX_CONNECTIONS=1000
WEBSOCKET_PING_INTERVAL=30
WEBSOCKET_PING_TIMEOUT=10

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST=20

# Monitoring
PROMETHEUS_ENABLED=true
LOG_LEVEL=INFO

# Celery (если используется)
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
```

## Мониторинг и логирование

### Health Check endpoints
- Node.js: `http://localhost:5000/health`
- Python: `http://localhost:8000/health`
- Nginx: `http://localhost/health`

### Логи
```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f python-service
docker-compose logs -f server

# Логи с временными метками
docker-compose logs -f -t python-service
```

### Метрики
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001`
- Jaeger: `http://localhost:16686`

Эта конфигурация обеспечивает полную интеграцию Python сервиса в существующую архитектуру с поддержкой масштабирования, мониторинга и отказоустойчивости.