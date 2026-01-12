# 免费多边形窗口/边框资源整理

## 🎨 CodePen 免费示例 (可直接使用)

### 1. CSS Trapezoid Design (梯形设计)
- **链接**: https://codepen.io/yochans/pen/WNpYXxg
- **技术**: CSS `clip-path: polygon()`
- **特点**: 响应式梯形设计
- **用法**: 直接复制CSS代码

### 2. SVG Border Animated Glow (SVG发光边框)
- **链接**: https://codepen.io/amchan/pen/KNYpzp
- **技术**: SVG polygon + 动画
- **特点**: 发光动画效果
- **用法**: SVG边框,可嵌入任何容器

### 3. Glowing Augmented-UI Borders (增强UI发光边框)
- **链接**: https://codepen.io/maxkahnt/pen/bGeMMEb
- **技术**: augmented-ui 库 + CSS
- **特点**: 多边形形状 + 发光效果
- **库地址**: https://augmented-ui.com/

### 4. Animated Glowing Gradient Border (渐变发光边框)
- **链接**: https://codepen.io/StarKnightt/pen/qBvXKwx
- **技术**: CSS gradient + animation
- **特点**: 渐变色发光动画

### 5. CSS Glow Border Animation (纯CSS发光边框)
- **链接**: https://codepen.io/liyrofx/pen/poVZeEG
- **技术**: 纯CSS
- **特点**: 响应式,任意宽高

### 6. Scifi Stuff (科幻UI组件)
- **链接**: https://codepen.io/marioluevanos/pen/XKqNZB
- **技术**: CSS + SVG
- **特点**: 完整的科幻风格UI组件库

---

## 📚 中文教程资源

### 1. 大屏展示边框 - 9个实用边框(性能提升120%)
- **链接**: https://zhuanlan.zhihu.com/p/443020884
- **内容**: 纯CSS撸9个实用边框
- **特点**:
  - 无需DataV组件库
  - 性能优化
  - 包含角标边框、发光边框等

### 2. 使用CSS制作数字可视化大屏边框
- **链接**: https://blog.csdn.net/m0_57210162/article/details/121956999
- **内容**: 大屏边框制作教程
- **技术**: `::before` 和 `::after` 伪元素

### 3. 自制展示大屏边框
- **链接**: https://blog.csdn.net/weixin_43952253/article/details/109989968
- **内容**: 四角边框实现
- **方法**: 先画完整边框,再用伪元素遮盖

---

## 🛠️ 技术实现方法总结

### 方法1: CSS clip-path (推荐)
```css
.trapezoid {
  clip-path: polygon(
    10% 0%,    /* 左上 */
    90% 0%,    /* 右上 */
    100% 100%, /* 右下 */
    0% 100%    /* 左下 */
  );
  border: 2px solid rgba(0, 180, 255, 0.7);
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.5);
}
```

### 方法2: SVG Polygon
```html
<svg viewBox="0 0 1000 600">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <polygon
    points="100,0 900,0 1000,600 0,600"
    fill="none"
    stroke="url(#borderGradient)"
    stroke-width="3"
    filter="url(#glow)"
  />
</svg>
```

### 方法3: Border + Transform
```css
.trapezoid {
  width: 100px;
  border-bottom: 100px solid blue;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  height: 0;
}
```

### 方法4: 使用 augmented-ui 库
```html
<!-- 引入库 -->
<link rel="stylesheet" href="https://unpkg.com/augmented-ui/augmented-ui.min.css">

<!-- 使用 -->
<div data-augmented-ui="tl-clip tr-clip br-clip bl-clip border">
  Content
</div>
```

---

## 🎯 发光效果实现

### CSS Box-Shadow 发光
```css
.glow {
  box-shadow:
    0 0 10px rgba(0, 180, 255, 0.5),
    0 0 20px rgba(0, 180, 255, 0.4),
    0 0 30px rgba(0, 180, 255, 0.3),
    inset 0 0 10px rgba(0, 180, 255, 0.2);
}
```

### CSS 动画脉冲
```css
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 10px rgba(0, 180, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 180, 255, 0.9);
  }
}

.glow {
  animation: pulse 2s infinite;
}
```

### SVG Filter 发光
```html
<filter id="glow">
  <feGaussianBlur in="SourceGraphic" stdDeviation="4"/>
  <feColorMatrix type="matrix" values="
    0 0 0 0   0
    0 0 0 0   0.7
    0 0 0 0   1
    0 0 0 1   0"/>
</filter>
```

---

## 📦 免费模板库

### 1. 即时设计 - 近300个可视化大屏模板
- **链接**: https://js.design/special/article/visualisation-of-large-screens.html
- **内容**: 直接套用,二次修改
- **行业**: 政务、金融、电商、直播等

### 2. 墨刀 - 10套可视化大屏原型
- **链接**: https://modao.cc/ad/blog/visualization-large-screen-templates.html
- **特点**: 原型模板,快速搭建

### 3. DataEase社区 - 仪表板素材
- **链接**: https://bbs.fit2cloud.com/t/topic/46
- **内容**: 背景图、边框图片、图标、动图
- **格式**: 各种素材资源

---

## 🔧 在线工具

### 1. Clippy - Clip-path 生成器
- **链接**: https://bennettfeely.com/clippy/
- **功能**: 可视化生成 clip-path 代码
- **用法**: 拖拽调整形状,自动生成CSS

### 2. Method.ac - SVG 编辑器
- **功能**: 在线SVG编辑和生成

---

## 💡 我们项目中的实现

我们在 `/home/shenzheng/lfwlw/frontend/src/pages/DigitalFactory/` 中实现的方案:

### 文件结构:
```
DigitalFactory/
├── PolygonBorder.tsx          # SVG多边形边框组件
├── PolygonBorder.module.scss  # 边框动画样式
├── index.tsx                  # 主页面
└── index.module.scss          # 梯形clip-path样式
```

### 特点:
- ✅ SVG + CSS 混合方案
- ✅ 梯形透视效果
- ✅ 发光动画
- ✅ 角标装饰
- ✅ 扫描线效果
- ✅ 完全响应式

---

## 📖 推荐学习顺序

1. **基础**: 先学 CSS `clip-path` 和 `polygon()`
2. **进阶**: 学习 SVG `<polygon>` 和滤镜
3. **动画**: 掌握 CSS `@keyframes` 和 SVG `<animate>`
4. **优化**: 了解性能优化技巧
5. **库**: 可选学习 augmented-ui 等专业库

---

## 🎓 关键技术点

### CSS clip-path 支持度
- ✅ Chrome 55+
- ✅ Firefox 54+
- ✅ Safari 9.1+
- ✅ Edge 79+

### SVG 滤镜性能
- 适合静态或少量动画
- 大量使用会影响性能
- 移动端需谨慎

### 最佳实践
1. 优先使用 CSS clip-path (性能最好)
2. 复杂动画使用 SVG
3. 边框用 box-shadow 而非真实border
4. 使用 GPU 加速 (transform, opacity)

---

**最后更新**: 2025-10-28
**适用项目**: 数字工厂、数据大屏、可视化仪表板
