#!/bin/bash

echo "=== 安装nginx服务器 ==="
echo "此脚本需要sudo权限"
echo ""

# 更新包索引
echo "1. 更新包索引..."
sudo apt-get update

# 安装nginx
echo "2. 安装nginx..."
sudo apt-get install -y nginx

# 检查安装状态
if command -v nginx &> /dev/null; then
    echo "✅ nginx安装成功"
    nginx -v
else
    echo "❌ nginx安装失败"
    exit 1
fi

echo ""
echo "=== nginx安装完成 ==="
echo "请运行 ./configure_nginx.sh 继续配置"