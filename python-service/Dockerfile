# Используем официальный Python 3.11 образ
FROM python:3.11-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Копируем файл зависимостей
COPY requirements.txt .

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Копируем исходный код приложения
COPY anidLapi_service.py .

# Создаем пользователя для безопасности
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Открываем порты
EXPOSE 8000 8001

# Настраиваем переменные окружения
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV FASTAPI_ENV=production

# Команда для запуска приложения
CMD ["uvicorn", "anidLapi_service:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Метки для документации
LABEL maintainer="anime-site"
LABEL version="1.0.0"
LABEL description="AnidLapi Python microservice for anime video streaming"