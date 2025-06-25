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
          <el-button @click="exportTestCases_zentao">导出禅道</el-button>
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
              @keyup.enter="searchTestCases"
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
                    <el-cascader
                      v-model="selectedModulePath"
                      :options="moduleOptions"
                      :props="{ 
                        checkStrictly: false,
                        emitPath: true,
                        value: 'value',
                        label: 'label',
                        children: 'children'
                      }"
                      placeholder="选择模块"
                      clearable
                      @change="handleModuleChange"
                      style="width: 100%"
                    />
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
                      <el-option label="配置相关" value="配置相关" />
                      <el-option label="安装部署" value="安装部署" />
                      <el-option label="接口测试" value="接口测试" />
                      <el-option label="安全相关" value="安全相关" />
                      <el-option label="兼容性测试" value="兼容性测试" />
                      <el-option label="UI测试" value="UI测试" />
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
                  <th style="width: 4%;">编号</th>
                  <th>标题</th>
                  <th>维护人</th>
                  <th>用例类型</th>
                  <th>重要程度</th>
                  <th>测试类型</th>
                  <th>前置条件</th>
                  <th>步骤描述</th>
                  <th>预期结果</th>
                  <th>预估工时</th>
                  <th>剩余工时</th>
                  <th>关联工作项</th>
                  <th>关注人</th>
                  <th>备注</th>
                  <th style="width: 90px;">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="testCase in filteredTestCases" :key="testCase.id" :class="{ 'unsaved': !testCase.id }">
                  <td>
                    <el-checkbox v-model="testCase.selected" @change="handleItemSelectChange" />
                  </td>
                  <td>{{ getModulePath(testCase.moduleId) }}</td>
                  <td></td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.title" size="small" type="textarea" autosize placeholder="请输入标题" />
                  </td>
                  <td v-else>{{ testCase.title }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.maintainer" size="small" type="textarea" placeholder="维护人" />
                  </td>
                  <td v-else>{{ testCase.maintainer }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-select v-model="editCache.type" size="small" style="min-width: 120px;">
                      <el-option label="功能测试" value="功能测试" />
                    <el-option label="性能测试" value="性能测试" />
                    <el-option label="配置相关" value="配置相关" />
                    <el-option label="安装部署" value="安装部署" />
                    <el-option label="接口测试" value="接口测试" />
                    <el-option label="安全相关" value="安全相关" />
                    <el-option label="兼容性测试" value="兼容性测试" />
                    <el-option label="UI测试" value="UI测试" />
                    <el-option label="其他" value="其他" />
                    </el-select>
                  </td>
                  <td v-else>
                    <el-tag v-if="testCase.type === '功能测试'" type="primary">功能测试</el-tag>
                    <el-tag v-else-if="testCase.type === '性能测试'" type="warning">性能测试</el-tag>
                    <el-tag v-else-if="testCase.type === '安全测试'" type="danger">安全测试</el-tag>
                    <el-tag v-else-if="testCase.type === '边界测试'" type="success">边界测试</el-tag>
                    <el-tag v-else-if="testCase.type === '异常测试'" type="danger">异常测试</el-tag>
                    <el-tag v-else-if="testCase.type === 'UI测试'" type="info">UI测试</el-tag>
                    <el-tag v-else type="info">其他</el-tag>
                  </td>
                  <td v-if="editingRowId === testCase.id">
                    <el-select v-model="editCache.priority" size="small" style="min-width: 120px;">
                      <el-option label="P1" value="P1" />
                      <el-option label="P2" value="P2" />
                      <el-option label="P3" value="P3" />
                      <el-option label="P4" value="P4" />
                    </el-select>
                  </td>
                  <td v-else>
                    <el-tag v-if="testCase.priority === 'P1'" type="danger">{{ testCase.priority }}</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P2'" type="warning">{{ testCase.priority }}</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P3'" type="success">{{ testCase.priority }}</el-tag>
                    <el-tag v-else-if="testCase.priority === 'P4'" type="info">{{ testCase.priority }}</el-tag>
                    <el-tag v-else type="info">{{ testCase.priority }}</el-tag>
                  </td>
                  <td v-if="editingRowId === testCase.id">
                    <el-select v-model="editCache.testType" size="small" style="min-width: 120px;">
                      <el-option label="手动" value="手动" />
                      <el-option label="自动" value="自动" />
                    </el-select>
                  </td>
                  <td v-else>{{ testCase.testType }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.preconditions" size="small" type="textarea" autosize placeholder="前置条件" />
                  </td>
                  <td v-else>{{ testCase.preconditions }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.steps" size="small" type="textarea" autosize placeholder="步骤描述" />
                  </td>
                  <td v-else>{{ testCase.steps }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.expectedResults" size="small" type="textarea" autosize placeholder="预期结果" />
                  </td>
                  <td v-else>{{ testCase.expectedResults }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.estimatedHours" size="small" type="textarea" autosize placeholder="预估工时" />
                  </td>
                  <td v-else>{{ testCase.estimatedHours }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.remainingHours" size="small" type="textarea" autosize placeholder="剩余工时" />
                  </td>
                  <td v-else>{{ testCase.remainingHours }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.relatedItems" size="small" type="textarea" autosize placeholder="关联工作项" />
                  </td>
                  <td v-else>{{ testCase.relatedItems }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.followers" size="small" type="textarea" autosize placeholder="关注人" />
                  </td>
                  <td v-else>{{ testCase.followers }}</td>
                  <td v-if="editingRowId === testCase.id">
                    <el-input v-model="editCache.notes" size="small" type="textarea" autosize placeholder="备注" />
                  </td>
                  <td v-else>{{ testCase.notes }}</td>
                  <td>
                    <template v-if="editingRowId === testCase.id">
                      <div class="edit-actions">
                        <el-button size="small" type="primary" @click="saveEdit(testCase)">保存</el-button>
                        <el-button size="small" @click="cancelEdit">取消</el-button>
                      </div>
                    </template>
                    <template v-else>
                      <div class="edit-actions">
                        <el-button size="small" type="primary" @click="startEdit(testCase)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteSingleTestCase(testCase)">删除</el-button>
                      </div>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.current"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100,500,1000]"
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
          rows="20"
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
import { ref, computed, onMounted, watch, reactive } from 'vue'
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
  if (!projectId) return
  
  try {
    // 先清空当前数据
    selectedModuleId.value = null
    modules.value = []
    testCases.value = []
    
    // 更新项目选择
    const project = projectsList.value.find(p => p.id === projectId)
    if (project) {
      selectionStore.setSelectedProject(project)
      await fetchModules(projectId)
      await fetchTestCases()
    }
  } catch (error) {
    ElMessage.error('切换项目时发生错误')
  }
}

// 跳转到创建项目页面
const goToCreateProject = () => {
  router.push('/projects')
}

// 在 script setup 部分添加新的响应式变量
const moduleOptions = ref([])
const selectedModulePath = ref([])

// 修改获取模块列表方法
const fetchModules = async (projectId) => {
  if (!projectId) return

  loading.value = true
  try {
    const response = await api.module.getModuleTree(projectId)

    if (response.success) {
      // 直接使用后端返回的树形结构
      moduleOptions.value = response.data.map(module => ({
        value: module.id,
        label: module.name,
        children: module.children?.map(child => ({
          value: child.id,
          label: child.name,
          children: child.children?.map(grandChild => ({
            value: grandChild.id,
            label: grandChild.name
          })) || []
        })) || []
      }))
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

// 获取测试用例列表
const fetchTestCases = async () => {
  if (!selectedProjectId.value) {
    testCases.value = []
    pagination.value.total = 0
    return
  }

  loading.value = true
  try {
    const params = {
      page: pagination.value.current,
      limit: pagination.value.pageSize,
      projectId: selectedProjectId.value
    }

    if (selectedModuleId.value) {
      params.moduleId = selectedModuleId.value
    }
    if (filters.value.priority) {
      params.priority = filters.value.priority
    }
    if (filters.value.type) {
      params.type = filters.value.type
    }
    if (filters.value.status) {
      params.status = filters.value.status
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await api.testCase.getTestCases(params)

    if (response.success) {
      if (!Array.isArray(response.data)) {
        testCases.value = []
        pagination.value.total = 0
        return
      }

      testCases.value = response.data.map((testCase) => ({
        ...testCase,
        moduleId: testCase.moduleId // 确保保留 moduleId
      }))
      pagination.value.total = response.total || response.data.length
    } else {
      ElMessage.error(response.message || '获取测试用例失败')
      testCases.value = []
      pagination.value.total = 0
    }
  } catch (error) {
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
      getModulePath(testCase.moduleId), // 使用完整的模块路径
      "",
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
      { wch: 20 }, // 模块 - 增加宽度以适应完整路径
      { wch: 8 }, // 编号
      { wch: 30 }, // 标题
      { wch: 10 }, // 维护人
      { wch: 10 }, // 用例类型
      { wch: 10 }, // 重要程度
      { wch: 10 }, // 测试类型
      { wch: 10 }, // 预估工时
      { wch: 10 }, // 剩余工时
      { wch: 15 }, // 关联工作项
      { wch: 15 }, // 前置条件
      { wch: 15 }, // 步骤描述
      { wch: 15 }, // 预期结果
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

const exportTestCases_zentao = () => {
  if (testCases.value.length === 0) {
    ElMessage.warning('没有可导出的测试用例')
    return
  }

  try {
    // 准备表头
    const headers = [
      '所属模块',
      '用例标题',
      '前置条件',
      '步骤',
      '预期',
      '优先级',
      '关键词',
      '用例类型',
      '适用阶段',
      ' ',
      '类型可选值列表',
      '阶段可选值列表',
    ]

    // 准备数据行
    // 准备数据行
    const rows = testCases.value.map((testCase) => {
      // 如果用例类型为“UI测试”，导出时改成“其他”
      const typeValue = testCase.type === 'UI测试' ? '其他' : testCase.type

      return [
        '/' + getModulePath(testCase.moduleId), // 使用完整的模块路径
        testCase.title,
        testCase.preconditions,
        testCase.steps,
        testCase.expectedResults,

        testCase.priority,
        ' ',
        typeValue,          // ← 替换这里
        ' ',
        ' ',
        ' ',
        ' ',
      ]
    })

    // 创建工作簿
    const wb = XLSX.utils.book_new()

    // 组合所有行：空行 + 表头 + 数据行
    const allRows = [ headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(allRows)

    // 设置列宽
    const colWidths = [
      { wch: 20 }, // 所属模块
      { wch: 30 }, // 用例标题
      { wch: 20 }, // 前置条件
      { wch: 20 }, // 步骤
      { wch: 20 }, // 预期
      { wch: 10 }, // 优先级
      { wch: 10 }, // 关键词
      { wch: 10 }, // 用例类型
      { wch: 10 }, // 适用阶段
      { wch: 20 }, // 类型可选值列表
      { wch: 20 }, // 阶段可选值列表

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
    const fileName = `测试用例_${new Date().toISOString().split('T')[0]}.csv`

    // 导出文件
    XLSX.writeFile(wb, fileName,{bookType:'csv'})
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
  try {
    await fetchProjects()
    
    // 检查是否有项目
    if (projectsList.value.length === 0) {
      selectedProjectId.value = null
      return
    }
    
    // 如果有项目列表且当前没有选中项目，则自动选中第一个项目
    if (!selectedProjectId.value) {
      selectedProjectId.value = projectsList.value[0].id
      await handleProjectChange(projectsList.value[0].id)
    } else {
      // 如果store中有选中的项目，验证它是否有效
      const validProject = projectsList.value.find(p => p.id === selectedProjectId.value)
      if (validProject) {
        await handleProjectChange(selectedProjectId.value)
      } else {
        // 如果store中的项目无效，选择第一个项目
        selectedProjectId.value = projectsList.value[0].id
        await handleProjectChange(projectsList.value[0].id)
      }
    }
  } catch (error) {
    ElMessage.error('初始化页面时发生错误')
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


/**
 * 在一个树形结构的模块选项中，根据模块名称递归查找模块ID。
 * @param {Array} moduleOptions - 模块选项的树形数组，每个选项应有 label, value, 和可选的 children 属性。
 * @param {string} moduleName - 需要查找的模块名称。
 * @returns {number|string|null} - 匹配到的模块ID；如果未找到则返回 null。
 */
 const findModuleIdByName = (moduleOptions, moduleName) => {
  // 遍历当前层级的模块
  for (const option of moduleOptions) {
    // 如果名称匹配，返回当前模块的ID (value)
    if (option.label === moduleName) {
      return option.value;
    }
    // 如果有子模块，则递归进入子模块中查找
    if (option.children && option.children.length > 0) {
      const foundId = findModuleIdByName(option.children, moduleName);
      // 如果在子模块中找到了，立即返回结果
      if (foundId) {
        return foundId;
      }
    }
  }
  // 如果遍历完所有模块及其子模块都未找到，返回 null
  return null;
};

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
      const importedTestCases = jsonData.testCases.map(testCase => {
        const moduleId = findModuleIdByName(moduleOptions.value, testCase.module); 

        return{        
        id: testCase.id || '',
        module: testCase.module,
        moduleId: moduleId, 
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
        isImported: true // 添加标记表示这是导入的测试用例}

      };
    });
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
        let moduleId = null;
        if (typeof testCase.module === 'string' && testCase.module.trim() !== '') {
          moduleId = findModuleIdByName(moduleOptions.value, testCase.module);
        }

        // 取消模糊匹配，因为moduleid已经足够精确，不需要再进行模糊匹配
        /*
        if (!moduleId) {
          const normalizedModuleName = testCase.moduleId.replace(/\s+/g, '').toLowerCase()
          moduleId = modules.value.find(m => 
            m.name.replace(/\s+/g, '').toLowerCase() === normalizedModuleName
          )
        }
*/
        if (!moduleId) {
          console.warn(`未找到模块: ${testCase.module}`, {
            testCase,
            availableModules: modules.value.map(m => m.name)
          })
        }

        return {
          ...testCase,
          moduleId: moduleId,
          projectId: selectedProjectId.value,
          status: 'waiting',
          type: testCase.type || '功能测试',
          priority: testCase.priority || 'P1'
        }
      })

      // 检查是否有未找到对应模块的测试用例
      const invalidTestCases = testCasesWithModuleId.filter(tc => !tc.moduleId)
      if (invalidTestCases.length > 0) {
        const invalidModuleNames = [...new Set(invalidTestCases.map(tc => tc.module).filter(name => name))];
        ElMessage.error(`以下模块：${invalidModuleNames.join(', ')} 未找到，无法保存！`);
        return;
      }

      const response = await api.testCase.batchCreateTestCases({
        projectId: selectedProjectId.value,
        testCases: testCasesWithModuleId
      });

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

// 添加模块选择变更处理方法
const handleModuleChange = (path) => {
  if (path && path.length > 0) {
    // 获取最后一个选中的模块ID
    selectedModuleId.value = path[path.length - 1]
    // 重置到第一页并重新加载测试用例
    pagination.value.current = 1
    fetchTestCases()
  } else {
    // 清空选择时重置模块ID
    selectedModuleId.value = null
    fetchTestCases()
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

// 在 script setup 部分添加获取模块路径的方法
const getModulePath = (moduleId) => {
  if (!moduleId) return ''
  
  const findModulePath = (modules, id, path = []) => {
    for (const module of modules) {
      if (module.value === id) {
        return [...path, module.label].join('/')
      }
      if (module.children && module.children.length > 0) {
        const result = findModulePath(module.children, id, [...path, module.label])
        if (result) return result
      }
    }
    return null
  }
  
  return findModulePath(moduleOptions.value, moduleId) || ''
}

// 单行编辑相关
const editingRowId = ref(null)
const editCache = reactive({})

const startEdit = (testCase) => {
  editingRowId.value = testCase.id
  Object.assign(editCache, JSON.parse(JSON.stringify(testCase)))
}
const cancelEdit = () => {
  editingRowId.value = null
  Object.keys(editCache).forEach(key => delete editCache[key])
}
const saveEdit = async (testCase) => {
  try {
    const updateData = {
      title: editCache.title,
      maintainer: editCache.maintainer,
      type: editCache.type,
      priority: editCache.priority,
      testType: editCache.testType,
      estimatedHours: editCache.estimatedHours,
      remainingHours: editCache.remainingHours,
      relatedItems: editCache.relatedItems,
      precondition: editCache.preconditions,
      steps: editCache.steps,
      expectedResult: editCache.expectedResults,
      followers: editCache.followers,
      notes: editCache.notes
    }
    const response = await api.testCase.updateTestCase(testCase.id, updateData)
    if (response.success) {
      Object.assign(testCase, editCache)
      ElMessage.success('保存成功')
      cancelEdit()
    } else {
      ElMessage.error(response.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 在<script setup>中添加单行删除方法
const deleteSingleTestCase = async (testCase) => {
  try {
    if (!testCase.id) {
      // 未保存的直接从列表移除
      testCases.value = testCases.value.filter(tc => tc !== testCase)
      ElMessage.success('已移除未保存的测试用例')
      return
    }
    // 已保存的需要弹窗确认
    await ElMessageBox.confirm(
      '确定要删除该测试用例吗？此操作不可撤销！',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    // 已保存的需要后端删除
    const response = await api.testCase.batchDeleteTestCases({ testCaseIds: [testCase.id] })
    if (response.success) {
      testCases.value = testCases.value.filter(tc => tc.id !== testCase.id)
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(response.message || '删除失败')
    }
  } catch (error) {
    // 如果是取消，不提示错误
    if (error === 'cancel') return
    ElMessage.error('删除失败')
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
  padding-left: 10px;
  padding-right: 0;
}

tr:hover {
  background-color: #f1f1f1;
}

/* 设置列宽 */
th:nth-child(1) { width: 1%; } /* 复选框 */
th:nth-child(2) { width: 7%; } /* 模块 */
th:nth-child(3) { width: 4%; } /* 编号 */
th:nth-child(4) { width: 10%; } /* 标题 */
th:nth-child(5) { width: 3%; } /* 维护人 */
th:nth-child(6) { width: 7%; } /* 用例类型 */
th:nth-child(7) { width: 4%; } /* 重要程度 */
th:nth-child(8) { width: 4%; } /* 测试类型 */
th:nth-child(9) { width: 15%; } /* 前置条件 */
th:nth-child(10) { width: 15%; } /* 步骤描述 */
th:nth-child(11) { width: 15%; } /* 预期结果 */
th:nth-child(12) { width: 4%; } /* 预估工时 */
th:nth-child(13) { width: 4%; } /* 剩余工时 */
th:nth-child(14) { width: 4%; } /* 关联工作项 */
th:nth-child(15) { width: 3%; } /* 关注人 */
th:nth-child(16) { width: 3%; } /* 备注 */

/* 为长文本列添加特殊样式 */
td:nth-child(4), /* 标题 */
td:nth-child(2), /* 模块 */
td:nth-child(9), /* 前置条件 */
td:nth-child(10), /* 步骤描述 */
td:nth-child(11), /* 预期结果 */
td:nth-child(16) { /* 备注 */
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: break-word;
}

/* 为短文本列添加样式 */
td:nth-child(1), /* 复选框 */
td:nth-child(3), /* 编号 */
td:nth-child(5), /* 维护人 */
td:nth-child(6), /* 用例类型 */
td:nth-child(7), /* 重要程度 */
td:nth-child(8), /* 测试类型 */
td:nth-child(12), /* 预估工时 */
td:nth-child(13), /* 剩余工时 */
td:nth-child(14), /* 关联工作项 */
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

/* 为操作列按钮顶部对齐 */
td:last-child {
  vertical-align: top !important;
  padding-top: 0 !important;
}
td:last-child .edit-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  margin-top: 2px;
}
td:last-child .el-button {
  margin: 0 !important;
}
</style>
