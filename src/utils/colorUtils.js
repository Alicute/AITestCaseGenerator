// 获取行的背景色
export function getRowBackgroundColor(fileName, index) {
    if (!fileName) return '';
    
    // 为不同文件分配不同的颜色
    const fileColors = {
      'workflow.json': '#e3f2fd', // 淡蓝色
      'testcases.json': '#fff8e1', // 淡黄色
      'testcases2.json': '#f1f8e9'  // 淡绿色
    };
    
    // 对于自定义上传的文件，根据文件名生成颜色
    if (!fileColors[fileName]) {
      // 简单的字符串哈希算法
      let hash = 0;
      for (let i = 0; i < fileName.length; i++) {
        hash = ((hash << 5) - hash) + fileName.charCodeAt(i);
        hash = hash & hash; // 转换为32位整数
      }
      
      // 生成柔和的淡色
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 80%, 95%)`;
    }
    
    return fileColors[fileName];
  }