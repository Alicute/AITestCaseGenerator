<template>
  <main-layout>
    <div class="ai-generation">

      
      <!-- 选择功能点区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span>选择模块和功能点</span>
          </div>
        </template>
        
        <div class="selector-container">
          <div class="selector-row">
            <div class="selector-item">
              <span class="selector-label">项目：</span>
              <el-select 
                v-model="selectedProjectId" 
                placeholder="请选择项目" 
                @change="handleProjectChange"
                style="width: 200px"
              >
                <el-option 
                  v-for="project in projects" 
                  :key="project.id" 
                  :label="project.name" 
                  :value="project.id" 
                />
              </el-select>
            </div>
            
            <div class="selector-item">
              <span class="selector-label">模块：</span>
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
                :placeholder="selectedModuleDisplay"
                style="width: 300px"
                @change="handleModuleChange"
                :disabled="!selectedProjectId"
              />
            </div>
          </div>
        </div>
        
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div class="module-description" v-else-if="currentModuleDescription">
          <h3>{{ selectedModuleName }}</h3>
          <div class="description-content">
            <p>{{ currentModuleDescription }}</p>
          </div>
          
          <div v-if="moduleFunctions.length > 0" class="function-list">
            <h4>功能点列表：</h4>
            <el-checkbox-group v-model="selectedFunctions" @change="updatePromptContent">
              <el-checkbox 
                v-for="func in moduleFunctions" 
                :key="func.id" 
                :value="func.id"
              >
                {{ func.name }}
                <!-- <div class="function-description" v-if="func.description" v-html="formatDescription(func.description)"></div> -->
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-card>
      
      <!-- 提示词模板区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span>提示词模板</span>
          </div>
        </template>
        
        <div class="prompt-actions">
          <el-button type="success" @click="copyPromptContent">
            <el-icon><DocumentCopy /></el-icon>
            复制提示词
          </el-button>
          <div class="test-case-count">
            <span class="count-label">每个功能点生成测试用例数量：</span>
            <el-input-number 
              v-model="testCasesPerFunction" 
              :min="1" 
              :max="10" 
              @change="updatePromptContent"
              size="small"
              class="highlight-number"
            />
            />
          </div>
        </div>
        
        <!-- <div class="template-selector">
          <el-radio-group v-model="selectedTemplate" class="template-radio-group">
            <el-radio-button :value="'standard'">标准测试</el-radio-button>
            <el-radio-button :value="'functional'">功能测试</el-radio-button>
            <el-radio-button :value="'boundary'">边界测试</el-radio-button>
            <el-radio-button :value="'exception'">异常测试</el-radio-button>
            <el-radio-button :value="'custom'">自定义...</el-radio-button>
          </el-radio-group>
        </div> -->
        
        <div class="prompt-editor">
          <el-form-item label="编辑提示词:">
            <el-input
              v-model="promptContent"
              type="textarea"
              :rows="15"
              placeholder="请编辑生成测试用例的提示词..."
              class="prompt-textarea"
            />
          </el-form-item>
        </div>
      </el-card>
      
      <!-- AI设置区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span>AI设置</span>
            <el-link type="primary" @click="showAdvancedSettings = !showAdvancedSettings">
              {{ showAdvancedSettings ? '隐藏高级选项' : '显示高级选项' }}
            </el-link>
          </div>
        </template>
        
        <el-form label-position="left" label-width="100px">
          <!-- 
          <el-form-item label="接口:">
            <el-select v-model="aiSettings.provider" style="width: 260px" @change="handleProviderChange">
              <el-option label="Google Gemini" value="gemini" />
              <el-option label="OpenAI Compatible" value="openai" />
            </el-select>
          </el-form-item>
          -->
          <div class="current-provider-info" style="margin-bottom: 20px; color: #666;">
            当前使用全局AI配置: <strong>{{ aiSettings.providerName || aiSettings.provider }}</strong>
          </div>
          
          <el-form-item label="模型:">
            <el-select v-model="aiSettings.model" style="width: 260px">
              <el-option v-for="model in availableModels" :key="model.id" :label="model.name" :value="model.id" />
            </el-select>
          </el-form-item>
          
          <div v-if="showAdvancedSettings">
            <el-form-item label="温度:">
              <div style="display: flex; align-items: center; width: 300px;">
                <el-slider v-model="aiSettings.temperature" :min="0" :max="1" :step="0.1" style="flex: 1; margin-right: 15px" />
                <span>{{ aiSettings.temperature }}</span>
              </div>
            </el-form-item>
            
            <el-form-item label="最大长度:">
              <el-input-number v-model="aiSettings.maxTokens" :min="100" :max="4000" :step="100" style="width: 180px" />
            </el-form-item>
            
            <el-form-item label="频率惩罚:">
              <div style="display: flex; align-items: center; width: 300px;">
                <el-slider v-model="aiSettings.frequencyPenalty" :min="-2" :max="2" :step="0.1" style="flex: 1; margin-right: 15px" />
                <span>{{ aiSettings.frequencyPenalty }}</span>
              </div>
            </el-form-item>
          </div>
        </el-form>
      </el-card>
      
      <!-- 生成按钮 -->
      <div class="action-buttons">
        <el-button 
          type="primary" 
          size="large" 
          @click="generateTestCases"
          :loading="generating"
          :disabled="!promptContent || generating"
        >
          生成测试用例
        </el-button>
        <el-button size="large" @click="resetForm">重置</el-button>
      </div>
      
      <!-- 生成结果 -->
      <el-card v-if="generationResult" class="section-card result-card">
        <template #header>
          <div class="card-header">
            <span>生成结果</span>
            <div class="result-actions">
              <el-button type="success" @click="saveToTestCases">保存到测试用例</el-button>
              <el-button @click="copyToClipboard">复制</el-button>
            </div>
          </div>
        </template>
        
        <div class="generation-result" v-if="parsedTestCases.length > 0">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 40px">
                    <el-checkbox 
                      :model-value="allSelected" 
                      :indeterminate="isIndeterminate"
                      @change="handleSelectAll" 
                    />
                  </th>
                  <th style="width: 50px">序号</th>
                  <th>标题</th>
                  <th style="width: 80px">类型</th>
                  <th style="width: 60px">优先级</th>
                  <th>前置条件</th>
                  <th>测试步骤</th>
                  <th>预期结果</th>
                  <th style="width: 120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(testCase, index) in currentPageTestCases" :key="index">
                  <td>
                    <el-checkbox v-model="testCase.selected" />
                  </td>
                  <td>{{ (pagination.currentPage - 1) * pagination.pageSize + index + 1 }}</td>
                  
                  <!-- Title -->
                  <td v-if="editingIndex === index">
                    <el-input 
                      v-model="editForm.title" 
                      type="textarea" 
                      autosize 
                      size="small"
                    />
                  </td>
                  <td v-else>{{ testCase.title }}</td>

                  <!-- Type -->
                  <td v-if="editingIndex === index">
                     <el-select v-model="editForm.type" size="small">
                      <el-option label="功能测试" value="功能测试" />
                      <el-option label="性能测试" value="性能测试" />
                      <el-option label="安全相关" value="安全相关" />
                      <el-option label="接口测试" value="接口测试" />
                      <el-option label="UI测试" value="UI测试" />
                      <el-option label="其他" value="其他" />
                    </el-select>
                  </td>
                  <td v-else>
                    <el-tag size="small">{{ testCase.type || '功能测试' }}</el-tag>
                  </td>

                  <!-- Priority -->
                   <td v-if="editingIndex === index">
                    <el-select v-model="editForm.priority" size="small">
                      <el-option label="P1" value="P1" />
                      <el-option label="P2" value="P2" />
                      <el-option label="P3" value="P3" />
                      <el-option label="P4" value="P4" />
                    </el-select>
                  </td>
                  <td v-else>
                    <el-tag 
                      size="small" 
                      :type="testCase.priority === 'P1' ? 'danger' : testCase.priority === 'P2' ? 'warning' : 'info'"
                    >
                      {{ testCase.priority || 'P2' }}
                    </el-tag>
                  </td>

                  <!-- Preconditions -->
                  <td v-if="editingIndex === index">
                    <el-input 
                      v-model="editForm.precondition" 
                      type="textarea" 
                      autosize 
                      size="small"
                    />
                  </td>
                   <td v-else class="pre-wrap">{{ testCase.precondition }}</td>

                  <!-- Steps -->
                  <td v-if="editingIndex === index">
                    <el-input 
                      v-model="editForm.steps" 
                      type="textarea" 
                      autosize 
                      size="small"
                      placeholder="每行一个步骤"
                    />
                  </td>
                  <td v-else>
                    <ol class="step-list">
                      <li v-for="(step, sIndex) in (Array.isArray(testCase.steps) ? testCase.steps : [])" :key="sIndex">
                        {{ step }}
                      </li>
                    </ol>
                  </td>

                  <!-- Expected Result -->
                  <td v-if="editingIndex === index">
                    <el-input 
                      v-model="editForm.expectedResult" 
                      type="textarea" 
                      autosize 
                      size="small"
                    />
                  </td>
                  <td v-else class="pre-wrap">{{ testCase.expectedResult }}</td>

                  <!-- Actions -->
                  <td>
                    <div class="action-buttons-group">
                      <template v-if="editingIndex === index">
                        <el-button type="primary" link size="small" @click="saveEdit(index)">保存</el-button>
                        <el-button link size="small" @click="cancelEdit">取消</el-button>
                      </template>
                      <template v-else>
                        <el-button type="primary" link size="small" @click="startEdit(index, testCase)">编辑</el-button>
                        <el-button type="danger" link size="small" @click="deleteTestCase(index)">删除</el-button>
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 添加分页器 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>

      <!-- 保存对话框 -->
      <el-dialog v-model="saveDialogVisible" title="保存测试用例" width="600px">
        <el-form :model="saveForm" label-width="100px">
          <el-form-item v-if="!selectedModuleId" label="目标模块">
            <el-cascader
              v-model="saveForm.moduleId"
              :options="moduleOptions"
              :props="{ checkStrictly: true, emitPath: false }"
              placeholder="请选择保存的模块"
              style="width: 100%"
            />
          </el-form-item>
          
          <div class="save-options">
            <p>将保存 {{ selectedTestCasesCount }} 个测试用例到模块 "{{ selectedModuleName || '未选择' }}"</p>
          </div>
        </el-form>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="saveDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="confirmSaveTestCases" :loading="saving">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MainLayout from '@/components/layout/MainLayout.vue'
import api from '@/api'
import { useSelectionStore } from '@/stores/selection'
import { DocumentCopy } from '@element-plus/icons-vue'


const router = useRouter()
const route = useRoute()
const selectionStore = useSelectionStore()

// 状态变量
const loading = ref(false)
const generating = ref(false)
const saving = ref(false)
const projects = ref([])
const moduleOptions = ref([])
const moduleFunctions = ref([])
const selectedFunctions = ref([])
const testCasesPerFunction = ref(3)

// 选择的项目和模块
const selectedProjectId = computed({
  get: () => {
    return selectionStore.selectedProjectId
  },
  set: (value) => {
    if (value) {
      const project = projects.value.find(p => p.id === value)
      if (project) {
        selectionStore.setSelectedProject(project)
      }
    }
  }
})

// 将 selectedModulePath 改为 ref
const selectedModulePath = ref(selectionStore.selectedModulePath)

const selectedModuleId = computed({
  get: () => selectionStore.selectedModuleId,
  set: (value) => {
    if (value) {
      const module = findModuleById(moduleOptions.value, value)
      if (module) {
        selectionStore.setSelectedModule({
          id: value,
          name: module.label,
          path: selectedModulePath.value
        })
      }
    }
  }
})

const currentModuleDescription = ref('')

// 提示词相关
const selectedTemplate = ref('standard')
const promptContent = ref('')
const showAdvancedSettings = ref(false)
const generationResult = ref('')
const parsedTestCases = ref([])

// 保存对话框
const saveDialogVisible = ref(false)
const saveForm = ref({
  moduleId: null
})

// AI设置
const aiSettings = ref({
  provider: 'gemini',
  providerName: '',
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 2000,
  frequencyPenalty: 0
})

const availableModels = ref([])

// 获取可用模型列表
const fetchModels = async (provider) => {
  try {
    const response = await api.ai.getAvailableModels(provider)
    if (response.success) {
      availableModels.value = response.data
      
      // 如果当前模型不在列表中，且列表不为空，默认选中第一个
      if (availableModels.value.length > 0) {
        const currentModelExists = availableModels.value.find(m => m.id === aiSettings.value.model)
        if (!currentModelExists) {
          aiSettings.value.model = availableModels.value[0].id
        }
      }
    }
  } catch (error) {
    console.error('获取模型列表失败:', error)
  }
}

// 加载全局设置
const loadGlobalSettings = async () => {
  try {
    const response = await api.settings.getSettings()
    if (response.success && response.data.ai) {
      const globalAI = response.data.ai
      aiSettings.value.provider = globalAI.provider || 'gemini'
      aiSettings.value.providerName = globalAI.providerName 
      aiSettings.value.model = globalAI.model || 'gemini-pro'
      aiSettings.value.temperature = globalAI.temperature || 0.7
      
      // 加载模型列表
      await fetchModels(aiSettings.value.provider)
    }
  } catch (error) {
    console.error('加载全局配置失败:', error)
  }
}

onMounted(() => {
  fetchProjects()
  loadGlobalSettings()
})

// 计算属性
const selectedModuleName = computed(() => {
  if (!selectedModuleId.value) return ''
  const module = findModuleById(moduleOptions.value, selectedModuleId.value)
  return module ? module.label : ''
})

const selectedTestCasesCount = computed(() => {
  return parsedTestCases.value.filter(tc => tc.selected).length
})

// 分页相关
const pagination = ref({
  currentPage: 1,
  pageSize: 5,
  total: 0
})

// 计算当前页的测试用例
const currentPageTestCases = computed(() => {
  const start = (pagination.value.currentPage - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return parsedTestCases.value.slice(start, end)
})

// 监听测试用例数量变化
watch(parsedTestCases, (newVal) => {
  pagination.value.total = newVal.length
  pagination.value.currentPage = 1
})

// 查找模块函数
const findModuleById = (modules, id) => {
  for (const module of modules) {
    if (module.value === id) {
      return module
    }
    if (module.children && module.children.length > 0) {
      const found = findModuleById(module.children, id)
      if (found) return found
    }
  }
  return null
}

// 获取项目列表
const fetchProjects = async () => {
  try {
    const response = await api.project.getProjects()
    if (response.success) {
      projects.value = response.data


      // 如果路由中有项目ID，自动选择
      const routeProjectId = route.query.projectId

      if (routeProjectId) {
        // 确保项目ID是数值类型
        selectedProjectId.value = typeof routeProjectId === 'string' ? parseInt(routeProjectId) : routeProjectId

        handleProjectChange(selectedProjectId.value)

      }
    } else {
      selectedProjectId.value = projects.value[0].id
      handleProjectChange(selectedProjectId.value)
    }
  } catch (error) {
    ElMessage.error('获取项目列表时发生错误')
  }
}

// 获取模块树
const fetchModuleTree = async (projectId) => {
  if (!projectId) return
  
  loading.value = true
  try {
    const response = await api.module.getModuleTree(projectId)
    
    if (response.success) {
      // 直接使用后端返回的数据结构
      moduleOptions.value = response.data.map(module => ({
        value: module.id,
        label: module.name,
        children: module.children?.map(child => ({
          value: child.id,
          label: child.name
        })) || []
      }))
      
      // 如果路由中有模块ID，自动选择
      const routeModuleId = route.query.moduleId
      if (routeModuleId) {
        const moduleId = parseInt(routeModuleId)
        selectedModuleId.value = moduleId
        selectedModulePath.value = moduleId
        loadModuleDescription()
      } else if (selectionStore.selectedModuleId) {
        // 如果 store 中有选中的模块，使用它
        selectedModuleId.value = selectionStore.selectedModuleId
        selectedModulePath.value = selectionStore.selectedModuleId
        loadModuleDescription()
      }
    } else {
      ElMessage.error(response.message || '获取模块树失败')
    }
  } catch (error) {
    console.error('获取模块树错误:', error)
    ElMessage.error('获取模块树时发生错误')
  } finally {
    loading.value = false
  }
}
const currentProjectDescription = ref('') // 用于缓存当前选中项目的描述

// 项目变更处理
const handleProjectChange = (projectId) => {
  if (projectId) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
      currentProjectDescription.value = project.description || ''
      selectionStore.setSelectedProject(project)
      fetchModuleTree(projectId)
    }
  }
}

// 模块变更处理
const handleModuleChange = async (path) => {
  if (path && path.length > 0) {
    // 获取最后一个选中的模块ID
    const moduleId = path[path.length - 1]
    
    // 根据级联选择器的值查找模块
    const module = findModuleById(moduleOptions.value, moduleId)
    if (module) {
      // 清空当前功能点
      moduleFunctions.value = []
      selectedFunctions.value = []
      
      // 更新选中的模块ID和路径
      selectedModuleId.value = moduleId
      selectedModulePath.value = path  // 直接更新为完整路径
      selectionStore.setSelectedModule({
        id: moduleId,
        name: module.label,
        path: path.join('/')  // 使用完整路径
      })
      
      // 加载模块描述和功能点
      await loadModuleDescription()
    } else {
      console.error('未找到模块:', moduleId)
    }
  }
}

// 加载模块描述和功能点
const loadModuleDescription = async () => {
  if (!selectedModuleId.value) {
    ElMessage.warning('请先选择功能模块')
    return
  }
  
  loading.value = true
  try {
    // 获取模块详情
    const moduleResponse = await api.module.getModule(selectedModuleId.value)
    
    if (moduleResponse.success) {
      currentModuleDescription.value = moduleResponse.data.description || `${moduleResponse.data.name}是系统的功能模块，需要进行全面测试以确保其可靠性。`
      
      // 获取模块的功能点
      const functionResponse = await api.module.getModuleFunctions(selectedModuleId.value)
      
      if (functionResponse.success) {
        moduleFunctions.value = functionResponse.data || []
        // 默认选中所有功能点
        selectedFunctions.value = moduleFunctions.value.map(func => func.id)
      }
      
      // 更新提示词
      updatePromptContent()
    } else {
      ElMessage.error(moduleResponse.message || '获取模块详情失败')
    }
  } catch (error) {
    console.error('加载模块详情错误:', error)
    ElMessage.error('加载模块详情时发生错误')
  } finally {
    loading.value = false
  }
}

// 更新提示词内容
const updatePromptContent = () => {
  if (!selectedModuleName.value) return
  
  // 获取选中的功能点描述，并转为列表形式
  const functionDescriptions = selectedFunctions.value
    .map(id => {
      const func = moduleFunctions.value.find(f => f.id === id)
      if (!func) return ''
      // 处理换行符，转换为空格
      const cleanDescription = func.description ? func.description.replace(/\n/g, ' ') : '';
      return cleanDescription ? `- ${func.name}（${cleanDescription}）` : `- ${func.name}`
    })
    .filter(desc => desc)
    .join('\n')
  
  promptContent.value = `系统背景介绍：

    ${currentProjectDescription.value}

模块描述：${currentModuleDescription.value}

请为"${selectedModuleName.value}"模块生成测试用例，主要功能点包括，括号内为功能点的细化描述：
${functionDescriptions}

请生成以下格式的测试用例，每个功能点至少生成${testCasesPerFunction.value}个测试用例，若功能点描述较多，则拆分描述点，
按照功能点/描述点内容进行细化，单个细化点生成不少于${testCasesPerFunction.value}个测试用例，
因此总的用例数至少为功能点数乘以细分点数：

1. 测试用例标题格式：功能点/场景-具体操作/条件-预期结果/验证点
2. 每个测试用例必须包含：
   - 前置条件(preconditions)：使用数字编号列出所有必要的前置条件
   - 测试步骤(steps)：使用数字编号详细描述每个步骤，每个步骤用换行符分隔
   - 预期结果(expectedResults)：与测试步骤一一对应，不要多也不要少，描述每个步骤的预期结果
   - 优先级(priority)：根据测试用例的重要程度，选择P1、P2、P3、P4
   - 类型(type)：根据测试用例的类型，选择：功能测试、性能测试、配置相关、安装部署、接口测试、安全相关、兼容性测试、UI测试、其他
请务必只输出标准的JSON格式数据，不要包含任何Markdown标记（如 \`\`\`json），不要包含任何其他说明文字。
JSON结构如下：
{
  "testCases": [
    {
      "module": "${selectedModuleName.value}",
      "title": "功能点/场景-具体操作/条件-预期结果/验证点",
      "type": "功能测试",
      "priority": "P1",
      "testType": "手动",
      "preconditions": "1. 前置条件1\\n2. 前置条件2",
      "steps": "1. 步骤1\\n2. 步骤2",
      "expectedResults": "1. 步骤1的预期结果\\n2. 步骤2的预期结果",
      "maintainer": "程亮"
    }
  ]
}`
}

// 监听模板变化
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate !== 'custom' && currentModuleDescription.value) {
    updatePromptContent()
  }
})

// 生成测试用例
const generateTestCases = async () => {
  if (!currentModuleDescription.value) {
    ElMessage.warning('请先加载功能点描述')
    return
  }
  
  if (!promptContent.value) {
    ElMessage.warning('请输入提示词')
    return
  }
  
  generating.value = true
  
  try {
    // 使用AI API生成测试用例
    const response = await api.ai.generateTestCases({
      promptContent: promptContent.value,
      moduleId: selectedModuleId.value,
      settings: aiSettings.value
    })
    
    if (response.success) {
      generationResult.value = response.data.content
      
      // 解析测试用例
      parsedTestCases.value = parseTestCases(generationResult.value)
      
      // 默认选中所有测试用例
      parsedTestCases.value.forEach(tc => {
        tc.selected = true
      })
      
      ElMessage.success('测试用例生成成功')
    } else {
      ElMessage.error(response.message || '生成测试用例失败')
    }
  } catch (error) {
    console.error('生成测试用例错误:', error)
    ElMessage.error('生成测试用例时发生错误')
  } finally {
    generating.value = false
  }
}

// 解析生成的测试用例文本
const parseTestCases = (text) => {
  try {
    // 尝试直接解析
    let jsonContent = text;
    
    // 如果包含 markdown 代码块，提取其中的内容
    const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonContent = codeBlockMatch[1];
    }
    
    // 清理可能导致解析失败的非JSON字符（如果不在代码块中）
    // 这里简单处理，假设 content 是 JSON 字符串
    
    const parsed = JSON.parse(jsonContent);
    const testCasesList = parsed.testCases || (Array.isArray(parsed) ? parsed : []);
    
    return testCasesList.map(tc => {
      // 确保 steps 是数组
      let steps = tc.steps;
      if (typeof steps === 'string') {
        steps = steps.split(/\r?\n/).filter(s => s.trim());
      } else if (!Array.isArray(steps)) {
        steps = [];
      }
      
      return {
        title: tc.title || '未命名用例',
        precondition: tc.preconditions || tc.precondition || '',
        steps: steps,
        expectedResult: tc.expectedResults || tc.expectedResult || '',
        priority: tc.priority || 'P2',
        type: tc.type || '功能测试',
        selected: true
      };
    });
  } catch (error) {
    console.warn('JSON解析失败，尝试回退到文本解析:', error);
    // 回退到简单的文本解析（保留以前的逻辑作为兜底，或者提示错误）
    ElMessage.warning('自动解析失败，请检查生成内容格式');
    return []; 
  }
}

// 保存到测试用例
const saveToTestCases = () => {
  if (parsedTestCases.value.length === 0) {
    ElMessage.warning('没有可保存的测试用例')
    return
  }
  
  if (!selectedModuleId.value && !saveForm.value.moduleId) {
    saveForm.value.moduleId = selectedModuleId.value
  }
  
  saveDialogVisible.value = true
}

// 确认保存测试用例
const confirmSaveTestCases = async () => {
  const moduleId = selectedModuleId.value || saveForm.value.moduleId
  
  if (!moduleId) {
    ElMessage.warning('请选择保存到的模块')
    return
  }
  
  const selectedTestCases = parsedTestCases.value.filter(tc => tc.selected)
  
  if (selectedTestCases.length === 0) {
    ElMessage.warning('请至少选择一个测试用例')
    return
  }
  
  saving.value = true
  try {
    let successCount = 0
    
    // 逐个保存测试用例
    for (const tc of selectedTestCases) {
      const testCaseData = {
        title: tc.title,
        moduleId,
        projectId: selectedProjectId.value,
        precondition: tc.precondition,
        steps: Array.isArray(tc.steps) ? tc.steps.join('\n') : tc.steps,
        expectedResult: tc.expectedResult,
        priority: tc.priority || 'P2',
        type: tc.type || '功能测试',
        status: '未执行',
      }
      
      const response = await api.testCase.createTestCase(testCaseData)
      
      if (response.success) {
        successCount++
      }
    }
    
    if (successCount > 0) {
      ElMessage.success(`成功保存 ${successCount} 个测试用例`)
      saveDialogVisible.value = false
      
      // 可以选择跳转到测试用例管理页面
      ElMessageBox.confirm(
        '测试用例已保存成功，是否查看所有测试用例？',
        '保存成功',
        {
          confirmButtonText: '查看测试用例',
          cancelButtonText: '继续生成',
          type: 'success',
        }
      )
        .then(() => {
          router.push(`/testcases?moduleId=${moduleId}`)
        })
        .catch(() => {
          // 用户选择继续生成，不做操作
        })
    } else {
      ElMessage.error('保存测试用例失败')
    }
  } catch (error) {
    console.error('保存测试用例错误:', error)
    ElMessage.error('保存测试用例时发生错误')
  } finally {
    saving.value = false
  }
}

// 复制到剪贴板
const copyToClipboard = async () => {
  if (!generationResult.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  try {
    // 优先使用 Clipboard API，因为它更现代、更安全
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(generationResult.value);
      ElMessage.success('已复制到剪贴板');
    } else {
      // 如果 Clipboard API 不可用，则使用旧的 document.execCommand 方法作为备用
      const textArea = document.createElement('textarea');
      textArea.value = generationResult.value;
      // 确保 textarea 在视窗外，并且是临时的
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        ElMessage.success('已复制到剪贴板 (备用模式)');
      } else {
        throw new Error('备用复制方法执行失败');
      }
    }
  } catch (err) {
    console.error('复制失败:', err);
    ElMessage.error('复制失败，请检查浏览器权限或手动复制');
  }
}

// 重置表单
const resetForm = () => {
  if (generationResult.value) {
    ElMessageBox.confirm(
      '确定要重置表单吗？所有生成的数据将被清除。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        doReset()
      })
      .catch(() => {
        // 用户取消操作
      })
  } else {
    doReset()
  }
}

// 执行重置
const doReset = () => {
  // 保留项目和模块选择
  const moduleId = selectedModuleId.value
  
  currentModuleDescription.value = ''
  moduleFunctions.value = []
  selectedFunctions.value = []
  promptContent.value = ''
  generationResult.value = ''
  parsedTestCases.value = []
  
  // 如果有模块ID，重新加载模块信息
  if (moduleId) {
    loadModuleDescription()
  }
  
  ElMessage.info('表单已重置')
}

// 添加分页处理方法
const handleSizeChange = (val) => {
  pagination.value.pageSize = val
  pagination.value.currentPage = 1
}

const handleCurrentChange = (val) => {
  pagination.value.currentPage = val
}

// 复制提示词
const copyPromptContent = async () => {
  if (!promptContent.value) {
    ElMessage.warning('提示词内容为空，无法复制');
    return;
  }

  try {
    // 优先使用 Clipboard API，因为它更现代、更安全
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(promptContent.value);
      ElMessage.success('提示词已成功复制到剪贴板');
    } else {
      // 如果 Clipboard API 不可用，则使用旧的 document.execCommand 方法作为备用
      const textArea = document.createElement('textarea');
      textArea.value = promptContent.value;
      // 确保 textarea 在视窗外，并且是临时的
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        ElMessage.success('提示词已成功复制到剪贴板 (备用模式)');
      } else {
        throw new Error('备用复制方法执行失败');
      }
    }
  } catch (err) {
    console.error('复制提示词失败:', err);
    ElMessage.error('复制失败，请检查浏览器权限或手动复制');
  }
};

// 监听项目列表变化
watch(projects, (newProjects) => {
  if (newProjects.length === 0) {
    // 如果没有项目了，清除选择
    selectionStore.clearSelection()
    moduleOptions.value = []
    moduleFunctions.value = []
    currentModuleDescription.value = ''
  }
})

// 组件挂载时执行
onMounted(async () => {
  await fetchProjects()
  
  // 检查是否有项目
  if (projects.value.length === 0) {
    selectedProjectId.value = null
    return
  }
  
  // 如果有项目列表且当前没有选中项目，则自动选中第一个项目
  if (!selectedProjectId.value) {
    selectedProjectId.value = projects.value[0].id
    await handleProjectChange(projects.value[0].id)
  } else if (selectionStore.selectedProjectId) {
    // 如果store中有选中的项目，自动加载
    selectedProjectId.value = selectionStore.selectedProjectId
    await fetchModuleTree(selectionStore.selectedProjectId)
  }
})

// 添加计算属性
const selectedModuleDisplay = computed(() => {
  if (!selectedModulePath.value) return '请选择功能模块'
  
  // 查找选中的模块
  const findModulePath = (modules, id) => {
    for (const module of modules) {
      if (module.id === id) {
        return module.path
      }
      if (module.children) {
        const path = findModulePath(module.children, id)
        if (path) return path
      }
    }
    return null
  }
  
  const path = findModulePath(moduleOptions.value, selectedModulePath.value)
  return path || '请选择功能模块'
})

// 编辑相关逻辑
const editingIndex = ref(-1)
const editForm = ref({
  title: '',
  type: '',
  priority: '',
  precondition: '',
  steps: '',
  expectedResult: ''
})

const startEdit = (index, testCase) => {
  editingIndex.value = index
  editForm.value = {
    title: testCase.title,
    type: testCase.type || '功能测试',
    priority: testCase.priority || 'P2',
    precondition: testCase.precondition,
    steps: Array.isArray(testCase.steps) ? testCase.steps.join('\n') : testCase.steps,
    expectedResult: testCase.expectedResult
  }
}

const cancelEdit = () => {
  editingIndex.value = -1
  editForm.value = {}
}

const saveEdit = (index) => {
  const realIndex = (pagination.value.currentPage - 1) * pagination.value.pageSize + index
  const testCase = parsedTestCases.value[realIndex]
  
  // 更新数据
  testCase.title = editForm.value.title
  testCase.type = editForm.value.type
  testCase.priority = editForm.value.priority
  testCase.precondition = editForm.value.precondition
  // 处理步骤，按换行符分割回数组
  testCase.steps = editForm.value.steps.split('\n').filter(s => s.trim())
  testCase.expectedResult = editForm.value.expectedResult
  
  editingIndex.value = -1
  ElMessage.success('已更新')
}

const deleteTestCase = (index) => {
  const realIndex = (pagination.value.currentPage - 1) * pagination.value.pageSize + index
  parsedTestCases.value.splice(realIndex, 1)
  
  // 如果当前页为空且不是第一页，自动跳转到上一页
  if (currentPageTestCases.value.length === 0 && pagination.value.currentPage > 1) {
    pagination.value.currentPage--
  }
}

// 全选/反选逻辑
const allSelected = computed(() => {
  return currentPageTestCases.value.length > 0 && currentPageTestCases.value.every(tc => tc.selected)
})

const isIndeterminate = computed(() => {
  const selectedCount = currentPageTestCases.value.filter(tc => tc.selected).length
  return selectedCount > 0 && selectedCount < currentPageTestCases.value.length
})

const handleSelectAll = (val) => {
  currentPageTestCases.value.forEach(tc => {
    tc.selected = val
  })
}
</script>

<style scoped>
.ai-generation {
  width: 100%;
}

.section-card {
  margin-bottom: 15px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selector-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.selector-item {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}

.selector-label {
  font-weight: bold;
  color: #606266;
  width: 60px;
  margin-right: 8px;
}

.loading-container {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 20px;
}

.module-description {
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin-top: 15px;
}

.description-content {
  margin-bottom: 15px;
}

.function-list {
  margin-top: 15px;
}

.function-list h4 {
  margin-bottom: 8px;
  color: #303133;
  font-size: 14px;
}

.template-radio-group {
  margin-bottom: 20px;
}

.prompt-editor {
  margin-top: 15px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin: 30px 0;
}

.result-card {
  margin-top: 30px;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.generation-result {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  max-height: 600px;
  overflow-y: auto;
}

.test-case-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 20px;
  background-color: white;
}

.test-case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.test-case-header h3 {
  margin: 0;
  color: #303133;
}

.test-case-section {
  margin-bottom: 15px;
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

.save-options {
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .selector-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .selector-item {
    width: 100%;
  }
  
  .selector-label {
    width: 60px;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.prompt-textarea {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  font-size: 14px;
}

.prompt-actions {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.test-case-count {
  display: flex;
  align-items: center;
  gap: 10px;
}

.count-label {
  color: #606266;
  font-size: 16px;
  font-weight: bold;
}

.prompt-actions .el-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.prompt-editor {
  margin-top: 15px;
}

/* 添加功能点描述的样式 */
.function-description {
  font-size: 12px;
  color: #909399;
  margin-left: 5px;
  margin-top: 3px;
  line-height: 1.4;
  max-width: 500px;
}

.highlight-number :deep(.el-input-number__decrease),
.highlight-number :deep(.el-input-number__increase),
.highlight-number :deep(.el-input__inner) {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}


.ai-generation {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.selector-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selector-row {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.selector-item {
  display: flex;
  align-items: center;
}

.selector-label {
  font-weight: bold;
  margin-right: 10px;
  min-width: 50px;
}

.module-description {
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.module-description h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.description-content {
  color: #606266;
  line-height: 1.6;
}

.function-list {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.function-list h4 {
  margin-top: 0;
  margin-bottom: 10px;
}

.prompt-actions {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-case-count {
  display: flex;
  align-items: center;
}

.count-label {
  margin-right: 10px;
  color: #606266;
}

.highlight-number :deep(.el-input__inner) {
  color: #409eff;
  font-weight: bold;
}

.template-selector {
  margin-bottom: 15px;
}

.prompt-editor {
  margin-top: 10px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 10px 0;
}

/* 表格样式 */
.table-wrapper {
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 13px;
}

th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid #ebeef5;
  white-space: nowrap;
}

td {
  padding: 10px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  vertical-align: top;
  word-break: break-word; /* 允许单词换行 */
  white-space: normal; /* 允许文本换行 */
}

/* 特定列的样式 */
td .pre-wrap {
  white-space: pre-wrap;
}

.step-list {
  padding-left: 20px;
  margin: 0;
}

.step-list li {
  margin-bottom: 4px;
}

tr:hover td {
  background-color: #f5f7fa;
}

.action-buttons-group {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.save-options {
  margin-top: 20px;
  padding: 10px;
  background-color: #f0f9eb;
  border-radius: 4px;
  color: #67c23a;
}
</style>