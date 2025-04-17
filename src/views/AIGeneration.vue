<template>
  <main-layout>
    <div class="ai-generation">
      <h1>AI测试用例生成</h1>
      
      <!-- 选择功能点区域 -->
      <el-card class="section-card">
        <template #header>
          <div class="card-header">
            <span>选择功能点</span>
          </div>
        </template>
        
        <div class="module-selector">
          <el-cascader
            v-model="selectedModulePath"
            :options="moduleOptions"
            :props="{ checkStrictly: true, emitPath: true }"
            placeholder="请选择功能模块"
            style="width: 500px"
            @change="handleModuleChange"
          />
          <el-button type="primary" @click="loadModuleDescription">加载功能点描述</el-button>
        </div>
        
        <div class="module-description" v-if="currentModuleDescription">
          <h3>{{ getSelectedModuleName() }}</h3>
          <p>{{ currentModuleDescription }}</p>
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
        <el-button type="primary" size="large" @click="generateTestCases">生成测试用例</el-button>
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
          <pre>{{ generationResult }}</pre>
        </div>
      </el-card>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import MainLayout from '@/components/layout/MainLayout.vue'

// 模块选项数据
const moduleOptions = ref([
  {
    value: 'deploy',
    label: '系统部署',
    children: [
      {
        value: 'install',
        label: '安装'
      },
      {
        value: 'config',
        label: '配置',
        children: [
          {
            value: 'init-config',
            label: '初始化配置'
          },
          {
            value: 'param-settings',
            label: '参数设置'
          },
          {
            value: 'permission-config',
            label: '权限配置'
          },
          {
            value: 'network-settings',
            label: '网络设置'
          }
        ]
      },
      {
        value: 'upgrade',
        label: '升级'
      },
      {
        value: 'maintenance',
        label: '维护'
      }
    ]
  },
  {
    value: 'image-capture',
    label: '采集图像',
    children: [
      {
        value: 'single-capture',
        label: '单张采集'
      },
      {
        value: 'batch-capture',
        label: '批量采集'
      },
      {
        value: 'live-preview',
        label: '实时预览'
      }
    ]
  },
  {
    value: 'device-management',
    label: '设备管理'
  },
  {
    value: 'image-editing',
    label: '图像编辑'
  }
])

// 状态数据
const selectedModulePath = ref([])
const currentModuleDescription = ref('')
const selectedTemplate = ref('standard')
const promptContent = ref('')
const showAdvancedSettings = ref(false)
const generationResult = ref('')

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

// 获取选中的模块名称
const getSelectedModuleName = () => {
  if (!selectedModulePath.value || selectedModulePath.value.length === 0) {
    return ''
  }
  
  let result = ''
  let currentOptions = moduleOptions.value
  
  for (const key of selectedModulePath.value) {
    const found = currentOptions.find(option => option.value === key)
    if (found) {
      if (result) {
        result += ' > '
      }
      result += found.label
      currentOptions = found.children || []
    }
  }
  
  return result
}

// 模块变更处理
const handleModuleChange = (value) => {
  // 在实际应用中，可能需要根据选择的路径获取模块的真实描述
  currentModuleDescription.value = ''
}

// 加载模块描述
const loadModuleDescription = () => {
  if (selectedModulePath.value.length === 0) {
    ElMessage.warning('请先选择功能模块')
    return
  }
  
  // 模拟从服务器加载模块描述
  setTimeout(() => {
    const moduleName = getSelectedModuleName()
    currentModuleDescription.value = `${moduleName}是系统的重要功能模块之一，负责处理相关的业务流程和数据。该模块需要进行全面的测试，确保其各项功能正常工作，包括基本功能、边界条件和异常情况处理。`
    
    // 根据选择的模块自动更新提示词内容
    updatePromptContent()
  }, 300)
}

// 更新提示词内容
const updatePromptContent = () => {
  const moduleName = getSelectedModuleName()
  
  if (selectedTemplate.value === 'standard') {
    promptContent.value = `生成针对"${moduleName}"的测试用例，包括正常情况和异常情况。测试用例应覆盖主要功能点。每个测试用例应包括:
1. 标题
2. 前置条件
3. 步骤
4. 预期结果`
  } else if (selectedTemplate.value === 'functional') {
    promptContent.value = `生成针对"${moduleName}"的功能测试用例。重点关注功能的正确性和完整性。每个测试用例应包括:
1. 标题
2. 前置条件
3. 测试数据
4. 步骤
5. 预期结果`
  } else if (selectedTemplate.value === 'boundary') {
    promptContent.value = `生成针对"${moduleName}"的边界测试用例。重点关注输入参数的边界条件、极限值和特殊情况。每个测试用例应包括:
1. 标题
2. 测试场景描述
3. 边界值/特殊值
4. 步骤
5. 预期结果`
  } else if (selectedTemplate.value === 'exception') {
    promptContent.value = `生成针对"${moduleName}"的异常测试用例。重点关注系统错误处理、异常流程和容错性。每个测试用例应包括:
1. 标题
2. 异常场景描述
3. 触发条件
4. 步骤
5. 预期结果`
  }
}

// 监听模板变化
watch(selectedTemplate, (newTemplate) => {
  if (newTemplate !== 'custom' && currentModuleDescription.value) {
    updatePromptContent()
  }
})

// 生成测试用例
const generateTestCases = () => {
  if (!currentModuleDescription.value) {
    ElMessage.warning('请先加载功能点描述')
    return
  }
  
  if (!promptContent.value) {
    ElMessage.warning('请输入提示词')
    return
  }
  
  // 显示加载提示
  ElMessage.info('正在生成测试用例，请稍候...')
  
  // 模拟请求延迟
  setTimeout(() => {
    // 这里是模拟的测试用例结果
    generationResult.value = `测试用例 1: 验证初始配置参数有效性
前置条件:
  1. 系统已完成安装
  2. 用户具有管理员权限
  3. 系统处于配置状态

步骤:
  1. 以管理员身份登录系统
  2. 进入"系统配置"模块
  3. 在初始化配置页面，填写所有必填参数
  4. 包括：服务器IP、端口、用户名、密码、数据库连接等
  5. 点击"保存配置"按钮

预期结果:
  1. 系统验证参数有效性
  2. 所有配置参数成功保存
  3. 系统显示配置成功消息
  4. 日志记录配置操作
  
-----------------------------

测试用例 2: 缺少必填参数的异常处理
前置条件:
  1. 系统已完成安装
  2. 用户具有管理员权限
  3. 系统处于配置状态

步骤:
  1. 以管理员身份登录系统
  2. 进入"系统配置"模块
  3. 在初始化配置页面，故意不填写服务器IP地址等必填字段
  4. 点击"保存配置"按钮

预期结果:
  1. 系统验证失败，不允许保存配置
  2. 系统提示错误消息:"服务器IP地址为必填项"
  3. 焦点自动定位到缺失的必填字段
  
-----------------------------

测试用例 3: 权限控制验证
前置条件:
  1. 系统已完成安装
  2. 用户具有普通用户权限（非管理员）
  3. 系统处于配置状态

步骤:
  1. 以普通用户身份登录系统
  2. 尝试进入"系统配置"模块
  3. 尝试修改初始化配置

预期结果:
  1. 系统阻止普通用户访问配置模块
  2. 显示权限不足的提示信息
  3. 记录未授权访问尝试`
  }, 1000)
}

// 保存到测试用例
const saveToTestCases = () => {
  if (!generationResult.value) {
    ElMessage.warning('没有可保存的测试用例')
    return
  }
  
  ElMessage.success('已保存到测试用例列表')
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
  selectedModulePath.value = []
  currentModuleDescription.value = ''
  promptContent.value = ''
  generationResult.value = ''
  ElMessage.info('表单已重置')
}
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

.module-selector {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.module-description {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin-top: 20px;
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
  max-height: 400px;
  overflow-y: auto;
}

.generation-result pre {
  white-space: pre-wrap;
  font-family: 'Consolas', 'Monaco', monospace;
  line-height: 1.5;
}
</style>