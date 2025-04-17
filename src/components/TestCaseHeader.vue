<template>
    <div>
      <h1>工业X射线数字成像系统测试用例</h1>
      
      <div class="button-group">
        <label for="fileInput" class="button">选择测试用例文件</label>
        <input 
          type="file" 
          id="fileInput" 
          accept=".json" 
          multiple
          @change="handleFileChange"
        >
        <el-button @click="$emit('load-default')">加载默认测试用例</el-button>
        <el-button @click="$emit('export-excel')">导出为Excel</el-button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineEmits } from 'vue'
  
  const emit = defineEmits(['load-default', 'export-excel', 'files-selected'])
  
  const handleFileChange = (event) => {
    const files = event.target.files
    if (files.length > 0) {
      emit('files-selected', files)
    }
  }
  </script>
  
  <style scoped>
  h1 {
    color: #2c3e50;
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #3498db;
    font-size: 22px;
  }
  
  .button-group {
    margin: 15px 0;
    text-align: center;
  }
  
  .button-group label {
    margin-right: 8px;
    padding: 8px 15px;
    cursor: pointer;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    transition: background-color 0.3s;
    display: inline-block;
  }
  
  .button-group label:hover {
    background-color: #2980b9;
  }
  
  #fileInput {
    display: none;
  }
  </style>