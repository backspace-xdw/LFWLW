#!/bin/bash

echo "🚀 自动推送到GitHub..."
echo "====================================="

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查git状态
echo -e "${YELLOW}检查Git状态...${NC}"
git status --porcelain

# 显示远程仓库
echo -e "\n${YELLOW}当前远程仓库:${NC}"
git remote -v

# 尝试使用git credential helper
echo -e "\n${YELLOW}配置Git凭据助手...${NC}"
git config --global credential.helper cache
git config --global credential.helper 'cache --timeout=3600'

# 创建一个Python脚本来处理推送
cat > /tmp/git_push.py << 'EOF'
import subprocess
import sys
import os

def push_to_github():
    print("🔧 准备推送到GitHub...")
    
    # 设置环境变量以避免交互式提示
    env = os.environ.copy()
    env['GIT_TERMINAL_PROMPT'] = '0'
    
    # 尝试推送
    try:
        # 先尝试普通推送
        result = subprocess.run(
            ['git', 'push', '-u', 'origin', 'main'],
            capture_output=True,
            text=True,
            env=env
        )
        
        if result.returncode != 0:
            print(f"❌ 推送失败: {result.stderr}")
            print("\n📝 请使用以下方法之一手动推送：")
            print("\n方法1 - 使用Personal Access Token:")
            print("1. 访问 https://github.com/settings/tokens")
            print("2. 生成新的Personal Access Token")
            print("3. 运行: git push https://YOUR_USERNAME:YOUR_TOKEN@github.com/backspace-xdw/WebScadaPM.git main")
            
            print("\n方法2 - 使用GitHub Desktop:")
            print("1. 下载GitHub Desktop")
            print("2. 添加本地仓库: /home/shenzheng/lfwlw")
            print("3. 登录后点击Push")
            
            print("\n方法3 - 使用SSH (推荐):")
            print("1. 生成SSH密钥: ssh-keygen -t ed25519 -C 'your_email@example.com'")
            print("2. 添加到GitHub: https://github.com/settings/keys")
            print("3. 切换到SSH: git remote set-url origin git@github.com:backspace-xdw/WebScadaPM.git")
            print("4. 推送: git push -u origin main")
        else:
            print("✅ 推送成功！")
            print(result.stdout)
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    push_to_github()
EOF

# 运行Python脚本
python3 /tmp/git_push.py

# 清理
rm -f /tmp/git_push.py

echo -e "\n${GREEN}脚本执行完成！${NC}"