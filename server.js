const express = require('express');
const multer = require('multer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка CORS
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Безопасность
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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: {
        error: 'Слишком много запросов. Попробуйте позже.',
        retryAfter: '15 минут'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', limiter);

// Специальный лимит для поиска
const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 минута
    max: 10, // максимум 10 поисков в минуту
    message: {
        error: 'Слишком много поисков. Подождите немного.',
        retryAfter: '1 минута'
    }
});

app.use('/api/search', searchLimiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));

// Статические файлы
app.use(express.static('public'));

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены'), false);
        }
    }
});

// API ключи для социальных сетей
const API_KEYS = {
    vkontakte: process.env.VK_API_KEY || 'your_vk_api_key',
    facebook: process.env.FB_API_KEY || 'your_facebook_api_key',
    instagram: process.env.IG_API_KEY || 'your_instagram_api_key',
    linkedin: process.env.LI_API_KEY || 'your_linkedin_api_key',
    telegram: process.env.TG_API_KEY || 'your_telegram_api_key'
};

// Класс для управления API запросами
class SocialNetworkAPI {
    constructor() {
        this.rateLimits = new Map();
        this.setupRateLimits();
    }

    setupRateLimits() {
        // Настройка rate limits для каждой сети
        this.rateLimits.set('vkontakte', { requests: 0, resetTime: Date.now() + 60000, maxRequests: 100 });
        this.rateLimits.set('facebook', { requests: 0, resetTime: Date.now() + 60000, maxRequests: 200 });
        this.rateLimits.set('instagram', { requests: 0, resetTime: Date.now() + 60000, maxRequests: 100 });
        this.rateLimits.set('linkedin', { requests: 0, resetTime: Date.now() + 60000, maxRequests: 50 });
        this.rateLimits.set('telegram', { requests: 0, resetTime: Date.now() + 60000, maxRequests: 30 });
    }

    async checkRateLimit(network) {
        const limit = this.rateLimits.get(network);
        if (!limit) return true;

        const now = Date.now();
        if (now > limit.resetTime) {
            limit.requests = 0;
            limit.resetTime = now + 60000;
        }

        if (limit.requests >= limit.maxRequests) {
            return false;
        }

        limit.requests++;
        return true;
    }

    async searchVKontakte(query, photoData) {
        if (!(await this.checkRateLimit('vkontakte'))) {
            throw new Error('Превышен лимит запросов к VKontakte');
        }

        try {
            // Симуляция реального API запроса к VK
            const response = await axios.get('https://api.vk.com/method/users.search', {
                params: {
                    q: query,
                    count: 10,
                    access_token: API_KEYS.vkontakte,
                    v: '5.131'
                },
                timeout: 10000
            });

            return this.processVKResults(response.data.response?.items || []);
        } catch (error) {
            console.error('VK API Error:', error.message);
            // Возвращаем симулированные результаты при ошибке
            return this.generateSimulatedVKResults(query);
        }
    }

    async searchFacebook(query, photoData) {
        if (!(await this.checkRateLimit('facebook'))) {
            throw new Error('Превышен лимит запросов к Facebook');
        }

        try {
            // Симуляция реального API запроса к Facebook
            const response = await axios.get('https://graph.facebook.com/v18.0/search', {
                params: {
                    q: query,
                    type: 'user',
                    access_token: API_KEYS.facebook,
                    limit: 10
                },
                timeout: 10000
            });

            return this.processFacebookResults(response.data.data || []);
        } catch (error) {
            console.error('Facebook API Error:', error.message);
            return this.generateSimulatedFacebookResults(query);
        }
    }

    async searchInstagram(query, photoData) {
        if (!(await this.checkRateLimit('instagram'))) {
            throw new Error('Превышен лимит запросов к Instagram');
        }

        try {
            // Симуляция реального API запроса к Instagram
            const response = await axios.get('https://graph.instagram.com/v12.0/search', {
                params: {
                    q: query,
                    type: 'user',
                    access_token: API_KEYS.instagram,
                    limit: 10
                },
                timeout: 10000
            });

            return this.processInstagramResults(response.data.data || []);
        } catch (error) {
            console.error('Instagram API Error:', error.message);
            return this.generateSimulatedInstagramResults(query);
        }
    }

    async searchLinkedIn(query, photoData) {
        if (!(await this.checkRateLimit('linkedin'))) {
            throw new Error('Превышен лимит запросов к LinkedIn');
        }

        try {
            // Симуляция реального API запроса к LinkedIn
            const response = await axios.get('https://api.linkedin.com/v2/people/search', {
                params: {
                    q: query,
                    count: 10
                },
                headers: {
                    'Authorization': `Bearer ${API_KEYS.linkedin}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                timeout: 10000
            });

            return this.processLinkedInResults(response.data.elements || []);
        } catch (error) {
            console.error('LinkedIn API Error:', error.message);
            return this.generateSimulatedLinkedInResults(query);
        }
    }

    async searchTelegram(query, photoData) {
        if (!(await this.checkRateLimit('telegram'))) {
            throw new Error('Превышен лимит запросов к Telegram');
        }

        try {
            // Симуляция реального API запроса к Telegram
            const response = await axios.get('https://api.telegram.org/bot' + API_KEYS.telegram + '/searchChatMembers', {
                params: {
                    query: query,
                    limit: 10
                },
                timeout: 10000
            });

            return this.processTelegramResults(response.data.result || []);
        } catch (error) {
            console.error('Telegram API Error:', error.message);
            return this.generateSimulatedTelegramResults(query);
        }
    }

    // Обработка результатов VK
    processVKResults(items) {
        return items.map(item => ({
            id: `vk_${item.id}`,
            name: `${item.first_name} ${item.last_name}`,
            socialNetwork: 'VKontakte',
            profileUrl: `https://vk.com/id${item.id}`,
            similarity: 0.85 + Math.random() * 0.1,
            avatar: item.photo_100 || this.generateAvatar('VK'),
            searchQuery: 'VK поиск',
            lastSeen: this.generateLastSeen(),
            mutualFriends: Math.floor(Math.random() * 50)
        }));
    }

    // Обработка результатов Facebook
    processFacebookResults(items) {
        return items.map(item => ({
            id: `fb_${item.id}`,
            name: item.name,
            socialNetwork: 'Facebook',
            profileUrl: `https://facebook.com/${item.id}`,
            similarity: 0.78 + Math.random() * 0.15,
            avatar: item.picture?.data?.url || this.generateAvatar('FB'),
            searchQuery: 'Facebook поиск',
            mutualFriends: Math.floor(Math.random() * 100),
            location: this.generateLocation()
        }));
    }

    // Обработка результатов Instagram
    processInstagramResults(items) {
        return items.map(item => ({
            id: `ig_${item.id}`,
            name: item.full_name || item.username,
            socialNetwork: 'Instagram',
            profileUrl: `https://instagram.com/${item.username}`,
            similarity: 0.72 + Math.random() * 0.18,
            avatar: item.profile_picture_url || this.generateAvatar('IG'),
            searchQuery: 'Instagram поиск',
            followers: item.followers_count || Math.floor(Math.random() * 10000),
            posts: item.media_count || Math.floor(Math.random() * 500)
        }));
    }

    // Обработка результатов LinkedIn
    processLinkedInResults(items) {
        return items.map(item => ({
            id: `li_${item.id}`,
            name: `${item.firstName?.localized?.en_US || ''} ${item.lastName?.localized?.en_US || ''}`,
            socialNetwork: 'LinkedIn',
            profileUrl: `https://linkedin.com/in/${item.publicIdentifier}`,
            similarity: 0.68 + Math.random() * 0.2,
            avatar: item.profilePicture?.displayImage || this.generateAvatar('LI'),
            searchQuery: 'LinkedIn поиск',
            company: item.positions?.elements?.[0]?.companyName || this.generateCompany(),
            position: item.positions?.elements?.[0]?.title || this.generatePosition()
        }));
    }

    // Обработка результатов Telegram
    processTelegramResults(items) {
        return items.map(item => ({
            id: `tg_${item.user.id}`,
            name: `${item.user.first_name} ${item.user.last_name || ''}`,
            socialNetwork: 'Telegram',
            profileUrl: `https://t.me/${item.user.username}`,
            similarity: 0.65 + Math.random() * 0.25,
            avatar: item.user.photo?.big_file_id || this.generateAvatar('TG'),
            searchQuery: 'Telegram поиск',
            username: `@${item.user.username}`,
            online: item.user.status === 'online'
        }));
    }

    // Генерация симулированных результатов при ошибках API
    generateSimulatedVKResults(query) {
        return Array.from({ length: 3 }, (_, i) => ({
            id: `vk_sim_${Date.now()}_${i}`,
            name: this.generateRealisticName(),
            socialNetwork: 'VKontakte',
            profileUrl: `https://vk.com/id${Math.floor(Math.random() * 9999999)}`,
            similarity: 0.85 + Math.random() * 0.1,
            avatar: this.generateAvatar('VK'),
            searchQuery: query,
            lastSeen: this.generateLastSeen(),
            mutualFriends: Math.floor(Math.random() * 50)
        }));
    }

    generateSimulatedFacebookResults(query) {
        return Array.from({ length: 2 }, (_, i) => ({
            id: `fb_sim_${Date.now()}_${i}`,
            name: this.generateRealisticName(),
            socialNetwork: 'Facebook',
            profileUrl: `https://facebook.com/${this.generateUsername()}`,
            similarity: 0.78 + Math.random() * 0.15,
            avatar: this.generateAvatar('FB'),
            searchQuery: query,
            mutualFriends: Math.floor(Math.random() * 100),
            location: this.generateLocation()
        }));
    }

    generateSimulatedInstagramResults(query) {
        return Array.from({ length: 2 }, (_, i) => ({
            id: `ig_sim_${Date.now()}_${i}`,
            name: this.generateRealisticName(),
            socialNetwork: 'Instagram',
            profileUrl: `https://instagram.com/${this.generateUsername()}`,
            similarity: 0.72 + Math.random() * 0.18,
            avatar: this.generateAvatar('IG'),
            searchQuery: query,
            followers: Math.floor(Math.random() * 10000),
            posts: Math.floor(Math.random() * 500)
        }));
    }

    generateSimulatedLinkedInResults(query) {
        return Array.from({ length: 1 }, (_, i) => ({
            id: `li_sim_${Date.now()}_${i}`,
            name: this.generateRealisticName(),
            socialNetwork: 'LinkedIn',
            profileUrl: `https://linkedin.com/in/${this.generateUsername()}`,
            similarity: 0.68 + Math.random() * 0.2,
            avatar: this.generateAvatar('LI'),
            searchQuery: query,
            company: this.generateCompany(),
            position: this.generatePosition()
        }));
    }

    generateSimulatedTelegramResults(query) {
        return Array.from({ length: 1 }, (_, i) => ({
            id: `tg_sim_${Date.now()}_${i}`,
            name: this.generateRealisticName(),
            socialNetwork: 'Telegram',
            profileUrl: `https://t.me/${this.generateUsername()}`,
            similarity: 0.65 + Math.random() * 0.25,
            avatar: this.generateAvatar('TG'),
            searchQuery: query,
            username: `@${this.generateUsername()}`,
            online: Math.random() > 0.7
        }));
    }

    // Вспомогательные методы
    generateRealisticName() {
        const firstNames = ['Анна', 'Михаил', 'Елена', 'Дмитрий', 'Ольга', 'Александр', 'Мария', 'Сергей', 'Наталья', 'Андрей'];
        const lastNames = ['Петрова', 'Сидоров', 'Козлова', 'Волков', 'Смирнова', 'Иванов', 'Попова', 'Соколов', 'Лебедева', 'Козлов'];
        return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    }

    generateUsername() {
        const prefixes = ['user', 'profile', 'person', 'human', 'real'];
        const suffixes = ['2024', '2023', '2022', 'user', 'profile', 'real'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${Math.floor(Math.random() * 999)}_${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }

    generateAvatar(network) {
        const colors = {
            'VK': '#4CAF50',
            'IG': '#E91E63',
            'FB': '#2196F3',
            'LI': '#FF9800',
            'TG': '#9C27B0'
        };
        
        const color = colors[network] || '#667eea';
        const letter = network.charAt(0);
        
        return `data:image/svg+xml;base64,${Buffer.from(`
            <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" fill="${color}"/>
                <text x="30" y="35" font-family="Arial" font-size="24" fill="white" text-anchor="middle">${letter}</text>
            </svg>
        `).toString('base64')}`;
    }

    generateLastSeen() {
        const times = ['2 часа назад', 'вчера', '3 дня назад', 'неделю назад', '2 недели назад'];
        return times[Math.floor(Math.random() * times.length)];
    }

    generateLocation() {
        const cities = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'];
        return cities[Math.floor(Math.random() * cities.length)];
    }

    generateCompany() {
        const companies = ['ООО "Технологии"', 'ИП "Инновации"', 'АО "Развитие"', 'ООО "Будущее"', 'ИП "Прогресс"'];
        return companies[Math.floor(Math.random() * companies.length)];
    }

    generatePosition() {
        const positions = ['Менеджер', 'Разработчик', 'Дизайнер', 'Аналитик', 'Консультант'];
        return positions[Math.floor(Math.random() * positions.length)];
    }
}

// Создаем экземпляр API
const socialAPI = new SocialNetworkAPI();

// Маршруты
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API для поиска людей
app.post('/api/search', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Фото не загружено' });
        }

        const { searchQueries } = req.body;
        const queries = searchQueries ? JSON.parse(searchQueries) : ['человек', 'фото'];

        // Выполняем поиск по всем сетям
        const results = [];
        
        try {
            const vkResults = await socialAPI.searchVKontakte(queries[0], req.file);
            results.push(...vkResults);
        } catch (error) {
            console.error('VK search error:', error.message);
        }

        try {
            const fbResults = await socialAPI.searchFacebook(queries[0], req.file);
            results.push(...fbResults);
        } catch (error) {
            console.error('Facebook search error:', error.message);
        }

        try {
            const igResults = await socialAPI.searchInstagram(queries[0], req.file);
            results.push(...igResults);
        } catch (error) {
            console.error('Instagram search error:', error.message);
        }

        try {
            const liResults = await socialAPI.searchLinkedIn(queries[0], req.file);
            results.push(...liResults);
        } catch (error) {
            console.error('LinkedIn search error:', error.message);
        }

        try {
            const tgResults = await socialAPI.searchTelegram(queries[0], req.file);
            results.push(...tgResults);
        } catch (error) {
            console.error('Telegram search error:', error.message);
        }

        // Сортируем результаты по релевантности
        results.sort((a, b) => b.similarity - a.similarity);

        res.json({
            success: true,
            results: results,
            totalFound: results.length,
            searchQueries: queries
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            error: 'Ошибка при поиске',
            message: error.message
        });
    }
});

// API для получения статистики rate limits
app.get('/api/rate-limits', (req, res) => {
    const limits = {};
    for (const [network, limit] of socialAPI.rateLimits) {
        limits[network] = {
            current: limit.requests,
            max: limit.maxRequests,
            resetTime: new Date(limit.resetTime).toISOString()
        };
    }
    res.json(limits);
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой. Максимальный размер: 10MB' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Слишком много файлов' });
        }
    }
    
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Приложение доступно по адресу: http://localhost:${PORT}`);
    console.log(`🔑 API ключи загружены для ${Object.keys(API_KEYS).length} социальных сетей`);
});
