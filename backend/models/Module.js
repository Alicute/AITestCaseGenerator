const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Module = sequelize.define('Module', {
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
        msg: '模块名称长度应在1-100个字符之间'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  path: {
    type: DataTypes.STRING,
    allowNull: true
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  functionPoints: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('functionPoints');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('functionPoints', value ? JSON.stringify(value) : null);
    }
  },
  testCaseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

module.exports = Module;