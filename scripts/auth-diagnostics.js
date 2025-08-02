#!/usr/bin/env node

/**
 * Anime-Site Authentication Diagnostics Tool
 * Автоматизированная диагностика проблем с аутентификацией
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AuthDiagnostics {
    constructor() {
        this.serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
        this.clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = {
            'info': '📋',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        }[type] || '📋';
        
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    addResult(testName, passed, message, details = null) {
        const result = {
            test: testName,
            passed,
            message,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.results.tests.push(result);
        
        if (passed) {
            this.results.summary.passed++;
            this.log(`${testName}: ${message}`, 'success');
        } else {
            this.results.summary.failed++;
            this.log(`${testName}: ${message}`, 'error');
        }
    }

    addWarning(testName, message, details = null) {
        const result = {
            test: testName,
            passed: null,
            message,
            details,
            timestamp: new Date().toISOString(),
            warning: true
        };
        
        this.results.tests.push(result);
        this.results.summary.warnings++;
        this.log(`${testName}: ${message}`, 'warning');
    }

    async testServerConnectivity() {
        this.log('Тестирование подключения к серверу...');
        
        try {
            const response = await axios.get(`${this.serverUrl}/api/auth/test`, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                this.addResult(
                    'Server Connectivity',
                    true,
                    'Сервер доступен и отвечает',
                    { status: response.status, data: response.data }
                );
            } else {
                this.addResult(
                    'Server Connectivity',
                    false,
                    `Сервер вернул неожиданный статус: ${response.status}`
                );
            }
        } catch (error) {
            this.addResult(
                'Server Connectivity',
                false,
                'Сервер недоступен',
                { error: error.message, code: error.code }
            );
        }
    }

    async testClientConnectivity() {
        this.log('Тестирование подключения к клиенту...');
        
        try {
            const response = await axios.get(this.clientUrl, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                this.addResult(
                    'Client Connectivity',
                    true,
                    'Клиент доступен',
                    { status: response.status }
                );
            } else {
                this.addResult(
                    'Client Connectivity',
                    false,
                    `Клиент вернул неожиданный статус: ${response.status}`
                );
            }
        } catch (error) {
            this.addResult(
                'Client Connectivity',
                false,
                'Клиент недоступен',
                { error: error.message, code: error.code }
            );
        }
    }

    async testDatabaseConnection() {
        this.log('Тестирование подключения к базе данных...');
        
        try {
            const response = await axios.get(`${this.serverUrl}/api/health/database`, {
                timeout: 10000
            });
            
            if (response.data.success) {
                this.addResult(
                    'Database Connection',
                    true,
                    'База данных доступна',
                    response.data
                );
            } else {
                this.addResult(
                    'Database Connection',
                    false,
                    'База данных недоступна',
                    response.data
                );
            }
        } catch (error) {
            this.addResult(
                'Database Connection',
                false,
                'Не удалось проверить базу данных',
                { error: error.message }
            );
        }
    }

    async testAuthEndpoints() {
        this.log('Тестирование эндпоинтов аутентификации...');
        
        const endpoints = [
            { path: '/api/auth/test', method: 'GET', name: 'Auth Test' },
            { path: '/api/auth/login', method: 'POST', name: 'Login Endpoint', expectError: true },
            { path: '/api/auth/register', method: 'POST', name: 'Register Endpoint', expectError: true },
            { path: '/api/auth/refresh', method: 'POST', name: 'Refresh Endpoint', expectError: true }
        ];

        for (const endpoint of endpoints) {
            try {
                const config = {
                    method: endpoint.method.toLowerCase(),
                    url: `${this.serverUrl}${endpoint.path}`,
                    timeout: 5000
                };

                if (endpoint.method === 'POST') {
                    config.data = {};
                }

                const response = await axios(config);
                
                if (endpoint.expectError) {
                    this.addResult(
                        endpoint.name,
                        response.status === 400,
                        response.status === 400 ? 'Эндпоинт работает (ожидаемая ошибка валидации)' : 'Неожиданный ответ',
                        { status: response.status }
                    );
                } else {
                    this.addResult(
                        endpoint.name,
                        response.status === 200,
                        'Эндпоинт доступен',
                        { status: response.status }
                    );
                }
            } catch (error) {
                if (endpoint.expectError && error.response?.status === 400) {
                    this.addResult(
                        endpoint.name,
                        true,
                        'Эндпоинт работает (ожидаемая ошибка валидации)',
                        { status: error.response.status }
                    );
                } else {
                    this.addResult(
                        endpoint.name,
                        false,
                        'Эндпоинт недоступен',
                        { error: error.message, status: error.response?.status }
                    );
                }
            }
        }
    }

    async testCORS() {
        this.log('Тестирование CORS настроек...');
        
        try {
            const response = await axios.options(`${this.serverUrl}/api/auth/test`, {
                headers: {
                    'Origin': this.clientUrl,
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                },
                timeout: 5000
            });

            const corsHeaders = {
                origin: response.headers['access-control-allow-origin'],
                methods: response.headers['access-control-allow-methods'],
                headers: response.headers['access-control-allow-headers']
            };

            const corsWorking = corsHeaders.origin === this.clientUrl || corsHeaders.origin === '*';

            this.addResult(
                'CORS Configuration',
                corsWorking,
                corsWorking ? 'CORS настроен корректно' : 'Проблемы с CORS настройками',
                corsHeaders
            );
        } catch (error) {
            this.addResult(
                'CORS Configuration',
                false,
                'Не удалось проверить CORS',
                { error: error.message }
            );
        }
    }

    async testEnvironmentVariables() {
        this.log('Проверка переменных окружения...');
        
        const requiredEnvVars = [
            'JWT_SECRET',
            'MONGODB_URI',
            'NODE_ENV'
        ];

        const envPath = path.join(process.cwd(), 'server', '.env');
        
        if (!fs.existsSync(envPath)) {
            this.addResult(
                'Environment Variables',
                false,
                'Файл .env не найден',
                { path: envPath }
            );
            return;
        }

        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const envVars = {};
            
            envContent.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    envVars[key.trim()] = value.trim();
                }
            });

            const missingVars = requiredEnvVars.filter(varName => !envVars[varName]);
            
            if (missingVars.length === 0) {
                this.addResult(
                    'Environment Variables',
                    true,
                    'Все необходимые переменные окружения настроены',
                    { found: Object.keys(envVars).length }
                );
            } else {
                this.addResult(
                    'Environment Variables',
                    false,
                    `Отсутствуют переменные: ${missingVars.join(', ')}`,
                    { missing: missingVars }
                );
            }
        } catch (error) {
            this.addResult(
                'Environment Variables',
                false,
                'Ошибка чтения файла .env',
                { error: error.message }
            );
        }
    }

    async testLoginFlow() {
        this.log('Тестирование процесса входа с тестовыми данными...');
        
        const testCredentials = {
            identifier: 'test@example.com',
            password: 'wrongpassword'
        };

        try {
            const response = await axios.post(`${this.serverUrl}/api/auth/login`, testCredentials, {
                timeout: 5000
            });

            // Если вход прошел успешно с тестовыми данными - это проблема
            this.addResult(
                'Login Flow Security',
                false,
                'КРИТИЧЕСКАЯ ОШИБКА: Вход прошел с тестовыми данными',
                { credentials: testCredentials }
            );
        } catch (error) {
            if (error.response?.status === 401) {
                this.addResult(
                    'Login Flow Security',
                    true,
                    'Процесс входа работает корректно (отклонил неверные данные)',
                    { status: error.response.status }
                );
            } else if (error.response?.status === 400) {
                this.addResult(
                    'Login Flow Validation',
                    true,
                    'Валидация входных данных работает',
                    { status: error.response.status }
                );
            } else {
                this.addResult(
                    'Login Flow',
                    false,
                    'Неожиданная ошибка в процессе входа',
                    { error: error.message, status: error.response?.status }
                );
            }
        }
    }

    generateReport() {
        const report = {
            ...this.results,
            summary: {
                ...this.results.summary,
                total: this.results.tests.length,
                successRate: Math.round((this.results.summary.passed / this.results.tests.length) * 100)
            }
        };

        const reportPath = path.join(process.cwd(), 'auth-diagnostic-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`Отчет сохранен: ${reportPath}`, 'info');
        return report;
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ИТОГОВЫЙ ОТЧЕТ ДИАГНОСТИКИ');
        console.log('='.repeat(60));
        
        console.log(`✅ Успешно: ${this.results.summary.passed}`);
        console.log(`❌ Ошибки: ${this.results.summary.failed}`);
        console.log(`⚠️  Предупреждения: ${this.results.summary.warnings}`);
        console.log(`📊 Всего тестов: ${this.results.tests.length}`);
        
        const successRate = Math.round((this.results.summary.passed / this.results.tests.length) * 100);
        console.log(`🎯 Успешность: ${successRate}%`);

        console.log('\n' + '='.repeat(60));
        
        if (successRate >= 80) {
            console.log('🎉 ОТЛИЧНО: Система работает стабильно');
        } else if (successRate >= 60) {
            console.log('⚠️  ВНИМАНИЕ: Обнаружены проблемы, требующие внимания');
        } else {
            console.log('🚨 КРИТИЧНО: Система требует немедленного вмешательства');
        }

        // Показать критические ошибки
        const criticalErrors = this.results.tests.filter(test => !test.passed && !test.warning);
        if (criticalErrors.length > 0) {
            console.log('\n🚨 КРИТИЧЕСКИЕ ОШИБКИ:');
            criticalErrors.forEach(error => {
                console.log(`   ❌ ${error.test}: ${error.message}`);
            });
        }
    }

    async runAllTests() {
        this.log('Запуск полной диагностики системы аутентификации...', 'info');
        
        await this.testServerConnectivity();
        await this.testClientConnectivity();
        await this.testDatabaseConnection();
        await this.testAuthEndpoints();
        await this.testCORS();
        await this.testEnvironmentVariables();
        await this.testLoginFlow();
        
        this.generateReport();
        this.printSummary();
        
        return this.results;
    }
}

// Запуск диагностики если скрипт вызван напрямую
if (require.main === module) {
    const diagnostics = new AuthDiagnostics();
    diagnostics.runAllTests().catch(error => {
        console.error('❌ Критическая ошибка диагностики:', error.message);
        process.exit(1);
    });
}

module.exports = AuthDiagnostics;