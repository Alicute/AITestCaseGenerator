const { Sequelize } = require('sequelize');

// 从环境变量中获取数据库配置
const DB_NAME = process.env.DB_NAME || 'ai_testcase_generator';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 3306;
const DB_DIALECT = process.env.DB_DIALECT || 'mysql';

// 创建Sequelize实例
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // 避免日志太多
  logging: process.env.NODE_ENV === 'development'
});

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功.');
  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1); // 如果连接失败，终止应用
  }
};

module.exports = { sequelize, testConnection }; 