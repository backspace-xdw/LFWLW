#!/bin/bash

echo "=== 配置nginx反向代理 ==="
echo "此脚本需要sudo权限"
echo ""

# 检查nginx是否已安装
if ! command -v nginx &> /dev/null; then
    echo "❌ nginx未安装，请先运行 ./install_nginx.sh"
    exit 1
fi

# 备份默认配置
echo "1. 备份默认配置..."
sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%Y%m%d%H%M%S)

# 复制配置文件
echo "2. 安装LFWLW配置..."
sudo cp lfwlw-nginx.conf /etc/nginx/sites-available/lfwlw

# 创建符号链接
echo "3. 启用站点配置..."
sudo ln -sf /etc/nginx/sites-available/lfwlw /etc/nginx/sites-enabled/

# 禁用默认站点（避免端口冲突）
echo "4. 禁用默认站点..."
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
echo "5. 测试nginx配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ nginx配置测试通过"
    
    # 重新加载nginx
    echo "6. 重新加载nginx..."
    sudo systemctl reload nginx || sudo service nginx reload
    
    echo ""
    echo "=== 配置完成 ==="
    echo "远程访问地址：http://ljinvestment.diskstation.me"
    echo ""
    echo "注意事项："
    echo "1. 确保防火墙已开放80端口"
    echo "2. 确保域名 ljinvestment.diskstation.me 已正确解析到服务器IP"
    echo "3. 前端和后端服务必须保持运行状态"
else
    echo "❌ nginx配置测试失败，请检查配置文件"
    exit 1
fi