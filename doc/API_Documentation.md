# API 文档

本文档详细描述了 AI 测试用例生成器后端的 RESTful API。

**Base URL**: `/api/v1`

**认证**: 大多数端点需要通过 JWT 进行认证。在请求头中提供 `Authorization: Bearer <Your_JWT_Token>`。

---

## 1. 用户 (Users)

**路由**: `/users`

### `POST /users/register`

注册一个新用户。

*   **权限**: Public
*   **请求体**:
    ```json
    {
      "username": "testuser",
      "email": "test@example.com",
      "password": "password123",
      "role": "user" 
    }
    ```
*   **响应 (201 Created)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "username": "testuser",
        "email": "test@example.com",
        "role": "user",
        "active": true,
        "createdAt": "...",
        "token": "jwt.token.string"
      }
    }
    ```

### `POST /users/login`

用户登录并获取 JWT。

*   **权限**: Public
*   **请求体**:
    ```json
    {
      "username": "testuser",
      "password": "password123"
    }
    ```
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "username": "testuser",
        "email": "test@example.com",
        "role": "user",
        "token": "jwt.token.string"
      }
    }
    ```

### `GET /users/profile`

获取当前已登录用户的信息。

*   **权限**: Private (需要认证)
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "username": "testuser",
        "email": "test@example.com",
        "role": "user",
        "active": true,
        "lastLogin": "...",
        "createdAt": "..."
      }
    }
    ```

### `GET /users`

获取所有用户列表。

*   **权限**: Admin
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "count": 2,
      "data": [
        {
          "id": 1,
          "username": "admin",
          "email": "admin@example.com",
          "role": "admin"
        },
        {
          "id": 2,
          "username": "testuser",
          "email": "test@example.com",
          "role": "user"
        }
      ]
    }
    ```

### `PUT /users/:id`

更新指定用户信息。

*   **权限**: Admin
*   **请求体**:
    ```json
    {
      "email": "new.email@example.com",
      "role": "editor",
      "active": false
    }
    ```
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "username": "testuser",
        "email": "new.email@example.com",
        "role": "editor",
        "active": false
      }
    }
    ```

### `DELETE /users/:id`

删除指定用户。

*   **权限**: Admin
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "message": "用户已删除"
    }
    ```

---

## 2. 项目 (Projects)

**路由**: `/projects`
**权限**: 所有端点都需要认证。

### `GET /projects`

获取所有项目列表。

*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "count": 1,
      "data": [
        {
          "id": 1,
          "name": "我的第一个项目",
          "description": "项目描述",
          "testCaseCount": 15,
          "createdAt": "..."
        }
      ]
    }
    ```

### `POST /projects`

创建一个新项目。

*   **请求体**:
    ```json
    {
      "name": "新项目",
      "description": "这是一个新项目"
    }
    ```
*   **响应 (201 Created)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 2,
        "name": "新项目",
        "description": "这是一个新项目",
        "createdAt": "..."
      }
    }
    ```

### `GET /projects/:id`

获取单个项目的详细信息。

*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "name": "我的第一个项目",
        "description": "项目描述",
        "testCaseCount": 15,
        "createdAt": "..."
      }
    }
    ```

### `PUT /projects/:id`

更新指定项目。

*   **请求体**:
    ```json
    {
      "name": "更新后的项目名称"
    }
    ```
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "name": "更新后的项目名称",
        "description": "项目描述",
        "createdAt": "..."
      }
    }
    ```

### `DELETE /projects/:id`

删除指定项目及其所有相关数据 (模块、功能点、测试用例)。

*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "message": "项目已删除"
    }
    ```

---

## 3. 模块 (Modules)

**路由**: `/modules`
**权限**: 所有端点都需要认证。

### `GET /modules`

获取模块列表，可通过项目 ID 过滤。

*   **查询参数**: `projectId` (可选, e.g., `/modules?projectId=1`)
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "count": 2,
      "data": [
        { "id": 1, "name": "登录模块", "projectId": 1, ... },
        { "id": 2, "name": "用户管理", "projectId": 1, "parentId": 1, ... }
      ]
    }
    ```

### `GET /modules/tree`

获取指定项目的模块树结构。

*   **查询参数**: `projectId` (必需)
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "name": "登录模块",
          "children": [
            { "id": 2, "name": "SSO登录", ... }
          ]
        }
      ]
    }
    ```

### `POST /modules`

创建一个新模块。

*   **请求体**:
    ```json
    {
      "name": "支付模块",
      "projectId": 1,
      "parentId": null 
    }
    ```
*   **响应 (201 Created)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 3,
        "name": "支付模块",
        "projectId": 1,
        ...
      }
    }
    ```

### `GET /modules/:id`

获取单个模块的详细信息。

*   **响应 (200 OK)**: 返回模块对象。

### `PUT /modules/:id`

更新指定模块。

*   **请求体**: 模块的部分或全部字段。
*   **响应 (200 OK)**: 返回更新后的模块对象。

### `DELETE /modules/:id`

删除指定模块及其所有子模块和相关数据。

*   **响应 (200 OK)**:
    ```json
    { "success": true, "message": "模块已删除" }
    ```

---

## 4. 功能点 (Functions)

**路由**: `/functions`
**权限**: 所有端点都需要认证。

### `POST /functions`

为指定模块创建一个新功能点。

*   **请求体**:
    ```json
    {
      "name": "创建订单",
      "description": "用户下单的功能",
      "priority": "high",
      "moduleId": 3
    }
    ```
*   **响应 (201 Created)**: 返回新创建的功能点对象。

### `GET /functions/module/:moduleId`

获取指定模块下的所有功能点。

*   **响应 (200 OK)**: 返回功能点对象数组。

### `PUT /functions/:id`

更新指定功能点。

*   **请求体**: 功能点的部分或全部字段。
*   **响应 (200 OK)**: 返回更新后的功能点对象。

### `DELETE /functions/:id`

删除指定功能点。

*   **响应 (200 OK)**:
    ```json
    { "success": true, "data": { "id": 1 } }
    ```

---

## 5. 测试用例 (Test Cases)

**路由**: `/testcases`
**权限**: 所有端点都需要认证。

### `GET /testcases`

获取测试用例列表，支持分页和过滤。

*   **查询参数**:
    *   `projectId` (可选): 按项目ID过滤
    *   `moduleId` (可选): 按模块ID过滤
    *   `page` (可选, 默认1): 页码
    *   `limit` (可选, 默认10): 每页数量
    *   `search` (可选): 按标题、步骤、预期结果进行模糊搜索
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": [ ... ], // 测试用例数组
      "total": 50,
      "page": 1,
      "limit": 10
    }
    ```

### `POST /testcases`

创建一个新测试用例。

*   **请求体**: 包含测试用例所有字段的对象。
*   **响应 (201 Created)**: 返回新创建的测试用例对象。

### `POST /testcases/batch`

批量创建测试用例。

*   **请求体**:
    ```json
    {
      "testCases": [
        { "title": "用例1", ... },
        { "title": "用例2", ... }
      ]
    }
    ```
*   **响应 (201 Created)**: 返回成功创建的测试用例数组。

### `DELETE /testcases/batch`

批量删除测试用例。

*   **请求体**:
    ```json
    {
      "ids": [1, 2, 5]
    }
    ```
*   **响应 (200 OK)**:
    ```json
    { "success": true, "message": "2个测试用例已删除" }
    ```

### `GET /testcases/:id`

获取单个测试用例的详细信息。

*   **响应 (200 OK)**: 返回测试用例对象。

### `PUT /testcases/:id`

更新指定测试用例。

*   **请求体**: 测试用例的部分或全部字段。
*   **响应 (200 OK)**: 返回更新后的测试用例对象。

### `DELETE /testcases/:id`

删除指定测试用例。

*   **响应 (200 OK)**:
    ```json
    { "success": true, "message": "测试用例已删除" }
    ```

---

## 6. AI 生成 (AI)

**路由**: `/ai`
**权限**: 所有端点都需要认证。

### `POST /ai/generate`

根据模块和提示词，请求 AI 生成测试用例内容。

*   **请求体**:
    ```json
    {
      "moduleId": 3,
      "promptContent": "为支付模块生成边界测试用例...",
      "provider": "openai",
      "model": "gpt-3.5-turbo"
    }
    ```
*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "content": "AI生成的测试用例文本...",
        "moduleId": 3,
        ...
      }
    }
    ```

### `POST /ai/save`

将在 AI 生成界面解析后的测试用例批量保存到数据库。

*   **请求体**:
    ```json
    {
      "moduleId": 3,
      "projectId": 1,
      "testCases": [
        { "title": "AI用例1", "steps": "...", ... },
        { "title": "AI用例2", "steps": "...", ... }
      ]
    }
    ```
*   **响应 (201 Created)**: 返回成功创建的测试用例数组。

### `GET /ai/templates`

获取可用的提示词模板。

*   **响应 (200 OK)**: 返回模板对象数组。

### `GET /ai/models`

获取指定 AI 提供商可用的模型列表。

*   **查询参数**: `provider` (可选, e.g., `openai`, `claude`)
*   **响应 (200 OK)**: 返回模型对象数组。

---

## 7. 导入/导出 (Import/Export)

**路由**: `/import-export`
**权限**: 所有端点都需要认证。

### `GET /import-export/export`

导出测试用例 (当前为模拟接口)。

*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "message": "导出成功",
      "data": { "url": "/downloads/export_123456.xlsx" }
    }
    ```

### `POST /import-export/import`

导入测试用例 (当前为模拟接口)。

*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "message": "导入成功",
      "data": { "imported": 10, "skipped": 2 }
    }
    ```

---

## 8. 设置 (Settings)

**路由**: `/settings`
**权限**: Admin

### `GET /settings`

获取系统设置 (当前为模拟接口)。

*   **响应 (200 OK)**: 返回设置对象。

### `PUT /settings`

更新系统设置 (当前为模拟接口)。

*   **响应 (200 OK)**: 返回更新后的设置对象。

---

## 9. 统计 (Stats)

**路由**: `/stats`
**权限**: 需要认证。

### `GET /stats`

获取仪表盘的统计数据和最近活动。

*   **响应 (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "stats": {
          "projects": 5,
          "modules": 20,
          "testcases": 150
        },
        "recentActivities": [
          { "date": "...", "type": "创建项目", "description": "..." }
        ]
      }
    }
    ``` 