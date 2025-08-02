# Руководство по диагностике и устранению проблем с входом в аккаунт
## Anime-Site Authentication Troubleshooting Guide

---

## 📋 СОДЕРЖАНИЕ

1. [Быстрая диагностика](#быстрая-диагностика)
2. [Диагностические скрипты](#диагностические-скрипты)
3. [Пошаговое руководство по диагностике](#пошаговое-руководство-по-диагностике)
4. [Методы восстановления доступа](#методы-восстановления-доступа)
5. [Рекомендации по безопасности](#рекомендации-по-безопасности)
6. [Часто задаваемые вопросы](#часто-задаваемые-вопросы)

---

## 🚀 БЫСТРАЯ ДИАГНОСТИКА

### Проверочный чек-лист (выполнить за 2 минуты):

- [ ] **Сервер запущен**: `http://localhost:5000/api/auth/test` возвращает ответ
- [ ] **Клиент запущен**: `http://localhost:3000` загружается
- [ ] **База данных**: MongoDB доступна на `mongodb://localhost:27017`
- [ ] **Учетные данные**: Email/username и пароль введены корректно
- [ ] **Браузер**: Очищен кэш и localStorage
- [ ] **Сеть**: Нет блокировки запросов в DevTools

---

## 🔧 ДИАГНОСТИЧЕСКИЕ СКРИПТЫ

### 1. Скрипт проверки состояния системы

```javascript
// Вставить в консоль браузера на странице http://localhost:3000
(async function systemHealthCheck() {
    console.log('🔍 ANIME-SITE AUTH DIAGNOSTIC TOOL');
    console.log('=====================================');
    
    const results = {
        client: '❌',
        server: '❌',
        database: '❌',
        localStorage: '❌',
        network: '❌'
    };
    
    // 1. Проверка клиента
    try {
        if (window.location.origin === 'http://localhost:3000') {
            results.client = '✅';
            console.log('✅ Клиент: Запущен на правильном порту');
        }
    } catch (e) {
        console.log('❌ Клиент: Ошибка -', e.message);
    }
    
    // 2. Проверка сервера
    try {
        const serverResponse = await fetch('http://localhost:5000/api/auth/test');
        if (serverResponse.ok) {
            results.server = '✅';
            console.log('✅ Сервер: Доступен и отвечает');
        } else {
            console.log('❌ Сервер: Недоступен, статус:', serverResponse.status);
        }
    } catch (e) {
        console.log('❌ Сервер: Ошибка подключения -', e.message);
    }
    
    // 3. Проверка localStorage
    try {
        const token = localStorage.getItem('token');
        if (token) {
            console.log('⚠️  LocalStorage: Найден старый токен, возможно истекший');
            console.log('Token preview:', token.substring(0, 50) + '...');
            
            // Попытка декодировать JWT
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp * 1000 < Date.now();
                console.log('Token expires:', new Date(payload.exp * 1000));
                console.log('Token expired:', isExpired ? '❌ ДА' : '✅ НЕТ');
                results.localStorage = isExpired ? '⚠️' : '✅';
            } catch (e) {
                console.log('❌ Токен поврежден');
            }
        } else {
            results.localStorage = '✅';
            console.log('✅ LocalStorage: Чистый (нет старых токенов)');
        }
    } catch (e) {
        console.log('❌ LocalStorage: Ошибка доступа -', e.message);
    }
    
    // 4. Проверка сети
    try {
        const networkTest = await fetch('http://localhost:5000/api/auth/test', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        results.network = networkTest.ok ? '✅' : '❌';
        console.log(networkTest.ok ? '✅ Сеть: CORS и подключение работают' : '❌ Сеть: Проблемы с CORS или подключением');
    } catch (e) {
        console.log('❌ Сеть: Ошибка -', e.message);
    }
    
    // Итоговый отчет
    console.log('\n📊 ИТОГОВЫЙ ОТЧЕТ:');
    console.log('==================');
    Object.entries(results).forEach(([key, status]) => {
        console.log(`${status} ${key.toUpperCase()}`);
    });
    
    const healthScore = Object.values(results).filter(r => r === '✅').length;
    console.log(`\n🏥 Общее состояние системы: ${healthScore}/5`);
    
    if (healthScore < 3) {
        console.log('🚨 КРИТИЧЕСКОЕ: Система требует немедленного вмешательства');
    } else if (healthScore < 5) {
        console.log('⚠️  ВНИМАНИЕ: Обнаружены проблемы, требующие исправления');
    } else {
        console.log('✅ ОТЛИЧНО: Система работает нормально');
    }
    
    return results;
})();
```

### 2. Скрипт тестирования аутентификации

```javascript
// Тест входа с детальным логированием
(async function testLogin(email, password) {
    console.log('🔐 ТЕСТ АУТЕНТИФИКАЦИИ');
    console.log('=====================');
    
    if (!email || !password) {
        console.log('❌ Использование: testLogin("your@email.com", "yourpassword")');
        return;
    }
    
    try {
        console.log('📤 Отправка запроса на вход...');
        console.log('Email:', email);
        console.log('Password length:', password.length);
        
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                identifier: email,
                password: password
            })
        });
        
        console.log('📥 Ответ сервера:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        
        const data = await response.json();
        console.log('Response Data:', data);
        
        if (response.ok && data.success) {
            console.log('✅ УСПЕХ: Аутентификация прошла успешно');
            console.log('User ID:', data.data.user.id);
            console.log('Username:', data.data.user.username);
            console.log('Role:', data.data.user.role);
            console.log('Token preview:', data.data.tokens.accessToken.substring(0, 50) + '...');
        } else {
            console.log('❌ ОШИБКА: Аутентификация не удалась');
            console.log('Причина:', data.error?.message || 'Неизвестная ошибка');
        }
        
    } catch (error) {
        console.log('💥 КРИТИЧЕСКАЯ ОШИБКА:', error.message);
        console.log('Возможные причины:');
        console.log('- Сервер не запущен');
        console.log('- Проблемы с сетью');
        console.log('- CORS блокировка');
    }
})
// Использование: testLogin("user@example.com", "password123")
```

### 3. Скрипт очистки аутентификационных данных

```javascript
// Полная очистка данных аутентификации
(function clearAuthData() {
    console.log('🧹 ОЧИСТКА ДАННЫХ АУТЕНТИФИКАЦИИ');
    console.log('=================================');
    
    // Очистка localStorage
    const authKeys = ['token', 'refreshToken', 'user', 'authState'];
    let clearedCount = 0;
    
    authKeys.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            clearedCount++;
            console.log(`✅ Удален: ${key}`);
        }
    });
    
    // Очистка sessionStorage
    authKeys.forEach(key => {
        if (sessionStorage.getItem(key)) {
            sessionStorage.removeItem(key);
            clearedCount++;
            console.log(`✅ Удален из session: ${key}`);
        }
    });
    
    // Очистка cookies (если используются)
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    console.log(`\n📊 Очищено элементов: ${clearedCount}`);
    console.log('🔄 Рекомендуется перезагрузить страницу');
    
    // Автоматическая перезагрузка через 2 секунды
    setTimeout(() => {
        console.log('🔄 Перезагрузка страницы...');
        window.location.reload();
    }, 2000);
})();
```

---

## 📋 ПОШАГОВОЕ РУКОВОДСТВО ПО ДИАГНОСТИКЕ

### ЭТАП 1: Первичная диагностика (2-3 минуты)

#### 1.1 Проверка доступности сервисов

```bash
# Проверка сервера
curl -X GET http://localhost:5000/api/auth/test

# Ожидаемый ответ:
# {"message":"Auth routes working!","timestamp":"2024-01-01T12:00:00.000Z"}
```

```bash
# Проверка клиента
curl -I http://localhost:3000

# Ожидаемый ответ: HTTP/1.1 200 OK
```

#### 1.2 Проверка базы данных

```bash
# Подключение к MongoDB
mongosh "mongodb://admin:password@localhost:27017/anime-site?authSource=admin"

# В MongoDB shell:
db.users.countDocuments()  # Должно вернуть количество пользователей
```

### ЭТАП 2: Диагностика проблем с учетными данными (5 минут)

#### 2.1 Проверка существования пользователя

```javascript
// В консоли браузера
(async function checkUser(email) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: email,
                password: 'wrong_password_test'
            })
        });
        
        const data = await response.json();
        
        if (data.error?.message === 'Неверные учетные данные') {
            console.log('✅ Пользователь существует, проблема в пароле');
        } else if (data.error?.message === 'Пользователь не найден') {
            console.log('❌ Пользователь не найден');
        }
    } catch (e) {
        console.log('❌ Ошибка проверки:', e.message);
    }
})('your@email.com');
```

#### 2.2 Проверка валидации данных

```javascript
// Проверка формата email
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Проверка пароля
function validatePassword(password) {
    const hasMinLength = password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    return {
        valid: hasMinLength && hasLetters && hasNumbers,
        issues: {
            length: !hasMinLength,
            letters: !hasLetters,
            numbers: !hasNumbers
        }
    };
}

console.log('Email valid:', validateEmail('test@example.com'));
console.log('Password check:', validatePassword('yourpassword'));
```

### ЭТАП 3: Диагностика токенов и сессий (3-5 минут)

#### 3.1 Анализ JWT токена

```javascript
function analyzeJWT(token) {
    if (!token) {
        console.log('❌ Токен отсутствует');
        return;
    }
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('❌ Неверный формат JWT токена');
            return;
        }
        
        const payload = JSON.parse(atob(parts[1]));
        const now = Math.floor(Date.now() / 1000);
        
        console.log('🔍 Анализ JWT токена:');
        console.log('User ID:', payload.id);
        console.log('Issued at:', new Date(payload.iat * 1000));
        console.log('Expires at:', new Date(payload.exp * 1000));
        console.log('Is expired:', payload.exp < now ? '❌ ДА' : '✅ НЕТ');
        console.log('Time until expiry:', Math.max(0, payload.exp - now), 'seconds');
        
        return {
            valid: payload.exp >= now,
            payload: payload
        };
    } catch (e) {
        console.log('❌ Ошибка декодирования токена:', e.message);
        return null;
    }
}

// Использование
const token = localStorage.getItem('token');
analyzeJWT(token);
```

#### 3.2 Тест обновления токена

```javascript
async function testTokenRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
        console.log('❌ Refresh токен отсутствует');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Токен успешно обновлен');
            localStorage.setItem('token', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        } else {
            console.log('❌ Ошибка обновления токена:', data.error.message);
        }
    } catch (e) {
        console.log('❌ Критическая ошибка:', e.message);
    }
}
```

### ЭТАП 4: Диагностика сетевых проблем (5 минут)

#### 4.1 Проверка CORS

```javascript
async function testCORS() {
    console.log('🌐 Тестирование CORS...');
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/test', {
            method: 'OPTIONS'
        });
        
        console.log('CORS Headers:');
        console.log('Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
        console.log('Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
        console.log('Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
        
    } catch (e) {
        console.log('❌ CORS Error:', e.message);
    }
}
```

#### 4.2 Проверка сетевых таймаутов

```javascript
async function testNetworkTimeout() {
    console.log('⏱️ Тестирование таймаутов...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
        const start = Date.now();
        const response = await fetch('http://localhost:5000/api/auth/test', {
            signal: controller.signal
        });
        const duration = Date.now() - start;
        
        clearTimeout(timeoutId);
        console.log(`✅ Запрос выполнен за ${duration}ms`);
        
        if (duration > 3000) {
            console.log('⚠️ Медленное соединение, возможны проблемы');
        }
        
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('❌ Таймаут: Сервер не отвечает более 5 секунд');
        } else {
            console.log('❌ Сетевая ошибка:', e.message);
        }
    }
}
```

### ЭТАП 5: Диагностика состояния аккаунта (3 минуты)

#### 5.1 Проверка статуса пользователя

```javascript
async function checkUserStatus(userId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            const user = data.data.user;
            console.log('👤 Статус пользователя:');
            console.log('Active:', user.isActive ? '✅' : '❌');
            console.log('Email verified:', user.isEmailVerified ? '✅' : '❌');
            console.log('Banned until:', user.bannedUntil || 'Не заблокирован');
            console.log('Last login:', user.lastLogin);
        }
    } catch (e) {
        console.log('❌ Ошибка проверки статуса:', e.message);
    }
}
```

---

## 🔧 МЕТОДЫ ВОССТАНОВЛЕНИЯ ДОСТУПА

### 1. Восстановление через email

#### 1.1 Запрос сброса пароля

```javascript
async function requestPasswordReset(email) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Инструкции отправлены на email');
            console.log('📧 Проверьте папку "Спам" если письмо не пришло');
        } else {
            console.log('❌ Ошибка:', data.error.message);
        }
    } catch (e) {
        console.log('❌ Критическая ошибка:', e.message);
    }
}
```

#### 1.2 Сброс пароля по токену

```javascript
async function resetPassword(token, newPassword) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token: token,
                password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Пароль успешно изменен');
            console.log('🔑 Новые токены получены');
            
            // Сохранение новых токенов
            localStorage.setItem('token', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        } else {
            console.log('❌ Ошибка:', data.error.message);
        }
    } catch (e) {
        console.log('❌ Критическая ошибка:', e.message);
    }
}
```

### 2. Альтернативные методы входа

#### 2.1 Вход через username вместо email

```javascript
async function loginWithUsername(username, password) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                identifier: username,  // Используем username вместо email
                password: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Успешный вход через username');
            localStorage.setItem('token', data.data.tokens.accessToken);
            localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
        } else {
            console.log('❌ Ошибка:', data.error.message);
        }
    } catch (e) {
        console.log('❌ Критическая ошибка:', e.message);
    }
}
```

### 3. Восстановление через техподдержку

#### 3.1 Сбор диагностической информации

```javascript
function collectDiagnosticInfo() {
    const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        localStorage: {
            hasToken: !!localStorage.getItem('token'),
            hasRefreshToken: !!localStorage.getItem('refreshToken')
        },
        cookies: document.cookie,
        networkStatus: navigator.onLine,
        browserInfo: {
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled
        }
    };
    
    console.log('📋 Диагностическая информация для техподдержки:');
    console.log(JSON.stringify(info, null, 2));
    
    // Копирование в буфер обмена
    navigator.clipboard.writeText(JSON.stringify(info, null, 2))
        .then(() => console.log('✅ Информация скопирована в буфер обмена'))
        .catch(() => console.log('❌ Не удалось скопировать в буфер обмена'));
    
    return info;
}
```

---

## 🔒 РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ

### 1. Создание надежных паролей

#### Требования к паролю:
- **Минимум 8 символов**
- **Содержит буквы и цифры**
- **Не содержит личную информацию**
- **Уникален для каждого сайта**

#### Генератор надежного пароля:

```javascript
function generateSecurePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Обязательные символы
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // строчная буква
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // заглавная буква
    password += '0123456789'[Math.floor(Math.random() * 10)]; // цифра
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // спецсимвол
    
    // Остальные символы
    for (let i = 4; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Перемешивание
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

console.log('Сгенерированный пароль:', generateSecurePassword());
```

### 2. Настройка многофакторной аутентификации

#### 2.1 Проверка поддержки 2FA

```javascript
async function check2FASupport() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/2fa/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('2FA Status:', data.data.enabled ? '✅ Включен' : '❌ Отключен');
        }
    } catch (e) {
        console.log('❌ 2FA не поддерживается или ошибка:', e.message);
    }
}
```

### 3. Аудит активных сессий

#### 3.1 Просмотр активных сессий

```javascript
async function getActiveSessions() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/sessions', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('🔍 Активные сессии:');
            data.data.sessions.forEach((session, index) => {
                console.log(`${index + 1}. IP: ${session.ip}, Last Active: ${session.lastActive}`);
            });
        }
    } catch (e) {
        console.log('❌ Функция не реализована или ошибка:', e.message);
    }
}
```

### 4. Мониторинг подозрительной активности

#### 4.1 Проверка последних входов

```javascript
async function checkRecentLogins() {
    try {
        const response = await fetch('http://localhost:5000/api/users/login-history', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('📊 История входов:');
            data.data.logins.forEach((login, index) => {
                console.log(`${index + 1}. ${login.timestamp} - IP: ${login.ip} - ${login.success ? '✅' : '❌'}`);
            });
        }
    } catch (e) {
        console.log('❌ Функция не реализована или ошибка:', e.message);
    }
}
```

---

## ❓ ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ

### Q: Не могу войти, пишет "Неверные учетные данные"

**A:** Проверьте:
1. Правильность написания email/username
2. Корректность пароля (учитывается регистр)
3. Существование аккаунта в системе
4. Используйте диагностический скрипт `testLogin()`

### Q: Страница входа не загружается

**A:** Выполните:
1. Проверьте доступность `http://localhost:3000`
2. Очистите кэш браузера (Ctrl+Shift+R)
3. Проверьте консоль браузера на ошибки
4. Убедитесь, что клиент запущен (`npm start`)

### Q: Ошибка "Сервер недоступен"

**A:** Проверьте:
1. Запущен ли сервер (`npm run dev` в папке server)
2. Доступность порта 5000
3. Правильность URL в [`client/src/services/api.js`](client/src/services/api.js:3)
4. Настройки файрвола и антивируса

### Q: Токен постоянно истекает

**A:** Возможные причины:
1. Неправильное время на сервере/клиенте
2. Короткое время жизни токена в [`server/.env`](server/.env:11)
3. Проблемы с refresh токеном
4. Используйте скрипт очистки токенов

### Q: Ошибка CORS при входе

**A:** Проверьте:
1. Настройки CORS в [`server/app.js`](server/app.js)
2. Правильность CLIENT_URL в [`server/.env`](server/.env:43)
3. Используйте диагностический скрипт для проверки CORS

### Q: База данных недоступна

**A:** Выполните:
1. Проверьте запуск MongoDB: `mongosh "mongodb://localhost:27017"`
2. Проверьте MONGODB_URI в [`server/.env`](server/.env:6)
3. Убедитесь в правильности учетных данных
4. Проверьте логи MongoDB

---

## 🛠️ АВТОМАТИЗИРОВАННЫЕ ИНСТРУМЕНТЫ

### 1. Диагностический скрипт Node.js

```bash
# Запуск полной диагностики
node scripts/auth-diagnostics.js

# Результат сохраняется в auth-diagnostic-report.json
```

### 2. Скрипт восстановления системы

```bash
# Полное восстановление
chmod +x scripts/auth-recovery.sh
./scripts/auth-recovery.sh

# Отдельные операции
./scripts/auth-recovery.sh check    # Только проверка
./scripts/auth-recovery.sh clean    # Очистка кэша
./scripts/auth-recovery.sh start    # Запуск сервисов
```

### 3. Быстрые команды для разработчиков

```bash
# Перезапуск всей системы
./scripts/auth-recovery.sh full

# Создание тестового пользователя
./scripts/auth-recovery.sh user

# Проверка состояния системы
./scripts/auth-recovery.sh check
```

---

## 📊 МОНИТОРИНГ И ЛОГИРОВАНИЕ

### 1. Включение детального логирования

В [`server/.env`](server/.env:2) установите:
```env
NODE_ENV=development
DEBUG=auth:*
```

### 2. Просмотр логов аутентификации

```bash
# Логи сервера
tail -f server.log | grep "LOGIN\|AUTH"

# Логи клиента
tail -f client.log | grep "auth"
```

### 3. Мониторинг в реальном времени

```javascript
// В консоли браузера - мониторинг запросов
const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('🌐 Fetch request:', args[0]);
    return originalFetch.apply(this, args)
        .then(response => {
            console.log('📥 Fetch response:', response.status, args[0]);
            return response;
        })
        .catch(error => {
            console.log('❌ Fetch error:', error.message, args[0]);
            throw error;
        });
};
```

---

## 🔐 РАСШИРЕННЫЕ РЕКОМЕНДАЦИИ ПО БЕЗОПАСНОСТИ

### 1. Аудит безопасности системы

```javascript
// Скрипт проверки безопасности
(async function securityAudit() {
    console.log('🔒 АУДИТ БЕЗОПАСНОСТИ СИСТЕМЫ');
    console.log('============================');
    
    const checks = {
        httpsUsed: window.location.protocol === 'https:',
        secureStorage: typeof(Storage) !== "undefined",
        cookieSecure: document.cookie.includes('Secure'),
        xssProtection: document.querySelector('meta[http-equiv="X-XSS-Protection"]') !== null,
        contentSecurityPolicy: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null
    };
    
    Object.entries(checks).forEach(([check, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'FAIL'}`);
    });
    
    // Проверка силы пароля в localStorage
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
            console.log(`🕐 Токен истекает через: ${Math.floor(timeUntilExpiry / 60)} минут`);
        } catch (e) {
            console.log('❌ Поврежденный токен в localStorage');
        }
    }
})();
```

### 2. Настройка Content Security Policy

Добавьте в [`client/public/index.html`](client/public/index.html):
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' 'unsafe-inline';
               style-src 'self' 'unsafe-inline';
               connect-src 'self' http://localhost:5000;">
```

### 3. Защита от брутфорс атак

Реализация rate limiting в [`server/middleware/auth.js`](server/middleware/auth.js):
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 попыток
    message: 'Слишком много попыток входа, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
});

// Применение к роуту входа
router.post('/login', loginLimiter, authController.login);
```

### 4. Проверка утечек данных

```javascript
// Проверка на утечки в localStorage
function checkDataLeaks() {
    console.log('🔍 ПРОВЕРКА УТЕЧЕК ДАННЫХ');
    console.log('========================');
    
    const sensitiveKeys = ['password', 'secret', 'key', 'token'];
    const leaks = [];
    
    // Проверка localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        sensitiveKeys.forEach(sensitive => {
            if (key.toLowerCase().includes(sensitive) ||
                value.toLowerCase().includes(sensitive)) {
                leaks.push({type: 'localStorage', key, issue: sensitive});
            }
        });
    }
    
    // Проверка sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        
        sensitiveKeys.forEach(sensitive => {
            if (key.toLowerCase().includes(sensitive) ||
                value.toLowerCase().includes(sensitive)) {
                leaks.push({type: 'sessionStorage', key, issue: sensitive});
            }
        });
    }
    
    if (leaks.length > 0) {
        console.log('❌ Обнаружены потенциальные утечки:');
        leaks.forEach(leak => {
            console.log(`   ${leak.type}: ${leak.key} (${leak.issue})`);
        });
    } else {
        console.log('✅ Утечек не обнаружено');
    }
    
    return leaks;
}
```

---

## 📞 КОНТАКТЫ ТЕХНИЧЕСКОЙ ПОДДЕРЖКИ

### Когда обращаться в техподдержку:

1. **Критические ошибки**: Система полностью недоступна
2. **Проблемы с данными**: Потеря пользовательских данных
3. **Безопасность**: Подозрение на взлом или утечку
4. **Производительность**: Критическое снижение скорости

### Информация для техподдержки:

Перед обращением соберите:
```javascript
// Выполните в консоли браузера
collectDiagnosticInfo(); // Из скрипта выше
```

### Шаблон обращения:

```
Тема: [ANIME-SITE AUTH] Проблема с входом в аккаунт

Описание проблемы:
- Что происходит: [описание]
- Когда началось: [дата/время]
- Воспроизводимость: [всегда/иногда/один раз]

Предпринятые действия:
- [ ] Очистка кэша браузера
- [ ] Проверка учетных данных
- [ ] Запуск диагностических скриптов
- [ ] Перезапуск сервисов

Диагностическая информация:
[Вставить результат collectDiagnosticInfo()]

Логи ошибок:
[Скриншоты консоли браузера и серверных логов]
```

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Документация проекта:
- [`README.md`](README.md) - Основная документация
- [`DOCKER_DEPLOYMENT.md`](DOCKER_DEPLOYMENT.md) - Развертывание в Docker
- [`docs/ARCHITECTURE_OVERVIEW.md`](docs/ARCHITECTURE_OVERVIEW.md) - Архитектура системы

### Полезные ссылки:
- [JWT.io](https://jwt.io/) - Декодирование JWT токенов
- [MongoDB Compass](https://www.mongodb.com/products/compass) - GUI для MongoDB
- [Postman](https://www.postman.com/) - Тестирование API

### Инструменты разработчика:
- **Chrome DevTools**: F12 → Network/Console
- **React Developer Tools**: Расширение для браузера
- **MongoDB Compass**: Визуальный интерфейс для БД

---

## 📝 CHANGELOG

### v1.0.0 (2024-01-01)
- Создано комплексное руководство по диагностике
- Добавлены автоматизированные скрипты диагностики
- Реализованы методы восстановления доступа
- Добавлены рекомендации по безопасности

---

**© 2024 Anime-Site Project. Все права защищены.**

*Это руководство регулярно обновляется. Последняя версия всегда доступна в репозитории проекта.*