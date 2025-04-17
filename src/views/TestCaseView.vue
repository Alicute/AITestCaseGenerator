<template>
  <main-layout>
    <div class="test-case-management">
      <div class="page-header">
        <h1>测试用例管理</h1>
        <div class="header-actions">
          <el-button type="primary" @click="createNewTestCase">新建测试用例</el-button>
          <el-button type="success" @click="goToAIGenerate">AI生成测试用例</el-button>
          <el-button @click="exportTestCases">导出</el-button>
        </div>
      </div>

      <el-card class="filter-card">
        <div class="filter-bar">
          <div class="search-box">
            <el-input
              v-model="searchQuery"
              placeholder="搜索测试用例"
              prefix-icon="el-icon-search"
              clearable
              @clear="handleSearchClear"
              @input="handleSearchInput"
            >
              <template #append>
                <el-button @click="searchTestCases">搜索</el-button>
              </template>
            </el-input>
          </div>
          
          <div class="filter-group">
            <div class="filter-item">
              <span class="filter-label">模块:</span>
              <el-select v-model="filters.module" placeholder="全部" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </div>
            
            <div class="filter-item">
              <span class="filter-label">优先级:</span>
              <el-select v-model="filters.priority" placeholder="全部" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </div>
            
            <div class="filter-item">
              <span class="filter-label">类型:</span>
              <el-select v-model="filters.type" placeholder="全部" clearable @change="applyFilters">
                <el-option label="全部" value="" />
                <el-option label="功能测试" value="functional" />
                <el-option label="性能测试" value="performance" />
                <el-option label="安全测试" value="security" />
              </el-select>
            </div>
          </div>
        </div>
      </el-card>

      <el-table
        :data="filteredTestCases"
        style="width: 100%"
        border
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="70" sortable />
        <el-table-column prop="title" label="测试用例标题" min-width="200" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.priority === 'high'" type="danger">高</el-tag>
            <el-tag v-else-if="scope.row.priority === 'medium'" type="warning">中</el-tag>
            <el-tag v-else-if="scope.row.priority === 'low'" type="success">低</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'functional'" type="primary">功能测试</el-tag>
            <el-tag v-else-if="scope.row.type === 'performance'" type="warning">性能测试</el-tag>
            <el-tag v-else-if="scope.row.type === 'security'" type="danger">安全测试</el-tag>
            <el-tag v-else type="info">其他</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 'passed'" type="success">通过</el-tag>
            <el-tag v-else-if="scope.row.status === 'failed'" type="danger">失败</el-tag>
            <el-tag v-else type="info">未执行</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" sortable />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewTestCase(scope.row)">查看</el-button>
            <el-button size="small" type="primary" @click="editTestCase(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteTestCase(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredTestCases.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>

      <!-- 测试用例详情对话框 -->
      <el-dialog v-model="testCaseDialogVisible" :title="dialogTitle" width="800px">
        <div v-if="currentTestCase" class="test-case-detail">
          <div class="detail-header">
            <h3>{{ currentTestCase.title }}</h3>
            <div class="detail-meta">
              <span>创建人: {{ currentTestCase.creator }}</span>
              <span>创建时间: {{ currentTestCase.createTime }}</span>
              <span>
                优先级: 
                <el-tag v-if="currentTestCase.priority === 'high'" type="danger">高</el-tag>
                <el-tag v-else-if="currentTestCase.priority === 'medium'" type="warning">中</el-tag>
                <el-tag v-else-if="currentTestCase.priority === 'low'" type="success">低</el-tag>
              </span>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">前置条件:</div>
            <div class="section-content">{{ currentTestCase.precondition || '无' }}</div>
          </div>

          <div class="detail-section">
            <div class="section-title">测试步骤:</div>
            <div class="section-content">
              <ol>
                <li v-for="(step, index) in currentTestCase.steps" :key="index">{{ step }}</li>
              </ol>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-title">预期结果:</div>
            <div class="section-content">{{ currentTestCase.expectedResult || '无' }}</div>
          </div>
        </div>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, computed, } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = useRouter()

// 测试用例数据
const testCases = ref([
  {
    id: 1,
    title: '验证初始配置参数有效性',
    module: '系统部署',
    priority: 'high',
    type: 'functional',
    status: 'passed',
    creator: '张三',
    createTime: '2023-07-15 10:30',
    precondition: '系统已完成安装，用户具有管理员权限，系统处于配置状态',
    steps: [
      '以管理员身份登录系统',
      '进入"系统配置"模块',
      '在初始化配置页面，填写所有必填参数',
      '包括：服务器IP、端口、用户名、密码、数据库连接等',
      '点击"保存配置"按钮'
    ],
    expectedResult: '系统验证参数有效性，所有配置参数成功保存，系统显示配置成功消息，日志记录配置操作'
  },
  {
    id: 2,
    title: '缺少必填参数的异常处理',
    module: '系统部署',
    priority: 'medium',
    type: 'functional',
    status: 'failed',
    creator: '李四',
    createTime: '2023-07-16 14:15',
    precondition: '系统已完成安装，用户具有管理员权限，系统处于配置状态',
    steps: [
      '以管理员身份登录系统',
      '进入"系统配置"模块',
      '在初始化配置页面，故意不填写服务器IP地址等必填字段',
      '点击"保存配置"按钮'
    ],
    expectedResult: '系统验证失败，不允许保存配置，系统提示错误消息:"服务器IP地址为必填项"，焦点自动定位到缺失的必填字段'
  },
  {
    id: 3,
    title: '权限控制验证',
    module: '系统部署',
    priority: 'high',
    type: 'security',
    status: 'waiting',
    creator: '王五',
    createTime: '2023-07-17 09:45',
    precondition: '系统已完成安装，用户具有普通用户权限（非管理员），系统处于配置状态',
    steps: [
      '以普通用户身份登录系统',
      '尝试进入"系统配置"模块',
      '尝试修改初始化配置'
    ],
    expectedResult: '系统阻止普通用户访问配置模块，显示权限不足的提示信息，记录未授权访问尝试'
  },
  {
    id: 4,
    title: '批量图像采集性能测试',
    module: '采集图像',
    priority: 'high',
    type: 'performance',
    status: 'waiting',
    creator: '赵六',
    createTime: '2023-07-18 16:20',
    precondition: '系统已连接摄像设备，存储空间充足',
    steps: [
      '登录系统',
      '进入批量采集模块',
      '设置采集参数：100张图像，分辨率2048x1536',
      '开始批量采集',
      '监控系统资源占用和响应时间'
    ],
    expectedResult: '系统能够连续采集100张图像，每张图像间隔不超过2秒，CPU占用率不超过80%，内存占用率不超过1GB'
  },
  {
    id: 5,
    title: '图像编辑功能验证',
    module: '图像编辑',
    priority: 'medium',
    type: 'functional',
    status: 'passed',
    creator: '张三',
    createTime: '2023-07-19 11:10',
    precondition: '系统中已存在可编辑的图像文件',
    steps: [
      '登录系统',
      '进入图像编辑模块',
      '选择一张已有图像',
      '应用旋转、裁剪、滤镜等编辑功能',
      '保存编辑后的图像'
    ],
    expectedResult: '图像成功应用所有编辑效果，保存成功，编辑后的图像质量无明显降低'
  }
])

// 过滤和分页
const filters = ref({
  module: '',
  priority: '',
  type: ''
})
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

// 下拉选项
const moduleOptions = computed(() => {
  // 从测试用例中提取所有不重复的模块名称
  const modules = new Set(testCases.value.map(tc => tc.module))
  return Array.from(modules)
})

// 过滤后的测试用例
const filteredTestCases = computed(() => {
  let result = testCases.value

  // 应用搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(tc => 
      tc.title.toLowerCase().includes(query) || 
      tc.module.toLowerCase().includes(query) ||
      (tc.precondition && tc.precondition.toLowerCase().includes(query)) ||
      (tc.expectedResult && tc.expectedResult.toLowerCase().includes(query))
    )
  }

  // 应用过滤器
  if (filters.value.module) {
    result = result.filter(tc => tc.module === filters.value.module)
  }
  if (filters.value.priority) {
    result = result.filter(tc => tc.priority === filters.value.priority)
  }
  if (filters.value.type) {
    result = result.filter(tc => tc.type === filters.value.type)
  }

  return result
})

// 对话框相关
const testCaseDialogVisible = ref(false)
const dialogMode = ref('view') // 'view', 'edit', 'create'
const currentTestCase = ref(null)
const dialogTitle = computed(() => {
  if (dialogMode.value === 'view') return '测试用例详情'
  if (dialogMode.value === 'edit') return '编辑测试用例'
  if (dialogMode.value === 'create') return '创建测试用例'
  return ''
})

// 处理方法
const applyFilters = () => {
  currentPage.value = 1 // 重置到第一页
}

const handleSearchInput = () => {
  // 如果清空搜索框，立即应用过滤
  if (searchQuery.value === '') {
    searchTestCases()
  }
}

const handleSearchClear = () => {
  searchTestCases()
}

const searchTestCases = () => {
  currentPage.value = 1 // 重置到第一页
}

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 测试用例操作
const viewTestCase = (testCase) => {
  currentTestCase.value = testCase
  dialogMode.value = 'view'
  testCaseDialogVisible.value = true
}

const editTestCase = (testCase) => {
  ElMessage.info(`编辑测试用例: ${testCase.title}`)
}

const deleteTestCase = (testCase) => {
  ElMessageBox.confirm(
    `确定要删除测试用例 "${testCase.title}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      // 模拟删除操作
      const index = testCases.value.findIndex(tc => tc.id === testCase.id)
      if (index !== -1) {
        testCases.value.splice(index, 1)
        ElMessage.success('测试用例删除成功')
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

const createNewTestCase = () => {
  ElMessage.info('创建新测试用例功能待实现')
}

const exportTestCases = () => {
  ElMessage.success('测试用例导出成功')
}

const goToAIGenerate = () => {
  router.push('/ai-generate')
}
</script>

<style scoped>
.test-case-management {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 5px;
}

.search-box {
  width: 300px;
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-weight: bold;
  color: #606266;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.test-case-detail {
  padding: 10px;
}

.detail-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.detail-meta {
  display: flex;
  gap: 15px;
  color: #606266;
  font-size: 0.9em;
  margin-top: 10px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #303133;
}

.section-content {
  line-height: 1.6;
  color: #606266;
}
</style>