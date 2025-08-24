@echo off
echo ========================================
echo   Настройка Social Photo Search
echo ========================================
echo.

echo [1/5] Установка зависимостей...
npm install
if %errorlevel% neq 0 (
    echo Ошибка при установке зависимостей!
    pause
    exit /b 1
)

echo [2/5] Создание папки uploads...
if not exist "uploads" mkdir uploads

echo [3/5] Создание файла .env...
if not exist ".env" (
    echo # API ключи для социальных сетей > .env
    echo VK_API_KEY=your_vk_api_key_here >> .env
    echo FB_API_KEY=your_facebook_api_key_here >> .env
    echo IG_API_KEY=your_instagram_api_key_here >> .env
    echo LI_API_KEY=your_linkedin_api_key_here >> .env
    echo TG_API_KEY=your_telegram_bot_token_here >> .env
    echo. >> .env
    echo # Настройки сервера >> .env
    echo PORT=3000 >> .env
    echo NODE_ENV=development >> .env
    echo Файл .env создан! Заполните API ключи.
) else (
    echo Файл .env уже существует.
)

echo [4/5] Проверка структуры проекта...
if not exist "server.js" (
    echo Ошибка: server.js не найден!
    pause
    exit /b 1
)

if not exist "public\index.html" (
    echo Ошибка: public\index.html не найден!
    pause
    exit /b 1
)

echo [5/5] Настройка завершена!
echo.
echo ========================================
echo   Следующие шаги:
echo ========================================
echo 1. Откройте файл .env и заполните API ключи
echo 2. Запустите приложение: npm run dev
echo 3. Откройте http://localhost:3000 в браузере
echo.
echo ========================================
echo   Готово! Нажмите любую клавишу...
echo ========================================
pause > nul


