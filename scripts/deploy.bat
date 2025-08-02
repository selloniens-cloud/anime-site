@echo off
REM Скрипт автоматического развертывания аниме-сайта для Windows
REM Использование: scripts\deploy.bat [dev|prod|monitoring|logs|stop|cleanup|health]

setlocal enabledelayedexpansion

REM Цвета для вывода (если поддерживаются)
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM Функции для вывода
:print_info
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Проверка зависимостей
:check_dependencies
call :print_info "Проверка зависимостей..."

docker --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker не установлен!"
    exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose не установлен!"
    exit /b 1
)

call :print_success "Все зависимости установлены"
goto :eof

REM Проверка файла .env
:check_env_file
call :print_info "Проверка файла переменных окружения..."

if not exist .env (
    call :print_warning "Файл .env не найден. Создание из .env.example..."
    copy .env.example .env >nul
    call :print_warning "ВАЖНО: Отредактируйте файл .env перед продакшн развертыванием!"
)

REM Проверка критических переменных для продакшена
if "%~1"=="prod" (
    findstr /C:"change-in-production" .env >nul
    if not errorlevel 1 (
        call :print_error "Обнаружены небезопасные значения по умолчанию в .env!"
        call :print_error "Измените JWT_SECRET, MONGO_PASSWORD и другие секреты!"
        exit /b 1
    )
)

call :print_success "Файл .env проверен"
goto :eof

REM Создание необходимых директорий
:create_directories
call :print_info "Создание необходимых директорий..."

if not exist nginx\ssl mkdir nginx\ssl
if not exist server\uploads mkdir server\uploads
if not exist server\logs mkdir server\logs
if not exist monitoring\grafana\provisioning mkdir monitoring\grafana\provisioning

call :print_success "Директории созданы"
goto :eof

REM Развертывание в режиме разработки
:deploy_dev
call :print_info "Запуск в режиме разработки..."

docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml build
docker compose -f docker-compose.dev.yml up -d

call :print_success "Режим разработки запущен!"
call :print_info "Frontend: http://localhost:3000"
call :print_info "Backend API: http://localhost:5000"
call :print_info "MongoDB: localhost:27017"
call :print_info "Redis: localhost:6379"
goto :eof

REM Развертывание в продакшене
:deploy_prod
call :print_info "Запуск в продакшн режиме..."

docker compose down
docker compose build --no-cache
docker compose up -d

call :print_success "Продакшн режим запущен!"
call :print_info "Приложение: http://localhost"
call :print_info "Для HTTPS настройте SSL сертификаты в nginx\ssl\"
goto :eof

REM Развертывание с мониторингом
:deploy_monitoring
call :print_info "Запуск с мониторингом..."

docker compose --profile monitoring down
docker compose --profile monitoring build
docker compose --profile monitoring up -d

call :print_success "Режим с мониторингом запущен!"
call :print_info "Приложение: http://localhost"
call :print_info "Grafana: http://localhost:3001"
call :print_info "Prometheus: http://localhost:9090"
goto :eof

REM Проверка здоровья сервисов
:health_check
call :print_info "Проверка здоровья сервисов..."

timeout /t 10 /nobreak >nul

REM Проверка основного приложения
curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
    call :print_warning "Приложение недоступно"
) else (
    call :print_success "Приложение работает"
)

REM Проверка API
curl -f http://localhost/api/health >nul 2>&1
if errorlevel 1 (
    call :print_warning "API недоступно"
) else (
    call :print_success "API работает"
)

REM Показать статус контейнеров
call :print_info "Статус контейнеров:"
docker compose ps
goto :eof

REM Показать логи
:show_logs
call :print_info "Показ логов сервисов..."
docker compose logs -f --tail=50
goto :eof

REM Остановка всех сервисов
:stop_services
call :print_info "Остановка всех сервисов..."

docker compose down
docker compose -f docker-compose.dev.yml down
docker compose --profile monitoring down

call :print_success "Все сервисы остановлены"
goto :eof

REM Очистка системы
:cleanup
call :print_info "Очистка Docker системы..."

docker system prune -f
docker volume prune -f

call :print_success "Очистка завершена"
goto :eof

REM Главная функция
:main
echo 🐳 Скрипт развертывания аниме-сайта
echo ==================================

call :check_dependencies

set "command=%~1"
if "%command%"=="" set "command=dev"

if "%command%"=="dev" (
    call :check_env_file "dev"
    call :create_directories
    call :deploy_dev
    call :health_check
) else if "%command%"=="prod" (
    call :check_env_file "prod"
    call :create_directories
    call :deploy_prod
    call :health_check
) else if "%command%"=="monitoring" (
    call :check_env_file "prod"
    call :create_directories
    call :deploy_monitoring
    call :health_check
) else if "%command%"=="logs" (
    call :show_logs
) else if "%command%"=="stop" (
    call :stop_services
) else if "%command%"=="cleanup" (
    call :stop_services
    call :cleanup
) else if "%command%"=="health" (
    call :health_check
) else (
    echo Использование: %0 [dev^|prod^|monitoring^|logs^|stop^|cleanup^|health]
    echo.
    echo Команды:
    echo   dev        - Запуск в режиме разработки
    echo   prod       - Запуск в продакшн режиме
    echo   monitoring - Запуск с мониторингом
    echo   logs       - Показать логи
    echo   stop       - Остановить все сервисы
    echo   cleanup    - Очистить Docker систему
    echo   health     - Проверить здоровье сервисов
    exit /b 1
)

goto :eof

REM Запуск главной функции
call :main %*