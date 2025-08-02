#!/bin/bash

# Скрипт автоматического развертывания аниме-сайта
# Использование: ./scripts/deploy.sh [dev|prod|monitoring]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка зависимостей
check_dependencies() {
    print_info "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker не установлен!"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        print_error "Docker Compose не установлен!"
        exit 1
    fi
    
    print_success "Все зависимости установлены"
}

# Проверка файла .env
check_env_file() {
    print_info "Проверка файла переменных окружения..."
    
    if [ ! -f .env ]; then
        print_warning "Файл .env не найден. Создание из .env.example..."
        cp .env.example .env
        print_warning "ВАЖНО: Отредактируйте файл .env перед продакшн развертыванием!"
    fi
    
    # Проверка критических переменных для продакшена
    if [ "$1" = "prod" ]; then
        if grep -q "change-in-production" .env; then
            print_error "Обнаружены небезопасные значения по умолчанию в .env!"
            print_error "Измените JWT_SECRET, MONGO_PASSWORD и другие секреты!"
            exit 1
        fi
    fi
    
    print_success "Файл .env проверен"
}

# Создание необходимых директорий
create_directories() {
    print_info "Создание необходимых директорий..."
    
    mkdir -p nginx/ssl
    mkdir -p server/uploads
    mkdir -p server/logs
    mkdir -p monitoring/grafana/provisioning
    
    print_success "Директории созданы"
}

# Развертывание в режиме разработки
deploy_dev() {
    print_info "Запуск в режиме разработки..."
    
    docker compose -f docker-compose.dev.yml down
    docker compose -f docker-compose.dev.yml build
    docker compose -f docker-compose.dev.yml up -d
    
    print_success "Режим разработки запущен!"
    print_info "Frontend: http://localhost:3000"
    print_info "Backend API: http://localhost:5000"
    print_info "MongoDB: localhost:27017"
    print_info "Redis: localhost:6379"
}

# Развертывание в продакшене
deploy_prod() {
    print_info "Запуск в продакшн режиме..."
    
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    
    print_success "Продакшн режим запущен!"
    print_info "Приложение: http://localhost"
    print_info "Для HTTPS настройте SSL сертификаты в nginx/ssl/"
}

# Развертывание с мониторингом
deploy_monitoring() {
    print_info "Запуск с мониторингом..."
    
    docker compose --profile monitoring down
    docker compose --profile monitoring build
    docker compose --profile monitoring up -d
    
    print_success "Режим с мониторингом запущен!"
    print_info "Приложение: http://localhost"
    print_info "Grafana: http://localhost:3001"
    print_info "Prometheus: http://localhost:9090"
}

# Проверка здоровья сервисов
health_check() {
    print_info "Проверка здоровья сервисов..."
    
    sleep 10  # Ждем запуска сервисов
    
    # Проверка основного приложения
    if curl -f http://localhost/health &> /dev/null; then
        print_success "Приложение работает"
    else
        print_warning "Приложение недоступно"
    fi
    
    # Проверка API
    if curl -f http://localhost/api/health &> /dev/null; then
        print_success "API работает"
    else
        print_warning "API недоступно"
    fi
    
    # Показать статус контейнеров
    print_info "Статус контейнеров:"
    docker compose ps
}

# Показать логи
show_logs() {
    print_info "Показ логов сервисов..."
    docker compose logs -f --tail=50
}

# Остановка всех сервисов
stop_services() {
    print_info "Остановка всех сервисов..."
    
    docker compose down
    docker compose -f docker-compose.dev.yml down
    docker compose --profile monitoring down
    
    print_success "Все сервисы остановлены"
}

# Очистка системы
cleanup() {
    print_info "Очистка Docker системы..."
    
    docker system prune -f
    docker volume prune -f
    
    print_success "Очистка завершена"
}

# Главная функция
main() {
    echo "🐳 Скрипт развертывания аниме-сайта"
    echo "=================================="
    
    check_dependencies
    
    case "${1:-dev}" in
        "dev")
            check_env_file "dev"
            create_directories
            deploy_dev
            health_check
            ;;
        "prod")
            check_env_file "prod"
            create_directories
            deploy_prod
            health_check
            ;;
        "monitoring")
            check_env_file "prod"
            create_directories
            deploy_monitoring
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "stop")
            stop_services
            ;;
        "cleanup")
            stop_services
            cleanup
            ;;
        "health")
            health_check
            ;;
        *)
            echo "Использование: $0 [dev|prod|monitoring|logs|stop|cleanup|health]"
            echo ""
            echo "Команды:"
            echo "  dev        - Запуск в режиме разработки"
            echo "  prod       - Запуск в продакшн режиме"
            echo "  monitoring - Запуск с мониторингом"
            echo "  logs       - Показать логи"
            echo "  stop       - Остановить все сервисы"
            echo "  cleanup    - Очистить Docker систему"
            echo "  health     - Проверить здоровье сервисов"
            exit 1
            ;;
    esac
}

# Запуск главной функции
main "$@"