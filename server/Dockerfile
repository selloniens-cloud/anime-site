# Многоэтапная сборка для оптимизации размера образа
FROM node:18-alpine AS base

# Установка системных зависимостей для sharp и других нативных модулей
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat \
    vips-dev

WORKDIR /app

# Копирование файлов зависимостей
COPY server/package*.json ./

# Установка зависимостей
RUN npm ci --only=production && npm cache clean --force

# Создание пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Production stage
FROM node:18-alpine AS production

# Установка только необходимых системных зависимостей
RUN apk add --no-cache \
    dumb-init \
    vips

# Создание пользователя
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Копирование зависимостей из базового образа
COPY --from=base --chown=nodejs:nodejs /app/node_modules ./node_modules

# Копирование исходного кода сервера
COPY --chown=nodejs:nodejs server/ .

# Копирование общих модулей
COPY --chown=nodejs:nodejs shared/ ./shared/

# Создание директорий для uploads и логов
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs uploads logs

# Переключение на непривилегированного пользователя
USER nodejs

# Открытие порта
EXPOSE 5000

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Использование dumb-init для правильной обработки сигналов
ENTRYPOINT ["dumb-init", "--"]

# Команда запуска
CMD ["node", "server.js"]