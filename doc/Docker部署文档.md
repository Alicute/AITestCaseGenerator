# Docker 部署文档

## 概述

本项目支持使用 Docker 进行后端服务部署，适用于已有MySQL和OpenResty的环境。

**部署架构**：
- **后端服务**：Node.js + Express (Docker容器)
- **数据库**：使用本地MySQL
- **前端**：部署到OpenResty

## 前置要求

- Docker (版本 20.10+)
- 本地MySQL服务
- OpenResty/Nginx服务

## 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd AITestCaseGenerator
```

### 2. 配置环境变量

编辑 `docker-compose.yml` 文件，修改以下环境变量：

**数据库配置**：
```yaml
DB_PASSWORD: your_mysql_password  # 替换为你的MySQL密码
DB_NAME: ai_testcase_generator    # 数据库名称
DB_USER: root                     # 数据库用户
```

**后端环境变量**：
```yaml
AI_API_KEY: your_api_key  # 替换为你的 AI API Key
JWT_SECRET: your_jwt_secret_key_change_this_in_production  # 替换为安全的 JWT 密钥
```

### 3. 创建数据库

在本地MySQL中创建数据库：
```sql
CREATE DATABASE ai_testcase_generator CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. 启动后端服务

```bash
# 构建并启动后端服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend
```

### 5. 部署前端

```bash
# 在项目根目录构建前端
npm run build

# 将 dist 目录复制到 OpenResty 的 web 目录
cp -r dist /path/to/openresty/web/
```

### 6. 配置OpenResty

参考项目根目录的 `openresty.conf` 配置文件，将其添加到你的OpenResty配置中。

主要配置项：
- 前端静态文件路径
- API反向代理到 `http://localhost:14110`

### 7. 访问应用

- **前端界面**：http://your-domain.com
- **后端 API**：http://your-server:14110
- **公开 API**：http://your-server:14110/api/v1/public

默认登录账号：
- 用户名：`admin`
- 密码：`admin123`

## 服务说明

### 后端服务 (backend)
- **端口**：14110
- **技术栈**：Node.js + Express
- **功能**：提供 API 服务
- **依赖**：本地 MySQL 数据库

## 常用命令

```bash
# 启动后端服务
docker-compose up -d

# 停止后端服务
docker-compose down

# 重启后端服务
docker-compose restart

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f backend

# 重新构建并启动
docker-compose up -d --build

# 进入后端容器
docker-compose exec backend sh
```

## 环境变量说明

### 数据库配置
- `DB_HOST`：数据库主机（使用 `host.docker.internal` 访问本地MySQL）
- `DB_PORT`：数据库端口（默认 3306）
- `DB_NAME`：数据库名称
- `DB_USER`：数据库用户名
- `DB_PASSWORD`：数据库密码
- `DB_SYNC`：是否同步数据库结构（生产环境建议设为 false）

### AI 配置
- `AI_PROVIDER`：AI 提供商（gemini 或 openai）
- `AI_API_KEY`：AI API 密钥
- `AI_API_URL`：AI API 地址
- `AI_MODEL`：AI 模型名称

### 其他配置
- `JWT_SECRET`：JWT 密钥（生产环境请修改）
- `JWT_EXPIRES_IN`：Token 过期时间
- `LOG_LEVEL`：日志级别（debug/info/error）

## 公开 API 接口

以下接口无需认证，可供第三方 AI 工具访问：

### 测试用例接口
- `GET /api/v1/public/testcases` - 获取所有测试用例
- `GET /api/v1/public/testcases/:id` - 获取单个测试用例
- `GET /api/v1/public/testcases/module/:moduleId` - 获取模块测试用例
- `GET /api/v1/public/testcases/project/:projectId` - 获取项目测试用例

### 模块接口
- `GET /api/v1/public/modules` - 获取所有模块
- `GET /api/v1/public/modules/:id` - 获取单个模块

### 项目接口
- `GET /api/v1/public/projects` - 获取所有项目
- `GET /api/v1/public/projects/:id` - 获取单个项目

## 故障排查

### 服务无法启动

1. 检查端口占用：
```bash
# 检查端口 14110 是否被占用
netstat -tuln | grep 14110
```

2. 查看服务日志：
```bash
docker-compose logs backend
```

### 数据库连接失败

1. 确认本地 MySQL 服务已启动：
```bash
systemctl status mysql
# 或者
service mysql status
```

2. 检查数据库连接：
```bash
mysql -u root -p -h localhost
```

3. 确认数据库已创建：
```sql
SHOW DATABASES LIKE 'ai_testcase_generator';
```

### 前端无法访问后端

1. 检查后端服务是否正常运行：
```bash
curl http://localhost:14110
```

2. 检查 OpenResty 配置是否正确
3. 查看后端日志：
```bash
docker-compose logs backend
```

## 生产环境部署建议

1. **修改默认密码**：
   - 修改数据库 root 密码
   - 修改应用数据库密码
   - 修改默认管理员密码

2. **安全配置**：
   - 使用强密码
   - 修改 JWT_SECRET
   - 启用 HTTPS（使用反向代理）

3. **数据备份**：
   - 定期备份数据库
   - 备份 Docker volumes

4. **资源限制**：
   - 在 docker-compose.yml 中添加资源限制
   - 监控服务资源使用情况

5. **日志管理**：
   - 配置日志轮转
   - 使用集中式日志管理

## 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build

# 清理旧镜像（可选）
docker image prune -f
```

## 卸载

```bash
# 停止并删除所有服务
docker-compose down

# 删除数据卷（会删除所有数据，谨慎操作）
docker-compose down -v

# 删除相关镜像
docker rmi ai-testcase-generator-backend ai-testcase-generator-frontend
```

## 技术支持

如遇到问题，请检查：
1. Docker 和 Docker Compose 版本是否符合要求
2. 端口是否被占用
3. 环境变量配置是否正确
4. 服务日志中的错误信息
