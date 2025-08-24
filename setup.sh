#!/bin/bash

echo "========================================"
echo "   Настройка Social Photo Search"
echo "========================================"
echo

echo "[1/5] Установка зависимостей..."
npm install
if [ $? -ne 0 ]; then
    echo "Ошибка при установке зависимостей!"
    exit 1
fi

echo "[2/5] Создание папки uploads..."
mkdir -p uploads

echo "[3/5] Создание файла .env..."
if [ ! -f ".env" ]; then
    cat > .env << EOF
# API ключи для социальных сетей
VK_API_KEY=your_vk_api_key_here
FB_API_KEY=your_facebook_api_key_here
IG_API_KEY=your_instagram_api_key_here
LI_API_KEY=your_linkedin_api_key_here
TG_API_KEY=your_telegram_bot_token_here

# Настройки сервера
PORT=3000
NODE_ENV=development
EOF
    echo "Файл .env создан! Заполните API ключи."
else
    echo "Файл .env уже существует."
fi

echo "[4/5] Проверка структуры проекта..."
if [ ! -f "server.js" ]; then
    echo "Ошибка: server.js не найден!"
    exit 1
fi

if [ ! -f "public/index.html" ]; then
    echo "Ошибка: public/index.html не найден!"
    exit 1
fi

echo "[5/5] Настройка завершена!"
echo
echo "========================================"
echo "   Следующие шаги:"
echo "========================================"
echo "1. Откройте файл .env и заполните API ключи"
echo "2. Запустите приложение: npm run dev"
echo "3. Откройте http://localhost:3000 в браузере"
echo
echo "========================================"
echo "   Готово!"
echo "========================================"


