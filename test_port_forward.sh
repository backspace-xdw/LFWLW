#!/bin/bash

echo "=== 端口转发测试脚本 ==="
echo ""

# 显示配置信息
echo "配置信息："
echo "- 外网IP: 67.169.169.65"
echo "- 外网端口: 8080"
echo "- 内网IP: 192.168.0.20"
echo "- 内网端口: 80"
echo ""

# 本地测试
echo "1. 本地nginx测试："
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://192.168.0.20

echo ""

# 检查防火墙
echo "2. 防火墙状态："
sudo ufw status | grep 80 || echo "防火墙未配置或未启用"

echo ""

echo "3. 端口监听状态："
sudo netstat -tlnp | grep :80 | head -5

echo ""

echo "=== 配置步骤 ==="
echo ""
echo "请按照以下步骤配置路由器："
echo ""
echo "1. 访问路由器管理界面（通常是 http://192.168.0.1）"
echo "2. 找到'端口转发'或'虚拟服务器'设置"
echo "3. 添加规则："
echo "   - 外部端口: 8080"
echo "   - 内部IP: 192.168.0.20"  
echo "   - 内部端口: 80"
echo "   - 协议: TCP"
echo "4. 保存并应用设置"
echo ""
echo "配置完成后，访问："
echo "http://67.169.169.65:8080"