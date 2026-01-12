#!/bin/bash
# 数字工厂远程部署脚本
# 目标服务器: shenzheng@27.115.85.150:5222

set -e

REMOTE_USER="shenzheng"
REMOTE_HOST="27.115.85.150"
REMOTE_PORT="5222"
REMOTE_PASS="Sjd04052！"

echo "🚀 开始部署数字工厂到远程服务器..."
echo "📍 目标: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"
echo ""

# 使用expect上传文件
expect <<EOF
set timeout 300
spawn scp -P $REMOTE_PORT /home/shenzheng/lfwlw/lfwlw-deploy.tar.gz $REMOTE_USER@$REMOTE_HOST:~/
expect "password:"
send "$REMOTE_PASS\r"
expect eof
EOF

echo "✅ 文件上传完成"
echo ""
echo "📦 开始远程部署..."

# 远程部署命令
expect <<'DEPLOY'
set timeout 300
spawn ssh -p 5222 shenzheng@27.115.85.150
expect "password:"
send "Sjd04052！\r"
expect "$ "
send "mkdir -p ~/lfwlw && cd ~/lfwlw && tar -xzf ~/lfwlw-deploy.tar.gz\r"
expect "$ "
send "cd ~/lfwlw/backend && npm install\r"
expect "$ "
send "cd ~/lfwlw/frontend && npm install\r"
expect "$ "
send "pm2 delete lfwlw-backend lfwlw-frontend 2>/dev/null || true\r"
expect "$ "
send "cd ~/lfwlw/backend && pm2 start npm --name lfwlw-backend -- run dev\r"
expect "$ "
send "cd ~/lfwlw/frontend && pm2 start npm --name lfwlw-frontend -- run preview\r"
expect "$ "
send "pm2 save && pm2 list\r"
expect "$ "
send "exit\r"
expect eof
DEPLOY

echo ""
echo "✅ 部署完成！访问: http://27.115.85.150:50003/digital-factory"
