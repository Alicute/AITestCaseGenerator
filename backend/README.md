# AI 测试用例生成器 - 后端文档

## 知识文档

### 1. 项目概述

该后端服务为 AI 测试用例生成器应用程序提供 API。它负责管理项目、模块、功能点、测试用例、用户、AI 交互和系统统计信息。该服务基于 Express.js 框架，使用 Sequelize ORM 进行数据库交互（主要使用 MySQL），并使用 JWT 进行身份验证。

### 2. 安装与设置

1. **克隆仓库:** 获取项目代码。
2. **安装依赖:** 进入 `backend` 目录并运行：
   ```bash
   npm install
   ```
3. **配置环境变量:**
   * 在 `backend` 目录下，复制 `.env.example` 文件（如果存在）或从头创建一个名为 `.env` 的文件。
   * 填写必要的配置值，特别是：
     * `PORT`: 服务器运行端口 (默认: 9090。
     * `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_DIALECT`: 数据库连接详情 (已配置为 MySQL)。
     * `DB_SYNC`: 初始时可设为 `true` 以便 Sequelize 模型同步数据库结构，之后在生产环境或为求稳定可设为 `false`。**请谨慎使用。**
     * `JWT_SECRET`: 用于签发 JSON Web Tokens 的强密钥。**请务必修改默认值。**
     * `JWT_EXPIRES_IN`: Token 有效期 (例如: `7d`)。
     * `OPENAI_API_KEY`, `CLAUDE_API_KEY`: AI 服务的 API 密钥 (如果使用)。
4. **初始化数据库:**
   * 确保你的 MySQL 服务器正在运行，并且 `.env` 文件中指定的数据库已存在。
   * 运行初始化脚本 (该脚本也会尝试创建一个默认管理员用户):
     ```bash
     npm run init-db
     # 或者直接运行: node scripts/init-db.js
     ```
   * *注意:* `init-db.js` 脚本可能会执行初始数据填充或设置。请查阅其具体内容。`app.js` 在启动时，如果 `DB_SYNC` 为 `true` 或数据库连接成功建立，也会尝试创建默认管理员 (`admin`/`admin123`)（如果尚不存在）。
5. **运行服务器:**
   * 开发模式 (带自动重载):
     ```bash
     npm run dev
     ```
   * 生产模式:
     ```bash
     npm start
     ```
   * 服务器现在应该在指定的 `PORT` 上运行。

### 3. 架构概览

* **框架:** Express.js
* **数据库:** MySQL (使用 Sequelize ORM)
* **身份验证:** JSON Web Tokens (JWT)
* **目录结构:** 遵循类似 Model-View-Controller (MVC) 的结构，但后端没有明确的视图层：
  * `config`: 数据库配置 (`database.js`)。
  * `controllers`: 处理请求逻辑，与模型交互，并发送响应。
  * `middlewares`: 包含中间件函数，特别是用于 JWT 验证的 `auth.js`。
  * `models`: 定义 Sequelize 模型 (数据库表结构和关系)。`index.js` 初始化 Sequelize 和模型关联。
  * `routes`: 定义 API 端点并将其映射到控制器函数。
  * `scripts`: 工具脚本 (例如: `init-db.js`, `drop-db.js`)。
  * `seeders`: 用于填充数据库初始数据的脚本 (例如: `createAdmin.js`)。
  * `utils`: 工具函数 (例如: `generateToken.js`)。
  * `app.js`: 应用程序主入口点，设置 Express、中间件、路由和数据库初始化。

### 4. 身份验证

* 身份验证使用 JWT 处理。
* 用户通常通过 `/api/v1/users/login` 端点登录，成功后会收到一个 JWT。
* 在后续对受保护端点（除登录/注册外的大多数端点）的请求中，必须将此 Token 作为 Bearer Token 包含在 `Authorization` 请求头中：`Authorization: Bearer <your_jwt_token>`。
* `middlewares/auth.js` 中间件会在受保护的路由上验证 Token。它从 Token 中提取用户 ID，并将用户对象附加到 `req` 对象上 (`req.user`)。

### 5. 数据库模型 (主要模型)

定义在 `models/` 目录下:

* **`User.js`**: 存储用户信息 (用户名, 邮箱, 密码哈希, 角色等)。
* **`Project.js`**: 代表一个项目 (名称, 描述)。
* **`Module.js`**: 代表一个软件模块或功能区域，可能是层级结构 (名称, 描述, `parentId`, `projectId`)。
* **`Function.js`**: 代表模块内的具体功能点 (名称, 描述, 优先级, `moduleId`)。
* **`TestCase.js`**: 存储测试用例详情 (标题, 步骤, 预期结果, 优先级, 状态, `moduleId`, `functionId` 等)。

*注意:* 模型间的关系 (例如 `Project` 有多个 `Module`, `Module` 有多个 `Function`, `Module` 有多个 `TestCase`) 可能在模型文件内部或 `models/index.js` 中定义。

### 6. 关键配置 (`.env`)

* `PORT`: 服务器端口。
* `NODE_ENV`: 环境 (`development`, `production`)。
* `DB_*`: 数据库连接参数。
* `DB_SYNC`: 控制 Sequelize 数据库同步。`true` 会尝试修改表结构以匹配模型 (谨慎使用)。
* `JWT_SECRET`: 对 JWT 安全至关重要。**必须修改并保密。**
* `JWT_EXPIRES_IN`: 定义 Token 有效期。
* `OPENAI_API_KEY`/`CLAUDE_API_KEY`: 与 AI 服务交互所需。
* `LOG_LEVEL`: 控制日志详细程度 (由 `app.js` 中配置的日志库如 Morgan 使用)。

---

## API 文档

**基础路径:** `/api/v1`

**身份验证:** 除非特别说明，大多数路由都需要在 `Authorization` 请求头中提供有效的 JWT Bearer Token。

---

### 用户 (`/users`)

* **`POST /users/register`**
  * **描述:** 注册新用户。
  * **认证:** 无需。
  * **请求体:** `{ username, email, password }`
  * **响应 (成功):** `{ id, username, email, role, createdAt, updatedAt }` (不返回密码)
  * **响应 (失败):** 标准错误格式 (例如: 400 验证错误, 500 服务器错误)。
* **`POST /users/login`**
  * **描述:** 用户登录认证并返回 JWT。
  * **认证:** 无需。
  * **请求体:** `{ username, password }` 或 `{ email, password }`
  * **响应 (成功):** `{ id, username, email, role, token }` (token 即 JWT)
  * **响应 (失败):** 401 无效凭证, 500 服务器错误。
* **`GET /users/profile`**
  * **描述:** 获取当前认证用户的个人资料。
  * **认证:** 需要。
  * **响应 (成功):** `{ id, username, email, role, active, createdAt, updatedAt }`
  * **响应 (失败):** 401 未认证, 500。
* **`PUT /users/profile`**
  * **描述:** 更新当前认证用户的个人资料。
  * **认证:** 需要。
  * **请求体:** `{ username?, email?, password? }` (提供需要更新的字段)
  * **响应 (成功):** 更新后的用户资料 `{ id, username, email, role, ... }`
  * **响应 (失败):** 400, 401, 500。
* **`GET /users`**
  * **描述:** 获取所有用户列表 (仅限管理员)。
  * **认证:** 需要 (控制器可能检查管理员角色)。
  * **响应 (成功):** `[ { id, username, email, role, active, ... }, ... ]`
  * **响应 (失败):** 401, 403 (禁止访问), 500。
* **`GET /users/:id`**
  * **描述:** 获取特定用户的详细信息 (仅限管理员)。
  * **认证:** 需要 (控制器可能检查管理员角色)。
  * **响应 (成功):** `{ id, username, email, role, active, ... }`
  * **响应 (失败):** 401, 403, 404 (未找到), 500。
* **`PUT /users/:id`**
  * **描述:** 更新特定用户信息 (仅限管理员)。
  * **认证:** 需要 (控制器可能检查管理员角色)。
  * **请求体:** `{ username?, email?, role?, active?, password? }`
  * **响应 (成功):** 更新后的用户对象。
  * **响应 (失败):** 400, 401, 403, 404, 500。
* **`DELETE /users/:id`**
  * **描述:** 删除特定用户 (仅限管理员)。
  * **认证:** 需要 (控制器可能检查管理员角色)。
  * **响应 (成功):** 成功消息 (例如: `{ message: 'User deleted' }`)。
  * **响应 (失败):** 401, 403, 404, 500。

---

### 项目 (`/projects`)

* **`POST /projects`**
  * **描述:** 创建新项目。
  * **认证:** 需要。
  * **请求体:** `{ name, description? }`
  * **响应 (成功):** 创建的项目对象 `{ id, name, description, createdAt, updatedAt }`。
  * **响应 (失败):** 400, 401, 500。
* **`GET /projects`**
  * **描述:** 获取用户可访问的所有项目列表。
  * **认证:** 需要。
  * **响应 (成功):** `[ { id, name, description, ... }, ... ]`
  * **响应 (失败):** 401, 500。
* **`GET /projects/:id`**
  * **描述:** 获取特定项目的详细信息。
  * **认证:** 需要。
  * **响应 (成功):** `{ id, name, description, ... }`
  * **响应 (失败):** 401, 404, 500。
* **`PUT /projects/:id`**
  * **描述:** 更新特定项目。
  * **认证:** 需要。
  * **请求体:** `{ name?, description? }`
  * **响应 (成功):** 更新后的项目对象。
  * **响应 (失败):** 400, 401, 404, 500。
* **`DELETE /projects/:id`**
  * **描述:** 删除特定项目 (及其关联的模块、功能、测试用例 - 需检查控制器逻辑)。
  * **认证:** 需要。
  * **响应 (成功):** 成功消息。
  * **响应 (失败):** 401, 404, 500。

---

### 模块 (`/modules`)

* **`POST /modules`**
  * **描述:** 创建新模块。
  * **认证:** 需要。
  * **请求体:** `{ name, description?, parentId?, projectId }`
  * **响应 (成功):** 创建的模块对象。
  * **响应 (失败):** 400, 401, 500。
* **`GET /modules`**
  * **描述:** 获取模块列表，通常按 `projectId` 过滤。
  * **认证:** 需要。
  * **查询参数:** `projectId` (必需)
  * **响应 (成功):** `[ { id, name, description, parentId, projectId, ... }, ... ]` (可能是扁平列表，树结构可能由前端构建或通过特定端点获取)。
  * **响应 (失败):** 400 (若 projectId 缺失), 401, 500。
* **`GET /modules/tree`**
  * **描述:** 获取特定项目下树状结构的模块。
  * **认证:** 需要。
  * **查询参数:** `projectId` (必需)
  * **响应 (成功):** 嵌套的模块数组 `[ { id, name, ..., children: [...] }, ... ]`。
  * **响应 (失败):** 400, 401, 500。
* **`GET /modules/:id`**
  * **描述:** 获取特定模块的详细信息。
  * **认证:** 需要。
  * **响应 (成功):** `{ id, name, description, parentId, projectId, ... }`。
  * **响应 (失败):** 401, 404, 500。
* **`PUT /modules/:id`**
  * **描述:** 更新特定模块。
  * **认证:** 需要。
  * **请求体:** `{ name?, description? }` (通常不允许修改 parentId 或 projectId)。
  * **响应 (成功):** 更新后的模块对象。
  * **响应 (失败):** 400, 401, 404, 500。
* **`DELETE /modules/:id`**
  * **描述:** 删除特定模块 (及其所有子模块、关联的功能点和测试用例 - 需检查控制器逻辑)。
  * **认证:** 需要。
  * **响应 (成功):** 成功消息。
  * **响应 (失败):** 401, 404, 500。
* **`GET /modules/:id/functions`**
  * **描述:** 获取特定模块下的所有功能点。
  * **认证:** 需要。
  * **响应 (成功):** 功能点数组 `[ { id, name, description, priority, ... }, ... ]`。
  * **响应 (失败):** 401, 404, 500。

---

### 功能点 (`/functions`)

* **`POST /functions`**
  * **描述:** 创建新功能点。
  * **认证:** 需要。
  * **请求体:** `{ name, description?, priority?, moduleId }`
  * **响应 (成功):** 创建的功能点对象。
  * **响应 (失败):** 400, 401, 500。
* **`GET /functions`**
  * **描述:** 获取功能点列表，通常按 `moduleId` 过滤。
  * **认证:** 需要。
  * **查询参数:** `moduleId` (必需)
  * **响应 (成功):** `[ { id, name, description, priority, moduleId, ... }, ... ]`。
  * **响应 (失败):** 400, 401, 500。
* **`GET /functions/:id`**
  * **描述:** 获取特定功能点的详细信息。
  * **认证:** 需要。
  * **响应 (成功):** 功能点对象。
  * **响应 (失败):** 401, 404, 500。
* **`PUT /functions/:id`**
  * **描述:** 更新特定功能点。
  * **认证:** 需要。
  * **请求体:** `{ name?, description?, priority? }`
  * **响应 (成功):** 更新后的功能点对象。
  * **响应 (失败):** 400, 401, 404, 500。
* **`DELETE /functions/:id`**
  * **描述:** 删除特定功能点。
  * **认证:** 需要。
  * **响应 (成功):** 成功消息。
  * **响应 (失败):** 401, 404, 500。

---

### 测试用例 (`/testcases`)

* **`POST /testcases`**
  * **描述:** 创建新测试用例。
  * **认证:** 需要。
  * **请求体:** `{ title, description?, steps?, expectedResult?, priority?, moduleId?, functionId?, ... }` (包含测试用例的所有字段)
  * **响应 (成功):** 创建的测试用例对象。
  * **响应 (失败):** 400, 401, 500。
* **`GET /testcases`**
  * **描述:** 获取测试用例列表，可按 `moduleId`, `functionId`, `priority`, `status` 等过滤。
  * **认证:** 需要。
  * **查询参数:** `moduleId?`, `functionId?`, `priority?`, `status?`, `page?`, `limit?`, `sortBy?`, `sortOrder?`
  * **响应 (成功):** `{ data: [...], total, page, limit }` (分页结果)。
  * **响应 (失败):** 400, 401, 500。
* **`GET /testcases/:id`**
  * **描述:** 获取特定测试用例的详细信息。
  * **认证:** 需要。
  * **响应 (成功):** 测试用例对象。
  * **响应 (失败):** 401, 404, 500。
* **`PUT /testcases/:id`**
  * **描述:** 更新特定测试用例。
  * **认证:** 需要。
  * **请求体:** 测试用例的可更新字段 `{ title?, steps?, ... }`。
  * **响应 (成功):** 更新后的测试用例对象。
  * **响应 (失败):** 400, 401, 404, 500。
* **`DELETE /testcases/:id`**
  * **描述:** 删除特定测试用例。
  * **认证:** 需要。
  * **响应 (成功):** 成功消息。
  * **响应 (失败):** 401, 404, 500。
* **`POST /testcases/batch`**
  * **描述:** 批量创建或更新测试用例 (需检查控制器实现细节)。
  * **认证:** 需要。
  * **请求体:** `[ { ...testCaseData1 }, { ...testCaseData2 } ]`。
  * **响应 (成功/失败):** 根据实现返回结果。
* **`DELETE /testcases/batch`**
  * **描述:** 批量删除测试用例。
  * **认证:** 需要。
  * **请求体:** `{ ids: [id1, id2, ...] }`。
  * **响应 (成功):** 成功消息或结果摘要。
  * **响应 (失败):** 400, 401, 500。

---

### AI 交互 (`/ai`)

* **`POST /ai/generate/testcases`**
  * **描述:** 请求 AI 根据提供的功能点或模块信息生成测试用例。
  * **认证:** 需要。
  * **请求体:** `{ moduleId?, functionId?, prompt?, model? }` (具体参数依赖控制器实现)。
  * **响应 (成功):** 生成的测试用例建议 `[ { title, steps, expectedResult, ... }, ... ]` 或任务 ID。
  * **响应 (失败):** 400, 401, 500, 或 AI 服务相关错误。
* **`POST /ai/generate/functions`**
  * **描述:** 请求 AI 根据模块信息生成功能点建议。
  * **认证:** 需要。
  * **请求体:** `{ moduleId, prompt?, model? }`。
  * **响应 (成功):** 生成的功能点建议 `[ { name, description, priority }, ... ]`。
  * **响应 (失败):** 400, 401, 500。
* **(其他可能的 AI 端点)**
  * 例如优化测试用例、代码生成等，需检查 `aiController.js` 和 `ai.js` 路由文件。

---

### 导入/导出 (`/import-export`)

* **`POST /import-export/import/modules`**
  * **描述:** 从文件（如 Markdown）导入模块和功能点结构。
  * **认证:** 需要。
  * **请求:** 通常是 `multipart/form-data`，包含文件和 `projectId`。
  * **响应 (成功):** 导入结果摘要。
  * **响应 (失败):** 400, 401, 500。
* **`GET /import-export/export/project/:projectId`**
  * **描述:** 导出指定项目的数据（格式可能为 JSON, CSV, Markdown 等）。
  * **认证:** 需要。
  * **响应 (成功):** 文件流或包含导出数据的文件 URL。
  * **响应 (失败):** 401, 404, 500。
* **(其他可能的导入/导出端点)**
  * 例如导出测试用例、导入测试用例等，需检查 `importExport.js` 路由和相关控制器。

---

### 统计 (`/stats`)

* **`GET /stats/overview`**
  * **描述:** 获取系统概览统计信息（项目数、模块数、用例总数、用户数等）。
  * **认证:** 需要。
  * **响应 (成功):** `{ projectCount, moduleCount, testCaseCount, functionCount, userCount, ... }`。
  * **响应 (失败):** 401, 500。
* **`GET /stats/project/:projectId`**
  * **描述:** 获取特定项目的统计信息（模块数、用例状态分布等）。
  * **认证:** 需要。
  * **响应 (成功):** `{ moduleCount, testCaseStats: { total, passed, failed, notRun }, ... }`。
  * **响应 (失败):** 401, 404, 500。
* **(其他可能的统计端点)**
  * 需检查 `statController.js` 和 `stats.js` 路由文件。

---

### 设置 (`/settings`)

* **(可能的设置端点)**
  * **描述:** 用于获取或更新系统级设置，例如 AI 模型配置、默认值等（通常仅限管理员）。
  * **认证:** 需要 (可能需要管理员权限)。
  * **示例:** `GET /settings`, `PUT /settings`
  * **响应/请求体:** 根据具体设置项而定。
  * 需检查 `settings.js` 路由和相关控制器。
