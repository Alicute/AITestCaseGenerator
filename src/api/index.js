import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:9090/api/v1',
  timeout: 15000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    return Promise.reject(error)
  }
)
// 禅道模块 API
export const zentaoAPI = {
  getModules() {
    return api.get('/zentao/modules')
  },
  refreshModules() {
    return api.post('/zentao/modules/refresh')
  }
}

// 设置相关API
export const settingsAPI = {
  // 获取系统设置
  getSettings() {
    return api.get('/settings')
  },
  
  // 更新系统设置
  updateSettings(data) {
    return api.put('/settings', data)
  },
  
  // 获取环境变量设置
  getEnvironmentSettings() {
    return api.get('/settings/environment')
  },
  
  // 更新环境变量设置
  updateEnvironmentSettings(data) {
    return api.put('/settings/environment', data)
  }
}

// 项目相关API
export const projectAPI = {
  // 获取项目列表
  getProjects() {
    return api.get('/projects')
  },
  
  // 获取单个项目详情
  getProject(id) {
    return api.get(`/projects/${id}`)
  },
  
  // 创建项目
  createProject(data) {
    return api.post('/projects', data)
  },
  
  // 更新项目
  updateProject(id, data) {
    return api.put(`/projects/${id}`, data)
  },
  
  // 删除项目
  deleteProject(id) {
    return api.delete(`/projects/${id}`)
  }
}

// 模块相关API
export const moduleAPI = {
  // 获取模块列表
  getModules(projectId) {
    return api.get('/modules', { params: { projectId } })
  },
  
  // 获取模块树
  getModuleTree(projectId, timestamp) {
    const params = { projectId };
    // 如果提供了时间戳参数，添加到请求中，用于避免缓存
    if (timestamp) {
      params._t = timestamp;
    }
    return api.get('/modules/tree', { params })
  },
  
  // 获取单个模块详情
  getModule(id) {
    return api.get(`/modules/${id}`)
  },
  
  // 创建模块
  createModule(data) {
    return api.post('/modules', data)
  },
  
  // 更新模块
  updateModule(id, data) {
    return api.put(`/modules/${id}`, data)
  },
  
  // 删除模块
  deleteModule(id) {
    return api.delete(`/modules/${id}`)
  },
  
  // 获取模块的功能点列表
  getModuleFunctions(moduleId) {
    return api.get(`/modules/${moduleId}/functions`)
  }
}

// 功能点相关API
export const functionAPI = {
  // 获取模块的功能点列表
  getModuleFunctions(moduleId) {
    return api.get(`/functions/module/${moduleId}`)
  },

  // 创建功能点
  createFunction(data) {
    return api.post('/functions', data)
  },

  // 更新功能点
  updateFunction(id, data) {
    return api.put(`/functions/${id}`, data)
  },

  // 删除功能点
  deleteFunction(id) {
    return api.delete(`/functions/${id}`)
  }
}

// 测试用例相关API
export const testCaseAPI = {
  // 获取测试用例列表
  getTestCases(params) {
    return api.get('/testcases', { params })
  },
  
  // 获取单个测试用例详情
  getTestCase(id) {
    return api.get(`/testcases/${id}`)
  },
  
  // 创建测试用例
  createTestCase(data) {
    return api.post('/testcases', data)
  },
  
  // 批量创建测试用例
  batchCreateTestCases(data) {
    return api.post('/testcases/batch', data)
  },
  
  // 更新测试用例
  updateTestCase(id, data) {
    return api.put(`/testcases/${id}`, data)
  },
  
  // 删除测试用例
  deleteTestCase(id) {
    return api.delete(`/testcases/${id}`)
  },
  
  // 批量删除测试用例
  batchDeleteTestCases(data) {
    return api.delete('/testcases/batch', { data })
  }
}

// 用户相关API
export const userAPI = {
  // 登录
  login(credentials) {
    return api.post('/auth/login', credentials)
  },
  
  // 注册
  register(userData) {
    return api.post('/auth/register', userData)
  },
  
  // 获取用户信息
  getUserProfile() {
    return api.get('/users/profile')
  }
}

// 统计数据相关API
export const statAPI = {
  // 获取仪表盘统计数据
  getDashboardStats() {
    return api.get('/stats')
  }
}

export default {
  project: projectAPI,
  module: moduleAPI,
  function: functionAPI,
  testCase: testCaseAPI,
  user: userAPI,
  stat: statAPI,
  zentao: zentaoAPI,
  settings: settingsAPI
} 