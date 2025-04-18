const TestCase = require('../models/TestCase');
const Module = require('../models/Module');
const Project = require('../models/Project');
const { sequelize } = require('../config/database');
const User = require('../models/User');
/**
 * @desc    获取所有测试用例
 * @route   GET /api/v1/testcases
 * @access  Private
 */
exports.getTestCases = async (req, res) => {
  try {
    // 构建查询条件
    const queryObj = { ...req.query };
    
    // 排除特殊查询参数
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    // 创建where条件
    const where = {};
    
    // 处理过滤条件
    Object.keys(queryObj).forEach(key => {
      where[key] = queryObj[key];
    });
    
    // 分页
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // 排序
    let order = [['createdAt', 'DESC']];
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      order = sortFields.map(field => {
        const direction = field.startsWith('-') ? 'DESC' : 'ASC';
        return [field.replace('-', ''), direction];
      });
    }
    
    console.log('查询条件:', where); // 调试信息
    
    // 执行查询，暂时移除include关联
    const { count, rows: testCases } = await TestCase.findAndCountAll({
      where,
      // 暂时注释掉include关联，避免潜在错误
      // include: [
      //   { model: Module, as: 'module', attributes: ['name', 'path'] },
      //   { model: User, as: 'creator', attributes: ['username'] },
      //   { model: User, as: 'executor', attributes: ['username'] }
      // ],
      offset,
      limit,
      order
    });
    
    res.json({
      success: true,
      count: testCases.length,
      total: count,
      pagination: {
        current: page,
        pages: Math.ceil(count / limit)
      },
      data: testCases
    });
  } catch (error) {
    console.error('获取测试用例错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取模块的测试用例
 * @route   GET /api/v1/testcases/module/:moduleId
 * @access  Private
 */
exports.getTestCasesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    // 验证模块存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 检查用户是否有权限查看此模块的测试用例
    const project = await Project.findByPk(module.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此模块'
      });
    }
    
    // 获取模块的测试用例
    const testCases = await TestCase.findAll({
      where: { moduleId },
      // 暂时注释掉include关联
      // include: [
      //   { model: User, as: 'creator', attributes: ['username'] },
      //   { model: User, as: 'executor', attributes: ['username'] }
      // ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: testCases.length,
      data: testCases
    });
  } catch (error) {
    console.error('获取模块测试用例错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取项目的测试用例
 * @route   GET /api/v1/testcases/project/:projectId
 * @access  Private
 */
exports.getTestCasesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // 验证项目存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限查看此项目的测试用例
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此项目'
      });
    }
    
    // 构建查询条件
    const queryObj = { ...req.query, projectId };
    
    // 排除特殊查询参数
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);
    
    // 创建where条件
    const where = { projectId };
    
    // 处理过滤条件
    Object.keys(queryObj).forEach(key => {
      if (!excludedFields.includes(key)) {
        where[key] = queryObj[key];
      }
    });
    
    // 分页
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // 排序
    let order = [['createdAt', 'DESC']];
    if (req.query.sort) {
      const sortFields = req.query.sort.split(',');
      order = sortFields.map(field => {
        const direction = field.startsWith('-') ? 'DESC' : 'ASC';
        return [field.replace('-', ''), direction];
      });
    }
    
    // 执行查询
    const { count, rows: testCases } = await TestCase.findAndCountAll({
      where,
      include: [
        { model: Module, as: 'module', attributes: ['name', 'path'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'executor', attributes: ['username'] }
      ],
      offset,
      limit,
      order
    });
    
    res.json({
      success: true,
      count: testCases.length,
      total: count,
      pagination: {
        current: page,
        pages: Math.ceil(count / limit)
      },
      data: testCases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    获取单个测试用例
 * @route   GET /api/v1/testcases/:id
 * @access  Private
 */
exports.getTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findByPk(req.params.id, {
      /* 暂时注释掉可能造成错误的关联
      include: [
        { model: Module, as: 'module', attributes: ['name', 'path'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'executor', attributes: ['username'] }
      ]
      */
    });
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '未找到测试用例'
      });
    }
    
    // 检查用户是否有权限查看此测试用例
    const project = await Project.findByPk(testCase.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权访问此测试用例'
      });
    }
    
    res.json({
      success: true,
      data: testCase
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    创建测试用例
 * @route   POST /api/v1/testcases
 * @access  Private
 */
exports.createTestCase = async (req, res) => {
  try {
    const { module: moduleId, projectId, title, priority, type, precondition, steps, expectedResult, isGenerated, aiProvider } = req.body;
    
    // 验证模块存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({
        success: false,
        message: '未找到模块'
      });
    }
    
    // 验证项目存在
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '未找到项目'
      });
    }
    
    // 检查用户是否有权限在此项目中创建测试用例
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权在此项目中创建测试用例'
      });
    }
    
    // 创建测试用例
    const testCase = await TestCase.create({
      title,
      moduleId: moduleId,
      projectId,
      priority,
      type,
      precondition,
      steps,
      expectedResult,
      isGenerated,
      aiProvider,
      creatorId: req.user.id
    });
    
    // 更新模块的测试用例计数
    await Module.update(
      { testCaseCount: sequelize.literal('testCaseCount + 1') },
      { where: { id: moduleId } }
    );
    
    // 更新项目的测试用例计数
    await Project.update(
      { testCaseCount: sequelize.literal('testCaseCount + 1') },
      { where: { id: projectId } }
    );
    
    // 查询包含关联数据的完整测试用例信息
    const createdTestCase = await TestCase.findByPk(testCase.id, {
      include: [
        { model: Module, as: 'module', attributes: ['name', 'path'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'executor', attributes: ['username'] }
      ]
    });
    
    res.status(201).json({
      success: true,
      data: createdTestCase
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    更新测试用例
 * @route   PUT /api/v1/testcases/:id
 * @access  Private
 */
exports.updateTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findByPk(req.params.id);
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '未找到测试用例'
      });
    }
    
    // 检查用户是否有权限更新此测试用例
    const project = await Project.findByPk(testCase.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权更新此测试用例'
      });
    }
    
    // 如果更改了模块，需要更新计数
    if (req.body.moduleId && req.body.moduleId !== testCase.moduleId) {
      // 减少原模块的计数
      await Module.update(
        { testCaseCount: sequelize.literal('testCaseCount - 1') },
        { where: { id: testCase.moduleId } }
      );
      
      // 增加新模块的计数
      await Module.update(
        { testCaseCount: sequelize.literal('testCaseCount + 1') },
        { where: { id: req.body.moduleId } }
      );
    }
    
    // 更新测试用例
    await testCase.update(req.body);
    const updatedTestCase = await TestCase.findByPk(req.params.id, {
      include: [
        { model: Module, as: 'module', attributes: ['name', 'path'] },
        { model: User, as: 'creator', attributes: ['username'] },
        { model: User, as: 'executor', attributes: ['username'] }
      ]
    });
    
    res.json({
      success: true,
      data: updatedTestCase
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    删除测试用例
 * @route   DELETE /api/v1/testcases/:id
 * @access  Private
 */
exports.deleteTestCase = async (req, res) => {
  try {
    const testCase = await TestCase.findByPk(req.params.id);
    
    if (!testCase) {
      return res.status(404).json({
        success: false,
        message: '未找到测试用例'
      });
    }
    
    // 检查用户是否有权限删除此测试用例
    const project = await Project.findByPk(testCase.projectId);
    if (
      project.creatorId !== req.user.id && 
      !(await project.hasMembers(req.user.id))
    ) {
      return res.status(403).json({
        success: false,
        message: '无权删除此测试用例'
      });
    }
    
    // 删除测试用例
    await testCase.destroy();
    
    // 更新项目的测试用例计数
    await Project.update(
      { testCaseCount: sequelize.literal('testCaseCount - 1') },
      { where: { id: testCase.projectId } }
    );
    
    // 更新模块的测试用例计数
    await Module.update(
      { testCaseCount: sequelize.literal('testCaseCount - 1') },
      { where: { id: testCase.moduleId } }
    );
    
    res.json({
      success: true,
      message: '测试用例已删除'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 