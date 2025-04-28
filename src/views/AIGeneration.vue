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
            />
          </div>
        </div>
        
        <div class="template-selector">
          <el-radio-group v-model="selectedTemplate" class="template-radio-group">
            <el-radio-button :value="'standard'">标准测试</el-radio-button>
            <el-radio-button :value="'functional'">功能测试</el-radio-button>
            <el-radio-button :value="'boundary'">边界测试</el-radio-button>
            <el-radio-button :value="'exception'">异常测试</el-radio-button>
            <el-radio-button :value="'custom'">自定义...</el-radio-button>
          </el-radio-group>
        </div>
        
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
          <el-form-item label="接口:">
            <el-select v-model="aiSettings.provider" style="width: 260px">
              <el-option label="OpenAI API" value="openai" />
              <el-option label="Claude API" value="claude" />
              <el-option label="本地模型" value="local" />
            </el-select>
          </el-form-item>
          
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
          :disabled="!currentModuleDescription"
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
        
        <div class="generation-result">
          <div v-for="(testCase, index) in currentPageTestCases" :key="index" class="test-case-item">
            <div class="test-case-header">
              <h3>{{ testCase.title }}</h3>
              <el-checkbox v-model="testCase.selected" />
            </div>
            
            <div class="test-case-section">
              <div class="section-title">前置条件:</div>
              <div class="section-content">{{ testCase.precondition }}</div>
            </div>
            
            <div class="test-case-section">
              <div class="section-title">测试步骤:</div>
              <div class="section-content">
                <ol>
                  <li v-for="(step, stepIndex) in testCase.steps" :key="stepIndex">
                    {{ step }}
                  </li>
                </ol>
              </div>
            </div>
            
            <div class="test-case-section">
              <div class="section-title">预期结果:</div>
              <div class="section-content">{{ testCase.expectedResult }}</div>
            </div>
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
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  frequencyPenalty: 0
})

// 可用模型列表
const availableModels = computed(() => {
  if (aiSettings.value.provider === 'openai') {
    return [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      { id: 'gpt-4', name: 'GPT-4' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' }
    ]
  } else if (aiSettings.value.provider === 'claude') {
    return [
      { id: 'claude-instant', name: 'Claude Instant' },
      { id: 'claude-2', name: 'Claude 2' }
    ]
  } else {
    return [
      { id: 'local-model', name: '本地模型' }
    ]
  }
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

// 项目变更处理
const handleProjectChange = (projectId) => {
  if (projectId) {
    const project = projects.value.find(p => p.id === projectId)
    if (project) {
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
  
  const testType = selectedTemplate.value === 'standard' ? '功能测试' : 
                  selectedTemplate.value === 'functional' ? '功能测试' : 
                  selectedTemplate.value === 'boundary' ? '边界测试' : '异常测试'
  
  promptContent.value = `系统背景介绍：
X射线数字成像系统是一款集图像采集、图像处理、图像管理为一体的应用系统。主要用于工业无损探伤检测的数字化应用，实现对数字影像的采集、处理、存储、查询、评定，方便后期分析调阅，协助进行更高效、便捷的工业检测。

请为"${selectedModuleName.value}"模块生成测试用例，主要功能点包括：
${functionDescriptions}

模块描述：${currentModuleDescription.value}

请生成以下格式的测试用例，每个功能点至少生成${testCasesPerFunction.value}个测试用例：

1. 测试用例标题格式：功能点/场景-具体操作/条件-预期结果/验证点
2. 每个测试用例必须包含：
   - 前置条件：使用数字编号列出所有必要的前置条件
   - 测试步骤：使用数字编号详细描述每个步骤，每个步骤用换行符分隔
   - 预期结果：与测试步骤一一对应，描述每个步骤的预期结果
   - 优先级：根据测试用例的重要程度，选择P1、P2、P3、P4
   - 类型：根据测试用例的类型，选择功能测试、性能测试、安全测试、边界测试、异常测试、UI测试
请以如下JSON格式输出测试用例，确保包含所有必要字段：

{
  "testCases": [
    {
      "module": "${selectedModuleName.value}",
      "id": "",
      "title": "功能点/场景-具体操作/条件-预期结果/验证点",
      "maintainer": "程亮",
      "type": "${testType}",
      "priority": "P1",
      "testType": "",
      "estimatedHours": "",
      "remainingHours": "",
      "relatedItems": "",
      "preconditions": "1. 前置条件1\\n2. 前置条件2",
      "steps": "1. 步骤1\\n2. 步骤2",
      "expectedResults": "1. 步骤1的预期结果\\n2. 步骤2的预期结果",
      "followers": "",
      "notes": ""
    }
  ]
}

注意：
1. id、estimatedHours、remainingHours、relatedItems、followers、notes字段保持为空字符串
2. preconditions、steps、expectedResults字段必须使用数字编号
3. 每个测试用例必须完整包含所有字段
4. 确保生成的测试用例覆盖主要功能和关键场景
5. 所有换行符必须使用 \\n 转义，不要使用实际的换行符`
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
      prompt: promptContent.value,
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
    
    // 临时使用模拟数据进行测试
    generationResult.value = `测试用例 1: 验证模块基本功能
前置条件:
- 系统已正常运行
- 用户已登录系统
- 用户具有足够权限

步骤:
1. 导航到${selectedModuleName.value}模块
2. 验证界面元素是否正确显示
3. 执行基本操作
4. 检查操作结果

预期结果:
- 界面元素正确显示
- 操作成功执行
- 系统反馈正确的结果
- 数据正确保存

-----------------------------

测试用例 2: 输入验证测试
前置条件:
- 系统已正常运行
- 用户已登录系统

步骤:
1. 导航到${selectedModuleName.value}模块
2. 在输入框中输入无效数据
3. 尝试提交表单
4. 检查系统反馈

预期结果:
- 系统应显示适当的错误消息
- 表单不应被提交
- 无效数据不应被保存

-----------------------------

测试用例 3: 权限控制测试
前置条件:
- 系统已正常运行
- 用户已登录系统
- 用户没有操作权限

步骤:
1. 导航到${selectedModuleName.value}模块
2. 尝试执行受限操作
3. 观察系统反应

预期结果:
- 系统应阻止操作执行
- 显示适当的权限不足提示
- 记录访问尝试`
    
    // 解析测试用例
    parsedTestCases.value = parseTestCases(generationResult.value)
    
    // 默认选中所有测试用例
    parsedTestCases.value.forEach(tc => {
      tc.selected = true
    })
  } finally {
    generating.value = false
  }
}

// 解析生成的测试用例文本
const parseTestCases = (text) => {
  // 使用分隔符分割各个测试用例
  const testCases = text.split(/----+/)
    .map(tc => tc.trim())
    .filter(tc => tc.length > 0)
  
  return testCases.map(tcText => {
    // 提取标题
    const titleMatch = tcText.match(/测试用例.*?:(.*?)[\r\n]|^(.*?)[\r\n]/i)
    const title = titleMatch ? (titleMatch[1] || titleMatch[2]).trim() : '未命名测试用例'
    
    // 提取前置条件
    const preconditionMatch = tcText.match(/前置条件:([\s\S]*?)(?=步骤:|测试步骤:|$)/i)
    const precondition = preconditionMatch ? preconditionMatch[1].trim() : ''
    
    // 提取步骤
    const stepsMatch = tcText.match(/(?:步骤|测试步骤):([\s\S]*?)(?=预期结果:|$)/i)
    const stepsText = stepsMatch ? stepsMatch[1].trim() : ''
    
    // 把步骤文本转换为数组
    const steps = stepsText.split(/\r?\n/)
      .map(step => {
        // 移除数字和点前缀
        return step.replace(/^\s*\d+\.\s*|-\s*/, '').trim()
      })
      .filter(step => step.length > 0)
    
    // 提取预期结果
    const expectedResultMatch = tcText.match(/预期结果:([\s\S]*?)(?=$)/i)
    const expectedResult = expectedResultMatch ? expectedResultMatch[1].trim() : ''
    
    return {
      title,
      precondition,
      steps,
      expectedResult,
      selected: true
    }
  })
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
        precondition: tc.precondition,
        steps: tc.steps.join('\n'),
        expectedResult: tc.expectedResult,
        priority: 'medium',
        type: selectedTemplate.value === 'exception' ? 'security' : 
              selectedTemplate.value === 'boundary' ? 'performance' : 'functional',
        status: 'waiting',
        creatorId: 1, // 当前登录用户ID，实际应该从认证中获取
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
const copyToClipboard = () => {
  if (!generationResult.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(generationResult.value)
    .then(() => {
      ElMessage.success('已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
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

// 添加复制提示词方法
const copyPromptContent = () => {
  if (!promptContent.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(promptContent.value)
    .then(() => {
      ElMessage.success('提示词已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

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
    console.log('AIGeneration - 自动选择第一个项目 - 项目列表:', projects.value)
  console.log('AIGeneration - 自动选择第一个项目 - 第一个项目的索引和ID:', {
    index: 0,
    id: projects.value[0].id
  })
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
  font-size: 14px;
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
</style>