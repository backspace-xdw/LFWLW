#!/bin/bash

echo "=== 访问诊断 ==="
echo ""

# 获取本机IP
echo "1. 本机IP地址："
ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}'

echo ""

# 检查域名解析
echo "2. 域名解析结果："
nslookup ljinvestment.diskstation.me | grep "Address:" | tail -n +2

echo ""

# 本地nginx测试
echo "3. 本地nginx代理测试："
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:80

echo ""

echo "=== 解决方案 ==="
echo ""
echo "问题：域名 ljinvestment.diskstation.me 解析到了外部IP (67.169.169.65)"
echo ""
echo "选择以下方案之一："
echo ""
echo "方案A - 使用IP地址访问："
echo "让同事直接访问 http://YOUR_SERVER_IP"
echo ""
echo "方案B - 修改hosts文件："
echo "让同事在他们的电脑上添加："
echo "YOUR_SERVER_IP ljinvestment.diskstation.me"
echo ""
echo "方案C - 使用其他域名："
echo "配置一个指向您服务器的域名"
echo ""
echo "方案D - 内网穿透工具："
echo "使用 ngrok、frp 等工具暴露本地服务"