<template>
  <main-layout>
    <div class="project-management">
      <div class="page-header">
        <h1>项目列表</h1>
        <el-button type="primary" @click="showCreateProjectDialog">+ 新建项目</el-button>
      </div>

      <el-card>
        <el-table :data="projects" style="width: 100%">
          <el-table-column prop="name" label="项目名称" />
          <el-table-column prop="createDate" label="创建日期" width="180" />
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
      </el-card>

      <h2 class="template-title">项目模板</h2>
      <div class="template-container">
        <div class="template-card" v-for="template in projectTemplates" :key="template.id" @click="useProjectTemplate(template)">
          <div class="template-icon">{{ template.icon }}</div>
          <div class="template-name">{{ template.name }}</div>
          <div class="template-desc">{{ template.description }}</div>
        </div>
      </div>

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
            <el-button type="primary" @click="createProject">创建</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 编辑项目对话框 -->
      <el-dialog v-model="editProjectDialogVisible" title="编辑项目" width="500px">
        <el-form :model="editingProject" label-width="120px">
          <el-form-item label="项目名称">
            <el-input v-model="editingProject.name" placeholder="请输入项目名称" />
          </el-form-item>
          <el-form-item label="项目描述">
            <el-input v-model="editingProject.description" type="textarea" placeholder="请输入项目描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="editProjectDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveProjectEdit">保存</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </main-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import MainLayout from '@/components/layout/MainLayout.vue'

const router = useRouter()

// 项目列表数据
const projects = ref([
  {
    id: 1,
    name: '系统测试项目',
    createDate: '2023-07-15',
    moduleCount: 5,
    testCaseCount: 24,
    description: '系统主要测试项目'
  },
  {
    id: 2,
    name: '网络模块测试',
    createDate: '2023-07-20',
    moduleCount: 3,
    testCaseCount: 12,
    description: '网络功能测试项目'
  },
  {
    id: 3,
    name: '安全测试项目',
    createDate: '2023-08-03',
    moduleCount: 4,
    testCaseCount: 18,
    description: '安全功能测试项目'
  }
])

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
const editingIndex = ref(-1)

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
const createProject = () => {
  if (!newProject.value.name) {
    ElMessage.warning('请输入项目名称')
    return
  }

  // 模拟添加项目到列表
  const now = new Date()
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  
  const newId = projects.value.length > 0 ? Math.max(...projects.value.map(p => p.id)) + 1 : 1
  
  projects.value.push({
    id: newId,
    name: newProject.value.name,
    description: newProject.value.description,
    createDate: dateStr,
    moduleCount: 0,
    testCaseCount: 0
  })
  
  createProjectDialogVisible.value = false
  ElMessage.success('项目创建成功')
}

// 打开项目
const openProject = (project) => {
  // 在实际应用中，这里可能会跳转到项目详情页
  ElMessage.info(`打开项目: ${project.name}`)
  // 为了简化演示，这里直接跳转到模块设计页面
  router.push('/modules')
}

// 编辑项目
const editProject = (project) => {
  editingProject.value = { ...project }
  editingIndex.value = projects.value.findIndex(p => p.id === project.id)
  editProjectDialogVisible.value = true
}

// 保存项目编辑
const saveProjectEdit = () => {
  if (!editingProject.value.name) {
    ElMessage.warning('请输入项目名称')
    return
  }

  if (editingIndex.value !== -1) {
    projects.value[editingIndex.value] = { ...editingProject.value }
    ElMessage.success('项目更新成功')
    editProjectDialogVisible.value = false
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
    .then(() => {
      // 从列表中移除项目
      const index = projects.value.findIndex(p => p.id === project.id)
      if (index !== -1) {
        projects.value.splice(index, 1)
        ElMessage.success('项目删除成功')
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

.template-title {
  margin-top: 30px;
  margin-bottom: 20px;
}

.template-container {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.template-card {
  width: 180px;
  height: 150px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.template-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.template-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.template-name {
  font-weight: bold;
  margin-bottom: 10px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
}
</style>