<template>
  <main-layout>
    <div class="settings-container">
      <h1 class="settings-title">系统设置</h1>
      
      <div class="settings-layout">
        <!-- 侧边菜单 -->
        <div class="settings-sidebar">
          <el-menu
            :default-active="activeMenu"
            class="settings-menu"
            @select="handleMenuChange"
          >
            <el-menu-item index="general">
              <el-icon><setting /></el-icon>
              <span>通用设置</span>
            </el-menu-item>
            <el-menu-item index="ai">
              <el-icon><connection /></el-icon>
              <span>AI设置</span>
            </el-menu-item>
            <el-menu-item index="users">
              <el-icon><user /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="templates">
              <el-icon><Document /></el-icon>
              <span>模板管理</span>
            </el-menu-item>
            <el-menu-item index="storage">
              <el-icon><folder /></el-icon>
              <span>数据存储</span>
            </el-menu-item>
            <el-menu-item index="advanced">
              <el-icon><magic-stick /></el-icon>
              <span>高级</span>
            </el-menu-item>
            <el-menu-item index="rules">
              <el-icon><Document /></el-icon>
              <span>规则</span>
            </el-menu-item>
          </el-menu>
        </div>
        
        <!-- 设置内容区域 -->
        <div class="settings-content">
          <!-- 通用设置 -->
          <div v-if="activeMenu === 'general'" class="setting-section">
            <h2 class="section-title">通用设置</h2>
            
            <el-form label-position="top" class="settings-form">
              <el-form-item label="界面主题">
                <el-switch
                  v-model="settings.darkMode"
                  active-text="暗色模式"
                  inactive-text="亮色模式"
                />
              </el-form-item>
              
              <el-form-item label="自动保存">
                <el-switch
                  v-model="settings.autoSave"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="默认视图">
                <el-select v-model="settings.defaultView" class="form-input">
                  <el-option
                    v-for="item in viewOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="语言">
                <el-select v-model="settings.language" class="form-input">
                  <el-option
                    v-for="item in languageOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="saveGeneralSettings">保存设置</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- AI设置 -->
          <div v-if="activeMenu === 'ai'" class="setting-section">
            <h2 class="section-title">AI设置</h2>
            
            <el-form label-position="top" class="settings-form">
              <el-form-item label="AI服务提供商">
                <el-select v-model="settings.provider" class="form-input">
                  <el-option
                    v-for="item in providerOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="API密钥">
                <el-input
                  v-model="settings.apiKey"
                  type="password"
                  show-password
                  placeholder="请输入API密钥"
                  class="form-input"
                />
              </el-form-item>
              
              <el-form-item label="默认模型">
                <el-select v-model="settings.model" class="form-input">
                  <el-option
                    v-for="item in modelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              
              <el-form-item label="Temperature (创造性)">
                <el-slider
                  v-model="settings.temperature"
                  :min="0"
                  :max="2"
                  :step="0.1"
                  show-stops
                />
                <div class="slider-description">
                  <span>精确</span>
                  <span>平衡</span>
                  <span>创造性</span>
                </div>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="saveAISettings">保存设置</el-button>
                <el-button @click="settings.apiKey = ''">清除API密钥</el-button>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- 用户管理 -->
          <div v-if="activeMenu === 'users'" class="setting-section">
            <h2 class="section-title">用户管理</h2>
            
            <div class="user-management-header">
              <el-button type="primary" @click="addUser">
                <el-icon><plus /></el-icon> 添加用户
              </el-button>
              
              <el-input
                v-model="searchQuery"
                placeholder="搜索用户"
                class="user-search"
                clearable
              >
                <template #prefix>
                  <el-icon><search /></el-icon>
                </template>
              </el-input>
            </div>
            
            <el-table
              :data="usersList"
              style="width: 100%"
              border
              stripe
              v-loading="userStore.loading"
            >
              <el-table-column prop="username" label="用户名" min-width="120" />
              <el-table-column prop="email" label="邮箱" min-width="180" />
              <el-table-column prop="role" label="角色" min-width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.role === 'admin' ? 'danger' : scope.row.role === 'editor' ? 'warning' : 'success'">
                    {{ formatRole(scope.row.role) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="lastLogin" label="最后登录时间" min-width="160">
                <template #default="scope">
                  {{ formatDate(scope.row.lastLogin) }}
                </template>
              </el-table-column>
              <el-table-column prop="active" label="状态" min-width="80">
                <template #default="scope">
                  <el-tag :type="scope.row.active ? 'success' : 'info'">
                    {{ scope.row.active ? '正常' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                  <el-button size="small" @click="editUser(scope.row)">
                    编辑
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    :disabled="!canDeleteUser(scope.row)"
                    @click="deleteUser(scope.row.id)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 用户添加/编辑对话框 -->
            <el-dialog
              v-model="dialogVisible"
              :title="userDialogTitle"
              width="500px"
              destroy-on-close
            >
              <el-form
                ref="userFormRef"
                :model="userForm"
                :rules="userFormRules"
                label-position="top"
              >
                <el-form-item label="用户名" prop="username">
                  <el-input v-model="userForm.username" />
                </el-form-item>
                
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="userForm.email" />
                </el-form-item>
                
                <el-form-item :label="userForm.id ? '密码（不修改请留空）' : '密码'" prop="password">
                  <el-input
                    v-model="userForm.password"
                    type="password"
                    show-password
                    :placeholder="userForm.id ? '不修改请留空' : '请输入密码'"
                  />
                </el-form-item>
                
                <el-form-item label="用户角色" prop="role">
                  <el-select v-model="userForm.role" class="form-input">
                    <el-option
                      v-for="item in roleOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                
                <el-form-item label="状态">
                  <el-switch
                    v-model="userForm.active"
                    active-text="启用"
                    inactive-text="禁用"
                  />
                </el-form-item>
              </el-form>
              
              <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button
                  type="primary"
                  @click="saveUser"
                  :loading="userFormLoading"
                >
                  确定
                </el-button>
              </template>
            </el-dialog>
          </div>
          
          <!-- 模板管理 -->
          <div v-if="activeMenu === 'templates'" class="setting-section">
            <h2 class="section-title">模板管理</h2>
            
            <div class="placeholder-content">
              <el-empty description="模板管理功能正在开发中" />
              <el-button type="primary" @click="saveTemplateSettings">保存设置</el-button>
            </div>
          </div>
          
          <!-- 数据存储 -->
          <div v-if="activeMenu === 'storage'" class="setting-section">
            <h2 class="section-title">数据存储</h2>
            
            <div class="placeholder-content">
              <el-empty description="数据存储功能正在开发中" />
              <el-button type="primary" @click="saveStorageSettings">保存设置</el-button>
            </div>
          </div>
          
          <!-- 高级设置 -->
          <div v-if="activeMenu === 'advanced'" class="setting-section">
            <h2 class="section-title">高级设置</h2>
            
            <div class="placeholder-content">
              <el-empty description="高级设置功能正在开发中" />
              <el-button type="primary" @click="saveAdvancedSettings">保存设置</el-button>
            </div>
          </div>
          <!-- 规则页面 -->
          <div v-if="activeMenu === 'rules'" class="setting-section">
            <div class="section-title" style="display:flex;align-items:center;gap:16px;">
              <span>规则</span>
              <el-button size="small" @click="copyRulesContent" type="primary">复制</el-button>
            </div>
            <div class="placeholder-content" style="width:100%;text-align:left;">
              <pre ref="rulesPreRef" style="white-space:pre-wrap;word-break:break-all;max-width:100%;background:#f8f8f8;padding:16px;border-radius:6px;overflow:auto;">
# 测试项目框架创建公约

为了确保生成功能清单的结构一致性和可读性，请遵循以下约定：

## 1. 项目名称
- 所有功能清单的文档应以一级标题 `#` 开头，后面跟随项目名称。
  
  示例：
  ```
  # 项目名称
  ```

## 2. 一级模块
- 每个一级模块应使用二级标题 `##` 表示，后面跟随模块名称。
  
  示例：
  ```
  ## 一级模块名称
  ```

## 3. 三级模块
- 每个二级模块应使用三级标题 `###` 表示，后面跟随子模块名称。
  
  示例：
  ```
  ### 三级模块名称
  ```

## 4. 功能点
- 在每个二级模块下，使用无序列表 `-` 列出该模块的功能点。每个功能点应简洁明了，描述该功能的核心内容。
  
  示例：
  ```
  - 功能点1
  - 功能点2
  ```
## 5. 功能点描述
- 在每个功能点下方使用> 列表标识功能点描述
- 若是在每个标题下方使用> 列表标识模块描述
## 6. 示例结构
以下是一个完整的示例结构，供参考：

```
# 项目名称

## 一级模块名称

### 二级模块名称
- 功能点1
- 功能点2

### 另一个二级模块名称
- 功能点3
- 功能点4
```



### 目标
- 让每个功能点描述具体、可落地、可理解、可追溯，便于产品、开发、测试等多角色理解和追踪。

### 核心原则
- **具体**：描述要明确，避免"支持XXX"或"可以YYY"这种泛泛表述。
- **可落地**：描述要能指导开发实现和测试验证。
- **可理解**：描述要让非专业人员也能明白功能的业务含义和边界。
- **可追溯**：描述要能与需求、设计、测试用例等环节一一对应。

### 描述结构建议
- 功能点名称：简明扼要
- 功能点描述：  
  - 主要目标/用途  
  - 典型场景/边界/限制  
  - 主要交互/反馈/数据要求  
  - （如有）权限/异常/批量/多端等补充

### 常用提示词/句式
- "用户可以……，系统应……"
- "当……时，系统应……"
- "支持……，并且……"
- "……操作需有……反馈"
- "……时需校验……"
- "……可通过……方式进行"
- "……结果可……"
- "……支持批量……"
- "……需二次确认/权限校验/异常处理"
- "……支持多种格式/多端/多角色/多场景"

### 示例
- 用户可以通过输入账号和密码登录系统，系统需校验账号有效性和密码正确性，登录失败时有明确提示。
- 文件可通过右键菜单进行重命名，重命名时需校验同目录下文件名唯一，操作结果有反馈。
- 图像处理面板可调节亮度、对比度、伽马值，调整结果实时预览，支持恢复默认。
- 用户可多选文件进行批量导出，导出过程有整体结果反馈，导出路径和文件名可自定义。




请大家在创建功能清单模块大纲时遵循以上公约，以确保文档的统一性和可维护性。谢谢大家的配合！
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main-layout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '../stores/user';
import MainLayout from '@/components/layout/MainLayout.vue';
import {
  Setting,
  Connection,
  User,
  Folder,
  MagicStick,
  Plus,
  Search,
  Document
} from '@element-plus/icons-vue';

// 定义状态变量
const activeMenu = ref('general');
const dialogVisible = ref(false);
const userFormLoading = ref(false);
const userStore = useUserStore();
const usersList = ref([]);
const userDialogTitle = ref('添加用户');
const searchQuery = ref('');
const rulesPreRef = ref(null);

// 用户表单数据
const userForm = reactive({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'user',
  active: true
});

// 用户表单校验规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名长度至少为3个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: false, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ]
};

// 角色选项
const roleOptions = [
  { label: '管理员', value: 'admin' },
  { label: '普通用户', value: 'user' },
  { label: '编辑者', value: 'editor' }
];

// 用户表单引用
const userFormRef = ref(null);

// 获取用户列表
const fetchUsers = async () => {
  try {
    const result = await userStore.getAllUsers();
    if (result.success) {
      usersList.value = result.data;
    } else {
      ElMessage.error('获取用户列表失败');
    }
  } catch (error) {
    console.error('获取用户列表错误', error);
    ElMessage.error('获取用户列表时发生错误');
  }
};

// 添加用户
const addUser = () => {
  resetUserForm();
  userDialogTitle.value = '添加用户';
  dialogVisible.value = true;
};

// 编辑用户
const editUser = (row) => {
  resetUserForm();
  userDialogTitle.value = '编辑用户';
  userForm.id = row.id;
  userForm.username = row.username;
  userForm.email = row.email;
  userForm.role = row.role;
  userForm.active = row.active;
  dialogVisible.value = true;
};

// 删除用户
const deleteUser = (id) => {
  ElMessageBox.confirm(
    '确定要删除此用户吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
  .then(async () => {
    try {
      const result = await userStore.deleteUser(id);
      if (result.success) {
        ElMessage.success('用户已删除');
        fetchUsers(); // 重新获取列表
      } else {
        ElMessage.error(result.message || '删除用户失败');
      }
    } catch (error) {
      ElMessage.error('删除用户时发生错误');
    }
  })
  .catch(() => {
    // 取消删除
  });
};

// 保存用户
const saveUser = async () => {
  if (!userFormRef.value) return;
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        userFormLoading.value = true;
        
        // 根据是否有ID来决定是添加还是更新
        let result;
        if (userForm.id) {
          // 编辑模式
          const updateData = {
            username: userForm.username,
            email: userForm.email,
            role: userForm.role,
            active: userForm.active
          };
          
          // 如果填写了密码才更新密码
          if (userForm.password) {
            updateData.password = userForm.password;
          }
          
          result = await userStore.updateUser(userForm.id, updateData);
        } else {
          // 添加模式
          result = await userStore.register({
            username: userForm.username,
            email: userForm.email,
            password: userForm.password,
            role: userForm.role,
            active: userForm.active
          });
        }
        
        if (result.success) {
          ElMessage.success(userForm.id ? '用户已更新' : '用户已添加');
          dialogVisible.value = false;
          fetchUsers(); // 重新获取列表
        } else {
          ElMessage.error(result.message || (userForm.id ? '更新用户失败' : '添加用户失败'));
        }
      } catch (error) {
        ElMessage.error(error.message || '操作失败');
      } finally {
        userFormLoading.value = false;
      }
    }
  });
};

// 重置用户表单
const resetUserForm = () => {
  userForm.id = null;
  userForm.username = '';
  userForm.email = '';
  userForm.password = '';
  userForm.role = 'user';
  userForm.active = true;
  
  // 如果表单实例存在，重置校验状态
  if (userFormRef.value) {
    userFormRef.value.resetFields();
  }
};

// 在组件挂载时获取用户列表
onMounted(() => {
  if (activeMenu.value === 'users') {
    fetchUsers();
  }
});

// 监听菜单切换
const handleMenuChange = (menu) => {
  activeMenu.value = menu;
  if (menu === 'users') {
    fetchUsers();
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

// 格式化角色
const formatRole = (role) => {
  switch (role) {
    case 'admin': return '管理员';
    case 'user': return '普通用户';
    case 'editor': return '编辑者';
    default: return role;
  }
};

// 是否可以删除用户
const canDeleteUser = (user) => {
  // 不能删除自己和管理员
  return user.id !== userStore.currentUser?.id && user.role !== 'admin';
};

// 其它设置项数据
const settings = reactive({
  darkMode: false,
  autoSave: true,
  defaultView: 'list',
  language: 'zh-CN',
  provider: 'openai',
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7
});

// 语言选项
const languageOptions = [
  { label: '简体中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
];

// 视图选项
const viewOptions = [
  { label: '列表视图', value: 'list' },
  { label: '卡片视图', value: 'card' },
  { label: '表格视图', value: 'table' }
];

// API供应商选项
const providerOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Azure OpenAI', value: 'azure' },
  { label: 'Anthropic Claude', value: 'anthropic' },
  { label: '百度文心一言', value: 'baidu' },
  { label: '讯飞星火', value: 'xfyun' }
];

// 模型选项 (根据供应商动态变化)
const modelOptions = computed(() => {
  switch (settings.provider) {
    case 'openai':
      return [
        { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
        { label: 'GPT-4', value: 'gpt-4' },
        { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' }
      ];
    case 'azure':
      return [
        { label: 'GPT-3.5 Turbo', value: 'gpt-35-turbo' },
        { label: 'GPT-4', value: 'gpt-4' }
      ];
    case 'anthropic':
      return [
        { label: 'Claude 2', value: 'claude-2' },
        { label: 'Claude Instant', value: 'claude-instant' }
      ];
    case 'baidu':
      return [
        { label: 'ERNIE-Bot-4', value: 'ernie-bot-4' },
        { label: 'ERNIE-Bot', value: 'ernie-bot' }
      ];
    case 'xfyun':
      return [
        { label: '星火大模型V2.0', value: 'spark-v2.0' },
        { label: '星火大模型V1.5', value: 'spark-v1.5' }
      ];
    default:
      return [];
  }
});

// 保存通用设置
const saveGeneralSettings = () => {
  ElMessage.success('通用设置已保存');
};

// 保存AI设置
const saveAISettings = () => {
  ElMessage.success('AI设置已保存');
};

// 保存模板设置
const saveTemplateSettings = () => {
  ElMessage.success('模板设置已保存');
};

// 保存数据存储设置
const saveStorageSettings = () => {
  ElMessage.success('数据存储设置已保存');
};

// 保存高级设置
const saveAdvancedSettings = () => {
  ElMessage.success('高级设置已保存');
};

const copyRulesContent = () => {
  if (rulesPreRef.value) {
    const text = rulesPreRef.value.innerText;
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('规则内容已复制到剪贴板');
    }).catch(() => {
      ElMessage.error('复制失败');
    });
  }
};
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.settings-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #409eff;
}

.settings-layout {
  display: flex;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.settings-sidebar {
  width: 200px;
  border-right: 1px solid #e6e6e6;
}

.settings-menu {
  height: 100%;
}

.settings-content {
  flex: 1;
  padding: 20px;
  min-height: 500px;
}

.section-title {
  font-size: 18px;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6e6e6;
}

.settings-form {
  max-width: 500px;
}

.form-input {
  width: 100%;
}

.slider-description {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
}

.user-management-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.user-search {
  width: 300px;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>