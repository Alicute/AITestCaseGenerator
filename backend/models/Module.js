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
  functionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  testCaseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true // 自动添加createdAt和updatedAt字段
});

// 添加模型关联
Module.associate = function(models) {
  // 模块与项目的关联
  Module.belongsTo(models.Project, {
    foreignKey: 'projectId',
    as: 'project',
    onDelete: 'CASCADE'
  });

  // 模块与创建者的关联
  Module.belongsTo(models.User, {
    foreignKey: 'createdById',
    as: 'creator'
  });

  // 模块与子模块的自关联
  Module.belongsTo(Module, {
    foreignKey: 'parentId',
    as: 'parent'
  });

  Module.hasMany(Module, {
    foreignKey: 'parentId',
    as: 'children'
  });

  // 模块与测试用例的关联
  Module.hasMany(models.TestCase, {
    foreignKey: 'moduleId',
    as: 'testCases'
  });

  // 模块与功能点的关联 - 只有当Function模型存在时才建立关联
  if (models.Function) {
    Module.hasMany(models.Function, {
      foreignKey: 'moduleId',
      as: 'functions'
    });
  }
};

module.exports = Module;