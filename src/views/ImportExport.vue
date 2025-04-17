<template>
  <main-layout>
    <div class="import-export">
      <h1>数据导入导出</h1>
      
      <el-tabs v-model="activeTab" class="import-export-tabs">
        <el-tab-pane label="导入" name="import">
          <el-card class="tab-card">
            <h3>导入数据</h3>
            
            <div class="file-upload-section">
              <el-upload
                class="upload-demo"
                drag
                action="#"
                :auto-upload="false"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                multiple
              >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持Excel(.xlsx, .xls)、CSV、JSON和XML格式文件
                  </div>
                </template>
              </el-upload>
              
              <div class="file-list" v-if="selectedFiles.length > 0">
                <h4>已选择文件:</h4>
                <ul>
                  <li v-for="(file, index) in selectedFiles" :key="index">
                    {{ file.name }} ({{ formatFileSize(file.size) }})
                  </li>
                </ul>
              </div>
            </div>
            
            <el-divider />
            
            <div class="import-options">
              <h4>导入选项:</h4>
              
              <el-form label-position="left" label-width="120px">
                <el-form-item label="导入方式:">
                  <el-radio-group v-model="importOptions.mode">
                    <el-radio label="overwrite">覆盖现有数据</el-radio>
                    <el-radio label="merge">合并数据</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="导入目标:">
                  <el-checkbox-group v-model="importOptions.targets">
                    <el-checkbox label="projects">项目信息</el-checkbox>
                    <el-checkbox label="modules">模块结构</el-checkbox>
                    <el-checkbox label="testcases">测试用例</el-checkbox>
                    <el-checkbox label="settings">配置信息</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-form-item label="冲突处理:">
                  <el-select v-model="importOptions.conflict" style="width: 240px">
                    <el-option label="使用导入文件数据" value="imported" />
                    <el-option label="保留现有数据" value="existing" />
                    <el-option label="合并（保留最新）" value="newest" />
                    <el-option label="询问" value="ask" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
            
            <div class="action-buttons">
              <el-button type="primary" @click="importData" :disabled="selectedFiles.length === 0">开始导入</el-button>
              <el-button @click="resetImport">重置</el-button>
            </div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="导出" name="export">
          <el-card class="tab-card">
            <h3>导出数据</h3>
            
            <el-form label-position="left" label-width="120px">
              <el-form-item label="导出内容:">
                <el-checkbox-group v-model="exportOptions.content">
                  <el-checkbox label="projects">项目信息</el-checkbox>
                  <el-checkbox label="modules">模块结构</el-checkbox>
                  <el-checkbox label="testcases">测试用例</el-checkbox>
                  <el-checkbox label="settings">配置信息</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="筛选条件:">
                <div class="filter-section">
                  <div class="filter-row">
                    <span>项目:</span>
                    <el-select v-model="exportOptions.filter.project" placeholder="全部项目" clearable style="width: 240px">
                      <el-option label="全部项目" value="" />
                      <el-option v-for="project in projectOptions" :key="project.id" :label="project.name" :value="project.id" />
                    </el-select>
                  </div>
                  
                  <div class="filter-row">
                    <span>模块:</span>
                    <el-select v-model="exportOptions.filter.module" placeholder="全部模块" clearable style="width: 240px">
                      <el-option label="全部模块" value="" />
                      <el-option v-for="module in moduleOptions" :key="module.id" :label="module.name" :value="module.id" />
                    </el-select>
                  </div>
                  
                  <div class="filter-row">
                    <span>日期范围:</span>
                    <el-date-picker
                      v-model="exportOptions.filter.dateRange"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      style="width: 240px"
                    />
                  </div>
                </div>
              </el-form-item>
              
              <el-form-item label="导出格式:">
                <div class="format-buttons">
                  <el-radio-group v-model="exportOptions.format">
                    <el-radio-button label="excel">Excel</el-radio-button>
                    <el-radio-button label="csv">CSV</el-radio-button>
                    <el-radio-button label="json">JSON</el-radio-button>
                    <el-radio-button label="xml">XML</el-radio-button>
                  </el-radio-group>
                </div>
              </el-form-item>
              
              <el-form-item label="其他选项:">
                <el-checkbox v-model="exportOptions.includeAssets">包含关联资源</el-checkbox>
                <el-tooltip content="导出时包含图像、附件等关联资源" placement="top">
                  <el-icon><question-filled /></el-icon>
                </el-tooltip>
              </el-form-item>
            </el-form>
            
            <div class="action-buttons">
              <el-button type="primary" @click="exportData" :disabled="exportOptions.content.length === 0">开始导出</el-button>
              <el-button @click="resetExport">重置</el-button>
            </div>
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="历史记录" name="history">
          <el-card class="tab-card">
            <h3>导入导出历史记录</h3>
            
            <el-table :data="historyRecords" style="width: 100%" border stripe>
              <el-table-column prop="date" label="日期时间" width="180" sortable />
              <el-table-column prop="type" label="操作类型" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.type === 'import' ? 'success' : 'primary'">
                    {{ scope.row.type === 'import' ? '导入' : '导出' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="fileName" label="文件名称" />
              <el-table-column prop="content" label="内容类型" width="150" />
              <el-table-column prop="size" label="大小" width="100" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ scope.row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="scope">
                  <el-button v-if="scope.row.type === 'export'" size="small" @click="downloadFile(scope.row)">下载</el-button>
                  <el-button size="small" type="danger" @click="deleteRecord(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-container">
              <el-pagination
                :current-page="currentPage"
                :page-sizes="[10, 20, 50]"
                :page-size="pageSize"
                layout="total, sizes, prev, pager, next"
                :total="historyRecords.length"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>
  </main-layout>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled, QuestionFilled } from '@element-plus/icons-vue'
import MainLayout from '@/components/layout/MainLayout.vue'

// 当前活动标签页
const activeTab = ref('import')

// 导入相关
const selectedFiles = ref([])
const importOptions = ref({
  mode: 'merge', // overwrite, merge
  targets: ['projects', 'modules', 'testcases'],
  conflict: 'ask' // imported, existing, newest, ask
})

// 导出相关
const exportOptions = ref({
  content: ['testcases'],
  filter: {
    project: '',
    module: '',
    dateRange: null
  },
  format: 'excel',
  includeAssets: false
})

// 分页控制
const currentPage = ref(1)
const pageSize = ref(10)

// 模拟项目和模块数据
const projectOptions = ref([
  { id: 1, name: '系统测试项目' },
  { id: 2, name: '网络模块测试' },
  { id: 3, name: '安全测试项目' }
])

const moduleOptions = ref([
  { id: 1, name: '系统部署' },
  { id: 2, name: '采集图像' },
  { id: 3, name: '设备管理' },
  { id: 4, name: '图像编辑' }
])

// 模拟历史记录数据
const historyRecords = ref([
  {
    id: 1,
    date: '2023-07-21 10:15',
    type: 'export',
    fileName: '系统部署测试用例.xlsx',
    content: '测试用例',
    size: '245 KB',
    status: '成功'
  },
  {
    id: 2,
    date: '2023-07-20 15:30',
    type: 'import',
    fileName: '模块结构.json',
    content: '模块结构',
    size: '128 KB',
    status: '成功'
  },
  {
    id: 3,
    date: '2023-07-19 09:45',
    type: 'export',
    fileName: '全部项目数据.zip',
    content: '完整项目',
    size: '1.2 MB',
    status: '成功'
  },
  {
    id: 4,
    date: '2023-07-18 14:20',
    type: 'import',
    fileName: '测试用例导入.csv',
    content: '测试用例',
    size: '156 KB',
    status: '部分成功'
  },
  {
    id: 5,
    date: '2023-07-17 16:50',
    type: 'export',
    fileName: '安全测试用例.xlsx',
    content: '测试用例',
    size: '178 KB',
    status: '失败'
  }
])

// 文件处理方法
const handleFileChange = (file) => {
  const exists = selectedFiles.value.some(f => f.name === file.name)
  if (!exists) {
    selectedFiles.value.push(file.raw)
  }
}

const handleFileRemove = (file) => {
  const index = selectedFiles.value.findIndex(f => f.name === file.name)
  if (index !== -1) {
    selectedFiles.value.splice(index, 1)
  }
}

const formatFileSize = (size) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(1) + ' MB'
  }
}

// 导入导出操作
const importData = () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  ElMessage.success('数据导入成功')
  
  // 重置导入表单
  resetImport()
  
  // 切换到历史记录标签页
  activeTab.value = 'history'
}

const exportData = () => {
  if (exportOptions.value.content.length === 0) {
    ElMessage.warning('请选择要导出的内容')
    return
  }
  
  ElMessage.success('数据导出成功，文件已保存到下载目录')
  
  // 切换到历史记录标签页
  activeTab.value = 'history'
}

const resetImport = () => {
  selectedFiles.value = []
  importOptions.value = {
    mode: 'merge',
    targets: ['projects', 'modules', 'testcases'],
    conflict: 'ask'
  }
}

const resetExport = () => {
  exportOptions.value = {
    content: ['testcases'],
    filter: {
      project: '',
      module: '',
      dateRange: null
    },
    format: 'excel',
    includeAssets: false
  }
}

// 历史记录操作
const getStatusType = (status) => {
  if (status === '成功') return 'success'
  if (status === '部分成功') return 'warning'
  if (status === '失败') return 'danger'
  return 'info'
}

const downloadFile = (record) => {
  ElMessage.success(`开始下载文件: ${record.fileName}`)
}

const deleteRecord = (record) => {
  ElMessageBox.confirm(
    `确定要删除记录 "${record.fileName}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const index = historyRecords.value.findIndex(r => r.id === record.id)
      if (index !== -1) {
        historyRecords.value.splice(index, 1)
        ElMessage.success('记录删除成功')
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}
</script>

<style scoped>
.import-export {
  width: 100%;
}

.import-export-tabs {
  margin-top: 20px;
}

.tab-card {
  margin-top: 10px;
}

.file-upload-section {
  margin: 20px 0;
}

.file-list {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.file-list ul {
  list-style-type: none;
  padding-left: 0;
}

.file-list li {
  padding: 5px 0;
  border-bottom: 1px solid #ebeef5;
}

.import-options {
  margin: 20px 0;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-row span {
  min-width: 60px;
}

.format-buttons {
  margin: 10px 0;
}

.action-buttons {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>