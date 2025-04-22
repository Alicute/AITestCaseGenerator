<template>
    <main-layout>
      <div class="test-case-create">
        <!-- 顶部标题和操作按钮 -->
        <div class="page-header">
          <div class="left">
            <h2>新建测试用例</h2>
            <el-button @click="goBack" text>
              <el-icon><arrow-left /></el-icon>
              返回列表
            </el-button>
          </div>
          <div class="right">
            <el-button type="primary" @click="saveTestCase" :loading="saving">保存</el-button>
            <el-button type="success" @click="saveAndCreate" :loading="saving">保存并新建</el-button>
          </div>
        </div>
  
        <!-- 表单内容 -->
        <el-form 
          ref="testCaseForm" 
          :model="testCaseData" 
          :rules="rules" 
          label-position="top"
          status-icon
        >
          <!-- 基本信息区域 -->
          <el-card class="form-section">
            <template #header>
              <div class="card-header">
                <h3>基本信息</h3>
              </div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="所属项目" prop="projectId">
                  <el-select 
                    v-model="testCaseData.projectId" 
                    placeholder="请选择项目" 
                    @change="handleProjectChange"
                    style="width: 100%"
                  >
                    <el-option 
                      v-for="project in projects" 
                      :key="project.id" 
                      :label="project.name" 
                      :value="project.id" 
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="所属模块" prop="moduleId">
                  <el-cascader
                    v-model="selectedModulePath"
                    :options="moduleOptions"
                    :props="{ checkStrictly: true, emitPath: false }"
                    placeholder="请选择功能模块"
                    style="width: 100%"
                    @change="handleModuleChange"
                    :disabled="!testCaseData.projectId"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="标题" prop="title">
                  <el-input v-model="testCaseData.title" placeholder="请输入测试用例标题" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="维护人">
                  <el-input v-model="testCaseData.maintainer" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="用例类型" prop="caseType">
                  <el-select v-model="testCaseData.caseType" placeholder="请选择用例类型" style="width: 100%">
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
              <el-col :span="12">
                <el-form-item label="重要程度" prop="priority">
                  <el-select v-model="testCaseData.priority" placeholder="请选择重要程度" style="width: 100%">
                    <el-option label="P0" value="P0" />
                    <el-option label="P1" value="P1" />
                    <el-option label="P2" value="P2" />
                    <el-option label="P3" value="P3" />
                    <el-option label="P4" value="P4" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="测试类型" prop="testType">
                  <el-select v-model="testCaseData.testType" placeholder="请选择测试类型" style="width: 100%">
                    <el-option label="手动" value="手动" />
                    <el-option label="自动" value="自动" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="预估工时">
                  <el-input-number v-model="testCaseData.estimatedHours" :precision="1" :step="0.5" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="剩余工时">
                  <el-input-number v-model="testCaseData.remainingHours" :precision="1" :step="0.5" :min="0" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="关联工作项">
                  <el-input v-model="testCaseData.relatedItems" placeholder="请输入关联工作项" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="关注人">
                  <el-input v-model="testCaseData.watchers" placeholder="请输入关注人" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
  
          <!-- 前置条件区域 -->
          <el-card class="form-section">
            <template #header>
              <div class="card-header">
                <h3>前置条件</h3>
              </div>
            </template>
            
            <el-form-item>
              <el-input
                v-model="testCaseData.precondition"
                type="textarea"
                :rows="4"
                placeholder="请输入测试前置条件..."
              />
            </el-form-item>
          </el-card>
  
          <!-- 测试步骤与预期结果区域 -->
          <el-card class="form-section">
            <template #header>
              <div class="card-header">
                <h3>测试步骤与预期结果</h3>
                <el-button type="primary" plain size="small" @click="addStep">
                  <el-icon><plus /></el-icon>
                  添加步骤
                </el-button>
              </div>
            </template>
            
            <div class="steps-table">
              <div class="steps-header">
                <div class="step-description">步骤描述</div>
                <div class="step-result">预期结果</div>
                <div class="step-actions">操作</div>
              </div>
              
              <div v-for="(step, index) in testCaseData.steps" :key="index" class="steps-row">
                <div class="step-description">
                  <div class="step-number">{{ index + 1 }}.</div>
                  <el-input
                    v-model="step.description"
                    type="textarea"
                    :rows="3"
                    :placeholder="`请输入步骤${index + 1}描述`"
                  />
                </div>
                <div class="step-result">
                  <div class="step-number">{{ index + 1 }}.</div>
                  <el-input
                    v-model="step.expectedResult"
                    type="textarea"
                    :rows="3"
                    :placeholder="`请输入步骤${index + 1}预期结果`"
                  />
                </div>
                <div class="step-actions">
                  <el-button 
                    type="danger" 
                    plain 
                    size="small" 
                    circle 
                    @click="removeStep(index)"
                    :disabled="testCaseData.steps.length <= 1"
                  >
                    <el-icon><delete /></el-icon>
                  </el-button>
                </div>
              </div>
              
              <div v-if="testCaseData.steps.length === 0" class="steps-empty">
                <el-button type="primary" plain @click="addStep">添加第一个步骤</el-button>
              </div>
            </div>
          </el-card>
  
          <!-- 备注区域 -->
          <el-card class="form-section">
            <template #header>
              <div class="card-header">
                <h3>备注</h3>
              </div>
            </template>
            
            <el-form-item>
              <el-input
                v-model="testCaseData.remarks"
                type="textarea"
                :rows="3"
                placeholder="请输入测试用例备注信息..."
              />
            </el-form-item>
          </el-card>
        </el-form>
  
        <!-- 底部按钮区域 -->
        <div class="form-actions">
          <el-button @click="cancelCreate">取消</el-button>
          <el-button type="primary" @click="saveTestCase" :loading="saving">保存</el-button>
          <el-button type="success" @click="saveAndCreate" :loading="saving">保存并新建</el-button>
        </div>
      </div>
    </main-layout>
  </template>
  
  <script setup>
  import { ref, reactive, onMounted } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ArrowLeft, Plus, Delete } from '@element-plus/icons-vue'
  import MainLayout from '@/components/layout/MainLayout.vue'
  import api from '@/api'
  
  // 路由对象
  const router = useRouter()
  const route = useRoute()
  
  // 表单引用
  const testCaseForm = ref(null)
  
  // 状态变量
  const saving = ref(false)
  const loading = ref(false)
  const projects = ref([])
  const moduleOptions = ref([])
  const selectedModulePath = ref([])
  
  // 初始化测试用例数据
  const testCaseData = reactive({
    title: '',
    moduleId: '',
    projectId: '',
    maintainer: '程亮', // 默认值
    caseType: '',
    priority: 'P1', // 默认P1
    testType: '手动', // 默认手动
    estimatedHours: null,
    remainingHours: null,
    relatedItems: '',
    precondition: '',
    steps: [
      {
        order: 1,
        description: '',
        expectedResult: ''
      }
    ],
    watchers: '',
    remarks: ''
  })
  
  // 表单验证规则
  const rules = {
    title: [
      { required: true, message: '请输入测试用例标题', trigger: 'blur' },
      { min: 3, max: 100, message: '标题长度应在3到100个字符之间', trigger: 'blur' }
    ],
    moduleId: [
      { required: true, message: '请选择所属模块', trigger: 'change' }
    ],
    projectId: [
      { required: true, message: '请选择所属项目', trigger: 'change' }
    ],
    caseType: [
      { required: true, message: '请选择用例类型', trigger: 'change' }
    ],
    priority: [
      { required: true, message: '请选择重要程度', trigger: 'change' }
    ],
    testType: [
      { required: true, message: '请选择测试类型', trigger: 'change' }
    ]
  }
  
  // 加载项目列表
  const fetchProjects = async () => {
    loading.value = true
    try {
      const response = await api.project.getProjects()
      if (response.success) {
        projects.value = response.data
        
        // 检查URL中是否有预选的项目ID和模块ID
        const projectId = route.query.projectId
        const moduleId = route.query.moduleId
        
        if (projectId) {
          testCaseData.projectId = projectId
          await fetchModules(projectId)
          
          if (moduleId) {
            testCaseData.moduleId = moduleId
          }
        }
      } else {
        ElMessage.error(response.message || '获取项目列表失败')
      }
    } catch (error) {
      console.error('获取项目列表错误:', error)
      ElMessage.error('获取项目列表时发生错误')
    } finally {
      loading.value = false
    }
  }
  
  // 修改 fetchModules 函数
  const fetchModules = async (projectId) => {
    if (!projectId) return
    
    loading.value = true
    try {
      const response = await api.module.getModuleTree(projectId)
      
      if (response.success) {
        // 转换为级联选择器需要的格式
        moduleOptions.value = buildCascaderOptions(response.data)
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
  
  // 添加构建级联选择器选项的函数
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
  
  // 修改项目变更处理函数
  const handleProjectChange = (projectId) => {
    if (projectId) {
      testCaseData.moduleId = null // 清空模块选择
      selectedModulePath.value = [] // 清空级联选择器的值
      fetchModules(projectId)
    } else {
      moduleOptions.value = []
    }
  }
  
  // 添加模块变更处理函数
  const handleModuleChange = (moduleId) => {
    if (moduleId) {
      testCaseData.moduleId = moduleId
      // 确保两个值保持同步
      selectedModulePath.value = moduleId
    }
  }
  
  // 添加测试步骤
  const addStep = () => {
    testCaseData.steps.push({
      order: testCaseData.steps.length + 1,
      description: '',
      expectedResult: ''
    })
  }
  
  // 移除测试步骤
  const removeStep = (index) => {
    // 保证至少有一个步骤
    if (testCaseData.steps.length > 1) {
      testCaseData.steps.splice(index, 1)
      
      // 重新排序步骤
      testCaseData.steps.forEach((step, idx) => {
        step.order = idx + 1
      })
    }
  }
  
  // 保存测试用例
  const saveTestCase = async () => {
    try {
      await testCaseForm.value.validate()
      
      // 确认必填字段
      if (!testCaseData.moduleId) {
        ElMessage.warning('请选择所属模块')
        return
      }
      
      // 确保至少有一个步骤
      if (testCaseData.steps.length === 0) {
        ElMessage.warning('请至少添加一个测试步骤')
        return
      }
      
      // 检查步骤描述和预期结果是否填写
      const emptySteps = testCaseData.steps.filter(step => !step.description || !step.expectedResult)
      if (emptySteps.length > 0) {
        ElMessage.warning('请完整填写所有测试步骤和预期结果')
        return
      }
      
      // 开始保存
      saving.value = true
      const response = await api.testCase.createTestCase(testCaseData)
      
      if (response.success) {
        ElMessage.success('测试用例创建成功')
        
        // 返回列表页
        router.push('/testcases')
      } else {
        ElMessage.error(response.message || '创建测试用例失败')
      }
    } catch (error) {
      console.error('保存测试用例错误:', error)
      ElMessage.error('保存测试用例时发生错误')
    } finally {
      saving.value = false
    }
  }
  
  // 保存并新建
  const saveAndCreate = async () => {
    try {
      await testCaseForm.value.validate()
      
      // 确认必填字段
      if (!testCaseData.moduleId) {
        ElMessage.warning('请选择所属模块')
        return
      }
      
      // 确保至少有一个步骤
      if (testCaseData.steps.length === 0) {
        ElMessage.warning('请至少添加一个测试步骤')
        return
      }
      
      // 检查步骤描述和预期结果是否填写
      const emptySteps = testCaseData.steps.filter(step => !step.description || !step.expectedResult)
      if (emptySteps.length > 0) {
        ElMessage.warning('请完整填写所有测试步骤和预期结果')
        return
      }
      
      // 开始保存
      saving.value = true
      const response = await api.testCase.createTestCase(testCaseData)
      
      if (response.success) {
        ElMessage.success('测试用例创建成功')
        
        // 保存当前项目ID和模块ID，用于新表单
        const currentProjectId = testCaseData.projectId
        const currentModuleId = testCaseData.moduleId
        
        // 重置表单，但保持相同的项目和模块
        testCaseData.title = ''
        testCaseData.precondition = ''
        testCaseData.steps = [{ order: 1, description: '', expectedResult: '' }]
        testCaseData.remarks = ''
        testCaseData.relatedItems = ''
        testCaseData.watchers = ''
        testCaseData.estimatedHours = null
        testCaseData.remainingHours = null
        
        // 保持项目和模块选择不变
        testCaseData.projectId = currentProjectId
        testCaseData.moduleId = currentModuleId
      } else {
        ElMessage.error(response.message || '创建测试用例失败')
      }
    } catch (error) {
      console.error('保存测试用例错误:', error)
      ElMessage.error('保存测试用例时发生错误')
    } finally {
      saving.value = false
    }
  }
  
  // 取消创建
  const cancelCreate = () => {
    // 如果表单有变动，提示用户确认
    if (hasFormChanges()) {
      ElMessageBox.confirm(
        '您有未保存的更改，确定要放弃吗？',
        '确认离开',
        {
          confirmButtonText: '放弃更改',
          cancelButtonText: '继续编辑',
          type: 'warning',
        }
      )
        .then(() => {
          goBack()
        })
        .catch(() => {
          // 用户取消，继续留在当前页面
        })
    } else {
      goBack()
    }
  }
  
  // 检查表单是否有变动
  const hasFormChanges = () => {
    // 检查主要字段是否有输入
    return (
      testCaseData.title ||
      testCaseData.precondition ||
      testCaseData.remarks ||
      testCaseData.steps.some(step => step.description || step.expectedResult)
    )
  }
  
  // 返回列表页
  const goBack = () => {
    router.push('/testcases')
  }
  
  // 组件挂载时执行
  onMounted(() => {
    fetchProjects()
  })
  </script>
  
  <style scoped>
  .test-case-create {
    padding: 20px;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .page-header .left {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .page-header h2 {
    margin: 0;
  }
  
  .form-section {
    margin-bottom: 20px;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .card-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
  
  .steps-table {
    border: 1px solid #ebeef5;
    border-radius: 4px;
  }
  
  .steps-header {
    display: flex;
    background-color: #f5f7fa;
    padding: 10px;
    font-weight: bold;
  }
  
  .steps-row {
    display: flex;
    border-top: 1px solid #ebeef5;
    padding: 10px;
  }
  
  .step-description {
    flex: 1;
    display: flex;
    align-items: flex-start;
    padding-right: 10px;
  }
  
  .step-result {
    flex: 1;
    display: flex;
    align-items: flex-start;
    padding-right: 10px;
  }
  
  .step-actions {
    width: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .step-number {
    margin-right: 5px;
    padding-top: 10px;
  }
  
  .steps-empty {
    padding: 20px;
    text-align: center;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    gap: 10px;
  }
  </style>