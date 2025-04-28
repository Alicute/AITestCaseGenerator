import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectionStore = defineStore('selection', () => {
  // 状态
  const selectedProjectId = ref(null)
  const selectedProjectName = ref('')
  const selectedModuleId = ref(null)
  const selectedModuleName = ref('')
  const selectedModulePath = ref([])

  // 设置选中的项目
  function setSelectedProject(project) {
    
    // 如果传入无效的project，清除选择
    if (!project) {
      clearSelection()
      return
    }
    
    // 确保project是有效的项目对象
    if (!project.id || !project.name) {
      clearSelection()
      return
    }
    
    // 更新状态
    selectedProjectId.value = project.id
    selectedProjectName.value = project.name

  }

  // 设置选中的模块
  function setSelectedModule(module) {
    // 如果传入无效的module，清除模块选择
    if (!module) {
      selectedModuleId.value = null
      selectedModuleName.value = ''
      selectedModulePath.value = []
      return
    }
    
    // 确保module是有效的模块对象
    if (!module.id || !module.name) {
      selectedModuleId.value = null
      selectedModuleName.value = ''
      selectedModulePath.value = []
      return
    }
    
    selectedModuleId.value = module.id
    selectedModuleName.value = module.name
    selectedModulePath.value = module.path || []
  }

  // 清除选择
  function clearSelection() {
    selectedProjectId.value = null
    selectedProjectName.value = ''
    selectedModuleId.value = null
    selectedModuleName.value = ''
    selectedModulePath.value = [] 
  }

  return {
    selectedProjectId,
    selectedProjectName,
    selectedModuleId,
    selectedModuleName,
    selectedModulePath,
    setSelectedProject,
    setSelectedModule,
    clearSelection
  }
})