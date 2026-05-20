# AI 测试用例生成器 API 接口文档

**Base URL**: `http://your-server:14110/api/v1`

**认证方式**: Bearer Token（请求头添加 `Authorization: Bearer <token>`）

**权限说明**:
- 🔓 公开 - 无需认证
- 🔒 需认证 - 需登录后携带Token
- 👑 管理员 - 需管理员权限

---

## 一、用户接口 `/users`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| POST | `/users/login` | 🔓 公开 | 登录，返回token |
| POST | `/users/register` | 🔓 公开 | 注册新用户 |
| POST | `/users/create-admin` | 🔓 公开 | 创建管理员账号 |
| GET | `/users/profile` | 🔒 需认证 | 获取当前用户信息 |
| GET | `/users` | 👑 管理员 | 获取所有用户列表 |
| GET | `/users/:id` | 👑 管理员 | 获取单个用户 |
| PUT | `/users/:id` | 👑 管理员 | 更新用户 |
| DELETE | `/users/:id` | 👑 管理员 | 删除用户 |

**登录示例**:
```json
POST /users/login
Body: { "username": "admin", "password": "admin123" }
返回: { "success": true, "token": "jwt...", "data": { "id", "username", "role" } }
```

---

## 二、项目接口 `/projects`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/projects` | 🔒 需认证 | 获取项目列表 |
| GET | `/projects/templates` | 🔒 需认证 | 获取项目模板 |
| GET | `/projects/:id` | 🔒 需认证 | 获取单个项目 |
| POST | `/projects` | 🔒 需认证 | 创建项目 |
| PUT | `/projects/:id` | 🔒 需认证 | 更新项目 |
| DELETE | `/projects/:id` | 🔒 需认证 | 删除项目 |

---

## 三、模块接口 `/modules`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/modules?projectId=1` | 🔒 需认证 | 获取模块列表 |
| GET | `/modules/tree?projectId=1` | 🔒 需认证 | 获取模块树 |
| GET | `/modules/:id` | 🔒 需认证 | 获取单个模块 |
| GET | `/modules/:id/functions` | 🔒 需认证 | 获取模块的功能点 |
| POST | `/modules` | 🔒 需认证 | 创建模块 |
| POST | `/modules/recalculate-counts` | 🔒 需认证 | 重新计算测试用例数量 |
| PUT | `/modules/:id` | 🔒 需认证 | 更新模块 |
| DELETE | `/modules/:id` | 🔒 需认证 | 删除模块 |

---

## 四、功能点接口 `/functions`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/functions` | 🔒 需认证 | 获取功能点列表 |
| GET | `/functions/module/:moduleId` | 🔒 需认证 | 获取模块下的功能点 |
| GET | `/functions/:id` | 🔒 需认证 | 获取单个功能点 |
| POST | `/functions` | 🔒 需认证 | 创建功能点 |
| PUT | `/functions/:id` | 🔒 需认证 | 更新功能点 |
| DELETE | `/functions/:id` | 🔒 需认证 | 删除功能点 |

---

## 五、测试用例接口 `/testcases`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/testcases?moduleId=1&projectId=1` | 🔒 需认证 | 获取测试用例列表 |
| GET | `/testcases/module/:moduleId` | 🔒 需认证 | 获取模块下的测试用例 |
| GET | `/testcases/project/:projectId` | 🔒 需认证 | 获取项目下的测试用例 |
| GET | `/testcases/:id` | 🔒 需认证 | 获取单个测试用例 |
| POST | `/testcases` | 🔒 需认证 | 创建测试用例 |
| POST | `/testcases/batch` | 🔒 需认证 | 批量创建测试用例 |
| PUT | `/testcases/:id` | 🔒 需认证 | 更新测试用例 |
| DELETE | `/testcases/:id` | 🔒 需认证 | 删除测试用例 |
| DELETE | `/testcases/batch` | 🔒 需认证 | 批量删除测试用例 |

**测试用例字段**:
```json
{
  "title": "测试标题",
  "steps": "操作步骤",
  "expectedResult": "预期结果",
  "moduleId": 1,
  "projectId": 1,
  "priority": "high|medium|low",
  "status": "active|inactive"
}
```

---

## 六、AI接口 `/ai`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/ai/templates` | 🔒 需认证 | 获取提示词模板列表 |
| GET | `/ai/models?provider=gemini` | 🔒 需认证 | 获取可用模型列表 |
| POST | `/ai/generate` | 🔒 需认证 | AI生成测试用例 |
| POST | `/ai/save` | 🔒 需认证 | 保存AI生成的测试用例 |
| POST | `/ai/generate-modules` | 🔒 需认证 | AI生成模块结构 |

**生成测试用例示例**:
```json
POST /ai/generate
Body: {
  "promptContent": "功能描述内容",
  "moduleId": 1,
  "settings": { "model": "gemini-pro", "temperature": 0.7 }
}
```

---

## 七、统计接口 `/stats`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/stats` | 🔒 需认证 | 获取系统统计数据（项目数、模块数、测试用例数等） |

---

## 八、系统设置接口 `/settings`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/settings` | 🔒 需认证 | 获取系统设置（AI配置、通用配置） |
| PUT | `/settings` | 👑 管理员 | 更新系统设置 |
| GET | `/settings/environment` | 👑 管理员 | 获取环境变量配置 |
| PUT | `/settings/environment` | 👑 管理员 | 更新环境变量配置（保存到数据库） |

---

## 九、禅道集成接口 `/zentao`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/zentao/modules` | 🔓 公开 | 获取禅道模块列表（优先读取本地缓存） |
| POST | `/zentao/modules/refresh` | 🔓 公开 | 从禅道重新抓取并刷新模块数据 |

---

## 十、导入导出接口 `/import-export`

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/import-export/export` | 🔒 需认证 | 导出测试用例 |
| POST | `/import-export/import` | 🔒 需认证 | 导入测试用例 |

---

## 十一、公开只读接口 `/public`（无需认证）

> 专为第三方AI工具（如MCP）设计，无需登录即可直接访问数据。

**Base URL**: `http://your-server:14110/api/v1/public`

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/public/projects` | 获取所有项目 |
| GET | `/public/projects/:id` | 获取单个项目 |
| GET | `/public/modules?projectId=1` | 获取所有模块 |
| GET | `/public/modules/:id` | 获取单个模块 |
| GET | `/public/testcases?moduleId=1&projectId=1` | 获取测试用例列表 |
| GET | `/public/testcases/module/:moduleId` | 获取模块下的测试用例 |
| GET | `/public/testcases/project/:projectId` | 获取项目下的测试用例 |
| GET | `/public/testcases/:id` | 获取单个测试用例 |

**示例**:
```
GET http://your-server:14110/api/v1/public/projects
GET http://your-server:14110/api/v1/public/testcases/project/1
```
