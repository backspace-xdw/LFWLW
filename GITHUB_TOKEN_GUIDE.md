# 📖 GitHub Personal Access Token 详细指南

## 🔍 找到Token设置的步骤：

### 方法1：直接访问链接
直接点击这个链接：
👉 **https://github.com/settings/tokens/new**

### 方法2：通过GitHub界面导航

1. **登录GitHub后，点击右上角的头像**
   ![Profile](https://github.com/favicon.ico) → 点击头像

2. **在下拉菜单中选择 "Settings"（设置）**

3. **在左侧边栏中，滚动到最下面**
   - 找到 "Developer settings"（开发者设置）
   - 点击进入

4. **在开发者设置中**
   - 点击 "Personal access tokens"（个人访问令牌）
   - 选择 "Tokens (classic)"（经典令牌）
   - 或者选择 "Fine-grained tokens"（细粒度令牌）

5. **点击 "Generate new token"（生成新令牌）**
   - 选择 "Generate new token (classic)"（推荐）

## 🔐 创建Token的设置：

1. **Note（备注）**: 输入 "WebScadaPM Push" 或任意名称

2. **Expiration（过期时间）**: 选择 "30 days" 或 "No expiration"

3. **Select scopes（选择权限）**:
   ✅ 勾选 **repo** （这会自动勾选所有子权限）
   
   需要的权限：
   - ✅ repo (Full control of private repositories)
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite

4. **点击底部的 "Generate token"（生成令牌）**

5. **⚠️ 重要：立即复制生成的token！**
   - Token只显示一次
   - 格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🚀 使用Token推送代码：

```bash
cd /home/shenzheng/lfwlw
git push https://您的GitHub用户名:ghp_您的token@github.com/backspace-xdw/WebScadaPM.git main
```

### 示例：
如果您的GitHub用户名是 `backspace-xdw`，token是 `ghp_abc123...`，则命令为：
```bash
git push https://backspace-xdw:ghp_abc123...@github.com/backspace-xdw/WebScadaPM.git main
```

## 🌐 中文界面指南：

如果您的GitHub是中文界面：
1. 点击右上角头像
2. 选择 "设置"
3. 滚动到底部，点击 "开发者设置"
4. 点击 "个人访问令牌"
5. 点击 "令牌（经典）"
6. 点击 "生成新令牌"

## ❓ 常见问题：

**Q: 找不到 Developer settings？**
A: 确保您已登录GitHub，并且在个人设置页面（不是仓库设置）

**Q: Token权限选什么？**
A: 只需要勾选 "repo" 即可，它会包含推送所需的所有权限

**Q: Token安全吗？**
A: 是的，但请不要分享给他人。使用后可以随时在GitHub上删除

## 📱 移动端操作：
如果在手机上，建议切换到"桌面版网站"以获得完整功能

---

💡 **快速链接汇总：**
- 直接创建Token: https://github.com/settings/tokens/new
- 个人设置: https://github.com/settings/profile
- 开发者设置: https://github.com/settings/apps
- Token管理: https://github.com/settings/tokens