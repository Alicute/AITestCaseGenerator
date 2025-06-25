# 技术文档：AI 测试用例生成器

## 1. 前端架构

前端是一个基于 Vue.js 3 的单页应用程序 (SPA)，旨在提供一个响应式、模块化和可维护的用户界面。

### 1.1. 路由 (Vue Router)

路由系统使用 `vue-router`，配置文件为 `src/router/index.js`。

*   **路由模式**: 使用 `createWebHistory`，提供更清晰的 URL。
*   **路由守卫**: `router.beforeEach` 全局前置守卫用于实现认证和授权逻辑。
    *   **认证检查**: 检查路由元信息 `meta: { requiresAuth: true }`。如果需要认证但用户未登录 (通过 `userStore.isAuthenticated` 判断)，则重定向到 `/login`。
    *   **权限检查**: 检查路由元信息 `meta: { adminOnly: true }`。如果需要管理员权限但用户不是管理员 (通过 `userStore.isAdmin` 判断)，则重定向到首页 `/`。
    *   **自动登录**: 如果存在 Token 但 Pinia Store 中没有用户信息，会尝试调用 `userStore.getUserProfile()` 获取用户信息，实现持久化登录。
*   **代码分割**: 路由组件采用动态导入 (`() => import(...)`) 的方式实现懒加载，优化初始加载性能。

### 1.2. 状态管理 (Pinia)

项目使用 Pinia 进行全局状态管理，取代了传统的 Vuex（尽管 `package.json` 中仍有 Vuex 依赖）。

*   **`stores/user.js`**: 管理用户状态，包括用户信息 (`user`)、认证 Token (`token`)、加载状态 (`loading`) 和错误信息 (`error`)。
    *   **State**: `user`, `token` (从 `localStorage` 初始化)。
    *   **Getters**: `isAuthenticated`, `isAdmin` 等计算属性。
    *   **Actions**: 封装了所有与用户相关的 API 调用，如 `login`, `register`, `getUserProfile`, `logout` 等。登录成功后，Token 会被存储在 `localStorage` 中，并设置到 Axios 的默认请求头。
*   **`stores/selection.js`**: 管理用户在界面上的选择状态，例如当前选中的项目 (`selectedProjectId`) 和模块 (`selectedModuleId`)。这使得跨组件/页面的数据共享变得简单。

### 1.3. API 通信 (Axios)

API 请求层封装在 `src/api/index.js` 中。

*   **Axios 实例**: 创建了一个名为 `api` 的 Axios 实例，配置了 `baseURL` (`http://localhost:9090/api/v1`) 和 `timeout`。
*   **请求拦截器**: 在每个请求发送前，自动从 `localStorage` 读取 Token 并附加到 `Authorization` 请求头中 (`Bearer <token>`)。
*   **响应拦截器**: 简化了响应处理，直接返回 `response.data`，使业务代码能更直接地获取数据。
*   **模块化 API**: API 按资源 (project, module, user 等) 进行分组导出，结构清晰，易于管理和调用。

## 2. 后端架构

后端是一个基于 Node.js 和 Express 的 RESTful API 服务。

### 2.1. 应用入口 (`app.js`)

`app.js` 是后端应用的入口文件，负责：

*   **中间件加载**: 加载 `cors`, `express.json`, `morgan` 等核心中间件。
*   **路由注册**: 将所有 API 路由模块挂载到 `/api/v1` 路径下。
*   **数据库初始化**:
    *   调用 `testConnection` 测试数据库连通性。
    *   使用 `sequelize.sync()` 同步数据库模型到数据表。
    *   在应用首次启动时，检查并创建一个默认的管理员账户 (`admin`/`admin123`)。
*   **错误处理**: 一个集中的错误处理中间件，用于捕获和响应服务器内部错误。
*   **服务启动**: 初始化完成后，启动 Express 服务器。

### 2.2. 数据库 (Sequelize & MySQL)

*   **ORM**: 使用 Sequelize 操作 MySQL 数据库。
*   **模型定义**: 数据模型在 `backend/models/` 目录下单独定义 (如 `User.js`, `Project.js` 等)。
*   **关系映射**: 模型之间的关系 (一对多、多对多) 集中在 `backend/models/index.js` 文件中定义。这使得数据关系一目了然。
    *   **用户-项目**: 一对多 (创建者) 和 多对多 (项目成员)。
    *   **项目-模块**: 一对多。
    *   **模块-模块**: 自我引用的父子层级关系。
    *   **模块-功能点**: 一对多。
    *   **项目/模块-测试用例**: 一对多。

![数据库关系图](https://mermaid.ink/svg/eyJjb2RlIjoiZXJEaWFncmFtXG4gICAgICAgIFVTRVIgfXwuby0tfysoIFBST0pFQ1QgOiBcImNyZWF0b3JcIlxuICAgICAgICBVU0VSfHwub34tLWRvfHwgUFJPSkVDVCB8OiBcIm1lbWJlcnNcIlxuICAgICAgICBQUk9KRUNUfHwuby0tfysoIE1PRFVMRSA6IFwiY29udGFpbnNcIlxuICAgICAgICBQUk9KRUNUfHwuby0tfysoIFRFU1RfQ0FTRSAtLTogXCJjb250YWluc1wiXG4gICAgICAgIE1PRFVMRSB8fC5vLS18eyBNT0RVTEUgOiBcInBhcmVudC9jaGlsZHJlblwiXG4gICAgICAgIE1PRFVMRSB8fC5vLS18eyBGVU5DVElPTiA6IFwiY29udGFpbnNcIlxuICAgICAgICBNT0RVTEV8fC5vLS18eyBURVNUX0NBU0UgOiBcImNvbnRhaW5zXCJcbiAgICAgICAgVVNFUiB8fC5vLS18eyBURVNUX0NBU0UgOiBcImNyZWF0b3JcIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZX0)

### 2.3. 认证与授权 (`middlewares/auth.js`)

认证和授权通过自定义 Express 中间件实现。

*   **`protect` (认证)**:
    1.  从 `Authorization` 请求头中提取 JWT。
    2.  使用 `jwt.verify()` 和 `JWT_SECRET` 环境变量验证令牌的有效性。
    3.  如果验证通过，从数据库中查找对应的用户。
    4.  检查用户是否存在且状态为 `active`。
    5.  将完整的用户信息附加到 `req.user` 对象上，供后续中间件或控制器使用。
*   **`authorize` (授权)**:
    1.  一个高阶函数，接收一个角色列表 (`...roles`)作为参数。
    2.  它返回一个中间件，该中间件检查 `req.user.role` 是否在允许的角色列表内。
    3.  如果角色不匹配，返回 403 Forbidden 错误。
    4.  此中间件通常在路由定义中跟在 `protect` 之后使用，例如: `router.get('/users', protect, authorize('admin'), getAllUsers);`。 