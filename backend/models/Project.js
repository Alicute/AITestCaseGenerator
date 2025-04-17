const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: {
        args: [1, 100],
        msg: '项目名称长度应在1-100个字符之间'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  templateId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  moduleCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  testCaseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

module.exports = Project;