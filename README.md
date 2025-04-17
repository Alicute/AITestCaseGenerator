# AI测试用例生成管理系统

一个基于Vue.js的测试用例管理系统，支持测试用例的导入、导出、查看和AI生成功能。

## 功能特点

- 📋 测试用例管理 - 集中管理所有项目的测试用例
- 🌲 模块化设计 - 按项目和功能模块组织测试用例
- 🤖 AI生成能力 - 通过AI智能生成高质量测试用例
- 📊 多视图支持 - 表格、脑图和JSON格式多种视图
- 📤 导入导出 - 支持多种格式的数据交换
- 🎨 可视化界面 - 友好的用户界面，操作简单直观

## 技术栈

- **前端框架**: Vue 3 + Vite
- **UI组件库**: Element Plus
- **状态管理**: Vue的响应式系统
- **路由管理**: Vue Router
- **Excel处理**: SheetJS (xlsx)
- **图表展示**: 集成多种可视化组件

## 快速开始

### 环境要求

- Node.js v16.0+
- npm v8.0+

### 安装

克隆项目并安装依赖：

```bash
# 克隆项目
git clone https://github.com/yourusername/ai-testcase-generator.git
cd ai-testcase-generator

# 安装依赖
npm install
```

### 开发

启动开发服务器：

```bash
npm run serve
```

访问 [http://localhost:8080](http://localhost:8080) 开始使用。

### 构建

构建生产版本：

```bash
npm run build
```

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 组件
│   ├── layout/      # 布局组件
│   ├── module/      # 模块相关组件
│   └── testcase/    # 测试用例组件
├── views/           # 页面视图
├── router/          # 路由配置
├── services/        # API服务
├── store/           # 状态管理
└── utils/           # 工具函数
```

## 核心功能

### 项目管理

创建、编辑和管理测试项目，为测试用例提供组织结构。

### 模块设计

通过树形结构管理功能模块和测试点，支持多种视图方式：

- **表格视图** - 以表格形式展示功能点
- **脑图视图** - 以思维导图形式可视化模块结构
- **JSON视图** - 直接编辑原始数据

### 测试用例管理

全面的测试用例管理功能：

- 查看和编辑测试用例
- 按模块、优先级等筛选
- 支持批量操作

### AI生成功能

利用先进的AI模型生成高质量测试用例：

- 基于功能点描述自动生成测试用例
- 提供多种生成模板
- 支持自定义提示词

### 导入导出

支持多种格式的数据交换：

- JSON格式导入导出
- Excel格式导出
- 与其他测试管理工具的集成

## 使用指南

### 创建项目

1. 点击"项目管理"菜单
2. 点击"新建项目"按钮
3. 填写项目信息并保存

### 设计功能模块

1. 进入"模块设计"页面
2. 使用左侧树形菜单管理模块
3. 在右侧添加和编辑功能点

### 生成测试用例

1. 进入"AI生成"页面
2. 选择需要生成测试用例的功能点
3. 调整生成参数和提示词
4. 点击"开始生成"

### 导出测试用例

1. 进入"导入导出"页面
2. 选择要导出的项目或模块
3. 选择导出格式
4. 点击"导出"按钮

## 贡献指南

欢迎贡献代码，提交问题或功能建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目主页：[GitHub](https://github.com/yourusername/ai-testcase-generator)
- 电子邮件：your.email@example.com

---

希望这个工具能够提高您的测试效率！如果您喜欢这个项目，别忘了给它一个⭐️。
