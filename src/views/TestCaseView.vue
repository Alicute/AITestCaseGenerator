<template>
  <main-layout>
    <div class="main-content">
      <!-- 项目选择区域 -->
      <div class="project-selection" :class="{ 'centered': !selectedProjectId }">
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

      <!-- 加载状态显示 -->
      <div v-if="loading && !selectedProjectId" class="loading-container">
        <div class="loading-content">
          <p class="loading-text">未选择任何项目</p>
          <el-skeleton :rows="5" animated>
            <template #template>
              <el-skeleton-item variant="text" style="width: 30%" />
              <el-skeleton-item variant="text" style="width: 50%" />
              <el-skeleton-item variant="text" style="width: 40%" />
            </template>
          </el-skeleton>

        </div>
      </div>

      <!-- 无项目选择时的显示 -->
      <div v-else-if="!selectedProjectId" class="no-project-selected">
        <el-empty description="请选择一个项目查看测试用例">
          <el-button type="primary" @click="goToCreateProject">创建新项目</el-button>
        </el-empty>
      </div>

      <!-- 选择项目后的内容区域 -->
      <div v-else class="content-area">
        <!-- 操作按钮区域 -->
        <div class="action-buttons">
          <el-button type="primary" @click="createTestCase">新建测试用例</el-button>
          <el-button type="success" @click="goToAIGenerate">AI生成测试用例</el-button>
          <el-button @click="exportTestCases">导出</el-button>
          <el-button @click="goToModuleDesign">查看模块设计</el-button>
          <el-button @click="openLoadJsonDialog">加载JSON</el-button>
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
          <el-button type="primary" @click="saveSelectedTestCases" :disabled="!hasSelectedItems">
            保存选中项
          </el-button>
          <el-button type="danger" @click="deleteSelectedTestCases" :disabled="!hasSelectedItems">
            删除选中项
          </el-button>
        </div>

        <!-- 过滤器区域 -->
        <div class="filter-area">
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

          <!-- 过滤器 -->
          <div class="filter-section">
            <el-form :model="filters" label-width="80px" class="filter-form">
              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="模块:">
                    <el-select
                      v-model="selectedModuleId"
                      placeholder="选择模块"
                      clearable
                      @change="handleModuleChange"
                    >
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
                    <el-select
                      v-model="filters.priority"
                      placeholder="选择优先级"
                      clearable
                      @change="applyFilters"
                    >
                      <el-option label="高" value="P0" />
                      <el-option label="中" value="P1" />
                      <el-option label="低" value="P3" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="类型:">
                    <el-select
                      v-model="filters.type"
                      placeholder="选择类型"
                      clearable
                      @change="applyFilters"
                    >
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
                    <el-select
                      v-model="filters.status"
                      placeholder="选择状态"
                      clearable
                      @change="applyFilters"
                    >
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

        <!-- 表格区域 -->
        <div class="table-area">
          <div class="table-wrapper">
            <table id="testCaseTable">
              <thead>
                <tr>
                  <th style="width: 3%;">
                    <el-checkbox v-model="allSelected" @change="handleSelectAll" />
                  </th>
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
                <tr v-for="testCase in filteredTestCases" :key="testCase.id" :class="{ 'unsaved': !testCase.id }">
                  <td>
                    <el-checkbox v-model="testCase.selected" @change="handleItemSelectChange" />
                  </td>
                  <td>{{ testCase.module }}</td>
                  <td>{{ testCase.id }}</td>
                  <td>{{ testCase.title }}</td>
                  <td>{{ testCase.maintainer }}</td>
                  <td>
                    <el-tag v-if="testCase.type === '功能测试'" type="primary">功能测试</el-tag>
                    <el-tag v-else-if="testCase.type === '性能测试'" type="warning"
                      >性能测试</el-tag
                    >
                    <el-tag v-else-if="testCase.type === '安全测试'" type="danger">安全测试</el-tag>
                    <el-tag v-else type="info">其他</el-tag>
                  </td>
                  <td>
                    <el-tag v-if="testCase.priority === 'P0'" type="danger">高</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P1'" type="danger">高</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P2'" type="warning">中</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P3'" type="success">低</el-tag>
                    <el-tag v-else type="info"></el-tag>
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
        </div>
      </div>

      <!-- 加载 JSON 对话框 -->
      <el-dialog v-model="loadJsonDialogVisible" title="加载 JSON" width="600px">
        <el-input
          type="textarea"
          v-model="jsonInput"
          placeholder="请粘贴 JSON 内容"
          rows="10"
        />
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="loadJson">加载</el-button>
            <el-button @click="loadJsonDialogVisible = false">取消</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
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
      const project = projectsList.value.find((p) => p.id === value)
      if (project) {
        selectionStore.setSelectedProject(project)
      }
    }
  }
})

const projectsList = ref([])


// 状态变量
const loading = ref(true)
const testCases = ref([])
const modules = ref([])
const searchQuery = ref('')
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

const allSelected = ref(false)
const hasSelectedItems = computed(() => {
  return testCases.value.some(testCase => testCase.selected)
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


// 处理项目选择变化
const handleProjectChange = async (projectId) => {
  selectedProjectId.value = projectId;
  selectedModuleId.value = null;
  modules.value = [];
  testCases.value = []; // 清空测试用例
  
  if (projectId) {
    await fetchModules(projectId);
    await fetchTestCases(); // 获取新项目的测试用例
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
  moduleTree.forEach((module) => {
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
      // 确保 response.data 是数组
      if (!Array.isArray(response.data)) {
        console.warn('返回的数据格式不正确:', response.data)
        testCases.value = []
        pagination.value.total = 0
        return
      }

      testCases.value = response.data.map((testCase) => ({
        ...testCase,
        moduleName: modules.value.find((m) => m.id === testCase.moduleId)?.name || '未知模块'
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
  // 将测试用例分为两组：导入的和非导入的
  const importedCases = testCases.value.filter(tc => tc.isImported)
  const otherCases = testCases.value.filter(tc => !tc.isImported)
  
  // 返回合并后的数组，导入的测试用例在前
  return [...importedCases, ...otherCases]
})

// 加载 JSON 对话框相关
const loadJsonDialogVisible = ref(false)
const jsonInput = ref('')





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
      '模块',
      '编号',
      '标题',
      '维护人',
      '用例类型',
      '重要程度',
      '测试类型',
      '预估工时',
      '剩余工时',
      '关联工作项',
      '前置条件',
      '步骤描述',
      '预期结果',
      '关注人',
      '备注'
    ]

    // 准备数据行
    const rows = testCases.value.map((testCase) => [
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
      { wch: 10 }, // 模块
      { wch: 8 }, // 编号
      { wch: 30 }, // 标题
      { wch: 10 }, // 维护人
      { wch: 10 }, // 用例类型
      { wch: 10 }, // 重要程度
      { wch: 10 }, // 测试类型
      { wch: 10 }, // 预估工时
      { wch: 10 }, // 剩余工时
      { wch: 15 }, // 关联工作项
      { wch: 30 }, // 前置条件
      { wch: 40 }, // 步骤描述
      { wch: 40 }, // 预期结果
      { wch: 10 }, // 关注人
      { wch: 20 } // 备注
    ]
    ws['!cols'] = colWidths

    // 设置标题行样式（第二行）
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3498DB' } },
      alignment: { horizontal: 'center', vertical: 'center' }
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
  router.push(`/modules?projectId=${selectedProjectId.value}`)
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
          const importedTestCases = jsonData.testCases.map((testCase) => ({
            id: testCase.id || '',
            module: testCase.module,
            title: testCase.title,
            maintainer: testCase.maintainer || '',
            type: testCase.type || '功能测试',
            priority: testCase.priority || 'P1',
            testType: (testCase.testType === '手动' || testCase.testType === '自动') ? testCase.testType : '手动',
            estimatedHours: testCase.estimatedHours || '',
            remainingHours: testCase.remainingHours || '',
            relatedItems: testCase.relatedItems || '',
            preconditions: testCase.preconditions || '',
            steps: testCase.steps || '',
            expectedResults: testCase.expectedResults || '',
            followers: testCase.followers || '',
            notes: testCase.notes || '',
            selected: true, // 默认选中
            isImported: true // 添加标记表示这是导入的测试用例
          }))

          // 将导入的测试用例添加到现有列表的最前面
          testCases.value = [...importedTestCases, ...testCases.value]
          allSelected.value = true // 设置全选状态
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
  
  // 检查是否有项目
  if (projectsList.value.length === 0) {
    selectedProjectId.value = null
    return
  }
  // 如果有项目列表且当前没有选中项目，则自动选中第一个项目
  if (!selectedProjectId.value) {
    selectedProjectId.value = projectsList.value[0].id
  } else {
    await handleProjectChange(selectedProjectId.value)
  }
})

// 监听项目列表变化
watch(projectsList, (newProjects) => {
  if (newProjects.length === 0) {
    // 如果没有项目了，清除选择
    selectionStore.clearSelection()
    testCases.value = []
  }
})

// 监听项目选择变化
watch(selectedProjectId, (newValue) => {
  if (newValue) {
    handleProjectChange(newValue)
  }
})



// 打开加载 JSON 对话框
const openLoadJsonDialog = () => {
  loadJsonDialogVisible.value = true
}

// 加载 JSON 内容
const loadJson = () => {
  try {
    const jsonData = JSON.parse(jsonInput.value)
    if (jsonData.testCases && Array.isArray(jsonData.testCases)) {
      // 处理导入的测试用例数据
      const importedTestCases = jsonData.testCases.map(testCase => ({
        id: testCase.id || '',
        module: testCase.module,
        title: testCase.title,
        maintainer: testCase.maintainer || '',
        type: testCase.type || '功能测试',
        priority: testCase.priority || 'P1',
        testType: (testCase.testType === '手动' || testCase.testType === '自动') ? testCase.testType : '手动',
        estimatedHours: testCase.estimatedHours || '',
        remainingHours: testCase.remainingHours || '',
        relatedItems: testCase.relatedItems || '',
        preconditions: testCase.preconditions || '',
        steps: testCase.steps || '',
        expectedResults: testCase.expectedResults || '',
        followers: testCase.followers || '',
        notes: testCase.notes || '',
        selected: true, // 默认选中
        isImported: true // 添加标记表示这是导入的测试用例
      }))

      // 将导入的测试用例添加到现有列表的最前面
      testCases.value = [...importedTestCases, ...testCases.value]
      allSelected.value = true // 设置全选状态
      ElMessage.success(`成功加载 ${importedTestCases.length} 个测试用例`)
      loadJsonDialogVisible.value = false // 关闭对话框
    } else {
      ElMessage.error('文件格式不正确，请确保包含 testCases 数组')
    }
  } catch (error) {
    console.error('解析JSON内容错误:', error)
    ElMessage.error('解析JSON内容失败，请检查格式')
  }
}

// 处理全选/取消全选
const handleSelectAll = (val) => {
  testCases.value.forEach(testCase => {
    testCase.selected = val
  })
}

// 处理单个项目选择变化
const handleItemSelectChange = () => {
  allSelected.value = testCases.value.every(testCase => testCase.selected)
}

// 保存选中的测试用例
const saveSelectedTestCases = async () => {
  if (!selectedProjectId.value) {
    ElMessage.warning('请先选择一个项目')
    return
  }

  const selectedTestCases = testCases.value.filter(testCase => testCase.selected)
  if (selectedTestCases.length === 0) {
    ElMessage.warning('请选择要保存的测试用例')
    return
  }

  try {
    // 将测试用例分为两组：已存在的和新增的
    const newTestCases = selectedTestCases.filter(testCase => !testCase.id)

    // 处理新增的测试用例
    if (newTestCases.length > 0) {
      // 将模块名称转换为模块ID
      const testCasesWithModuleId = newTestCases.map(testCase => {
        // 尝试精确匹配
        let module = modules.value.find(m => m.name === testCase.module)
        
        // 如果精确匹配失败，尝试模糊匹配（去掉空格和特殊字符）
        if (!module) {
          const normalizedModuleName = testCase.module.replace(/\s+/g, '').toLowerCase()
          module = modules.value.find(m => 
            m.name.replace(/\s+/g, '').toLowerCase() === normalizedModuleName
          )
        }

        if (!module) {
          console.warn(`未找到模块: ${testCase.module}`, {
            testCase,
            availableModules: modules.value.map(m => m.name)
          })
        }

        return {
          ...testCase,
          moduleId: module ? module.id : null,
          projectId: selectedProjectId.value,
          status: 'waiting',
          type: testCase.type || '功能测试',
          priority: testCase.priority || 'P1'
        }
      })

      // 检查是否有未找到对应模块的测试用例
      const invalidTestCases = testCasesWithModuleId.filter(tc => !tc.moduleId)
      if (invalidTestCases.length > 0) {
        const invalidModuleNames = [...new Set(invalidTestCases.map(tc => tc.module))]
        const availableModules = modules.value.map(m => m.name)
        ElMessage.warning({
          message: `以下模块未找到：${invalidModuleNames.join(', ')}`,
          description: `可用模块：${availableModules.join(', ')}`
        })
        return
      }

      const response = await api.testCase.batchCreateTestCases({
        projectId: selectedProjectId.value,
        testCases: testCasesWithModuleId
      })

      if (!response.success) {
        throw new Error(response.message || '保存测试用例失败')
      }
    }

    // 从列表中移除已保存的测试用例
    testCases.value = testCases.value.filter(testCase => !testCase.selected)
    allSelected.value = false

    ElMessage.success(`成功保存 ${selectedTestCases.length} 个测试用例`)
    // 重新加载测试用例列表
    await fetchTestCases()
  } catch (error) {
    console.error('保存测试用例错误:', error)
    ElMessage.error(error.message || '保存测试用例时发生错误')
  }
}

const handleModuleChange = async (moduleId) => {
  selectedModuleId.value = moduleId;
  testCases.value = []; // 清空测试用例
  
  if (moduleId) {
    await fetchTestCases(); // 获取新模块的测试用例
  }
}

// 在 script setup 部分添加删除选中项的方法
const deleteSelectedTestCases = async () => {
  const selectedTestCases = testCases.value.filter(testCase => testCase.selected)
  if (selectedTestCases.length === 0) {
    ElMessage.warning('请选择要删除的测试用例')
    return
  }

  // 区分已保存和未保存的测试用例
  const savedTestCases = selectedTestCases.filter(testCase => testCase.id)

  try {
    if (savedTestCases.length > 0) {
      // 删除已保存的测试用例
      const response = await api.testCase.batchDeleteTestCases({
        testCaseIds: savedTestCases.map(testCase => testCase.id)
      })

      if (!response.success) {
        throw new Error(response.message || '删除测试用例失败')
      }
    }

    // 从列表中移除所有选中的测试用例
    testCases.value = testCases.value.filter(testCase => !testCase.selected)
    allSelected.value = false

    ElMessage.success(`成功删除 ${selectedTestCases.length} 个测试用例`)
  } catch (error) {
    console.error('删除测试用例错误:', error)
    ElMessage.error(error.message || '删除测试用例时发生错误')
  }
}
</script>

<style scoped>
.main-content {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-selection {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.project-selection.centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  flex-direction: row;
  gap: 10px;
  margin: 0;
}

.project-selection.centered .el-select {
  width: 300px;
}

.project-selection.centered .el-button {
  margin-left: 10px;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  text-align: center;
  width: 100%;
}

.loading-text {
  margin-top: 20px;
  color: #606266;
  font-size: 24px;
  font-weight: 500;
}

.no-project-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-area {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.search-section {
  margin-bottom: 20px;
}

.filter-section {
  width: 100%;
}

.filter-form {
  width: 100%;
}

.table-area {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  overflow-y: auto;
  margin: 15px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th,
td {
  padding: 8px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  font-size: 12px;
  line-height: 1.4;
  height: auto;
  min-height: 40px;
  vertical-align: top;
}

th {
  background-color: #3498db;
  color: white;
  position: sticky;
  top: 0;
  font-weight: normal;
  font-size: 12px;
  white-space: normal;  /* 改为 normal */
  word-break: break-word;  /* 添加这行 */
  padding: 8px 4px;  /* 可以调整内边距 */
}

tr:hover {
  background-color: #f1f1f1;
}

/* 设置列宽 */
th:nth-child(1) { width: 3%; } /* 复选框 */
th:nth-child(2) { width: 5%; } /* 模块 */
th:nth-child(3) { width: 3%; } /* 编号 */
th:nth-child(4) { width: 10%; } /* 标题 */
th:nth-child(5) { width: 3%; } /* 维护人 */
th:nth-child(6) { width: 6%; } /* 用例类型 */
th:nth-child(7) { width: 4%; } /* 重要程度 */
th:nth-child(8) { width: 4%; } /* 测试类型 */
th:nth-child(9) { width: 4%; } /* 预估工时 */
th:nth-child(10) { width: 4%; } /* 剩余工时 */
th:nth-child(11) { width: 4%; } /* 关联工作项 */
th:nth-child(12) { width: 13%; } /* 前置条件 */
th:nth-child(13) { width: 17%; } /* 步骤描述 */
th:nth-child(14) { width: 17%; } /* 预期结果 */
th:nth-child(15) { width: 3%; } /* 关注人 */
th:nth-child(16) { width: 3%; } /* 备注 */

/* 为长文本列添加特殊样式 */
td:nth-child(4), /* 标题 */
td:nth-child(12), /* 前置条件 */
td:nth-child(13), /* 步骤描述 */
td:nth-child(14), /* 预期结果 */
td:nth-child(16) { /* 备注 */
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 为短文本列添加样式 */
td:nth-child(1), /* 复选框 */
td:nth-child(2), /* 模块 */
td:nth-child(3), /* 编号 */
td:nth-child(5), /* 维护人 */
td:nth-child(6), /* 用例类型 */
td:nth-child(7), /* 重要程度 */
td:nth-child(8), /* 测试类型 */
td:nth-child(9), /* 预估工时 */
td:nth-child(10), /* 剩余工时 */
td:nth-child(11), /* 关联工作项 */
td:nth-child(15) { /* 关注人 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.upload-demo {
  display: inline-block;
}

/* 为未保存的测试用例添加特殊背景色 */
tr.unsaved {
  background-color: #fff8e1 !important; /* 浅黄色背景 */
}

tr.unsaved:hover {
  background-color: #ffecb3 !important; /* 悬停时稍深的黄色 */
}

/* 修改表格行样式 */
tr {
  transition: background-color 0.3s ease;
}
</style>
