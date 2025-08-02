# Многоэтапная сборка для оптимизации размера образа

# Stage 1: Build stage
FROM node:18-alpine AS build

# Установка системных зависимостей
RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /app

# Копирование файлов зависимостей
COPY package*.json ./

# Установка зависимостей
RUN npm ci --silent && \
    npm cache clean --force

# Копирование исходного кода
COPY . .

# Сборка приложения с оптимизациями
RUN DISABLE_ESLINT_PLUGIN=true \
    GENERATE_SOURCEMAP=false \
    npm run build

# Stage 2: Production stage
FROM nginx:1.25-alpine AS production

# Установка дополнительных утилит для безопасности
RUN apk add --no-cache \
    curl \
    tzdata

# Создание непривилегованного пользователя
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S nginx-user -u 1001 -G nginx-user

# Копирование собранного приложения
COPY --from=build --chown=nginx-user:nginx-user /app/build /usr/share/nginx/html

# Копирование конфигурации nginx
COPY --chown=nginx-user:nginx-user nginx.conf /etc/nginx/conf.d/default.conf

# Создание директорий для логов и кэша
RUN mkdir -p /var/cache/nginx /var/log/nginx && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /usr/share/nginx/html

# Создание конфигурации nginx для непривилегированного пользователя
RUN touch /var/run/nginx.pid && \
    chown -R nginx-user:nginx-user /var/run/nginx.pid /etc/nginx/conf.d

# Переключение на непривилегированного пользователя
USER nginx-user

# Открытие порта
EXPOSE 80

# Проверка здоровья контейнера
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Команда запуска
CMD ["nginx", "-g", "daemon off;"]

# Build stage
FROM node:16-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]