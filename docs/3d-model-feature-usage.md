# 3D 模型功能使用说明

## 功能概述

3D 模型功能已成功集成到 LFWLW IoT 监控平台中。该功能使用 Three.js 库来显示 FBX 格式的 3D 模型文件。

## 如何使用

### 1. 访问 3D 模型页面
- 登录系统后，点击左侧菜单栏的 "3D模型" 菜单项
- 页面将显示当前系统中的所有 3D 模型列表

### 2. 添加您的 FBX 模型文件

要显示实际的 3D 模型，您需要：

1. **放置 FBX 文件**：
   ```
   将您的 .fbx 文件放在以下目录：
   /home/shenzheng/lfwlw/frontend/public/models/
   
   例如：
   - /home/shenzheng/lfwlw/frontend/public/models/water-pump.fbx
   - /home/shenzheng/lfwlw/frontend/public/models/valve-assembly.fbx
   - /home/shenzheng/lfwlw/frontend/public/models/storage-tank.fbx
   ```

2. **（可选）添加缩略图**：
   ```
   将预览图片放在：
   /home/shenzheng/lfwlw/frontend/public/models/thumbnails/
   
   例如：
   - /home/shenzheng/lfwlw/frontend/public/models/thumbnails/water-pump.jpg
   ```

### 3. 查看 3D 模型
- 点击模型卡片上的 "View" 按钮
- 3D 查看器将在弹窗中打开
- 使用鼠标进行交互：
  - **左键拖动**：旋转模型
  - **滚轮**：缩放
  - **右键拖动**：平移

### 4. 3D 查看器功能
- **自动旋转**：开启后模型会自动旋转
- **旋转速度**：调整自动旋转的速度
- **线框模式**：显示模型的线框结构
- **全屏模式**：全屏查看模型
- **重置视图**：恢复到初始视角

## 当前演示数据

系统中预设了三个演示模型：
1. **Water Pump Model** - 水泵模型
2. **Valve Assembly** - 阀门组件
3. **Storage Tank** - 储罐模型

要查看这些模型，您需要将对应的 FBX 文件放置在正确的目录中。

## 文件格式支持

- **FBX** (.fbx) - 推荐格式
- **OBJ** (.obj) - 即将支持
- **GLTF/GLB** (.gltf, .glb) - 即将支持

## 注意事项

1. **文件大小**：建议单个模型文件不超过 50MB
2. **模型优化**：为了更好的性能，建议：
   - 多边形数量 < 500,000
   - 纹理分辨率适中
   - 模型已正确居中

3. **命名规范**：
   - 使用小写字母和连字符
   - 例如：`water-pump.fbx`，`valve-assembly.fbx`

## 故障排除

如果模型无法加载：
1. 检查文件路径是否正确
2. 确认文件格式为 FBX
3. 查看浏览器控制台是否有错误信息
4. 确保文件没有损坏

## 后续开发计划

1. **后端集成**：实现模型文件的上传和管理 API
2. **与设备关联**：将 3D 模型与具体设备绑定
3. **实时数据展示**：在 3D 模型上显示设备的实时数据
4. **动画支持**：支持模型动画播放

---

*更新日期：2025-06-30*