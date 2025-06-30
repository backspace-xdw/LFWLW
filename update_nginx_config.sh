#!/bin/bash

echo "=== 更新nginx配置 ==="
echo ""

# 复制更新后的配置
echo "1. 更新配置文件..."
sudo cp lfwlw-nginx.conf /etc/nginx/sites-available/lfwlw

# 测试配置
echo "2. 测试配置..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ 配置测试通过"
    
    # 重载nginx
    echo "3. 重载nginx配置..."
    sudo systemctl reload nginx
    
    echo ""
    echo "✅ 配置更新完成！"
    echo ""
    echo "修改说明："
    echo "- 将Host头改为localhost:50000，绕过Vite的域名检查"
    echo "- 保留原始域名信息在X-Forwarded-Host头中"
    echo ""
    echo "现在远程同事应该可以访问了："
    echo "http://ljinvestment.diskstation.me"
else
    echo "❌ 配置测试失败"
    exit 1
fi