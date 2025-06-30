#!/bin/bash
# 快速修复 502 错误脚本

echo "=== LFWLW 502 错误快速修复脚本 ==="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查函数
check_service() {
    if systemctl is-active --quiet $1; then
        echo -e "${GREEN}✓${NC} $1 正在运行"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未运行"
        return 1
    fi
}

# 1. 检查后端服务
echo "1. 检查后端服务状态..."
if command -v pm2 &> /dev/null; then
    pm2_status=$(pm2 list | grep -c "lfwlw-backend")
    if [ $pm2_status -gt 0 ]; then
        echo -e "${GREEN}✓${NC} PM2 后端服务已配置"
        pm2 status
    else
        echo -e "${YELLOW}!${NC} PM2 后端服务未找到，尝试启动..."
        cd /home/shenzheng/lfwlw/backend
        npm install
        pm2 start src/index.js --name lfwlw-backend
    fi
else
    echo -e "${YELLOW}!${NC} PM2 未安装，使用 node 直接启动..."
    cd /home/shenzheng/lfwlw/backend
    nohup node src/index.js > backend.log 2>&1 &
    echo "后端已在后台启动，PID: $!"
fi

# 2. 检查端口
echo ""
echo "2. 检查端口占用..."
if netstat -tlnp 2>/dev/null | grep -q ":8080"; then
    echo -e "${GREEN}✓${NC} 端口 8080 (后端) 已监听"
else
    echo -e "${RED}✗${NC} 端口 8080 未监听"
fi

if netstat -tlnp 2>/dev/null | grep -q ":50000"; then
    echo -e "${GREEN}✓${NC} 端口 50000 (前端) 已监听"
else
    echo -e "${RED}✗${NC} 端口 50000 未监听"
fi

# 3. 检查 Nginx
echo ""
echo "3. 检查 Nginx 状态..."
if command -v nginx &> /dev/null; then
    check_service nginx
    
    # 测试配置
    if sudo nginx -t &> /dev/null; then
        echo -e "${GREEN}✓${NC} Nginx 配置正确"
    else
        echo -e "${RED}✗${NC} Nginx 配置错误，请检查配置文件"
        sudo nginx -t
    fi
else
    echo -e "${RED}✗${NC} Nginx 未安装"
fi

# 4. 测试连接
echo ""
echo "4. 测试服务连接..."

# 测试后端
if curl -s -f http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 后端 API 响应正常"
else
    echo -e "${RED}✗${NC} 后端 API 无响应"
fi

# 测试前端
if curl -s -f http://localhost:50000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 前端服务响应正常"
else
    echo -e "${RED}✗${NC} 前端服务无响应"
fi

# 5. 快速修复建议
echo ""
echo "=== 快速修复建议 ==="

# 如果后端未运行
if ! curl -s -f http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo -e "${YELLOW}执行以下命令启动后端：${NC}"
    echo "cd /home/shenzheng/lfwlw/backend"
    echo "npm install"
    echo "node src/index.js"
    echo ""
fi

# 如果前端未运行
if ! curl -s -f http://localhost:50000 > /dev/null 2>&1; then
    echo -e "${YELLOW}执行以下命令配置前端：${NC}"
    echo "cd /home/shenzheng/lfwlw/frontend"
    echo "npm install"
    echo "npm run build"
    echo "sudo cp -r dist/* /var/www/html/lfwlw/"
    echo ""
fi

# 6. 临时解决方案
echo ""
echo "=== 临时解决方案 (使用内置服务器) ==="
echo "如果需要快速测试，可以使用开发服务器："
echo ""
echo "# 终端1 - 启动后端"
echo "cd /home/shenzheng/lfwlw/backend && npm run dev"
echo ""
echo "# 终端2 - 启动前端"
echo "cd /home/shenzheng/lfwlw/frontend && npm run dev"
echo ""
echo "然后通过 SSH 隧道访问："
echo "ssh -L 3000:localhost:3000 -L 8080:localhost:8080 user@ljinvestment.diskstation.me"
echo ""

# 7. 查看日志
echo "=== 查看日志命令 ==="
echo "# PM2 日志"
echo "pm2 logs lfwlw-backend --lines 50"
echo ""
echo "# Nginx 错误日志"
echo "sudo tail -f /var/log/nginx/error.log"
echo ""
echo "# 系统日志"
echo "sudo journalctl -xe"

echo ""
echo "脚本执行完成！"