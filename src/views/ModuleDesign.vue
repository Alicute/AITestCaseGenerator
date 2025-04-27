<template>
  <main-layout>
    <div class="module-design">
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>模块设计</el-breadcrumb-item>
          <el-breadcrumb-item>
            <el-dropdown @command="handleProjectChange" trigger="click">
              <span class="el-dropdown-link">
                {{ getCurrentProjectName() }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
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

      <div v-else class="module-container">
        <!-- 左侧模块树 -->
        <div class="module-tree-container">
          <el-card class="module-tree">
            <div v-if="!projectId" class="no-project-warning">
              <el-alert
                title="未选择项目"
                type="warning"
                :closable="false"
                description=""
                show-icon
              />
              <div class="project-selector">
                <el-select
                  v-model="selectedProjectId"
                  placeholder="选择项目"
                  style="width: 100%; margin-top: 10px"
                  @change="handleProjectChange"
                >
                  <el-option
                    v-for="project in projectsList"
                    :key="project.id"
                    :label="project.name"
                    :value="project.id"
                  >
                    <span>{{ project.name }}</span>
                  </el-option>
                </el-select>
                <el-button
                  type="primary"
                  size="small"
                  style="margin-top: 10px; width: 100%"
                  @click="goToCreateProject"
                >
                  创建新项目
                </el-button>
              </div>
            </div>
            <div class="tree-header">
              <div class="primary-action">
                <el-button size="small" type="primary" @click="showAddRootModuleDialog">
                  <el-icon><plus /></el-icon>
                  添加根模块
                </el-button>
              </div>
              <div class="secondary-actions">
                <el-button size="small" @click="toggleExpandAll">
                  <el-icon>
                    <Folder v-if="!isAllExpanded" />
                    <FolderOpened v-else />
                  </el-icon>
                  {{ isAllExpanded ? '折叠' : '展开' }}
                </el-button>
                <el-button size="small" @click="showImportDialog">导入</el-button>
                <el-button size="small" @click="exportModules">导出</el-button>
              </div>
            </div>

            <div v-if="moduleTree.length === 0" class="empty-tree">
              <el-empty description="暂无模块数据，请使用上方的添加根模块按钮创建新模块" />
            </div>

            <el-tree
              ref="moduleTreeRef"
              v-else
              :data="moduleTree"
              :props="defaultProps"
              @node-click="handleNodeClick"
              @node-expand="handleNodeExpand"
              @node-collapse="handleNodeCollapse"
              node-key="id"
              :expand-on-click-node="false"
              highlight-current
              :default-expanded-keys="expandedKeys"
              :current-node-key="currentModule?.id"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <span>{{ node.label }}</span>
                  <span class="node-actions">
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      circle
                      @click.stop="appendNode(data)"
                    >
                      <el-icon><plus /></el-icon>
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      plain
                      circle
                      @click.stop="removeNode(node, data)"
                    >
                      <el-icon><delete /></el-icon>
                    </el-button>
                  </span>
                </div>
              </template>
            </el-tree>
          </el-card>
        </div>

        <!-- 右侧内容区 -->
        <div class="module-content">
          <el-card v-if="currentModule">
            <div class="content-header">
              <h2>{{ currentModule.name }}</h2>
              <div class="content-actions">
                <el-button type="primary" @click="editModule">编辑模块</el-button>
              </div>
            </div>

            <el-tabs v-model="activeTab" class="module-tabs">
              <el-tab-pane label="基本信息" name="info">
                <div class="info-section">
                  <div class="info-item">
                    <div class="item-label">模块名称:</div>
                    <div class="item-value">{{ currentModule.name }}</div>
                  </div>
                  <div class="info-item">
                    <div class="item-label">创建日期:</div>
                    <div class="item-value">{{ formatDate(currentModule.createdAt) }}</div>
                  </div>
                  <div class="info-item">
                    <div class="item-label">测试用例数量:</div>
                    <div class="item-value">{{ currentModule.testCaseCount || 0 }}</div>
                  </div>
                  <div class="info-item">
                    <div class="item-label">描述:</div>
                    <div class="item-value">{{ currentModule.description || '无描述' }}</div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="功能点" name="functions">
                <div class="function-list">
                  <div v-if="moduleFunctions.length === 0" class="empty-functions">
                    <el-empty description="暂无功能点数据" />
                    <el-button type="primary" @click="showAddFunctionDialog">添加功能点</el-button>
                  </div>

                  <template v-else>
                    <el-table
                      :data="moduleFunctions"
                      style="width: 100%"
                      height="569px"
                      :row-key="(row) => row.id"
                      :default-sort="{ prop: 'priority', order: 'ascending' }"
                      :resize-observer="false"
                      table-layout="fixed"
                      :scrollbar-always-on="true"
                    >
                      <el-table-column prop="name" label="功能点名称" />
                      <el-table-column prop="description" label="描述" />
                      <el-table-column prop="priority" label="优先级" width="120">
                        <template #default="scope">
                          <el-tag v-if="scope.row.priority === 'high'" type="danger">高</el-tag>
                          <el-tag v-else-if="scope.row.priority === 'medium'" type="warning"
                            >中</el-tag
                          >
                          <el-tag v-else-if="scope.row.priority === 'low'" type="success"
                            >低</el-tag
                          >
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="180">
                        <template #default="scope">
                          <el-button size="small" @click="editFunction(scope.row)">编辑</el-button>
                          <el-button size="small" type="danger" @click="deleteFunction(scope.row)"
                            >删除</el-button
                          >
                        </template>
                      </el-table-column>
                    </el-table>

                    <div class="function-actions">
                      <el-button type="primary" @click="showAddFunctionDialog"
                        >添加功能点</el-button
                      >
                    </div>
                  </template>
                </div>
              </el-tab-pane>

              <el-tab-pane label="测试用例" name="testcases">
                <div class="testcase-list">
                  <el-empty
                    v-if="moduleTestCases.length === 0"
                    description="暂无测试用例，请先添加或生成测试用例"
                  ></el-empty>
                  <el-table
                    v-else
                    :data="moduleTestCases"
                    style="width: 100%;height: 569px; overflow: auto;"
                    table-layout="fixed"
                    :resize-observer="false"
                  >
                    <el-table-column prop="title" label="测试用例名称" />
                    <el-table-column prop="priority" label="优先级" width="120">
                      <template #default="scope">
                        <el-tag v-if="scope.row.priority === 'high'" type="danger">高</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'medium'" type="warning"
                          >中</el-tag
                        >
                        <el-tag v-else-if="scope.row.priority === 'low'" type="success">低</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="120">
                      <template #default="scope">
                        <el-tag v-if="scope.row.status === 'passed'" type="success">通过</el-tag>
                        <el-tag v-else-if="scope.row.status === 'failed'" type="danger"
                          >失败</el-tag
                        >
                        <el-tag v-else type="info">未执行</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220">
                      <template #default="scope">
                        <el-button size="small" @click="viewTestCase(scope.row)">查看</el-button>
                        <el-button size="small" type="primary" @click="editTestCase(scope.row)"
                          >编辑</el-button
                        >
                        <el-button size="small" type="danger" @click="deleteTestCase(scope.row)"
                          >删除</el-button
                        >
                      </template>
                    </el-table-column>
                  </el-table>

                  <div class="testcase-actions">
                    <el-button type="primary" @click="goToAIGenerate">AI生成测试用例</el-button>
                    <el-button @click="goToTestCases">查看全部测试用例</el-button>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>

          <el-empty v-else description="请选择一个模块查看详情"></el-empty>
        </div>
      </div>

      <!-- 添加模块对话框 -->
      <el-dialog
        v-model="addModuleDialogVisible"
        :title="editingModule ? '编辑模块' : '添加模块'"
        width="500px"
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
            />
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
        width="500px"
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
            accept=".md,.markdown"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">只能上传Markdown文件（.md/.markdown）</div>
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
    </div>
  </main-layout>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Folder, FolderOpened, ArrowDown } from '@element-plus/icons-vue'
import MainLayout from '@/components/layout/MainLayout.vue'
// 导入API而不是直接使用axios
import api from '@/api'

const router = useRouter()
const route = useRoute()
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
const activeTab = ref('info')

// 模块数据树
const moduleTree = ref([])
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

// 获取项目信息
const projectInfo = ref({})
const fetchProjectInfo = async () => {
  if (!projectId.value) return

  try {
    loading.value = true
    const response = await api.project.getProject(projectId.value)

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
  
  if (projectId.value) {
    const project = projectsList.value.find(p => p.id === projectId.value)
    if (project) return project.name
  }
  
  return '选择项目'
}

// 处理项目选择变化
const handleProjectChange = (projectId) => {
  if (projectId) {
    selectedProjectId.value = projectId
    router.push(`/modules?projectId=${projectId}`)
  }
}

// 监听 selectedProjectId 变化
watch(selectedProjectId, async (newProjectId) => {
  if (newProjectId) {
    try {
      await Promise.all([fetchProjectInfo(), fetchModuleTree()])
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
    if (newProjectId && newProjectId !== selectedProjectId.value) {
      selectedProjectId.value = newProjectId
    }
  },
  { immediate: true }
)

// 监听项目列表变化
watch(projectsList, (newProjects) => {
  if (newProjects.length > 0 && route.query.projectId) {
    // 确保选中的项目ID在项目列表中
    const project = newProjects.find(p => p.id === route.query.projectId)
    if (project) {
      selectedProjectId.value = project.id
    }
  }
}, { immediate: true })

// 跳转到创建项目页面
const goToCreateProject = () => {
  router.push('/projects')
}

// 获取模块树数据
const fetchModuleTree = async () => {
  loading.value = true
  try {
    // 使用API方法获取模块树
    const response = await api.module.getModuleTree(projectId.value)

    if (response.success) {
      moduleTree.value = buildModuleTree(response.data)
      // 如果有模块，默认选中第一个
      if (moduleTree.value.length > 0) {
        currentModule.value = moduleTree.value[0]
        fetchModuleFunctions(currentModule.value.id)
        fetchModuleTestCases(currentModule.value.id)

        // 如果之前没有展开的节点，默认展开第一个根节点
        if (expandedKeys.value.length === 0) {
          expandedKeys.value.push(currentModule.value.id)
        }
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

// 构建模块树结构（从扁平结构转换为嵌套结构）
const buildModuleTree = (modules) => {
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
// 节点点击事件
const handleNodeClick = (data) => {
  // 保存当前展开状态，防止被覆盖
  const wasAllExpanded = isAllExpanded.value

  // 原有的节点点击逻辑
  currentModule.value = data
  fetchModuleFunctions(data.id)
  fetchModuleTestCases(data.id)

  // 如果之前是全部展开状态，确保维持此状态
  if (wasAllExpanded && !isAllExpanded.value) {
    isAllExpanded.value = wasAllExpanded
  }
}

// 节点展开事件处理
const handleNodeExpand = (data) => {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
  // 不要在这里修改isAllExpanded
}

// 节点折叠事件处理
const handleNodeCollapse = (data) => {
  const index = expandedKeys.value.indexOf(data.id)
  if (index !== -1) {
    expandedKeys.value.splice(index, 1)
  }
  // 不要在这里修改isAllExpanded
}
// 添加一个ref
// 添加树组件的ref
const moduleTreeRef = ref(null)
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
  parentId: null
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

      // 刷新模块树
      await fetchModuleTree()

      // 找到新创建的模块，并设置为当前选中
      if (newModuleId) {
        // 如果是子模块，确保父节点展开
        if (parentId && !expandedKeys.value.includes(parentId)) {
          expandedKeys.value.push(parentId)
        }

        // 查找并选中新模块
        const findAndSelectModule = (modules) => {
          for (const module of modules) {
            if (module.id === newModuleId) {
              currentModule.value = module
              fetchModuleFunctions(module.id)
              fetchModuleTestCases(module.id)
              return true
            }
            if (module.children && module.children.length > 0) {
              if (findAndSelectModule(module.children)) {
                return true
              }
            }
          }
          return false
        }

        findAndSelectModule(moduleTree.value)
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
    projectId: projectId.value
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
      description: newModule.value.description
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
const viewTestCase = (testCase) => {
  router.push(`/testcases/${testCase.id}`)
}

const editTestCase = (testCase) => {
  router.push(`/testcases/${testCase.id}/edit`)
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
const showImportDialog = () => {
  importDialogVisible.value = true
  fileList.value = []
}

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

  // 分割文本为行
  const lines = markdownText.split('\n')

  for (let line of lines) {
    line = line.trim()

    // 检测标题级别
    if (line.startsWith('# ')) {
      // 顶级标题，不作为模块处理
      currentLevel = 1
      currentModule = null
      isReadingDescription = false
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
      isReadingDescription = false
    } else if (line.startsWith('### ')) {
      // 三级标题，作为子模块
      if (currentLevel === 2 && currentModule) {
        const moduleName = line.substring(4).trim()
        const childModule = {
          name: moduleName,
          description: '',
          parentId: null,
          projectId: projectId.value,
          children: [],
          functions: []
        }
        currentModule.children.push(childModule)
      }
      currentLevel = 3
      isReadingDescription = false
    } else if (line.startsWith('- ')) {
      // 列表项作为功能点
      const functionName = line.substring(2).trim()
      if (functionName && currentModule) {
        currentFunction = {
          name: functionName,
          description: '',
          priority: 'medium'
        }
        if (!currentModule.functions) {
          currentModule.functions = []
        }
        currentModule.functions.push(currentFunction)
        isReadingDescription = false
      }
    } else if (line.startsWith('> ')) {
      // 引用块作为功能点描述
      if (currentFunction) {
        const descriptionLine = line.substring(2).trim()
        if (currentFunction.description) {
          // 如果已经有描述，添加换行
          currentFunction.description += '\n' + descriptionLine
        } else {
          currentFunction.description = descriptionLine
        }
        isReadingDescription = true
      }
    } else if (isReadingDescription && line) {
      // 继续读取描述内容（支持多行）
      if (currentFunction) {
        currentFunction.description += '\n' + line
      }
    }
  }

  return moduleTree
}

// 递归导入模块树
const importModuleTree = async (modules, parentId = null) => {
  // 检查是否是一级标题（项目名称）
  if (modules.length === 1 && modules[0].name && modules[0].name.startsWith('# ')) {
    // 提取项目名称（去掉 # 前缀）
    const importedProjectName = modules[0].name.substring(2).trim()

    // 如果导入的项目名称与当前项目名称不一致，则使用当前项目名称
    if (importedProjectName !== projectInfo.value.name) {
      console.log(
        `导入的项目名称 "${importedProjectName}" 与当前项目名称 "${projectInfo.value.name}" 不一致，使用当前项目名称`
      )
    }

    // 处理子模块
    if (modules[0].children && modules[0].children.length > 0) {
      await processModules(modules[0].children, parentId)
    }
    return
  }

  // 处理模块列表
  await processModules(modules, parentId)
}

// 处理模块列表
const processModules = async (modules, parentId = null) => {
  for (const module of modules) {
    // 检查模块级别
    if (module.name && module.name.startsWith('## ')) {
      // 一级模块
      module.name = module.name.substring(3).trim()
      module.level = 1
    } else if (module.name && module.name.startsWith('### ')) {
      // 三级模块
      module.name = module.name.substring(4).trim()
      module.level = 3
    } else {
      // 默认为二级模块
      module.level = 2
    }

    // 设置父模块ID
    module.parentId = parentId

    // 保存功能点列表
    const functions = module.functions || []
    delete module.functions // 移除functions字段，因为API不接受这个字段

    // 保存子模块
    const children = module.children || []
    delete module.children // 移除children字段，因为API不接受这个字段

    try {
      // 创建模块
      const response = await api.module.createModule({
        ...module,
        projectId: projectInfo.value.id
      })

      if (response.success) {
        const newModuleId = response.data.id

        // 为该模块创建功能点
        for (const func of functions) {
          // 检查功能点格式
          if (typeof func === 'string' && func.startsWith('- ')) {
            // 将功能点字符串转换为对象
            const functionName = func.substring(2).trim()
            await api.function.createFunction({
              name: functionName,
              moduleId: newModuleId,
              priority: 'medium'
            })
          } else if (typeof func === 'object') {
            // 直接使用功能点对象
            func.moduleId = newModuleId
            await api.function.createFunction(func)
          }
        }

        // 递归处理子模块
        if (children.length > 0) {
          await processModules(children, newModuleId)
        }
      } else {
        ElMessage.error(`导入模块 "${module.name}" 失败: ${response.message}`)
      }
    } catch (error) {
      console.error('导入模块错误:', error)
      ElMessage.error(`导入模块 "${module.name}" 时发生错误，没有项目ID！`)
    }
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
      return
    }

    // 使用FileReader读取Markdown文件内容
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const markdownContent = e.target.result
        const moduleTree = parseMarkdownModules(markdownContent)

        if (moduleTree.length === 0) {
          ElMessage.warning('未从Markdown中解析到有效的模块结构')
          importLoading.value = false
          return
        }

        // 开始导入
        await importModuleTree(moduleTree)

        ElMessage.success('模块导入成功')
        importDialogVisible.value = false

        // 刷新模块树
        fetchModuleTree()
      } catch (error) {
        console.error('解析Markdown错误:', error)
        ElMessage.error('解析Markdown时发生错误')
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

// 移除假数据，使用实际API调用
const exportModules = async () => {
  try {
    // 实际实现导出逻辑
    // 此处需要实现实际的导出API并整合
    ElMessage.warning('导出功能需要实现相应的API')
  } catch (error) {
    console.error('导出模块错误:', error)
    ElMessage.error('导出模块时发生错误')
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
  router.push(`/testcases?moduleId=${moduleId}`)
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 组件挂载时加载数据
onMounted(async () => {
  try {
    await Promise.all([fetchProjects(), fetchProjectInfo(), fetchModuleTree()])
    
    // 从路由参数中获取项目ID
    if (route.query.projectId) {
      selectedProjectId.value = route.query.projectId
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
  width: 100%;
  height: 100%;
}

.breadcrumb {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-name {
  font-weight: bold;
}

.project-dropdown {
  margin-left: 10px;
}

.el-dropdown-link {
  cursor: pointer;
  color: #409EFF;
  display: flex;
  align-items: center;
}

.module-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 180px);
}

.module-tree-container {
  width: 300px;
  min-width: 250px;
}

.module-tree {
  height: 100%;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.primary-action {
  margin-right: auto;
}

.secondary-actions {
  display: flex;
  gap: 0;
  flex-wrap: nowrap;
}

.secondary-actions .el-button + .el-button {
  margin-left: -1px; /* 负边距使按钮重叠边框 */
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding: 8px 0;
}

.node-actions {
  visibility: hidden;
}

.custom-tree-node:hover .node-actions {
  visibility: visible;
}

.module-content {
  flex: 1;
  overflow: hidden;
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

.module-tabs {
  height: calc(100% - 60px);
}

.info-section {
  padding: 10px 0;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.item-label {
  display: inline-block;
  width: auto;
  white-space: nowrap;
  margin-right: 5px;
  font-weight: bold;
  color: #606266;
}

.item-value {
  flex: 0 auto;
  display: inline-block;
}

.function-list,
.testcase-list {
  margin-top: 10px;
}

.function-actions,
.testcase-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.loading-container {
  width: 100%;
  padding: 20px;
}

.empty-tree,
.empty-functions {
  text-align: center;
  padding: 20px 0;
}

.import-container {
  padding: 20px 0;
}

/* 确保对话框内的表单项有合适的间距 */
.el-form-item {
  margin-bottom: 20px;
}

.no-project-warning {
  margin-bottom: 20px;
}

.project-selector {
  margin-top: 15px;
  margin-bottom: 15px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.project-selector-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}
</style>
