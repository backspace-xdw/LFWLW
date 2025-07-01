const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;

// 代理 API 请求到后端
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:50001',
  changeOrigin: true,
}));

// 代理 WebSocket
app.use('/ws', createProxyMiddleware({
  target: 'ws://localhost:50001',
  ws: true,
  changeOrigin: true,
}));

// 代理 Socket.IO
app.use('/socket.io', createProxyMiddleware({
  target: 'http://localhost:50001',
  ws: true,
  changeOrigin: true,
}));

// 服务静态文件 - 开发模式
app.use(createProxyMiddleware({
  target: 'http://localhost:50000',
  changeOrigin: true,
}));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`代理服务器运行在 http://0.0.0.0:${PORT}`);
  console.log(`可通过以下地址访问：`);
  console.log(`- 本地: http://localhost:${PORT}`);
  console.log(`- 局域网: http://192.168.0.20:${PORT}`);
  console.log(`- 外网: http://ljinvestment.diskstation.me:${PORT}`);
});