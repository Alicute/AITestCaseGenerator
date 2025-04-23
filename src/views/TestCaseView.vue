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
          <!-- <h2>{{ projectInfo.name || '项目' }} 的测试用例</h2> -->
          <div class="header-actions">
            <el-button type="primary" @click="createTestCase">新建测试用例</el-button>
            <el-button type="success" @click="goToAIGenerate">AI生成测试用例</el-button>
            <el-button @click="exportTestCases">导出</el-button>
            <el-button @click="goToModuleDesign">查看模块设计</el-button>
            <el-upload
              class="upload-demo"
              action="#"
              :auto-upload="false"
              :show-file-list="false"
              accept=".json"
              @change="handleFileChange"
            >
              <el-button type="primary">导入JSON</el-button>
            </el-upload>
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
                      <el-select v-model="selectedModuleId" placeholder="选择模块" clearable @change="handleModuleChange">
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
                        <el-option label="高" value="P0" />
                        <el-option label="中" value="P1" />
                        <el-option label="低" value="P3" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="类型:">
                      <el-select v-model="filters.type" placeholder="选择类型" clearable @change="applyFilters">
                        <el-option label="功能测试" value="功能测试" />
                        <el-option label="性能测试" value="性能测试" />
                        <el-option label="安全测试" value="安全测试" />
                        <el-option label="其他" value="其他" />
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
          <div class="table-wrapper">
            <table id="testCaseTable">
              <thead>
                <tr>
                  <th>模块</th>
                  <th>编号</th>
                  <th>标题</th>
                  <th>维护人</th>
                  <th>用例类型</th>
                  <th>重要程度</th>
                  <th>测试类型</th>
                  <th>预估工时</th>
                  <th>剩余工时</th>
                  <th>关联工作项</th>
                  <th>前置条件</th>
                  <th>步骤描述</th>
                  <th>预期结果</th>
                  <th>关注人</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="testCase in filteredTestCases" :key="testCase.id">
                  <td>{{ testCase.module }}</td>
                  <td>{{ testCase.id }}</td>
                  <td>{{ testCase.title }}</td>
                  <td>{{ testCase.maintainer }}</td>
                  <td>
                    <el-tag v-if="testCase.type === '功能测试'" type="primary">功能测试</el-tag>
                    <el-tag v-else-if="testCase.type === '性能测试'" type="warning">性能测试</el-tag>
                    <el-tag v-else-if="testCase.type === '安全测试'" type="danger">安全测试</el-tag>
                    <el-tag v-else type="info">其他</el-tag>
                  </td>
                  <td>
                    <el-tag v-if="testCase.priority === 'P0'" type="danger">高</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P1'" type="danger">高</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P2'" type="warning">中</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P3'" type="success">低</el-tag>
                    <el-tag v-else type="info">未设置</el-tag>
                  </td>
                  <td>{{ testCase.testType }}</td>
                  <td>{{ testCase.estimatedHours }}</td>
                  <td>{{ testCase.remainingHours }}</td>
                  <td>{{ testCase.relatedItems }}</td>
                  <td>{{ testCase.preconditions }}</td>
                  <td>{{ testCase.steps }}</td>
                  <td>{{ testCase.expectedResults }}</td>
                  <td>{{ testCase.followers }}</td>
                  <td>{{ testCase.notes }}</td>
                </tr>
              </tbody>
            </table>
          </div>

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
                <el-tag v-if="currentTestCase.priority === 'P0'" type="danger">高</el-tag>
                <el-tag v-else-if="currentTestCase.priority === 'P1'" type="danger">高</el-tag>
                <el-tag v-else-if="currentTestCase.priority === 'P2'" type="warning">中</el-tag>
                <el-tag v-else-if="currentTestCase.priority === 'P3'" type="success">低</el-tag>
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
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import api from '@/api'
import { useSelectionStore } from '@/stores/selection'
import * as XLSX from 'xlsx'

const router = useRouter()

const selectionStore = useSelectionStore()

// 项目选择相关
const selectedProjectId = computed({
  get: () => selectionStore.selectedProjectId,
  set: (value) => {
    if (value) {
      const project = projectsList.value.find(p => p.id === value)
      if (project) {
        selectionStore.setSelectedProject(project)
      }
    }
  }
})

const projectsList = ref([])
const projectInfo = ref({})

// 状态变量
const loading = ref(true)
const testCases = ref([])
const modules = ref([])
const searchQuery = ref('')
const selectedRows = ref([])
const selectedModuleId = ref(null)

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
const handleProjectChange = async (projectId) => {
  if (projectId) {
    loading.value = true
    try {
      const project = projectsList.value.find(p => p.id === projectId)
      if (project) {
        selectionStore.setSelectedProject(project)
        await fetchProjectInfo()
        await fetchModules(projectId)
        await fetchTestCases()
      }
    } catch (error) {
      console.error('项目切换错误:', error)
      ElMessage.error('加载项目数据时发生错误')
    } finally {
      loading.value = false
    }
  } else {
    selectionStore.clearSelection()
    testCases.value = []
    modules.value = []
    projectInfo.value = {}
  }
}

// 跳转到创建项目页面
const goToCreateProject = () => {
  router.push('/projects')
}

// 获取模块列表
const fetchModules = async (projectId) => {
  if (!projectId) return
  
  loading.value = true
  try {
    const response = await api.module.getModuleTree(projectId)
    
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
  if (!selectedProjectId.value) {
    testCases.value = []
    pagination.value.total = 0
    return
  }
  
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
    
    const response = await api.testCase.getTestCases(params)
    
    if (response.success) {
      testCases.value = response.data.map(testCase => ({
        ...testCase,
        moduleName: modules.value.find(m => m.id === testCase.moduleId)?.name || '未知模块'
      }))
      pagination.value.total = response.total || response.data.length
    } else {
      ElMessage.error(response.message || '获取测试用例失败')
      testCases.value = []
      pagination.value.total = 0
    }
  } catch (error) {
    console.error('获取测试用例错误:', error)
    ElMessage.error('获取测试用例时发生错误')
    testCases.value = []
    pagination.value.total = 0
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
  if (testCases.value.length === 0) {
    ElMessage.warning('没有可导出的测试用例')
    return
  }

  try {
    // 准备表头
    const headers = [
      '模块', '编号', '标题', '维护人', '用例类型', 
      '重要程度', '测试类型', '预估工时', '剩余工时', 
      '关联工作项', '前置条件', '步骤描述', '预期结果', 
      '关注人', '备注'
    ]

    // 准备数据行
    const rows = testCases.value.map(testCase => [
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
    ])

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // 组合所有行：空行 + 表头 + 数据行
    const allRows = [new Array(headers.length).fill(''), headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(allRows)

    // 设置列宽
    const colWidths = [
      { wch: 10 },  // 模块
      { wch: 8 },   // 编号
      { wch: 30 },  // 标题
      { wch: 10 },  // 维护人
      { wch: 10 },  // 用例类型
      { wch: 10 },  // 重要程度
      { wch: 10 },  // 测试类型
      { wch: 10 },  // 预估工时
      { wch: 10 },  // 剩余工时
      { wch: 15 },  // 关联工作项
      { wch: 30 },  // 前置条件
      { wch: 40 },  // 步骤描述
      { wch: 40 },  // 预期结果
      { wch: 10 },  // 关注人
      { wch: 20 }   // 备注
    ]
    ws['!cols'] = colWidths

    // 设置标题行样式（第二行）
    const headerStyle = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3498DB" } },
      alignment: { horizontal: "center", vertical: "center" }
    }

    // 将样式应用到标题行（第二行）
    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = XLSX.utils.encode_cell({ r: 1, c: C }) // 第二行
      if (!ws[cell]) continue
      ws[cell].s = headerStyle
    }

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '测试用例')

    // 生成文件名
    const fileName = `测试用例_${new Date().toISOString().split('T')[0]}.xlsx`

    // 导出文件
    XLSX.writeFile(wb, fileName)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出Excel错误:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const goToAIGenerate = () => {
  router.push(`/ai-generate?projectId=${selectedProjectId.value}`)
}

const goToModuleDesign = () => {
  router.push(`/module-design?projectId=${selectedProjectId.value}`)
}

// 添加文件处理相关的方法
const handleFileChange = async (file) => {
  if (!file.raw) return
  
  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result)
        if (jsonData.testCases && Array.isArray(jsonData.testCases)) {
          // 处理导入的测试用例数据
          const importedTestCases = jsonData.testCases.map(testCase => ({
            id: testCase.id || '',
            module: testCase.module,
            title: testCase.title,
            maintainer: testCase.maintainer || '',
            type: testCase.type || '功能测试', // 确保有默认值
            priority: testCase.priority || 'P1', // 确保有默认值
            testType: testCase.testType || '',
            estimatedHours: testCase.estimatedHours || '',
            remainingHours: testCase.remainingHours || '',
            relatedItems: testCase.relatedItems || '',
            preconditions: testCase.preconditions || '',
            steps: testCase.steps || '',
            expectedResults: testCase.expectedResults || '',
            followers: testCase.followers || '',
            notes: testCase.notes || ''
          }))

          // 将导入的测试用例添加到现有列表中
          testCases.value = [...testCases.value, ...importedTestCases]
          ElMessage.success(`成功加载 ${importedTestCases.length} 个测试用例`)
        } else {
          ElMessage.error('文件格式不正确，请确保包含 testCases 数组')
        }
      } catch (error) {
        console.error('解析JSON文件错误:', error)
        ElMessage.error('解析JSON文件失败，请检查文件格式')
      }
    }
    reader.readAsText(file.raw)
  } catch (error) {
    console.error('读取文件错误:', error)
    ElMessage.error('读取文件失败')
  }
}

// 生命周期钩子
onMounted(async () => {
  await fetchProjects()
  if (selectedProjectId.value) {
    await handleProjectChange(selectedProjectId.value)
  }
})

// 监听项目选择变化
watch(selectedProjectId, (newValue) => {
  if (newValue) {
    handleProjectChange(newValue)
  }
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.test-case-management {
  padding: 20px;
}

.project-selection-container {
  margin-bottom: 20px;
}

.project-selection-card {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.project-selection-card h2 {
  margin-bottom: 15px;
  color: #303133;
}

.project-selector {
  display: flex;
  align-items: center;
}

.loading-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.no-project-selected {
  padding: 40px;
  text-align: center;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.testcase-content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.content-header {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-section {
  width: 100%;
}

.search-input {
  width: 100%;
}

.filter-section {
  width: 100%;
}

.filter-form {
  width: 100%;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.test-case-detail {
  padding: 20px;
}

.detail-header {
  margin-bottom: 20px;
}

.detail-header h3 {
  margin-bottom: 10px;
  color: #303133;
}

.detail-meta {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.section-content {
  color: #606266;
  line-height: 1.6;
}

/* 添加表格相关样式 */
.table-wrapper {
  margin: 15px 0;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
}

th {
  background-color: #3498db;
  color: white;
  position: sticky;
  top: 0;
  font-weight: normal;
  font-size: 12px;
}

tr:hover {
  background-color: #f1f1f1;
}

/* 设置列宽 */
th:nth-child(1) { width: 5%; }  /* 模块 */
th:nth-child(2) { width: 3%; }  /* 编号 */
th:nth-child(3) { width: 10%; } /* 标题 */
th:nth-child(4) { width: 4%; }  /* 维护人 */
th:nth-child(5) { width: 5%; }  /* 用例类型 */
th:nth-child(6) { width: 4%; }  /* 重要程度 */
th:nth-child(7) { width: 4%; }  /* 测试类型 */
th:nth-child(8) { width: 4%; }  /* 预估工时 */
th:nth-child(9) { width: 4%; }  /* 剩余工时 */
th:nth-child(10) { width: 4%; } /* 关联工作项 */
th:nth-child(11) { width: 13%; } /* 前置条件 */
th:nth-child(12) { width: 17%; } /* 步骤描述 */
th:nth-child(13) { width: 17%; } /* 预期结果 */
th:nth-child(14) { width: 3%; } /* 关注人 */
th:nth-child(15) { width: 3%; } /* 备注 */

/* 为宽列添加特殊样式 */
td:nth-child(11), 
td:nth-child(12), 
td:nth-child(13) {
  white-space: pre-line;
  max-height: 200px;
  line-height: 1.4;
}

.upload-demo {
  display: inline-block;
}
</style>