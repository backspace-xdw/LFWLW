#!/bin/bash

echo "=== 远程桌面连接诊断 ==="
echo ""

echo "1. 本机网络信息："
echo "   IP地址: 192.168.0.20"
echo "   外网地址: 67.169.169.65"
echo ""

echo "2. 远程桌面服务状态："
if pgrep -x "gnome-remote-d" > /dev/null; then
    echo "   ✅ gnome-remote-desktop 正在运行"
    echo "   PID: $(pgrep -x "gnome-remote-d")"
else
    echo "   ❌ gnome-remote-desktop 未运行"
fi
echo ""

echo "3. 端口监听状态："
netstat -tlnp 2>/dev/null | grep 3389 || echo "   ❌ 3389端口未监听"
echo ""

echo "4. 防火墙状态："
sudo ufw status | head -1
echo ""

echo "=== 可能的解决方案 ==="
echo ""
echo "1. 检查路由器端口转发："
echo "   - 确保有 3389→192.168.0.20:3389 的转发规则"
echo "   - 或使用其他端口如 13389→192.168.0.20:3389"
echo ""
echo "2. 重启远程桌面服务："
echo "   sudo systemctl restart gnome-remote-desktop"
echo ""
echo "3. 测试连接："
echo "   - 局域网: 192.168.0.20:3389"
echo "   - 外网: 67.169.169.65:3389 (或配置的端口)"
echo ""
echo "4. 如果还是不行，可能是："
echo "   - 路由器上3389端口被其他服务占用"
echo "   - ISP阻止了3389端口"
echo "   - 需要在Ubuntu设置中重新启用远程桌面"