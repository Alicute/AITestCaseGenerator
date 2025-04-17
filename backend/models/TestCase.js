const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TestCase = sequelize.define('TestCase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 200],
        msg: '测试用例标题长度应在1-200个字符之间'
      }
    }
  },
  priority: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium'
  },
  type: {
    type: DataTypes.ENUM('functional', 'performance', 'security', 'other'),
    defaultValue: 'functional'
  },
  status: {
    type: DataTypes.ENUM('passed', 'failed', 'waiting'),
    defaultValue: 'waiting'
  },
  precondition: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  steps: {
    type: DataTypes.JSON, // 存储步骤数组
    allowNull: false
  },
  expectedResult: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  actualResult: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  aiProvider: {
    type: DataTypes.STRING,
    allowNull: true
  },
  executionDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

module.exports = TestCase;