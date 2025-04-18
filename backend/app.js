const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// 数据库配置
const { sequelize, testConnection } = require('./config/database');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 连接数据库
testConnection();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// API路由
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/modules', require('./routes/modules'));
app.use('/api/v1/testcases', require('./routes/testcases'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/ai', require('./routes/ai'));
app.use('/api/v1/settings', require('./routes/settings'));
app.use('/api/v1/import-export', require('./routes/importExport'));
app.use('/api/v1/functions', require('./routes/functions'));

// 根路由
app.get('/', (req, res) => {
  res.json({ message: 'AI测试用例生成系统API服务运行中...' });
});

// 错误处理中间件
app.use((err, req, res, next) => {  // express需要4个参数，即使next不使用
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
  // 添加一个空操作以使用next参数
  next;
});

// 同步数据库模型
sequelize.sync({ force: false }) // 改为false，避免删除表
  .then(() => {
    console.log('数据库表同步完成');
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口: ${PORT}`);
    });
  })
  .catch(err => {
    console.error('数据库同步失败:', err);
  });

module.exports = app;