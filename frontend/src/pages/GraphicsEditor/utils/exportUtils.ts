import Konva from 'konva';
import { jsPDF } from 'jspdf';

// 导出为SVG
export const exportToSVG = (stage: Konva.Stage): string => {
  const width = stage.width();
  const height = stage.height();
  const scale = stage.scaleX();

  // 创建SVG根元素
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // 添加背景
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;
  
  // 遍历所有层
  stage.getLayers().forEach(layer => {
    if (layer.visible()) {
      svg += `<g transform="scale(${scale})">`;
      svg += layerToSVG(layer);
      svg += '</g>';
    }
  });
  
  svg += '</svg>';
  
  return svg;
};

// 将Konva层转换为SVG
const layerToSVG = (layer: Konva.Layer): string => {
  let svg = '';
  
  layer.getChildren().forEach(node => {
    if (node.visible()) {
      svg += nodeToSVG(node);
    }
  });
  
  return svg;
};

// 将Konva节点转换为SVG
const nodeToSVG = (node: Konva.Node): string => {
  let svg = '';
  
  if (node instanceof Konva.Group) {
    const group = node as Konva.Group;
    svg += `<g transform="translate(${group.x()}, ${group.y()}) rotate(${group.rotation()})">`;
    group.getChildren().forEach(child => {
      svg += nodeToSVG(child);
    });
    svg += '</g>';
  } else if (node instanceof Konva.Rect) {
    const rect = node as Konva.Rect;
    svg += `<rect x="${rect.x()}" y="${rect.y()}" width="${rect.width()}" height="${rect.height()}"`;
    svg += ` fill="${rect.fill() || 'none'}" stroke="${rect.stroke() || 'none'}" stroke-width="${rect.strokeWidth()}"`;
    if (rect.cornerRadius()) {
      svg += ` rx="${rect.cornerRadius()}" ry="${rect.cornerRadius()}"`;
    }
    svg += '/>';
  } else if (node instanceof Konva.Circle) {
    const circle = node as Konva.Circle;
    svg += `<circle cx="${circle.x()}" cy="${circle.y()}" r="${circle.radius()}"`;
    svg += ` fill="${circle.fill() || 'none'}" stroke="${circle.stroke() || 'none'}" stroke-width="${circle.strokeWidth()}"/>`;
  } else if (node instanceof Konva.Line) {
    const line = node as Konva.Line;
    const points = line.points();
    if (points.length >= 2) {
      svg += `<polyline points="${points.join(' ')}"`;
      svg += ` fill="none" stroke="${line.stroke() || 'black'}" stroke-width="${line.strokeWidth()}"/>`;
    }
  } else if (node instanceof Konva.Text) {
    const text = node as Konva.Text;
    svg += `<text x="${text.x()}" y="${text.y() + text.fontSize()}"`;
    svg += ` font-family="${text.fontFamily()}" font-size="${text.fontSize()}" fill="${text.fill() || 'black'}">`;
    svg += text.text();
    svg += '</text>';
  } else if (node instanceof Konva.Path) {
    const path = node as Konva.Path;
    svg += `<path d="${path.data()}"`;
    svg += ` fill="${path.fill() || 'none'}" stroke="${path.stroke() || 'none'}" stroke-width="${path.strokeWidth()}"/>`;
  }
  
  return svg;
};

// 导出为PDF
export const exportToPDF = async (stage: Konva.Stage, filename: string = 'diagram.pdf') => {
  // 获取stage的尺寸
  const width = stage.width();
  const height = stage.height();
  
  // 创建PDF，自动选择方向
  const orientation = width > height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [width, height],
  });
  
  // 将stage转换为图片
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  
  // 添加图片到PDF
  pdf.addImage(dataURL, 'PNG', 0, 0, width, height);
  
  // 保存PDF
  pdf.save(filename);
};

// 下载SVG文件
export const downloadSVG = (svgContent: string, filename: string = 'diagram.svg') => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// 下载PNG文件
export const downloadPNG = (stage: Konva.Stage, filename: string = 'diagram.png') => {
  const dataURL = stage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = filename;
  link.click();
};