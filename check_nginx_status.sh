#!/bin/bash

echo "=== 检查nginx状态 ==="
echo ""

# 检查nginx是否安装
if command -v nginx &> /dev/null; then
    echo "✅ nginx已安装"
    nginx -v
else
    echo "❌ nginx未安装"
    echo "请运行: ./install_nginx.sh"
    exit 1
fi

echo ""

# 检查nginx服务状态
echo "nginx服务状态："
sudo systemctl status nginx --no-pager || sudo service nginx status

echo ""

# 检查80端口
echo "80端口监听状态："
sudo netstat -tlnp | grep :80 || sudo ss -tlnp | grep :80

echo ""

# 检查配置文件
if [ -f /etc/nginx/sites-enabled/lfwlw ]; then
    echo "✅ LFWLW配置已启用"
else
    echo "❌ LFWLW配置未启用"
    echo "请运行: ./configure_nginx.sh"
fi

echo ""
echo "=== 检查完成 ==="