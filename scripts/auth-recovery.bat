@echo off
setlocal enabledelayedexpansion

REM Anime-Site Authentication Recovery Script for Windows
REM Скрипт для восстановления системы аутентификации (Windows)

echo.
echo 🔧 ANIME-SITE AUTHENTICATION RECOVERY TOOL (Windows)
echo =======================================================
echo.

set "action=%~1"
if "%action%"=="" set "action=full"

REM Функции для логирования
:log_info
echo [INFO] %~1
goto :eof

:log_success
echo [SUCCESS] %~1
goto :eof

:log_warning
echo [WARNING] %~1
goto :eof

:log_error
echo [ERROR] %~1
goto :eof

REM Проверка зависимостей
:check_dependencies
call :log_info "Проверка зависимостей..."

where node >nul 2>&1
if errorlevel 1 (
    call :log_error "Node.js не установлен"
    echo Скачайте и установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    call :log_error "npm не найден"
    pause
    exit /b 1
)

where mongosh >nul 2>&1
if errorlevel 1 (
    call :log_warning "mongosh не найден - проверка БД будет пропущена"
) else (
    call :log_success "mongosh найден"
)

where curl >nul 2>&1
if errorlevel 1 (
    call :log_warning "curl не найден - некоторые тесты будут пропущены"
) else (
    call :log_success "curl найден"
)

call :log_success "Проверка зависимостей завершена"
goto :eof

REM Проверка портов
:check_ports
call :log_info "Проверка занятости портов..."

netstat -an | findstr ":3000" >nul
if not errorlevel 1 (
    call :log_success "Порт 3000 занят (клиент запущен)"
) else (
    call :log_warning "Порт 3000 свободен (клиент не запущен)"
)

netstat -an | findstr ":5000" >nul
if not errorlevel 1 (
    call :log_success "Порт 5000 занят (сервер запущен)"
) else (
    call :log_warning "Порт 5000 свободен (сервер не запущен)"
)

netstat -an | findstr ":27017" >nul
if not errorlevel 1 (
    call :log_success "Порт 27017 занят (MongoDB запущен)"
) else (
    call :log_warning "Порт 27017 свободен (MongoDB не запущен)"
)

goto :eof

REM Остановка сервисов
:stop_services
call :log_info "Остановка сервисов..."

REM Остановка процессов на портах 3000 и 5000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000"') do (
    if not "%%a"=="0" (
        call :log_info "Остановка процесса на порту 3000 (PID: %%a)"
        taskkill /PID %%a /F >nul 2>&1
    )
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000"') do (
    if not "%%a"=="0" (
        call :log_info "Остановка процесса на порту 5000 (PID: %%a)"
        taskkill /PID %%a /F >nul 2>&1
    )
)

call :log_success "Сервисы остановлены"
goto :eof

REM Очистка кэша
:clean_cache
call :log_info "Очистка кэша и временных файлов..."

if exist "node_modules" (
    call :log_info "Удаление node_modules..."
    rmdir /s /q "node_modules" 2>nul
)

if exist "client\node_modules" (
    call :log_info "Удаление client\node_modules..."
    rmdir /s /q "client\node_modules" 2>nul
)

if exist "server\node_modules" (
    call :log_info "Удаление server\node_modules..."
    rmdir /s /q "server\node_modules" 2>nul
)

if exist "logs" (
    call :log_info "Очистка логов..."
    del /q "logs\*.*" 2>nul
)

REM Очистка временных файлов
del /s /q "*.log" 2>nul
del /s /q ".DS_Store" 2>nul

call :log_success "Кэш и временные файлы очищены"
goto :eof

REM Переустановка зависимостей
:reinstall_dependencies
call :log_info "Переустановка зависимостей..."

if exist "package.json" (
    call :log_info "Установка корневых зависимостей..."
    npm install
    if errorlevel 1 (
        call :log_error "Ошибка установки корневых зависимостей"
        goto :eof
    )
)

if exist "client\package.json" (
    call :log_info "Установка клиентских зависимостей..."
    cd client
    npm install
    if errorlevel 1 (
        call :log_error "Ошибка установки клиентских зависимостей"
        cd ..
        goto :eof
    )
    cd ..
)

if exist "server\package.json" (
    call :log_info "Установка серверных зависимостей..."
    cd server
    npm install
    if errorlevel 1 (
        call :log_error "Ошибка установки серверных зависимостей"
        cd ..
        goto :eof
    )
    cd ..
)

call :log_success "Зависимости переустановлены"
goto :eof

REM Проверка конфигурации
:check_configuration
call :log_info "Проверка конфигурации..."

if not exist "server\.env" (
    call :log_warning "Файл server\.env не найден"
    if exist "server\.env.example" (
        call :log_info "Копирование .env.example в .env..."
        copy "server\.env.example" "server\.env" >nul
        call :log_warning "Отредактируйте server\.env с правильными настройками"
    )
)

if not exist "client\.env" (
    call :log_warning "Файл client\.env не найден"
    if exist "client\.env.example" (
        call :log_info "Копирование .env.example в .env..."
        copy "client\.env.example" "client\.env" >nul
    )
)

REM Проверка критических переменных
if exist "server\.env" (
    findstr /C:"JWT_SECRET=" "server\.env" >nul
    if errorlevel 1 (
        call :log_error "JWT_SECRET не найден в server\.env"
        goto :eof
    )
    
    findstr /C:"MONGODB_URI=" "server\.env" >nul
    if errorlevel 1 (
        call :log_error "MONGODB_URI не найден в server\.env"
        goto :eof
    )
)

call :log_success "Конфигурация проверена"
goto :eof

REM Запуск сервисов
:start_services
call :log_info "Запуск сервисов..."

if exist "server\package.json" (
    call :log_info "Запуск сервера..."
    cd server
    start /B npm run dev > ..\server.log 2>&1
    cd ..
    
    call :log_info "Ожидание запуска сервера..."
    timeout /t 10 /nobreak >nul
    
    where curl >nul 2>&1
    if not errorlevel 1 (
        curl -s http://localhost:5000/api/auth/test >nul 2>&1
        if not errorlevel 1 (
            call :log_success "Сервер запущен"
        ) else (
            call :log_warning "Сервер может быть еще не готов"
        )
    )
)

if exist "client\package.json" (
    call :log_info "Запуск клиента..."
    cd client
    start /B npm start > ..\client.log 2>&1
    cd ..
    
    call :log_info "Ожидание запуска клиента..."
    timeout /t 15 /nobreak >nul
    call :log_success "Клиент запущен (проверьте http://localhost:3000)"
)

goto :eof

REM Тестирование системы
:test_system
call :log_info "Тестирование системы..."

where curl >nul 2>&1
if errorlevel 1 (
    call :log_warning "curl не найден - тестирование пропущено"
    goto :eof
)

curl -s http://localhost:5000/api/auth/test >nul 2>&1
if not errorlevel 1 (
    call :log_success "Сервер отвечает"
) else (
    call :log_error "Сервер не отвечает"
)

curl -s http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    call :log_success "Клиент доступен"
) else (
    call :log_error "Клиент недоступен"
)

goto :eof

REM Создание тестового пользователя
:create_test_user
call :log_info "Создание тестового пользователя..."

where curl >nul 2>&1
if errorlevel 1 (
    call :log_warning "curl не найден - создание пользователя пропущено"
    goto :eof
)

curl -s -X POST http://localhost:5000/api/auth/register ^
    -H "Content-Type: application/json" ^
    -d "{\"username\":\"testuser\",\"email\":\"test@anime-site.local\",\"password\":\"TestPassword123\",\"confirmPassword\":\"TestPassword123\"}" >nul 2>&1

if not errorlevel 1 (
    call :log_success "Тестовый пользователь создан"
    echo Email: test@anime-site.local
    echo Password: TestPassword123
) else (
    call :log_warning "Не удалось создать тестового пользователя или он уже существует"
)

goto :eof

REM Главная функция
:main
if "%action%"=="check" (
    call :log_info "Выполнение проверки системы..."
    call :check_dependencies
    call :check_ports
    call :check_configuration
) else if "%action%"=="clean" (
    call :log_info "Выполнение очистки..."
    call :stop_services
    call :clean_cache
) else if "%action%"=="install" (
    call :log_info "Переустановка зависимостей..."
    call :reinstall_dependencies
) else if "%action%"=="start" (
    call :log_info "Запуск сервисов..."
    call :start_services
    call :test_system
) else if "%action%"=="test" (
    call :log_info "Тестирование системы..."
    call :test_system
) else if "%action%"=="user" (
    call :log_info "Создание тестового пользователя..."
    call :create_test_user
) else (
    call :log_info "Выполнение полного восстановления..."
    call :check_dependencies
    call :stop_services
    call :clean_cache
    call :reinstall_dependencies
    call :check_configuration
    call :start_services
    timeout /t 5 /nobreak >nul
    call :test_system
    call :create_test_user
)

echo.
call :log_success "Операция завершена!"
echo.
echo 📋 Доступные команды:
echo   %~nx0 check    - Проверка системы
echo   %~nx0 clean    - Очистка кэша
echo   %~nx0 install  - Переустановка зависимостей
echo   %~nx0 start    - Запуск сервисов
echo   %~nx0 test     - Тестирование
echo   %~nx0 user     - Создание тестового пользователя
echo   %~nx0 full     - Полное восстановление (по умолчанию)
echo.
echo 🌐 Ссылки:
echo   Клиент: http://localhost:3000
echo   Сервер: http://localhost:5000
echo   API тест: http://localhost:5000/api/auth/test
echo.

goto :eof

REM Запуск главной функции
call :main

pause