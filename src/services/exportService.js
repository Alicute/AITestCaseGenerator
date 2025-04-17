import * as XLSX from 'xlsx';

export function exportToExcel(testCases) {
  // 创建工作簿
  const wb = XLSX.utils.book_new();
  
  // 定义表头
  const headers = [
    "模块", "编号", "标题", "维护人", "用例类型", 
    "重要程度", "测试类型", "预估工时", "剩余工时", "关联工作项", 
    "前置条件", "步骤描述", "预期结果", "关注人", "备注"
  ];
  
  // 创建数据数组，首先添加标题行和表头行
  const data = [
    ["测试用例"], // 第一行：标题行
    headers      // 第二行：表头行
  ];
  
  // 添加数据行
  testCases.forEach(testCase => {
    const row = [
      testCase.module,
      testCase.id,
      testCase.title,
      testCase.maintainer,
      testCase.type,
      testCase.priority,
      testCase.testType,
      testCase.estimatedHours,
      testCase.remainingHours,
      testCase.relatedItems,
      testCase.preconditions,
      testCase.steps,
      testCase.expectedResults,
      testCase.followers,
      testCase.notes
    ];
    data.push(row);
  });
  
  // 从数据数组创建工作表
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // 设置合并单元格 - 第一行标题合并所有列
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
  ];
  
  // 将工作表添加到工作簿
  XLSX.utils.book_append_sheet(wb, ws, "测试用例");
  
  // 导出文件
  XLSX.writeFile(wb, "测试用例.xlsx");
}