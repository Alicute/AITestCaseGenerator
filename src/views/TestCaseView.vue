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
        <div class="filter-container">
          <!-- 搜索栏 -->
          <div class="search-section">
            <el-input
              v-model="searchQuery"
              placeholder="搜索测试用例"
              clearable
              @clear="handleSearchClear"
              @input="handleSearchInput"
              class="search-input"
            >
              <template #prefix>
                <el-icon><search /></el-icon>
              </template>
              <template #append>
                <el-button @click="searchTestCases">搜索</el-button>
              </template>
            </el-input>
          </div>
          
          <!-- 过滤器区域 -->
          <div class="filter-section">
            <div class="filter-row">
              <div class="filter-item">
                <span class="filter-label">模块：</span>
                <el-select 
                  v-model="filters.moduleId" 
                  placeholder="全部" 
                  clearable 
                  @change="applyFilters"
                  style="width: 180px;"
                >
                  <el-option label="全部" value="" />
                  <el-option 
                    v-for="item in moduleOptions" 
                    :key="item.id" 
                    :label="item.name" 
                    :value="item.id" 
                  />
                </el-select>
              </div>
              
              <div class="filter-item">
                <span class="filter-label">优先级：</span>
                <el-select 
                  v-model="filters.priority" 
                  placeholder="全部" 
                  clearable 
                  @change="applyFilters"
                  style="width: 120px;"
                >
                  <el-option label="全部" value="" />
                  <el-option label="高" value="high" />
                  <el-option label="中" value="medium" />
                  <el-option label="低" value="low" />
                </el-select>
              </div>
              
              <div class="filter-item">
                <span class="filter-label">类型：</span>
                <el-select 
                  v-model="filters.type" 
                  placeholder="全部" 
                  clearable 
                  @change="applyFilters"
                  style="width: 150px;"
                >
                  <el-option label="全部" value="" />
                  <el-option label="功能测试" value="functional" />
                  <el-option label="性能测试" value="performance" />
                  <el-option label="安全测试" value="security" />
                </el-select>
              </div>
              
              <div class="filter-item">
                <span class="filter-label">状态：</span>
                <el-select 
                  v-model="filters.status" 
                  placeholder="全部" 
                  clearable 
                  @change="applyFilters"
                  style="width: 120px;"
                >
                  <el-option label="全部" value="" />
                  <el-option label="通过" value="passed" />
                  <el-option label="失败" value="failed" />
                  <el-option label="未执行" value="waiting" />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <template v-else>
        <el-empty v-if="filteredTestCases.length === 0" description="暂无测试用例数据" />
        
        <template v-else>
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
            <el-table-column label="模块" width="120">
              <template #default="scope">
                {{ getModuleName(scope.row.moduleId) }}
              </template>
            </el-table-column>
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
            <el-table-column prop="creatorId" label="创建人" width="120" />
            <el-table-column label="创建时间" width="180" sortable>
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
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
              :current-page="pagination.current"
              :page-sizes="[10, 20, 50, 100]"
              :page-size="pagination.pageSize"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </template>
      </template>

      <!-- 测试用例详情对话框 -->
      <el-dialog v-model="testCaseDialogVisible" :title="dialogTitle" width="800px">
        <div v-if="currentTestCase" class="test-case-detail">
          <div class="detail-header">
            <h3>{{ currentTestCase.title }}</h3>
            <div class="detail-meta">
              <span>创建人: {{ currentTestCase.creatorId || '未知' }}</span>
              <span>创建时间: {{ formatDate(currentTestCase.createdAt) }}</span>
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
                <li v-for="(step, index) in testSteps" :key="index">{{ step }}</li>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MainLayout from '@/components/layout/MainLayout.vue'
import api from '@/api'

const router = useRouter()
const route = useRoute()

// 状态变量
const loading = ref(true)
const testCases = ref([])
const modules = ref([])
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

// 过滤和搜索
const filters = ref({
  moduleId: '',
  priority: '',
  type: ''
})

const searchQuery = ref('')
const selectedRows = ref([])

// 下拉选项
const moduleOptions = computed(() => {
  return modules.value
})

// 获取模块名称的辅助函数
const getModuleName = (moduleId) => {
  if (!moduleId) return '未分配'
  const module = modules.value.find(m => m.id === moduleId)
  return module ? module.name : '未知模块'
}

// 获取模块列表
const fetchModules = async () => {
  try {
    const response = await api.module.getModules()
    if (response.success) {
      modules.value = response.data
    } else {
      ElMessage.error(response.message || '获取模块列表失败')
    }
  } catch (error) {
    console.error('获取模块列表错误:', error)
    ElMessage.error('获取模块列表时发生错误')
  }
}

// 获取测试用例列表
const fetchTestCases = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      ...filters.value
    }
    
    // 如果有搜索关键字，添加到查询参数
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    // 如果路由中有moduleId参数，优先使用它
    const routeModuleId = route.query.moduleId
    if (routeModuleId && !filters.value.moduleId) {
      params.moduleId = routeModuleId
      filters.value.moduleId = routeModuleId
    }
    
    const response = await api.testCase.getTestCases(params)
    
    if (response.success) {
      testCases.value = response.data
      pagination.value.total = response.total || response.data.length
    } else {
      ElMessage.error(response.message || '获取测试用例失败')
    }
  } catch (error) {
    console.error('获取测试用例错误:', error)
    ElMessage.error('获取测试用例时发生错误')
  } finally {
    loading.value = false
  }
}

// 计算筛选后的测试用例列表
const filteredTestCases = computed(() => {
  return testCases.value
})

// 对话框相关
const testCaseDialogVisible = ref(false)
const dialogMode = ref('view') // 'view', 'edit', 'create'
const currentTestCase = ref(null)
const testSteps = computed(() => {
  if (!currentTestCase.value || !currentTestCase.value.steps) return []
  // 处理步骤，可能是字符串或数组
  if (typeof currentTestCase.value.steps === 'string') {
    return currentTestCase.value.steps.split('\n').filter(step => step.trim())
  }
  return currentTestCase.value.steps
})

const dialogTitle = computed(() => {
  if (dialogMode.value === 'view') return '测试用例详情'
  if (dialogMode.value === 'edit') return '编辑测试用例'
  if (dialogMode.value === 'create') return '创建测试用例'
  return ''
})

// 处理方法
const applyFilters = () => {
  pagination.value.current = 1 // 重置到第一页
  fetchTestCases()
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
  pagination.value.current = 1 // 重置到第一页
  fetchTestCases()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  fetchTestCases()
}

const handleCurrentChange = (page) => {
  pagination.value.current = page
  fetchTestCases()
}

const handleSelectionChange = (rows) => {
  selectedRows.value = rows
}

// 测试用例操作
const viewTestCase = async (testCase) => {
  try {
    // 可以添加额外的API调用来获取完整的测试用例详情
    const response = await api.testCase.getTestCase(testCase.id)
    if (response.success) {
      currentTestCase.value = response.data
      dialogMode.value = 'view'
      testCaseDialogVisible.value = true
    } else {
      ElMessage.error(response.message || '获取测试用例详情失败')
    }
  } catch (error) {
    console.error('获取测试用例详情错误:', error)
    ElMessage.error('获取测试用例详情时发生错误')
  }
}

const editTestCase = (testCase) => {
  router.push(`/testcases/${testCase.id}/edit`)
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
    .then(async () => {
      try {
        const response = await api.testCase.deleteTestCase(testCase.id)
        if (response.success) {
          ElMessage.success('测试用例删除成功')
          fetchTestCases() // 重新加载列表
        } else {
          ElMessage.error(response.message || '删除测试用例失败')
        }
      } catch (error) {
        console.error('删除测试用例错误:', error)
        ElMessage.error('删除测试用例时发生错误')
      }
    })
    .catch(() => {
      // 用户取消操作
    })
}

const createNewTestCase = () => {
  router.push('/testcases/create')
}

const exportTestCases = () => {
  ElMessage.info('导出功能正在开发中')
}

const goToAIGenerate = () => {
  router.push('/ai-generate')
}

// 日期格式化函数
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 组件挂载时加载数据
onMounted(() => {
  fetchModules()
  fetchTestCases()
})
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

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.search-section {
  width: 100%;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

.filter-section {
  width: 100%;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.filter-label {
  font-weight: bold;
  color: #606266;
  width: 70px;
  text-align: right;
  margin-right: 8px;
}

.loading-container {
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
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

/* 响应式调整 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-item {
    width: 100%;
  }
  
  .filter-label {
    width: 60px;
  }
  
  .el-select {
    width: 100% !important;
  }
}
</style>