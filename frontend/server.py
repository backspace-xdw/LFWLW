#!/usr/bin/env python3
import http.server
import socketserver
import os
import urllib.parse
import json

PORT = 50000
BACKEND_URL = "http://localhost:50001"

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        # 如果是 API 请求，重定向到 index.html（用于 React Router）
        if not self.path.startswith('/api') and not '.' in os.path.basename(self.path):
            self.path = '/index.html'
        super().do_GET()

os.chdir('.')
Handler = ProxyHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Server running at http://0.0.0.0:{PORT}/")
    httpd.serve_forever()