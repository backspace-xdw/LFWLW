#!/bin/bash

echo "=== 使用ngrok快速实现外网访问 ==="
echo ""

# 检查ngrok是否已安装
if ! command -v ngrok &> /dev/null; then
    echo "ngrok未安装，请访问 https://ngrok.com/download 下载"
    echo ""
    echo "快速安装步骤："
    echo "1. wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz"
    echo "2. tar -xzf ngrok-v3-stable-linux-amd64.tgz"
    echo "3. sudo mv ngrok /usr/local/bin/"
    echo "4. ngrok config add-authtoken YOUR_AUTH_TOKEN"
    exit 1
fi

echo "启动ngrok隧道..."
echo "运行命令: ngrok http 80"
echo ""
echo "这将提供一个类似 https://xxx.ngrok.io 的公网地址"
echo "您的同事可以通过这个地址访问系统"