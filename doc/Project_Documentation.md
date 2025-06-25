# 项目文档：AI 测试用例生成器

## 1. 项目概述

`ai-testcase-generator` 是一个全栈 Web 应用程序，旨在利用 AI 辅助测试人员设计和管理软件测试用例。它提供了一个用户友好的界面来管理项目、模块和测试用例，并集成了 AI 功能以自动生成测试用例，从而提高测试效率和覆盖率。

项目采用前后端分离的架构：

*   **前端**: 基于 Vue.js 3 的单页面应用 (SPA)，负责用户交互和数据展示。
*   **后端**: 基于 Node.js 和 Express 的 RESTful API 服务，负责业务逻辑、数据存储和 AI 集成。

## 2. 技术栈

### 2.1. 前端

*   **框架**: [Vue.js 3](https://vuejs.org/)
*   **状态管理**: [Pinia](https://pinia.vuejs.org/) & [Vuex](https://vuex.vuejs.org/) (项目中同时存在，建议统一)
*   **路由**: [Vue Router 4](https://router.vuejs.org/)
*   **UI 组件库**: [Element Plus](https://element-plus.org/)
*   **HTTP 请求**: [Axios](https://axios-http.com/)
*   **构建工具**: [Vue CLI](https://cli.vuejs.org/)

### 2.2. 后端

*   **框架**: [Express.js](https://expressjs.com/)
*   **数据库**: [MySQL](https://www.mysql.com/) (通过 `mysql2` 驱动连接)
*   **ORM**: [Sequelize](https://sequelize.org/)
*   **认证**: [JSON Web Tokens (JWT)](https://jwt.io/)
*   **开发工具**: [Nodemon](https://nodemon.io/) (用于开发时热重载)

## 3. 项目结构

项目根目录包含前端应用和 `backend` 目录。

```
ai-testcase-generator/
├── backend/         # 后端 Node.js 应用
├── node_modules/    # 前端依赖
├── public/          # 静态资源
├── src/             # 前端应用源码
├── Prototype/       # HTML 原型文件
├── .gitignore
├── babel.config.js
├── package.json     # 前端 package.json
└── vue.config.js
```

### 3.1. 前端 (`src` 目录)

```
src/
├── api/             # API 请求封装
├── assets/          # 静态资源 (图片、样式)
├── components/      # 可复用 Vue 组件
├── router/          # 路由配置
├── services/        # 业务服务 (如导出)
├── stores/          # 状态管理 (Pinia/Vuex)
├── utils/           # 工具函数
├── views/           # 页面级 Vue 组件
├── App.vue          # 根组件
└── main.js          # 应用入口文件
```

### 3.2. 后端 (`backend` 目录)

```
backend/
├── config/          # 配置文件 (如数据库连接)
├── controllers/     # 控制器 (处理请求逻辑)
├── middlewares/     # 中间件 (如认证)
├── models/          # Sequelize 数据模型
├── routes/          # 路由定义
├── scripts/         # 数据库脚本
├── seeders/         # 数据填充脚本
├── .env             # 环境变量
└── app.js           # 应用主入口
```

## 4. 安装与启动

### 4.1. 前端

1.  **安装依赖**:
    ```bash
    npm install
    ```
    或
    ```bash
    yarn install
    ```

2.  **启动开发服务器**:
    ```bash
    npm run serve
    ```
    应用将运行在 `http://localhost:8080` (默认)。

3.  **构建生产版本**:
    ```bash
    npm run build
    ```

### 4.2. 后端

1.  进入后端目录:
    ```bash
    cd backend
    ```

2.  **安装依赖**:
    ```bash
    npm install
    ```

3.  **配置环境变量**:
    复制 `.env.example` (如果存在) 为 `.env` 文件，并根据你的环境配置数据库连接、JWT 密钥等信息。

4.  **初始化数据库**:
    ```bash
    npm run init-db
    ```
    该脚本会根据 `models` 定义创建数据库表。

5.  **启动开发服务器**:
    ```bash
    npm run dev
    ```
    API 服务器将运行在 `http://localhost:3000` (或其他配置的端口)。

6.  **启动生产服务器**:
    ```bash
    npm run start
    ``` 