import http.server
import socketserver
import os

# Меняем рабочую директорию
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 3000

# Простой HTTP сервер
Handler = http.server.SimpleHTTPRequestHandler

# Создаем сервер
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"🚀 Сервер запущен на порту {PORT}")
    print(f"🌐 Откройте http://localhost:{PORT}/public/index.html в браузере")
    print("⏹️  Нажмите Ctrl+C для остановки сервера")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Сервер остановлен")


