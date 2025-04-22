<template>
  <main-layout>
    <div class="ai-generation">
      <h1>AI测试用例生成</h1>
      
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
                style="width: 250px"
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
                :props="{ checkStrictly: true, emitPath: false }"
                placeholder="请选择功能模块"
                style="width: 350px"
                @change="handleModuleChange"
                :disabled="!selectedProjectId"
              />
            </div>
          </div>
          
          <div class="selector-actions">
            <el-button 
              type="primary" 
              @click="loadModuleDescription"
              :disabled="!selectedModuleId"
            >
              加载功能点描述
            </el-button>
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
            <el-checkbox-group v-model="selectedFunctions">
              <el-checkbox 
                v-for="func in moduleFunctions" 
                :key="func.id" 
                :label="func.id"
              >
                {{ func.name }}
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
        
        <div class="template-selector">
          <el-radio-group v-model="selectedTemplate" class="template-radio-group">
            <el-radio-button label="standard">标准测试</el-radio-button>
            <el-radio-button label="functional">功能测试</el-radio-button>
            <el-radio-button label="boundary">边界测试</el-radio-button>
            <el-radio-button label="exception">异常测试</el-radio-button>
            <el-radio-button label="custom">自定义...</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="prompt-editor">
          <el-form-item label="编辑提示词:">
            <el-input
              v-model="promptContent"
              type="textarea"
              :rows="8"
              placeholder="请编辑生成测试用例的提示词..."
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
          <div v-for="(testCase, index) in parsedTestCases" :key="index" class="test-case-item">
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

const router = useRouter()
const route = useRoute()

// 状态变量
const loading = ref(false)
const generating = ref(false)
const saving = ref(false)
const projects = ref([])
const moduleOptions = ref([])
const moduleFunctions = ref([])
const selectedFunctions = ref([])

// 选择的项目和模块
const selectedProjectId = ref('')
const selectedModulePath = ref([])
const selectedModuleId = ref(null)
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
      ElMessage.error(response.message || '获取项目列表失败')
    }
  } catch (error) {
    console.error('获取项目列表错误:', error)
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
      // 转换为级联选择器需要的格式
      moduleOptions.value = buildCascaderOptions(response.data)
      
      // 如果路由中有模块ID，自动选择
      const routeModuleId = route.query.moduleId
      if (routeModuleId) {
        const moduleId = parseInt(routeModuleId)
        selectedModuleId.value = moduleId
        // 同时设置级联选择器的值，确保UI显示正确
        selectedModulePath.value = moduleId
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

// 构建级联选择器选项
const buildCascaderOptions = (modules) => {
  const rootModules = modules.filter(m => !m.parentId)
  
  const buildTree = (parentId) => {
    const children = modules.filter(m => m.parentId === parentId)
    
    return children.map(module => {
      const hasChildren = modules.some(m => m.parentId === module.id)
      
      return {
        value: module.id,
        label: module.name,
        children: hasChildren ? buildTree(module.id) : []
      }
    })
  }
  
  return rootModules.map(module => {
    const hasChildren = modules.some(m => m.parentId === module.id)
    
    return {
      value: module.id,
      label: module.name,
      children: hasChildren ? buildTree(module.id) : []
    }
  })
}

// 项目变更处理
const handleProjectChange = (projectId) => {
  if (projectId) {
    fetchModuleTree(projectId)
    selectedModuleId.value = null
    currentModuleDescription.value = ''
    moduleFunctions.value = []
    selectedFunctions.value = []
  }
}

// 模块变更处理
const handleModuleChange = (moduleId) => {
  if (moduleId) {
    selectedModuleId.value = moduleId
    // 确保两个值保持同步
    selectedModulePath.value = moduleId
    currentModuleDescription.value = ''
    moduleFunctions.value = []
    selectedFunctions.value = []
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
  
  // 获取选中的功能点描述
  const functionDescriptions = selectedFunctions.value
    .map(id => {
      const func = moduleFunctions.value.find(f => f.id === id)
      return func ? func.name : ''
    })
    .filter(name => name)
    .join('、')
  
  const moduleDesc = currentModuleDescription.value
  
  if (selectedTemplate.value === 'standard') {
    promptContent.value = `生成针对"${selectedModuleName.value}"的测试用例，包括正常情况和异常情况。${functionDescriptions ? `主要功能点包括：${functionDescriptions}。` : ''}${moduleDesc ? `模块描述：${moduleDesc}` : ''}

每个测试用例应包括:
1. 标题
2. 前置条件
3. 步骤
4. 预期结果

请每个功能点生成至少3个测试用例，确保覆盖主要功能和关键场景。`
  } else if (selectedTemplate.value === 'functional') {
    promptContent.value = `生成针对"${selectedModuleName.value}"的功能测试用例。${functionDescriptions ? `主要功能点包括：${functionDescriptions}。` : ''}${moduleDesc ? `模块描述：${moduleDesc}` : ''}

重点关注功能的正确性和完整性。每个测试用例应包括:
1. 标题
2. 前置条件
3. 测试数据
4. 步骤
5. 预期结果

请每个功能点生成至少3个功能测试用例，确保覆盖所有关键功能点。`
  } else if (selectedTemplate.value === 'boundary') {
    promptContent.value = `生成针对"${selectedModuleName.value}"的边界测试用例。${functionDescriptions ? `主要功能点包括：${functionDescriptions}。` : ''}${moduleDesc ? `模块描述：${moduleDesc}` : ''}

重点关注输入参数的边界条件、极限值和特殊情况。每个测试用例应包括:
1. 标题
2. 测试场景描述
3. 边界值/特殊值
4. 步骤
5. 预期结果

请每个功能点生成至少3个边界测试用例，包括最小值、最大值和特殊输入场景。`
  } else if (selectedTemplate.value === 'exception') {
    promptContent.value = `生成针对"${selectedModuleName.value}"的异常测试用例。${functionDescriptions ? `主要功能点包括：${functionDescriptions}。` : ''}${moduleDesc ? `模块描述：${moduleDesc}` : ''}

重点关注系统错误处理、异常流程和容错性。每个测试用例应包括:
1. 标题
2. 异常场景描述
3. 触发条件
4. 步骤
5. 预期结果

请每个功能点生成至少3个异常测试用例，测试系统对各种错误和意外情况的处理能力。`
  }
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

// 组件挂载时执行
onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.ai-generation {
  width: 100%;
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
  gap: 15px;
}

.selector-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.selector-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.selector-label {
  font-weight: bold;
  color: #606266;
  width: 70px;
  margin-right: 8px;
}

.selector-actions {
  margin-top: 10px;
}

.loading-container {
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin-top: 20px;
}

.module-description {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
}

.description-content {
  margin-bottom: 20px;
}

.function-list {
  margin-top: 20px;
}

.function-list h4 {
  margin-bottom: 10px;
  color: #303133;
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
</style>