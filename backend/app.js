const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// 数据库配置
const { sequelize, testConnection } = require('./config/database');
const { User } = require('./models');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// API路由
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/modules', require('./routes/modules'));
app.use('/api/v1/functions', require('./routes/functions'));
app.use('/api/v1/testcases', require('./routes/testCaseRoutes'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/settings', require('./routes/settings'));
app.use('/api/v1/import-export', require('./routes/importExport'));
app.use('/api/v1/stats', require('./routes/stats'));

// 根路由
app.get('/', (req, res) => {
  res.json({ message: 'AI测试用例生成系统API服务运行中...' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
  next;
});

// 初始化数据库和创建默认管理员
const initializeDatabase = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 根据环境变量决定是否同步数据库
    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('数据库表同步完成');
    } else {
      await sequelize.sync();
      console.log('数据库连接成功');
    }

    // 创建默认管理员账户
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@example.com',
        role: 'admin',
        active: true
      });
      console.log('默认管理员账户创建成功');
      console.log('用户名: admin');
      console.log('密码: admin123');
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口: ${PORT}`);
    });
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

// 启动应用
initializeDatabase();

module.exports = app;