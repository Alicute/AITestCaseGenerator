<template>
  <main-layout>
    <div class="module-design">
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>模块设计</el-breadcrumb-item>
          <el-breadcrumb-item>
            <el-dropdown @command="handleProjectChange" trigger="click">
              <span class="el-dropdown-link">
                {{ getCurrentProjectName() }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item 
                    v-for="project in projectsList" 
                    :key="project.id" 
                    :command="project.id"
                  >
                    {{ project.name }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="10" animated />
      </div>

      <div v-else class="module-container-flex">
        <!-- 左侧模块树 -->
        <div class="module-tree">
          <div class="tree-actions">
            <el-button type="primary" @click="showAddRootModuleDialog">添加根模块</el-button>
            <el-button type="success" @click="showAiGenerateDialog" :icon="MagicStick">AI生成模块</el-button>
            <el-button @click="toggleExpandAll">{{ isAllExpanded ? '折叠' : '展开' }}</el-button>
            <el-button @click="importDialogVisible = true">导入模块</el-button>
          </div>
          <div class="tree-scroll-area">
          <el-tree
            ref="moduleTreeRef"
            :data="moduleTree"
            :props="defaultProps"
            @node-click="handleNodeClick"
            node-key="id"
            :expand-on-click-node="false"
            highlight-current
            :current-node-key="currentModule && currentModule.id"
            :default-expanded-keys="expandedKeys"
          >
            <template #default="{ node, data }">
              <div class="custom-tree-node">
                <span>{{ node.label }}</span>
                <span class="node-actions">
                  <el-button size="small" @click.stop="appendNode(data)">添加</el-button>
                  <el-button size="small" type="danger" @click.stop="removeNode(node, data)">删除</el-button>
                </span>
              </div>
            </template>
          </el-tree>
        </div>
        </div>

        <!-- 右侧内容区 -->
        <div class="module-detail">
          <div v-if="currentModule">
            <div class="module-header">
              <h2>{{ currentModule.name }}</h2>
              <p v-if="currentModule.description" class="module-description">{{ currentModule.description }}</p>
            </div>
            <div class="module-actions">
              <el-button type="primary" @click="editModule">编辑模块</el-button>
            </div>
            
            <div class="tabs-section">
              <el-tabs v-model="activeTab">
                <el-tab-pane label="功能点" name="functions">
                  <div class="tab-actions">
                    <el-button type="primary" @click="showAddFunctionDialog">添加功能点</el-button>
                  </div>
                  
                  <el-table :data="moduleFunctions" border height="400">
                    <el-table-column prop="name" label="功能点名称" />
                    <el-table-column prop="description" label="描述" />
                    <el-table-column prop="priority" label="优先级" width="100">
                      <template #default="scope">
                        <el-tag v-if="scope.row.priority === 'high'" type="danger">高</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'medium'" type="warning">中</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'low'" type="success">低</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="200">
                      <template #default="scope">
                        <el-button size="small" @click="editFunction(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteFunction(scope.row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>

                <el-tab-pane label="测试用例" name="testcases">
                  <div class="tab-actions">
                    <el-button type="primary" @click="goToAIGenerate">AI生成测试用例</el-button>
                    <el-button @click="goToTestCases">查看全部测试用例</el-button>
                  </div>
                  
                  <el-table :data="moduleTestCases" border height="400">
                    <el-table-column prop="title" label="测试用例名称" />
                    <el-table-column prop="priority" label="优先级" width="100">
                      <template #default="scope">
                        <el-tag :type="getTestCasePriorityTagType(scope.row.priority)">
                          {{ scope.row.priority || 'P1' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                      <template #default="scope">
                        <el-tag :type="getTestCaseStatusTagType(scope.row.status)">
                          {{ scope.row.status || '未执行' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="300">
                      <template #default="scope">
                        <el-button size="small" @click="viewTestCase(scope.row)">查看</el-button>
                        <el-button size="small" type="primary" @click="editTestCase(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteTestCase(scope.row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
          <el-empty v-else description="请选择一个模块查看详情"></el-empty>
        </div>
      </div>

      <!-- 添加模块对话框 -->
      <el-dialog
        v-model="addModuleDialogVisible"
        :title="editingModule ? '编辑模块' : '添加模块'"
        width="800px"
      >
        <el-form :model="newModule" label-width="120px">
          <el-form-item label="模块名称" required>
            <el-input v-model="newModule.name" placeholder="请输入模块名称" />
          </el-form-item>

          <el-form-item v-if="!projectId && !editingModule" label="所属项目" required>
            <el-select v-model="newModule.projectId" placeholder="请选择项目" filterable>
              <el-option
                v-for="project in projectsList"
                :key="project.id"
                :label="project.name"
                :value="project.id"
              />
            </el-select>
            <div class="form-tip">选择一个项目来保存此模块</div>
          </el-form-item>

          <el-form-item label="模块描述">
            <el-input
              v-model="newModule.description"
              type="textarea"
              placeholder="请输入模块描述"
              rows="10"
            />
          </el-form-item>
          <el-form-item label="测试标签">
            <el-select v-model="newModule.labels" multiple placeholder="选择标签（用例未设置时继承）" style="width:100%">
              <el-option label="冒烟" value="smoke" />
              <el-option label="回归" value="regression" />
              <el-option label="全量" value="full" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addModuleDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              @click="editingModule ? saveModule() : addModule()"
              :loading="submitting"
            >
              {{ editingModule ? '保存' : '确定' }}
            </el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 添加功能点对话框 -->
      <el-dialog
        v-model="addFunctionDialogVisible"
        :title="editingFunction ? '编辑功能点' : '添加功能点'"
        width="800px"
      >
        <el-form :model="newFunction" label-width="120px">
          <el-form-item label="功能点名称">
            <el-input v-model="newFunction.name" placeholder="请输入功能点名称" />
          </el-form-item>
          <el-form-item label="功能描述">
            <el-input
              v-model="newFunction.description"
              type="textarea"
              placeholder="请输入功能描述"
              rows="10"
            />
          </el-form-item>
          <el-form-item label="优先级">
            <el-select v-model="newFunction.priority" placeholder="请选择优先级">
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addFunctionDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addFunction" :loading="submitting">
              {{ editingFunction ? '保存' : '确定' }}
            </el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 导入模块对话框 -->
      <el-dialog v-model="importDialogVisible" title="导入模块" width="500px">
        <div class="import-container">
          <el-upload
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :limit="1"
            accept=".md,.markdown,.json"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">支持 Markdown (.md/.markdown) 或 JSON (.json) 文件</div>
            </template>
          </el-upload>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="importDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="importModules" :loading="importLoading"
              >导入</el-button
            >
          </span>
        </template>
      </el-dialog>
      <!-- AI生成模块对话框 -->
      <el-dialog 
        v-model="aiGenerateDialogVisible" 
        title="AI 智能生成模块" 
        width="900px"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <div class="ai-generate-container">
          <div class="input-section" v-if="!aiGeneratedResult">
            <el-alert
              title="输入业务背景或上传产品截图，AI将自动为您设计模块结构"
              type="info"
              show-icon
              :closable="false"
              style="margin-bottom: 15px"
            />
            
            <el-form label-position="top">
              <div class="ai-generate-form">
          <div class="form-tip">
             提示：AI配置请前往 "设置 -> AI设置" 进行全局配置。
          </div>
          <el-input
            v-model="aiPrompt"
            type="textarea"
            :rows="4"
            placeholder="请输入业务描述，例如：设计一个电商系统的注册登录模块，包含手机号注册、微信登录、找回密码等功能。"
            class="mb-2"
          />
          
          <el-form-item label="产品截图 (可选)">
                <el-upload
                  action="#"
                  list-type="picture-card"
                  :auto-upload="false"
                  :on-change="handleAiImageChange"
                  :on-remove="handleAiImageRemove"
                  accept="image/*"
                  :limit="3"
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
                <div class="form-tip">支持上传界面截图，帮助AI更准确理解功能结构 (最多3张)</div>
              </el-form-item>
          </div>
         </el-form>
          </div>
          
          <div class="result-section" v-else>
            <div class="result-header">
              <h3>生成结果预览</h3>
              <div class="result-actions">
                <el-button size="small" @click="aiGeneratedResult = null">重新生成</el-button>
              </div>
            </div>
            
            <div class="json-preview">
              <!-- 使用简单的树形展示而非纯JSON -->
              <el-tree
                :data="aiGeneratedModuleTree"
                :props="{ label: 'name', children: 'children' }"
                default-expand-all
              >
                 <template #default="{ node, data }">
                  <span class="custom-tree-node">
                    <span>
                      {{ node.label }}
                      <el-tag size="small" v-if="data.functions && data.functions.length">{{ data.functions.length }}个功能点</el-tag>
                    </span>
                  </span>
                </template>
              </el-tree>
            </div>
            
            <el-divider />
            
            <div class="raw-json-toggle">
               <el-collapse>
                <el-collapse-item title="查看原始 JSON 数据">
                   <pre class="json-code">{{ JSON.stringify(aiGeneratedModuleTree, null, 2) }}</pre>
                </el-collapse-item>
               </el-collapse>
            </div>
          </div>
        </div>
        
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="aiGenerateDialogVisible = false">取消</el-button>
            <el-button 
              v-if="!aiGeneratedResult"
              type="primary" 
              @click="generateAiModules" 
              :loading="aiGenerating"
            >
              开始生成 (Magic)
            </el-button>
             <el-button 
              v-else
              type="primary" 
              @click="confirmImportAiModules" 
              :loading="importLoading"
            >
              确认导入
            </el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, MagicStick, Plus } from '@element-plus/icons-vue'
import MainLayout from '@/components/layout/MainLayout.vue'
import api from '@/api'
import { useSelectionStore } from '@/stores/selection'

const router = useRouter()
const route = useRoute()
const selectionStore = useSelectionStore()
const projectId = computed(() => route.query.projectId || null)
const projectsList = ref([])
const selectedProjectId = ref(null)

// 加载状态
const loading = ref(false)
const submitting = ref(false)
const importLoading = ref(false)
const importDialogVisible = ref(false)
const fileList = ref([])

// 当前选中的模块
const currentModule = ref(null)
const activeTab = ref('functions')
const pendingSelectedModuleId = ref(null)

// 模块数据树
const moduleTree = ref([])
const moduleTreeRef = ref(null)
const defaultProps = {
  children: 'children',
  label: 'name'
}
// 记录展开的节点
const expandedKeys = ref([])
// 是否全部展开的状态
const isAllExpanded = ref(false)

// 功能点数据
const moduleFunctions = ref([])

// 测试用例数据
const moduleTestCases = ref([])

const findModuleInTree = (modules, moduleId) => {
  for (const module of modules) {
    if (module.id === moduleId) {
      return module
    }
    if (module.children && module.children.length > 0) {
      const found = findModuleInTree(module.children, moduleId)
      if (found) {
        return found
      }
    }
  }

  return null
}

const findModulePathInTree = (modules, moduleId, path = []) => {
  for (const module of modules) {
    const nextPath = [...path, module.id]
    if (module.id === moduleId) {
      return nextPath
    }
    if (module.children && module.children.length > 0) {
      const found = findModulePathInTree(module.children, moduleId, nextPath)
      if (found.length > 0) {
        return found
      }
    }
  }

  return []
}

const selectModuleById = async (moduleId) => {
  const module = findModuleInTree(moduleTree.value, moduleId)
  if (!module) {
    return false
  }

  currentModule.value = module
  selectionStore.setSelectedModule({
    id: module.id,
    name: module.name,
    path: findModulePathInTree(moduleTree.value, module.id)
  })

  await Promise.all([fetchModuleFunctions(module.id), fetchModuleTestCases(module.id)])

  nextTick(() => {
    moduleTreeRef.value?.setCurrentKey(module.id)
  })

  return true
}

// 获取项目信息
const projectInfo = ref({})
const fetchProjectInfo = async () => {
  const currentId = selectedProjectId.value || projectId.value
  if (!currentId) return

  try {
    loading.value = true
    const response = await api.project.getProject(currentId)

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

// 获取当前项目名称
const getCurrentProjectName = () => {
  if (projectInfo.value && projectInfo.value.name) {
    return projectInfo.value.name
  }
  
  const currentId = selectedProjectId.value || (projectId.value ? Number(projectId.value) : null)
  if (currentId) {
    const project = projectsList.value.find(p => p.id === currentId)
    if (project) return project.name
  }
  
  return '选择项目'
}

// 处理项目选择变化
const handleProjectChange = (projectId) => {
  if (projectId) {
    selectedProjectId.value = projectId
    const project = projectsList.value.find((item) => item.id === projectId)
    if (project) {
      selectionStore.setSelectedProject(project)
    }
    router.push(`/modules?projectId=${projectId}`)
  }
}

// 监听 selectedProjectId 变化
watch(selectedProjectId, async (newProjectId) => {
  if (newProjectId) {
    try {
      projectInfo.value = {}
      await Promise.all([fetchProjectInfo(), fetchModuleTree(true)])
    } catch (error) {
      console.error('切换项目时更新数据失败:', error)
      ElMessage.error('切换项目时更新数据失败')
    }
  }
})

// 监听路由参数变化，当URL中的projectId变化时更新selectedProjectId
watch(
  () => route.query.projectId,
  (newProjectId) => {
    const normalizedProjectId = newProjectId ? Number(newProjectId) : null
    if (normalizedProjectId && normalizedProjectId !== selectedProjectId.value) {
      selectedProjectId.value = normalizedProjectId
    }
  },
  { immediate: true }
)

// 监听项目列表变化
watch(projectsList, (newProjects) => {
  if (newProjects.length > 0 && route.query.projectId) {
    // 确保选中的项目ID在项目列表中
    const routeProjectId = Number(route.query.projectId)
    const project = newProjects.find(p => p.id === routeProjectId)
    if (project) {
      selectedProjectId.value = project.id
    }
  }
}, { immediate: true })

// 获取模块树数据
const fetchModuleTree = async (forceRefresh = false) => {
  loading.value = true
  try {
    // 使用API方法获取模块树，增加时间戳参数避免缓存
    const timestamp = forceRefresh ? Date.now() : undefined;
    const currentProjectId = selectedProjectId.value || projectId.value;
    
    const response = await api.module.getModuleTree(currentProjectId, timestamp)

    if (response.success) {
      
      // 确保UI更新前先清空数据
      moduleTree.value = [];
      await nextTick();
      
      // 重新构建模块树
      moduleTree.value = buildModuleTree(response.data)
      
      // 如果有模块，默认选中第一个
      if (moduleTree.value.length > 0) {
        const restoreModuleId =
          pendingSelectedModuleId.value ||
          currentModule.value?.id ||
          selectionStore.selectedModuleId

        if (restoreModuleId && (await selectModuleById(restoreModuleId))) {
          pendingSelectedModuleId.value = null
        } else {
          pendingSelectedModuleId.value = null
          await selectModuleById(moduleTree.value[0].id)
        }

        // 如果之前没有展开的节点，默认展开第一个根节点
        if (expandedKeys.value.length === 0) {
          expandedKeys.value.push(moduleTree.value[0].id)
        }
      } else {
        // 如果没有模块，清空当前模块选择
        currentModule.value = null
        moduleFunctions.value = []
        moduleTestCases.value = []
        selectionStore.setSelectedModule(null)
      }
    } else {
      ElMessage.error(response.message || '获取模块树失败')
    }
  } catch (error) {
    console.error('获取模块树错误:', error)
    ElMessage.error('获取模块树时发生错误')
    // 出错时也清空数据，防止显示陈旧数据
    moduleTree.value = [];
    currentModule.value = null;
    moduleFunctions.value = [];
    moduleTestCases.value = [];
    selectionStore.setSelectedModule(null)
  } finally {
    loading.value = false
  }
}

// 构建模块树结构（从扁平结构转换为嵌套结构）
const buildModuleTree = (modules) => {
  // 后端已经返回了嵌套结构，如果数据已经有children字段，直接使用返回的数据
  // 检查第一项是否已经包含children字段
  if (modules.length > 0 && modules.some(module => module.children)) {
    
    // 确保所有根模块默认展开
    modules.forEach(module => {
      if (module.children && module.children.length > 0) {
        if (!expandedKeys.value.includes(module.id)) {
          expandedKeys.value.push(module.id)
        }
      }
    })
    
    return modules;
  }
  
  // 如果没有嵌套结构，使用原来的逻辑进行转换
  const moduleMap = {}
  const rootModules = []

  // 先创建一个以id为键的映射
  modules.forEach((module) => {
    moduleMap[module.id] = {
      ...module,
      children: []
    }
  })

  // 然后建立父子关系
  modules.forEach((module) => {
    if (module.parentId) {
      // 有父模块
      if (moduleMap[module.parentId]) {
        moduleMap[module.parentId].children.push(moduleMap[module.id])
      } else {
        // 父模块不存在，作为根模块处理
        rootModules.push(moduleMap[module.id])
      }
    } else {
      // 没有父模块，是根模块
      rootModules.push(moduleMap[module.id])
    }
  })

  // 确保所有根模块默认展开
  rootModules.forEach(module => {
    if (module.children && module.children.length > 0) {
      if (!expandedKeys.value.includes(module.id)) {
        expandedKeys.value.push(module.id)
      }
    }
  })

  return rootModules
}

// 获取模块的功能点列表
// 修改 fetchModuleFunctions 函数
const fetchModuleFunctions = async (moduleId) => {
  if (!moduleId) {
    moduleFunctions.value = [] // 确保是空数组
    return
  }

  loading.value = true
  try {
    const response = await api.module.getModuleFunctions(moduleId)

    if (response.success) {
      // 确保数据是数组
      moduleFunctions.value = Array.isArray(response.data) ? response.data : []
    } else {
      ElMessage.error(response.message || '获取功能点列表失败')
      moduleFunctions.value = [] // 确保错误时也是空数组
    }
  } catch (error) {
    console.error('获取功能点列表错误:', error)
    ElMessage.error('获取功能点列表时发生错误')
    moduleFunctions.value = [] // 确保错误时也是空数组
  } finally {
    loading.value = false
  }
}

// 修改 fetchModuleTestCases 函数
const fetchModuleTestCases = async (moduleId) => {
  if (!moduleId) {
    moduleTestCases.value = [] // 确保是空数组
    return
  }

  loading.value = true
  try {
    const response = await api.testCase.getTestCases({ 
      moduleId,
      limit: 1000 // 设置一个足够大的限制来获取所有测试用例
    })
    if (response.success) {
      // 确保数据是数组
      moduleTestCases.value = Array.isArray(response.data) ? response.data : []
      // 更新当前模块的测试用例数量
      if (currentModule.value) {
        currentModule.value.testCaseCount = response.total || 0
      }
    } else {
      ElMessage.error(response.message || '获取测试用例列表失败')
      moduleTestCases.value = [] // 确保错误时也是空数组
      // 更新当前模块的测试用例数量为0
      if (currentModule.value) {
        currentModule.value.testCaseCount = 0
      }
    }
  } catch (error) {
    console.error('获取测试用例列表错误:', error)
    ElMessage.error('获取测试用例列表时发生错误')
    moduleTestCases.value = [] // 确保错误时也是空数组
    // 更新当前模块的测试用例数量为0
    if (currentModule.value) {
      currentModule.value.testCaseCount = 0
    }
  } finally {
    loading.value = false
  }
}
// 监听树结构变化，维持展开状态
watch(
  moduleTree,
  () => {
    if (isAllExpanded.value && moduleTreeRef.value && moduleTreeRef.value.store) {
      nextTick(() => {
        const nodeMap = moduleTreeRef.value.store.nodesMap
        if (nodeMap) {
          Object.values(nodeMap).forEach((node) => {
            if (node.childNodes && node.childNodes.length > 0 && !node.expanded) {
              node.expand()
            }
          })
        }
      })
    }
  },
  { deep: true }
)



// 保存滚动位置
let lastScrollTop = 0;

const saveScroll = () => {
  const scrollArea = document.querySelector('.tree-scroll-area');
  if (scrollArea) lastScrollTop = scrollArea.scrollTop;
};

const restoreScroll = () => {
  const scrollArea = document.querySelector('.tree-scroll-area');
  if (scrollArea) scrollArea.scrollTop = lastScrollTop;
};

// 节点点击事件
const handleNodeClick = async (data) => {
  saveScroll(); // 先记录滚动条位置
  // 保存当前展开状态，防止被覆盖
  const wasAllExpanded = isAllExpanded.value

  // 如果节点有子节点，确保它被展开
  if (data.children && data.children.length > 0) {
    if (!expandedKeys.value.includes(data.id)) {
      expandedKeys.value.push(data.id)
    }
  }

  // 原有的节点点击逻辑
  await selectModuleById(data.id)
  nextTick(() => {
    if (moduleTreeRef.value) {
      moduleTreeRef.value.setCurrentKey(data.id);
      setTimeout(() => {
        restoreScroll(); // 恢复滚动条位置
      }, 50);
    }
  });

  // 如果之前是全部展开状态，确保维持此状态
  if (wasAllExpanded && !isAllExpanded.value) {
    isAllExpanded.value = wasAllExpanded
  }
}

// 展开/折叠所有节点
const toggleExpandAll = () => {
  console.log('当前状态:', isAllExpanded.value)

  // 确保树组件已加载
  if (!moduleTreeRef.value || !moduleTreeRef.value.store) {
    console.error('树组件未加载或store不存在')
    return
  }

  try {
    const nodeMap = moduleTreeRef.value.store.nodesMap
    if (!nodeMap) {
      console.error('节点映射不存在')
      return
    }

    if (isAllExpanded.value) {
      console.log('执行折叠操作')
      // 清空展开的节点列表 - 这是折叠功能修复的关键
      expandedKeys.value.length = 0
      // 使用树组件的内部方法折叠所有节点
      Object.values(nodeMap).forEach((node) => {
        if (node.expanded) {
          node.collapse()
        }
      })
      isAllExpanded.value = false
    } else {
      console.log('执行展开操作')
      // 收集所有可展开节点的ID
      const allNodeIds = []
      Object.values(nodeMap).forEach((node) => {
        if (node.data && node.data.id) {
          // 只添加有子节点的节点
          if (node.childNodes && node.childNodes.length > 0) {
            allNodeIds.push(node.data.id)
            // 确保节点被展开
            node.expand()
          }
        }
      })

      // 更新展开的节点列表
      expandedKeys.value.length = 0 // 先清空数组
      expandedKeys.value.push(...allNodeIds) // 然后添加所有ID
      isAllExpanded.value = true
    }
  } catch (error) {
    console.error('展开/折叠操作出错:', error)
  }

  console.log('操作后状态:', isAllExpanded.value)
  console.log('操作后已展开节点:', expandedKeys.value)
}

// 添加模块相关
const addModuleDialogVisible = ref(false)
const newModule = ref({
  name: '',
  description: '',
  parentId: null,
  labels: []
})
const editingModule = ref(null)

// 添加根模块
const showAddRootModuleDialog = () => {
  editingModule.value = null
  newModule.value = {
    name: '',
    description: '',
    parentId: null,
    projectId: projectId.value
  }
  addModuleDialogVisible.value = true
}

// 添加子节点
const appendNode = (data) => {
  editingModule.value = null
  newModule.value = {
    name: '',
    description: '',
    parentId: data.id,
    projectId: projectId.value
  }
  // 确保父节点展开
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
  addModuleDialogVisible.value = true
}

// 添加模块
const addModule = async () => {
  if (!newModule.value.name) {
    ElMessage.warning('请输入模块名称')
    return
  }

  // 检查是否选择了项目
  if (!projectId.value && !newModule.value.projectId) {
    ElMessage.warning('请选择一个项目')
    return
  }

  submitting.value = true
  try {
    // 确保有项目ID
    if (!newModule.value.projectId && projectId.value) {
      newModule.value.projectId = projectId.value
    }

    const response = await api.module.createModule(newModule.value)

    if (response.success) {
      addModuleDialogVisible.value = false
      ElMessage.success('模块添加成功')

      // 如果是在无项目模式下添加的模块，并且选择了项目，则重定向到该项目
      if (!projectId.value && newModule.value.projectId) {
        router.push(`/modules?projectId=${newModule.value.projectId}`)
        return
      }

      // 保存新创建的模块ID，以便在刷新树后高亮显示
      const newModuleId = response.data.id
      const parentId = newModule.value.parentId
      pendingSelectedModuleId.value = newModuleId

      // 完全刷新模块树，强制从服务器重新加载
      moduleTree.value = []
      await fetchModuleTree(true) // 强制刷新，避免缓存问题

      // 等待DOM更新
      await nextTick()

      // 如果是子模块，确保父节点展开
      if (parentId) {
        // 确保父节点展开
        if (!expandedKeys.value.includes(parentId)) {
          expandedKeys.value.push(parentId)
          
          // 如果使用Element Plus树组件，手动展开父节点
          if (moduleTreeRef.value && moduleTreeRef.value.store) {
            const parentNode = moduleTreeRef.value.store.nodesMap[parentId]
            if (parentNode && !parentNode.expanded) {
              parentNode.expand()
            }
          }
        }
      }
    } else {
      ElMessage.error(response.message || '添加模块失败')
    }
  } catch (error) {
    console.error('添加模块错误:', error)
    ElMessage.error('添加模块时发生错误')
  } finally {
    submitting.value = false
  }
}

// 删除节点
const removeNode = async (node, data) => {
  try {
    // 先检查是否有子模块
    const hasChildModules = data.children && data.children.length > 0;
    
    // 检查是否有功能点
    let hasFunctions = false;
    const functionResponse = await api.module.getModuleFunctions(data.id);
    if (functionResponse.success && functionResponse.data && functionResponse.data.length > 0) {
      hasFunctions = true;
    }
    
    // 检查是否有测试用例
    let hasTestCases = false;
    const testCaseResponse = await api.testCase.getTestCases({ moduleId: data.id });
    if (testCaseResponse.success && testCaseResponse.data && testCaseResponse.data.length > 0) {
      hasTestCases = true;
    }
    
    // 如果有子模块或功能点或测试用例，给出更详细的警告
    let warningMessage = `确定要删除模块 "${node.label}" 吗？`;
    let warningDetail = '';
    
    if (hasChildModules) {
      warningDetail += '• 该模块包含子模块，删除将同时删除所有子模块。\n';
    }
    
    if (hasFunctions) {
      warningDetail += '• 该模块包含功能点，删除将同时删除所有功能点。\n';
    }
    
    if (hasTestCases) {
      warningDetail += '• 该模块包含测试用例，删除将同时删除所有测试用例。\n';
    }
    
    if (warningDetail) {
      warningMessage += '\n\n' + warningDetail;
    }
    
    ElMessageBox.confirm(
      warningMessage,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
      .then(async () => {
        try {
          const response = await api.module.deleteModule(data.id)

          if (response.success) {
            ElMessage.success('模块删除成功')

            // 如果当前选中的是被删除的模块，清空选择
            if (currentModule.value && currentModule.value.id === data.id) {
              currentModule.value = null
              moduleFunctions.value = []
              moduleTestCases.value = []
            }

            // 刷新模块树
            fetchModuleTree()
          } else {
            ElMessage.error(response.message || '删除模块失败')
            // 尽管API调用没有成功，但我们仍需要尝试刷新模块树
            // 这样用户可以看到当前的状态
            fetchModuleTree()
          }
        } catch (error) {
          console.error('删除模块错误:', error)
          
          // 提供更详细的错误信息
          let errorMessage = '删除模块时发生错误'
          if (error.response) {
            // 服务器返回了错误状态码
            if (error.response.status === 500) {
              errorMessage = '服务器内部错误：可能是该模块存在其他关联数据，请联系管理员'
            } else if (error.response.data && error.response.data.message) {
              errorMessage = `删除失败: ${error.response.data.message}`
            }
          }
          
          ElMessage.error(errorMessage)
          
          // 即使出错也刷新模块树，确保UI与后端状态同步
          fetchModuleTree()
        }
      })
      .catch(() => {
        // 用户取消了操作
      })
  } catch (error) {
    console.error('检查模块关联数据时出错:', error);
    ElMessage.error('检查模块关联数据时发生错误，请稍后重试');
  }
}

// 编辑模块
const editModule = () => {
  if (!currentModule.value) return

  editingModule.value = currentModule.value
  newModule.value = {
    id: currentModule.value.id,
    name: currentModule.value.name,
    description: currentModule.value.description,
    parentId: currentModule.value.parentId,
    projectId: projectId.value,
    labels: currentModule.value.labels || []
  }

  addModuleDialogVisible.value = true
}

// 保存模块编辑
const saveModule = async () => {
  if (!newModule.value.name) {
    ElMessage.warning('请输入模块名称')
    return
  }

  submitting.value = true
  try {
    const updateData = {
      name: newModule.value.name,
      description: newModule.value.description,
      labels: newModule.value.labels && newModule.value.labels.length ? newModule.value.labels : null
    }
    const response = await api.module.updateModule(newModule.value.id, updateData)

    if (response.success) {
      addModuleDialogVisible.value = false
      ElMessage.success('模块更新成功')

      // 刷新模块树
      fetchModuleTree()
    } else {
      ElMessage.error(response.message || '更新模块失败')
    }
  } catch (error) {
    console.error('更新模块错误:', error)
    ElMessage.error('更新模块时发生错误')
  } finally {
    submitting.value = false
  }
}

// 功能点相关
const addFunctionDialogVisible = ref(false)
const newFunction = ref({
  name: '',
  description: '',
  priority: 'medium'
})
const editingFunction = ref(null)

// 显示添加功能点对话框
const showAddFunctionDialog = () => {
  editingFunction.value = null
  newFunction.value = {
    name: '',
    description: '',
    priority: 'medium',
    moduleId: currentModule.value.id
  }
  addFunctionDialogVisible.value = true
}

// 添加功能点
const addFunction = async () => {
  if (!newFunction.value.name) {
    ElMessage.warning('请输入功能点名称')
    return
  }

  submitting.value = true
  try {
    let response
    
    if (editingFunction.value) {      // 更新功能点
      response = await api.function.updateFunction(editingFunction.value.id, newFunction.value)
    } else {
      // 添加新功能点
      response = await api.function.createFunction(newFunction.value)
    }

    if (response.success) {
      addFunctionDialogVisible.value = false
      ElMessage.success(editingFunction.value ? '功能点更新成功' : '功能点添加成功')

      // 刷新功能点列表
      fetchModuleFunctions(currentModule.value.id)
    } else {
      ElMessage.error(
        response.message || (editingFunction.value ? '更新功能点失败' : '添加功能点失败')
      )
    }
  } catch (error) {
    console.error(editingFunction.value ? '更新功能点错误:' : '添加功能点错误:', error)
    ElMessage.error(editingFunction.value ? '更新功能点时发生错误' : '添加功能点时发生错误')
  } finally {
    submitting.value = false
  }
}

// 编辑功能点
const editFunction = (row) => {
  editingFunction.value = row
  newFunction.value = {
    ...row,
    moduleId: currentModule.value.id
  }
  addFunctionDialogVisible.value = true
}

// 删除功能点
const deleteFunction = (row) => {
  ElMessageBox.confirm(`确定要删除功能点 "${row.name}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await api.function.deleteFunction(row.id)

        if (response.success) {
          ElMessage.success('功能点删除成功')
          // 刷新功能点列表
          fetchModuleFunctions(currentModule.value.id)
        } else {
          ElMessage.error(response.message || '删除功能点失败')
        }
      } catch (error) {
        console.error('删除功能点错误:', error)
        ElMessage.error('删除功能点时发生错误')
      }
    })
    .catch(() => {
      // 用户取消了操作
    })
}

// 测试用例相关
const getTestCasePriorityTagType = (priority) => {
  const priorityTypeMap = {
    P0: 'danger',
    P1: 'danger',
    P2: 'warning',
    P3: 'success',
    P4: 'info'
  }

  return priorityTypeMap[priority] || 'info'
}

const getTestCaseStatusTagType = (status) => {
  const statusTypeMap = {
    未执行: 'info',
    执行中: 'warning',
    通过: 'success',
    失败: 'danger'
  }

  return statusTypeMap[status] || 'info'
}

const viewTestCase = (testCase) => {
  router.push(`/testcases?projectId=${projectId.value}&moduleId=${testCase.moduleId || currentModule.value?.id}`)
}

const editTestCase = (testCase) => {
  router.push(`/testcases?projectId=${projectId.value}&moduleId=${testCase.moduleId || currentModule.value?.id}`)
}

const deleteTestCase = (testCase) => {
  ElMessageBox.confirm(`确定要删除测试用例 "${testCase.title}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      try {
        const response = await api.testCase.deleteTestCase(testCase.id)

        if (response.success) {
          ElMessage.success('测试用例删除成功')

          // 刷新测试用例列表
          fetchModuleTestCases(currentModule.value.id)
        } else {
          ElMessage.error(response.message || '删除测试用例失败')
        }
      } catch (error) {
        console.error('删除测试用例错误:', error)
        ElMessage.error('删除测试用例时发生错误')
      }
    })
    .catch(() => {
      // 用户取消了操作
    })
}

// 导入/导出相关
const handleFileChange = (file) => {
  fileList.value = [file]
}

// 从Markdown解析模块结构
const parseMarkdownModules = (markdownText) => {
  const moduleTree = []
  let currentModule = null
  let currentLevel = 0
  let currentFunction = null
  let isReadingDescription = false
  let isReadingModuleDescription = false
  let currentChildModule = null
  let lastProcessedLine = ''

  // 分割文本为行
  const lines = markdownText.split('\n')

  for (let line of lines) {
    line = line.trim()

    // 检测标题级别
    if (line.startsWith('# ')) {
      // 顶级标题，不作为模块处理
      currentLevel = 1
      currentModule = null
      currentChildModule = null
      isReadingDescription = false
      isReadingModuleDescription = false
    } else if (line.startsWith('## ')) {
      // 二级标题，作为根模块
      const moduleName = line.substring(3).trim()
      currentModule = {
        name: moduleName,
        description: '',
        parentId: null,
        projectId: projectId.value,
        children: [],
        functions: []
      }
      moduleTree.push(currentModule)
      currentLevel = 2
      currentChildModule = null
      isReadingDescription = false
      isReadingModuleDescription = false
    } else if (line.startsWith('### ')) {
      // 三级标题，作为子模块
      if (currentModule) {
        const moduleName = line.substring(4).trim()
        currentChildModule = {
          name: moduleName,
          description: '',
          parentId: null,
          projectId: projectId.value,
          children: [],
          functions: []
        }
        currentModule.children.push(currentChildModule)
      }
      currentLevel = 3
      isReadingDescription = false
      isReadingModuleDescription = false
    } else if (line.startsWith('- ')) {
      // 列表项作为功能点
      const functionName = line.substring(2).trim()
      if (functionName) {
        currentFunction = {
          name: functionName,
          description: '',
          priority: 'medium'
        }
        // 根据当前级别决定功能点属于哪个模块
        if (currentLevel === 3 && currentChildModule) {
          if (!currentChildModule.functions) {
            currentChildModule.functions = []
          }
          currentChildModule.functions.push(currentFunction)
        } else if (currentLevel === 2 && currentModule) {
          if (!currentModule.functions) {
            currentModule.functions = []
          }
          currentModule.functions.push(currentFunction)
        }
        isReadingDescription = false
        isReadingModuleDescription = false
      }
    } else if (line.startsWith('> ')) {
      // 引用块作为描述
      const descriptionLine = line.substring(2).trim()
      
      // 检查上一行是否是标题
      if (lastProcessedLine.startsWith('## ') || lastProcessedLine.startsWith('### ')) {
        // 如果是标题后的描述，添加到对应的模块
        if (currentLevel === 2 && currentModule) {
          if (currentModule.description) {
            currentModule.description += '\n' + descriptionLine
          } else {
            currentModule.description = descriptionLine
          }
          isReadingModuleDescription = true
        } else if (currentLevel === 3 && currentChildModule) {
          if (currentChildModule.description) {
            currentChildModule.description += '\n' + descriptionLine
          } else {
            currentChildModule.description = descriptionLine
          }
          isReadingModuleDescription = true
        }
      } else if (currentFunction) {
        // 如果是功能点的描述
        if (currentFunction.description) {
          currentFunction.description += '\n' + descriptionLine
        } else {
          currentFunction.description = descriptionLine
        }
        isReadingDescription = true
      }
    } else if (line) {
      // 继续读取描述内容（支持多行）
      if (isReadingDescription && currentFunction) {
        currentFunction.description += '\n' + line
      } else if (isReadingModuleDescription) {
        if (currentLevel === 3 && currentChildModule) {
          currentChildModule.description += '\n' + line
        } else if (currentLevel === 2 && currentModule) {
          currentModule.description += '\n' + line
        }
      }
    }

    // 保存当前处理的行，用于下一轮判断
    lastProcessedLine = line
  }

  return moduleTree
}

const createImportSummary = () => ({
  createdModules: 0,
  createdFunctions: 0,
  failedModules: 0,
  failedFunctions: 0,
  errors: [],
  firstCreatedModuleId: null
})

const appendImportError = (summary, message) => {
  if (summary.errors.length < 5) {
    summary.errors.push(message)
  }
}

const normalizeImportedModule = (module, parentId = null, depth = 1) => {
  const rawName = typeof module?.name === 'string' ? module.name.trim() : ''
  let normalizedName = rawName
  let level = depth

  if (normalizedName.startsWith('# ')) {
    normalizedName = normalizedName.substring(2).trim()
  } else if (normalizedName.startsWith('## ')) {
    normalizedName = normalizedName.substring(3).trim()
    level = 1
  } else if (normalizedName.startsWith('### ')) {
    normalizedName = normalizedName.substring(4).trim()
    level = Math.max(depth, 2)
  }

  return {
    name: normalizedName,
    description: module?.description || '',
    parentId,
    level
  }
}

const normalizeImportedFunction = (func, moduleId) => {
  if (typeof func === 'string') {
    const name = func.replace(/^- /, '').trim()
    if (!name) {
      return null
    }

    return {
      name,
      moduleId,
      priority: 'medium'
    }
  }

  if (!func || typeof func !== 'object' || !func.name) {
    return null
  }

  return {
    name: func.name.trim(),
    description: func.description || '',
    priority: func.priority || 'medium',
    moduleId
  }
}

const buildImportResultMessage = (summary) => {
  const baseMessage = `模块 ${summary.createdModules} 个，功能点 ${summary.createdFunctions} 个`

  if (summary.failedModules === 0 && summary.failedFunctions === 0) {
    return `导入成功：${baseMessage}`
  }

  if (summary.createdModules === 0 && summary.createdFunctions === 0) {
    const detailMessage = summary.errors.length > 0 ? `：${summary.errors.join('；')}` : ''
    return `导入失败${detailMessage}`
  }

  const failedMessage = `失败模块 ${summary.failedModules} 个，失败功能点 ${summary.failedFunctions} 个`
  const detailMessage = summary.errors.length > 0 ? `；示例：${summary.errors.join('；')}` : ''
  return `部分导入成功：${baseMessage}；${failedMessage}${detailMessage}`
}

// 递归导入模块树
const importModuleTree = async (modules, parentId = null) => {
  if (!projectInfo.value.id) {
    throw new Error('请先选择项目后再导入模块')
  }

  const summary = createImportSummary()

  if (modules.length === 1 && modules[0].name && modules[0].name.startsWith('# ')) {
    if (modules[0].children && modules[0].children.length > 0) {
      await processModules(modules[0].children, parentId, 1, summary)
    }
    return summary
  }

  await processModules(modules, parentId, 1, summary)
  return summary
}

// 处理模块列表
const processModules = async (modules, parentId = null, depth = 1, summary = createImportSummary()) => {
  for (const module of modules) {
    const modulePayload = normalizeImportedModule(module, parentId, depth)
    const functions = Array.isArray(module?.functions) ? module.functions : []
    const children = Array.isArray(module?.children) ? module.children : []

    if (!modulePayload.name) {
      summary.failedModules += 1
      appendImportError(summary, '存在未命名模块，已跳过')
      continue
    }

    try {
      const response = await api.module.createModule({
        ...modulePayload,
        projectId: projectInfo.value.id
      })

      if (!response.success || !response.data?.id) {
        summary.failedModules += 1
        appendImportError(summary, `模块 "${modulePayload.name}" 创建失败`)
        continue
      }

      const newModuleId = response.data.id
      summary.createdModules += 1
      if (!summary.firstCreatedModuleId) {
        summary.firstCreatedModuleId = newModuleId
      }

      for (const func of functions) {
        const functionPayload = normalizeImportedFunction(func, newModuleId)
        if (!functionPayload) {
          summary.failedFunctions += 1
          appendImportError(summary, `模块 "${modulePayload.name}" 存在无效功能点，已跳过`)
          continue
        }

        try {
          const functionResponse = await api.function.createFunction(functionPayload)
          if (functionResponse.success) {
            summary.createdFunctions += 1
          } else {
            summary.failedFunctions += 1
            appendImportError(summary, `功能点 "${functionPayload.name}" 创建失败`)
          }
        } catch (error) {
          console.error('导入功能点错误:', error)
          summary.failedFunctions += 1
          appendImportError(
            summary,
            `功能点 "${functionPayload.name}" 创建失败：${error.response?.data?.message || error.message}`
          )
        }
      }

      if (children.length > 0) {
        await processModules(children, newModuleId, depth + 1, summary)
      }
    } catch (error) {
      console.error('导入模块错误:', error)
      summary.failedModules += 1
      appendImportError(
        summary,
        `模块 "${modulePayload.name}" 创建失败：${error.response?.data?.message || error.message}`
      )
    }
  }

  return summary
}




// AI 生成模块相关
const aiGenerateDialogVisible = ref(false)
const aiPrompt = ref('')
const aiImages = ref([]) // 存储 { uid, dataUrl }
const aiGenerating = ref(false)
const aiGeneratedResult = ref(null)
const aiGeneratedModuleTree = ref([]) // 用于预览与导入

const normalizeAiGeneratedModules = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  if (data && typeof data === 'object') {
    return [data]
  }

  if (typeof data === 'string') {
    const jsonContent = data.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(jsonContent)
    return Array.isArray(parsed) ? parsed : [parsed]
  }

  return []
}


// 显示AI生成对话框
const showAiGenerateDialog = () => {
  aiGenerateDialogVisible.value = true
  aiPrompt.value = ''
  aiImages.value = []
  aiGeneratedResult.value = null
  aiGeneratedModuleTree.value = []
}

// 处理图片选择
const handleAiImageChange = (file) => {
  const reader = new FileReader()
  reader.readAsDataURL(file.raw)
  reader.onload = () => {
    aiImages.value = aiImages.value
      .filter((item) => item.uid !== file.uid)
      .concat({ uid: file.uid, dataUrl: reader.result })
  }
}

const handleAiImageRemove = (file) => {
  aiImages.value = aiImages.value.filter((item) => item.uid !== file.uid)
}

// 调用AI生成
const generateAiModules = async () => {
   if(!aiPrompt.value && aiImages.value.length === 0){
      ElMessage.warning('请输入业务描述或上传图片');
      return;
   }

   aiGenerating.value = true;
   try {
      const response = await api.ai.generateModules({
         prompt: aiPrompt.value,
         images: aiImages.value.map((item) => item.dataUrl)
      });

      if(response.success){
         aiGeneratedModuleTree.value = normalizeAiGeneratedModules(response.data);
         if (aiGeneratedModuleTree.value.length === 0) {
            ElMessage.error('AI返回了空的模块结构');
            return;
         }
         aiGeneratedResult.value = response.data;
         ElMessage.success('生成成功，请预览确认');
      } else {
         ElMessage.error(response.message || '生成失败');
      }
   } catch (error) {
      console.error('AI生成失败:', error);
      ElMessage.error(error.response?.data?.message || 'AI生成请求发生错误');
   } finally {
      aiGenerating.value = false;
   }
}

// 确认导入AI生成的模块
const confirmImportAiModules = async () => {
   if(aiGeneratedModuleTree.value.length === 0){
      ElMessage.warning('没有可导入的数据');
      return;
   }
   
   importLoading.value = true;
   try {
      const summary = await importModuleTree(aiGeneratedModuleTree.value);
      if (summary.createdModules > 0) {
        pendingSelectedModuleId.value = summary.firstCreatedModuleId
        aiGenerateDialogVisible.value = false
        await fetchModuleTree(true)
      }

      if (summary.failedModules > 0 || summary.failedFunctions > 0) {
        ElMessage.warning(buildImportResultMessage(summary))
      } else {
        ElMessage.success(buildImportResultMessage(summary))
      }
   } catch (error) {
      console.error('导入AI模块失败:', error);
      ElMessage.error(error.message || '导入失败');
   } finally {
      importLoading.value = false;
   }
}

// 导入模块
const importModules = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importLoading.value = true
  try {
    const file = fileList.value[0].raw
    if (!file) {
      ElMessage.error('无法读取文件')
      importLoading.value = false
      return
    }

    // 使用FileReader读取文件内容
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target.result
        let moduleTree = []

        if (file.name.toLowerCase().endsWith('.json')) {
          try {
            moduleTree = JSON.parse(content)
            // 简单的结构校验
            if (!Array.isArray(moduleTree)) {
              throw new Error('格式错误：根节点必须是数组')
            }
          } catch (jsonError) {
            ElMessage.error('JSON 解析失败: ' + jsonError.message)
            importLoading.value = false
            return
          }
        } else {
          // 默认为 Markdown
          moduleTree = parseMarkdownModules(content)
        }

        if (moduleTree.length === 0) {
          ElMessage.warning('未解析到有效的模块结构')
          importLoading.value = false
          return
        }

        // 开始导入
        const summary = await importModuleTree(moduleTree)

        if (summary.createdModules > 0) {
          pendingSelectedModuleId.value = summary.firstCreatedModuleId
          importDialogVisible.value = false
          await fetchModuleTree(true)
        }

        if (summary.failedModules > 0 || summary.failedFunctions > 0) {
          ElMessage.warning(buildImportResultMessage(summary))
        } else {
          ElMessage.success(buildImportResultMessage(summary))
        }
      } catch (error) {
        console.error('解析文件错误:', error)
        ElMessage.error(error.message || '解析文件时发生错误')
      } finally {
        importLoading.value = false
      }
    }

    reader.onerror = () => {
      ElMessage.error('读取文件时发生错误')
      importLoading.value = false
    }

    reader.readAsText(file)
  } catch (error) {
    console.error('导入模块错误:', error)
    ElMessage.error('导入模块时发生错误')
    importLoading.value = false
  }
}

// 导航
const goToAIGenerate = () => {
  const moduleId = currentModule.value?.id
  // 同时传递项目ID和模块ID
  router.push(`/ai-generate?projectId=${projectId.value}&moduleId=${moduleId}`)
}

const goToTestCases = () => {
  const moduleId = currentModule.value?.id
  router.push(`/testcases?projectId=${projectId.value}&moduleId=${moduleId}`)
}

// 组件挂载时加载数据
onMounted(async () => {
  try {
    await Promise.all([fetchProjects(), fetchProjectInfo(), fetchModuleTree()])
    
    // 从路由参数中获取项目ID
    if (route.query.projectId) {
      selectedProjectId.value = Number(route.query.projectId)
    } else if (selectionStore.selectedProjectId) {
      selectedProjectId.value = selectionStore.selectedProjectId
      router.push(`/modules?projectId=${selectionStore.selectedProjectId}`)
    } else if (projectsList.value.length > 0) {
      // 只有在没有项目ID参数时才自动选择第一个项目
      selectedProjectId.value = projectsList.value[0].id
      router.push(`/modules?projectId=${projectsList.value[0].id}`)
    }
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  }
})
</script>

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

<style scoped>
.module-design {
  padding: 20px;
}

.module-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.module-tree {
  width: 300px;
}

.module-content {
  flex: 1;
}

.module-header {
  text-align: left;
  margin-bottom: 20px;
}

.module-header h2 {
  margin-bottom: 10px;
}

.module-description {
  color: #666;
  margin-bottom: 15px;
}

.module-actions {
  text-align: left;
  margin-bottom: 20px;
}

.tabs-section {
  margin-top: 20px;
}

.tab-actions {
  text-align: left;
  margin-bottom: 15px;
}

.el-table {
  margin-top: 10px;
}

.tree-actions {
  margin-bottom: 10px;
}

.custom-tree-node {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.node-actions {
  display: none;
}

.custom-tree-node:hover .node-actions {
  display: inline-block;
}

.module-container-flex {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  height: 100%;
  min-height: 0;
}
.module-tree {
  width: 300px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-right: 1px solid #eee;
  background: #fff;
}
.tree-scroll-area {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
}
.module-detail {
  flex: 1 1 0;
  padding: 24px 24px 24px 32px;
  overflow: auto;
  min-width: 0;
}

.module-container-flex {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  height: calc(100vh - 100px); /* 或100%，确保有高度 */
  min-height: 0;
}
.module-tree {
  width: 300px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-right: 1px solid #eee;
  background: #fff;
}
.tree-actions {
  flex-shrink: 0;
}
.tree-scroll-area {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  /* 关键：必须有高度，flex: 1 1 0 + min-height: 0 */
}

/* AI生成相关样式 */
.ai-generate-container {
   max-height: 60vh;
   overflow-y: auto;
   padding: 10px;
}
.json-code {
   background: #f4f4f4;
   padding: 10px;
   border-radius: 4px;
   font-size: 12px;
   max-height: 200px;
   overflow-y: auto;
}
.form-tip {
   color: #909399;
   font-size: 12px;
   margin-top: 5px;
}
</style>
