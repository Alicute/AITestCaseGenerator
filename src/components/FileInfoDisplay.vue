<template>
    <div class="file-info">
      <div>{{ selectedFilesText }}</div>
      <div>已加载 {{ loadedCasesCount }} 个测试用例</div>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  
  const props = defineProps({
    selectedFiles: {
      type: Array,
      default: () => []
    },
    loadedCasesCount: {
      type: Number,
      default: 0
    }
  })
  
  const selectedFilesText = computed(() => {
    return props.selectedFiles.length > 0 
      ? `已选择文件: ${props.selectedFiles.join(', ')}` 
      : '未选择文件'
  })
  </script>
  
  <style scoped>
  .file-info {
    margin: 15px 0;
    background-color: #fff;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 12px;
  }
  
  .file-info div {
    margin-bottom: 5px;
  }
  </style>