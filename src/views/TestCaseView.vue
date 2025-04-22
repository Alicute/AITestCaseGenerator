<template>
  <main-layout>
    <div class="test-case-management">
      <!-- 优化项目选择区域 -->
      <div class="project-selection-container">
        <div class="project-selection-card">
          <h2>选择项目</h2>
          <div class="project-selector">
            <el-select
              v-model="selectedProjectId"
              placeholder="请选择一个项目"
              style="width: 300px"
              @change="handleProjectChange"
            >
              <el-option
                v-for="project in projectsList"
                :key="project.id"
                :label="project.name"
                :value="project.id"
              />
            </el-select>
            <el-button
              type="primary"
              size="default"
              style="margin-left: 10px"
              @click="goToCreateProject"
            >
              创建新项目
            </el-button>
          </div>
        </div>
      </div>

      <!-- 优化加载状态显示 -->
      <div v-if="loading && !selectedProjectId" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 优化无项目选择时的显示 -->
      <div v-else-if="!selectedProjectId" class="no-project-selected">
        <el-empty description="请选择一个项目查看测试用例">
          <el-button type="primary" @click="goToCreateProject">创建新项目</el-button>
        </el-empty>
      </div>

      <!-- 优化选择项目后的内容区域 -->
      <div v-else class="testcase-content">
        <div class="content-header">
          <h2>{{ projectInfo.name || '项目' }} 的测试用例</h2>
          <div class="header-actions">
            <el-button type="primary" @click="createTestCase">新建测试用例</el-button>
            <el-button type="success" @click="goToAIGenerate">AI生成测试用例</el-button>
            <el-button @click="exportTestCases">导出</el-button>
            <el-button @click="goToModuleDesign">查看模块设计</el-button>
          </div>
        </div>

        <!-- 优化过滤器卡片 -->
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
              <el-form :model="filters" label-width="80px" class="filter-form">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="模块:">
                      <el-select v-model="filters.moduleId" placeholder="选择模块" clearable @change="applyFilters">
                        <el-option
                          v-for="module in modules"
                          :key="module.id"
                          :label="module.name"
                          :value="module.id"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="优先级:">
                      <el-select v-model="filters.priority" placeholder="选择优先级" clearable @change="applyFilters">
                        <el-option label="高" value="high" />
                        <el-option label="中" value="medium" />
                        <el-option label="低" value="low" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="类型:">
                      <el-select v-model="filters.type" placeholder="选择类型" clearable @change="applyFilters">
                        <el-option label="功能测试" value="functional" />
                        <el-option label="性能测试" value="performance" />
                        <el-option label="安全测试" value="security" />
                        <el-option label="其他" value="other" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="状态:">
                      <el-select v-model="filters.status" placeholder="选择状态" clearable @change="applyFilters">
                        <el-option label="未执行" value="waiting" />
                        <el-option label="通过" value="passed" />
                        <el-option label="失败" value="failed" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>
        </el-card>

        <!-- 测试用例表格 -->
        <el-card class="table-card">
          <el-table
            v-loading="loading"
            :data="filteredTestCases"
            style="width: 100%"
            @selection-change="handleSelectionChange"
            :max-height="500"
            :row-key="row => row.id"
            :default-sort="{ prop: 'priority', order: 'ascending' }"
            :resize-observer="false"
            :height="400"
            :scrollbar-always-on="true"
          >
            <el-table-column type="selection" width="55" />
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="moduleName" label="模块" min-width="120" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="priority" label="优先级" width="100" sortable>
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
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="scope">
                <el-button size="small" @click="viewTestCase(scope.row)">查看</el-button>
                <el-button size="small" type="primary" @click="editTestCase(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteTestCase(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>

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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import api from '@/api'

const router = useRouter()
const route = useRoute()

// 项目选择相关
const selectedProjectId = ref(null)
const projectsList = ref([])
const projectInfo = ref({})

// 状态变量
const loading = ref(true)
const testCases = ref([])
const modules = ref([])
const searchQuery = ref('')
const selectedRows = ref([])

// 分页相关
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 0
})

// 过滤器
const filters = ref({
  moduleId: '',
  priority: '',
  type: '',
  status: ''
})

// 获取项目列表
const fetchProjects = async () => {
  try {
    const response = await api.project.getProjects()
    if (response.success) {
      projectsList.value = response.data
    } else {
      ElMessage.error(response.message || '获取项目列表失败')
    }
  } catch (error) {
    console.error('获取项目列表错误:', error)
    ElMessage.error('获取项目列表时发生错误')
  }
}

// 获取项目信息
const fetchProjectInfo = async () => {
  if (!selectedProjectId.value) return

  try {
    loading.value = true
    const response = await api.project.getProject(selectedProjectId.value)

    if (response.success) {
      projectInfo.value = response.data
    } else {
      ElMessage.error(response.message || '获取项目信息失败')
    }
  } catch (error) {
    console.error('获取项目信息错误:', error)
    ElMessage.error('获取项目信息时发生错误')
  } finally {
    loading.value = false
  }
}

// 处理项目选择变化
const handleProjectChange = (projectId) => {
  if (projectId) {
    selectedProjectId.value = projectId
    fetchProjectInfo()
    fetchModules()
    fetchTestCases()
  }
}

// 跳转到创建项目页面
const goToCreateProject = () => {
  router.push('/projects')
}

// 获取模块列表
const fetchModules = async () => {
  if (!selectedProjectId.value) return
  
  loading.value = true
  try {
    const response = await api.module.getModuleTree(selectedProjectId.value)
    
    if (response.success) {
      // 将树形结构扁平化，以便在过滤器中显示
      modules.value = flattenModules(response.data)
    } else {
      ElMessage.error(response.message || '获取模块列表失败')
    }
  } catch (error) {
    console.error('获取模块列表错误:', error)
    ElMessage.error('获取模块列表时发生错误')
  } finally {
    loading.value = false
  }
}

// 将树形模块结构扁平化
const flattenModules = (moduleTree, result = []) => {
  moduleTree.forEach(module => {
    result.push({
      id: module.id,
      name: module.name,
      parentId: module.parentId
    })
    
    if (module.children && module.children.length > 0) {
      flattenModules(module.children, result)
    }
  })
  
  return result
}

// 获取测试用例列表
const fetchTestCases = async () => {
  if (!selectedProjectId.value) return
  
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      projectId: selectedProjectId.value,
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

const createTestCase = () => {
  router.push(`/testcases/create?projectId=${selectedProjectId.value}`)
}

const exportTestCases = () => {
  ElMessage.info('导出功能正在开发中')
}

const goToAIGenerate = () => {
  router.push(`/ai-generate?projectId=${selectedProjectId.value}`)
}

const goToModuleDesign = () => {
  router.push(`/modules?projectId=${selectedProjectId.value}`)
}

// 日期格式化函数
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 组件挂载时加载数据
onMounted(() => {
  fetchProjects()
})

// 监听路由参数变化，当URL中的projectId变化时重新加载数据
watch(
  () => route.query.projectId,
  (newProjectId) => {
    if (newProjectId) {
      selectedProjectId.value = newProjectId
      fetchProjectInfo()
      fetchModules()
      fetchTestCases()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.test-case-management {
  width: 100%;
}

.project-selection-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.project-selection-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.project-selection-card h2 {
  margin-bottom: 15px;
  color: #303133;
}

.project-selector {
  display: flex;
  justify-content: center;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.loading-container {
  width: 100%;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.no-project-selected {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.testcase-content {
  margin-top: 20px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.content-header h2 {
  margin: 0;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-section {
  width: 100%;
  display: flex;
  justify-content: center;
}

.search-input {
  width: 100%;
  max-width: 500px;
}

.filter-section {
  width: 100%;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 测试用例详情样式 */
.test-case-detail {
  padding: 10px;
}

.detail-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.detail-header h3 {
  margin: 0 0 10px 0;
}

.detail-meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.section-content {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  min-height: 50px;
}
</style>

<style>
/* 全局样式，防止 ResizeObserver 警告显示 */
.el-overlay-dialog {
  z-index: 2000;
}

/* 隐藏 ResizeObserver 警告 */
.el-message-box__wrapper {
  z-index: 2001;
}

/* 确保表格内容不会导致页面抖动 */
.el-table__body-wrapper {
  overflow-y: auto;
  overflow-x: hidden;
}
</style>