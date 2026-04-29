<template>
  <main-layout>
    <div class="project-management">
      <div class="page-header">
        <h1>项目列表</h1>
        <el-button type="primary" @click="showCreateProjectDialog">+ 新建项目</el-button>
      </div>

      <el-card>
        <div v-if="loading" class="loading-container">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else>
          <el-empty v-if="projects.length === 0" description="暂无项目数据" />
          <el-table v-else :data="projects" style="width: 100%">
            <el-table-column prop="name" label="项目名称" />
            <el-table-column label="创建日期" width="180">
              <template #default="scope">
                {{ formatDate(scope.row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column prop="moduleCount" label="模块数量" width="120" align="center" />
            <el-table-column prop="testCaseCount" label="测试用例数" width="120" align="center" />
            <el-table-column label="操作" width="220">
              <template #default="scope">
                <el-button size="small" @click="openProject(scope.row)">打开</el-button>
                <el-button size="small" type="warning" @click="editProject(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="confirmDeleteProject(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- <h2 class="template-title">项目模板</h2>
      <div class="template-container">
        <div class="template-card" v-for="template in projectTemplates" :key="template.id" @click="useProjectTemplate(template)">
          <div class="template-icon">{{ template.icon }}</div>
          <div class="template-name">{{ template.name }}</div>
          <div class="template-desc">{{ template.description }}</div>
        </div>
      </div> -->

      <!-- 创建项目对话框 -->
      <el-dialog v-model="createProjectDialogVisible" title="创建新项目" width="500px">
        <el-form :model="newProject" label-width="120px">
          <el-form-item label="项目名称">
            <el-input v-model="newProject.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述">
            <el-input v-model="newProject.description" type="textarea" placeholder="请输入项目描述" />
          </el-form-item>
          <el-form-item label="使用模板">
            <el-select v-model="newProject.templateId" placeholder="选择项目模板">
              <el-option v-for="template in projectTemplates" :key="template.id" :label="template.name" :value="template.id" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="createProjectDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="createProject" :loading="submitting">创建</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 编辑项目对话框 -->
      <el-dialog v-model="editProjectDialogVisible" title="编辑项目" width="1000px">
        <el-form :model="editingProject" label-width="120px">
          <el-form-item label="项目名称">
            <el-input v-model="editingProject.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述">
  <el-input
    v-model="editingProject.description"
    type="textarea"
    placeholder="请输入项目描述"
    :rows="20" 
  />
</el-form-item>

        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editProjectDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveProjectEdit" :loading="submitting">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MainLayout from '@/components/layout/MainLayout.vue'
import { projectAPI } from '@/api'

const router = useRouter()

// 加载状态
const loading = ref(false)
const submitting = ref(false)

// 项目列表数据
const projects = ref([])

// 项目模板
const projectTemplates = ref([
  {
    id: 1,
    name: '常规测试项目',
    description: '基础功能测试模板',
    icon: '📋'
  },
  {
    id: 2,
    name: 'API测试项目',
    description: '接口测试专用模板',
    icon: '🌐'
  },
  {
    id: 3,
    name: 'UI测试项目',
    description: '界面测试专用模板',
    icon: '🖥️'
  },
  {
    id: 4,
    name: '性能测试项目',
    description: '性能测试专用模板',
    icon: '⚡'
  }
])

// 新建项目相关
const createProjectDialogVisible = ref(false)
const newProject = ref({
  name: '',
  description: '',
  templateId: ''
})

// 编辑项目相关
const editProjectDialogVisible = ref(false)
const editingProject = ref({})

// 获取项目列表
const fetchProjects = async () => {
  loading.value = true
  try {
    const data = await projectAPI.getProjects()
    if (data.success) {
      projects.value = data.data
    } else {
      ElMessage.error(data.message || '获取项目列表失败')
    }
  } catch (error) {
    console.error('获取项目列表错误:', error)
    ElMessage.error('获取项目列表时发生错误')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 显示创建项目对话框
const showCreateProjectDialog = () => {
  newProject.value = {
    name: '',
    description: '',
    templateId: ''
  }
  createProjectDialogVisible.value = true
}

// 创建项目
const createProject = async () => {
  if (!newProject.value.name) {
    ElMessage.warning('请输入项目名称')
    return
  }

  submitting.value = true
  try {
    const data = await projectAPI.createProject({
      name: newProject.value.name,
      description: newProject.value.description,
      templateId: newProject.value.templateId || null
    })
    
    if (data.success) {
      createProjectDialogVisible.value = false
      ElMessage.success('项目创建成功')
      fetchProjects() // 刷新项目列表
    } else {
      ElMessage.error(data.message || '创建项目失败')
    }
  } catch (error) {
    console.error('创建项目错误:', error)
    ElMessage.error('创建项目时发生错误')
  } finally {
    submitting.value = false
  }
}

// 打开项目
const openProject = (project) => {
  router.push(`/modules?projectId=${project.id}`)
}

// 编辑项目
const editProject = (project) => {
  editingProject.value = { ...project }
  editProjectDialogVisible.value = true
}

// 保存项目编辑
const saveProjectEdit = async () => {
  if (!editingProject.value.name) {
    ElMessage.warning('请输入项目名称')
    return
  }

  submitting.value = true
  try {
    const data = await projectAPI.updateProject(editingProject.value.id, {
      name: editingProject.value.name,
      description: editingProject.value.description
    })
    
    if (data.success) {
      editProjectDialogVisible.value = false
      ElMessage.success('项目更新成功')
      fetchProjects() // 刷新项目列表
    } else {
      ElMessage.error(data.message || '更新项目失败')
    }
  } catch (error) {
    console.error('更新项目错误:', error)
    ElMessage.error('更新项目时发生错误')
  } finally {
    submitting.value = false
  }
}

// 确认删除项目
const confirmDeleteProject = (project) => {
  ElMessageBox.confirm(
    `确定要删除项目 "${project.name}" 吗？此操作不可撤销。`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const data = await projectAPI.deleteProject(project.id)
        
        if (data.success) {
          ElMessage.success('项目删除成功')
          fetchProjects() // 刷新项目列表
        } else {
          ElMessage.error(data.message || '删除项目失败')
        }
      } catch (error) {
        console.error('删除项目错误:', error)
        ElMessage.error('删除项目时发生错误')
      }
    })
    .catch(() => {
      // 用户取消了操作
    })
}

// 使用项目模板
const useProjectTemplate = (template) => {
  newProject.value = {
    name: '',
    description: '',
    templateId: template.id
  }
  createProjectDialogVisible.value = true
}

// 组件挂载时获取项目列表
onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.project-management {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
}

.template-title {
  margin-top: 30px;
  font-size: 20px;
}

.template-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.template-card {
  border: 1px solid #e6e6e6;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.template-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
  border-color: #409eff;
}

.template-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.template-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.template-desc {
  color: #888;
  font-size: 14px;
}

.loading-container {
  padding: 20px;
}
</style>