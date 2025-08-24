import http.server
import socketserver

print("Запускаю сервер...")

PORT = 3000
Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Сервер запущен на порту {PORT}")
        print(f"Откройте http://localhost:{PORT}/public/index.html")
        httpd.serve_forever()
except Exception as e:
    print(f"Ошибка: {e}")
    input("Нажмите Enter для выхода...")


