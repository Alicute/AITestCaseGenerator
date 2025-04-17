<template>
    <div class="table-wrapper">
      <el-table
        :data="testCases"
        style="width: 100%"
        :row-class-name="rowClassName"
      >
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="maintainer" label="维护人" width="100" />
        <el-table-column prop="type" label="用例类型" width="100" />
        <el-table-column prop="priority" label="重要程度" width="100" />
        <el-table-column prop="testType" label="测试类型" width="100" />
        <el-table-column prop="estimatedHours" label="预估工时" width="100" />
        <el-table-column prop="remainingHours" label="剩余工时" width="100" />
        <el-table-column prop="relatedItems" label="关联工作项" width="120" />
        <el-table-column prop="preconditions" label="前置条件" min-width="200" />
        <el-table-column prop="steps" label="步骤描述" min-width="300" />
        <el-table-column prop="expectedResults" label="预期结果" min-width="300" />
        <el-table-column prop="followers" label="关注人" width="100" />
        <el-table-column prop="notes" label="备注" width="100" />
      </el-table>
    </div>
  </template>
  
  <script setup>
  import { getRowBackgroundColor } from '@/utils/colorUtils'
  
  const props = defineProps({
    testCases: {
      type: Array,
      default: () => []
    },
    sourceMap: {
      type: Object,
      default: () => ({})
    }
  })
  
  const rowClassName = ({ $index }) => {
    const fileName = props.sourceMap[$index]
    return {
      backgroundColor: getRowBackgroundColor(fileName, $index)
    }
  }
  </script>
  
  <style scoped>
  .table-wrapper {
    margin: 15px 0;
    background-color: #fff;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  /* 自定义Element-UI表格样式 */
  :deep(.el-table) {
    font-size: 12px;
  }
  
  :deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
    background-color: #f1f1f1;
  }
  </style>