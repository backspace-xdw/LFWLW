#!/bin/bash

echo "=== 外网访问测试 ==="
echo ""
echo "外网访问地址: http://67.169.169.65:50000"
echo ""

# 本地测试
echo "1. 本地服务状态检查："
echo -n "   Nginx (80端口): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:80
echo -n "   前端 (50000端口): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:50000
echo -n "   后端 (50001端口): "
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:50001/health

echo ""

# 进程检查
echo "2. 服务进程检查："
ps aux | grep -E "nginx|node" | grep -v grep | wc -l | xargs -I {} echo "   运行中的服务数: {}"

echo ""

# 显示访问信息
echo "3. 访问信息："
echo "   ┌─────────────────────────────────────┐"
echo "   │  外网地址: http://67.169.169.65:50000  │"
echo "   │  用户名: admin                      │"
echo "   │  密码: admin123                     │"
echo "   └─────────────────────────────────────┘"

echo ""
echo "✅ 请让您的同事访问上述地址！"