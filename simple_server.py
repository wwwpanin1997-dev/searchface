#!/usr/bin/env python3
"""
Простой HTTP сервер для приложения поиска людей по фото
"""

import http.server
import socketserver
import os
import json
import base64
import mimetypes
from urllib.parse import urlparse, parse_qs
import cgi
import tempfile
import shutil

PORT = 3000

class PhotoSearchHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Обрабатываем корневой путь
        if self.path == '/':
            self.path = '/public/index.html'
        
        # Обрабатываем статические файлы
        if self.path.startswith('/public/'):
            file_path = self.path[1:]  # Убираем начальный слеш
            if os.path.exists(file_path):
                self.send_file(file_path)
            else:
                self.send_error(404, "File not found")
        else:
            self.send_error(404, "Not found")

    def do_POST(self):
        if self.path == '/upload':
            self.handle_upload()
        else:
            self.send_error(404, "Not found")

    def handle_upload(self):
        try:
            # Создаем временную папку для загрузок
            if not os.path.exists('uploads'):
                os.makedirs('uploads')

            # Парсим multipart данные
            form = cgi.FieldStorage(
                fp=self.rfile,
                headers=self.headers,
                environ={'REQUEST_METHOD': 'POST'}
            )

            if 'photo' in form:
                fileitem = form['photo']
                if fileitem.filename:
                    # Сохраняем файл
                    filename = f"photo_{len(os.listdir('uploads')) + 1}.jpg"
                    filepath = os.path.join('uploads', filename)
                    
                    with open(filepath, 'wb') as f:
                        shutil.copyfileobj(fileitem.file, f)

                    # Симулируем результаты поиска
                    results = self.simulate_search()
                    
                    # Отправляем ответ
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    response = {
                        'success': True,
                        'originalImage': filename,
                        'processedImage': f"processed-{filename}",
                        'results': results
                    }
                    
                    self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_error(400, "No file uploaded")
            else:
                self.send_error(400, "No photo field found")

        except Exception as e:
            print(f"Error handling upload: {e}")
            self.send_error(500, f"Internal server error: {str(e)}")

    def simulate_search(self):
        """Симулирует поиск людей по фото"""
        return [
            {
                "id": 1,
                "name": "Анна Петрова",
                "socialNetwork": "VKontakte",
                "profileUrl": "https://vk.com/anna_petrova",
                "similarity": 0.89,
                "avatar": "https://via.placeholder.com/50x50/4CAF50/FFFFFF?text=A"
            },
            {
                "id": 2,
                "name": "Михаил Сидоров",
                "socialNetwork": "Instagram",
                "profileUrl": "https://instagram.com/mikhail_sidorov",
                "similarity": 0.76,
                "avatar": "https://via.placeholder.com/50x50/2196F3/FFFFFF?text=M"
            },
            {
                "id": 3,
                "name": "Елена Козлова",
                "socialNetwork": "Facebook",
                "profileUrl": "https://facebook.com/elena.kozlov",
                "similarity": 0.72,
                "avatar": "https://via.placeholder.com/50x50/FF9800/FFFFFF?text=E"
            }
        ]

    def send_file(self, file_path):
        """Отправляет файл клиенту"""
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Определяем MIME тип
            mime_type, _ = mimetypes.guess_type(file_path)
            if mime_type is None:
                mime_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-type', mime_type)
            self.send_header('Content-length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            print(f"Error sending file {file_path}: {e}")
            self.send_error(500, f"Error reading file: {str(e)}")

    def end_headers(self):
        """Добавляем CORS заголовки"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        """Обрабатываем preflight CORS запросы"""
        self.send_response(200)
        self.end_headers()

def main():
    # Меняем рабочую директорию на папку проекта
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    with socketserver.TCPServer(("", PORT), PhotoSearchHandler) as httpd:
        print(f"🚀 Сервер запущен на порту {PORT}")
        print(f"🌐 Откройте http://localhost:{PORT} в браузере")
        print("⏹️  Нажмите Ctrl+C для остановки сервера")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Сервер остановлен")

if __name__ == "__main__":
    main()


