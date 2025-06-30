#!/bin/bash

echo "=== 外网访问配置检查 ==="
echo ""

echo "1. 本地网络信息："
ip addr show | grep "inet " | grep -v "127.0.0.1"
echo ""

echo "2. Nginx状态："
sudo systemctl status nginx --no-pager | head -5
echo ""

echo "3. 端口监听状态："
sudo netstat -tlnp | grep -E "nginx|node|python|java" | grep -v "127.0.0.1"
echo ""

echo "4. 已配置的nginx站点："
ls -la /etc/nginx/sites-enabled/
echo ""

echo "5. 访问地址："
echo "外网IP: 67.169.169.65"
echo "请确保路由器已配置端口转发"