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
    selectedProjectId.value = project.id
    selectedProjectName.value = project.name
  }

  // 设置选中的模块
  function setSelectedModule(module) {
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