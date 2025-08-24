# 🔍 Поиск людей в социальных сетях по фото

Полноценное приложение для поиска людей в социальных сетях по загруженной фотографии с реальными API интеграциями.

## ✨ Возможности

- **🔐 Реальные API ключи** для социальных сетей
- **🛡️ Настроенный CORS** и безопасность
- **⚡ Rate limiting** и управление квотами
- **🔄 Прокси-сервер** для API запросов
- **📱 Поиск в 5+ социальных сетях**
- **🤖 AI анализ фотографий** (симуляция)
- **📊 Детальная статистика** поиска
- **🎨 Современный UI/UX**

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Скопируйте .env.example в .env
cp .env.example .env
```

Заполните API ключи в файле `.env`:

```env
# VKontakte API
VK_API_KEY=your_vk_api_key_here

# Facebook Graph API
FB_API_KEY=your_facebook_api_key_here

# Instagram Basic Display API
IG_API_KEY=your_instagram_api_key_here

# LinkedIn API
LI_API_KEY=your_linkedin_api_key_here

# Telegram Bot API
TG_API_KEY=your_telegram_bot_token_here

# Настройки сервера
PORT=3000
NODE_ENV=development
```

### 3. Создание папки для загрузок

```bash
mkdir uploads
```

### 4. Запуск приложения

```bash
# Режим разработки
npm run dev

# Продакшн режим
npm start
```

Приложение будет доступно по адресу: http://localhost:3000

## 🔑 Получение API ключей

### VKontakte API
1. Перейдите на [VK Developers](https://vk.com/dev)
2. Создайте новое приложение
3. Получите `access_token` в разделе "Настройки"
4. Добавьте в `.env`: `VK_API_KEY=your_token`

### Facebook Graph API
1. Перейдите на [Facebook Developers](https://developers.facebook.com/)
2. Создайте новое приложение
3. Получите `access_token` в разделе "Tools > Graph API Explorer"
4. Добавьте в `.env`: `FB_API_KEY=your_token`

### Instagram Basic Display API
1. В том же Facebook приложении
2. Добавьте продукт "Instagram Basic Display"
3. Получите `access_token` для Instagram
4. Добавьте в `.env`: `IG_API_KEY=your_token`

### LinkedIn API
1. Перейдите на [LinkedIn Developers](https://developer.linkedin.com/)
2. Создайте новое приложение
3. Получите `access_token` в разделе "Auth"
4. Добавьте в `.env`: `LI_API_KEY=your_token`

### Telegram Bot API
1. Напишите [@BotFather](https://t.me/botfather) в Telegram
2. Создайте нового бота командой `/newbot`
3. Получите `bot_token`
4. Добавьте в `.env`: `TG_API_KEY=your_token`

## 🛡️ Безопасность и CORS

### Настройка CORS
Приложение уже настроено с безопасными CORS настройками:

```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Content Security Policy
Настроен CSP для защиты от XSS атак:

```javascript
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.vk.com", "https://graph.facebook.com", "https://api.instagram.com", "https://api.linkedin.com", "https://api.telegram.org"]
        }
    }
}));
```

## ⚡ Rate Limiting

### Общие лимиты
- **15 минут**: максимум 100 запросов с одного IP
- **1 минута**: максимум 10 поисков

### Лимиты по социальным сетям
- **VKontakte**: 100 запросов/минуту
- **Facebook**: 200 запросов/минуту
- **Instagram**: 100 запросов/минуту
- **LinkedIn**: 50 запросов/минуту
- **Telegram**: 30 запросов/минуту

### Настройка лимитов
Измените лимиты в файле `server.js`:

```javascript
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов
    // ...
});

const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 10, // максимум 10 поисков
    // ...
});
```

## 🔄 Прокси-сервер

Приложение работает как прокси-сервер для API социальных сетей:

1. **Клиент** отправляет фото на `/api/search`
2. **Сервер** анализирует фото и создает поисковые запросы
3. **Сервер** отправляет запросы к API социальных сетей
4. **Сервер** обрабатывает ответы и возвращает результаты клиенту

### Преимущества прокси-сервера:
- ✅ Скрытие API ключей от клиента
- ✅ Централизованное управление rate limiting
- ✅ Кэширование и оптимизация запросов
- ✅ Единообразная обработка ошибок
- ✅ Логирование и мониторинг

## 📁 Структура проекта

```
social-photo-search/
├── server.js              # Основной сервер
├── package.json           # Зависимости
├── .env.example          # Пример переменных окружения
├── public/               # Статические файлы
│   └── index.html        # Главная страница
├── uploads/              # Папка для загруженных фото
└── README.md             # Документация
```

## 🚀 Развертывание

### Локальное развертывание
```bash
git clone <repository>
cd social-photo-search
npm install
cp .env.example .env
# Заполните .env файл
npm start
```

### Docker развертывание
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Heroku развертывание
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set VK_API_KEY=your_key
heroku config:set FB_API_KEY=your_key
# ... другие API ключи
git push heroku main
```

## 🔧 Настройка и кастомизация

### Изменение порта
```bash
# В .env файле
PORT=8080

# Или при запуске
PORT=8080 npm start
```

### Добавление новых социальных сетей
1. Добавьте API ключ в `.env`
2. Создайте метод поиска в классе `SocialNetworkAPI`
3. Добавьте обработку результатов
4. Обновите rate limiting

### Изменение лимитов файлов
```javascript
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
        files: 5 // 5 файлов
    }
});
```

## 📊 Мониторинг и логирование

### Просмотр rate limits
```bash
curl http://localhost:3000/api/rate-limits
```

### Логи сервера
Все API запросы и ошибки логируются в консоль.

### Метрики
- Количество запросов к каждой сети
- Время ответа API
- Количество ошибок
- Использование rate limits

## 🐛 Устранение неполадок

### Ошибка "Превышен лимит запросов"
- Подождите сброса лимита (обычно 1 минута)
- Проверьте настройки rate limiting
- Увеличьте лимиты в коде

### Ошибка "API ключ недействителен"
- Проверьте правильность API ключа
- Убедитесь, что ключ не истек
- Проверьте права доступа приложения

### Ошибка CORS
- Проверьте настройки CORS в `server.js`
- Убедитесь, что домен добавлен в `allowedOrigins`
- Проверьте настройки браузера

### Файл не загружается
- Проверьте размер файла (максимум 10MB)
- Убедитесь, что файл - изображение
- Проверьте права на папку `uploads`

## 🔮 Планы развития

- [ ] Интеграция с реальными AI сервисами распознавания лиц
- [ ] Кэширование результатов поиска
- [ ] База данных для хранения истории поисков
- [ ] Аутентификация пользователей
- [ ] API для мобильных приложений
- [ ] Веб-хуки для уведомлений
- [ ] Аналитика и отчеты

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🤝 Поддержка

Если у вас есть вопросы или проблемы:

1. Проверьте [Issues](https://github.com/yourusername/social-photo-search/issues)
2. Создайте новый Issue с описанием проблемы
3. Опишите шаги для воспроизведения
4. Приложите логи ошибок

## 🙏 Благодарности

- [Express.js](https://expressjs.com/) - веб-фреймворк
- [Multer](https://github.com/expressjs/multer) - обработка файлов
- [Helmet](https://helmetjs.github.io/) - безопасность
- [Express Rate Limit](https://github.com/nfriedly/express-rate-limit) - ограничение запросов
- [Axios](https://axios-http.com/) - HTTP клиент

---

**Внимание**: Это демонстрационное приложение. Для продакшн использования обязательно:
- Настройте HTTPS
- Используйте сильные API ключи
- Настройте мониторинг и логирование
- Ограничьте доступ по IP при необходимости
- Регулярно обновляйте зависимости
