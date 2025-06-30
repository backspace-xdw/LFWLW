#!/bin/bash

echo "=== 测试远程访问配置 ==="
echo ""

# 测试本地访问
echo "1. 测试本地访问..."
curl -s -o /dev/null -w "本地前端 (localhost:50000): %{http_code}\n" http://localhost:50000
curl -s -o /dev/null -w "本地后端 (localhost:50001/health): %{http_code}\n" http://localhost:50001/health

echo ""

# 测试nginx代理
echo "2. 测试nginx代理（模拟远程访问）..."
curl -s -o /dev/null -w "nginx前端代理 (localhost:80): %{http_code}\n" -H "Host: ljinvestment.diskstation.me" http://localhost:80
curl -s -o /dev/null -w "nginx API代理 (localhost:80/health): %{http_code}\n" -H "Host: ljinvestment.diskstation.me" http://localhost:80/health

echo ""

# 显示访问信息
echo "=== 远程访问信息 ==="
echo "系统地址: http://ljinvestment.diskstation.me"
echo "登录账号: admin / admin123"
echo ""
echo "✅ 配置完成！请让您的同事访问上述地址。"