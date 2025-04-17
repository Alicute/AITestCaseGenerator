<template>
  <main-layout>
    <div class="module-design">
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>模块设计</el-breadcrumb-item>
          <el-breadcrumb-item>系统测试项目</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="module-container">
        <!-- 左侧模块树 -->
        <div class="module-tree-container">
          <el-card class="module-tree">
            <div class="tree-header">
              <h3>功能模块</h3>
              <div class="tree-actions">
                <el-button size="small" @click="showImportDialog">导入</el-button>
                <el-button size="small" @click="exportModules">导出</el-button>
              </div>
            </div>

            <el-tree
              :data="moduleTree"
              :props="defaultProps"
              @node-click="handleNodeClick"
              node-key="id"
              :expand-on-click-node="false"
              :default-expanded-keys="[1, 2]"
              highlight-current
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
                      v-if="!data.disabled"
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
              <h2>{{ currentModule.label }}</h2>
              <div class="content-actions">
                <el-button type="primary" @click="editModule">编辑模块</el-button>
              </div>
            </div>

            <el-tabs v-model="activeTab" class="module-tabs">
              <el-tab-pane label="基本信息" name="info">
                <div class="info-section">
                  <div class="info-item">
                    <div class="item-label">模块名称:</div>
                    <div class="item-value">{{ currentModule.label }}</div>
                  </div>
                  <div class="info-item">
                    <div class="item-label">创建日期:</div>
                    <div class="item-value">{{ currentModule.createDate || '2023-07-15' }}</div>
                  </div>
                  <div class="info-item">
                    <div class="item-label">测试用例数量:</div>
                    <div class="item-value">{{ currentModule.testCaseCount || 5 }}</div>
                  </div>
                  <div class="info-item">
                    <div class="item-label">描述:</div>
                    <div class="item-value">{{ currentModule.description || '这是一个功能模块的描述内容，描述了该模块的主要功能和测试要点。' }}</div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="功能点" name="functions">
                <div class="function-list">
                  <el-table :data="moduleFunctions" style="width: 100%">
                    <el-table-column prop="name" label="功能点名称" />
                    <el-table-column prop="description" label="描述" />
                    <el-table-column prop="priority" label="优先级" width="120">
                      <template #default="scope">
                        <el-tag v-if="scope.row.priority === 'high'" type="danger">高</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'medium'" type="warning">中</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'low'" type="success">低</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="180">
                      <template #default="scope">
                        <el-button size="small" @click="editFunction(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteFunction(scope.row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>

                  <div class="function-actions">
                    <el-button type="primary" @click="showAddFunctionDialog">添加功能点</el-button>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="测试用例" name="testcases">
                <div class="testcase-list">
                  <el-empty v-if="moduleTestCases.length === 0" description="暂无测试用例，请先添加或生成测试用例"></el-empty>
                  <el-table v-else :data="moduleTestCases" style="width: 100%">
                    <el-table-column prop="title" label="测试用例名称" />
                    <el-table-column prop="priority" label="优先级" width="120">
                      <template #default="scope">
                        <el-tag v-if="scope.row.priority === 'high'" type="danger">高</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'medium'" type="warning">中</el-tag>
                        <el-tag v-else-if="scope.row.priority === 'low'" type="success">低</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="status" label="状态" width="120">
                      <template #default="scope">
                        <el-tag v-if="scope.row.status === 'passed'" type="success">通过</el-tag>
                        <el-tag v-else-if="scope.row.status === 'failed'" type="danger">失败</el-tag>
                        <el-tag v-else type="info">未执行</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220">
                      <template #default="scope">
                        <el-button size="small" @click="viewTestCase(scope.row)">查看</el-button>
                        <el-button size="small" type="primary" @click="editTestCase(scope.row)">编辑</el-button>
                        <el-button size="small" type="danger" @click="deleteTestCase(scope.row)">删除</el-button>
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
      <el-dialog v-model="addModuleDialogVisible" title="添加模块" width="500px">
        <el-form :model="newModule" label-width="120px">
          <el-form-item label="模块名称">
            <el-input v-model="newModule.name" placeholder="请输入模块名称" />
          </el-form-item>
          <el-form-item label="模块描述">
            <el-input v-model="newModule.description" type="textarea" placeholder="请输入模块描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addModuleDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addModule">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 添加功能点对话框 -->
      <el-dialog v-model="addFunctionDialogVisible" title="添加功能点" width="500px">
        <el-form :model="newFunction" label-width="120px">
          <el-form-item label="功能点名称">
            <el-input v-model="newFunction.name" placeholder="请输入功能点名称" />
          </el-form-item>
          <el-form-item label="功能描述">
            <el-input v-model="newFunction.description" type="textarea" placeholder="请输入功能描述" />
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
            <el-button type="primary" @click="addFunction">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 导入模块对话框 -->
      <el-dialog v-model="importDialogVisible" title="导入模块" width="500px">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 .json 格式的模块定义文件</div>
          </template>
        </el-upload>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="importDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="importModules">导入</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, UploadFilled } from '@element-plus/icons-vue'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = useRouter()

// 模块树数据
const moduleTree = ref([
  {
    id: 1,
    label: '系统部署',
    children: [
      {
        id: 5,
        label: '安装',
      },
      {
        id: 6,
        label: '配置',
        children: [
          {
            id: 10,
            label: '初始化配置'
          },
          {
            id: 11,
            label: '参数设置'
          }
        ]
      },
      {
        id: 7,
        label: '升级',
      },
      {
        id: 8,
        label: '维护',
      }
    ],
  },
  {
    id: 2,
    label: '采集图像',
    children: [
      {
        id: 9,
        label: '单张采集',
      },
      {
        id: 12,
        label: '批量采集',
      },
      {
        id: 13,
        label: '实时预览',
      }
    ],
  },
  {
    id: 3,
    label: '设备管理',
  },
  {
    id: 4,
    label: '图像编辑',
  }
])

// 模块功能点示例数据
const moduleFunctions = ref([
  {
    id: 1,
    name: '系统配置初始化',
    description: '在系统首次启动时进行基础配置和参数设置',
    priority: 'high'
  },
  {
    id: 2,
    name: '用户权限管理',
    description: '配置不同用户角色的权限',
    priority: 'medium'
  },
  {
    id: 3,
    name: '网络参数设置',
    description: '配置系统的网络连接参数',
    priority: 'medium'
  },
  {
    id: 4,
    name: '数据路径配置',
    description: '设置数据存储和读取的路径',
    priority: 'low'
  }
])

// 测试用例示例数据
const moduleTestCases = ref([
  {
    id: 1,
    title: '验证初始配置参数有效性',
    priority: 'high',
    status: 'passed'
  },
  {
    id: 2,
    title: '管理员权限分配测试',
    priority: 'high',
    status: 'failed'
  },
  {
    id: 3,
    title: '普通用户权限限制测试',
    priority: 'medium',
    status: 'waiting'
  }
])

// 树形控件配置
const defaultProps = {
  children: 'children',
  label: 'label',
}

// 状态变量
const currentModule = ref(null)
const activeTab = ref('info')
const addModuleDialogVisible = ref(false)
const addFunctionDialogVisible = ref(false)
const importDialogVisible = ref(false)
const currentParentNode = ref(null)

// 新模块表单
const newModule = ref({
  name: '',
  description: ''
})

// 新功能点表单
const newFunction = ref({
  name: '',
  description: '',
  priority: 'medium'
})

// 导入文件
const importFile = ref(null)

// 树节点点击处理
const handleNodeClick = (data) => {
  currentModule.value = data
}

// 添加子节点
const appendNode = (data) => {
  currentParentNode.value = data
  newModule.value = {
    name: '',
    description: ''
  }
  addModuleDialogVisible.value = true
}

// 添加模块
const addModule = () => {
  if (!newModule.value.name) {
    ElMessage.warning('请输入模块名称')
    return
  }

  // 生成新ID
  const generateId = () => {
    const flattenTree = (nodes) => {
      return nodes.reduce((acc, node) => {
        acc.push(node)
        if (node.children) {
          acc.push(...flattenTree(node.children))
        }
        return acc
      }, [])
    }
    
    const allNodes = flattenTree(moduleTree.value)
    return Math.max(...allNodes.map(node => node.id), 0) + 1
  }

  const newNode = {
    id: generateId(),
    label: newModule.value.name,
    description: newModule.value.description,
    children: []
  }

  if (currentParentNode.value) {
    if (!currentParentNode.value.children) {
      currentParentNode.value.children = []
    }
    currentParentNode.value.children.push(newNode)
  } else {
    moduleTree.value.push(newNode)
  }

  addModuleDialogVisible.value = false
  ElMessage.success('模块添加成功')
}

// 删除节点
const removeNode = (node, data) => {
  ElMessageBox.confirm(
    `确定要删除模块 "${data.label}" 吗？此操作不可撤销。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const parent = node.parent
      const children = parent.data.children || parent.data
      const index = children.findIndex(d => d.id === data.id)
      children.splice(index, 1)
      ElMessage.success('模块删除成功')
    })
    .catch(() => {
      // 用户取消了操作
    })
}

// 编辑当前模块
const editModule = () => {
  ElMessage.info('编辑模块功能待实现')
}

// 显示添加功能点对话框
const showAddFunctionDialog = () => {
  newFunction.value = {
    name: '',
    description: '',
    priority: 'medium'
  }
  addFunctionDialogVisible.value = true
}

// 添加功能点
const addFunction = () => {
  if (!newFunction.value.name) {
    ElMessage.warning('请输入功能点名称')
    return
  }

  // 生成新ID
  const newId = moduleFunctions.value.length > 0 
    ? Math.max(...moduleFunctions.value.map(f => f.id)) + 1 
    : 1

  moduleFunctions.value.push({
    id: newId,
    name: newFunction.value.name,
    description: newFunction.value.description,
    priority: newFunction.value.priority
  })

  addFunctionDialogVisible.value = false
  ElMessage.success('功能点添加成功')
}

// 编辑功能点
const editFunction = (functionData) => {
  ElMessage.info(`编辑功能点: ${functionData.name}`)
}

// 删除功能点
const deleteFunction = (functionData) => {
  ElMessageBox.confirm(
    `确定要删除功能点 "${functionData.name}" 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      const index = moduleFunctions.value.findIndex(f => f.id === functionData.id)
      if (index !== -1) {
        moduleFunctions.value.splice(index, 1)
        ElMessage.success('功能点删除成功')
      }
    })
    .catch(() => {
      // 用户取消了操作
    })
}

// 查看测试用例
const viewTestCase = (testCase) => {
  ElMessage.info(`查看测试用例: ${testCase.title}`)
}

// 编辑测试用例
const editTestCase = (testCase) => {
  ElMessage.info(`编辑测试用例: ${testCase.title}`)
}

// 删除测试用例
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
    .then(() => {
      const index = moduleTestCases.value.findIndex(tc => tc.id === testCase.id)
      if (index !== -1) {
        moduleTestCases.value.splice(index, 1)
        ElMessage.success('测试用例删除成功')
      }
    })
    .catch(() => {
      // 用户取消了操作
    })
}

// 导航到AI生成页面
const goToAIGenerate = () => {
  router.push('/ai-generate')
}

// 导航到测试用例页面
const goToTestCases = () => {
  router.push('/testcases')
}

// 显示导入对话框
const showImportDialog = () => {
  importDialogVisible.value = true
}

// 处理文件选择
const handleFileChange = (file) => {
  importFile.value = file
}

// 导入模块
const importModules = () => {
  if (importFile.value) {
    ElMessage.success('模块导入成功')
    importDialogVisible.value = false
  } else {
    ElMessage.warning('请先选择要导入的文件')
  }
}

// 导出模块
const exportModules = () => {
  ElMessage.success('模块导出成功，文件已保存到下载目录')
}
</script>

<style scoped>
.module-design {
  width: 100%;
}

.breadcrumb {
  margin-bottom: 20px;
}

.module-container {
  display: flex;
  gap: 20px;
}

.module-tree-container {
  width: 280px;
  flex-shrink: 0;
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

.tree-actions {
  display: flex;
  gap: 10px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-actions {
  display: none;
}

.custom-tree-node:hover .node-actions {
  display: flex;
  gap: 5px;
}

.module-content {
  flex: 1;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.module-tabs {
  margin-top: 20px;
}

.info-section {
  padding: 10px;
}

.info-item {
  display: flex;
  margin-bottom: 15px;
}

.item-label {
  width: 120px;
  font-weight: bold;
  color: #606266;
}

.item-value {
  flex: 1;
}

.function-actions,
.testcase-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>