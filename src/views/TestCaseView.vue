<template>
    <div class="container">
      <test-case-header 
        @load-default="loadDefaultTestCases"
        @export-excel="exportToExcel"
        @files-selected="loadTestCasesFromFiles"
      />
      
      <file-info-display 
        :selected-files="selectedFiles" 
        :loaded-cases-count="testCases.length" 
      />
      
      <test-case-table :test-cases="testCases" :source-map="testCaseSourceMap" />
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  import TestCaseHeader from '@/components/TestCaseHeader.vue'
  import FileInfoDisplay from '@/components/FileInfoDisplay.vue'
  import TestCaseTable from '@/components/TestCaseTable.vue'
  import { loadDefaultCases, loadCasesFromFiles } from '@/services/testCaseService'
  import { exportToExcel } from '@/services/exportService'
  
  // 状态
  const testCases = ref([])
  const testCaseSourceMap = ref({})
  const selectedFiles = ref([])
  
  // 方法
  const loadDefaultTestCases = async () => {
    const result = await loadDefaultCases()
    testCases.value = result.cases
    testCaseSourceMap.value = result.sourceMap
    selectedFiles.value = result.fileNames
  }
  
  const loadTestCasesFromFiles = (files) => {
    const result = loadCasesFromFiles(files)
    testCases.value = result.cases
    testCaseSourceMap.value = result.sourceMap
    selectedFiles.value = result.fileNames
  }
  
  const exportToExcelHandler = () => {
    exportToExcel(testCases.value)
  }
  </script>
  
  <style scoped>
  .container {
    width: 100%;
    margin: 0 auto;
    padding: 0 10px;
  }
  </style>