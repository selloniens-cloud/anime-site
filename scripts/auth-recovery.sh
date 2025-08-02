#!/bin/bash

# Anime-Site Authentication Recovery Script
# Скрипт для восстановления системы аутентификации

set -e

echo "🔧 ANIME-SITE AUTHENTICATION RECOVERY TOOL"
echo "=========================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    log_info "Проверка зависимостей..."
    
    local deps=("node" "npm" "mongosh" "curl")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Отсутствуют зависимости: ${missing_deps[*]}"
        log_info "Установите недостающие зависимости и повторите попытку"
        exit 1
    fi
    
    log_success "Все зависимости установлены"
}

# Проверка портов
check_ports() {
    log_info "Проверка занятости портов..."
    
    local ports=(3000 5000 27017)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            occupied_ports+=("$port")
        fi
    done
    
    if [ ${#occupied_ports[@]} -eq 0 ]; then
        log_warning "Все порты свободны - сервисы не запущены"
        return 1
    else
        log_success "Активные порты: ${occupied_ports[*]}"
        return 0
    fi
}

# Остановка всех сервисов
stop_services() {
    log_info "Остановка всех сервисов..."
    
    # Остановка процессов на портах
    local ports=(3000 5000)
    
    for port in "${ports[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pid" ]; then
            log_info "Остановка процесса на порту $port (PID: $pid)"
            kill -TERM $pid 2>/dev/null || true
            sleep 2
            # Принудительная остановка если процесс все еще работает
            if kill -0 $pid 2>/dev/null; then
                kill -KILL $pid 2>/dev/null || true
            fi
        fi
    done
    
    log_success "Сервисы остановлены"
}

# Очистка кэша и временных файлов
clean_cache() {
    log_info "Очистка кэша и временных файлов..."
    
    # Очистка npm кэша
    if [ -d "node_modules" ]; then
        log_info "Удаление node_modules..."
        rm -rf node_modules
    fi
    
    if [ -d "client/node_modules" ]; then
        log_info "Удаление client/node_modules..."
        rm -rf client/node_modules
    fi
    
    if [ -d "server/node_modules" ]; then
        log_info "Удаление server/node_modules..."
        rm -rf server/node_modules
    fi
    
    # Очистка логов
    if [ -d "logs" ]; then
        log_info "Очистка логов..."
        rm -rf logs/*
    fi
    
    # Очистка временных файлов
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    
    log_success "Кэш и временные файлы очищены"
}

# Переустановка зависимостей
reinstall_dependencies() {
    log_info "Переустановка зависимостей..."
    
    # Корневые зависимости
    if [ -f "package.json" ]; then
        log_info "Установка корневых зависимостей..."
        npm install
    fi
    
    # Клиентские зависимости
    if [ -f "client/package.json" ]; then
        log_info "Установка клиентских зависимостей..."
        cd client
        npm install
        cd ..
    fi
    
    # Серверные зависимости
    if [ -f "server/package.json" ]; then
        log_info "Установка серверных зависимостей..."
        cd server
        npm install
        cd ..
    fi
    
    log_success "Зависимости переустановлены"
}

# Проверка конфигурации
check_configuration() {
    log_info "Проверка конфигурации..."
    
    # Проверка .env файлов
    if [ ! -f "server/.env" ]; then
        log_warning "Файл server/.env не найден"
        if [ -f "server/.env.example" ]; then
            log_info "Копирование .env.example в .env..."
            cp server/.env.example server/.env
            log_warning "Отредактируйте server/.env с правильными настройками"
        fi
    fi
    
    if [ ! -f "client/.env" ]; then
        log_warning "Файл client/.env не найден"
        if [ -f "client/.env.example" ]; then
            log_info "Копирование .env.example в .env..."
            cp client/.env.example client/.env
        fi
    fi
    
    # Проверка критических переменных
    if [ -f "server/.env" ]; then
        local required_vars=("JWT_SECRET" "MONGODB_URI")
        local missing_vars=()
        
        for var in "${required_vars[@]}"; do
            if ! grep -q "^$var=" server/.env; then
                missing_vars+=("$var")
            fi
        done
        
        if [ ${#missing_vars[@]} -ne 0 ]; then
            log_error "Отсутствуют обязательные переменные в .env: ${missing_vars[*]}"
            return 1
        fi
    fi
    
    log_success "Конфигурация проверена"
}

# Проверка и восстановление базы данных
check_database() {
    log_info "Проверка базы данных..."
    
    # Извлечение URI из .env
    local mongodb_uri=""
    if [ -f "server/.env" ]; then
        mongodb_uri=$(grep "^MONGODB_URI=" server/.env | cut -d'=' -f2- | tr -d '"')
    fi
    
    if [ -z "$mongodb_uri" ]; then
        log_error "MONGODB_URI не найден в server/.env"
        return 1
    fi
    
    # Проверка подключения к MongoDB
    if mongosh "$mongodb_uri" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        log_success "База данных доступна"
        
        # Проверка коллекций
        local collections=$(mongosh "$mongodb_uri" --quiet --eval "db.getCollectionNames()" 2>/dev/null || echo "[]")
        if [[ "$collections" == *"users"* ]]; then
            log_success "Коллекция users найдена"
        else
            log_warning "Коллекция users не найдена - возможно нужна инициализация"
        fi
    else
        log_error "Не удается подключиться к базе данных"
        log_info "Убедитесь, что MongoDB запущен и доступен по адресу: $mongodb_uri"
        return 1
    fi
}

# Запуск сервисов
start_services() {
    log_info "Запуск сервисов..."
    
    # Запуск сервера в фоне
    if [ -f "server/package.json" ]; then
        log_info "Запуск сервера..."
        cd server
        npm run dev > ../server.log 2>&1 &
        local server_pid=$!
        cd ..
        
        # Ожидание запуска сервера
        log_info "Ожидание запуска сервера..."
        local attempts=0
        while [ $attempts -lt 30 ]; do
            if curl -s http://localhost:5000/api/auth/test >/dev/null 2>&1; then
                log_success "Сервер запущен (PID: $server_pid)"
                break
            fi
            sleep 1
            attempts=$((attempts + 1))
        done
        
        if [ $attempts -eq 30 ]; then
            log_error "Сервер не запустился в течение 30 секунд"
            return 1
        fi
    fi
    
    # Запуск клиента в фоне
    if [ -f "client/package.json" ]; then
        log_info "Запуск клиента..."
        cd client
        npm start > ../client.log 2>&1 &
        local client_pid=$!
        cd ..
        
        # Ожидание запуска клиента
        log_info "Ожидание запуска клиента..."
        local attempts=0
        while [ $attempts -lt 60 ]; do
            if curl -s http://localhost:3000 >/dev/null 2>&1; then
                log_success "Клиент запущен (PID: $client_pid)"
                break
            fi
            sleep 1
            attempts=$((attempts + 1))
        done
        
        if [ $attempts -eq 60 ]; then
            log_error "Клиент не запустился в течение 60 секунд"
            return 1
        fi
    fi
}

# Тестирование системы
test_system() {
    log_info "Тестирование системы..."
    
    # Тест сервера
    if curl -s http://localhost:5000/api/auth/test >/dev/null; then
        log_success "Сервер отвечает"
    else
        log_error "Сервер не отвечает"
        return 1
    fi
    
    # Тест клиента
    if curl -s http://localhost:3000 >/dev/null; then
        log_success "Клиент доступен"
    else
        log_error "Клиент недоступен"
        return 1
    fi
    
    # Тест аутентификации
    local auth_response=$(curl -s -X POST http://localhost:5000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"identifier":"test","password":"test"}' || echo "error")
    
    if [[ "$auth_response" == *"error"* ]] || [[ "$auth_response" == *"Неверные учетные данные"* ]] || [[ "$auth_response" == *"Ошибка валидации"* ]]; then
        log_success "Эндпоинт аутентификации работает корректно"
    else
        log_warning "Неожиданный ответ от эндпоинта аутентификации"
    fi
}

# Создание тестового пользователя
create_test_user() {
    log_info "Создание тестового пользователя..."
    
    local test_user_data='{
        "username": "testuser",
        "email": "test@anime-site.local",
        "password": "TestPassword123",
        "confirmPassword": "TestPassword123"
    }'
    
    local response=$(curl -s -X POST http://localhost:5000/api/auth/register \
        -H "Content-Type: application/json" \
        -d "$test_user_data" || echo "error")
    
    if [[ "$response" == *"success"* ]]; then
        log_success "Тестовый пользователь создан"
        log_info "Email: test@anime-site.local"
        log_info "Password: TestPassword123"
    elif [[ "$response" == *"уже существует"* ]]; then
        log_warning "Тестовый пользователь уже существует"
    else
        log_error "Не удалось создать тестового пользователя"
        log_info "Ответ: $response"
    fi
}

# Главная функция
main() {
    local action=${1:-"full"}
    
    case $action in
        "check")
            log_info "Выполнение проверки системы..."
            check_dependencies
            check_ports
            check_configuration
            check_database
            ;;
        "clean")
            log_info "Выполнение очистки..."
            stop_services
            clean_cache
            ;;
        "install")
            log_info "Переустановка зависимостей..."
            reinstall_dependencies
            ;;
        "start")
            log_info "Запуск сервисов..."
            start_services
            test_system
            ;;
        "test")
            log_info "Тестирование системы..."
            test_system
            ;;
        "user")
            log_info "Создание тестового пользователя..."
            create_test_user
            ;;
        "full"|*)
            log_info "Выполнение полного восстановления..."
            check_dependencies
            stop_services
            clean_cache
            reinstall_dependencies
            check_configuration
            check_database
            start_services
            sleep 5
            test_system
            create_test_user
            ;;
    esac
    
    echo ""
    log_success "Операция завершена!"
    echo ""
    echo "📋 Доступные команды:"
    echo "  $0 check    - Проверка системы"
    echo "  $0 clean    - Очистка кэша"
    echo "  $0 install  - Переустановка зависимостей"
    echo "  $0 start    - Запуск сервисов"
    echo "  $0 test     - Тестирование"
    echo "  $0 user     - Создание тестового пользователя"
    echo "  $0 full     - Полное восстановление (по умолчанию)"
    echo ""
    echo "🌐 Ссылки:"
    echo "  Клиент: http://localhost:3000"
    echo "  Сервер: http://localhost:5000"
    echo "  API тест: http://localhost:5000/api/auth/test"
}

# Запуск скрипта
main "$@"