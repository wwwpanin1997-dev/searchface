// Основной класс приложения
class PhotoSearchApp {
    constructor() {
        this.currentFile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Обработчик выбора файла
        const photoInput = document.getElementById('photoInput');
        photoInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Обработчик кнопки поиска
        const searchBtn = document.getElementById('searchBtn');
        searchBtn.addEventListener('click', () => this.startSearch());

        // Обработчики модального окна
        const modal = document.getElementById('modal');
        const closeModal = document.getElementById('closeModal');
        
        closeModal.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    setupDragAndDrop() {
        const uploadArea = document.getElementById('uploadArea');
        
        // Предотвращаем стандартное поведение браузера
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Обработчики drag & drop
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlight(uploadArea), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlight(uploadArea), false);
        });

        // Обработчик drop
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(element) {
        element.classList.add('dragover');
    }

    unhighlight(element) {
        element.classList.remove('dragover');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            this.showError('Пожалуйста, выберите изображение');
            return;
        }

        // Проверяем размер файла (10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showError('Файл слишком большой. Максимальный размер: 10MB');
            return;
        }

        this.currentFile = file;
        this.displayFileInfo(file);
    }

    displayFileInfo(file) {
        const fileInfo = document.getElementById('fileInfo');
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');
        const imagePreview = document.getElementById('imagePreview');

        // Показываем информацию о файле
        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        // Создаем предварительный просмотр
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Показываем секцию с информацией о файле
        fileInfo.style.display = 'flex';
        
        // Скрываем область загрузки
        document.getElementById('uploadArea').style.display = 'none';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async startSearch() {
        if (!this.currentFile) {
            this.showError('Сначала выберите файл');
            return;
        }

        // Показываем секцию результатов
        const resultsSection = document.getElementById('resultsSection');
        resultsSection.style.display = 'block';

        // Показываем индикатор загрузки
        const searchStatus = document.getElementById('searchStatus');
        const resultsGrid = document.getElementById('resultsGrid');
        searchStatus.style.display = 'block';
        resultsGrid.style.display = 'none';

        try {
            // Создаем FormData для отправки файла
            const formData = new FormData();
            formData.append('photo', this.currentFile);

            // Отправляем запрос на сервер
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Скрываем индикатор загрузки
                searchStatus.style.display = 'none';
                
                // Показываем результаты
                this.displayResults(data.results);
            } else {
                throw new Error(data.error || 'Ошибка при загрузке');
            }

        } catch (error) {
            console.error('Ошибка:', error);
            this.showError('Произошла ошибка при поиске: ' + error.message);
            
            // Скрываем индикатор загрузки
            searchStatus.style.display = 'none';
        }
    }

    displayResults(results) {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        if (results.length === 0) {
            resultsGrid.innerHTML = `
                <div class="no-results">
                    <p>По вашему запросу ничего не найдено</p>
                </div>
            `;
        } else {
            results.forEach(result => {
                const resultCard = this.createResultCard(result);
                resultsGrid.appendChild(resultCard);
            });
        }

        resultsGrid.style.display = 'grid';
    }

    createResultCard(result) {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <div class="result-header">
                <img src="${result.avatar}" alt="Аватар" class="result-avatar">
                <div class="result-info">
                    <h4>${result.name}</h4>
                    <p class="result-network">${result.socialNetwork}</p>
                    <span class="result-similarity">${Math.round(result.similarity * 100)}% совпадение</span>
                </div>
            </div>
            <div class="result-actions">
                <button class="action-btn view-btn" onclick="app.viewProfile(${result.id})">
                    <i class="fas fa-eye"></i> Просмотр
                </button>
                <button class="action-btn profile-btn" onclick="app.openProfile('${result.profileUrl}')">
                    <i class="fas fa-external-link-alt"></i> Профиль
                </button>
            </div>
        `;
        return card;
    }

    viewProfile(resultId) {
        // Здесь можно добавить логику для детального просмотра профиля
        console.log('Просмотр профиля:', resultId);
    }

    openProfile(url) {
        window.open(url, '_blank');
    }

    showError(message) {
        // Простое отображение ошибки
        alert(message);
    }

    closeModal() {
        document.getElementById('modal').style.display = 'none';
    }

    // Метод для открытия модального окна с деталями профиля
    openProfileModal(profile) {
        const modal = document.getElementById('modal');
        const modalAvatar = document.getElementById('modalAvatar');
        const modalName = document.getElementById('modalName');
        const modalNetwork = document.getElementById('modalNetwork');
        const modalSimilarity = document.getElementById('modalSimilarity');
        const modalProfileLink = document.getElementById('modalProfileLink');

        modalAvatar.src = profile.avatar;
        modalName.textContent = profile.name;
        modalNetwork.textContent = profile.socialNetwork;
        modalSimilarity.textContent = `Совпадение: ${Math.round(profile.similarity * 100)}%`;
        modalProfileLink.href = profile.profileUrl;

        modal.style.display = 'flex';
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PhotoSearchApp();
});

// Дополнительные утилиты
const utils = {
    // Форматирование процентов
    formatPercentage: (value) => {
        return Math.round(value * 100) + '%';
    },

    // Проверка поддержки WebP
    supportsWebP: () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    },

    // Создание placeholder изображения
    createPlaceholder: (text, size = 100) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Фон
        ctx.fillStyle = '#667eea';
        ctx.fillRect(0, 0, size, size);
        
        // Текст
        ctx.fillStyle = 'white';
        ctx.font = `${size/3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size/2, size/2);
        
        return canvas.toDataURL();
    }
};


