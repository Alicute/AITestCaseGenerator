import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSelectionStore = defineStore('selection', () => {
  const STORAGE_KEY = 'selection_store'
  const loadSavedSelection = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  const persistSelection = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedProjectId: selectedProjectId.value,
        selectedProjectName: selectedProjectName.value,
        selectedModuleId: selectedModuleId.value,
        selectedModuleName: selectedModuleName.value,
        selectedModulePath: selectedModulePath.value
      })
    )
  }

  const savedSelection = loadSavedSelection()

  // 状态
  const selectedProjectId = ref(savedSelection.selectedProjectId || null)
  const selectedProjectName = ref(savedSelection.selectedProjectName || '')
  const selectedModuleId = ref(savedSelection.selectedModuleId || null)
  const selectedModuleName = ref(savedSelection.selectedModuleName || '')
  const selectedModulePath = ref(savedSelection.selectedModulePath || [])

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
    
    const previousProjectId = selectedProjectId.value

    // 更新状态
    selectedProjectId.value = project.id
    selectedProjectName.value = project.name

    if (previousProjectId && previousProjectId !== project.id) {
      selectedModuleId.value = null
      selectedModuleName.value = ''
      selectedModulePath.value = []
    }
    persistSelection()

  }

  // 设置选中的模块
  function setSelectedModule(module) {
    // 如果传入无效的module，清除模块选择
    if (!module) {
      selectedModuleId.value = null
      selectedModuleName.value = ''
      selectedModulePath.value = []
      persistSelection()
      return
    }
    
    // 确保module是有效的模块对象
    if (!module.id || !module.name) {
      selectedModuleId.value = null
      selectedModuleName.value = ''
      selectedModulePath.value = []
      persistSelection()
      return
    }
    
    selectedModuleId.value = module.id
    selectedModuleName.value = module.name
    selectedModulePath.value = module.path || []
    persistSelection()
  }

  // 清除选择
  function clearSelection() {
    selectedProjectId.value = null
    selectedProjectName.value = ''
    selectedModuleId.value = null
    selectedModuleName.value = ''
    selectedModulePath.value = [] 
    persistSelection()
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
