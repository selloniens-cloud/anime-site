# 🐳 Docker-решение для аниме-сайта

## 📖 Обзор

Комплексное Docker-решение для развертывания полнофункционального аниме-сайта с современной архитектурой, включающей React фронтенд, Node.js бэкенд, MongoDB базу данных, Redis кэширование, Nginx reverse proxy и систему мониторинга.

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │────│  React Client   │────│  Node.js API    │
│   (Port 80/443) │    │   (Port 3000)   │    │   (Port 5000)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │   MongoDB DB    │    │   Redis Cache   │
         │              │   (Port 27017)  │    │   (Port 6379)   │
         │              └─────────────────┘    └─────────────────┘
         │
┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │────│     Grafana     │
│   (Port 9090)   │    │   (Port 3001)   │
└─────────────────┘    └─────────────────┘
```

## 📁 Структура проекта

```
anime-site/
├── 🐳 Docker конфигурации
│   ├── docker-compose.yml          # Продакшн конфигурация
│   ├── docker-compose.dev.yml      # Разработка конфигурация
│   ├── .dockerignore               # Исключения для Docker
│   └── .env.example                # Шаблон переменных окружения
│
├── 📱 Frontend (React)
│   ├── client/Dockerfile           # Многоэтапная сборка с Nginx
│   ├── client/nginx.conf           # Конфигурация Nginx для SPA
│   └── client/src/                 # Исходный код React приложения
│
├── 🔧 Backend (Node.js)
│   ├── server/Dockerfile           # Оптимизированный Node.js образ
│   ├── server/.env.example         # Переменные окружения сервера
│   └── server/                     # API и бизнес-логика
│
├── 🌐 Reverse Proxy
│   ├── nginx/nginx.conf            # Основная конфигурация Nginx
│   └── nginx/conf.d/default.conf   # Виртуальный хост
│
├── 📊 Мониторинг
│   ├── monitoring/prometheus.yml   # Конфигурация Prometheus
│   └── monitoring/grafana/         # Дашборды Grafana
│
├── 🔒 Безопасность
│   └── security/security-checklist.md  # Чек-лист безопасности
│
├── 🚀 Автоматизация
│   ├── scripts/deploy.sh           # Скрипт развертывания (Linux/Mac)
│   ├── scripts/deploy.bat          # Скрипт развертывания (Windows)
│   └── scripts/init-mongo.js       # Инициализация MongoDB
│
└── 📚 Документация
    ├── DOCKER_DEPLOYMENT.md        # Подробное руководство
    ├── README_DOCKER.md            # Этот файл
    └── README.md                   # Основная документация проекта
```

## 🚀 Быстрый старт

### 1. Подготовка окружения
```bash
# Клонирование проекта
git clone <repository-url>
cd anime-site

# Создание файла переменных окружения
cp .env.example .env

# Редактирование переменных (ОБЯЗАТЕЛЬНО для продакшена!)
nano .env
```

### 2. Запуск для разработки
```bash
# Linux/Mac
./scripts/deploy.sh dev

# Windows
scripts\deploy.bat dev

# Или вручную
docker compose -f docker-compose.dev.yml up -d
```

### 3. Запуск для продакшена
```bash
# Linux/Mac
./scripts/deploy.sh prod

# Windows
scripts\deploy.bat prod

# Или вручную
docker compose up -d
```

## 🎯 Режимы развертывания

### 🔧 Режим разработки
- **Команда**: `./scripts/deploy.sh dev`
- **Особенности**:
  - Hot-reload для фронтенда и бэкенда
  - Открытые порты для прямого доступа
  - Отладочные логи
  - Быстрая пересборка

**Доступ**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017
- Redis: localhost:6379

### 🏭 Продакшн режим
- **Команда**: `./scripts/deploy.sh prod`
- **Особенности**:
  - Оптимизированные образы
  - Nginx reverse proxy
  - Безопасная конфигурация
  - Health checks

**Доступ**:
- Приложение: http://localhost
- Все внутренние сервисы изолированы

### 📊 Режим с мониторингом
- **Команда**: `./scripts/deploy.sh monitoring`
- **Особенности**:
  - Prometheus для сбора метрик
  - Grafana для визуализации
  - Алерты и уведомления

**Дополнительный доступ**:
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

## 🔧 Основные команды

```bash
# Запуск сервисов
./scripts/deploy.sh [dev|prod|monitoring]

# Просмотр логов
./scripts/deploy.sh logs
docker compose logs -f

# Проверка здоровья
./scripts/deploy.sh health
docker compose ps

# Остановка сервисов
./scripts/deploy.sh stop
docker compose down

# Очистка системы
./scripts/deploy.sh cleanup
docker system prune -a
```

## 🔒 Безопасность

### Обязательные меры:
1. **Изменение секретов** в файле `.env`
2. **Настройка HTTPS** для продакшена
3. **Ограничение доступа** к внутренним портам
4. **Регулярные обновления** образов

### Проверка безопасности:
```bash
# Проверка секретов
grep -r "change-in-production" .env

# Сканирование уязвимостей
docker scout cves anime-site-server:latest

# Проверка открытых портов
docker compose ps
```

Подробнее: [`security/security-checklist.md`](security/security-checklist.md)

## 📊 Мониторинг

### Метрики и логи:
- **Prometheus**: Сбор метрик приложения и системы
- **Grafana**: Визуализация и дашборды
- **Docker logs**: Централизованное логирование
- **Health checks**: Автоматическая проверка состояния

### Доступ к мониторингу:
```bash
# Запуск с мониторингом
docker compose --profile monitoring up -d

# Grafana: http://localhost:3001
# Логин: admin / Пароль: из GRAFANA_PASSWORD

# Prometheus: http://localhost:9090
```

## 🔧 Устранение неполадок

### Частые проблемы:

#### Контейнер не запускается
```bash
# Проверка логов
docker compose logs имя-сервиса

# Пересборка образа
docker compose build --no-cache имя-сервиса
```

#### Проблемы с базой данных
```bash
# Проверка MongoDB
docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Перезапуск сервисов
docker compose restart mongodb server
```

#### Проблемы с памятью
```bash
# Мониторинг ресурсов
docker stats

# Очистка неиспользуемых ресурсов
docker system prune -a
```

Подробное руководство: [`DOCKER_DEPLOYMENT.md`](DOCKER_DEPLOYMENT.md)

## 📈 Производительность

### Оптимизации:
- **Многоэтапная сборка** Docker образов
- **Nginx кэширование** статических ресурсов
- **Redis кэширование** данных приложения
- **Gzip сжатие** HTTP ответов
- **Health checks** для быстрого обнаружения проблем

### Масштабирование:
```bash
# Запуск нескольких экземпляров API
docker compose up -d --scale server=3

# Мониторинг нагрузки
docker stats
```

## 🔄 Обновление

### Обновление приложения:
```bash
# Остановка сервисов
docker compose down

# Получение обновлений
git pull origin main

# Пересборка и запуск
docker compose build --no-cache
docker compose up -d
```

### Резервное копирование:
```bash
# Создание бэкапа MongoDB
docker compose exec mongodb mongodump --out /data/backup

# Копирование на хост
docker cp anime-site-mongodb:/data/backup ./backup
```

## 📋 Системные требования

### Минимальные:
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **RAM**: 4GB
- **Диск**: 10GB
- **CPU**: 2 ядра

### Рекомендуемые:
- **RAM**: 8GB+
- **Диск**: 20GB+ SSD
- **CPU**: 4+ ядра

## 🤝 Поддержка

### Документация:
- [`DOCKER_DEPLOYMENT.md`](DOCKER_DEPLOYMENT.md) - Подробное руководство
- [`security/security-checklist.md`](security/security-checklist.md) - Безопасность
- [`README.md`](README.md) - Основная документация проекта

### Полезные команды:
```bash
# Проверка конфигурации
docker compose config

# Информация о системе
docker system info
docker system df

# Экспорт/импорт образов
docker save anime-site-server:latest | gzip > backup.tar.gz
docker load < backup.tar.gz
```

---

## 🎉 Заключение

Данное Docker-решение обеспечивает:
- ✅ **Простое развертывание** в один клик
- ✅ **Безопасную конфигурацию** по умолчанию
- ✅ **Масштабируемую архитектуру**
- ✅ **Комплексный мониторинг**
- ✅ **Автоматизированное управление**
- ✅ **Подробную документацию**

**Готово к использованию в продакшене!** 🚀

---

*Создано с ❤️ для современного веб-развития*