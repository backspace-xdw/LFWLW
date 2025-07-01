#!/bin/bash

echo "========================================="
echo "LFWLW 平台访问测试"
echo "========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}1. 测试本地访问${NC}"
echo -n "本地前端 (http://localhost:50000): "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:50000 | grep -q "200"; then
    echo -e "${GREEN}✓ 正常${NC}"
else
    echo -e "${RED}✗ 无法访问${NC}"
fi

echo -n "本地后端 (http://localhost:50001/api/health): "
if curl -s http://localhost:50001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 正常${NC}"
else
    echo -e "${RED}✗ 无法访问${NC}"
fi

echo -e "\n${YELLOW}2. 测试局域网访问${NC}"
echo -n "局域网前端 (http://192.168.0.20:50000): "
if curl -s -o /dev/null -w "%{http_code}" http://192.168.0.20:50000 | grep -q "200"; then
    echo -e "${GREEN}✓ 正常${NC}"
else
    echo -e "${RED}✗ 无法访问${NC}"
fi

echo -e "\n${YELLOW}3. 测试外网访问${NC}"
echo -n "外网前端 (http://ljinvestment.diskstation.me:50000): "
status=$(curl -s -o /dev/null -w "%{http_code}" http://ljinvestment.diskstation.me:50000)
if [ "$status" = "200" ]; then
    echo -e "${GREEN}✓ 正常 (HTTP $status)${NC}"
else
    echo -e "${RED}✗ 无法访问 (HTTP $status)${NC}"
fi

echo -e "\n${YELLOW}4. 服务进程状态${NC}"
frontend_pid=$(ps aux | grep -E "vite.*50000" | grep -v grep | awk '{print $2}' | head -1)
backend_pid=$(ps aux | grep -E "ts-node.*50001" | grep -v grep | awk '{print $2}' | head -1)

if [ -n "$frontend_pid" ]; then
    echo -e "前端进程: ${GREEN}✓ 运行中 (PID: $frontend_pid)${NC}"
else
    echo -e "前端进程: ${RED}✗ 未运行${NC}"
fi

if [ -n "$backend_pid" ]; then
    echo -e "后端进程: ${GREEN}✓ 运行中 (PID: $backend_pid)${NC}"
else
    echo -e "后端进程: ${RED}✗ 未运行${NC}"
fi

echo -e "\n${YELLOW}5. 端口监听状态${NC}"
netstat -tulpn 2>/dev/null | grep -E "(50000|50001)" | while read line; do
    echo "$line"
done

echo -e "\n========================================="
echo -e "${GREEN}访问地址：${NC}"
echo -e "局域网: http://192.168.0.20:50000"
echo -e "外网: http://ljinvestment.diskstation.me:50000"
echo -e "\n登录账号: admin / admin123"
echo "========================================="