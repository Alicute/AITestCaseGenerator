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
  moduleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  precondition: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  steps: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  expectedResult: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('P0', 'P1', 'P2', 'P3', 'P4'),
    defaultValue: 'P1'
  },
  status: {
    type: DataTypes.ENUM('waiting', 'running', 'passed', 'failed'),
    defaultValue: 'waiting'
  },
  type: {
    type: DataTypes.ENUM('functional', 'performance', 'security', 'ui', 'other'),
    defaultValue: 'functional'
  },
  maintainer: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  testType: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  estimatedHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  remainingHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  relatedItems: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followers: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['title', 'moduleId']
    }
  ]
});

module.exports = TestCase;