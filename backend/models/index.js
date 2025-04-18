const User = require('./User');
const Project = require('./Project');
const Module = require('./Module');
const TestCase = require('./TestCase');
const Function = require('./Function');
const { sequelize } = require('../config/database');

// 项目和用户的关系
User.hasMany(Project, { foreignKey: 'creatorId', as: 'createdProjects' });
Project.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

// 项目成员关系（多对多）
const ProjectMember = sequelize.define('ProjectMember', {}, { timestamps: true });
User.belongsToMany(Project, { through: ProjectMember, as: 'projects' });
Project.belongsToMany(User, { through: ProjectMember, as: 'members' });

// 项目和模块的关系
Project.hasMany(Module, { foreignKey: 'projectId', as: 'modules' });
Module.belongsTo(Project, { foreignKey: 'projectId' });

// 模块的层级关系（自引用）
Module.hasMany(Module, { foreignKey: 'parentId', as: 'children' });
Module.belongsTo(Module, { foreignKey: 'parentId', as: 'parent' });

// 用户和模块的关系
User.hasMany(Module, { foreignKey: 'createdById', as: 'createdModules' });
Module.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// 模块和功能点的关系
Module.hasMany(Function, { foreignKey: 'moduleId', as: 'functions' });
Function.belongsTo(Module, { foreignKey: 'moduleId' });

// 模块和测试用例的关系
Module.hasMany(TestCase, { foreignKey: 'moduleId', as: 'testCases' });
TestCase.belongsTo(Module, { foreignKey: 'moduleId' });

// 项目和测试用例的关系
Project.hasMany(TestCase, { foreignKey: 'projectId', as: 'testCases' });
TestCase.belongsTo(Project, { foreignKey: 'projectId' });

// 用户和测试用例的关系
User.hasMany(TestCase, { foreignKey: 'creatorId', as: 'createdTestCases' });
TestCase.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(TestCase, { foreignKey: 'executorId', as: 'executedTestCases' });
TestCase.belongsTo(User, { foreignKey: 'executorId', as: 'executor' });

module.exports = {
  User,
  Project,
  Module,
  TestCase,
  Function,
  ProjectMember
};